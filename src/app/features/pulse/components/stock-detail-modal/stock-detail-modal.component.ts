import { Component, OnInit, inject, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { HighchartsChartComponent } from 'highcharts-angular';
import * as Highcharts from 'highcharts';
import moment from 'moment';
import { PulseService } from '../../services/pulse.service';
import { IPulseStockDetail, IPulseFinancialResult, IPulseShareholding } from '../../models/pulse-stock-detail.model';
import { ScreenerHorizon, IScreenerHistoryStock, IScreenerStockBreakdown } from '../../models/screener.model';
import { SignalBadgeComponent } from '../signal-badge/signal-badge.component';
import { HelperModel } from '@shared/helper';

type DetailTab = 'financials' | 'shareholding' | 'sector-signals' | 'screener';
type ShareholdingMetric = 'promoter' | 'fii' | 'dii' | 'public';

interface IShareholdingTile {
    label: string;
    color: string;
    current: number | null;
    delta: number | null;
    direction: 'up' | 'down' | 'flat';
}

// Muted (oldest fiscal year) -> accent (newest) — same palette as momentum-dashboard's
// charts for visual consistency, see screener-fe-spec.md "Highcharts config".
const FISCAL_YEAR_COLORS = ['#adb5bd', '#6c757d', '#0d6efd', '#0a58ca'];
const AGING_TRADING_DAYS_THRESHOLD = 20;

const SHAREHOLDING_LABELS: Record<ShareholdingMetric, string> = {
    promoter: 'Promoter', fii: 'FII', dii: 'DII', public: 'Public'
};
const SHAREHOLDING_COLORS: Record<ShareholdingMetric, string> = {
    promoter: '#198754', fii: '#fd7e14', dii: '#6f42c1', public: '#0d6efd'
};
// Below this, a period-over-period move reads as "flat" rather than up/down — keeps rounding noise from flickering.
const SHAREHOLDING_DELTA_THRESHOLD = 0.1;

@Component({
    selector: 'app-stock-detail-modal',
    standalone: true,
    templateUrl: './stock-detail-modal.component.html',
    styleUrls: ['./stock-detail-modal.component.scss'],
    imports: [CommonModule, SignalBadgeComponent, HighchartsChartComponent],
    providers: [PulseService]
})
export class StockDetailModalComponent implements OnInit {
    /** Set by the caller via BsModalService.show(StockDetailModalComponent, { initialState: { stockId } }). */
    stockId!: number;
    /** Set only when opened from the Screener page — enables the "Screener" tab. */
    screenerHorizon?: ScreenerHorizon;
    screenerHistoryStock?: IScreenerHistoryStock;

    detail: WritableSignal<IPulseStockDetail | null> = signal(null);
    screenerBreakdown: WritableSignal<IScreenerStockBreakdown | null> = signal(null);
    isLoading: WritableSignal<boolean> = signal(true);
    activeTab: WritableSignal<DetailTab> = signal('financials');

    salesChartOptions: Highcharts.Options = {};
    netProfitChartOptions: Highcharts.Options = {};
    epsChartOptions: Highcharts.Options = {};
    shareholdingChartOptions: Highcharts.Options = {};
    shareholdingTiles: IShareholdingTile[] = [];
    /** Set only when a filing's submissionDate falls in the current calendar month — the "this just happened" callout. */
    shareholdingFiledThisMonth: IPulseShareholding | null = null;
    updateFlag = false;

    private pulseService = inject(PulseService);
    public modalRef = inject(BsModalRef);

    ngOnInit(): void {
        this.isLoading.set(true);
        this.pulseService.getStockDetail(this.stockId).subscribe(detail => {
            this.detail.set(detail);
            if (detail) {
                this.buildFinancialsCharts(detail.financials);
                this.buildShareholdingChart(detail.shareholding);
                this.updateFlag = true;
            }
            this.isLoading.set(false);
        });

        if (this.screenerHorizon && this.screenerHistoryStock) {
            this.activeTab.set('screener');
            this.pulseService.getScreenerWatchlist(this.screenerHorizon, this.screenerHistoryStock.lastSeenDate)
                .subscribe(watchlist => {
                    const match = watchlist?.stocks.find(s => s.stockId === this.stockId);
                    this.screenerBreakdown.set(match?.breakdown ?? null);
                });
        }
    }

    setTab(tab: DetailTab): void {
        this.activeTab.set(tab);
    }

    /** Screener tab dates render as "09-July-2026" rather than the shared "DD-MMM-YYYY" UI format. */
    formatScreenerDate(date: string): string {
        return HelperModel.apiToUiDateFormat(date, 'DD-MMMM-YYYY');
    }

    close(): void {
        this.modalRef.hide();
    }

    /** True once a Cross-horizon pick has been open 20+ trading days — see the actual
     * backtest finding (cross-confirmed picks fade after ~20 trading days) this reflects. */
    isAgingCrossPick(): boolean {
        return this.screenerHorizon === 'CROSS'
            && !!this.screenerHistoryStock
            && this.screenerHistoryStock.tradingDaysSinceFirstSeen >= AGING_TRADING_DAYS_THRESHOLD;
    }

    private buildFinancialsCharts(financials: IPulseFinancialResult[]): void {
        const quarterly = financials.filter(f => f.periodType === 'QUARTER' && f.periodEndRaw);
        const byYear = new Map<number, Map<number, IPulseFinancialResult>>();
        for (const f of quarterly) {
            const { quarter, fiscalYear } = getFiscalQuarter(f.periodEndRaw);
            if (!byYear.has(fiscalYear)) byYear.set(fiscalYear, new Map());
            byYear.get(fiscalYear)!.set(quarter, f);
        }
        const years = [...byYear.keys()].sort((a, b) => a - b).slice(-4);
        const categories = ['Q1', 'Q2', 'Q3', 'Q4'];
        const colorOffset = FISCAL_YEAR_COLORS.length - years.length;

        // Latest reported quarter overall (same periodEnd row across sales/netProfit/eps) —
        // highlighted with a bold outline in every chart below, per the confirmed "most
        // recently reported quarter, not today's calendar quarter" interpretation.
        const latest = quarterly.reduce<IPulseFinancialResult | null>(
            (a, b) => (!a || b.periodEndRaw > a.periodEndRaw ? b : a), null
        );
        const latestQuarter = latest ? getFiscalQuarter(latest.periodEndRaw) : null;

        const buildSeries = (metric: 'sales' | 'netProfit' | 'eps'): Highcharts.SeriesColumnOptions[] =>
            years.map((year, idx) => ({
                name: `${year}`,
                type: 'column',
                color: FISCAL_YEAR_COLORS[colorOffset + idx],
                data: [1, 2, 3, 4].map(q => {
                    const value = byYear.get(year)?.get(q)?.[metric] ?? null;
                    const isLatest = !!latestQuarter && latestQuarter.fiscalYear === year && latestQuarter.quarter === q;
                    return value !== null && isLatest ? { y: value, borderColor: '#212529', borderWidth: 3 } : value;
                })
            }));

        this.salesChartOptions = buildGroupedBarOptions('Sales by Quarter (₹ Cr)', categories, buildSeries('sales'), ' Cr');
        this.netProfitChartOptions = buildGroupedBarOptions('Net Profit by Quarter (₹ Cr)', categories, buildSeries('netProfit'), ' Cr');
        this.epsChartOptions = buildGroupedBarOptions('EPS by Quarter (₹)', categories, buildSeries('eps'), '');
    }

    private buildShareholdingChart(shareholding: IPulseShareholding[]): void {
        const sorted = [...shareholding].reverse(); // backend gives most-recent-first; chart reads left-to-right chronologically
        const latestIdx = sorted.length - 1;
        const metrics: ShareholdingMetric[] = ['promoter', 'fii', 'dii', 'public'];

        // The period a row reports on (periodEnd) can be filed with the exchange much later
        // (submissionDate) — "what happened this month" is driven by submissionDate, not periodEnd,
        // so the two can point at different columns (e.g. a delayed/restated older-period filing).
        const filedThisMonthIdx = sorted.findIndex(
            s => !!s.submissionDateRaw && moment(s.submissionDateRaw, 'YYYY-MM-DD').isSame(moment(), 'month')
        );
        this.shareholdingFiledThisMonth = filedThisMonthIdx >= 0 ? sorted[filedThisMonthIdx] : null;

        // Promoter + FII + DII + Public sum to ~100%, so this is a part-to-whole read, not four
        // independent trends — a 100%-stacked column makes a shrinking/growing slice visible as a
        // change in band thickness instead of squashing FII/DII near the bottom of a shared 0-100 axis.
        const buildSeriesData = (metric: ShareholdingMetric): (number | null | Highcharts.PointOptionsObject)[] =>
            sorted.map((s, idx) => {
                const value = s[metric];
                // Bold outline on the most recent period, same convention as the financials charts above.
                return idx === latestIdx && value !== null
                    ? { y: value, borderColor: '#212529', borderWidth: 2 }
                    : value;
            });

        this.shareholdingChartOptions = {
            chart: { type: 'column', height: 320 },
            title: { text: 'Shareholding Trend (%)', style: { fontSize: '14px', fontWeight: 'bold' } },
            subtitle: { text: 'Bold outline = most recent period · bars stack to 100%', style: { fontSize: '11px', color: '#6c757d' } },
            xAxis: {
                categories: sorted.map(s => s.periodEnd),
                labels: { rotation: -45, style: { fontSize: '11px' } },
                plotBands: filedThisMonthIdx >= 0 ? [{
                    from: filedThisMonthIdx - 0.5,
                    to: filedThisMonthIdx + 0.5,
                    color: 'rgba(255, 193, 7, 0.15)',
                    label: { text: 'Filed this month', style: { fontSize: '10px', color: '#997404' }, verticalAlign: 'top', y: 14 }
                }] : []
            },
            yAxis: { title: { text: '%' }, min: 0, max: 100 },
            series: metrics.map(metric => ({
                name: SHAREHOLDING_LABELS[metric],
                type: 'column',
                color: SHAREHOLDING_COLORS[metric],
                data: buildSeriesData(metric)
            })),
            plotOptions: { column: { stacking: 'percent', borderWidth: 0, pointPadding: 0.05, groupPadding: 0.1 } },
            tooltip: {
                shared: true,
                useHTML: true,
                valueDecimals: 1,
                formatter: function () {
                    // @ts-ignore — shared-tooltip `this` isn't fully typed by Highcharts' formatter signature
                    const points: Highcharts.Point[] = this.points ?? [];
                    const idx = points[0]?.index ?? 0;
                    const filedNote = sorted[idx]?.submissionDate
                        ? `<br/><span style="color:#6c757d">Filed: ${sorted[idx].submissionDate}</span>`
                        : '';
                    const rows = points
                        .map(p => `<span style="color:${p.color}">●</span> ${p.series.name}: <b>${(p.y ?? 0).toFixed(1)}%</b>`)
                        .join('<br/>');
                    // @ts-ignore
                    return `<b>${this.x}</b>${filedNote}<br/>${rows}`;
                }
            },
            credits: { enabled: false },
            legend: { align: 'center', verticalAlign: 'bottom' }
        };

        // Latest-period-vs-previous-period delta, shown as stat tiles above the chart —
        // answers "what just changed" without having to read the full history.
        this.shareholdingTiles = metrics.map(metric => {
            const current = sorted[latestIdx]?.[metric] ?? null;
            const previous = latestIdx > 0 ? sorted[latestIdx - 1]?.[metric] ?? null : null;
            const delta = current !== null && previous !== null ? current - previous : null;
            const direction: IShareholdingTile['direction'] =
                delta === null || Math.abs(delta) < SHAREHOLDING_DELTA_THRESHOLD ? 'flat' : delta > 0 ? 'up' : 'down';
            return { label: SHAREHOLDING_LABELS[metric], color: SHAREHOLDING_COLORS[metric], current, delta, direction };
        });
    }
}

function buildGroupedBarOptions(title: string, categories: string[], series: Highcharts.SeriesColumnOptions[], valueSuffix: string): Highcharts.Options {
    return {
        chart: { type: 'column', height: 320 },
        title: { text: title, style: { fontSize: '14px', fontWeight: 'bold' } },
        subtitle: { text: 'Bold outline = most recently reported quarter', style: { fontSize: '11px', color: '#6c757d' } },
        xAxis: { categories },
        yAxis: { title: { text: '' }, gridLineWidth: 1 },
        series,
        plotOptions: { column: { pointPadding: 0.1, borderWidth: 0, groupPadding: 0.15 } },
        tooltip: { shared: true, valueSuffix },
        credits: { enabled: false },
        legend: { align: 'center', verticalAlign: 'bottom' }
    };
}

/** Indian fiscal year: Apr-Jun=Q1, Jul-Sep=Q2, Oct-Dec=Q3, Jan-Mar=Q4 of the fiscal year that started the prior April. */
function getFiscalQuarter(periodEndIso: string): { quarter: number; fiscalYear: number } {
    const m = moment(periodEndIso, 'YYYY-MM-DD');
    const month = m.month(); // 0=Jan .. 11=Dec
    const year = m.year();
    if (month >= 3 && month <= 5) return { quarter: 1, fiscalYear: year + 1 };
    if (month >= 6 && month <= 8) return { quarter: 2, fiscalYear: year + 1 };
    if (month >= 9 && month <= 11) return { quarter: 3, fiscalYear: year + 1 };
    return { quarter: 4, fiscalYear: year };
}
