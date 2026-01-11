import { Injectable, signal } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { catchError, map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { QuarterResult, QuarterResultModel } from "../model/quarter-result.model";

// --- 2. SERVICE ---
@Injectable()
export class FundamentalService {

    private apiUrl = environment.apiUrl;
    private fundamentalServiceUrl = `${environment.apiUrl}/fundamentals`;

    // Using Signals for reactive state management
    private quarterResults = signal<QuarterResult[]>([]);

    constructor(private http: HttpClient) {
    }

    getQuarterResults() {
        return this.quarterResults.asReadonly();
    }

    fetchQuarterResults(periodEnd: string): Observable<QuarterResult[]> {
        if (!periodEnd) {
            throw new Error('periodEnd is required');
        }
        const url = `${this.fundamentalServiceUrl}/get-all-rating-scores?periodEnd=${encodeURIComponent(periodEnd)}`;
        return this.http.get(url).pipe(
            map((result: any) => {
                const data = result && result.data ? result.data : [];
                const mappedData = QuarterResultModel.mapDbToQuarterResults(data);
                this.quarterResults.set(mappedData);
                return mappedData;
            }),
            catchError(error => {
                console.error('Error fetching quarter results:', error);
                return of([]);
            })
        );
    }
}