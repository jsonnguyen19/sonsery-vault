import { adminDb } from "@/lib/firebase-admin";
import type { Course } from "@/lib/types/course";
import Link from "next/link";
import { notFound } from "next/navigation";

async function getCourse(id: string): Promise<Course | null> {
  try {
    const doc = await adminDb.collection("courses").doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Course;
  } catch (error) {
    console.error("Error fetching course:", error);
    return null;
  }
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { id } = await params;
  const course = await getCourse(id);

  if (!course) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/courses"
            className="text-sm text-gray-400 hover:text-white transition mb-2 inline-block"
          >
            ← Back to Courses
          </Link>
          <h1 className="text-2xl font-bold text-white">{course.title}</h1>
          <p className="text-sm text-gray-400 mt-1">Course details</p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/dashboard/courses/${course.id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
          >
            Edit Course
          </Link>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        {course.thumbnailKey && (
          <div className="w-full h-64 bg-gray-700">
            <img
              src={`${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${course.thumbnailKey}`}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">Status</p>
              <p className="font-medium text-white">{course.status || "Draft"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Price</p>
              <p className="font-medium text-white">
                {course.price ? `${course.price.toLocaleString("vi-VN")} đ` : "Free"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Lessons</p>
              <p className="font-medium text-white">{course.lessons?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Created</p>
              <p className="font-medium text-white">
                {course.createdAt ? new Date(course.createdAt).toLocaleDateString() : "N/A"}
              </p>
            </div>
          </div>

          {course.description && (
            <div>
              <p className="text-sm text-gray-400">Description</p>
              <p className="text-white mt-1">{course.description}</p>
            </div>
          )}

          {course.lessons && course.lessons.length > 0 && (
            <div>
              <p className="text-sm text-gray-400 mb-2">Lessons</p>
              <ul className="space-y-2">
                {course.lessons.map((lesson: { title: string; description?: string; content?: string }, index: number) => (
                  <li key={index} className="bg-gray-700/50 rounded-lg px-4 py-3 text-white">
                    <p className="font-medium">{lesson.title || `Lesson ${index + 1}`}</p>
                    {(lesson.description || lesson.content) && (
                      <p className="text-sm text-gray-400 mt-1">{lesson.description || lesson.content}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
