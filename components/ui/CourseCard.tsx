"use client";

import { Course } from "@/lib/types/course";
import Link from "next/link";
import { BookOpen, Clock } from "lucide-react";

interface CourseCardProps {
  course: Course;
  variant?: "default" | "compact";
  showActions?: boolean;
  className?: string;
}

export default function CourseCard({
  course,
  variant = "default",
  showActions = false,
  className = "",
}: CourseCardProps) {
  const isCompact = variant === "compact";

  return (
    <div
      className={`
        bg-gray-800 rounded-xl border border-gray-700 overflow-hidden
        hover:border-gray-600 transition-all duration-200
        hover:shadow-lg hover:shadow-blue-500/5
        group
        ${className}
      `}
    >
      {/* Thumbnail */}
    {course.thumbnailKey && (
      <Link href={`/courses/${course.slug}`} className="block">
        <div className="relative w-full bg-gray-700 overflow-hidden">
          <div className={`${isCompact ? "aspect-video" : "aspect-[16/9]"}`}>
            <img
              src={`${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${course.thumbnailKey}`}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          {/* Status badge */}
          <div className="absolute top-3 left-3">
            <span
              className={`
                text-xs font-semibold px-2.5 py-1 rounded-full
                ${
                  course.status === "published"
                    ? "bg-green-900/80 text-green-400 border border-green-800"
                    : course.status === "archived"
                      ? "bg-red-900/80 text-red-400 border border-red-800"
                      : "bg-amber-900/80 text-amber-400 border border-amber-800"
                }
              `}
            >
              {course.status === "published"
                ? "Published"
                : course.status === "archived"
                  ? "Archived"
                  : "Draft"}
            </span>
          </div>
          {/* Price badge */}
          <div className="absolute bottom-3 right-3">
            <span className="bg-black/60 backdrop-blur-sm text-white text-sm font-bold px-3 py-1.5 rounded-lg">
              {course.price
                ? `${course.price.toLocaleString("vi-VN")} đ`
                : "Free"}
            </span>
          </div>
        </div>
      </Link>
    )}

    {/* Content */}
    <div className="p-4">
      <Link href={`/courses/${course.slug}`} className="block">
        <h3 className="font-bold text-white group-hover:text-blue-400 transition line-clamp-1 text-lg">
          {course.title}
        </h3>
      </Link>

      <p className="text-sm text-gray-400 line-clamp-2 mt-2">
        {course.description || "No description available"}
      </p>

      {/* Meta info */}
      <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <BookOpen className="w-3.5 h-3.5" />
          <span>{course.lessons?.length || 0} lessons</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span>
            Updated {new Date(course.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="mt-4 pt-3 border-t border-gray-700 flex justify-between items-center">
          <Link
            href={`/dashboard/courses/${course.id}/edit`}
            className="text-sm text-gray-400 hover:text-white transition px-3 py-1 rounded-lg hover:bg-gray-700"
          >
            Edit
          </Link>
          <Link
            href={`/dashboard/courses/${course.id}`}
            className="text-sm text-blue-400 hover:text-blue-300 transition font-medium"
          >
            View Details →
          </Link>
        </div>
      )}
    </div>
    </div>
  );
}
