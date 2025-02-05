import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DomainsPage } from './domains.page';

const routes: Routes = [
  {
    path: 'tabs',
    component: DomainsPage,
    children: [
      {
        path: 'overview',
        loadChildren: () => import('./overview/overview.module').then( m => m.OverviewPageModule)
      },
      {
        path: 'cartlist',
        loadChildren: () => import('./cartlist/cartlist.module').then( m => m.CartlistPageModule)
      },
      {
        path: 'shoppinglist',
        loadChildren: () => import('./shoppinglist/shoppinglist.module').then( m => m.ShoppinglistPageModule)
      },
      {
        path: '', redirectTo: 'domains/tabs/overview', pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DomainsPageRoutingModule {}
