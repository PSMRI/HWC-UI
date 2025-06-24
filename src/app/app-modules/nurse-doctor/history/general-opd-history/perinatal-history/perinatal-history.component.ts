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
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import {
  MasterdataService,
  NurseService,
  DoctorService,
} from '../../../shared/services';
import { MatDialog } from '@angular/material/dialog';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { PreviousDetailsComponent } from 'src/app/app-modules/core/components/previous-details/previous-details.component';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-general-perinatal-history',
  templateUrl: './perinatal-history.component.html',
  styleUrls: ['./perinatal-history.component.css'],
})
export class PerinatalHistoryComponent implements OnInit, DoCheck, OnDestroy {
  @Input()
  perinatalHistoryForm!: FormGroup;

  @Input()
  visitCategory: any;

  @Input()
  mode!: string;

  masterData: any;
  selectDeliveryTypes: any;
  currentLanguageSet: any;
  constructor(
    private fb: FormBuilder,
    private masterdataService: MasterdataService,
    private nurseService: NurseService,
    private doctorService: DoctorService,
    private dialog: MatDialog,
    public httpServiceService: HttpServiceService,
    private confirmationService: ConfirmationService,
    readonly sessionstorage: SessionStorageService,
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

  perinatalHistoryData: any;
  generalHistorySubscription: any;
  getGeneralHistory() {
    this.generalHistorySubscription =
      this.doctorService.populateHistoryResponse$.subscribe((history) => {
        if (
          history !== null &&
          history.statusCode === 200 &&
          history.data !== null &&
          history.data.PerinatalHistory !== null
        ) {
          this.perinatalHistoryData = history.data.PerinatalHistory;

          if (this.perinatalHistoryData.deliveryPlaceID)
            this.perinatalHistoryData.placeOfDelivery =
              this.masterData.deliveryPlaces.filter((item: any) => {
                return (
                  item.deliveryPlaceID ===
                  this.perinatalHistoryData.deliveryPlaceID
                );
              })[0];

          if (this.perinatalHistoryData.deliveryTypeID)
            this.perinatalHistoryData.typeOfDelivery =
              this.masterData.deliveryTypes.filter((item: any) => {
                return (
                  item.deliveryTypeID ===
                  this.perinatalHistoryData.deliveryTypeID
                );
              })[0];

          if (this.perinatalHistoryData.complicationAtBirthID)
            this.perinatalHistoryData.complicationAtBirth =
              this.masterData.birthComplications.filter((item: any) => {
                return (
                  item.complicationID ===
                  this.perinatalHistoryData.complicationAtBirthID
                );
              })[0];

          this.perinatalHistoryForm.patchValue(this.perinatalHistoryData);
          //enabling the fields
          if (this.perinatalHistoryForm.controls['typeOfDelivery'].value) {
            this.perinatalHistoryForm?.get('typeOfDelivery')?.enable();
          } else {
            this.perinatalHistoryForm?.get('typeOfDelivery')?.disable();
          }
        }
      });
  }

  checkWeight(birthWeightG: any) {
    if (this.birthWeightG < 500 || this.birthWeightG > 6000)
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue,
      );
  }

  get birthWeightG() {
    return this.perinatalHistoryForm.controls['birthWeightG'].value;
  }

  get placeOfDelivery() {
    return this.perinatalHistoryForm.controls['placeOfDelivery'].value;
  }

  get complicationAtBirth() {
    return this.perinatalHistoryForm.controls['complicationAtBirth'].value;
  }

  resetOtherPlaceOfDelivery() {
    const deliveryList = this.masterData.deliveryTypes;
    if (
      this.placeOfDelivery.deliveryPlace === 'Home-Supervised' ||
      this.placeOfDelivery.deliveryPlace === 'Home-Unsupervised'
    ) {
      const tempDeliveryTypes = this.masterData.deliveryTypes.filter(
        (item: any) => {
          console.log('item', item);

          return item.deliveryType === 'Normal Delivery';
        },
      );
      this.selectDeliveryTypes = tempDeliveryTypes;
    } else if (
      this.placeOfDelivery.deliveryPlace === 'Subcentre' ||
      this.placeOfDelivery.deliveryPlace === 'PHC'
    ) {
      const deliveryType = deliveryList.filter((item: any) => {
        return item.deliveryType !== 'Cesarean Section (LSCS)';
      });
      this.selectDeliveryTypes = deliveryType;
    } else {
      this.selectDeliveryTypes = this.masterData.deliveryTypes;
    }
    this.perinatalHistoryForm.patchValue({ otherPlaceOfDelivery: null });
    //enabling the fields
    if (this.placeOfDelivery.deliveryPlace) {
      this.perinatalHistoryForm?.get('typeOfDelivery')?.enable();
    } else {
      this.perinatalHistoryForm?.get('typeOfDelivery')?.disable();
    }
  }

  resetOtherComplicationAtBirth() {
    this.perinatalHistoryForm.patchValue({ otherComplicationAtBirth: null });
  }

  getPreviousPerinatalHistory() {
    const benRegID: any = this.sessionstorage.getItem('beneficiaryRegID');
    console.log('here checkig', this.visitCategory);

    this.nurseService
      .getPreviousPerinatalHistory(benRegID, this.visitCategory)
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
            .previousPerinatalHistoryDetails,
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
}
