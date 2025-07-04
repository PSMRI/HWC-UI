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
  DoCheck,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { NurseService } from '../../../shared/services';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-visit-details-case-sheet',
  templateUrl: './visit-details-case-sheet.component.html',
  styleUrls: ['./visit-details-case-sheet.component.css'],
})
export class VisitDeatilsCaseSheetComponent
  implements OnChanges, OnInit, DoCheck
{
  @Input()
  caseSheetData: any;

  @Input()
  visitCategory: any;

  @Input()
  printPagePreviewSelect: any;

  @Input()
  previous: any;

  currentLanguageSet: any;
  visitDetailsCasesheet: any;
  enableOtherFollowFpMethod = false;
  enableOtherSideEffect = false;
  previousConfirmedDiseasesList = [];
  enableConfirmedDiseases = false;
  ncdVisitDetails: any;

  constructor(
    private httpServiceService: HttpServiceService,
    private nurseService: NurseService,
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
    if (this.caseSheetData !== undefined && this.caseSheetData !== null) {
      if (
        this.caseSheetData &&
        this.caseSheetData.nurseData &&
        this.caseSheetData.nurseData.fpNurseVisitData
      ) {
        this.visitDetailsCasesheet =
          this.caseSheetData.nurseData.fpNurseVisitData;

        if (
          this.visitDetailsCasesheet.otherFollowUpForFpMethod !== undefined &&
          this.visitDetailsCasesheet.otherFollowUpForFpMethod !== null
        ) {
          this.enableOtherFollowFpMethod = true;
        } else {
          this.enableOtherFollowFpMethod = false;
        }

        if (
          this.visitDetailsCasesheet.otherSideEffects !== undefined &&
          this.visitDetailsCasesheet.otherSideEffects !== null
        ) {
          this.enableOtherSideEffect = true;
        } else {
          this.enableOtherSideEffect = false;
        }
      }

      if (
        this.caseSheetData &&
        this.caseSheetData.BeneficiaryData !== undefined &&
        this.caseSheetData.BeneficiaryData !== null &&
        this.visitCategory === 'NCD care'
      ) {
        this.ncdVisitDetails = this.caseSheetData.BeneficiaryData;
        this.loadConfirmedDiseasesFromNCD(
          this.caseSheetData.BeneficiaryData.beneficiaryRegID,
        );
      }
    }
  }

  loadConfirmedDiseasesFromNCD(benRegId: any) {
    this.previousConfirmedDiseasesList = [];
    this.enableConfirmedDiseases = false;
    const obj = {
      beneficiaryRegId: benRegId,
    };

    this.nurseService
      .getPreviousVisitConfirmedDiseases(obj)
      .subscribe((value: any) => {
        if (value !== null && value.statusCode === 200 && value.data !== null) {
          this.previousConfirmedDiseasesList = [];

          if (
            value.data.confirmedDiseases !== undefined &&
            value.data.confirmedDiseases !== null &&
            value.data.confirmedDiseases.length > 0
          ) {
            this.previousConfirmedDiseasesList = value.data.confirmedDiseases;
            this.enableConfirmedDiseases = true;
          }
        }
      });
  }
}
