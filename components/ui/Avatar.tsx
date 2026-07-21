"use client";


import { User } from "firebase/auth";

interface AvatarProps {
  user?: User | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function Avatar({ user, size = "md", className = "" }: AvatarProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg",
  };

  const photoURL = user?.photoURL;
  const displayName = user?.displayName || user?.email || "U";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div
      className={`
        rounded-full overflow-hidden flex items-center justify-center
        bg-gray-700 text-white font-medium
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {photoURL ? (
        <img
          src={photoURL}
          alt={displayName}
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}
