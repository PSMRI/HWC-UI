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
import { FormGroup } from '@angular/forms';
import {
  MasterdataService,
  DoctorService,
  NurseService,
} from '../../shared/services';
import { DatePipe } from '@angular/common';
import { IdrsscoreService } from '../../shared/services/idrsscore.service';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { NcdScreeningService } from '../../shared/services/ncd-screening.service';
import { Subscription } from 'rxjs';
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

@Component({
  selector: 'app-general-refer',
  templateUrl: './general-refer.component.html',
  styleUrls: ['./general-refer.component.css'],
  providers: [
    {
      provide: DatePipe,
    },
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
export class GeneralReferComponent implements OnInit, DoCheck, OnDestroy {
  @Input()
  referForm!: FormGroup;

  @Input()
  referMode!: string;

  revisitDate: any;
  tomorrow: any;
  maxSchedulerDate: any;
  today: any;
  higherHealthcareCenter: any;
  additionalServices: any;
  beneficiaryRegID: any;
  visitID: any;
  visitCategory: any;
  date: any;
  previousServiceList: any;
  currentLanguageSet: any;
  referralReason: any;

  selectValue: any;
  selectValueService: any;
  showMsg: any = 0;
  healthCareReferred = false;
  referralReferred = false;
  instituteFlag = false;
  referralSuggested: any = 0;
  referredVisitcode: any;
  designation: any;
  fpReferral: any = [];
  enableOthersReferralTextField = false;
  enableOtherHigherInstitute = false;
  enableCBACForm = false;

  constructor(
    private doctorService: DoctorService,
    public httpServiceService: HttpServiceService,
    public datepipe: DatePipe,
    private masterdataService: MasterdataService,
    private idrsScoreService: IdrsscoreService,
    private nurseService: NurseService,
    private dialog: MatDialog,
    private confirmationService: ConfirmationService,
    private ncdScreeningService: NcdScreeningService,
    readonly sessionstorage: SessionStorageService,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.visitCategory = this.sessionstorage.getItem('visitCategory');
    if (this.sessionstorage.getItem('referredVisitCode')) {
      this.referredVisitcode = this.sessionstorage.getItem('referredVisitCode');
    } else {
      this.referredVisitcode = 'undefined';
    }
    this.getDoctorMasterData();
    this.idrsScoreService.clearSuspectedArrayFlag();
    this.idrsScoreService.clearReferralSuggested();

    this.idrsScoreService.IDRSSuspectedFlag$.subscribe((response) => {
      this.showMsg = response;
      if (this.showMsg > 0) sessionStorage.setItem('suspectFlag', 'true');
      else sessionStorage.setItem('suspectFlag', 'false');
    });
    this.idrsScoreService.referralSuggestedFlag$.subscribe((response) => {
      this.showMsg = response;
      if (this.showMsg > 0) sessionStorage.setItem('suspectFlag', 'true');
      else sessionStorage.setItem('suspectFlag', 'false');
    });
    this.today = new Date();
    const d = new Date();
    const checkdate = new Date();
    d.setDate(d.getDate() + 1);
    checkdate.setMonth(this.today.getMonth() + 3);
    this.maxSchedulerDate = checkdate;
    this.tomorrow = d;
    this.designation = this.sessionstorage.getItem('designation');
  }

  ngOnDestroy() {
    if (this.doctorMasterDataSubscription)
      this.doctorMasterDataSubscription.unsubscribe();
    if (this.referSubscription) this.referSubscription.unsubscribe();
  }

  doctorMasterDataSubscription: any;
  getDoctorMasterData() {
    this.doctorMasterDataSubscription =
      this.masterdataService.doctorMasterData$.subscribe((masterData) => {
        if (masterData) {
          console.log('masterData=', masterData);
          this.higherHealthcareCenter = masterData.higherHealthCare;
          if (this.higherHealthcareCenter?.length === 0) {
            this.instituteFlag = false;
            sessionStorage.setItem('instFlag', 'false');
          } else {
            this.instituteFlag = true;
            sessionStorage.setItem('instFlag', 'true');
          }
          this.additionalServices = masterData.additionalServices;
          console.log(masterData.revisitDate);
          console.log('hi');
          this.revisitDate = masterData.revisitDate;

          this.fpReferral = masterData.referralReasonList;

          if (this.visitCategory.toLowerCase() === 'ncd screening') {
            this.ncdScreeningService.enablingIdrs$.subscribe((response) => {
              if (response === true) {
                this.enableCBACForm = false;
              } else {
                this.enableCBACForm = true;
              }
            });

            if (this.enableCBACForm === false) {
              this.fpReferral = masterData.referralReasonList;
              if (
                masterData.referralReasonList !== undefined &&
                masterData.referralReasonList !== null
              ) {
                this.fpReferral = masterData.referralReasonList.filter(
                  (item: any) => {
                    if (
                      item.name.toLowerCase() ===
                      'screening positive for diabetes'
                    ) {
                      this.fpReferral.push(item);
                      return item.name;
                    }
                    if (
                      item.name.toLowerCase() ===
                      'screening positive for epilepsy'
                    ) {
                      this.fpReferral.push(item);
                      return item.name;
                    }
                    if (
                      item.name.toLowerCase() ===
                      'screening positive for asthma'
                    ) {
                      this.fpReferral.push(item);
                      return item.name;
                    }
                    if (
                      item.name.toLowerCase() ===
                      'screening positive for vision screening'
                    ) {
                      this.fpReferral.push(item);
                      return item.name;
                    }
                    if (
                      item.name.toLowerCase() ===
                      'screening positive for tuberculosis screening'
                    ) {
                      this.fpReferral.push(item);
                      return item.name;
                    }
                    if (
                      item.name.toLowerCase() ===
                      'screening positive for malaria screening'
                    ) {
                      this.fpReferral.push(item);
                      return item.name;
                    }
                    if (
                      item.name.toLowerCase() ===
                      'screening positive for hypertension'
                    ) {
                      this.fpReferral.push(item);
                      return item.name;
                    }
                  },
                );
              }
            } else {
              console.log(
                'Unable to fetch the master data for referral reason list',
              );
            }

            if (this.enableCBACForm === true) {
              this.fpReferral = masterData.referralReasonList;
              if (this.sessionstorage.getItem('beneficiaryGender') === 'Male') {
                if (
                  masterData.referralReasonList !== undefined &&
                  masterData.referralReasonList !== null
                ) {
                  this.fpReferral = masterData.referralReasonList.filter(
                    (item: any) => {
                      if (
                        item.name.toLowerCase() ===
                        'screening positive for hypertension'
                      ) {
                        this.fpReferral.push(item);
                        return item.name;
                      }
                      if (
                        item.name.toLowerCase() ===
                        'screening positive for diabetes'
                      ) {
                        this.fpReferral.push(item);
                        return item.name;
                      }
                      if (
                        item.name.toLowerCase() ===
                        'screening positive for oral cancer'
                      ) {
                        this.fpReferral.push(item);
                        return item.name;
                      }
                    },
                  );
                }
              } else {
                if (
                  masterData.referralReasonList !== undefined &&
                  masterData.referralReasonList !== null
                ) {
                  this.fpReferral = masterData.referralReasonList.filter(
                    (item: any) => {
                      if (
                        item.name.toLowerCase() ===
                        'screening positive for hypertension'
                      ) {
                        this.fpReferral.push(item);
                        return item.name;
                      }
                      if (
                        item.name.toLowerCase() ===
                        'screening positive for diabetes'
                      ) {
                        this.fpReferral.push(item);
                        return item.name;
                      }
                      if (
                        item.name.toLowerCase() ===
                        'screening positive for oral cancer'
                      ) {
                        this.fpReferral.push(item);
                        return item.name;
                      }
                      if (
                        item.name.toLowerCase() ===
                        'screening positive for cervical cancer'
                      ) {
                        this.fpReferral.push(item);
                        return item.name;
                      }
                      if (
                        item.name.toLowerCase() ===
                        'screening positive for breast cancer'
                      ) {
                        this.fpReferral.push(item);
                        return item.name;
                      }
                    },
                  );
                }
                console.log(
                  'Unable to fetch the master data for referral reason list',
                );
              }
            }
          }

          if (String(this.referMode) === 'view') {
            this.beneficiaryRegID =
              this.sessionstorage.getItem('beneficiaryRegID');
            this.visitID = this.sessionstorage.getItem('visitID');
            this.visitCategory = this.sessionstorage.getItem('visitCategory');
            this.getReferDetails();
          }
        }
      });
  }

  referSubscription!: Subscription;
  getReferDetails() {
    this.referSubscription =
      this.doctorService.populateCaserecordResponse$.subscribe((res) => {
        if (res && res.statusCode === 200 && res.data && res.data.Refer) {
          const referAndRevistData = res.data.Refer;
          if (referAndRevistData && referAndRevistData.referredToInstituteID) {
            const referedToInstitute = this.higherHealthcareCenter.filter(
              (item: any) => {
                return (
                  item.institutionID ===
                  referAndRevistData.referredToInstituteID
                );
              },
            );
            if (referedToInstitute.length > 0) {
              referAndRevistData.referredToInstituteName =
                referedToInstitute[0];
            }
            this.higherhealthcarecenter(
              referAndRevistData.referredToInstituteName,
            );
          }
          if (
            referAndRevistData.referralReasonList !== undefined &&
            referAndRevistData.referralReasonList !== null
          ) {
            this.referForm.patchValue({
              referralReasonList: referAndRevistData.referralReasonList,
            });
            this.checkForOthersOption(
              this.referForm.controls['referralReasonList'].value,
            );
            this.referForm.controls['otherReferralReason'].setValue(
              referAndRevistData.otherReferralReason,
            );
          }
          const referRevisitDetails = Object.assign({}, referAndRevistData, {
            revisitDate: new Date(referAndRevistData.revisitDate),
          });
          this.referForm.patchValue(referRevisitDetails);
        }
      });
  }

  get RevisitDate() {
    return this.referForm.get('revisitDate');
  }
  get ReferralReason() {
    return this.referForm.get('referralReason');
  }
  checkdate(revisitDate: Date) {
    this.today = new Date();
    const d = new Date();
    const checkdate = new Date();
    d.setDate(d.getDate() + 1);
    checkdate.setMonth(this.today.getMonth() + 3);
    this.maxSchedulerDate = checkdate;
    this.tomorrow = d;

    const localDate = new Date(
      revisitDate.getTime() - revisitDate.getTimezoneOffset() * 60000,
    );

    this.referForm.patchValue({ revisitDate: localDate.toISOString() });
    console.log('revisitDate', revisitDate);
  }

  canDisable(service: any) {
    if (this.previousServiceList) {
      const temp = this.previousServiceList.filter((item: any) => {
        return item.serviceID === service.serviceID;
      });

      if (temp.length > 0) service.disabled = true;
      else service.disabled = false;

      return temp.length > 0;
    }
  }

  public additionalservices(selected: any): void {
    if (selected !== null && selected.length >= 0) {
      this.selectValueService = selected.length;
      console.log(this.selectValue);
    }
  }

  public higherhealthcarecenter(selected: any): void {
    if (selected?.institutionName) {
      this.selectValue = 1;
      this.healthCareReferred = true;
    }

    if (
      selected !== null &&
      selected.institutionName !== undefined &&
      selected.institutionName !== null &&
      selected.institutionName.toLowerCase() === 'other'
    ) {
      this.enableOtherHigherInstitute = true;
    } else if (selected === null || selected === 'select none') {
      this.selectValue = 0;
      this.enableOtherHigherInstitute = false;
      this.referForm.controls['otherReferredToInstituteName'].setValue(null);
      this.healthCareReferred = false;
    } else {
      this.enableOtherHigherInstitute = false;
      this.referForm.controls['otherReferredToInstituteName'].setValue(null);
    }

    console.log(this.selectValue);
  }

  setInstituteNameValue() {
    this.referForm.controls['referredToInstituteID'].setValue(null);
    this.referForm.controls['referredToInstituteName'].setValue(null);
  }

  getPreviousReferralHistory() {
    const benRegID: any = this.sessionstorage.getItem('beneficiaryRegID');
    this.nurseService
      .getPreviousReferredHistory(benRegID, this.visitCategory)
      .subscribe(
        (res: any) => {
          if (res.statusCode === 200 && res.data !== null) {
            if (res.data.data.length > 0) {
              this.viewPreviousData(res.data);
            } else {
              this.confirmationService.alert(
                this.currentLanguageSet.Referdetails
                  .previousReferralhistorynotAvailable,
              );
            }
          } else {
            this.confirmationService.alert(
              this.currentLanguageSet.Referdetails
                .errorInFetchingPreviousHistory,
              'error',
            );
          }
        },
        (err) => {
          this.confirmationService.alert(
            this.currentLanguageSet.Referdetails.errorInFetchingPreviousHistory,
            'error',
          );
        },
      );
  }

  viewPreviousData(data: any) {
    this.dialog.open(PreviousDetailsComponent, {
      data: {
        dataList: data,
        title: this.currentLanguageSet.previousReferralHistoryDetails,
      },
    });
  }

  loadMMUReferDeatils() {
    const reqObj = {
      benRegID:
        this.sessionstorage.getItem('beneficiaryRegID') &&
        this.sessionstorage.getItem('beneficiaryRegID') !== ''
          ? this.sessionstorage.getItem('beneficiaryRegID')
          : null,
      visitCode:
        this.sessionstorage.getItem('referredVisitCode') &&
        this.sessionstorage.getItem('referredVisitCode') !== ''
          ? this.sessionstorage.getItem('referredVisitCode')
          : null,
      benVisitID:
        this.sessionstorage.getItem('referredVisitID') &&
        this.sessionstorage.getItem('referredVisitID') !== ''
          ? this.sessionstorage.getItem('referredVisitID')
          : null,
      fetchMMUDataFor: 'Referral',
    };
    if (
      this.sessionstorage.getItem('referredVisitCode') !== 'undefined' &&
      this.sessionstorage.getItem('referredVisitID') !== 'undefined'
    ) {
      this.doctorService.getMMUData(reqObj).subscribe(
        (res: any) => {
          if (res.statusCode === 200 && res.data !== null) {
            if (res.data.data.refrredToAdditionalServiceList.length > 0) {
              this.viewMMUReferData(res.data);
            } else {
              this.confirmationService.alert(
                this.currentLanguageSet.Referdetails
                  .mMUReferraldetailsnotAvailable,
              );
            }
          } else {
            this.confirmationService.alert(
              this.currentLanguageSet.Referdetails
                .errorInFetchingMMUReferraldetails,
              'error',
            );
          }
        },
        (err) => {
          this.confirmationService.alert(
            this.currentLanguageSet.Referdetails
              .errorInFetchingMMUReferraldetails,
            'error',
          );
        },
      );
    }
  }

  viewMMUReferData(data: any) {
    this.dialog.open(PreviousDetailsComponent, {
      data: {
        dataList: data,
        title: this.currentLanguageSet.Referdetails.mMUReferralDetails,
      },
    });
  }
  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  checkForOthersOption(selectedReferral: any) {
    if (selectedReferral.length > 0) {
      if (selectedReferral.includes('Other')) {
        this.enableOthersReferralTextField = true;
      } else {
        this.enableOthersReferralTextField = false;
        this.referForm.controls['otherReferralReason'].setValue(null);
      }
    } else {
      this.enableOthersReferralTextField = false;
      this.referForm.controls['otherReferralReason'].setValue(null);
    }
  }
}
