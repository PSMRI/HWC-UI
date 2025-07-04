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
// import { Component, DoCheck, Input, OnChanges, OnInit } from '@angular/core';
// import { SetLanguageComponent } from 'src/app/app-modules/core/component/set-language.component';
import {
  Component,
  DoCheck,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { BeneficiaryDetailsService } from 'src/app/app-modules/core/services';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';

@Component({
  selector: 'app-neonatal-and-infant-service-case-sheet',
  templateUrl: './neonatal-and-infant-service-case-sheet.component.html',
  styleUrls: ['./neonatal-and-infant-service-case-sheet.component.css'],
})
export class NeonatalAndInfantServiceCaseSheetComponent
  implements OnChanges, OnInit, DoCheck
{
  @Input()
  caseSheetData: any;

  @Input()
  printPagePreviewSelect: any;

  @Input()
  previous: any;

  currentLanguageSet: any;
  infantBirthDeatilsCasesheet: any;
  otherDelPlace = false;
  otherDelComplication = false;
  followUpImmunizationCasesheet: any;
  formImmunizationHistoryCasesheet: any;
  formImmunizationHistoryDetails: any;
  immunizationServiceCasesheet: any;
  immunizationServicesCasesheet: any;
  vaccinetaken: any = [];
  serviceVaccinetaken: any = [];
  immunizationDataList: any;
  immunizationVaccine: any;
  beneficiaryAge = 0;
  beneficiary: any;
  enableImmunizationServiceVaccine = false;
  benAge: any;
  visitCategory: any;
  birthTime!: Date;

  constructor(
    private httpServiceService: HttpServiceService,
    readonly sessionstorage: SessionStorageService,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.visitCategory = this.sessionstorage.getItem('caseSheetVisitCategory');
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }

  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
    if (
      this.currentLanguageSet === undefined &&
      this.sessionstorage.getItem('currentLanguageSet')
    ) {
      this.currentLanguageSet =
        this.sessionstorage.getItem('currentLanguageSet');
    }
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

  ngOnChanges() {
    if (this.caseSheetData !== undefined && this.caseSheetData !== null) {
      if (
        this.caseSheetData &&
        this.caseSheetData.nurseData &&
        this.caseSheetData.nurseData.history &&
        this.caseSheetData.nurseData.history.infantBirthDetails
      ) {
        this.infantBirthDeatilsCasesheet =
          this.caseSheetData.nurseData.history.infantBirthDetails;

        if (
          this.infantBirthDeatilsCasesheet.otherDeliveryPlace !== undefined &&
          this.infantBirthDeatilsCasesheet.otherDeliveryPlace !== null
        ) {
          this.otherDelPlace = true;
        } else {
          this.otherDelPlace = false;
        }

        if (
          this.infantBirthDeatilsCasesheet.otherDeliveryComplication !==
            undefined &&
          this.infantBirthDeatilsCasesheet.otherDeliveryComplication !== null
        ) {
          this.otherDelComplication = true;
        } else {
          this.otherDelComplication = false;
        }

        if (this.infantBirthDeatilsCasesheet.timeOfBirth) {
          this.birthTime = toTime(this.infantBirthDeatilsCasesheet.timeOfBirth);
        }
      }

      if (
        this.caseSheetData &&
        this.caseSheetData.nurseData &&
        this.caseSheetData.nurseData.history &&
        this.caseSheetData.nurseData.history.immunizationHistory &&
        this.caseSheetData.nurseData.history.immunizationHistory
          .immunizationList
      ) {
        this.immunizationDataList =
          this.caseSheetData.nurseData.history.immunizationHistory.immunizationList;

        this.immunizationVaccine = [];
        this.immunizationDataList.forEach((vaccineList: any) => {
          this.immunizationVaccine = [];
          vaccineList.vaccines.forEach((vaccine: any) => {
            if (vaccine.status === true) {
              this.immunizationVaccine.push(vaccine.vaccine);
            }
          });
          const consumedVaccineData = {
            vaccine: this.immunizationVaccine.join(','),
            defaultReceivingAge: vaccineList.defaultReceivingAge,
            vaccinationReceivedAt: vaccineList.vaccinationReceivedAt,
          };
          this.vaccinetaken.push(consumedVaccineData);
        });
        console.log(this.vaccinetaken);
      }

      if (
        this.caseSheetData &&
        this.caseSheetData.nurseData &&
        this.caseSheetData.nurseData.immunizationServices &&
        this.caseSheetData.nurseData.immunizationServices
          .immunizationServices &&
        this.caseSheetData.nurseData.immunizationServices.immunizationServices
          .vaccines
      ) {
        this.immunizationServicesCasesheet =
          this.caseSheetData.nurseData.immunizationServices.immunizationServices;

        const immunizationServiceData =
          this.caseSheetData.nurseData.immunizationServices.immunizationServices
            .vaccines;

        let serviceVaccineName = [];
        immunizationServiceData.forEach((vaccine: any) => {
          serviceVaccineName = [];
          if (
            vaccine.vaccineName !== undefined &&
            vaccine.vaccineName !== null
          ) {
            serviceVaccineName.push(vaccine.vaccineName);
            this.enableImmunizationServiceVaccine = true;
          } else {
            this.enableImmunizationServiceVaccine = false;
          }
          const consumedVaccineData = {
            vaccine: serviceVaccineName.join(','),
            vaccineDose: vaccine.vaccineDose,
            siteOfInjection: vaccine.siteOfInjection,
            route: vaccine.route,
            batchNo: vaccine.batchNo,
          };
          this.serviceVaccinetaken.push(consumedVaccineData);
        });
        console.log(this.serviceVaccinetaken);
      }

      if (
        this.caseSheetData &&
        this.caseSheetData.doctorData &&
        this.caseSheetData.doctorData.followUpForImmunization
      ) {
        this.followUpImmunizationCasesheet =
          this.caseSheetData.doctorData.followUpForImmunization;
      }

      if (
        this.caseSheetData &&
        this.caseSheetData.BeneficiaryData &&
        this.caseSheetData.BeneficiaryData.age
      ) {
        this.beneficiary = this.caseSheetData.BeneficiaryData;
        const calculateAgeInYears = this.beneficiary.age.split('-')[0].trim();
        const calculateAgeInMonths = this.beneficiary.age.split('-')[1]
          ? this.beneficiary.age.split('-')[1].trim()
          : '';
        const age = this.getAgeValueNew(calculateAgeInYears);
        if (age !== 0 && calculateAgeInMonths !== '0 months') {
          this.beneficiaryAge = age + 1;
        } else {
          this.beneficiaryAge = age;
        }
      }
    }
  }
}

function toTime(timeString: any) {
  const timeTokens = timeString.split(':');
  return new Date(1970, 0, 1, timeTokens[0], timeTokens[1]);
}
