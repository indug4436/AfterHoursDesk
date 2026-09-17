# IMPROVEMENT_ANALYSIS — AfterHoursDesk

**Author:** Judge (independent panelist; not on the build)  
**Product:** AfterHoursDesk · Bitget AI Base Camp Hackathon S2  
**Track / sub-theme:** AI Trading Desk · Personalized Research Workbench  
**Basis:** Sealed `SCORECARD.md` **95/100** (thesis **23/25**, band **winner-contender**) + handbook `CONSTRAINTS.md` + `DEMO.md` / `README.md` / `KNOWN_LIMITATIONS.md`  
**Not a re-score.** This is a forward-looking improvement map for Indu.  
**Clock:** Submissions close **21 Sep 2026 UTC+8** (~4 days from this writing).  
**Hard rule:** No inventing live Hub **orders** or Agentic account execution. Desk track = human decides.

---

## 1) Current seal snapshot

| Focus (AI Trading Desk) | Score | Headroom |
|-------------------------|-------|----------|
| Feature depth | **25 / 25** | 0 |
| Research quality | **24 / 25** | 1 |
| LUI fluency | **23 / 25** | 2 |
| Personalized thesis | **23 / 25** | 2 |
| **Total** | **95 / 100** | **5** |

**Band:** winner-contender  

**What the seal already proved:** live LLM (Bitget Qwen) + live NewsAPI + live overnight % (yahoo-chart) + live research Skills (datahub MCP / Yahoo / Fear&Greed) + My desk persistence that **changes** the brief (`desk_applied` + `for_my_desk`: thesis_fit / watchlist_angle / checklist_echo). Honest badges. No auto-orders.

**Product score headroom is thin (≈5 points).** Further polish is marginal unless it clearly lifts Research, LUI, or Thesis. **Eligibility (submit pack) can still zero the entry** if missing.

---

## 2) What already works (keep)

Do not rip these out in a late polish:

1. **Four live legs + honesty** — LLM / DATA / MARKET / SKILLS badges; per-leg soft-fail; never silent invent overnight % or fake live Skills.  
2. **Equity-primary technical** — NVDA/AAPL Yahoo daily RSI/SMA; BTC only as **Crypto risk (not equity)**.  
3. **My desk → For my desk loop** — standing thesis, risk note, watchlist, checklist persist and appear in the brief.  
4. **Single-flight + timeout UX** — 429 `brief_in_flight`; honest timeout copy.  
5. **Prefer-host source ranking** — deny aggregators / junk; symbol-token preference.  
6. **Track posture** — Asia/EU overnight US equity; human decides; paper stub only.  
7. **DEMO ≤2 min** — Save desk → Run brief → point For my desk without a narrator.

---

## 3) Gaps vs Bitget S2 AI Trading Desk / Personalized Research Workbench bar

Handbook Desk focuses: **feature depth · research quality · LUI fluency · personalized thesis**. Sub-themes also include Information Extraction, Review & Self-Evolution, Decision Stress Testing, Execution Assistance — AfterHoursDesk owns **Personalized Research Workbench** (+ extraction). Comparing to that bar:

| Handbook expectation | Status | Gap |
|----------------------|--------|-----|
| NL research workbench; human final decision | Met | — |
| Feature depth / Skill integration | Met at seal (25) | Public datahub ≠ full Agent Hub account Skills — OK for Desk; do not fake orders |
| Research quality: question → actionable insight | Strong (24) | Skill digests still count-heavy; claims could be tighter |
| LUI fluency | Strong (23) | 50–150s brief latency; dense single page |
| Personalized thesis / workbench | Met ≥23 | No multi-day thesis evolution; for_my_desk is three fields |
| Accessible demo + materials link | **Unknown / human** | Must exist for judging access |
| Compliant X `#BitgetHackathon` + `@Bitget_AI` | **Unknown / human** | Missing = **invalid** |
| Project description (6 parts) + LLM role | **Unknown / human** | Missing = **invalid** |
| Review & Self-Evolution / Stress Testing | Not claimed | Optional adjacent depth — only if time |
| Execution Assistance | Stub paper only | Correct for Desk; **do not** pivot to Agentic orders |

---

## 4) What’s missing / thin (by focus)

### Product / Feature (score already 25 — improve for judges’ trust, not points)

- No public deploy / recording linked in README (judge-followable URL).  
- README still under-sells My desk / live Skills (docs lag product).  
- Paper-agent stub is fine; claiming “Agent Hub trading” would be a DQ-risk lie — **skip**.

### Research quality (largest *product* point lever left: ~1 pt)

- `market-intel` / `news-briefing` digests often “15 keys” / “44 feeds” — not symbol-relevant bullets.  
- “MACD-ish” is approximate.  
- Source list still sometimes admits weak-relevance finance pages after ranking.  
- No explicit claim→source quote snippets (only ids).

### LUI fluency (~1–2 pts)

- Live Qwen latency dominates DEMO feel.  
- Single long scroll; Skills + sources compete with For my desk.  
- No streaming / progressive “overnight first, then synthesis” UX.

### Personalized thesis (~1–2 pts to approach 25)

- for_my_desk is three blocks — no thesis history / “how my thesis changed.”  
- Watchlist angle is prose, not a mini peer table (AH % for peers).  
- Checklist echo lists items; does not mark pass/fail against overnight print.  
- No multi-session “review & self-evolution” loop.

### Submit-validity (binary — can nullify 95)

- Google Form six-part description + LLM role.  
- Submission materials link (repo + accessible demo/video).  
- Compliant X post.  
- Track → **Personalized Research Workbench** (or Information Extraction) selected deliberately.

---

## 5) Ranked next-level roadmap

### P0 — Must-have for submit validity (human / Orchestrator clock)

| # | Item | Owner | Why |
|---|------|-------|-----|
| P0.1 | Google Form: Project Description (6 parts) + Role of LLM | Indu | Invalid without |
| P0.2 | Track → sub-theme lock (Personalized Research Workbench) | Indu | Prize routing |
| P0.3 | Public repo + accessible demo (deploy **or** ≤2–4 min video of DEMO.md) | Indu + light Builder | Desk minimum materials |
| P0.4 | Compliant X: `#BitgetHackathon` + `@Bitget_AI` + product intro (not bare RT) | Indu | “No compliant X = incomplete” |
| P0.5 | Retweet official promo when URL known | Indu | Handbook requirement |

**Do before 21 Sep UTC+8:** all P0. **Skip product rewrites until P0.3–P0.4 are drafted.**

### P1 — High-leverage product lifts (toward high-90 / defend 95–97)

| # | Lift | Focus lever | ~pts | Effort | Risk | Before 21 Sep? |
|---|------|-------------|------|--------|------|----------------|
| P1.1 | **Symbol-relevant Skill digests** — market-intel & news-briefing → 1–2 bullets each tied to symbol/thesis (not feed counts) | Research | +0.5–1 | M (½–1 day) | Low | **Do** if one polish left |
| P1.2 | **Peer overnight strip** — watchlist tickers show AH % beside watchlist_angle | Thesis + Research | +0.5–1 | M | Med (rate limits / Yahoo) | **Do** if easy; else skip |
| P1.3 | **Checklist pass/fail** — echo items marked vs overnight print / headlines | Thesis + LUI | +0.5 | S–M | Low | **Do** if quick |
| P1.4 | **Progressive brief UX** — show overnight + sources first; stream or stage LLM | LUI | +0.5–1 | M–L | Med (race / single-flight) | **Skip** unless latency becomes DEMO-blocker |
| P1.5 | **README + DEMO polish** — judge-facing “My desk + live legs” in ≤3 min | LUI / trust | 0–0.5 | S | None | **Do** with P0.3 |
| P1.6 | **Claim snippets** — 1-line quote under each claim from source title/snippet | Research | +0.5 | S–M | Low | Optional |

### P2 — Stretch / post-hackathon (or only if P0 done early)

| # | Lift | Focus lever | ~pts | Effort | Risk | Before 21 Sep? |
|---|------|-------------|------|--------|------|----------------|
| P2.1 | Thesis journal — last-N diffs (“thesis held / broken”) | Thesis | +0.5–1 | L | Med | **Skip** pre-submit |
| P2.2 | Decision Stress Testing mode — “what would falsify my thesis?” | Thesis / adjacent sub-theme | +0–1 | L | Med | **Skip** |
| P2.3 | Bitget Playbook packaging / Demo Day extras | Non-score | — | L | — | Post |
| P2.4 | Real Agentic / paper-order path | **Wrong track risk** | — | XL | **High** (DQ / off-theme) | **Skip** — Desk ≠ Agentic |
| P2.5 | Multi-user auth / cloud desk sync | Productization | 0 score | L | Med | Post |
| P2.6 | True streaming tokens from Qwen | LUI | +0.5 | L | Med | Post |

---

## 6) Effort / risk / do-skip summary (P1–P2)

**Before deadline, optimize for eligibility first, then one Research/Thesis micro-lift.**

- **Do:** P0.1–P0.5 without fail.  
- **Do (one product slice):** P1.1 (± P1.3 if same day).  
- **Maybe:** P1.2 if Yahoo peer prints are already cheap in `market.mjs`.  
- **Skip before submit:** P1.4, P2.* especially P2.4 (orders).

---

## 7) Single recommended next product slice (if Indu wants one more polish)

**Name:** “Skill digests that read like research, not telemetry.”

**Scope (≤1 Builder day):**

1. Rewrite `market-intel` and `news-briefing` summaries to **1–2 symbol-relevant sentences** using existing MCP/news payloads (e.g. “Oil/DXY: … → risk-on/off for semis”; “Top NVDA-relevant headline: …”).  
2. Optionally mark **checklist_echo** items with pass/warn/fail heuristics (AH % present; guidance keyword in claims).  
3. Update DEMO verbal beat: point at richer digests + For my desk.  
4. **Do not** touch order stubs, Hub trading, or new tracks.

**Expected lever:** Research **24→25** and/or Thesis **23→24** → total **~96–97**.  
**Why this slice:** Matches sealed SCORECARD “single change” advice; lowest risk; visible on DEMO without new infra.

**If time is only 2–4 hours:** skip product — finish **P0 video + X + form** instead. That protects the 95 more than chasing 97.

---

## 8) Honest ceiling: 98–100 vs out of scope

### What ~96–97 needs (in-scope Desk)

- Richer Skill digests + slightly sharper for_my_desk / peer AH context.  
- Snappy DEMO recording with live badges + My desk personalization.  
- Flawless submit narrative (validation metrics: e.g. desk_applied rate, live_skills rate, sample overnight prints).

### What ~98–100 would argue for (diminishing / subjective)

- Near-perfect research: cited quote spans, zero weak sources, crisp TA (real MACD, not “MACD-ish”).  
- Sub-30s perceived LUI (cache, progressive paint, or faster model path).  
- Light “self-evolution”: thesis journal across nights.  
Even then, **pure judge scoring** means 100 is not guaranteed.

### Out of scope for this Desk track (do not chase for points)

- **Autonomous order placement / live Agentic trading** — that is Agentic Trading track; inventing it here risks off-theme claims.  
- PnL / Sharpe as primary metric — Alpha Factory.  
- Pretending paper stub is live Hub execution.  
- Expanding to full PMS / broker sync before deadline.

---

## Appendix — Scorecard reference (not a new seal)

Sealed **95/100** · Feature 25 · Research 24 · LUI 23 · Thesis 23 · band winner-contender · thesis target ≥23 **met**.

---

**Handoff:** `@Orchestrator | artifact: IMPROVEMENT_ANALYSIS.md | seal: 95/100 | next_slice: P1.1 skill digests (or P0 submit pack if time-poor)`
