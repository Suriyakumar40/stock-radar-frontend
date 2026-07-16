import { HelperModel } from "@shared/helper";
import { ISignal, SignalModel } from './signal.model';

export interface IPulseFinancialResult {
    id: number;
    periodEnd: string;
    /** Raw ISO (YYYY-MM-DD) periodEnd, before UI formatting — needed to derive fiscal quarter/year reliably. */
    periodEndRaw: string;
    periodType: string;
    sales: number | null;
    netProfit: number | null;
    eps: number | null;
    operatingProfit: number | null;
    /** % change vs. the prior (older) period's net profit — null for the oldest row or when data is missing. */
    netProfitChangePct: number | null;
}

export interface IPulseShareholding {
    id: number;
    periodEnd: string;
    /** When this filing was submitted to the exchange — can lag periodEnd by weeks; null for older backfilled rows. */
    submissionDate: string;
    submissionDateRaw: string | null;
    promoter: number | null;
    fii: number | null;
    dii: number | null;
    public: number | null;
}

export interface IPulseStockDetail {
    stockId: number;
    symbol: string;
    companyName: string;
    industry: string;
    sector: string;
    indices: string;
    isFno: boolean;
    financials: IPulseFinancialResult[];
    shareholding: IPulseShareholding[];
    /** Sector-gated signal history (sector_signals). */
    sectorSignalHistory: ISignal[];
}

export class PulseStockDetailModel {
    static mapDbToStockDetail(data: any): IPulseStockDetail {
        const stock = data?.stock ?? {};

        const financials: IPulseFinancialResult[] = (data?.financials ?? []).map((f: any) => ({
            id: f.id,
            periodEnd: HelperModel.apiToUiDateFormat(f.periodEnd),
            periodEndRaw: f.periodEnd,
            periodType: f.periodType,
            sales: toNumberOrNull(f.sales),
            netProfit: toNumberOrNull(f.netProfit),
            eps: toNumberOrNull(f.eps),
            operatingProfit: toNumberOrNull(f.operatingProfit),
            netProfitChangePct: null
        }));
        // Backend returns most-recent-first; each row's change is vs. the next (older) row.
        for (let i = 0; i < financials.length - 1; i++) {
            const current = financials[i].netProfit;
            const prior = financials[i + 1].netProfit;
            financials[i].netProfitChangePct =
                current !== null && prior !== null && prior !== 0
                    ? ((current - prior) / Math.abs(prior)) * 100
                    : null;
        }

        const shareholding: IPulseShareholding[] = (data?.shareholding ?? []).map((s: any) => ({
            id: s.id,
            periodEnd: HelperModel.apiToUiDateFormat(s.periodEnd),
            submissionDate: s.submissionDate ? HelperModel.apiToUiDateFormat(s.submissionDate) : '',
            submissionDateRaw: s.submissionDate ?? null,
            promoter: toNumberOrNull(s.promotor),
            fii: toNumberOrNull(s.fii),
            dii: toNumberOrNull(s.dii),
            public: toNumberOrNull(s.public)
        }));

        const sectorSignalHistory = SignalModel.mapDbToSignals(data?.sectorSignalHistory ?? []);

        return {
            stockId: stock.id,
            symbol: stock.symbol ?? '',
            companyName: stock.companyName ?? '',
            industry: stock.industry ?? '',
            sector: stock.sector ?? '',
            indices: stock.indices ?? '',
            isFno: stock.isFno ?? false,
            financials,
            shareholding,
            sectorSignalHistory
        };
    }
}

function toNumberOrNull(value: any): number | null {
    return value !== null && value !== undefined ? parseFloat(value) : null;
}
