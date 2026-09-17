/**
 * News / price sources adapter + host ranking filter.
 * Live only when a real fetch succeeds; otherwise LABELED MOCK from fixtures.
 * Drop/demote low-signal hosts; prefer finance/news hosts.
 * Tighter relevance: deny aggregators, require prefer hosts when available,
 * prefer titles containing symbol/company tokens.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(__dirname, '..', 'fixtures');

/** Hosts to drop entirely (package registries / aggregators / non-news noise). */
const DENY_HOSTS = [
  'pypi.org',
  'pypi.python.org',
  'npmjs.com',
  'www.npmjs.com',
  'registry.npmjs.org',
  'rubygems.org',
  'crates.io',
  'packagist.org',
  'nuget.org',
  'mvnrepository.com',
  'central.sonatype.com',
  'hub.docker.com',
  // Aggregators / thin scrapers
  'biztoc.com',
  'www.biztoc.com',
  'news.google.com',
  'news.yahoo.com', // often thin aggregator landing; prefer finance.yahoo.com
  'ground.news',
  'www.ground.news',
  'smartnews.com',
  'flipboard.com',
  'www.flipboard.com',
  'alltop.com',
  'feedly.com',
  'msn.com',
  'www.msn.com',
  'dailyhunt.in',
  'inshorts.com',
  'newsbreak.com',
  'www.newsbreak.com',
];

/** Soft-demote (high score) — thin blogs / borderline finance clickbait */
const DEMOTE_HOSTS = [
  '247wallst.com',
  'www.247wallst.com',
  'motleyfool.com', // keep fool.com prefer; demote typosquat-ish
  'investopedia.com', // educational, often not overnight movers
  'www.investopedia.com',
  'tipranks.com',
  'www.tipranks.com',
  'stocktwits.com',
  'www.stocktwits.com',
];

/** Prefer these finance/news hosts (lower rank number = better). */
const PREFER_HOSTS = [
  'reuters.com',
  'www.reuters.com',
  'bloomberg.com',
  'www.bloomberg.com',
  'cnbc.com',
  'www.cnbc.com',
  'wsj.com',
  'www.wsj.com',
  'ft.com',
  'www.ft.com',
  'marketwatch.com',
  'www.marketwatch.com',
  'finance.yahoo.com',
  'seekingalpha.com',
  'www.seekingalpha.com',
  'barrons.com',
  'www.barrons.com',
  'investing.com',
  'www.investing.com',
  'benzinga.com',
  'www.benzinga.com',
  'thestreet.com',
  'www.thestreet.com',
  'fool.com',
  'www.fool.com',
  'morningstar.com',
  'www.morningstar.com',
  'apnews.com',
  'www.apnews.com',
  'bbc.com',
  'www.bbc.com',
  'bbc.co.uk',
  'nytimes.com',
  'www.nytimes.com',
  'forbes.com',
  'www.forbes.com',
  'businessinsider.com',
  'www.businessinsider.com',
  'example.com', // fixtures
];

/** Symbol → company name tokens for title relevance */
const SYMBOL_TOKENS = {
  NVDA: ['nvda', 'nvidia'],
  AAPL: ['aapl', 'apple'],
  MSFT: ['msft', 'microsoft'],
  TSLA: ['tsla', 'tesla'],
  AMZN: ['amzn', 'amazon'],
  GOOGL: ['googl', 'google', 'alphabet'],
  GOOG: ['goog', 'google', 'alphabet'],
  META: ['meta', 'facebook'],
  AMD: ['amd'],
  INTC: ['intc', 'intel'],
  NFLX: ['nflx', 'netflix'],
};

function hostFromUrl(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function isDeniedHost(host) {
  if (!host) return false;
  if (/biztoc/i.test(host)) return true;
  return DENY_HOSTS.some(
    (d) => host === d || host.endsWith(`.${d}`) || host.includes(d)
  );
}

function isDemoteHost(host) {
  if (!host) return false;
  return DEMOTE_HOSTS.some(
    (d) => host === d || host.endsWith(`.${d.replace(/^www\./, '')}`)
  );
}

/** github.com/releases-style noise (not news) */
function isGithubReleaseNoise(url, host) {
  if (!host) return false;
  if (!/(^|\.)github\.com$/i.test(host)) return false;
  const u = String(url || '').toLowerCase();
  return (
    u.includes('/releases') ||
    u.includes('/tags') ||
    u.includes('/pull/') ||
    u.includes('/commit/') ||
    u.includes('/compare/')
  );
}

/** Drop/demote headlines that are clearly about another mega-cap ticker when querying a different symbol. */
function isCrossTickerNoise(title, symbol) {
  const sym = String(symbol || '').toUpperCase();
  const t = String(title || '');
  if (sym === 'NVDA') return false;
  return /\b(Nvidia|NVDA)\b/i.test(t);
}

function preferScore(host) {
  if (!host) return 55;
  const idx = PREFER_HOSTS.findIndex(
    (h) => host === h || host.endsWith(`.${h.replace(/^www\./, '')}`)
  );
  if (idx >= 0) return idx; // lower = better
  if (isDemoteHost(host)) return 75;
  // Soft demote unknown / blog hosts
  if (/(medium\.com|substack\.com|blogspot\.|wordpress\.)/i.test(host)) return 85;
  if (/(reddit\.com|twitter\.com|x\.com|facebook\.com)/i.test(host)) return 80;
  if (/(biztoc|newsbreak|flipboard|ground\.news)/i.test(host)) return 90;
  return 50;
}

function titleRelevanceBonus(title, symbol) {
  const sym = String(symbol || '').toUpperCase();
  const tokens = SYMBOL_TOKENS[sym] || [sym.toLowerCase()];
  const t = String(title || '').toLowerCase();
  if (tokens.some((tok) => t.includes(tok))) return -15; // boost (lower score)
  return 8; // slight demote when title lacks symbol/company
}

/**
 * Filter + rank sources. Adds host + rank (1-based after sort).
 * When ≥4 prefer-host hits exist, only keep preferScore < 45 (plus title boost applied).
 * Always drop deny list. Cap at 6–8.
 */
export function rankAndFilterSources(items, symbol = 'NVDA') {
  const cleaned = [];
  for (const item of items || []) {
    const host = item.host || hostFromUrl(item.url);
    if (isDeniedHost(host)) continue;
    if (isGithubReleaseNoise(item.url, host)) continue;
    if (isCrossTickerNoise(item.title, symbol)) continue;
    const base = preferScore(host);
    const score = base + titleRelevanceBonus(item.title, symbol);
    cleaned.push({
      ...item,
      host: host || 'unknown',
      _score: score,
      _basePrefer: base,
    });
  }

  const preferHits = cleaned.filter((c) => c._basePrefer < 45);
  let pool = cleaned;
  if (preferHits.length >= 4) {
    // Require preferScore < 45 for inclusion when enough quality hosts exist
    // (title bonus can push prefer hosts slightly over — allow _basePrefer < 45)
    pool = cleaned.filter((c) => c._basePrefer < 45);
  } else {
    // Drop weak hosts with score ≥ 60 from final top
    pool = cleaned.filter((c) => c._score < 60 || c._basePrefer < 45);
  }

  pool.sort((a, b) => {
    if (a._score !== b._score) return a._score - b._score;
    const da = Date.parse(a.published_at || '') || 0;
    const db = Date.parse(b.published_at || '') || 0;
    return db - da;
  });

  const capped = pool.slice(0, 8);
  return capped.map(({ _score, _basePrefer, ...rest }, i) => ({
    ...rest,
    rank: i + 1,
  }));
}

export function sourcesLive() {
  if (process.env.NEWS_LIVE === '0' || process.env.NEWS_LIVE === 'false')
    return false;
  return Boolean(process.env.NEWS_API_KEY);
}

async function loadFixture(symbol) {
  const sym = (symbol || 'NVDA').toUpperCase();
  if (sym === 'NVDA') {
    const raw = await readFile(join(FIXTURES, 'sample-nvda.json'), 'utf8');
    return JSON.parse(raw);
  }
  const raw = await readFile(join(FIXTURES, 'sample-generic.json'), 'utf8');
  const data = JSON.parse(raw);
  data.symbol = sym;
  data.overnight_move = {
    pct: null,
    note: `Overnight % unavailable — no fixture corpus for ${sym}`,
  };
  data.headlines = data.headlines.map((h) => ({
    ...h,
    title: `[${sym} mock] ${h.title}`,
  }));
  return data;
}

function fixturePack(fx, symbol = 'NVDA') {
  const mapped = (fx.headlines || []).map(
    ({ id, title, url, published_at, host }) => ({
      id,
      title,
      url,
      published_at,
      host: host || hostFromUrl(url),
    })
  );
  const sources = rankAndFilterSources(mapped, symbol).slice(0, 8);
  return {
    mode: 'mock',
    labeled: true,
    overnight_move: fx.overnight_move,
    headlines: fx.headlines,
    sources,
    as_of: fx.as_of,
  };
}

async function fetchNewsApi(symbol) {
  const key = process.env.NEWS_API_KEY;
  const q = encodeURIComponent(`${symbol} stock OR earnings OR after-hours`);
  const url = `https://newsapi.org/v2/everything?q=${q}&language=en&sortBy=publishedAt&pageSize=20&apiKey=${key}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const e = new Error(`newsapi ${res.status}: ${body.slice(0, 180)}`);
    e.status = 502;
    throw e;
  }
  const data = await res.json();
  const articles = Array.isArray(data.articles) ? data.articles : [];
  if (articles.length === 0) {
    const e = new Error('newsapi returned zero articles');
    e.status = 502;
    throw e;
  }
  const headlines = articles.map((a, i) => ({
    id: `s${i + 1}`,
    title: a.title || 'Untitled',
    url: a.url || '',
    published_at: a.publishedAt || new Date().toISOString(),
    snippet: a.description || '',
    host: hostFromUrl(a.url || ''),
  }));
  const sources = rankAndFilterSources(
    headlines.map(({ id, title, url, published_at, host }) => ({
      id,
      title,
      url,
      published_at,
      host,
    })),
    symbol
  ).slice(0, 8);
  const reId = sources.map((s, i) => ({ ...s, id: `s${i + 1}` }));
  return {
    mode: 'live',
    labeled: false,
    overnight_move: {
      pct: null,
      note: 'Awaiting market print adapter',
    },
    headlines,
    sources: reId,
    as_of: new Date().toISOString(),
  };
}

/**
 * @returns {{ mode: 'mock'|'live', overnight_move: object, sources: Array, headlines: Array, labeled: boolean }}
 */
export async function fetchSources(symbol = 'NVDA') {
  const sym = (symbol || 'NVDA').toUpperCase();

  if (!sourcesLive()) {
    const fx = await loadFixture(sym);
    return fixturePack(fx, sym);
  }

  try {
    return await fetchNewsApi(sym);
  } catch (err) {
    const fx = await loadFixture(sym);
    const pack = fixturePack(fx, sym);
    pack.fallback = true;
    pack.fallbackReason = String(err.message || err).slice(0, 200);
    if (pack.overnight_move) {
      pack.overnight_move = {
        ...pack.overnight_move,
        note: `LABELED MOCK fallback — live news failed (${pack.fallbackReason.slice(0, 80)})`,
      };
    }
    return pack;
  }
}
