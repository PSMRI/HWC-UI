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
  FormBuilder,
  FormGroup,
  FormArray,
  AbstractControl,
} from '@angular/forms';
import {
  MasterdataService,
  NurseService,
  DoctorService,
} from '../../../shared/services';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { BeneficiaryDetailsService } from '../../../../core/services/beneficiary-details.service';
import { MatDialog } from '@angular/material/dialog';
import { RegistrarService } from 'src/app/app-modules/registrar/shared/services/registrar.service';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { PreviousDetailsComponent } from 'src/app/app-modules/core/components/previous-details/previous-details.component';
import { ValidationUtils } from '../../../shared/utility/validation-utility';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-general-other-vaccines',
  templateUrl: './other-vaccines.component.html',
  styleUrls: ['./other-vaccines.component.css'],
})
export class OtherVaccinesComponent implements OnInit, DoCheck, OnDestroy {
  @Input()
  otherVaccinesForm!: FormGroup;

  @Input()
  mode!: string;

  @Input()
  visitCategory: any;

  masterData: any;
  registrarMasterData: any;
  otherVaccineData: any;

  vaccineMasterData: any = [];
  previousSelectedVaccineList: any = [];
  vaccineSelectList: any = [];
  currentLanguageSet: any;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private nurseService: NurseService,
    private doctorService: DoctorService,
    private registrarService: RegistrarService,
    public httpServiceService: HttpServiceService,
    private confirmationService: ConfirmationService,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    private masterdataService: MasterdataService,
    readonly sessionstorage: SessionStorageService,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.getMasterData();
    this.getBeneficiaryDetails();
    this.callMasterDataObservable();
  }

  ngOnDestroy() {
    if (this.nurseMasterDataSubscription)
      this.nurseMasterDataSubscription.unsubscribe();

    if (this.generalHistorySubscription)
      this.generalHistorySubscription.unsubscribe();

    if (this.beneficiaryDetailSubscription)
      this.beneficiaryDetailSubscription.unsubscribe();
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

  getOtherVaccines(): AbstractControl[] | null {
    const otherVaccinesControl = this.otherVaccinesForm.get('otherVaccines');
    return otherVaccinesControl instanceof FormArray
      ? otherVaccinesControl.controls
      : null;
  }

  onAgeUnitEntered(index: any, vaccineForm: AbstractControl<any, any>) {
    const ageUnit = this.registrarMasterData.ageUnit;
    console.log('ageUnit', ageUnit);
    ageUnit.forEach((element: any, i: any) => {
      if (element.name === vaccineForm.value.ageUnit) {
        vaccineForm.patchValue({
          ageUnit: element.name,
          ageUnitID: element.id,
        });
      }
    });
    this.validateAge(vaccineForm);
  }

  nurseMasterDataSubscription: any;
  getMasterData() {
    this.nurseMasterDataSubscription =
      this.masterdataService.nurseMasterData$.subscribe((masterData) => {
        if (masterData) {
          this.masterData = masterData;
          this.vaccineMasterData = masterData.vaccineMasterData;

          this.addOtherVaccine();

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

  generalHistorySubscription: any;
  getGeneralHistory() {
    this.generalHistorySubscription =
      this.doctorService.populateHistoryResponse$.subscribe((history) => {
        if (
          history !== null &&
          history.statusCode === 200 &&
          history.data !== null &&
          history.data.childOptionalVaccineHistory
        ) {
          this.otherVaccineData = history.data.childOptionalVaccineHistory;
          this.handleOtherVaccinesData();
        }
      });
  }
  callMasterDataObservable() {
    this.registrarService.getRegistrationMaster(1);
    this.loadMasterDataObservable();
  }

  /**
   *
   * Load Master Data of Id Cards as Observable
   */
  masterDataSubscription: any;
  loadMasterDataObservable() {
    this.masterDataSubscription =
      this.registrarService.registrationMasterDetails$.subscribe((res) => {
        console.log('Registrar master data', res);
        if (res !== null) {
          this.registrarMasterData = Object.assign({}, res);
          console.log('master data', this.registrarMasterData);
        }
      });
  }
  handleOtherVaccinesData() {
    const formArray = this.otherVaccinesForm.controls[
      'otherVaccines'
    ] as FormArray;
    const temp = this.otherVaccineData.childOptionalVaccineList.slice();

    for (let i = 0; i < temp.length; i++) {
      const vaccines = this.vaccineMasterData.filter((item: any) => {
        return item.vaccineName === temp[i].vaccineName;
      });

      if (vaccines.length > 0) temp[i].vaccineName = vaccines[0];

      if (temp[i].vaccineName) {
        const k: any = formArray.get('' + i);
        k.patchValue(temp[i]);
        k.markAsTouched();
        this.filterOtherVaccineList(temp[i].vaccineName, i);
      }

      if (i + 1 < temp.length) this.addOtherVaccine();
    }
    console.log('this.othervaccine', this.otherVaccinesForm);
  }

  addOtherVaccine() {
    const otherVaccineList = <FormArray>(
      this.otherVaccinesForm.controls['otherVaccines']
    );
    const temp = otherVaccineList.value;
    let result = [];

    if (this.vaccineMasterData) {
      result = this.vaccineMasterData.filter((item: any) => {
        const arr = temp.filter((value: any) => {
          if (
            value.vaccineName !== null &&
            value.vaccineName.vaccineName !== 'Other'
          )
            return value.vaccineName.vaccineName === item.vaccineName;
        });
        const flag = arr.length === 0 ? true : false;
        return flag;
      });
    }
    this.vaccineSelectList.push(result.slice());
    otherVaccineList.push(this.initOtherVaccinesForm());
  }

  filterOtherVaccineList(
    event: any,
    i: any,
    vaccineForm?: AbstractControl<any, any>,
  ) {
    const vaccine: any = event.value;
    const previousValue = this.previousSelectedVaccineList[i];
    const snomedCTCode = vaccine.sctCode;
    const snomedCTTerm = vaccine.sctTerm;
    if (vaccineForm && vaccine.vaccineName !== 'Other') {
      vaccineForm.patchValue({ otherVaccineName: null });
      if (vaccine.sctCode !== null) {
        vaccineForm.patchValue({
          sctCode: snomedCTCode,
          sctTerm: snomedCTTerm,
        });
      } else {
        vaccineForm.patchValue({ sctCode: null, sctTerm: null });
      }
    }

    if (previousValue) {
      this.vaccineSelectList.map((item: any, t: any) => {
        if (t !== i && previousValue.vaccineName !== 'Other') {
          item.push(previousValue);
          this.sortOtherVaccineList(item);
        }
      });
    }

    this.vaccineSelectList.map((item: any, t: any) => {
      const index = item.indexOf(vaccine);
      if (index !== -1 && t !== i && vaccine.vaccineName !== 'Other')
        item = item.splice(index, 1);
    });

    this.previousSelectedVaccineList[i] = vaccine;
  }

  removeOtherVaccine(i: any, vaccineForm?: AbstractControl<any, any>) {
    this.confirmationService
      .confirm(`warn`, this.currentLanguageSet.alerts.info.warn)
      .subscribe((result) => {
        if (result) {
          const otherVaccineList = <FormArray>(
            this.otherVaccinesForm.controls['otherVaccines']
          );
          this.otherVaccinesForm.markAsDirty();
          if (!!vaccineForm && otherVaccineList.length === 1) {
            vaccineForm.reset();
          } else {
            const removedValue = this.previousSelectedVaccineList[i];

            this.vaccineSelectList.map((item: any, t: any) => {
              if (
                t !== i &&
                !!removedValue &&
                removedValue.vaccineName !== 'Other'
              ) {
                item.push(removedValue);
                this.sortOtherVaccineList(item);
              }
            });

            this.previousSelectedVaccineList.splice(i, 1);
            this.vaccineSelectList.splice(i, 1);
            otherVaccineList.removeAt(i);
          }
        }
      });
  }

  initOtherVaccinesForm() {
    return this.fb.group({
      vaccineName: null,
      sctCode: null,
      sctTerm: null,
      otherVaccineName: null,
      actualReceivingAge: null,
      ageUnit: null,
      ageUnitID: null,
      receivedFacilityName: null,
    });
  }

  getPreviousOtherVaccineDetails() {
    const benRegID = this.sessionstorage.getItem('beneficiaryRegID') || '{}';
    this.nurseService
      .getPreviousOtherVaccines(benRegID, this.visitCategory)
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
        title: this.currentLanguageSet.common.prevVaccine,
      },
    });
  }

  validateAge(formGroup: any) {
    if (
      formGroup.value.actualReceivingAge !== undefined &&
      formGroup.value.actualReceivingAge !== null &&
      formGroup.value.ageUnit !== undefined &&
      formGroup.value.ageUnit !== null
    ) {
      const actualReceivingAge = formGroup.value.actualReceivingAge;
      const ageUnit = formGroup.value.ageUnit;
      const flag = new ValidationUtils().validateDuration(
        actualReceivingAge,
        ageUnit,
        this.beneficiary.age,
      );
      if (!flag) {
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.ageOfReceivingVaccine,
        );
        formGroup.patchValue({ actualReceivingAge: null });
        formGroup.patchValue({ ageUnitID: null });
        formGroup.patchValue({ ageUnit: null });
      }
    } else if (
      (formGroup.value.actualReceivingAge === undefined ||
        formGroup.value.actualReceivingAge === null) &&
      formGroup.value.ageUnit !== undefined &&
      formGroup.value.ageUnit !== null
    ) {
      formGroup.patchValue({ ageUnitID: null });
      formGroup.patchValue({ ageUnit: null });
    }
  }

  sortOtherVaccineList(otherVaccineList: any) {
    otherVaccineList.sort((a: any, b: any) => {
      if (a.vaccineName === b.vaccineName) return 0;
      if (a.vaccineName < b.vaccineName) return -1;
      else return 1;
    });
  }

  checkValidity(otherVaccineForm: any) {
    const temp = otherVaccineForm.value;
    if (
      temp.vaccineName &&
      temp.actualReceivingAge &&
      temp.receivedFacilityName
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
}
