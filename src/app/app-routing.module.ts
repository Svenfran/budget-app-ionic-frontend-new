import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'domains/tabs/overview',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then( m => m.AuthPageModule)
  },
  {
    path: 'domains',
    loadChildren: () => import('./domains/domains.module').then( m => m.DomainsPageModule),
    canLoad: [AuthGuard]
  },
  {
    path: 'overview',
    loadChildren: () => import('./domains/overview/overview.module').then( m => m.OverviewPageModule),
    canLoad: [AuthGuard]
  },
  {
    path: 'cartlist',
    loadChildren: () => import('./domains/cartlist/cartlist.module').then( m => m.CartlistPageModule),
    canLoad: [AuthGuard]
  },
  {
    path: 'shoppinglist',
    loadChildren: () => import('./domains/shoppinglist/shoppinglist.module').then( m => m.ShoppinglistPageModule),
    canLoad: [AuthGuard]
  },
  {
    path: 'groupoverview',
    loadChildren: () => import('./groupoverview/groupoverview.module').then( m => m.GroupoverviewPageModule),
    canLoad: [AuthGuard]
  },
  {
    path: 'groupmembers',
    loadChildren: () => import('./groupmembers/groupmembers.module').then( m => m.GroupmembersPageModule),
    canLoad: [AuthGuard]
  },
  {
    path: 'categoryoverview',
    loadChildren: () => import('./categoryoverview/categoryoverview.module').then( m => m.CategoryoverviewPageModule),
    canLoad: [AuthGuard]
  },
  {
    path: 'settlement-payment',
    loadChildren: () => import('./settlement-payment/settlement-payment.module').then( m => m.SettlementPaymentPageModule),
    canLoad: [AuthGuard]
  }

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
