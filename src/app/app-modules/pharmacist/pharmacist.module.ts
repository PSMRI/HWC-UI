/*
 * AMRIT – Accessible Medical Records via Integrated Technology
 * Integrated EHR (Electronic Health Records) Solution
 *
 * Copyright (C) "Piramal Swasthya Management and Research Institute"
 *
 * This file is part of AMRIT.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see https://www.gnu.org/licenses/.
 */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoreModule } from '../core/core.module';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { PharmacistRoutingModule } from './pharmacist-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { WorklistComponent } from './worklist/worklist.component';

import { PharmacistService } from './shared/services/pharmacist.service';
import { RedirInComponent } from './redir-in/redir-in.component';
import { RedirFallbackComponent } from './redir-fallback/redir-fallback.component';
import { HttpClientModule } from '@angular/common/http';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MaterialModule } from '../core/material.module';
import { SharedModule } from '../core/components/shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    PharmacistRoutingModule,
    CoreModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    HttpClientModule,
    MaterialModule,
    MatTableModule,
    MatChipsModule,
    MatDatepickerModule,
    MatTooltipModule,
    SharedModule,
  ],
  declarations: [
    DashboardComponent,
    WorklistComponent,
    RedirInComponent,
    RedirFallbackComponent,
  ],
  providers: [PharmacistService],
})
export class PharmacistModule {}
