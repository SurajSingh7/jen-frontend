import { NextResponse } from "next/server";

const AUTH_COOKIE = "jen_token";

// Optimistic check only (cookie present or not). The backend verifies the session on every API call.
export function proxy(request) {
  const loggedIn = request.cookies.has(AUTH_COOKIE);
  const onLogin = request.nextUrl.pathname === "/login";

  if (!loggedIn && !onLogin) return NextResponse.redirect(new URL("/login", request.url));
  if (loggedIn && onLogin) return NextResponse.redirect(new URL("/patients", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/patients/:path*", "/tests/:path*", "/doctors/:path*", "/accounts/:path*", "/settings/:path*"],
};
