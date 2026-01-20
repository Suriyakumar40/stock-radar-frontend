import { HelperModel } from "@shared/helper";
import moment from "moment";
export interface IShareholding {
    symbol: string;
    industry: string;
    index: string;
    latestDate: string;
    previousDate: string;
    promoter: number;
    fii: number;
    dii: number;
    public: number;
    promoterDiff: number;
    fiiDiff: number;
    diiDiff: number;
    publicDiff: number;
    submissionDate?: string;
    isFno?: boolean;
}

export interface IndexStat {
    index: string;
    total: number;
    promoter_up: number;
    fii_up: number;
    dii_up: number;
    both_up: number;
}

export class ShareholdingModel {
    static mapDbToShareholdings(items: Array<any>): Array<IShareholding> {
        if (!items || items.length === 0) {
            throw new Error('Invalid data');
        }
        // 1. Group records by stock symbol/id
        const grouped = items.reduce((acc, item) => {
            const stockKey = item.stock.symbol;
            if (!acc[stockKey]) acc[stockKey] = [];
            acc[stockKey].push(item);
            return acc;
        }, {} as Record<string, any[]>);

        // 2. Map through each group and compare the top two
        return Object.keys(grouped).map(symbol => {
            const history = grouped[symbol];

            const latest = history[0];
            const previous = history[1];

            const stock = latest.stock ?? null;

            if (!previous) return null;

            return {
                symbol,
                industry: stock && stock.industry ? stock.industry : '',
                index:  stock && stock.indices ? stock.indices : '',
                isFno: stock?.isFno ?? false,
                latestDate: HelperModel.apiToUiDateFormat(latest.periodEnd),
                previousDate: HelperModel.apiToUiDateFormat(previous.periodEnd),
                submissionDate: HelperModel.apiToUiDateFormat(latest.submissionDate),
                promoter: parseFloat(latest.promotor ?? '0'),
                fii: parseFloat(latest.fii ?? '0'),
                dii: parseFloat(latest.dii ?? '0'),
                public: parseFloat(latest.public ?? '0'),
                promoterDiff: parseFloat(latest.promotor ?? '0') - parseFloat(previous.promotor ?? '0'),
                fiiDiff: parseFloat(latest.fii ?? '0') - parseFloat(previous.fii ?? '0'),
                diiDiff: parseFloat(latest.dii ?? '0') - parseFloat(previous.dii ?? '0'),
                publicDiff: parseFloat(latest.public ?? '0') - parseFloat(previous.public ?? '0'),
            };
        }).filter((item) => item != null);
    }
}
