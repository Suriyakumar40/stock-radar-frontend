import { Component, OnInit, WritableSignal, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BsDatepickerConfig, BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { BsModalService } from 'ngx-bootstrap/modal';
import { HelperModel } from '@shared/helper';
import { PulseService } from '../../services/pulse.service';
import { ISignal, SignalType } from '../../models/signal.model';
import { SignalBadgeComponent } from '../../components/signal-badge/signal-badge.component';
import { StockDetailModalComponent } from '../../components/stock-detail-modal/stock-detail-modal.component';

const SIGNAL_TYPE_PRIORITY: Record<SignalType, number> = { ENTRY: 0, WATCH: 1, EXIT: 2 };

/**
 * The decision-first landing page (/pulse) — the sector signal feed, no ranking tables or
 * raw indicator numbers. /pulse/sector remains the "why" surface, reached from here, not
 * replaced by it. (Previously merged industry+sector signals — the industry ranking/signal
 * system has since been removed.)
 */
@Component({
    selector: 'app-pulse-today-signals',
    standalone: true,
    templateUrl: './pulse-today-signals.component.html',
    styleUrls: ['./pulse-today-signals.component.scss'],
    imports: [CommonModule, FormsModule, RouterLink, BsDatepickerModule, SignalBadgeComponent],
    providers: [PulseService, BsModalService]
})
export class PulseTodaySignalsComponent implements OnInit {
    signals: WritableSignal<ISignal[]> = signal([]);
    isLoading: WritableSignal<boolean> = signal(true);

    selectedDate: Date = new Date();
    maxDate: Date = new Date();
    bsConfig: Partial<BsDatepickerConfig>;

    /**
     * Guards against a real ngx-bootstrap quirk: bsDatepicker fires (bsValueChange) once
     * on its very first bind, echoing the constructor's initial `selectedDate` (today) —
     * before the real trading date has been resolved. Starts true so that initial
     * auto-emission is caught too, not just later reassignment echoes. Same fix already
     * applied in pulse-stock-list.component.ts; confirmed via network logs there.
     */
    private isSyncingDate = true;

    private pulseService = inject(PulseService);
    private modalService = inject(BsModalService);

    constructor() {
        this.bsConfig = {
            containerClass: 'theme-green',
            dateInputFormat: 'DD-MMM-YYYY',
            showWeekNumbers: false,
        };
    }

    ngOnInit(): void {
        this.loadData();
    }

    private loadData(date?: string): void {
        this.isLoading.set(true);
        this.pulseService.getTodaysSignals(date).subscribe(({ date: resolvedDate, items }) => {
            if (resolvedDate) {
                this.isSyncingDate = true;
                this.selectedDate = new Date(resolvedDate);
                this.maxDate = new Date(resolvedDate);
                setTimeout(() => { this.isSyncingDate = false; }, 300);
            }

            const sorted = [...items].sort((a, b) => SIGNAL_TYPE_PRIORITY[a.signalType] - SIGNAL_TYPE_PRIORITY[b.signalType]);

            this.signals.set(sorted);
            this.isLoading.set(false);
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
}
