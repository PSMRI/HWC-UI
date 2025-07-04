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
import { PreviousDetailsComponent } from 'src/app/app-modules/core/components/previous-details/previous-details.component';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-general-medication-history',
  templateUrl: './medication-history.component.html',
  styleUrls: ['./medication-history.component.css'],
})
export class MedicationHistoryComponent implements OnInit, DoCheck, OnDestroy {
  @Input()
  medicationHistoryForm!: FormGroup;
  medicationHistoryData: any;
  masterData: any;

  @Input()
  mode!: string;

  @Input()
  visitCategory: any;
  currentLanguageSet: any;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private nurseService: NurseService,
    private doctorService: DoctorService,
    private confirmationService: ConfirmationService,
    private masterdataService: MasterdataService,
    public httpServiceService: HttpServiceService,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    readonly sessionstorage: SessionStorageService,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.getMasterData();
    this.getBeneficiaryDetails();
    this.addMedicationHistory();
  }
  ngOnDestroy() {
    if (this.nurseMasterDataSubscription)
      this.nurseMasterDataSubscription.unsubscribe();
    if (this.generalHistorySubscription)
      this.generalHistorySubscription.unsubscribe();
    if (this.beneficiaryDetailSubscription)
      this.beneficiaryDetailSubscription.unsubscribe();
  }

  nurseMasterDataSubscription: any;
  getMasterData() {
    this.nurseMasterDataSubscription =
      this.masterdataService.nurseMasterData$.subscribe((masterData) => {
        if (masterData) {
          this.masterData = masterData;

          if (String(this.mode) === 'view') {
            this.getGeneralHistory();
          }
          const specialistFlagString =
            this.sessionstorage.getItem('specialistFlag');

          if (
            specialistFlagString !== null &&
            parseInt(specialistFlagString) === 100
          ) {
            this.getGeneralHistory();
          }
        }
      });
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

  generalHistorySubscription: any;
  getGeneralHistory() {
    this.generalHistorySubscription =
      this.doctorService.populateHistoryResponse$.subscribe((history) => {
        if (
          history !== null &&
          history.statusCode === 200 &&
          history.data !== null &&
          history.data.MedicationHistory
        ) {
          this.medicationHistoryData = history.data.MedicationHistory;
          this.handleMedicationHistoryData();
        }
      });
  }

  handleMedicationHistoryData() {
    const formArray = this.medicationHistoryForm.controls[
      'medicationHistoryList'
    ] as FormArray;
    const temp = this.medicationHistoryData.medicationHistoryList.slice();
    for (let i = 1; i < temp.length; i++) {
      this.addMedicationHistory();
    }
    formArray.patchValue(temp);
    for (const formGroup of formArray.controls) {
      if (formGroup instanceof FormGroup) {
        if (
          formGroup?.get('timePeriodAgo')?.value !== null &&
          formGroup?.get('timePeriodUnit')?.value !== null
        ) {
          formGroup?.get('timePeriodAgo')?.enable();
          formGroup?.get('timePeriodUnit')?.enable();
        }
        formGroup.markAsTouched();
        formGroup.markAsDirty();
      }
    }
    formArray.markAsTouched();
    formArray.markAsDirty();
  }

  addMedicationHistory() {
    const medicationHistoryList = <FormArray>(
      this.medicationHistoryForm.controls['medicationHistoryList']
    );
    medicationHistoryList.push(this.initMedicationHistory());
  }

  getMedicationHistory(): AbstractControl[] | null {
    const getMedicationHistory = this.medicationHistoryForm.get(
      'medicationHistoryList',
    );
    return getMedicationHistory instanceof FormArray
      ? getMedicationHistory.controls
      : null;
  }

  removeMedicationHistory(
    i: any,
    medicationHistoryForm?: AbstractControl<any, any>,
  ) {
    this.confirmationService
      .confirm(`warn`, this.currentLanguageSet.alerts.info.warn)
      .subscribe((result) => {
        if (result) {
          const medicationHistoryList = <FormArray>(
            this.medicationHistoryForm.controls['medicationHistoryList']
          );
          this.medicationHistoryForm.markAsDirty();
          if (medicationHistoryList.length === 1 && !!medicationHistoryForm) {
            medicationHistoryList.controls[i].patchValue({
              currentMedication: null,
              timePeriodAgo: null,
              timePeriodUnit: null,
            });
            // to disable the fields
            medicationHistoryForm?.get('timePeriodAgo')?.disable();
            medicationHistoryForm?.get('timePeriodUnit')?.disable();
          } else medicationHistoryList.removeAt(i);
          this.medicationHistoryForm.updateValueAndValidity();
          console.log(this.medicationHistoryForm.dirty);
        }
      });
  }

  createMedicationHistoryForm() {
    this.medicationHistoryForm = this.fb.group({
      medicationHistoryList: new FormArray([this.initMedicationHistory()]),
    });
  }

  getPreviousMedicationHistory() {
    const benRegID: any = this.sessionstorage.getItem('beneficiaryRegID');
    this.nurseService
      .getPreviousMedicationHistory(benRegID, this.visitCategory)
      .subscribe(
        (res: any) => {
          if (res.statusCode === 200 && res.data !== null) {
            if (res.data.data.length > 0) {
              this.viewPreviousData(res.data);
            } else {
              this.confirmationService.alert(
                this.currentLanguageSet.alerts.info.pastHistoryNot,
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
          this.currentLanguageSet.historyData.Medicationhistorydetails
            .previousmedicationhistorydetails,
      },
    });
  }

  initMedicationHistory() {
    return this.fb.group({
      currentMedication: null,
      timePeriodAgo: { value: null, disabled: true },
      timePeriodUnit: { value: null, disabled: true },
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
    if (duration && !durationUnit) {
      formGroup?.get('timePeriodUnit')?.enable();
      formGroup?.get('timePeriodUnit')?.reset();
    } else if (!duration) {
      formGroup?.get('timePeriodUnit')?.disable();
      formGroup?.get('timePeriodUnit')?.reset();
    }
  }

  checkValidity(medicationForm: AbstractControl<any, any>) {
    if (
      medicationForm?.get('currentMedication')?.value &&
      medicationForm?.get('timePeriodAgo')?.value &&
      medicationForm?.get('timePeriodUnit')?.value
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
  enableDuration(medicationHistory?: AbstractControl<any, any>) {
    if (medicationHistory?.value?.currentMedication) {
      medicationHistory?.get('timePeriodAgo')?.enable();
      medicationHistory?.get('timePeriodAgo')?.reset();
    } else {
      medicationHistory?.get('timePeriodAgo')?.disable();
      medicationHistory?.get('timePeriodAgo')?.reset();
      medicationHistory?.get('timePeriodUnit')?.disable();
      medicationHistory?.get('timePeriodUnit')?.reset();
    }
  }
}
