export interface ListOfStocks {
    id: number;
    industry: string;
    sector?: string | null;
    companyName: string;
    isIn: string;
    isFno: boolean; // DB: 1/0, model: true/false
    isActive: boolean; // DB: 1/0, model: true/false
    symbol: string;
    indices: string;
    previousIndices?: string | null;
    indicesChangedOn?: string | null; // ISO string or null
    listedDate?: string | null; // ISO string or null
    createdAt: string; // ISO string
    updatedAt: string; // ISO string
}

export class ListOfStocksModel {
    static mapDbToListOfStocks(items: Array<any>): Array<ListOfStocks> {
        if (!items || items.length === 0) {
            throw new Error('Invalid data');
        }
        return items.map(item => item);
    }
}