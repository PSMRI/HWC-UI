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
  DoCheck,
  OnChanges,
  OnDestroy,
} from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  FormArray,
  AbstractControl,
} from '@angular/forms';
import {
  MasterdataService,
  NurseService,
  DoctorService,
} from '../../../shared/services';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { ValidationUtils } from '../../../shared/utility/validation-utility';
import { BeneficiaryDetailsService } from '../../../../core/services/beneficiary-details.service';
import { MatDialog } from '@angular/material/dialog';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { HrpService } from '../../../shared/services/hrp.service';
import { PreviousDetailsComponent } from 'src/app/app-modules/core/components/previous-details/previous-details.component';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { AmritTrackingService } from 'Common-UI/src/tracking';

@Component({
  selector: 'app-general-comorbidity-concurrent-conditions',
  templateUrl: './comorbidity-concurrent-conditions.component.html',
  styleUrls: ['./comorbidity-concurrent-conditions.component.css'],
})
export class ComorbidityConcurrentConditionsComponent
  implements OnChanges, OnInit, DoCheck, OnDestroy
{
  @Input()
  comorbidityConcurrentConditionsForm!: FormGroup;

  @Input()
  mode!: string;

  @Input()
  visitCategory: any;

  comorbidtyData: any;
  comorbidityMasterData: any;
  comorbidityFilteredMasterData: any;
  previousSelectedComorbidity: any = [];
  comorbiditySelectList: any = [];
  currentLanguageSet: any;
  ComorbidStatus = 'false';
  comorbidConditionHrp: any = [];

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private nurseService: NurseService,
    private hrpService: HrpService,
    private doctorService: DoctorService,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    private confirmationService: ConfirmationService,
    public httpServiceService: HttpServiceService,
    private masterdataService: MasterdataService,
    readonly sessionstorage: SessionStorageService,
    private trackingService: AmritTrackingService,
  ) {
    this.nurseService.listen().subscribe((m: any) => {
      console.log(m);
      this.onComorbidFilterClick(m);
    });
  }
  onComorbidFilterClick(comorb: any) {
    const comorbidstat = this.sessionstorage.getItem('setComorbid');

    const visitCat = this.sessionstorage.getItem('visiCategoryANC');
    if (comorbidstat === 'true' && visitCat === 'COVID-19 Screening') {
      this.ComorbidStatus = 'true';
    } else {
      this.ComorbidStatus = 'false';
    }
  }

  ngOnInit() {
    this.comorbidConditionHrp = [];
    this.assignSelectedLanguage();
    this.getMasterData();
    this.getBeneficiaryDetails();
    this.hrpService.setcomorbidityConcurrentConditions(
      this.comorbidConditionHrp,
    );
  }
  ngOnChanges() {
    console.log('test');
  }

  ngOnDestroy() {
    if (this.nurseMasterDataSubscription)
      this.nurseMasterDataSubscription.unsubscribe();

    if (this.generalHistorySubscription)
      this.generalHistorySubscription.unsubscribe();

    if (this.beneficiaryDetailSubscription)
      this.beneficiaryDetailSubscription.unsubscribe();
  }

  getcomorbidityConcurrentConditions(): AbstractControl[] | null {
    const comorbidityConcurrentConditionsControl =
      this.comorbidityConcurrentConditionsForm.get(
        'comorbidityConcurrentConditionsList',
      );
    return comorbidityConcurrentConditionsControl instanceof FormArray
      ? comorbidityConcurrentConditionsControl.controls
      : null;
  }

  beneficiaryDetailSubscription: any;
  beneficiary: any;
  getBeneficiaryDetails() {
    this.beneficiaryDetailSubscription =
      this.beneficiaryDetailsService.beneficiaryDetails$.subscribe(
        (beneficiary) => {
          this.beneficiary = beneficiary;
        },
      );
  }

  nurseMasterDataSubscription: any;
  getMasterData() {
    this.nurseMasterDataSubscription =
      this.masterdataService.nurseMasterData$.subscribe((masterData) => {
        if (masterData) {
          this.comorbidityMasterData = masterData.comorbidConditions;
          this.comorbidityFilteredMasterData = masterData.comorbidConditions;

          this.addComorbidityConcurrentConditions();
          const specialistFlagString =
            this.sessionstorage.getItem('specialistFlag');

          if (String(this.mode) === 'view') {
            this.getGeneralHistory();
          }
          if (
            specialistFlagString !== null &&
            parseInt(specialistFlagString) === 100
          ) {
            this.getGeneralHistory();
          }
        }
      });
  }

  generalHistorySubscription: any;
  getGeneralHistory() {
    this.generalHistorySubscription =
      this.doctorService.populateHistoryResponse$.subscribe((history) => {
        if (
          history !== null &&
          history.statusCode === 200 &&
          history.data !== null &&
          history.data.ComorbidityConditions
        ) {
          this.comorbidtyData = history.data.ComorbidityConditions;
          this.handleComorbidityData();
        }
      });
  }

  handleComorbidityData() {
    const formArray = this.comorbidityConcurrentConditionsForm.controls[
      'comorbidityConcurrentConditionsList'
    ] as FormArray;
    const temp =
      this.comorbidtyData.comorbidityConcurrentConditionsList.slice();

    for (let i = 0; i < temp.length; i++) {
      const comorbidityTypeArr = this.comorbidityMasterData.filter(
        (item: any) => {
          return item.comorbidCondition === temp[i].comorbidCondition;
        },
      );

      if (comorbidityTypeArr.length > 0)
        temp[i].comorbidConditions = comorbidityTypeArr[0];

      if (temp[i].isForHistory !== undefined && temp[i].isForHistory !== null) {
        if (temp[i].isForHistory === true) {
          temp[i].isForHistory = false;
        } else {
          temp[i].isForHistory = true;
        }
      }

      if (temp[i].comorbidCondition) {
        const k: any = formArray.get('' + i);
        k.patchValue(temp[i]);
        k.markAsDirty();
        k.markAsTouched();
        this.filterComorbidityConcurrentConditionsType(
          temp[i].comorbidCondition,
          i,
        );
        if (
          k?.get('comorbidConditions')?.value !== null &&
          k?.get('timePeriodAgo')?.value !== null &&
          k?.get('timePeriodUnit')?.value !== null
        ) {
          k?.get('timePeriodAgo')?.enable();
          k?.get('timePeriodUnit')?.enable();
          k?.get('isForHistory')?.enable();
        }
      }

      if (i + 1 < temp.length) this.addComorbidityConcurrentConditions();
    }
  }

  addComorbidityConcurrentConditions() {
    const comorbidityConcurrentConditionsList = <FormArray>(
      this.comorbidityConcurrentConditionsForm.controls[
        'comorbidityConcurrentConditionsList'
      ]
    );
    const temp = comorbidityConcurrentConditionsList.value;

    if (this.comorbidityFilteredMasterData) {
      const result = this.comorbidityFilteredMasterData.filter((item: any) => {
        const arr = temp.filter((value: any) => {
          if (
            value.comorbidConditions !== null &&
            value.comorbidConditions.comorbidCondition !== 'Other'
          )
            return (
              value.comorbidConditions.comorbidCondition ===
              item.comorbidCondition
            );
          else return false;
        });
        if (item.comorbidCondition === 'None' && temp.length > 0) return false;
        else if (arr.length === 0) return true;
        else return false;
      });

      this.comorbiditySelectList.push(result.slice());
    }
    comorbidityConcurrentConditionsList.push(
      this.initComorbidityConcurrentConditions(),
    );
  }

  removeComorbidityConcurrentConditions(
    i: any,
    comorbidityConcurrentConditionsForm?: AbstractControl<any, any>,
  ) {
    this.confirmationService
      .confirm(`warn`, this.currentLanguageSet.alerts.info.warn)
      .subscribe((result) => {
        if (result) {
          const comorbidityConcurrentConditionsList = <FormArray>(
            this.comorbidityConcurrentConditionsForm.controls[
              'comorbidityConcurrentConditionsList'
            ]
          );
          if (
            comorbidityConcurrentConditionsList.length === 1 &&
            !!comorbidityConcurrentConditionsForm
          ) {
            comorbidityConcurrentConditionsForm.patchValue({
              comorbidConditions: null,
              otherComorbidCondition: null,
              timePeriodAgo: null,
              timePeriodUnit: null,
              isForHistory: null,
            });
            this.comorbidConditionHrp = [];
            this.hrpService.setcomorbidityConcurrentConditions(
              this.comorbidConditionHrp,
            );
            comorbidityConcurrentConditionsForm
              ?.get('timePeriodAgo')
              ?.disable();
            comorbidityConcurrentConditionsForm
              ?.get('timePeriodUnit')
              ?.disable();
            comorbidityConcurrentConditionsForm?.get('isForHistory')?.disable();
            comorbidityConcurrentConditionsForm.markAsUntouched();
          } else {
            const removedValue = this.previousSelectedComorbidity[i];

            this.comorbiditySelectList.map((item: any, t: any) => {
              if (
                t !== i &&
                removedValue &&
                removedValue.comorbidCondition !== 'Other'
              ) {
                item.push(removedValue);
                this.sortComorbidityList(item);
              }
            });

            this.previousSelectedComorbidity.splice(i, 1);
            this.comorbiditySelectList.splice(i, 1);

            comorbidityConcurrentConditionsList.removeAt(i);
            this.comorbidConditionHrp = [];
            for (
              let a = 0;
              a < comorbidityConcurrentConditionsList.length;
              a++
            ) {
              const comorbidityConditionForm = <FormGroup>(
                comorbidityConcurrentConditionsList.controls[a]
              );
              this.comorbidConditionHrp.push(
                comorbidityConditionForm.controls['comorbidConditions'].value
                  .comorbidCondition,
              );
            }
            this.hrpService.setcomorbidityConcurrentConditions(
              this.comorbidConditionHrp,
            );
          }
          this.comorbidityConcurrentConditionsForm.markAsDirty();
        }
      });
  }

  filterComorbidityConcurrentConditionsType(
    comorbidityConcurrentConditions: any,
    i: any,
    comorbidityConcurrentConditionsForm?: AbstractControl<any, any>,
  ) {
    const previousValue = this.previousSelectedComorbidity[i];
    if (comorbidityConcurrentConditions.comorbidCondition === 'None') {
      this.removeComorbidityExecptNone();
    }
    if (
      comorbidityConcurrentConditionsForm &&
      comorbidityConcurrentConditions.comorbidCondition !== 'Other'
    )
      comorbidityConcurrentConditionsForm.patchValue({
        otherComorbidCondition: null,
      });
    if (previousValue) {
      this.comorbiditySelectList.map((item: any, t: any) => {
        if (t !== i && previousValue.comorbidCondition !== 'Other') {
          item.push(previousValue);
          this.sortComorbidityList(item);
        }
      });
    }

    this.comorbiditySelectList.map((item: any, t: any) => {
      const index = item.indexOf(comorbidityConcurrentConditions);
      if (
        index !== -1 &&
        t !== i &&
        comorbidityConcurrentConditions.comorbidCondition !== 'Other'
      )
        item = item.splice(index, 1);
    });

    this.previousSelectedComorbidity[i] = comorbidityConcurrentConditions;
    if (
      comorbidityConcurrentConditionsForm !== undefined &&
      comorbidityConcurrentConditions !== undefined &&
      comorbidityConcurrentConditions.comorbidCondition !== undefined
    ) {
      this.comorbidConditionHrp.push(
        comorbidityConcurrentConditions.comorbidCondition,
      );
      this.hrpService.setcomorbidityConcurrentConditions(
        this.comorbidConditionHrp,
      );
    }
    if (
      comorbidityConcurrentConditionsForm === undefined &&
      comorbidityConcurrentConditions !== undefined
    ) {
      this.comorbidConditionHrp.push(comorbidityConcurrentConditions);
      this.hrpService.setcomorbidityConcurrentConditions(
        this.comorbidConditionHrp,
      );
    }
    //To disable the fields
    if (
      comorbidityConcurrentConditions.comorbidCondition !== 'Nil' &&
      comorbidityConcurrentConditions.comorbidCondition !== 'None'
    ) {
      comorbidityConcurrentConditionsForm?.get('timePeriodAgo')?.enable();
      comorbidityConcurrentConditionsForm?.get('isForHistory')?.enable();
      comorbidityConcurrentConditionsForm?.get('timePeriodAgo')?.reset();
    } else {
      comorbidityConcurrentConditionsForm?.get('timePeriodAgo')?.disable();
      comorbidityConcurrentConditionsForm?.get('timePeriodAgo')?.reset();
      comorbidityConcurrentConditionsForm?.get('timePeriodUnit')?.disable();
      comorbidityConcurrentConditionsForm?.get('timePeriodUnit')?.reset();
      comorbidityConcurrentConditionsForm?.get('isForHistory')?.disable();
      comorbidityConcurrentConditionsForm?.get('isForHistory')?.reset();
    }
  }

  removeComorbidityExecptNone() {
    const comorbidityConcurrentConditionsList = <FormArray>(
      this.comorbidityConcurrentConditionsForm.controls[
        'comorbidityConcurrentConditionsList'
      ]
    );

    while (comorbidityConcurrentConditionsList.length > 1) {
      const i = comorbidityConcurrentConditionsList.length - 1;

      const removedValue = this.previousSelectedComorbidity[i];
      if (removedValue) this.comorbiditySelectList[0].push(removedValue);

      this.sortComorbidityList(this.comorbiditySelectList[0]);

      comorbidityConcurrentConditionsList.removeAt(i);
      this.previousSelectedComorbidity.splice(i, 1);
      this.comorbiditySelectList.splice(i, 1);
    }
  }

  getPreviousComorbidityHistory() {
    const benRegID: any = this.sessionstorage.getItem('beneficiaryRegID');
    this.nurseService
      .getPreviousComorbidityHistory(benRegID, this.visitCategory)
      .subscribe(
        (res: any) => {
          if (res.statusCode === 200 && res.data !== null) {
            if (res.data.data.length > 0) {
              this.viewPreviousData(res.data);
            } else {
              this.confirmationService.alert(
                this.currentLanguageSet.historyData.ancHistory
                  .previousHistoryDetails.pastHistoryalert,
              );
            }
          } else {
            this.confirmationService.alert(
              this.currentLanguageSet.alerts.info.errorFetchingHistory,
              'error',
            );
          }
        },
        (err) => {
          this.confirmationService.alert(
            this.currentLanguageSet.alerts.info.errorFetchingHistory,
            'error',
          );
        },
      );
  }

  viewPreviousData(data: any) {
    this.dialog.open(PreviousDetailsComponent, {
      data: {
        dataList: data,
        title:
          this.currentLanguageSet.historyData.comorbiditycondition
            .previouscomorbidityhistory,
      },
    });
  }

  initComorbidityConcurrentConditions() {
    return this.fb.group({
      comorbidConditions: null,
      otherComorbidCondition: null,
      timePeriodAgo: { value: null, disabled: true },
      timePeriodUnit: { value: null, disabled: true },
      isForHistory: { value: null, disabled: true },
    });
  }

  validateDuration(formGroup: AbstractControl<any, any>, event?: Event) {
    let duration = null;
    let durationUnit = null;
    let flag = true;

    if (formGroup.value.timePeriodAgo) duration = formGroup.value.timePeriodAgo;

    if (formGroup.value.timePeriodUnit)
      durationUnit = formGroup.value.timePeriodUnit;

    if (duration !== null && durationUnit !== null)
      flag = new ValidationUtils().validateDuration(
        duration,
        durationUnit,
        this.beneficiary.age,
      );

    if (!flag) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.durationGreaterThanAge,
      );
      formGroup.patchValue({ timePeriodAgo: null, timePeriodUnit: null });
    }
    //to disable
    if (duration && !durationUnit) {
      formGroup?.get('timePeriodUnit')?.enable();
      formGroup?.get('timePeriodUnit')?.reset();
    } else if (!duration) {
      formGroup?.get('timePeriodUnit')?.disable();
      formGroup?.get('timePeriodUnit')?.reset();
    }
  }

  sortComorbidityList(comorbidityList: any) {
    comorbidityList.sort((a: any, b: any) => {
      if (a.comorbidCondition === b.comorbidCondition) return 0;
      if (a.comorbidCondition < b.comorbidCondition) return -1;
      else return 1;
    });
  }

  checkValidity(comorbidityConcurrentConditions: AbstractControl<any, any>) {
    if (
      comorbidityConcurrentConditions?.get('comorbidConditions')?.value &&
      comorbidityConcurrentConditions?.get('timePeriodAgo')?.value &&
      comorbidityConcurrentConditions?.get('timePeriodUnit')?.value
    ) {
      return false;
    } else {
      return true;
    }
  }
  ngDoCheck() {
    this.assignSelectedLanguage();
  }

  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  setInactiveForHistory(event: any) {
    // if (event.checked) {
    // } else {
    // }
  }

  trackFieldInteraction(fieldName: string) {
    this.trackingService.trackFieldInteraction(fieldName, 'Comorbidity');
  }
}
