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
  AbstractControl,
} from '@angular/forms';
import {
  MasterdataService,
  NurseService,
  DoctorService,
} from '../../../shared/services';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { MatDialog } from '@angular/material/dialog';
import { IdrsscoreService } from '../../../shared/services/idrsscore.service';
import { BeneficiaryDetailsService } from 'src/app/app-modules/core/services/beneficiary-details.service';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { PreviousDetailsComponent } from 'src/app/app-modules/core/components/previous-details/previous-details.component';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-family-history-ncdscreening',
  templateUrl: './family-history-ncdscreening.component.html',
  styleUrls: ['./family-history-ncdscreening.component.css'],
})
export class FamilyHistoryNcdscreeningComponent
  implements OnInit, DoCheck, OnDestroy
{
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
  familyMembersArray: any = [];
  IDRSScoreForFamilyMembes: any = 0;
  idrsscoredummy: any;
  diabetesMellitusSelected = false;
  beneficiaryDetailSubscription: any;
  age: any;
  currentLanguageSet: any;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private nurseService: NurseService,
    private doctorService: DoctorService,
    private confirmationService: ConfirmationService,
    private masterdataService: MasterdataService,
    private idrsscore: IdrsscoreService,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    private httpServices: HttpServiceService,
    readonly sessionstorage: SessionStorageService,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.idrsscore.clearMessage();
    this.idrsscore.IDRSFamilyScore$.subscribe(
      (response) => (this.idrsscoredummy = response),
    );
    this.getMasterData();
    this.getBeneficiaryDetails();
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
          this.familyMemeberMasterData = masterData.familyMemberTypes;

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
        this.filterFamilyDiseaseList(temp[i].diseaseType, i);
      }

      if (i + 1 < temp.length) this.addFamilyDisease();
    }
    let familyMemberList;
    temp.forEach((element: any) => {
      if (
        element.diseaseType !== undefined &&
        element.diseaseType.diseaseType !== undefined &&
        element.diseaseType.diseaseType === 'Diabetes Mellitus'
      ) {
        familyMemberList = element.familyMembers;
        this.patchFamilyMembersIDRSScore(familyMemberList);
      }
    });
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
          ) {
            return value.diseaseType.diseaseType === item.diseaseType;
          } else return false;
        });
        if (item.diseaseType === 'None' && temp.length > 0) return false;
        else if (arr.length === 0) return true;
        else return false;
      });
      this.diseaseSelectList.push(result.slice());
    }
    familyDiseaseList.push(this.initFamilyDiseaseList());
  }
  addFamilyDiseaseTest(index: any) {
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
          ) {
            return value.diseaseType.diseaseType === item.diseaseType;
          } else return false;
        });
        console.log('test', arr);

        if (item.diseaseType === 'None' && temp.length > 0) return false;
        else if (arr.length === 0) return true;
        else return false;
      });

      temp.forEach((element: any) => {
        if (element.deleted === true) {
          const lastIndex = result.length;
          const truediseaseType = element.diseaseType.diseaseType;
          let check = 0;
          temp.forEach((fValue: any) => {
            if (fValue.deleted === false) {
              if (
                element.diseaseType.diseaseType ===
                fValue.diseaseType.diseaseType
              ) {
                check++;
              }
            }
          });
          if (check === 0) {
            result.push(element.diseaseType);
          }
        }
      });

      const totalLength = this.diseaseSelectList.length + 1; //= 3
      this.diseaseSelectList.splice(totalLength, 0, result.slice());
      this.sortDiseaseList(this.diseaseSelectList[index + 1]);
    }
    familyDiseaseList.push(this.initFamilyDiseaseList());
  }

  filterFamilyDiseaseList(
    disease: any,
    i: any,
    familyDiseaseForm?: AbstractControl<any, any>,
  ) {
    const familyDiseaseList = <FormArray>(
      this.familyHistoryForm.controls['familyDiseaseList']
    );
    const tempArray = familyDiseaseList.value;
    const previousValue = this.previousSelectedDiseaseList[i];
    if (disease.diseaseType === 'None') {
      this.removeFamilyDiseaseExecptNone();
    }

    console.log('diseaseForm', familyDiseaseForm);

    let diabetesPresent = false;
    tempArray.forEach((element: any) => {
      if (element.diseaseType.diseaseType === 'Diabetes Mellitus') {
        diabetesPresent = true;
      }
    });
    if (!diabetesPresent) {
      this.idrsscore.setIDRSFamilyScore(0);
    }

    if (familyDiseaseForm) {
      if (disease.diseaseType !== 'Other') {
        if (disease.snomedCode !== null) {
          familyDiseaseForm.patchValue({
            otherDiseaseType: null,
            snomedCode: disease.snomedCode,
            snomedTerm: disease.snomedTerm,
          });
        } else {
          familyDiseaseForm.patchValue({ snomedCode: null, snomedTerm: null });
        }
      } else {
        familyDiseaseForm.patchValue({ snomedCode: null, snomedTerm: null });
      }

      familyDiseaseForm.patchValue({ familyMembers: null });
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
          const temp = familyDiseaseList.value;
          this.familyHistoryForm.markAsDirty();
          if (!!familyHistoryForm && familyDiseaseList.length === 1) {
            if (familyDiseaseList.value[i].ID !== null) {
              familyDiseaseList.value[i].deleted = true;
              const removedValue = this.previousSelectedDiseaseList[i];
              if (
                removedValue !== null &&
                removedValue.diseaseType === 'Diabetes Mellitus'
              ) {
                this.idrsscore.setIDRSFamilyScore(0);
              }
              familyDiseaseList.push(this.initFamilyDiseaseList());
              this.diseaseSelectList.push(this.diseaseMasterData);
            } else {
              familyHistoryForm.reset();
              familyHistoryForm.patchValue({ deleted: false });
              const removedValue = this.previousSelectedDiseaseList[i];
              if (
                removedValue !== null &&
                removedValue.diseaseType === 'Diabetes Mellitus'
              ) {
                this.idrsscore.setIDRSFamilyScore(0);
              }
            }
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
            if (
              removedValue !== null &&
              removedValue.diseaseType === 'Diabetes Mellitus'
            ) {
              this.idrsscore.setIDRSFamilyScore(0);
            }
            if (familyDiseaseList.value[i].ID !== null) {
              familyDiseaseList.value[i].deleted = true;
              this.diseaseSelectList[i] = [];
            } else {
              this.previousSelectedDiseaseList.splice(i, 1);
              this.diseaseSelectList.splice(i, 1);
              familyDiseaseList.removeAt(i);
            }
            const familyDiseaseList1 = <FormArray>(
              this.familyHistoryForm.controls['familyDiseaseList']
            );
            const temp1 = familyDiseaseList1.value;
            let lastIndex = 0;
            temp1.forEach((element: any) => {
              if (element.deleted === false) {
                lastIndex++;
              }
            });
            if (lastIndex === 0) {
              familyDiseaseList.push(this.initFamilyDiseaseList());

              this.diseaseSelectList.push(this.diseaseMasterData);
            }
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
                this.currentLanguageSet.alerts.info.pastHistoryNot,
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
          this.currentLanguageSet.historyData.familyhistory
            .previousfamilyhistory,
      },
    });
  }

  initFamilyDiseaseList() {
    return this.fb.group({
      ID: null,
      deleted: false,
      diseaseTypeID: null,
      diseaseType: null,
      otherDiseaseType: null,
      familyMembers: null,
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

  filterFamilyMembers(familyMembers: any, familyGroup: any) {
    this.familyMembersArray = familyMembers.value;
    const familyDiseaseType = familyGroup.value.diseaseType.diseaseType;
    console.log('there', familyGroup);

    let singleParent = false;
    let bothParent = false;
    let IDRSScoreForFamilyMembes = 0;
    if (familyDiseaseType && familyDiseaseType === 'Diabetes Mellitus') {
      if (this.familyMembersArray.length > 0) {
        this.familyMembersArray.forEach((element: any) => {
          console.log(element);
          if (element === 'Father') {
            if (singleParent) {
              bothParent = true;
            }
            singleParent = true;
          }
          if (element === 'Mother') {
            if (singleParent) {
              bothParent = true;
            }
            singleParent = true;
          }
        });
      }

      console.log('singleParent', singleParent);
      console.log('bothParent', bothParent);

      if (singleParent) {
        IDRSScoreForFamilyMembes = 10;
      }

      if (bothParent) {
        IDRSScoreForFamilyMembes = 20;
      }

      console.log('score', IDRSScoreForFamilyMembes);
      this.sessionstorage.setItem(
        'IdRSScoreFamilyHistory',
        IDRSScoreForFamilyMembes.toString(),
      );

      this.idrsscore.setIDRSFamilyScore(IDRSScoreForFamilyMembes);

      this.idrsscore.setIDRSScoreFlag();
    }

    console.log('family', familyMembers);
  }

  patchFamilyMembersIDRSScore(familyMembers: any) {
    this.familyMembersArray = familyMembers;
    let singleParent = false;
    let bothParent = false;
    let IDRSScoreForFamilyMembes = 0;

    if (this.familyMembersArray.length > 0) {
      this.familyMembersArray.forEach((element: any) => {
        console.log(element);
        if (element === 'Father') {
          if (singleParent) {
            bothParent = true;
          }
          singleParent = true;
        }
        if (element === 'Mother') {
          if (singleParent) {
            bothParent = true;
          }
          singleParent = true;
        }
      });
    }
    if (singleParent) {
      IDRSScoreForFamilyMembes = 10;
    }

    if (bothParent) {
      IDRSScoreForFamilyMembes = 20;
    }

    this.idrsscore.setIDRSFamilyScore(IDRSScoreForFamilyMembes);
    console.log('family', familyMembers);
  }
  getBeneficiaryDetails() {
    this.beneficiaryDetailSubscription =
      this.beneficiaryDetailsService.beneficiaryDetails$.subscribe(
        (beneficiary) => {
          console.log('idrs', beneficiary);
          if (beneficiary) {
            if (beneficiary.ageVal) {
              this.age = beneficiary.ageVal;
            } else {
              this.age = 0;
            }
          }
        },
      );
  }
  ngDoCheck() {
    this.assignSelectedLanguage();
  }

  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServices);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }
}
