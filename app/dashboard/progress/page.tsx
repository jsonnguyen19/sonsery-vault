'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import Link from 'next/link';
import { BookOpen, CheckCircle, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import ProgressBar from '@/components/ui/ProgressBar';
import type { Enrollment } from '@/lib/types/enrollment';
import type { Course } from '@/lib/types/course';

interface EnrollmentWithCourse extends Enrollment {
  course?: Course;
}

export default function ProgressDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [enrollments, setEnrollments] = useState<EnrollmentWithCourse[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    overallProgress: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch enrollments
        const enrollRes = await fetch('/api/enrollments');
        if (!enrollRes.ok) {
          throw new Error('Failed to fetch enrollments');
        }
        const enrollData = await enrollRes.json();

        // Fetch course details for each enrollment
        const enrolledCourses = await Promise.all(
          enrollData.enrollments.map(async (enrollment: Enrollment) => {
            try {
              const courseRes = await fetch(`/api/courses/${enrollment.courseId}`);
              if (courseRes.ok) {
                const courseData = await courseRes.json();
                return { ...enrollment, course: courseData.course };
              }
              return enrollment;
            } catch {
              return enrollment;
            }
          })
        );

        setEnrollments(enrolledCourses);

        // Fetch stats
        const statsRes = await fetch('/api/enrollments/stats');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.stats);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        console.error('Error fetching progress data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
          <p className="text-gray-400 mt-4">Loading your progress...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Please log in to view your progress</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Learning Progress</h1>
        <p className="text-sm text-gray-400 mt-1">
          Track your learning journey across all courses
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-900/30 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-gray-400">Total Enrolled</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.completed}</p>
              <p className="text-xs text-gray-400">Completed</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.inProgress}</p>
              <p className="text-xs text-gray-400">In Progress</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.overallProgress}%</p>
              <p className="text-xs text-gray-400">Overall Progress</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enrollments List */}
      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {enrollments.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/30 rounded-xl border border-gray-700">
          <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">You haven't enrolled in any courses yet</p>
          <Link
            href="/courses"
            className="inline-block mt-4 text-blue-400 hover:text-blue-300 transition font-medium"
          >
            Browse Courses →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {enrollments.map((enrollment) => (
            <div
              key={enrollment.id}
              className="bg-gray-800/30 rounded-xl border border-gray-700 p-4 hover:border-gray-600 transition"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">
                    {enrollment.course?.title || 'Course'}
                  </h3>
                  <div className="flex items-center gap-4 mt-1 text-sm">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${
                        enrollment.status === 'completed'
                          ? 'bg-green-900/30 text-green-400'
                          : 'bg-blue-900/30 text-blue-400'
                      }`}
                    >
                      {enrollment.status === 'completed' ? '✅ Completed' : 'In Progress'}
                    </span>
                    <span className="text-gray-400">
                      {enrollment.progress}% complete
                    </span>
                    <span className="text-gray-500 text-xs">
                      Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="flex-1 md:w-32">
                    <ProgressBar progress={enrollment.progress} size="sm" />
                  </div>
                  <Link
                    href={`/dashboard/courses/${enrollment.courseId}/learn`}
                    className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition font-medium whitespace-nowrap"
                  >
                    {enrollment.status === 'completed' ? 'Review' : 'Continue'}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
