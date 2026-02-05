import { Component, OnInit, Signal, WritableSignal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MomentumService } from '../../services/momentum.service';
import { signal, computed } from '@angular/core';
import { StockPriceService } from '@shared/services/stock-price.service';
import { QuarterResultService } from '@feature/quarter-results/services/quarter-result.service';
import { forkJoin } from 'rxjs';
import { BsDatepickerConfig, BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { HelperModel } from '@shared/helper';
import { CommonService } from '@shared/services/common.service';
import { IMomentumDecision } from '@feature/momentum/models/momentum-decision.model';

@Component({
    selector: 'app-momentum-dashboard',
    standalone: true,
    templateUrl: './momentum-dashboard.component.html',
    styleUrls: ['./momentum-dashboard.component.scss'],
    imports: [CommonModule, FormsModule, BsDatepickerModule],
    providers: [MomentumService, QuarterResultService]
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

    selectedDate: Date = new Date();
    maxDate: Date = new Date();
    bsConfig: Partial<BsDatepickerConfig>;

    // Computed signals for counts
    countStrongBuy: Signal<number> = computed(() => this.allData().filter(s => s.rating === 'STRONG BUY').length);
    countBuy: Signal<number> = computed(() => this.allData().filter(s => s.rating === 'BUY').length);
    countAccumulate: Signal<number> = computed(() => this.allData().filter(s => s.rating === 'ACCUMULATE').length);
    countHold: Signal<number> = computed(() => this.allData().filter(s => s.rating === 'HOLD').length);
    countAvoid: Signal<number> = computed(() => this.allData().filter(s => s.rating === 'AVOID').length);

    // Use inject() to properly resolve the service without constructor reflection issues
    private momentumService = inject(MomentumService);
    private commonService = inject(CommonService);

    constructor() {
        // Set selectedDate based on local time: if after 18:30, use today; else, use previous date
        const now = new Date();
        if (now.getHours() > 18 || (now.getHours() === 18 && now.getMinutes() >= 30)) {
            this.selectedDate = new Date();
        } else {
            const prev = new Date();
            prev.setDate(prev.getDate() - 1);
            this.selectedDate = prev;
        }
        this.bsConfig = {
            containerClass: 'theme-green',
            dateInputFormat: 'DD-MMM-YYYY',
            showWeekNumbers: false,
        }
    }

    ngOnInit(): void {
        this.isLoading.set(true);
        const dbEndDate = HelperModel.uiToApiDateFormat(this.selectedDate);
        forkJoin({
            momentumData: this.momentumService.getMomentumDecisionsByDate(dbEndDate)
        }).subscribe(({ momentumData }) => {
            const stocks = this.commonService.getStocksList();
            this.allData.set(momentumData);
            this.filterByAction('STRONG BUY');
            this.isLoading.set(false);
        });
    }

    onDateChange(event: Date | undefined): void {
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

    closeDetailPanel() {
        this.isPanelOpen.set(false);
    }

    // --- Insight Logic ---

    getInsightTitle(stock: IMomentumDecision): string {
        if (stock.delivery_vs_price_pattern === 'ACCUMULATION') {
            return '🔥 Accumulation Pattern Detected';
        } else if (stock.total_score >= 8.0) {
            return '⭐ Strong Buy Signal';
        } else if (stock.total_score >= 6.0) {
            return '📈 Buy Signal';
        } else {
            return '⏳ Accumulate Signal';
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


