import { adminDb } from "@/lib/firebase-admin";
import type { Course } from "@/lib/types/course";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Clock,
  DollarSign,
  User,
  Calendar,
  ArrowLeft,
  Play,
  Lock,
} from "lucide-react";
import EnrollButton from "@/components/ui/EnrollButton";

async function getCourseBySlug(slug: string): Promise<Course | null> {
  try {
    const snapshot = await adminDb
      .collection("courses")
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Course;
  } catch (error) {
    console.error("Error fetching course:", error);
    return null;
  }
}

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CoursePublicPage({ params }: PageProps) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  const isPublished = course.status === "published";
  const totalLessons = course.lessons?.length || 0;
  const freeLessons =
    course.lessons?.filter((l) => l.isFreePreview).length || 0;

  return (
    <main className="min-h-screen bg-gray-950">
      {/* Back button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left: Course Info */}
            <div>
              {/* Status badge */}
              <div className="inline-flex items-center gap-2 mb-4">
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    isPublished
                      ? "bg-green-900/80 text-green-400 border border-green-800"
                      : "bg-amber-900/80 text-amber-400 border border-amber-800"
                  }`}
                >
                  {isPublished ? "Published" : "Draft"}
                </span>
                {!isPublished && (
                  <span className="text-xs text-gray-500">
                    (Not publicly available)
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
                {course.title}
              </h1>

              <p className="mt-4 text-lg text-gray-400 leading-relaxed">
                {course.description}
              </p>

              {/* Course stats */}
              <div className="mt-6 flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <BookOpen className="w-4 h-4" />
                  <span>{totalLessons} lessons</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>
                    Updated {new Date(course.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                {course.instructorId && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <User className="w-4 h-4" />
                    <span>Instructor</span>
                  </div>
                )}
              </div>

              {/* Price and Enroll Button */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <div className="text-3xl font-bold text-white">
                  {course.price
                    ? `${course.price.toLocaleString("vi-VN")} đ`
                    : "Free"}
                </div>
                <EnrollButton
                  courseId={course.id}
                  coursePrice={course.price || 0}
                  isPublished={isPublished}
                />
                {freeLessons > 0 && (
                  <span className="text-sm text-green-400">
                    {freeLessons} free preview{freeLessons > 1 ? "s" : ""}{" "}
                    available
                  </span>
                )}
              </div>
            </div>

            {/* Right: Thumbnail */}
            {course.thumbnailKey && (
              <div className="relative rounded-xl overflow-hidden shadow-2xl shadow-blue-500/10">
                <div className="aspect-video bg-gray-800">
                  <img
                    src={`${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${course.thumbnailKey}`}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Lessons Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white">Course Content</h2>
            <p className="text-sm text-gray-400 mt-1">
              {totalLessons} lessons • {freeLessons} free preview
              {freeLessons > 1 ? "s" : ""}
            </p>
          </div>

          {totalLessons === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400">No lessons available yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-700">
              {course.lessons?.map((lesson, index) => (
                <li
                  key={lesson.id || index}
                  className="p-4 hover:bg-gray-700/30 transition"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {lesson.isFreePreview ? (
                        <Play className="w-5 h-5 text-green-400" />
                      ) : (
                        <Lock className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm text-gray-500 font-medium">
                            Lesson {index + 1}
                          </p>
                          <h3 className="text-white font-medium">
                            {lesson.title}
                          </h3>
                          {lesson.description && (
                            <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                              {lesson.description}
                            </p>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          {lesson.isFreePreview ? (
                            <span className="text-xs font-medium text-green-400 bg-green-900/30 px-2 py-0.5 rounded">
                              Free
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-gray-500 bg-gray-700/50 px-2 py-0.5 rounded">
                              Premium
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Related / CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl border border-blue-500/20 p-12 text-center">
          <h3 className="text-2xl font-bold text-white mb-2">
            Ready to master this course?
          </h3>
          <p className="text-gray-400 mb-6 max-w-lg mx-auto">
            Enroll now and get access to all lessons, quizzes, and learning
            materials.
          </p>
          <EnrollButton
            courseId={course.id}
            coursePrice={course.price || 0}
            isPublished={isPublished}
            className="mx-auto"
          />
        </div>
      </section>
    </main>
  );
}
