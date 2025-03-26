import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ServerUnavailablePageRoutingModule } from './server-unavailable-routing.module';

import { ServerUnavailablePage } from './server-unavailable.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ServerUnavailablePageRoutingModule
  ],
  declarations: [ServerUnavailablePage]
})
export class ServerUnavailablePageModule {}
