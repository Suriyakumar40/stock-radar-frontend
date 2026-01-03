import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FundamentalService } from '../../services/fundamental.service';
import { QuarterResult } from '../../model/quarter-result.model';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    imports: [CommonModule, FormsModule],
})
export class DashboardComponent {
    // State
    currentView = signal<'indices' | 'industry' | 'rating'>('indices');
    selectedFilterType = signal<string | null>(null);
    selectedFilterValue = signal<string | null>(null);
    detailRatingFilter = signal<string>('ALL');
    today = new Date();

    // Dropdown State
    quarters = ['Mar', 'Jun', 'Sep', 'Dec'];
    years = computed(() => {
        const currentYear = new Date().getFullYear();
        const startYear = 2022;
        const years = [];
        for (let y = startYear; y <= currentYear; y++) {
            years.push(y);
        }
        return years;
    });

    selectedQuarter = signal('Sep'); // Default
    selectedYear = signal(new Date().getFullYear()); // Default

    // Use inject() to properly resolve the service without constructor reflection issues
    private stockService = inject(FundamentalService);

    constructor() { }

    ngOnInit() {
        // Check system preference or saved preference could go here
    }

    // --- ACTIONS ---

    setView(view: 'indices' | 'industry' | 'rating') {
        this.currentView.set(view);
    }

    showDetail(type: string, value: string) {
        this.selectedFilterType.set(type);
        this.selectedFilterValue.set(value);
        this.detailRatingFilter.set('ALL');
    }

    goBack() {
        this.selectedFilterType.set(null);
        this.selectedFilterValue.set(null);
    }

    setDetailRatingFilter(rating: string) {
        this.detailRatingFilter.set(rating);
    }

    // --- HELPERS ---

    detailViewActive = computed(() => this.selectedFilterType() !== null);

    allStocks = this.stockService.getStocks();

    // --- COMPUTED DATA FOR OVERVIEW ---

    indicesData = computed(() => {
        const indices = ['NIFTY 50', 'NIFTY NEXT 50', 'NIFTY MIDCAP 150', 'NIFTY SMALLCAP 250', 'NIFTY MICROCAP 250'];
        return indices.map(index => {
            const stocks = this.allStocks().filter((s: any) => s.index === index);
            const rating = this.getMostCommonRating(stocks);
            return {
                name: index.replace('NIFTY ', ''),
                fullName: index,
                count: stocks.length,
                explosive: stocks.filter((s: any) => s.rating === 'EXPLOSIVE').length,
                exceptional: stocks.filter((s: any) => s.rating === 'EXCEPTIONAL').length,
                good: stocks.filter((s: any) => s.rating === 'GOOD').length,
                ratingClass: rating.toLowerCase()
            };
        });
    });

    industryData = computed(() => {
        const stocks = this.allStocks();
        const industries = [...new Set(stocks.map((s: any) => s.industry))];

        return industries.map(industry => {
            const indStocks = stocks.filter((s: any) => s.industry === industry);
            const avgScore = indStocks.reduce((sum, s) => sum + s.score, 0) / indStocks.length;
            const rating = this.getMostCommonRating(indStocks);

            return {
                name: industry,
                count: indStocks.length,
                avgScore,
                explosive: indStocks.filter((s: any) => s.rating === 'EXPLOSIVE').length,
                exceptional: indStocks.filter((s: any) => s.rating === 'EXCEPTIONAL').length,
                good: indStocks.filter((s: any) => s.rating === 'GOOD').length,
                ratingClass: rating.toLowerCase()
            };
        }).sort((a, b) => b.avgScore - a.avgScore).slice(0, 15);
    });

    ratingData = computed(() => {
        const ratings = [
            { name: 'EXPLOSIVE', scoreRange: '6', icon: '💥' },
            { name: 'EXCEPTIONAL', scoreRange: '5', icon: '🔥' },
            { name: 'GOOD', scoreRange: '3-4', icon: '✓' },
            { name: 'AVERAGE', scoreRange: '0-2', icon: '📊' }
        ];

        return ratings.map(r => {
            const stocks = this.allStocks().filter((s: any) => s.rating === r.name);
            const avgProfit = stocks.length > 0
                ? (stocks.reduce((sum, s) => sum + s.profit, 0) / stocks.length).toFixed(1)
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
        let stocks = this.allStocks();
        const type = this.selectedFilterType();
        const value = this.selectedFilterValue();
        const ratingFilter = this.detailRatingFilter();

        // 1. Filter by Overview Selection
        if (type === 'index') {
            // Need to match back to full index name "NIFTY ..."
            stocks = stocks.filter((s: any) => s.index.includes(value!));
        } else if (type === 'industry') {
            stocks = stocks.filter((s: any) => s.industry === value);
        } else if (type === 'rating') {
            stocks = stocks.filter((s: any) => s.rating === value);
        }

        // 2. Filter by Detail Bar Rating
        if (ratingFilter !== 'ALL') {
            stocks = stocks.filter((s: any) => s.rating === ratingFilter);
        }

        // 3. Sort
        return stocks.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return b.profit - a.profit;
        });
    });

    // --- UTILS ---

    getMostCommonRating(stocks: QuarterResult[]): string {
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
}