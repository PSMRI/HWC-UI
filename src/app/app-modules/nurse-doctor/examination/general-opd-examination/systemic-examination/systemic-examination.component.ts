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
import { Component, OnInit, Input, OnChanges, DoCheck } from '@angular/core';
import { GeneralUtils } from '../../../shared/utility/general-utility';
import { FormGroup, FormBuilder } from '@angular/forms';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-nurse-systemic-examination',
  templateUrl: './systemic-examination.component.html',
  styleUrls: ['./systemic-examination.component.css'],
})
export class SystemicExaminationComponent
  implements OnInit, OnChanges, DoCheck
{
  generalUtils = new GeneralUtils(this.fb, this.sessionstorage);

  @Input()
  systemicExaminationForm!: FormGroup;

  @Input()
  visitCategory!: string;

  displayANC = false;
  displayGeneral = false;
  current_language_set: any;
  gastroIntestinalSystemForm!: FormGroup;
  cardioVascularSystemForm!: FormGroup;
  respiratorySystemForm!: FormGroup;
  centralNervousSystemForm!: FormGroup;
  musculoSkeletalSystemForm!: FormGroup;
  genitoUrinarySystemForm!: FormGroup;
  obstetricExaminationForANCForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    public httpServiceService: HttpServiceService,
    readonly sessionstorage: SessionStorageService,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.displayANC = false;
    this.displayGeneral = false;

    if (this.visitCategory === 'ANC') {
      this.systemicExaminationForm.addControl(
        'obstetricExaminationForANCForm',
        this.generalUtils.createObstetricExaminationForANCForm(),
      );
      this.displayANC = true;
    } else if (
      this.visitCategory === 'General OPD' ||
      this.visitCategory === 'PNC'
    ) {
      this.displayGeneral = true;
    }
    this.loadFormData();
  }

  loadFormData() {
    this.gastroIntestinalSystemForm = this.systemicExaminationForm.get(
      'gastroIntestinalSystemForm',
    ) as FormGroup;
    this.cardioVascularSystemForm = this.systemicExaminationForm.get(
      'cardioVascularSystemForm',
    ) as FormGroup;
    this.respiratorySystemForm = this.systemicExaminationForm.get(
      'respiratorySystemForm',
    ) as FormGroup;
    this.centralNervousSystemForm = this.systemicExaminationForm.get(
      'centralNervousSystemForm',
    ) as FormGroup;
    this.musculoSkeletalSystemForm = this.systemicExaminationForm.get(
      'musculoSkeletalSystemForm',
    ) as FormGroup;
    this.genitoUrinarySystemForm = this.systemicExaminationForm.get(
      'genitoUrinarySystemForm',
    ) as FormGroup;
    this.obstetricExaminationForANCForm = this.systemicExaminationForm.get(
      'obstetricExaminationForANCForm',
    ) as FormGroup;
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }

  ngOnChanges() {
    this.displayANC = this.visitCategory === 'ANC' ? true : false;
    if (this.displayANC) {
      this.systemicExaminationForm.addControl(
        'obstetricExaminationForANCForm',
        this.generalUtils.createObstetricExaminationForANCForm(),
      );
    } else if (!this.displayANC) {
      this.systemicExaminationForm.removeControl(
        'obstetricExaminationForANCForm',
      );
      if (
        this.visitCategory === 'General OPD' ||
        this.visitCategory === 'PNC'
      ) {
        this.displayGeneral = true;
      }
    }
    this.loadFormData();
  }
}
