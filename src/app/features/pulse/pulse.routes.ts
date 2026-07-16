import { Routes } from '@angular/router';
import { PulseTodaySignalsComponent } from './pages/pulse-today-signals/pulse-today-signals.component';
import { PulseStockListComponent } from './pages/pulse-stock-list/pulse-stock-list.component';

export const pulseRoutes: Routes = [
    {
        path: '',
        component: PulseTodaySignalsComponent
    },
    {
        path: 'sector',
        component: PulseStockListComponent
    },
    {
        path: 'screener',
        loadComponent: () => import('./pages/pulse-screener/pulse-screener.component').then(m => m.PulseScreenerComponent)
    }
];
