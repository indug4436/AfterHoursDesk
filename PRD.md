# PRD.md - AfterHoursDesk

**Product name:** AfterHoursDesk  
**Project path:** `/workspace/hackathon-bitget/` only (CMC + SpotBasis PARKED — do not touch)  
**Default submit track:** AI Trading Desk · Information Extraction & Signal Generation (or Open)  
**SoT:** CONSTRAINTS.md + SCORECARD.md (90/100; thesis 19) + Indu order: thesis ≥23/25 via Personalized Research Workbench  
**Do not rewrite:** IDEA_SLATE.md

## Problem

Asia/EU traders miss US after-hours and overnight moves. They need a natural-language desk that returns a dated, actionable brief (what moved with a real print when available, why it might matter, Skills-backed perception, what to watch at open) — human decides; no auto-orders.

## User

US-hours equity/rToken trader in Asia/EU who sleeps through the US close. Concrete segment: overnight briefing before open — not “all traders.”

## Core loop (Desk)

1. Open AfterHoursDesk.
2. Ask NL question (seed: NVDA after the close / what to watch at open).
3. Desk gathers: ranked headlines + **overnight/after-hours print** (or honest null) + Bitget research Skills digests when available.
4. LLM extracts claims and synthesizes one-page brief.
5. User reads brief; session logged; human decides.

## Must-haves (thesis workbench lift — ≥23/25 thesis)

1. **My desk profile** — segment + risk note + standing thesis; local persist; seed defaults for DEMO.
2. **Watchlist** — multi-ticker desk state (persist); brief portfolio-aware (`watchlist_angle`).
3. **My checklist / thesis notes** — survive sessions; echo on brief (`checklist_echo` + thesis_fit).
4. **Last-N session recall** (optional but preferred) — chips on page.
5. Keep overnight print, Skills, ranked sources, concurrent brief harden from prior slices.
6. DEMO ≤2 min shows personalization clearly; no auto-trade.

## Must-haves (prior polish — still ship)

1. **What moved with a real print** — live after-hours / premarket % or last vs prior close from free/public feed; null + note on fail; never invent %.
2. **Bitget research Skills as perception** — handbook Skills (macro / market-intel / news-briefing / sentiment / technical); surface in UI; no live order execution; LABELED MOCK SKILLS if Hub missing.
3. **Source ranking** — drop low-signal hosts (e.g. pypi.org, non-news).
4. **Concurrent brief harden** — overlapping `/api/brief` must not silently look like live success on fallback/race; queue or timeout UX.
5. Existing Desk: ≤90s research task, LIVE/MOCK badges, multi-ticker integrity (AAPL no NVDA bleed), disclaimer.

## Non-goals (thesis lift)

- Full portfolio/PMS, broker sync, rToken wallet connect, multi-page settings.
- Auto-trade or live Hub orders.
- Rewriting IDEA_SLATE; touching CMC / SpotBasis.

## Non-goals (prior)

- Auto-trade, live Agent Hub order path, multi-broker, portfolio.
- Indu Google Form / X post / public hosting (human submit steps only — see DEMO.md).
- Rewriting IDEA_SLATE or touching CMC / SpotBasis folders.
- Fake overnight % or fake live Skills.

## Success (≤2 min — thesis)

Judge opens Desk → sees My desk seeds → saves a thesis tweak → Run brief → **For my desk** references standing thesis + watchlist → overnight/Skills still present → human decides.

## Success (90 seconds — research core)

Judge runs seed brief → sees overnight % **or** honest unavailable → Skills strip (live or labeled mock) → ranked sources → human-decides disclaimer. Double-click does not produce fake LIVE.

## Cuts accepted

- Paper/order stays stub unless free dry-run assigned later.
- Skills may be mock-stubbed if Hub CLI/MCP not available on box — must be labeled.
