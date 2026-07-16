# Pulse — Frontend Spec

## Stack
Angular 20, Bootstrap 5, Bootstrap Icons, ngx-bootstrap (`ModalModule`, `TabsModule`,
`BsDatepickerModule`) — all already in `package.json`, though unused anywhere in this
codebase until now (first real integration). Built as a **new, standalone feature** —
not reusing `momentum`, `quarter-results`, or `shareholding`, since those serve different
purposes. Consumes the `/api/pulse/...` endpoints described in `backend/.claude/pulse-be-spec.md`.

> **Resolved against the real backend and the real frontend codebase** (this spec was
> originally written before the backend existed): the state-management approach, the
> exact patterns to mirror (`momentum-dashboard.component.ts`, `quarter-results.component.ts`),
> and the screen split below were all confirmed against what's actually built and what
> actually exists in `stock-radar-frontend/src/app/`, not assumed.

## Screen flow
**Two separate pages**, not one — confirmed with the user after walking through what a
single flat "all stocks" list would actually look like (753 active stocks vs. 141
industries; most rows would carry no signal and the design would contradict the vision
doc's own "industry ranked first → drill into stocks" flow):

`/pulse` **Dashboard** — New Signals Today (primary content) + a compact Top 10
industries preview that deep-links out. `/pulse/stocks` **Lists screen** — the actual
screening surface: self-contained, its own Top 10 industry cards as anchors, stocks
grouped by industry and ranked strongest-first, top 10 expanded by default. Clicking a
stock row on the Lists screen opens the detail popup (modal, three tabs). A date picker
on the dashboard carries into the Lists screen via query param when navigating between
them; the Lists screen also works fine visited directly, defaulting to the latest date.

---

## 1. Dashboard layout (`/pulse`)

```
┌───────────────────────────────────────────────────────────┐
│  Date picker: [ 05 Jul 2026 ▾ ]      (defaults to latest)   │
├───────────────────────────────────────────────────────────┤
│  New Signals Today                                          │
│  [▲ SUNDRMFAST  ENTRY  Auto Components]  [▼ XYZ  EXIT ...]   │
├───────────────────────────────────────────────────────────┤
│  Top 10 Industries (preview)          [ View full list → ]  │
│  [Auto Components #1 ▲3] [IT Services #2 ▼1] [Cement #3 ─]   │
└───────────────────────────────────────────────────────────┘
```

No stock table on this page — that was the original design, but it's been moved
entirely to the Lists screen (see §2) to avoid duplicating table-rendering logic on two
pages and to keep the dashboard as a lightweight daily briefing, not the primary
screening tool.

### Date picker
`ngx-bootstrap` `BsDatepickerModule`, mirroring `momentum-dashboard.component.ts`'s
`bsConfig`/`selectedDate`/`maxDate` pattern exactly. Every Pulse endpoint already
resolves `date=latest` server-side, so the first load omits `date` entirely and reads the
resolved date back from the response (`data.date`) to initialize the picker — no
separate "get max date" call needed, unlike `momentum-dashboard`'s
`stockPriceService.getMaxTradeDate()`.

### New Signals Today panel
Cards for every `Signal` where `tradeDate` = selected date (`GET /signals/today`). Green
`bi-arrow-up-circle-fill` (ENTRY), amber `bi-eye-fill` (WATCH), red
`bi-arrow-down-circle-fill` (EXIT), with the one-line reason shown under each. Click a
card → opens the stock detail modal (§3) directly.

### Top 10 Industries (preview)
Cards sorted by `rsRank` (`GET /industries/ranked?limit=10`), each showing rank, 1M
return, and a delta icon computed from `rsRank` vs `prevRsRank` (`▲3`/`▼2`/`─`), plus a
"NEW" badge (`bi-stars`) — see §6 for the exact rule. This is a preview only; clicking a
card navigates to `/pulse/stocks?industry=X&date=Y` rather than filtering anything inline
on this page.

---

## 2. Lists screen (`/pulse/stocks`) — the actual screening surface

This is what was previously just "the stock table" embedded in the dashboard. It's now
its own route, and it's grouped by industry rather than a flat table, for two reasons:
753 active active stocks across 141 industries means a flat table is mostly noise (e.g.
on `2026-07-10`, only 7 of 753 stocks had any signal at all — the other 746 rows would
carry nothing useful), and the vision doc's stated flow is explicitly "industry ranked
first → drill into stocks within a chosen industry," which a flat list breaks.

```
┌───────────────────────────────────────────────────────────┐
│  Date picker · Search box · Index filter (NIFTY 50/Next50/…)│
├───────────────────────────────────────────────────────────┤
│  [Auto Components #1 ▲3] [IT Services #2 ▼1] … [View all 141]│  <- anchors, not fetches
├───────────────────────────────────────────────────────────┤
│  ▾ Auto Components  (#1, ▲3, 6 stocks)                       │
│      Symbol | Company | Index | Signal | ADX | RSI | 50/200DMA│
│  ▾ IT Services  (#2, ▼1, 9 stocks)                            │
│      ...                                                      │
│  ▸ Cement  (#3, ─, 4 stocks)              <- collapsed         │
│  ▸ ... (131 more industries, collapsed)                        │
└───────────────────────────────────────────────────────────┘
```

- **Load**: `forkJoin`s `GET /stocks?date=` (no `industry` filter — now optional, see §7)
  and `GET /industries/all?date=` in parallel, mirroring the `forkJoin` pattern in
  `momentum-dashboard.component.ts`. Groups the stock rows by the `industry` field (now
  present on every row, see §7) client-side; orders groups by `rsRank` ascending.
- **Top-of-page cards**: same visual style as the dashboard's preview, but functionally
  different here — clicking one force-expands and scrolls to that industry's section
  below, it does not trigger a new fetch.
  "View all 141 →" reveals the rest as collapsed headers.
- **Sections**: Bootstrap `accordion`/`collapse`, one per industry. Header shows name,
  rank, stock count, and the same rank-delta icon as the dashboard. Top 10 expanded by
  default; the rest start collapsed (header only) until expanded, matched by search, or
  matched by the index filter. Deliberately **not** limited to industries with a signal
  today — surfacing a stock that's nearing a breakout with no signal fired *yet*, within
  a top-ranked industry, is the actual point of a screener.
- **Deep link**: optional `industry`/`date` query params (arriving from the dashboard)
  force that one section open and scroll to it, regardless of its rank position.
- **Filters**: a search box (mirroring `TypeaheadModule` usage in
  `momentum-dashboard.component.ts`) and an index dropdown (`INDICES` from
  `shared/constants.ts`) both act across all groups at once, auto-expanding any group
  with a match.
- **Table columns per section**: Symbol, Company, Index badge, Signal badge (+ `NEW`
  badge if the signal's `tradeDate` is within the last 2 days), ADX(14), RSI(14), Above
  50DMA (✓/✗), Above 200DMA (✓/✗). Index badge is **not** in the backend response — it's
  looked up by cross-referencing `commonService.getStocksList()` (already fetched/cached
  app-wide) by `symbol`, per `frontend.md`'s "reuse shared services" rule; no backend
  payload duplication. There's no stored `"NIFTY 100"` value — the raw `indices` value is
  badged directly (`NIFTY 50`, `NIFTY NEXT 50`, `NIFTY MIDCAP 150`, `NIFTY SMALLCAP 250`,
  `NIFTY MICROCAP 250`), and an "in NIFTY 100" flag is computed separately as
  `indices === 'NIFTY 50' || indices === 'NIFTY NEXT 50'` when needed.
- Row click → opens the stock detail modal (§3).

---

## 3. Stock detail modal (ngx-bootstrap `ModalModule` + `TabsModule`)

Opened via `BsModalService.show(...)`, mirroring `momentum-dashboard.component.ts`'s
`openHistoryModal` pattern exactly (same `BsModalRef`/`modalService.show(template, {...})`
shape — this codebase's only existing modal precedent). Fetched via
`GET /api/pulse/stocks/:id/detail`. Three tabs, built fresh within Pulse (not reusing the
existing `quarter-results`/`shareholding` features — their models are shaped for
cross-stock universe screens, not a single stock's history, so they don't fit here):

**Tab 1 — Financials:** table of financial results, most recent first (period, sales,
net profit, EPS, operating profit), with an up/down arrow on net profit vs. prior period.

**Tab 2 — Shareholding trend:** promoter/FII/DII/public % by period, most recent first,
FII/DII columns highlighted as the early-accumulation signal.

**Tab 3 — Signal history:** all past signals for the stock (date, type, direction,
reason, price), same badges as the Lists screen.

All dates formatted via `HelperModel.apiToUiDateFormat` (`shared/helper.ts`), matching
`shareholding.model.ts`/`quarter-result.model.ts`.

---

## 4. Folder structure — new standalone feature
```
src/app/features/pulse/
  pulse.routes.ts             // '' -> PulseDashboardComponent, 'stocks' -> PulseStockListComponent
  models/
    industry-performance.model.ts   // rsRank/prevRsRank/return1m/3m/6m/...
    pulse-stock.model.ts            // list-row shape, now includes `industry`
    pulse-stock-detail.model.ts     // financials/shareholding/signalHistory
    signal.model.ts
  pages/
    pulse-dashboard/
      pulse-dashboard.component.{ts,html,scss}
    pulse-stock-list/
      pulse-stock-list.component.{ts,html,scss}
  components/
    stock-detail-modal/
      stock-detail-modal.component.{ts,html,scss}   // shared by both pages
  services/
    pulse.service.ts          // HttpClient wrappers + selectedDate signal
```
Matches the existing convention seen in `features/momentum` (`models/`, `pages/`,
`services/`, a `*.routes.ts` file) so Pulse slots in alongside it rather than
introducing a new pattern. Two pages under `pages/` instead of one, per §0.

## 5. State management
Angular **signals** (`signal()`/`computed()`/`inject()`), not `BehaviorSubject`s as
originally planned — every real component in this codebase
(`momentum-dashboard.component.ts`, `quarter-results.component.ts`) uses signals for
local reactive state; `BehaviorSubject` is imported in `shared/services/common.service.ts`
but never actually used there, so it's not a real precedent to follow. `pulse.service.ts`
holds a `selectedDate` signal; no NgRx needed at this scale.

## 6. Icon & badge reference
| Use | Icon | Color |
|---|---|---|
| ENTRY signal | `bi-arrow-up-circle-fill` | success |
| WATCH signal | `bi-eye-fill` | warning |
| EXIT signal | `bi-arrow-down-circle-fill` | danger |
| Above MA | `bi-check-circle-fill` | success |
| Below MA | `bi-x-circle-fill` | danger |
| Rank up | `bi-caret-up-fill` | success |
| Rank down | `bi-caret-down-fill` | danger |
| New signal badge (stock row, last 2 days) | `bi-stars` | primary |
| **Newly-entered-top-10 badge (industry card)** | `bi-stars` | primary |

**"Newly entered top 10" rule** (industry cards, both the dashboard preview and the
Lists screen anchors): `prevRsRank !== null && prevRsRank > 10 && rsRank <= 10`. Guard
against `prevRsRank === null` (an industry's first day of data — this happened for real
on `2026-06-29` during the backend's backfill) — that must **not** be flagged as
newly-entered, it just has no history yet. Fully derivable from `/industries/ranked` /
`/industries/all` as-is; no backend change needed for this badge.

## 7. Backend endpoint note (resolved during frontend planning)
`GET /api/pulse/stocks` originally required `industry` and 400'd without it. It's now
optional (skip the filter when absent) so the Lists screen can load all stocks in one
call, and each returned row now includes an `industry` field (needed for client-side
grouping — not present before, since every prior call was already pre-filtered to one
industry). Method renamed `getStocksByIndustry` → `getStocks` in both
`pulse.controller.ts` and `pulse-query.service.ts` for clarity.

## 8. Open items for later phases
- Price chart tab (deferred) — `highcharts-angular` is already in package.json, so this
  slots in easily later without adding a new charting dependency
- News/sentiment tab (deferred, tied to backend news integration)
- Watchlist / saved filters