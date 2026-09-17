# SUBMIT_PACK — AfterHoursDesk (draft for Google Form)

**Owner:** Indu pastes into the Bitget S2 Google Form. **Builder does not submit.**  
**Track / sub-theme:** AI Trading Desk · **Personalized Research Workbench**  
**Product:** AfterHoursDesk — overnight US equity NL brief desk for Asia/EU traders (human decides; no auto-orders).

**Placeholders (replace before submit):**

| Field | Placeholder |
|-------|-------------|
| GitHub repo | `https://github.com/indug4436/AfterHoursDesk` |
| Demo / video | `DEMO_VIDEO_URL` |
| Live deploy (optional) | `DEPLOY_URL` |

---

## 1) Project description (six parts)

### Thesis
Asia/EU traders wake up to US equity after-hours noise but lack a **personalized** overnight workbench: standing thesis, watchlist peers, and a checklist that survive into the brief. AfterHoursDesk turns a natural-language question into a one-page overnight brief — live overnight %, ranked headlines, research Skills, and a **For my desk** block that echoes the trader’s thesis, peer AH prints, and checklist pass/warn status — so the human can decide at the open.

### Target user
Asia- and EU-based discretionary equity traders (and research-curious retail) who follow US megacap / semis overnight, keep a short watchlist, and want NL research + personalization without giving up control to auto-execution.

### Validation
- Live legs when keys/feeds work: LLM (Bitget Qwen), NewsAPI sources, Yahoo/Stooq overnight %, datahub MCP Skills — each soft-fails to **LABELED MOCK** (never silent invent).
- `desk_applied` + `for_my_desk` change the brief (thesis_fit, watchlist_angle, checklist_echo with status, peer_overnight).
- Single-flight 429; honest null overnight %; equity-primary technical (BTC as crypto risk only).
- Smoke: `PORT=3010` + POST `/api/brief` with NVDA + desk_context returns improved digests + statused checklist + peer strip.

### Progress
Sealed internal scorecard **95/100** (winner-contender). P1 polish: symbol-relevant Skill digests (no feed-count telemetry), checklist pass/warn vs overnight/headlines, peer overnight strip, judge-facing README/DEMO + this submit pack. No Hub order path (correct for Desk track).

### Deliverables
- Local app: `PORT=3010 npm start` → http://localhost:3010  
- Repo: `https://github.com/indug4436/AfterHoursDesk`  
- Demo path / video: `DEMO_VIDEO_URL` (≤3 min: Save desk → Run brief → For my desk)  
- Docs: README, DEMO.md, ARCH, API_CONTRACT, KNOWN_LIMITATIONS, this SUBMIT_PACK

### Optional — AI Trading take
Desk track wins when personalization + research quality beat “another chat wrapper.” AfterHoursDesk bets on **Personalized Research Workbench**: the brief must change because *my* thesis, watchlist, and checklist are in the loop — with honest live/mock badges and zero auto-orders.

---

## 2) Role of the LLM

The LLM (OpenAI-compatible Bitget Qwen when `LLM_API_KEY` is set; else labeled mock fixture) **synthesizes** the overnight brief JSON from a ranked source pack + skill digests + optional `desk_context`. It extracts dated claims, writes headline / watch-at-open, and personalizes `for_my_desk` (thesis_fit, watchlist_angle, checklist_echo). It does **not** place orders, invent overnight %, or invent sources — market adapter and Skills remain authoritative perception; human decides.

---

## 3) X / Twitter draft (compliant)

> Built **AfterHoursDesk** for @Bitget_AI Base Camp Hackathon S2 — an overnight US equity NL research workbench for Asia/EU desks. Save **My desk** (thesis + watchlist + checklist) → Run brief → **For my desk** with live overnight %, Skills, peer AH strip, and checklist PASS/WARN. Human decides — no auto-orders.  
> Track: AI Trading Desk · Personalized Research Workbench  
> Repo: https://github.com/indug4436/AfterHoursDesk · Demo: DEMO_VIDEO_URL  
> #BitgetHackathon @Bitget_AI

*(Handbook requires `#BitgetHackathon` + `@Bitget_AI`. Keep both tags; introduce the product — not a bare RT. Retweet the official promo when the URL is known.)*

---

## 4) Form checklist (Indu)

- [ ] Track → **Personalized Research Workbench**
- [ ] Paste six-part description + LLM role
- [ ] Materials link: `https://github.com/indug4436/AfterHoursDesk` + `DEMO_VIDEO_URL` (accessible)
- [ ] Compliant X post live; paste link
- [ ] Retweet official promo when available
- [ ] Confirm no Agentic “live orders” claims

**Deadline reminder:** submissions close **21 Sep 2026 UTC+8**.
