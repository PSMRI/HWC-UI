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
  SimpleChanges,
  DoCheck,
  OnChanges,
  OnDestroy,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  AbstractControl,
} from '@angular/forms';
import {
  MasterdataService,
  NurseService,
  DoctorService,
} from '../../../shared/services';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { GeneralUtils } from '../../../shared/utility';
import { MatDialog } from '@angular/material/dialog';
import { HrpService } from '../../../shared/services/hrp.service';
import { BeneficiaryDetailsService } from 'src/app/app-modules/core/services';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { PreviousDetailsComponent } from 'src/app/app-modules/core/components/previous-details/previous-details.component';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { AmritTrackingService } from 'Common-UI/src/tracking';

@Component({
  selector: 'app-general-past-obsteric-history',
  templateUrl: './past-obsteric-history.component.html',
  styleUrls: ['./past-obsteric-history.component.css'],
})
export class PastObstericHistoryComponent
  implements OnChanges, OnInit, DoCheck, OnDestroy
{
  @Input()
  pastObstericHistoryForm!: FormGroup;

  @Input()
  mode!: string;

  @Input()
  visitCategory: any;

  masterData: any;
  formUtility: any;
  pastObstericHistoryData: any;

  complicationOptionConstraints: any = [];
  currentLanguageSet: any;
  pastObstetricValues: any = [];
  setHrpStatusData: any;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private nurseService: NurseService,
    private doctorService: DoctorService,
    private hrpService: HrpService,
    public httpServiceService: HttpServiceService,
    private confirmationService: ConfirmationService,
    private masterdataService: MasterdataService,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    readonly sessionstorage: SessionStorageService,
    private trackingService: AmritTrackingService,
  ) {
    this.formUtility = new GeneralUtils(this.fb, this.sessionstorage);
  }

  ngOnInit() {
    this.assignSelectedLanguage();
    this.hrpService.setPastObstetric(this.pastObstetricValues);
    this.subscribeTotalNoofPregChanges();
    this.getMasterData();
  }

  ngOnChanges(simpleChanges: SimpleChanges) {
    if (simpleChanges['pastObstericHistoryForm']) {
      for (
        let i = 0;
        i <
        (<FormArray>(
          this.pastObstericHistoryForm.controls['pastObstericHistoryList']
        )).length;
        i++
      ) {
        this.complicationOptionConstraints.push({
          showOtherPregnancyComplication: false,
          disableNonePregnancyComplication: false,
          showAllPregComplication: true,

          showOtherDeliveryComplication: false,
          disableNoneDeliveryComplication: false,
          showAllDeliveryComplication: true,

          showOtherPostpartumComplication: false,
          disableNonePostpartumComplication: false,
          showAllPostpartumComplication: true,

          showOtherPostComplication: false,
          disableNonePostComplication: false,
          showAllPostComplication: true,
        });
      }
    }
  }

  ngOnDestroy() {
    if (this.nurseMasterDataSubscription)
      this.nurseMasterDataSubscription.unsubscribe();

    if (this.totalNoofPregChangeSubs)
      this.totalNoofPregChangeSubs.unsubscribe();

    if (this.generalHistorySubscription)
      this.generalHistorySubscription.unsubscribe();

    const temp = this.pastObstericHistoryForm.controls[
      'pastObstericHistoryList'
    ] as FormArray;
    this.clearFormArray(temp);

    const temp1 = this.pastObstericHistoryForm.controls[
      'complicationPregList'
    ] as FormArray;
    this.clearFormArray(temp1);

    if (this.sessionstorage.getItem('serviceLineDetails')) {
      const serviceLineDetails: any =
        this.sessionstorage.getItem('serviceLineDetails');
      const vanID = JSON.parse(serviceLineDetails).vanID;
      const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;

      this.pastObstericHistoryForm.reset({
        vanID,
        parkingPlaceID,
      });
    }
  }

  clearFormArray(formArray: any) {
    while (formArray.length !== 0) {
      formArray.removeAt(0);
    }
  }

  selectDeliveryTypes: any;
  nurseMasterDataSubscription: any;
  getMasterData() {
    this.nurseMasterDataSubscription =
      this.masterdataService.nurseMasterData$.subscribe((masterData) => {
        if (masterData) {
          this.masterData = masterData;
          this.selectDeliveryTypes = this.masterData.deliveryTypes;

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
          history.data.FemaleObstetricHistory
        ) {
          this.pastObstericHistoryData = history.data.FemaleObstetricHistory;
          this.handlePastObstetricHistoryData();
        }
      });
  }

  getComplicationPregList(): AbstractControl[] | null {
    const complicationPregListControl = this.pastObstericHistoryForm.get(
      'complicationPregList',
    );
    return complicationPregListControl instanceof FormArray
      ? complicationPregListControl.controls
      : null;
  }

  getPastObstericHistoryList(): AbstractControl[] | null {
    const pastObstericHistoryListControl = this.pastObstericHistoryForm.get(
      'pastObstericHistoryList',
    );
    return pastObstericHistoryListControl instanceof FormArray
      ? pastObstericHistoryListControl.controls
      : null;
  }

  handlePastObstetricHistoryData() {
    if (this.pastObstericHistoryData.totalNoOfPreg)
      this.pastObstericHistoryForm.patchValue({
        totalNoOfPreg: this.pastObstericHistoryData.totalNoOfPreg,
      });

    const formArray = this.pastObstericHistoryForm.controls[
      'pastObstericHistoryList'
    ] as FormArray;
    const complicationPregList: any = <FormArray>(
      this.pastObstericHistoryForm.controls['complicationPregList']
    );

    const temp = JSON.parse(
      JSON.stringify(this.pastObstericHistoryData.femaleObstetricHistoryList),
    );

    for (let i = 0; i < temp.length; i++) {
      if (temp[i].pregOrder) {
        this.togglePastObstericHistory({ checked: true }, i + 1);

        const temp1: any = [];
        this.masterData.pregComplicationTypes.forEach((item: any) => {
          temp[i].pregComplicationList.forEach((p: any) => {
            if (p.pregComplicationType === item.pregComplicationType) {
              temp1.push(item);
            }
          });
        });

        temp[i].pregComplicationList = temp1.slice();

        temp[i].durationType = this.masterData.pregDuration.filter(
          (item: any) => {
            return temp[i].durationType === item.durationType;
          },
        )[0];

        temp[i].deliveryType = this.masterData.deliveryTypes.filter(
          (item: any) => {
            return temp[i].deliveryType === item.deliveryType;
          },
        )[0];

        temp[i].deliveryPlace = this.masterData.deliveryPlaces.filter(
          (item: any) => {
            return temp[i].deliveryPlace === item.deliveryPlace;
          },
        )[0];

        const temp2: any = [];
        this.masterData.deliveryComplicationTypes.forEach((item: any) => {
          temp[i].deliveryComplicationList.forEach((p: any) => {
            if (p.deliveryComplicationType === item.deliveryComplicationType) {
              temp2.push(item);
            }
          });
        });

        temp[i].deliveryComplicationList = temp2.slice();

        const temp3: any = [];
        this.masterData.postpartumComplicationTypes.forEach((item: any) => {
          temp[i].postpartumComplicationList.forEach((p: any) => {
            if (
              p.postpartumComplicationType === item.postpartumComplicationType
            ) {
              temp3.push(item);
            }
          });
        });

        temp[i].postpartumComplicationList = temp3.slice();

        temp[i].pregOutcome = this.masterData.pregOutcomes.filter(
          (item: any) => {
            return temp[i].pregOutcome === item.pregOutcome;
          },
        )[0];

        temp[i].newBornComplication =
          this.masterData.newBornComplications.filter((item: any) => {
            return temp[i].newBornComplication === item.complicationValue;
          })[0];

        if (
          temp[i].pregOutcome &&
          temp[i].pregOutcome.pregOutcome === 'Abortion'
        ) {
          temp[i].abortionType = this.masterData.typeOfAbortion.filter(
            (item: any) => {
              return temp[i].typeOfAbortionValue === item.complicationValue;
            },
          )[0];

          temp[i].typeofFacility = this.masterData.serviceFacilities.filter(
            (item: any) => {
              return temp[i].serviceFacilityValue === item.facilityName;
            },
          )[0];
          if (temp[i].postAbortionComplication) {
            const temp4: any = [];
            this.masterData.postAbortionComplications.forEach((item: any) => {
              temp[i].postAbortionComplication.forEach((p: any) => {
                if (p.complicationValue === item.complicationValue) {
                  temp4.push(item);
                }
              });
            });

            temp[i].postAbortionComplication = temp4.slice();
          }
        }

        const k = formArray.get('' + i) as FormGroup;
        k.patchValue(temp[i]);

        this.resetOtherDeliveryComplication(k, i, this.setHrpStatusData);
        this.resetOtherPregnancyComplication(k, i, this.setHrpStatusData);
        this.resetOtherPostpartumComplicationType(k, i);
        if (
          temp[i].pregOutcome &&
          temp[i].pregOutcome.pregOutcome === 'Abortion'
        )
          this.resetPostComplicationType(k, i);

        if (complicationPregList.get('' + (temp[i].pregOrder - 1)))
          complicationPregList
            .get('' + (temp[i].pregOrder - 1))
            .patchValue({ value: true });
      }
    }
  }
  togglePastObstericHistory(event: any, i: any) {
    const pastObstericHistoryList = <FormArray>(
      this.pastObstericHistoryForm.controls['pastObstericHistoryList']
    );

    if (event.checked) {
      pastObstericHistoryList.push(this.formUtility.initPastObstericHistory(i));
      this.complicationOptionConstraints.push({
        showOtherPregnancyComplication: false,
        disableNonePregnancyComplication: false,
        showAllPregComplication: true,

        showOtherDeliveryComplication: false,
        disableNoneDeliveryComplication: false,
        showAllDeliveryComplication: true,

        showOtherPostComplication: false,
        disableNonePostComplication: false,
        showAllPostComplication: true,

        showOtherPostpartumComplication: false,
        disableNonePostpartumComplication: false,
        showAllPostpartumComplication: true,
      });
    } else {
      const index = this.findPastObstericHistory(i);
      if (index > -1) {
        this.removePastObstericHistory(index, event, i);
        if (
          this.pastObstericHistoryData &&
          this.pastObstericHistoryData.femaleObstetricHistoryList
        )
          this.pastObstericHistoryData.femaleObstetricHistoryList.splice(
            index,
            1,
          );
      }
    }
  }

  findPastObstericHistory(i: any) {
    const pastObstericHistoryList = <FormArray>(
      this.pastObstericHistoryForm.controls['pastObstericHistoryList']
    );
    let temp = -1;
    pastObstericHistoryList.value.map((item: any, index: any) => {
      if (item.pregOrder === i) {
        temp = index;
      }
    });
    return temp;
  }

  removePastObstericHistory(i: any, event?: any, index?: any) {
    this.confirmationService
      .confirm(`warn`, this.currentLanguageSet.alerts.info.warn)
      .subscribe((result) => {
        if (result) {
          const pastObstericHistoryList = <FormArray>(
            this.pastObstericHistoryForm.controls['pastObstericHistoryList']
          );
          this.pastObstericHistoryForm.markAsDirty();
          pastObstericHistoryList.removeAt(i);
        } else {
          const complicationPregList = <FormArray>(
            this.pastObstericHistoryForm.controls['complicationPregList']
          );
          complicationPregList.at(index - 1).patchValue({ value: true });
        }
        this.complicationOptionConstraints.splice(index, 1);
      });
  }

  getPreviousObstetricHistory() {
    const benRegID: any = this.sessionstorage.getItem('beneficiaryRegID');
    this.nurseService
      .getPreviousObstetricHistory(benRegID, this.visitCategory)
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
          this.currentLanguageSet.historyData.obstetrichistory
            .previousobstetrichistory,
      },
    });
  }

  createPregnancyWithComplList(number: any) {
    const complicationPregList = <FormArray>(
      this.pastObstericHistoryForm.controls['complicationPregList']
    );

    if (complicationPregList.length < number) {
      for (let i = complicationPregList.length; i < number; i++)
        complicationPregList.push(this.fb.group({ value: null }));
    } else {
      for (let i = complicationPregList.length - 1; i >= number; i--) {
        complicationPregList.removeAt(i);
        this.togglePastObstericHistory({ checked: false }, i + 1);
      }
    }
  }

  totalNoofPregChangeSubs: any;
  subscribeTotalNoofPregChanges() {
    this.totalNoofPregChangeSubs = this.pastObstericHistoryForm.controls[
      'totalNoOfPreg'
    ].valueChanges.subscribe((value) => {
      console.log('%c status', 'color:green', value);

      if (value) {
        if (this.visitCategory === 'ANC') {
          this.createPregnancyWithComplList(value - 1);
        } else {
          this.createPregnancyWithComplList(value);
        }
      }
    });
  }

  get totalNoOfPreg() {
    return this.pastObstericHistoryForm.controls['totalNoOfPreg'].value;
  }

  hrpPastObstetricDetails(setHrpStatus: any) {
    console.log(
      'pastObsteriCHistoryForm',
      this.pastObstericHistoryForm.controls['pastObstericHistoryList'],
    );
    const pregList = <FormArray>(
      this.pastObstericHistoryForm.controls['pastObstericHistoryList']
    );
    const ar = [];
    for (let a = 0; a < pregList.length; a++) {
      const pregGroup = <FormGroup>pregList.controls[a];
      console.log('pregGroup', pregGroup);
      if (pregGroup !== null && pregGroup !== undefined) {
        const obj = {
          complicationDuringPregnancy:
            pregGroup.controls['pregComplicationList'].value,
          durationOfPregnancy: pregGroup.controls['durationType'].value,
          typeOfDelivery: pregGroup.controls['deliveryType'].value,
          deliveryComplication:
            pregGroup.controls['deliveryComplicationList'].value,
          congenitalAnomalies: pregGroup.controls['congenitalAnomalies'].value,
        };
        ar.push(obj);
        console.log('HRPObj', obj);
      }
    }
    this.hrpService.setPastObstetric(ar);
    this.hrpService.checkHrpStatus = setHrpStatus;
  }

  setCongenitalAnomalies() {
    this.pastObstericHistoryForm.controls['congenitalAnomalies'];
    this.hrpPastObstetricDetails(true);
  }

  checkTotalPregnancy(totalNoOfPreg: any) {
    if (
      totalNoOfPreg === 0 &&
      (this.visitCategory === 'ANC' || this.visitCategory === 'PNC')
    ) {
      this.confirmationService.alert(
        this.currentLanguageSet.totalNumberOfPastPregnancyFor + ' ',
        this.visitCategory,
        ' ' + this.currentLanguageSet.cannotBeZero,
      );
    }
  }

  resetOtherPregnancyComplication(
    pastObstericHistoryForm: AbstractControl<any, any>,
    index: any,
    setHrpStatus: any,
  ) {
    const pregComplicationList =
      pastObstericHistoryForm.value.pregComplicationList;
    let flag = false;
    pregComplicationList.forEach((item: any) => {
      if (item.pregComplicationType === 'Other') {
        flag = true;
      }
    });

    this.complicationOptionConstraints[index].showOtherPregnancyComplication =
      flag;

    if (pregComplicationList.length > 1) {
      this.complicationOptionConstraints[
        index
      ].disableNonePregnancyComplication = true;
      this.complicationOptionConstraints[index].showAllPregComplication = false;
    } else if (pregComplicationList.length === 1) {
      const t =
        pregComplicationList[0].pregComplicationType === 'None' ? false : true;
      this.complicationOptionConstraints[
        index
      ].disableNonePregnancyComplication = t;
      this.complicationOptionConstraints[index].showAllPregComplication = false;
    } else {
      this.complicationOptionConstraints[
        index
      ].disableNonePregnancyComplication = false;
      this.complicationOptionConstraints[index].showAllPregComplication = true;
    }

    if (!flag)
      pastObstericHistoryForm.patchValue({ otherPregComplication: null });
    this.hrpPastObstetricDetails(setHrpStatus);
  }

  resetOtherDeliveryPlace(pastObstericHistoryForm: any) {
    const deliveryList = this.masterData.deliveryTypes;
    if (
      pastObstericHistoryForm.value.deliveryPlace.deliveryPlace ===
        'Home-Supervised' ||
      pastObstericHistoryForm.value.deliveryPlace.deliveryPlace ===
        'Home-Unsupervised'
    ) {
      const tempDeliveryTypes = this.masterData.deliveryTypes.filter(
        (item: any) => {
          return item.deliveryType === 'Normal Delivery';
        },
      );
      this.selectDeliveryTypes = tempDeliveryTypes;
    } else if (
      pastObstericHistoryForm.value.deliveryPlace.deliveryPlace ===
        'Subcentre' ||
      pastObstericHistoryForm.value.deliveryPlace.deliveryPlace === 'PHC'
    ) {
      const deliveryType = deliveryList.filter((item: any) => {
        return item.deliveryType !== 'Cesarean Section (LSCS)';
      });
      this.selectDeliveryTypes = deliveryType;
    } else {
      this.selectDeliveryTypes = this.masterData.deliveryTypes;
    }
    if (pastObstericHistoryForm.value.deliveryPlace.deliveryPlace === 'Other')
      pastObstericHistoryForm.patchValue({ otherDeliveryPlace: null });
  }

  showOtherDeliveryComplication = false;
  resetOtherDeliveryComplication(
    pastObstericHistoryForm: any,
    index: any,
    setHrpStatus: any,
  ) {
    const deliveryComplicationList =
      pastObstericHistoryForm.value.deliveryComplicationList;
    let flag = false;

    deliveryComplicationList.forEach((item: any) => {
      if (item.deliveryComplicationType === 'Other') {
        flag = true;
      }
    });

    this.complicationOptionConstraints[index].showOtherDeliveryComplication =
      flag;

    if (deliveryComplicationList.length > 1) {
      this.complicationOptionConstraints[
        index
      ].disableNoneDeliveryComplication = true;
      this.complicationOptionConstraints[index].showAllDeliveryComplication =
        false;
    } else if (deliveryComplicationList.length === 1) {
      const t =
        deliveryComplicationList[0].deliveryComplicationType === 'None'
          ? false
          : true;
      this.complicationOptionConstraints[
        index
      ].disableNoneDeliveryComplication = t;
      this.complicationOptionConstraints[index].showAllDeliveryComplication =
        false;
    } else {
      this.complicationOptionConstraints[
        index
      ].disableNoneDeliveryComplication = false;
      this.complicationOptionConstraints[index].showAllDeliveryComplication =
        true;
    }

    if (!flag)
      pastObstericHistoryForm.patchValue({ otherDeliveryComplication: null });
    this.hrpPastObstetricDetails(setHrpStatus);
  }

  showOtherPostpartumComplication = false;
  resetOtherPostpartumComplicationType(
    pastObstericHistoryForm: any,
    index: any,
  ) {
    const postpartumComplicationList =
      pastObstericHistoryForm.value.postpartumComplicationList;

    let flag = false;

    postpartumComplicationList.forEach((item: any) => {
      if (item.postpartumComplicationType === 'Other') {
        flag = true;
      }
    });

    this.complicationOptionConstraints[index].showOtherPostpartumComplication =
      flag;

    if (postpartumComplicationList.length > 1) {
      this.complicationOptionConstraints[
        index
      ].disableNonePostpartumComplication = true;
      this.complicationOptionConstraints[index].showAllPostpartumComplication =
        false;
    } else if (postpartumComplicationList.length === 1) {
      const t =
        postpartumComplicationList[0].postpartumComplicationType === 'None'
          ? false
          : true;
      this.complicationOptionConstraints[
        index
      ].disableNonePostpartumComplication = t;
      this.complicationOptionConstraints[index].showAllPostpartumComplication =
        false;
    } else {
      this.complicationOptionConstraints[
        index
      ].disableNonePostpartumComplication = false;
      this.complicationOptionConstraints[index].showAllPostpartumComplication =
        true;
    }

    if (!flag)
      pastObstericHistoryForm.patchValue({ otherPostpartumCompType: null });
  }

  resetOtherNewBornComplications(pastObstericHistoryForm: any) {
    if (
      pastObstericHistoryForm.value.newBornComplication.complicationValue ===
      'Other'
    )
      pastObstericHistoryForm.patchValue({ otherNewBornComplication: null });
  }
  resetPostComplicationType(pastObstericHistoryForm: any, index: any) {
    const postpartumComplicationList =
      pastObstericHistoryForm.value.postAbortionComplication;

    if (postpartumComplicationList.length > 1) {
      this.complicationOptionConstraints[index].disableNonePostComplication =
        true;
      this.complicationOptionConstraints[index].showAllPostComplication = false;
    } else if (postpartumComplicationList.length === 1) {
      const t =
        postpartumComplicationList[0].complicationValue === 'None'
          ? false
          : true;
      this.complicationOptionConstraints[index].disableNonePostComplication = t;
      this.complicationOptionConstraints[index].showAllPostComplication = false;
    } else {
      this.complicationOptionConstraints[index].disableNonePostComplication =
        false;
      this.complicationOptionConstraints[index].showAllPostComplication = true;
    }
  }

  trackComplication(complication: any, i: any) {
    return complication ? complication.value : undefined;
  }

  checkPregnancyOutcome(pastObstericHistoryForm: any) {
    if (pastObstericHistoryForm.value.pregOutcome.pregOutcome === 'Abortion') {
      pastObstericHistoryForm.patchValue({
        durationType: null,
        deliveryPlace: null,
        otherDeliveryPlace: null,
        deliveryType: null,
        deliveryComplicationList: null,
        otherDeliveryComplication: null,
        newBornComplication: null,
        otherNewBornComplication: null,
        congenitalAnomalies: null,
        abortionType: null,
        typeofFacility: null,
        pregDuration: null,
        postAbortionComplication: null,
      });
    }

    if (
      pastObstericHistoryForm.value.pregOutcome.pregOutcome === 'Stillbirth'
    ) {
      pastObstericHistoryForm.patchValue({
        newBornComplication: null,
        otherNewBornComplication: null,
        congenitalAnomalies: null,
      });
    }
    this.hrpPastObstetricDetails(true);
  }

  onAbortionType(
    pastObstericHistoryForm: AbstractControl<any, any>,
    name: any,
  ) {
    if (name !== 'Induced') {
      pastObstericHistoryForm.patchValue({ typeofFacility: null });
    }
  }
  checkDurationType(pastObstericHistoryForm: AbstractControl<any, any>) {
    if (
      Number(pastObstericHistoryForm.value.pregDuration) > 24 ||
      Number(pastObstericHistoryForm.value.pregDuration < 4)
    ) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.pregnancyRange,
      );
      pastObstericHistoryForm.patchValue({ pregDuration: null });
      this.hrpPastObstetricDetails(true);
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
      this.trackingService.trackFieldInteraction(
        fieldName,
        'Past Obstetric History',
      );
    } catch (error) {
      console.error(
        `❌ Error tracking past obstetric history ${fieldName}:`,
        error,
      );
    }
  }
}
