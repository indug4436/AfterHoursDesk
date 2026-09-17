/**
 * Overnight / after-hours / last-vs-prior-close print.
 * Prefer Stooq (free, no key) → Finnhub if FINNHUB_API_KEY → Yahoo chart (free public, no paid key).
 * NEVER invent %. On fail: pct null + honest note.
 */
const UA =
  'Mozilla/5.0 (compatible; AfterHoursDesk/1.0; +https://localhost; research desk)';

/** @type {{ ok: boolean, as_of?: string, provider?: string } | null} */
let lastSuccess = null;
let lastProbeOk = false;

function roundPct(n) {
  return Math.round(Number(n) * 100) / 100;
}

function symToStooq(symbol) {
  const s = String(symbol || 'NVDA').toUpperCase().replace(/[^A-Z0-9.-]/g, '');
  // US equities on Stooq use .US suffix
  if (s.includes('.')) return s.toLowerCase();
  return `${s.toLowerCase()}.us`;
}

async function fetchText(url, timeoutMs = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': UA, Accept: 'text/csv,application/json,*/*' },
      redirect: 'follow',
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, text };
  } finally {
    clearTimeout(t);
  }
}

async function fetchJson(url, timeoutMs = 8000) {
  const { ok, status, text } = await fetchText(url, timeoutMs);
  if (!ok) {
    const e = new Error(`HTTP ${status}: ${text.slice(0, 120)}`);
    e.status = status;
    throw e;
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`non-JSON from ${url.slice(0, 60)}`);
  }
}

/**
 * Stooq daily CSV — last vs prior close.
 * https://stooq.com/q/d/l/?s=nvda.us&i=d
 */
async function fetchStooq(symbol) {
  const s = symToStooq(symbol);
  const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(s)}&i=d`;
  const { ok, status, text } = await fetchText(url);
  if (!ok) throw new Error(`Stooq HTTP ${status}`);
  // Bot challenge / HTML → fail honestly
  if (/<!DOCTYPE|<html|__verify|requires JavaScript/i.test(text)) {
    throw new Error('Stooq blocked (bot challenge / JS verify)');
  }
  const lines = text
    .trim()
    .split(/\r?\n/)
    .filter((l) => l && !/^Date/i.test(l));
  if (lines.length < 2) throw new Error('Stooq returned insufficient daily rows');

  // Stooq daily is usually oldest→newest; parse Close column (index 4)
  const closes = [];
  for (const line of lines) {
    const parts = line.split(',');
    if (parts.length < 5) continue;
    const close = Number(parts[4]);
    const date = parts[0];
    if (Number.isFinite(close)) closes.push({ date, close });
  }
  if (closes.length < 2) throw new Error('Stooq parse: need ≥2 closes');

  const prior = closes[closes.length - 2];
  const last = closes[closes.length - 1];
  const pct = roundPct(((last.close - prior.close) / prior.close) * 100);
  const as_of = new Date().toISOString();
  return {
    pct,
    note: `Last vs prior close (Stooq daily ${prior.date}→${last.date})`,
    as_of,
    source: 'stooq',
  };
}

/**
 * Finnhub quote — current vs previous close.
 */
async function fetchFinnhub(symbol) {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new Error('FINNHUB_API_KEY not set');
  const sym = String(symbol || 'NVDA').toUpperCase();
  const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(sym)}&token=${encodeURIComponent(key)}`;
  const data = await fetchJson(url);
  const c = Number(data.c);
  const pc = Number(data.pc);
  if (!Number.isFinite(c) || !Number.isFinite(pc) || pc === 0) {
    throw new Error('Finnhub quote missing c/pc');
  }
  if (c === 0 && pc === 0) throw new Error('Finnhub returned empty quote');
  const pct = roundPct(((c - pc) / pc) * 100);
  const as_of =
    data.t && Number(data.t) > 0
      ? new Date(Number(data.t) * 1000).toISOString()
      : new Date().toISOString();
  return {
    pct,
    note: 'Last vs prior close (Finnhub quote)',
    as_of,
    source: 'finnhub',
  };
}

/**
 * Yahoo chart (free public endpoint — no paid Yahoo key).
 * Uses regularMarketPrice vs chartPreviousClose when available,
 * else last two daily closes.
 */
async function fetchYahooChart(symbol) {
  const sym = String(symbol || 'NVDA').toUpperCase();
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=5d`;
  const data = await fetchJson(url);
  const result = data?.chart?.result?.[0];
  if (!result) throw new Error('Yahoo chart empty result');
  const meta = result.meta || {};
  const price = Number(meta.regularMarketPrice);
  const prev = Number(meta.chartPreviousClose ?? meta.previousClose);
  let pct;
  let note;
  if (Number.isFinite(price) && Number.isFinite(prev) && prev !== 0) {
    pct = roundPct(((price - prev) / prev) * 100);
    note = 'Last vs prior close (Yahoo chart free public)';
  } else {
    const closes = (result.indicators?.quote?.[0]?.close || []).filter((x) =>
      Number.isFinite(x)
    );
    if (closes.length < 2) throw new Error('Yahoo chart insufficient closes');
    const last = closes[closes.length - 1];
    const prior = closes[closes.length - 2];
    pct = roundPct(((last - prior) / prior) * 100);
    note = 'Last vs prior daily close (Yahoo chart free public)';
  }
  return {
    pct,
    note,
    as_of: new Date().toISOString(),
    source: 'yahoo-chart',
  };
}

/**
 * Probe whether any free market provider is reachable (no invent %).
 */
export async function probeMarket() {
  // Lightweight Stooq probe
  try {
    const s = symToStooq('AAPL');
    const { ok, text } = await fetchText(
      `https://stooq.com/q/d/l/?s=${encodeURIComponent(s)}&i=d`,
      5000
    );
    if (ok && text && !/<!DOCTYPE|<html|__verify/i.test(text) && /,/u.test(text)) {
      lastProbeOk = true;
      return { ok: true, provider: 'stooq' };
    }
  } catch {
    /* continue */
  }
  if (process.env.FINNHUB_API_KEY) {
    try {
      await fetchFinnhub('AAPL');
      lastProbeOk = true;
      return { ok: true, provider: 'finnhub' };
    } catch {
      /* continue */
    }
  }
  try {
    const r = await fetchYahooChart('AAPL');
    if (r && r.pct !== null && r.pct !== undefined) {
      lastProbeOk = true;
      return { ok: true, provider: 'yahoo-chart' };
    }
  } catch {
    /* continue */
  }
  lastProbeOk = false;
  return { ok: false };
}

/**
 * Fetch overnight / last-vs-prior move for symbol.
 * @returns {{ pct: number|null, note: string, as_of?: string, source?: string }}
 */
export async function fetchOvernightMove(symbol = 'NVDA') {
  const sym = String(symbol || 'NVDA').toUpperCase();
  const errors = [];

  // 1) Stooq
  try {
    const r = await fetchStooq(sym);
    lastSuccess = { ok: true, as_of: r.as_of, provider: r.source };
    lastProbeOk = true;
    return r;
  } catch (err) {
    errors.push(`stooq: ${String(err.message || err).slice(0, 80)}`);
  }

  // 2) Finnhub (optional key)
  if (process.env.FINNHUB_API_KEY) {
    try {
      const r = await fetchFinnhub(sym);
      lastSuccess = { ok: true, as_of: r.as_of, provider: r.source };
      lastProbeOk = true;
      return r;
    } catch (err) {
      errors.push(`finnhub: ${String(err.message || err).slice(0, 80)}`);
    }
  }

  // 3) Yahoo chart free public (no paid key) — documented fallback when Stooq blocked
  try {
    const r = await fetchYahooChart(sym);
    lastSuccess = { ok: true, as_of: r.as_of, provider: r.source };
    lastProbeOk = true;
    return r;
  } catch (err) {
    errors.push(`yahoo-chart: ${String(err.message || err).slice(0, 80)}`);
  }

  return {
    pct: null,
    note: `Overnight % unavailable — ${errors.join('; ') || 'no market provider reachable'}`,
    as_of: new Date().toISOString(),
  };
}

/** Alias used by brief pipeline */
export async function marketLive(symbol) {
  return fetchOvernightMove(symbol);
}

/**
 * Health: true after successful print this process, or provider probe OK.
 * Does not invent %.
 */
export function marketHealthLive() {
  if (lastSuccess?.ok) return true;
  return lastProbeOk;
}

export function marketLastProvider() {
  return lastSuccess?.provider || null;
}

/** Configured = always true for free Stooq/Yahoo path (no key required) */
export function marketConfigured() {
  return true;
}
