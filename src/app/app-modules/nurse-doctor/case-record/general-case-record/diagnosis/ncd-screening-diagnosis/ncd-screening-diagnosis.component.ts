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
  OnInit,
  Input,
  OnDestroy,
  DoCheck,
  OnChanges,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  AbstractControl,
} from '@angular/forms';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { Subscription } from 'rxjs';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { MasterdataService } from 'src/app/app-modules/nurse-doctor/shared/services';
import { DoctorService } from 'src/app/app-modules/nurse-doctor/shared/services/doctor.service';
import { IdrsscoreService } from 'src/app/app-modules/nurse-doctor/shared/services/idrsscore.service';
import { NcdScreeningService } from 'src/app/app-modules/nurse-doctor/shared/services/ncd-screening.service';
import { NurseService } from 'src/app/app-modules/nurse-doctor/shared/services/nurse.service';
import { GeneralUtils } from 'src/app/app-modules/nurse-doctor/shared/utility';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-ncd-screening-diagnosis',
  templateUrl: './ncd-screening-diagnosis.component.html',
  styleUrls: ['./ncd-screening-diagnosis.component.css'],
})
export class NcdScreeningDiagnosisComponent
  implements OnChanges, OnInit, DoCheck, OnDestroy
{
  utils = new GeneralUtils(this.fb, this.sessionstorage);

  @Input()
  generalDiagnosisForm!: FormGroup;

  @Input()
  caseRecordMode!: string;
  designation: any;
  specialist = false;
  doctorDiagnosis: any;
  current_language_set: any;
  confirmed: any;
  diabetesChecked = false;
  hyperTensionChecked = false;
  oralChecked = false;
  breastChecked = false;
  cervicalChecked = false;
  confirmDisease: any = [];
  confirmHyperTensionDisease: any = [];
  hideCBACForm = false;
  benGender: any;
  confirmDiseaseArray: any = []; // it holds already confirmed diseases (By nurse)
  confirmDiseaseArray2: any = []; // it holds already confirmed and also newly marking as confirmed disease by doctor
  diabetes = environment.diabetes;
  hypertension = environment.hypertension;
  oralCancer = environment.oral;
  breastCancer = environment.breast;
  cervicalCancer = environment.cervical;
  oralScreeningStatusSubscription!: Subscription;
  breastScreeningStatusSubscription!: Subscription;
  cervicalScreeningStatusSubscription!: Subscription;
  hypertensionScreeningStatusSubscription!: Subscription;
  diabetesScreeningStatusSubscription!: Subscription;
  hypertensionSuspected = false;
  oralSuspected = false;
  breastSuspected = false;
  cervicalSuspected = false;
  diabetesSuspected = false;
  confirmSubscription!: Subscription;
  previousConfirmedDiseases!: any[];
  confirmDiseasesSubscription!: Subscription;
  previousVisitConfirmedDiseasesSubscription!: Subscription;
  enableProvisionalDiag = false;
  suggestedDiagnosisList: any = [];
  constructor(
    private fb: FormBuilder,
    private doctorService: DoctorService,
    public httpServiceService: HttpServiceService,
    private confirmationService: ConfirmationService,
    private ncdScreeningService: NcdScreeningService,
    private idrsScoreService: IdrsscoreService,
    private nurseService: NurseService,
    readonly sessionstorage: SessionStorageService,
    private masterdataService: MasterdataService,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.resetSuspectedVar();
    this.diabetesScreeningStatus();
    this.hypertensionScreeningStatus();
    this.oralScreeningStatus();
    this.breastScreeningStatus();
    this.cervicalScreeningStatus();
    this.confirmDiseasesSubscription =
      this.ncdScreeningService.enableDiseaseConfirmForm$.subscribe(
        (response: any) => {
          if (response === 'cbac') {
            this.getConfirmedDiseases();
          }
        },
      );
    this.designation = this.sessionstorage.getItem('designation');
    this.benGender = this.sessionstorage.getItem('beneficiaryGender');
    if (this.designation === 'TC Specialist') {
      this.generalDiagnosisForm.controls['instruction'].enable();
      this.specialist = true;
    } else {
      this.generalDiagnosisForm.controls['instruction'].disable();
      this.specialist = false;
    }
    this.idrsScoreService.enableDiseaseConfirmationOnCaseRecord$.subscribe(
      (confirmDisease: any) => {
        if (confirmDisease) {
          this.updateIfDiseaseConfirmed();
        }
      },
    );
    this.idrsScoreService.finalDiagnosisDiabetesConfirm(false);
    this.idrsScoreService.finalDiagnosisHypertensionConfirm(false);
    this.nurseService.enableProvisionalDiag$.subscribe((response) => {
      if (response === true) {
        this.enableProvisionalDiag = true;
      } else {
        this.enableProvisionalDiag = false;
      }
    });
  }

  getProvisionalDiagnosisList(): AbstractControl[] | null {
    const provisionalDiagnosisListControl = this.generalDiagnosisForm.get(
      'provisionalDiagnosisList',
    );
    return provisionalDiagnosisListControl instanceof FormArray
      ? provisionalDiagnosisListControl.controls
      : null;
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }

  get specialistDaignosis() {
    return this.generalDiagnosisForm.get('instruction');
  }

  get doctorDaignosis() {
    return this.generalDiagnosisForm.get('viewProvisionalDiagnosisProvided');
  }

  ngOnChanges() {
    if (String(this.caseRecordMode) === 'view') {
      const beneficiaryRegID = this.sessionstorage.getItem('beneficiaryRegID');
      const visitID = this.sessionstorage.getItem('visitID');
      const visitCategory = this.sessionstorage.getItem('visitCategory');
      const specialistFlagString =
        this.sessionstorage.getItem('specialist_flag');
      if (
        this.sessionstorage.getItem('referredVisitCode') === 'undefined' ||
        this.sessionstorage.getItem('referredVisitCode') === null
      ) {
        this.getDiagnosisDetails();
      } else if (
        specialistFlagString !== null &&
        parseInt(specialistFlagString) === 3
      ) {
        this.getMMUDiagnosisDetails(
          beneficiaryRegID,
          visitID,
          visitCategory,
          this.sessionstorage.getItem('visitCode'),
        );
      } else {
        this.getMMUDiagnosisDetails(
          beneficiaryRegID,
          this.sessionstorage.getItem('referredVisitID'),
          visitCategory,
          this.sessionstorage.getItem('referredVisitCode'),
        );
      }
    }
  }

  getConfirmedDiseases() {
    this.previousVisitConfirmedDiseasesSubscription =
      this.doctorService.previousVisitConfirmedDiseases$.subscribe(
        (confirmedDiseases) => {
          this.confirmDiseaseArray =
            confirmedDiseases !== undefined ? confirmedDiseases : null;
          if (
            this.confirmDiseaseArray !== null &&
            this.confirmDiseaseArray.length > 0
          ) {
            this.confirmDiseaseArray2 = [];
            this.confirmDiseaseArray2 = this.confirmDiseaseArray.map(
              (item: any) => {
                return item.trim();
              },
            );

            this.confirmDiseaseArray = [];
            this.confirmDiseaseArray.push(...this.confirmDiseaseArray2);
          }
          this.diabetesChecked = false;
          this.oralChecked = false;
          this.hyperTensionChecked = false;
          this.breastChecked = false;
          this.cervicalChecked = false;
          if (
            this.confirmDiseaseArray !== null &&
            this.confirmDiseaseArray.length > 0
          ) {
            this.confirmDiseaseArray.forEach((item: any) => {
              if (item.trim().toLowerCase() === this.diabetes.toLowerCase()) {
                this.diabetesChecked = true;
                this.generalDiagnosisForm.controls[
                  'diabetesScreeningConfirmed'
                ].patchValue(true);
              } else if (
                item.trim().toLowerCase() === this.hypertension.toLowerCase()
              ) {
                this.hyperTensionChecked = true;
                this.generalDiagnosisForm.controls[
                  'hypertensionScreeningConfirmed'
                ].patchValue(true);
              } else if (
                item.trim().toLowerCase() === this.oralCancer.toLowerCase()
              ) {
                this.oralChecked = true;
                this.generalDiagnosisForm.controls[
                  'oralCancerConfirmed'
                ].patchValue(true);
              } else if (
                item.trim().toLowerCase() === this.breastCancer.toLowerCase()
              ) {
                this.breastChecked = true;
                this.generalDiagnosisForm.controls[
                  'breastCancerConfirmed'
                ].patchValue(true);
              } else if (
                item.trim().toLowerCase() === this.cervicalCancer.toLowerCase()
              ) {
                this.cervicalChecked = true;
                this.generalDiagnosisForm.controls[
                  'cervicalCancerConfirmed'
                ].patchValue(true);
              }
            });
          }
        },
      );
  }
  diagnosisSubscription!: Subscription;
  getDiagnosisDetails() {
    this.diagnosisSubscription =
      this.doctorService.populateCaserecordResponse$.subscribe((res) => {
        if (res && res.statusCode === 200 && res.data && res.data.diagnosis) {
          this.generalDiagnosisForm.patchValue(res.data.diagnosis);
          if (res.data.diagnosis.provisionalDiagnosisList) {
            this.patchDiagnosisDetails(
              res.data.diagnosis.provisionalDiagnosisList,
            );
          }
        }
      });
  }

  MMUdiagnosisSubscription: any;
  getMMUDiagnosisDetails(
    beneficiaryRegID: any,
    visitID: any,
    visitCategory: any,
    visitCode: any,
  ) {
    this.MMUdiagnosisSubscription =
      this.doctorService.getMMUCaseRecordAndReferDetails(
        beneficiaryRegID,
        visitID,
        visitCategory,
        visitCode,
      );
    if (this.MMUdiagnosisSubscription) {
      this.MMUdiagnosisSubscription.subscribe((res: any) => {
        if (res && res.statusCode === 200 && res.data && res.data.diagnosis) {
          this.generalDiagnosisForm.patchValue(res.data.diagnosis);
          if (res.data.diagnosis.provisionalDiagnosisList) {
            this.patchDiagnosisDetails(
              res.data.diagnosis.provisionalDiagnosisList,
            );
          }
        }
      });
    }
  }

  patchDiagnosisDetails(provisionalDiagnosis: any) {
    const savedDiagnosisData = provisionalDiagnosis;
    const diagnosisArrayList = this.generalDiagnosisForm.controls[
      'provisionalDiagnosisList'
    ] as FormArray;
    if (
      provisionalDiagnosis[0].term !== '' &&
      provisionalDiagnosis[0].conceptID !== ''
    ) {
      for (let i = 0; i < savedDiagnosisData.length; i++) {
        diagnosisArrayList.at(i).patchValue({
          viewProvisionalDiagnosisProvided: savedDiagnosisData[i].term,
          term: savedDiagnosisData[i].term,
          conceptID: savedDiagnosisData[i].conceptID,
        });
        (<FormGroup>diagnosisArrayList.at(i)).controls[
          'viewProvisionalDiagnosisProvided'
        ].disable();
        if (diagnosisArrayList.length < savedDiagnosisData.length)
          this.addDiagnosis();
      }
    }
  }

  addDiagnosis() {
    const diagnosisArrayList = this.generalDiagnosisForm.controls[
      'provisionalDiagnosisList'
    ] as FormArray;
    if (diagnosisArrayList.length <= 29) {
      diagnosisArrayList.push(this.utils.initProvisionalDiagnosisList());
    } else {
      this.confirmationService.alert(
        this.current_language_set.alerts.info.maxDiagnosis,
      );
    }
  }

  removeDiagnosisFromList(
    index: any,
    diagnosisList: AbstractControl<any, any>,
  ) {
    const diagnosisListForm = this.generalDiagnosisForm.controls[
      'provisionalDiagnosisList'
    ] as FormArray;
    if (!diagnosisListForm.at(index).invalid) {
      this.confirmationService
        .confirm(`warn`, this.current_language_set.alerts.info.warn)
        .subscribe((result) => {
          if (result) {
            const diagnosisListForm = this.generalDiagnosisForm.controls[
              'provisionalDiagnosisList'
            ] as FormArray;
            if (diagnosisListForm.length > 1) {
              diagnosisListForm.removeAt(index);
            } else {
              diagnosisListForm.removeAt(index);
              diagnosisListForm.push(this.utils.initProvisionalDiagnosisList());
            }
          }
        });
    } else if (diagnosisListForm.length > 1) {
      diagnosisListForm.removeAt(index);
    } else {
      diagnosisListForm.removeAt(index);
      diagnosisListForm.push(this.utils.initProvisionalDiagnosisList());
    }
  }

  checkProvisionalDiagnosisValidity(provisionalDiagnosis: any) {
    const temp = provisionalDiagnosis.value;
    if (temp.term && temp.conceptID) {
      return false;
    } else {
      return true;
    }
  }
  updateIfDiseaseConfirmed() {
    this.idrsScoreService.visitDiseases$.subscribe((response) => {
      this.confirmed = response;
    });
    if (this.confirmed !== null && this.confirmed.length > 0) {
      this.confirmed.forEach((checkForDiabetesAndHyper: any) => {
        if (
          checkForDiabetesAndHyper === 'Diabetes' &&
          checkForDiabetesAndHyper === 'Hypertension'
        ) {
          this.generalDiagnosisForm.patchValue({ diabetesConfirmed: true });
          this.diabetesChecked = true;
          this.hyperTensionChecked = true;
          this.generalDiagnosisForm.controls['diabetesConfirmed'].disable();
          this.generalDiagnosisForm.controls['hypertensionConfirmed'].disable();
          this.generalDiagnosisForm.patchValue({ hypertensionConfirmed: true });
          this.generalDiagnosisForm.patchValue({ diabetesConfirmed: true });
        } else if (checkForDiabetesAndHyper === 'Diabetes') {
          this.generalDiagnosisForm.patchValue({ diabetesConfirmed: true });
          this.diabetesChecked = true;
          this.generalDiagnosisForm.controls['diabetesConfirmed'].disable();
        } else if (checkForDiabetesAndHyper === 'Hypertension') {
          this.generalDiagnosisForm.patchValue({ hypertensionConfirmed: true });
          this.hyperTensionChecked = true;
          this.generalDiagnosisForm.controls['hypertensionConfirmed'].disable();
        } else {
          console.log('confirm diseases');
        }
      });
    } else {
      console.log('No confirmed diseases');
    }
  }
  addToConfirmScreeningDisease(value: any, name: any) {
    let flag = false;
    let i = null;
    if (value === true) {
      this.confirmDiseaseArray2.forEach((item: any) => {
        if (item === name) flag = true;
      });
      if (!flag) {
        this.confirmDiseaseArray2.push(name);
        this.ncdScreeningService.setConfirmedDiseasesForScreening(
          this.confirmDiseaseArray2,
        );
      }
    } else {
      this.confirmDiseaseArray2.forEach((item: any, index: any) => {
        if (item === name) {
          flag = true;
          i = index;
        }
      });
      if (flag) {
        this.confirmDiseaseArray2.splice(i, 1);
        this.ncdScreeningService.setConfirmedDiseasesForScreening(
          this.confirmDiseaseArray2,
        );
      }
    }
  }
  addToConfirmDisease(diabetesConfirmation: any) {
    this.idrsScoreService.finalDiagnosisDiabetesConfirm(diabetesConfirmation);
  }

  addHyperTensionToConfirmDisease(hyperConfirmation: any) {
    this.idrsScoreService.finalDiagnosisHypertensionConfirm(hyperConfirmation);
  }
  diabetesScreeningStatus() {
    this.diabetesScreeningStatusSubscription =
      this.ncdScreeningService.diabetesStatus$.subscribe((diabetesstatus) => {
        this.diabetesSuspected = diabetesstatus;
        if (this.diabetesSuspected === false)
          this.generalDiagnosisForm.controls[
            'diabetesScreeningConfirmed'
          ].reset();
      });
  }
  hypertensionScreeningStatus() {
    this.hypertensionScreeningStatusSubscription =
      this.ncdScreeningService.hypertensionStatus$.subscribe(
        (hypertensionstatus) => {
          this.hypertensionSuspected = hypertensionstatus;
          if (this.hypertensionSuspected === false)
            this.generalDiagnosisForm.controls[
              'hypertensionScreeningConfirmed'
            ].reset();
        },
      );
  }
  oralScreeningStatus() {
    this.oralScreeningStatusSubscription =
      this.ncdScreeningService.oralStatus$.subscribe((oralstatus) => {
        this.oralSuspected = oralstatus;
        if (this.oralSuspected === false)
          this.generalDiagnosisForm.controls['oralCancerConfirmed'].reset();
      });
  }
  breastScreeningStatus() {
    this.breastScreeningStatusSubscription =
      this.ncdScreeningService.breastStatus$.subscribe((breaststatus) => {
        this.breastSuspected = breaststatus;
        if (this.breastSuspected === false)
          this.generalDiagnosisForm.controls['breastCancerConfirmed'].reset();
      });
  }
  cervicalScreeningStatus() {
    this.cervicalScreeningStatusSubscription =
      this.ncdScreeningService.cervicalStatus$.subscribe((cervicalstatus) => {
        this.cervicalSuspected = cervicalstatus;
        if (this.cervicalSuspected === false)
          this.generalDiagnosisForm.controls['cervicalCancerConfirmed'].reset();
      });
  }
  resetSuspectedVar() {
    this.hypertensionSuspected = false;
    this.oralSuspected = false;
    this.breastSuspected = false;
    this.cervicalSuspected = false;
    this.diabetesSuspected = false;
  }
  ngOnDestroy() {
    this.resetSuspectedVar();
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
    if (this.confirmDiseasesSubscription)
      this.confirmDiseasesSubscription.unsubscribe();
    if (this.diagnosisSubscription) {
      this.diagnosisSubscription.unsubscribe();
    }
    if (this.previousVisitConfirmedDiseasesSubscription) {
      this.previousVisitConfirmedDiseasesSubscription.unsubscribe();
    }
  }

  onDiagnosisInputKeyup(value: string, index: number) {
    if (value.length >= 3) {
      this.masterdataService
        .searchDiagnosisBasedOnPageNo(value, index)
        .subscribe((results: any) => {
          this.suggestedDiagnosisList[index] = results?.data?.sctMaster;
        });
    } else {
      this.suggestedDiagnosisList[index] = [];
    }
  }

  displayDiagnosis(diagnosis: any): string {
    return diagnosis?.term || '';
  }

  onDiagnosisSelected(selected: any, index: number) {
    // this.patientQuickConsultForm.get(['provisionalDiagnosisList', index])?.setValue(selected);
    const diagnosisFormArray = this.generalDiagnosisForm.get(
      'provisionalDiagnosisList',
    ) as FormArray;
    const diagnosisFormGroup = diagnosisFormArray.at(index) as FormGroup;

    // Set the nested and top-level fields
    diagnosisFormGroup.patchValue({
      viewProvisionalDiagnosisProvided: selected,
      conceptID: selected?.conceptID || null,
      term: selected?.term || null,
    });
  }
}
