"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const colors = {
  success: {
    bg: "bg-emerald-900/50",
    border: "border-emerald-700",
    icon: "text-emerald-400",
    text: "text-emerald-100",
  },
  error: {
    bg: "bg-red-900/50",
    border: "border-red-700",
    icon: "text-red-400",
    text: "text-red-100",
  },
  warning: {
    bg: "bg-amber-900/50",
    border: "border-amber-700",
    icon: "text-amber-400",
    text: "text-amber-100",
  },
  info: {
    bg: "bg-blue-900/50",
    border: "border-blue-700",
    icon: "text-blue-400",
    text: "text-blue-100",
  },
};

export default function Toast({
  message,
  type = "info",
  duration = 4000,
  onClose,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const Icon = icons[type];
  const color = colors[type];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 300);
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
        w-96 max-w-[90vw] flex items-start gap-3
        ${color.bg} border ${color.border} rounded-xl
        backdrop-blur-sm shadow-2xl p-4
        pointer-events-auto
      `}
      role="alert"
    >
      <Icon className={`w-5 h-5 ${color.icon} flex-shrink-0 mt-0.5`} />
      <p className={`flex-1 text-sm font-medium ${color.text}`}>{message}</p>
      <button
        onClick={handleClose}
        className="text-gray-400 hover:text-white transition-colors flex-shrink-0 mt-0.5"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
