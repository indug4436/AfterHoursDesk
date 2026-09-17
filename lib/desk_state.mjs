/**
 * Desk state — profile / watchlist / checklist / last-N session recall.
 * Persist to data/desk-state.json (gitignored). Seed defaults for DEMO.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const STATE_FILE = join(DATA_DIR, 'desk-state.json');
const MAX_RECENT = 5;

export const DEFAULT_DESK_STATE = {
  profile: {
    segment: 'Asia overnight US equities',
    risk_note: 'No leverage; size small at open',
    standing_thesis: 'AI infra leaders on dips; avoid chase after +3% AH',
  },
  watchlist: ['NVDA', 'AAPL', 'MSFT'],
  my_checklist: [
    'Confirm AH vs prior close',
    'Check guidance headlines',
  ],
  recent_sessions: [],
  updated_at: null,
};

function normalizeWatchlist(list) {
  if (!Array.isArray(list)) return undefined;
  return list
    .map((t) => String(t || '').trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 8);
}

function normalizeChecklist(list) {
  if (!Array.isArray(list)) return undefined;
  return list
    .map((s) => String(s || '').trim())
    .filter(Boolean)
    .slice(0, 8);
}

function normalizeProfile(profile) {
  if (!profile || typeof profile !== 'object') return undefined;
  const out = {};
  if (profile.segment !== undefined) {
    out.segment = String(profile.segment || '').trim();
  }
  if (profile.risk_note !== undefined) {
    out.risk_note = String(profile.risk_note || '').trim();
  }
  if (profile.standing_thesis !== undefined) {
    out.standing_thesis = String(profile.standing_thesis || '').trim();
  }
  return out;
}

function cloneDefault() {
  return {
    profile: { ...DEFAULT_DESK_STATE.profile },
    watchlist: [...DEFAULT_DESK_STATE.watchlist],
    my_checklist: [...DEFAULT_DESK_STATE.my_checklist],
    recent_sessions: [],
    updated_at: DEFAULT_DESK_STATE.updated_at,
  };
}

/**
 * Load desk state from disk; seed defaults when missing/corrupt.
 */
export async function loadDeskState() {
  try {
    const raw = await readFile(STATE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    const base = cloneDefault();
    const profile = {
      ...base.profile,
      ...(normalizeProfile(parsed.profile) || {}),
    };
    // Also accept flat profile fields at top level (partial PUT shape)
    if (parsed.segment !== undefined) profile.segment = String(parsed.segment || '').trim();
    if (parsed.risk_note !== undefined) profile.risk_note = String(parsed.risk_note || '').trim();
    if (parsed.standing_thesis !== undefined) {
      profile.standing_thesis = String(parsed.standing_thesis || '').trim();
    }
    return {
      profile,
      watchlist: normalizeWatchlist(parsed.watchlist) || base.watchlist,
      my_checklist: normalizeChecklist(parsed.my_checklist) || base.my_checklist,
      recent_sessions: Array.isArray(parsed.recent_sessions)
        ? parsed.recent_sessions.slice(0, MAX_RECENT)
        : [],
      updated_at: parsed.updated_at || null,
    };
  } catch {
    return cloneDefault();
  }
}

/**
 * Merge partial body into current state and persist.
 * Accepts { profile, watchlist, my_checklist } or flat profile fields.
 */
export async function saveDeskState(partial = {}) {
  const current = await loadDeskState();
  const next = {
    profile: { ...current.profile },
    watchlist: [...current.watchlist],
    my_checklist: [...current.my_checklist],
    recent_sessions: [...(current.recent_sessions || [])],
  };

  const profilePatch = normalizeProfile(partial.profile);
  if (profilePatch) Object.assign(next.profile, profilePatch);
  if (partial.segment !== undefined) {
    next.profile.segment = String(partial.segment || '').trim();
  }
  if (partial.risk_note !== undefined) {
    next.profile.risk_note = String(partial.risk_note || '').trim();
  }
  if (partial.standing_thesis !== undefined) {
    next.profile.standing_thesis = String(partial.standing_thesis || '').trim();
  }

  const wl = normalizeWatchlist(partial.watchlist);
  if (wl) next.watchlist = wl;

  const cl = normalizeChecklist(partial.my_checklist);
  if (cl) next.my_checklist = cl;

  if (Array.isArray(partial.recent_sessions)) {
    next.recent_sessions = partial.recent_sessions.slice(0, MAX_RECENT);
  }

  next.updated_at = new Date().toISOString();

  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(STATE_FILE, JSON.stringify(next, null, 2), 'utf8');
  return next;
}

/**
 * Push a brief session onto recent_sessions (N≤5, newest first).
 */
export async function pushRecentSession({ session_id, symbol, headline, at }) {
  const current = await loadDeskState();
  const entry = {
    session_id: session_id || null,
    symbol: String(symbol || '').toUpperCase(),
    headline: String(headline || '').slice(0, 200),
    at: at || new Date().toISOString(),
  };
  const filtered = (current.recent_sessions || []).filter(
    (s) => s.session_id !== entry.session_id
  );
  const recent_sessions = [entry, ...filtered].slice(0, MAX_RECENT);
  return saveDeskState({
    profile: current.profile,
    watchlist: current.watchlist,
    my_checklist: current.my_checklist,
    recent_sessions,
  });
}

/**
 * Build desk_context payload from saved state (for brief personalization).
 */
export function toDeskContext(state) {
  if (!state) return null;
  return {
    segment: state.profile?.segment || '',
    risk_note: state.profile?.risk_note || '',
    standing_thesis: state.profile?.standing_thesis || '',
    watchlist: [...(state.watchlist || [])],
    my_checklist: [...(state.my_checklist || [])],
  };
}
