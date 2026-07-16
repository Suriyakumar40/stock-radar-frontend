import { Component, OnInit, WritableSignal, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { BsDatepickerConfig, BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { BsModalService } from 'ngx-bootstrap/modal';
import { HelperModel } from '@shared/helper';
import { CommonService } from '@shared/services/common.service';
import { PulseService } from '../../services/pulse.service';
import { ScreenerHorizon, IScreenerHistory, IScreenerHistoryStock, IScreenerSectorHistory, IScreenerSectorHistoryEntry } from '../../models/screener.model';
import { StockDetailModalComponent } from '../../components/stock-detail-modal/stock-detail-modal.component';

const HORIZONS: ScreenerHorizon[] = ['SWING', 'POSITIONAL', 'CROSS'];
const WINDOW_OPTIONS = [10, 15, 20, 30];
const DEFAULT_WINDOW_DAYS = 20;

interface ICardData {
    horizon: ScreenerHorizon;
    label: string;
    todayCount: number;
    windowCount: number;
}

/**
 * Screener page (/pulse/screener) — see screener-fe-spec.md. Cards (Swing/Positional/Cross,
 * Cross default) -> list panel (rolling window, recency-tagged) -> stock detail popup.
 * One backend call per horizon (GET /screener/history) backs both the cards and the list —
 * no separate call needed for "today's count," since each history result already flags
 * qualifyingToday per stock.
 */
@Component({
    selector: 'app-pulse-screener',
    standalone: true,
    templateUrl: './pulse-screener.component.html',
    styleUrls: ['./pulse-screener.component.scss'],
    imports: [CommonModule, FormsModule, BsDatepickerModule],
    providers: [PulseService, BsModalService]
})
export class PulseScreenerComponent implements OnInit {
    readonly windowOptions = WINDOW_OPTIONS;

    activeHorizon: WritableSignal<ScreenerHorizon> = signal('CROSS');
    windowDays: WritableSignal<number> = signal(DEFAULT_WINDOW_DAYS);
    histories: WritableSignal<Record<ScreenerHorizon, IScreenerHistory | null>> = signal({
        SWING: null, POSITIONAL: null, CROSS: null
    });
    /** Rolling-window sector leaderboard — shares this page's one windowDays control with the stock list. */
    sectorHistories: WritableSignal<Record<ScreenerHorizon, IScreenerSectorHistory | null>> = signal({
        SWING: null, POSITIONAL: null, CROSS: null
    });
    /** Sector row clicked in the leaderboard — filters the stock list below; null = all sectors. */
    selectedSector: WritableSignal<string | null> = signal(null);
    isLoading: WritableSignal<boolean> = signal(true);
    /** symbol -> indices (e.g. "NIFTY 50"), for the identification badge in the list. */
    stockIndices: WritableSignal<Map<string, string | undefined>> = signal(new Map());

    selectedDate: Date = new Date();
    maxDate: Date = new Date();
    bsConfig: Partial<BsDatepickerConfig>;

    /** Same ngx-bootstrap first-bind echo guard used on the other Pulse pages. */
    private isSyncingDate = true;

    private pulseService = inject(PulseService);
    private modalService = inject(BsModalService);
    private commonService = inject(CommonService);

    readonly cards = computed<ICardData[]>(() => {
        const h = this.histories();
        const labels: Record<ScreenerHorizon, string> = { SWING: 'Swing', POSITIONAL: 'Positional', CROSS: 'Cross' };
        return HORIZONS.map(horizon => {
            const hist = h[horizon];
            return {
                horizon,
                label: labels[horizon],
                todayCount: hist ? hist.stocks.filter(s => s.qualifyingToday).length : 0,
                windowCount: hist ? hist.stocks.length : 0
            };
        });
    });

    readonly activeList = computed<IScreenerHistoryStock[]>(() => this.histories()[this.activeHorizon()]?.stocks ?? []);

    readonly activeSectors = computed<IScreenerSectorHistoryEntry[]>(() => this.sectorHistories()[this.activeHorizon()]?.sectors ?? []);

    /** Sectors that just broke into the top ranks this window — surfaced both on the sector row and on stocks in that sector. */
    readonly newSectorNames = computed<Set<string>>(() => new Set(this.activeSectors().filter(s => s.isNew).map(s => s.sector)));

    readonly filteredList = computed<IScreenerHistoryStock[]>(() => {
        const sector = this.selectedSector();
        const list = this.activeList();
        return sector ? list.filter(s => s.sector === sector) : list;
    });

    readonly resolvedDate = computed<string | null>(() => {
        const h = this.histories();
        return h.CROSS?.date ?? h.SWING?.date ?? h.POSITIONAL?.date ?? null;
    });

    readonly resolvedDateDisplay = computed<string>(() => {
        const d = this.resolvedDate();
        return d ? HelperModel.apiToUiDateFormat(d) : '—';
    });

    constructor() {
        this.bsConfig = {
            containerClass: 'theme-green',
            dateInputFormat: 'DD-MMM-YYYY',
            showWeekNumbers: false,
        };
    }

    ngOnInit(): void {
        this.loadData();
        this.commonService.fetchStocksList().subscribe(list => {
            this.stockIndices.set(new Map(list.map(s => [s.symbol, s.indices])));
        });
    }

    /**
     * date omitted = initial "latest" load — only then do we set maxDate, since that's the
     * one point where the resolved date is the true upper bound. Every subsequent call
     * passes an explicit date (date-picker pick or window-size change on the same date) and
     * must NOT touch maxDate, otherwise picking an earlier date permanently locks out every
     * later date (the bug: maxDate used to be reset to whatever date was just viewed).
     */
    private loadData(date?: string): void {
        this.isLoading.set(true);
        this.selectedSector.set(null); // sector composition can change with the date — don't carry a stale filter over
        const isInitialLoad = date === undefined;
        const windowDays = this.windowDays();
        forkJoin({
            SWING: this.pulseService.getScreenerHistory('SWING', date, windowDays),
            POSITIONAL: this.pulseService.getScreenerHistory('POSITIONAL', date, windowDays),
            CROSS: this.pulseService.getScreenerHistory('CROSS', date, windowDays),
            SWING_SECTORS: this.pulseService.getScreenerSectorHistory('SWING', date, windowDays),
            POSITIONAL_SECTORS: this.pulseService.getScreenerSectorHistory('POSITIONAL', date, windowDays),
            CROSS_SECTORS: this.pulseService.getScreenerSectorHistory('CROSS', date, windowDays)
        }).subscribe(result => {
            this.histories.set({ SWING: result.SWING, POSITIONAL: result.POSITIONAL, CROSS: result.CROSS });
            this.sectorHistories.set({
                SWING: result.SWING_SECTORS, POSITIONAL: result.POSITIONAL_SECTORS, CROSS: result.CROSS_SECTORS
            });
            const resolvedDate = result.CROSS?.date ?? result.SWING?.date ?? result.POSITIONAL?.date;
            if (resolvedDate) {
                this.isSyncingDate = true;
                this.selectedDate = new Date(resolvedDate);
                if (isInitialLoad) {
                    this.maxDate = new Date(resolvedDate);
                }
                setTimeout(() => { this.isSyncingDate = false; }, 300);
            }
            this.isLoading.set(false);
        });
    }

    onDateChange(event: Date): void {
        if (!event || this.isSyncingDate || event > this.maxDate) {
            return;
        }
        this.loadData(HelperModel.uiToApiDateFormat(event));
    }

    onWindowDaysChange(value: string): void {
        this.windowDays.set(parseInt(value, 10));
        this.loadData(HelperModel.uiToApiDateFormat(this.selectedDate));
    }

    selectHorizon(horizon: ScreenerHorizon): void {
        this.activeHorizon.set(horizon);
        this.selectedSector.set(null); // each horizon has its own sector leaderboard — a filter from the last one wouldn't apply
    }

    selectSector(sector: string): void {
        this.selectedSector.set(this.selectedSector() === sector ? null : sector);
    }

    statusLabel(item: { qualifyingToday: boolean; tradingDaysSinceLastSeen: number }): string {
        if (item.qualifyingToday) return 'Qualifying today';
        const n = item.tradingDaysSinceLastSeen;
        return `Last seen ${n} trading day${n === 1 ? '' : 's'} ago`;
    }

    /** Momentum = rank(D-15/60) - rank(D); positive means the sector's rank improved. */
    momentumDirection(sector: IScreenerSectorHistoryEntry): 'up' | 'down' | 'flat' {
        return sector.momentum > 0 ? 'up' : sector.momentum < 0 ? 'down' : 'flat';
    }

    instFlowDirection(sector: IScreenerSectorHistoryEntry): 'up' | 'down' | 'flat' {
        if (sector.instFlow === null) return 'flat';
        return sector.instFlow > 0 ? 'up' : sector.instFlow < 0 ? 'down' : 'flat';
    }

    /** True when this stock's sector just broke into the top ranks this window — mirrors the sector row's badge. */
    isNewSectorStock(stock: IScreenerHistoryStock): boolean {
        return this.newSectorNames().has(stock.sector);
    }

    indicesFor(symbol: string): string | undefined {
        return this.stockIndices().get(symbol);
    }

    openStockDetail(stock: IScreenerHistoryStock): void {
        this.modalService.show(StockDetailModalComponent, {
            initialState: {
                stockId: stock.stockId,
                screenerHorizon: this.activeHorizon(),
                screenerHistoryStock: stock
            } as Partial<StockDetailModalComponent>,
            class: 'modal-lg-90 modal-dialog-scrollable',
            backdrop: 'static',
            keyboard: true
        } as any);
    }
}
