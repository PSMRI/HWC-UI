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
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CoreModule } from '../core/core.module';
import { NurseDoctorRoutingModule } from './nurse-doctor-routing.module';
import { DoctorWorklistComponent } from './doctor-worklist/doctor-worklist.component';
import { BirthImmunizationHistoryComponent } from './birth-immunization-history/birth-immunization-history.component';
import { FormImmunizationHistoryComponent } from './birth-immunization-history/form-immunization-history/form-immunization-history.component';
import { InfantBirthDetailsComponent } from './birth-immunization-history/infant-birth-details/infant-birth-details.component';
import { AncCaseSheetComponent } from './case-sheet/general-case-sheet/anc-case-sheet/anc-case-sheet.component';
import { CaseSheetComponent } from './case-sheet/case-sheet.component';
import { ChildAndAdolescentOralVitaminACaseSheetComponent } from './case-sheet/general-case-sheet/child-and-adolescent-oral-vitamin-a-case-sheet/child-and-adolescent-oral-vitamin-a-case-sheet.component';
import { NurseService } from './shared/services/nurse.service';
import { DoctorService, MasterdataService } from './shared/services';
import { ExaminationCaseSheetComponent } from './case-sheet/general-case-sheet/examination-case-sheet/examination-case-sheet.component';
import { MaterialModule } from '../core/material.module';
import { Nurse104RefferedWorklistComponent } from './nurse-worklist-wrapper/nurse-104-reffered-worklist/nurse-104-reffered-worklist.component';
import { NurseMmuTmReferredWorklistComponent } from './nurse-worklist-wrapper/nurse-mmu-tm-referred-worklist/nurse-mmu-tm-referred-worklist.component';
import { NurseTmFutureWorklistComponent } from './nurse-worklist-wrapper/nurse-tm-future-worklist/nurse-tm-future-worklist.component';
import { NurseTmWorklistComponent } from './nurse-worklist-wrapper/nurse-tm-worklist/nurse-tm-worklist.component';
import { NurseWorklistWrapperComponent } from './nurse-worklist-wrapper/nurse-worklist-wrapper.component';
import { NurseWorklistComponent } from './nurse-worklist-wrapper/nurse-worklist/nurse-worklist.component';
import { NcdScreeningService } from './shared/services/ncd-screening.service';
import { Referred104WorkareaComponent } from './workarea/referred-104-workarea/referred-104-workarea.component';
import { WorkareaComponent } from './workarea/workarea.component';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { VisitDetailsComponent } from './visit-details/visit-details.component';
import { PatientVisitDetailsComponent } from './visit-details/visit-details/visit-details.component';
import { CbacComponent } from './visit-details/cbac/cbac.component';
import { AdherenceComponent } from './visit-details/adherence/adherence.component';
import { ChiefComplaintsComponent } from './visit-details/chief-complaints/chief-complaints.component';
import { ContactHistoryComponent } from './visit-details/contact-history/contact-history.component';
import { CovidVaccinationStatusComponent } from './visit-details/covid-vaccination-status/covid-vaccination-status.component';
import { DiseaseconfirmationComponent } from './visit-details/diseaseconfirmation/diseaseconfirmation.component';
import { InvestigationsComponent } from './visit-details/investigations/investigations.component';
import { SymptomsComponent } from './visit-details/symptoms/symptoms.component';
import { TravelHistoryComponent } from './visit-details/travel-history/travel-history.component';
import { UploadFilesComponent } from './visit-details/upload-files/upload-files.component';
import { IdrsscoreService } from './shared/services/idrsscore.service';
import { DispensationDetailsComponent } from './family-planning/dispensation-details/dispensation-details.component';
import { FamilyPlanningAndReproductiveComponent } from './family-planning/family-planning-and-reproductive-details/family-planning-and-reproductive-details.component';
import { FamilyPlanningComponent } from './family-planning/family-planning.component';
import { IecAndCounsellingComponent } from './family-planning/iec-and-counselling-details/iec-and-counselling-details.component';
import { AncDetailsComponent } from './anc/anc-details/anc-details.component';
import { AncImmunizationComponent } from './anc/anc-immunization/anc-immunization.component';
import { AncComponent } from './anc/anc.component';
import { ObstetricFormulaComponent } from './anc/obstetric-formula/obstetric-formula.component';
import { PncComponent } from './pnc/pnc.component';
import { ChildhoodOralVitaminComponent } from './immunization-service/childhood-oral-vitamin/childhood-oral-vitamin.component';
import { ImmunizationServiceComponent } from './immunization-service/immunization-service.component';
import { NeonatalImmunizationServiceComponent } from './immunization-service/neonatal-immunization-service/neonatal-immunization-service.component';
import { GeneralPatientVitalsComponent } from './vitals/general-patient-vitals/general-patient-vitals.component';
import { NeonatalPatientVitalsComponent } from './vitals/neonatal-patient-vitals/neonatal-patient-vitals.component';
import { VitalsComponent } from './vitals/vitals.component';
import { TestInVitalsService } from './shared/services/test-in-vitals.service';
import { TcSpecialistWorklistComponent } from './tc-specialist-worklist/tc-specialist-worklist.component';
import { TmFutureWorklistComponent } from './doctor-tm-future-worklist/tm-future-worklist.component';
import { DoctorTmWorklistWrapperComponent } from './doctor-tm-worklist-wrapper/doctor-tm-worklist-wrapper.component';
import { SchedulerComponent } from './scheduler/scheduler.component';
import { TcSpecialistFutureWorklistComponent } from './tc-specialist-future-worklist/tc-specialist-future-worklist.component';
import { TcSpecialistWorklistWrapperComponent } from './tc-specialist-worklist-wrapper/tc-specialist-worklist-wrapper.component';
import { OncologistWorklistComponent } from './oncologist-worklist/oncologist-worklist.component';
import { RadiologistWorklistComponent } from './radiologist-worklist/radiologist-worklist.component';
import { CdssFormComponent } from './cdss/cdss-form/cdss-form.component';
import { CdssFormResultPopupComponent } from './cdss/cdss-form-result-popup/cdss-form-result-popup.component';
import { CDSSService } from './shared/services/cdss-service';
import { DiseaseFormComponent } from './cdss/diseaseSummary/diseaseSummary.component';
import { ViewDiseaseSummaryDetailsComponent } from './cdss/viewDiseaseSummaryDetails/viewDiseaseSummaryDet.component';
import { HistoryComponent } from './history/history.component';
import { GeneralOpdHistoryComponent } from './history/general-opd-history/general-opd-history.component';
import { GeneralPersonalHistoryComponent } from './history/general-opd-history/personal-history/personal-history.component';
import { PastHistoryComponent } from './history/general-opd-history/past-history/past-history.component';
import { PhysicalActivityHistoryComponent } from './history/general-opd-history/physical-activity-history/physical-activity-history.component';
import { DevelopmentHistoryComponent } from './history/general-opd-history/development-history/development-history.component';
import { FamilyHistoryNcdscreeningComponent } from './history/general-opd-history/family-history-ncdscreening/family-history-ncdscreening.component';
import { FeedingHistoryComponent } from './history/general-opd-history/feeding-history/feeding-history.component';
import { MedicationHistoryComponent } from './history/general-opd-history/medication-history/medication-history.component';
import { FamilyHistoryComponent } from './history/general-opd-history/family-history/family-history.component';
import { ComorbidityConcurrentConditionsComponent } from './history/general-opd-history/comorbidity-concurrent-conditions/comorbidity-concurrent-conditions.component';
import { MenstrualHistoryComponent } from './history/general-opd-history/menstrual-history/menstrual-history.component';
import { PerinatalHistoryComponent } from './history/general-opd-history/perinatal-history/perinatal-history.component';
import { PastObstericHistoryComponent } from './history/general-opd-history/past-obsteric-history/past-obsteric-history.component';
import { ImmunizationHistoryComponent } from './history/general-opd-history/immunization-history/immunization-history.component';
import { OtherVaccinesComponent } from './history/general-opd-history/other-vaccines/other-vaccines.component';
import { BreastCancerScreeningComponent } from './screening/breast-cancer-screening/breast-cancer-screening.component';
import { CervicalCancerScreeningComponent } from './screening/cervical-cancer-screening/cervical-cancer-screening.component';
import { DiabetesScreeningComponent } from './screening/diabetes-screening/diabetes-screening.component';
import { HypertensionScreeningComponent } from './screening/hypertension-screening/hypertension-screening.component';
import { OralCancerScreeningComponent } from './screening/oral-cancer-screening/oral-cancer-screening.component';
import { ScreeningComponent } from './screening/screening.component';
import { IdrsComponent } from './idrs/idrs.component';
import { ExaminationComponent } from './examination/examination.component';
import { GeneralExaminationComponent } from './examination/general-opd-examination/general-examination/general-examination.component';
import { GeneralOpdExaminationComponent } from './examination/general-opd-examination/general-opd-examination.component';
import { HeadToToeExaminationComponent } from './examination/general-opd-examination/head-to-toe-examination/head-to-toe-examination.component';
import { CardioVascularSystemComponent } from './examination/general-opd-examination/systemic-examination/cardio-vascular-system/cardio-vascular-system.component';
import { CentralNervousSystemComponent } from './examination/general-opd-examination/systemic-examination/central-nervous-system/central-nervous-system.component';
import { GastroIntestinalSystemComponent } from './examination/general-opd-examination/systemic-examination/gastro-intestinal-system/gastro-intestinal-system.component';
import { GenitoUrinarySystemComponent } from './examination/general-opd-examination/systemic-examination/genito-urinary-system/genito-urinary-system.component';
import { MusculoskeletalSystemComponent } from './examination/general-opd-examination/systemic-examination/musculoskeletal-system/musculoskeletal-system.component';
import { ObstetricExaminationComponent } from './examination/general-opd-examination/systemic-examination/obstetric-examination/obstetric-examination.component';
import { RespiratorySystemComponent } from './examination/general-opd-examination/systemic-examination/respiratory-system/respiratory-system.component';
import { SystemicExaminationComponent } from './examination/general-opd-examination/systemic-examination/systemic-examination.component';
import { GeneralOralExaminationComponent } from './examination/general-opd-examination/general-oral-examination/general-oral-examination.component';
import { BeneficiaryMctsCallHistoryComponent } from './case-record/beneficiary-mcts-call-history/beneficiary-mcts-call-history.component';
import { BeneficiaryPlatformHistoryComponent } from './case-record/beneficiary-platform-history/beneficiary-platform-history.component';
import { CaseRecordComponent } from './case-record/case-record.component';
import { AncDiagnosisComponent } from './case-record/general-case-record/diagnosis/anc-diagnosis/anc-diagnosis.component';
import { CovidDiagnosisComponent } from './case-record/general-case-record/diagnosis/covid-diagnosis/covid-diagnosis.component';
import { DiagnosisComponent } from './case-record/general-case-record/diagnosis/diagnosis.component';
import { GeneralOpdDiagnosisComponent } from './case-record/general-case-record/diagnosis/general-opd-diagnosis/general-opd-diagnosis.component';
import { NcdCareDiagnosisComponent } from './case-record/general-case-record/diagnosis/ncd-care-diagnosis/ncd-care-diagnosis.component';
import { NcdScreeningDiagnosisComponent } from './case-record/general-case-record/diagnosis/ncd-screening-diagnosis/ncd-screening-diagnosis.component';
import { PncDiagnosisComponent } from './case-record/general-case-record/diagnosis/pnc-diagnosis/pnc-diagnosis.component';
import { DoctorInvestigationsComponent } from './case-record/general-case-record/doctor-investigations/doctor-investigations.component';
import { FindingsComponent } from './case-record/general-case-record/findings/findings.component';
import { GeneralCaseRecordComponent } from './case-record/general-case-record/general-case-record.component';
import { PrescriptionComponent } from './case-record/general-case-record/prescription/prescription.component';
import { PreviousSignificiantFindingsComponent } from './case-record/general-case-record/previous-significiant-findings/previous-significiant-findings.component';
import { PreviousVisitDetailsComponent } from './case-record/general-case-record/previous-visit-details/previous-visit-details.component';
import { TestAndRadiologyComponent } from './case-record/general-case-record/test-and-radiology/test-and-radiology.component';
import { ViewTestReportComponent } from './case-record/general-case-record/test-and-radiology/view-test-report/view-test-report.component';
import { TreatmentsOnSideEffectsComponent } from './case-record/general-case-record/treatments-on-side-effects/treatments-on-side-effects.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { GeneralReferComponent } from './refer/general-refer/general-refer.component';
import { ReferComponent } from './refer/refer.component';
import { LabService } from '../lab/shared/services';
import { RegistrarService } from '../registrar/shared/services/registrar.service';
import { WorkareaCanActivate } from './workarea/workarea-can-activate.service';
import { PncCaseSheetComponent } from './case-sheet/general-case-sheet/pnc-case-sheet/pnc-case-sheet.component';
import { DoctorDiagnosisCaseSheetComponent } from './case-sheet/general-case-sheet/doctor-diagnosis-case-sheet/doctor-diagnosis-case-sheet.component';
import { HistoryCaseSheetComponent } from './case-sheet/general-case-sheet/history-case-sheet/history-case-sheet.component';
import { VisitDeatilsCaseSheetComponent } from './case-sheet/general-case-sheet/visit-details-case-sheet/visit-details-case-sheet.component';
import { FamilyPlanningCaseSheetComponent } from './case-sheet/general-case-sheet/family-planning-case-sheet/family-planning-case-sheet.component';
import { NeonatalAndInfantServiceCaseSheetComponent } from './case-sheet/general-case-sheet/neonatal-and-infant-service-case-sheet/neonatal-and-infant-service-case-sheet.component';
import { ScreeningCaseSheetComponent } from './case-sheet/general-case-sheet/screening-case-sheet/screening-case-sheet.component';
import { PrintPageSelectComponent } from './print-page-select/print-page-select.component';
import { GeneralCaseSheetComponent } from './case-sheet/general-case-sheet/general-case-sheet.component';
import { FollowUpForImmunizationComponent } from './follow-up-for-immunization/follow-up-for-immunization.component';
import { QuickConsultComponent } from './quick-consult/quick-consult.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { FamilyTaggingService } from '../registrar/shared/services/familytagging.service';
import { Referred104BeneficiaryDetailsComponent } from './cdss/referred-104-beneficiary-details/referred-104-beneficiary-details.component';
import { Cdss104FormComponent } from './cdss/cdss-form-104/cdss-form.component';
import { Referred104CdssDetailsComponent } from './cdss/referred-104-cdss-details/referred-104-cdss-details.component';
import { Referred104DetailsPopupComponent } from './cdss/referred-104-details-popup/referred-104-details-popup.component';
import { SharedModule } from '../core/components/shared/shared.module';
import { AutocompleteScrollerDirective } from './shared/utility/autocomplete-scroller.directive';

@NgModule({
  imports: [
    CommonModule,
    NurseDoctorRoutingModule,
    CoreModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    MatTableModule,
    MatChipsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    NgxPaginationModule,
    SharedModule,
  ],
  declarations: [
    NurseWorklistComponent,
    PatientVisitDetailsComponent,
    PrintPageSelectComponent,
    QuickConsultComponent,
    ObstetricExaminationComponent,
    GenitoUrinarySystemComponent,
    CentralNervousSystemComponent,
    MusculoskeletalSystemComponent,
    RespiratorySystemComponent,
    GastroIntestinalSystemComponent,
    CardioVascularSystemComponent,
    SystemicExaminationComponent,
    HeadToToeExaminationComponent,
    GeneralExaminationComponent,
    GeneralOpdExaminationComponent,
    GeneralPatientVitalsComponent,
    MedicationHistoryComponent,
    DevelopmentHistoryComponent,
    FeedingHistoryComponent,
    OtherVaccinesComponent,
    ImmunizationHistoryComponent,
    PastObstericHistoryComponent,
    PerinatalHistoryComponent,
    MenstrualHistoryComponent,
    FamilyHistoryComponent,
    ComorbidityConcurrentConditionsComponent,
    GeneralPersonalHistoryComponent,
    PastHistoryComponent,
    GeneralOpdHistoryComponent,
    DoctorWorklistComponent,
    AncComponent,
    AncDetailsComponent,
    AncImmunizationComponent,
    ObstetricFormulaComponent,
    VisitDetailsComponent,
    ChiefComplaintsComponent,
    AdherenceComponent,
    TravelHistoryComponent,
    SymptomsComponent,
    ContactHistoryComponent,
    InvestigationsComponent,
    UploadFilesComponent,
    HistoryComponent,
    ExaminationComponent,
    VitalsComponent,
    CaseRecordComponent,
    PncComponent,
    DashboardComponent,
    WorkareaComponent,
    GeneralCaseRecordComponent,
    GeneralReferComponent,
    GeneralCaseSheetComponent,
    ReferComponent,
    PreviousVisitDetailsComponent,
    FindingsComponent,
    DiagnosisComponent,
    PrescriptionComponent,
    DoctorInvestigationsComponent,
    TestAndRadiologyComponent,
    RadiologistWorklistComponent,
    OncologistWorklistComponent,
    GeneralOpdDiagnosisComponent,
    AncDiagnosisComponent,
    CaseSheetComponent,
    NcdCareDiagnosisComponent,
    PncDiagnosisComponent,
    PreviousSignificiantFindingsComponent,
    ViewTestReportComponent,
    HistoryCaseSheetComponent,
    ExaminationCaseSheetComponent,
    AncCaseSheetComponent,
    PncCaseSheetComponent,
    DoctorDiagnosisCaseSheetComponent,
    BeneficiaryMctsCallHistoryComponent,
    BeneficiaryPlatformHistoryComponent,
    TcSpecialistWorklistComponent,
    DoctorTmWorklistWrapperComponent,
    TmFutureWorklistComponent,
    SchedulerComponent,
    TcSpecialistWorklistWrapperComponent,
    TcSpecialistFutureWorklistComponent,
    NurseWorklistWrapperComponent,
    NurseTmWorklistComponent,
    NurseTmFutureWorklistComponent,
    CovidDiagnosisComponent,
    IdrsComponent,
    PhysicalActivityHistoryComponent,
    FamilyHistoryNcdscreeningComponent,
    NcdScreeningDiagnosisComponent,
    NurseMmuTmReferredWorklistComponent,
    DiseaseconfirmationComponent,
    CovidVaccinationStatusComponent,
    DiabetesScreeningComponent,
    OralCancerScreeningComponent,
    ScreeningComponent,
    CbacComponent,
    HypertensionScreeningComponent,
    BreastCancerScreeningComponent,
    CervicalCancerScreeningComponent,
    ScreeningCaseSheetComponent,
    GeneralOralExaminationComponent,
    FamilyPlanningComponent,
    DispensationDetailsComponent,
    FamilyPlanningAndReproductiveComponent,
    IecAndCounsellingComponent,
    TreatmentsOnSideEffectsComponent,
    FamilyPlanningCaseSheetComponent,
    VisitDeatilsCaseSheetComponent,
    NeonatalImmunizationServiceComponent,
    NeonatalPatientVitalsComponent,
    BirthImmunizationHistoryComponent,
    InfantBirthDetailsComponent,
    FormImmunizationHistoryComponent,
    FollowUpForImmunizationComponent,
    NeonatalAndInfantServiceCaseSheetComponent,
    ChildAndAdolescentOralVitaminACaseSheetComponent,
    ChildhoodOralVitaminComponent,
    ImmunizationServiceComponent,
    Nurse104RefferedWorklistComponent,
    Referred104CdssDetailsComponent,
    Referred104DetailsPopupComponent,
    Referred104WorkareaComponent,
    Referred104CdssDetailsComponent,
    CdssFormComponent,
    DiseaseFormComponent,
    Cdss104FormComponent,
    ViewDiseaseSummaryDetailsComponent,
    CdssFormResultPopupComponent,
    Referred104BeneficiaryDetailsComponent,
    AutocompleteScrollerDirective,
  ],

  providers: [
    NurseService,
    DoctorService,
    MasterdataService,
    NcdScreeningService,
    IdrsscoreService,
    LabService,
    RegistrarService,
    WorkareaCanActivate,
    TestInVitalsService,
    FamilyTaggingService,
    CDSSService,
  ],
})
export class NurseDoctorModule {}
