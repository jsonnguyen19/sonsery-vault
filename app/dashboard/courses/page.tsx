import { adminDb } from "@/lib/firebase-admin";
import type { Course } from "@/lib/types/course";
import Link from "next/link";
import CourseCard from "@/components/ui/CourseCard";

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
            <CourseCard key={course.id} course={course} showActions={true} />
          ))}
        </div>
      )}
    </div>
  );
}
