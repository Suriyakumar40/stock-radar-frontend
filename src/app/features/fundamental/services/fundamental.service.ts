import { Injectable, signal } from "@angular/core";
import { QuarterResult } from "../model/quarter-result.model";

// --- 2. SERVICE ---
@Injectable({
    providedIn: 'root'
})
export class FundamentalService {
    // Using Signals for reactive state management
    private stocks = signal<QuarterResult[]>([
        // ... Data populated in constructor or fetched
    ]);

    constructor() {
        this.getQuarterResults();
    }

    getStocks() {
        return this.stocks.asReadonly();
    }

    private getQuarterResults() {
        // In a real app, this would be an HTTP call. 
        // Populating with the provided data.
        const data: QuarterResult[] = [
            { "symbol": "TECHM", "industry": "Computers - Software & Consulting", "index": "NIFTY 50", "sales": 5.15, "profit": -4.38, "opm": 11.59, "score": 0, "rating": "AVERAGE", "catScore": 0, "indScore": 0 },
            { "symbol": "EICHERMOT", "industry": "2/3 Wheelers", "index": "NIFTY 50", "sales": 44.78, "profit": 24.45, "opm": 20.97, "score": 4, "rating": "GOOD", "catScore": 1, "indScore": 3 },
            { "symbol": "BAJAJ-AUTO", "industry": "2/3 Wheelers", "index": "NIFTY 50", "sales": 18.77, "profit": 53.21, "opm": 19.43, "score": 5, "rating": "EXCEPTIONAL", "catScore": 2, "indScore": 3 },
            { "symbol": "WIPRO", "industry": "Computers - Software & Consulting", "index": "NIFTY 50", "sales": 1.77, "profit": 1.08, "opm": 14.62, "score": 0, "rating": "AVERAGE", "catScore": 0, "indScore": 0 },
            { "symbol": "SHRIRAMFIN", "industry": "Non Banking Financial Company (NBFC)", "index": "NIFTY 50", "sales": 18.06, "profit": 7.48, "opm": 26.06, "score": 2, "rating": "AVERAGE", "catScore": 2, "indScore": 0 },
            { "symbol": "ADANIPORTS", "industry": "Port & Port services", "index": "NIFTY 50", "sales": 28.77, "profit": 29.3, "opm": 33.41, "score": 5, "rating": "EXCEPTIONAL", "catScore": 3, "indScore": 2 },
            { "symbol": "TATACONSUM", "industry": "Tea & Coffee", "index": "NIFTY 50", "sales": 17.1, "profit": 10.9, "opm": 9.77, "score": 1, "rating": "AVERAGE", "catScore": 1, "indScore": 0 },
            { "symbol": "SUNPHARMA", "industry": "Pharmaceuticals", "index": "NIFTY 50", "sales": 8.93, "profit": 2.9, "opm": 25.54, "score": 2, "rating": "AVERAGE", "catScore": 1, "indScore": 1 },
            { "symbol": "ASIANPAINT", "industry": "Paints", "index": "NIFTY 50", "sales": 3.95, "profit": 46.69, "opm": 13.53, "score": 4, "rating": "GOOD", "catScore": 1, "indScore": 3 },
            { "symbol": "HCLTECH", "industry": "Computers - Software & Consulting", "index": "NIFTY 50", "sales": 10.67, "profit": -0.02, "opm": 16.55, "score": 2, "rating": "AVERAGE", "catScore": 0, "indScore": 2 },
            { "symbol": "INFY", "industry": "Computers - Software & Consulting", "index": "NIFTY 50", "sales": 8.55, "profit": 13.18, "opm": 20.78, "score": 2, "rating": "AVERAGE", "catScore": 0, "indScore": 2 },
            { "symbol": "HDFCBANK", "industry": "Private Sector Bank", "index": "NIFTY 50", "sales": 4.71, "profit": 10.01, "opm": -0.72, "score": 0, "rating": "AVERAGE", "catScore": 0, "indScore": 0 },
            { "symbol": "KOTAKBANK", "industry": "Private Sector Bank", "index": "NIFTY 50", "sales": -16.91, "profit": -34.91, "opm": 19.63, "score": 1, "rating": "AVERAGE", "catScore": 0, "indScore": 1 },
            { "symbol": "SBIN", "industry": "Public Sector Bank", "index": "NIFTY 50", "sales": 3.28, "profit": 6.35, "opm": -12.29, "score": 0, "rating": "AVERAGE", "catScore": 0, "indScore": 0 },
            { "symbol": "MARUTI", "industry": "Passenger Cars & Utility Vehicles", "index": "NIFTY 50", "sales": 13.07, "profit": 7.93, "opm": 7.85, "score": 1, "rating": "AVERAGE", "catScore": 0, "indScore": 1 },
            { "symbol": "BHARTIARTL", "industry": "Telecom - Cellular & Fixed line services", "index": "NIFTY 50", "sales": 23.2, "profit": 108.31, "opm": 22.08, "score": 6, "rating": "EXPLOSIVE", "catScore": 3, "indScore": 3 },
            { "symbol": "ETERNAL", "industry": "E-Retail/ E-Commerce", "index": "NIFTY 50", "sales": 183.18, "profit": -63.07, "opm": -1.64, "score": 2, "rating": "AVERAGE", "catScore": 1, "indScore": 1 },
            { "symbol": "POWERGRID", "industry": "Power - Transmission", "index": "NIFTY 50", "sales": 1.76, "profit": -5.98, "opm": 32.62, "score": 2, "rating": "AVERAGE", "catScore": 1, "indScore": 1 },
            { "symbol": "TCS", "industry": "Computers - Software & Consulting", "index": "NIFTY 50", "sales": 4.16, "profit": 1.47, "opm": 24.83, "score": 2, "rating": "AVERAGE", "catScore": 1, "indScore": 1 },
            { "symbol": "RELIANCE", "industry": "Refineries & Marketing", "index": "NIFTY 50", "sales": 9.94, "profit": 14.33, "opm": 9.52, "score": 3, "rating": "GOOD", "catScore": 0, "indScore": 3 },
            { "symbol": "TITAN", "industry": "Gems Jewellery And Watches", "index": "NIFTY 50", "sales": 28.84, "profit": 59.09, "opm": 7.52, "score": 5, "rating": "EXCEPTIONAL", "catScore": 2, "indScore": 3 },
            { "symbol": "BAJFINANCE", "industry": "Non Banking Financial Company (NBFC)", "index": "NIFTY 50", "sales": 18.07, "profit": 23.27, "opm": 32.72, "score": 4, "rating": "GOOD", "catScore": 2, "indScore": 2 },
            { "symbol": "ITC", "industry": "Diversified FMCG", "index": "NIFTY 50", "sales": -5.0, "profit": 2.63, "opm": 29.36, "score": 3, "rating": "GOOD", "catScore": 1, "indScore": 2 },
            { "symbol": "ULTRACEMCO", "industry": "Cement & Cement Products", "index": "NIFTY 50", "sales": 25.41, "profit": 50.06, "opm": 7.58, "score": 5, "rating": "EXCEPTIONAL", "catScore": 2, "indScore": 3 },
            { "symbol": "TATASTEEL", "industry": "Iron & Steel", "index": "NIFTY 50", "sales": 9.69, "profit": 319.37, "opm": 7.2, "score": 4, "rating": "GOOD", "catScore": 1, "indScore": 3 },
            { "symbol": "M&M", "industry": "Passenger Cars & Utility Vehicles", "index": "NIFTY 50", "sales": 21.57, "profit": 17.94, "opm": 10.65, "score": 4, "rating": "GOOD", "catScore": 1, "indScore": 3 },
            { "symbol": "GRASIM", "industry": "Cement & Cement Products", "index": "NIFTY 50", "sales": 18.59, "profit": 36.18, "opm": 5.27, "score": 5, "rating": "EXCEPTIONAL", "catScore": 2, "indScore": 3 },
            { "symbol": "MAXHEALTH", "industry": "Hospital", "index": "NIFTY 50", "sales": 25.07, "profit": 74.11, "opm": 19.34, "score": 5, "rating": "EXCEPTIONAL", "catScore": 2, "indScore": 3 },
            { "symbol": "BEL", "industry": "Aerospace & Defense", "index": "NIFTY 50", "sales": 25.78, "profit": 17.75, "opm": 27.18, "score": 4, "rating": "GOOD", "catScore": 2, "indScore": 2 },
            { "symbol": "NAUKRI", "industry": "Internet & Catalogue Retail", "index": "NIFTY NEXT 50", "sales": 45.52, "profit": 308.24, "opm": 29.94, "score": 6, "rating": "EXPLOSIVE", "catScore": 3, "indScore": 3 },
            { "symbol": "TVSMOTOR", "industry": "2/3 Wheelers", "index": "NIFTY NEXT 50", "sales": 24.32, "profit": 41.67, "opm": 8.89, "score": 3, "rating": "GOOD", "catScore": 1, "indScore": 2 },
            { "symbol": "PFC", "industry": "Financial Institution", "index": "NIFTY NEXT 50", "sales": 26.75, "profit": 209.22, "opm": 71.73, "score": 6, "rating": "EXPLOSIVE", "catScore": 3, "indScore": 3 },
            { "symbol": "ADANIGREEN", "industry": "Power Generation", "index": "NIFTY NEXT 50", "sales": 119.16, "profit": 185.05, "opm": 12.98, "score": 5, "rating": "EXCEPTIONAL", "catScore": 2, "indScore": 3 },
            {
                "symbol": "HONAUT", "industry": "Industrial Products", "index": "NIFTY MIDCAP 150", "sales": 12.3,
                "profit": 4.35, "opm": 10.17, "score": 3, "rating": "GOOD", "catScore": 0, "indScore": 3
            },
            { "symbol": "ACC", "industry": "Cement & Cement Products", "index": "NIFTY MIDCAP 150", "sales": 27.6, "profit": 459.5, "opm": 9.07, "score": 5, "rating": "EXCEPTIONAL", "catScore": 2, "indScore": 3 },
            { "symbol": "WAAREEENER", "industry": "Other Electrical Equipment", "index": "NIFTY MIDCAP 150", "sales": 69.73, "profit": 133.51, "opm": 17.66, "score": 5, "rating": "EXCEPTIONAL", "catScore": 2, "indScore": 3 },
            { "symbol": "PERSISTENT", "industry": "Computers - Software & Consulting", "index": "NIFTY MIDCAP 150", "sales": 20.57, "profit": 43.08, "opm": 16.6, "score": 4, "rating": "GOOD", "catScore": 1, "indScore": 3 },
            { "symbol": "GLENMARK", "industry": "Pharmaceuticals", "index": "NIFTY MIDCAP 150", "sales": 116.39, "profit": 72.32, "opm": 35.58, "score": 6, "rating": "EXPLOSIVE", "catScore": 3, "indScore": 3 },
            { "symbol": "MUTHOOTFIN", "industry": "Non Banking Financial Company (NBFC)", "index": "NIFTY MIDCAP 150", "sales": 47.79, "profit": 82.59, "opm": 43.87, "score": 6, "rating": "EXPLOSIVE", "catScore": 3, "indScore": 3 },
            { "symbol": "CUMMINSIND", "industry": "Compressors Pumps & Diesel Engines", "index": "NIFTY MIDCAP 150", "sales": 26.39, "profit": 42.09, "opm": 20.31, "score": 6, "rating": "EXPLOSIVE", "catScore": 3, "indScore": 3 },
            { "symbol": "SUZLON", "industry": "Heavy Electrical Equipment", "index": "NIFTY MIDCAP 150", "sales": 84.02, "profit": 536.32, "opm": 13.82, "score": 5, "rating": "EXCEPTIONAL", "catScore": 2, "indScore": 3 },
            { "symbol": "NMDC", "industry": "Industrial Minerals", "index": "NIFTY MIDCAP 150", "sales": 27.28, "profit": 39.77, "opm": 30.19, "score": 6, "rating": "EXPLOSIVE", "catScore": 3, "indScore": 3 },
            { "symbol": "LUPIN", "industry": "Pharmaceuticals", "index": "NIFTY MIDCAP 150", "sales": 24.24, "profit": 72.88, "opm": 27.2, "score": 6, "rating": "EXPLOSIVE", "catScore": 3, "indScore": 3 },
            { "symbol": "KALYANKJIL", "industry": "Gems Jewellery And Watches", "index": "NIFTY MIDCAP 150", "sales": 29.53, "profit": 100.77, "opm": 3.81, "score": 5, "rating": "EXCEPTIONAL", "catScore": 2, "indScore": 3 },
            { "symbol": "OBEROIRLTY", "industry": "Residential Commercial Projects", "index": "NIFTY MIDCAP 150", "sales": 109.62, "profit": 100.68, "opm": 48.07, "score": 6, "rating": "EXPLOSIVE", "catScore": 3, "indScore": 3 },
            { "symbol": "GVT&D", "industry": "Heavy Electrical Equipment", "index": "NIFTY MIDCAP 150", "sales": 38.81, "profit": 106.21, "opm": 24.84, "score": 6, "rating": "EXPLOSIVE", "catScore": 3, "indScore": 3 },
            { "symbol": "APTUS", "industry": "Housing Finance Company", "index": "NIFTY SMALLCAP 250", "sales": 28.91, "profit": 24.73, "opm": 52.39, "score": 5, "rating": "EXCEPTIONAL", "catScore": 2, "indScore": 3 },
            { "symbol": "BOSCHLTD", "industry": "Auto Components & Equipments", "index": "NIFTY NEXT 50", "sales": 107.76, "profit": 211.17, "opm": 11.17, "score": 5, "rating": "EXCEPTIONAL", "catScore": 2, "indScore": 3 }
        ];
        this.stocks.set(data);
    }
}