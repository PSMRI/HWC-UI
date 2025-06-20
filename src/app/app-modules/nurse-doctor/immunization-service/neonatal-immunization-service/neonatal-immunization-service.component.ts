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
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
} from '@angular/forms';
import { SetLanguageComponent } from '../../../core/components/set-language.component';
import { BeneficiaryDetailsService } from '../../../core/services/beneficiary-details.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { HttpServiceService } from '../../../core/services/http-service.service';
import { Subscription } from 'rxjs';
import { DoctorService, MasterdataService } from '../../shared/services';
import { GeneralUtils } from '../../shared/utility';
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
  selector: 'app-neonatal-immunization-service',
  templateUrl: './neonatal-immunization-service.component.html',
  styleUrls: ['./neonatal-immunization-service.component.css'],
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
export class NeonatalImmunizationServiceComponent
  implements OnChanges, OnInit, DoCheck, OnDestroy
{
  @Input()
  immunizationServicesForm!: FormGroup;

  @Input()
  mode: any;

  @Input()
  visitCategory: any;

  today: any;
  currentLanguageSet: any;
  typeOfImmunizationServiceList: any = [];
  currentImmunizationServiceList: any = [];
  vaccineList: any = [];
  enableVaccineDetails = false;
  vaccineStatus = ['Given', 'Not Given'];
  nurseMasterDataSubscription!: Subscription;
  masterData: any;
  missingVaccineList: any = [];
  utils = new GeneralUtils(this.fb, this.sessionstorage);
  enableFieldsToCaptureMissedVaccineDetails = false;
  currentVaccineTaken: any = [];
  capturedImmunizationService: any;
  missingVaccine: any = [];
  patchVaccineDetailsOnView = false;
  currentImmunizationValue: any = [];
  beneficiaryDetailsSubscription!: Subscription;
  beneficiaryAge: any;
  todayDate = new Date();
  filteredImmunizationServiceList: any = [];

  constructor(
    private httpServiceService: HttpServiceService,
    private masterdataService: MasterdataService,
    private fb: FormBuilder,
    private doctorService: DoctorService,
    private confirmationService: ConfirmationService,
    readonly sessionstorage: SessionStorageService,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.today = new Date();
    this.getBeneficiaryDetails();
    this.getNurseMasterData();
    this.todayDate.setDate(this.today.getDate());
    this.immunizationServicesForm.patchValue({ dateOfVisit: this.todayDate });
  }
  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  ngOnChanges() {
    if (String(this.mode) === 'view') {
      this.getNurseFetchImmunizationServiceDetailsForChildhood();
      this.getNurseFetchImmunizationServiceDetails();
    }
    if (String(this.mode) === 'update') {
      this.updateImmunizationServiceFromDoctor(this.immunizationServicesForm);
    }
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }
  getNurseMasterData() {
    this.nurseMasterDataSubscription =
      this.masterdataService.nurseMasterData$.subscribe((masterData) => {
        if (
          masterData !== undefined &&
          masterData !== null &&
          masterData.m_currentimmunizationservice &&
          masterData.m_immunizationservicestype
        ) {
          this.currentImmunizationServiceList =
            masterData.m_currentimmunizationservice;
          this.typeOfImmunizationServiceList =
            masterData.m_immunizationservicestype;
          this.checkCurrentImmunizationService(
            masterData.m_currentimmunizationservice,
          );
          if (String(this.mode) === 'view') {
            this.getNurseFetchImmunizationServiceDetailsForChildhood();
            this.getNurseFetchImmunizationServiceDetails();
          }
        }
      });
  }
  setImmunizationServiceType(immunizationServicesTypeID: any) {
    this.resetFormValuesOnChangeofImmunizationType();
    this.typeOfImmunizationServiceList.filter(
      (immunizationServiceType: any) => {
        if (immunizationServiceType.id === immunizationServicesTypeID)
          this.immunizationServicesForm.patchValue({
            immunizationServicesType: immunizationServiceType.name,
          });
      },
    );
    this.filterCurrentImmunizationServiceType(
      immunizationServicesTypeID,
      false,
    );
  }
  filterCurrentImmunizationServiceType(
    immunizationServicesTypeID: any,
    isFecthForRegularVaccine: any,
  ) {
    this.filteredImmunizationServiceList = [];
    if (immunizationServicesTypeID === 2) {
      this.currentImmunizationServiceList.filter((missingVaccine: any) => {
        if (missingVaccine.id === 6 || missingVaccine.id === 11) {
          this.filteredImmunizationServiceList.push(missingVaccine);
        }
      });
    } else {
      const index = this.currentImmunizationServiceList.findIndex(
        (filterMissingVaccine: any) =>
          filterMissingVaccine.id === 6 || filterMissingVaccine.id === 11,
      );
      this.filteredImmunizationServiceList.push(
        ...this.currentImmunizationServiceList,
      );
      this.filteredImmunizationServiceList.splice(index, 1);
    }
    if (
      this.filteredImmunizationServiceList !== undefined &&
      this.filteredImmunizationServiceList.length === 0 &&
      isFecthForRegularVaccine === false
    ) {
      this.confirmationService.alert(
        'No regular vaccination available for this age group',
      );
      console.log(
        'regular vaccination',
        this.filteredImmunizationServiceList.length,
      );
    }
  }
  setCurrentImmunizationService(currentImmunizationServiceID: any) {
    this.currentImmunizationServiceList.filter(
      (currentImmunizationType: any) => {
        if (currentImmunizationType.id === currentImmunizationServiceID) {
          this.immunizationServicesForm.patchValue({
            currentImmunizationService: currentImmunizationType.name,
          });
        }
      },
    );
  }
  resetFormValuesOnChangeofImmunizationType() {
    this.immunizationServicesForm.controls[
      'currentImmunizationServiceID'
    ].reset();
    this.immunizationServicesForm.controls[
      'currentImmunizationService'
    ].reset();
    this.immunizationServicesForm.controls['vaccines'].reset();
    this.vaccineList = [];
    this.enableVaccineDetails = false;
  }
  checkCurrentImmunizationService(temp: any) {
    this.currentImmunizationServiceList = [];
    temp.forEach((item: any) => {
      if (
        this.getAgeValue(item.name) <= this.getAgeValue(this.beneficiaryAge)
      ) {
        this.currentImmunizationServiceList.push(item);
      }
    });
  }

  /**List of vaccines based on selected immunization service */

  getVaccineListOnSelectedService(
    currentImmunizationServiceID: any,
    currentImmunizationService: any,
  ) {
    this.enableFieldsToCaptureMissedVaccineDetails = false;
    this.missingVaccineList = [];
    const vaccines = <FormArray>(
      this.immunizationServicesForm.controls['vaccines']
    );
    if (vaccines.value.length > 0) {
      vaccines.controls.splice(0, vaccines.controls.length);
      vaccines.value.splice(0, vaccines.value.length);
    }

    this.masterdataService
      .getVaccineList(currentImmunizationServiceID)
      .subscribe(
        (vaccines: any) => {
          if (
            vaccines !== undefined &&
            vaccines.data !== undefined &&
            vaccines.data.vaccineList !== undefined
          ) {
            this.enableVaccineDetails = true;
            this.vaccineList = vaccines.data.vaccineList;
            for (let i = 0; i < this.vaccineList.length; i++) {
              const vaccines = <FormArray>(
                this.immunizationServicesForm.controls['vaccines']
              );
              vaccines.push(this.utils.initVaccineListOnSelectedService());
            }
            if (this.missingVaccineList.length > 0) {
              const vaccines = <FormArray>(
                this.immunizationServicesForm.controls['vaccines']
              );
              vaccines.push(this.utils.initVaccineListOnSelectedService());
            }
            /* patchVaccineDetailsOnView - variable used to restrict the method call on change of immunization
          service dropdown on doctor */
            if (
              String(this.mode) === 'view' &&
              this.patchVaccineDetailsOnView === true
            ) {
              this.viewImmunizationServices();
            }
          }
        },
        (err) => {
          this.confirmationService.alert(err.errorMessage, 'err');
        },
      );
    this.onValueChange();
  }

  onValueChange() {
    if (
      this.visitCategory.toLowerCase ===
      'childhood & adolescent healthcare services'
    ) {
      String(this.mode) === 'view' || String(this.mode) === 'update'
        ? this.doctorService.immunizationServiceChildhoodValueChanged(true)
        : null;
    }
  }

  viewImmunizationServices() {
    /*weeks vaccines */
    if (this.vaccineList.length > 0) {
      const vaccineControls = <FormArray>(
        this.immunizationServicesForm.controls['vaccines']
      );
      this.currentVaccineTaken.forEach((selectedVaccine: any) => {
        this.vaccineList.forEach((listOfVaccine: any, index: any) => {
          if (
            listOfVaccine.vaccine.trim().toLowerCase() ===
            selectedVaccine.vaccineName.trim().toLowerCase()
          ) {
            vaccineControls.at(index).patchValue(selectedVaccine);
            if (
              selectedVaccine.vaccineName !== undefined &&
              selectedVaccine.vaccineName !== null
            ) {
              vaccineControls.at(index).patchValue({ status: 'Given' });
            }
          }
        });
      });
    }

    this.enableVaccineDetails = true;
    this.patchVaccineDetailsOnView = false;
    /* patch other fields */
    this.immunizationServicesForm.patchValue({
      currentImmunizationServiceID:
        this.capturedImmunizationService.currentImmunizationServiceID,
      immunizationServicesTypeID:
        this.capturedImmunizationService.immunizationServicesTypeID,
      currentImmunizationService:
        this.capturedImmunizationService.currentImmunizationService,
      immunizationServicesType:
        this.capturedImmunizationService.immunizationServicesType,
      dateOfVisit: new Date(this.capturedImmunizationService.dateOfVisit),
      processed: this.capturedImmunizationService.processed,
      deleted: this.capturedImmunizationService.deleted,
      beneficiaryRegID: this.capturedImmunizationService.beneficiaryRegID,
      providerServiceMapID:
        this.capturedImmunizationService.providerServiceMapID,
      createdBy: this.capturedImmunizationService.createdBy,
      vanID: this.capturedImmunizationService.vanID,
      parkingPlaceID: this.capturedImmunizationService.parkingPlaceID,
    });
    this.filterCurrentImmunizationServiceType(
      this.capturedImmunizationService.immunizationServicesTypeID,
      true,
    );
  }
  setVaccineName(vaccineStatus: any, index: any, vaccine: AbstractControl) {
    if (vaccineStatus.toLowerCase() === 'given') {
      vaccine.patchValue({
        vaccineName: this.vaccineList[index].vaccine,
      });
      this.setDefaultVaccineDetailsForSelectedWeeks(vaccine, index);
    } else {
      vaccine.get('vaccineName')?.reset();
      this.resetVaccineDetails(vaccine);
    }
  }
  /* Set default doses, route and site of injection for selected vaccine on weeks */
  setDefaultVaccineDetailsForSelectedWeeks(
    vaccine: AbstractControl,
    index: any,
  ) {
    if (this.vaccineList[index].dose.length === 1) {
      vaccine.patchValue({
        vaccineDose: this.vaccineList[index].dose[0].dose,
      });
    }
    if (this.vaccineList[index].route.length === 1) {
      vaccine.patchValue({
        route: this.vaccineList[index].route[0].route,
      });
    }
    if (this.vaccineList[index].siteOfInjection.length === 1) {
      vaccine.patchValue({
        siteOfInjection:
          this.vaccineList[index].siteOfInjection[0].siteofinjection,
      });
    }
  }
  resetVaccineDetails(vaccine: AbstractControl) {
    vaccine.get('batchNo')?.reset();
    vaccine.get('vaccineDose')?.reset();
    vaccine.get('route')?.reset();
    vaccine.get('siteOfInjection')?.reset();
  }
  /** Nurse fetch */
  getNurseFetchImmunizationServiceDetails() {
    if (
      this.visitCategory.toLowerCase() ===
      'neonatal and infant health care services'
    ) {
      this.doctorService.fetchImmunizationServiceDeatilsFromNurse().subscribe(
        (serviceResponse: any) => {
          if (
            serviceResponse !== undefined &&
            serviceResponse !== null &&
            serviceResponse.data !== undefined &&
            serviceResponse.data.immunizationServices !== undefined
          ) {
            this.capturedImmunizationService =
              serviceResponse.data.immunizationServices;
            this.currentVaccineTaken =
              serviceResponse.data.immunizationServices.vaccines;
            this.patchVaccineDetailsOnView = true;
            this.getVaccineListOnSelectedService(
              this.capturedImmunizationService.currentImmunizationServiceID,
              this.capturedImmunizationService.currentImmunizationService,
            );
          }
        },
        (err) => {
          this.confirmationService.alert(err, 'error');
        },
      );
    }
  }

  getNurseFetchImmunizationServiceDetailsForChildhood() {
    if (
      this.visitCategory.toLowerCase() ===
      'childhood & adolescent healthcare services'
    ) {
      if (
        this.doctorService.immunizationServiceFetchDetails !== undefined &&
        this.doctorService.immunizationServiceFetchDetails !== null &&
        this.doctorService.immunizationServiceFetchDetails
          .immunizationServices !== undefined &&
        this.doctorService.immunizationServiceFetchDetails
          .immunizationServices !== null
      ) {
        const immunizationServiceData =
          this.doctorService.immunizationServiceFetchDetails
            .immunizationServices;

        this.capturedImmunizationService = immunizationServiceData;
        this.currentVaccineTaken = immunizationServiceData.vaccines;
        this.patchVaccineDetailsOnView = true;
        this.getVaccineListOnSelectedService(
          immunizationServiceData.currentImmunizationServiceID,
          immunizationServiceData.currentImmunizationService,
        );
      }
    }
  }
  /** Nurse update */
  updateImmunizationServiceFromDoctor(immunizationServiceForm: any) {
    if (
      this.visitCategory.toLowerCase() ===
      'neonatal and infant health care services'
    ) {
      this.doctorService
        .updateImmunizationServices(immunizationServiceForm)
        .subscribe(
          (response: any) => {
            if (response.statusCode === 200 && response.data !== null) {
              this.confirmationService.alert(response.data.response, 'success');
              immunizationServiceForm.markAsPristine();
            } else {
              this.confirmationService.alert(response.errorMessage, 'error');
            }
          },
          (err) => {
            this.confirmationService.alert(err, 'error');
          },
        );
    }
  }

  getAgeValue(age: any) {
    if (!age) return 0;
    const arr = age !== undefined && age !== null ? age.trim().split(' ') : age;
    if (arr[1]) {
      const ageUnit = arr[1];
      if (ageUnit.toLowerCase() === 'years') {
        if (arr[0] === '5-6') {
          return 5 * 12 * 30;
        } else return parseInt(arr[0]) * 12 * 30;
      } else if (ageUnit.toLowerCase() === 'months') {
        if (arr[0] === '9-12') return 9 * 30;
        else if (arr[0] === '16-24') return 16 * 30;
        else return parseInt(arr[0]) * 30;
      } else if (ageUnit.toLowerCase() === 'weeks') return parseInt(arr[0]) * 7;
      else if (ageUnit.toLowerCase() === 'days') return parseInt(arr[0]);
    }
    return 0;
  }

  getBeneficiaryDetails() {
    this.beneficiaryDetailsSubscription =
      this.beneficiaryDetailsService.beneficiaryDetails$.subscribe(
        (beneficiaryDetails) => {
          if (beneficiaryDetails) {
            const calculateAgeInYears = beneficiaryDetails.age
              .split('-')[0]
              .trim();
            const calculateAgeInMonths = beneficiaryDetails.age.split('-')[1]
              ? beneficiaryDetails.age.split('-')[1].trim()
              : '';
            if (calculateAgeInMonths !== '0 months') {
              const ageInYear = this.getAgeValue(calculateAgeInYears);
              const ageInMonth = this.getAgeValue(calculateAgeInMonths);
              this.beneficiaryAge = ageInYear + ageInMonth + ' days';
            } else {
              this.beneficiaryAge = beneficiaryDetails.age.split('-')[0].trim();
            }
          }
        },
      );
  }
  getVaccines(): any {
    return (this.immunizationServicesForm.get('vaccines') as FormArray)
      .controls;
  }

  ngOnDestroy() {
    const vaccinationsList = <FormArray>(
      this.immunizationServicesForm.controls['vaccines']
    );
    while (vaccinationsList.length) {
      vaccinationsList.removeAt(0);
    }
    this.immunizationServicesForm.reset();
    if (this.nurseMasterDataSubscription)
      this.nurseMasterDataSubscription.unsubscribe();
    if (this.beneficiaryDetailsSubscription)
      this.beneficiaryDetailsSubscription.unsubscribe();
  }
}
