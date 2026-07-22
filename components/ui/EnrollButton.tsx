"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, Lock } from "lucide-react";

interface EnrollButtonProps {
  courseId: string;
  coursePrice: number;
  isPublished: boolean;
  className?: string;
}

export default function EnrollButton({
  courseId,
  coursePrice,
  isPublished,
  className = "",
}: EnrollButtonProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check enrollment status
  useEffect(() => {
    if (!user || !isPublished) return;

    const checkEnrollment = async () => {
      try {
        const res = await fetch(`/api/enrollments?courseId=${courseId}`);
        const data = await res.json();
        setIsEnrolled(!!data.enrollment);
      } catch (err) {
        console.error("Error checking enrollment:", err);
      }
    };

    checkEnrollment();
  }, [user, courseId, isPublished]);

  const handleEnroll = async () => {
    if (!user) {
      router.push("/login?redirect=/courses/learn");
      return;
    }

    if (isEnrolled) {
      router.push(`/dashboard/courses/${courseId}/learn`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const isFree = coursePrice === 0;
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          paymentStatus: isFree ? "free" : "pending",
          paymentAmount: coursePrice,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to enroll");
      }

      const data = await res.json();
      setIsEnrolled(true);
      router.push(`/dashboard/courses/${courseId}/learn`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enrollment failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isPublished) {
    return (
      <button
        disabled
        className={`px-8 py-3 bg-gray-700 text-gray-400 font-semibold rounded-lg cursor-not-allowed ${className}`}
      >
        <Lock className="w-4 h-4 inline mr-2" />
        Coming Soon
      </button>
    );
  }

  if (isLoading) {
    return (
      <button
        disabled
        className={`px-8 py-3 bg-blue-600/50 text-white font-semibold rounded-lg cursor-wait ${className}`}
      >
        <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
        Processing...
      </button>
    );
  }

  if (isEnrolled) {
    return (
      <button
        onClick={handleEnroll}
        className={`px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition shadow-lg shadow-green-600/25 ${className}`}
      >
        <CheckCircle className="w-4 h-4 inline mr-2" />
        Continue Learning
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={handleEnroll}
        className={`px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 ${className}`}
      >
        {coursePrice > 0
          ? `Enroll Now — ${coursePrice.toLocaleString("vi-VN")} đ`
          : "Enroll Now — Free"}
      </button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
