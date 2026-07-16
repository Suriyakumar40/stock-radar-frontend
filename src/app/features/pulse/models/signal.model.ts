export type SignalType = 'WATCH' | 'ENTRY' | 'EXIT';
export type SignalDirection = 'LONG' | 'SHORT';

export interface ISignal {
    id: number;
    tradeDate: string;
    signalType: SignalType;
    direction: SignalDirection;
    reason: string;
    priceAtSignal: number;
    stopLoss: number | null;
    targetPrice: number | null;
    rMultipleTarget: number | null;
    isActive: boolean;
    stockId: number | null;
    symbol: string;
    companyName: string;
    industry: string;
    sector: string;
    isNew: boolean;
}

export class SignalModel {
    static mapDbToSignals(items: Array<any>, asOfDate?: string): Array<ISignal> {
        if (!items || items.length === 0) return [];
        return items.map(item => ({
            id: item.id,
            tradeDate: item.tradeDate,
            signalType: item.signalType,
            direction: item.direction,
            reason: item.reason,
            priceAtSignal: parseFloat(item.priceAtSignal),
            stopLoss: item.stopLoss !== null && item.stopLoss !== undefined ? parseFloat(item.stopLoss) : null,
            targetPrice: item.targetPrice !== null && item.targetPrice !== undefined ? parseFloat(item.targetPrice) : null,
            rMultipleTarget: item.rMultipleTarget !== null && item.rMultipleTarget !== undefined ? parseFloat(item.rMultipleTarget) : null,
            isActive: item.isActive,
            stockId: item.stock?.id ?? null,
            symbol: item.stock?.symbol ?? '',
            companyName: item.stock?.companyName ?? '',
            industry: item.stock?.industry ?? '',
            sector: item.stock?.sector ?? '',
            isNew: isWithinLastNDays(item.tradeDate, asOfDate ?? item.tradeDate, 2)
        }));
    }
}

function isWithinLastNDays(date: string, asOfDate: string, n: number): boolean {
    const diffMs = new Date(asOfDate).getTime() - new Date(date).getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= n;
}
