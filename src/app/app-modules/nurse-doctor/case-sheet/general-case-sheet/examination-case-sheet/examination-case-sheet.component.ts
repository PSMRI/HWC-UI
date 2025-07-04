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
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { DoctorService } from '../../../shared/services';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-examination-case-sheet',
  templateUrl: './examination-case-sheet.component.html',
  styleUrls: ['./examination-case-sheet.component.css'],
})
export class ExaminationCaseSheetComponent
  implements OnChanges, OnInit, DoCheck
{
  @Input()
  previous: any;

  @Input()
  casesheetData: any;

  visitCategory: any;

  generalExamination: any;
  headToToeExamination: any;
  gastroIntestinalExamination: any;
  cardioVascularExamination: any;
  respiratorySystemExamination: any;
  centralNervousSystemExamination: any;
  musculoskeletalSystemExamination: any;
  oralExamination: any;
  genitoUrinarySystemExamination: any;
  obstetricExamination: any;
  current_language_set: any;
  refer: any;
  referDetails: any;
  beneficiaryRegID: any;
  visitID: any;
  revisitDate: any;
  date!: string;
  serviceList = '';

  constructor(
    public httpServiceService: HttpServiceService,
    private doctorService: DoctorService,
    readonly sessionstorage: SessionStorageService,
  ) {}

  ngOnInit() {
    this.visitCategory = this.sessionstorage.getItem('caseSheetVisitCategory');
    this.beneficiaryRegID = this.sessionstorage.getItem('beneficiaryRegID');
    this.visitID = this.sessionstorage.getItem('visitID');
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
    if (
      this.casesheetData &&
      this.casesheetData.nurseData &&
      this.casesheetData.nurseData.examination
    ) {
      const examination = this.casesheetData.nurseData.examination;

      if (examination.generalExamination)
        this.generalExamination = examination.generalExamination;

      if (examination.headToToeExamination)
        this.headToToeExamination = examination.headToToeExamination;

      if (examination.cardiovascularExamination)
        this.cardioVascularExamination = examination.cardiovascularExamination;

      if (examination.respiratoryExamination)
        this.respiratorySystemExamination = examination.respiratoryExamination;

      if (examination.centralNervousExamination)
        this.centralNervousSystemExamination =
          examination.centralNervousExamination;

      if (examination.musculoskeletalExamination)
        this.musculoskeletalSystemExamination =
          examination.musculoskeletalExamination;

      if (examination.oralDetails)
        this.oralExamination = examination.oralDetails;

      if (examination.genitourinaryExamination)
        this.genitoUrinarySystemExamination =
          examination.genitourinaryExamination;

      if (examination.obstetricExamination)
        this.obstetricExamination = examination.obstetricExamination;

      if (examination.gastrointestinalExamination)
        this.gastroIntestinalExamination =
          examination.gastrointestinalExamination;
    }
    if (this.casesheetData && this.casesheetData.doctorData) {
      this.referDetails = this.casesheetData.doctorData.Refer;
      console.log('refer', this.referDetails);

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
      console.log(
        'referDetailsForReferexamination',
        JSON.stringify(this.casesheetData, null, 4),
      );
    }
  }
  padLeft() {
    const len = String(10).length - String(this).length + 1;
    return len > 0 ? new Array(len).join('0') + this : this;
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
}
