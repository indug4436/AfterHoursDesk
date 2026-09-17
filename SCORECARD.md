# SCORECARD — AfterHoursDesk (re-score after progressive SSE + P1 polish)

**Judge:** Judge (independent; not on the build)  
**Product:** AfterHoursDesk  
**Track framing:** AI Trading Desk · Personalized Research Workbench  
**Scored:** Wed 17 Sep 2026 — sealed re-score after progressive SSE, claim snippets, thesis journal (+ prior P1 digests / peer strip / checklist status)  
**Prior scorecard:** **95 / 100 · winner-contender** (Feature 25 · Research 24 · LUI 23 · Thesis 23)  
**Allowed inputs:** CONSTRAINTS.md, DEMO.md, README.md, KNOWN_LIMITATIONS.md, prior SCORECARD / IMPROVEMENT_ANALYSIS for delta, running product, optional `test-artifacts/sse-final.png`, `p1-*.png`, `progressive-nvda.sse`. IDEA_SLATE / TEST_REPORT excuses unused. CMC / SpotBasis parked.  
**Repo noted:** https://github.com/indug4436/AfterHoursDesk (public). Paper stub; no orders.

---

## 1. What you were asked to judge

Re-score AfterHoursDesk against Bitget S2 AI Trading Desk focuses after: progressive SSE (`early` overnight/sources with `llm.pending` — not fake LIVE — then `final` live LLM); claim title snippets; light thesis journal (`thesis_note` on recent_sessions); P1 digests / checklist PASS-WARN / peer overnight strip already in.

## 2. What you actually experienced

**Health:** `live_llm/sources/market/skills: true`.

**Progressive SSE (artifact + live smoke ~101s):**  
- `event: early` → `mode: partial`, **`llm.mode: pending`**, overnight live yahoo-chart, peers (AAPL/MSFT %), desk shell, skills digests, sources; **claims empty**.  
- `event: final` → `mode: live`, **`llm.mode: live` / qwen3.8-max**, claims filled with **`snippet` + `source_title` + `source_host`** matching ranked sources.  
- UI/`sse-final.png`: LIVE badges post-final; claim lines show source titles under bullets; Thesis journal in My desk; checklist WARN/PASS notes.

**Personalization:** `desk_applied: true`; peer_overnight strip; checklist_echo with **status**; thesis_note on recent e.g. `thesis held (dip print)` / `move material — re-check thesis`.

**Residual:** some Skill digests still soft (“no NVDA-specific headline in payload” while Sources list NVDA titles); occasional weak host (e.g. fool.com.au ETF) still ranks; total LLM wait still ~100s; DEMO_VIDEO_URL placeholder in README.

## 3. Per-criterion scores

Weights unpublished → **unweighted** sum of four Desk focuses (/25 → /100).

### Feature depth — **25 / 25** *(unchanged)*

Already at ceiling (live LLM + news + market + Skills + desk state). SSE staging is delivery, not a new data module.

### Research quality — **24 / 25** *(unchanged numerically; quality up)*

**Claim snippets** close the “ids only” miss — each claim ties to a ranked source title. Peer overnight % adds comparative context. Digests improved vs telemetry-only, but news-briefing can still say “no NVDA headline” while Sources contradict; MACD-ish remains approximate; ranking still admits some weak hosts. Cap stays **24** — not a full 25.

### LUI fluency — **24 / 25** *(was 23)*

**+1.** Progressive paint with **honest PENDING LLM** (never fake LIVE mid-flight) is the right latency strategy for Desk. Save → early shell → final claims is DEMO-visible without a narrator. Cap below 25: wall-clock still ~100s to final; not token streaming.

### Personalized thesis — **24 / 25** *(was 23)*

**+1.** Peer overnight strip + checklist **PASS/WARN** + **thesis journal** heuristics make the workbench feel multi-session, not a one-shot callout. Still not a full research OS (heuristic journal ≠ self-evolution model; no broker/PnL).

## 4. Total

| Focus | Prior (95) | Now |
|-------|------------|-----|
| Feature depth | 25 | **25** |
| Research quality | 24 | **24** |
| LUI fluency | 23 | **24** |
| Personalized thesis | 23 | **24** |
| **Total** | **95** | **97 / 100** |

**Delta vs prior:** **+2** (95 → 97) — LUI +1 (progressive honesty), Thesis +1 (journal + peer/checklist status). Research improved in-kind (snippets) but score held at 24 on residual digest/source noise.

**Method:** unweighted sum of four equal Desk focus scores.

## 5. Placement band

**winner-contender**

Public repo helps materials accessibility. Submit form + compliant X + real demo video URL still gate eligibility.

## 6. Hits

- Progressive SSE with `llm.pending` → `live` honesty.  
- Claim snippets bound to ranked source titles (no invented quotes).  
- Thesis journal + peer overnight + checklist status deepen My desk.  
- Public GitHub repo linked. No orders claimed.

## 7. Misses

- Research still leaves ~1 pt (digest/source consistency).  
- `DEMO_VIDEO_URL` placeholder — video not verified in seal.  
- Human Google Form + compliant X not product-proven.  
- Final brief latency still long.

## 8. Single change that would move the score most before deadline

**Human submit pack:** paste real demo video URL, complete Google Form (6 parts + LLM role), compliant X (`#BitgetHackathon` + `@Bitget_AI`). Product score is ~maxed; eligibility is the cliff.  
**If one product micro-fix:** make news-briefing digest cite top ranked NVDA source titles (align digests with Sources) — could unlock Research **25** → **98**.

## 9. Questions a live judge will ask (answers to have ready)

1. **“Is LLM live while overnight paints?”** — No; badge PENDING until `final`.  
2. **“Where are claim citations?”** — Snippet/source_title under each claim.  
3. **“Does my thesis persist across briefs?”** — My desk + thesis journal notes on recent_sessions.  
4. **“Public materials?”** — GitHub `indug4436/AfterHoursDesk`; video URL must be filled for form.  
5. **“Orders?”** — No. Paper stub; human decides.

---

**Handoff line:** `@Orchestrator | artifact: SCORECARD.md | band: winner-contender | total: 97/100`
