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
import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from './material.module';

import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthGuard } from './services/auth-guard.service';
import { AuthService } from './services/auth.service';
import { TelemedicineService } from './services/telemedicine.service';
import { HttpClientModule } from '@angular/common/http';
import { CommonDialogComponent } from './components/common-dialog/common-dialog.component';
import { HttpServiceService } from './services/http-service.service';
import { AllergenSearchComponent } from './components/allergen-search/allergen-search.component';
import { SpecialistLoginComponent } from './components/specialist-login/specialist-login.component';
import { AppHeaderComponent } from './components/app-header/app-header.component';
import { BeneficiaryDetailsComponent } from './components/beneficiary-details/beneficiary-details.component';
import { CalibrationComponent } from './components/calibration/calibration.component';
import { CameraDialogComponent } from './components/camera-dialog/camera-dialog.component';
import { DiagnosisSearchComponent } from './components/diagnosis-search/diagnosis-search.component';
import { IotBluetoothComponent } from './components/iot-bluetooth/iot-bluetooth.component';
import { IotcomponentComponent } from './components/iotcomponent/iotcomponent.component';
import { MmuRbsDetailsComponent } from './components/mmu-rbs-details/mmu-rbs-details.component';
import { OpenPreviousVisitDetailsComponent } from './components/open-previous-visit-details/open-previous-visit-details.component';
import { PreviousDetailsComponent } from './components/previous-details/previous-details.component';
import { ShowCommitAndVersionDetailsComponent } from './components/show-commit-and-version-details/show-commit-and-version-details.component';
import { PreviousImmunizationServiceDetailsComponent } from './components/previous-immunization-service-details/previous-immunization-service-details.component';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { TextareaDialog } from './components/textarea-dialog/textarea-dialog.service';
import { TextareaDialogComponent } from './components/textarea-dialog/textarea-dialog.component';
import { UserLoginModule } from 'src/app/user-login/user-login.module';
import { MatGridListModule } from '@angular/material/grid-list';
import { IotService } from './services/iot.service';
import { AppFooterComponent } from './components/app-footer/app-footer.component';
import { HealthIdDisplayModalComponent } from './components/health-id-display-modal/health-id-display-modal.component';
import { ConfirmationService } from './services/confirmation.service';
import {
  CameraService,
  SpinnerService,
  BeneficiaryDetailsService,
} from './services';
import { CanDeactivateGuardService } from './services/can-deactivate-guard.service';
import { CommonService } from './services/common-services.service';
import { InventoryService } from './services/inventory.service';
import { HttpInterceptorService } from './services/http-interceptor.service';
import { MyEmailDirective } from './directives/email/myEmail.directive';
import { MyMobileNumberDirective } from './directives/MobileNumber/myMobileNumber.directive';
import { ConfirmatoryDiagnosisDirective } from './directives/confirmatory-diagnosis.directive';
import { MyNameDirective } from './directives/name/myName.directive';
import { NullDefaultValueDirective } from './directives/null-default-value.directive';
import { NumberValidatorDirective } from './directives/numberValidator.directive';
import { MyPasswordDirective } from './directives/password/myPassword.directive';
import { StringValidatorDirective } from './directives/stringValidator.directive';
import { MyHealthIdDirective } from './directives/myHealthId/myHealthId.directive';
import { DisableFormControlDirective } from './directives/disableFormControl.directive';
import { DiagnosisSearchDirective } from './directives/provisionalDiagnosis.directive';
import { MatTableModule } from '@angular/material/table';
import { NgChartsModule } from 'ng2-charts';
import { WebcamModule } from 'ngx-webcam';
import { MasterdataService } from '../nurse-doctor/shared/services';
import { RegistrarService } from '../registrar/shared/services/registrar.service';
import { SetLanguageComponent } from './components/set-language.component';
import { ClinicalObservationsDirective } from './directives/clinical-observations.directive';
import { SignificantFindingsDirective } from './directives/significant-findings.directive';
import { ViewRadiologyUploadedFilesComponent } from '../lab/view-radiology-uploaded-files/view-radiology-uploaded-files.component';
import { SharedModule } from './components/shared/shared.module';

@NgModule({
  imports: [
    HttpClientModule,
    CommonModule,
    MaterialModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    UserLoginModule,
    MatGridListModule,
    NgChartsModule,
    WebcamModule,
    MatTableModule,
    SharedModule,
  ],
  declarations: [
    CommonDialogComponent,
    CameraDialogComponent,
    TextareaDialogComponent,
    SpinnerComponent,
    BeneficiaryDetailsComponent,
    PreviousDetailsComponent,
    PreviousImmunizationServiceDetailsComponent,
    MmuRbsDetailsComponent,
    SpecialistLoginComponent,
    ViewRadiologyUploadedFilesComponent,
    DiagnosisSearchComponent,
    MyEmailDirective,
    MyMobileNumberDirective,
    MyHealthIdDirective,
    MyNameDirective,
    MyPasswordDirective,
    ConfirmatoryDiagnosisDirective,
    DisableFormControlDirective,
    NullDefaultValueDirective,
    NumberValidatorDirective,
    DiagnosisSearchDirective,
    SignificantFindingsDirective,
    ClinicalObservationsDirective,
    StringValidatorDirective,
    ShowCommitAndVersionDetailsComponent,
    IotcomponentComponent,
    IotBluetoothComponent,
    AllergenSearchComponent,
    CalibrationComponent,
    HealthIdDisplayModalComponent,
    OpenPreviousVisitDetailsComponent,
  ],
  exports: [
    MaterialModule,
    CommonDialogComponent,
    CameraDialogComponent,
    TextareaDialogComponent,
    SpinnerComponent,
    BeneficiaryDetailsComponent,
    SpecialistLoginComponent,
    DiagnosisSearchComponent,
    PreviousDetailsComponent,
    PreviousImmunizationServiceDetailsComponent,
    MmuRbsDetailsComponent,
    ShowCommitAndVersionDetailsComponent,
    MyEmailDirective,
    MyMobileNumberDirective,
    MyHealthIdDirective,
    MyNameDirective,
    MyPasswordDirective,
    ConfirmatoryDiagnosisDirective,
    DisableFormControlDirective,
    NullDefaultValueDirective,
    NumberValidatorDirective,
    DiagnosisSearchDirective,
    SignificantFindingsDirective,
    ClinicalObservationsDirective,
    StringValidatorDirective,
    IotcomponentComponent,
    IotBluetoothComponent,
    AllergenSearchComponent,
    CalibrationComponent,
    HealthIdDisplayModalComponent,
    OpenPreviousVisitDetailsComponent,
    WebcamModule,
    NgChartsModule,
  ],
})
export class CoreModule {
  static forRoot(): ModuleWithProviders<CoreModule> {
    return {
      ngModule: CoreModule,
      providers: [
        HttpInterceptorService,
        HttpServiceService,
        ConfirmationService,
        CameraService,
        TextareaDialog,
        AuthGuard,
        AppHeaderComponent,
        AuthService,
        SpinnerService,
        BeneficiaryDetailsService,
        CommonService,
        InventoryService,
        CanDeactivateGuardService,
        TelemedicineService,
        IotService,
        HttpServiceService,
        SetLanguageComponent,
        MasterdataService,
        RegistrarService,
      ],
    };
  }
}
