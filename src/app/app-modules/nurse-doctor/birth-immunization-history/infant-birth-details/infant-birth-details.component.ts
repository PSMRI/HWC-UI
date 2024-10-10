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
import { FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { Subscription } from 'rxjs';
import {
  BeneficiaryDetailsService,
  ConfirmationService,
} from 'src/app/app-modules/core/services';
import { DoctorService, MasterdataService } from '../../shared/services';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from '@angular/material/core';
import {
  MomentDateAdapter,
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
} from '@angular/material-moment-adapter';

@Component({
  selector: 'app-infant-birth-details',
  templateUrl: './infant-birth-details.component.html',
  styleUrls: ['./infant-birth-details.component.css'],
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
export class InfantBirthDetailsComponent
  implements OnChanges, OnInit, DoCheck, OnDestroy
{
  @Input()
  visitCategory: any;

  @Input()
  infantBirthDetailsForm!: FormGroup;

  @Input()
  immunizationHistoryMode: any;

  currentLanguageSet: any;
  enableOtherDeliveryPlace!: boolean;
  enableOtherDeliveryType!: boolean;
  enableOtherBirthComplication!: boolean;

  deliveryPlaceList: any = [];

  deliveryTypeList: any = [];

  birthComplicationList: any = [];

  gestationList: any = [];

  deliveryConductedByList: any = [];

  congenitalAnomaliesList: any = [];

  placeOfDelivery: any = [];

  attendant: any;
  today = new Date();
  masterDataSubscription!: Subscription;
  infantAndBirthHistoryDetailsSubscription!: Subscription;
  beneficiaryDetailsSubscription: any;
  beneficiary: any;
  benBirthDetails!: Date;

  constructor(
    public httpServiceService: HttpServiceService,
    private masterDataService: MasterdataService,
    private doctorService: DoctorService,
    private confirmationService: ConfirmationService,
    private route: ActivatedRoute,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
  ) {}

  ngOnInit() {
    this.doctorService.setInfantDataFetch(false);
    this.assignSelectedLanguage();
    this.attendant = this.route.snapshot.params['attendant'];
    this.loadMasterData();
    this.today.setDate(this.today.getDate());
    this.getBeneficiaryDetails();

    this.doctorService.fetchInfantDataCheck$.subscribe((responsevalue) => {
      if (responsevalue === true) {
        this.getNurseFetchDetails();
      }
    });
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }

  ngOnChanges() {
    console.log('success');
  }

  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  loadMasterData() {
    this.masterDataSubscription =
      this.masterDataService.nurseMasterData$.subscribe((res) => {
        if (res !== undefined && res !== null) {
          this.deliveryPlaceList = res.deliveryPlaces;
          this.placeOfDelivery = res.deliveryTypes;
          this.deliveryTypeList = res.deliveryTypes;
          this.birthComplicationList = res.birthComplications;
          this.gestationList = res.gestation;
          this.deliveryConductedByList = res.deliveryConductedByMaster;
          this.congenitalAnomaliesList = res.m_congenitalanomalies;
          if (String(this.immunizationHistoryMode) === 'view') {
            this.getNurseFetchDetails();
          }

          //for fetching previous visit immunization history
          if (this.attendant === 'nurse') {
            this.getPreviousInfantBirthDetails();
          }
        } else {
          console.log('Error in fetching nurse master data details');
        }
      });
  }
  getBeneficiaryDetails() {
    this.beneficiaryDetailsSubscription =
      this.beneficiaryDetailsService.beneficiaryDetails$.subscribe(
        (beneficiaryDetails) => {
          if (beneficiaryDetails) {
            this.beneficiary = beneficiaryDetails;
            this.benBirthDetails = new Date(beneficiaryDetails.dOB);
            this.infantBirthDetailsForm.patchValue({
              dateOfBirth: this.benBirthDetails,
            });
          }
        },
      );
  }

  getDeliveryType() {
    this.deliveryTypeList.filter((item: any) => {
      if (
        item.deliveryTypeID ===
        this.infantBirthDetailsForm.controls['deliveryTypeID'].value
      ) {
        this.infantBirthDetailsForm.controls['deliveryType'].setValue(
          item.deliveryType,
        );
      }
    });
    String(this.immunizationHistoryMode) === 'view' ||
    String(this.immunizationHistoryMode) === 'update'
      ? this.doctorService.BirthAndImmunizationValueChanged(true)
      : null;
  }

  getGestation() {
    this.gestationList.filter((item: any) => {
      if (
        item.gestationID ===
        this.infantBirthDetailsForm.controls['gestationID'].value
      ) {
        this.infantBirthDetailsForm.controls['gestation'].setValue(item.name);
      }
    });
    String(this.immunizationHistoryMode) === 'view' ||
    String(this.immunizationHistoryMode) === 'update'
      ? this.doctorService.BirthAndImmunizationValueChanged(true)
      : null;
  }

  getDeliveryConductedBy() {
    this.deliveryConductedByList.filter((item: any) => {
      if (
        item.deliveryConductedByID ===
        this.infantBirthDetailsForm.controls['deliveryConductedByID'].value
      ) {
        this.infantBirthDetailsForm.controls['deliveryConductedBy'].setValue(
          item.deliveryConductedBy,
        );
      }
    });
    String(this.immunizationHistoryMode) === 'view' ||
    String(this.immunizationHistoryMode) === 'update'
      ? this.doctorService.BirthAndImmunizationValueChanged(true)
      : null;
  }

  otherPlaceOfDelivery(isFetch: any) {
    if (isFetch === true) {
      this.infantBirthDetailsForm.get('deliveryTypeID')?.reset();
      this.infantBirthDetailsForm.get('deliveryType')?.reset();
    }
    const deliveryList = this.placeOfDelivery;
    this.deliveryPlaceList.filter((item: any) => {
      if (
        item.deliveryPlaceID ===
        this.infantBirthDetailsForm.controls['deliveryPlaceID'].value
      ) {
        this.infantBirthDetailsForm.controls['deliveryPlace'].setValue(
          item.deliveryPlace,
        );
      }
    });
    if (
      this.infantBirthDetailsForm.controls['deliveryPlace'].value ===
        'Home-Supervised' ||
      this.infantBirthDetailsForm.controls['deliveryPlace'].value ===
        'Home-Unsupervised'
    ) {
      const deliveryType = this.deliveryTypeList.filter((item: any) => {
        return item.deliveryType === 'Normal Delivery';
      });
      this.deliveryTypeList = deliveryType;
    } else if (
      this.infantBirthDetailsForm.controls['deliveryPlace'].value ===
        'Subcentre' ||
      this.infantBirthDetailsForm.controls['deliveryPlace'].value === 'PHC'
    ) {
      const deliveryType = deliveryList.filter((item: any) => {
        return item.deliveryType !== 'Cesarean Section (LSCS)';
      });
      this.deliveryTypeList = deliveryType;
    } else {
      this.deliveryTypeList = this.placeOfDelivery;
    }
    if (
      this.infantBirthDetailsForm.controls['deliveryPlace'].value === 'Other'
    ) {
      this.enableOtherDeliveryPlace = true;
    } else {
      this.enableOtherDeliveryPlace = false;
      this.infantBirthDetailsForm.get('otherDeliveryPlace')?.reset();
    }
    String(this.immunizationHistoryMode) === 'view' ||
    String(this.immunizationHistoryMode) === 'update'
      ? this.doctorService.BirthAndImmunizationValueChanged(true)
      : null;
  }

  otherBirthComplication() {
    this.birthComplicationList.filter((item: any) => {
      if (
        item.complicationID ===
        this.infantBirthDetailsForm.controls['birthComplicationID'].value
      ) {
        this.infantBirthDetailsForm.controls['birthComplication'].setValue(
          item.complicationValue,
        );
      }
    });
    if (
      this.infantBirthDetailsForm.controls['birthComplication'].value ===
      'Other'
    ) {
      this.enableOtherBirthComplication = true;
    } else {
      this.enableOtherBirthComplication = false;
      this.infantBirthDetailsForm.get('otherDeliveryComplication')?.reset();
    }
    String(this.immunizationHistoryMode) === 'view' ||
    String(this.immunizationHistoryMode) === 'update'
      ? this.doctorService.BirthAndImmunizationValueChanged(true)
      : null;
  }

  checkNewBornWeight() {
    if (
      this.infantBirthDetailsForm.controls['birthWeightOfNewborn'].value !==
        undefined &&
      this.infantBirthDetailsForm.controls['birthWeightOfNewborn'].value !==
        null &&
      this.infantBirthDetailsForm.controls['birthWeightOfNewborn'].value < 500
    ) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue,
      );
    }
    String(this.immunizationHistoryMode) === 'view' ||
    String(this.immunizationHistoryMode) === 'update'
      ? this.doctorService.BirthAndImmunizationValueChanged(true)
      : null;
  }

  onValueChange() {
    String(this.immunizationHistoryMode) === 'view' ||
    String(this.immunizationHistoryMode) === 'update'
      ? this.doctorService.BirthAndImmunizationValueChanged(true)
      : null;
  }

  getNurseFetchDetails() {
    if (
      this.doctorService.birthAndImmunizationDetailsFromNurse !== null &&
      this.doctorService.birthAndImmunizationDetailsFromNurse !== undefined &&
      this.doctorService.birthAndImmunizationDetailsFromNurse
        .infantBirthDetails !== undefined &&
      this.doctorService.birthAndImmunizationDetailsFromNurse
        .infantBirthDetails !== null
    ) {
      const infantBirthFormData =
        this.doctorService.birthAndImmunizationDetailsFromNurse
          .infantBirthDetails;
      const infantBirthDetails = Object.assign(
        {},
        infantBirthFormData,
        {
          dateOfBirth: new Date(infantBirthFormData.dateOfBirth),
        },
        {
          dateOfUpdatingBirthDetails: new Date(
            infantBirthFormData.dateOfUpdatingBirthDetails,
          ),
        },
      );
      this.infantBirthDetailsForm.patchValue(infantBirthDetails);
      this.otherBirthComplication();
      this.otherPlaceOfDelivery(false);
    } else {
      console.log('Error in fetching nurse details');
    }
  }

  getPreviousInfantBirthDetails() {
    this.infantAndBirthHistoryDetailsSubscription =
      this.doctorService.infantAndImmunizationData$.subscribe((res) => {
        if (
          res !== null &&
          res !== undefined &&
          res.infantBirthDetails !== undefined &&
          res.infantBirthDetails !== null
        ) {
          const infantBirthFormData = res.infantBirthDetails;
          const infantBirthDetails = Object.assign(
            {},
            infantBirthFormData,
            {
              dateOfBirth: new Date(infantBirthFormData.dateOfBirth),
            },
            {
              dateOfUpdatingBirthDetails: new Date(
                infantBirthFormData.dateOfUpdatingBirthDetails,
              ),
            },
          );
          this.infantBirthDetailsForm.patchValue(infantBirthDetails);
          this.otherBirthComplication();
          this.otherPlaceOfDelivery(false);
          this.infantBirthDetailsForm.patchValue({ id: null });
        } else {
          console.log('Error in fetching previous infant birth details');
        }
      });
  }

  ngOnDestroy() {
    this.infantBirthDetailsForm.reset();
    if (this.masterDataSubscription) this.masterDataSubscription.unsubscribe();
    if (this.infantAndBirthHistoryDetailsSubscription)
      this.infantAndBirthHistoryDetailsSubscription.unsubscribe();
    if (this.beneficiaryDetailsSubscription)
      this.beneficiaryDetailsSubscription.unsubscribe();
  }
}
