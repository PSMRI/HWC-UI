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
import { FormBuilder, FormGroup } from '@angular/forms';
import { BeneficiaryDetailsService } from '../../../core/services/beneficiary-details.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { NurseService } from '../../shared/services';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import * as moment from 'moment';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from '@angular/material/core';
import {
  MomentDateAdapter,
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
} from '@angular/material-moment-adapter';

@Component({
  selector: 'app-nurse-anc-details',
  templateUrl: './anc-details.component.html',
  styleUrls: ['./anc-details.component.css'],
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
export class AncDetailsComponent implements OnInit, DoCheck, OnDestroy {
  @Input()
  patientANCDetailsForm!: FormGroup;

  today!: Date;
  dob!: Date;
  beneficiaryAge: any;
  current_language_set: any;
  constructor(
    private fb: FormBuilder,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    private confirmationService: ConfirmationService,
    public httpServiceService: HttpServiceService,
    private nurseService: NurseService,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.getBenificiaryDetails();
    this.today = new Date();
    this.dob = new Date();
    this.dob.setMonth(this.today.getMonth() - 10);
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
  }

  beneficiaryDetailsSubscription: any;
  getBenificiaryDetails() {
    this.beneficiaryDetailsSubscription =
      this.beneficiaryDetailsService.beneficiaryDetails$.subscribe(
        (beneficiaryDetails) => {
          if (beneficiaryDetails) {
            this.beneficiaryAge = beneficiaryDetails.ageVal;
          }
        },
      );
  }

  checkupLMP(lmpDate: any) {
    const today = new Date();
    const checkdate = new Date();

    checkdate.setMonth(today.getMonth() - 9);

    const lmpDateJS = lmpDate.toDate();

    if (lmpDateJS > checkdate && lmpDateJS < today) {
      this.patientANCDetailsForm.patchValue({
        lmpDate: lmpDateJS,
        duration: null,
      });
      this.calculateEDD(lmpDateJS);
      this.calculateGestationalAge(lmpDateJS);
      this.calculatePeriodOfPregnancy(lmpDateJS);
    } else {
      lmpDate = null;
      this.patientANCDetailsForm.patchValue({ lmpDate: lmpDate });
      this.confirmationService.alert(
        this.current_language_set.alerts.info.invalidVal,
      );
      this.calculateEDD(lmpDate);
      this.calculateGestationalAge(lmpDate);
      this.calculatePeriodOfPregnancy(lmpDate);
    }
  }

  pregnancyMonths: any;
  calculatePeriodOfPregnancy(lastMP: any) {
    if (lastMP !== null) {
      const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
      this.pregnancyMonths = Math.round(
        Math.abs(
          Math.round(
            Math.abs((this.today.getTime() - lastMP.getTime()) / oneDay),
          ),
        ) / 30,
      );
      if (this.pregnancyMonths === 0) this.pregnancyMonths = 1;
      this.patientANCDetailsForm.patchValue({ duration: this.pregnancyMonths });
    } else {
      this.pregnancyMonths = null;
      this.patientANCDetailsForm.patchValue({ duration: this.pregnancyMonths });
    }
  }

  calculateGestationalAge(lastMP: Date) {
    let gestationalAge: any;
    if (lastMP instanceof Date) {
      const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
      gestationalAge = Math.round(
        Math.abs(
          Math.round(
            Math.abs((this.today.getTime() - lastMP.getTime()) / oneDay),
          ),
        ) / 7,
      );
      this.patientANCDetailsForm.patchValue({
        gestationalAgeOrPeriodofAmenorrhea_POA: gestationalAge,
      });
      this.calculateTrimester(gestationalAge);
    } else {
      gestationalAge = null;
      this.patientANCDetailsForm.patchValue({
        gestationalAgeOrPeriodofAmenorrhea_POA: gestationalAge,
      });
      this.calculateTrimester(gestationalAge);
    }
  }

  calculateEDD(lastMP: Date) {
    if (lastMP instanceof Date) {
      const edd = new Date(lastMP);
      edd.setDate(lastMP.getDate() + 280);
      this.patientANCDetailsForm.patchValue({ expDelDt: edd });
    } else {
      this.patientANCDetailsForm.patchValue({ expDelDt: null });
    }
  }

  calculateTrimester(trimesterWeeks: any) {
    if (trimesterWeeks !== null) {
      if (trimesterWeeks >= 0 && trimesterWeeks <= 12) {
        this.patientANCDetailsForm.patchValue({ trimesterNumber: 1 });
      }
      if (trimesterWeeks >= 12 && trimesterWeeks <= 27) {
        this.patientANCDetailsForm.patchValue({ trimesterNumber: 2 });
      }
      if (trimesterWeeks >= 27) {
        this.patientANCDetailsForm.patchValue({ trimesterNumber: 3 });
      }
    } else {
      this.patientANCDetailsForm.patchValue({ trimesterNumber: null });
    }
  }

  checkPeriodOfPregnancy(periodOfPregnancy: any) {
    if (periodOfPregnancy > 9) {
      this.patientANCDetailsForm.patchValue({ duration: null });
      this.confirmationService.alert(
        this.current_language_set.alerts.info.invalidValue,
      );
    } else if (periodOfPregnancy < 1) {
      this.patientANCDetailsForm.patchValue({ duration: null });
      this.confirmationService.alert(
        this.current_language_set.common.invalidValueMorethan,
      );
    }
  }

  get primiGravida() {
    return this.patientANCDetailsForm.controls['primiGravida'].value;
  }

  get lmpDate() {
    return this.patientANCDetailsForm.controls['lmpDate'].value;
  }

  get gestationalAgeOrPeriodofAmenorrhea_POA() {
    return this.patientANCDetailsForm.controls[
      'gestationalAgeOrPeriodofAmenorrhea_POA'
    ].value;
  }

  get duration() {
    return this.patientANCDetailsForm.controls['duration'].value;
  }
}
