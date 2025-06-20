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
  Injector,
  DoCheck,
  OnChanges,
  OnDestroy,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpServiceService } from '../../core/services/http-service.service';
import { SetLanguageComponent } from '../../core/components/set-language.component';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-case-sheet',
  templateUrl: './case-sheet.component.html',
  styleUrls: ['./case-sheet.component.css'],
})
export class CaseSheetComponent implements OnInit, DoCheck, OnDestroy {
  QC = false;
  General = false;
  NCDScreening = false;

  preview: any;
  previous: any;
  serviceType: any;
  language: any;
  current_language_set: any;
  language_file_path: any = './assets/';
  constructor(
    private route: ActivatedRoute,
    private injector: Injector,
    readonly sessionstorage: SessionStorageService,
    public httpServiceService: HttpServiceService,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.caseSheetCategory();
    this.serviceType = this.route.snapshot.params['serviceType'];
    console.log('route1' + this.route.snapshot.params['serviceType']);

    const input = this.injector.get(MAT_DIALOG_DATA, null);
    if (input) {
      this.previous = input.previous;
      this.serviceType = input.serviceType;
    }
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

  ngOnDestroy() {
    console.log('success');
  }

  caseSheetCategory() {
    const dataStore = this.route.snapshot.params['printablePage'] || 'previous';

    let type;
    if (this.previous) {
      if (dataStore === 'previous') {
        type = this.sessionstorage.getItem('previousCaseSheetVisitCategory');
      }
    } else {
      if (dataStore === 'current') {
        type = this.sessionstorage.getItem('caseSheetVisitCategory');
      }
      if (dataStore === 'previous') {
        type = this.sessionstorage.getItem('previousCaseSheetVisitCategory');
      }
    }

    if (type) {
      switch (type) {
        case 'General OPD (QC)':
        case 'General OPD':
        case 'NCD care':
        case 'PNC':
        case 'ANC':
        case 'COVID-19 Screening':
        case 'NCD screening':
        case 'FP & Contraceptive Services':
        case 'Neonatal and Infant Health Care Services':
        case 'Childhood & Adolescent Healthcare Services':
          this.General = true;
          break;

        default:
          this.QC = false;
          this.General = false;
          break;
      }
    }
  }
}
