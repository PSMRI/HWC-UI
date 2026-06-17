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
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CoreModule } from './app-modules/core/core.module';
import { LoginComponent } from './user-login/login/login.component';
import { ServicePointComponent } from './user-login/service-point/service-point.component';
import { ServiceComponent } from './user-login/service/service.component';
import { ResetPasswordComponent } from './user-login/reset-password/reset-password.component';
import { SetPasswordComponent } from './user-login/set-password/set-password.component';
import { SetSecurityQuestionsComponent } from './user-login/set-security-questions/set-security-questions.component';
import { TmLogoutComponent } from './user-login/tm-logout/tm-logout.component';
import {
  HttpClient,
  HttpClientModule,
  HTTP_INTERCEPTORS,
} from '@angular/common/http';
import { MaterialModule } from './app-modules/core/material.module';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { UserLoginModule } from './user-login/user-login.module';
import { AppRoutingModule } from './app-routing.module';
import { HttpInterceptorService } from './app-modules/core/services/http-interceptor.service';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { DataSYNCModule } from './app-modules/data-sync/dataSync.module';
import { AudioRecordingService } from './app-modules/nurse-doctor/shared/services/audio-recording.service';
import { ServicePointResolve } from './user-login/service-point/service-point-resolve.service';
import { ServicePointService } from './user-login/service-point/service-point.service';
import { CbacService } from './app-modules/nurse-doctor/shared/services/cbac.service';
import { HrpService } from './app-modules/nurse-doctor/shared/services/hrp.service';
import { FamilyTaggingService } from './app-modules/registrar/shared/services/familytagging.service';
import { RegistrarService } from './app-modules/registrar/shared/services/registrar.service';
import { RegistrationModule } from 'Common-UI/src/registrar/registration.module';
import { SharedModule } from './app-modules/core/components/shared/shared.module';
import { RegistrarModule } from './app-modules/registrar/registrar.module';
import { CaptchaComponent } from './user-login/captcha/captcha.component';
import { TrackingModule } from 'Common-UI/src/tracking';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    ServicePointComponent,
    ServiceComponent,
    ResetPasswordComponent,
    SetPasswordComponent,
    SetSecurityQuestionsComponent,
    TmLogoutComponent,
    CaptchaComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    MatIconModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    HttpClientModule,
    MaterialModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    UserLoginModule,
    MatGridListModule,
    DataSYNCModule,
    CoreModule.forRoot(),
    SharedModule,
    RegistrationModule,
    TrackingModule.forRoot(),
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [
    HttpClient,
    ServicePointResolve,
    ServicePointService,
    AudioRecordingService,
    RegistrarService,
    FamilyTaggingService,
    CbacService,
    HrpService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpInterceptorService,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
