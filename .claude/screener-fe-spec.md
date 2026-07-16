# Screener — Frontend Spec

## Status

**Design only, not yet implemented.** Backend data already exists and is live
(`screener_sector_scores`, `screener_stock_scores` — see `stock-radar/.claude/early-screener-spec.md`).
One new backend endpoint is a prerequisite for this UI (see "Backend dependency" below) —
build order is backend endpoint → frontend industry removal → frontend screener UI.

## Scope

1. New **Screener** page inside the existing Pulse feature, surfacing Swing/Positional/Cross
   horizon picks (cards → list → detail popup).
2. **Remove the industry dimension from the frontend** — the backend industry ranking/signal
   system (`IndustryPerformance`, `IndustrySignal`, `IndustryRankingService`, etc.) has already
   been deleted; `PulseDimension = 'industry' | 'sector'`, the `/pulse/industry` route, and
   every industry-only branch in `pulse.service.ts` / `pulse-stock-list.component.ts` /
   `pulse-today-signals.component.ts` / the stock detail models are now dead code pointing at
   endpoints that 404. This is bundled into the same implementation pass since both touch the
   same files.

## Why this exists

The screener tables have held real, backfilled data since earlier in this project (Swing:
1.24 profit factor sector-restricted, Positional: 1.48, Cross: 1.43 profit factor / 64.3% win
rate at the 20-day mark — see the backend spec for full backtest results and caveats). Until
now there's been no way to see this data without querying MySQL directly. This is the first
UI surface for it.

## Page layout

### Top level — `PulseScreenerComponent` (new, route `pulse/screener`)

**Date picker** (top, reuses the existing `bsDatepicker` pattern from
`pulse-stock-list`/`pulse-today-signals`) — selects the "as of" date. Everything below is
computed relative to this date; defaults to the latest date the pipeline has run for.
Alongside it, a **window selector** (10/15/20/30 trading days, default 20 — see "Window size
control" below) controls how far back the cards' totals and the list panel look.

**Three cards** — Swing, Positional, Cross:
```
┌───────────────┐  ┌───────────────┐  ┌───────────────────────┐
│  SWING          │  │  POSITIONAL     │  │  CROSS  ⭐ highest      │
│                 │  │                 │  │           conviction    │
│      3          │  │      5          │  │      0                  │
│ 8 in last 20d    │  │ 11 in last 20d   │  │ 2 in last 20d            │
└───────────────┘  └───────────────┘  └───────────────────────┘
```
- Big number = stocks qualifying **on the selected date** for that horizon.
- Small subtext = distinct stocks that appeared **at least once in the last 20 trading days**
  ending at the selected date — so a card can honestly show "0 today, 2 in last 20 days"
  instead of a bare, context-free zero.
- **Cross is visually distinguished** (accent border + "highest conviction" tag) and is the
  **default active card on load** — reflects the actual backtest finding (64.3% WR / 1.43 PF
  at 20 days, the best-evidenced of the three), not decorative.
- Clicking a card sets it active and swaps the list panel below — one screen, no page
  navigation, keeps verification simple (one view, one horizon, one date).

**List panel** (below the cards, shows the active horizon's stocks):

Rows = every stock that appeared at least once in the **20-trading-day window ending at the
selected date**, sorted: qualifying-on-selected-date first, then by recency, then by score.

| Symbol | Sector | Score | Status | Appeared |
|---|---|---|---|---|
| TITAN | Gems, Jewellery | 4.03 | 🟢 Qualifying today | 3/20 ℹ️ |
| HDFCBANK | Private Bank | 3.71 | 🟡 Last seen 1 trading day ago | 1/20 ℹ️ |

- 🟢 = qualifies on the selected date; 🟡 = qualified earlier in the window but not on the
  selected date (this is what makes your "2 yesterday, 0 today" scenario render sensibly —
  the list isn't empty, it shows those 2 stocks tagged as last-seen-yesterday).
- **ℹ️ icon** (next to "Appeared X/20") opens an `ngx-bootstrap` popover — already a project
  dependency, same one used for the existing datepicker/modal — listing every appearance date
  in the window:

  | Date | Price then | Price now | Change |
  |---|---|---|---|
  | 2026-06-20 | ₹4,200.10 | ₹4,586.40 | 🟢 +9.20% |
  | 2026-06-25 | ₹4,300.00 | ₹4,586.40 | 🟢 +6.66% |
  | 2026-07-13 | ₹4,586.40 | ₹4,586.40 | — |

  "Price now" means **price as of the selected date**, not live real-time — confirmed: this
  keeps the view self-consistent when browsing history via the date picker (matches the
  no-lookahead discipline already used throughout the backend backtests). % change is the
  most prominent column, color-coded — this is the same 20d/63d-return framing the backtests
  used, just live and per-appearance instead of a single fixed-horizon test.
- Clicking a row (outside the ℹ️ icon) opens the stock detail modal.

### Stock detail modal (90% width) — extends existing `StockDetailModalComponent`

Reuses the existing component (financials/shareholding/sector-signals tabs already there) —
does not fork a new modal.

- **Width**: existing calls use `modal-lg modal-dialog-scrollable`; add a new `modal-90w` CSS
  class (custom — Bootstrap's largest built-in, `modal-xl`, isn't 90%) and use it when opened
  from the screener list.
- **Financials tab**: convert from the current table to **two grouped bar charts** — one for
  Sales, one for Net Profit — each grouped **by quarter position, clustered by year**, not a
  plain time-series line. X-axis categories = `Q1`, `Q2`, `Q3`, `Q4`; each category has one
  bar per year (`2023`, `2024`, `2025`, `2026`) as separate series, so Q1'23/Q1'24/Q1'25/Q1'26
  cluster together, Q2'23–Q2'26 cluster together, etc. — lets you compare same-quarter,
  year-over-year performance directly instead of quarter-to-quarter, which is the more
  meaningful comparison for a seasonal business. Covers **4 years / 16 quarters** — see
  "Backend dependency" below for the `getStockDetail` change this needs. Follow the existing
  `HighchartsChartComponent` + `import * as Highcharts` pattern already used in
  `momentum-dashboard.component.ts` (the only existing chart usage in this codebase); don't
  introduce a second charting approach.
- **Shareholding tab**: convert to a **line chart** — FII% / DII% / Promoter% / Public% trend
  across periods, one line per holder category, plain chronological x-axis (this one stays a
  simple time series, unlike the financials grouped-bar treatment above).
- **Sector Signals tab**: unchanged (existing table).
- **New "Screener" tab** (only shown when opened from the screener page): the score
  breakdown for whichever horizon the user came from (`deliveryRatio`, `volRatio`,
  `adxDelta`, `instFlowScore`, `earningsScore`, `compositeScore`), plus the same
  appearance-dates table as the list's ℹ️ popover (more room here for the full history). For
  **Cross** horizon specifically, if the stock's first appearance was 20+ trading days ago,
  show a short note referencing the actual finding: *"Cross-horizon picks historically fade
  after ~20 trading days — this one is aging, worth a fresh look rather than assuming it
  still holds."* Not a hard rule, a factual callout tied to real backtest data.

## Backend dependency (prerequisite — not yet built)

The existing `GET /api/pulse/screener/watchlist?horizon=X&date=Y` only returns one date's
top-5-sectors/top-3-stocks snapshot — not enough for the rolling 20-day, appearance-history
view above. A new endpoint is needed:

```
GET /api/pulse/screener/history?horizon=SWING|POSITIONAL|CROSS&date=latest&windowDays=20
```

```json
{
  "date": "2026-07-13",
  "windowTradingDays": 20,
  "stocks": [
    {
      "stockId": 33, "symbol": "TITAN", "sector": "Gems, Jewellery",
      "qualifyingToday": true,
      "appearedCount": 3,
      "lastSeenDate": "2026-07-13",
      "tradingDaysSinceLastSeen": 0,
      "firstSeenDate": "2026-06-20",
      "tradingDaysSinceFirstSeen": 15,
      "latestScore": 4.03,
      "appearances": [
        { "date": "2026-06-20", "priceThen": 4200.10, "priceNow": 4586.40, "changePct": 9.20 },
        { "date": "2026-06-25", "priceThen": 4300.00, "priceNow": 4586.40, "changePct": 6.66 },
        { "date": "2026-07-13", "priceThen": 4586.40, "priceNow": 4586.40, "changePct": 0.0 }
      ]
    }
  ]
}
```

Implementation sketch (backend, separate from this doc's scope but noted so the dependency
is concrete): query `screener_stock_scores` for the horizon over the 20-trading-day window
ending at `date`, group by stock; for each appearance date look up close price on that date
(`technical_indicators.close` or `stock_prices.close`) for "price then," and the close price
on the as-of `date` for "price now." Same read-only, no-new-writes posture as the rest of
the screener system.

**Second, smaller backend change** — `PulseQueryService.getStockDetail()` (`stock-radar/src/
services/pulse-query.service.ts`) currently fetches financial results with `take: 12`
(~3 years quarterly). The grouped-by-quarter financials chart needs 4 years / 16 quarters
(per the confirmed Q1'23–Q1'26 example), so this needs bumping to `take: 16` at minimum —
purely a limit change, no shape change, backward compatible with the existing table-based
rendering everywhere else `getStockDetail` is used.

## Frontend industry removal (bundled into this pass)

- `pulse.service.ts`: drop `PulseDimension` type, hardcode `getRankedGroups`/`getAllGroups`/
  `getTodaysSignals`/`getWatchlist` to the sector paths (the `industry` query param on
  `getStocks` stays — that's `ListOfStocks.industry`, an unrelated classification field, not
  the removed ranking system).
- `pulse.routes.ts`: remove the `/pulse/industry` route entry; keep `/pulse/sector`.
- `ranked-group.model.ts`: drop the `nameField: 'industry' | 'sector'` parameter, hardcode
  to sector.
- `pulse-stock.model.ts` / `pulse-stock-detail.model.ts`: drop `latestSignal` /
  `signalHistory` (industry-gated) fields; keep `latestSectorSignal` / `sectorSignalHistory`
  and the plain `industry` classification string.
- `pulse-stock-list.component.ts` + `.html`: drop the `dimension` property and every ternary
  keyed on it (`groupLabel`, `groupLabelPlural`, `latestSignalFor`, the group-by field);
  hardcode to sector.
- `pulse-today-signals.component.ts` + `.html`: drop the industry `forkJoin` branch and the
  `IDimensionedSignal`/dimension badge — only one signal source remains, no need for the
  merge wrapper; remove the "Explore industry rankings" link.
- `stock-detail-modal.component.ts` + `.html`: remove the `'industry-signals'` tab entirely
  (keep `'sector-signals'`).
- `core/layout/sidebar/sidebar.component.html`: the existing **Pulse** section already has
  "Today's Signals" (`/pulse`), "By Industry" (`/pulse/industry`), and "By Sector"
  (`/pulse/sector`) links. Remove the "By Industry" `<li>` (points at a route/backend that no
  longer exists) and add a new "Screener" `<li>` (route `/pulse/screener`, e.g.
  `bi-radar` or `bi-graph-up-arrow` icon), following the exact same pattern as the other
  items in that section (`[ngClass]` active check + click handler setting `selectedMenu`).

## Simplicity / verification notes

- Every number on screen should be traceable to a direct SQL query someone can run by hand
  against `screener_stock_scores`/`screener_sector_scores` — matches how this data has been
  spot-checked throughout the project so far. No client-side aggregation that can't be
  cross-checked against the DB.
- No new state-management library — plain Angular signals, matching every other Pulse page.
- One component (`StockDetailModalComponent`) for stock details everywhere in Pulse, not a
  screener-specific fork — keeps behavior consistent and halves the surface to verify.

## Implementation order

1. Backend: build `GET /api/pulse/screener/history` (prerequisite for the list/popover view).
2. Frontend: remove industry code (independent of the screener UI, can happen in parallel).
3. Frontend: `PulseScreenerComponent` — date picker, 3 cards, list panel.
4. Frontend: extend `StockDetailModalComponent` — 90% width, chart tabs, new Screener tab.
5. Wire up the `pulse/screener` route and the sidebar entry (add "Screener," remove
   "By Industry" — see "Frontend industry removal" above).

## Window size control

`windowDays` is **user-configurable**, defaulting to **20**. A simple `<select>` next to the
date picker at the top of `PulseScreenerComponent` — preset options only (**10 / 15 / 20 /
30** trading days), no free-form number input, so the value stays bounded and every option is
easy to reason about/verify against a query. Changing it re-fetches `/screener/history` with
the new `windowDays` and updates both the cards' "N in last X days" subtext and the list
panel in place — same date, different window, one API param.

## Highcharts config

Reuses the palette and conventions already established in `momentum-dashboard.component.ts`
(`#0d6efd` blue, `#198754` green, `#fd7e14` orange, `#6f42c1` purple, `credits: false`,
bottom-centered legend, shared tooltips) for visual consistency with the rest of the app —
but **deliberately lighter** than that dashboard's charts, since these live inside a modal
tab, not a full page: smaller fixed height, single y-axis (both charts here only have
same-unit series, unlike the dashboard's dual-axis score/confidence chart), and **no rotated
data labels** (the dashboard's `-90°` rotated labels are the busiest part of its charts) —
rely on hover tooltips instead, which is lighter and still fully readable.

**Financials — grouped bar** (one panel for Sales, one for Net Profit):
```js
{
  chart: { type: 'column', height: 320 },
  title: { text: 'Sales by Quarter (₹ Cr)', style: { fontSize: '14px', fontWeight: 'bold' } },
  xAxis: { categories: ['Q1', 'Q2', 'Q3', 'Q4'] },
  yAxis: { title: { text: '' }, gridLineWidth: 1 },
  series: [
    { name: '2023', data: [...], color: '#adb5bd' },  // oldest year = lightest/most muted
    { name: '2024', data: [...], color: '#6c757d' },
    { name: '2025', data: [...], color: '#0d6efd' },
    { name: '2026', data: [...], color: '#0a58ca' },  // newest year = most prominent
  ],
  plotOptions: { column: { pointPadding: 0.1, borderWidth: 0, groupPadding: 0.15 } },
  tooltip: { shared: true, valueSuffix: ' Cr' },
  credits: { enabled: false },
  legend: { align: 'center', verticalAlign: 'bottom' },
}
```
Sequential shading (muted → accent as years get more recent) makes the year-over-year trend
readable at a glance before even checking the legend — one small, deliberate readability
choice rather than arbitrary categorical colors. `grouping` doesn't need to be set explicitly
— Highcharts column series group side-by-side by default, which is exactly the
Q1'23/Q1'24/Q1'25/Q1'26-clustered-together behavior wanted. Net Profit panel: identical
shape, separate chart instance below/beside it.

**Shareholding — line chart**:
```js
{
  chart: { type: 'line', height: 320 },
  title: { text: 'Shareholding Trend (%)', style: { fontSize: '14px', fontWeight: 'bold' } },
  xAxis: { categories: periodEnds, labels: { rotation: -45, style: { fontSize: '11px' } } },
  yAxis: { title: { text: '%' }, min: 0, max: 100 },
  series: [
    { name: 'Promoter', data: [...], color: '#198754' },
    { name: 'FII', data: [...], color: '#fd7e14' },
    { name: 'DII', data: [...], color: '#6f42c1' },
    { name: 'Public', data: [...], color: '#0d6efd' },
  ],
  marker: { enabled: true, radius: 3 },
  tooltip: { shared: true, valueSuffix: '%' },
  credits: { enabled: false },
  legend: { align: 'center', verticalAlign: 'bottom' },
}
```
Plain lines, no area fill — with 4 overlapping series, an area/spline-area fill would add
visual weight and overlap confusion for no readability gain over plain lines with small
markers.
