import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { catchError, map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { IMomentumDecision, MomentumDecisionModel } from '../models/momentum-decision.model';

@Injectable()
export class MomentumService {
    private apiUrl = environment.apiUrl;
    private momentumApiUrl = `${environment.apiUrl}/momentum`;

    constructor(private http: HttpClient) {
    }

    getMomentumDecisionsByDate(date: string): Observable<IMomentumDecision[]> {
        const url = `${this.momentumApiUrl}/get-momentum-decisions-by-date?date=${encodeURIComponent(date)}`;
        return this.http.get(url).pipe(
            map((result: any) => {
                const data = result && result.data ? result.data : [];
                const items = MomentumDecisionModel.mapDbToMomentumDecision(date, data);
                return items;
            }),
            catchError(error => {
                console.error('Error fetching momentum decisions by date:', error);
                return of([]);
            })
        );
    }
}
