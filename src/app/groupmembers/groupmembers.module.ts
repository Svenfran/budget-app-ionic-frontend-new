import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { GroupmembersPageRoutingModule } from './groupmembers-routing.module';

import { GroupmembersPage } from './groupmembers.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GroupmembersPageRoutingModule,
    ReactiveFormsModule
  ],
  declarations: [GroupmembersPage]
})
export class GroupmembersPageModule {}
