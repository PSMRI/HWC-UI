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
import {
  Component,
  DoCheck,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { DoctorService } from '../shared/services/doctor.service';
import { MasterdataService } from '../shared/services/masterdata.service';
import { NcdScreeningService } from '../shared/services/ncd-screening.service';
import { Subscription } from 'rxjs';
import { ConfirmationService } from '../../core/services';
import { HttpServiceService } from '../../core/services/http-service.service';
import { SetLanguageComponent } from '../../core/components/set-language.component';
import { environment } from 'src/environments/environment';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-screening',
  templateUrl: './screening.component.html',
  styleUrls: ['./screening.component.css'],
})
export class ScreeningComponent
  implements OnChanges, OnInit, DoCheck, OnDestroy
{
  @Input()
  patientMedicalForm!: FormGroup;

  @Input()
  ncdScreeningMode!: string;

  oral = false;
  hypertension = false;
  breast = false;
  diabetes = false;
  cervical = false;
  hypertensionSuspected = false;
  oralSuspected = false;
  breastSuspected = false;
  cervicalSuspected = false;
  diabetesSuspected = false;

  oralScreeningStatusSubscription!: Subscription;
  breastScreeningStatusSubscription!: Subscription;
  cervicalScreeningStatusSubscription!: Subscription;
  hypertensionScreeningStatusSubscription!: Subscription;
  diabetesScreeningStatusSubscription!: Subscription;
  nurseMasterDataSubscription!: Subscription;
  ncdScreeningDiseases: any = [];
  screeningDiseases: any = [];
  confirmDiseaseArray: any = [];
  ncdDataForCbac: any = [];
  currentLanguageSet: any;
  suspectScreeningDiseases: any = [];

  ncdDiabetesData = null;
  ncdHypertensionData = null;
  ncdBreastData = null;
  ncdOralData = null;
  ncdCervicalData = null;

  diabetesScreeningForm!: FormGroup;
  hypertensionScreeningForm!: FormGroup;
  oralCancerForm!: FormGroup;
  breastCancerScreeningForm!: FormGroup;
  cervicalScreeningForm!: FormGroup;
  @Output() screeningValueChanged: EventEmitter<any> = new EventEmitter<any>();
  constructor(
    private ncdScreeningService: NcdScreeningService,
    private doctorService: DoctorService,
    private masterdataService: MasterdataService,
    private confirmationService: ConfirmationService,
    private httpServiceService: HttpServiceService,
    readonly sessionstorage: SessionStorageService,
  ) {}

  ngOnInit(): void {
    this.ncdScreeningService.clearConfirmedDiseasesForScreening();
    this.ncdScreeningService.screeningValueChanged(false);
    this.resetSuspectedDiseases();
    console.log(this.patientMedicalForm);

    this.diabetesScreeningForm = this.patientMedicalForm.get(
      'diabetes',
    ) as FormGroup;
    this.hypertensionScreeningForm = this.patientMedicalForm.get(
      'hypertension',
    ) as FormGroup;
    this.oralCancerForm = this.patientMedicalForm.get('oral') as FormGroup;
    this.breastCancerScreeningForm = this.patientMedicalForm.get(
      'breast',
    ) as FormGroup;
    this.cervicalScreeningForm = this.patientMedicalForm.get(
      'cervical',
    ) as FormGroup;
    this.ncdScreeningService.confirmedDiseasesListCheck$.subscribe(
      (response: any) => {
        if (
          response !== undefined &&
          response !== null &&
          response.length >= 0
        ) {
          this.confirmDiseaseArray = response;
          this.setConfirmedDiseasesForScreening();
        }
      },
    );
    this.assignSelectedLanguage();
    /// Add this boolean value on the ncd screening fetch response - to show the final diagnosis in the case record
    this.ncdScreeningService.fetchCBACResponseFromNurse = true;
    this.getNurseMasterData();
    this.diabetesScreeningStatus();
    this.hypertensionScreeningStatus();
    this.oralScreeningStatus();
    this.breastScreeningStatus();
    this.cervicalScreeningStatus();
    this.getNcdScreeningDataForCbac();
  }
  resetSuspectedDiseases() {
    this.hypertensionSuspected = false;
    this.oralSuspected = false;
    this.breastSuspected = false;
    this.cervicalSuspected = false;
    this.diabetesSuspected = false;
    this.ncdScreeningService.oralSuspectStatus(false);
    this.ncdScreeningService.hypertensionSuspectStatus(false);
    this.ncdScreeningService.diabetesSuspectStatus(false);
    this.ncdScreeningService.cervicalSuspectStatus(false);
    this.ncdScreeningService.breastSuspectStatus(false);
    this.ncdScreeningService.diabetesScreeningValidationOnSave = false;
    this.ncdScreeningService.hypertensionScreeningValidationOnSave = false;
    this.ncdScreeningService.oralScreeningValidationOnSave = false;
    this.ncdScreeningService.breastScreeningValidationOnSave = false;
    this.ncdScreeningService.cervicalScreeningValidationOnSave = false;
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  setConfirmedDiseasesForScreening() {
    if (this.confirmDiseaseArray.length > 0) {
      if (this.confirmDiseaseArray.includes(environment.diabetes)) {
        this.ncdScreeningService.isDiabetesConfirmed = true;
        this.diabetesSuspected = false;
        this.diabetesSuspected === false &&
        this.suspectScreeningDiseases.includes(environment.diabetes)
          ? this.suspectScreeningDiseases.splice(
              this.suspectScreeningDiseases.indexOf(environment.diabetes),
              1,
            )
          : null; // remove badge
      } else {
        this.ncdScreeningService.isDiabetesConfirmed = false;
      }

      if (this.confirmDiseaseArray.includes(environment.hypertension)) {
        this.ncdScreeningService.isHypertensionConfirmed = true;
        this.hypertensionSuspected = false; // remove badge
        this.hypertensionSuspected === false &&
        this.suspectScreeningDiseases.includes(environment.hypertension)
          ? this.suspectScreeningDiseases.splice(
              this.suspectScreeningDiseases.indexOf(environment.hypertension),
              1,
            )
          : null;
      } else {
        this.ncdScreeningService.isHypertensionConfirmed = false;
      }

      if (this.confirmDiseaseArray.includes(environment.oral)) {
        this.ncdScreeningService.isOralConfirmed = true;
        this.oralSuspected = false; // remove badge
        this.oralSuspected === false &&
        this.suspectScreeningDiseases.includes(environment.oral)
          ? this.suspectScreeningDiseases.splice(
              this.suspectScreeningDiseases.indexOf(environment.oral),
              1,
            )
          : null;
      } else {
        this.ncdScreeningService.isOralConfirmed = false;
      }

      if (this.confirmDiseaseArray.includes(environment.cervical)) {
        this.ncdScreeningService.isCervicalConfirmed = true;
        this.cervicalSuspected = false; // remove badge
        this.cervicalSuspected === false &&
        this.suspectScreeningDiseases.includes(environment.cervical)
          ? this.suspectScreeningDiseases.splice(
              this.suspectScreeningDiseases.indexOf(environment.cervical),
              1,
            )
          : null;
      } else {
        this.ncdScreeningService.isCervicalConfirmed = false;
      }

      if (this.confirmDiseaseArray.includes(environment.breast)) {
        this.ncdScreeningService.isBreastConfirmed = true;
        this.breastSuspected = false; // remove badge
        this.breastSuspected === false &&
        this.suspectScreeningDiseases.includes(environment.breast)
          ? this.suspectScreeningDiseases.splice(
              this.suspectScreeningDiseases.indexOf(environment.breast),
              1,
            )
          : null;
      } else {
        this.ncdScreeningService.isBreastConfirmed = false;
      }
    } else {
      this.ncdScreeningService.isDiabetesConfirmed = false;
      this.ncdScreeningService.isHypertensionConfirmed = false;
      this.ncdScreeningService.isBreastConfirmed = false;
      this.ncdScreeningService.isCervicalConfirmed = false;
      this.ncdScreeningService.isOralConfirmed = false;
    }
    this.disableButtonOnConfirmedDiseases();
  }
  ngOnChanges() {
    if (String(this.ncdScreeningMode) === 'update') {
      const visitCategory = this.sessionstorage.getItem('visitCategory');
      this.updateNCDScreeningDataFromDoctor(
        this.patientMedicalForm,
        visitCategory,
      );
    }
  }
  getNcdScreeningDataForCbac() {
    if (String(this.ncdScreeningMode) === 'view') {
      this.doctorService.getNcdScreeningForCbac().subscribe((res: any) => {
        if (
          res.statusCode === 200 &&
          res.data !== null &&
          res.data !== undefined
        ) {
          this.ncdDataForCbac = Object.assign(res.data);
          this.doctorService.screeningDetailsResponseFromNurse = res.data;
          this.ncdDiabetesData = null;
          this.ncdHypertensionData = null;
          this.ncdBreastData = null;
          this.ncdOralData = null;
          this.ncdCervicalData = null;

          if (
            res.data.diabetes !== undefined &&
            res.data.diabetes !== null &&
            res.data.diabetes.bloodGlucoseType !== null &&
            res.data.diabetes.bloodGlucoseType !== undefined
          )
            this.ncdDiabetesData = Object.assign(res.data.diabetes);
          if (
            res.data.hypertension !== undefined &&
            res.data.hypertension !== null &&
            res.data.hypertension.systolicBP_1stReading !== null &&
            res.data.hypertension.systolicBP_1stReading !== undefined
          )
            this.ncdHypertensionData = Object.assign(res.data.hypertension);
          if (
            res.data.breast !== undefined &&
            res.data.breast !== null &&
            res.data.breast.palpationBreasts !== null &&
            res.data.breast.palpationBreasts !== undefined
          )
            this.ncdBreastData = Object.assign(res.data.breast);
          if (
            res.data.oral !== undefined &&
            res.data.oral !== null &&
            res.data.oral.oralCavityFinding !== null &&
            res.data.oral.oralCavityFinding !== undefined
          )
            this.ncdOralData = Object.assign(res.data.oral);
          if (
            res.data.cervical !== undefined &&
            res.data.cervical !== null &&
            res.data.cervical.visualExaminationVIA !== null &&
            res.data.cervical.visualExaminationVIA !== undefined
          )
            this.ncdCervicalData = Object.assign(res.data.cervical);
          this.ncdScreeningService.fetchCBACResponseFromNurse = true;

          this.loadScreeningFormBasedOnFetchResponse();
        }
      });
    }
  }

  loadScreeningFormBasedOnFetchResponse() {
    if (this.ncdDiabetesData !== null && this.ncdDiabetesData !== undefined) {
      this.diabetes = true;
      this.makeButtonAsActive(environment.diabetes);
    }
    if (
      this.ncdHypertensionData !== null &&
      this.ncdHypertensionData !== undefined
    ) {
      this.hypertension = true;
      this.makeButtonAsActive(environment.hypertension);
    }
    if (this.ncdBreastData !== null && this.ncdBreastData !== undefined) {
      this.breast = true;
      this.makeButtonAsActive(environment.breast);
    }
    if (this.ncdOralData !== null && this.ncdOralData !== undefined) {
      this.oral = true;
      this.makeButtonAsActive(environment.oral);
    }
    if (this.ncdCervicalData !== null && this.ncdCervicalData !== undefined) {
      this.cervical = true;
      this.makeButtonAsActive(environment.cervical);
    }
  }

  makeButtonAsActive(disease: any) {
    if (
      this.ncdScreeningDiseases !== undefined &&
      this.ncdScreeningDiseases.length > 0
    ) {
      this.ncdScreeningDiseases.forEach((element: any) => {
        if (
          element.name.toLowerCase().trim() === disease.toLowerCase().trim()
        ) {
          element.active = true;
        }
      });
    }
  }

  getNcdScreeningDataForCbacUpdate() {
    this.doctorService.getNcdScreeningForCbac().subscribe((res: any) => {
      if (
        res.statusCode === 200 &&
        res.data !== null &&
        res.data !== undefined
      ) {
        this.ncdDataForCbac = Object.assign(res.data);
        this.doctorService.screeningDetailsResponseFromNurse = res.data;
        let ncdDiabetesData = null;
        let ncdHypertensionData = null;
        let ncdBreastData = null;
        let ncdOralData = null;
        let ncdCervicalData = null;

        if (
          res.data.diabetes !== undefined &&
          res.data.diabetes !== null &&
          res.data.diabetes.bloodGlucoseType !== null &&
          res.data.diabetes.bloodGlucoseType !== undefined
        )
          ncdDiabetesData = Object.assign(res.data.diabetes);
        if (
          res.data.hypertension !== undefined &&
          res.data.hypertension !== null &&
          res.data.hypertension.systolicBP_1stReading !== null &&
          res.data.hypertension.systolicBP_1stReading !== undefined
        )
          ncdHypertensionData = Object.assign(res.data.hypertension);
        if (
          res.data.breast !== undefined &&
          res.data.breast !== null &&
          res.data.breast.palpationBreasts !== null &&
          res.data.breast.palpationBreasts !== undefined
        )
          ncdBreastData = Object.assign(res.data.breast);
        if (
          res.data.oral !== undefined &&
          res.data.oral !== null &&
          res.data.oral.oralCavityFinding !== null &&
          res.data.oral.oralCavityFinding !== undefined
        )
          ncdOralData = Object.assign(res.data.oral);
        if (
          res.data.cervical !== undefined &&
          res.data.cervical !== null &&
          res.data.cervical.visualExaminationVIA !== null &&
          res.data.cervical.visualExaminationVIA !== undefined
        )
          ncdCervicalData = Object.assign(res.data.cervical);
        this.ncdScreeningService.fetchCBACResponseFromNurse = true;
        if (ncdDiabetesData !== null && ncdDiabetesData !== undefined) {
          this.diabetes = true;
        }
        if (ncdHypertensionData !== null && ncdHypertensionData !== undefined) {
          this.hypertension = true;
        }
        if (ncdBreastData !== null && ncdBreastData !== undefined) {
          this.breast = true;
        }
        if (ncdOralData !== null && ncdOralData !== undefined) {
          this.oral = true;
        }
        if (ncdCervicalData !== null && ncdCervicalData !== undefined) {
          this.cervical = true;
        }

        this.ncdScreeningService.setScreeningDataFetch(true);
      }
    });
  }

  getNurseMasterData() {
    this.nurseMasterDataSubscription =
      this.masterdataService.nurseMasterData$.subscribe((data) => {
        if (data) {
          if (
            data.screeningCondition !== undefined &&
            data.screeningCondition !== null
          ) {
            this.populateScreeningDiseasesBasedOnGender(
              data.screeningCondition,
            );
          } else {
            console.log('Issue in fetching screening condition');
          }
        }
      });
  }

  /* Screening suspect status */
  diabetesScreeningStatus() {
    this.diabetesScreeningStatusSubscription =
      this.ncdScreeningService.diabetesStatus$.subscribe((diabetesstatus) => {
        this.diabetesSuspected = diabetesstatus;
        diabetesstatus === true &&
        !this.suspectScreeningDiseases.includes(environment.diabetes)
          ? this.suspectScreeningDiseases.push(environment.diabetes)
          : null;
        // when remove the form
        diabetesstatus === false &&
        this.suspectScreeningDiseases.includes(environment.diabetes)
          ? this.suspectScreeningDiseases.splice(
              this.suspectScreeningDiseases.indexOf(environment.diabetes),
              1,
            )
          : null;
        this.setConfirmedDiseasesForScreening();
      });
  }
  hypertensionScreeningStatus() {
    this.hypertensionScreeningStatusSubscription =
      this.ncdScreeningService.hypertensionStatus$.subscribe(
        (hypertensionstatus) => {
          this.hypertensionSuspected = hypertensionstatus;
          hypertensionstatus === true &&
          !this.suspectScreeningDiseases.includes(environment.hypertension)
            ? this.suspectScreeningDiseases.push(environment.hypertension)
            : null;
          // when remove the form
          hypertensionstatus === false &&
          this.suspectScreeningDiseases.includes(environment.hypertension)
            ? this.suspectScreeningDiseases.splice(
                this.suspectScreeningDiseases.indexOf(environment.hypertension),
                1,
              )
            : null;
          this.setConfirmedDiseasesForScreening();
        },
      );
  }
  oralScreeningStatus() {
    this.oralScreeningStatusSubscription =
      this.ncdScreeningService.oralStatus$.subscribe((oralstatus) => {
        this.oralSuspected = oralstatus;
        oralstatus === true &&
        !this.suspectScreeningDiseases.includes(environment.oral)
          ? this.suspectScreeningDiseases.push(environment.oral)
          : null;
        // when remove the form
        oralstatus === false &&
        this.suspectScreeningDiseases.includes(environment.oral)
          ? this.suspectScreeningDiseases.splice(
              this.suspectScreeningDiseases.indexOf(environment.oral),
              1,
            )
          : null;
        this.setConfirmedDiseasesForScreening();
      });
  }
  breastScreeningStatus() {
    this.breastScreeningStatusSubscription =
      this.ncdScreeningService.breastStatus$.subscribe((breaststatus) => {
        this.breastSuspected = breaststatus;
        breaststatus === true &&
        !this.suspectScreeningDiseases.includes(environment.breast)
          ? this.suspectScreeningDiseases.push(environment.breast)
          : null;
        // when remove the form
        breaststatus === false &&
        this.suspectScreeningDiseases.includes(environment.breast)
          ? this.suspectScreeningDiseases.splice(
              this.suspectScreeningDiseases.indexOf(environment.breast),
              1,
            )
          : null;
        this.setConfirmedDiseasesForScreening();
      });
  }
  cervicalScreeningStatus() {
    this.cervicalScreeningStatusSubscription =
      this.ncdScreeningService.cervicalStatus$.subscribe((cervicalstatus) => {
        this.cervicalSuspected = cervicalstatus;
        cervicalstatus === true &&
        !this.suspectScreeningDiseases.includes(environment.cervical)
          ? this.suspectScreeningDiseases.push(environment.cervical)
          : null;
        // when remove the form
        cervicalstatus === false &&
        this.suspectScreeningDiseases.includes(environment.cervical)
          ? this.suspectScreeningDiseases.splice(
              this.suspectScreeningDiseases.indexOf(environment.cervical),
              1,
            )
          : null;
        this.setConfirmedDiseasesForScreening();
      });
  }
  /* Ends */
  redirectToScreeningPage(disease: any) {
    if (
      disease.name.toLowerCase().trim() ===
      environment.diabetes.toLowerCase().trim()
    ) {
      if (this.ncdScreeningService.isDiabetesConfirmed === true) {
        this.diabetes = false;
        this.ncdScreeningService.diabetesScreeningValidationOnSave = false;
      } else {
        this.ncdScreeningService.diabetesScreeningValidationOnSave = true;
        this.diabetes = true;
        disease.active = true;
      }
    } else if (
      disease.name.toLowerCase().trim() ===
      environment.hypertension.toLowerCase().trim()
    ) {
      if (this.ncdScreeningService.isHypertensionConfirmed === true) {
        this.hypertension = false;
        this.ncdScreeningService.hypertensionScreeningValidationOnSave = false;
      } else {
        this.hypertension = true;
        this.ncdScreeningService.hypertensionScreeningValidationOnSave = true;
        disease.active = true;
      }
    } else if (
      disease.name.toLowerCase().trim() ===
      environment.oral.toLowerCase().trim()
    ) {
      if (this.ncdScreeningService.isOralConfirmed === true) {
        this.oral = false;
        this.ncdScreeningService.oralScreeningValidationOnSave = false;
      } else {
        this.oral = true;
        this.ncdScreeningService.oralScreeningValidationOnSave = true;
        disease.active = true;
      }
    } else if (
      disease.name.toLowerCase().trim() ===
      environment.breast.toLowerCase().trim()
    ) {
      if (this.ncdScreeningService.isBreastConfirmed === true) {
        this.breast = false;
        this.ncdScreeningService.breastScreeningValidationOnSave = false;
      } else {
        this.breast = true;
        this.ncdScreeningService.breastScreeningValidationOnSave = true;
        disease.active = true;
      }
    } else if (
      disease.name.toLowerCase().trim() ===
      environment.cervical.toLowerCase().trim()
    ) {
      if (this.ncdScreeningService.isCervicalConfirmed === true) {
        this.cervical = false;
        this.ncdScreeningService.cervicalScreeningValidationOnSave = false;
      } else {
        this.cervical = true;
        this.ncdScreeningService.cervicalScreeningValidationOnSave = true;
        disease.active = true;
      }
    }
  }
  populateScreeningDiseasesBasedOnGender(screeningDiseases: any) {
    this.ncdScreeningDiseases = [];
    screeningDiseases.forEach((disease: any) => {
      if (this.sessionstorage.getItem('beneficiaryGender') === 'Male') {
        if (
          disease.name.toLowerCase().trim() !==
            environment.breast.toLowerCase().trim() &&
          disease.name.toLowerCase().trim() !==
            environment.cervical.toLowerCase().trim()
        ) {
          disease.active = false;
          this.ncdScreeningDiseases.push(disease);
        }
      } else {
        disease.active = false;
        this.ncdScreeningDiseases.push(disease);
      }
    });
    if (String(this.ncdScreeningMode) === 'view') {
      this.loadScreeningFormBasedOnFetchResponse();
    }
  }

  makeButtonInactive(disease: any) {
    if (
      this.ncdScreeningDiseases !== undefined &&
      this.ncdScreeningDiseases.length > 0
    ) {
      this.ncdScreeningDiseases.forEach((element: any) => {
        if (
          element.name.trim().toLowerCase() === disease.trim().toLowerCase() &&
          element.active === true
        )
          element.active = false;
      });
    }
  }
  disableButtonOnConfirmedDiseases() {
    this.ncdScreeningDiseases.forEach((screeningDisease: any) => {
      if (
        screeningDisease.name.toLowerCase().trim() ===
          environment.diabetes.toLowerCase().trim() &&
        this.ncdScreeningService.isDiabetesConfirmed === true
      ) {
        screeningDisease.disable = true;
      } else if (
        screeningDisease.name.toLowerCase().trim() ===
          environment.hypertension.toLowerCase().trim() &&
        this.ncdScreeningService.isHypertensionConfirmed === true
      ) {
        screeningDisease.disable = true;
      } else if (
        screeningDisease.name.toLowerCase().trim() ===
          environment.oral.toLowerCase().trim() &&
        this.ncdScreeningService.isOralConfirmed === true
      ) {
        screeningDisease.disable = true;
      } else if (
        screeningDisease.name.toLowerCase().trim() ===
          environment.breast.toLowerCase().trim() &&
        this.ncdScreeningService.isBreastConfirmed === true
      ) {
        screeningDisease.disable = true;
      } else if (
        screeningDisease.name.toLowerCase().trim() ===
          environment.cervical.toLowerCase().trim() &&
        this.ncdScreeningService.isCervicalConfirmed === true
      ) {
        screeningDisease.disable = true;
      } else {
        screeningDisease.disable = false;
      }
    });
  }

  /* Screening form status*/
  getDiabetesFormStatus(formstatus: any) {
    this.diabetes = formstatus;
    this.ncdScreeningService.diabetesScreeningValidationOnSave = formstatus;
    if (!formstatus) this.makeButtonInactive(environment.diabetes);
  }
  getHypertensionFormStatus(formstatus: any) {
    this.hypertension = formstatus;
    this.ncdScreeningService.hypertensionScreeningValidationOnSave = formstatus;
    if (!formstatus) this.makeButtonInactive(environment.hypertension);
  }
  getOralFormStatus(oralStatus: any) {
    this.oral = oralStatus;
    this.ncdScreeningService.oralScreeningValidationOnSave = oralStatus;
    if (!oralStatus) this.makeButtonInactive(environment.oral);
  }
  getBreastFormStatus(formstatus: any) {
    this.breast = formstatus;
    this.ncdScreeningService.breastScreeningValidationOnSave = formstatus;
    if (!formstatus) this.makeButtonInactive(environment.breast);
  }
  getCervicalFormStatus(formstatus: any) {
    this.cervical = formstatus;
    this.ncdScreeningService.cervicalScreeningValidationOnSave = formstatus;
    if (!formstatus) this.makeButtonInactive(environment.cervical);
  }
  /* Ends */

  updateNCDScreeningDataFromDoctor(medicalForm: any, visitCategory: any) {
    this.doctorService
      .updateNCDSreeningDetails(medicalForm, visitCategory)
      .subscribe(
        (response: any) => {
          if (response.statusCode === 200 && response.data !== null) {
            this.confirmationService.alert(response.data.response, 'success');
            this.ncdScreeningService.screeningValueChanged(false);
            this.getNcdScreeningDataForCbacUpdate();
            medicalForm.markAsPristine();
          } else {
            this.confirmationService.alert(response.errorMessage, 'error');
          }
        },
        (err) => {
          this.confirmationService.alert(err, 'error');
        },
      );
  }
  ngOnDestroy() {
    this.confirmDiseaseArray = [];
    this.hypertensionSuspected = false;
    this.oralSuspected = false;
    this.breastSuspected = false;
    this.cervicalSuspected = false;
    this.diabetesSuspected = false;
    if (this.oralScreeningStatusSubscription)
      this.oralScreeningStatusSubscription.unsubscribe();
    if (this.breastScreeningStatusSubscription)
      this.breastScreeningStatusSubscription.unsubscribe();
    if (this.cervicalScreeningStatusSubscription)
      this.cervicalScreeningStatusSubscription.unsubscribe();
    if (this.hypertensionScreeningStatusSubscription)
      this.hypertensionScreeningStatusSubscription.unsubscribe();
    if (this.diabetesScreeningStatusSubscription)
      this.diabetesScreeningStatusSubscription.unsubscribe();
  }
}
