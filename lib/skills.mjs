/**
 * Bitget research Skills as Desk perception (read-only).
 * Live path: public Bitget datahub MCP (no account key) + free Yahoo equity/macro.
 * Soft-fail to LABELED MOCK when all upstreams fail — never fake live.
 * Skills: macro, market-intel, news-briefing, sentiment, technical.
 *
 * Timeouts: per-tool MCP 5s; overall gather 20s.
 * Technical: EQUITY Yahoo RSI primary for SYM; BTC optional secondary crypto risk.
 * Macro: short-timeout MCP race + Yahoo VIX fallback (avoid rates_yields hang).
 * Sentiment: Fear&Greed tied to symbol thesis (no platform inventory dump).
 */

import { setMaxListeners } from 'node:events';
import {
  computeRsi,
  equityTechnicalSummary,
  yahooMacroRisk,
} from './equity_tech.mjs';

const SKILL_NAMES = [
  'macro',
  'market-intel',
  'news-briefing',
  'sentiment',
  'technical',
];

const DEFAULT_MCP = 'https://datahub.noxiaohao.com/mcp';
const TOOL_TIMEOUT_MS = 5_000;
const OVERALL_TIMEOUT_MS = 20_000;

/** Last runResearchSkills: true only if THAT run had ≥1 live digest. */
let lastSkillsLive = false;

function mcpUrl() {
  const explicit = String(process.env.BITGET_DATAHUB_MCP || '').trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const hub = String(process.env.BITGET_HUB_URL || '').trim();
  if (hub && (/\/mcp\/?$/i.test(hub) || /datahub/i.test(hub))) {
    return hub.replace(/\/$/, '');
  }
  return DEFAULT_MCP;
}

function mockDigest(skill, symbol, reason = 'datahub soft-fail') {
  const sym = String(symbol || 'NVDA').toUpperCase();
  return {
    skill,
    mode: 'mock',
    summary: `LABELED MOCK — ${reason} (${skill} for ${sym})`,
  };
}

function mockDigests(symbol, reason) {
  return SKILL_NAMES.map((skill) => mockDigest(skill, symbol, reason));
}

function parseSseJsonRpc(text) {
  const lines = String(text || '').split(/\r?\n/);
  let last = null;
  for (const line of lines) {
    const t = line.trim();
    if (!t.startsWith('data:')) continue;
    const payload = t.slice(5).trim();
    if (!payload || payload === '[DONE]') continue;
    try {
      last = JSON.parse(payload);
    } catch {
      /* keep scanning */
    }
  }
  if (last) return last;
  try {
    return JSON.parse(String(text || ''));
  } catch {
    return null;
  }
}

function extractToolPayload(rpc) {
  if (!rpc || typeof rpc !== 'object') return null;
  if (rpc.error) return null;
  const result = rpc.result;
  if (!result) return null;
  if (result.isError) return null;
  const content = result.content;
  if (Array.isArray(content) && content.length) {
    const text = content[0]?.text ?? content[0]?.data ?? null;
    if (typeof text === 'string') {
      try {
        return JSON.parse(text);
      } catch {
        return { _text: text };
      }
    }
    if (text && typeof text === 'object') return text;
  }
  if (result.structuredContent && typeof result.structuredContent === 'object') {
    return result.structuredContent;
  }
  return null;
}

function withTimeout(ms, signal) {
  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  if (signal) {
    if (signal.aborted) ctrl.abort();
    else signal.addEventListener('abort', onAbort, { once: true });
  }
  const timer = setTimeout(() => ctrl.abort(), ms);
  return {
    signal: ctrl.signal,
    clear: () => {
      clearTimeout(timer);
      if (signal) signal.removeEventListener('abort', onAbort);
    },
  };
}

/**
 * One MCP session for a runResearchSkills invocation.
 */
async function openMcpSession(overallSignal) {
  const url = mcpUrl();
  const initWrap = withTimeout(TOOL_TIMEOUT_MS, overallSignal);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'AfterHoursDesk', version: '1.0' },
        },
      }),
      signal: initWrap.signal,
    });
    const sessionId = res.headers.get('mcp-session-id');
    const bodyText = await res.text();
    if (!res.ok || !sessionId) {
      throw new Error(`MCP initialize failed HTTP ${res.status}`);
    }
    parseSseJsonRpc(bodyText);

    const notifyWrap = withTimeout(TOOL_TIMEOUT_MS, overallSignal);
    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
          'mcp-session-id': sessionId,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'notifications/initialized',
        }),
        signal: notifyWrap.signal,
      });
    } finally {
      notifyWrap.clear();
    }

    let nextId = 2;
    async function toolsCall(name, args, timeoutMs = TOOL_TIMEOUT_MS) {
      const wrap = withTimeout(timeoutMs, overallSignal);
      try {
        const r = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json, text/event-stream',
            'mcp-session-id': sessionId,
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: nextId++,
            method: 'tools/call',
            params: { name, arguments: args || {} },
          }),
          signal: wrap.signal,
        });
        const text = await r.text();
        if (!r.ok) throw new Error(`tools/call ${name} HTTP ${r.status}`);
        const rpc = parseSseJsonRpc(text);
        const payload = extractToolPayload(rpc);
        if (!payload) throw new Error(`tools/call ${name} empty/error`);
        return payload;
      } finally {
        wrap.clear();
      }
    }

    return { url, sessionId, toolsCall };
  } finally {
    initWrap.clear();
  }
}

function clip(s, n = 280) {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  return t.length <= n ? t : `${t.slice(0, n - 1)}…`;
}

function payloadHasUseful(p) {
  if (!p || typeof p !== 'object') return false;
  if (p._text && String(p._text).trim()) return true;
  if (p.note && String(p.note).trim()) return true;
  const keys = Object.keys(p).filter((k) => !k.startsWith('_'));
  for (const k of keys) {
    const v = p[k];
    if (v == null || v === '') continue;
    if (typeof v === 'number' && Number.isFinite(v)) return true;
    if (typeof v === 'string' && v.trim()) return true;
    if (Array.isArray(v) && v.length) return true;
    if (typeof v === 'object' && Object.keys(v).length) return true;
    if (typeof v === 'boolean') return true;
  }
  return false;
}

function summarizeMacroPayloads(payloads) {
  const parts = [];
  for (const p of payloads) {
    if (!p) continue;
    if (p.note) parts.push(String(p.note));
    if (p.spread != null) parts.push(`curve spread ${p.spread}`);
    if (p.inverted != null) parts.push(p.inverted ? 'inverted' : 'not inverted');
    if (p.fed_funds != null || p.rate != null) {
      parts.push(`fed funds ${p.fed_funds ?? p.rate}`);
    }
    if (Array.isArray(p.curve) && p.curve.length) {
      parts.push(`${p.curve.length} curve points`);
    }
    if (p.indicators && typeof p.indicators === 'object') {
      const ik = Object.keys(p.indicators).slice(0, 4);
      if (ik.length) parts.push(`indicators ${ik.join(',')}`);
    }
    if (Array.isArray(p.items) && p.items.length) {
      parts.push(`${p.items.length} indicator items`);
    }
    if (p.fomc || p.news) {
      const n = Array.isArray(p.news) ? p.news.length : Array.isArray(p.fomc) ? p.fomc.length : 1;
      parts.push(`fomc/news ${n}`);
    }
    if (p.assets && typeof p.assets === 'object') {
      const keys = Object.keys(p.assets);
      parts.push(`risk assets listed (${keys.length})`);
    } else if (Array.isArray(p.assets)) {
      parts.push(`risk assets listed (${p.assets.length})`);
    }
    if (p._text) parts.push(p._text);
    if (!parts.length && typeof p === 'object') {
      const keys = Object.keys(p).filter((k) => !k.startsWith('_'));
      if (keys.length) parts.push(`macro keys ${keys.slice(0, 6).join(',')}`);
    }
  }
  if (!parts.length) return null;
  return clip(`Macro: ${parts.join('; ')}`);
}

/** Known cross-asset keys → overnight risk tone for US equity / semis. */
const CROSS_ASSET_LABELS = {
  btc: 'BTC',
  bitcoin: 'BTC',
  eth: 'ETH',
  ethereum: 'ETH',
  gold: 'Gold',
  xau: 'Gold',
  silver: 'Silver',
  xag: 'Silver',
  oil: 'Oil',
  wti: 'Oil',
  brent: 'Oil',
  crude: 'Oil',
  dxy: 'DXY',
  dollar: 'DXY',
  usd: 'DXY',
  usdx: 'DXY',
  vix: 'VIX',
  spy: 'SPY',
  qqq: 'QQQ',
};

function numish(v) {
  if (v == null) return null;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(String(v).replace(/[%$,]/g, '').trim());
    return Number.isFinite(n) ? n : null;
  }
  if (typeof v === 'object') {
    for (const k of ['pct', 'change_pct', 'changePercent', 'chgpct', 'price', 'last', 'value', 'close']) {
      if (v[k] != null) {
        const n = numish(v[k]);
        if (n != null) return n;
      }
    }
  }
  return null;
}

function gatherCrossAssetMap(payloads) {
  const map = {};
  for (const p of payloads) {
    if (!p || typeof p !== 'object') continue;
    const bags = [];
    if (p.assets && typeof p.assets === 'object' && !Array.isArray(p.assets)) bags.push(p.assets);
    if (p.cross_asset && typeof p.cross_asset === 'object') bags.push(p.cross_asset);
    if (p.data && typeof p.data === 'object' && !Array.isArray(p.data)) bags.push(p.data);
    // Flat payload with known keys
    bags.push(p);
    for (const bag of bags) {
      for (const [rawKey, val] of Object.entries(bag)) {
        const k = String(rawKey).toLowerCase().replace(/[^a-z0-9]/g, '');
        const label = CROSS_ASSET_LABELS[k];
        if (!label) continue;
        const n = numish(val);
        if (!(label in map) || (n != null && map[label].value == null)) {
          map[label] = { value: n, raw: val };
        }
      }
    }
  }
  return map;
}

function riskToneFromMap(map) {
  const bullets = [];
  const dxy = map.DXY?.value;
  const gold = map.Gold?.value;
  const oil = map.Oil?.value;
  const btc = map.BTC?.value;
  const vix = map.VIX?.value;

  // Prefer numeric risk-on/off reads when present (heuristic, honest)
  if (dxy != null || gold != null || oil != null || btc != null || vix != null) {
    const bits = [];
    if (dxy != null) bits.push(`DXY ${dxy > 0 ? '+' : ''}${typeof dxy === 'number' && Math.abs(dxy) < 20 ? dxy + '%' : dxy}`);
    if (gold != null) bits.push(`Gold ${gold > 0 ? '+' : ''}${typeof gold === 'number' && Math.abs(gold) < 20 ? gold + '%' : gold}`);
    if (oil != null) bits.push(`Oil ${oil > 0 ? '+' : ''}${typeof oil === 'number' && Math.abs(oil) < 20 ? oil + '%' : oil}`);
    if (btc != null) bits.push(`BTC ${btc > 0 ? '+' : ''}${typeof btc === 'number' && Math.abs(btc) < 30 ? btc + '%' : btc}`);
    if (vix != null) bits.push(`VIX ${vix}`);
    // Crude risk tone for semis/US overnight
    let tone = 'mixed cross-asset tone';
    const riskOff =
      (typeof dxy === 'number' && dxy > 0.2) ||
      (typeof vix === 'number' && vix > 20) ||
      (typeof gold === 'number' && gold > 0.5 && typeof btc === 'number' && btc < 0);
    const riskOn =
      (typeof btc === 'number' && btc > 1) ||
      (typeof dxy === 'number' && dxy < -0.2) ||
      (typeof vix === 'number' && vix < 15);
    if (riskOff && !riskOn) tone = 'risk-off lean for US equity / semis overnight';
    else if (riskOn && !riskOff) tone = 'risk-on lean for US equity / semis overnight';
    bullets.push(`${bits.join(' · ')} → ${tone}`);
  } else {
    const present = Object.keys(map);
    if (present.length) {
      bullets.push(
        `Cross-asset feed online (${present.slice(0, 5).join(', ')}); no clean % prints — treat as qualitative risk backdrop for semis/US overnight`
      );
    }
  }
  return bullets;
}

function summarizeMarketIntel(payloads) {
  const map = gatherCrossAssetMap(payloads);
  const bullets = riskToneFromMap(map);

  // Soft qualitative fallbacks without telemetry dumps
  if (!bullets.length) {
    for (const p of payloads) {
      if (!p) continue;
      if (p.heatmap || p.sectors) {
        bullets.push('Sector/heatmap present — scan semis vs broad risk into the open');
        break;
      }
      if (p.note && String(p.note).trim()) {
        bullets.push(clip(String(p.note), 160));
        break;
      }
      if (p._text && String(p._text).trim()) {
        bullets.push(clip(String(p._text), 160));
        break;
      }
    }
  }

  if (!bullets.length) {
    // Honest soft line — never "15 keys"
    const anyKeys = payloads.some(
      (p) => p && typeof p === 'object' && Object.keys(p).filter((k) => !k.startsWith('_')).length
    );
    if (anyKeys) {
      bullets.push(
        'Cross-asset map online; no DXY/gold/oil/BTC print parsed — check risk tone manually for semis overnight'
      );
    } else {
      return null;
    }
  }

  return clip(bullets.slice(0, 2).join(' | '));
}

function collectNewsArticles(payloads) {
  const out = [];
  const pushArr = (arr) => {
    if (!Array.isArray(arr)) return;
    for (const a of arr) {
      if (!a) continue;
      if (typeof a === 'string') {
        out.push({ title: a, snippet: '' });
        continue;
      }
      const title = a.title || a.headline || a.name || a.summary || '';
      const snippet = a.description || a.snippet || a.summary || a.body || '';
      if (title || snippet) out.push({ title: String(title), snippet: String(snippet) });
    }
  };
  for (const p of payloads) {
    if (!p) continue;
    pushArr(p.news);
    pushArr(p.articles);
    pushArr(p.items);
    pushArr(p.latest);
    pushArr(p.headlines);
    if (Array.isArray(p.feeds)) {
      for (const f of p.feeds) {
        if (f && typeof f === 'object') {
          pushArr(f.items || f.articles || f.news);
          if (f.title || f.headline) out.push({ title: String(f.title || f.headline), snippet: '' });
        }
      }
    }
    if (p._text) out.push({ title: String(p._text).slice(0, 120), snippet: '' });
  }
  return out;
}

function summarizeNews(payloads, symbol) {
  const sym = String(symbol || 'NVDA').toUpperCase();
  const sectorRe =
    /semi|chip|gpu|ai\b|nvidia|nvda|apple|aapl|microsoft|msft|tech|nasdaq|megacap|magnificent/i;
  const symRe = new RegExp(`\\b${sym}\\b`, 'i');
  const articles = collectNewsArticles(payloads);

  const relevant = articles.filter((a) => {
    const blob = `${a.title} ${a.snippet}`;
    return symRe.test(blob) || sectorRe.test(blob);
  });

  const pick = (relevant.length ? relevant : []).slice(0, 2);
  if (pick.length) {
    const bullets = pick.map((a, i) => {
      const title = clip(a.title || a.snippet, 90);
      return i === 0
        ? `Top ${sym}-relevant: "${title}"`
        : `Also: "${title}"`;
    });
    return clip(bullets.join(' | '));
  }

  // Feeds-only / no symbol headline — honest, never "44 feeds (total 44)"
  const hasFeeds = payloads.some((p) => {
    if (!p) return false;
    if (Array.isArray(p.feeds) && p.feeds.length) return true;
    if (Array.isArray(p.sources) && p.sources.length) return true;
    if (p.sources && typeof p.sources === 'object' && Object.keys(p.sources).length) return true;
    if (p.total != null) return true;
    return payloadHasUseful(p);
  });

  if (hasFeeds || articles.length) {
    return clip(
      `News feeds online; no ${sym}-specific headline in payload — check Sources panel`
    );
  }

  return clip(`News briefing for ${sym}: MCP returned empty headlines — sources probed`);
}

/** Extract Fear&Greed-style number from MCP or alt.me payload; ignore platform dumps. */
function extractFearGreed(payload) {
  if (!payload || typeof payload !== 'object') return null;
  // Platform-only dumps (douyin/weibo…) — ignore
  const keys = Object.keys(payload).filter((k) => !k.startsWith('_'));
  const onlyPlatforms =
    keys.length &&
    keys.every((k) =>
      /platform|social|douyin|weibo|twitter|reddit|tiktok/i.test(k)
    );
  if (onlyPlatforms && Array.isArray(payload.platforms)) return null;
  if (Array.isArray(payload.platforms) && keys.length <= 2 && !payload.value && !payload.index) {
    return null;
  }

  const candidates = [
    payload.value,
    payload.index,
    payload.fear_greed,
    payload.fearGreed,
    payload.fng,
    payload.score,
    payload.data?.value,
    payload.data?.[0]?.value,
  ];
  if (Array.isArray(payload.data) && payload.data[0]) {
    candidates.push(payload.data[0].value);
  }
  for (const c of candidates) {
    const n = Number(c);
    if (Number.isFinite(n) && n >= 0 && n <= 100) {
      const label =
        payload.classification ||
        payload.label ||
        payload.data?.[0]?.value_classification ||
        (n >= 75 ? 'Extreme Greed' : n >= 55 ? 'Greed' : n >= 45 ? 'Neutral' : n >= 25 ? 'Fear' : 'Extreme Fear');
      return { value: n, label: String(label) };
    }
  }
  if (payload._text) {
    const m = String(payload._text).match(/(\d{1,3})\s*(?:\/\s*100)?/);
    if (m) {
      const n = Number(m[1]);
      if (n >= 0 && n <= 100) return { value: n, label: 'index' };
    }
  }
  return null;
}

async function fetchAltMeFearGreed(signal) {
  const wrap = withTimeout(TOOL_TIMEOUT_MS, signal);
  try {
    const res = await fetch('https://api.alternative.me/fng/?limit=1', {
      signal: wrap.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`alt.me HTTP ${res.status}`);
    const json = await res.json();
    const row = json?.data?.[0];
    if (!row) throw new Error('alt.me empty');
    const value = Number(row.value);
    if (!Number.isFinite(value)) throw new Error('alt.me bad value');
    return {
      value,
      label: row.value_classification || 'Fear&Greed',
    };
  } finally {
    wrap.clear();
  }
}

function sentimentLine(fg, symbol, equityRsi) {
  const sym = String(symbol || 'NVDA').toUpperCase();
  const n = fg.value;
  const label = fg.label || 'Fear&Greed';
  let backdrop = 'mixed backdrop';
  if (n >= 60) backdrop = 'risk-on backdrop';
  else if (n <= 40) backdrop = 'risk-off backdrop';
  let rsiBit = '';
  if (equityRsi != null && Number.isFinite(equityRsi)) {
    rsiBit = `; equity RSI14 ${equityRsi}`;
  }
  return clip(
    `Fear&Greed ${n} (${label}) — for ${sym} overnight thesis: ${backdrop}${rsiBit}; do not size from this alone`
  );
}

async function fetchBitgetCandles(overallSignal) {
  const wrap = withTimeout(TOOL_TIMEOUT_MS, overallSignal);
  try {
    const url =
      'https://api.bitget.com/api/v2/spot/market/candles?symbol=BTCUSDT&granularity=1h&limit=5';
    const res = await fetch(url, { signal: wrap.signal });
    if (!res.ok) throw new Error(`Bitget candles HTTP ${res.status}`);
    const json = await res.json();
    if (json.code !== '00000' || !Array.isArray(json.data) || !json.data.length) {
      throw new Error('Bitget candles empty');
    }
    const row = json.data[0];
    if (!row || row.length < 5) throw new Error('Bitget candles malformed');
    return { _bitgetCandles: true, data: json.data };
  } finally {
    wrap.clear();
  }
}

function summarizeCryptoRiskSecondary(payload) {
  if (!payload) return null;
  if (payload._bitgetCandles) {
    const rows = payload.data || [];
    if (!rows.length) return null;
    const last = rows[0];
    const close = last[4];
    return `Crypto risk (not equity): Bitget BTCUSDT 1h last close ${close}`;
  }
  const rsi = payload.rsi?.rsi ?? payload.rsi;
  const tf = payload.timeframe || '4h';
  if (rsi != null) {
    return `Crypto risk (not equity): BTC/USDT ${tf} RSI ${Number(rsi).toFixed(1)}`;
  }
  if (payload._text) return `Crypto risk (not equity): ${clip(payload._text, 120)}`;
  return null;
}

/**
 * Macro: race macro_indicators / cross_asset / quick rates + Yahoo VIX fallback.
 * First useful payload wins; mark live if ANY returns real numbers/notes.
 */
async function gatherMacro(session, overallSignal) {
  const attempts = [];

  if (session) {
    attempts.push(
      session
        .toolsCall('macro_indicators', { action: 'multi_indicator' })
        .then((p) => ({ src: 'macro_indicators', p }))
        .catch(() => null)
    );
    attempts.push(
      session
        .toolsCall('macro_indicators', { action: 'fomc_news' })
        .then((p) => ({ src: 'macro_indicators/fomc', p }))
        .catch(() => null)
    );
    attempts.push(
      session
        .toolsCall('cross_asset', { action: 'assets_list' })
        .then((p) => ({ src: 'cross_asset', p }))
        .catch(() => null)
    );
    // rates_yields only if fast (5s abort) — known hang risk
    attempts.push(
      session
        .toolsCall('rates_yields', { action: 'fed_funds' }, TOOL_TIMEOUT_MS)
        .then((p) => ({ src: 'rates_yields/fed_funds', p }))
        .catch(() => null)
    );
    attempts.push(
      session
        .toolsCall('rates_yields', { action: 'yield_curve' }, TOOL_TIMEOUT_MS)
        .then((p) => ({ src: 'rates_yields/curve', p }))
        .catch(() => null)
    );
  }

  // Free Yahoo VIX / ^TNX — can make macro LIVE without hanging MCP
  attempts.push(
    yahooMacroRisk(overallSignal)
      .then((r) => ({ src: 'yahoo-vix', p: { _yahooMacro: true, ...r } }))
      .catch(() => null)
  );

  const settled = await Promise.allSettled(attempts);
  const good = [];
  for (const s of settled) {
    if (s.status !== 'fulfilled' || !s.value) continue;
    const { p } = s.value;
    if (p?._yahooMacro && p.summary) {
      good.push(p);
      continue;
    }
    if (payloadHasUseful(p)) good.push(p);
  }

  if (!good.length) return null;

  const yahoo = good.find((g) => g._yahooMacro);
  const mcpOnes = good.filter((g) => !g._yahooMacro);
  let summary = summarizeMacroPayloads(mcpOnes);
  if (yahoo?.summary) {
    summary = summary ? clip(`${summary}; ${yahoo.summary}`) : yahoo.summary;
  }
  if (!summary && yahoo?.summary) summary = yahoo.summary;
  if (!summary) summary = clip('Macro: live payload received');
  return { skill: 'macro', mode: 'live', summary };
}

async function gatherLive(symbol, overallSignal) {
  const sym = String(symbol || 'NVDA').toUpperCase();
  let session;
  try {
    session = await openMcpSession(overallSignal);
  } catch {
    session = null;
  }

  /** Shared equity RSI for sentiment thesis line */
  let equityRsi = null;

  const runOne = async (skill) => {
    try {
      if (skill === 'macro') {
        const dig = await gatherMacro(session, overallSignal);
        if (dig) return dig;
        return mockDigest(skill, sym, 'macro all feeds soft-fail');
      }

      if (skill === 'market-intel') {
        if (!session) return mockDigest(skill, sym, 'datahub MCP unreachable');
        const settled = await Promise.allSettled([
          session.toolsCall('cross_asset', { action: 'assets_list' }),
          session.toolsCall('cross_asset', { action: 'heatmap' }),
        ]);
        const payloads = settled
          .filter((s) => s.status === 'fulfilled')
          .map((s) => s.value);
        if (!payloads.length) throw new Error('market-intel empty');
        const summary = summarizeMarketIntel(payloads);
        return {
          skill,
          mode: 'live',
          summary: summary || clip('Market-intel: cross_asset payload received'),
        };
      }

      if (skill === 'news-briefing') {
        if (!session) return mockDigest(skill, sym, 'datahub MCP unreachable');
        const settled = await Promise.allSettled([
          session.toolsCall('tradfi_news', { action: 'news', symbol: sym }),
          session.toolsCall('news_feed', { action: 'sources' }),
          session.toolsCall('news_feed', { action: 'latest' }),
        ]);
        const payloads = settled
          .filter((s) => s.status === 'fulfilled')
          .map((s) => s.value);
        if (!payloads.length) throw new Error('news empty');
        const summary = summarizeNews(payloads, sym);
        return {
          skill,
          mode: 'live',
          summary: summary || clip(`News briefing: MCP probed for ${sym}`),
        };
      }

      if (skill === 'sentiment') {
        let fg = null;
        if (session) {
          try {
            const p = await session.toolsCall('sentiment_index', { action: 'current' });
            fg = extractFearGreed(p);
          } catch {
            /* try free F&G */
          }
        }
        if (!fg) {
          try {
            fg = await fetchAltMeFearGreed(overallSignal);
          } catch {
            /* soft-fail */
          }
        }
        if (!fg) {
          return mockDigest(skill, sym, 'Fear&Greed unavailable');
        }
        // Prefer equity RSI if already computed; else quick fetch for thesis line
        if (equityRsi == null) {
          try {
            const wrap = withTimeout(TOOL_TIMEOUT_MS, overallSignal);
            try {
              const eq = await equityTechnicalSummary(sym, wrap.signal);
              equityRsi = eq?.rsi ?? null;
            } finally {
              wrap.clear();
            }
          } catch {
            /* optional */
          }
        }
        return {
          skill,
          mode: 'live',
          summary: sentimentLine(fg, sym, equityRsi),
        };
      }

      if (skill === 'technical') {
        // PRIMARY: equity Yahoo RSI for SYM — never BTC as primary
        let equitySummary = null;
        try {
          const wrap = withTimeout(8_000, overallSignal);
          try {
            const eq = await equityTechnicalSummary(sym, wrap.signal);
            if (eq?.summary) {
              equitySummary = eq.summary;
              equityRsi = eq.rsi;
            }
          } finally {
            wrap.clear();
          }
        } catch {
          /* fall through */
        }

        let cryptoLine = null;
        try {
          if (session) {
            const tech = await session.toolsCall('technical_analysis', {
              action: 'full_analysis',
              symbol: 'BTC/USDT',
              timeframe: '4h',
            });
            cryptoLine = summarizeCryptoRiskSecondary(tech);
          }
        } catch {
          try {
            const candles = await fetchBitgetCandles(overallSignal);
            cryptoLine = summarizeCryptoRiskSecondary(candles);
          } catch {
            /* optional secondary */
          }
        }

        if (equitySummary) {
          const summary = cryptoLine
            ? clip(`${equitySummary}. ${cryptoLine}`)
            : equitySummary;
          return { skill, mode: 'live', summary };
        }
        // No equity — do NOT promote BTC as primary stock technical
        return mockDigest(
          skill,
          sym,
          'equity Yahoo chart soft-fail (BTC not used as primary)'
        );
      }

      return mockDigest(skill, sym, 'unknown skill');
    } catch {
      return mockDigest(skill, sym, 'upstream soft-fail');
    }
  };

  const settled = await Promise.allSettled(SKILL_NAMES.map((s) => runOne(s)));
  return settled.map((s, i) => {
    if (s.status === 'fulfilled') return s.value;
    return mockDigest(SKILL_NAMES[i], sym, 'gather error');
  });
}

/**
 * Run research Skills for symbol.
 * @returns {{ mode: 'live'|'mock'|'partial', used: string[], digests: Array<{skill,mode,summary}> }}
 */
export async function runResearchSkills(symbol = 'NVDA') {
  const sym = String(symbol || 'NVDA').toUpperCase();
  const overall = new AbortController();
  try {
    setMaxListeners(64, overall.signal);
  } catch {
    /* older node */
  }
  const timer = setTimeout(() => overall.abort(), OVERALL_TIMEOUT_MS);

  try {
    const digests = await gatherLive(sym, overall.signal);
    const anyLive = digests.some((d) => d.mode === 'live');
    const anyMock = digests.some((d) => d.mode !== 'live');
    const mode = anyLive && anyMock ? 'partial' : anyLive ? 'live' : 'mock';
    lastSkillsLive = anyLive;
    return {
      mode,
      used: digests.map((d) => d.skill),
      digests,
    };
  } catch {
    const digests = mockDigests(sym, 'skills gather failed');
    lastSkillsLive = false;
    return { mode: 'mock', used: digests.map((d) => d.skill), digests };
  } finally {
    clearTimeout(timer);
  }
}

export function skillsHealthLive() {
  return lastSkillsLive;
}

/** Always "configured" — public datahub is the default live path (no account key). */
export function skillsConfigured() {
  return true;
}

export { SKILL_NAMES, computeRsi };
