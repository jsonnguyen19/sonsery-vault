"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  progress: number; // 0-100
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  color?: "blue" | "green" | "purple" | "gradient";
}

export default function ProgressBar({
  progress,
  className = "",
  showLabel = false,
  size = "md",
  color = "blue",
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  const colorClasses = {
    blue: "bg-blue-600",
    green: "bg-green-600",
    purple: "bg-purple-600",
    gradient: "bg-gradient-to-r from-blue-500 to-purple-600",
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-400">Progress</span>
          <span className="font-medium text-white">{clampedProgress}%</span>
        </div>
      )}
      <div
        className={`w-full bg-gray-700 rounded-full overflow-hidden ${sizeClasses[size]}`}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`${colorClasses[color]} h-full rounded-full transition-all`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}
