/** Join class names; omit falsy entries. No tailwind-merge dep (keeps install lean). */
export function cn(...parts: Array<string | undefined | null | false>): string {
  return parts.filter(Boolean).join(" ");
}
