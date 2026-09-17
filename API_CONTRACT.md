# API_CONTRACT.md - AfterHoursDesk

Auth: none on demo routes. Secrets server-side only.  
Polish slices: overnight · Skills · ranked sources · concurrent brief · **thesis workbench** (profile/watchlist/checklist/last-N).

## GET /api/health

Success 200:
```json
{
  "ok": true,
  "product": "AfterHoursDesk",
  "track_hint": "AI Trading Desk",
  "live_llm": false,
  "live_sources": false,
  "live_market": false,
  "live_skills": false,
  "mode": "mock",
  "brief_inflight": false
}
```
`mode`: `"mock"` | `"partial"` | `"live"`.  
`live_market` true only when market adapter returned a usable print recently or is configured and reachable.  
`live_skills` true only when Agent Hub research Skills actually ran (not mock stubs).

---

## POST /api/brief

**Concurrency:** At most one brief synthesis in flight per process (or per symbol — Builder pick; document).  
- If a second request arrives while LLM/news is running: respond **429** with `{ "error": "brief_in_flight", "message": "A brief is already running — wait or cancel." }` **or** queue behind the first and return when done — UI must not show LIVE success from a stale/cancelled race.  
- On upstream timeout: **502** or success with that leg `mode: "mock"` + badges — never silent live theater.

Request JSON:
```json
{
  "question": "string",
  "symbol": "NVDA",
  "desk_context": {
    "segment": "Asia overnight US equities",
    "risk_note": "No leverage; size small at open",
    "standing_thesis": "AI infra leaders on dips; avoid chase after +3% AH",
    "watchlist": ["NVDA", "AAPL", "MSFT"],
    "my_checklist": ["Confirm AH vs prior close", "Check guidance headlines"]
  }
}
```
`desk_context` optional but **required for thesis DEMO** — Builder UI always sends saved desk state when present.

Success 200:
```json
{
  "mode": "live",
  "symbol": "NVDA",
  "question": "...",
  "brief": {
    "headline": "string",
    "overnight_move": {
      "pct": 1.2,
      "note": "After-hours vs prior close (Stooq)",
      "as_of": "2026-09-16T20:00:00Z",
      "source": "stooq"
    },
    "claims": [{ "text": "...", "as_of": "ISO-date", "source_id": "s1" }],
    "watch_at_open": ["checklist item"],
    "for_my_desk": {
      "thesis_fit": "How this brief hits your standing thesis (1–3 sentences)",
      "watchlist_angle": "Why this name matters vs your watchlist peers",
      "checklist_echo": ["Items from my_checklist still relevant", "..."]
    },
    "skill_digest": [
      { "skill": "news-briefing", "mode": "live", "summary": "..." },
      { "skill": "sentiment", "mode": "mock", "summary": "LABELED MOCK — Hub not connected" }
    ],
    "disclaimer": "Not financial advice. Human decides. No live orders."
  },
  "sources": [
    { "id": "s1", "title": "...", "url": "https://...", "published_at": "...", "host": "yahoo.com", "rank": 1 }
  ],
  "llm": { "mode": "live", "model": "qwen3.8-max" },
  "market": { "mode": "live", "provider": "stooq" },
  "skills": { "mode": "partial", "used": ["news-briefing", "sentiment"] },
  "session_id": "uuid",
  "desk_applied": true
}
```
**for_my_desk rules:** LLM (or template) must use `desk_context` when provided — personalized thesis block, not generic copy. If no desk_context, omit `for_my_desk` or set `desk_applied: false`.

**overnight_move rules:**  
- Prefer live after-hours / premarket % or last print vs prior close.  
- If unavailable: `"pct": null`, honest `note` (never invent).  

**sources rules:**  
- Drop / demote low-signal hosts (e.g. `pypi.org`, package registries, obvious non-news).  
- Prefer news/finance hosts; keep `host` + `rank` for judge transparency.  

**skill_digest:** perception only — handbook Skills (macro, market-intel, news-briefing, sentiment, technical). Do **not** claim order execution.

Error 400: missing question.  
Error 429: brief already in flight (if using reject strategy).  
Error 502: hard upstream failure with error string (optional if soft-fallback preferred — document).

---

## GET /api/skills/research (optional helper)

Request query: `?symbol=NVDA`  
Success 200: `{ "mode": "live"|"mock", "skills": [ { "skill": "...", "summary": "..." } ] }`  
Used by Desk Skills strip or folded into `/api/brief`. May be internal-only (no public route) if Builder inlines in brief.

---

## GET /api/session/:id (optional)

Returns last brief JSON for sample log export. In-memory OK for demo.

---

## GET /api/desk/state

Success 200:
```json
{
  "profile": {
    "segment": "Asia overnight US equities",
    "risk_note": "No leverage; size small at open",
    "standing_thesis": "AI infra leaders on dips; avoid chase after +3% AH"
  },
  "watchlist": ["NVDA", "AAPL", "MSFT"],
  "my_checklist": ["Confirm AH vs prior close", "Check guidance headlines"],
  "recent_sessions": [
    { "session_id": "uuid", "symbol": "NVDA", "headline": "...", "at": "ISO" }
  ]
}
```
Empty defaults OK on first run (seed profile for DEMO). Persist: `data/desk-state.json` and/or client localStorage (Builder: hydrate from both; local wins if newer).

---

## PUT /api/desk/state

Request: same shape as GET body (partial OK).  
Success 200: saved state echo.  
Used by Desk profile / watchlist / checklist editors. No auth on localhost.

---

## GET /api/desk/sessions (optional)

Last-N (≤5) brief summaries for recall chips. May be subset of `GET /api/desk/state.recent_sessions`.

---

## Out of Desk demo (stub only)

`POST /api/paper/plan` — `{ "status": "stub", "message": "paper-agent not enabled — research Desk only" }`.  
No live orders. Tiny dry-run only if Orchestrator later assigns and it is free.
