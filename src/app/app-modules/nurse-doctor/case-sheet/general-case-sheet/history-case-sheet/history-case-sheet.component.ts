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
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import * as moment from 'moment';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';

@Component({
  selector: 'app-history-case-sheet',
  templateUrl: './history-case-sheet.component.html',
  styleUrls: ['./history-case-sheet.component.css'],
})
export class HistoryCaseSheetComponent implements OnChanges, OnInit, DoCheck {
  @Input()
  previous: any;
  @Input()
  caseSheetData: any;

  pastIllnessList: any;
  pastSurgeryList: any;
  familyHistory: any;
  childOptionalVaccineList: any;
  comorbidConditionList: any;
  medicationHistoryList: any;
  femaleObstetricHistory: any;
  developmentalHistory: any;
  feedingHistory: any;
  menstrualHistory: any;
  perinatalHistory: any;
  personalHistory: any;
  immunizationHistory: any;
  visitCategory: any;
  beneficiary: any;
  ANCDetailsAndFormula: any;
  generalhistory: any;
  date: any;
  referDetails: any;
  blankRows = [1, 2, 3, 4];
  current_language_set: any;
  serviceList = '';
  previousPhysicalList: any;
  referralReasonList = '';
  beneficiaryAge = 0;

  constructor(
    public httpServiceService: HttpServiceService,
    readonly sessionstorage: SessionStorageService,
  ) {}

  ngOnInit() {
    this.visitCategory = this.sessionstorage.getItem('caseSheetVisitCategory');
    this.assignSelectedLanguage();
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
    if (
      this.current_language_set === undefined &&
      this.sessionstorage.getItem('currentLanguageSet')
    ) {
      this.current_language_set =
        this.sessionstorage.getItem('currentLanguageSet');
    }
  }

  ngOnChanges() {
    if (this.caseSheetData && this.caseSheetData.BeneficiaryData) {
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

      if (
        this.caseSheetData.nurseData &&
        this.caseSheetData.nurseData.history
      ) {
        this.generalhistory = this.caseSheetData.nurseData.history;
        if (this.caseSheetData.nurseData.anc)
          this.ANCDetailsAndFormula =
            this.caseSheetData.nurseData.anc.ANCCareDetail;
        if (
          this.caseSheetData.nurseData.history.PastHistory &&
          this.caseSheetData.nurseData.history.PastHistory.pastIllness
        )
          this.pastIllnessList =
            this.caseSheetData.nurseData.history.PastHistory.pastIllness;
        if (
          this.caseSheetData.nurseData.history.PastHistory &&
          this.caseSheetData.nurseData.history.PastHistory.pastSurgery
        )
          this.pastSurgeryList =
            this.caseSheetData.nurseData.history.PastHistory.pastSurgery;
        if (this.caseSheetData.nurseData.history.FamilyHistory)
          this.familyHistory =
            this.caseSheetData.nurseData.history.FamilyHistory;
        if (this.caseSheetData.nurseData.history.PhysicalActivityHistory)
          this.previousPhysicalList =
            this.caseSheetData.nurseData.history.PhysicalActivityHistory;
        if (
          this.caseSheetData.nurseData.history.childOptionalVaccineHistory &&
          this.caseSheetData.nurseData.history.childOptionalVaccineHistory
            .childOptionalVaccineList
        )
          this.childOptionalVaccineList =
            this.caseSheetData.nurseData.history.childOptionalVaccineHistory.childOptionalVaccineList;
        if (
          this.caseSheetData.nurseData.history.ComorbidityConditions &&
          this.caseSheetData.nurseData.history.ComorbidityConditions
            .comorbidityConcurrentConditionsList
        )
          this.comorbidConditionList =
            this.caseSheetData.nurseData.history.ComorbidityConditions.comorbidityConcurrentConditionsList;
        if (
          this.caseSheetData.nurseData.history.MedicationHistory &&
          this.caseSheetData.nurseData.history.MedicationHistory
            .medicationHistoryList
        )
          this.medicationHistoryList =
            this.caseSheetData.nurseData.history.MedicationHistory.medicationHistoryList;
        if (this.caseSheetData.nurseData.history.FemaleObstetricHistory)
          this.femaleObstetricHistory =
            this.caseSheetData.nurseData.history.FemaleObstetricHistory;
        if (this.caseSheetData.nurseData.history.DevelopmentHistory)
          this.developmentalHistory =
            this.caseSheetData.nurseData.history.DevelopmentHistory;
        if (this.caseSheetData.nurseData.history.FeedingHistory)
          this.feedingHistory =
            this.caseSheetData.nurseData.history.FeedingHistory;
        if (this.caseSheetData.nurseData.history.MenstrualHistory)
          this.menstrualHistory =
            this.caseSheetData.nurseData.history.MenstrualHistory;
        if (this.caseSheetData.nurseData.history.PerinatalHistory)
          this.perinatalHistory =
            this.caseSheetData.nurseData.history.PerinatalHistory;
        if (this.caseSheetData.nurseData.history.PersonalHistory)
          this.personalHistory =
            this.caseSheetData.nurseData.history.PersonalHistory;
        if (this.caseSheetData.nurseData.history.ImmunizationHistory)
          this.immunizationHistory =
            this.caseSheetData.nurseData.history.ImmunizationHistory;
        console.log(
          'generalhistory',
          JSON.stringify(this.generalhistory, null, 4),
        );
      }
    }

    const t = new Date();
    this.date = t.getDate() + '/' + (t.getMonth() + 1) + '/' + t.getFullYear();
    if (this.caseSheetData && this.caseSheetData.doctorData) {
      this.referDetails = this.caseSheetData.doctorData.Refer;
      if (
        this.referDetails &&
        this.referDetails.refrredToAdditionalServiceList
      ) {
        console.log(
          'institute',
          this.referDetails.refrredToAdditionalServiceList,
        );
        for (
          let i = 0;
          i < this.referDetails.refrredToAdditionalServiceList.length;
          i++
        ) {
          if (this.referDetails.refrredToAdditionalServiceList[i]) {
            this.serviceList +=
              this.referDetails.refrredToAdditionalServiceList[i];
            if (
              i >= 0 &&
              i < this.referDetails.refrredToAdditionalServiceList.length - 1
            )
              this.serviceList += ',';
          }
        }
      }
      if (this.referDetails && this.referDetails.referralReason) {
        console.log('institute', this.referDetails.referralReason);
        for (let i = 0; i < this.referDetails.referralReason.length; i++) {
          if (this.referDetails.referralReason[i]) {
            this.referralReasonList += this.referDetails.referralReason[i];
            if (i >= 0 && i < this.referDetails.referralReason.length - 1)
              this.referralReasonList += ',';
          }
        }
      }
    }
    console.log(
      'referDetailsForRefer',
      JSON.stringify(this.referDetails, null, 4),
    );

    if (
      this.caseSheetData &&
      this.caseSheetData.doctorData.Refer &&
      this.referDetails.revisitDate &&
      !moment(this.referDetails.revisitDate, 'DD/MM/YYYY', true).isValid()
    ) {
      const sDate = new Date(this.referDetails.revisitDate);
      this.referDetails.revisitDate = [
        this.padLeft.apply(sDate.getDate()),
        this.padLeft.apply(sDate.getMonth() + 1),
        this.padLeft.apply(sDate.getFullYear()),
      ].join('/');
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

  language_file_path: any = './assets/';
  language: any;

  changeLanguage() {
    this.language = sessionStorage.getItem('setLanguage');

    if (this.language !== undefined) {
      this.httpServiceService
        .getLanguage(this.language_file_path + this.language + '.json')
        .subscribe(
          (response: any) => {
            if (response) {
              this.current_language_set = response[this.language];
            } else {
              console.log(
                this.current_language_set.alerts.info.comingUpWithThisLang +
                  ' ' +
                  this.language,
              );
            }
          },
          (error) => {
            console.log(
              this.current_language_set.alerts.info.comingUpWithThisLang +
                ' ' +
                this.language,
            );
          },
        );
    } else {
      this.httpServiceService.currentLangugae$.subscribe(
        (response) => (this.current_language_set = response),
      );
    }
  }
  padLeft() {
    const len = String(10).length - String(this).length + 1;
    return len > 0 ? new Array(len).join('0') + this : this;
  }
}
