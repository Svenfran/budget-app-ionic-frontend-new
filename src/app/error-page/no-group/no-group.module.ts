import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { NoGroupPageRoutingModule } from './no-group-routing.module';

import { NoGroupPage } from './no-group.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    NoGroupPageRoutingModule
  ],
  declarations: [NoGroupPage]
})
export class NoGroupPageModule {}
