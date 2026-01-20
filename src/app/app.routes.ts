import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'quarter-results',
        pathMatch: 'full'
    },
    {
        path: 'quarter-results',
        loadComponent: () => import('./features/quarter-results/pages/quarter-results.component').then(m => m.QuarterResultsComponent)
    },
    {
        path: 'shareholding',
        loadComponent: () => import('./features/shareholding/pages/shareholding.component').then(m => m.ShareholdingComponent)
    },
    {
        path: 'momentum',
        loadChildren: () => import('./features/momentum/momentum.routes').then(m => m.momentumRoutes)
    }
];