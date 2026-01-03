import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'fundamental',
        pathMatch: 'full'
    },
    {
        path: 'fundamental',
        loadChildren: () => import('./features/fundamental/fundamental.routes').then(m => m.ROUTES)
    }
];