# KNOWN_LIMITATIONS.md — AfterHoursDesk

Honest limits for judges and Orchestrator. Thesis workbench lift: Personalized thesis target ≥23/25 (SCORECARD was 19/25 at 90/100).

## Demo / data

- **Default path is LABELED MOCK** until `LLM_API_KEY` and/or `NEWS_API_KEY` are provided in `.env`.
- **Overnight % (market provider):** Prefer **Stooq** daily last-vs-prior close (no API key). Optional **Finnhub** when `FINNHUB_API_KEY` is set. If Stooq is unreachable from the demo host (bot challenge / network), fall back to **Yahoo chart free public** endpoint (no paid Yahoo key). On total failure: `pct = null` + honest note — **never invent %**. Mock fixtures may supply authored overnight % **only for NVDA** when sources are mock and the live market adapter failed; other symbols stay null by design.
- Non-NVDA mock headlines from `fixtures/sample-generic.json` (no Nvidia bleed).
- **Source ranking (tightened):** always drop deny list (package registries, `biztoc.com`, aggregators / thin scrapers like NewsBreak / Flipboard / Ground.News / MSN). Soft-demote thin blogs (`247wallst.com`, etc.). Prefer finance/news hosts (Reuters, Bloomberg, CNBC, WSJ, FT, MarketWatch, Yahoo Finance, Seeking Alpha, …). When ≥4 prefer-host hits exist, require preferScore &lt; 45 for inclusion; else drop hosts with score ≥ 60 from the final top. Cap **6–8** sources. Prefer titles containing symbol/company tokens (e.g. NVDA/Nvidia). Each source carries `host` + `rank`.
- **Live path** needs NEWS + LLM for full `mode: live`; partial OK via health. Market/skills legs can be partial independently.
- **Bitget research Skills (public datahub MCP — no account key):** live path uses `BITGET_DATAHUB_MCP` (default `https://datahub.noxiaohao.com/mcp`) via HTTP MCP session (`initialize` → `mcp-session-id` → `tools/call`) plus free Yahoo / alt.me fallbacks. Skills: **macro** (short-timeout MCP `macro_indicators` / `cross_asset` / quick `rates_yields` race + Yahoo VIX/`^TNX` fallback so macro can go LIVE without hanging on rates), **market-intel** (`cross_asset`), **news-briefing** (`tradfi_news` / `news_feed`), **sentiment** (Fear&Greed via `sentiment_index` or alt.me — one line tied to **symbol thesis**, not platform inventory), **technical** (**equity Yahoo daily RSI/SMA for the requested US symbol** primary; optional Bitget BTC secondary prefixed **Crypto risk (not equity):**). **`skills.mode=live` only when ≥1 real tool/Yahoo/candles payload landed**; soft-fail to **LABELED MOCK SKILLS** if all upstreams fail — **never fake live**. Paper/order path remains stub — **no live orders**.
- **Equity technical (not BTC-as-stock):** primary technical digest is Yahoo chart RSI14 / last print for the equity symbol (e.g. NVDA). BTC MCP/candles may appear only as a clearly labeled secondary crypto-risk line — never as the stock’s primary technical.
- Submit pack (Google Form / X / public hosting) is **human** — not a product bug.

## LLM / concurrency

- Live path: Bitget Qwen OpenAI-compatible `/chat/completions` + optional JSON mode. Lean payload (≤8 source titles, no long snippets; short skill digests). Abort **180s**; on abort/5xx → **honest labeled-mock LLM fallback** (`llm.mode=mock`, `llm.fallbackReason` set). Brief still returns live market print + ranked news when those legs succeed.
- Intermittent Qwen latency on this box (~90–150s for full overnight briefs) is accepted — do not claim LIVE LLM when fallback fired.
- System prompt: use **only** provided `overnight_move`; claims match symbol; never mention NVDA unless symbol is NVDA.
- **Overlapping `/api/brief`:** single-flight **429** `brief_in_flight` — UI disables Run brief / shows in-flight; never silent live theater from a race.
- **UI long brief:** client `AbortController` ~200s on `/api/brief`; on abort show **“Brief timed out — try again”** (not bare “Failed to fetch”); map TypeError/Failed to fetch while loading to a friendlier network message; keep button disabled while in flight; early return **“Brief already running”** if clicked again.

## Thesis workbench (this lift)

- **My desk** = profile (segment, risk note, standing thesis) + watchlist + my checklist + last-N session recall.
- Persist: `localStorage` (`afterhours_desk_v1`) + `data/desk-state.json` (gitignored). Hydrate from both; **local wins if newer** (`updated_at`). First open shows seeds without Save.
- Briefs always send `desk_context` from the form; response sets `desk_applied` + `brief.for_my_desk` (thesis_fit / watchlist_angle / checklist_echo). Mock LLM uses an honest template from desk_context — personalization still visible without live Qwen.
- APIs: `GET/PUT /api/desk/state`, optional `GET /api/desk/sessions`. Successful briefs `pushRecentSession` (N≤5).
- Not a full portfolio PMS: 3–8 watchlist tickers; checklist ≤8 items; last-N ≤5. No broker sync.

## Product scope (intentional)

- Single Desk page with My desk panel; no multi-broker, auto-trade, or separate settings app.
- Sessions: last-N on desk state + `logs/sample-session.md` on first success.
- No auth on localhost demo routes.
- Paper-agent stub only — no live orders / fake Hub execution.

- **Skills badge honesty:** `live_skills` / LIVE SKILLS reflect the **latest** skills gather only. If a brief returns all LABELED MOCK digests, mode/badge are mock for that response (no sticky LIVE from a prior ticker).

## Do not claim

- Do not present mock fixtures as live market / LLM / Skills.
- Do not claim live Bitget orders or Agentic account execution from this Desk.
- Do not claim overnight % when feed returned null.
- Do not claim a Personalized Research Workbench if My desk is missing or `for_my_desk` is generic boilerplate ignoring watchlist/thesis.
- Do not claim `live_skills` / `skills.mode=live` unless a real MCP, Yahoo equity/macro, Fear&Greed, or Bitget candles payload succeeded this process.

## Live keys / fallback

- **Bitget Qwen:** `LLM_BASE_URL=https://hackathon.bitgetops.com/v1`, `LLM_MODEL=qwen3.8-max`.
- Brief `llm.mode` / `market.mode` / `skills.mode` are ground truth per leg.
- News: `NEWS_LIVE=1` with valid key; on 401/empty → fixtures + flip `NEWS_LIVE=0` via Orchestrator.
- Market: Stooq → Finnhub (optional) → Yahoo chart free public → null + note. Soft-fail only.
- Skills: `BITGET_DATAHUB_MCP=https://datahub.noxiaohao.com/mcp` (always tried; no account key). Per-tool MCP ~**5s**, overall gather ≤**20s**, macro race + Yahoo VIX fallback; equity Yahoo technical; soft-fail to LABELED MOCK.
- Escalate corrected keys via Orchestrator only (not the Hackathon room).
