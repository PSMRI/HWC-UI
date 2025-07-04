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
import { FormGroup } from '@angular/forms';
import { BeneficiaryDetailsService } from '../../../../core/services/beneficiary-details.service';
import {
  MasterdataService,
  NurseService,
  DoctorService,
} from '../../../shared/services';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { MatDialog } from '@angular/material/dialog';
import { PreviousDetailsComponent } from 'src/app/app-modules/core/components/previous-details/previous-details.component';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-general-feeding-history',
  templateUrl: './feeding-history.component.html',
  styleUrls: ['./feeding-history.component.css'],
})
export class FeedingHistoryComponent implements OnInit, DoCheck, OnDestroy {
  @Input()
  feedingHistoryForm!: FormGroup;

  @Input()
  visitCategory: any;

  @Input()
  mode!: string;

  masterData: any;
  age = 0;
  currentLanguageSet: any;
  foodIntoleranceTypes: any = [];
  enableOthersTextField = false;

  constructor(
    private masterdataService: MasterdataService,
    private nurseService: NurseService,
    private doctorService: DoctorService,
    public httpServiceService: HttpServiceService,
    private dialog: MatDialog,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    private confirmationService: ConfirmationService,
    readonly sessionstorage: SessionStorageService,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.getMasterData();
    this.getBeneficiaryDetails();
  }

  ngOnDestroy() {
    if (this.nurseMasterDataSubscription)
      this.nurseMasterDataSubscription.unsubscribe();

    if (this.beneficiaryDetailSubscription)
      this.beneficiaryDetailSubscription.unsubscribe();

    if (this.generalHistorySubscription)
      this.generalHistorySubscription.unsubscribe();
  }

  nurseMasterDataSubscription: any;
  getMasterData() {
    this.nurseMasterDataSubscription =
      this.masterdataService.nurseMasterData$.subscribe((masterData) => {
        if (masterData) {
          this.masterData = masterData;
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

  feedingHistoryData: any;
  generalHistorySubscription: any;
  getGeneralHistory() {
    this.generalHistorySubscription =
      this.doctorService.populateHistoryResponse$.subscribe((history) => {
        if (
          history !== null &&
          history.statusCode === 200 &&
          history.data !== null &&
          history.data.FeedingHistory
        ) {
          this.feedingHistoryData = history.data.FeedingHistory;
          if (this.feedingHistoryData) {
            this.masterFoodIntolerance();
            this.feedingHistoryForm.patchValue(this.feedingHistoryData);
            this.checkForOthersOption(
              this.feedingHistoryForm.controls['typeOfFoodIntolerances'].value,
            );
          }
        }
      });
  }

  beneficiaryDetailSubscription: any;
  getBeneficiaryDetails() {
    this.beneficiaryDetailSubscription =
      this.beneficiaryDetailsService.beneficiaryDetails$.subscribe(
        (beneficairy) => {
          if (
            beneficairy &&
            beneficairy.age !== undefined &&
            beneficairy.age !== null
          ) {
            const temp = beneficairy.age.split('-');
            if (temp[0].indexOf('years') >= 0) {
              const years = +temp[0]
                .substring(0, temp[0].indexOf('years'))
                .trim();
              const months = +temp[1]
                .substring(0, temp[1].indexOf('months'))
                .trim();
              this.age = years * 12 + months;
            } else if (temp[0].indexOf('months') >= 0) {
              const months = +temp[0]
                .substring(0, temp[0].indexOf('months'))
                .trim();
              this.age = months;
            }
          }
        },
      );
  }

  getPreviousFeedingHistory() {
    const benRegID: any = this.sessionstorage.getItem('beneficiaryRegID');
    this.nurseService
      .getPreviousFeedingHistory(benRegID, this.visitCategory)
      .subscribe(
        (data: any) => {
          if (data !== null && data.data !== null) {
            if (data.data.data.length > 0) {
              this.viewPreviousData(data.data);
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
          this.currentLanguageSet.historyData.Perinatalhistorydetails
            .previousFeedingHistoryDetails,
      },
    });
  }

  get compFeedStartAge() {
    return this.feedingHistoryForm.controls['compFeedStartAge'].value;
  }

  get foodIntoleranceStatus() {
    return this.feedingHistoryForm.controls['foodIntoleranceStatus'].value;
  }

  resetNoOfCompFeedPerDay() {
    this.feedingHistoryForm.patchValue({ noOfCompFeedPerDay: null });
  }

  resetTypeofFoodIntolerance() {
    this.feedingHistoryForm.patchValue({
      typeOfFoodIntolerances: null,
      otherFoodIntolerance: null,
    });
    this.enableOthersTextField = false;
    this.masterFoodIntolerance();
  }
  masterFoodIntolerance() {
    if (
      this.masterData !== undefined &&
      this.masterData.foodIntoleranceStatus !== undefined
    ) {
      this.foodIntoleranceTypes = this.masterData.foodIntoleranceStatus;
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
  checkForOthersOption(selectedFoodTntolerance: any) {
    if (
      selectedFoodTntolerance !== undefined &&
      selectedFoodTntolerance !== null &&
      selectedFoodTntolerance.includes('Others')
    ) {
      this.enableOthersTextField = true;
    } else {
      this.enableOthersTextField = false;
      this.feedingHistoryForm.patchValue({ otherFoodIntolerance: null });
    }
  }
}
