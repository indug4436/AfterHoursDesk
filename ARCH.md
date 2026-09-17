# ARCH.md - AfterHoursDesk

**Slices:** overnight print · research Skills · source ranking · concurrent brief · **thesis workbench (profile / watchlist / checklist / last-N)** — target Personalized thesis ≥23/25 (from 19).  
Path: `/workspace/hackathon-bitget/` only. CMC + SpotBasis **do not touch**.

## Stack

- Runtime: Node >=18 (ESM) — one-command demo (`PORT=3010 npm start`)
- UI: single Desk page (NL input + brief panel + sources + Skills strip)
- API: thin server for `/api/health`, `/api/brief`, optional `/api/skills/research`
- LLM adapter: OpenAI-compatible Bitget Qwen (`qwen3.8-max`) or LABELED MOCK fixture
- News: NewsAPI with **host allow/deny ranking** (drop pypi.org / non-news)
- Market print: free public after-hours / prior-close feed (no paid Yahoo key) — see Market feed
- Bitget Agent Hub: **research Skills only** (handbook: macro / market-intel / news-briefing / sentiment / technical) — no account key for research Skills; paper/order stays stub
- Concurrent briefs: single-flight queue or in-flight cancel + honest loading UX
- **Thesis workbench (local persist):** desk profile + watchlist + my checklist/thesis notes + last-N brief recall — one page, no second app

## Folder tree

```
hackathon-bitget/
  CONSTRAINTS.md, IDEA_SLATE.md   # do not rewrite slate
  PRD.md, ARCH.md, API_CONTRACT.md, SCREENS.md, DEMO.md, LANDING.md
  README.md, KNOWN_LIMITATIONS.md, SCORECARD.md
  package.json, .env.example, .gitignore
  server.mjs
  lib/
    brief.mjs
    llm.mjs
    sources.mjs          # NewsAPI + host ranking filter
    market.mjs           # NEW: overnight / premarket / last vs prior close
    skills.mjs           # NEW: Bitget research Skills (read-only perception)
    paper_agent_stub.mjs # stub — no orders
    desk_state.mjs       # NEW: profile / watchlist / checklist / session recall (file or memory)
  data/
    desk-state.json      # optional server persist (gitignored)
  fixtures/
  public/
  logs/
```

## Data flow

1. Browser → `POST /api/brief {question, symbol}`
2. **Queue / single-flight:** if another brief is in flight, wait or return `429` / UI “Brief already running” — never let a timed-out live call look like a successful live brief while a parallel mock wins.
3. Parallel gather:
   - `sources.mjs` — NewsAPI (ranked/filtered) or fixtures
   - `market.mjs` — after-hours / premarket % or last vs prior close; **null + note** on fail
   - `skills.mjs` — Agent Hub research Skills (macro, market-intel, news-briefing, sentiment, technical) when Hub CLI/MCP available; else LABELED MOCK skill stubs clearly badged
4. `llm.mjs` — synthesize brief using **only** provided overnight_move + ranked sources + skill digests (never invent %)
5. JSON → Desk UI (What moved / claims / watch / sources / Skills strip + **For my desk** personalization block)
6. Desk state: load profile/watchlist/checklist from `localStorage` and/or `GET /api/desk/state`; brief request may include `desk_context` so LLM answers *how this name hits my list / standing thesis*

### Thesis workbench (smallest shippable)

| Piece | Persist | Role |
|-------|---------|------|
| Desk profile | localStorage + optional `data/desk-state.json` | segment (Asia overnight US equities), risk note, standing thesis (1–3 lines) |
| Watchlist | same | 3–8 tickers; brief can cite “on your watchlist” / peers |
| My checklist | same | standing open items; merge with brief `watch_at_open` as **My checklist** |
| Last-N sessions | in-memory + optional file (N≤5) | recall chips on page — reopen prior brief headline/symbol |

No auto-trade. No fake Hub orders. Keep overnight/Skills/live legs unchanged.

Paper path: `POST /api/paper/plan` remains stub unless Orchestrator assigns a free dry-run later.

## Market feed (Builder choice — document in KNOWN_LIMITATIONS)

Prefer **free/public, works from localhost, no paid Yahoo key**:

| Option | Use when | Failure mode |
|--------|----------|--------------|
| **A. Stooq** daily/prior close + session heuristics | Default — no API key | null + note |
| **B. Finnhub free tier** | If Indu adds `FINNHUB_API_KEY` | null + note |
| **C. Polygon/other** | Only if free key already in `.env` | null + note |

**Never invent %.** Live headlines alone ≠ overnight print. If feed fails: `overnight_move.pct = null`, note explains why.

## Real vs mocked

| Condition | Behavior |
|-----------|----------|
| No LLM key | LABELED MOCK synthesis |
| No NEWS / NEWS_LIVE=0 | LABELED MOCK headlines (ranked fixtures) |
| Market feed down | overnight pct null + honest note; brief still completes |
| No Agent Hub / Skills runtime | LABELED MOCK skill digests — badge **LABELED MOCK SKILLS**; never claim Hub live |
| Keys + Hub present | Live adapters; filter low-signal hosts; Skills as perception only |

## Env vars

| Var | Required | Notes |
|-----|----------|-------|
| `LLM_API_KEY` / `LLM_BASE_URL` / `LLM_MODEL` | live LLM | Bitget Qwen: `https://hackathon.bitgetops.com/v1`, `qwen3.8-max` |
| `NEWS_API_KEY` / `NEWS_LIVE` | live news | `NEWS_LIVE=0` forces mock news |
| `FINNHUB_API_KEY` | optional | only if using feed option B |
| `BITGET_HUB_*` / Skills path | optional | research Skills; no trading keys required for perception |
| `PORT` | no | default 3010 in `.env.example` |

## Run path

```bash
cd /workspace/hackathon-bitget && npm install && PORT=3010 npm start
```

Open http://localhost:3010 — mock path completes DEMO without keys.
