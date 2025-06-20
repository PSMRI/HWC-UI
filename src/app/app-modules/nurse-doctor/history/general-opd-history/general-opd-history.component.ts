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
import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  BeneficiaryDetailsService,
  ConfirmationService,
} from 'src/app/app-modules/core/services';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { NcdScreeningService } from '../../shared/services/ncd-screening.service';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { DoctorService } from '../../shared/services';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-nurse-general-opd-history',
  templateUrl: './general-opd-history.component.html',
  styleUrls: ['./general-opd-history.component.css'],
})
export class GeneralOpdHistoryComponent
  implements OnChanges, OnInit, DoCheck, OnDestroy
{
  @Input()
  patientHistoryForm!: FormGroup;

  @Input()
  mode: any;

  @Input()
  visitCategory: any;

  @Input()
  primiGravida: any;

  @Input()
  pregnancyStatus: any;

  beneficiary: any;
  showObstetricHistory = false;
  currentLanguageSet: any;
  historyFormDeclared = false;
  enablingHistorySectionSubscription!: Subscription;
  beneficiaryAge = 0;
  benAge!: number;
  showHistory = false;

  pastHistory!: FormGroup;
  comorbidityHistory!: FormGroup;
  medicationHistory!: FormGroup;
  personalHistory!: FormGroup;
  familyHistory!: FormGroup;
  menstrualHistory!: FormGroup;
  perinatalHistory!: FormGroup;
  pastObstericHistory!: FormGroup;
  immunizationHistory!: FormGroup;
  otherVaccines!: FormGroup;
  feedingHistory!: FormGroup;
  developmentHistory!: FormGroup;
  physicalActivityHistory!: FormGroup;
  generalPersonalHistory!: FormGroup;

  constructor(
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    private doctorService: DoctorService,
    public httpServiceService: HttpServiceService,
    private confirmationService: ConfirmationService,
    private ncdScreeningService: NcdScreeningService,
    readonly sessionstorage: SessionStorageService,
  ) {}

  ngOnInit() {
    this.loadFormData();
    this.assignSelectedLanguage();
    this.getBeneficiaryDetails();
    this.enableIdrsHistoryForm();
    console.log('showHistory', this.showHistory);
    console.log('visit', this.visitCategory);
  }

  loadFormData() {
    this.pastHistory = this.patientHistoryForm.get('pastHistory') as FormGroup;
    this.comorbidityHistory = this.patientHistoryForm.get(
      'comorbidityHistory',
    ) as FormGroup;
    this.medicationHistory = this.patientHistoryForm.get(
      'medicationHistory',
    ) as FormGroup;
    this.personalHistory = this.patientHistoryForm.get(
      'personalHistory',
    ) as FormGroup;
    this.familyHistory = this.patientHistoryForm.get(
      'familyHistory',
    ) as FormGroup;
    this.menstrualHistory = this.patientHistoryForm.get(
      'menstrualHistory',
    ) as FormGroup;
    this.perinatalHistory = this.patientHistoryForm.get(
      'perinatalHistory',
    ) as FormGroup;
    this.pastObstericHistory = this.patientHistoryForm.get(
      'pastObstericHistory',
    ) as FormGroup;
    this.immunizationHistory = this.patientHistoryForm.get(
      'immunizationHistory',
    ) as FormGroup;
    this.otherVaccines = this.patientHistoryForm.get(
      'otherVaccines',
    ) as FormGroup;
    this.feedingHistory = this.patientHistoryForm.get(
      'feedingHistory',
    ) as FormGroup;
    this.developmentHistory = this.patientHistoryForm.get(
      'developmentHistory',
    ) as FormGroup;
    this.physicalActivityHistory = this.patientHistoryForm.get(
      'physicalActivityHistory',
    ) as FormGroup;
    this.generalPersonalHistory = this.patientHistoryForm.get(
      'generalPersonalHistory',
    ) as FormGroup;
  }

  ngOnChanges(changes: any) {
    this.loadFormData();
    if (changes.mode && String(this.mode) === 'update') {
      const visitCategory = this.sessionstorage.getItem('visitCategory');
      if (visitCategory === 'NCD screening') {
        this.updatePatientNCDScreeningHistory(this.patientHistoryForm);
      } else {
        this.updatePatientGeneralHistory(this.patientHistoryForm);
      }
    }

    if (changes.pregnancyStatus) {
      this.canShowObstetricHistory();
    }

    if (changes.primiGravida) {
      this.canShowObstetricHistory();
    }
    this.enableIdrsHistoryForm();
  }

  // this method is used to show family history and personal history for IDRS and to show personal history for both IDRS and CBAC
  enableIdrsHistoryForm() {
    if (this.visitCategory === 'NCD screening') {
      this.enablingHistorySectionSubscription =
        this.ncdScreeningService.enablingIdrs$.subscribe((response) => {
          if (response === true) {
            this.showHistory = true;
          } else {
            this.showHistory = false;
          }
        });
    }
  }

  ngOnDestroy() {
    if (this.beneficiaryDetailsSubscription)
      this.beneficiaryDetailsSubscription.unsubscribe();
    if (this.enablingHistorySectionSubscription)
      this.enablingHistorySectionSubscription.unsubscribe();
  }

  updatePatientGeneralHistory(generalOPDHistory: any) {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;

    const temp = {
      beneficiaryRegID: this.sessionstorage.getItem('beneficiaryRegID'),
      benVisitID: this.sessionstorage.getItem('visitID'),
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      createdBy: this.sessionstorage.getItem('userName'),
      modifiedBy: this.sessionstorage.getItem('userName'),
      beneficiaryID: this.sessionstorage.getItem('beneficiaryID'),
      sessionID: this.sessionstorage.getItem('sessionID'),
      parkingPlaceID: parkingPlaceID,
      vanID: vanID,
      benFlowID: this.sessionstorage.getItem('benFlowID'),
      visitCode: this.sessionstorage.getItem('visitCode'),
    };

    this.doctorService
      .updateGeneralHistory(generalOPDHistory, temp, this.beneficiary.ageVal)
      .subscribe(
        (res: any) => {
          if (res.statusCode === 200 && res.data !== null) {
            if (this.sessionstorage.getItem('visitCategory') === 'ANC') {
              this.getHRPDetails();
            }
            this.confirmationService.alert(res.data.response, 'success');
            this.patientHistoryForm.markAsPristine();
          } else {
            this.confirmationService.alert(res.errorMessage, 'error');
          }
        },
        (err) => {
          this.confirmationService.alert(err, 'error');
        },
      );
  }

  getHRPDetails() {
    const beneficiaryRegID = this.sessionstorage.getItem('beneficiaryRegID');
    const visitCode = this.sessionstorage.getItem('visitCode');
    this.doctorService
      .getHRPDetails(beneficiaryRegID, visitCode)
      .subscribe((res: any) => {
        if (res && res.statusCode === 200 && res.data) {
          if (res.data.isHRP === true) {
            this.beneficiaryDetailsService.setHRPPositive();
          } else {
            this.beneficiaryDetailsService.resetHRPPositive();
          }
        }
      });
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

            this.canShowObstetricHistory();
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

  ageCalculator(dob: any) {
    if (dob) {
      const convertAge = new Date(dob);
      const timeDiff = Math.abs(Date.now() - convertAge.getTime());
      this.beneficiaryAge = Math.floor(timeDiff / (1000 * 3600 * 24) / 365);
    }
  }

  canShowObstetricHistory() {
    if (this.primiGravida) this.showObstetricHistory = false;
    else if (this.visitCategory === 'NCD care')
      this.showObstetricHistory = false;
    else if (this.beneficiary && this.beneficiary.genderName === 'Male')
      this.showObstetricHistory = false;
    else if (
      this.beneficiary &&
      this.beneficiary.genderName !== 'Male' &&
      this.beneficiary.ageVal < 12
    )
      this.showObstetricHistory = false;
    else if (
      this.beneficiary &&
      this.beneficiary.genderName !== 'Male' &&
      this.beneficiary.ageVal >= 12
    )
      this.showObstetricHistory = true;
    else if (this.visitCategory === 'PNC') this.showObstetricHistory = true;
    else if (!this.primiGravida) this.showObstetricHistory = true;
  }
  updatePatientNCDScreeningHistory(NCDScreeningHistory: any) {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;
    const temp = {
      beneficiaryRegID: this.sessionstorage.getItem('beneficiaryRegID'),
      benVisitID: this.sessionstorage.getItem('visitID'),
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      createdBy: this.sessionstorage.getItem('userName'),
      modifiedBy: this.sessionstorage.getItem('userName'),
      beneficiaryID: this.sessionstorage.getItem('beneficiaryID'),
      sessionID: this.sessionstorage.getItem('sessionID'),
      parkingPlaceID: parkingPlaceID,
      vanID: vanID,
      benFlowID: this.sessionstorage.getItem('benFlowID'),
      visitCode: this.sessionstorage.getItem('visitCode'),
    };

    this.doctorService
      .updateNCDScreeningHistory(
        NCDScreeningHistory,
        temp,
        this.beneficiary.ageVal,
      )
      .subscribe(
        (res: any) => {
          if (res.statusCode === 200 && res.data !== null) {
            this.confirmationService.alert(res.data.response, 'success');
            this.patientHistoryForm.markAsPristine();
          } else {
            this.confirmationService.alert(res.errorMessage, 'error');
          }
        },
        (err) => {
          this.confirmationService.alert(err, 'error');
        },
      );
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
