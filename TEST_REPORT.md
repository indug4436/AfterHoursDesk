# TEST_REPORT.md — AfterHoursDesk (quick P1 polish DEMO re-check)

**Tester:** Tester  
**Date:** 2026-09-17  
**Project:** `/workspace/hackathon-bitget/` only (CMC + SpotBasis not touched; no git)  
**SoT:** DEMO.md (+ API_CONTRACT / KNOWN_LIMITATIONS / README)  
**Cycle:** P1 polish — richer digests + checklist PASS/WARN + peer_overnight (Orchestrator GitHub push in parallel)

---

## 1. Verdict

**PASS WITH FIXES**

Save desk → Run NVDA → **For my desk** works with `desk_applied`, thesis_fit, peer overnight strip, checklist **WARN** pills, and non-telemetry Skill digests. Overnight Yahoo live; Skills live. No silent invent. Personalization not broken.

**P0: 0.** **P1: 2** (UI LLM labeled-mock once; residual digest/checklist polish).

---

## 2. Environment

| Item | Value |
|------|--------|
| URL | `http://localhost:3010` |
| Health | live_llm/sources/market/skills true; mode live |
| Artifacts | `test-artifacts/p1-desk.png`, `p1-nvda.png`, `p1-fmd.png` |

---

## 3. Demo walk (vs DEMO.md)

| Beat | Expect | Observed |
|------|--------|----------|
| Open + Save | My desk seeds; Save persist | **Met.** Thesis `P1POLISH17` saved; chips update. |
| NVDA Run | Brief + For my desk | **Met** (~3m15s UI). |
| Peers | Watchlist overnight strip | **Met.** UI/API: AAPL **+5.41%**, TSLA **−2.65%** (Yahoo). |
| Checklist pills | PASS/WARN | **Met.** Both items `status: warn` with notes. |
| Digests | 1–2 bullets, not “44 feeds” | **Met.** No feed-count telemetry; live digests. |
| Overnight / Skills | Live honest | **Met.** Overnight **−4.37%** Yahoo (API); Skills `mode=live` 5/5. UI one run used labeled-mock LLM fallback (honest). |
| Bleed | No AAPL←NVDA invent | **Met** for peers strip; optional AAPL brief not required this quick pass. |

API: `desk_applied: true`; `peer_overnight` present; checklist_echo objects with status; `llm.mode=live` on retest.

---

## 4. Usefulness check

Yes — Save → Run → For my desk shows peers + PASS/WARN + digests without narrator.

---

## 5. Rubric risk

| Area | Risk | Why |
|------|------|-----|
| Personalized workbench | Low | peers + pills + thesis_fit |
| Research digests | Low–med | better than “44 feeds”; macro still a bit feed-y |
| Live honesty | Low | badges / LLM fallback labeled |
| Submit | n/a this slice | Orchestrator pushing GitHub |

---

## 6. Bugs

### P0

*(none)* — personalization intact; no secret overnight invent.

### P1

1. **UI NVDA run hit labeled-mock LLM fallback** while market/Skills stayed live — honest, but film may show MOCK synthesis; API retest got live Qwen.
2. **Checklist WARN vs clear Yahoo overnight %** — “Confirm AH vs prior close” warns even when print is present (wording/consistency polish).

### P2

- Macro digest still mentions “pass any Yahoo Finance symbol” boilerplate.
- Peer set followed current desk watchlist (AAPL/TSLA) not only AAPL/MSFT seed.

---

## 7. Time call

**Ship as-is (P0=0).** No Builder P0 fix round. Optional P1 polish above.

---

## Handoff

`@Orchestrator | artifact: TEST_REPORT.md | verdict: PASS WITH FIXES | P0: 0 | P1: 2`
