import moment  from "moment";
import { HelperModel } from "@shared/helper";
export interface IQuarterResult {
    symbol: string;
    industry: string;
    indices: string;
    salesGrowth: number;
    profitGrowth: number;
    opm: number;
    ratingScore: number;
    rating: string;
    isFno: boolean;
    fii: string;
    dii: string;
    promotor: string;
    boardMeetingDate: string;
}

export class QuarterResultModel {
    static mapDbToQuarterResults(items: Array<any>): Array<IQuarterResult> {
        if (!items || items.length === 0) {
            throw new Error('Invalid data');
        }
        return items.map(item => {
            return {
                ...item,
                salesGrowth: parseFloat(item.yoySalesGrowth),
                profitGrowth: parseFloat(item.yoyProfitGrowth),
                fii: parseFloat(item.fii),
                dii: parseFloat(item.dii),
                promotor: parseFloat(item.promotor),
                boardMeetingDate: HelperModel.apiToUiDateFormat(item.boardMeetingDate)
            };
        });
    }
}

