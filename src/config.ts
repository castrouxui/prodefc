// ─── App ────────────────────────────────────────────────────────────────────
export const APP_NAME = 'ProdeFC'

// ─── API-Football CDN ────────────────────────────────────────────────────────
// Los logos se sirven desde el CDN público de API-Football — sin API key.
export const API_FOOTBALL_CDN = 'https://media.api-sports.io/football'
export const UCL_LOGO_URL    = `${API_FOOTBALL_CDN}/leagues/2.png`   // Champions League
export const WC2026_LOGO_URL = `${API_FOOTBALL_CDN}/leagues/1.png`   // FIFA World Cup
export const APP_MAX_WIDTH = 430 // px — matches iPhone 13/14 width

// ─── Competition ────────────────────────────────────────────────────────────
export const COMPETITION_ID = 'UCL'
export const COMPETITION_LABEL = 'UCL 2024/25'
export const COMPETITION_STATUS_LABEL = 'En curso'

// ─── Scoring ────────────────────────────────────────────────────────────────
export const POINTS_EXACT_SCORE = 3
export const POINTS_CORRECT_WINNER_AND_DIFF = 2
export const POINTS_CORRECT_WINNER = 1
export const POINTS_WRONG = 0

// ─── Payment ────────────────────────────────────────────────────────────────
export const PAYMENT_CURRENCY = 'ARS'
export const PAYMENT_VALIDITY_MS = 1000 * 60 * 60 * 24 // 24 hours
export const PAYMENT_STATEMENT_DESCRIPTOR = 'ProdeFC'

// ─── Group ──────────────────────────────────────────────────────────────────
export const INVITE_CODE_LENGTH = 6
export const DEFAULT_ENTRY_AMOUNT = 0

// ─── Invite code generation ──────────────────────────────────────────────────
/** Generates a random 6-character uppercase alphanumeric invite code. */
export function generateInviteCode() {
  return Math.random().toString(36).substring(2, 2 + INVITE_CODE_LENGTH).toUpperCase()
}

// ─── Match status values ─────────────────────────────────────────────────────
export const MATCH_STATUS = {
  SCHEDULED: 'scheduled',
  LIVE:      'live',
  FINISHED:  'finished',
} as const

// ─── Payment status values ───────────────────────────────────────────────────
export const PAYMENT_STATUS = {
  PENDING:  'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const

// ─── Date / locale ───────────────────────────────────────────────────────────
export const LOCALE = 'es-AR'

// ─── React Query ─────────────────────────────────────────────────────────────
export const QUERY_STALE_TIME_MS = 1000 * 60 * 5 // 5 minutes
export const QUERY_RETRY_COUNT = 1

// ─── Home page ───────────────────────────────────────────────────────────────
export const HOME_MATCHES_LIMIT = 5
export const HOME_RANKING_LIMIT = 4
