/**
 * Route helpers. Note: master spec maps both public browse and student
 * "My courses" to `/courses` (URL collision). We use `/courses` for public
 * catalog (when built) and `/my-courses` for enrolled courses.
 */

export const AUTH_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
] as const;

export const VERIFY_EMAIL_ROUTE = "/verify-email";

/** Prefixes that require an authenticated user (session). */
export const AUTHENTICATED_PREFIXES = [
  "/dashboard",
  "/my-courses",
  "/editor",
  "/notebook",
  "/agent",
  "/quizzes",
  "/progress",
  "/certificates",
  "/peer",
  "/billing",
  "/support",
  "/settings",
  "/profile",
  "/onboarding",
  "/coach",
  "/admin",
  "/banned",
] as const;

export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`),
  );
}

export function requiresAuthentication(pathname: string): boolean {
  return AUTHENTICATED_PREFIXES.some((p) =>
    pathname === p ? true : pathname.startsWith(`${p}/`),
  );
}
