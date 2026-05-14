export type UserRole = "student" | "coach" | "admin";

export function isUserRole(value: unknown): value is UserRole {
  return value === "student" || value === "coach" || value === "admin";
}
