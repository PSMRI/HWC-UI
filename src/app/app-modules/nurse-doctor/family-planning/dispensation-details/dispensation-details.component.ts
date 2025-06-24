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
import { SetLanguageComponent } from '../../../core/components/set-language.component';
import { HttpServiceService } from '../../../core/services/http-service.service';
import { Subscription } from 'rxjs';
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
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-dispensation-details',
  templateUrl: './dispensation-details.component.html',
  styleUrls: ['./dispensation-details.component.css'],
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
export class DispensationDetailsComponent
  implements OnChanges, OnInit, DoCheck, OnDestroy
{
  @Input()
  dispensationDetailsForm!: FormGroup;

  @Input()
  familyPlanningMode!: string;

  futureDate = new Date();
  pastDate = new Date();
  today = new Date();
  countryId = 1;
  contraceptiveTypes: any = [];
  contraceptiveType: any = [];
  enableIucdFields = false;
  enableDoseFields = false;
  enableOtherContraceptiveTypeField = false;
  typeOfContraceptivesList: any = [];
  typeOfIucdInsertedList: any = [];
  iucdInsertionByList: any = [];
  disableNoneOption = false;
  disableAllOptions = false;
  current_language_set: any;
  benFamilyPlanningSubscription!: Subscription;
  attendant: any;
  enablingDispenseSubscriptionValue!: Subscription;

  constructor(
    private masterDataService: MasterdataService,
    private doctorService: DoctorService,
    private httpServiceService: HttpServiceService,
    private route: ActivatedRoute,
    readonly sessionstorage: SessionStorageService,
  ) {}

  ngOnInit() {
    this.doctorService.setFamilyDataFetch(false);
    this.attendant = this.route.snapshot.params['attendant'];
    this.futureDate.setDate(this.futureDate.getDate() + 1);
    this.pastDate.setDate(this.today.getDate() - 1);
    this.loadMasterData();
    this.getFamilyPlanningNurseFetchDetails();

    this.doctorService.fetchFamilyDataCheck$.subscribe((responsevalue) => {
      if (responsevalue === true) {
        this.getFamilyPlanningNurseFetchDetails();
      }
    });
  }

  ngOnDestroy() {
    if (
      String(this.familyPlanningMode) === 'view' ||
      String(this.familyPlanningMode) === 'update'
    ) {
      this.resetDispensationDetailsForm();
    } else {
      this.dispensationDetailsForm.reset();
    }
    if (this.benFamilyPlanningSubscription)
      this.benFamilyPlanningSubscription.unsubscribe();

    if (this.enablingDispenseSubscriptionValue)
      this.enablingDispenseSubscriptionValue.unsubscribe();
  }
  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }

  resetDispensationDetailsForm() {
    this.dispensationDetailsForm.controls[
      'typeOfContraceptivePrescribed'
    ].reset();
    this.dispensationDetailsForm.controls[
      'otherTypeOfContraceptivePrescribed'
    ].reset();
    this.dispensationDetailsForm.controls['dosesTaken'].reset();
    this.dispensationDetailsForm.controls['dateOfLastDoseTaken'].reset();

    this.dispensationDetailsForm.controls['qtyPrescribed'].reset();
    this.dispensationDetailsForm.controls['nextVisitForRefill'].reset();
    this.dispensationDetailsForm.controls['typeOfIUCDInsertedId'].reset();
    this.dispensationDetailsForm.controls['typeOfIUCDInserted'].reset();
    this.dispensationDetailsForm.controls['dateOfIUCDInsertion'].reset();
    this.dispensationDetailsForm.controls['iucdInsertionDoneBy'].reset();

    this.enableOtherContraceptiveTypeField = false;
    this.enableDoseFields = false;
    this.enableIucdFields = false;
    this.disableNoneOption = false;
    this.disableAllOptions = false;
  }

  loadMasterData() {
    this.masterDataService.nurseMasterData$.subscribe((res) => {
      if (res !== undefined && res !== null) {
        this.typeOfContraceptivesList = res.m_fpmethodfollowup;
        this.typeOfIucdInsertedList = res.m_TypeofIUCDinserted;
        this.iucdInsertionByList = res.m_IUCDinsertiondoneby;
        if (
          String(this.familyPlanningMode) === 'view' &&
          this.doctorService.enableDispenseFlag === false
        ) {
          this.getFamilyPlanningNurseFetchDetails();
        }
      } else {
        console.log('Error in fetching nurse master data details');
      }
      this.doctorService.enableDispenseFlag = false;
    });
  }

  otherContrasepiveType() {
    const contraceptiveType =
      this.dispensationDetailsForm.controls['typeOfContraceptivePrescribed']
        .value;
    if (
      contraceptiveType !== null &&
      contraceptiveType !== undefined &&
      contraceptiveType.includes('Other')
    ) {
      this.enableOtherContraceptiveTypeField = true;
    } else {
      this.enableOtherContraceptiveTypeField = false;
      this.dispensationDetailsForm.controls[
        'otherTypeOfContraceptivePrescribed'
      ].reset();
    }
    String(this.familyPlanningMode) === 'view' ||
    String(this.familyPlanningMode) === 'update'
      ? this.doctorService.familyPlanningValueChanged(true)
      : null;
  }

  typeOfIucdInserteredID() {
    this.typeOfIucdInsertedList.filter((itemId: any) => {
      if (
        itemId.name ===
        this.dispensationDetailsForm.controls['typeOfIUCDInserted'].value
      ) {
        this.dispensationDetailsForm.controls['typeOfIUCDInsertedId'].setValue(
          itemId.id,
        );
      }
    });
  }

  populateIucdFields(selectedOption: any) {
    this.contraceptiveType =
      this.dispensationDetailsForm.controls[
        'typeOfContraceptivePrescribed'
      ].value;
    if (
      this.contraceptiveType !== undefined &&
      this.contraceptiveType !== null &&
      (this.contraceptiveType.includes('IUCD 375') ||
        this.contraceptiveType.includes('IUCD 380A'))
    ) {
      this.enableIucdFields = true;
      if (selectedOption === 'IUCD 375' || selectedOption === 'IUCD 380A') {
        this.enableIucdFields = true;
        this.resetIUCDFields();
      } else {
        if (
          !this.contraceptiveType.includes('IUCD 375') &&
          !this.contraceptiveType.includes('IUCD 380A')
        ) {
          this.enableIucdFields = false;
          this.resetIUCDFields();
        }
      }
    } else {
      this.enableIucdFields = false;
      this.resetIUCDFields();
    }
    String(this.familyPlanningMode) === 'view' ||
    String(this.familyPlanningMode) === 'update'
      ? this.doctorService.familyPlanningValueChanged(true)
      : null;
  }
  resetIUCDFields() {
    this.dispensationDetailsForm.controls['typeOfIUCDInserted'].reset();
    this.dispensationDetailsForm.controls['dateOfIUCDInsertion'].reset();
    this.dispensationDetailsForm.controls['iucdInsertionDoneBy'].reset();
  }
  populateDoseFieldForAntara() {
    const contraceptiveType =
      this.dispensationDetailsForm.controls['typeOfContraceptivePrescribed']
        .value;
    if (
      contraceptiveType !== undefined &&
      contraceptiveType !== null &&
      contraceptiveType.includes('Injectable MPA Contraceptive (Antara)')
    ) {
      this.enableDoseFields = true;
    } else {
      this.enableDoseFields = false;
      this.dispensationDetailsForm.controls['dosesTaken'].reset();
      this.dispensationDetailsForm.controls['dateOfLastDoseTaken'].reset();
    }
    String(this.familyPlanningMode) === 'view' ||
    String(this.familyPlanningMode) === 'update'
      ? this.doctorService.familyPlanningValueChanged(true)
      : null;
  }
  disableQuantityPrescribed() {
    const noQtyPresItems: any = [
      'Vasectomy (Male sterilization)',
      'Tubectomy (Female Sterilization)',
      'IUCD 375',
      'IUCD 380A',
    ];
    const contraceptiveType =
      this.dispensationDetailsForm.controls['typeOfContraceptivePrescribed']
        .value;
    if (contraceptiveType.length > 0) {
      const qtyPresIncluded = contraceptiveType.every((element: any) =>
        noQtyPresItems.includes(element),
      );
      if (qtyPresIncluded) {
        this.dispensationDetailsForm.controls['qtyPrescribed'].reset();
        this.dispensationDetailsForm.controls['qtyPrescribed'].disable();
      } else {
        this.dispensationDetailsForm.controls['qtyPrescribed'].enable();
      }
    } else {
      this.dispensationDetailsForm.controls['qtyPrescribed'].enable();
    }
  }
  resettypeOfContraceptivePrescribed(selectedOption: any) {
    if (
      selectedOption !== undefined &&
      selectedOption !== null &&
      selectedOption.length > 0
    ) {
      if (selectedOption.includes('None')) {
        this.disableAllOptions = true;
        this.disableNoneOption = false;
      } else {
        this.disableAllOptions = false;
        this.disableNoneOption = true;
      }
    } else {
      this.disableNoneOption = false;
      this.disableAllOptions = false;
    }
    String(this.familyPlanningMode) === 'view' ||
    String(this.familyPlanningMode) === 'update'
      ? this.doctorService.familyPlanningValueChanged(true)
      : null;
  }

  ngOnChanges() {
    this.attendant = this.route.snapshot.params['attendant'];
    if (
      String(this.familyPlanningMode) === 'view' &&
      this.doctorService.enableDispenseFlag === false
    ) {
      this.getFamilyPlanningNurseFetchDetails();
    }
    if (
      this.sessionstorage.getItem('visitReason') !== undefined &&
      this.sessionstorage.getItem('visitReason') !== 'undefined' &&
      this.sessionstorage.getItem('visitReason') !== null &&
      this.sessionstorage.getItem('visitReason')?.toLowerCase() ===
        'follow up' &&
      this.attendant === 'nurse'
    ) {
      this.getFamilyPlanningFetchDetailsForRevisit();
    }
  }

  getFamilyPlanningNurseFetchDetails() {
    if (
      this.doctorService.familyPlanningDetailsResponseFromNurse !== null &&
      this.doctorService.familyPlanningDetailsResponseFromNurse !== undefined
    ) {
      const familyPlanningDispensationData =
        this.doctorService.familyPlanningDetailsResponseFromNurse
          .dispensationDetails;
      const dispensationDetails = Object.assign(
        {},
        familyPlanningDispensationData,
        {
          nextVisitForRefill: new Date(
            familyPlanningDispensationData.nextVisitForRefill,
          ),
        },
        {
          dateOfLastDoseTaken: new Date(
            familyPlanningDispensationData.dateOfLastDoseTaken,
          ),
        },
        {
          dateOfIUCDInsertion: new Date(
            familyPlanningDispensationData.dateOfIUCDInsertion,
          ),
        },
      );
      this.dispensationDetailsForm.patchValue(dispensationDetails);
      this.patchIUCDFields();
      this.populateDoseFieldForAntara();
      this.disableQuantityPrescribed();
      this.otherContrasepiveType();
      this.resettypeOfContraceptivePrescribed(
        familyPlanningDispensationData.typeOfContraceptivePrescribed,
      );
    }
  }
  patchIUCDFields() {
    const contraceptiveType =
      this.dispensationDetailsForm.controls['typeOfContraceptivePrescribed']
        .value;
    if (
      contraceptiveType !== null &&
      contraceptiveType !== undefined &&
      (contraceptiveType.includes('IUCD 375') ||
        contraceptiveType.includes('IUCD 380A'))
    ) {
      this.enableIucdFields = true;
    }
  }
  getFamilyPlanningFetchDetailsForRevisit() {
    this.benFamilyPlanningSubscription =
      this.doctorService.benFamilyPlanningDetails$.subscribe((response) => {
        if (
          response !== undefined &&
          response !== null &&
          response.dispensationDetails !== undefined &&
          response.dispensationDetails !== null
        ) {
          const familyPlanningDispensationData = response.dispensationDetails;
          const dispensationDetails = Object.assign(
            {},
            familyPlanningDispensationData,
            {
              nextVisitForRefill: new Date(
                familyPlanningDispensationData.nextVisitForRefill,
              ),
            },
            {
              dateOfLastDoseTaken: new Date(
                familyPlanningDispensationData.dateOfLastDoseTaken,
              ),
            },
            {
              dateOfIUCDInsertion: new Date(
                familyPlanningDispensationData.dateOfIUCDInsertion,
              ),
            },
          );
          this.dispensationDetailsForm.patchValue(dispensationDetails);
          this.patchIUCDFields();
          this.populateDoseFieldForAntara();
          this.disableQuantityPrescribed();
          this.otherContrasepiveType();
          this.resettypeOfContraceptivePrescribed(
            familyPlanningDispensationData.typeOfContraceptivePrescribed,
          );
          this.dispensationDetailsForm.patchValue({ id: null });
        }
      });
  }
  onValueChange() {
    String(this.familyPlanningMode) === 'view' ||
    String(this.familyPlanningMode) === 'update'
      ? this.doctorService.familyPlanningValueChanged(true)
      : null;
  }
}
