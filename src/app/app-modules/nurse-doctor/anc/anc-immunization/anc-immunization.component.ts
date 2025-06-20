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
import { FormBuilder, FormGroup } from '@angular/forms';
import { BeneficiaryDetailsService } from '../../../core/services/beneficiary-details.service';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
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
  selector: 'app-nurse-anc-immunization',
  templateUrl: './anc-immunization.component.html',
  styleUrls: ['./anc-immunization.component.css'],
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
export class AncImmunizationComponent
  implements OnChanges, OnInit, DoCheck, OnDestroy
{
  selectImmunizationStatus = ['NA', 'Not Received', 'Received'];

  @Input()
  patientANCImmunizationForm!: FormGroup;

  @Input()
  gravidaStatus: any;

  @Input()
  mode!: string;

  enableTTStatus_1_2_b = false;
  enableTTStatus_1_2 = false;
  today!: Date;
  dob!: Date;
  beneficiaryAge: any;
  current_language_set: any;
  constructor(
    private fb: FormBuilder,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    public httpServiceService: HttpServiceService,
    readonly sessionstorage: SessionStorageService,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.getBenificiaryDetails();
  }
  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }

  ngOnChanges(changes: any) {
    this.checkStatus();

    const specialistFlagString = this.sessionstorage.getItem('specialistFlag');
    if (
      String(this.mode) !== 'view' &&
      String(this.mode) !== 'update' &&
      specialistFlagString !== null &&
      parseInt(specialistFlagString) !== 100
    ) {
      this.nullifyTTStatus();
    }
  }

  nullifyTTStatus() {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    this.patientANCImmunizationForm.reset({
      vanID: JSON.parse(serviceLineDetails).vanID,
      parkingPlaceID: JSON.parse(serviceLineDetails).parkingPlaceID,
    });
  }

  checkStatus() {
    this.enableTTStatus_1_2_b = false;
    this.enableTTStatus_1_2 = false;
    if (this.gravidaStatus !== null && this.gravidaStatus !== undefined) {
      if (!this.gravidaStatus) {
        this.enableTTStatus_1_2_b = true;
      }
      if (this.gravidaStatus) {
        this.enableTTStatus_1_2 = true;
      }
    }
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
            this.checkDate();
          }
        },
      );
  }

  checkDate() {
    this.today = new Date();
    this.dob = new Date();
    this.dob.setFullYear(this.today.getFullYear() - this.beneficiaryAge);
  }

  checkedTT_1Status = false;
  checkedTT_2Status = false;
  checkedTT_3Status = false;
  checkTT_1Status(tT_1Status: any) {
    this.checkedTT_1Status = false;
    this.patientANCImmunizationForm.patchValue({ dateReceivedForTT_1: null });
    this.patientANCImmunizationForm.patchValue({ facilityNameOfTT_1: null });
    this.patientANCImmunizationForm.patchValue({ tT_2Status: null });
    this.patientANCImmunizationForm.patchValue({ dateReceivedForTT_2: null });
    this.patientANCImmunizationForm.patchValue({ facilityNameOfTT_2: null });
    this.patientANCImmunizationForm.patchValue({ tT_3Status: null });
    this.patientANCImmunizationForm.patchValue({ dateReceivedForTT_3: null });
    this.patientANCImmunizationForm.patchValue({ facilityNameOfTT_3: null });
  }

  get tT_1Status() {
    return this.patientANCImmunizationForm.controls['tT_1Status'].value;
  }

  tT_1Date: any;
  checkTT_2Status(tT_2Status: any) {
    this.checkedTT_2Status = false;
    this.patientANCImmunizationForm.patchValue({ dateReceivedForTT_2: null });
    this.patientANCImmunizationForm.patchValue({ facilityNameOfTT_2: null });
    this.patientANCImmunizationForm.patchValue({ tT_3Status: null });
    this.patientANCImmunizationForm.patchValue({ dateReceivedForTT_3: null });
    this.patientANCImmunizationForm.patchValue({ facilityNameOfTT_3: null });
    if (tT_2Status === 'Received') {
      if (this.dateReceivedForTT_1 === null) {
        this.tT_1Date = this.dob;
      } else {
        this.tT_1Date = this.dateReceivedForTT_1;
      }
    }
  }

  get tT_2Status() {
    return this.patientANCImmunizationForm.controls['tT_2Status'].value;
  }

  checkTT_1Date(dateReceivedForTT_1: any) {
    this.patientANCImmunizationForm.patchValue({ facilityNameOfTT_1: null });
    this.patientANCImmunizationForm.patchValue({ tT_2Status: null });
    this.patientANCImmunizationForm.patchValue({ dateReceivedForTT_2: null });
    this.patientANCImmunizationForm.patchValue({ facilityNameOfTT_2: null });
    this.patientANCImmunizationForm.patchValue({ tT_3Status: null });
    this.patientANCImmunizationForm.patchValue({ dateReceivedForTT_3: null });
    this.patientANCImmunizationForm.patchValue({ facilityNameOfTT_3: null });
  }

  get dateReceivedForTT_1() {
    return this.patientANCImmunizationForm.controls['dateReceivedForTT_1']
      .value;
  }

  checkTT_2Date(dateReceivedForTT_2: any) {
    this.patientANCImmunizationForm.patchValue({ facilityNameOfTT_2: null });
    this.patientANCImmunizationForm.patchValue({ tT_3Status: null });
    this.patientANCImmunizationForm.patchValue({ dateReceivedForTT_3: null });
    this.patientANCImmunizationForm.patchValue({ facilityNameOfTT_3: null });
  }
  get dateReceivedForTT_2() {
    return this.patientANCImmunizationForm.controls['dateReceivedForTT_2']
      .value;
  }

  tT_3Date: any;
  checkTT_3Status(tT_3Status: any) {
    this.checkedTT_3Status = false;
    this.patientANCImmunizationForm.patchValue({ dateReceivedForTT_3: null });
    this.patientANCImmunizationForm.patchValue({ facilityNameOfTT_3: null });
    if (tT_3Status === 'Received') {
      if (this.tT_2Status === 'Received' && this.dateReceivedForTT_2 !== null) {
        this.tT_3Date = this.dateReceivedForTT_2;
      } else {
        if (
          this.tT_1Status === 'Received' &&
          this.dateReceivedForTT_1 !== null
        ) {
          this.tT_3Date = this.dateReceivedForTT_1;
        } else {
          this.tT_3Date = this.dob;
        }
      }
    }
  }

  get tT_3Status() {
    return this.patientANCImmunizationForm.controls['tT_3Status'].value;
  }
}
