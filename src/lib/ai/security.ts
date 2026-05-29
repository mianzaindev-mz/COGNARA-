/**
 * AI Agent Security Module — rate limiting, prompt injection detection,
 * input sanitization, and role-based access control.
 */

// ─── Rate Limiter (in-memory, per-process) ──────────────────────────────────

interface RateWindow {
  count: number;
  windowStart: number;
}

const minuteWindows = new Map<string, RateWindow>();
const hourWindows = new Map<string, RateWindow>();

const MAX_PER_MINUTE = 30;
const MAX_PER_HOUR = 200;
const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;

/** Clean up stale entries every 5 minutes */
let lastCleanup = Date.now();
function cleanupStaleEntries() {
  const now = Date.now();
  if (now - lastCleanup < 300_000) return;
  lastCleanup = now;

  for (const [k, v] of minuteWindows) {
    if (now - v.windowStart > MINUTE_MS * 2) minuteWindows.delete(k);
  }
  for (const [k, v] of hourWindows) {
    if (now - v.windowStart > HOUR_MS * 2) hourWindows.delete(k);
  }
}

/**
 * Check if a user is within rate limits.
 * @returns { allowed, retryAfterMs? }
 */
export function checkRateLimit(userId: string): {
  allowed: boolean;
  retryAfterMs?: number;
} {
  cleanupStaleEntries();
  const now = Date.now();

  // ── Per-minute check ──
  const mw = minuteWindows.get(userId);
  if (mw && now - mw.windowStart < MINUTE_MS) {
    if (mw.count >= MAX_PER_MINUTE) {
      return { allowed: false, retryAfterMs: MINUTE_MS - (now - mw.windowStart) };
    }
    mw.count++;
  } else {
    minuteWindows.set(userId, { count: 1, windowStart: now });
  }

  // ── Per-hour check ──
  const hw = hourWindows.get(userId);
  if (hw && now - hw.windowStart < HOUR_MS) {
    if (hw.count >= MAX_PER_HOUR) {
      return { allowed: false, retryAfterMs: HOUR_MS - (now - hw.windowStart) };
    }
    hw.count++;
  } else {
    hourWindows.set(userId, { count: 1, windowStart: now });
  }

  return { allowed: true };
}

// ─── Prompt Injection Detection ─────────────────────────────────────────────

const INJECTION_PATTERNS: { pattern: RegExp; flag: string }[] = [
  { pattern: /ignore\s+(all\s+)?previous\s+instructions/i, flag: "ignore_previous" },
  { pattern: /ignore\s+(all\s+)?above/i, flag: "ignore_above" },
  { pattern: /you\s+are\s+now\s+/i, flag: "identity_override" },
  { pattern: /act\s+as\s+(if\s+)?(you\s+)?(are\s+)?/i, flag: "act_as" },
  { pattern: /pretend\s+(you\s+)?(are|to\s+be)/i, flag: "pretend" },
  { pattern: /system\s*prompt/i, flag: "system_prompt_probe" },
  { pattern: /reveal\s+(your\s+)?instructions/i, flag: "reveal_instructions" },
  { pattern: /show\s+(me\s+)?(your\s+)?system\s*(message|prompt)/i, flag: "show_system" },
  { pattern: /\]\s*\n*\s*\[?\s*system/i, flag: "bracket_injection" },
  { pattern: /```\s*system/i, flag: "code_block_injection" },
  { pattern: /<\s*script[\s>]/i, flag: "script_tag" },
  { pattern: /<\s*iframe[\s>]/i, flag: "iframe_tag" },
  { pattern: /javascript\s*:/i, flag: "js_protocol" },
  { pattern: /on(error|load|click)\s*=/i, flag: "event_handler" },
  { pattern: /\bDAN\b.*\bmode\b/i, flag: "dan_jailbreak" },
  { pattern: /do\s+anything\s+now/i, flag: "dan_jailbreak" },
  { pattern: /bypass\s+(safety|filter|content)/i, flag: "bypass_attempt" },
];

const MAX_INPUT_LENGTH = 4000;

/**
 * Sanitize user input for prompt injection and XSS.
 * @returns { safe, cleaned, flags }
 */
export function sanitizeInput(input: string): {
  safe: boolean;
  cleaned: string;
  flags: string[];
} {
  const flags: string[] = [];

  // Length check
  let cleaned = input.slice(0, MAX_INPUT_LENGTH);
  if (input.length > MAX_INPUT_LENGTH) {
    flags.push("truncated");
  }

  // Strip HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, "");

  // Check injection patterns
  for (const { pattern, flag } of INJECTION_PATTERNS) {
    if (pattern.test(cleaned)) {
      flags.push(flag);
    }
  }

  // Normalize excessive whitespace
  cleaned = cleaned.replace(/\s{10,}/g, " ".repeat(5));

  // Remove null bytes
  cleaned = cleaned.replace(/\0/g, "");

  const safe = flags.filter((f) => f !== "truncated").length === 0;

  return { safe, cleaned, flags };
}

// ─── Role-Based Access Control ──────────────────────────────────────────────

/** Skills that require elevated roles */
const ROLE_REQUIRED_SKILLS: Record<string, string[]> = {
  generate_course: ["coach", "admin"],
  verify: ["coach", "admin"],
  solution_set: ["coach", "admin"],
  admin: ["admin"],
};

/** Role hierarchy for permission inheritance */
const ROLE_HIERARCHY: Record<string, number> = {
  student: 0,
  coach: 1,
  admin: 2,
};

/**
 * Check if a user role has access to a specific agent skill.
 * - Students: all standard skills
 * - Coaches: student skills + coach-only (generate_course, verify)
 * - Admins: everything
 */
export function checkSkillAccess(role: string, skill: string): boolean {
  const requiredRoles = ROLE_REQUIRED_SKILLS[skill];

  // No restriction — available to all authenticated users
  if (!requiredRoles) return true;

  // Check if user's role is in the required list
  if (requiredRoles.includes(role)) return true;

  // Check role hierarchy (admin can do everything)
  const userLevel = ROLE_HIERARCHY[role] ?? 0;
  const minRequired = Math.min(
    ...requiredRoles.map((r) => ROLE_HIERARCHY[r] ?? 99),
  );

  return userLevel >= minRequired;
}
