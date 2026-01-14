import moment from "moment";
export interface IShareholding {
    symbol: string;
    industry: string;
    index: string;
    latest_date: string;
    previous_date: string;
    promoter: number;
    fii: number;
    dii: number;
    public: number;
    promoter_change: number;
    fii_change: number;
    dii_change: number;
    public_change: number;
}

export interface IndexStat {
    index: string;
    total: number;
    promoter_up: number;
    fii_up: number;
    dii_up: number;
    both_up: number;
}

export interface IDashboardSummary {
  total_stocks: number;
  promoter_up: number;
  promoter_down: number;
  fii_up: number;
  fii_down: number;
  dii_up: number;
  dii_down: number;
  both_up: number;
}

export class ShareholdingModel {
    static mapDbToShareholdings(items: Array<any>): Array<IShareholding> {
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
                boardMeetingDate: item.boardMeetingDate ? moment(item.boardMeetingDate, 'YYYY-MM-DD').format('DD-MMM-YYYY') : 'N/A'
            };
        });
    }
}

