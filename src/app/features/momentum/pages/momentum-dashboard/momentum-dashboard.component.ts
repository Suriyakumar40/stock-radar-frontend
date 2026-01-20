import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MomentumService } from '../../services/momentum.service';
import { signal, computed } from '@angular/core';
import { IndustryStats, MomentumScore, StatsCard } from '../../models/momentum.model';

@Component({
    selector: 'app-momentum-dashboard',
    standalone: true,
    templateUrl: './momentum-dashboard.component.html',
    styleUrls: ['./momentum-dashboard.component.scss'],
    imports: [CommonModule, FormsModule]
})
export class MomentumDashboardComponent implements OnInit {

    private momentumService = inject(MomentumService);

    // Tab state
    activeTab: string = 'all';

    // Stats cards
    statsCards: StatsCard[] = [];

    // Stocks data
    allStocks: MomentumScore[] = [];
    filteredStocks: MomentumScore[] = [];

    // Industry data
    industries: IndustryStats[] = [];

    // Filters
    searchTerm: string = '';
    filterIndex: string = '';
    filterRating: string = '';
    filterDelivery: string = '';

    // Modal state
    selectedStock: MomentumScore | null = null;
    showModal: boolean = false;

    // Last updated
    lastUpdated: string = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    constructor() { }

    ngOnInit(): void {
        this.loadSampleData();
        this.updateStatsCards();
        this.updateIndustries();
    }

    /**
     * Load sample stock data
     */
    loadSampleData(): void {
        // Sample data from the HTML (top 20 stocks)
        this.allStocks = [
            {
                rank: 1,
                symbol: 'NMDC',
                index: 'NIFTY MIDCAP 150',
                industry: 'Industrial Minerals',
                current_price: 85.25,
                dist_from_52w_high: 0.0,
                volume_trend_60d: 55.3,
                delivery_avg_10d: 45.7,
                price_change_today: 1.2,
                sales_growth_yoy: 29.7,
                profit_growth_yoy: 40.9,
                score_52w_high: 2.0,
                score_volume_delivery: 2.0,
                score_price_today: 0.75,
                score_sales_growth: 2.0,
                score_profit_growth: 2.0,
                total_score: 8.8,
                rating: 'STRONG BUY',
                is_quality_buying: true,
                is_speculation: false
            },
            {
                rank: 2,
                symbol: 'GMRAIRPORT',
                index: 'NIFTY MIDCAP 150',
                industry: 'Airport & Airport services',
                current_price: 108.02,
                dist_from_52w_high: -2.1,
                volume_trend_60d: 64.1,
                delivery_avg_10d: 49.8,
                price_change_today: 0.5,
                sales_growth_yoy: 47.1,
                profit_growth_yoy: 108.2,
                score_52w_high: 2.0,
                score_volume_delivery: 2.0,
                score_price_today: 0.5,
                score_sales_growth: 2.0,
                score_profit_growth: 2.0,
                total_score: 8.5,
                rating: 'STRONG BUY',
                is_quality_buying: true,
                is_speculation: false
            },
            {
                rank: 3,
                symbol: 'EICHERMOT',
                index: 'NIFTY 50',
                industry: '2/3 Wheelers',
                current_price: 7514.50,
                dist_from_52w_high: 0.0,
                volume_trend_60d: 24.9,
                delivery_avg_10d: 50.6,
                price_change_today: 0.8,
                sales_growth_yoy: 44.8,
                profit_growth_yoy: 24.4,
                score_52w_high: 2.0,
                score_volume_delivery: 1.5,
                score_price_today: 0.5,
                score_sales_growth: 2.0,
                score_profit_growth: 2.0,
                total_score: 8.0,
                rating: 'STRONG BUY',
                is_quality_buying: true,
                is_speculation: false
            },
            // Add more stocks as needed...
        ];

        this.filteredStocks = [...this.allStocks];
    }

    /**
     * Update stats cards based on current data
     */
    updateStatsCards(): void {
        const strongBuyCount = this.allStocks.filter(s => s.total_score >= 7.5).length;
        const buyCount = this.allStocks.filter(s => s.total_score >= 6.0 && s.total_score < 7.5).length;
        const accumulateCount = this.allStocks.filter(s => s.total_score >= 4.5 && s.total_score < 6.0).length;

        this.statsCards = [
            {
                label: 'Strong Buy',
                value: strongBuyCount,
                description: 'Score ≥7.5\nTop momentum stocks',
                type: 'explosive',
                icon: 'bi-star-fill'
            },
            {
                label: 'Buy',
                value: buyCount,
                description: 'Score 6.0-7.4\nGood opportunities',
                type: 'good',
                icon: 'bi-graph-up'
            },
            {
                label: 'Accumulate',
                value: accumulateCount,
                description: 'Score 4.5-5.9\nWatch & build',
                type: 'exceptional',
                icon: 'bi-hourglass-split'
            },
            {
                label: 'Total Analyzed',
                value: this.allStocks.length,
                description: 'NIFTY 50, NEXT 50, MIDCAP 150\nLive tracking',
                type: 'danger',
                icon: 'bi-activity'
            }
        ];
    }

    /**
     * Update industry statistics
     */
    updateIndustries(): void {
        const industryMap = new Map<string, { stocks: MomentumScore[], totalScore: number }>();

        this.allStocks.forEach(stock => {
            if (!industryMap.has(stock.industry)) {
                industryMap.set(stock.industry, { stocks: [], totalScore: 0 });
            }
            const industry = industryMap.get(stock.industry)!;
            industry.stocks.push(stock);
            industry.totalScore += stock.total_score;
        });

        this.industries = Array.from(industryMap.entries()).map(([name, data]) => ({
            name,
            count: data.stocks.length,
            avg_score: data.totalScore / data.stocks.length,
            top_stock: data.stocks.sort((a, b) => b.total_score - a.total_score)[0].symbol
        })).sort((a, b) => b.avg_score - a.avg_score).slice(0, 6);
    }

    /**
     * Apply filters to stocks
     */
    applyFilters(): void {
        this.filteredStocks = this.allStocks.filter(stock => {
            const matchSearch = !this.searchTerm ||
                stock.symbol.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                stock.industry.toLowerCase().includes(this.searchTerm.toLowerCase());

            const matchIndex = !this.filterIndex || stock.index === this.filterIndex;

            const matchRating = !this.filterRating || this.getRatingClass(stock.rating) === this.filterRating;

            const matchDelivery = !this.filterDelivery ||
                stock.delivery_avg_10d >= parseFloat(this.filterDelivery);

            return matchSearch && matchIndex && matchRating && matchDelivery;
        });
    }

    /**
     * Reset all filters
     */
    resetFilters(): void {
        this.searchTerm = '';
        this.filterIndex = '';
        this.filterRating = '';
        this.filterDelivery = '';
        this.applyFilters();
    }

    /**
     * Filter by rating
     */
    filterByRating(rating: string): void {
        this.filterRating = rating;
        this.applyFilters();
        this.activeTab = 'all';
    }

    /**
     * Filter by index
     */
    showIndexStocks(index: string): void {
        this.filterIndex = index;
        this.applyFilters();
        this.activeTab = 'all';
    }

    /**
     * Show stock detail modal
     */
    showStockDetail(stock: MomentumScore): void {
        this.selectedStock = stock;
        this.showModal = true;
    }

    /**
     * Close modal
     */
    closeModal(): void {
        this.showModal = false;
        this.selectedStock = null;
    }

    /**
     * Get rating CSS class
     */
    getRatingClass(rating: string): string {
        switch (rating) {
            case 'STRONG BUY': return 'strong-buy';
            case 'BUY': return 'buy';
            case 'ACCUMULATE': return 'accumulate';
            case 'HOLD': return 'hold';
            case 'AVOID': return 'avoid';
            default: return 'hold';
        }
    }

    /**
     * Get rating badge HTML
     */
    getRatingBadge(rating: string): { class: string; icon: string; text: string } {
        switch (rating) {
            case 'STRONG BUY':
                return { class: 'badge-strong-buy', icon: 'bi-star-fill', text: 'Strong Buy' };
            case 'BUY':
                return { class: 'badge-buy', icon: 'bi-graph-up', text: 'Buy' };
            case 'ACCUMULATE':
                return { class: 'badge-accumulate', icon: 'bi-hourglass-split', text: 'Accumulate' };
            case 'HOLD':
                return { class: 'badge-hold', icon: 'bi-dash-circle', text: 'Hold' };
            case 'AVOID':
                return { class: 'badge-avoid', icon: 'bi-x-circle', text: 'Avoid' };
            default:
                return { class: 'badge-hold', icon: 'bi-dash-circle', text: 'Hold' };
        }
    }

    /**
     * Get trend icon
     */
    getTrendIcon(value: number): string {
        return value >= 0 ? 'bi-arrow-up trend-up' : 'bi-arrow-down trend-down';
    }

    /**
     * Get trend class
     */
    getTrendClass(value: number): string {
        return value >= 0 ? 'trend-up' : 'trend-down';
    }

    /**
     * Format currency
     */
    formatCurrency(value: number): string {
        return '₹' + value.toLocaleString('en-IN', { maximumFractionDigits: 2 });
    }

    /**
     * Get investment insight
     */
    getInvestmentInsight(stock: MomentumScore): string {
        if (stock.total_score >= 8.0) {
            return `<strong class="trend-up">Strong Buy Signal:</strong> Exceptional momentum with high-quality accumulation (${stock.delivery_avg_10d.toFixed(1)}% delivery). Near 52W high with strong volume trend. Prime candidate for momentum portfolio.`;
        } else if (stock.total_score >= 7.0) {
            return `<strong class="trend-up">Buy Signal:</strong> Strong momentum indicators with good fundamentals. Volume trend of ${stock.volume_trend_60d >= 0 ? '+' : ''}${stock.volume_trend_60d.toFixed(1)}% suggests institutional interest. Consider adding on dips.`;
        } else if (stock.total_score >= 6.0) {
            return `<strong style="color: var(--good)">Buy Signal:</strong> Good momentum setup with ${stock.delivery_avg_10d.toFixed(1)}% delivery indicating quality buying. Watch for breakout confirmation.`;
        } else {
            return 'Moderate momentum. Consider accumulating on weakness if fundamentals remain strong.';
        }
    }

    /**
     * Set active tab
     */
    setActiveTab(tab: string): void {
        this.activeTab = tab;
    }
}


