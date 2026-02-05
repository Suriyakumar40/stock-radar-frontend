export interface IMomentumDecision {
    symbol: string;
    industry: string;
    indices: string;
    isFno: boolean;
    current_price: number;
    target_price: number;
    stop_loss: number;
    confidence: number;
    total_score: number;
    technical_score: number;
    quality_score: number;
    fundamental_score: number;
    dist_from_52w: number;
    volume_trend_60d: number;
    delivery_avg_10d: number;
    delivery_spike: boolean;
    delivery_vs_price_pattern: 'ACCUMULATION' | 'NORMAL' | string;
    profit_growth: number;
    profit_vs_peers: number;
    rating: 'STRONG BUY' | 'BUY' | 'ACCUMULATE' | 'AVOID' | 'HOLD' | string;
    expected_days: number;
    past_ratings?: Array<string>;
}

export class MomentumDecisionModel {
    static mapDbToMomentumDecision(date: string, items: Array<any>): Array<IMomentumDecision> {
        if (!items || items.length === 0) {
            throw new Error('Invalid data');
        }
        const grouped = items.reduce((acc, item) => {
            const symbol = item.stock?.symbol ?? '';
            if (!acc[symbol]) acc[symbol] = [];
            acc[symbol].push(item);
            return acc;
        }, {} as Record<string, any[]>);

        const latestItems = Object.values(grouped).map((group: any) => {
            const findIndex = group.findIndex((i:any) => i.trade_date === date);
            if (findIndex === -1) {
                // If not found, return the most recent entry
                const sorted = group.sort((a:any, b:any) => new Date(b.trade_date).getTime() - new Date(a.trade_date).getTime());
                const latest = sorted[0];
                latest.past_ratings = sorted.slice(1, 5).map((i:any) => i.rating);
                return latest;
            } else {
                const latest = group[findIndex];
                // Map ratings except the one at findIndex
                const ratings = group
                    .filter((_: any, idx: number) => idx !== findIndex)
                    .map((i: any) => i.rating);
                latest.past_ratings = ratings;
                return latest;
            }
        });

        return latestItems.map(item => {
            return {
                symbol: item.stock?.symbol ?? '',
                industry: item.stock?.industry ?? '',
                indices: item.stock?.indices ?? '',
                isFno: item.stock?.isFno ?? false,
                current_price: parseFloat(item.current_price),
                target_price: parseFloat(item.target_price),
                stop_loss: parseFloat(item.stop_loss),
                confidence: item.confidence,
                total_score: parseFloat(item.total_score),
                technical_score: parseFloat(item.technical_score),
                quality_score: parseFloat(item.quality_score),
                fundamental_score: parseFloat(item.fundamental_score),
                dist_from_52w: parseFloat(item.dist_from_52w),
                volume_trend_60d: parseFloat(item.volume_trend_60d),
                delivery_avg_10d: parseFloat(item.delivery_avg_10d),
                delivery_spike: item.delivery_spike,
                delivery_vs_price_pattern: item.delivery_vs_price_pattern,
                profit_growth: parseFloat(item.profit_growth),
                profit_vs_peers: parseFloat(item.profit_vs_peers),
                rating: item.rating,
                expected_days: item.expected_days,
                past_ratings: item.past_ratings || []
            };
        });
    }
}
