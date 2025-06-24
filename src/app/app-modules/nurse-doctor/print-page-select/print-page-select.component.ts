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
import { Component, OnInit, Inject, DoCheck } from '@angular/core';
import { HttpServiceService } from '../../core/services/http-service.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SetLanguageComponent } from '../../core/components/set-language.component';

@Component({
  selector: 'app-case-sheet-print-page-select',
  templateUrl: './print-page-select.component.html',
  styleUrls: ['./print-page-select.component.css'],
})
export class PrintPageSelectComponent implements OnInit, DoCheck {
  printPagePreviewSelect = {
    selectAllCheckBox: true,
    caseSheetANC: true,
    caseSheetPNC: true,
    caseSheetHistory: true,
    caseSheetExamination: true,
    caseSheetPrescription: true,
    caseSheetDiagnosis: true,
    caseSheetInvestigations: true,
    caseSheetExtInvestigation: true,
    caseSheetCurrentVitals: true,
    caseSheetChiefComplaints: true,
    caseSheetClinicalObservations: true,
    caseSheetFindings: true,
    caseSheetCovidVaccinationDetails: true,
    caseSheetNCDScreeningDetails: true,
    caseSheetFamilyPlanning: true,
    caseSheetVisitDetails: true,
    caseSheetTreatmentOnSideEffects: true,
    caseSheetCounsellingProvided: true,
    caseSheetNeonatalAndInfant: true,
    caseSheetOralVitaminA: true,
  };

  visitCategory: any;
  currentLanguageSet: any;
  language_file_path: any = './assets/';
  language: any;
  isCovidVaccinationStatusVisible = false;

  constructor(
    public dialogRef: MatDialogRef<PrintPageSelectComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public httpServiceService: HttpServiceService,
  ) {}

  ngOnInit() {
    if (this.data) {
      this.visitCategory = this.data.visitCategory;
      this.printPagePreviewSelect.caseSheetANC =
        this.data.printPagePreviewSelect.caseSheetANC;
      this.printPagePreviewSelect.caseSheetPNC =
        this.data.printPagePreviewSelect.caseSheetPNC;
      this.printPagePreviewSelect.caseSheetHistory =
        this.data.printPagePreviewSelect.caseSheetHistory;
      this.printPagePreviewSelect.caseSheetExamination =
        this.data.printPagePreviewSelect.caseSheetExamination;
      this.printPagePreviewSelect.caseSheetPrescription =
        this.data.printPagePreviewSelect.caseSheetPrescription;
      this.printPagePreviewSelect.caseSheetDiagnosis =
        this.data.printPagePreviewSelect.caseSheetDiagnosis;
      this.printPagePreviewSelect.caseSheetInvestigations =
        this.data.printPagePreviewSelect.caseSheetInvestigations;
      this.printPagePreviewSelect.caseSheetExtInvestigation =
        this.data.printPagePreviewSelect.caseSheetExtInvestigation;
      this.printPagePreviewSelect.caseSheetCurrentVitals =
        this.data.printPagePreviewSelect.caseSheetCurrentVitals;
      this.printPagePreviewSelect.caseSheetChiefComplaints =
        this.data.printPagePreviewSelect.caseSheetChiefComplaints;
      this.printPagePreviewSelect.caseSheetClinicalObservations =
        this.data.printPagePreviewSelect.caseSheetClinicalObservations;
      this.printPagePreviewSelect.caseSheetFindings =
        this.data.printPagePreviewSelect.caseSheetFindings;
      this.printPagePreviewSelect.caseSheetCovidVaccinationDetails =
        this.data.printPagePreviewSelect.caseSheetCovidVaccinationDetails;
      this.printPagePreviewSelect.caseSheetNCDScreeningDetails =
        this.data.printPagePreviewSelect.caseSheetNCDScreeningDetails;
      this.printPagePreviewSelect.caseSheetFamilyPlanning =
        this.data.printPagePreviewSelect.caseSheetFamilyPlanning;
      this.printPagePreviewSelect.caseSheetVisitDetails =
        this.data.printPagePreviewSelect.caseSheetVisitDetails;
      this.printPagePreviewSelect.caseSheetTreatmentOnSideEffects =
        this.data.printPagePreviewSelect.caseSheetTreatmentOnSideEffects;
      this.printPagePreviewSelect.caseSheetCounsellingProvided =
        this.data.printPagePreviewSelect.caseSheetCounsellingProvided;
      this.printPagePreviewSelect.caseSheetNeonatalAndInfant =
        this.data.printPagePreviewSelect.caseSheetNeonatalAndInfant;
      this.printPagePreviewSelect.caseSheetOralVitaminA =
        this.data.printPagePreviewSelect.caseSheetOralVitaminA;
    }
    this.unCheckSelectAll();
    this.setLanguage();
  }

  setLanguage() {
    this.language = sessionStorage.getItem('setLanguage');

    if (this.language !== undefined) {
      this.httpServiceService
        .getLanguage(this.language_file_path + this.language + '.json')
        .subscribe(
          (response: any) => {
            if (response) {
              this.currentLanguageSet = response[this.language];
            } else {
              console.log(
                this.currentLanguageSet.alerts.info.comingUpWithThisLang +
                  ' ' +
                  this.language,
              );
            }
          },
          (error) => {
            console.log(
              this.currentLanguageSet.alerts.info.comingUpWithThisLang +
                ' ' +
                this.language,
            );
          },
        );
    } else {
      this.httpServiceService.currentLangugae$.subscribe(
        (response) => (this.currentLanguageSet = response),
      );
    }
  }
  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  selectUnselectCheckBox(event: any) {
    if (event.checked) {
      this.checkAllBoxes();
    } else {
      this.unCheckAllBoxes();
    }
  }

  checkAllBoxes() {
    if (this.visitCategory === 'ANC') {
      this.printPagePreviewSelect.caseSheetANC = true;
    }
    if (this.visitCategory === 'PNC') {
      this.printPagePreviewSelect.caseSheetPNC = true;
    }

    if (this.visitCategory !== 'General OPD (QC)') {
      this.printPagePreviewSelect.caseSheetHistory = true;
    }

    if (
      this.visitCategory !== 'NCD care' &&
      this.visitCategory !== 'General OPD (QC)' &&
      this.visitCategory !== 'COVID-19 Screening'
    ) {
      this.printPagePreviewSelect.caseSheetExamination = true;
    }
    this.printPagePreviewSelect.caseSheetPrescription = true;
    this.printPagePreviewSelect.caseSheetDiagnosis = true;
    this.printPagePreviewSelect.caseSheetInvestigations = true;
    this.printPagePreviewSelect.caseSheetExtInvestigation = true;
    this.printPagePreviewSelect.caseSheetCurrentVitals = true;
    this.printPagePreviewSelect.caseSheetChiefComplaints = true;
    this.printPagePreviewSelect.caseSheetClinicalObservations = true;

    if (this.visitCategory !== 'General OPD (QC)') {
      this.printPagePreviewSelect.caseSheetFindings = true;
    }
    this.printPagePreviewSelect.caseSheetCovidVaccinationDetails = true;

    if (this.visitCategory === 'NCD screening') {
      this.printPagePreviewSelect.caseSheetNCDScreeningDetails = true;
    }

    if (this.visitCategory === 'FP & Contraceptive Services') {
      this.printPagePreviewSelect.caseSheetFamilyPlanning = true;
      this.printPagePreviewSelect.caseSheetVisitDetails = true;
      this.printPagePreviewSelect.caseSheetTreatmentOnSideEffects = true;
    }

    this.printPagePreviewSelect.caseSheetCounsellingProvided = true;

    if (
      this.visitCategory.toLowerCase() ===
      'neonatal and infant health care services'
    ) {
      this.printPagePreviewSelect.caseSheetNeonatalAndInfant = true;
    }

    if (
      this.visitCategory.toLowerCase() ===
      'childhood & adolescent healthcare services'
    ) {
      this.printPagePreviewSelect.caseSheetOralVitaminA = true;
    }
  }

  unCheckAllBoxes() {
    if (this.visitCategory === 'ANC') {
      this.printPagePreviewSelect.caseSheetANC = false;
    }
    if (this.visitCategory === 'PNC') {
      this.printPagePreviewSelect.caseSheetPNC = false;
    }

    if (this.visitCategory !== 'General OPD (QC)') {
      this.printPagePreviewSelect.caseSheetHistory = false;
    }

    if (
      this.visitCategory !== 'NCD care' &&
      this.visitCategory !== 'General OPD (QC)' &&
      this.visitCategory !== 'COVID-19 Screening'
    ) {
      this.printPagePreviewSelect.caseSheetExamination = false;
    }
    this.printPagePreviewSelect.caseSheetPrescription = false;
    this.printPagePreviewSelect.caseSheetDiagnosis = false;
    this.printPagePreviewSelect.caseSheetInvestigations = false;
    this.printPagePreviewSelect.caseSheetExtInvestigation = false;
    this.printPagePreviewSelect.caseSheetCurrentVitals = false;
    this.printPagePreviewSelect.caseSheetChiefComplaints = false;
    this.printPagePreviewSelect.caseSheetClinicalObservations = false;

    if (this.visitCategory !== 'General OPD (QC)') {
      this.printPagePreviewSelect.caseSheetFindings = false;
    }
    this.printPagePreviewSelect.caseSheetCovidVaccinationDetails = false;

    if (this.visitCategory === 'NCD screening') {
      this.printPagePreviewSelect.caseSheetNCDScreeningDetails = false;
    }

    if (this.visitCategory === 'FP & Contraceptive Services') {
      this.printPagePreviewSelect.caseSheetFamilyPlanning = false;
      this.printPagePreviewSelect.caseSheetVisitDetails = false;
      this.printPagePreviewSelect.caseSheetTreatmentOnSideEffects = false;
    }

    this.printPagePreviewSelect.caseSheetCounsellingProvided = false;

    if (
      this.visitCategory.toLowerCase() ===
      'neonatal and infant health care services'
    ) {
      this.printPagePreviewSelect.caseSheetNeonatalAndInfant = false;
    }

    if (
      this.visitCategory.toLowerCase() ===
      'childhood & adolescent healthcare services'
    ) {
      this.printPagePreviewSelect.caseSheetOralVitaminA = false;
    }
  }

  unCheckSelectAll() {
    if (
      this.visitCategory === 'ANC' &&
      this.printPagePreviewSelect.caseSheetANC &&
      this.printPagePreviewSelect.caseSheetHistory &&
      this.printPagePreviewSelect.caseSheetExamination &&
      this.printPagePreviewSelect.caseSheetFindings
    ) {
      this.isMandatoryChecked();
    } else if (
      this.visitCategory === 'PNC' &&
      this.printPagePreviewSelect.caseSheetANC &&
      this.printPagePreviewSelect.caseSheetHistory &&
      this.printPagePreviewSelect.caseSheetExamination &&
      this.printPagePreviewSelect.caseSheetFindings
    ) {
      this.isMandatoryChecked();
    } else if (
      this.visitCategory === 'General OPD (QC)' ||
      this.visitCategory === 'General OPD'
    ) {
      this.isMandatoryChecked();
    } else if (
      this.visitCategory === 'NCD care' &&
      this.printPagePreviewSelect.caseSheetHistory &&
      this.printPagePreviewSelect.caseSheetFindings
    ) {
      this.isMandatoryChecked();
    } else if (
      this.visitCategory === 'COVID-19 Screening' &&
      this.printPagePreviewSelect.caseSheetHistory &&
      this.printPagePreviewSelect.caseSheetFindings
    ) {
      this.isMandatoryChecked();
    } else if (
      this.visitCategory === 'NCD screening' &&
      this.printPagePreviewSelect.caseSheetHistory &&
      this.printPagePreviewSelect.caseSheetFindings &&
      this.printPagePreviewSelect.caseSheetNCDScreeningDetails
    ) {
      this.isMandatoryChecked();
    } else if (
      this.visitCategory === 'FP & Contraceptive Services' &&
      this.printPagePreviewSelect.caseSheetHistory &&
      this.printPagePreviewSelect.caseSheetFindings &&
      this.printPagePreviewSelect.caseSheetFamilyPlanning &&
      this.printPagePreviewSelect.caseSheetVisitDetails &&
      this.printPagePreviewSelect.caseSheetTreatmentOnSideEffects
    ) {
      this.isMandatoryChecked();
    } else if (
      this.visitCategory.toLowerCase() ===
        'neonatal and infant health care services' &&
      this.printPagePreviewSelect.caseSheetHistory &&
      this.printPagePreviewSelect.caseSheetFindings &&
      this.printPagePreviewSelect.caseSheetNeonatalAndInfant
    ) {
      this.isMandatoryChecked();
    } else if (
      this.visitCategory.toLowerCase() ===
        'childhood & adolescent healthcare services' &&
      this.printPagePreviewSelect.caseSheetHistory &&
      this.printPagePreviewSelect.caseSheetFindings &&
      this.printPagePreviewSelect.caseSheetOralVitaminA
    ) {
      this.isMandatoryChecked();
    } else {
      this.printPagePreviewSelect.selectAllCheckBox = false;
    }
  }

  isMandatoryChecked() {
    if (
      this.printPagePreviewSelect.caseSheetPrescription &&
      this.printPagePreviewSelect.caseSheetDiagnosis &&
      this.printPagePreviewSelect.caseSheetInvestigations &&
      this.printPagePreviewSelect.caseSheetExtInvestigation &&
      this.printPagePreviewSelect.caseSheetCurrentVitals &&
      this.printPagePreviewSelect.caseSheetChiefComplaints &&
      this.printPagePreviewSelect.caseSheetClinicalObservations &&
      this.printPagePreviewSelect.caseSheetCovidVaccinationDetails &&
      this.printPagePreviewSelect.caseSheetCounsellingProvided
    ) {
      this.printPagePreviewSelect.selectAllCheckBox = true;
    } else {
      this.printPagePreviewSelect.selectAllCheckBox = false;
    }
  }
}
