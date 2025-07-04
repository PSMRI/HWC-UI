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
import { ActivatedRoute } from '@angular/router';
import { SetLanguageComponent } from '../../core/components/set-language.component';
import { HttpServiceService } from '../../core/services/http-service.service';
import { Subscription } from 'rxjs';
import {
  BeneficiaryDetailsService,
  ConfirmationService,
} from '../../core/services';
import { DoctorService } from '../shared/services';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-birth-immunization-history',
  templateUrl: './birth-immunization-history.component.html',
  styleUrls: ['./birth-immunization-history.component.css'],
})
export class BirthImmunizationHistoryComponent
  implements OnChanges, OnInit, DoCheck, OnDestroy
{
  @Input()
  patientBirthImmunizationHistoryForm!: FormGroup;

  @Input()
  visitCategory!: string;

  @Input()
  immunizationHistoryMode!: string;

  infantBirthDetailsForm!: FormGroup;
  immunizationHistory!: FormGroup;
  currentLanguageSet: any;
  attendant: any;
  beneficiaryDetailsSubscription!: Subscription;
  beneficiaryAge: any;

  constructor(
    public httpServiceService: HttpServiceService,
    private doctorService: DoctorService,
    private confirmationService: ConfirmationService,
    private route: ActivatedRoute,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    readonly sessionstorage: SessionStorageService,
  ) {}

  ngOnInit() {
    this.getBenificiaryDetails();
    this.doctorService.clearPreviousInfantAndImmunizationHistoryDetails();
    this.assignSelectedLanguage();
    this.attendant = this.route.snapshot.params['attendant'];
    this.immunizationHistory = this.patientBirthImmunizationHistoryForm.get(
      'immunizationHistory',
    ) as FormGroup;
    this.infantBirthDetailsForm = this.patientBirthImmunizationHistoryForm.get(
      'infantBirthDetailsForm',
    ) as FormGroup;
    if (
      this.immunizationHistoryMode !== undefined &&
      this.immunizationHistoryMode !== null &&
      String(this.immunizationHistoryMode) === 'view'
    ) {
      this.getNurseImmunizationHistoryDetailsFromNurse();
    }

    if (this.attendant === 'nurse') {
      this.getPreviousVisitBirthImmunizationDetails(this.visitCategory);
    }
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }

  ngOnChanges() {
    if (String(this.immunizationHistoryMode) === 'update') {
      const visitCategory = this.sessionstorage.getItem('visitCategory');
      this.updateBirthAndImmunizationHistoryFromDoctor(
        this.patientBirthImmunizationHistoryForm,
        visitCategory,
      );
    }
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

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

  getNurseImmunizationHistoryDetailsFromNurse() {
    if (
      (String(this.immunizationHistoryMode) === 'view' ||
        String(this.immunizationHistoryMode) === 'update') &&
      this.visitCategory.toLowerCase() ===
        'neonatal and infant health care services'
    ) {
      this.doctorService.birthAndImmunizationDetailsFromNurse = null;
      this.doctorService
        .getBirthImmunizationHistoryNurseDetails()
        .subscribe((res: any) => {
          if (
            res.statusCode === 200 &&
            res.data !== null &&
            res.data !== undefined
          ) {
            this.doctorService.birthAndImmunizationDetailsFromNurse = res.data;
            this.doctorService.setInfantDataFetch(true);
          }
        });
    }
    if (
      (String(this.immunizationHistoryMode) === 'view' ||
        String(this.immunizationHistoryMode) === 'update') &&
      this.visitCategory.toLowerCase() ===
        'childhood & adolescent healthcare services'
    ) {
      this.doctorService.birthAndImmunizationDetailsFromNurse = null;
      this.doctorService
        .getBirthImmunizationHistoryNurseDetailsForChildAndAdolescent()
        .subscribe((res: any) => {
          if (
            res.statusCode === 200 &&
            res.data !== null &&
            res.data !== undefined
          ) {
            this.doctorService.birthAndImmunizationDetailsFromNurse = res.data;
            this.doctorService.setInfantDataFetch(true);
          }
        });
    }
  }

  getPreviousVisitBirthImmunizationDetails(visitCategory: any) {
    this.doctorService.birthAndImmunizationDetailsFromNurse = null;
    this.doctorService
      .getPreviousBirthImmunizationHistoryDetails(visitCategory)
      .subscribe((res: any) => {
        if (
          res.statusCode === 200 &&
          res.data !== null &&
          res.data !== undefined
        ) {
          this.doctorService.getPreviousInfantAndImmunizationHistoryDetails(
            res.data,
          );
        }
      });
  }

  updateBirthAndImmunizationHistoryFromDoctor(
    medicalForm: any,
    visitCategory: any,
  ) {
    this.doctorService
      .updateBirthAndImmunizationHistory(medicalForm, visitCategory)
      .subscribe(
        (response: any) => {
          if (response.statusCode === 200 && response.data !== null) {
            this.confirmationService.alert(response.data.response, 'success');
            this.doctorService.BirthAndImmunizationValueChanged(false);
            this.getNurseImmunizationHistoryDetailsFromNurse();
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

  ngOnDestroy() {
    if (this.beneficiaryDetailsSubscription)
      this.beneficiaryDetailsSubscription.unsubscribe();
  }
}
