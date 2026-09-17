/**
 * Brief orchestration: sources + market + skills + LLM → API response.
 * Single-flight: at most one brief in flight per process (429 if busy).
 */
import { randomUUID } from 'node:crypto';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchSources, sourcesLive } from './sources.mjs';
import { synthesize, llmLive, llmModel, templateForMyDesk, normalizeChecklistEcho } from './llm.mjs';
import {
  fetchOvernightMove,
  marketHealthLive,
  marketLastProvider,
  probeMarket,
} from './market.mjs';
import { runResearchSkills, skillsHealthLive } from './skills.mjs';
import { pushRecentSession } from './desk_state.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sessions = new Map();
let sampleWritten = false;

/** Single-flight gate */
let briefInflight = false;


function filterCrossTickerSources(sources, symbol) {
  const sym = (symbol || 'NVDA').toUpperCase();
  if (sym === 'NVDA') return sources;
  return (sources || []).filter(
    (src) => !/\b(Nvidia|NVDA)\b/i.test(src.title || '')
  );
}

const NVDA_LEAK_RE = /\b(Nvidia|NVDA)\b/gi;

const DISCLAIMER =
  'Not financial advice. Human decides. No live orders.';

function scrubCrossTickerLeak(brief, symbol) {
  const sym = (symbol || 'NVDA').toUpperCase();
  if (sym === 'NVDA') return brief;

  const scrubText = (t) => {
    if (typeof t !== 'string') return t;
    return t.replace(NVDA_LEAK_RE, sym);
  };

  brief.headline = scrubText(brief.headline);
  brief.claims = (brief.claims || []).map((c) => ({
    ...c,
    text: scrubText(c.text),
  }));

  const hasLeak = (brief.watch_at_open || []).some((w) =>
    /\b(Nvidia|NVDA)\b/i.test(w)
  );
  if (hasLeak || !(brief.watch_at_open && brief.watch_at_open.length)) {
    brief.watch_at_open = [
      `Does any ${sym} after-hours print hold in the first 15 minutes of regular session?`,
      `Check ${sym} premarket volume vs 20-day average — thin print = fade risk`,
      `Scan ${sym} peers / sector for confirmation or divergence`,
      `Note any official ${sym} commentary that supersedes hearsay into the open`,
    ];
  } else {
    brief.watch_at_open = brief.watch_at_open.map(scrubText);
  }

  return brief;
}

export function isBriefInflight() {
  return briefInflight;
}

export function computeMode() {
  const liveLlm = llmLive();
  const liveSrc = sourcesLive();
  // live if llm+sources both live (market/skills can be partial)
  if (liveLlm && liveSrc) return 'live';
  if (liveLlm || liveSrc || marketHealthLive() || skillsHealthLive())
    return 'partial';
  return 'mock';
}

export function healthPayload() {
  return {
    ok: true,
    product: 'AfterHoursDesk',
    track_hint: 'AI Trading Desk',
    live_llm: llmLive(),
    live_sources: sourcesLive(),
    live_market: marketHealthLive(),
    live_skills: skillsHealthLive(),
    mode: computeMode(),
    brief_inflight: briefInflight,
  };
}

/** Optional async health enrichment (Stooq/Yahoo probe) — non-blocking for callers that await */
export async function healthPayloadAsync() {
  if (!marketHealthLive()) {
    try {
      await probeMarket();
    } catch {
      /* ignore */
    }
  }
  return healthPayload();
}

export function getSession(id) {
  return sessions.get(id) || null;
}

async function maybeWriteSampleLog(payload) {
  if (sampleWritten) return;
  sampleWritten = true;
  const logsDir = join(__dirname, '..', 'logs');
  await mkdir(logsDir, { recursive: true });
  const lines = [
    '# Sample session — AfterHoursDesk',
    '',
    `- session_id: \`${payload.session_id}\``,
    `- mode: **${payload.mode}**`,
    `- symbol: ${payload.symbol}`,
    `- question: ${payload.question}`,
    `- llm: ${payload.llm.mode} / ${payload.llm.model}`,
    `- market: ${payload.market?.mode} / ${payload.market?.provider || 'n/a'}`,
    `- skills: ${payload.skills?.mode}`,
    `- generated_at: ${new Date().toISOString()}`,
    '',
    '## Headline',
    '',
    payload.brief.headline,
    '',
    '## Overnight move',
    '',
    `- pct: ${payload.brief.overnight_move?.pct ?? 'null'}`,
    `- note: ${payload.brief.overnight_move?.note ?? ''}`,
    `- source: ${payload.brief.overnight_move?.source ?? 'n/a'}`,
    '',
    '## Claims',
    '',
    ...payload.brief.claims.map(
      (c) => `- [${c.as_of}] (${c.source_id}) ${c.text}`
    ),
    '',
    '## Skill digest',
    '',
    ...(payload.brief.skill_digest || []).map(
      (s) => `- **${s.skill}** (${s.mode}): ${s.summary}`
    ),
    '',
    '## Watch at open',
    '',
    ...payload.brief.watch_at_open.map((w) => `- ${w}`),
    '',
    '## Sources',
    '',
    ...payload.sources.map(
      (s) =>
        `- **${s.id}** [rank ${s.rank ?? '?'}] ${s.host || ''} — ${s.title} — ${s.url} (${s.published_at})`
    ),
    '',
    '## Disclaimer',
    '',
    payload.brief.disclaimer,
    '',
  ];
  await writeFile(join(logsDir, 'sample-session.md'), lines.join('\n'), 'utf8');
}

/**
 * Resolve overnight_move: prefer live market always.
 * Fixtures may supply mock overnight ONLY when overall sources are mock AND symbol is NVDA.
 */
async function resolveOvernight(symbol, sourcePack) {
  const sym = (symbol || 'NVDA').toUpperCase();
  const marketMove = await fetchOvernightMove(sym);

  if (marketMove.pct !== null && marketMove.pct !== undefined) {
    return {
      overnight_move: marketMove,
      market: { mode: 'live', provider: marketMove.source || marketLastProvider() },
    };
  }

  // Market failed — keep null+note from market; optionally overlay NVDA fixture %
  // ONLY when sources are mock AND symbol is NVDA (prefer market first always — already tried)
  const fixtureOm = sourcePack?.overnight_move;
  if (
    sourcePack?.mode === 'mock' &&
    sym === 'NVDA' &&
    fixtureOm &&
    fixtureOm.pct !== null &&
    fixtureOm.pct !== undefined
  ) {
    return {
      overnight_move: {
        pct: fixtureOm.pct,
        note: `${fixtureOm.note || 'LABELED MOCK overnight'} (market: ${marketMove.note})`,
        as_of: fixtureOm.as_of || new Date().toISOString(),
        source: 'fixture',
      },
      market: {
        mode: 'mock',
        provider: null,
        note: marketMove.note,
      },
    };
  }

  return {
    overnight_move: {
      pct: null,
      note: marketMove.note || 'Unavailable — no market print',
      as_of: marketMove.as_of || new Date().toISOString(),
      source: marketMove.source,
    },
    market: {
      mode: 'mock',
      provider: null,
      note: marketMove.note,
    },
  };
}


/**
 * Peer overnight strip for watchlist (cap 4, parallel, honest null).
 */
async function fetchPeerOvernightStrip(deskCtx, primarySym) {
  if (!deskCtx || !Array.isArray(deskCtx.watchlist) || deskCtx.watchlist.length <= 1) {
    return [];
  }
  const primary = String(primarySym || '').toUpperCase();
  const peers = deskCtx.watchlist
    .map((t) => String(t).toUpperCase().trim())
    .filter((t) => t && t !== primary)
    .slice(0, 4);
  if (!peers.length) return [];

  const PEER_TIMEOUT_MS = 6_000;
  const results = await Promise.allSettled(
    peers.map(async (symbol) => {
      const move = await Promise.race([
        fetchOvernightMove(symbol),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('peer overnight timeout')), PEER_TIMEOUT_MS)
        ),
      ]);
      return {
        symbol,
        pct: move?.pct ?? null,
        note: move?.note || (move?.pct == null ? 'overnight unavailable' : ''),
        source: move?.source || null,
      };
    })
  );

  return results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    return {
      symbol: peers[i],
      pct: null,
      note: 'peer overnight unavailable',
      source: null,
    };
  });
}

function applyChecklistStatuses(brief, deskCtx, sym, sources) {
  if (!brief?.for_my_desk) return;
  const ctx = {
    overnight_move: brief.overnight_move,
    claims: brief.claims || [],
    sources: sources || [],
  };
  const raw = brief.for_my_desk.checklist_echo;
  brief.for_my_desk.checklist_echo = normalizeChecklistEcho(
    Array.isArray(raw) && raw.length
      ? raw
      : deskCtx?.my_checklist || [],
    ctx
  );
}

/**
 * Build a full brief response for POST /api/brief
 * Throws err.status = 429 if another brief is in flight.
 */
export async function buildBrief({ question, symbol, desk_context }) {
  if (!question || typeof question !== 'string' || !question.trim()) {
    const e = new Error('missing question');
    e.status = 400;
    throw e;
  }

  if (briefInflight) {
    const e = new Error(
      'A brief is already running — wait or cancel.'
    );
    e.status = 429;
    e.code = 'brief_in_flight';
    throw e;
  }

  briefInflight = true;
  try {
    const sym = (symbol || 'NVDA').toUpperCase();

    // Parallel gather: sources + market + skills
    const [sourcePack, skillsPack] = await Promise.all([
      fetchSources(sym),
      runResearchSkills(sym),
    ]);

    const { overnight_move, market } = await resolveOvernight(sym, sourcePack);

    // Feed authoritative overnight into LLM context
    const packForLlm = {
      ...sourcePack,
      overnight_move,
      skill_digest: skillsPack.digests,
    };

    const deskCtx = desk_context && typeof desk_context === 'object'
      ? desk_context
      : null;

    // Peer overnight strip (cheap parallel) alongside LLM
    const peerPromise = deskCtx
      ? fetchPeerOvernightStrip(deskCtx, sym)
      : Promise.resolve([]);

    let [{ mode: llmMode, model, brief, fallbackReason }, peer_overnight] =
      await Promise.all([
        synthesize({
          question: question.trim(),
          symbol: sym,
          sourcePack: packForLlm,
          desk_context: deskCtx,
        }),
        peerPromise,
      ]);

    // Market adapter is authoritative for overnight when it succeeded
    brief.overnight_move = overnight_move;
    brief.skill_digest = skillsPack.digests;
    brief.disclaimer = DISCLAIMER;

    brief = scrubCrossTickerLeak(brief, sym);

    const desk_applied = Boolean(deskCtx);
    if (desk_applied && !brief.for_my_desk) {
      // Safety net — llm.mjs should already template; keep personalization honest
      brief.for_my_desk = templateForMyDesk(deskCtx, sym, {
        overnight_move,
        claims: brief.claims || [],
        sources: sourcePack.sources || [],
      });
    }
    if (desk_applied && brief.for_my_desk) {
      applyChecklistStatuses(brief, deskCtx, sym, sourcePack.sources || []);
    }

    const session_id = randomUUID();
    const briefOut = {
      headline: brief.headline,
      overnight_move: brief.overnight_move,
      claims: brief.claims || [],
      watch_at_open: brief.watch_at_open || [],
      skill_digest: brief.skill_digest || [],
      disclaimer: brief.disclaimer,
    };
    if (desk_applied && brief.for_my_desk) {
      briefOut.for_my_desk = brief.for_my_desk;
    }
    if (desk_applied && Array.isArray(peer_overnight) && peer_overnight.length) {
      briefOut.peer_overnight = peer_overnight;
    }

    const payload = {
      mode: computeMode(),
      symbol: sym,
      question: question.trim(),
      brief: briefOut,
      sources: filterCrossTickerSources(sourcePack.sources, sym),
      llm: { mode: llmMode, model: model || llmModel(), ...(fallbackReason ? { fallbackReason } : {}) },
      market,
      skills: (() => {
        const digests = skillsPack.digests || [];
        const anyLive = digests.some((d) => d.mode === 'live');
        const anyMock = digests.some((d) => d.mode !== 'live');
        const mode = anyLive && anyMock ? 'partial' : anyLive ? 'live' : 'mock';
        return { mode, used: skillsPack.used, digests };
      })(),
      session_id,
      desk_applied,
    };

    sessions.set(session_id, {
      ...payload,
      stored_at: new Date().toISOString(),
    });
    if (sessions.size > 100) {
      const first = sessions.keys().next().value;
      sessions.delete(first);
    }

    await maybeWriteSampleLog(payload).catch(() => {});
    await pushRecentSession({
      session_id,
      symbol: sym,
      headline: brief.headline,
      at: new Date().toISOString(),
    }).catch(() => {});

    return payload;
  } finally {
    briefInflight = false;
  }
}
