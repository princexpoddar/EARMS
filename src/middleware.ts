import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const TOKEN_COOKIE_NAME = "assetflow_session";

// Paths that require authentication
const PROTECTED_ROUTES = [
  "/dashboard",
  "/assets",
  "/allocation",
  "/booking",
  "/maintenance",
  "/reports",
  "/notifications",
  "/scan",
];

// Paths that should not be accessed if logged in
const AUTH_ROUTES = ["/login", "/signup"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value;

  // Let static assets and API routes pass through
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  let user = null;
  if (token) {
    try {
      // Decode JWT payload (standard Base64Url decode, safe for Edge middleware)
      const parts = token.split(".");
      if (parts.length === 3) {
        const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = atob(payloadBase64);
        user = JSON.parse(jsonPayload);
      }
    } catch (e) {
      console.error("Middleware token parse failed:", e);
    }
  }

  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // Redirect root path
  if (pathname === "/") {
    if (user) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // 1. If trying to access a protected route and not logged in, redirect to login
  if (isProtectedRoute && !user) {
    const loginUrl = new URL("/login", request.url);
    // Remember where they wanted to go
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. If logged in and trying to access login/signup, redirect to dashboard
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
