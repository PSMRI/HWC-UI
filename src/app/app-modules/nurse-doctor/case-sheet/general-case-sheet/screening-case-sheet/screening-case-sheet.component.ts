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
import { Component, DoCheck, Input, OnChanges, OnInit } from '@angular/core';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';

@Component({
  selector: 'app-screening-case-sheet',
  templateUrl: './screening-case-sheet.component.html',
  styleUrls: ['./screening-case-sheet.component.css'],
})
export class ScreeningCaseSheetComponent implements OnChanges, OnInit, DoCheck {
  @Input()
  caseSheetData: any;

  @Input()
  printPagePreviewSelect: any;

  @Input()
  previous: any;

  currentLanguageSet: any;
  cbacScore: any;
  diabetesConfirmed = false;
  hypertensionConfirmed = false;
  oralCancerConfirmed = false;
  breastCancerConfirmed = false;
  cervicalCancerConfirmed = false;
  diabetesCasesheet: any;
  hypertensionCasesheet: any;
  oralCancerCasesheet: any;
  breastCancerCasesheet: any;
  cervicalCancerCasesheet: any;
  diabetesSuspected = false;
  hypertensionSuspected = false;
  oralSuspected = false;
  breastSuspected = false;
  cervicalSuspected = false;
  enableDiabetesForm = false;
  enableHypertensionForm = false;
  enableOralForm = false;
  enableBreastForm = false;
  enableCervicalForm = false;

  constructor(
    private httpServiceService: HttpServiceService,
    readonly sessionstorage: SessionStorageService,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
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

  ngOnChanges() {
    if (this.caseSheetData !== undefined) {
      /* cbac score patch*/
      if (
        this.caseSheetData &&
        this.caseSheetData.nurseData &&
        this.caseSheetData.nurseData.cbac
      ) {
        this.cbacScore = this.caseSheetData.nurseData.cbac.totalScore;
      }

      /* Diabetes Screening patch*/
      if (
        this.caseSheetData &&
        this.caseSheetData.nurseData &&
        this.caseSheetData.nurseData.diabetes
      ) {
        this.diabetesCasesheet = this.caseSheetData.nurseData.diabetes;
        this.diabetesSuspected =
          this.caseSheetData.nurseData.diabetes.suspected;
        this.diabetesConfirmed =
          this.caseSheetData.nurseData.diabetes.confirmed;
        if (
          this.caseSheetData.nurseData.diabetes.suspected !== null &&
          this.caseSheetData.nurseData.diabetes.suspected !== undefined
        ) {
          this.enableDiabetesForm = true;
        } else {
          this.enableDiabetesForm = false;
        }
      }

      /* Hypertension Screening patch*/
      if (
        this.caseSheetData &&
        this.caseSheetData.nurseData &&
        this.caseSheetData.nurseData.hypertension
      ) {
        this.hypertensionCasesheet = this.caseSheetData.nurseData.hypertension;
        this.hypertensionSuspected =
          this.caseSheetData.nurseData.hypertension.suspected;
        this.hypertensionConfirmed =
          this.caseSheetData.nurseData.hypertension.confirmed;
        if (
          this.caseSheetData.nurseData.hypertension.suspected !== null &&
          this.caseSheetData.nurseData.hypertension.suspected !== undefined
        ) {
          this.enableHypertensionForm = true;
        } else {
          this.enableHypertensionForm = false;
        }
      }

      /* Oral Cancer Screening patch*/
      if (
        this.caseSheetData &&
        this.caseSheetData.nurseData &&
        this.caseSheetData.nurseData.oral
      ) {
        this.oralCancerCasesheet = this.caseSheetData.nurseData.oral;
        this.oralSuspected = this.caseSheetData.nurseData.oral.suspected;
        this.oralCancerConfirmed = this.caseSheetData.nurseData.oral.confirmed;
        if (
          this.caseSheetData.nurseData.oral.suspected !== null &&
          this.caseSheetData.nurseData.oral.suspected !== undefined
        ) {
          this.enableOralForm = true;
        } else {
          this.enableOralForm = false;
        }
      }

      /* Breast Cancer Screening patch*/
      if (
        this.caseSheetData &&
        this.caseSheetData.nurseData &&
        this.caseSheetData.nurseData.breast
      ) {
        this.breastCancerCasesheet = this.caseSheetData.nurseData.breast;
        this.breastSuspected = this.caseSheetData.nurseData.breast.suspected;
        this.breastCancerConfirmed =
          this.caseSheetData.nurseData.breast.confirmed;
        if (
          this.caseSheetData.nurseData.breast.suspected !== null &&
          this.caseSheetData.nurseData.breast.suspected !== undefined
        ) {
          this.enableBreastForm = true;
        } else {
          this.enableBreastForm = false;
        }
      }

      /* Cervical Cancer Screening patch*/
      if (
        this.caseSheetData &&
        this.caseSheetData.nurseData &&
        this.caseSheetData.nurseData.cervical
      ) {
        this.cervicalCancerCasesheet = this.caseSheetData.nurseData.cervical;
        this.cervicalSuspected =
          this.caseSheetData.nurseData.cervical.suspected;
        this.cervicalCancerConfirmed =
          this.caseSheetData.nurseData.cervical.confirmed;
        if (
          this.caseSheetData.nurseData.cervical.suspected !== null &&
          this.caseSheetData.nurseData.cervical.suspected !== undefined
        ) {
          this.enableCervicalForm = true;
        } else {
          this.enableCervicalForm = false;
        }
      }
    }
  }
}
