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
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';

@Component({
  selector: 'app-family-planning-case-sheet',
  templateUrl: './family-planning-case-sheet.component.html',
  styleUrls: ['./family-planning-case-sheet.component.css'],
})
export class FamilyPlanningCaseSheetComponent
  implements OnChanges, OnInit, DoCheck
{
  @Input()
  caseSheetData: any;

  @Input()
  printPagePreviewSelect: any;

  @Input()
  previous: any;

  currentLanguageSet: any;
  familyPlanningAndReproductiveCasesheet: any;
  iecCounsellingDetailsCasesheet: any;
  dispensationDetailsCasesheet: any;
  referDetails: any;
  referralReasonList = '';
  enableFPDetails = false;
  enableDoses = false;
  enableSterilization = false;
  otherCurrentFpMethod = false;
  enableOtherCounselled = false;
  enableOtherTypeOfContraceptive = false;
  enableDoseTaken = false;
  enableTypeOfIUCD = false;
  enableOtherContraceptivePrescribed = false;
  enableOtherInstitute = false;
  enableOtherReferral = false;

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
    if (this.caseSheetData !== undefined && this.caseSheetData !== null) {
      if (
        this.caseSheetData &&
        this.caseSheetData.nurseData &&
        this.caseSheetData.nurseData.fpData &&
        this.caseSheetData.nurseData.fpData.familyPlanningReproductiveDetails
      ) {
        this.familyPlanningAndReproductiveCasesheet =
          this.caseSheetData.nurseData.fpData.familyPlanningReproductiveDetails;

        if (
          this.familyPlanningAndReproductiveCasesheet.fertilityStatus !==
            undefined &&
          this.familyPlanningAndReproductiveCasesheet.fertilityStatus !==
            null &&
          this.familyPlanningAndReproductiveCasesheet.fertilityStatus.toLowerCase() ===
            'fertile'
        ) {
          this.enableFPDetails = true;
        } else {
          this.enableFPDetails = false;
        }

        if (
          this.familyPlanningAndReproductiveCasesheet.dosesTaken !==
            undefined &&
          this.familyPlanningAndReproductiveCasesheet.dosesTaken !== null &&
          this.familyPlanningAndReproductiveCasesheet.dateOfLastDoseTaken !==
            undefined &&
          this.familyPlanningAndReproductiveCasesheet.dateOfLastDoseTaken !==
            null
        ) {
          this.enableDoses = true;
        } else {
          this.enableDoses = false;
        }

        if (
          this.familyPlanningAndReproductiveCasesheet.dateOfSterilization !==
            undefined &&
          this.familyPlanningAndReproductiveCasesheet.dateOfSterilization !==
            null &&
          this.familyPlanningAndReproductiveCasesheet.placeOfSterilization !==
            undefined &&
          this.familyPlanningAndReproductiveCasesheet.placeOfSterilization !==
            null
        ) {
          this.enableSterilization = true;
        } else {
          this.enableSterilization = false;
        }

        if (
          this.familyPlanningAndReproductiveCasesheet
            .otherCurrentlyUsingFpMethod !== undefined &&
          this.familyPlanningAndReproductiveCasesheet
            .otherCurrentlyUsingFpMethod !== null
        ) {
          this.otherCurrentFpMethod = true;
        } else {
          this.otherCurrentFpMethod = false;
        }
      }

      if (
        this.caseSheetData &&
        this.caseSheetData.nurseData &&
        this.caseSheetData.nurseData.fpData &&
        this.caseSheetData.nurseData.fpData.iecAndCounsellingDetails
      ) {
        this.iecCounsellingDetailsCasesheet =
          this.caseSheetData.nurseData.fpData.iecAndCounsellingDetails;

        if (
          this.iecCounsellingDetailsCasesheet.otherCounselledOn !== undefined &&
          this.iecCounsellingDetailsCasesheet.otherCounselledOn !== null
        ) {
          this.enableOtherCounselled = true;
        } else {
          this.enableOtherCounselled = false;
        }

        if (
          this.iecCounsellingDetailsCasesheet.otherTypeOfContraceptiveOpted !==
            undefined &&
          this.iecCounsellingDetailsCasesheet.otherTypeOfContraceptiveOpted !==
            null
        ) {
          this.enableOtherTypeOfContraceptive = true;
        } else {
          this.enableOtherTypeOfContraceptive = false;
        }
      }

      if (
        this.caseSheetData &&
        this.caseSheetData.nurseData &&
        this.caseSheetData.nurseData.fpData &&
        this.caseSheetData.nurseData.fpData.dispensationDetails
      ) {
        this.dispensationDetailsCasesheet =
          this.caseSheetData.nurseData.fpData.dispensationDetails;

        if (
          this.dispensationDetailsCasesheet.dosesTaken !== undefined &&
          this.dispensationDetailsCasesheet.dosesTaken !== null &&
          this.dispensationDetailsCasesheet.dateOfLastDoseTaken !== undefined &&
          this.dispensationDetailsCasesheet.dateOfLastDoseTaken !== null
        ) {
          this.enableDoseTaken = true;
        } else {
          this.enableDoseTaken = false;
        }

        if (
          this.dispensationDetailsCasesheet.typeOfIUCDInserted !== undefined &&
          this.dispensationDetailsCasesheet.typeOfIUCDInserted !== null &&
          this.dispensationDetailsCasesheet.dateOfIUCDInsertion !== undefined &&
          this.dispensationDetailsCasesheet.dateOfIUCDInsertion !== null &&
          this.dispensationDetailsCasesheet.iucdInsertionDoneBy !== undefined &&
          this.dispensationDetailsCasesheet.iucdInsertionDoneBy !== null
        ) {
          this.enableTypeOfIUCD = true;
        } else {
          this.enableTypeOfIUCD = false;
        }

        if (
          this.dispensationDetailsCasesheet
            .otherTypeOfContraceptivePrescribed !== undefined &&
          this.dispensationDetailsCasesheet
            .otherTypeOfContraceptivePrescribed !== null
        ) {
          this.enableOtherContraceptivePrescribed = true;
        } else {
          this.enableOtherContraceptivePrescribed = false;
        }
      }

      if (this.caseSheetData && this.caseSheetData.doctorData) {
        this.referDetails = this.caseSheetData.doctorData.Refer;
        console.log('refer', this.referDetails);
        if (
          this.referDetails.otherReferredToInstituteName !== undefined &&
          this.referDetails.otherReferredToInstituteName !== null
        ) {
          this.enableOtherInstitute = true;
        } else {
          this.enableOtherInstitute = false;
        }
        if (
          this.referDetails.otherReferralReason !== undefined &&
          this.referDetails.otherReferralReason !== undefined
        ) {
          this.enableOtherReferral = true;
        } else {
          this.enableOtherReferral = false;
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
        console.log(
          'referDetailsForFamilyPlanning',
          JSON.stringify(this.caseSheetData, null, 4),
        );
      }
    }
  }
}
