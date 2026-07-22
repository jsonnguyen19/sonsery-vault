import { adminDb } from "@/lib/firebase-admin";
import { EnrollmentService } from "@/lib/services/enrollment";
import { getCurrentUser } from "@/lib/auth/session";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import CoursePlayer from "@/components/ui/CoursePlayer";
import type { Course } from "@/lib/types/course";
import type { CourseProgress } from "@/lib/types/enrollment";

async function getCourseAndProgress(courseId: string, userId: string) {
  const courseDoc = await adminDb.collection("courses").doc(courseId).get();
  if (!courseDoc.exists) return { course: null, progress: null };

  const course = { id: courseDoc.id, ...courseDoc.data() } as Course;

  const progress = await EnrollmentService.getCourseProgress(userId, courseId);

  return { course, progress };
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CourseLearnPage({ params }: PageProps) {
  const { id: courseId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { course, progress } = await getCourseAndProgress(courseId, user.uid);

  if (!course) {
    notFound();
  }

  // Check if user is enrolled
  const enrollment = await EnrollmentService.getEnrollment(user.uid, courseId);
  if (
    !enrollment ||
    (enrollment.status !== "active" && enrollment.status !== "completed")
  ) {
    redirect(`/courses/${course.slug}`);
  }

  const totalLessons = course.lessons?.length || 0;
  const completedLessons = progress
    ? Object.values(progress.lessons).filter((l) => l.completed).length
    : 0;

  // Check if course is completed
  const isCourseCompleted = enrollment.status === "completed";

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link
              href="/dashboard/courses"
              className="text-sm text-gray-400 hover:text-white transition inline-block mb-2"
            >
              ← Back to Courses
            </Link>
            <h1 className="text-2xl font-bold text-white">{course.title}</h1>
            <p className="text-sm text-gray-400">
              {completedLessons} of {totalLessons} lessons completed
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Progress</div>
            <div className="text-2xl font-bold text-white">
              {progress?.overallProgress || 0}%
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-700 rounded-full h-2.5 mb-8">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progress?.overallProgress || 0}%` }}
          />
        </div>

        {/* Lessons grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Lessons</h2>
              {course.lessons && course.lessons.length > 0 ? (
                <div className="space-y-3">
                  {course.lessons.map((lesson, index) => {
                    const isCompleted =
                      progress?.lessons[lesson.id || `lesson-${index}`]
                        ?.completed || false;
                    // When enrolled, all lessons are unlocked (no sequential locking)
                    const isLocked = false;

                    return (
                      <CoursePlayer
                        key={lesson.id || index}
                        courseId={courseId}
                        lesson={lesson}
                        index={index}
                        isCompleted={isCompleted}
                        isLocked={isLocked}
                        totalLessons={totalLessons}
                        currentProgress={progress?.overallProgress || 0}
                      />
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">
                  No lessons available
                </p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Course Info */}
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Course Info
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <p className="text-sm text-white font-medium">
                    {isCourseCompleted ? "✅ Completed" : "In Progress"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Enrolled</p>
                  <p className="text-sm text-white">
                    {new Date(enrollment.enrolledAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Progress</p>
                  <p className="text-sm text-white font-medium">
                    {enrollment.progress}%
                  </p>
                </div>
                {isCourseCompleted && (
                  <div className="mt-2 p-2 bg-green-900/20 border border-green-700/30 rounded-lg">
                    <p className="text-sm text-green-400 font-medium text-center">
                      🎉 Course Completed!
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Stats
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold text-white">
                    {completedLessons}
                  </p>
                  <p className="text-xs text-gray-500">Completed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {totalLessons}
                  </p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
