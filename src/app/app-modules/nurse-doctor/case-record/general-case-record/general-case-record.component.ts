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
import { Component, OnInit, Input, DoCheck } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';

@Component({
  selector: 'app-general-case-record',
  templateUrl: './general-case-record.component.html',
  styleUrls: ['./general-case-record.component.css'],
})
export class GeneralCaseRecordComponent implements OnInit, DoCheck {
  @Input()
  generalCaseRecordForm!: FormGroup;

  @Input()
  provideCounselling!: FormGroup;

  @Input()
  currentVitals: any;

  @Input()
  caseRecordMode!: string;

  @Input()
  visitCategory!: string;

  @Input()
  visitReason!: string;

  @Input()
  findings: any;
  current_language_set: any;
  hideFindings = false;

  generalFindingsForm!: FormGroup;
  generalDiagnosisForm!: FormGroup;
  generalDoctorInvestigationForm!: FormGroup;
  drugPrescriptionForm!: FormGroup;
  treatmentsOnSideEffectsFormData!: FormGroup;

  constructor(public httpServiceService: HttpServiceService) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    console.log(this.visitReason);
    console.log(this.visitCategory);
  }

  ngDoCheck() {
    this.generalFindingsForm = this.generalCaseRecordForm.get(
      'generalFindingsForm',
    ) as FormGroup;
    this.generalDiagnosisForm = this.generalCaseRecordForm.get(
      'generalDiagnosisForm',
    ) as FormGroup;
    this.generalDoctorInvestigationForm = this.generalCaseRecordForm.get(
      'generalDoctorInvestigationForm',
    ) as FormGroup;
    this.drugPrescriptionForm = this.generalCaseRecordForm.get(
      'drugPrescriptionForm',
    ) as FormGroup;
    this.treatmentsOnSideEffectsFormData = this.generalCaseRecordForm.get(
      'treatmentsOnSideEffectsForm',
    ) as FormGroup;
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }
}
