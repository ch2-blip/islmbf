/**
 * admin-badge.ts — Shared module for admin report badge communication.
 *
 * TopBar registers a callback via onReportsSeen().
 * Admin page calls notifyReportsSeen() when reports tab is viewed.
 * This is a simple module-level callback — no events, no timing issues.
 */

const REPORTS_SEEN_KEY = "admin_reports_last_seen"

let _callback: (() => void) | null = null

/** TopBar calls this to register its badge-clear callback */
export function onReportsSeen(cb: (() => void) | null) {
  _callback = cb
}

/** Admin page calls this when reports tab is viewed */
export function notifyReportsSeen() {
  localStorage.setItem(REPORTS_SEEN_KEY, new Date().toISOString())
  _callback?.()
}

/** Get the last-seen timestamp */
export function getReportsLastSeen(): string {
  return localStorage.getItem(REPORTS_SEEN_KEY) || "1970-01-01T00:00:00Z"
}
