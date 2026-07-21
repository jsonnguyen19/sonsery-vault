import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const sessionCookie = request.cookies.get("session");

  console.log(
    `[Middleware] Checking path: ${pathname} | Session Cookie present: ${!!sessionCookie}`
  );

  // Public paths that don't require authentication
  const publicPaths = ["/login", "/api/auth/login", "/api/auth/logout", "/api/auth/check"];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // Protected paths that require authentication
  const protectedPaths = ["/dashboard"];
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path));

  // If it's a protected path and no session cookie, redirect to login
  if (isProtectedPath && !sessionCookie) {
    console.log(
      `[Middleware] Redirecting to /login from ${pathname} (no session)`
    );
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user has session and tries to access login page, redirect to dashboard
  if (pathname === "/login" && sessionCookie) {
    console.log(
      `[Middleware] Redirecting to /dashboard from /login (already authenticated)`
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
