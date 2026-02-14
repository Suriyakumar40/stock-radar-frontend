import { Component, OnInit, Signal, WritableSignal, inject, TemplateRef, RendererFactory2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MomentumService } from '../../services/momentum.service';
import { signal, computed } from '@angular/core';
import { StockPriceService } from '@shared/services/stock-price.service';
import { QuarterResultService } from '@feature/quarter-results/services/quarter-result.service';
import { forkJoin, switchMap } from 'rxjs';
import { BsDatepickerConfig, BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { BsModalService, BsModalRef, ModalModule } from 'ngx-bootstrap/modal';
import { TypeaheadModule } from 'ngx-bootstrap/typeahead';
import { HelperModel } from '@shared/helper';
import { CommonService } from '@shared/services/common.service';
import { IMomentumDecision } from '@feature/momentum/models/momentum-decision.model';
import { HighchartsChartComponent } from 'highcharts-angular';
import * as Highcharts from 'highcharts';
import moment from 'moment';

@Component({
    selector: 'app-momentum-dashboard',
    standalone: true,
    templateUrl: './momentum-dashboard.component.html',
    styleUrls: ['./momentum-dashboard.component.scss'],
    imports: [CommonModule, FormsModule, BsDatepickerModule, ModalModule, HighchartsChartComponent, TypeaheadModule],
    providers: [MomentumService, QuarterResultService, BsModalService]
})
export class MomentumDashboardComponent implements OnInit {

    // Signals for state management
    selectedTab: WritableSignal<string> = signal('STRONG BUY');
    allData: WritableSignal<IMomentumDecision[]> = signal([]);
    filteredData: WritableSignal<IMomentumDecision[]> = signal([]);
    lastUpdated: WritableSignal<Date> = signal(new Date());
    selectedStock: WritableSignal<IMomentumDecision | null> = signal(null);
    isPanelOpen: WritableSignal<boolean> = signal(false);
    isLoading: WritableSignal<boolean> = signal(true);
    listTitle: WritableSignal<string> = signal('All Signals');
    selectedStockForHistory: WritableSignal<IMomentumDecision | null> = signal(null);
    selectedHistoryTab: WritableSignal<string> = signal('score');

    // Highcharts
    Highcharts: typeof Highcharts = Highcharts;
    scoreChartOptions: Highcharts.Options = {};
    volumeChartOptions: Highcharts.Options = {};
    updateFlag: boolean = false;

    modalRef?: BsModalRef;

    selectedDate: Date = new Date();
    maxDate: Date = new Date();
    bsConfig: Partial<BsDatepickerConfig>;

    // Typeahead for stock search
    searchSymbol: string = '';
    stockSymbols: string[] = [];

    // Computed signals for counts
    countStrongBuy: Signal<number> = computed(() => this.allData().filter(s => s.rating === 'STRONG BUY').length);
    countBuy: Signal<number> = computed(() => this.allData().filter(s => s.rating === 'BUY').length);
    countAccumulate: Signal<number> = computed(() => this.allData().filter(s => s.rating === 'ACCUMULATE').length);
    countHold: Signal<number> = computed(() => this.allData().filter(s => s.rating === 'HOLD').length);
    countAvoid: Signal<number> = computed(() => this.allData().filter(s => s.rating === 'AVOID').length);

    // Use inject() to properly resolve the service without constructor reflection issues
    private momentumService = inject(MomentumService);
    private stockPriceService = inject(StockPriceService);
    private commonService = inject(CommonService);
    private modalService = inject(BsModalService);

    constructor() {
        // Set selectedDate based on local time: if after 18:30, use today; else, use previous date
        const now = new Date();
        this.selectedDate = now; // Default to today
        this.bsConfig = {
            containerClass: 'theme-green',
            dateInputFormat: 'DD-MMM-YYYY',
            showWeekNumbers: false,
        }
    }

    ngOnInit(): void {
        this.isLoading.set(true);
        this.stockPriceService.getMaxTradeDate().pipe(
            switchMap((maxDate: string) => {
                if (maxDate) {
                    this.selectedDate = new Date(maxDate);
                    const dbEndDate = HelperModel.uiToApiDateFormat(this.selectedDate);
                    return forkJoin({
                        momentumData: this.momentumService.getMomentumDecisionsByDate(dbEndDate)
                    });
                } else {
                    // Always return an Observable, even if maxDate is falsy
                    return forkJoin({
                        momentumData: []
                    });
                }
            })
        ).subscribe(({ momentumData }) => {
            const stocks = this.commonService.getStocksList();
            this.allData.set(momentumData);
            this.filterByAction('STRONG BUY');
            this.isLoading.set(false);

            // Populate stock symbols for typeahead
            this.stockSymbols = momentumData.map(stock => stock.symbol).sort();
        });
    }

    onDateChange(event: Date) {
        if (event) {
            this.isLoading.set(true);
            const dbEndDate = HelperModel.uiToApiDateFormat(event);
            forkJoin({
                momentumData: this.momentumService.getMomentumDecisionsByDate(dbEndDate)
            }).subscribe(({ momentumData }) => {
                const stocks = this.commonService.getStocksList();
                this.allData.set(momentumData);
                this.filterByAction('STRONG BUY');
                this.isLoading.set(false);

                // Update stock symbols for typeahead
                this.stockSymbols = momentumData.map(stock => stock.symbol).sort();
            });
        }

    }

    // --- Filtering Logic ---
    filterByAction(action: string) {
        this.selectedTab.set(action);
        if (action === 'STRONG BUY') {
            this.filteredData.set(
                this.allData()
                    .filter(s => s.rating === 'STRONG BUY')
                    .sort((a, b) => b.total_score - a.total_score)
            );
            this.listTitle.set('Strong Buy Signals');
        } else if (action === 'BUY') {
            this.filteredData.set(this.allData().filter(s => s.rating === 'BUY'));
            this.listTitle.set('Buy Signals');
        } else if (action === 'ACCUMULATE') {
            this.filteredData.set(this.allData().filter(s => s.rating === 'ACCUMULATE'));
            this.listTitle.set('Accumulate Signals');
        } else if (action === 'HOLD') {
            this.filteredData.set(this.allData().filter(s => s.rating === 'HOLD'));
            this.listTitle.set('Hold Signals');
        } else if (action === 'AVOID') {
            this.filteredData.set(this.allData().filter(s => s.rating === 'AVOID'));
            this.listTitle.set('Avoid Signals');
        }
    }

    filterByPattern(pattern: string) {
        this.filteredData.set(this.allData().filter(s => s.delivery_vs_price_pattern === pattern));
        this.listTitle.set('Accumulation Patterns');
    }

    resetFilters() {
        this.filteredData.set(this.allData());
        this.listTitle.set('All Signals');
        this.searchSymbol = '';
    }

    // Search by stock symbol
    onStockSelect(event: any) {
        const symbol = event.item || event;
        if (symbol) {
            const stock = this.allData().find(s => s.symbol === symbol);
            if (stock) {
                this.filteredData.set([stock]);
                this.listTitle.set(`Search Result: ${symbol}`);
            }
        }
    }

    onSearchChange(event: string) {
        if (!event || event.trim() === '') {
            this.resetFilters();
        }
    }

    // --- UI Helpers ---

    getUpside(stock: IMomentumDecision): string {
        return ((stock.target_price - stock.current_price) / stock.current_price * 100).toFixed(1);
    }

    getScoreClass(rating: string): string {
        if (rating === 'STRONG BUY') {
            return 'bg-success';
        } else if (rating === 'BUY') {
            return 'bg-primary';
        } else if (rating === 'ACCUMULATE') {
            return 'bg-warning';
        } else if (rating === 'HOLD') {
            return 'bg-hold';
        } else {
            return 'bg-danger';
        }
    }

    getScoreColor(score: number): string {
        return score >= 8.0 ? '#198754' : score >= 6.0 ? '#0d6efd' : '#fd7e14';
    }

    showDetailPanel(stock: IMomentumDecision) {
        this.selectedStock.set(stock);
        this.isPanelOpen.set(true);
    }

    openHistoryModal(template: TemplateRef<any>, stock: IMomentumDecision) {
        this.selectedStockForHistory.set(stock);
        this.initializeCharts(stock);
        this.modalRef = this.modalService.show(template, {
            class: 'modal-lg-95',
            backdrop: 'static',
            keyboard: true
        });
    }

    closeHistoryModal() {
        this.modalRef?.hide();
        this.selectedStockForHistory.set(null);
    }

    initializeCharts(stock: IMomentumDecision) {
        // Generate mock historical data (replace with actual API call)
        const historicalData = this.generateMockHistoricalData(stock.pastData || []);

        // Score vs Confidence Chart
        this.scoreChartOptions = {
            chart: {
                type: 'line',
                height: 500
            },
            title: {
                text: `${stock.symbol} - Score & Confidence Trend`,
                style: {
                    fontSize: '16px',
                    fontWeight: 'bold'
                }
            },
            xAxis: {
                categories: historicalData.dates,
                title: {
                    text: ''
                }
            },
            yAxis: [
                {
                    title: {
                        text: 'Score',
                        style: { color: '#0d6efd' }
                    },
                    min: 0,
                    max: 10,
                    tickPositions: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                    gridLineWidth: 1
                }, {
                    title: {
                        text: 'Confidence (%)',
                        style: { color: '#198754' }
                    },
                    opposite: true,
                    min: 0,
                    max: 100,
                    tickPositions: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
                    gridLineWidth: 0
                }],
            series: [
                {
                    name: 'Score',
                    type: 'line',
                    data: historicalData.scores,
                    color: '#0d6efd',
                    marker: {
                        enabled: true,
                        radius: 4
                    },
                    yAxis: 0,
                    dataLabels: {
                        enabled: false
                    }
                },
                {
                    name: 'Confidence',
                    type: 'line',
                    data: historicalData.confidence.map((val, idx) => ({
                        y: val,
                        rating: historicalData.ratings[idx]
                    })),
                    color: '#198754',
                    marker: {
                        enabled: true,
                        radius: 4
                    },
                    yAxis: 1,
                    dataLabels: {
                        enabled: true,
                        formatter: function () {
                            // @ts-ignore
                            return this.point.rating !== undefined ? this.point.rating : '';
                        },
                        style: {
                            fontSize: '13px',
                            fontWeight: 'bold',
                            color: '#333'
                        },
                        align: 'center',
                        verticalAlign: 'bottom'
                    }
                }
            ],
            tooltip: {
                shared: true
            },
            credits: {
                enabled: false
            },
            legend: {
                align: 'center',
                verticalAlign: 'bottom'
            }
        };

        // Volume & Delivery Trend Chart
        this.volumeChartOptions = {
            chart: {
                type: 'column',
                height: 500
            },
            title: {
                text: `${stock.symbol} - Volume & Delivery Trend`,
                style: {
                    fontSize: '15px',
                    fontWeight: 'bold'
                }
            },
            xAxis: {
                categories: historicalData.dates,
                title: {
                    text: ''
                },
                labels: {
                    rotation: -45,
                    style: {
                        fontSize: '11px'
                    }
                }
            },
            yAxis: [{
                title: {
                    text: '',
                    style: { color: '#333' }
                },
                min: 0,
                max: 200,
                tickPositions: [0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200],
                labels: {
                    format: '{value}%'
                }
            }],
            series: [{
                name: 'Volume',
                type: 'column',
                data: historicalData.volumeTrend,
                color: '#fd7e14',
                dataLabels: {
                    enabled: true,
                    rotation: -90,
                    align: 'center',
                    format: '{point.y:.1f}%',
                    y: 0,
                    inside: false,
                    overflow: 'allow',
                    crop: false,
                    style: {
                        fontSize: '11px',
                        color: '#000',
                        textOutline: 'none'
                    }
                }
            }, {
                name: 'Delivery %',
                type: 'column',
                data: historicalData.delivery,
                color: '#6f42c1',
                dataLabels: {
                    enabled: true,
                    rotation: -90,
                    align: 'center',
                    format: '{point.y:.1f}%',
                    y: 0,
                    inside: false,
                    overflow: 'allow',
                    crop: false,
                    style: {
                        fontSize: '11px',
                        color: '#000',
                        textOutline: 'none'
                    }
                }
            }],
            tooltip: {
                shared: true,
                valueSuffix: '%'
            },
            credits: {
                enabled: false
            },
            legend: {
                align: 'center',
                verticalAlign: 'bottom'
            },
            plotOptions: {
                column: {
                    pointPadding: 0.1,
                    borderWidth: 0
                }
            }
        };

        this.updateFlag = true;
    }

    generateMockHistoricalData(stocks: Array<IMomentumDecision>) {
        // Generate 10 days of historical data based on stock metrics
        const dates: string[] = [];
        const scores: number[] = [];
        const confidence: number[] = [];
        const volumeTrend: number[] = [];
        const delivery: number[] = [];
        const ratings: string[] = [];

        for (const stock of stocks) {
            const tradeDate = moment(stock.trade_date).format('DD-MMM');
            const currentScore = stock.total_score;
            const currentConfidence = stock.confidence;
            const currentVolume = stock.volume_trend_60d;
            const currentDelivery = stock.delivery_avg_10d;
            const currentRating =
                stock.rating === 'STRONG BUY' ? 'SB' :
                    stock.rating === 'BUY' ? 'B' :
                        stock.rating === 'ACCUMULATE' ? 'A' :
                            stock.rating === 'HOLD' ? 'H' :
                                stock.rating === 'AVOID' ? 'AV' : '';

            dates.push(tradeDate);
            scores.push(parseFloat(currentScore.toFixed(1)));
            confidence.push(parseFloat(currentConfidence.toFixed(1)));
            volumeTrend.push(parseFloat(currentVolume.toFixed(1)));
            delivery.push(parseFloat(currentDelivery.toFixed(1)));
            ratings.push(currentRating);
        }

        return { dates, scores, confidence, volumeTrend, delivery, ratings };
    }

    // Listen for ESC key to close the detail panel
    ngAfterViewInit(): void {
        window.addEventListener('keydown', this.handleEscKey);
    }

    ngOnDestroy(): void {
        window.removeEventListener('keydown', this.handleEscKey);
    }

    private handleEscKey = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && this.isPanelOpen()) {
            this.closeDetailPanel();
        }
    }

    closeDetailPanel() {
        this.isPanelOpen.set(false);
    }

    // --- Insight Logic ---

    getInsightTitle(stock: IMomentumDecision): string {
        if (stock.delivery_vs_price_pattern === 'ACCUMULATION') {
            return 'Accumulation Pattern Detected';
        } else if (stock.total_score >= 8.0) {
            return 'Strong Buy Signal';
        } else if (stock.total_score >= 6.0) {
            return 'Buy Signal';
        } else {
            return 'Accumulate Signal';
        }
    }

    getInsightDescription(stock: IMomentumDecision): string {
        if (stock.delivery_vs_price_pattern === 'ACCUMULATION') {
            return `High delivery (${stock.delivery_avg_10d.toFixed(1)}%) despite price decline indicates smart money accumulation. Institutions are buying the dip. Strong reversal candidate.`;
        } else if (stock.total_score >= 8.0) {
            return `Exceptional momentum with high-quality setup. Near 52W high (${stock.dist_from_52w.toFixed(1)}%) with strong volume trend. Prime candidate for momentum portfolio.`;
        } else if (stock.total_score >= 6.0) {
            return `Strong momentum indicators with good fundamentals. Consider entry at current levels with ${stock.expected_days}-day target.`;
        } else {
            return `Moderate momentum setup. Consider accumulating on weakness if fundamentals remain strong.`;
        }
    }

}


