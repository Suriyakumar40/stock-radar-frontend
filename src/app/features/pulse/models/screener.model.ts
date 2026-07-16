export type ScreenerHorizon = 'SWING' | 'POSITIONAL' | 'CROSS';

export interface IScreenerSector {
    sector: string;
    rank: number;
    score: number;
    momentum: number;
    volExpansion: number;
    instFlow: number | null;
}

export interface IScreenerStockBreakdown {
    deliveryRatio: number;
    volRatio: number;
    adxDelta: number;
    instFlowScore: number | null;
    earningsScore: number | null;
}

export interface IScreenerStock {
    stockId: number;
    symbol: string;
    companyName: string;
    sector: string;
    close: number;
    rank: number;
    score: number;
    breakdown: IScreenerStockBreakdown;
}

export interface IScreenerWatchlist {
    horizon: ScreenerHorizon;
    tradeDate: string;
    sectors: IScreenerSector[];
    stocks: IScreenerStock[];
}

export interface IScreenerAppearance {
    date: string;
    priceThen: number;
    priceNow: number;
    changePct: number;
}

export interface IScreenerHistoryStock {
    stockId: number;
    symbol: string;
    companyName: string;
    sector: string;
    qualifyingToday: boolean;
    appearedCount: number;
    lastSeenDate: string;
    tradingDaysSinceLastSeen: number;
    firstSeenDate: string;
    tradingDaysSinceFirstSeen: number;
    latestScore: number;
    appearances: IScreenerAppearance[];
}

export interface IScreenerHistory {
    horizon: ScreenerHorizon;
    date: string;
    windowTradingDays: number;
    stocks: IScreenerHistoryStock[];
}

export interface IScreenerSectorHistoryEntry {
    sector: string;
    qualifyingToday: boolean;
    appearedCount: number;
    lastSeenDate: string;
    tradingDaysSinceLastSeen: number;
    firstSeenDate: string;
    tradingDaysSinceFirstSeen: number;
    /** Only appearance in the window is the resolved (latest) date — it just broke into the top ranks. */
    isNew: boolean;
    rank: number;
    score: number;
    momentum: number;
    volExpansion: number;
    instFlow: number | null;
}

export interface IScreenerSectorHistory {
    horizon: ScreenerHorizon;
    date: string;
    windowTradingDays: number;
    sectors: IScreenerSectorHistoryEntry[];
}

export class ScreenerModel {
    static mapDbToWatchlist(data: any): IScreenerWatchlist | null {
        if (!data) return null;
        return {
            horizon: data.horizon,
            tradeDate: data.tradeDate,
            sectors: (data.sectors ?? []).map((s: any) => ({
                sector: s.sector,
                rank: s.rank,
                score: toNumberOrNull(s.score) ?? 0,
                momentum: toNumberOrNull(s.momentum) ?? 0,
                volExpansion: toNumberOrNull(s.volExpansion) ?? 0,
                instFlow: toNumberOrNull(s.instFlow)
            })),
            stocks: (data.stocks ?? []).map((s: any) => ({
                stockId: s.stockId,
                symbol: s.symbol,
                companyName: s.companyName,
                sector: s.sector,
                close: toNumberOrNull(s.close) ?? 0,
                rank: s.rank,
                score: toNumberOrNull(s.score) ?? 0,
                breakdown: {
                    deliveryRatio: toNumberOrNull(s.breakdown?.deliveryRatio) ?? 0,
                    volRatio: toNumberOrNull(s.breakdown?.volRatio) ?? 0,
                    adxDelta: toNumberOrNull(s.breakdown?.adxDelta) ?? 0,
                    instFlowScore: toNumberOrNull(s.breakdown?.instFlowScore),
                    earningsScore: toNumberOrNull(s.breakdown?.earningsScore)
                }
            }))
        };
    }

    static mapDbToHistory(data: any): IScreenerHistory | null {
        if (!data) return null;
        return {
            horizon: data.horizon,
            date: data.date,
            windowTradingDays: data.windowTradingDays,
            stocks: (data.stocks ?? []).map((s: any) => ({
                stockId: s.stockId,
                symbol: s.symbol,
                companyName: s.companyName,
                sector: s.sector,
                qualifyingToday: !!s.qualifyingToday,
                appearedCount: s.appearedCount,
                lastSeenDate: s.lastSeenDate,
                tradingDaysSinceLastSeen: s.tradingDaysSinceLastSeen,
                firstSeenDate: s.firstSeenDate,
                tradingDaysSinceFirstSeen: s.tradingDaysSinceFirstSeen,
                latestScore: toNumberOrNull(s.latestScore) ?? 0,
                appearances: (s.appearances ?? []).map((a: any) => ({
                    date: a.date,
                    priceThen: toNumberOrNull(a.priceThen) ?? 0,
                    priceNow: toNumberOrNull(a.priceNow) ?? 0,
                    changePct: toNumberOrNull(a.changePct) ?? 0
                }))
            }))
        };
    }

    static mapDbToSectorHistory(data: any): IScreenerSectorHistory | null {
        if (!data) return null;
        return {
            horizon: data.horizon,
            date: data.date,
            windowTradingDays: data.windowTradingDays,
            sectors: (data.sectors ?? []).map((s: any) => ({
                sector: s.sector,
                qualifyingToday: !!s.qualifyingToday,
                appearedCount: s.appearedCount,
                lastSeenDate: s.lastSeenDate,
                tradingDaysSinceLastSeen: s.tradingDaysSinceLastSeen,
                firstSeenDate: s.firstSeenDate,
                tradingDaysSinceFirstSeen: s.tradingDaysSinceFirstSeen,
                isNew: !!s.isNew,
                rank: s.rank,
                score: toNumberOrNull(s.score) ?? 0,
                momentum: toNumberOrNull(s.momentum) ?? 0,
                volExpansion: toNumberOrNull(s.volExpansion) ?? 0,
                instFlow: toNumberOrNull(s.instFlow)
            }))
        };
    }
}

function toNumberOrNull(value: any): number | null {
    return value !== null && value !== undefined ? parseFloat(value) : null;
}
