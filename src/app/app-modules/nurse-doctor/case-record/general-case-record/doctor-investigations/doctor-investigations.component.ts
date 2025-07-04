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
import { Component, OnInit, Input, DoCheck, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  MasterdataService,
  DoctorService,
  NurseService,
} from '../../../shared/services';
import { Subscription } from 'rxjs';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { IdrsscoreService } from '../../../shared/services/idrsscore.service';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { MatDialog } from '@angular/material/dialog';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { environment } from 'src/environments/environment';
import { PreviousDetailsComponent } from 'src/app/app-modules/core/components/previous-details/previous-details.component';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-doctor-investigations',
  templateUrl: './doctor-investigations.component.html',
  styleUrls: ['./doctor-investigations.component.css'],
})
export class DoctorInvestigationsComponent
  implements OnInit, DoCheck, OnDestroy
{
  @Input()
  generalDoctorInvestigationForm!: FormGroup;

  @Input()
  caseRecordMode!: string;

  @Input()
  visit!: string;

  chiefComplaintMaster: any;
  nonRadiologyMaster: any;
  radiologyMaster: any;
  beneficiaryRegID: any;
  visitID: any;
  visitCategory: any;
  previousLabTestList: any;
  current_language_set: any;
  diabetesSelected: any = 0;
  VisualAcuityMandatory = false;
  RBSTestDoneInVitals = false;
  VisualAcuityTestDone = false;
  diastolicBpValue: any;
  systolicBpValue: any;
  RBSTestScore!: number;
  rbsPresent = false;
  visualAcuityPresent = false;
  hemoglobbinSelected = false;
  referredVisitcode: any;
  confirmedDiabeticValue: any;
  hypertensionSelected: any;
  rbsTestResultCurrent: any;
  rbsTestResultCurrentSubscription: any;

  RBSPresentInTM = false;
  finalHypertension = false;
  checkForMMUInvestigation = false;
  visitCategoryCheck: any;
  hyperSuspectedSubscription!: Subscription;
  finalHypertensionSubscription!: Subscription;
  systolicSubscription!: Subscription;
  diastolicSubscription!: Subscription;
  rbsTestResultSubscription!: Subscription;
  rbsSelectedInInvestigationSubscription!: Subscription;
  rbsSelectedUnderInvestigation = false;
  rbsSelectedInInvestigation = false;
  VisualAcuityTestDoneMMU = false;
  rbsTestDoneMMU = false;
  RBSTestScoreInVitals!: number;
  constructor(
    private doctorService: DoctorService,
    private masterdataService: MasterdataService,
    public httpServiceService: HttpServiceService,
    private idrsScoreService: IdrsscoreService,
    private confirmationService: ConfirmationService,
    private dialog: MatDialog,
    private nurseService: NurseService,
    readonly sessionstorage: SessionStorageService,
  ) {}

  ngOnInit() {
    this.rbsTestDoneMMU = false;
    this.VisualAcuityTestDoneMMU = false;
    this.rbsSelectedInInvestigation = false;
    this.assignSelectedLanguage();
    this.idrsScoreService.clearSystolicBp();
    this.idrsScoreService.clearDiastolicBp();
    this.idrsScoreService.clearHypertensionSelected();
    this.nurseService.clearRbsInVitals();
    this.nurseService.clearRbsSelectedInInvestigation();
    this.hyperSuspectedSubscription =
      this.idrsScoreService.hypertensionSelectedFlag$.subscribe((response) => {
        this.hypertensionSelected = response;
        this.changeOfConfirmedHypertension(this.hypertensionSelected);
      });
    this.visitCategoryCheck = this.sessionstorage.getItem('visitCategory');

    this.finalHypertensionSubscription =
      this.idrsScoreService.finalDiagnosisHypertensionConfirmation$.subscribe(
        (res: any) => {
          this.finalHypertension = res;
          this.sysAndDiaBp();
        },
      );
    this.rbsTestValidation();
    this.ncdScreeningValidations();
    this.sysAndDiaBp();
    this.getDoctorMasterData();
    this.getNurseMasterData();
    if (this.sessionstorage.getItem('referredVisitCode')) {
      this.referredVisitcode = this.sessionstorage.getItem('referredVisitCode');
    } else {
      this.referredVisitcode = 'undefined';
    }
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }

  sysAndDiaBp() {
    this.systolicSubscription =
      this.idrsScoreService.systolicBpValue$.subscribe((response) => {
        this.systolicBpValue = response;
        this.changeOfSystolicBp(this.systolicBpValue);
        console.log('score', this.RBSTestScore);
      });
    this.diastolicSubscription =
      this.idrsScoreService.diastolicBpValue$.subscribe((response) => {
        this.diastolicBpValue = response;
        this.changeOdDiastolicBp(this.diastolicBpValue);
      });
  }
  rbsTestValidation() {
    this.rbsSelectedInInvestigationSubscription =
      this.nurseService.rbsSelectedInInvestigation$.subscribe((response) => {
        if (response !== undefined && response !== null) {
          this.rbsSelectedUnderInvestigation = response;
        }
      });
    this.rbsTestResultSubscription =
      this.nurseService.rbsTestResultCurrent$.subscribe((response) => {
        if (response !== undefined && response !== null) {
          this.RBSTestScoreInVitals = response;
          this.RBSTestDoneInVitals = true;
          this.checkRBSScore();
          this.rbsTestResultCurrent = response;
        } else {
          this.RBSTestScoreInVitals = response;
          this.RBSTestDoneInVitals = false;
          this.rbsTestResultCurrent = null;
          this.checkRBSScore();
        }
      });
  }
  ncdScreeningValidations() {
    if (this.visitCategoryCheck === 'NCD screening') {
      this.checkForMMUInvestigation = false;
      this.diabetesSelected = 0;
      this.idrsScoreService.clearDiabetesSelected();
      this.idrsScoreService.diabetesNotPresentInMMU = 0;
      this.diabetesObservable();
      this.getMMUInvestigationDetails();
    }
  }

  ngOnDestroy() {
    this.idrsScoreService.clearDiabetesSelected();
    if (this.nurseMasterDataSubscription)
      this.nurseMasterDataSubscription.unsubscribe();
    if (this.doctorMasterDataSubscription)
      this.doctorMasterDataSubscription.unsubscribe();
    if (this.investigationSubscription)
      this.investigationSubscription.unsubscribe();
    if (this.diabetesSelectedFlagSubscription)
      this.diabetesSelectedFlagSubscription.unsubscribe();
    if (this.hyperSuspectedSubscription)
      this.hyperSuspectedSubscription.unsubscribe();
    if (this.systolicSubscription) this.systolicSubscription.unsubscribe();
    if (this.diastolicSubscription) this.diastolicSubscription.unsubscribe();
    if (this.finalHypertensionSubscription)
      this.finalHypertensionSubscription.unsubscribe();
    if (this.rbsTestResultSubscription) {
      this.rbsTestResultSubscription.unsubscribe();
      if (this.rbsSelectedInInvestigationSubscription)
        this.rbsSelectedInInvestigationSubscription.unsubscribe();
    }
    if (this.investigationSubscription) {
      this.investigationSubscription.unsubscribe();
    }
  }

  investigationSubscription!: Subscription;
  getInvestigationDetails() {
    this.investigationSubscription =
      this.doctorService.populateCaserecordResponse$.subscribe((res) => {
        if (
          res &&
          res.statusCode === 200 &&
          res.data &&
          res.data.investigation
        ) {
          console.log(res, 'investigations');
          this.patchInvestigationDetails(
            res.data.investigation,
            res.data.diagnosis,
          );
          this.checkTestScore(res.data.LabReport);
        }
      });
  }

  patchInvestigationDetails(investigation: any, diagnosis: any) {
    const labTest: any = [];
    const radiologyTest: any = [];
    let externalInvestigation = '';

    if (investigation.laboratoryList) {
      this.previousLabTestList = investigation.laboratoryList;

      investigation.laboratoryList.map((item: any) => {
        const temp = this.nonRadiologyMaster.filter((element: any) => {
          return element.procedureID === item.procedureID;
        });
        if (temp.length > 0) labTest.push(temp[0]);
        //checking RBS test is prescribed or not
        if (
          item.procedureName.toLowerCase() === environment.RBSTest.toLowerCase()
        ) {
          this.rbsSelectedInInvestigation = true;
          this.nurseService.setRbsSelectedInInvestigation(true);
        }
        if (
          item.procedureName.toLowerCase() ===
          environment.haemoglobinTest.toLowerCase()
        ) {
          this.hemoglobbinSelected = true;
        }
        if (
          item.procedureName.toLowerCase() ===
          environment.visualAcuityTest.toLowerCase()
        ) {
          this.VisualAcuityTestDone = true;
          this.idrsScoreService.clearVisualAcuityTestMandatoryFlag();
        }
      });
      investigation.laboratoryList.map((item: any) => {
        const temp = this.radiologyMaster.filter((element: any) => {
          return element.procedureID === item.procedureID;
        });
        if (temp.length > 0) radiologyTest.push(temp[0]);
      });
    }

    if (diagnosis && diagnosis.externalInvestigation) {
      externalInvestigation = diagnosis.externalInvestigation;
    }

    this.generalDoctorInvestigationForm.patchValue({
      labTest,
      radiologyTest,
      externalInvestigations: externalInvestigation,
    });
  }

  nurseMasterDataSubscription!: Subscription;
  getNurseMasterData() {
    this.nurseMasterDataSubscription =
      this.masterdataService.nurseMasterData$.subscribe((masterData) => {
        if (masterData && masterData.procedures) {
          this.nonRadiologyMaster = masterData.procedures.filter(
            (item: any) => {
              return item.procedureType === 'Laboratory';
            },
          );
          this.radiologyMaster = masterData.procedures.filter((item: any) => {
            return item.procedureType === 'Radiology';
          });

          // checking RBS and Visual acuity is present or not.
          this.nonRadiologyMaster.forEach((element: any) => {
            if (
              element.procedureName.toLowerCase() ===
              environment.RBSTest.toLowerCase()
            ) {
              this.rbsPresent = true;
              this.idrsScoreService.rBSPresentInMaster();
            }
            if (
              element.procedureName.toLowerCase() ===
              environment.visualAcuityTest.toLowerCase()
            ) {
              this.visualAcuityPresent = true;
              this.idrsScoreService.visualAcuityPresentInMaster();
            }
            if (
              element.procedureName.toLowerCase() ===
              environment.haemoglobinTest.toLowerCase()
            ) {
              this.idrsScoreService.haemoglobinPresentInMaster();
            }
          });
          if (String(this.caseRecordMode) === 'view') {
            this.beneficiaryRegID =
              this.sessionstorage.getItem('beneficiaryRegID');
            this.visitID = this.sessionstorage.getItem('visitID');
            this.visitCategory = this.sessionstorage.getItem('visitCategory');
            this.getInvestigationDetails();
          }
        }
      });
  }

  doctorMasterDataSubscription!: Subscription;
  getDoctorMasterData() {
    this.doctorMasterDataSubscription =
      this.masterdataService.doctorMasterData$.subscribe((masterData) => {
        if (masterData) {
          console.log('doctor master', masterData);
        }
      });
  }

  canDisable(test: any) {
    if (
      ((this.rbsTestResultCurrent !== null &&
        this.rbsTestResultCurrent !== undefined) ||
        this.nurseService.rbsTestResultFromDoctorFetch !== null) &&
      test.procedureName.toLowerCase() === environment.RBSTest.toLowerCase()
    ) {
      return true;
    }
    if (this.previousLabTestList) {
      const temp = this.previousLabTestList.filter((item: any) => {
        return item.procedureID === test.procedureID;
      });

      if (temp.length > 0) test.disabled = true;
      else test.disabled = false;

      return temp.length > 0;
    }
  }
  checkTestScore(labreports: any) {
    if (labreports !== undefined) {
      labreports.forEach((element: any) => {
        if (
          element.procedureName.toLowerCase() ===
          environment.RBSTest.toLowerCase()
        ) {
          this.RBSTestScore = element.componentList[0].testResultValue;
        }
      });
    }
    this.checkRBSScore();
  }
  checkRBSScore() {
    if (
      this.RBSTestScore > 200 ||
      this.RBSTestScoreInVitals > 200 ||
      (this.hypertensionSelected === 0 && this.systolicBpValue >= 140) ||
      (this.hypertensionSelected === 0 && this.diastolicBpValue >= 90)
    ) {
      this.VisualAcuityMandatory = true;
      if (this.idrsScoreService.visualAcuityTestInMMU !== 0)
        this.idrsScoreService.setVisualAcuityTestMandatoryFlag();
    } else {
      this.VisualAcuityMandatory = false;
      this.idrsScoreService.clearVisualAcuityTestMandatoryFlag();
    }
  }
  checkTestName(event: any) {
    console.log('testName', event);
    this.VisualAcuityTestDone = false;
    let item = event.value;
    let oneSelected = 0;
    this.nurseService.setRbsSelectedInInvestigation(false);
    this.rbsSelectedInInvestigation = false;
    this.hemoglobbinSelected = false;
    item.forEach((element: any) => {
      if (
        element.procedureName.toLowerCase() ===
        environment.RBSTest.toLowerCase()
      ) {
        this.rbsSelectedInInvestigation = true;
        this.nurseService.setRbsSelectedInInvestigation(true);
        oneSelected++;
        if (this.visitCategoryCheck === 'ANC') {
          const hbTest = this.nonRadiologyMaster.find(
            (test: any) =>
              test.procedureName.toLowerCase() ===
              environment.haemoglobinTest.toLowerCase(),
          );
          this.hemoglobbinSelected = true;
          if (hbTest && !item.includes(hbTest)) {
            item.push(hbTest);
          }
        }
      }
      if (
        element.procedureName.toLowerCase() ===
        environment.visualAcuityTest.toLowerCase()
      ) {
        this.VisualAcuityTestDone = true;
        this.idrsScoreService.clearVisualAcuityTestMandatoryFlag();
      }
      if (
        element.procedureName.toLowerCase() ===
        environment.haemoglobinTest.toLowerCase()
      ) {
        this.hemoglobbinSelected = true;
      }
    });
    // Remove duplicates
    item = Array.from(new Set(item));

    // Update form control value
    this.generalDoctorInvestigationForm.controls['labTest'].setValue(item);
  }
  changeOfSystolicBp(systolicBp: any) {
    if (
      !this.finalHypertension &&
      (this.RBSTestScore > 200 ||
        this.RBSTestScoreInVitals > 200 ||
        (this.hypertensionSelected === 0 && systolicBp >= 140) ||
        (this.hypertensionSelected === 0 && this.diastolicBpValue >= 90))
    ) {
      this.VisualAcuityMandatory = true;
      if (this.idrsScoreService.visualAcuityTestInMMU !== 0)
        this.idrsScoreService.setVisualAcuityTestMandatoryFlag();
    } else {
      this.VisualAcuityMandatory = false;
      this.idrsScoreService.clearVisualAcuityTestMandatoryFlag();
    }
  }
  changeOdDiastolicBp(diastolicBp: any) {
    if (
      !this.finalHypertension &&
      (this.RBSTestScore > 200 ||
        this.RBSTestScoreInVitals > 200 ||
        (this.hypertensionSelected === 0 && this.systolicBpValue >= 140) ||
        (this.hypertensionSelected === 0 && diastolicBp >= 90))
    ) {
      this.VisualAcuityMandatory = true;
      if (this.idrsScoreService.visualAcuityTestInMMU !== 0)
        this.idrsScoreService.setVisualAcuityTestMandatoryFlag();
    } else {
      this.VisualAcuityMandatory = false;
      this.idrsScoreService.clearVisualAcuityTestMandatoryFlag();
    }
  }
  changeOfConfirmedDiabetes(confirmedDiabeticVal: any) {
    if (
      this.RBSTestScore > 200 ||
      this.RBSTestScoreInVitals > 200 ||
      (this.hypertensionSelected === 0 && this.systolicBpValue >= 140) ||
      (this.hypertensionSelected === 0 && this.diastolicBpValue >= 90)
    ) {
      this.VisualAcuityMandatory = true;
      if (this.idrsScoreService.visualAcuityTestInMMU !== 0)
        this.idrsScoreService.setVisualAcuityTestMandatoryFlag();
    } else {
      this.VisualAcuityMandatory = false;
      this.idrsScoreService.clearVisualAcuityTestMandatoryFlag();
    }
  }

  changeOfConfirmedHypertension(confirmedHypertensionVal: any) {
    if (
      this.RBSTestScore > 200 ||
      this.RBSTestScoreInVitals > 200 ||
      (confirmedHypertensionVal === 0 && this.systolicBpValue >= 140) ||
      (confirmedHypertensionVal === 0 && this.diastolicBpValue >= 90)
    ) {
      this.VisualAcuityMandatory = true;
      if (this.idrsScoreService.visualAcuityTestInMMU !== 0)
        this.idrsScoreService.setVisualAcuityTestMandatoryFlag();
    } else {
      this.VisualAcuityMandatory = false;
      this.idrsScoreService.clearVisualAcuityTestMandatoryFlag();
    }
  }

  loadMMUInvestigation() {
    const reqObj = {
      benRegID:
        this.sessionstorage.getItem('beneficiaryRegID') &&
        this.sessionstorage.getItem('beneficiaryRegID') !== ''
          ? this.sessionstorage.getItem('beneficiaryRegID')
          : null,
      visitCode:
        this.sessionstorage.getItem('referredVisitCode') &&
        this.sessionstorage.getItem('referredVisitCode') !== ''
          ? this.sessionstorage.getItem('referredVisitCode')
          : null,
      benVisitID:
        this.sessionstorage.getItem('referredVisitID') &&
        this.sessionstorage.getItem('referredVisitID') !== ''
          ? this.sessionstorage.getItem('referredVisitID')
          : null,
      fetchMMUDataFor: 'Investigation',
    };
    if (
      this.sessionstorage.getItem('referredVisitCode') !== 'undefined' &&
      this.sessionstorage.getItem('referredVisitID') !== 'undefined'
    ) {
      this.doctorService.getMMUData(reqObj).subscribe(
        (res: any) => {
          if (res.statusCode === 200 && res.data !== null) {
            if (
              res.data.data.laboratoryList !== undefined &&
              res.data.data.laboratoryList.length > 0
            ) {
              this.viewPreviousData(res.data);
            } else {
              this.confirmationService.alert(
                this.current_language_set.mmuInvestigationDetailsNotAvailable,
              );
            }
          } else {
            this.confirmationService.alert(
              this.current_language_set.errorInFetchingMMUInvestigationDetails,
              'error',
            );
          }
        },
        (err) => {
          this.confirmationService.alert(
            this.current_language_set.errorInFetchingMMUInvestigationDetails,
            'error',
          );
        },
      );
    }
  }

  viewPreviousData(data: any) {
    this.dialog.open(PreviousDetailsComponent, {
      data: {
        dataList: data,
        title: this.current_language_set.mmuInvestigationDetails,
      },
    });
  }

  getMMUInvestigationDetails() {
    const reqObj = {
      benRegID:
        this.sessionstorage.getItem('beneficiaryRegID') &&
        this.sessionstorage.getItem('beneficiaryRegID') !== ''
          ? this.sessionstorage.getItem('beneficiaryRegID')
          : null,
      visitCode:
        this.sessionstorage.getItem('referredVisitCode') &&
        this.sessionstorage.getItem('referredVisitCode') !== ''
          ? this.sessionstorage.getItem('referredVisitCode')
          : null,
      benVisitID:
        this.sessionstorage.getItem('referredVisitID') &&
        this.sessionstorage.getItem('referredVisitID') !== ''
          ? this.sessionstorage.getItem('referredVisitID')
          : null,
      fetchMMUDataFor: 'Investigation',
    };
    if (
      this.sessionstorage.getItem('referredVisitCode') !== 'undefined' &&
      this.sessionstorage.getItem('referredVisitID') !== 'undefined'
    ) {
      this.doctorService.getMMUData(reqObj).subscribe(
        (res: any) => {
          if (res.statusCode === 200 && res.data !== null) {
            if (
              res.data.data.laboratoryList !== undefined &&
              res.data.data.laboratoryList.length > 0
            ) {
              const labList = res.data.data.laboratoryList;
              const rbsPresentInList = false;
              let visualAcuityPresentInList = false;
              labList.find((element: any) => {
                if (
                  element.procedureName.toLowerCase() ===
                  environment.RBSTest.toLowerCase()
                ) {
                  this.diabetesSelected = 0;
                  this.idrsScoreService.diabetesNotPresentInMMU = 0;
                  this.checkForMMUInvestigation = true;
                  this.rbsTestDoneMMU = true;
                } else {
                  this.diabetesObservable();
                }

                if (
                  element.procedureName.toLowerCase() ===
                  environment.visualAcuityTest.toLowerCase()
                ) {
                  this.VisualAcuityTestDoneMMU = true;
                  this.idrsScoreService.visualAcuityTestInMMU = 0;
                  visualAcuityPresentInList = true;
                }
              });

              if (!visualAcuityPresentInList) {
                this.idrsScoreService.visualAcuityTestInMMU = 1;
              }
            } else {
              this.diabetesSelected = 0;
              this.idrsScoreService.diabetesNotPresentInMMU = 0;
              this.idrsScoreService.diabetesSelected = 0;
              this.diabetesObservable();

              console.log('No data avaiable from MMU investigations');
            }
          } else {
            this.diabetesSelected = 0;
            this.idrsScoreService.diabetesNotPresentInMMU = 0;
            this.idrsScoreService.clearDiabetesSelected();
            this.diabetesObservable();

            this.confirmationService.alert(
              this.current_language_set.errorInFetchingMMUInvestigationDetails,
              'error',
            );
          }
        },

        (err) => {
          this.diabetesObservable();
          this.confirmationService.alert(
            this.current_language_set.errorInFetchingMMUInvestigationDetails,
            'error',
          );
        },
      );
    }
  }

  diabetesSelectedFlagSubscription!: Subscription;
  diabetesObservable() {
    this.diabetesSelectedFlagSubscription =
      this.idrsScoreService.diabetesSelectedFlag$.subscribe((response) => {
        console.log('investigation', response);
        if (!this.checkForMMUInvestigation) {
          this.diabetesSelected = response;

          if (this.diabetesSelected === 1) {
            this.idrsScoreService.diabetesNotPresentInMMU = 1;
          }
        }
      });
  }
}
