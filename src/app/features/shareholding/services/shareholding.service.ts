import { Injectable, signal } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { catchError, map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { IDashboardSummary, IndexStat, IShareholding, ShareholdingModel } from "../model/shareholding.model";

// --- 2. SERVICE ---
@Injectable()
export class ShareholdingService {

    private fundamentalServiceUrl = `${environment.apiUrl}/fundamentals`;

    // Using Signals for reactive state management
    private shareholdings = signal<IShareholding[]>([]);
    private stocks = signal<IShareholding[]>([]);
    private summary = signal<IDashboardSummary>({
        total_stocks: 0, promoter_up: 0, promoter_down: 0, fii_up: 0, fii_down: 0, dii_up: 0, dii_down: 0, both_up: 0
    });
    private indexStats = signal<IndexStat[]>([]);

    constructor(private http: HttpClient) {
        this.loadData();
    }

    getStocks() { return this.stocks.asReadonly(); }
    getSummary() { return this.summary.asReadonly(); }
    getIndexStats() { return this.indexStats.asReadonly(); }

    private loadData() {
        // Data from the uploaded HTML file
        const rawData = {
            "summary": {
                "total_stocks": 749,
                "promoter_up": 199,
                "promoter_down": 385,
                "fii_up": 318,
                "fii_down": 417,
                "dii_up": 454,
                "dii_down": 278,
                "both_up": 129
            },
            "index_stats": [
                { "index": "NIFTY 50", "total": 50, "promoter_up": 17, "fii_up": 22, "dii_up": 37, "both_up": 9 },
                { "index": "NIFTY MICROCAP 250", "total": 249, "promoter_up": 61, "fii_up": 108, "dii_up": 131, "both_up": 41 },
                { "index": "NIFTY MIDCAP 150", "total": 150, "promoter_up": 33, "fii_up": 63, "dii_up": 95, "both_up": 20 },
                { "index": "NIFTY NEXT 50", "total": 50, "promoter_up": 14, "fii_up": 23, "dii_up": 33, "both_up": 9 },
                { "index": "NIFTY SMALLCAP 250", "total": 250, "promoter_up": 74, "fii_up": 102, "dii_up": 158, "both_up": 50 }
            ],
            "stocks": [
                { "symbol": "TECHM", "industry": "Computers - Software & Consulting", "index": "NIFTY 50", "latest_date": "2025-09-30", "previous_date": "2025-06-30", "promoter": 35.15, "fii": 20.6, "dii": 34.64, "public": 9.61, "promoter_change": -0.01, "fii_change": -2.68, "dii_change": 2.51, "public_change": 0.18 },
                { "symbol": "EICHERMOT", "industry": "2/3 Wheelers", "index": "NIFTY 50", "latest_date": "2025-09-30", "previous_date": "2025-06-30", "promoter": 49.15, "fii": 26.98, "dii": 14.62, "public": 9.25, "promoter_change": -0.01, "fii_change": 1.16, "dii_change": -1.05, "public_change": -0.1 },
                { "symbol": "BAJAJ-AUTO", "industry": "2/3 Wheelers", "index": "NIFTY 50", "latest_date": "2025-09-30", "previous_date": "2025-06-30", "promoter": 55.05, "fii": 9.66, "dii": 12.78, "public": 22.51, "promoter_change": -0.11, "fii_change": -0.64, "dii_change": 0.77, "public_change": -0.02 },
                { "symbol": "WIPRO", "industry": "Computers - Software & Consulting", "index": "NIFTY 50", "latest_date": "2025-12-31", "previous_date": "2025-09-30", "promoter": 72.75, "fii": 10.49, "dii": 8.38, "public": 8.38, "promoter_change": -0.05, "fii_change": 2.04, "dii_change": 0.52, "public_change": -2.51 },
                { "symbol": "SHRIRAMFIN", "industry": "Non Banking Financial Company (NBFC)", "index": "NIFTY 50", "latest_date": "2025-09-30", "previous_date": "2025-06-30", "promoter": 25.4, "fii": 49.61, "dii": 18.65, "public": 6.34, "promoter_change": -0.03, "fii_change": -3.0, "dii_change": 2.33, "public_change": 0.7 },
                { "symbol": "ADANIPORTS", "industry": "Port & Port services", "index": "NIFTY 50", "latest_date": "2025-12-31", "previous_date": "2025-12-23", "promoter": 68.02, "fii": 13.1, "dii": 13.89, "public": 4.99, "promoter_change": 0.0, "fii_change": 0.34, "dii_change": -0.2, "public_change": -0.14 },
                { "symbol": "TATACONSUM", "industry": "Tea & Coffee", "index": "NIFTY 50", "latest_date": "2025-09-30", "previous_date": "2025-06-30", "promoter": 33.85, "fii": 22.06, "dii": 22.2, "public": 21.89, "promoter_change": -0.02, "fii_change": 0.1, "dii_change": 0.18, "public_change": -0.26 },
                { "symbol": "SUNPHARMA", "industry": "Pharmaceuticals", "index": "NIFTY 50", "latest_date": "2025-09-30", "previous_date": "2025-06-30", "promoter": 54.61, "fii": 16.55, "dii": 20.12, "public": 8.72, "promoter_change": 0.01, "fii_change": -0.71, "dii_change": 0.74, "public_change": -0.04 },
                { "symbol": "ASIANPAINT", "industry": "Paints", "index": "NIFTY 50", "latest_date": "2025-09-30", "previous_date": "2025-06-30", "promoter": 52.77, "fii": 11.64, "dii": 21.5, "public": 14.09, "promoter_change": 0.01, "fii_change": -0.21, "dii_change": 0.52, "public_change": -0.32 },
                { "symbol": "HCLTECH", "industry": "Computers - Software & Consulting", "index": "NIFTY 50", "latest_date": "2025-09-30", "previous_date": "2025-06-30", "promoter": 61.15, "fii": 16.64, "dii": 17.8, "public": 4.41, "promoter_change": 0.12, "fii_change": -1.92, "dii_change": 1.63, "public_change": 0.17 },
                { "symbol": "INFY", "industry": "Computers - Software & Consulting", "index": "NIFTY 50", "latest_date": "2025-12-04", "previous_date": "2025-09-30", "promoter": 14.79, "fii": 29.58, "dii": 41.68, "public": 13.95, "promoter_change": 0.03, "fii_change": -0.5, "dii_change": 0.22, "public_change": 0.25 },
                { "symbol": "HDFCBANK", "industry": "Private Sector Bank", "index": "NIFTY 50", "latest_date": "2025-12-31", "previous_date": "2025-09-30", "promoter": 99.0, "fii": 47.67, "dii": 37.19, "public": -83.86, "promoter_change": 98.78, "fii_change": -0.71, "dii_change": 1.12, "public_change": -99.19 },
                { "symbol": "KOTAKBANK", "industry": "Private Sector Bank", "index": "NIFTY 50", "latest_date": "2025-09-30", "previous_date": "2025-06-30", "promoter": 25.88, "fii": 29.75, "dii": 32.02, "public": 12.35, "promoter_change": 0.01, "fii_change": -2.59, "dii_change": 2.41, "public_change": 0.17 },
                { "symbol": "SBIN", "industry": "Public Sector Bank", "index": "NIFTY 50", "latest_date": "2025-09-30", "previous_date": "2025-06-30", "promoter": 55.65, "fii": 9.57, "dii": 27.65, "public": 7.13, "promoter_change": -1.92, "fii_change": 0.24, "dii_change": 2.11, "public_change": -0.43 },
                { "symbol": "MARUTI", "industry": "Passenger Cars & Utility Vehicles", "index": "NIFTY 50", "latest_date": "2025-09-30", "previous_date": "2025-06-30", "promoter": 58.37, "fii": 15.78, "dii": 22.55, "public": 3.3, "promoter_change": 0.0, "fii_change": 0.58, "dii_change": -0.7, "public_change": 0.12 },
                { "symbol": "LT", "industry": "Civil Construction", "index": "NIFTY 50", "latest_date": "2025-09-30", "previous_date": "2025-06-30", "promoter": 0.26, "fii": 19.48, "dii": 43.34, "public": 36.92, "promoter_change": 0.02, "fii_change": 0.15, "dii_change": -0.14, "public_change": -0.03 },
                { "symbol": "ICICIBANK", "industry": "Private Sector Bank", "index": "NIFTY 50", "latest_date": "2025-09-30", "previous_date": "2025-06-30", "promoter": 0.27, "fii": 45.56, "dii": 45.06, "public": 9.11, "promoter_change": 0.01, "fii_change": -1.21, "dii_change": 1.15, "public_change": 0.05 },
                { "symbol": "HINDUNILVR", "industry": "Diversified FMCG", "index": "NIFTY 50", "latest_date": "2025-09-30", "previous_date": "2025-06-30", "promoter": 61.97, "fii": 10.79, "dii": 15.62, "public": 11.62, "promoter_change": 0.0, "fii_change": 0.61, "dii_change": -0.37, "public_change": -0.24 },
                { "symbol": "BHARTIARTL", "industry": "Telecom - Cellular & Fixed line services", "index": "NIFTY 50", "latest_date": "2025-09-30", "previous_date": "2025-06-30", "promoter": 50.46, "fii": 27.42, "dii": 19.4, "public": 2.72, "promoter_change": -0.99, "fii_change": 0.7, "dii_change": 0.31, "public_change": -0.02 },
                { "symbol": "ETERNAL", "industry": "E-Retail/ E-Commerce", "index": "NIFTY 50", "latest_date": "2025-12-31", "previous_date": "2025-09-30", "promoter": 5.58, "fii": 36.24, "dii": 32.71, "public": 25.47, "promoter_change": -0.22, "fii_change": -2.8, "dii_change": 2.67, "public_change": 0.35 },
                { "symbol": "POWERGRID", "industry": "Power - Transmission", "index": "NIFTY 50", "latest_date": "2025-09-30", "previous_date": "2025-06-30", "promoter": 51.41, "fii": 25.66, "dii": 19.33, "public": 3.6, "promoter_change": 0.01, "fii_change": -0.84, "dii_change": 0.84, "public_change": -0.01 },
                { "symbol": "TCS", "industry": "Computers - Software & Consulting", "index": "NIFTY 50", "latest_date": "2025-09-30", "previous_date": "2025-06-30", "promoter": 71.82, "fii": 10.33, "dii": 12.64, "public": 5.21, "promoter_change": 0.02, "fii_change": -1.15, "dii_change": 0.69, "public_change": 0.44 },
                { "symbol": "RELIANCE", "industry": "Refineries & Marketing", "index": "NIFTY 50", "latest_date": "2025-09-30", "previous_date": "2025-06-30", "promoter": 50.18, "fii": 18.65, "dii": 20.25, "public": 10.92, "promoter_change": -0.05, "fii_change": -0.56, "dii_change": 0.53, "public_change": 0.08 },
                { "symbol": "TITAN", "industry": "Gems Jewellery And Watches", "index": "NIFTY 50", "latest_date": "2025-09-30", "previous_date": "2025-06-30", "promoter": 53.14, "fii": 16.11, "dii": 13.99, "public": 16.76, "promoter_change": -0.04, "fii_change": -1.43, "dii_change": 1.4, "public_change": 0.07 },
                { "symbol": "BAJFINANCE", "industry": "Non Banking Financial Company (NBFC)", "index": "NIFTY 50", "latest_date": "2025-09-30", "previous_date": "2025-06-30", "promoter": 54.86, "fii": 21.97, "dii": 14.39, "public": 8.78, "promoter_change": 0.01, "fii_change": 0.26, "dii_change": -0.13, "public_change": -0.14 },
                { "symbol": "ITC", "industry": "Diversified FMCG", "index": "NIFTY 50", "latest_date": "2025-09-30", "previous_date": "2025-06-30", "promoter": 0.04, "fii": 37.39, "dii": 47.41, "public": 15.16, "promoter_change": -0.0, "fii_change": -0.59, "dii_change": 0.5, "public_change": 0.09 },
                { "symbol": "ULTRACEMCO", "industry": "Cement & Cement Products", "index": "NIFTY 50", "latest_date": "2025-09-30", "previous_date": "2025-06-30", "promoter": 59.47, "fii": 15.33, "dii": 16.65, "public": 8.55, "promoter_change": 0.03, "fii_change": 0.1, "dii_change": -0.2, "public_change": 0.07 },
                { "symbol": "TATASTEEL", "industry": "Iron & Steel", "index": "NIFTY 50", "latest_date": "2025-09-30", "previous_date": "2025-06-30", "promoter": 33.37, "fii": 17.29, "dii": 26.92, "public": 22.42, "promoter_change": -0.03, "fii_change": 0.07, "dii_change": 0.85, "public_change": -0.89 },
                { "symbol": "M&M", "industry": "Passenger Cars & Utility Vehicles", "index": "NIFTY 50", "latest_date": "2025-09-30", "previous_date": "2025-06-30", "promoter": 22.08, "fii": 38.04, "dii": 29.95, "public": 9.93, "promoter_change": -0.05, "fii_change": -0.49, "dii_change": 0.38, "public_change": 0.16 },
                { "symbol": "GRASIM", "industry": "Cement & Cement Products", "index": "NIFTY 50", "latest_date": "2025-09-30", "previous_date": "2025-06-30", "promoter": 43.44, "fii": 14.37, "dii": 17.27, "public": 24.92, "promoter_change": 0.01, "fii_change": 0.58, "dii_change": -0.64, "public_change": 0.05 },
                { "symbol": "MAXHEALTH", "industry": "Hospital", "index": "NIFTY 50", "latest_date": "2025-09-30", "previous_date": "2025-06-30", "promoter": 23.74, "fii": 51.8, "dii": 20.03, "public": 4.43, "promoter_change": 0.0, "fii_change": -2.96, "dii_change": 2.62, "public_change": 0.34 },
                { "symbol": "BEL", "industry": "Aerospace & Defense", "index": "NIFTY 50", "latest_date": "2025-09-30", "previous_date": "2025-06-30", "promoter": 51.14, "fii": 18.14, "dii": 20.88, "public": 9.84, "promoter_change": 0.0, "fii_change": -0.42, "dii_change": 0.28, "public_change": 0.14 },
                { "symbol": "NAUKRI", "industry": "Internet & Catalogue Retail", "index": "NIFTY NEXT 50", "latest_date": "2025-09-30", "previous_date": "2025-06-30", "promoter": 38.4, "fii": 30.33, "dii": 21.01, "public": 10.26, "promoter_change": 0.03, "fii_change": -2.66, "dii_change": 2.65, "public_change": -0.02 },
                { "symbol": "TVSMOTOR", "industry": "2/3 Wheelers", "index": "NIFTY NEXT 50", "latest_date": "2025-09-30", "previous_date": "2025-06-30", "promoter": 50.3, "fii": 22.9, "dii": 18.34, "public": 8.46, "promoter_change": -0.08, "fii_change": 0.48, "dii_change": -0.46, "public_change": 0.06 },
                { "symbol": "PFC", "industry": "Financial Institution", "index": "NIFTY NEXT 50", "latest_date": "2025-12-31", "previous_date": "2025-09-30", "promoter": 55.99, "fii": 18.33, "dii": 15.48, "public": 10.2, "promoter_change": -0.0, "fii_change": -0.51, "dii_change": -0.56, "public_change": 1.07 },
                { "symbol": "ADANIGREEN", "industry": "Power Generation", "index": "NIFTY NEXT 50", "latest_date": "2025-09-30", "previous_date": "2025-06-30", "promoter": 62.43, "fii": 11.29, "dii": 2.98, "public": 23.3, "promoter_change": 0.51, "fii_change": -0.29, "dii_change": 0.12, "public_change": -0.34 },
                { "symbol": "HONAUT", "industry": "Industrial Products", "index": "NIFTY MIDCAP 150", "latest_date": "2025-09-30", "previous_date": "2025-06-30", "promoter": 75.01, "fii": 3.0, "dii": 11.99, "public": 10.0, "promoter_change": -0.02, "fii_change": 0.24, "dii_change": -0.16, "public_change": -0.06 },
                { "symbol": "ACC", "industry": "Cement & Cement Products", "index": "NIFTY MIDCAP 150", "latest_date": "2025-12-31", "previous_date": "2025-09-30", "promoter": 56.69, "fii": 5.99, "dii": 21.38, "public": 15.94, "promoter_change": -0.17, "fii_change": 0.95, "dii_change": -1.17, "public_change": 0.39 },
                { "symbol": "WAAREEENER", "industry": "Other Electrical Equipment", "index": "NIFTY MIDCAP 150", "latest_date": "2025-12-31", "previous_date": "2025-09-30", "promoter": 64.22, "fii": 6.91, "dii": 2.86, "public": 26.01, "promoter_change": -0.01, "fii_change": 0.56, "dii_change": 0.04, "public_change": -0.59 },
                { "symbol": "PERSISTENT", "industry": "Computers - Software & Consulting", "index": "NIFTY MIDCAP 150", "latest_date": "2025-09-30", "previous_date": "2025-06-30", "promoter": 31.02, "fii": 21.24, "dii": 30.6, "public": 17.14, "promoter_change": -0.14, "fii_change": -2.95, "dii_change": 2.83, "public_change": 0.26 },
                { "symbol": "GLENMARK", "industry": "Pharmaceuticals", "index": "NIFTY MIDCAP 150", "latest_date": "2025-09-30", "previous_date": "2025-06-30", "promoter": 46.69, "fii": 20.73, "dii": 18.61, "public": 13.97, "promoter_change": 0.0, "fii_change": 0.11, "dii_change": 0.97, "public_change": -1.08 },
                { "symbol": "MUTHOOTFIN", "industry": "Non Banking Financial Company (NBFC)", "index": "NIFTY MIDCAP 150", "latest_date": "2025-09-30", "previous_date": "2025-06-30", "promoter": 73.35, "fii": 11.58, "dii": 11.37, "public": 3.7, "promoter_change": 0.0, "fii_change": 0.74, "dii_change": -0.84, "public_change": 0.1 },
                { "symbol": "CUMMINSIND", "industry": "Compressors Pumps & Diesel Engines", "index": "NIFTY MIDCAP 150", "latest_date": "2025-09-30", "previous_date": "2025-06-30", "promoter": 51.1, "fii": 18.35, "dii": 21.73, "public": 8.82, "promoter_change": -0.01, "fii_change": 0.85, "dii_change": -0.8, "public_change": -0.04 },
                { "symbol": "SUZLON", "industry": "Heavy Electrical Equipment", "index": "NIFTY MIDCAP 150", "latest_date": "2025-12-31", "previous_date": "2025-09-30", "promoter": 11.73, "fii": 23.73, "dii": 9.24, "public": 55.3, "promoter_change": -0.03, "fii_change": 1.03, "dii_change": -0.9, "public_change": -0.1 },
                { "symbol": "NMDC", "industry": "Industrial Minerals", "index": "NIFTY MIDCAP 150", "latest_date": "2025-09-30", "previous_date": "2025-06-30", "promoter": 60.82, "fii": 13.04, "dii": 14.38, "public": 11.76, "promoter_change": 0.02, "fii_change": 0.83, "dii_change": -0.1, "public_change": -0.75 },
                { "symbol": "LUPIN", "industry": "Pharmaceuticals", "index": "NIFTY MIDCAP 150", "latest_date": "2025-09-30", "previous_date": "2025-06-30", "promoter": 46.88, "fii": 20.5, "dii": 26.56, "public": 6.06, "promoter_change": -0.04, "fii_change": -0.75, "dii_change": 1.01, "public_change": -0.22 },
                { "symbol": "KALYANKJIL", "industry": "Gems Jewellery And Watches", "index": "NIFTY MIDCAP 150", "latest_date": "2025-12-31", "previous_date": "2025-09-30", "promoter": 62.76, "fii": 14.12, "dii": 15.22, "public": 7.9, "promoter_change": -0.02, "fii_change": 0.0, "dii_change": 0.66, "public_change": -0.64 },
                { "symbol": "OBEROIRLTY", "industry": "Residential Commercial Projects", "index": "NIFTY MIDCAP 150", "latest_date": "2025-09-30", "previous_date": "2025-06-30", "promoter": 67.7, "fii": 16.06, "dii": 13.85, "public": 2.39, "promoter_change": 0.0, "fii_change": -3.3, "dii_change": 3.05, "public_change": 0.25 },
                { "symbol": "GVT&D", "industry": "Heavy Electrical Equipment", "index": "NIFTY MIDCAP 150", "latest_date": "2025-09-30", "previous_date": "2025-06-30", "promoter": 50.99, "fii": 16.15, "dii": 25.2, "public": 7.66, "promoter_change": -0.03, "fii_change": 1.66, "dii_change": -1.55, "public_change": -0.08 },
                { "symbol": "APTUS", "industry": "Housing Finance Company", "index": "NIFTY SMALLCAP 250", "latest_date": "2025-09-30", "previous_date": "2025-06-30", "promoter": 23.88, "fii": 35.36, "dii": 25.87, "public": 14.89, "promoter_change": -16.48, "fii_change": 4.95, "dii_change": 9.83, "public_change": 1.7 },
                { "symbol": "BOSCHLTD", "industry": "Auto Components & Equipments", "index": "NIFTY NEXT 50", "latest_date": "2025-09-30", "previous_date": "2025-06-30", "promoter": 70.54, "fii": 7.13, "dii": 15.08, "public": 7.25, "promoter_change": 0.01, "fii_change": 0.95, "dii_change": -0.9, "public_change": -0.06 }
            ]
        };

        this.summary.set(rawData.summary);
        this.indexStats.set(rawData.index_stats);
        this.stocks.set(rawData.stocks);
    }
}