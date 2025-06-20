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
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { MasterdataService, DoctorService } from '../../../shared/services';
import { BeneficiaryDetailsService } from '../../../../core/services/beneficiary-details.service';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-general-immunization-history',
  templateUrl: './immunization-history.component.html',
  styleUrls: ['./immunization-history.component.css'],
})
export class ImmunizationHistoryComponent
  implements OnInit, DoCheck, OnDestroy
{
  @Input()
  immunizationHistoryForm: any;

  @Input()
  mode!: string;

  @Input()
  visitCategory: any;

  masterData: any;
  temp: any;
  beneficiaryAge: any;
  currentLanguageSet: any;

  constructor(
    private fb: FormBuilder,
    private masterdataService: MasterdataService,
    private doctorService: DoctorService,
    public httpServiceService: HttpServiceService,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    readonly sessionstorage: SessionStorageService,
  ) {}
  /**Modified by JA354063 */
  /** Code optimization required */
  ngOnInit() {
    this.assignSelectedLanguage();
    this.getMasterData();
  }
  ngDoCheck() {
    this.assignSelectedLanguage();
  }

  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  nurseMasterDataSubscription: any;
  getMasterData() {
    this.nurseMasterDataSubscription =
      this.masterdataService.nurseMasterData$.subscribe((masterData) => {
        if (masterData && masterData.childVaccinations) {
          this.masterData = masterData;
          this.getBeneficiaryDetails();
          this.filterImmunizationList(masterData.childVaccinations);
        }
      });
  }
  beneficiaryDetailSubscription: any;
  getBeneficiaryDetails() {
    this.beneficiaryDetailSubscription =
      this.beneficiaryDetailsService.beneficiaryDetails$.subscribe(
        (beneficiary) => {
          if (
            beneficiary !== null &&
            beneficiary.age !== undefined &&
            beneficiary.age !== null
          ) {
            const calculateAgeInYears = beneficiary.age.split('-')[0].trim();
            const calculateAgeInMonths = beneficiary.age.split('-')[1]
              ? beneficiary.age.split('-')[1].trim()
              : '';
            if (calculateAgeInMonths !== '0 months') {
              const ageInYear = this.getAgeValue(calculateAgeInYears);
              const ageInMonth = this.getAgeValue(calculateAgeInMonths);
              this.beneficiaryAge = ageInYear + ageInMonth + ' days';
            } else {
              this.beneficiaryAge = beneficiary.age.split('-')[0].trim();
            }
          }
        },
      );
  }

  filterImmunizationList(list: any) {
    const immunizationAge: any = [];
    const temp: any = [];

    list.forEach((element: any) => {
      if (
        immunizationAge.indexOf(element.vaccinationTime) < 0 &&
        this.getAgeValue(element.vaccinationTime) <=
          this.getAgeValue(this.beneficiaryAge) &&
        element.vaccinationTime.trim().toLowerCase() !== '9-12 months' &&
        element.vaccinationTime.trim().toLowerCase() !== '5-6 years'
      )
        immunizationAge.push(element.vaccinationTime);
    });

    immunizationAge.sort((prev: any, next: any) => {
      return this.getAgeValue(prev) - this.getAgeValue(next);
    });

    immunizationAge.forEach((item: any) => {
      const vaccines: any = [];
      list.forEach((element: any) => {
        if (element.vaccinationTime === item) {
          if (element.sctCode !== null) {
            vaccines.push({
              vaccine: element.vaccineName,
              sctCode: element.sctCode,
              sctTerm: element.sctTerm,
              status: false,
              hide: false,
            });
          } else {
            vaccines.push({
              vaccine: element.vaccineName,
              sctCode: null,
              sctTerm: null,
              status: false,
              hide: false,
            });
          }
        }
      });

      vaccines.forEach((value: any) => {
        if (
          value.vaccine.toLowerCase() === 'fipv-2' ||
          value.vaccine.toLowerCase() === 'pentavalent-2' ||
          value.vaccine.toLowerCase() === 'rota vaccine-2' ||
          value.vaccine.toLowerCase() === 'opv-2' ||
          value.vaccine.toLowerCase() === 'pcv2' ||
          value.vaccine.toLowerCase() === 'pentavalent-3' ||
          value.vaccine.toLowerCase() === 'rota vaccine-3' ||
          value.vaccine.toLowerCase() === 'opv-3'
        ) {
          value.hide = true;
        }
        if (
          (value.vaccine.toLowerCase() === 'bcg' ||
            value.vaccine.toLowerCase() === 'pentavalent-1' ||
            value.vaccine.toLowerCase() === 'rota vaccine-1') &&
          this.getAgeValue(this.beneficiaryAge) > 360
        ) {
          value.hide = true;
        }
        if (
          (value.vaccine.toLowerCase() === 'opv-0' &&
            this.getAgeValue(this.beneficiaryAge) > 14) ||
          (value.vaccine.toLowerCase() === 'hbv-0' &&
            this.getAgeValue(this.beneficiaryAge) > 2)
        ) {
          value.hide = true;
        }
      });
      let count = 0;
      vaccines.forEach((vaccineStatus: any) => {
        if (vaccineStatus.hide === true) {
          count = count + 1;
        }
      });
      if (count === vaccines.length) {
        temp.push({
          defaultReceivingAge: item,
          vaccines: vaccines,
          hideSelectAll: true,
        });
      } else {
        temp.push({
          defaultReceivingAge: item,
          vaccines: vaccines,
          hideSelectAll: false,
        });
      }
    });

    this.temp = temp;
    this.initImmunizationForm();
  }
  getAgeValue(age: any) {
    if (!age) return 0;
    const arr = age !== undefined && age !== null ? age.trim().split(' ') : age;
    if (arr[1]) {
      const ageUnit = arr[1];
      if (ageUnit.toLowerCase() === 'years') return parseInt(arr[0]) * 12 * 30;
      else if (ageUnit.toLowerCase() === 'months') return parseInt(arr[0]) * 30;
      else if (ageUnit.toLowerCase() === 'weeks') return parseInt(arr[0]) * 7;
      else if (ageUnit.toLowerCase() === 'days') return parseInt(arr[0]);
    }
    return 0;
  }
  initImmunizationForm() {
    for (let i = 0; i < this.temp.length; i++) {
      this.addImmunization();
      for (let j = 0; j < this.temp[i].vaccines.length; j++) this.addVaccine(i);
    }
    (<FormArray>(
      this.immunizationHistoryForm.controls['immunizationList']
    )).patchValue(this.temp);

    if (String(this.mode) === 'view') {
      this.loadVaccineData();
    }

    const specialistFlagString = this.sessionstorage.getItem('specialistFlag');

    if (
      specialistFlagString !== null &&
      parseInt(specialistFlagString) === 100
    ) {
      this.loadVaccineData();
    }
  }
  addVaccine(i: any) {
    let vaccineList: any = [];
    const immunizationList = <FormArray>(
      this.immunizationHistoryForm.controls['immunizationList']
    );
    vaccineList = (<FormArray>immunizationList.controls[i]).get('vaccines');
    vaccineList.push(this.initVaccineList());
  }

  addImmunization() {
    const immunizationList = <FormArray>(
      this.immunizationHistoryForm.controls['immunizationList']
    );
    immunizationList.push(this.initImmunizationList());
  }
  initImmunizationList() {
    return this.fb.group({
      defaultReceivingAge: null,
      hideSelectAll: null,
      vaccines: this.fb.array([]),
    });
  }

  initVaccineList() {
    return this.fb.group({
      vaccine: null,
      sctCode: null,
      sctTerm: null,
      status: null,
      hide: null,
    });
  }
  count: any;
  immunizationHistorySubscription: any;
  loadVaccineData() {
    this.immunizationHistorySubscription =
      this.doctorService.populateHistoryResponse$.subscribe((history) => {
        if (
          history !== null &&
          history.statusCode === 200 &&
          history.data !== null &&
          history.data.ImmunizationHistory &&
          history.data.ImmunizationHistory.immunizationList
        ) {
          const temp = history.data.ImmunizationHistory;
          (<FormArray>(
            this.immunizationHistoryForm.controls['immunizationList']
          )).patchValue(temp.immunizationList);
          const immunizationList = <FormArray>(
            this.immunizationHistoryForm.controls['immunizationList']
          );
          let vaccineArray: any = null;
          for (let j = 0; j < immunizationList.length; j++) {
            const ageFormGroup = <FormGroup>immunizationList.controls[j];
            vaccineArray = ageFormGroup.controls['vaccines'];
            for (let i = 0; i < vaccineArray.length; i++) {
              const vaccineGroup = <FormGroup>vaccineArray.controls[i];
              if (
                vaccineGroup !== undefined &&
                vaccineGroup.controls['vaccine'] !== undefined &&
                vaccineGroup.controls['vaccine'] !== null &&
                vaccineGroup.controls['status'].value === true
              ) {
                vaccineGroup.patchValue({ hide: false });
              }
              this.onVaccineCheck(vaccineGroup);
            }
          }
        }
      });
  }

  selectAll(value: any, i: any) {
    const immunizationList = <FormArray>(
      this.immunizationHistoryForm.controls['immunizationList']
    );
    immunizationList.markAsDirty();
  }

  onVaccineCheck(vaccine: any) {
    //fipv-1
    if (
      vaccine !== undefined &&
      vaccine.controls['vaccine'] !== undefined &&
      vaccine.controls['vaccine'] !== null &&
      vaccine.controls['vaccine'].value.toLowerCase() === 'fipv-1' &&
      vaccine.controls['status'].value === true
    ) {
      this.makeVaccineHideShow('14 weeks', 'fipv-2', false);
    } else if (
      vaccine !== undefined &&
      vaccine.controls['vaccine'] !== undefined &&
      vaccine.controls['vaccine'] !== null &&
      vaccine.controls['vaccine'].value.toLowerCase() === 'fipv-1' &&
      vaccine.controls['status'].value === false
    ) {
      this.makeVaccineHideShow('14 weeks', 'fipv-2', true);
    }

    //Pentavalent-1
    if (
      vaccine !== undefined &&
      vaccine.controls['vaccine'] !== undefined &&
      vaccine.controls['vaccine'] !== null &&
      vaccine.controls['vaccine'].value.toLowerCase() === 'pentavalent-1' &&
      vaccine.controls['status'].value === true
    ) {
      this.makeVaccineHideShow('10 weeks', 'pentavalent-2', false);
    } else if (
      vaccine !== undefined &&
      vaccine.controls['vaccine'] !== undefined &&
      vaccine.controls['vaccine'] !== null &&
      vaccine.controls['vaccine'].value.toLowerCase() === 'pentavalent-1' &&
      vaccine.controls['status'].value === false
    ) {
      this.makeVaccineHideShow('10 weeks', 'pentavalent-2', true);
      this.makeVaccineHideShow('14 weeks', 'pentavalent-3', true);
    }

    //Pentavalent-2
    if (
      vaccine !== undefined &&
      vaccine.controls['vaccine'] !== undefined &&
      vaccine.controls['vaccine'] !== null &&
      vaccine.controls['vaccine'].value.toLowerCase() === 'pentavalent-2' &&
      vaccine.controls['status'].value === true
    ) {
      this.makeVaccineHideShow('14 weeks', 'pentavalent-3', false);
    } else if (
      vaccine !== undefined &&
      vaccine.controls['vaccine'] !== undefined &&
      vaccine.controls['vaccine'] !== null &&
      vaccine.controls['vaccine'].value.toLowerCase() === 'pentavalent-2' &&
      vaccine.controls['status'].value === false
    ) {
      this.makeVaccineHideShow('14 weeks', 'pentavalent-3', true);
    }
    //Rota vaccine 1
    if (
      vaccine !== undefined &&
      vaccine.controls['vaccine'] !== undefined &&
      vaccine.controls['vaccine'] !== null &&
      vaccine.controls['vaccine'].value.toLowerCase() === 'rota vaccine-1' &&
      vaccine.controls['status'].value === true
    ) {
      this.makeVaccineHideShow('10 weeks', 'rota vaccine-2', false);
    } else if (
      vaccine !== undefined &&
      vaccine.controls['vaccine'] !== undefined &&
      vaccine.controls['vaccine'] !== null &&
      vaccine.controls['vaccine'].value.toLowerCase() === 'rota vaccine-1' &&
      vaccine.controls['status'].value === false
    ) {
      this.makeVaccineHideShow('10 weeks', 'rota vaccine-2', true);
      this.makeVaccineHideShow('14 weeks', 'rota vaccine-3', true);
    }

    //Rota vaccine 2
    if (
      vaccine !== undefined &&
      vaccine.controls['vaccine'] !== undefined &&
      vaccine.controls['vaccine'] !== null &&
      vaccine.controls['vaccine'].value.toLowerCase() === 'rota vaccine-2' &&
      vaccine.controls['status'].value === true
    ) {
      this.makeVaccineHideShow('14 weeks', 'rota vaccine-3', false);
    } else if (
      vaccine !== undefined &&
      vaccine.controls['vaccine'] !== undefined &&
      vaccine.controls['vaccine'] !== null &&
      vaccine.controls['vaccine'].value.toLowerCase() === 'rota vaccine-2' &&
      vaccine.controls['status'].value === false
    ) {
      this.makeVaccineHideShow('14 weeks', 'rota vaccine-3', true);
    }
    //OPV 1
    if (
      vaccine !== undefined &&
      vaccine.controls['vaccine'] !== undefined &&
      vaccine.controls['vaccine'] !== null &&
      vaccine.controls['vaccine'].value.toLowerCase() === 'opv-1' &&
      vaccine.controls['status'].value === true
    ) {
      this.makeVaccineHideShow('10 weeks', 'opv-2', false);
    } else if (
      vaccine !== undefined &&
      vaccine.controls['vaccine'] !== undefined &&
      vaccine.controls['vaccine'] !== null &&
      vaccine.controls['vaccine'].value.toLowerCase() === 'opv-1' &&
      vaccine.controls['status'].value === false
    ) {
      this.makeVaccineHideShow('10 weeks', 'opv-2', true);
      this.makeVaccineHideShow('14 weeks', 'opv-3', true);
    }

    //OPV 2
    if (
      vaccine !== undefined &&
      vaccine.controls['vaccine'] !== undefined &&
      vaccine.controls['vaccine'] !== null &&
      vaccine.controls['vaccine'].value.toLowerCase() === 'opv-2' &&
      vaccine.controls['status'].value === true
    ) {
      this.makeVaccineHideShow('14 weeks', 'opv-3', false);
    } else if (
      vaccine !== undefined &&
      vaccine.controls['vaccine'] !== undefined &&
      vaccine.controls['vaccine'] !== null &&
      vaccine.controls['vaccine'].value.toLowerCase() === 'opv-2' &&
      vaccine.controls['status'].value === false
    ) {
      this.makeVaccineHideShow('14 weeks', 'opv-3', true);
    }

    //PCV 1
    if (
      vaccine !== undefined &&
      vaccine.controls['vaccine'] !== undefined &&
      vaccine.controls['vaccine'] !== null &&
      vaccine.controls['vaccine'].value.toLowerCase() === 'pcv1' &&
      vaccine.controls['status'].value === true
    ) {
      this.makeVaccineHideShow('14 weeks', 'pcv2', false);
    } else if (
      vaccine !== undefined &&
      vaccine.controls['vaccine'] !== undefined &&
      vaccine.controls['vaccine'] !== null &&
      vaccine.controls['vaccine'].value.toLowerCase() === 'pcv1' &&
      vaccine.controls['status'].value === false
    ) {
      this.makeVaccineHideShow('14 weeks', 'pcv2', true);
    }
  }

  // Hide and show the vaccines based on the status of the first dosage of the particular vaccine.
  makeVaccineHideShow(
    vaccineReceivingAge: any,
    vaccineName: any,
    hideValue: any,
  ) {
    const immunizationList = <FormArray>(
      this.immunizationHistoryForm.controls['immunizationList']
    );
    let vaccineArray: any = null;
    let enableSelectAll: any = null;
    let count = 0;

    if (immunizationList !== undefined && immunizationList.length > 0) {
      immunizationList.controls.forEach((element, j) => {
        const ageFormGroup = <FormGroup>immunizationList.controls[j];
        if (
          ageFormGroup !== undefined &&
          ageFormGroup.controls['defaultReceivingAge'].value &&
          ageFormGroup.controls['defaultReceivingAge'].value.toLowerCase() ===
            vaccineReceivingAge
        ) {
          vaccineArray = ageFormGroup.controls['vaccines'];
          enableSelectAll = j;
        }
      });
    }
    if (vaccineArray !== undefined && vaccineArray.length > 0) {
      vaccineArray.controls.forEach((value: any, i: any) => {
        const vaccineGroup = <FormGroup>vaccineArray.controls[i];
        if (
          vaccineGroup !== undefined &&
          vaccineGroup.controls['vaccine'] !== undefined &&
          vaccineGroup.controls['vaccine'] !== null &&
          vaccineGroup.controls['vaccine'].value.toLowerCase() === vaccineName
        ) {
          vaccineGroup.patchValue({ hide: hideValue });
          immunizationList.controls[enableSelectAll].patchValue({
            hideSelectAll: false,
          });
          if (hideValue === true) {
            vaccineGroup.patchValue({ status: false });
          }
        }
      });
      vaccineArray.controls.forEach((checkHideStatus: any) => {
        if (checkHideStatus.controls['hide'].value === true) {
          count = count + 1;
        }
      });
      if (count === vaccineArray.length) {
        immunizationList.controls[enableSelectAll].patchValue({
          hideSelectAll: true,
        });
      }
    }
  }
  // select ALL should enable if all the vaccines selected
  checkSelectALLValue(ageGroup: any) {
    const immunizationList = <FormArray>(
      this.immunizationHistoryForm.controls['immunizationList']
    );

    let vaccineArray: any = null;

    let flag = true;

    if (immunizationList !== undefined && immunizationList.length > 0) {
      immunizationList.controls.forEach((element, j) => {
        const ageFormGroup = <FormGroup>immunizationList.controls[j];

        if (
          ageFormGroup !== undefined &&
          ageFormGroup.controls['defaultReceivingAge'].value &&
          ageFormGroup.controls['defaultReceivingAge'].value.toLowerCase() ===
            ageGroup.toLowerCase()
        ) {
          vaccineArray = ageFormGroup.controls['vaccines'];

          vaccineArray.controls.forEach((value: any, i: any) => {
            const vaccineGroup = <FormGroup>vaccineArray.controls[i];

            if (
              vaccineGroup !== undefined &&
              vaccineGroup.controls['vaccine'] !== undefined &&
              vaccineGroup.controls['vaccine'] !== null &&
              vaccineGroup.controls['hide'].value !== true &&
              vaccineGroup.controls['status'].value === false
            ) {
              flag = false;
            }
          });
        }
      });

      return flag;
    }
  }
  ngOnDestroy() {
    if (this.nurseMasterDataSubscription)
      this.nurseMasterDataSubscription.unsubscribe();

    if (this.beneficiaryDetailSubscription)
      this.beneficiaryDetailSubscription.unsubscribe();
  }
}
