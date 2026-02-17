export { auth as middleware } from "@/lib/auth";

export const runtime = "nodejs";

export const config = {
  matcher: [
    // Protect all routes except public ones
    "/((?!api/auth|_next/static|_next/image|favicon.ico|$).*)",
  ],
};
