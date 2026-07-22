import { adminDb } from "@/lib/firebase-admin";
import type { Course } from "@/lib/types/course";
import CourseCard from "@/components/ui/CourseCard";
import { BookOpen, Sparkles, TrendingUp, Users } from "lucide-react";

async function getCourses() {
  try {
    const snapshot = await adminDb.collection("courses").get();
    const allCourses = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Course[];

    // Filter published courses and sort by createdAt
    return allCourses
      .filter((course) => course.status === "published")
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 6);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return [];
  }
}

export default async function HomePage() {
  const courses = await getCourses();

  return (
    <main className="min-h-screen bg-gray-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-transparent" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-6">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-400 font-medium">
                Learn anything, anywhere
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Master new skills with{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Sonsery
              </span>
            </h1>
            <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
              Explore our curated collection of courses designed to help you
              grow. Learn from experts and join thousands of students worldwide.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <a
                href="/courses"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40"
              >
                Explore Courses
              </a>
              <a
                href="/dashboard"
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold rounded-lg transition border border-gray-700"
              >
                Go to Dashboard
              </a>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
                <div className="flex items-center justify-center gap-2 text-blue-400">
                  <BookOpen className="w-5 h-5" />
                  <span className="text-2xl font-bold text-white">50+</span>
                </div>
                <p className="text-sm text-gray-400 mt-1">Courses Available</p>
              </div>
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
                <div className="flex items-center justify-center gap-2 text-purple-400">
                  <Users className="w-5 h-5" />
                  <span className="text-2xl font-bold text-white">10K+</span>
                </div>
                <p className="text-sm text-gray-400 mt-1">Active Students</p>
              </div>
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
                <div className="flex items-center justify-center gap-2 text-green-400">
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-2xl font-bold text-white">4.8★</span>
                </div>
                <p className="text-sm text-gray-400 mt-1">Average Rating</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Featured Courses</h2>
            <p className="text-sm text-gray-400 mt-1">
              Handpicked courses to accelerate your learning journey
            </p>
          </div>
          <a
            href="/courses"
            className="text-sm text-blue-400 hover:text-blue-300 font-medium transition flex items-center gap-1"
          >
            View all
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </a>
        </div>

        {courses.length === 0 ? (
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-12 text-center">
            <p className="text-gray-400 text-sm mb-4">
              No published courses available yet.
            </p>
            <p className="text-xs text-gray-500">
              Check back soon for new courses!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl border border-blue-500/20 p-12 text-center">
          <h3 className="text-2xl font-bold text-white mb-2">
            Ready to start learning?
          </h3>
          <p className="text-gray-400 mb-6 max-w-lg mx-auto">
            Join thousands of students and get access to premium courses with
            expert instructors.
          </p>
          <a
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40"
          >
            Get Started Now
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </a>
        </div>
      </section>
    </main>
  );
}
