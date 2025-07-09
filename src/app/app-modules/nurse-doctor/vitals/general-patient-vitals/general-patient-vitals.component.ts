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
import { Component, OnInit, Input, OnChanges, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { BeneficiaryDetailsService } from '../../../core/services/beneficiary-details.service';
import { NurseService, DoctorService } from '../../shared/services';
import { IdrsscoreService } from '../../shared/services/idrsscore.service';
import { TestInVitalsService } from '../../shared/services/test-in-vitals.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { NcdScreeningService } from '../../shared/services/ncd-screening.service';
import { HrpService } from '../../shared/services/hrp.service';
import { environment } from 'src/environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { MmuRbsDetailsComponent } from 'src/app/app-modules/core/components/mmu-rbs-details/mmu-rbs-details.component';
import { IotcomponentComponent } from 'src/app/app-modules/core/components/iotcomponent/iotcomponent.component';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { AmritTrackingService } from 'Common-UI/src/tracking';

@Component({
  selector: 'app-nurse-general-patient-vitals',
  templateUrl: './general-patient-vitals.component.html',
  styleUrls: ['./general-patient-vitals.component.css'],
})
export class GeneralPatientVitalsComponent
  implements OnChanges, OnInit, OnDestroy
{
  @Input()
  patientVitalsForm!: FormGroup;

  @Input()
  mode!: string;

  @Input()
  visitCategory!: string;

  female: any;
  BMI: any;
  hideForANCAndQC = true;
  showGlucoseQC = false;

  startWeightTest = environment.startWeighturl;
  startTempTest = environment.startTempurl;
  startPulseTest = environment.startPulseurl;
  startRBSTest = environment.startRBSurl;
  startBPTest = environment.startBPurl;
  startBloodGlucose = environment.startBloodGlucoseurl;
  currentLanguageSet: any;
  doctorScreen = false;
  IDRSWaistScore: any;
  male = false;
  ncdTemperature = false;
  enableLungAssessment = false;
  bmiStatusMinor: any;
  totalMonths!: number;
  benAge: any;
  rbsSelectedInInvestigation = false;
  rbsSelectedInInvestigationSubscription: any;
  referredVisitcode: any;
  attendant: any;
  rbsResult: any;
  rbsRemarks: any;
  diabetesSelected = 0;
  rbsPopup = false;
  rbsCheckBox = true;
  hideVitalsFormForNcdScreening = true;
  disablingVitalsSectionSubscription!: Subscription;
  enableCBACForm = false;
  benGenderType: any;

  constructor(
    private dialog: MatDialog,
    private confirmationService: ConfirmationService,
    private doctorService: DoctorService,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    public httpServiceService: HttpServiceService,
    private idrsscore: IdrsscoreService,
    private nurseService: NurseService,
    private hrpService: HrpService,
    private testInVitalsService: TestInVitalsService,
    private route: ActivatedRoute,
    private ncdScreeningService: NcdScreeningService,
    readonly sessionstorage: SessionStorageService,
    private trackingService: AmritTrackingService,
  ) {}

  ngOnInit() {
    this.hrpService.setHeightFromVitals(null);
    this.hrpService.setHemoglobinValue(null);
    this.nurseService.clearEnableLAssessment();
    this.ncdScreeningService.enablingIdrs$.subscribe((response) => {
      if (response === false) {
        this.enableCBACForm = false;
      } else {
        this.enableCBACForm = true;
      }
    });
    this.hideVitalsFormForNcdScreening = true;
    this.hideVitalsForm();
    this.rbsPopup = false;
    this.rbsCheckBox = true;
    this.ncdTemperature = false;
    this.nurseService.clearNCDTemp();
    this.nurseService.clearRbsSelectedInInvestigation();
    this.idrsscore.clearDiabetesSelected();
    this.doctorService.setValueToEnableVitalsUpdateButton(false);
    this.nurseService.ncdTemp$.subscribe((response) =>
      response === undefined
        ? (this.ncdTemperature = false)
        : (this.ncdTemperature = response),
    );

    this.httpServiceService.currentLangugae$.subscribe(
      (response) => (this.currentLanguageSet = response),
    );
    this.attendant = this.route.snapshot.params['attendant'];
    this.getBeneficiaryDetails();
    this.rbsSelectedInInvestigationSubscription =
      this.nurseService.rbsSelectedInInvestigation$.subscribe((response) =>
        response === undefined
          ? (this.rbsSelectedInInvestigation = false)
          : (this.rbsSelectedInInvestigation = response),
      );
    if (this.sessionstorage.getItem('mmuReferredVisitCode')) {
      this.referredVisitcode = this.sessionstorage.getItem(
        'mmuReferredVisitCode',
      );
    } else if (this.sessionstorage.getItem('referredVisitCode')) {
      this.referredVisitcode = this.sessionstorage.getItem('referredVisitCode');
    } else {
      this.referredVisitcode = 'undefined';
    }

    this.idrsscore.diabetesSelectedFlag$.subscribe(
      (response) => (this.diabetesSelected = response),
    );
    this.getGender();
  }

  hideVitalsForm() {
    if (this.visitCategory === 'NCD screening') {
      this.disablingVitalsSectionSubscription =
        this.ncdScreeningService.enablingScreeningDiseases$.subscribe(
          (response) => {
            if (response === false) {
              this.hideVitalsFormForNcdScreening = false;
            } else {
              this.hideVitalsFormForNcdScreening = true;
            }
          },
        );
    }
  }

  ngOnChanges() {
    const visitCategory1 = this.sessionstorage.getItem('visitCategory');
    console.log('page54' + visitCategory1);
    if (this.visitCategory === 'General OPD (QC)') {
      this.hideForANCAndQC = false;
      this.showGlucoseQC = false;
    } else {
      this.hideForANCAndQC = true;
      this.showGlucoseQC = true;
    }

    if (String(this.mode) === 'view') {
      const visitID = this.sessionstorage.getItem('visitID');
      const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
      this.getGeneralVitalsData();
      this.doctorScreen = true;
    }

    const specialistFlagString = this.sessionstorage.getItem('specialistFlag');

    if (
      specialistFlagString !== null &&
      parseInt(specialistFlagString) === 100
    ) {
      const visitID = this.sessionstorage.getItem('visitID');
      const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
      this.getGeneralVitalsData();
    }

    if (String(this.mode) === 'update') {
      this.doctorScreen = true;
      this.updateGeneralVitals(this.patientVitalsForm);
    }

    this.attendant = this.route.snapshot.params['attendant'];
    if (this.attendant === 'nurse') {
      this.getPreviousVisitAnthropometry();
    }
  }

  previousAnthropometryDataSubscription: any;
  getPreviousVisitAnthropometry() {
    this.previousAnthropometryDataSubscription = this.doctorService
      .getPreviousVisitAnthropometry({
        benRegID: this.sessionstorage.getItem('beneficiaryRegID'),
      })
      .subscribe((anthropometryData: any) => {
        if (
          anthropometryData &&
          anthropometryData.data &&
          anthropometryData.data.response &&
          anthropometryData.data.response !== 'Visit code is not found' &&
          anthropometryData.data.response !== 'No data found'
        ) {
          const heightStr = anthropometryData.data.response.toString();
          this.patientVitalsForm.controls['height_cm'].patchValue(
            heightStr.endsWith('.0')
              ? Math.round(anthropometryData.data.response)
              : anthropometryData.data.response,
          );

          if (this.visitCategory === 'ANC') {
            this.hrpService.setHeightFromVitals(
              this.patientVitalsForm.controls['height_cm'].value,
            );
          }
        }
      });
  }

  checkNurseRequirements(medicalForm: any) {
    const vitalsForm = this.patientVitalsForm;
    const required = [];

    if (this.visitCategory === 'NCD screening') {
      if (vitalsForm.controls['height_cm'].errors) {
        required.push(
          this.currentLanguageSet.vitalsDetails.AnthropometryDataANC_OPD_NCD_PNC
            .height,
        );
      }
      if (vitalsForm.controls['weight_Kg'].errors) {
        required.push(
          this.currentLanguageSet.vitalsDetails.AnthropometryDataANC_OPD_NCD_PNC
            .weight,
        );
      }
      if (vitalsForm.controls['waistCircumference_cm'].errors) {
        required.push(
          this.currentLanguageSet.vitalsDetails.vitalsCancerscreening_QC
            .waistCircumference,
        );
      }
      if (vitalsForm.controls['temperature'].errors) {
        required.push(
          this.currentLanguageSet.vitalsDetails.vitalsDataANC_OPD_NCD_PNC
            .temperature,
        );
      }
      if (vitalsForm.controls['pulseRate'].errors) {
        required.push(
          this.currentLanguageSet.vitalsDetails.vitalsDataANC_OPD_NCD_PNC
            .pulseRate,
        );
      }
      if (vitalsForm.controls['systolicBP_1stReading'].errors) {
        required.push(this.currentLanguageSet.systolicBPReading);
      }
      if (vitalsForm.controls['diastolicBP_1stReading'].errors) {
        required.push(this.currentLanguageSet.diastolicBPReading);
      }
      if (vitalsForm.controls['rbsTestResult'].errors) {
        required.push(this.currentLanguageSet.rbsTestResult);
      }
    } else {
      if (this.visitCategory === 'ANC') {
        if (vitalsForm.controls['systolicBP_1stReading'].errors) {
          required.push(this.currentLanguageSet.systolicBPReading);
        }
        if (vitalsForm.controls['diastolicBP_1stReading'].errors) {
          required.push(this.currentLanguageSet.diastolicBPReading);
        }
      }
      if (vitalsForm.controls['height_cm'].errors) {
        required.push(
          this.currentLanguageSet.vitalsDetails.AnthropometryDataANC_OPD_NCD_PNC
            .height,
        );
      }
      if (vitalsForm.controls['weight_Kg'].errors) {
        required.push(
          this.currentLanguageSet.vitalsDetails.AnthropometryDataANC_OPD_NCD_PNC
            .weight,
        );
      }
      if (vitalsForm.controls['temperature'].errors) {
        required.push(
          this.currentLanguageSet.vitalsDetails.vitalsDataANC_OPD_NCD_PNC
            .temperature,
        );
      }
      if (vitalsForm.controls['pulseRate'].errors) {
        required.push(
          this.currentLanguageSet.vitalsDetails.vitalsDataANC_OPD_NCD_PNC
            .pulseRate,
        );
      }
    }
    if (required.length) {
      this.confirmationService.notify(
        this.currentLanguageSet.alerts.info.belowFields,
        required,
      );
      return 0;
    } else {
      return 1;
    }
  }

  updateGeneralVitals(patientVitalsForm: any) {
    if (this.checkNurseRequirements(this.patientVitalsForm)) {
      this.doctorService
        .updateGeneralVitals(patientVitalsForm, this.visitCategory)
        .subscribe(
          (res: any) => {
            if (res.statusCode === 200 && res.data !== null) {
              this.idrsscore.rbsTestResultsInVitals(
                this.patientVitalsForm.controls['rbsTestResult'].value,
              );
              if (this.visitCategory === 'ANC') {
                this.getHRPDetails();
              }
              this.confirmationService.alert(res.data.response, 'success');
              this.doctorService.setValueToEnableVitalsUpdateButton(false);
              this.setRBSResultInReport(this.patientVitalsForm);
              this.patientVitalsForm.markAsPristine();
            } else {
              this.confirmationService.alert(res.errorMessage, 'error');
            }
          },
          (err) => {
            this.confirmationService.alert(err, 'error');
          },
        );
    }
  }

  setRBSResultInReport(patientVitalsForm: any) {
    if (patientVitalsForm.value) {
      const todayDate = new Date();
      if (
        !patientVitalsForm.controls['rbsTestResult'].disabled &&
        (patientVitalsForm.controls['rbsTestResult'].dirty ||
          patientVitalsForm.controls['rbsTestRemarks'].dirty)
      ) {
        const patientVitalsDataForReport = Object.assign(
          {},
          patientVitalsForm.getRawValue(),
          {
            createdDate: todayDate,
          },
        );

        this.testInVitalsService.setVitalsRBSValueInReportsInUpdate(
          patientVitalsDataForReport,
        );
      }
    }
  }
  loadMMURBS() {
    this.doctorService
      .getRBSPreviousVitals({
        benRegID: this.sessionstorage.getItem('beneficiaryRegID'),
        benVisitID: this.sessionstorage.getItem('referredVisitID'),
        visitCode:
          this.attendant !== 'nurse'
            ? this.sessionstorage.getItem('referredVisitCode')
            : this.sessionstorage.getItem('mmuReferredVisitCode'),
      })
      .subscribe((data) => {
        if (data) {
          const temp = Object.assign(
            {},
            data.benAnthropometryDetail,
            data.benPhysicalVitalDetail,
          );
          if (
            this.patientVitalsForm.controls['rbsTestResult'] === null ||
            this.patientVitalsForm.controls['rbsTestResult'] === undefined
          ) {
            this.patientVitalsForm.patchValue({
              rbsTestResult: temp.rbsTestResult,
            });
          }
          if (
            this.patientVitalsForm.controls['rbsTestRemarks'] === null ||
            this.patientVitalsForm.controls['rbsTestRemarks'] === undefined
          ) {
            this.patientVitalsForm.patchValue({
              rbsTestRemarks: temp.rbsTestRemarks,
            });
          }

          this.rbsResult = temp.rbsTestResult;
          this.rbsRemarks = temp.rbsTestRemarks;
          this.dialog.open(MmuRbsDetailsComponent, {
            data: {
              rbsResult: this.rbsResult,
              rbsRemarks: this.rbsRemarks,
            },
          });
        }
      });
  }
  generalVitalsDataSubscription: any;
  getGeneralVitalsData() {
    this.generalVitalsDataSubscription = this.doctorService
      .getGenericVitals({
        benRegID: this.sessionstorage.getItem('beneficiaryRegID'),
        benVisitID: this.sessionstorage.getItem('visitID'),
      })
      .subscribe((vitalsData) => {
        if (vitalsData) {
          const temp = Object.assign(
            {},
            vitalsData.data.benAnthropometryDetail,
            vitalsData.data.benPhysicalVitalDetail,
          );
          this.patientVitalsForm.patchValue(temp);

          if (this.visitCategory === 'ANC') {
            this.hrpService.setHeightFromVitals(
              this.patientVitalsForm.controls['height_cm'].value,
            );
            this.hrpService.setHemoglobinValue(
              this.patientVitalsForm.controls['hemoglobin'].value,
            );
          }
          this.rbsResult = temp.rbsTestResult;
          this.rbsRemarks = temp.rbsTestRemarks;
          if (temp.systolicBP_1stReading !== null) {
            this.idrsscore.setSystolicBp(temp.systolicBP_1stReading);
          }
          if (temp.diastolicBP_1stReading !== null) {
            this.idrsscore.setDiastolicBp(temp.diastolicBP_1stReading);
          }
          if (temp.waistCircumference_cm !== null) {
            this.patchIDRSForWaist(temp.waistCircumference_cm);
          }
          this.nurseService.rbsTestResultFromDoctorFetch = null;
          if (
            temp.rbsTestResult !== undefined &&
            temp.rbsTestResult !== null &&
            this.attendant !== 'nurse'
          ) {
            this.nurseService.rbsTestResultFromDoctorFetch = temp.rbsTestResult;
            this.rbsResultChange();
          }
          if (
            this.patientVitalsForm.controls['hipCircumference_cm'].value &&
            this.patientVitalsForm.controls['hipCircumference_cm'].value !==
              null &&
            (this.visitCategory === 'General OPD' ||
              this.visitCategory === 'FP & Contraceptive Services')
          ) {
            this.checkHip(
              this.patientVitalsForm.controls['hipCircumference_cm'].value,
            );
          }
          if (
            this.patientVitalsForm.controls['waistHipRatio'].value &&
            this.patientVitalsForm.controls['waistHipRatio'].value !== null &&
            (this.visitCategory === 'General OPD' ||
              this.visitCategory === 'FP & Contraceptive Services')
          ) {
            this.hipWaistRatio();
          }
          this.calculateBMI();

          //Sending RBS Test Result to patch in Lab Reports

          if (vitalsData.data.benPhysicalVitalDetail) {
            this.testInVitalsService.setVitalsRBSValueInReports(
              vitalsData.data.benPhysicalVitalDetail,
            );
          }
        } else {
          this.loadMMURBS();
        }
      });
  }

  ngOnDestroy() {
    if (this.beneficiaryDetailSubscription)
      this.beneficiaryDetailSubscription.unsubscribe();
    if (this.generalVitalsDataSubscription)
      this.generalVitalsDataSubscription.unsubscribe();
    if (this.rbsSelectedInInvestigationSubscription)
      this.rbsSelectedInInvestigationSubscription.unsubscribe();
    this.nurseService.rbsTestResultFromDoctorFetch = null;
    if (this.disablingVitalsSectionSubscription)
      this.disablingVitalsSectionSubscription.unsubscribe();
    this.nurseService.isAssessmentDone = false;
    if (this.previousAnthropometryDataSubscription)
      this.previousAnthropometryDataSubscription.unsubscribe();
  }

  checkDiasableRBS() {
    if (
      this.rbsSelectedInInvestigation === true ||
      (this.nurseService.rbsTestResultFromDoctorFetch !== undefined &&
        this.nurseService.rbsTestResultFromDoctorFetch !== null)
    )
      return true;

    return false;
  }

  benGenderAndAge: any;
  beneficiaryDetailSubscription: any;
  getBeneficiaryDetails() {
    this.beneficiaryDetailSubscription =
      this.beneficiaryDetailsService.beneficiaryDetails$.subscribe(
        (beneficiary) => {
          if (beneficiary) {
            if (beneficiary && beneficiary.ageVal >= 0) {
              this.benGenderAndAge = beneficiary;
              this.benAge = beneficiary.ageVal;
              this.benGenderAndAge = beneficiary;
              const ageMonth = this.benGenderAndAge.age;
              const ar = ageMonth.split(' ');
              this.totalMonths = Number(ar[0] * 12) + Number(ar[3]);
            }
            if (
              beneficiary !== undefined &&
              beneficiary.genderName !== undefined &&
              beneficiary.genderName !== null &&
              beneficiary.genderName &&
              beneficiary.genderName.toLowerCase() === 'female'
            ) {
              this.female = true;
            }
            if (
              beneficiary !== undefined &&
              beneficiary.genderName !== undefined &&
              beneficiary.genderName !== null &&
              beneficiary.genderName &&
              beneficiary.genderName.toLowerCase() === 'male'
            ) {
              this.male = true;
            }
          }
        },
      );
  }

  normalBMI = true;
  calculateBMI() {
    if (
      this.height_cm &&
      this.height_cm !== null &&
      this.weight_Kg &&
      this.weight_Kg !== null
    ) {
      this.BMI = (this.weight_Kg / (this.height_cm * this.height_cm)) * 10000;
      this.BMI = +this.BMI.toFixed(1);
      console.log('this.BMI in 659', this.BMI);

      if (this.BMI !== null && this.BMI !== undefined) {
        this.calculateBMIStatusBasedOnAge();
      }
      this.patientVitalsForm.patchValue({ bMI: this.BMI });
    } else {
      this.patientVitalsForm.patchValue({ bMI: null });
    }
  }
  calculateBMIStatusBasedOnAge() {
    if (
      this.benGenderAndAge !== undefined &&
      this.benGenderAndAge.age !== undefined
    ) {
      const ageMonth = this.benGenderAndAge.age;
      const ar = ageMonth.split(' ');
      this.totalMonths = Number(ar[0] * 12) + Number(ar[3]);
    }
    if (
      this.totalMonths > 60 &&
      this.totalMonths <= 228 &&
      (this.benGenderAndAge.genderName.toLowerCase() === 'male' ||
        this.benGenderAndAge.genderName.toLowerCase() === 'female')
    ) {
      this.nurseService
        .calculateBmiStatus({
          yearMonth: this.benGenderAndAge.age,
          gender: this.benGenderAndAge.genderName,
          bmi: this.BMI,
        })
        .subscribe(
          (res: any) => {
            if (res.statusCode === 200 && res.data !== null) {
              const bmiData = res.data;
              if (
                bmiData.bmiStatus !== undefined &&
                bmiData.bmiStatus !== null
              ) {
                this.bmiStatusMinor = bmiData.bmiStatus.toLowerCase();
                if (this.bmiStatusMinor === 'normal') this.normalBMI = true;
                else this.normalBMI = false;
              }
            } else {
              this.confirmationService.alert(res.errorMessage, 'error');
            }
          },

          (err) => {
            this.confirmationService.alert(err, 'error');
          },
        );
    } else {
      if (this.BMI >= 18.5 && this.BMI <= 24.9) this.normalBMI = true;
      else this.normalBMI = false;
    }
  }
  checkHeight(height_cm: any) {
    if (height_cm < 10 || height_cm > 200) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue,
      );
    }
    console.log(
      'HRP- height from vitals:',
      this.patientVitalsForm.controls['height_cm'].value,
    );
    this.hrpService.setHeightFromVitals(
      this.patientVitalsForm.controls['height_cm'].value,
    );
    this.hrpService.checkHrpStatus = true;
  }

  checkWeight(weight_Kg: any) {
    if (weight_Kg < 25 || weight_Kg > 150) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue,
      );
    }
  }

  normalWaistHipRatio = true;
  hipWaistRatio() {
    let waistHipRatio: any;
    if (
      this.hipCircumference_cm &&
      this.waistCircumference_cm &&
      this.hipCircumference_cm !== null &&
      this.waistCircumference_cm !== null
    ) {
      waistHipRatio = (
        this.waistCircumference_cm / this.hipCircumference_cm
      ).toFixed(2);
      this.patientVitalsForm.patchValue({ waistHipRatio: waistHipRatio });
      if (this.female) {
        this.normalWaistHipRatio = waistHipRatio < 0.81 ? true : false;
      } else this.normalWaistHipRatio = waistHipRatio < 0.91 ? true : false;
    } else {
      this.patientVitalsForm.patchValue({ waistHipRatio: null });
    }
  }

  get waistHipRatio() {
    return this.patientVitalsForm.controls['waistHipRatio'].value;
  }

  normalHip = true;
  checkHip(hipCircumference_cm: any) {
    if (this.female)
      this.normalHip =
        this.hipCircumference_cm >= 97 && this.hipCircumference_cm <= 108
          ? true
          : false;
    else
      this.normalHip =
        this.hipCircumference_cm >= 94 && this.hipCircumference_cm <= 105
          ? true
          : false;
  }

  checkHeadCircumference(headCircumference_cm: any) {
    if (this.headCircumference_cm <= 25 || this.headCircumference_cm >= 75) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue,
      );
    }
  }

  checkMidUpperArmCircumference(midUpperArmCircumference_MUAC_cm: any) {
    if (
      this.midUpperArmCircumference_MUAC_cm <= 6 ||
      this.midUpperArmCircumference_MUAC_cm >= 30
    ) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue,
      );
    }
  }

  checkTemperature(temperature: any) {
    if (this.temperature <= 90 || this.temperature >= 110) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue,
      );
    }
  }

  checkHemoglobin() {
    if (this.hemoglobin < 1 || this.hemoglobin > 20) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue,
      );
    }
    this.hrpService.setHemoglobinValue(
      this.patientVitalsForm.controls['hemoglobin'].value,
    );
    this.hrpService.checkHrpStatus = true;
  }

  checkPulseRate(pulseRate: any) {
    if (this.pulseRate <= 48 || this.pulseRate > 200) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue,
      );
    }
  }
  checkSpo2() {
    if (this.sPO2 < 1 || this.sPO2 > 100) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue,
      );
    }
  }

  checkRespiratoryRate(respiratoryRate: any) {
    if (this.respiratoryRate <= 10 || this.respiratoryRate >= 100) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue,
      );
    }
  }

  checkSystolic(systolicBP: any) {
    if (systolicBP <= 40 || systolicBP >= 320) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue,
      );
    }
    if (systolicBP !== null) this.idrsscore.setSystolicBp(systolicBP);
    else this.idrsscore.setSystolicBp(0);
  }

  checkSystolicGreater(systolic: any, diastolic: any) {
    if (systolic && diastolic && parseInt(systolic) <= parseInt(diastolic)) {
      this.confirmationService.alert(this.currentLanguageSet.alerts.info.sysBp);
      this.patientVitalsForm.patchValue({
        systolicBP_1stReading: null,
      });
    }
  }

  checkDiastolicLower(systolic: any, diastolic: any) {
    if (systolic && diastolic && parseInt(diastolic) >= parseInt(systolic)) {
      this.confirmationService.alert(this.currentLanguageSet.alerts.info.sysBp);
      this.patientVitalsForm.patchValue({
        diastolicBP_1stReading: null,
      });
    }
  }

  checkDiastolic(diastolicBP: any) {
    if (diastolicBP <= 10 || diastolicBP >= 180) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue,
      );
    }
    if (diastolicBP !== null) this.idrsscore.setDiastolicBp(diastolicBP);
    else this.idrsscore.setDiastolicBp(0);
  }

  checkBloodSugarFasting(bloodSugarFasting: any) {
    if (bloodSugarFasting < 50 || bloodSugarFasting > 700) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue,
      );
    }
  }

  checkBloodSugarRandom(bloodSugarRandom: any) {
    if (bloodSugarRandom < 50 || bloodSugarRandom > 700) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue,
      );
    }
  }

  checkBloodSugar2HrPostPrandial(bloodSugar2HrPostPrandial: any) {
    if (bloodSugar2HrPostPrandial < 50 || bloodSugar2HrPostPrandial > 700) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue,
      );
    }
  }

  get height_cm() {
    return this.patientVitalsForm.controls['height_cm'].value;
  }

  get weight_Kg() {
    return this.patientVitalsForm.controls['weight_Kg'].value;
  }

  get waistCircumference_cm() {
    return this.patientVitalsForm.controls['waistCircumference_cm'].value;
  }

  get hipCircumference_cm() {
    return this.patientVitalsForm.controls['hipCircumference_cm'].value;
  }

  get midUpperArmCircumference_MUAC_cm() {
    return this.patientVitalsForm.controls['midUpperArmCircumference_MUAC_cm']
      .value;
  }

  get headCircumference_cm() {
    return this.patientVitalsForm.controls['headCircumference_cm'].value;
  }

  get temperature() {
    return this.patientVitalsForm.controls['temperature'].value;
  }

  get hemoglobin() {
    return this.patientVitalsForm.controls['hemoglobin'].value;
  }

  get pulseRate() {
    return this.patientVitalsForm.controls['pulseRate'].value;
  }

  get systolicBP_1stReading() {
    return this.patientVitalsForm.controls['systolicBP_1stReading'].value;
  }

  get diastolicBP_1stReading() {
    return this.patientVitalsForm.controls['diastolicBP_1stReading'].value;
  }

  get respiratoryRate() {
    return this.patientVitalsForm.controls['respiratoryRate'].value;
  }

  get bMI() {
    return this.patientVitalsForm.controls['bMI'].value;
  }

  get bloodGlucose_Fasting() {
    return this.patientVitalsForm.controls['bloodGlucose_Fasting'].value;
  }

  get bloodGlucose_Random() {
    return this.patientVitalsForm.controls['bloodGlucose_Random'].value;
  }

  get bloodGlucose_2hr_PP() {
    return this.patientVitalsForm.controls['bloodGlucose_2hr_PP'].value;
  }
  get sPO2() {
    return this.patientVitalsForm.controls['sPO2'].value;
  }

  get rbsTestResult() {
    return this.patientVitalsForm.controls['rbsTestResult'].value;
  }

  openIOTWeightModel() {
    const dialogRef = this.dialog.open(IotcomponentComponent, {
      width: '600px',
      height: '180px',
      disableClose: true,
      data: { startAPI: this.startWeightTest },
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log('he;;p', result, result['result']);
      if (result !== null) {
        this.patientVitalsForm.patchValue({
          weight_Kg: result['result'],
        });
        this.doctorService.setValueToEnableVitalsUpdateButton(true);
        this.calculateBMI();
      }
    });
  }

  openIOTRBSModel() {
    this.rbsPopup = true;
    const dialogRef = this.dialog.open(IotcomponentComponent, {
      width: '600px',
      height: '180px',
      disableClose: true,
      data: { startAPI: this.startRBSTest },
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.rbsPopup = false;
      if (result !== null) {
        this.patientVitalsForm.patchValue({
          rbsTestResult: result['result'],
        });
        this.patientVitalsForm.controls['rbsTestResult'].markAsDirty();
        this.doctorService.setValueToEnableVitalsUpdateButton(true);
        if (
          this.patientVitalsForm.controls['rbsTestResult'].value &&
          this.patientVitalsForm.controls['rbsTestResult'].value !== null
        ) {
          this.nurseService.setRbsInCurrentVitals(
            this.patientVitalsForm.controls['rbsTestResult'].value,
          );
        }
      }
    });
  }
  checkForRange() {
    if (
      this.rbsTestResult < 0 ||
      (this.rbsTestResult > 1000 && !this.rbsPopup)
    ) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue,
      );
    }
  }

  rbsResultChange(): boolean {
    if (
      this.patientVitalsForm.controls['rbsTestResult'].value &&
      this.patientVitalsForm.controls['rbsTestResult'].value !== null
    ) {
      this.nurseService.setRbsInCurrentVitals(
        this.patientVitalsForm.controls['rbsTestResult'].value,
      );
    } else {
      this.nurseService.setRbsInCurrentVitals(null);
    }
    if (
      this.rbsSelectedInInvestigation === true ||
      (this.nurseService.rbsTestResultFromDoctorFetch !== undefined &&
        this.nurseService.rbsTestResultFromDoctorFetch !== null)
    ) {
      this.patientVitalsForm.controls['rbsTestResult'].disable();
      this.patientVitalsForm.controls['rbsTestRemarks'].disable();
      this.patientVitalsForm.controls['rbsCheckBox'].disable();
      return true; // disable the controls
    } else {
      this.patientVitalsForm.controls['rbsTestResult'].enable();
      this.patientVitalsForm.controls['rbsTestRemarks'].enable();
      this.patientVitalsForm.controls['rbsCheckBox'].enable();
      return false; // enable the controls
    }
  }

  openIOTTempModel() {
    const dialogRef = this.dialog.open(IotcomponentComponent, {
      width: '600px',
      height: '180px',
      disableClose: true,
      data: { startAPI: this.startTempTest },
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log('temperature', result, result['temperature']);
      if (result !== null) {
        this.patientVitalsForm.patchValue({
          temperature: result['temperature'],
        });
        this.doctorService.setValueToEnableVitalsUpdateButton(true);
      }
    });
  }

  openIOTPulseRateModel() {
    const dialogRef = this.dialog.open(IotcomponentComponent, {
      width: '600px',
      height: '180px',
      disableClose: true,
      data: { startAPI: this.startPulseTest },
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log('pulse_oxymetery', result, result['pulseRate']);
      if (result !== null) {
        this.patientVitalsForm.patchValue({
          pulseRate: result['pulseRate'],
        });
        this.doctorService.setValueToEnableVitalsUpdateButton(true);
      }
    });
  }
  openIOTSPO2Model() {
    const dialogRef = this.dialog.open(IotcomponentComponent, {
      width: '600px',
      height: '180px',
      disableClose: true,
      data: { startAPI: this.startPulseTest },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result !== null) {
        this.patientVitalsForm.patchValue({
          sPO2: result['spo2'],
        });
        this.doctorService.setValueToEnableVitalsUpdateButton(true);
      }
    });
  }

  openIOTBPModel() {
    const dialogRef = this.dialog.open(IotcomponentComponent, {
      width: '600px',
      height: '180px',
      disableClose: true,
      data: { startAPI: this.startBPTest },
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log('blood_pressure', result['sys'], result['dia']);
      if (result !== null) {
        this.patientVitalsForm.patchValue({
          systolicBP_1stReading: result['sys'],
          diastolicBP_1stReading: result['dia'],
        });
        this.doctorService.setValueToEnableVitalsUpdateButton(true);
      }
    });
  }
  openIOTBGFastingModel() {
    const dialogRef = this.dialog.open(IotcomponentComponent, {
      width: '600px',
      height: '180px',
      disableClose: true,
      data: { startAPI: this.startBloodGlucose },
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log('blood_pressure', result['sys'], result['dia']);
      if (result !== null) {
        this.patientVitalsForm.patchValue({
          bloodGlucose_Fasting: result['result'],
        });
        this.doctorService.setValueToEnableVitalsUpdateButton(true);
      }
    });
  }
  openIOTBGRandomModel() {
    const dialogRef = this.dialog.open(IotcomponentComponent, {
      width: '600px',
      height: '180px',
      disableClose: true,
      data: { startAPI: this.startBloodGlucose },
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log('blood_pressure', result['sys'], result['dia']);
      if (result !== null) {
        this.patientVitalsForm.patchValue({
          bloodGlucose_Random: result['result'],
        });
        this.doctorService.setValueToEnableVitalsUpdateButton(true);
      }
    });
  }
  openIOTBGPostPrandialModel() {
    const dialogRef = this.dialog.open(IotcomponentComponent, {
      width: '600px',
      height: '180px',
      disableClose: true,
      data: { startAPI: this.startBloodGlucose },
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log('blood_pressure', result['sys'], result['dia']);
      if (result !== null) {
        this.patientVitalsForm.patchValue({
          bloodGlucose_2hr_PP: result['result'],
        });
        this.doctorService.setValueToEnableVitalsUpdateButton(true);
      }
    });
  }
  checkIDRSForWaist(waistValue: any) {
    if (this.male) {
      if (waistValue < 90) {
        this.IDRSWaistScore = 0;
      }
      if (waistValue >= 90 && waistValue <= 99) {
        this.IDRSWaistScore = 10;
      }
      if (waistValue >= 100) {
        this.IDRSWaistScore = 20;
      }
    } else if (this.female) {
      if (waistValue < 80) {
        this.IDRSWaistScore = 0;
      }
      if (waistValue >= 80 && waistValue <= 89) {
        this.IDRSWaistScore = 10;
      }
      if (waistValue >= 90) {
        this.IDRSWaistScore = 20;
      }
    }
    this.idrsscore.setIDRSScoreWaist(this.IDRSWaistScore);
    this.idrsscore.setIDRSScoreFlag();
  }
  patchIDRSForWaist(waistValue: any) {
    if (this.male) {
      if (waistValue < 90) {
        this.IDRSWaistScore = 0;
      }
      if (waistValue >= 90 && waistValue <= 99) {
        this.IDRSWaistScore = 10;
      }
      if (waistValue >= 100) {
        this.IDRSWaistScore = 20;
      }
    } else if (this.female) {
      if (waistValue < 80) {
        this.IDRSWaistScore = 0;
      }
      if (waistValue >= 80 && waistValue <= 89) {
        this.IDRSWaistScore = 10;
      }
      if (waistValue >= 90) {
        this.IDRSWaistScore = 20;
      }
    }
    this.idrsscore.setIDRSScoreWaist(this.IDRSWaistScore);
  }

  getHRPDetails() {
    const beneficiaryRegID = this.sessionstorage.getItem('beneficiaryRegID');
    const visitCode = this.sessionstorage.getItem('visitCode');
    this.doctorService
      .getHRPDetails(beneficiaryRegID, visitCode)
      .subscribe((res: any) => {
        if (res && res.statusCode === 200 && res.data) {
          if (res.data.isHRP === true) {
            this.beneficiaryDetailsService.setHRPPositive();
          } else {
            this.beneficiaryDetailsService.resetHRPPositive();
          }
        }
      });
  }

  onRbsCheckBox(event: any) {
    if (event.checked) {
      this.rbsCheckBox = true;
    } else {
      this.rbsCheckBox = false;
    }
  }

  getGender() {
    const gender = this.sessionstorage.getItem('beneficiaryGender');
    if (gender === 'Female') this.benGenderType = 1;
    else if (gender === 'Male') this.benGenderType = 0;
    else if (gender === 'Transgender') this.benGenderType = 2;
  }

  onCheckboxChange(symptomName: any, event: any) {
    symptomName = event.checked ? 1 : 0;
  }

  trackFieldInteraction(fieldName: string) {
    this.trackingService.trackFieldInteraction(fieldName, 'Vitals');
  }
}
