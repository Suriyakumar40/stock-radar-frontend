import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import moment from 'moment';
import { ShareholdingService } from '../services/shareholding.service';
import { CommonService } from '../../../shared';
import { BsDatepickerConfig, BsDatepickerModule, BsDatepickerViewMode } from 'ngx-bootstrap/datepicker';
import { forkJoin } from 'rxjs';
import { INDICES, RATING } from '../../../shared/constants';

@Component({
    selector: 'app-shareholding',
    standalone: true,
    templateUrl: './shareholding.component.html',
    styleUrls: ['./shareholding.component.scss'],
    imports: [CommonModule, FormsModule, BsDatepickerModule],
    providers: [ShareholdingService]
})
export class ShareholdingComponent {
    // Use inject() to properly resolve the service without constructor reflection issues
    private shareholdingService = inject(ShareholdingService);
    private commonService = inject(CommonService);

    currentFilter = signal<string>('all');
    indexFilter = signal<string | null>(null);

    stocks = this.shareholdingService.getStocks();
    summary = this.shareholdingService.getSummary();
    indexStats = this.shareholdingService.getIndexStats();

    constructor() {
    }

    ngOnInit() {
        // const formattedDate = moment(this.periodEnd).format('YYYY-MM-DD');
        // forkJoin({
        //     quarterResults: this.shareholdingService.fetchQuarterResults(formattedDate)
        // }).subscribe(({ quarterResults }) => {
        //     const stocks = this.commonService.getStocksList();
        //     this.currentView.set('indices');
        // });
    }

    // --- FILTERING LOGIC ---

    setFilter(filter: string) {
        this.currentFilter.set(filter);
        this.indexFilter.set(null); // Reset index filter when global filter changes
    }

    filterByIndex(indexName: string) {
        this.indexFilter.set(indexName);
        this.currentFilter.set('all'); // Reset global filter to see all in this index
    }

    filteredStocks = computed(() => {
        let result = this.stocks();
        const filter = this.currentFilter();
        const index = this.indexFilter();

        // 1. Index Filter
        if (index) {
            result = result.filter(s => s.index === index);
        }

        // 2. Logic Filters
        if (filter === 'both-up') {
            result = result.filter(s => s.fii_change > 0 && s.dii_change > 0);
        } else if (filter === 'fii-up') {
            result = result.filter(s => s.fii_change > 0);
        } else if (filter === 'dii-up') {
            result = result.filter(s => s.dii_change > 0);
        } else if (filter === 'promoter-up') {
            result = result.filter(s => s.promoter_change > 0);
        } else if (filter === 'fii-down') {
            result = result.filter(s => s.fii_change < 0);
        } else if (filter === 'dii-down') {
            result = result.filter(s => s.dii_change < 0);
        }

        // 3. Sort: Absolute Total Change (Activity)
        return result.sort((a, b) => {
            const changeA = Math.abs(a.fii_change) + Math.abs(a.dii_change);
            const changeB = Math.abs(b.fii_change) + Math.abs(b.dii_change);
            return changeB - changeA;
        });
    });

    // --- UTILS ---

    getPercentage(val: number): string {
        const total = this.summary().total_stocks;
        if (!total) return '0';
        return ((val / total) * 100).toFixed(1);
    }

    getChangeClass(change: number): string {
        if (change > 0) return 'change-up';
        if (change < 0) return 'change-down';
        return 'change-neutral';
    }

    getTrendIcon(change: number): string {
        if (change > 0) return '↑';
        if (change < 0) return '↓';
        return '−';
    }

}