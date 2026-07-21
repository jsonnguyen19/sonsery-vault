"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Settings,
  Shield,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Courses", href: "/dashboard/courses", icon: BookOpen },
  { name: "Students", href: "/dashboard/students", icon: Users },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

const adminNavigation = [
  { name: "Admin", href: "/dashboard/admin/users", icon: Shield },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  const allNavigation = isAdmin ? [...navigation, ...adminNavigation] : navigation;

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 h-screen sticky top-0 flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold text-white">Sonsery Vault</h1>
        <p className="text-sm text-gray-400 mt-1">Learning Platform</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {allNavigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href + "/"));
          const Icon = item.icon;
          const isAdminItem = item.name === "Admin";
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                ${isActive
                  ? isAdminItem
                    ? "bg-purple-600 text-white"
                    : "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }
                ${isAdminItem && !isActive ? "text-purple-400 hover:text-purple-300" : ""}
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-800">
        <p className="text-xs text-gray-500 text-center">
          © 2026 Sonsery Vault
        </p>
      </div>
    </aside>
  );
}
