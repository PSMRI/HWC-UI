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
  ViewChild,
  ElementRef,
  Input,
  DoCheck,
  OnChanges,
  OnDestroy,
} from '@angular/core';
import { DoctorService } from '../../shared/services/doctor.service';
import { Location } from '@angular/common';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { ActivatedRoute } from '@angular/router';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { PrintPageSelectComponent } from '../../print-page-select/print-page-select.component';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-general-case-sheet',
  templateUrl: './general-case-sheet.component.html',
  styleUrls: ['./general-case-sheet.component.css'],
})
export class GeneralCaseSheetComponent implements OnInit, DoCheck, OnDestroy {
  @Input()
  previous: any;

  @Input()
  serviceType: any;

  caseSheetData: any;
  visitCategory: any;
  hideBack = false;
  language_file_path: any = './assets/';
  language: any;

  printPagePreviewSelect = {
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
  };
  current_language_set: any;

  constructor(
    private location: Location,
    private dialog: MatDialog,
    private doctorService: DoctorService,
    private route: ActivatedRoute,
    public httpServiceService: HttpServiceService,
    readonly sessionstorage: SessionStorageService,
  ) {}

  ngOnInit() {
    this.dataStore = this.route.snapshot.params['printablePage'] || 'previous';

    let caseSheetRequest;
    if (this.dataStore === 'current') {
      this.visitCategory = this.sessionstorage.getItem(
        'caseSheetVisitCategory',
      );
      caseSheetRequest = {
        VisitCategory: this.sessionstorage.getItem('caseSheetVisitCategory'),
        benFlowID: this.sessionstorage.getItem('caseSheetBenFlowID'),
        benVisitID: this.sessionstorage.getItem('caseSheetVisitID'),
        beneficiaryRegID: this.sessionstorage.getItem(
          'caseSheetBeneficiaryRegID',
        ),
        visitCode: this.sessionstorage.getItem('visitCode'),
      };
      this.getCasesheetData(caseSheetRequest);
    }
    if (this.dataStore === 'previous') {
      this.hideBack = true;

      this.visitCategory = this.sessionstorage.getItem(
        'previousCaseSheetVisitCategory',
      );
      caseSheetRequest = {
        VisitCategory: this.sessionstorage.getItem(
          'previousCaseSheetVisitCategory',
        ),
        benFlowID: this.sessionstorage.getItem('previousCaseSheetBenFlowID'),
        beneficiaryRegID: this.sessionstorage.getItem(
          'previousCaseSheetBeneficiaryRegID',
        ),
        visitCode: this.sessionstorage.getItem('previousCaseSheetVisitCode'),
      };
      this.getCasesheetData(caseSheetRequest);
    }

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

  dataStore: any;
  ngOnDestroy() {
    if (this.casesheetSubs) this.casesheetSubs.unsubscribe();
  }

  casesheetSubs: any;
  hideSelectQC = false;

  getCasesheetData(caseSheetRequest: any) {
    if (this.serviceType === 'TM') {
      this.getTMCasesheetData(caseSheetRequest);
    }
    if (this.serviceType === 'MMU') {
      this.getMMUCasesheetData(caseSheetRequest);
    }
    if (this.serviceType === 'HWC') {
      this.getTMCasesheetData(caseSheetRequest);
    }
  }
  getMMUCasesheetData(caseSheetRequest: any) {
    this.casesheetSubs = this.doctorService
      .getMMUCasesheetData(caseSheetRequest)
      .subscribe((res: any) => {
        if (res && res.statusCode === 200 && res.data) {
          this.caseSheetData = res.data;
          console.log(
            'caseSheetData',
            JSON.stringify(this.caseSheetData, null, 4),
          );
        }
      });
  }
  getTMCasesheetData(caseSheetRequest: any) {
    this.casesheetSubs = this.doctorService
      .getTMCasesheetData(caseSheetRequest)
      .subscribe((res: any) => {
        if (res && res.statusCode === 200 && res.data) {
          this.caseSheetData = res.data;
          console.log(
            'caseSheetData',
            JSON.stringify(this.caseSheetData, null, 4),
          );
        }
      });
  }

  selectPrintPage() {
    const mdDialogRef: MatDialogRef<PrintPageSelectComponent> =
      this.dialog.open(PrintPageSelectComponent, {
        width: '520px',
        disableClose: false,
        data: {
          printPagePreviewSelect: this.printPagePreviewSelect,
          visitCategory: this.visitCategory,
        },
      });

    mdDialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.printPagePreviewSelect.caseSheetANC = result.caseSheetANC;
        this.printPagePreviewSelect.caseSheetPNC = result.caseSheetPNC;
        this.printPagePreviewSelect.caseSheetExamination =
          result.caseSheetExamination;
        this.printPagePreviewSelect.caseSheetHistory = result.caseSheetHistory;
        this.printPagePreviewSelect.caseSheetPrescription =
          result.caseSheetPrescription;
        this.printPagePreviewSelect.caseSheetDiagnosis =
          result.caseSheetDiagnosis;
        this.printPagePreviewSelect.caseSheetInvestigations =
          result.caseSheetInvestigations;
        this.printPagePreviewSelect.caseSheetExtInvestigation =
          result.caseSheetExtInvestigation;
        this.printPagePreviewSelect.caseSheetCurrentVitals =
          result.caseSheetCurrentVitals;
        this.printPagePreviewSelect.caseSheetChiefComplaints =
          result.caseSheetChiefComplaints;
        this.printPagePreviewSelect.caseSheetClinicalObservations =
          result.caseSheetClinicalObservations;
        this.printPagePreviewSelect.caseSheetFindings =
          result.caseSheetFindings;
        this.printPagePreviewSelect.caseSheetCovidVaccinationDetails =
          result.caseSheetCovidVaccinationDetails;
        this.printPagePreviewSelect.caseSheetNCDScreeningDetails =
          result.caseSheetNCDScreeningDetails;
        this.printPagePreviewSelect.caseSheetFamilyPlanning =
          result.caseSheetFamilyPlanning;
        this.printPagePreviewSelect.caseSheetVisitDetails =
          result.caseSheetVisitDetails;
        this.printPagePreviewSelect.caseSheetTreatmentOnSideEffects =
          result.caseSheetTreatmentOnSideEffects;
        this.printPagePreviewSelect.caseSheetCounsellingProvided =
          result.caseSheetCounsellingProvided;
        this.printPagePreviewSelect.caseSheetNeonatalAndInfant =
          result.caseSheetNeonatalAndInfant;
      }
    });
  }

  downloadCasesheet() {
    window.print();
  }

  goBack() {
    this.location.back();
  }

  goToTop() {
    window.scrollTo(0, 0);
  }
}
