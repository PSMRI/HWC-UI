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
import { FormGroup } from '@angular/forms';
import { SetLanguageComponent } from '../../core/components/set-language.component';
import { BeneficiaryDetailsService } from '../../core/services/beneficiary-details.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { HttpServiceService } from '../../core/services/http-service.service';
import { DoctorService } from '../shared/services/doctor.service';

@Component({
  selector: 'app-immunization-service',
  templateUrl: './immunization-service.component.html',
  styleUrls: ['./immunization-service.component.css'],
})
export class ImmunizationServiceComponent
  implements OnChanges, OnInit, DoCheck, OnDestroy
{
  @Input()
  patientImmunizationServicesForm!: FormGroup;

  @Input()
  visitCategory!: string;

  @Input()
  mode!: string;

  showNeonatalImmunization = false;
  showChildAndAdolescentImmunization = false;
  currentLanguageSet: any;
  benAge: any;
  female = false;
  male = false;
  totalMonths!: number;
  beneficiaryAge = 0;
  beneficiary: any;
  neonatalImmunizationServicesForm!: FormGroup;
  oralVitaminAForm!: FormGroup;

  constructor(
    private httpServiceService: HttpServiceService,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    private doctorService: DoctorService,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit() {
    this.neonatalImmunizationServicesForm =
      this.patientImmunizationServicesForm.get(
        'immunizationServicesForm',
      ) as FormGroup;
    this.oralVitaminAForm = this.patientImmunizationServicesForm.get(
      'oralVitaminAForm',
    ) as FormGroup;

    this.getBeneficiaryDetails();
    this.getNurseDetailsForAdolescentImmunizationServices();
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }

  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  ngOnChanges() {
    if (this.visitCategory) {
      this.showNeonatalImmunization =
        this.visitCategory.trim().toLowerCase() ===
        'neonatal and infant health care services'
          ? true
          : false;
      this.showChildAndAdolescentImmunization =
        this.visitCategory.trim().toLowerCase() ===
        'childhood & adolescent healthcare services'
          ? true
          : false;
    }

    if (String(this.mode) === 'update') {
      this.updateChildhoodImmunizationServicesFromDoctor(
        this.patientImmunizationServicesForm,
        this.visitCategory,
      );
    }
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

  ngOnDestroy() {
    if (this.beneficiaryDetailsSubscription)
      this.beneficiaryDetailsSubscription.unsubscribe();
  }

  getNurseDetailsForAdolescentImmunizationServices() {
    if (
      String(this.mode) === 'view' &&
      this.visitCategory.toLowerCase() ===
        'childhood & adolescent healthcare services'
    ) {
      this.doctorService.immunizationServiceFetchDetails = null;
      this.doctorService.fetchOralVitaminADeatilsFromNurse().subscribe(
        (serviceResponse: any) => {
          if (
            serviceResponse !== undefined &&
            serviceResponse !== null &&
            serviceResponse.data !== undefined
          ) {
            this.doctorService.immunizationServiceFetchDetails =
              serviceResponse.data;
          }
        },
        (err) => {
          console.log('error', err);
        },
      );
    }
  }

  updateChildhoodImmunizationServicesFromDoctor(
    medicalForm: any,
    visitCategory: any,
  ) {
    if (
      this.visitCategory.toLowerCase() ===
      'childhood & adolescent healthcare services'
    ) {
      this.doctorService
        .updateChildhoodImmunizationServices(medicalForm, visitCategory)
        .subscribe(
          (response) => {
            if (response.statusCode === 200 && response.data !== null) {
              this.confirmationService.alert(response.data.response, 'success');
              this.doctorService.immunizationServiceChildhoodValueChanged(
                false,
              );
              medicalForm.markAsPristine();
            } else {
              this.confirmationService.alert(response.errorMessage, 'error');
            }
          },
          (err) => {
            this.confirmationService.alert(err, 'error');
          },
        );
    }
  }
}
