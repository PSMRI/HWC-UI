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
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { PreviousImmunizationServiceDetailsComponent } from 'src/app/app-modules/core/components/previous-immunization-service-details/previous-immunization-service-details.component';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import {
  BeneficiaryDetailsService,
  ConfirmationService,
} from 'src/app/app-modules/core/services';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { NurseService } from '../../shared/services/nurse.service';
import { DoctorService, MasterdataService } from '../../shared/services';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-form-immunization-history',
  templateUrl: './form-immunization-history.component.html',
  styleUrls: ['./form-immunization-history.component.css'],
})
export class FormImmunizationHistoryComponent
  implements OnChanges, OnInit, DoCheck, OnDestroy
{
  @Input()
  immunizationHistoryMode: any;

  @Input()
  neonatalImmunizationHistoryForm: any;

  masterData: any;
  temp: any;
  beneficiaryAge: any;
  currentLanguageSet: any;

  vaccineReceivedStatus = [
    {
      name: 'Received',
      receivedStatus: true,
    },
    {
      name: 'Not Received',
      receivedStatus: false,
    },
  ];

  vaccineReceivedList: any = [];
  attendant: any;
  infantAndBirthHistoryDetailsSubscription: Subscription | undefined;

  constructor(
    private fb: FormBuilder,
    private masterdataService: MasterdataService,
    private doctorService: DoctorService,
    public httpServiceService: HttpServiceService,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private nurseService: NurseService,
    private confirmationService: ConfirmationService,
    readonly sessionstorage: SessionStorageService,
  ) {}
  ngOnInit() {
    this.assignSelectedLanguage();
    this.attendant = this.route.snapshot.params['attendant'];
    this.getMasterData();

    this.doctorService.fetchInfantDataCheck$.subscribe((responsevalue) => {
      if (responsevalue === true) {
        this.getNurseFetchDetails();
      }
    });
  }
  ngDoCheck() {
    this.assignSelectedLanguage();
  }

  ngOnChanges() {
    console.log('success');
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
          this.vaccineReceivedList =
            this.masterData.m_birthdosevaccinationreceivedat;
          this.filterImmunizationMasterList(masterData.childVaccinations);
        }
      });
  }
  filterImmunizationMasterList(list: any) {
    const immunizationAge: any[] = [];
    const temp: any = [];

    list.forEach((element: any) => {
      if (
        immunizationAge.indexOf(element.vaccinationTime) < 0 &&
        this.getAgeValue(element.vaccinationTime) <=
          this.getAgeValue(this.beneficiaryAge)
      )
        if (
          element.vaccinationTime.toLowerCase() !== '9 months' &&
          element.vaccinationTime.toLowerCase() !== '5 years'
        ) {
          if (
            this.getAgeValue(this.beneficiaryAge) <= 6935 &&
            this.getAgeValue(element.vaccinationTime) <=
              this.getAgeValue(this.beneficiaryAge)
          ) {
            immunizationAge.push(element.vaccinationTime);
          }
        }
    });

    immunizationAge.sort((prev, next) => {
      return this.getAgeValue(prev) - this.getAgeValue(next);
    });

    immunizationAge.forEach((item) => {
      const vaccines: any[] = [];
      list.forEach((element: any) => {
        if (element.vaccinationTime === item) {
          if (element.sctCode !== null) {
            vaccines.push({
              vaccine: element.vaccineName,
              sctCode: element.sctCode,
              sctTerm: element.sctTerm,
              status: null,
            });
          } else {
            vaccines.push({
              vaccine: element.vaccineName,
              sctCode: null,
              sctTerm: null,
              status: null,
            });
          }
        }
      });

      temp.push({
        defaultReceivingAge: item,
        enableVaccinationReceivedAt: false,
        vaccinationReceivedAtID: null,
        vaccinationReceivedAt: null,
        vaccines: vaccines,
      });
    });

    this.temp = temp;
    this.initImmunizationForm();

    //for fetching previous visit immunization history
    if (this.attendant === 'nurse') {
      this.getPreviousImmunizationHistoryDetails();
    }
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

  getAgeValue(age: any) {
    if (!age) return 0;
    const arr = age !== undefined && age !== null ? age.trim().split(' ') : age;
    if (arr[1]) {
      const ageUnit = arr[1];
      if (ageUnit.toLowerCase() === 'years') {
        if (arr[0] === '5-6') {
          return 5 * 12 * 30;
        } else return parseInt(arr[0]) * 12 * 30;
      } else if (ageUnit.toLowerCase() === 'months') {
        if (arr[0] === '9-12') return 9 * 30;
        else if (arr[0] === '16-24') return 16 * 30;
        else return parseInt(arr[0]) * 30;
      } else if (ageUnit.toLowerCase() === 'weeks') return parseInt(arr[0]) * 7;
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
      this.neonatalImmunizationHistoryForm.controls['immunizationList']
    )).patchValue(this.temp);

    if (String(this.immunizationHistoryMode) === 'view') {
      this.getNurseFetchDetails();
    }
    const specialistFlagString = this.sessionstorage.getItem('specialistFlag');
    if (
      specialistFlagString !== null &&
      parseInt(specialistFlagString) === 100
    ) {
      this.getNurseFetchDetails();
    }
  }
  addVaccine(i: any) {
    const immunizationList = <FormArray>(
      this.neonatalImmunizationHistoryForm.controls['immunizationList']
    );
    const vaccineList: any = (<FormArray>immunizationList.controls[i]).get(
      'vaccines',
    ) as FormArray;

    vaccineList.push(this.initVaccineList());
  }

  addImmunization() {
    const immunizationList = <FormArray>(
      this.neonatalImmunizationHistoryForm.controls['immunizationList']
    );
    immunizationList.push(this.initImmunizationList());
  }
  initImmunizationList() {
    return this.fb.group({
      defaultReceivingAge: null,
      enableVaccinationReceivedAt: false,
      vaccinationReceivedAtID: null,
      vaccinationReceivedAt: null,
      vaccines: this.fb.array([]),
    });
  }

  initVaccineList() {
    return this.fb.group({
      vaccine: null,
      sctCode: null,
      sctTerm: null,
      status: null,
    });
  }

  getNurseFetchDetails() {
    if (
      this.doctorService.birthAndImmunizationDetailsFromNurse !== undefined &&
      this.doctorService.birthAndImmunizationDetailsFromNurse !== null &&
      this.doctorService.birthAndImmunizationDetailsFromNurse
        .immunizationHistory !== undefined &&
      this.doctorService.birthAndImmunizationDetailsFromNurse
        .immunizationHistory !== null
    ) {
      const formImmunizationHistoryData =
        this.doctorService.birthAndImmunizationDetailsFromNurse
          .immunizationHistory;

      if (
        formImmunizationHistoryData &&
        formImmunizationHistoryData.immunizationList
      ) {
        const temp = formImmunizationHistoryData;
        (<FormArray>(
          this.neonatalImmunizationHistoryForm.controls['immunizationList']
        )).patchValue(temp.immunizationList);

        //For enabling received at dropdown
        const immunizationListData =
          this.neonatalImmunizationHistoryForm.controls['immunizationList']
            .value;

        const immunizationListValues = <FormArray>(
          this.neonatalImmunizationHistoryForm.controls['immunizationList']
        );

        immunizationListData.forEach((item: any, indexValue: any) => {
          this.vaccineReceivedList.forEach(
            (vaccineValues: any, indexValues: any) => {
              if (vaccineValues.name === item.vaccinationReceivedAt) {
                const formArray = immunizationListValues
                  .at(indexValue)
                  .get('vaccinationReceivedAtID') as FormControl;
                if (formArray) {
                  formArray.patchValue(vaccineValues.id);
                }
              }
            },
          );
          this.enableReceivedAt(indexValue);
        });
      }
    }
  }

  getPreviousImmunizationHistoryDetails() {
    this.infantAndBirthHistoryDetailsSubscription =
      this.doctorService.infantAndImmunizationData$.subscribe((res) => {
        if (
          res !== undefined &&
          res !== null &&
          res.immunizationHistory !== undefined &&
          res.immunizationHistory !== null
        ) {
          const formImmunizationHistoryData = res.immunizationHistory;

          if (
            formImmunizationHistoryData &&
            formImmunizationHistoryData.immunizationList
          ) {
            const temp = formImmunizationHistoryData;
            (<FormArray>(
              this.neonatalImmunizationHistoryForm.controls['immunizationList']
            )).patchValue(temp.immunizationList);

            //For enabling received at dropdown
            const immunizationListData =
              this.neonatalImmunizationHistoryForm.controls['immunizationList']
                .value;

            const immunizationListValues = <FormArray>(
              this.neonatalImmunizationHistoryForm.controls['immunizationList']
            );

            immunizationListData.forEach((item: any, indexValue: any) => {
              this.vaccineReceivedList.forEach(
                (vaccineValues: any, indexValues: any) => {
                  if (vaccineValues.name === item.vaccinationReceivedAt) {
                    const formArray = immunizationListValues
                      .at(indexValue)
                      .get('vaccinationReceivedAtID') as FormControl;
                    if (formArray) {
                      formArray.patchValue(vaccineValues.id);
                    }
                  }
                },
              );
              this.enableReceivedAt(indexValue);
            });
          }
        }
      });
  }

  ngOnDestroy() {
    const immunizationList = <FormArray>(
      this.neonatalImmunizationHistoryForm.controls['immunizationList']
    );
    while (immunizationList.length) {
      immunizationList.removeAt(0);
    }
    this.neonatalImmunizationHistoryForm.reset();
    this.vaccineReceivedList = [];
    if (this.nurseMasterDataSubscription)
      this.nurseMasterDataSubscription.unsubscribe();

    if (this.beneficiaryDetailSubscription)
      this.beneficiaryDetailSubscription.unsubscribe();

    if (this.infantAndBirthHistoryDetailsSubscription)
      this.infantAndBirthHistoryDetailsSubscription.unsubscribe();
  }

  setVaccineReceivedAt(index: any) {
    const immunizationList = <FormArray>(
      this.neonatalImmunizationHistoryForm.controls['immunizationList']
    );
    const receivedAtId = immunizationList
      .at(index)
      .get('vaccinationReceivedAtID') as FormControl;
    this.vaccineReceivedList.filter((item: any) => {
      if (item.id === receivedAtId.value) {
        const formArray = immunizationList
          .at(index)
          .get('vaccinationReceivedAt') as FormControl;
        if (formArray) {
          formArray.patchValue(item.name);
        }
      }
    });

    // for enabling update button in doctor
    String(this.immunizationHistoryMode) === 'view' ||
    String(this.immunizationHistoryMode) === 'update'
      ? this.doctorService.BirthAndImmunizationValueChanged(true)
      : null;
  }

  enableReceivedAt(index: any) {
    const immunizationList = <FormArray>(
      this.neonatalImmunizationHistoryForm.controls['immunizationList']
    );

    const vaccineControl = (immunizationList.controls[index] as FormGroup)
      .controls['vaccines'];

    const vaccineArray = vaccineControl.value;

    let flag = false;
    vaccineArray.filter((item: any) => {
      if (item.status === true) {
        flag = true;
      }
    });

    if (flag) {
      const formArray = immunizationList
        .at(index)
        .get('enableVaccinationReceivedAt') as FormControl;
      if (formArray) {
        formArray.patchValue(true);
      }
    } else {
      const formArray = immunizationList
        .at(index)
        .get('enableVaccinationReceivedAt') as FormControl;
      if (formArray) {
        formArray.patchValue(false);
      }
      const formArray1 = immunizationList
        .at(index)
        .get('vaccinationReceivedAtID') as FormControl;
      if (formArray1) {
        formArray.patchValue(null);
      }
      const formArray3 = immunizationList
        .at(index)
        .get('vaccinationReceivedAt') as FormControl;
      if (formArray3) {
        formArray.patchValue(null);
      }
    }
    // for enabling update button in doctor
    String(this.immunizationHistoryMode) === 'view' ||
    String(this.immunizationHistoryMode) === 'update'
      ? this.doctorService.BirthAndImmunizationValueChanged(true)
      : null;
  }

  getPreviousImmunizationServicesHistory() {
    const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
    this.nurseService.getPreviousImmunizationServicesData(benRegID).subscribe(
      (res: any) => {
        if (res !== null && res.data !== null) {
          if (res.data.length > 0) {
            this.viewPreviousDetails(res.data);
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
      (err: any) => {
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.errorFetchingHistory,
          'error',
        );
      },
    );
  }

  viewPreviousDetails(data: any) {
    this.dialog.open(PreviousImmunizationServiceDetailsComponent, {
      data: {
        dataList: data,
        title: this.currentLanguageSet.previousImmunizationServicesDetails,
      },
    });
  }
  getimmunizationList(): any {
    return (
      this.neonatalImmunizationHistoryForm.get('immunizationList') as FormArray
    ).controls;
  }
  getVaccines(form: FormGroup): any {
    return (form.get('vaccines') as FormGroup).controls;
  }
}
