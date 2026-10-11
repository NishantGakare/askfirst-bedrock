/**
 * api.js
 * ---------------------------------------------------------------------------
 * Connects the React frontend to the FastAPI backend.
 *
 * All functions return Promises that resolve with the same shape as before,
 * so no component code needs to change.
 *
 * Session lifecycle
 * -----------------
 * 1. apiPrepare() creates a new backend session and stores the session_id in
 *    module-level state.  It is recreated automatically on the next prepare call.
 * 2. apiAnswer() and apiSummarize() reuse the stored session_id.
 * 3. apiResetSession() clears the stored id (called by App on "Start over").
 *
 * Error handling
 * --------------
 * Non-2xx responses are turned into thrown Error objects whose .message is the
 * backend's "detail" string, so the frontend error states receive readable text.
 *
 * Mode banner
 * -----------
 * apiPrepare() returns a `mode` field ("sample"|"live") from the backend.
 * The frontend can display this to make the current mode visible to users.
 * ---------------------------------------------------------------------------
 */

const BASE_URL  = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

// Module-level session state — one active session per browser tab
let _sessionId  = null
let _mode       = 'sample'

/** Expose current mode so App.jsx can show a banner if needed. */
export function getMode() {
  return _mode
}

/** Clear the stored session — call this when the user restarts. */
export function apiResetSession() {
  _sessionId = null
}

// ── Low-level fetch helper ────────────────────────────────────────────────────

async function apiFetch(path, options = {}) {
  const url = `${BASE_URL}${path}`
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (_sessionId) {
    headers['X-Session-Id'] = _sessionId
  }

  let response
  try {
    response = await fetch(url, { ...options, headers })
  } catch (networkErr) {
    throw new Error(
      'Could not reach the backend. Make sure the server is running on ' +
      BASE_URL + '.'
    )
  }

  if (!response.ok) {
    let detail = `HTTP ${response.status}`
    try {
      const body = await response.json()
      detail = body.detail ?? detail
    } catch (_) { /* non-JSON error body */ }
    throw new Error(detail)
  }

  return response.json()
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Create a session, then run the prepare action.
 * Returns { checklist: ChecklistItem[], mode: string }.
 *
 * @param {string} situation
 */
export async function apiPrepare(situation) {
  // Always create a fresh session for each new prepare call.
  // This matches the backend's expectation and keeps sessions isolated.
  const sessionData = await apiFetch('/api/session', {
    method:  'POST',
    body:    JSON.stringify({ situation }),
  })
  _sessionId = sessionData.session_id
  _mode      = sessionData.mode

  const data = await apiFetch('/api/askfirst', {
    method:  'POST',
    body:    JSON.stringify({ action: 'prepare', situation }),
  })
  return { checklist: data.checklist, mode: _mode }
}

/**
 * Record an answer (or could-not-check) for a checklist question.
 * Returns { followUp: { question, why } | null }.
 *
 * @param {string} questionId
 * @param {string} answer        — empty string when status is 'could-not-check'
 * @param {'answered'|'could-not-check'} status
 */
export async function apiAnswer(questionId, answer, status) {
  if (!_sessionId) {
    throw new Error('No active session. Please start from the beginning.')
  }
  const data = await apiFetch('/api/askfirst', {
    method: 'POST',
    body:   JSON.stringify({
      action:      'answer',
      question_id: questionId,
      answer:      answer ?? '',
      status,
    }),
  })
  // Backend returns { followUp: ... } — camelCase already matches frontend contract
  return { followUp: data.followUp ?? null }
}

/**
 * Trigger the summarize action on the backend.
 * Returns { ok: true, pointsToClarify: string[] }.
 */
export async function apiSummarize() {
  if (!_sessionId) {
    // No session yet — return an empty summary rather than crashing
    return { ok: true, pointsToClarify: [] }
  }
  return apiFetch('/api/askfirst', {
    method: 'POST',
    body:   JSON.stringify({ action: 'summarize' }),
  })
}
