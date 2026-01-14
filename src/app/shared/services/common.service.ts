import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { catchError, map } from 'rxjs/operators';
import { IListOfStocks, ListOfStocksModel } from '../../features/quarter-results/model/list-of-stocks.model';

@Injectable({
    providedIn: 'root' // This makes it available application-wide as a singleton
})
export class CommonService {

    private _sidebarOpen = signal<boolean>(false);
    private _isMobile = signal<boolean>(false);
    private _loading = signal<boolean>(false);
    private _globalSearch = signal<string>('');

    // Application Settings
    private _notifications = signal<any[]>([]);
    private _stocks = signal<IListOfStocks[] | null>(null);

    // Public read-only signals
    readonly sidebarOpen = this._sidebarOpen.asReadonly();
    readonly isMobile = this._isMobile.asReadonly();
    readonly loading = this._loading.asReadonly();
    readonly notifications = this._notifications.asReadonly();
    readonly globalSearch = this._globalSearch.asReadonly();

    // Computed values
    readonly hasNotifications = computed(() => this._notifications().length > 0);
    readonly unreadNotificationsCount = computed(() =>
        this._notifications().filter(n => !n.read).length
    );
    readonly isDesktop = computed(() => !this._isMobile());

    constructor(private http: HttpClient) {
        this.initializeService();
    }

    private initializeService(): void {
        // Initialize service with default values
        this.checkScreenSize();

        // Listen for window resize
        if (typeof window !== 'undefined') {
            window.addEventListener('resize', () => this.checkScreenSize());
        }
    }

    // Layout Methods
    toggleSidebar(): void {
        this._sidebarOpen.update(current => !current);
    }

    openSidebar(): void {
        this._sidebarOpen.set(true);
    }

    closeSidebar(): void {
        this._sidebarOpen.set(false);
    }

    checkScreenSize(): void {
        if (typeof window !== 'undefined') {
            const isMobileCheck = window.innerWidth < 1200;
            this._isMobile.set(isMobileCheck);
            this._sidebarOpen.set(false);

            //   // Auto-open sidebar on very wide screens
            //   if (window.innerWidth >= 1400) {
            //   }
        }
    }

    // Loading State Management
    setLoading(loading: boolean): void {
        this._loading.set(loading);
    }


    // Notification Management
    addNotification(notification: {
        id?: string;
        message: string;
        type: 'success' | 'error' | 'warning' | 'info';
        duration?: number;
        read?: boolean;
    }): void {
        const newNotification = {
            id: notification.id || Date.now().toString(),
            ...notification,
            read: notification.read || false,
            timestamp: new Date()
        };

        this._notifications.update(notifications => [...notifications, newNotification]);

        // Auto-remove notification if duration is specified
        if (notification.duration && notification.duration > 0) {
            setTimeout(() => {
                this.removeNotification(newNotification.id);
            }, notification.duration);
        }
    }

    removeNotification(id: string): void {
        this._notifications.update(notifications =>
            notifications.filter(n => n.id !== id)
        );
    }

    markNotificationAsRead(id: string): void {
        this._notifications.update(notifications =>
            notifications.map(n => n.id === id ? { ...n, read: true } : n)
        );
    }

    clearAllNotifications(): void {
        this._notifications.set([]);
    }

    // Global Search Methods
    setGlobalSearch(query: string): void {
        this._globalSearch.set(query);
    }

    clearGlobalSearch(): void {
        this._globalSearch.set('');
    }

    // Data formatting utilities
    formatCurrency(value: number, currency: string = 'INR'): string {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency
        }).format(value);
    }

    formatPercentage(value: number, decimals: number = 2): string {
        return `${value.toFixed(decimals)}%`;
    }

    formatNumber(value: number, decimals: number = 0): string {
        return new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(value);
    }

    // Local Storage Utilities
    setStorageItem(key: string, value: any): void {
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (error) {
                console.error('Error saving to localStorage:', error);
            }
        }
    }

    getStorageItem<T>(key: string, defaultValue: T): T {
        if (typeof window !== 'undefined') {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('Error reading from localStorage:', error);
                return defaultValue;
            }
        }
        return defaultValue;
    }

    removeStorageItem(key: string): void {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(key);
        }
    }

    getStocksList() {
         return this._stocks.asReadonly();
    }

    fetchStocksList(): Observable<IListOfStocks[]> {
        if (this._stocks() && this._stocks()!.length > 0) {
            return of(this._stocks()!);
        }
        // if (!http) {
        //     throw new Error('HttpClient must be provided for first fetch');
        // }
        const url = `${environment.apiUrl}/financial-results/getAllStocks`;
        return this.http.get<{ message: string; data: IListOfStocks[] }>(url).pipe(
            map(res => {
                const result = ListOfStocksModel.mapDbToListOfStocks(res.data);
                this._stocks.set(result);
                return result;
            }),
            catchError(err => of([]))
        );
    }
}
