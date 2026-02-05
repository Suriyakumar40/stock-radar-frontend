import { Injectable, signal } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { catchError, map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

// --- 2. SERVICE ---
@Injectable(
    {
        providedIn: 'root'
    }
)
export class StockPriceService {

    private apiUrl = environment.apiUrl;
    private stockPriceServiceUrl = `${environment.apiUrl}/stock-prices`;
    private stockPriceSummariesUrl = `${environment.apiUrl}/stock-price-summaries`;

    // Using Signals for reactive state management
    constructor(private http: HttpClient) {
    }

    getStockPricesByDateRange(startDate: string, endDate: string): Observable<any> {
        const url = `${this.stockPriceServiceUrl}/stock-price-by-date-range?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
        return this.http.get(url).pipe(
            map((result: any) => {
                const data = result && result.data ? result.data : [];
                return data;
            }),
            catchError(error => {
                console.error('Error fetching stock prices by date range:', error);
                return of([]);
            })
        );
    }

    getAllStockPriceSummaries(): Observable<any> {
        const url = `${this.stockPriceSummariesUrl}/get-all-stock-price-summary`;
        return this.http.get(url).pipe(
            map((result: any) => {
                const data = result && result.data ? result.data : [];
                return data;
            }),
            catchError(error => {
                console.error('Error fetching all stock price summaries:', error);
                return of([]);
            })
        );
    } 
}