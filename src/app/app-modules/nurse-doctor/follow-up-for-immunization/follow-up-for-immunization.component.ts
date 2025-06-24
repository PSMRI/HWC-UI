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
import { DatePipe } from '@angular/common';
import { Component, DoCheck, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { SetLanguageComponent } from '../../core/components/set-language.component';
import { BeneficiaryDetailsService } from '../../core/services/beneficiary-details.service';
import { HttpServiceService } from '../../core/services/http-service.service';
import { Subscription } from 'rxjs';
import { DoctorService } from '../shared/services/doctor.service';
import { MasterdataService } from '../shared/services/masterdata.service';
import { GeneralUtils } from '../shared/utility/general-utility';
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
  selector: 'app-follow-up-for-immunization',
  templateUrl: './follow-up-for-immunization.component.html',
  styleUrls: ['./follow-up-for-immunization.component.css'],
  providers: [
    {
      provide: DatePipe,
    },
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
export class FollowUpForImmunizationComponent
  implements OnInit, DoCheck, OnDestroy
{
  @Input()
  patientFollowUpImmunizationForm!: FormGroup;

  @Input()
  followUpImmunizationMode!: string;

  @Input()
  visitCategory: any;

  futureDate = new Date();
  currentLanguageSet: any;

  utils = new GeneralUtils(this.fb, this.sessionstorage);
  dueVaccines: any = [];
  nextImmunizationSession: any = [];
  male = false;
  totalMonths!: number;
  benAge: any;
  female = false;
  beneficiary: any;
  beneficiaryAge: any;

  constructor(
    private httpServiceService: HttpServiceService,
    private fb: FormBuilder,
    private doctorService: DoctorService,
    public datepipe: DatePipe,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    private masterdataService: MasterdataService,
    readonly sessionstorage: SessionStorageService,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.visitCategory = this.sessionstorage.getItem('visitCategory');
    this.futureDate.setDate(this.futureDate.getDate() + 1);
    this.loadMasterData();
    this.getBenificiaryDetails();
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  benGenderAndAge: any;
  beneficiaryDetailSubscription: any;
  getBenificiaryDetails() {
    this.beneficiaryDetailSubscription =
      this.beneficiaryDetailsService.beneficiaryDetails$.subscribe(
        (beneficiaryDetails) => {
          if (beneficiaryDetails) {
            this.beneficiary = beneficiaryDetails;
            const calculateAgeInYears = beneficiaryDetails.age
              .split('-')[0]
              .trim();
            const calculateAgeInMonths = beneficiaryDetails.age.split('-')[1]
              ? beneficiaryDetails.age.split('-')[1].trim()
              : '';
            if (calculateAgeInMonths !== '0 months') {
              const ageInYear = this.getAgeValueNew(calculateAgeInYears);
              const ageInMonth = this.getAgeValueNew(calculateAgeInMonths);

              this.beneficiaryAge = ageInYear + ageInMonth + ' days';
            } else {
              this.beneficiaryAge = beneficiaryDetails.age.split('-')[0].trim();
            }
          }
        },
      );
  }

  getAgeValueNew(age: any) {
    if (!age) return 0;
    const arr = age !== undefined && age !== null ? age.trim().split(' ') : age;
    if (arr[1]) {
      const ageUnit = arr[1];
      if (ageUnit.toLowerCase() === 'years') {
        if (arr[0] === '5-6') {
          return 5 * 12 * 30;
        } else return parseInt(arr[0]) * 12 * 30;
      } else if (ageUnit.toLowerCase() === 'months') {
        if (arr[0] === '9-12') return 12 * 30;
        else if (arr[0] === '16-24') return 24 * 30;
        else return parseInt(arr[0]) * 30;
      } else if (ageUnit.toLowerCase() === 'weeks') return parseInt(arr[0]) * 7;
      else if (ageUnit.toLowerCase() === 'days') return parseInt(arr[0]);
    }
    return 0;
  }

  doctorMasterDataSubscription: any;
  loadMasterData() {
    this.doctorMasterDataSubscription =
      this.masterdataService.doctorMasterData$.subscribe((masterData) => {
        if (masterData) {
          console.log('masterData=', masterData);
          this.dueVaccines = masterData.nextDueVaccines;
          this.nextImmunizationSession = masterData.nextImmuLocations;

          if (
            this.visitCategory.toLowerCase() ===
            'neonatal and infant health care services'
          ) {
            this.nextImmunizationSession = masterData.nextImmuLocations;
            if (
              masterData.nextImmuLocations !== undefined &&
              masterData.nextImmuLocations !== null
            ) {
              this.nextImmunizationSession =
                masterData.nextImmuLocations.filter((item: any) => {
                  if (item.name.toLowerCase() !== 'school') {
                    this.nextImmunizationSession.push(item);
                    return item.name;
                  }
                });
            } else {
              this.nextImmunizationSession = masterData.nextImmuLocations;
            }
          }

          if (
            this.visitCategory.toLowerCase() ===
            'neonatal and infant health care services'
          ) {
            this.dueVaccines = masterData.nextDueVaccines;
            if (
              masterData.nextDueVaccines !== undefined &&
              masterData.nextDueVaccines !== null
            ) {
              this.dueVaccines = masterData.nextDueVaccines.filter(
                (item: any) => {
                  if (
                    item.name.toLowerCase() !== '16-24 months' &&
                    item.name.toLowerCase() !== '5-6 years' &&
                    item.name.toLowerCase() !== '10 years' &&
                    item.name.toLowerCase() !== '16 years'
                  ) {
                    this.dueVaccines.push(item);
                    return item.name;
                  }
                },
              );
            } else {
              this.dueVaccines = masterData.nextDueVaccines;
            }
          }

          if (String(this.followUpImmunizationMode) === 'view') {
            this.getFollowUpImmunization();
          }
        } else {
          console.log('Error in fetching doctor master data details');
        }
      });
  }

  get dueDateForNextImmunization() {
    return this.patientFollowUpImmunizationForm.controls[
      'dueDateForNextImmunization'
    ].value;
  }

  get nextDueVaccines() {
    return this.patientFollowUpImmunizationForm.controls['nextDueVaccines']
      .value;
  }

  get locationOfNextImmunization() {
    return this.patientFollowUpImmunizationForm.controls[
      'locationOfNextImmunization'
    ].value;
  }

  followUpImmunizationSubscription!: Subscription;
  getFollowUpImmunization() {
    this.followUpImmunizationSubscription =
      this.doctorService.populateCaserecordResponse$.subscribe((res) => {
        if (
          res &&
          res.statusCode === 200 &&
          res.data &&
          res.data.followUpForImmunization !== undefined &&
          res.data.followUpForImmunization !== null
        ) {
          const followUpImmunizationDetails = res.data.followUpForImmunization;
          const followUpForImmunization = Object.assign(
            {},
            followUpImmunizationDetails,
            {
              dueDateForNextImmunization: new Date(
                followUpImmunizationDetails.dueDateForNextImmunization,
              ),
            },
          );
          this.patientFollowUpImmunizationForm.patchValue(
            followUpForImmunization,
          );
        }
      });
  }

  onClickOfNextDueVaccine() {
    this.dueVaccines.filter((item: any) => {
      if (
        item.name ===
        this.patientFollowUpImmunizationForm.controls['nextDueVaccines'].value
      ) {
        this.patientFollowUpImmunizationForm.controls[
          'nextDueVaccinesID'
        ].patchValue(item.id);
      }
    });
  }

  onClickOfLocationOfNextImmunization() {
    this.nextImmunizationSession.filter((item: any) => {
      if (
        item.name ===
        this.patientFollowUpImmunizationForm.controls[
          'locationOfNextImmunization'
        ].value
      ) {
        this.patientFollowUpImmunizationForm.controls[
          'locationOfNextImmunizationID'
        ].patchValue(item.id);
      }
    });
  }

  ngOnDestroy() {
    if (this.followUpImmunizationSubscription)
      this.followUpImmunizationSubscription.unsubscribe();
    if (this.doctorMasterDataSubscription)
      this.doctorMasterDataSubscription.unsubscribe();
    if (this.beneficiaryDetailSubscription)
      this.beneficiaryDetailSubscription.unsubscribe();
  }
}
