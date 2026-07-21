export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  status: 'active' | 'completed' | 'cancelled';
  enrolledAt: string;
  completedAt?: string;
  progress: number; // 0-100
  lastAccessedAt: string;
  paymentStatus: 'pending' | 'paid' | 'free';
  paymentAmount?: number;
  paymentId?: string;
  certificateIssued: boolean;
  certificateUrl?: string;
}

export interface CreateEnrollmentDTO {
  userId: string;
  courseId: string;
  paymentStatus?: 'pending' | 'paid' | 'free';
  paymentAmount?: number;
  paymentId?: string;
}

export interface UpdateProgressDTO {
  userId: string;
  courseId: string;
  lessonId: string;
  completed: boolean;
  progress?: number;
}

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  completedAt?: string;
  timeSpent?: number; // seconds
}

export interface CourseProgress {
  userId: string;
  courseId: string;
  lessons: Record<string, LessonProgress>;
  overallProgress: number; // 0-100
  lastUpdated: string;
  startedAt: string;
  completedAt?: string;
  isCompleted: boolean;
}

export interface EnrollmentStats {
  totalEnrolled: number;
  totalCompleted: number;
  totalProgress: number;
  recentlyActive: number;
}
