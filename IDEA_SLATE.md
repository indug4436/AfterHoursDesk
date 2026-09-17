# IDEA_SLATE.md — Bitget AI Base Camp Hackathon S2

**SoT:** `/workspace/hackathon-bitget/CONSTRAINTS.md`  
**Author:** Ideator  
**Date:** 2026-09-10  
**Project path:** `/workspace/hackathon-bitget/` only (CMC ShelfMCP parked elsewhere — do not mix).  
**Rule:** Do **not** lock. Wait for Indu’s pick via Orchestrator.

---

## Constraint restatement (5 lines)

1. Theme: **AI × US stocks / tokenized US stocks (rToken) / related contracts** — preference for real, runnable strategies and tools (“humans sleep — Agents don’t”).
2. Clock: build/submit by **21 Sep 2026 (UTC+8)** — ~**11 days** / ~266h from Brief stamp; voting 22–28 Sep.
3. Pick **one** main track (+ sub-theme): Alpha Factory · Agentic Trading · AI Trading Desk (≤2 themes per team if a second later).
4. Musts: Google Form (six-part description + LLM role), materials link, compliant X post `#BitgetHackathon` `@Bitget_AI`, track-specific demo/backtest/paper log.
5. Assets: **none confirmed** (no Bitget UID, Agent Hub OAuth, Qwen credits, API keys) — every idea labels blockers. Rubric weights for Grand Prize **not published**; track mechanisms differ (quant / 50-50 / pure judge).

---

## Ideas (6)

### 1. AfterHoursDesk — RECOMMENDED

**What it is**  
An **AI Trading Desk** research workbench: trader asks a natural-language question about after-hours / overnight US equity or rToken moves; the desk pulls structured headlines + price context (public or Bitget read-only when available), extracts claims, and returns an **actionable brief** (what moved, why it might matter, what to watch at open) — human decides. Sub-theme fit: **After-Hours Information Pricing** spirit under Desk’s Information Extraction & Signal Generation / Open Theme.

**Example walkthrough**  
User Maya (US-hours trader in Asia) asks: “What hit NVDA after the close and what should I watch at open?” Desk runs: ingest → extract events → attach overnight % if available → one-page brief + sources. Judge completes question → insight in ≤90s on a public demo URL.

**Who / why useful**  
Asia/EU traders who sleep through US close. Pain: tab-hopping news + charts before open. Complete loop without auto-orders.

**Rubric map**  
- Desk = pure judge scoring → feature depth, research quality, LUI fluency  
- Useful → concrete overnight brief, not “all traders”  
- LLM role → extraction + synthesis (stated in form)  
- Runnable → web demo; Agent Hub Skill optional later  

**Wow moment**  
Typed question → 20s later: dated claims, overnight move callout, “watch at open” checklist on screen.

**Stack**  
Next/Vite UI + Node API; optional Bitget Agent Hub MCP `--read-only`; Qwen or any LLM for extraction; public news RSS / Finnhub-style free tier if needed.

**Ship slice vs cut**  
Ship: 1 ticker flow (NVDA or AAPL), brief template, demo URL, sample session log.  
Cut: portfolio, auto-trade, multi-broker, full sentiment graph.

**What we mock**  
Bitget market data if no UID — **labeled mock** + path to swap Agent Hub. Never fake X compliance.

**Main risk / blockers**  
- **Blocker:** Bitget UID / Agent Hub not confirmed — demo must run without them day one.  
- News ToS / rate limits — cache sample corpus for offline judge path.

---

### 2. EarnBrief — BACKUP

**What it is**  
Earnings-week **AI Trading Desk**: paste a ticker + earnings date (or pick from a short curated list); LLM produces a pre-earnings checklist and post-print “what changed” memo (estimate vs narrative), with decision stress questions for the human. Sub-theme: **Earnings-Driven** (Desk) / Decision Stress Testing.

**Example walkthrough**  
User Arun selects TSLA into earnings week → gets pre-brief (known risks, history of post-print moves as cited metrics) → after fake/sample print, stress questions (“gap and fade vs hold?”). Human never auto-trades.

**Who / why useful**  
Discretionary traders who want a repeatable earnings ritual, not a black-box bot.

**Rubric map**  
- Judge Desk criteria: research quality + personalized thesis  
- Clear LLM role in form  
- Validation = one complete research task with saved output  

**Wow moment**  
Side-by-side “before print / after print” cards generated in one click.

**Stack**  
Same boring web stack + LLM; optional Agent Hub later.

**Ship slice vs cut**  
Ship: 3 tickers, pre+post templates, export markdown.  
Cut: live filings scrape farm, options chains, auto size.

**What we mock**  
Historical earnings snippets in fixtures if APIs blocked.

**Main risk / blockers**  
- **Blocker:** live Bitget rToken quotes optional — do not hard-require.  
- Hallucinated numbers — every figure must cite fixture or API field.

---

### 3. rTokenLens

**What it is**  
Desk tool comparing **tokenized US stock (rToken) narrative vs underlying equity story** in plain language: same name, two venues, what an AI research pass flags as divergence themes (hours, liquidity caveats, correlation talk) — educational + research, not arb execution. Track: **AI Trading Desk** · Open Theme or Cross-Asset.

**Example walkthrough**  
User Kim picks “tokenized NVDA vs NVDA” → desk shows structured comparison brief + “questions a human should ask before size.”

**Who / why useful**  
Crypto-native users entering tokenized equities who lack a TradFi research habit.

**Rubric map**  
- Theme-aligned (tokenized US stocks named in handbook)  
- Judge-friendly demo  
- Honest about data gaps  

**Wow moment**  
One screen: “same company, different market hours” explainer with AI-sourced bullet risks.

**Stack**  
Web + LLM; Bitget market endpoints when unlocked; fixtures otherwise.

**Ship slice vs cut**  
Ship: 2 pairs, comparison template, demo.  
Cut: live arb, inventory, MM.

**What we mock**  
rToken quotes if Bitget gated — labeled.

**Main risk / blockers**  
- **Blocker:** Bitget rToken market API access unknown without UID.  
- Must not invent arb PnL.

---

### 4. PaperSentinel (Agentic — higher friction)

**What it is**  
**Agentic Trading** wedge: event-driven agent that watches a small US equity / rToken watchlist, proposes orders with a **risk-control layer** (max size, kill switch), and executes **paper only** via Bitget Agent Hub `--paper-trading`. Sub-theme: Event-Driven Agent / Market Sentiment Agent.

**Example walkthrough**  
Agent sees sample “earnings beat” event → explains decision → paper order ticket → risk check → paper fill log for judges.

**Who / why useful**  
Builders who want autonomous loop with audit trail.

**Rubric map**  
- 50% quant (paper Sharpe etc.) + 50% judge (explainability, architecture, risk)  
- Needs paper trading log during competition (handbook recommends ≥2 weeks — **tight vs ~11d clock**)  

**Wow moment**  
Live UI: event → reasoned plan → blocked/allowed by risk gate → paper log line.

**Stack**  
Bitget Agent Hub + thin dashboard; Qwen optional.

**Ship slice vs cut**  
Ship: 1 event type, 1 symbol, paper log, risk gate.  
Cut: multi-agent, live funds, complex portfolio opt.

**What we mock**  
Events from fixtures if feeds missing; **cannot mock paper log as “live competition log”** — must be real run window.

**Main risk / blockers**  
- **Hard blocker:** Bitget Agent Hub / paper account / UID not confirmed.  
- Clock: ≥2 weeks paper ideal vs ~11 days left — start immediately if picked or accept shorter log + honest note.  
- Kill if keys don’t land in 48h → fall back to Desk idea.

---

### 5. CloseOpenAlpha (Alpha Factory)

**What it is**  
Simple **after-hours → open** quantitative strategy on US equities (or rToken proxy series): signal from overnight return / gap features, backtested with **≥60 days total, ≥30 OOS**. AI used to propose/refine features and write the strategy report — core is verifiable backtest. Sub-theme: After-Hours Information Pricing / Open Theme.

**Example walkthrough**  
Judge opens repo → runs backtest notebook/CLI → sees IS/OOS Sharpe, max DD, turnover table → reads AI feature note.

**Who / why useful**  
Quant-curious traders who want a checked overnight gap strategy, not chat UI.

**Rubric map**  
- Pure quantitative scoring (Sharpe, Sortino, MDD, OOS decay)  
- LLM role = research assistant, not the PnL engine  

**Wow moment**  
One command prints OOS metrics that don’t collapse vs IS (or honestly show decay).

**Stack**  
Python (pandas/vectorbt or plain), public OHLC (Yahoo/Polygon free), optional Bitget data later.

**Ship slice vs cut**  
Ship: 1 signal family, full backtest report, code link.  
Cut: live execution, Agent Hub, UI chrome.

**What we mock**  
Nothing on backtest numbers — must recompute from data. Bitget live feed optional.

**Main risk / blockers**  
- Data quality / survivorship — document sources.  
- **Soft blocker:** Bitget UID not required for public-data backtest; form may still ask Bitget UID — confirm.  
- Less “Agent Hub” showcase than Desk/Agentic.

---

### 6. StressPad

**What it is**  
**AI Trading Desk · Decision Stress Testing:** user pastes a proposed trade thesis; LLM attacks it (counter-scenarios, missing data, regime breaks) and outputs a go/no-go checklist. Human remains decision-maker.

**Example walkthrough**  
User pastes “long rToken NVDA into open on after-hours AI news” → StressPad returns 5 failure modes + what evidence would change the mind.

**Who / why useful**  
Traders who want red-team on their own ideas before size.

**Rubric map**  
- Desk subjective: research quality + LUI  
- Fast to ship; weak if shallow prompts  

**Wow moment**  
Thesis in → hostile brief out in 15s with concrete “would invalidate if…” lines.

**Stack**  
Minimal web + LLM; no exchange keys required.

**Ship slice vs cut**  
Ship: paste box, 1 template, save transcript.  
Cut: brokerage connect, portfolio sim.

**What we mock**  
None critical.

**Main risk / blockers**  
- Lowest Bitget integration — may score lower on “runnable Bitget ecosystem” preference unless Agent Hub Skill wrapper added.  
- Add thin Agent Hub skill call when UID exists.

---

## Score table (1–5)

| Idea | Rubric fit | Usefulness | Wow | Feasibility (~11d, no keys) | Notes |
|------|------------|------------|-----|------------------------------|-------|
| AfterHoursDesk | 5 | 5 | 5 | 5 | Best Desk + theme fit; keys optional |
| EarnBrief | 5 | 5 | 4 | 5 | Strong backup; earnings calendar care |
| rTokenLens | 5 | 4 | 4 | 4 | Theme-perfect; data blocker labeled |
| PaperSentinel | 5 | 4 | 5 | 2 | Needs Hub + paper time — risky |
| CloseOpenAlpha | 5 | 4 | 3 | 4 | Quant path; less product UI |
| StressPad | 4 | 4 | 3 | 5 | Fast but thinner Bitget story |

---

## Recommend

| Role | Idea | Track / sub-theme | Rationale |
|------|------|-------------------|-----------|
| **Pick** | **AfterHoursDesk** | AI Trading Desk · Information Extraction & Signal Generation (or Open) | Matches handbook after-hours framing, ships without Bitget keys, judge-friendly demo in 90s, room to bolt Agent Hub `--read-only` when Indu has UID. |
| **Backup** | **EarnBrief** | AI Trading Desk · Earnings-Driven / Decision Stress Testing | Same track economics; distinct wow; still key-light. |

**Do not pick PaperSentinel first** unless Indu confirms Agent Hub + paper trading within 24–48h (clock + blockers).  
**Do not lock.** Orchestrator escalates pick to Indu only.

**If Indu later wants Agentic/Alpha:** reopen only after assets land; do not silently widen AfterHoursDesk into a live trading bot.

---

## Handoff

@Orchestrator | artifact: IDEA_SLATE.md | path: /workspace/hackathon-bitget/IDEA_SLATE.md | project: hackathon-bitget | recommended: AfterHoursDesk | backup: EarnBrief | waiting: Indu pick | DoD: 4–6 scored ideas; human chooses before Pre-coder  

CMC path untouched.
