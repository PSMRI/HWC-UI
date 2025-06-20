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
import { FormBuilder, FormGroup } from '@angular/forms';
import { SetLanguageComponent } from '../../../core/components/set-language.component';
import { BeneficiaryDetailsService } from '../../../core/services/beneficiary-details.service';
import { HttpServiceService } from '../../../core/services/http-service.service';
import { Subscription } from 'rxjs';
import { DoctorService } from '../../shared/services/doctor.service';
import { MasterdataService } from '../../shared/services/masterdata.service';
import { GeneralUtils } from '../../shared/utility/general-utility';
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
  selector: 'app-childhood-oral-vitamin',
  templateUrl: './childhood-oral-vitamin.component.html',
  styleUrls: ['./childhood-oral-vitamin.component.css'],
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
export class ChildhoodOralVitaminComponent
  implements OnChanges, OnInit, DoCheck, OnDestroy
{
  @Input()
  oralVitaminAForm!: FormGroup;

  @Input()
  mode!: any;

  @Input()
  visitCategory!: string;

  currentLanguageSet: any;
  today: any;
  utils = new GeneralUtils(this.fb, this.sessionstorage);
  nurseMasterDataSubscription!: Subscription;
  oralVitaminADoses: any = [];
  vaccineStatus = ['Given', 'Not Given'];
  oralVitaminAData: any;
  beneficiaryAge = 0;
  beneficiary: any;

  constructor(
    private httpServiceService: HttpServiceService,
    private masterdataService: MasterdataService,
    private fb: FormBuilder,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    private doctorService: DoctorService,
    readonly sessionstorage: SessionStorageService,
  ) {}

  todayDate = new Date();

  ngOnInit() {
    this.assignSelectedLanguage();
    this.today = new Date();
    this.getNurseMasterData();
    this.getBeneficiaryDetails();
    this.todayDate.setDate(this.today.getDate());
    this.oralVitaminAForm.patchValue({ dateOfVisit: this.todayDate });
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }

  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  getNurseMasterData() {
    this.nurseMasterDataSubscription =
      this.masterdataService.nurseMasterData$.subscribe((masterData) => {
        if (
          masterData !== undefined &&
          masterData !== null &&
          masterData.oralVitaminNoDose
        ) {
          this.oralVitaminADoses = masterData.oralVitaminNoDose;
          if (String(this.mode) === 'view') {
            this.getNurseFetchOralVitaminADetails();
          }
        }
      });
  }

  ngOnChanges() {
    if (String(this.mode) === 'view') {
      this.getNurseFetchOralVitaminADetails();
    }
  }

  setVaccineDetails(vaccineStatus: any) {
    if (vaccineStatus === 'Given') {
      this.oralVitaminAForm.patchValue({ dose: '2 ml (2 lakh IU)' });
      this.oralVitaminAForm.patchValue({ route: 'Oral' });
    } else {
      if (vaccineStatus === 'Not Given')
        this.resetFormOnChangeOfVaccineStatus();
    }
    String(this.mode) === 'view' || String(this.mode) === 'update'
      ? this.doctorService.immunizationServiceChildhoodValueChanged(true)
      : null;
  }

  onValueChange() {
    String(this.mode) === 'view' || String(this.mode) === 'update'
      ? this.doctorService.immunizationServiceChildhoodValueChanged(true)
      : null;
  }

  resetFormOnChangeOfVaccineStatus() {
    this.oralVitaminAForm.controls['noOfOralVitaminADoseID'].reset();
    this.oralVitaminAForm.controls['noOfOralVitaminADose'].reset();
    this.oralVitaminAForm.controls['dose'].reset();
    this.oralVitaminAForm.controls['batchNo'].reset();
    this.oralVitaminAForm.controls['route'].reset();
  }

  beneficiaryDetailsSubscription: any;
  getBeneficiaryDetails() {
    this.beneficiaryDetailsSubscription =
      this.beneficiaryDetailsService.beneficiaryDetails$.subscribe(
        (beneficiary) => {
          if (beneficiary) {
            this.beneficiary = beneficiary;

            const calculateAgeInYears = beneficiary.age.split('-')[0].trim();
            const calculateAgeInMonths = beneficiary.age.split('-')[1]
              ? beneficiary.age.split('-')[1].trim()
              : '';
            const age = this.getAgeValueNew(calculateAgeInYears);
            if (age !== 0 && calculateAgeInMonths !== '0 months') {
              this.beneficiaryAge = age + 1;
            } else {
              this.beneficiaryAge = age;
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
        return parseInt(arr[0]);
      }
    }
    return 0;
  }

  /** Nurse fetch */
  getNurseFetchOralVitaminADetails() {
    if (
      this.doctorService.immunizationServiceFetchDetails !== undefined &&
      this.doctorService.immunizationServiceFetchDetails !== null &&
      this.doctorService.immunizationServiceFetchDetails
        .oralVitaminAProphylaxis !== undefined &&
      this.doctorService.immunizationServiceFetchDetails
        .oralVitaminAProphylaxis !== null
    ) {
      const oralVitaminFetchData =
        this.doctorService.immunizationServiceFetchDetails
          .oralVitaminAProphylaxis;

      const childhoodOralVitaminData = Object.assign({}, oralVitaminFetchData, {
        dateOfVisit: new Date(oralVitaminFetchData.dateOfVisit),
      });
      this.oralVitaminAForm.patchValue(childhoodOralVitaminData);
    }
  }

  getNoOfOralVitaminADose() {
    this.oralVitaminADoses.filter((item: any) => {
      if (
        item.id ===
        this.oralVitaminAForm.controls['noOfOralVitaminADoseID'].value
      ) {
        this.oralVitaminAForm.controls['noOfOralVitaminADose'].setValue(
          item.name,
        );
      }
    });
    String(this.mode) === 'view' || String(this.mode) === 'update'
      ? this.doctorService.immunizationServiceChildhoodValueChanged(true)
      : null;
  }

  ngOnDestroy() {
    if (this.beneficiaryDetailsSubscription)
      this.beneficiaryDetailsSubscription.unsubscribe();
    this.oralVitaminAForm.reset();
  }

  get dateOfVisit() {
    return this.oralVitaminAForm.controls['dateOfVisit'].value;
  }

  get oralVitaminAStatus() {
    return this.oralVitaminAForm.controls['oralVitaminAStatus'].value;
  }

  get noOfOralVitaminADose() {
    return this.oralVitaminAForm.controls['noOfOralVitaminADose'].value;
  }

  get dose() {
    return this.oralVitaminAForm.controls['dose'].value;
  }

  get batchNo() {
    return this.oralVitaminAForm.controls['batchNo'].value;
  }

  get route() {
    return this.oralVitaminAForm.controls['route'].value;
  }
}
