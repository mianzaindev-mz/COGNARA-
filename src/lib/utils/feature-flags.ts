/**
 * Platform feature toggles (master build doc §17).
 * Flip booleans as capabilities ship; keep Phase 2 items off until ready.
 */
export const FEATURES = {
  AUTH: true,
  COURSES: true,
  CODE_EDITOR: true,
  NOTEBOOK: true,
  AI_AGENT: true,
  QUIZZES: true,
  FREE_LIBRARY: true,
  PEER_SESSIONS: true,
  RATINGS_REVIEWS: true,
  PAYMENTS_STRIPE: false,
  CERTIFICATES: true,
  NOTIFICATIONS: true,
  SUPPORT_TICKETS: true,
  COACH_VERIFICATION: true,
  GAMIFICATION: true,

  LIVE_CLASSES: false,
  GITHUB_IMPORT: false,
  LINKEDIN_CERTS: false,
  MOBILE_APP: false,
  ADVANCED_ANALYTICS: false,
  COUPON_CODES: false,

  JOBS_BOARD: false,
  HACKATHONS: false,
  MENTORSHIP: false,
  B2B_SCHOOLS: false,
  WHITE_LABEL: false,
  API_ACCESS: false,
} as const;

export type FeatureKey = keyof typeof FEATURES;

export function isFeatureEnabled(key: FeatureKey): boolean {
  return FEATURES[key];
}
