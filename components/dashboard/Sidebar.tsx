"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Bell,
  Settings,
  Users,
  Shield,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  exactMatch?: boolean;
}

const navItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    exactMatch: true,
  },
  { name: "Courses", href: "/dashboard/courses", icon: BookOpen },
  { name: "Progress", href: "/dashboard/progress", icon: TrendingUp },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
  {
    name: "Admin",
    href: "/dashboard/admin/users",
    icon: Shield,
    adminOnly: true,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  const filteredItems = navItems.filter(
    (item) => !item.adminOnly || (item.adminOnly && isAdmin),
  );

  const isActive = (item: NavItem) => {
    if (item.exactMatch) {
      return pathname === item.href;
    }
    if (item.href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname?.startsWith(item.href + "/") || pathname === item.href;
  };

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 h-screen sticky top-0 flex flex-col p-4 hidden md:flex">
      {/* Logo - fixed at top */}
      <div className="flex-shrink-0 mb-8">
        <h1 className="text-xl font-bold text-white">Sonsery Vault</h1>
        <p className="text-xs text-gray-500 mt-1">Learning Platform</p>
      </div>

      {/* Navigation - scrollable middle */}
      <nav className="flex-1 overflow-y-auto space-y-1">
        {filteredItems.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                active
                  ? "bg-blue-600/20 text-blue-400 border border-blue-600/30"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Support card - fixed at bottom */}
      <div className="flex-shrink-0 mt-4 pt-4 border-t border-gray-800">
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <p className="text-xs text-gray-400">Need help?</p>
          <p className="text-xs text-gray-500 mt-1">Contact support</p>
        </div>
      </div>
    </aside>
  );
}
