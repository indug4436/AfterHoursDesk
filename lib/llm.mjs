/**
 * LLM adapter — OpenAI-compatible (Qwen later) or LABELED MOCK from fixtures.
 * When desk_context present, returns for_my_desk personalization (live or template).
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(__dirname, '..', 'fixtures');

export function llmLive() {
  return Boolean(process.env.LLM_API_KEY);
}

export function llmModel() {
  return process.env.LLM_MODEL || 'mock-fixture';
}

async function loadMockBrief() {
  const raw = await readFile(join(FIXTURES, 'mock-brief.json'), 'utf8');
  return JSON.parse(raw);
}

/**
 * Honest template personalization from desk_context (used on mock / fallback).
 */
const AH_ITEM_RE = /\b(AH|after[- ]?hours|overnight|prior close|pre[- ]?market)\b/i;
const GUIDANCE_ITEM_RE = /guidance|headline|outlook|forecast|earnings|analyst/i;
const GUIDANCE_CONTENT_RE = /guidance|outlook|forecast|earnings|analyst/i;

/**
 * Normalize checklist_echo to [{ item, status, note }].
 * Honest local heuristics vs overnight print + headlines/claims.
 */
export function normalizeChecklistEcho(items, ctx = {}) {
  const overnight = ctx.overnight_move || {};
  const pct = overnight.pct;
  const hasPct = pct !== null && pct !== undefined && Number.isFinite(Number(pct));
  const blobs = [];
  for (const c of ctx.claims || []) {
    if (c?.text) blobs.push(String(c.text));
  }
  for (const s of ctx.sources || []) {
    if (s?.title) blobs.push(String(s.title));
    if (s?.snippet) blobs.push(String(s.snippet));
  }
  for (const h of ctx.headlines || []) {
    if (typeof h === 'string') blobs.push(h);
    else if (h?.title) blobs.push(String(h.title));
  }
  const corpus = blobs.join(' \n ');
  const hasGuidanceKw = GUIDANCE_CONTENT_RE.test(corpus);

  const raw = Array.isArray(items) && items.length
    ? items
    : ['Confirm AH vs prior close', 'Review standing thesis before size'];

  return raw.map((entry) => {
    let item;
    let status;
    let note;
    if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
      item = String(entry.item || entry.text || entry.label || '').trim();
      status = entry.status;
      note = entry.note;
    } else {
      item = String(entry || '').trim();
    }
    // Strip legacy [PASS]/ prefixes if present
    const pref = item.match(/^\[(PASS|WARN|FAIL)\]\s*(.*)$/i);
    if (pref) {
      if (!status) status = pref[1].toLowerCase();
      item = pref[2].trim();
    }
    if (!item) item = 'Checklist item';

    if (!status || !['pass', 'warn', 'fail'].includes(String(status).toLowerCase())) {
      if (AH_ITEM_RE.test(item)) {
        if (hasPct) {
          status = 'pass';
          note = note || `overnight ${Number(pct)}%`;
        } else {
          status = 'warn';
          note = note || 'overnight print unavailable';
        }
      } else if (GUIDANCE_ITEM_RE.test(item)) {
        if (hasGuidanceKw) {
          status = 'pass';
          note = note || 'guidance/earnings keyword in headlines';
        } else {
          status = 'warn';
          note = note || 'no guidance keyword in headlines yet';
        }
      } else {
        status = 'warn';
        note = note || 'review manually';
      }
    } else {
      status = String(status).toLowerCase();
      note = note || (status === 'pass' ? 'ok' : status === 'fail' ? 'needs attention' : 'review manually');
    }

    return { item, status, note: String(note) };
  });
}

/**
 * Honest template personalization from desk_context (used on mock / fallback).
 * Checklist statuses filled later by normalizeChecklistEcho when overnight/claims known.
 */
export function templateForMyDesk(desk_context, symbol, ctx = {}) {
  if (!desk_context) return null;
  const sym = (symbol || 'NVDA').toUpperCase();
  const thesis =
    desk_context.standing_thesis ||
    'No standing thesis set — treat this as a generic overnight scan.';
  const watchlist = Array.isArray(desk_context.watchlist)
    ? desk_context.watchlist.map((t) => String(t).toUpperCase()).filter(Boolean)
    : [];
  const onList = watchlist.includes(sym);
  const peers = watchlist.filter((t) => t !== sym);
  const peerBit = peers.length
    ? `Peers on your desk: ${peers.join(', ')} — check for confirmation or divergence vs ${sym}.`
    : 'Watchlist has no other peers yet — add tickers to My desk for a portfolio angle.';
  const checklist = Array.isArray(desk_context.my_checklist)
    ? desk_context.my_checklist.map((s) => String(s).trim()).filter(Boolean)
    : [];

  return {
    thesis_fit: onList
      ? `${sym} is on your watchlist. Standing thesis: "${thesis}". Weigh this overnight print against that thesis before sizing at open — human decides.`
      : `${sym} is not on your saved watchlist. Standing thesis: "${thesis}". Decide whether this name fits before acting — human decides.`,
    watchlist_angle: onList
      ? `${sym} is a named desk name. ${peerBit}`
      : `${sym} is off-list. ${peerBit}`,
    checklist_echo: normalizeChecklistEcho(
      checklist.length
        ? checklist
        : ['Confirm AH vs prior close', 'Review standing thesis before size'],
      ctx
    ),
  };
}

function applySymbolRewrite(brief, symbol) {
  const sym = (symbol || 'NVDA').toUpperCase();
  if (sym === 'NVDA') return brief;
  brief.overnight_move = brief.overnight_move || {
    pct: null,
    note: `Overnight % unavailable — no fixture corpus for ${sym}`,
  };
  brief.headline = `${sym}: overnight % unavailable in mock — review labeled headlines into the open`;
  brief.claims = (brief.claims || []).map((c) => ({
    ...c,
    text: c.text.replace(/Nvidia/gi, sym).replace(/NVDA/g, sym),
  }));
  brief.watch_at_open = [
    `Does any ${sym} after-hours print hold in the first 15 minutes of regular session?`,
    `Check ${sym} premarket volume vs 20-day average — thin print = fade risk`,
    `Scan ${sym} peers / sector for confirmation or divergence`,
    `Note any official ${sym} commentary that supersedes hearsay into the open`,
  ];
  return brief;
}

/**
 * Synthesize brief from question + source pack + optional desk_context.
 * @returns {{ mode: 'mock'|'live', model: string, brief: object, fallbackReason?: string }}
 */
export async function synthesize({ question, symbol, sourcePack, desk_context }) {
  const hasDesk = Boolean(desk_context);

  if (!llmLive()) {
    let brief = await loadMockBrief();
    const sym = (symbol || 'NVDA').toUpperCase();
    if (sym !== 'NVDA') {
      brief.overnight_move = sourcePack?.overnight_move || {
        pct: null,
        note: `Overnight % unavailable — no fixture corpus for ${sym}`,
      };
      brief = applySymbolRewrite(brief, sym);
    }
    if (hasDesk) {
      brief.for_my_desk = templateForMyDesk(desk_context, sym);
    }
    return {
      mode: 'mock',
      model: 'labeled-mock-fixture',
      brief: {
        ...brief,
        disclaimer:
          brief.disclaimer ||
          'Not financial advice. Human decides. No live orders.',
      },
    };
  }

  try {
    const base = (
      process.env.LLM_BASE_URL || 'https://api.openai.com/v1'
    ).replace(/\/$/, '');
    const model = process.env.LLM_MODEL || 'gpt-4o-mini';

    const deskJsonHint = hasDesk
      ? `,
  "for_my_desk": {
    "thesis_fit": "1–3 sentences on how this brief hits the trader's standing_thesis and risk_note",
    "watchlist_angle": "why this symbol matters vs their watchlist peers",
    "checklist_echo": [{"item":"from my_checklist","status":"pass|warn|fail","note":"short reason"}]
  }`
      : '';

    const deskRules = hasDesk
      ? `
When desk_context is provided you MUST include for_my_desk. Personalize thesis_fit from standing_thesis + symbol; watchlist_angle from watchlist peers; checklist_echo from my_checklist as objects {item,status,note} when possible (status pass/warn/fail vs overnight print / headlines; do not invent empty fluff). Segment and risk_note may inform tone. Never invent orders.`
      : '';

    const system = `You are AfterHoursDesk, an overnight US equity brief desk for Asia/EU traders.
Extract dated claims from the provided sources and synthesize a one-page brief.
Human decides; never recommend auto-orders. Return ONLY valid JSON matching:
{
  "headline": string,
  "overnight_move": { "pct": number|null, "note": string },
  "claims": [{ "text": string, "as_of": "YYYY-MM-DD", "source_id": string }],
  "watch_at_open": [string]${deskJsonHint},
  "disclaimer": "Not financial advice. Human decides. No live orders."
}
Use only the given source ids. Do not invent sources.
Use ONLY the provided overnight_move (do not invent pct). Claims must match the requested symbol only; never mention NVDA or Nvidia unless symbol is NVDA.
Be concise. Return JSON only — no chain-of-thought outside the JSON object. Max 4 claims, max 4 watch_at_open items.${deskRules}`;

    const leanSources = (sourcePack.sources || [])
      .slice(0, 8)
      .map(({ id, title, url, published_at, host, rank }) => ({
        id,
        title,
        url,
        published_at,
        host,
        rank,
      }));
    const leanSkills = (sourcePack.skill_digest || [])
      .slice(0, 5)
      .map(({ skill, mode, summary }) => ({
        skill,
        mode,
        summary: String(summary || '').slice(0, 240),
      }));
    const userPayload = {
      question,
      symbol: (symbol || 'NVDA').toUpperCase(),
      overnight_move: sourcePack.overnight_move,
      sources: leanSources,
      headlines: leanSources,
      skill_digest: leanSkills,
    };
    if (hasDesk) {
      userPayload.desk_context = desk_context;
    }

    let res;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 180000);
      try {
        res = await fetch(`${base}/chat/completions`, {
          method: 'POST',
          signal: ctrl.signal,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.LLM_API_KEY}`,
          },
          body: JSON.stringify({
            model,
            temperature: 0.2,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: JSON.stringify(userPayload) },
            ],
          }),
        });
      } finally {
        clearTimeout(timer);
      }
    } catch (err) {
      throw new Error(`LLM network: ${err.message}`);
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`LLM upstream ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('LLM returned empty content');
    }

    let brief;
    try {
      brief = JSON.parse(content);
    } catch {
      throw new Error('LLM returned non-JSON brief');
    }

    if (!brief.disclaimer) {
      brief.disclaimer =
        'Not financial advice. Human decides. No live orders.';
    }

    // Ensure for_my_desk when desk_context was sent (template fill if LLM omitted)
    if (hasDesk) {
      const t = templateForMyDesk(desk_context, symbol);
      const fmd = brief.for_my_desk || {};
      brief.for_my_desk = {
        thesis_fit: fmd.thesis_fit || t.thesis_fit,
        watchlist_angle: fmd.watchlist_angle || t.watchlist_angle,
        checklist_echo: Array.isArray(fmd.checklist_echo) && fmd.checklist_echo.length
          ? fmd.checklist_echo
          : t.checklist_echo,
      };
    }

    return { mode: 'live', model, brief };
  } catch (err) {
    // LABELED MOCK fallback — never pretend live succeeded
    const brief = await loadMockBrief();
    const sym = (symbol || 'NVDA').toUpperCase();
    brief.overnight_move = sourcePack.overnight_move || {
      pct: null,
      note: 'Overnight % unavailable',
    };
    if (sym !== 'NVDA') {
      brief.headline = `${sym} overnight brief (LABELED MOCK — live LLM failed)`;
      brief.claims = (brief.claims || []).map((c) => ({
        ...c,
        text: c.text.replace(/Nvidia|NVDA/gi, sym),
      }));
      brief.watch_at_open = [
        `Check ${sym} premarket gap vs prior close`,
        `Watch ${sym} volume vs 20-day average at the open`,
        'Confirm headlines against primary filings — mock fallback in use',
        'Human decides size and timing',
      ];
    } else {
      const pct = brief.overnight_move?.pct;
      const pctBit =
        pct === null || pct === undefined
          ? 'overnight % from market/note'
          : `${pct}% overnight print`;
      brief.headline = `NVDA ${pctBit} — LABELED MOCK synthesis (live LLM failed)`;
    }
    if (hasDesk) {
      brief.for_my_desk = templateForMyDesk(desk_context, sym);
    }
    brief.disclaimer =
      brief.disclaimer ||
      'Not financial advice. Human decides. No live orders.';
    return {
      mode: 'mock',
      model: 'labeled-mock-fallback',
      brief,
      fallbackReason: String(err.message || err).slice(0, 200),
    };
  }
}
