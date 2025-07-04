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
  OnChanges,
  OnDestroy,
  DoCheck,
} from '@angular/core';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';

import { ConfirmationService } from '../../core/services/confirmation.service';
import { DoctorService } from '../shared/services';
import { NcdScreeningService } from '../shared/services/ncd-screening.service';
import { Subscription } from 'rxjs';
import { HttpServiceService } from '../../core/services/http-service.service';
import { SetLanguageComponent } from '../../core/components/set-language.component';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-visit-details',
  templateUrl: './visit-details.component.html',
  styleUrls: ['./visit-details.component.css'],
})
export class VisitDetailsComponent implements OnInit, DoCheck, OnDestroy {
  @Input()
  patientVisitForm!: FormGroup;

  @Input()
  mode!: string;

  visitCategory: any;

  hideAll = false;
  showANCVisit = false;
  showNeonatalVisit = false;
  showChildAndAdolescent = false;
  showPNCVisit = false;
  showNCDCare = false;
  showPNC = false;
  showOPD = false;
  showFamilyPlanning = false;
  showNcdScreeningVisit = false;
  enableFileSelection = false;
  currentLanguageSet: any;
  showCOVID = false;
  enableDiseaseConfirmationForm = false;
  visitReason: any;
  idrsOrCbac: any;
  enableCBACForm = false;
  isCdssVitals = false;
  enablingCBACSectionSubscription!: Subscription;
  isCdssStatus = false;
  isCdss: any;
  isCovidVaccinationStatusVisible = false;

  patientVisitDetailsForm!: FormGroup;
  covidVaccineStatusForm!: FormGroup;
  patientChiefComplaintsForm!: FormGroup;
  patientAdherenceForm!: FormGroup;
  patientInvestigationsForm!: FormGroup;
  patientCovidForm!: FormGroup;
  patientFileUploadDetailsForm!: FormGroup;
  patientDiseaseForm!: FormGroup;
  cbacScreeningForm!: FormGroup;
  presentChiefComplaintDb!: FormGroup;
  diseaseSummaryDb!: FormGroup;
  constructor(
    private fb: FormBuilder,
    private confirmationService: ConfirmationService,
    public httpServiceService: HttpServiceService,
    private doctorService: DoctorService,
    private ncdScreeningService: NcdScreeningService,
    readonly sessionstorage: SessionStorageService,
  ) {}

  ngOnInit() {
    this.patientVisitDetailsForm = this.patientVisitForm.get(
      'patientVisitDetailsForm',
    ) as FormGroup;
    this.cbacScreeningForm = this.patientVisitForm.get(
      'cbacScreeningForm',
    ) as FormGroup;

    this.covidVaccineStatusForm = this.patientVisitForm.get(
      'covidVaccineStatusForm',
    ) as FormGroup;
    this.patientChiefComplaintsForm = this.patientVisitForm.get(
      'patientChiefComplaintsForm',
    ) as FormGroup;
    this.patientAdherenceForm = this.patientVisitForm.get(
      'patientAdherenceForm',
    ) as FormGroup;
    this.patientInvestigationsForm = this.patientVisitForm.get(
      'patientInvestigationsForm',
    ) as FormGroup;
    this.patientCovidForm = this.patientVisitForm.get(
      'patientCovidForm',
    ) as FormGroup;
    this.patientFileUploadDetailsForm = this.patientVisitForm.get(
      'patientFileUploadDetailsForm',
    ) as FormGroup;
    this.patientDiseaseForm = this.patientVisitForm.get(
      'patientDiseaseForm',
    ) as FormGroup;
    const cdssForm = this.patientVisitForm.get('cdssForm') as FormGroup;
    this.presentChiefComplaintDb = cdssForm.get(
      'presentChiefComplaintDb',
    ) as FormGroup;
    this.diseaseSummaryDb = cdssForm.get('diseaseSummaryDb') as FormGroup;

    this.ncdScreeningService.clearDiseaseConfirmationScreenFlag();
    this.isCdss = this.sessionstorage.getItem('isCdss');
    if (
      this.isCdss !== undefined &&
      this.isCdss !== null &&
      this.isCdss === 'true'
    ) {
      this.isCdssStatus = true;
    } else {
      this.isCdssStatus = false;
    }
    this.ncdScreeningService.enableDiseaseConfirmForm$.subscribe(
      (response: any) => {
        if (response === 'idrs' || response === 'cbac') {
          this.idrsOrCbac = response;
          this.enableDiseaseConfirmationForm = true;
          if (response === 'idrs' && this.visitCategory === 'NCD screening') {
            this.enableCBACForm = false;
          } else if (
            response === 'cbac' &&
            this.visitCategory === 'NCD screening'
          )
            this.enableCBACForm = true;
        }
      },
    );

    this.getVisitCategory();
    this.getVisitReason();
    this.assignSelectedLanguage();
    const specialistFlagString = this.sessionstorage.getItem('specialistFlag');

    if (
      specialistFlagString !== null &&
      parseInt(specialistFlagString) === 100
    ) {
      const visitCategory: any = this.sessionstorage.getItem('visitCat');
      this.sessionstorage.setItem('visitCategory', visitCategory);
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

  ngOnDestroy() {
    if (this.enablingCBACSectionSubscription)
      this.enablingCBACSectionSubscription.unsubscribe();
  }

  getVisitCategory() {
    (<FormGroup>(
      this.patientVisitForm.controls['patientVisitDetailsForm']
    )).controls['visitCategory'].valueChanges.subscribe((categoryValue) => {
      if (categoryValue) {
        this.visitCategory = categoryValue;
        this.conditionCheck();
      }
    });
  }
  getVisitReason() {
    (<FormGroup>(
      this.patientVisitForm.controls['patientVisitDetailsForm']
    )).controls['visitReason'].valueChanges.subscribe((categoryValue) => {
      if (categoryValue) {
        const visitDetailsForm = <FormGroup>(
          this.patientVisitForm.controls['patientVisitDetailsForm']
        );
        if (visitDetailsForm !== null && visitDetailsForm !== undefined) {
          this.visitReason = visitDetailsForm.controls['visitReason'].value;
          console.log('visit reason', this.visitReason);
        }
      }
    });
  }
  conditionCheck() {
    if (!this.mode) this.hideAllTab();
    if (this.visitCategory === 'NCD screening') {
      this.enableFileSelection = true;
      this.showNcdScreeningVisit = true;
      this.enablingCBACSectionSubscription =
        this.ncdScreeningService.enablingIdrs$.subscribe((response) => {
          if (response === true) {
            this.enableCBACForm = false;
          } else {
            this.enableCBACForm = true;
          }
        });
    }
    if (this.visitCategory === 'General OPD (QC)') {
      this.hideAll = false;
      this.showOPD = true;
    } else if (this.visitCategory === 'ANC') {
      this.showANCVisit = true;
    } else if (this.visitCategory === 'PNC') {
      this.showPNCVisit = true;
    } else if (this.visitCategory === 'General OPD') {
      this.showOPD = true;
    } else if (this.visitCategory === 'FP & Contraceptive Services') {
      this.showFamilyPlanning = true;
    } else if (
      this.visitCategory === 'Neonatal and Infant Health Care Services'
    ) {
      this.showNeonatalVisit = true;
    } else if (
      this.visitCategory === 'Childhood & Adolescent Healthcare Services'
    ) {
      this.showChildAndAdolescent = true;
    } else if (this.visitCategory === 'NCD care') {
      this.showNCDCare = true;
    } else if (this.visitCategory === 'COVID-19 Screening') {
      this.showCOVID = true;
    } else {
      this.hideAll = false;
    }
  }

  hideAllTab() {
    this.hideAll = false;
    this.showANCVisit = false;
    this.showPNCVisit = false;
    this.showNCDCare = false;
    this.showPNC = false;
    this.showOPD = false;
    this.showFamilyPlanning = false;
    this.showNeonatalVisit = false;
    this.showChildAndAdolescent = false;
    this.showCOVID = false;
    this.showNcdScreeningVisit = false;
    this.enableDiseaseConfirmationForm = false;
  }
}
