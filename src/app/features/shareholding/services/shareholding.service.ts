import { Injectable, signal } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { catchError, map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { IndexStat, IShareholding, ShareholdingModel } from "../model/shareholding.model";

// --- 2. SERVICE ---
@Injectable()
export class ShareholdingService {

    private fundamentalServiceUrl = `${environment.apiUrl}/fundamentals`;

    // Using Signals for reactive state management
    private shareholdings = signal<IShareholding[]>([]);
    private stocks = signal<IShareholding[]>([]);
    private indexStats = signal<IndexStat[]>([]);

    constructor(private http: HttpClient) {
        this.loadData();
    }

    getShareholdings() { return this.shareholdings.asReadonly(); }
    getStocks() { return this.stocks.asReadonly(); }
    getIndexStats() { return this.indexStats.asReadonly(); }

    fetchShareholdingByRange(start: string, end: string): Observable<IShareholding[]> {
        if (this.shareholdings() && this.shareholdings()!.length > 0) {
            return of(this.shareholdings()!);
        }
        // if (!http) {
        //     throw new Error('HttpClient must be provided for first fetch');
        // }
        const url = `${this.fundamentalServiceUrl}/get-shareholding-by-range?start=${start}&end=${end}`;
        return this.http.get<{ message: string; data: IShareholding[] }>(url).pipe(
            map(res => {
                const result = ShareholdingModel.mapDbToShareholdings(res.data);
                this.shareholdings.set(result);
                return result;
            }),
            catchError(err => of([]))
        );
    }


    private loadData() {
        // Data from the uploaded HTML file
        const rawData = {
            "index_stats": [
                { "index": "NIFTY 50", "total": 50, "promoter_up": 17, "fii_up": 22, "dii_up": 37, "both_up": 9 },
                { "index": "NIFTY MICROCAP 250", "total": 249, "promoter_up": 61, "fii_up": 108, "dii_up": 131, "both_up": 41 },
                { "index": "NIFTY MIDCAP 150", "total": 150, "promoter_up": 33, "fii_up": 63, "dii_up": 95, "both_up": 20 },
                { "index": "NIFTY NEXT 50", "total": 50, "promoter_up": 14, "fii_up": 23, "dii_up": 33, "both_up": 9 },
                { "index": "NIFTY SMALLCAP 250", "total": 250, "promoter_up": 74, "fii_up": 102, "dii_up": 158, "both_up": 50 }
            ],
        };
        this.indexStats.set(rawData.index_stats);
    }
}