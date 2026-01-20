import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { catchError, map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { IndexGrowthCriteria, MomentumScore } from '../models/momentum.model';

@Injectable({
    providedIn: 'root'
})
export class MomentumService {
    private apiUrl = environment.apiUrl;

    private readonly GROWTH_CRITERIA: Record<string, IndexGrowthCriteria> = {
        'NIFTY 50': {
            sales_excellent: 15,
            sales_good: 10,
            profit_excellent: 20,
            profit_good: 15,
        },
        'NIFTY NEXT 50': {
            sales_excellent: 18,
            sales_good: 12,
            profit_excellent: 25,
            profit_good: 18,
        },
        'NIFTY MIDCAP 150': {
            sales_excellent: 25,
            sales_good: 18,
            profit_excellent: 35,
            profit_good: 25,
        },
    };


    constructor(private http: HttpClient) {
    }

    /**
  * Calculate 52-week high score (0-2 points)
  */
    private calculate52WeekHighScore(
        currentPrice: number,
        priceData: StockPriceData[]
    ): { score: number; distance: number } {
        const high52w = Math.max(...priceData.map(d => d.high));
        const distance = ((currentPrice - high52w) / high52w) * 100;

        let score = 0;
        if (distance >= -5) {
            score = 2.0;
        } else if (distance >= -10) {
            score = 1.0;
        }

        return { score, distance };
    }

    /**
     * Calculate volume trend using 60-day linear regression
     */
    private calculateVolumeTrend(priceData: StockPriceData[]): number {
        const last60 = priceData.slice(-60);
        if (last60.length < 30) return 0;

        const n = last60.length;
        const x = Array.from({ length: n }, (_, i) => i);
        const y = last60.map(d => d.volume);

        const xMean = x.reduce((a, b) => a + b, 0) / n;
        const yMean = y.reduce((a, b) => a + b, 0) / n;

        let numerator = 0;
        let denominator = 0;

        for (let i = 0; i < n; i++) {
            numerator += (x[i] - xMean) * (y[i] - yMean);
            denominator += Math.pow(x[i] - xMean, 2);
        }

        const slope = denominator !== 0 ? numerator / denominator : 0;
        const trendPct = (slope * n / yMean) * 100;

        return trendPct;
    }

    /**
     * Calculate 10-day average delivery %
     */
    private calculateDeliveryAvg(priceData: StockPriceData[]): number {
        const last10 = priceData.slice(-10);
        if (last10.length === 0) return 0;

        const avg = last10.reduce((sum, d) => sum + d.delivery_pct, 0) / last10.length;
        return avg;
    }

    /**
     * Calculate today's price change %
     */
    private calculatePriceChangeToday(priceData: StockPriceData[]): number {
        if (priceData.length < 2) return 0;

        const today = priceData[priceData.length - 1];
        const yesterday = priceData[priceData.length - 2];

        const change = ((today.close - yesterday.close) / yesterday.close) * 100;
        return change;
    }

    /**
     * Volume + Delivery Combo Score (0-2 points)
     * HIGH DELIVERY + FALLING PRICE = STRONG BUY!
     */
    private calculateVolumeDeliveryScore(
        volumeTrend: number,
        deliveryAvg: number,
        priceChangeToday: number
    ): { score: number; isQuality: boolean; isSpeculation: boolean } {

        let score = 0;
        let isQuality = false;
        let isSpeculation = false;

        // RED FLAG: Speculation trap
        if (deliveryAvg < 20 && priceChangeToday > 5) {
            isSpeculation = true;
            return { score: 0, isQuality: false, isSpeculation: true };
        }

        // BEST SIGNAL: High delivery + Falling price
        if (deliveryAvg >= 45 && priceChangeToday >= -5 && priceChangeToday <= -2) {
            score = 2.0;
            isQuality = true;
        }
        else if (volumeTrend > 30 && deliveryAvg >= 45) {
            score = 2.0;
            isQuality = true;
        }
        else if (volumeTrend > 20 && deliveryAvg >= 40) {
            score = 1.5;
            isQuality = true;
        }
        else if (volumeTrend > 10 && deliveryAvg >= 35) {
            score = 1.0;
        }
        else if (volumeTrend > 0 && deliveryAvg >= 30) {
            score = 0.5;
        }

        return { score, isQuality, isSpeculation };
    }

    /**
     * Price Change Today Score (0-1 point)
     */
    private calculatePriceChangeScore(
        priceChange: number,
        deliveryAvg: number
    ): number {

        if (priceChange >= -5 && priceChange <= -2 && deliveryAvg >= 45) {
            return 1.0;
        }

        if (priceChange >= -2 && priceChange < 0 && deliveryAvg >= 45) {
            return 0.75;
        }

        if (priceChange > 0 && priceChange <= 3 && deliveryAvg >= 40) {
            return 0.5;
        }

        if (priceChange > 5 && deliveryAvg < 30) {
            return 0;
        }

        return 0.25;
    }

    /**
     * Sales Growth Score (0-2 points) - Index-adjusted
     */
    private calculateSalesGrowthScore(
        salesGrowth: number,
        index: string
    ): number {
        const criteria = this.GROWTH_CRITERIA[index] || this.GROWTH_CRITERIA['NIFTY MIDCAP 150'];

        if (salesGrowth >= criteria.sales_excellent) {
            return 2.0;
        } else if (salesGrowth >= criteria.sales_good) {
            return 1.5;
        } else if (salesGrowth >= 5) {
            return 0.5;
        }

        return 0;
    }

    /**
     * Profit Growth Score (0-2 points) - Index-adjusted
     */
    private calculateProfitGrowthScore(
        profitGrowth: number,
        index: string
    ): number {
        const criteria = this.GROWTH_CRITERIA[index] || this.GROWTH_CRITERIA['NIFTY MIDCAP 150'];

        if (profitGrowth >= criteria.profit_excellent) {
            return 2.0;
        } else if (profitGrowth >= criteria.profit_good) {
            return 1.5;
        } else if (profitGrowth >= 5) {
            return 0.5;
        }

        return 0;
    }

    /**
     * Calculate YoY growth
     */
    private calculateYoYGrowth(
        latestValue: number,
        previousValue: number
    ): number {
        if (previousValue === 0) return 0;
        return ((latestValue - previousValue) / previousValue) * 100;
    }

    /**
     * Get rating based on score
     */
    private getRating(score: number): MomentumScore['rating'] {
        if (score >= 7.5) return 'STRONG BUY';
        if (score >= 6.0) return 'BUY';
        if (score >= 4.5) return 'ACCUMULATE';
        if (score >= 3.0) return 'HOLD';
        return 'AVOID';
    }

    /**
     * Main calculation function
     */
    calculateMomentumScore(
        symbol: string,
        index: string,
        industry: string,
        priceData: StockPriceData[],
        financialData: FinancialData[]
    ): MomentumScore {

        const sortedPriceData = [...priceData].sort((a, b) =>
            new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime()
        );
        const sortedFinancialData = [...financialData].sort((a, b) =>
            new Date(a.period_end).getTime() - new Date(b.period_end).getTime()
        );

        const currentPrice = sortedPriceData[sortedPriceData.length - 1].close;

        const { score: score52w, distance: dist52w } =
            this.calculate52WeekHighScore(currentPrice, sortedPriceData);

        const volumeTrend = this.calculateVolumeTrend(sortedPriceData);
        const deliveryAvg = this.calculateDeliveryAvg(sortedPriceData);
        const priceChangeToday = this.calculatePriceChangeToday(sortedPriceData);

        const { score: scoreVolDlv, isQuality, isSpeculation } =
            this.calculateVolumeDeliveryScore(volumeTrend, deliveryAvg, priceChangeToday);

        const scorePriceToday = this.calculatePriceChangeScore(priceChangeToday, deliveryAvg);

        let salesGrowth = 0;
        let profitGrowth = 0;

        if (sortedFinancialData.length >= 2) {
            const latest = sortedFinancialData[sortedFinancialData.length - 1];
            const previous = sortedFinancialData[sortedFinancialData.length - 2];

            salesGrowth = this.calculateYoYGrowth(latest.sales, previous.sales);
            profitGrowth = this.calculateYoYGrowth(latest.net_profit, previous.net_profit);
        }

        const scoreSales = this.calculateSalesGrowthScore(salesGrowth, index);
        const scoreProfit = this.calculateProfitGrowthScore(profitGrowth, index);

        const totalScore = score52w + scoreVolDlv + scorePriceToday + scoreSales + scoreProfit;
        const rating = this.getRating(totalScore);

        return {
            symbol,
            index,
            industry,
            current_price: currentPrice,

            score_52w_high: score52w,
            score_volume_delivery: scoreVolDlv,
            score_price_today: scorePriceToday,
            score_sales_growth: scoreSales,
            score_profit_growth: scoreProfit,

            total_score: Math.round(totalScore * 10) / 10,
            rating,

            dist_from_52w_high: Math.round(dist52w * 10) / 10,
            volume_trend_60d: Math.round(volumeTrend * 10) / 10,
            delivery_avg_10d: Math.round(deliveryAvg * 10) / 10,
            price_change_today: Math.round(priceChangeToday * 10) / 10,
            sales_growth_yoy: Math.round(salesGrowth * 10) / 10,
            profit_growth_yoy: Math.round(profitGrowth * 10) / 10,

            is_quality_buying: isQuality,
            is_speculation: isSpeculation,
        };
    }

    /**
     * Batch calculate for multiple stocks
     */
    calculateBatch(
        stocks: Array<{
            symbol: string;
            index: string;
            industry: string;
            priceData: StockPriceData[];
            financialData: FinancialData[];
        }>
    ): MomentumScore[] {

        const results = stocks.map(stock =>
            this.calculateMomentumScore(
                stock.symbol,
                stock.index,
                stock.industry,
                stock.priceData,
                stock.financialData
            )
        ).sort((a, b) => b.total_score - a.total_score);

        // Add rank
        results.forEach((stock, index) => {
            stock.rank = index + 1;
        });

        return results;
    }

}
