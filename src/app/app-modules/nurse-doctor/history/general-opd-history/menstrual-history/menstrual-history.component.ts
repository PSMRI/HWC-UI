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
import { FormBuilder, FormGroup } from '@angular/forms';
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
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from '@angular/material/core';
import {
  MomentDateAdapter,
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
} from '@angular/material-moment-adapter';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { AmritTrackingService } from 'Common-UI/src/tracking';

@Component({
  selector: 'app-general-menstrual-history',
  templateUrl: './menstrual-history.component.html',
  styleUrls: ['./menstrual-history.component.css'],
  providers: [
    {
      provide: MAT_DATE_LOCALE,
      useValue: 'en-US', // Set the desired locale (e.g., 'en-GB' for dd/MM/yyyy)
    },
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },
    {
      provide: MAT_DATE_FORMATS,
      useValue: {
        parse: {
          dateInput: 'LL',
        },
        display: {
          dateInput: 'DD/MM/YYYY', // Set the desired display format
          monthYearLabel: 'MMM YYYY',
          dateA11yLabel: 'LL',
          monthYearA11yLabel: 'MMMM YYYY',
        },
      },
    },
  ],
})
export class MenstrualHistoryComponent implements OnInit, DoCheck, OnDestroy {
  @Input()
  menstrualHistoryForm!: FormGroup;

  @Input()
  mode!: string;

  @Input()
  visitCategory: any;

  menstrualHistoryData: any;
  masterData: any;
  today: any;
  minimumLMPDate: any;
  currentLanguageSet: any;
  disableNoneMenstrualProblem = false;
  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private nurseService: NurseService,
    public httpServiceService: HttpServiceService,
    private doctorService: DoctorService,
    private confirmationService: ConfirmationService,
    private masterdataService: MasterdataService,
    readonly sessionstorage: SessionStorageService,
    private trackingService: AmritTrackingService,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.getMasterData();
    this.today = new Date();
    this.minimumLMPDate = new Date(
      this.today.getTime() - 365 * 24 * 60 * 60 * 1000,
    );
  }

  ngOnDestroy() {
    if (this.nurseMasterDataSubscription)
      this.nurseMasterDataSubscription.unsubscribe();

    if (this.generalHistorySubscription)
      this.generalHistorySubscription.unsubscribe();
  }

  nurseMasterDataSubscription: any;
  getMasterData() {
    this.nurseMasterDataSubscription =
      this.masterdataService.nurseMasterData$.subscribe((masterData) => {
        if (
          masterData &&
          masterData.menstrualCycleStatus &&
          masterData.menstrualCycleLengths &&
          masterData.menstrualCycleBloodFlowDuration &&
          masterData.menstrualProblem
        ) {
          this.masterData = masterData;
          this.checkVisitType();
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

  checkVisitType() {
    if (this.visitCategory === 'ANC') {
      let temp = 'Amenorrhea';
      temp = this.masterData.menstrualCycleStatus.filter((item: any) => {
        return item.name === temp;
      })[0];
      this.menstrualHistoryForm.patchValue({ menstrualCycleStatus: temp });
      this.menstrualHistoryForm.get('lMPDate')?.disable();
    } else {
      this.menstrualHistoryForm.get('lMPDate')?.enable();
    }
  }

  generalHistorySubscription: any;
  getGeneralHistory() {
    this.generalHistorySubscription =
      this.doctorService.populateHistoryResponse$.subscribe((history) => {
        if (
          history !== null &&
          history.statusCode === 200 &&
          history.data !== null &&
          history.data.MenstrualHistory
        ) {
          const temp = history.data.MenstrualHistory;

          temp.menstrualCycleStatus =
            this.masterData.menstrualCycleStatus.filter((item: any) => {
              return item.name === temp.menstrualCycleStatus;
            })[0];
          temp.cycleLength = this.masterData.menstrualCycleLengths.filter(
            (item: any) => {
              return item.menstrualCycleRange === temp.cycleLength;
            },
          )[0];
          temp.bloodFlowDuration =
            this.masterData.menstrualCycleBloodFlowDuration.filter(
              (item: any) => {
                return item.menstrualCycleRange === temp.bloodFlowDuration;
              },
            )[0];
          const tempMenstrualProblem: any = [];
          if (
            temp.menstrualProblemList &&
            temp.menstrualProblemList.length > 0
          ) {
            this.masterData.menstrualProblem.forEach(
              (menstrualProblem: any) => {
                temp.menstrualProblemList.forEach(
                  (menstrualProblemValue: any) => {
                    if (
                      menstrualProblem.problemName ===
                      menstrualProblemValue.problemName
                    ) {
                      tempMenstrualProblem.push(menstrualProblem);
                    }
                  },
                );
              },
            );
          }

          temp.menstrualProblemList = tempMenstrualProblem.slice();
          temp.lMPDate = new Date(temp.lMPDate);

          this.menstrualHistoryForm.patchValue(temp);

          this.resetOtherMenstrualProblems();
        }
      });
  }

  getPreviousMenstrualHistory() {
    const benRegID: any = this.sessionstorage.getItem('beneficiaryRegID');
    this.nurseService
      .getPreviousMenstrualHistory(benRegID, this.visitCategory)
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
          this.currentLanguageSet.historyData.Previousmenstrualhistory
            .previousmenstrualhistory,
      },
    });
  }

  get menstrualCycleStatus() {
    return this.menstrualHistoryForm.controls['menstrualCycleStatus'].value;
  }

  get lMPDate() {
    return this.menstrualHistoryForm.controls['lMPDate'].value;
  }
  checkMenstrualCycleStatus() {
    if (this.visitCategory === 'ANC') {
      this.menstrualHistoryForm.patchValue({
        menstrualCycleStatusID: null,
        regularity: null,
        cycleLength: null,
        menstrualCyclelengthID: null,
        menstrualFlowDurationID: null,
        bloodFlowDuration: null,
        menstrualProblemID: null,
        problemName: null,
      });
    } else {
      this.menstrualHistoryForm.patchValue({
        menstrualCycleStatusID: null,
        regularity: null,
        cycleLength: null,
        menstrualCyclelengthID: null,
        menstrualFlowDurationID: null,
        bloodFlowDuration: null,
        menstrualProblemID: null,
        problemName: null,
        lMPDate: null,
      });
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

  resetOtherMenstrualProblems() {
    const menstrualProblemList =
      this.menstrualHistoryForm.value.menstrualProblemList;
    let flag = false;
    if (menstrualProblemList.length <= 0) {
      flag = false;
    } else {
      menstrualProblemList.forEach((item: any) => {
        if (item.problemName === 'None') {
          flag = true;
        }
      });
    }

    this.disableNoneMenstrualProblem = flag;
  }

  trackFieldInteraction(fieldName: string) {
    try {
      this.trackingService.trackFieldInteraction(
        fieldName,
        'Menstrual History',
      );
    } catch (error) {
      console.error(`❌ Error tracking menstrual history ${fieldName}:`, error);
    }
  }
}
