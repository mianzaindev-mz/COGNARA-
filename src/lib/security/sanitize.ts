/**
 * Input sanitization and security utilities.
 * Protects against XSS, injection, and off-platform attempts.
 */

/** Strip HTML tags to prevent XSS in text fields */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "").trim();
}

/** Sanitize user message — strip dangerous content but keep code blocks */
export function sanitizeMessage(input: string, maxLength = 5000): string {
  if (!input || typeof input !== "string") return "";

  let clean = input;

  // Remove script tags and event handlers
  clean = clean.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  clean = clean.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");
  clean = clean.replace(/javascript\s*:/gi, "");

  // Truncate
  if (clean.length > maxLength) {
    clean = clean.slice(0, maxLength);
  }

  return clean.trim();
}

/** Sanitize code input — preserve code but limit size */
export function sanitizeCode(input: string, maxLength = 50_000): string {
  if (!input || typeof input !== "string") return "";
  if (input.length > maxLength) return input.slice(0, maxLength);
  return input;
}

/** Off-platform detection patterns */
const OFF_PLATFORM_PATTERNS = [
  // Phone numbers (various formats)
  /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/,
  // WhatsApp/Telegram/Signal mentions
  /\b(?:whatsapp|telegram|signal|discord)\s*(?:me|id|@|:)?\s*\S+/i,
  // Social media handles (trying to share outside platform)
  /(?:dm|message|text|contact)\s+me\s+(?:on|at|via)\s+\w+/i,
  // Direct email sharing in chat messages
  /\b(?:email|mail)\s+me\s+at\s+\S+@\S+/i,
];

/** Check if a message contains off-platform communication attempts */
export function detectOffPlatform(message: string): {
  detected: boolean;
  pattern: string | null;
} {
  for (const pattern of OFF_PLATFORM_PATTERNS) {
    if (pattern.test(message)) {
      return { detected: true, pattern: pattern.source };
    }
  }
  return { detected: false, pattern: null };
}

/** Validate that a string is a valid UUID */
export function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

/** Security headers to add to responses */
export const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(self), geolocation=()",
};
