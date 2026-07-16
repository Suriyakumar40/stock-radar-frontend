export interface IRankedGroup {
    id: number;
    name: string; // sector name
    tradeDate: string;
    return1m: number | null;
    return3m: number | null;
    return6m: number | null;
    rsScore: number | null;
    rsRating: number | null;
    rsRank: number | null;
    prevRsRank: number | null;
    stocksAbove50DmaPct: number | null;
    stocksAbove200DmaPct: number | null;
    stockCount: number | null;
    /** rank crossed into the top-N today — false if prevRsRank is null (no prior-day data yet). */
    isNew: boolean;
}

export class RankedGroupModel {
    static mapDbToRankedGroups(items: Array<any>, topN: number = 10): Array<IRankedGroup> {
        if (!items || items.length === 0) return [];
        return items.map(item => {
            const rsRank: number | null = item.rsRank ?? null;
            const prevRsRank: number | null = item.prevRsRank ?? null;
            return {
                id: item.id,
                name: item.sector,
                tradeDate: item.tradeDate,
                return1m: toNumberOrNull(item.return1m),
                return3m: toNumberOrNull(item.return3m),
                return6m: toNumberOrNull(item.return6m),
                rsScore: toNumberOrNull(item.rsScore),
                rsRating: toNumberOrNull(item.rsRating),
                rsRank,
                prevRsRank,
                stocksAbove50DmaPct: toNumberOrNull(item.stocksAbove50DmaPct),
                stocksAbove200DmaPct: toNumberOrNull(item.stocksAbove200DmaPct),
                stockCount: item.stockCount ?? null,
                isNew: prevRsRank !== null && prevRsRank > topN && rsRank !== null && rsRank <= topN
            };
        });
    }

    static rankDeltaIcon(item: IRankedGroup): 'up' | 'down' | 'flat' {
        if (item.prevRsRank === null || item.rsRank === null) return 'flat';
        if (item.rsRank < item.prevRsRank) return 'up';
        if (item.rsRank > item.prevRsRank) return 'down';
        return 'flat';
    }

    static rankDeltaValue(item: IRankedGroup): number {
        if (item.prevRsRank === null || item.rsRank === null) return 0;
        return Math.abs(item.prevRsRank - item.rsRank);
    }
}

function toNumberOrNull(value: any): number | null {
    return value !== null && value !== undefined ? parseFloat(value) : null;
}
