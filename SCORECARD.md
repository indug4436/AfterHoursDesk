# SCORECARD — AfterHoursDesk (re-score after My desk thesis-lift)

**Judge:** Judge (independent; not on the build)  
**Product:** AfterHoursDesk  
**Track framing:** AI Trading Desk · Personalized Research Workbench (also Information Extraction)  
**Scored:** Wed 16 Sep 2026 — sealed re-score after My desk workbench  
**Prior scorecard:** **90 / 100 · winner-contender** (Personalized thesis **19/25** — “sharp, not a full workbench”)  
**Allowed inputs:** CONSTRAINTS.md, DEMO.md, README.md, KNOWN_LIMITATIONS.md, running product, optional `test-artifacts/desk-*.png`. IDEA_SLATE / TEST_REPORT excuses / internal debate unused. CMC / SpotBasis parked.

---

## 1. What you were asked to judge

Re-score AfterHoursDesk after **My desk**: persisted profile (segment / risk / standing thesis), watchlist, checklist, last-N; `GET/PUT /api/desk/state`; brief accepts `desk_context` and returns `for_my_desk` (`thesis_fit`, `watchlist_angle`, `checklist_echo`). Overnight + Skills live legs unchanged; no orders. Indu target: **Personalized thesis ≥23**. Score the full card; call thesis out explicitly.

## 2. What you actually experienced

**Health:** live LLM / data / market / skills still true.

**My desk (API + `desk-saved.png` / `desk-nvda.png`):**  
- Panel: Who I am, risk note, standing thesis, watchlist chips, my checklist, Save desk, Recent briefs.  
- `GET/PUT /api/desk/state` persist profile + watchlist; recent sessions N≤5 after briefs.  
- Track chip copy: **Personalized Research Workbench**.

**Personalized brief (API with `desk_context`):**  
- `desk_applied: true`.  
- `brief.for_my_desk`:  
  - **thesis_fit** — cites standing thesis (“fade thin AH gaps unless peer semis confirm”) + risk “no chase” against NVDA AH gap.  
  - **watchlist_angle** — NVDA vs AAPL/TSLA as AI-semis barometer.  
  - **checklist_echo** — exact items from desk_context (`Gap hold 15m`, `Premarket vol vs 20d`, `Peer confirmation`).  
- Overnight still live yahoo-chart; `skills.mode: live`.  

**AAPL (`desk-aapl.png`):** For my desk distinguishes product-cycle move vs AI-infra standing thesis; watchlist read-through; checklist echo; `desk applied` in session line; no NVDA bleed.

**Not a PMS:** 3–8 tickers / short checklist / last-N≤5 — documented. No broker sync / no orders.

## 3. Per-criterion scores

Weights unpublished → **unweighted** sum of four Desk focuses (/25 → /100).

### Feature depth — **25 / 25** *(unchanged)*

Live LLM + news + market + 5 Skills still at ceiling. Desk state is productization, not a new Hub module — no Feature inflation.

### Research quality — **24 / 25** *(unchanged)*

Overnight + ranked sources + equity Skills unchanged. Personalization wraps research; it does not deepen extraction quality. Residual thin market-intel/news digests remain.

### LUI fluency — **23 / 25** *(was 22)*

**+1.** My desk sidebar + **For my desk** callout make the personalized path obvious without a narrator (Save → Run → thesis_fit visible). Latency still long.

### Personalized thesis — **23 / 25** *(was 19)* ★ explicit callout

**+4.** Prior miss was “one brief page, sharp but not a workbench.” This seal closes it:

| Requirement | Evidence |
|-------------|----------|
| Standing thesis persists | PUT/GET + sidebar; echoed in `thesis_fit` |
| Watchlist-aware brief | `watchlist_angle` names peers from desk |
| Checklist survives into brief | `checklist_echo` matches desk items |
| Segment / risk | Asia overnight + “no chase” in thesis_fit |
| Last-N recall | Recent briefs list after sessions |
| Named sub-theme fit | UI: Personalized Research Workbench |

**Indu ≥23: met.** Cap below 24–25: not a full research OS (no multi-day thesis evolution, no broker/PnL, for_my_desk is three structured fields). Honest workbench, not a trading terminal.

## 4. Total

| Focus (AI Trading Desk) | Prior (90) | Now |
|-------------------------|------------|-----|
| Feature depth | 25 | **25** |
| Research quality | 24 | **24** |
| LUI fluency | 22 | **23** |
| **Personalized thesis** | **19** | **23** |
| **Total (unweighted sum)** | **90** | **95 / 100** |

**Delta vs prior:** **+5** (90 → 95), almost entirely Personalized thesis (+4) + LUI (+1).

**Method:** unweighted sum of four equal Desk focus scores.

## 5. Placement band

**winner-contender**

Personalized Research Workbench sub-theme is now demonstrable end-to-end. Submit pack still gates real eligibility.

## 6. Hits

- My desk persists and **changes the brief** (`desk_applied` + non-generic `for_my_desk`).  
- Thesis / watchlist / checklist personalization visible without narrator.  
- Prior live overnight + Skills legs preserved.  
- Human decides; no orders.

## 7. Misses

- for_my_desk is a three-block callout — not deep portfolio analytics.  
- market-intel / news digests still thin (unchanged).  
- Desk state local/file only — no account sync.  
- Human submit pack still required.

## 8. Single change that would move the score most before deadline

**Deepen for_my_desk / market-intel into symbol-relevant bullets** (and finish Google Form + X + public demo). Product-score headroom is now thin; eligibility pack is the real gate.

## 9. Questions a live judge will ask (answers to have ready)

1. **“Is this personalized or one-shot?”** — My desk persists; brief returns `for_my_desk` with thesis_fit / watchlist_angle / checklist_echo.  
2. **“Show my thesis in the brief.”** — For my desk → thesis_fit cites standing thesis + risk note.  
3. **“Watchlist matter?”** — watchlist_angle compares the run symbol to desk peers.  
4. **“Orders?”** — No. Paper stub.  
5. **“Refresh lose state?”** — No — localStorage + `desk-state.json`; Save desk / hydrate documented.

---

**Handoff line:** `@Orchestrator | artifact: SCORECARD.md | band: winner-contender | total: 95/100 | thesis: 23/25`
