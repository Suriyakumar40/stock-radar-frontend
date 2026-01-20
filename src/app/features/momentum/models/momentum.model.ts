
export interface MomentumScore {
    symbol: string;
    index: string;
    industry: string;
    current_price: number;

    // Score components (out of 9)
    score_52w_high: number;          // 0-2
    score_volume_delivery: number;   // 0-2
    score_price_today: number;       // 0-1
    score_sales_growth: number;      // 0-2
    score_profit_growth: number;     // 0-2

    total_score: number;              // 0-9
    rating: 'STRONG BUY' | 'BUY' | 'ACCUMULATE' | 'HOLD' | 'AVOID';

    // Underlying metrics
    dist_from_52w_high: number;
    volume_trend_60d: number;
    delivery_avg_10d: number;
    price_change_today: number;
    sales_growth_yoy: number;
    profit_growth_yoy: number;

    // Flags
    is_quality_buying: boolean;
    is_speculation: boolean;

    // UI helpers
    rank?: number;
}

export interface IndexGrowthCriteria {
    sales_excellent: number;
    sales_good: number;
    profit_excellent: number;
    profit_good: number;
}

export interface StatsCard {
    label: string;
    value: number;
    description: string;
    type: 'explosive' | 'good' | 'exceptional' | 'danger';
    icon: string;
}

export interface IndustryStats {
    name: string;
    count: number;
    avg_score: number;
    top_stock: string;
}