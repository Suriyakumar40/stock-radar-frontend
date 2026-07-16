import { SignalType } from './signal.model';

export interface IPulseStockLatestSignal {
    signalType: SignalType;
    tradeDate: string;
    isNew: boolean;
}

export interface IPulseStock {
    stockId: number;
    symbol: string;
    companyName: string;
    industry: string;
    sector: string;
    close: number | null;
    adx14: number | null;
    rsi14: number | null;
    above50Dma: boolean | null;
    above200Dma: boolean | null;
    /** Sector-gated latest signal (from sector_signals). */
    latestSectorSignal: IPulseStockLatestSignal | null;
    // Enriched client-side from CommonService.getStocksList() — not in the backend response (see pulse-fe-spec.md §2).
    indices?: string;
    isFno?: boolean;
}

export class PulseStockModel {
    static mapDbToPulseStocks(items: Array<any>): Array<IPulseStock> {
        if (!items || items.length === 0) return [];
        return items.map(item => ({
            stockId: item.stockId,
            symbol: item.symbol,
            companyName: item.companyName,
            industry: item.industry,
            sector: item.sector,
            close: toNumberOrNull(item.close),
            adx14: toNumberOrNull(item.adx14),
            rsi14: toNumberOrNull(item.rsi14),
            above50Dma: item.above50Dma ?? null,
            above200Dma: item.above200Dma ?? null,
            latestSectorSignal: mapLatestSignal(item.latestSectorSignal)
        }));
    }
}

function mapLatestSignal(raw: any): IPulseStockLatestSignal | null {
    return raw
        ? { signalType: raw.signalType, tradeDate: raw.tradeDate, isNew: raw.isNew }
        : null;
}

function toNumberOrNull(value: any): number | null {
    return value !== null && value !== undefined ? parseFloat(value) : null;
}
