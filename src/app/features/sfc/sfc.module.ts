import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SfcRoutingModule } from './sfc-routing.module';
import { SfcService } from '../../services/sfc.service';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    SfcRoutingModule
  ],
  providers: [SfcService]
})
export class SfcModule { }
