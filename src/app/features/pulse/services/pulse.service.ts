import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { IRankedGroup, RankedGroupModel } from '../models/ranked-group.model';
import { IPulseStock, PulseStockModel } from '../models/pulse-stock.model';
import { IPulseStockDetail, PulseStockDetailModel } from '../models/pulse-stock-detail.model';
import { ISignal, SignalModel } from '../models/signal.model';
import { ScreenerHorizon, IScreenerWatchlist, IScreenerHistory, ScreenerModel } from '../models/screener.model';

export interface IDatedResult<T> {
    date: string;
    items: T[];
}

const TOP_N_GROUPS = 10;

@Injectable()
export class PulseService {
    private apiUrl = `${environment.apiUrl}/pulse`;

    /** Shared across pages once a date has been picked. */
    readonly selectedDate = signal<string | null>(null);

    constructor(private http: HttpClient) { }

    getRankedGroups(date?: string, limit: number = TOP_N_GROUPS): Observable<IDatedResult<IRankedGroup>> {
        const url = `${this.apiUrl}/sectors/ranked?date=${encodeURIComponent(date ?? 'latest')}&limit=${limit}`;
        return this.http.get(url).pipe(
            map((res: any) => {
                const resolvedDate = res?.data?.date ?? date ?? '';
                return {
                    date: resolvedDate,
                    items: RankedGroupModel.mapDbToRankedGroups(res?.data?.sectors ?? [], limit)
                };
            }),
            catchError(error => {
                console.error('Error fetching ranked sector groups:', error);
                return of({ date: date ?? '', items: [] });
            })
        );
    }

    getAllGroups(date?: string): Observable<IDatedResult<IRankedGroup>> {
        const url = `${this.apiUrl}/sectors/all?date=${encodeURIComponent(date ?? 'latest')}`;
        return this.http.get(url).pipe(
            map((res: any) => {
                const resolvedDate = res?.data?.date ?? date ?? '';
                return {
                    date: resolvedDate,
                    items: RankedGroupModel.mapDbToRankedGroups(res?.data?.sectors ?? [], TOP_N_GROUPS)
                };
            }),
            catchError(error => {
                console.error('Error fetching all sector groups:', error);
                return of({ date: date ?? '', items: [] });
            })
        );
    }

    getStocks(date?: string, industry?: string): Observable<IDatedResult<IPulseStock>> {
        let url = `${this.apiUrl}/stocks?date=${encodeURIComponent(date ?? 'latest')}`;
        if (industry) {
            url += `&industry=${encodeURIComponent(industry)}`;
        }
        return this.http.get(url).pipe(
            map((res: any) => {
                const resolvedDate = res?.data?.date ?? date ?? '';
                return {
                    date: resolvedDate,
                    items: PulseStockModel.mapDbToPulseStocks(res?.data?.stocks ?? [])
                };
            }),
            catchError(error => {
                console.error('Error fetching stocks:', error);
                return of({ date: date ?? '', items: [] });
            })
        );
    }

    getStockDetail(stockId: number): Observable<IPulseStockDetail | null> {
        return this.http.get(`${this.apiUrl}/stocks/${stockId}/detail`).pipe(
            map((res: any) => PulseStockDetailModel.mapDbToStockDetail(res?.data)),
            catchError(error => {
                console.error('Error fetching stock detail:', error);
                return of(null);
            })
        );
    }

    getTodaysSignals(date?: string): Observable<IDatedResult<ISignal>> {
        const url = `${this.apiUrl}/sector-signals/today?date=${encodeURIComponent(date ?? 'latest')}`;
        return this.http.get(url).pipe(
            map((res: any) => {
                const resolvedDate = res?.data?.date ?? date ?? '';
                return {
                    date: resolvedDate,
                    items: SignalModel.mapDbToSignals(res?.data?.signals ?? [], resolvedDate)
                };
            }),
            catchError(error => {
                console.error("Error fetching today's sector signals:", error);
                return of({ date: date ?? '', items: [] });
            })
        );
    }

    getWatchlist(date?: string): Observable<IDatedResult<ISignal>> {
        const url = `${this.apiUrl}/sector-signals/watch?date=${encodeURIComponent(date ?? 'latest')}`;
        return this.http.get(url).pipe(
            map((res: any) => {
                const resolvedDate = res?.data?.date ?? date ?? '';
                return {
                    date: resolvedDate,
                    items: SignalModel.mapDbToSignals(res?.data?.watchlist ?? [], resolvedDate)
                };
            }),
            catchError(error => {
                console.error('Error fetching sector watchlist:', error);
                return of({ date: date ?? '', items: [] });
            })
        );
    }

    getScreenerWatchlist(horizon: ScreenerHorizon, date?: string): Observable<IScreenerWatchlist | null> {
        const url = `${this.apiUrl}/screener/watchlist?horizon=${horizon}&date=${encodeURIComponent(date ?? 'latest')}`;
        return this.http.get(url).pipe(
            map((res: any) => ScreenerModel.mapDbToWatchlist(res?.data)),
            catchError(error => {
                console.error(`Error fetching ${horizon} screener watchlist:`, error);
                return of(null);
            })
        );
    }

    getScreenerHistory(horizon: ScreenerHorizon, date?: string, windowDays: number = 20): Observable<IScreenerHistory | null> {
        const url = `${this.apiUrl}/screener/history?horizon=${horizon}&date=${encodeURIComponent(date ?? 'latest')}&windowDays=${windowDays}`;
        return this.http.get(url).pipe(
            map((res: any) => ScreenerModel.mapDbToHistory(res?.data)),
            catchError(error => {
                console.error(`Error fetching ${horizon} screener history:`, error);
                return of(null);
            })
        );
    }
}
