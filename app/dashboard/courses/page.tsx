import { adminDb } from "@/lib/firebase-admin";
import type { Course } from "@/lib/types/course";
import Link from "next/link";

async function getCourses() {
  try {
    const snapshot = await adminDb.collection("courses").get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Course[];
  } catch (error) {
    console.error("Error fetching courses:", error);
    return [];
  }
}

export default async function CoursesPage() {
  const courses = await getCourses();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Courses</h1>
          <p className="text-sm text-gray-400 mt-1">Manage your courses</p>
        </div>
        <Link
          href="/dashboard/courses/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
        >
          + Create Course
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
          <p className="text-gray-400 text-sm mb-4">No courses created yet.</p>
          <Link
            href="/dashboard/courses/new"
            className="text-blue-400 hover:underline text-sm font-medium"
          >
            Create your first course
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-gray-600 transition group"
            >
              <div className="block">
                {course.thumbnailKey && (
                  <div className="w-full h-40 bg-gray-700 overflow-hidden">
                    <img
                      src={`${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${course.thumbnailKey}`}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-5">
                  <Link href={`/dashboard/courses/${course.id}`} className="block">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-900/50 text-amber-400 border border-amber-800 uppercase">
                        {course.status || "Draft"}
                      </span>
                      <span className="text-sm font-bold text-blue-400">
                        {course.price
                          ? `${course.price.toLocaleString("vi-VN")} đ`
                          : "Free"}
                      </span>
                    </div>

                    <h3 className="font-bold text-white group-hover:text-blue-400 transition line-clamp-1">
                      {course.title}
                    </h3>

                    <p className="text-xs text-gray-400 line-clamp-2 mt-2">
                      {course.description || "No description..."}
                    </p>
                  </Link>

                  <div className="mt-4 pt-3 border-t border-gray-700 flex justify-between text-xs text-gray-500">
                    <span>{course.lessons?.length || 0} lessons</span>
                    <Link
                      href={`/dashboard/courses/${course.id}/edit`}
                      className="text-gray-400 hover:text-white transition"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
