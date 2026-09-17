# AfterHoursDesk

Overnight US equity NL brief desk for Asia/EU traders.  
**Track:** AI Trading Desk · **Personalized Research Workbench**  
Human decides — no auto-orders.

**Repo:** `REPO_URL` · **Demo video:** `DEMO_VIDEO_URL`

## Judge DEMO (≤3 min) — My desk + live legs

1. `PORT=3010 npm start` → open **http://localhost:3010**
2. **My desk** — standing thesis, watchlist (NVDA/AAPL/MSFT), checklist already seeded
3. **Save desk** → chips persist (refresh-safe)
4. **Run brief** on NVDA → wait for badges: **LLM / DATA / MARKET / SKILLS** (LIVE when keys/feeds work; else honest LABELED MOCK)
5. Point **For my desk**: thesis_fit · watchlist overnight peer strip · checklist **PASS/WARN** vs overnight print · skill digests (symbol-relevant, not feed counts)

Full click-path: [`DEMO.md`](./DEMO.md) · Submit pack draft: [`docs/SUBMIT_PACK.md`](./docs/SUBMIT_PACK.md)

## Quick start

```bash
cd /workspace/hackathon-bitget
cp .env.example .env   # optional; mock path works with empty keys
npm install            # zero runtime deps — safe no-op install
PORT=3010 npm start    # use 3010 if 3000 is busy
```

Open **http://localhost:3010**

> Default in `.env.example` is `PORT=3010` because port 3000 is often taken.  
> Plain `npm start` uses `PORT` from env or **3000**. If you see `EADDRINUSE`, run `PORT=3010 npm start`.

### Smoke (desk personalization)

```bash
curl -s -X POST http://localhost:3010/api/brief \
  -H 'Content-Type: application/json' \
  -d '{"question":"What hit NVDA after the close?","symbol":"NVDA","desk_context":{"segment":"Asia overnight US equities","risk_note":"No leverage","standing_thesis":"AI infra on dips","watchlist":["NVDA","AAPL","MSFT"],"my_checklist":["Confirm AH vs prior close","Check guidance headlines"]}}' | jq '{mode, desk_applied, overnight: .brief.overnight_move, peers: .brief.peer_overnight, checklist: .brief.for_my_desk.checklist_echo, skills: [.brief.skill_digest[] | {skill, mode, summary}]}'
```

## Live keys (optional)

| Var | Effect |
|-----|--------|
| `LLM_API_KEY` (+ `LLM_BASE_URL`, `LLM_MODEL`) | Live OpenAI-compatible synthesis (Bitget Qwen) |
| `NEWS_API_KEY` + `NEWS_LIVE=1` | Live headlines via NewsAPI (ranked/filtered) |
| `FINNHUB_API_KEY` | Optional market print (else Stooq → Yahoo chart free public) |
| `BITGET_HUB_URL` / `BITGET_DATAHUB_MCP` | Live research Skills; else LABELED MOCK SKILLS |

Without keys → fixtures under `fixtures/` · badges show **LABELED MOCK**. Overnight % and Skills never silently invent live.

## What you get

- **Overnight print** — AH / last-vs-prior % (honest null)
- **Research Skills** — macro · market-intel · news-briefing · sentiment · technical (1–2 thesis-relevant bullets)
- **For my desk** — thesis_fit, watchlist angle + peer overnight strip, checklist pass/warn/fail
- **Single-flight** — 429 if a brief is already running
- **No orders** — paper stub only; human remains the decision-maker

## Layout

See `ARCH.md`. Desk UI: `public/`. API: `server.mjs` + `lib/`. Limits: `KNOWN_LIMITATIONS.md`.

## Disclaimer

Not financial advice. Human remains the decision-maker. No live orders.

## Repository

https://github.com/indug4436/AfterHoursDesk
