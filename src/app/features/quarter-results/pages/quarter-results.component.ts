import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import moment from 'moment';
import { QuarterResultService } from '../services/quarter-result.service';
import { CommonService } from '@shared/services/common.service';
import { BsDatepickerConfig, BsDatepickerModule, BsDatepickerViewMode } from 'ngx-bootstrap/datepicker';
import { forkJoin } from 'rxjs';
import { INDICES, RATING } from '@shared/constants';
import { HelperModel } from '@shared/helper';

@Component({
    selector: 'app-quarter-results',
    standalone: true,
    templateUrl: './quarter-results.component.html',
    styleUrls: ['./quarter-results.component.scss'],
    imports: [CommonModule, FormsModule, BsDatepickerModule],
    providers: [QuarterResultService]
})
export class QuarterResultsComponent {
    // State
    currentView = signal<'indices' | 'industry' | 'rating' | 'search' | null>(null);
    selectedFilterType = signal<string | null>(null);
    selectedFilterValue = signal<string | null>(null);
    detailRatingFilter = signal<string>('RECENT');
    today = new Date();
    search: string = '';

    periodEnd: Date = new Date(); // Default to today;
    bsConfig: Partial<BsDatepickerConfig>;
    maxDate: Date;
    disabledMonths: Date[] = [];

    // Use inject() to properly resolve the service without constructor reflection issues
    private quarterResultService = inject(QuarterResultService);
    private commonService = inject(CommonService);

    constructor() {
        const currentYear = this.today.getFullYear();
        this.periodEnd = new Date(currentYear, this.today.getMonth(), 0); // Default to last day of previous month
        // If today is in Q1(0,1,2), end is Mar(2). Q2(3,4,5), end is Jun(5)...
        const currentQuarterEndMonth = Math.floor(this.today.getMonth() / 3) * 3 + 2;
        // Set maxDate to the last day of that quarter's final month
        this.maxDate = new Date(this.today.getFullYear(), currentQuarterEndMonth + 1, 0);
        this.disabledMonths = this.generateDisabledMonths();
        this.bsConfig = this.datePickConfig();
    }

    ngOnInit() {
        const formattedDate = HelperModel.getPreviousQuarter(new Date());
        forkJoin({
            quarterResults: this.quarterResultService.fetchQuarterResults(formattedDate)
        }).subscribe(({ quarterResults }) => {
            const stocks = this.commonService.getStocksList();
            debugger
            this.currentView.set('indices');
        });
    }

    setView(view: 'indices' | 'industry' | 'rating') {
        this.currentView.set(view);
    }

    showDetail(type: string, value: string) {
        this.selectedFilterType.set(type);
        this.selectedFilterValue.set(value);
        this.detailRatingFilter.set('RECENT');
    }

    goBack() {
        this.search = '';
        this.selectedFilterType.set(null);
        this.selectedFilterValue.set(null);
    }

    setDetailRatingFilter(rating: string) {
        this.detailRatingFilter.set(rating);
    }

    detailViewActive = computed(() => this.selectedFilterType() !== null);
    quarterResults = this.quarterResultService.getQuarterResults();
    indicesData = computed(() => {
        const indices = INDICES;
        return indices.map(index => {
            const items = this.quarterResults();
            const stocks = items.filter((s: any) => s.indices === index);
            const rating = this.getMostCommonRating(stocks);
            return {
                name: index,
                count: stocks.length,
                explosive: stocks.filter((s: any) => s.rating === RATING.EXPLOSIVE).length,
                exceptional: stocks.filter((s: any) => s.rating === RATING.EXCEPTIONAL).length,
                good: stocks.filter((s: any) => s.rating === RATING.GOOD).length,
                average: stocks.filter((s: any) => s.rating === RATING.AVERAGE).length,
                poor: stocks.filter((s: any) => s.rating === RATING.POOR).length,
                ratingClass: rating.toLowerCase()
            };
        });
    });

    industryData = computed(() => {
        const stocks = this.quarterResults();
        const industries = [...new Set(stocks.map((s: any) => s.industry))];

        return industries.map(industry => {
            const indStocks = stocks.filter((s: any) => s.industry === industry);
            const avgScore = indStocks.reduce((sum, s) => sum + s.ratingScore, 0) / indStocks.length;
            const rating = this.getMostCommonRating(indStocks);

            return {
                name: industry,
                count: indStocks.length,
                avgScore,
                explosive: indStocks.filter((s: any) => s.rating ===  RATING.EXPLOSIVE ).length,
                exceptional: indStocks.filter((s: any) => s.rating ===  RATING.EXCEPTIONAL ).length,
                good: indStocks.filter((s: any) => s.rating ===  RATING.GOOD ).length,
                average: indStocks.filter((s: any) => s.rating ===  RATING.AVERAGE ).length,
                poor: indStocks.filter((s: any) => s.rating ===  RATING.POOR ).length,
                ratingClass: rating.toLowerCase()
            };
        }).sort((a, b) => b.avgScore - a.avgScore)
    });

    ratingData = computed(() => {
        const ratings = [
            { name: RATING.EXPLOSIVE, scoreRange: '7-9', },
            { name: RATING.EXCEPTIONAL, scoreRange: '5-6' },
            { name: RATING.GOOD, scoreRange: '3-4' },
            { name: RATING.AVERAGE, scoreRange: '2-1' },
            { name: RATING.POOR, scoreRange: '0' }
        ];

        return ratings.map(r => {
            const stocks = this.quarterResults().filter((s: any) => s.rating === r.name);
            const avgProfit = stocks.length > 0
                ? (stocks.reduce((sum, s) => sum + s.profitGrowth, 0) / stocks.length).toFixed(1)
                : '0';

            return {
                ...r,
                count: stocks.length,
                avgProfit,
                styleClass: r.name.toLowerCase()
            };
        });
    });

    // --- COMPUTED DATA FOR DETAIL TABLE ---

    filteredStocks = computed(() => {
        let stocks = this.quarterResults();
        const type = this.selectedFilterType();
        const value = this.selectedFilterValue();
        const ratingFilter = this.detailRatingFilter();

        // 1. Filter by Overview Selection
        if (type === 'index') {
            // Need to match back to full index name "NIFTY ..."
            stocks = stocks.filter((s: any) => s.indices.includes(value!));
        } else if (type === 'industry') {
            stocks = stocks.filter((s: any) => s.industry === value);
        } else if (type === 'rating') {
            stocks = stocks.filter((s: any) => s.rating === value);
        } else if (type === 'search') {
            const searchLower = value!.toLowerCase();
            stocks = stocks.filter((s: any) => s.symbol.toLowerCase().includes(searchLower));
        }

        if (ratingFilter === 'RECENT') {
            return stocks.sort((a, b) => {
                const dateA = new Date(a.boardMeetingDate).getTime();
                const dateB = new Date(b.boardMeetingDate).getTime();
                return dateB - dateA;
            });
        } else if (ratingFilter !== 'ALL') {
            stocks = stocks.filter((s: any) => s.rating === ratingFilter);
        }

        // 3. Sort
        return stocks.sort((a, b) => {
            if (b.ratingScore !== a.ratingScore) return b.ratingScore - a.ratingScore;
            return b.profitGrowth - a.profitGrowth;
        });




    });

    // --- UTILS ---

    getMostCommonRating(stocks: any[]): string {
        if (stocks.length === 0) return 'average';
        const ratings = stocks.map((s: any) => s.rating);
        const counts: { [key: string]: number } = {};
        ratings.forEach(r => counts[r] = (counts[r] || 0) + 1);
        return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    }

    getScoreColor(score: number): string {
        if (score === 6) return 'var(--explosive)';
        if (score === 5) return 'var(--exceptional)';
        if (score >= 3) return 'var(--good)';
        return 'var(--average)';
    }

    datePickConfig(): Partial<BsDatepickerConfig> {
        return {
            minMode: 'month' as BsDatepickerViewMode,
            dateInputFormat: 'MMM YYYY',
            containerClass: 'theme-green',
            showWeekNumbers: false,
            adaptivePosition: true
        };
    }

    generateDisabledMonths(): Date[] {
        const currentYear = new Date().getFullYear();
        const startYear = currentYear - 5;
        const items = [];

        for (let year = startYear; year <= currentYear; year++) {
            for (let month = 0; month < 12; month++) {
                // Enable only last months of quarters: Mar(2), Jun(5), Sep(8), Dec(11)
                if ([0, 1, 3, 4, 6, 7, 9, 10].includes(month)) {
                    items.push(new Date(year, month, 1));
                }
            }
        }
        return items;
    }

    onDateSelect(event: Date | undefined): void {
        if (event) {
            // Logic: Get the last day of the selected month
            const lastDay = new Date(event.getFullYear(), event.getMonth() + 1, 0);

            // Prevent infinite loop: Only update if the day is not already the last day
            if (this.periodEnd.getDate() !== lastDay.getDate()) {
                this.periodEnd = lastDay;
                const formattedDate = moment(this.periodEnd).format('YYYY-MM-DD');
                this.quarterResultService.fetchQuarterResults(formattedDate).subscribe(() => {
                    // Data refreshed
                });
            }
        }
    }

    onSearchChange(value: string): void {
        this.search = value;
        this.showDetail('search', value);
    }
}