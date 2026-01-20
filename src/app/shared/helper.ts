import moment from "moment";

export class HelperModel {
    static getPreviousYear(date: string | Date): string {
        return moment(new Date(date)).subtract(1, 'year').format("YYYY");
    }

    static getStartOfMonth(date: string | Date): string {
        return moment(new Date(date)).startOf('month').format('YYYY-MM-DD');
    }

    static getPreviousQuarter(date: string | Date): string {
        return moment(new Date(date))
            .subtract(1, 'quarter')
            .endOf('quarter')
            .format('YYYY-MM-DD');
    }

    static getLastSixMonths(date: string | Date): { start: string; end: string } {
        const m = moment(new Date(date));
        const end = m.format('YYYY-MM-DD');
        const start = m.clone().subtract(6, 'months').startOf('day').format('YYYY-MM-DD');
        return { start, end };
    }

    static getQuarterDateRange(date: string | Date): { start: string; end: string } {
        const m = moment(new Date(date));
        const start = m.clone().startOf('quarter').format('YYYY-MM-DD');
        const end = m.clone().endOf('quarter').format('YYYY-MM-DD');
        return { start, end };
    }

    static apiToUiDateFormat(date: string | Date, format: string = 'DD-MMM-YYYY'): string {
        if (!date) {
            return '';
        }
        return moment(date, 'YYYY-MM-DD').format(format);
    }

    static uiToApiDateFormat(date: string | Date): string {
        if (!date) {
            return '';
        }
        return moment(date).format('YYYY-MM-DD');
    }
}