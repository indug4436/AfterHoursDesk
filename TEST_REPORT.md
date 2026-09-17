# TEST_REPORT.md — AfterHoursDesk (My desk thesis-lift DEMO re-check)

**Tester:** Tester  
**Date:** 2026-09-16  
**Project:** `/workspace/hackathon-bitget/` only (CMC + SpotBasis not touched)  
**SoT:** DEMO.md (+ API_CONTRACT / KNOWN_LIMITATIONS / README)  
**Cycle:** Personalized Research Workbench — thesis ≥23/25 lift (Save desk → Run → For my desk)

---

## 1. Verdict

**PASS WITH FIXES**

Hostile DEMO completes: My desk seeds visible; Save persists across hard refresh; NVDA brief returns `desk_applied: true` + `for_my_desk` with thesis_fit / watchlist_angle / checklist_echo echoing saved desk (DESKTEST17); overnight live; Skills live; AAPL distinct with **no NVDA bleed**. Save→Run→For my desk within ~2 min spirit.

**P0: 0.** **P1: 1** (submit-pack / X — prior Orchestrator clock).

---

## 2. Environment

| Item | Value |
|------|--------|
| URL | `http://localhost:3010` |
| Health | live_llm/sources/market/skills true; mode live |
| Desk APIs | GET/PUT `/api/desk/state` persist OK |
| Artifacts | `test-artifacts/desk-saved.png`, `desk-nvda.png`, `desk-aapl.png` |

---

## 3. Demo walk (vs DEMO.md)

| Beat | Expect | Observed |
|------|--------|----------|
| 0–15s | My desk seeds without Save | **Met.** Asia overnight profile, thesis, NVDA/AAPL/MSFT, checklist. |
| 15–35s | Edit → Save → persist | **Met.** DESKTEST17 saved; hard refresh retained. API PUT also persisted thesis + AMD watchlist. |
| 35–70s | NVDA Run + For my desk | **Met.** Overnight **−4.16%** UI / **−4.34%** API. thesis_fit + watchlist_angle + checklist_echo + desk applied. Skills live. |
| 70–95s | Personalization real | **Met.** DESKTEST17 / AI infra dips echoed; peers AAPL/MSFT/AMD in watchlist_angle; checklist items echoed. Not generic theater. |
| 95–120s | AAPL; no bleed | **Met.** Overnight **+5.49%**; distinct personalization; zero NVDA event bleed. |

API: `desk_applied: true`; all three `for_my_desk` fields present; `skills.mode=live`; overnight Yahoo live.

---

## 4. Usefulness check

Yes — new user can Save desk → Run NVDA → see For my desk without Builder narration. Personalization is portfolio-aware.

---

## 5. Rubric risk

| Area | Risk | Why |
|------|------|-----|
| Personalized thesis | Low | for_my_desk + persist prove workbench |
| Does it work | Low | DEMO path complete |
| Live legs | Low | overnight + Skills still live |
| Docs | Low | DEMO matches |
| Submit pack | Med | public materials / X still Orchestrator |

---

## 6. Bugs

### P0

*(none)*

### P1

1. **Submit materials / compliant X promo** — still Indu/Orchestrator clock (unchanged).

### P2

- PUT body checklist keys may normalize to `my_checklist` server-side (UI path OK).
- Occasional prior LLM fallback headlines remain in recent_sessions recall (honest labels).

---

## 7. Time call

**Ship as-is (P0=0).** No Builder P0 fix round.

---

## Handoff

`@Orchestrator | artifact: TEST_REPORT.md | verdict: PASS WITH FIXES | P0: 0 | P1: 1`
