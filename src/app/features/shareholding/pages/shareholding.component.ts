import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import moment from 'moment';
import { ShareholdingService } from '../services/shareholding.service';
import { CommonService } from '@shared/services/common.service';
import { BsDatepickerConfig, BsDatepickerModule, BsDatepickerViewMode } from 'ngx-bootstrap/datepicker';
import { forkJoin } from 'rxjs';
import { HelperModel } from '@shared/helper';

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

    shareholdings = this.shareholdingService.getShareholdings();
    indexStats = this.shareholdingService.getIndexStats();

    constructor() {
    }

    ngOnInit() {
        const date = new Date();
        const startOfMonth = HelperModel.getStartOfMonth(date);
        const range = HelperModel.getLastSixMonths(startOfMonth);
        forkJoin({
            shareholding: this.shareholdingService.fetchShareholdingByRange(range.start, range.end)
        }).subscribe(({ shareholding }) => {
        });
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

    filteredShareholdings = computed(() => {
        let result = this.shareholdings();
        const filter = this.currentFilter();
        const index = this.indexFilter();

        // 1. Index Filter
        if (index) {
            result = result.filter(s => s.index === index);
        }

        // 2. Logic Filters
        if (filter === 'both-up') {
            result = result.filter(s => s.fiiDiff > 0 && s.diiDiff > 0);
        } else if (filter === 'fii-up') {
            result = result.filter(s => s.fiiDiff > 0);
        } else if (filter === 'dii-up') {
            result = result.filter(s => s.diiDiff > 0);
        } else if (filter === 'promoter-up') {
            result = result.filter(s => s.promoterDiff > 0);
        } else if (filter === 'fii-down') {
            result = result.filter(s => s.fiiDiff < 0);
        } else if (filter === 'dii-down') {
            result = result.filter(s => s.diiDiff < 0);
        }

        // 3. Sort: Absolute Total Change (Activity)
        return result.sort((a, b) => {
            switch (filter) {
                case 'fii-up':
                    return b.fiiDiff - a.fiiDiff; // Highest FII increase first
                case 'fii-down':
                    return a.fiiDiff - b.fiiDiff; // Most negative FII decrease first
                case 'dii-up':
                    return b.diiDiff - a.diiDiff; // Highest DII increase first
                case 'dii-down':
                    return a.diiDiff - b.diiDiff; // Most negative DII decrease first
                case 'promoter-up':
                    return b.promoterDiff - a.promoterDiff;
                case 'both-up':
                    // Sort by combined total increase
                    return (b.fiiDiff + b.diiDiff) - (a.fiiDiff + a.diiDiff);
                default:
                    // Default: Sort by submissionDate (desc), fallback to periodEnd (desc)
                    const getDate = (item: any) => item.submissionDate ? new Date(item.submissionDate) : new Date(item.periodEnd);
                    return getDate(b).getTime() - getDate(a).getTime();
            }
        });
    });

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