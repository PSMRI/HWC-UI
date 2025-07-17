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
import { BeneficiaryDetailsService } from '../../../../../core/services/beneficiary-details.service';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  AbstractControl,
} from '@angular/forms';
import { DoctorService } from '../../../../shared/services';
import { GeneralUtils } from '../../../../shared/utility';
import { ConfirmationService } from './../../../../../core/services/confirmation.service';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { Subscription } from 'rxjs';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from '@angular/material/core';
import {
  MomentDateAdapter,
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
} from '@angular/material-moment-adapter';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-pnc-diagnosis',
  templateUrl: './pnc-diagnosis.component.html',
  styleUrls: ['./pnc-diagnosis.component.css'],
  providers: [
    {
      provide: MAT_DATE_LOCALE,
      useValue: 'en-US', // Set the desired locale (e.g., 'en-GB' for dd/MM/yyyy)
    },
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },
    {
      provide: MAT_DATE_FORMATS,
      useValue: {
        parse: {
          dateInput: 'LL',
        },
        display: {
          dateInput: 'DD/MM/YYYY', // Set the desired display format
          monthYearLabel: 'MMM YYYY',
          dateA11yLabel: 'LL',
          monthYearA11yLabel: 'MMMM YYYY',
        },
      },
    },
  ],
})
export class PncDiagnosisComponent
  implements OnChanges, OnInit, DoCheck, OnDestroy
{
  utils = new GeneralUtils(this.fb, this.sessionstorage);
  @Input()
  generalDiagnosisForm!: FormGroup;

  @Input()
  caseRecordMode!: string;
  current_language_set: any;
  designation: any;
  specialist = false;

  constructor(
    private confirmationService: ConfirmationService,
    private fb: FormBuilder,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    private doctorService: DoctorService,
    public httpServiceService: HttpServiceService,
    readonly sessionstorage: SessionStorageService,
  ) {}

  beneficiaryAge: any;
  dob!: Date;
  today!: Date;
  minimumDeathDate!: Date;

  ngOnInit() {
    this.getBenificiaryDetails();
    this.today = new Date();
    this.dob = new Date();
    this.minimumDeathDate = new Date(
      this.today.getTime() - 365 * 24 * 60 * 60 * 1000,
    );
    this.assignSelectedLanguage();
    this.designation = this.sessionstorage.getItem('designation');
    if (this.designation === 'TC Specialist') {
      this.generalDiagnosisForm.controls['specialistDiagnosis'].enable();
      this.specialist = true;
    } else {
      this.generalDiagnosisForm.controls['specialistDiagnosis'].disable();
      this.specialist = false;
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

  ngOnDestroy() {
    if (this.beneficiaryDetailsSubscription)
      this.beneficiaryDetailsSubscription.unsubscribe();
    if (this.diagnosisSubscription) {
      this.diagnosisSubscription.unsubscribe();
    }
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

  get provisionalDiagnosisControls(): AbstractControl[] {
    return (
      (this.generalDiagnosisForm.get('provisionalDiagnosisList') as FormArray)
        ?.controls || []
    );
  }

  getConfirmatoryDiagnosisList(): AbstractControl[] | null {
    const confirmatoryDiagnosisListControl = this.generalDiagnosisForm.get(
      'confirmatoryDiagnosisList',
    );
    return confirmatoryDiagnosisListControl instanceof FormArray
      ? confirmatoryDiagnosisListControl.controls
      : null;
  }

  beneficiaryDetailsSubscription: any;
  getBenificiaryDetails() {
    this.beneficiaryDetailsSubscription =
      this.beneficiaryDetailsService.beneficiaryDetails$.subscribe(
        (beneficiaryDetails) => {
          if (beneficiaryDetails) {
            this.beneficiaryAge = beneficiaryDetails.ageVal;
            this.dob.setFullYear(
              this.today.getFullYear() - this.beneficiaryAge,
            );
          }
        },
      );
  }

  addProvisionalDiagnosis() {
    const provisionalDiagnosisArrayList = this.generalDiagnosisForm.controls[
      'provisionalDiagnosisList'
    ] as FormArray;
    if (provisionalDiagnosisArrayList.length < 30) {
      provisionalDiagnosisArrayList.push(
        this.utils.initProvisionalDiagnosisList(),
      );
    } else {
      this.confirmationService.alert(
        this.current_language_set.alerts.info.maxDiagnosis,
      );
    }
  }

  removeProvisionalDiagnosis(index: any, provisionalDiagnosisForm: any) {
    const provisionalDiagnosisArrayList = this.generalDiagnosisForm.controls[
      'provisionalDiagnosisList'
    ] as FormArray;
    if (provisionalDiagnosisArrayList.at(index).valid) {
      this.confirmationService
        .confirm(`warn`, this.current_language_set.alerts.info.warn)
        .subscribe((result) => {
          if (result) {
            if (provisionalDiagnosisArrayList.length > 1) {
              provisionalDiagnosisArrayList.removeAt(index);
            } else {
              provisionalDiagnosisForm.reset();
              provisionalDiagnosisForm.controls[
                'viewProvisionalDiagnosisProvided'
              ].enable();
            }
            this.generalDiagnosisForm.markAsDirty();
          }
        });
    } else {
      if (provisionalDiagnosisArrayList.length > 1) {
        provisionalDiagnosisArrayList.removeAt(index);
      } else {
        provisionalDiagnosisForm.reset();
        provisionalDiagnosisForm.controls[
          'viewProvisionalDiagnosisProvided'
        ].enable();
      }
    }
  }

  diagnosisSubscription!: Subscription;
  getDiagnosisDetails() {
    this.diagnosisSubscription =
      this.doctorService.populateCaserecordResponse$.subscribe((res) => {
        if (res && res.statusCode === 200 && res.data && res.data.diagnosis) {
          this.patchDiagnosisDetails(res.data.diagnosis);
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
          if (res.data.diagnosis) {
            this.patchDiagnosisDetails(res.data.diagnosis);
          }
          if (res.data.diagnosis.provisionalDiagnosisList) {
            this.patchDiagnosisDetails(
              res.data.diagnosis.provisionalDiagnosisList,
            );
          }
        }
      });
    }
  }

  patchDiagnosisDetails(diagnosis: any) {
    if (diagnosis.dateOfDeath)
      diagnosis.dateOfDeath = new Date(diagnosis.dateOfDeath);
    this.generalDiagnosisForm.patchValue(diagnosis);
    this.handleDiagnosisData(diagnosis);
  }
  handleDiagnosisData(diagnosis: any) {
    if (
      diagnosis.provisionalDiagnosisList &&
      diagnosis.provisionalDiagnosisList.length > 0
    ) {
      this.handleProvisionalDiagnosisData(diagnosis.provisionalDiagnosisList);
    }

    if (
      diagnosis.confirmatoryDiagnosisList &&
      diagnosis.confirmatoryDiagnosisList.length > 0
    ) {
      this.handleConfirmatoryDiagnosisData(diagnosis.confirmatoryDiagnosisList);
    }
  }
  handleProvisionalDiagnosisData(provisionalDiagnosisDataList: any) {
    const provisionalDiagnosisList = this.generalDiagnosisForm.controls[
      'provisionalDiagnosisList'
    ] as FormArray;
    for (let i = 0; i < provisionalDiagnosisDataList.length; i++) {
      provisionalDiagnosisList.at(i).patchValue({
        viewProvisionalDiagnosisProvided: provisionalDiagnosisDataList[i].term,
        term: provisionalDiagnosisDataList[i].term,
        conceptID: provisionalDiagnosisDataList[i].conceptID,
      });
      (<FormGroup>provisionalDiagnosisList.at(i)).controls[
        'viewProvisionalDiagnosisProvided'
      ].disable();
      this.addProvisionalDiagnosis();
    }
  }

  handleConfirmatoryDiagnosisData(confirmatoryDiagnosisDataList: any) {
    const confirmatoryDiagnosisList = this.generalDiagnosisForm.controls[
      'confirmatoryDiagnosisList'
    ] as FormArray;
    for (let i = 0; i < confirmatoryDiagnosisDataList.length; i++) {
      confirmatoryDiagnosisList.at(i).patchValue({
        viewConfirmatoryDiagnosisProvided:
          confirmatoryDiagnosisDataList[i].term,
        term: confirmatoryDiagnosisDataList[i].term,
        conceptID: confirmatoryDiagnosisDataList[i].conceptID,
      });
      (<FormGroup>confirmatoryDiagnosisList.at(i)).controls[
        'viewConfirmatoryDiagnosisProvided'
      ].disable();
      if (
        confirmatoryDiagnosisList.length < confirmatoryDiagnosisDataList.length
      )
        this.addConfirmatoryDiagnosis();
    }
  }

  checkWithDeathDetails() {
    this.generalDiagnosisForm.patchValue({
      placeOfDeath: null,
      dateOfDeath: null,
      causeOfDeath: null,
    });
  }

  get isMaternalDeath() {
    return this.generalDiagnosisForm.controls['isMaternalDeath'].value;
  }
  addConfirmatoryDiagnosis() {
    const confirmatoryDiagnosisArrayList = this.generalDiagnosisForm.controls[
      'confirmatoryDiagnosisList'
    ] as FormArray;
    if (confirmatoryDiagnosisArrayList.length < 30) {
      confirmatoryDiagnosisArrayList.push(
        this.utils.initConfirmatoryDiagnosisList(),
      );
    } else {
      this.confirmationService.alert(
        this.current_language_set.alerts.info.maxDiagnosis,
      );
    }
  }
  removeConfirmatoryDiagnosis(index: any, confirmatoryDiagnosisForm: any) {
    const confirmatoryDiagnosisFormArrayList = this.generalDiagnosisForm
      .controls['confirmatoryDiagnosisList'] as FormArray;
    if (confirmatoryDiagnosisFormArrayList.at(index).valid) {
      this.confirmationService
        .confirm(`warn`, this.current_language_set.alerts.info.warn)
        .subscribe((result) => {
          if (result) {
            if (confirmatoryDiagnosisFormArrayList.length > 1) {
              confirmatoryDiagnosisFormArrayList.removeAt(index);
            } else {
              confirmatoryDiagnosisForm.reset();
              confirmatoryDiagnosisForm.controls[
                'viewConfirmatoryDiagnosisProvided'
              ].enable();
            }
            this.generalDiagnosisForm.markAsDirty();
          }
        });
    } else {
      if (confirmatoryDiagnosisFormArrayList.length > 1) {
        confirmatoryDiagnosisFormArrayList.removeAt(index);
      } else {
        confirmatoryDiagnosisForm.reset();
        confirmatoryDiagnosisForm.controls[
          'viewConfirmatoryDiagnosisProvided'
        ].enable();
      }
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

  checkConfirmatoryDiagnosisValidity(confirmatoryDiagnosis: any) {
    const temp = confirmatoryDiagnosis.value;
    if (temp.term && temp.conceptID) {
      return false;
    } else {
      return true;
    }
  }
}
