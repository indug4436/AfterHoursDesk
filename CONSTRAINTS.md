# CONSTRAINTS.md

## 1. Event
- **Name:** Bitget AI Base Camp Hackathon S2 (hub: “Bitget AI × 加密货币黑客松” / “Bitget AI · Genesis Season 2”)
- **Organizer:** Bitget
- **Token sponsors / partners (handbook):** Alibaba Cloud Qwen; Bitget Wallet, Foresight, Arbitrum, Solana, Tether Foundation, Kaito AI, Cysic, Wave, 706, and 7 university blockchain associations (more TBD)
- **Official URL(s):**
  - Landing hub: https://www.bitget.com/activity-hub/hackathon
  - S2 handbook (EN): https://bitget-ai.gitbook.io/bitgetai_hackathons2
  - Submission Google Form: https://forms.gle/GyWZCMCPocgJdJon6
  - Agent Hub docs / install prompt: https://www.bitget.careers/support/articles/12560603894122
  - Agent Hub GitHub: BitgetLimited/agent_hub (linked from handbook)
- **Theme framing (handbook):** “When tokenized US stocks make 7×24 the new normal, humans sleep — Agents don't.” Focus: **AI × US stock trading (including tokenized US stocks / related contract scenarios)**, preference for **real, runnable strategies and tools**.

## 2. Eligibility
- **Format:** Global, online
- Solo or teams OK: “individuals and teams have equal opportunity. For solo participation, enter ‘Individual’ in the form’s ‘Team Members’ field.”
- **No separate registration** — “Submission complete = participation complete”
- University Special Prize: optional layer if full university name filled (not a fourth track)
- **S1 reuse:** “Submissions that directly port S1 entries, or only rename / make minor edits, are not accepted.” Continuing an S1 direction requires describing **substantive new additions**; judging evaluates new content
- Trading experience not required: backtest / simulated / paper trading accepted per track rules
- Multi-theme: “A team may submit to at most **2 different themes**… each… independent project… separate form submission”

## 3. Clock
All times **UTC+8** unless noted.

| Milestone | Date (handbook Ch. III) |
| --- | --- |
| Opens / submissions accepted | **3 Sep 2026** |
| Competition / build window | **3 Sep – 21 Sep 2026** |
| **Submission deadline** | **21 Sep 2026** (“complete Google Form submission before 9/21”; hub: “9/21 提交截止”) |
| Public voting (hub) | **22–28 Sep 2026** |
| Judge review (handbook) | **22 Sep – 10/7** (parallel with voting; neither replaces the other) |
| Winners announced | **8 Oct 2026** |
| Spotlight / Demo Day long-tail / payouts | From **9 Oct 2026** |

- **Remaining (approx., as of ~13:20 UTC Thu 10 Sep 2026):** ~**266 hours** (~11.1 days) if deadline = **21 Sep 2026 24:00 UTC+8** (= 21 Sep 16:00 UTC).
- **Conflict / ambiguity (flag):** Handbook FAQ still mentions “attach compliant X post at submission on **9/23**” and audience voting “**9/24 – 9/29**” in places; Chapter III + hub + Event Period table say **9/21** deadline and **9/22–9/28** voting. **Prefer hub + Chapter III (9/21).** Exact clock on the Google Form not verified live.
- Hub countdown UI may show remaining time visually; treat handbook dates as SoT for planning.

## 4. Theme and tracks
**Three main tracks** (shared prize pool):

1. **Alpha Factory · Quantitative Strategies** — “Use AI to build runnable US stock quantitative / algorithmic trading strategies. AI is a tool for strategy development… core is strategy effectiveness and verifiability.”
   - Named sub-themes: Arbitrage; After-Hours Information Pricing; Cross-Market Correlation Strategies; rToken Factor Strategies; Cross-Asset Allocation / Rotation; + **Open Theme** (2 open slots)
2. **Agentic Trading · Agent Trading** — “The LLM is the primary trading decision-maker… Agent must sense the environment, make independent judgments, and autonomously place orders with risk controls.”
   - Named sub-themes: Event-Driven Agent; Market Sentiment Agent; Earnings-Driven Trading Agent; Cross-Asset Execution Agent; Factor Discovery Agent; + Open Theme
3. **AI Trading Desk · AI Research Workbench** — “natural-language-driven AI research workbench. AI processes information… human traders make final decisions.”
   - Named sub-themes: Information Extraction & Signal Generation; Review & Self-Evolution; Decision Stress Testing; Personalized Research Workbench; Execution Assistance; + Open Theme

**Prize tracks / awards (participant side):**
- Grand Prize ×1 — 3,000 USDT
- Theme Prize ×15 — 500 USDT each (1 per named sub-theme)
- Open Theme Prize ×6 — 500 USDT each (2 per main track)
- University Special Prize ×10 — 500 USDT
- Best Spread Award ×3 — 300 USDT (1 per track; X reach; exclusivity rules)
- Fan Favorite ×3 — 300 USDT (1 highest-voted per track; can stack with judge prizes)
- **Total prize pool: 50,000 USDT**
- Non-cash: Official Spotlight, Demo Day, ecosystem exposure, Playbook productization opportunity, Qwen build credits, K3 subsidy

## 5. Submission artifacts
**Portal:** Google Form https://forms.gle/GyWZCMCPocgJdJon6 (CN/EN, same fields). Submit anytime from 9/3; no separate registration.

**Required (all tracks) — invalid if missing:**
- **Project Description** (form long-form; six parts; GitHub/X cannot substitute)
- **Role of the LLM in Your Project**
- **Submission Materials Link** (Demo / code / video / docs / logs — track-specific)
- **X Promotional Post Link** — must include `#BitgetHackathon` + `@Bitget_AI`; interactive promo introducing product/Agent/strategy; also retweet official post ([TBD link] in handbook). “No compliant X post = incomplete submission”
- **Track → Sub-theme** selection

**Optional form fields:** University Name; Apply for Demo Day; Apply for K3 Token Subsidy; S1 participant / substantive new additions if applicable

**Per-track materials (minimum):**
| Track | Must ship |
| --- | --- |
| Alpha Factory | Alpha source in description; strategy code link; **backtest** (total ≥60 days, OOS ≥30 days; market-making may substitute continuous high/low vol records); compliant X post |
| Agentic Trading | Runnable Demo; event→decision→execution flow; **paper trading log** (run during competition, recommended ≥2 weeks); compliant X post |
| AI Trading Desk | Accessible Demo; one complete research task (question → actionable insight); compliant X post |

**Project description six parts** (judges weigh first three most): Thesis; Target user & product value; Validation data & key metrics; Progress; Deliverables; Optional take on AI Trading.

## 6. Judging criteria
**Overall numeric weights across Grand Prize:** **weights not published** as a single weighted rubric table.

**Track scoring mechanisms (verbatim handbook):**
- **Alpha Factory:** “Scoring mechanism: Pure quantitative scoring.” Focus: “Sharpe, Sortino, max drawdown, turnover; out-of-sample Sharpe decay (reference alert: OS < 0.5×IS); rolling 30-day Sharpe stability.”
- **Agentic Trading:** “Scoring mechanism: 50% quantitative + 50% judge scoring.” Focus: “Paper trading Sharpe, max drawdown, win rate; decision explainability; Agent architecture quality; risk control layer effectiveness.”
- **AI Trading Desk:** “Scoring mechanism: Pure judge subjective scoring.” Focus: “Feature depth (data sources / Skill integration count and effectiveness), research quality, LUI fluency, personalized thesis.”

**Invalid vs score hit:** “missing a compliant X post, the project description, or accessible submission materials → invalid, not eligible for review. Incomplete productization or validation answers will not invalidate your entry, but they will noticeably lower your score.”

Judge review window: 9/22 – 10/7; public voting does not replace judge awards for Grand/Theme/Open.

## 7. Constraints
- Preference for **real, runnable** strategies/tools on **AI × US stocks / rToken / related contracts**
- Strongly recommended toolkit: **Bitget Agent Hub** (MCP/CLI/Tools/Skills/Agentic Account), **Bitget Playbook**, optional **Qwen** credits via separate form (`https://hackathon.bitgetops.com/v1`, model `qwen3.8-max`)
- Agent Hub tip: prefer `--read-only` or `--paper-trading` / Demo API for safe validation; Agentic account OAuth for isolated funds
- At most **2 theme submissions** per team; each independent
- Links must support judging access (Demo accessible; if login required, also submit demo video — S1 handbook pattern; S2 requires accessible Demo per track)
- Prize exclusivity: judge side highest tier only (Grand > Theme/Open > Best Spread); University exclusive with main-track prizes; Fan Favorite can stack
- Do not rely on KOL/KOC ghost-posting for Best Spread
- Qwen apply ≠ registration; KYC every 24h; first 300 teams may get ~30U Qwen credits

## 8. Disqualification risks
- Late submit after **21 Sep 2026 (UTC+8)** deadline
- Missing required form fields / materials / compliant X post → **invalid**
- Pure retweet X post with no substantive intro → incomplete
- Simple S1 rename/resubmit without substantive new work
- Inaccessible Demo / materials (cannot be reviewed)
- “all traders” as target user (not accepted as segment — hurts score; still required to write a concrete segment)
- Vote manipulation / ghost reach for spread awards (KOL/KOC data not counted)

## 9. Assets already available
- None listed by Indu for this Bitget kickoff (no Bitget UID, KYC status, Qwen credits, Agentic account, or API keys confirmed)

## 10. Open questions
- Exact **deadline clock** on Google Form (end of 21 Sep UTC+8 vs “before 9/21” start-of-day) — not verified by loading the live form
- Official X promo post URL still **[TBD]** in handbook; public voting post **[TBD]**
- FAQ date slips (**9/23** / **9/24–9/29**) vs Chapter III (**9/21** / **9/22–9/28**) — flagged; prefer Chapter III + hub
- Whether Bitget account / KYC is required only for Qwen/K3/Playbook or also for submission review (form likely needs Bitget UID — confirm on form)
- Chinese hub vs EN handbook: content aligned on 9/21; use EN handbook for detailed rules
- Partner list “more partners to be announced”
