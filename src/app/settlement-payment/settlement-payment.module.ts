import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SettlementPaymentPageRoutingModule } from './settlement-payment-routing.module';

import { SettlementPaymentPage } from './settlement-payment.page';
import { DatePickerComponent } from '../components/date-picker/date-picker.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SettlementPaymentPageRoutingModule,
    ReactiveFormsModule
  ],
  declarations: [SettlementPaymentPage, DatePickerComponent]
})
export class SettlementPaymentPageModule {}
