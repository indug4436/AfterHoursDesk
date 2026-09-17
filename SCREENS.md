# SCREENS.md - AfterHoursDesk

One demo surface: Desk at `/` with **My desk** workbench strip. No marketing landing. No second page required (collapsible panel OK).

## Design system

- One calm sans; large H1; mono for sources/timestamps/%.
- Neutrals + one accent (amber or teal). No purple AI-slop gradient brand.
- Spacious: **My desk** (left or top) + ask/brief (main) — few boxes, large type.

## Screen 1 - Desk (/)

Purpose: personalized overnight research workbench — question → brief **for my thesis/watchlist**, not a generic one-pager.

Primary actions: **Save desk** · **Run brief**.

### Copy — chrome

| Element | Copy |
|---------|------|
| Title | AfterHoursDesk |
| Tagline | Overnight US equity brief — you decide at open |
| Track hint | AI Trading Desk · Personalized Research Workbench |
| Mode badges | LIVE / LABELED MOCK for **LLM · DATA · MARKET · SKILLS** |

### Copy — My desk (persist)

| Element | Copy |
|---------|------|
| Panel title | My desk |
| Segment label | Who I am |
| Segment seed | Asia overnight US equities |
| Risk label | Risk note |
| Risk seed | No leverage; size small at open |
| Thesis label | Standing thesis |
| Thesis seed | AI infra leaders on dips; avoid chase after +3% AH |
| Watchlist label | Watchlist |
| Watchlist seed | NVDA, AAPL, MSFT |
| Checklist label | My checklist |
| Checklist seed | Confirm AH vs prior close · Check guidance headlines |
| Save button | Save desk |
| Recall label | Recent briefs |
| Empty recall | No sessions yet — run a brief |

### Copy — Ask / brief

| Element | Copy |
|---------|------|
| Input label | Ask the desk |
| Seed question | What hit NVDA after the close and what should I watch at open? |
| Primary button | Run brief |
| In-flight | Brief running… / Brief already running |
| Brief sections | **For my desk** · What moved · Why it might matter · Watch at open · Skills · Sources |
| For my desk | Thesis fit · Watchlist angle · Checklist echo |
| Footer | Not financial advice. Human remains the decision-maker. No live orders. |

### States

| State | Shows |
|-------|-------|
| First open | Seeded My desk (editable); muted brief |
| Desk saved | Toast or quiet “Saved”; survives refresh |
| Loading | Run brief disabled; no overlapping success |
| Success | For my desk filled from desk_context; overnight; Skills; sources |
| No desk_context | for_my_desk absent — avoid claiming personalization |
| Overnight null | honest unavailable note |
| Skills mock | LABELED MOCK SKILLS |
| Error / 429 | Inline; no invented claims |

## Out of path

No trading ticket, broker connect, or auto-orders. Paper stub not on DEMO path.
