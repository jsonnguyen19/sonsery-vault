"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Play, CheckCircle, Lock, Loader2, Circle } from "lucide-react";
import type { Lesson } from "@/lib/types/course";

interface CoursePlayerProps {
  courseId: string;
  lesson: Lesson;
  index: number;
  isCompleted: boolean;
  isLocked: boolean;
  totalLessons: number;
  currentProgress: number;
}

export default function CoursePlayer({
  courseId,
  lesson,
  index,
  isCompleted,
  isLocked,
  totalLessons,
  currentProgress,
}: CoursePlayerProps) {
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [localCompleted, setLocalCompleted] = useState(isCompleted);
  const [error, setError] = useState<string | null>(null);

  const handleToggleComplete = async () => {
    if (!user || isLocked || isUpdating) return;

    const newCompleted = !localCompleted;
    setIsUpdating(true);
    setError(null);

    try {
      // Use lesson index as identifier since lesson.id might be undefined
      const lessonId = lesson.id || `lesson-${index}`;

      const res = await fetch("/api/enrollments/progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          lessonId: lessonId,
          completed: newCompleted,
          timeSpent: 60,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update progress");
      }

      setLocalCompleted(newCompleted);
      // Refresh the page to update progress bar
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      className={`p-4 rounded-lg border transition-all ${
        isLocked
          ? "bg-gray-800/30 border-gray-700/30 opacity-60 cursor-not-allowed"
          : localCompleted
            ? "bg-green-900/10 border-green-700/30 hover:bg-green-900/20 cursor-pointer"
            : "bg-gray-800/30 border-gray-700/30 hover:bg-gray-700/40 cursor-pointer"
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Checkbox / Status */}
        <div className="flex-shrink-0">
          {isLocked ? (
            <Lock className="w-5 h-5 text-gray-600" />
          ) : (
            <button
              onClick={handleToggleComplete}
              disabled={isUpdating}
              className="focus:outline-none"
              title={localCompleted ? "Mark as incomplete" : "Mark as complete"}
            >
              {isUpdating ? (
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
              ) : localCompleted ? (
                <CheckCircle className="w-6 h-6 text-green-400 hover:text-green-300 transition-colors" />
              ) : (
                <Circle className="w-6 h-6 text-gray-500 hover:text-blue-400 transition-colors" />
              )}
            </button>
          )}
        </div>

        {/* Lesson info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-500 font-medium">
                  Lesson {index + 1} of {totalLessons}
                </p>
                {localCompleted && !isLocked && (
                  <span className="text-xs text-green-400 font-medium">
                    ✓ Done
                  </span>
                )}
                {lesson.isFreePreview && (
                  <span className="text-xs font-medium text-green-400 bg-green-900/30 px-2 py-0.5 rounded">
                    Free
                  </span>
                )}
              </div>
              <h3
                className={`font-medium ${isLocked ? "text-gray-500" : "text-white"}`}
              >
                {lesson.title}
              </h3>
              {lesson.description && (
                <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                  {lesson.description}
                </p>
              )}
            </div>
          </div>

          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}

          {/* Progress indicator for completed lessons */}
          {!isLocked && localCompleted && (
            <div className="mt-2 w-full bg-gray-700 rounded-full h-1">
              <div
                className="bg-green-400 h-1 rounded-full transition-all duration-500"
                style={{ width: `${((index + 1) / totalLessons) * 100}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
