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
import { Component, OnInit, Input, DoCheck, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormArray,
  FormGroup,
  FormControl,
  AbstractControl,
} from '@angular/forms';

import {
  MasterdataService,
  NurseService,
  DoctorService,
} from '../../../shared/services';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { MatDialog } from '@angular/material/dialog';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { PreviousDetailsComponent } from 'src/app/app-modules/core/components/previous-details/previous-details.component';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { AmritTrackingService } from 'Common-UI/src/tracking';

@Component({
  selector: 'app-general-family-history',
  templateUrl: './family-history.component.html',
  styleUrls: ['./family-history.component.css'],
})
export class FamilyHistoryComponent implements OnInit, DoCheck, OnDestroy {
  @Input()
  familyHistoryForm!: FormGroup;

  @Input()
  mode!: string;

  @Input()
  visitCategory: any;

  masterData: any;
  familyHistoryData: any;

  diseaseMasterData: any = [];
  familyMemeberMasterData: any = [];
  previousSelectedDiseaseList: any = [];
  diseaseSelectList: any = [];
  currentLanguageSet: any;
  snomedCode: any;
  snomedTerm: any;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private nurseService: NurseService,
    private doctorService: DoctorService,
    private confirmationService: ConfirmationService,
    public httpServiceService: HttpServiceService,
    private masterdataService: MasterdataService,
    readonly sessionstorage: SessionStorageService,
    private trackingService: AmritTrackingService,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.getMasterData();
  }

  ngOnDestroy() {
    if (this.nurseMasterDataSubscription)
      this.nurseMasterDataSubscription.unsubscribe();

    if (this.generalHistorySubscription)
      this.generalHistorySubscription.unsubscribe();
  }

  getFamilyDiseases(): AbstractControl[] | null {
    const familyDiseaseControl =
      this.familyHistoryForm.get('familyDiseaseList');
    return familyDiseaseControl instanceof FormArray
      ? familyDiseaseControl.controls
      : null;
  }

  nurseMasterDataSubscription: any;
  getMasterData() {
    this.nurseMasterDataSubscription =
      this.masterdataService.nurseMasterData$.subscribe((masterData) => {
        if (masterData) {
          this.masterData = masterData;
          this.diseaseMasterData = masterData.DiseaseTypes;

          this.familyMemeberMasterData = masterData.familyMemberTypes.filter(
            (item: any) => {
              if (item.benRelationshipType.toLowerCase() === 'brother') {
                this.masterData.familyMemberTypes.push(item);
                return item.benRelationshipID;
              }
              if (item.benRelationshipType.toLowerCase() === 'daughter') {
                this.masterData.familyMemberTypes.push(item);
                return item.benRelationshipID;
              }
              if (item.benRelationshipType.toLowerCase() === 'father') {
                this.masterData.familyMemberTypes.push(item);
                return item.benRelationshipID;
              }
              if (item.benRelationshipType.toLowerCase() === 'mother') {
                this.masterData.familyMemberTypes.push(item);
                return item.benRelationshipID;
              }
              if (item.benRelationshipType.toLowerCase() === 'sister') {
                this.masterData.familyMemberTypes.push(item);
                return item.benRelationshipID;
              }
              if (item.benRelationshipType.toLowerCase() === 'son') {
                this.masterData.familyMemberTypes.push(item);
                return item.benRelationshipID;
              }
            },
          );

          this.addFamilyDisease();

          if (String(this.mode) === 'view') {
            this.getGeneralHistory();
          }

          const specialistFlagString =
            this.sessionstorage.getItem('specialistFlag');

          if (
            specialistFlagString !== null &&
            parseInt(specialistFlagString) === 100
          ) {
            this.getGeneralHistory();
          }
        }
      });
  }

  generalHistorySubscription: any;
  getGeneralHistory() {
    this.generalHistorySubscription =
      this.doctorService.populateHistoryResponse$.subscribe((history) => {
        if (
          history !== null &&
          history.statusCode === 200 &&
          history.data !== null &&
          history.data.FamilyHistory
        ) {
          this.familyHistoryData = history.data.FamilyHistory;
          this.handleFamilyHistoryData();
        }
      });
  }

  handleFamilyHistoryData() {
    this.familyHistoryForm.patchValue(this.familyHistoryData);
    const formArray = this.familyHistoryForm.controls[
      'familyDiseaseList'
    ] as FormArray;
    const temp = this.familyHistoryData.familyDiseaseList.slice();

    for (let i = 0; i < temp.length; i++) {
      const diseaseType = this.diseaseMasterData.filter((item: any) => {
        return item.diseaseType === temp[i].diseaseType;
      });

      if (diseaseType.length > 0) temp[i].diseaseType = diseaseType[0];

      if (temp[i].diseaseType) {
        const k: any = formArray.get('' + i);
        k.patchValue(temp[i]);
        k.markAsTouched();
        k.markAsDirty();
        this.filterFamilyDiseaseList(temp[i].diseaseType, i);

        if (
          k?.get('diseaseType')?.value !== null &&
          k?.get('diseaseType')?.value !== 'None' &&
          k?.get('diseaseType')?.value !== 'Nil'
        ) {
          k?.get('familyMembers')?.enable();
        }
      }

      if (i + 1 < temp.length) this.addFamilyDisease();
    }
  }

  addFamilyDisease() {
    const familyDiseaseList = <FormArray>(
      this.familyHistoryForm.controls['familyDiseaseList']
    );
    const temp = familyDiseaseList.value;

    if (this.diseaseMasterData) {
      const result = this.diseaseMasterData.filter((item: any) => {
        const arr = temp.filter((value: any) => {
          if (
            value.diseaseType !== null &&
            value.diseaseType.diseaseType !== 'Other'
          )
            return value.diseaseType.diseaseType === item.diseaseType;
          else return false;
        });
        if (item.diseaseType === 'None' && temp.length > 0) return false;
        else if (arr.length === 0) return true;
        else return false;
      });
      this.diseaseSelectList.push(result.slice());
    }
    familyDiseaseList.push(this.initFamilyDiseaseList());
  }

  filterFamilyDiseaseList(
    disease: any,
    i: any,
    familyDiseaseForm?: AbstractControl<any, any>,
  ) {
    const previousValue = this.previousSelectedDiseaseList[i];
    if (disease.diseaseType === 'None') {
      this.removeFamilyDiseaseExecptNone();
    }
    if (familyDiseaseForm !== undefined && familyDiseaseForm !== null) {
      if (familyDiseaseForm && disease.diseaseType !== 'Other') {
        familyDiseaseForm.patchValue({
          otherDiseaseType: null,
          snomedCode: disease.snomedCode,
          snomedTerm: disease.snomedTerm,
        });
      } else {
        familyDiseaseForm.patchValue({ snomedCode: null, snomedTerm: null });
      }
    }

    if (previousValue) {
      this.diseaseSelectList.map((item: any, t: any) => {
        if (t !== i && previousValue.diseaseType !== 'Other') {
          item.push(previousValue);
          this.sortDiseaseList(item);
        }
      });
    }
    this.diseaseSelectList.map((item: any, t: any) => {
      const index = item.indexOf(disease);
      if (index !== -1 && t !== i && disease.diseaseType !== 'Other')
        item = item.splice(index, 1);
    });

    this.previousSelectedDiseaseList[i] = disease;

    //To disable the fields
    console.log('%%%%%%%%%%%%%%%%%%%%%%%%%%%%', disease);

    if (disease.diseaseType !== 'Nil' && disease.diseaseType !== 'None') {
      familyDiseaseForm?.get('familyMembers')?.enable();
      familyDiseaseForm?.get('familyMembers')?.reset();
    } else {
      familyDiseaseForm?.get('familyMembers')?.disable();
      familyDiseaseForm?.get('familyMembers')?.reset();
    }
  }

  removeFamilyDiseaseExecptNone() {
    const familyDiseaseList = <FormArray>(
      this.familyHistoryForm.controls['familyDiseaseList']
    );
    while (familyDiseaseList.length > 1) {
      const i = familyDiseaseList.length - 1;

      const removedValue = this.previousSelectedDiseaseList[i];
      if (removedValue) this.diseaseSelectList[0].push(removedValue);

      this.sortDiseaseList(this.diseaseSelectList[0]);
      familyDiseaseList.removeAt(i);
      this.previousSelectedDiseaseList.splice(i, 1);
      this.diseaseSelectList.splice(i, 1);
    }
  }

  removeFamilyDisease(i: any, familyHistoryForm?: AbstractControl<any, any>) {
    this.confirmationService
      .confirm(`warn`, this.currentLanguageSet.alerts.info.warn)
      .subscribe((result) => {
        if (result) {
          const familyDiseaseList = <FormArray>(
            this.familyHistoryForm.controls['familyDiseaseList']
          );
          this.familyHistoryForm.markAsDirty();
          if (!!familyHistoryForm && familyDiseaseList.length === 1) {
            familyHistoryForm.reset();
          } else {
            const removedValue = this.previousSelectedDiseaseList[i];
            this.diseaseSelectList.map((item: any, t: any) => {
              if (
                t !== i &&
                removedValue &&
                removedValue.diseaseType !== 'Other'
              ) {
                item.push(removedValue);
                this.sortDiseaseList(item);
              }
            });
            this.previousSelectedDiseaseList.splice(i, 1);
            this.diseaseSelectList.splice(i, 1);
            familyDiseaseList.removeAt(i);
          }
        }
      });
  }

  getPreviousFamilyHistory() {
    const benRegID: any = this.sessionstorage.getItem('beneficiaryRegID');
    this.nurseService
      .getPreviousFamilyHistory(benRegID, this.visitCategory)
      .subscribe(
        (res: any) => {
          if (res.statusCode === 200 && res.data !== null) {
            if (res.data.data.length > 0) {
              this.viewPreviousData(res.data);
            } else {
              this.confirmationService.alert(
                this.currentLanguageSet.historyData.ancHistory
                  .previousHistoryDetails.pastHistoryalert,
              );
            }
          } else {
            this.confirmationService.alert(
              this.currentLanguageSet.alerts.info.errorFetchingHistory,
              'error',
            );
          }
        },
        (err) => {
          this.confirmationService.alert(
            this.currentLanguageSet.alerts.info.errorFetchingHistory,
            'error',
          );
        },
      );
  }

  viewPreviousData(data: any) {
    this.dialog.open(PreviousDetailsComponent, {
      data: {
        dataList: data,
        title:
          this.currentLanguageSet.historyData.ancHistory
            .familyHistoryDataANC_OPD_NCD_PNC.previousFamilyHistory,
      },
    });
  }

  initFamilyDiseaseList() {
    return this.fb.group({
      diseaseTypeID: null,
      diseaseType: null,
      otherDiseaseType: null,
      familyMembers: { value: null, disabled: true },
      snomedCode: null,
      snomedTerm: null,
    });
  }

  get isGeneticDisorder() {
    return this.familyHistoryForm.controls['isGeneticDisorder'].value;
  }

  resetOtherGeneticOrder() {
    this.familyHistoryForm.patchValue({ geneticDisorder: null });
  }

  sortDiseaseList(diseaseList: any) {
    diseaseList.sort((a: any, b: any) => {
      if (a.diseaseType === b.diseaseType) return 0;
      if (a.diseaseType < b.diseaseType) return -1;
      else return 1;
    });
  }

  checkValidity(diseaseForm: any) {
    const temp = diseaseForm.value;
    if (temp.diseaseType && temp.familyMembers) {
      return false;
    } else {
      return true;
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

  trackFieldInteraction(fieldName: string) {
    try {
      this.trackingService.trackFieldInteraction(fieldName, 'Family History');
    } catch (error) {
      console.error(`❌ Error tracking family history ${fieldName}:`, error);
    }
  }
}
