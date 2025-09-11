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
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './app-modules/core/services/auth-guard.service';
import { ServiceComponent } from './user-login/service/service.component';
import { LoginComponent } from './user-login/login/login.component';
import { ServicePointComponent } from './user-login/service-point/service-point.component';
import { SetPasswordComponent } from './user-login/set-password/set-password.component';
import { SetSecurityQuestionsComponent } from './user-login/set-security-questions/set-security-questions.component';
import { ResetPasswordComponent } from './user-login/reset-password/reset-password.component';
import { TmLogoutComponent } from './user-login/tm-logout/tm-logout.component';
import { ServicePointResolve } from './user-login/service-point/service-point-resolve.service';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'logout-tm',
    component: TmLogoutComponent,
  },
  {
    path: 'set-security-questions',
    component: SetSecurityQuestionsComponent,
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent,
  },
  {
    path: 'set-password',
    component: SetPasswordComponent,
  },
  {
    path: 'service',
    component: ServiceComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'servicePoint',
    component: ServicePointComponent,
    canActivate: [AuthGuard],
    resolve: {
      servicePoints: ServicePointResolve,
    },
  },
  {
    path: 'registrar',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('Common-UI/src/registrar/registration.module').then(
        (m) => m.RegistrationModule,
      ),
  },
  {
    path: 'nurse-doctor',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./app-modules/nurse-doctor/nurse-doctor.module').then(
        (m) => m.NurseDoctorModule,
      ),
  },
  {
    path: 'lab',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./app-modules/lab/lab.module').then((module) => module.LabModule),
  },
  {
    path: 'pharmacist',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./app-modules/pharmacist/pharmacist.module').then(
        (module) => module.PharmacistModule,
      ),
  },
  {
    path: 'datasync',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./app-modules/data-sync/dataSync.module').then(
        (module) => module.DataSYNCModule,
      ),
  },
  {
    path: 'feedback',
    loadChildren: () =>
      import('Common-UI/src/feedback/feedback.module').then(
        (m) => m.FeedbackModule,
      ),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
