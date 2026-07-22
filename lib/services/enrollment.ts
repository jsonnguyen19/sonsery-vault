import { adminDb } from '@/lib/firebase-admin';
import type { Enrollment, CreateEnrollmentDTO, CourseProgress, LessonProgress } from '@/lib/types/enrollment';
import type { Course } from '@/lib/types/course';
import { notificationServer } from './notification.server';


export class EnrollmentService {
  private static COLLECTION = 'enrollments';
  private static PROGRESS_COLLECTION = 'courseProgress';

  static async enrollUser(dto: CreateEnrollmentDTO): Promise<Enrollment> {
    const db = adminDb;
    const enrollmentId = `${dto.userId}_${dto.courseId}`;
    const enrollmentRef = db.collection(this.COLLECTION).doc(enrollmentId);
    const courseRef = db.collection('courses').doc(dto.courseId);

    return await db.runTransaction(async (transaction) => {
      const enrollmentDoc = await transaction.get(enrollmentRef);
      if (enrollmentDoc.exists) {
        throw new Error('Already enrolled in this course');
      }

      const courseDoc = await transaction.get(courseRef);
      if (!courseDoc.exists) {
        throw new Error('Course not found');
      }

      const courseData = courseDoc.data() as Course;
      if (courseData.status !== 'published') {
        throw new Error('Course is not published');
      }

      const isFree = !courseData.price || courseData.price === 0;
      const paymentStatus = dto.paymentStatus || (isFree ? 'free' : 'pending');

      const now = new Date().toISOString();
      const enrollment: Omit<Enrollment, 'id'> = {
        userId: dto.userId,
        courseId: dto.courseId,
        status: 'active',
        enrolledAt: now,
        progress: 0,
        lastAccessedAt: now,
        paymentStatus,
        paymentAmount: dto.paymentAmount || courseData.price || 0,
        certificateIssued: false,
      };

      // Only add paymentId if it exists
      if (dto.paymentId) {
        (enrollment as any).paymentId = dto.paymentId;
      }

      transaction.set(enrollmentRef, enrollment);

      const progressRef = db.collection(this.PROGRESS_COLLECTION).doc(enrollmentId);
      const initialProgress: CourseProgress = {
        userId: dto.userId,
        courseId: dto.courseId,
        lessons: {},
        overallProgress: 0,
        lastUpdated: now,
        startedAt: now,
        isCompleted: false,
      };

      transaction.set(progressRef, initialProgress);

      // Notification will be handled by Cloud Function onEnrollmentCreate

      return { id: enrollmentId, ...enrollment } as Enrollment;
    });
  }

  static async updateLessonProgress(
    userId: string,
    courseId: string,
    lessonId: string,
    completed: boolean,
    timeSpent?: number
  ): Promise<CourseProgress> {
    const db = adminDb;
    const enrollmentId = `${userId}_${courseId}`;
    const progressRef = db.collection(this.PROGRESS_COLLECTION).doc(enrollmentId);
    const enrollmentRef = db.collection(this.COLLECTION).doc(enrollmentId);
    const courseRef = db.collection('courses').doc(courseId);

    return await db.runTransaction(async (transaction) => {
      const enrollmentDoc = await transaction.get(enrollmentRef);
      if (!enrollmentDoc.exists) {
        throw new Error('User not enrolled in this course');
      }

      const courseDoc = await transaction.get(courseRef);
      if (!courseDoc.exists) {
        throw new Error('Course not found');
      }

      const courseData = courseDoc.data() as Course;
      const totalLessons = courseData.lessons?.length || 0;

      if (totalLessons === 0) {
        throw new Error('Course has no lessons');
      }

      const progressDoc = await transaction.get(progressRef);
      let progress: CourseProgress;

      if (!progressDoc.exists) {
        const now = new Date().toISOString();
        progress = {
          userId,
          courseId,
          lessons: {},
          overallProgress: 0,
          lastUpdated: now,
          startedAt: now,
          isCompleted: false,
        };
      } else {
        progress = progressDoc.data() as CourseProgress;
      }

      const now = new Date().toISOString();
      const lessonProgress: LessonProgress = {
        lessonId,
        completed,
        completedAt: completed ? now : undefined,
        timeSpent: timeSpent || 0,
      };

      progress.lessons[lessonId] = lessonProgress;
      progress.lastUpdated = now;

      const completedLessons = Object.values(progress.lessons).filter((l) => l.completed).length;
      progress.overallProgress = Math.round((completedLessons / totalLessons) * 100);

      if (completedLessons === totalLessons && totalLessons > 0) {
        progress.isCompleted = true;
        progress.completedAt = now;

        transaction.update(enrollmentRef, {
          status: 'completed',
          completedAt: now,
          progress: 100,
          lastAccessedAt: now,
        });

        setTimeout(() => {
          notificationServer.sendLessonCompletionNotification(
            userId,
            courseData.title,
            'all lessons',
            100
          ).catch(console.error);
        }, 0);
      } else {
        transaction.update(enrollmentRef, {
          progress: progress.overallProgress,
          lastAccessedAt: now,
          status: 'active',
        });

        if (completed) {
          const lesson = courseData.lessons?.find((l) => l.id === lessonId);
          if (lesson) {
            setTimeout(() => {
              notificationServer.sendLessonCompletionNotification(
                userId,
                courseData.title,
                lesson.title,
                progress.overallProgress
              ).catch(console.error);
            }, 0);
          }
        }
      }

      transaction.set(progressRef, progress);
      return progress;
    });
  }

  static async getEnrollment(userId: string, courseId: string): Promise<Enrollment | null> {
    const enrollmentId = `${userId}_${courseId}`;
    const doc = await adminDb.collection(this.COLLECTION).doc(enrollmentId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Enrollment;
  }

  static async getUserEnrollments(userId: string): Promise<Enrollment[]> {
    // Simplified query without orderBy to avoid composite index requirement
    const snapshot = await adminDb
      .collection(this.COLLECTION)
      .where('userId', '==', userId)
      .get();
    
    const enrollments = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Enrollment[];
    
    // Sort in memory instead of using orderBy
    return enrollments.sort((a, b) => 
      new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime()
    );
  }

  static async getCourseProgress(userId: string, courseId: string): Promise<CourseProgress | null> {
    const enrollmentId = `${userId}_${courseId}`;
    const doc = await adminDb.collection(this.PROGRESS_COLLECTION).doc(enrollmentId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as CourseProgress;
  }

  static async getAllUserProgress(userId: string): Promise<CourseProgress[]> {
    const snapshot = await adminDb
      .collection(this.PROGRESS_COLLECTION)
      .where('userId', '==', userId)
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as CourseProgress[];
  }

  static async getEnrollmentStats(userId: string): Promise<{
    total: number;
    completed: number;
    inProgress: number;
    overallProgress: number;
  }> {
    const enrollments = await this.getUserEnrollments(userId);
    const total = enrollments.length;
    const completed = enrollments.filter((e) => e.status === 'completed').length;
    const inProgress = enrollments.filter((e) => e.status === 'active').length;
    const totalProgress = enrollments.reduce((sum, e) => sum + e.progress, 0);
    const overallProgress = total > 0 ? Math.round(totalProgress / total) : 0;
    return { total, completed, inProgress, overallProgress };
  }

  static async cancelEnrollment(userId: string, courseId: string): Promise<void> {
    const enrollmentId = `${userId}_${courseId}`;
    const enrollmentRef = adminDb.collection(this.COLLECTION).doc(enrollmentId);
    const progressRef = adminDb.collection(this.PROGRESS_COLLECTION).doc(enrollmentId);

    await adminDb.runTransaction(async (transaction) => {
      const enrollmentDoc = await transaction.get(enrollmentRef);
      if (!enrollmentDoc.exists) {
        throw new Error('Enrollment not found');
      }
      transaction.update(enrollmentRef, {
        status: 'cancelled',
        lastAccessedAt: new Date().toISOString(),
      });
      transaction.delete(progressRef);
    });
  }

  static async hasLessonAccess(userId: string, courseId: string, lessonId: string): Promise<boolean> {
    const enrollment = await this.getEnrollment(userId, courseId);
    if (!enrollment) {
      const courseDoc = await adminDb.collection('courses').doc(courseId).get();
      if (!courseDoc.exists) return false;
      const courseData = courseDoc.data() as Course;
      const lesson = courseData.lessons?.find((l) => l.id === lessonId);
      return lesson?.isFreePreview || false;
    }
    return enrollment.status === 'active' || enrollment.status === 'completed';
  }
}
