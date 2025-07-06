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
  EventEmitter,
  Input,
  OnChanges,
  Output,
  DoCheck,
  OnDestroy,
} from '@angular/core';
import { FormBuilder, FormGroup, FormControl, FormArray } from '@angular/forms';
import {
  MasterdataService,
  DoctorService,
  NurseService,
} from '../../shared/services';
import { Subscription } from 'rxjs';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { environment } from 'src/environments/environment';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { AmritTrackingService } from 'Common-UI/src/tracking';

@Component({
  selector: 'app-patient-investigations',
  templateUrl: './investigations.component.html',
  styleUrls: ['./investigations.component.css'],
})
export class InvestigationsComponent implements OnInit, DoCheck, OnDestroy {
  @Input()
  patientInvestigationsForm!: FormGroup;

  @Input()
  mode!: string;

  patientInvestigationDetails: any;
  selectLabTest: any;
  currentLanguageSet: any;
  rbsTestResultSubscription!: Subscription;
  RBSTestScore!: number;
  RBStestDone = false;
  rbsTestResultCurrent: any;

  constructor(
    private fb: FormBuilder,
    private masterdataService: MasterdataService,
    public httpServiceService: HttpServiceService,
    private doctorService: DoctorService,
    private nurseService: NurseService,
    readonly sessionstorage: SessionStorageService,
    private trackingService: AmritTrackingService,
  ) {}

  ngOnInit() {
    this.nurseService.clearRbsInVitals();
    this.assignSelectedLanguage();
    this.getNurseMasterData();
    this.rbsTestValidation();
  }
  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  nurseMasterDataSubscription: any;
  getNurseMasterData() {
    this.nurseMasterDataSubscription =
      this.masterdataService.nurseMasterData$.subscribe((masterData) => {
        if (masterData && masterData.procedures) {
          this.selectLabTest = masterData.procedures.filter((item: any) => {
            return item.procedureType === 'Laboratory';
          });

          if (String(this.mode) === 'view') {
            const visitID = this.sessionstorage.getItem('visitID');
            const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
            this.getInvestigation(benRegID, visitID);
          }

          const specialistFlagString =
            this.sessionstorage.getItem('specialistFlag');

          if (
            specialistFlagString !== null &&
            parseInt(specialistFlagString) === 100
          ) {
            const visitID = this.sessionstorage.getItem('visitID');
            const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
            this.getInvestigation(benRegID, visitID);
          }
        }
      });
  }

  ngOnDestroy() {
    if (this.nurseMasterDataSubscription)
      this.nurseMasterDataSubscription.unsubscribe();
    if (this.getInvestigationDetails)
      this.getInvestigationDetails.unsubscribe();
    if (this.rbsTestResultSubscription) {
      this.rbsTestResultSubscription.unsubscribe();
    }
  }

  getInvestigationDetails: any;
  getInvestigation(benRegID: any, visitID: any) {
    this.getInvestigationDetails = this.doctorService
      .getVisitComplaintDetails(benRegID, visitID)
      .subscribe((value: any) => {
        if (value !== null && value.statusCode === 200 && value.data !== null) {
          const visitComplaintDetail = value.data;
          this.patientInvestigationDetails = value.data.Investigation;
          this.checkLabTest();
        }
      });
  }

  checkLabTest() {
    const formArray = this.patientInvestigationsForm.controls[
      'laboratoryList'
    ] as FormArray;
    const result = [];
    if (this.patientInvestigationDetails) {
      const temp = this.patientInvestigationDetails.laboratoryList;
      if (temp) {
        for (let i = 0; i < temp.length; i++) {
          const testType = this.selectLabTest.filter((item: any) => {
            return item.procedureID === temp[i].procedureID;
          });
          if (testType.length > 0) {
            result.push(testType[0]);
          }
        }
        const k = formArray;
        k.patchValue(result);

        temp.forEach((element: any) => {
          if (element.procedureName === environment.RBSTest) {
            this.nurseService.setRbsSelectedInInvestigation(true);
          }
        });
      }
    }
  }

  checkInvestigation(laboratoryList: any) {}

  get laboratoryList() {
    return this.patientInvestigationsForm.controls['laboratoryList'];
  }

  rbsTestValidation() {
    this.rbsTestResultSubscription =
      this.nurseService.rbsTestResultCurrent$.subscribe((response) => {
        if (response !== undefined && response !== null) {
          this.RBSTestScore = response;
          this.RBStestDone = true;
          this.rbsTestResultCurrent = response;
        } else {
          this.rbsTestResultCurrent = null;
        }
      });
  }

  canDisable(test: any) {
    if (
      ((this.rbsTestResultCurrent !== null &&
        this.rbsTestResultCurrent !== undefined) ||
        this.nurseService.rbsTestResultFromDoctorFetch !== null) &&
      test.procedureName === environment.RBSTest
    ) {
      return true;
    }
  }

  checkTestName(event: any) {
    console.log('testName', event);
    this.RBStestDone = false;
    let item = event.value;
    let oneSelected = 0;
    this.nurseService.setRbsSelectedInInvestigation(false);
    item.forEach((element: any) => {
      if (element.procedureName === environment.RBSTest) {
        this.RBStestDone = true;
        this.nurseService.setRbsSelectedInInvestigation(true);
        oneSelected++;
        const hbTest = this.selectLabTest.find(
          (test: any) =>
            test.procedureName.toLowerCase() ===
            environment.haemoglobinTest.toLowerCase(),
        );
        if (hbTest && !item.includes(hbTest)) {
          item.push(hbTest);
        }
      }
    });
    // Remove duplicates
    item = Array.from(new Set(item));

    // Update form control value
    this.patientInvestigationsForm.controls['laboratoryList'].setValue(item);
  }

  trackFieldInteraction(fieldName: string) {
    try {
      this.trackingService.trackFieldInteraction(fieldName, 'Investigations');
    } catch (error) {
      console.error(`❌ Error tracking investigations ${fieldName}:`, error);
    }
  }
}
