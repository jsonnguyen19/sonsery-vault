"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import CourseCard from "@/components/ui/CourseCard";
import type { Course } from "@/lib/types/course";
import { Search, Filter, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

const PAGE_SIZE = 9;

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("published");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCourses, setTotalCourses] = useState(0);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1); // Reset page when search changes
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Fetch courses
  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(PAGE_SIZE),
        status: statusFilter,
      });

      if (debouncedSearch) {
        params.append("search", debouncedSearch);
      }

      const response = await fetch(`/api/courses/list?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch courses");
      }

      setCourses(data.courses);
      setTotalPages(data.pagination.totalPages);
      setTotalCourses(data.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, debouncedSearch]);

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
  };

  const clearSearch = () => {
    setSearch("");
    setDebouncedSearch("");
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Memoized status options
  const statusOptions = useMemo(
    () => [
      { value: "published", label: "Published" },
      { value: "draft", label: "Draft" },
      { value: "archived", label: "Archived" },
      { value: "", label: "All Status" },
    ],
    []
  );

  return (
    <main className="min-h-screen bg-gray-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">All Courses</h1>
          <p className="text-gray-400 mt-1">
            Browse our collection of courses
            {totalCourses > 0 && ` (${totalCourses} total)`}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search courses by title or description..."
              className="w-full pl-10 pr-10 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            {search && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <div className="flex flex-wrap gap-1.5">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusChange(option.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                    statusFilter === option.value
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-gray-400 mt-4 text-sm">Loading courses...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-900/20 border border-red-800 rounded-xl p-8 text-center">
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => fetchCourses()}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && courses.length === 0 && (
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-16 text-center">
            <p className="text-gray-400 text-lg">No courses found</p>
            <p className="text-sm text-gray-500 mt-2">
              {search
                ? "Try adjusting your search or filters"
                : "Check back later for new courses"}
            </p>
          </div>
        )}

        {/* Course Grid */}
        {!loading && !error && courses.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1.5">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white"
                            : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
