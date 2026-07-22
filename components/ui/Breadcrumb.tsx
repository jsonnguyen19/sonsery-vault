"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href: string;
}

export default function Breadcrumb() {
  const pathname = usePathname();

  // Generate breadcrumb items from pathname
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const paths = pathname?.split("/").filter(Boolean) || [];
    const breadcrumbs: BreadcrumbItem[] = [];

    // Always show Home
    breadcrumbs.push({ label: "Home", href: "/" });

    let currentPath = "";
    for (const segment of paths) {
      currentPath += `/${segment}`;

      // Skip dashboard routes (they have their own header)
      if (segment === "dashboard") continue;

      // Decode URL segments for better display
      let label = decodeURIComponent(segment);

      // Special handling for dynamic routes
      if (label.startsWith("[") && label.endsWith("]")) {
        // For dynamic segments, we might want to show a different label
        // This is a fallback, actual labels should be set by the page
        label = label.replace(/[\[\]]/g, "");
        if (label === "slug") {
          // For course detail, we'll try to get the course title
          // But for now, show "Course Details"
          label = "Course Details";
        }
      }

      // Capitalize and improve labels
      label = label
        .split(/[-_]/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      // Skip if it's just an ID or slug
      if (
        label.match(/^[0-9a-f]{20,}$/i) || // Firebase ID
        label.match(/^[a-f0-9]{24}$/i) || // MongoDB ObjectId
        label.match(
          /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i,
        ) // UUID
      ) {
        label = "Details";
      }

      // Handle common routes
      if (segment === "courses" && paths.includes("dashboard")) {
        label = "Courses";
      }

      breadcrumbs.push({ label, href: currentPath });
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumb on home page
  if (pathname === "/") return null;

  // Don't show breadcrumb on dashboard pages (they have their own layout)
  if (pathname?.startsWith("/dashboard")) return null;

  return (
    <nav className="bg-gray-900/50 border-b border-gray-800 px-4 sm:px-6 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto">
        <ol className="flex items-center gap-2 text-sm flex-wrap">
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <li key={item.href} className="flex items-center gap-2">
                {index > 0 && (
                  <ChevronRight className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                )}
                {isLast ? (
                  <span className="text-white font-medium">{item.label}</span>
                ) : (
                  <Link
                    href={item.href}
                    className="text-gray-400 hover:text-white transition flex items-center gap-1.5"
                  >
                    {index === 0 && <Home className="w-3.5 h-3.5" />}
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
