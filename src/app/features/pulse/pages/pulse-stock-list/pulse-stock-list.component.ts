import { Component, OnInit, WritableSignal, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { BsDatepickerConfig, BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { BsModalService } from 'ngx-bootstrap/modal';
import { HelperModel } from '@shared/helper';
import { CommonService } from '@shared/services/common.service';
import { INDICES } from '@shared/constants';
import { PulseService } from '../../services/pulse.service';
import { IPulseStock, IPulseStockLatestSignal } from '../../models/pulse-stock.model';
import { IRankedGroup, RankedGroupModel } from '../../models/ranked-group.model';
import { ISignal } from '../../models/signal.model';
import { SignalBadgeComponent } from '../../components/signal-badge/signal-badge.component';
import { StockDetailModalComponent } from '../../components/stock-detail-modal/stock-detail-modal.component';

export interface IGroupedStocks {
    group: IRankedGroup;
    stocks: IPulseStock[];
}

const TOP_N_ANCHORS = 10;

/**
 * Sector rankings screen — grouping/anchor/expand/collapse/New-Signals logic, one screen
 * (/pulse/sector). Previously also served /pulse/industry via a `dimension` input; that
 * dimension was removed along with the backend industry ranking/signal system.
 */
@Component({
    selector: 'app-pulse-stock-list',
    standalone: true,
    templateUrl: './pulse-stock-list.component.html',
    styleUrls: ['./pulse-stock-list.component.scss'],
    imports: [CommonModule, FormsModule, BsDatepickerModule, SignalBadgeComponent],
    providers: [PulseService, BsModalService]
})
export class PulseStockListComponent implements OnInit {
    readonly indices = INDICES;

    signals: WritableSignal<ISignal[]> = signal([]);
    allStocks: WritableSignal<IPulseStock[]> = signal([]);
    groups: WritableSignal<IRankedGroup[]> = signal([]);
    expandedGroups: WritableSignal<Set<string>> = signal(new Set());
    isLoading: WritableSignal<boolean> = signal(true);
    showAllAnchors: WritableSignal<boolean> = signal(false);

    searchTerm: WritableSignal<string> = signal('');
    indexFilter: WritableSignal<string | null> = signal(null);

    selectedDate: Date = new Date();
    maxDate: Date = new Date();
    bsConfig: Partial<BsDatepickerConfig>;

    private deepLinkGroup: string | null = null;
    private hasScrolledToDeepLink = false;

    /**
     * Guards against a real ngx-bootstrap quirk: bsDatepicker fires (bsValueChange) once
     * on its very first bind, echoing the constructor's initial `selectedDate` (today) —
     * before the real trading date has been resolved. Starts true so that initial
     * auto-emission is caught too, not just later reassignment echoes. Confirmed via
     * network logs during manual verification.
     */
    private isSyncingDate = true;

    private pulseService = inject(PulseService);
    private commonService = inject(CommonService);
    private modalService = inject(BsModalService);
    private route = inject(ActivatedRoute);

    readonly hasActiveFilter = computed(() => this.searchTerm().trim().length > 0 || this.indexFilter() !== null);

    readonly filteredStocks = computed(() => {
        const term = this.searchTerm().trim().toLowerCase();
        const index = this.indexFilter();
        return this.allStocks().filter(s => {
            if (index && s.indices !== index) return false;
            if (term && !s.symbol.toLowerCase().includes(term) && !s.companyName.toLowerCase().includes(term)) return false;
            return true;
        });
    });

    readonly groupedStocks = computed<IGroupedStocks[]>(() => {
        const stocksByGroup = new Map<string, IPulseStock[]>();
        for (const stock of this.filteredStocks()) {
            const key = stock.sector;
            if (!stocksByGroup.has(key)) stocksByGroup.set(key, []);
            stocksByGroup.get(key)!.push(stock);
        }
        return this.groups()
            .map(group => ({ group, stocks: stocksByGroup.get(group.name) ?? [] }))
            .filter(g => g.stocks.length > 0);
    });

    readonly anchorGroups = computed(() => {
        const top = this.groups().slice(0, TOP_N_ANCHORS);
        return this.showAllAnchors() ? this.groups() : top;
    });

    constructor() {
        this.bsConfig = {
            containerClass: 'theme-green',
            dateInputFormat: 'DD-MMM-YYYY',
            showWeekNumbers: false,
        };
    }

    ngOnInit(): void {
        this.route.queryParamMap.subscribe(params => {
            const date = params.get('date') ?? undefined;
            this.deepLinkGroup = params.get('group');
            this.hasScrolledToDeepLink = false;
            this.loadData(date);
        });
    }

    private loadData(date?: string): void {
        this.isLoading.set(true);
        forkJoin({
            stocksResult: this.pulseService.getStocks(date),
            groupsResult: this.pulseService.getAllGroups(date),
            signalsResult: this.pulseService.getTodaysSignals(date),
            masterList: this.commonService.fetchStocksList()
        }).subscribe(({ stocksResult, groupsResult, signalsResult, masterList }) => {
            const resolvedDate = stocksResult.date || groupsResult.date;
            if (resolvedDate) {
                this.isSyncingDate = true;
                this.selectedDate = new Date(resolvedDate);
                this.maxDate = new Date(resolvedDate);
                setTimeout(() => { this.isSyncingDate = false; }, 300);
            }

            const bySymbol = new Map(masterList.map(s => [s.symbol, s]));
            this.allStocks.set(stocksResult.items.map(stock => ({
                ...stock,
                indices: bySymbol.get(stock.symbol)?.indices,
                isFno: bySymbol.get(stock.symbol)?.isFno
            })));

            this.groups.set(groupsResult.items);
            this.signals.set(signalsResult.items);

            const defaultExpanded = new Set(groupsResult.items.slice(0, TOP_N_ANCHORS).map(g => g.name));
            if (this.deepLinkGroup) {
                defaultExpanded.add(this.deepLinkGroup);
            }
            this.expandedGroups.set(defaultExpanded);

            this.isLoading.set(false);

            if (this.deepLinkGroup && !this.hasScrolledToDeepLink) {
                this.hasScrolledToDeepLink = true;
                const target = this.deepLinkGroup;
                setTimeout(() => this.scrollToGroup(target), 150);
            }
        });
    }

    onDateChange(event: Date): void {
        // isSyncingDate covers the common case; the maxDate check is a timing-independent
        // backstop — a genuine user pick can never exceed maxDate, so anything beyond it
        // must be a stale echo from ngx-bootstrap's datepicker, not a real selection.
        if (!event || this.isSyncingDate || event > this.maxDate) {
            return;
        }
        this.loadData(HelperModel.uiToApiDateFormat(event));
    }

    onSearchChange(value: string): void {
        this.searchTerm.set(value);
    }

    onIndexFilterChange(value: string): void {
        this.indexFilter.set(value || null);
    }

    isGroupExpanded(name: string): boolean {
        if (this.hasActiveFilter()) {
            return true;
        }
        return this.expandedGroups().has(name);
    }

    toggleGroup(name: string): void {
        this.expandedGroups.update(current => {
            const next = new Set(current);
            if (next.has(name)) {
                next.delete(name);
            } else {
                next.add(name);
            }
            return next;
        });
    }

    scrollToGroup(name: string): void {
        this.expandedGroups.update(current => new Set(current).add(name));
        setTimeout(() => {
            document.getElementById(this.anchorId(name))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
    }

    toggleShowAllAnchors(): void {
        this.showAllAnchors.update(v => !v);
    }

    openStockDetail(stockId: number | null): void {
        if (!stockId) {
            return;
        }
        this.modalService.show(StockDetailModalComponent, {
            initialState: { stockId } as Partial<StockDetailModalComponent>,
            class: 'modal-lg modal-dialog-scrollable',
            backdrop: 'static',
            keyboard: true
        } as any);
    }

    anchorId(name: string): string {
        return 'group-' + name.replace(/[^a-zA-Z0-9]+/g, '-');
    }

    latestSignalFor(stock: IPulseStock): IPulseStockLatestSignal | null {
        return stock.latestSectorSignal;
    }

    rankDeltaIcon(item: IRankedGroup): 'up' | 'down' | 'flat' {
        return RankedGroupModel.rankDeltaIcon(item);
    }

    rankDeltaValue(item: IRankedGroup): number {
        return RankedGroupModel.rankDeltaValue(item);
    }
}
