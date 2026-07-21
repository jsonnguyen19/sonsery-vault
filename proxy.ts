import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { ROLES, isAdmin } from "@/lib/auth/roles";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const sessionCookie = request.cookies.get("session");

  console.log(
    `[Proxy] Checking path: ${pathname} | Session Cookie present: ${!!sessionCookie}`
  );

  // Public paths that don't require authentication
  const publicPaths = ["/login", "/api/auth/login", "/api/auth/logout", "/api/auth/check"];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // Protected paths that require authentication
  const protectedPaths = ["/dashboard"];
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path));

  // Admin-only paths
  const adminPaths = ["/dashboard/admin"];
  const isAdminPath = adminPaths.some((path) => pathname.startsWith(path));

  // If it's a protected path and no session cookie, redirect to login
  if (isProtectedPath && !sessionCookie) {
    console.log(
      `[Proxy] Redirecting to /login from ${pathname} (no session)`
    );
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based access for admin paths
  if (isAdminPath && sessionCookie) {
    try {
      const decodedClaims = await adminAuth.verifySessionCookie(
        sessionCookie.value,
        true
      );
      const userRole = decodedClaims.role || ROLES.USER;
      
      if (!isAdmin(userRole)) {
        console.log(
          `[Proxy] Access denied to ${pathname} for role: ${userRole}`
        );
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      console.log(`[Proxy] Admin access granted for ${pathname}`);
    } catch (error) {
      console.error("[Proxy] Error verifying session for admin check:", error);
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // If user has session and tries to access login page, redirect to dashboard
  if (pathname === "/login" && sessionCookie) {
    console.log(
      `[Proxy] Redirecting to /dashboard from /login (already authenticated)`
    );
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Allow the request to proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
