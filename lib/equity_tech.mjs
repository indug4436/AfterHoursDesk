/**
 * Free equity chart helpers (Yahoo) — RSI / SMA for AfterHoursDesk technical skill.
 * Not crypto; primary technical for US symbols (NVDA/AAPL/…).
 */

const UA =
  'Mozilla/5.0 (compatible; AfterHoursDesk/1.0; +https://localhost; research desk)';

/**
 * Wilder-style RSI from closes.
 * @param {number[]} closes
 * @param {number} [period=14]
 * @returns {number|null}
 */
export function computeRsi(closes, period = 14) {
  const c = (closes || []).filter((x) => Number.isFinite(x));
  if (c.length < period + 1) return null;
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const d = c[i] - c[i - 1];
    if (d >= 0) gains += d;
    else losses -= d;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period + 1; i < c.length; i++) {
    const d = c[i] - c[i - 1];
    const g = d > 0 ? d : 0;
    const l = d < 0 ? -d : 0;
    avgGain = (avgGain * (period - 1) + g) / period;
    avgLoss = (avgLoss * (period - 1) + l) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Math.round((100 - 100 / (1 + rs)) * 10) / 10;
}

function ema(values, period) {
  const k = 2 / (period + 1);
  let prev = values[0];
  const out = [prev];
  for (let i = 1; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    out.push(prev);
  }
  return out;
}

/**
 * Rough MACD histogram sign from closes (EMA12 - EMA26).
 * @returns {'bullish'|'bearish'|'flat'|null}
 */
export function macdHint(closes) {
  const c = (closes || []).filter((x) => Number.isFinite(x));
  if (c.length < 30) return null;
  const e12 = ema(c, 12);
  const e26 = ema(c, 26);
  const last = e12[e12.length - 1] - e26[e26.length - 1];
  const prev = e12[e12.length - 2] - e26[e26.length - 2];
  if (!Number.isFinite(last)) return null;
  if (last > 0 && last >= prev) return 'bullish';
  if (last < 0 && last <= prev) return 'bearish';
  return 'flat';
}

export function sma(closes, period) {
  const c = (closes || []).filter((x) => Number.isFinite(x));
  if (c.length < period) return null;
  const slice = c.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

/**
 * Fetch Yahoo daily chart closes for SYM.
 * @returns {{ closes: number[], last: number, prior: number|null, meta: object }}
 */
export async function fetchYahooEquityCloses(symbol, { range = '3mo', interval = '1d', signal } = {}) {
  const sym = String(symbol || 'NVDA').toUpperCase().replace(/[^A-Z0-9.^_-]/g, '');
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=${encodeURIComponent(interval)}&range=${encodeURIComponent(range)}`;
  const res = await fetch(url, {
    signal,
    headers: { 'User-Agent': UA, Accept: 'application/json,*/*' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`Yahoo chart HTTP ${res.status}`);
  const data = await res.json();
  const result = data?.chart?.result?.[0];
  if (!result) throw new Error('Yahoo chart empty');
  const quote = result.indicators?.quote?.[0];
  const raw = (quote?.close || []).filter((x) => Number.isFinite(x));
  if (raw.length < 2) throw new Error('Yahoo insufficient closes');
  const meta = result.meta || {};
  const lastMeta = Number(meta.regularMarketPrice);
  const last = Number.isFinite(lastMeta) ? lastMeta : raw[raw.length - 1];
  const prior =
    Number.isFinite(Number(meta.chartPreviousClose ?? meta.previousClose))
      ? Number(meta.chartPreviousClose ?? meta.previousClose)
      : raw.length >= 2
        ? raw[raw.length - 2]
        : null;
  return { closes: raw, last, prior, meta };
}

/**
 * Build equity technical summary for SYM.
 * @returns {{ summary: string, rsi: number|null, last: number, pct: number|null } | null}
 */
export async function equityTechnicalSummary(symbol, signal) {
  const sym = String(symbol || 'NVDA').toUpperCase();
  const { closes, last, prior } = await fetchYahooEquityCloses(sym, {
    range: '3mo',
    interval: '1d',
    signal,
  });
  const rsi = computeRsi(closes, 14);
  const sma20 = sma(closes, 20);
  const pct =
    prior && prior !== 0
      ? Math.round(((last - prior) / prior) * 1000) / 10
      : null;
  let rsiLabel = 'neutral';
  if (rsi != null) {
    if (rsi >= 70) rsiLabel = 'overbought';
    else if (rsi <= 30) rsiLabel = 'oversold';
  }
  let trend = '';
  if (sma20 != null && Number.isFinite(last)) {
    trend = last >= sma20 ? 'trend above SMA20' : 'trend below SMA20';
  }
  const macd = macdHint(closes);
  const bits = [
    `${sym} daily: last ${Number(last).toFixed(2)}` +
      (pct != null ? ` (${pct >= 0 ? '+' : ''}${pct}% vs prior)` : ''),
    rsi != null ? `RSI14 ${rsi} (${rsiLabel})` : null,
    trend || null,
    macd ? `MACD-ish ${macd}` : null,
  ].filter(Boolean);
  const summary = `${bits.join('; ')} — equity chart (Yahoo)`;
  return { summary, rsi, last, pct, sma20 };
}

/**
 * Quick VIX (or ^TNX) last level for macro fallback.
 */
export async function yahooMacroRisk(signal) {
  const trySym = async (ticker, label) => {
    const { last, prior } = await fetchYahooEquityCloses(ticker, {
      range: '5d',
      interval: '1d',
      signal,
    });
    const pct =
      prior && prior !== 0
        ? Math.round(((last - prior) / prior) * 1000) / 10
        : null;
    return {
      summary: `Macro risk: ${label} last ${Number(last).toFixed(2)}${
        pct != null ? ` (${pct >= 0 ? '+' : ''}${pct}% vs prior)` : ''
      } — Yahoo chart fallback`,
      last,
      ticker: label,
    };
  };
  try {
    return await trySym('^VIX', 'VIX');
  } catch {
    return await trySym('^TNX', '10Y yield (^TNX)');
  }
}
