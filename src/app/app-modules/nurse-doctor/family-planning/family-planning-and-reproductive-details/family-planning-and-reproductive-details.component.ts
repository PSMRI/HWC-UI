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
import { FormBuilder, FormGroup } from '@angular/forms';
import { SetLanguageComponent } from '../../../core/components/set-language.component';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { HttpServiceService } from '../../../core/services/http-service.service';
import { RegistrarService } from '../../../registrar/shared/services/registrar.service';
import { MasterdataService } from '../../shared/services/masterdata.service';
import { DoctorService } from '../../shared/services';
import { BeneficiaryDetailsService } from '../../../core/services/beneficiary-details.service';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
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
  selector: 'app-family-planning-and-reproductive-details',
  templateUrl: './family-planning-and-reproductive-details.component.html',
  styleUrls: ['./family-planning-and-reproductive-details.component.css'],
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
export class FamilyPlanningAndReproductiveComponent
  implements OnChanges, OnInit, DoCheck, OnDestroy
{
  @Input()
  familyPlanningAndReproductiveForm!: FormGroup;

  @Input()
  familyPlanningMode!: string;

  @Input()
  visitCategory!: string;

  current_language_set: any;

  today = new Date();
  maxEndDate = new Date();
  countryId = 1;
  ageUnitMaster: any;
  unitOfAges: any = [];
  genderMaster: any;
  youngestChildGenMasters: any = [];
  currentlyFPMethod: any = [];
  enableDoseFields = false;
  enablecurrentlyUsingFPOther = false;
  enableSterilizationFields = false;
  disableCurrentlyUsingFPNone = false;
  disableAllOptions = false;
  fertilityStatusOption: any = [];
  enableDispensationDetailsForm = false;
  ageUnitMasterData: any = [];
  genderMasterData: any = [];
  beneficiary: any;
  beneficiaryDetailsSubscription: any;
  beneficiaryAge = 0;
  benAgeUnit: any;
  masterDataServiceSubscription: any;
  benFamilyPlanningSubscription!: Subscription;
  attendant: any;
  bengender: any;
  constructor(
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    public httpServiceService: HttpServiceService,
    private confirmationService: ConfirmationService,
    private registrarService: RegistrarService,
    private masterdataService: MasterdataService,
    private doctorService: DoctorService,
    private route: ActivatedRoute,
    readonly sessionstorage: SessionStorageService,
  ) {}

  ngOnInit() {
    this.doctorService.setFamilyDataFetch(false);
    this.attendant = this.route.snapshot.params['attendant'];
    this.getBeneficiaryDetails();
    this.assignSelectedLanguage();
    this.getMastersOfcurrentlyFPMethod();
    /* Set Max date*/
    this.maxEndDate = new Date();
    this.today = new Date();
    this.maxEndDate.setDate(this.today.getDate() - 1);
    this.enableDispensationDetailsForm = false;

    this.doctorService.fetchFamilyDataCheck$.subscribe((responsevalue) => {
      if (responsevalue === true) {
        this.getFamilyPlanningNurseFetchDetails();
      }
    });
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }

  getBeneficiaryDetails() {
    this.beneficiaryDetailsSubscription =
      this.beneficiaryDetailsService.beneficiaryDetails$.subscribe((res) => {
        if (res !== null) {
          this.beneficiary = res;
          const beneficiary = this.beneficiary;
          this.bengender = beneficiary.genderName.toLowerCase();

          const calculateAgeInYears = beneficiary.age.split('-')[0].trim();
          const calculateAgeInMonths = beneficiary.age.split('-')[1]
            ? beneficiary.age.split('-')[1].trim()
            : '';
          const age = this.getAgeValueNew(calculateAgeInYears);
          if (age !== 0 && calculateAgeInMonths !== '0 months') {
            this.beneficiaryAge = age + 1;
          } else {
            this.beneficiaryAge = age;
          }
        }
      });
  }

  getAgeValueNew(age: any) {
    if (!age) return 0;
    const arr = age !== undefined && age !== null ? age.trim().split(' ') : age;
    this.benAgeUnit = arr[1];
    if (arr[1]) {
      const ageUnit = arr[1];
      if (ageUnit.toLowerCase() === 'years') {
        return parseInt(arr[0]);
      }
    }
    return 0;
  }

  checkWithFertilityStatus() {
    String(this.familyPlanningMode) === 'view' ||
    String(this.familyPlanningMode) === 'update'
      ? this.doctorService.familyPlanningValueChanged(true)
      : null;
    this.resetFormOnRadioSelection();
    this.resetCurrentFPOptions();

    this.familyPlanningAndReproductiveForm.patchValue({
      unitOfAge: 'Years',
    });
    this.fertilityStatusOption.filter((itemId: any) => {
      if (
        itemId.name ===
        this.familyPlanningAndReproductiveForm.controls['fertilityStatus'].value
      ) {
        this.familyPlanningAndReproductiveForm.controls[
          'fertilityStatusID'
        ].setValue(itemId.id);
      }
    });
    if (
      this.fertilityStatus !== undefined &&
      this.fertilityStatus !== null &&
      this.fertilityStatus.toLowerCase() === 'fertile'
    ) {
      this.enableDispensationDetailsForm = true;
    } else {
      this.enableDispensationDetailsForm = false;
    }
    this.doctorService.enableDispenseFlag = true;
    this.registrarService.enableDispenseOnFertility(
      this.enableDispensationDetailsForm,
    );
  }

  resetFormOnRadioSelection() {
    this.familyPlanningAndReproductiveForm.controls['parity'].reset();
    this.familyPlanningAndReproductiveForm.controls[
      'totalNoOfChildrenBorn'
    ].reset();
    this.familyPlanningAndReproductiveForm.controls[
      'totalNoOfChildrenBornFemale'
    ].reset();
    this.familyPlanningAndReproductiveForm.controls[
      'totalNoOfChildrenBornMale'
    ].reset();

    this.familyPlanningAndReproductiveForm.controls[
      'numberOfLiveChildren'
    ].reset();
    this.familyPlanningAndReproductiveForm.controls[
      'numberOfLiveChildrenFemale'
    ].reset();
    this.familyPlanningAndReproductiveForm.controls[
      'numberOfLiveChildrenMale'
    ].reset();
    this.familyPlanningAndReproductiveForm.controls[
      'ageOfYoungestChild'
    ].reset();
    this.familyPlanningAndReproductiveForm.controls['unitOfAge'].reset();
    this.familyPlanningAndReproductiveForm.controls[
      'youngestChildGender'
    ].reset();

    this.familyPlanningAndReproductiveForm.controls[
      'currentlyUsingFpMethod'
    ].reset();
    this.familyPlanningAndReproductiveForm.controls[
      'dateOfSterilization'
    ].reset();
    this.familyPlanningAndReproductiveForm.controls[
      'placeOfSterilization'
    ].reset();
    this.familyPlanningAndReproductiveForm.controls['dosesTaken'].reset();
    this.familyPlanningAndReproductiveForm.controls[
      'dateOfLastDoseTaken'
    ].reset();
    this.familyPlanningAndReproductiveForm.controls[
      'otherCurrentlyUsingFpMethod'
    ].reset();
  }

  checktotalFemaleChildrenBorn(
    totalNumberOfChildrenBornFemale: any,
    noOfLiveChildrenFemale: any,
  ) {
    const totalNoOfFemaleBorn =
      totalNumberOfChildrenBornFemale !== undefined &&
      totalNumberOfChildrenBornFemale !== null
        ? parseInt(totalNumberOfChildrenBornFemale)
        : 0;
    const totalNOOfFemaleAlive =
      noOfLiveChildrenFemale !== undefined && noOfLiveChildrenFemale !== null
        ? parseInt(noOfLiveChildrenFemale)
        : 0;
    if (
      totalNoOfFemaleBorn &&
      totalNOOfFemaleAlive &&
      totalNoOfFemaleBorn < totalNOOfFemaleAlive
    ) {
      this.confirmationService.alert(
        this.current_language_set.valueEnteredMustBeGreaterThanLivingFemale,
      );
      this.familyPlanningAndReproductiveForm.controls[
        'totalNoOfChildrenBornFemale'
      ].reset();
    }
    this.checktotalChildrenBorn();
    String(this.familyPlanningMode) === 'view' ||
    String(this.familyPlanningMode) === 'update'
      ? this.doctorService.familyPlanningValueChanged(true)
      : null;
  }

  checktotalMaleChildrenBorn(
    totalNumberOfChildrenBornMale: any,
    noOfLiveChildrenMale: any,
  ) {
    const totalNoOfMaleBorn =
      totalNumberOfChildrenBornMale !== undefined &&
      totalNumberOfChildrenBornMale !== null
        ? parseInt(totalNumberOfChildrenBornMale)
        : 0;
    const totalNOOfMaleAlive =
      noOfLiveChildrenMale !== undefined && noOfLiveChildrenMale !== null
        ? parseInt(noOfLiveChildrenMale)
        : 0;
    if (
      totalNoOfMaleBorn &&
      totalNOOfMaleAlive &&
      totalNoOfMaleBorn < totalNOOfMaleAlive
    ) {
      this.confirmationService.alert(
        this.current_language_set.valueEnteredMustBeGreaterThanLivingMale,
      );
      this.familyPlanningAndReproductiveForm.controls[
        'totalNoOfChildrenBornMale'
      ].reset();
    }
    this.checktotalChildrenBorn();
    String(this.familyPlanningMode) === 'view' ||
    String(this.familyPlanningMode) === 'update'
      ? this.doctorService.familyPlanningValueChanged(true)
      : null;
  }

  checktotalChildrenBorn() {
    const totalNoOfFemaleBorn =
      this.totalNoOfChildrenBornFemale !== undefined &&
      this.totalNoOfChildrenBornFemale !== null
        ? parseInt(this.totalNoOfChildrenBornFemale)
        : 0;
    const totalNoOfMaleBorn =
      this.totalNoOfChildrenBornMale !== undefined &&
      this.totalNoOfChildrenBornMale !== null
        ? parseInt(this.totalNoOfChildrenBornMale)
        : 0;
    if (totalNoOfFemaleBorn || totalNoOfMaleBorn) {
      this.familyPlanningAndReproductiveForm.patchValue({
        totalNoOfChildrenBorn: totalNoOfFemaleBorn + totalNoOfMaleBorn,
      });
    } else {
      this.familyPlanningAndReproductiveForm.controls[
        'totalNoOfChildrenBorn'
      ].reset();
    }
    String(this.familyPlanningMode) === 'view' ||
    String(this.familyPlanningMode) === 'update'
      ? this.doctorService.familyPlanningValueChanged(true)
      : null;
  }

  checkLiveNoOfChildrenBornFemale(
    totalNumberOfChildrenBornFemale: any,
    noOfLiveChildrenFemale: any,
  ) {
    const totalNoOfFemaleBorn =
      totalNumberOfChildrenBornFemale !== undefined &&
      totalNumberOfChildrenBornFemale !== null
        ? parseInt(totalNumberOfChildrenBornFemale)
        : 0;
    const totalNOOfFemaleAlive =
      noOfLiveChildrenFemale !== undefined && noOfLiveChildrenFemale !== null
        ? parseInt(noOfLiveChildrenFemale)
        : 0;
    if (
      totalNoOfFemaleBorn &&
      totalNOOfFemaleAlive &&
      totalNOOfFemaleAlive > totalNoOfFemaleBorn
    ) {
      this.confirmationService.alert(
        this.current_language_set.valueEnteredCannotBeGreaterFemale,
      );
      this.familyPlanningAndReproductiveForm.controls[
        'numberOfLiveChildrenFemale'
      ].reset();
    }
    this.checkLiveNoOfChildrenBorn();
    String(this.familyPlanningMode) === 'view' ||
    String(this.familyPlanningMode) === 'update'
      ? this.doctorService.familyPlanningValueChanged(true)
      : null;
  }

  checkLiveNoOfChildrenBornMale(
    totalNumberOfChildrenBornMale: any,
    noOfLiveChildrenMale: any,
  ) {
    const totalNoOfMaleBorn =
      totalNumberOfChildrenBornMale !== undefined &&
      totalNumberOfChildrenBornMale !== null
        ? parseInt(totalNumberOfChildrenBornMale)
        : 0;
    const totalNOOfMaleAlive =
      noOfLiveChildrenMale !== undefined && noOfLiveChildrenMale !== null
        ? parseInt(noOfLiveChildrenMale)
        : 0;
    if (
      totalNoOfMaleBorn &&
      totalNOOfMaleAlive &&
      totalNOOfMaleAlive > totalNoOfMaleBorn
    ) {
      this.confirmationService.alert(
        this.current_language_set.valueEnteredCannotBeGreaterMale,
      );
      this.familyPlanningAndReproductiveForm.controls[
        'numberOfLiveChildrenMale'
      ].reset();
      ` `;
    }
    this.checkLiveNoOfChildrenBorn();
    String(this.familyPlanningMode) === 'view' ||
    String(this.familyPlanningMode) === 'update'
      ? this.doctorService.familyPlanningValueChanged(true)
      : null;
  }

  checkAgeOfYoungestChildValidation(youngChildAge: any) {
    if (youngChildAge !== undefined && youngChildAge !== null) {
      const youngChildageUnit =
        this.familyPlanningAndReproductiveForm.controls['unitOfAge'].value;
      if (youngChildageUnit.toLowerCase() === this.benAgeUnit) {
        if (youngChildAge > this.beneficiaryAge) {
          this.confirmationService.alert(
            this.current_language_set.youngChildAgeShouldBeLessThanBenAge,
          );
          this.familyPlanningAndReproductiveForm.controls[
            'ageOfYoungestChild'
          ].reset();
        }
      }
    }
    String(this.familyPlanningMode) === 'view' ||
    String(this.familyPlanningMode) === 'update'
      ? this.doctorService.familyPlanningValueChanged(true)
      : null;
  }

  checkLiveNoOfChildrenBorn() {
    const totalNoOfLivingFemale =
      this.numberOfLiveChildrenFemale !== undefined &&
      this.numberOfLiveChildrenFemale !== null
        ? parseInt(this.numberOfLiveChildrenFemale)
        : 0;
    const totalNoOfLivingMale =
      this.numberOfLiveChildrenMale !== undefined &&
      this.numberOfLiveChildrenMale !== null
        ? parseInt(this.numberOfLiveChildrenMale)
        : 0;
    if (totalNoOfLivingFemale || totalNoOfLivingMale) {
      this.familyPlanningAndReproductiveForm.patchValue({
        numberOfLiveChildren: totalNoOfLivingFemale + totalNoOfLivingMale,
      });
    } else {
      this.familyPlanningAndReproductiveForm.controls[
        'numberOfLiveChildren'
      ].reset();
    }
    String(this.familyPlanningMode) === 'view' ||
    String(this.familyPlanningMode) === 'update'
      ? this.doctorService.familyPlanningValueChanged(true)
      : null;
  }
  getMastersOfcurrentlyFPMethod() {
    this.currentlyFPMethod = [];
    this.fertilityStatusOption = [];
    this.ageUnitMasterData = [];
    this.genderMasterData = [];
    this.masterDataServiceSubscription =
      this.masterdataService.nurseMasterData$.subscribe((res) => {
        if (res !== undefined && res !== null) {
          this.currentlyFPMethod = res.m_fpmethodfollowup;
          this.fertilityStatusOption = res.m_FertilityStatus;
          this.genderMasterData = res.m_gender;
          this.ageUnitMasterData = res.m_ageunits;

          this.familyPlanningAndReproductiveForm.patchValue({
            unitOfAge: 'Years',
          });
          if (String(this.familyPlanningMode) === 'view') {
            this.getFamilyPlanningNurseFetchDetails();
          }
        } else {
          console.log('Error in fetching nurse master data details');
        }
      });
  }

  checkParity() {
    if (this.parity < 1 || this.parity > 15) {
      this.confirmationService.alert(
        this.current_language_set.alerts.info.recheckValue,
      );
    }
    String(this.familyPlanningMode) === 'view' ||
    String(this.familyPlanningMode) === 'update'
      ? this.doctorService.familyPlanningValueChanged(true)
      : null;
  }
  validateNoOfChildrenBorn(noOfChildren: any) {
    if (noOfChildren < 1 || noOfChildren > 15) {
      this.confirmationService.alert(
        this.current_language_set.alerts.info.recheckValue,
      );
    }
    String(this.familyPlanningMode) === 'view' ||
    String(this.familyPlanningMode) === 'update'
      ? this.doctorService.familyPlanningValueChanged(true)
      : null;
  }
  populateDosesFieldForAntara() {
    if (
      this.currentlyUsingFpMethod !== undefined &&
      this.currentlyUsingFpMethod !== null &&
      this.currentlyUsingFpMethod.includes(
        'Injectable MPA Contraceptive (Antara)',
      )
    ) {
      this.enableDoseFields = true;
    } else {
      this.enableDoseFields = false;
      this.familyPlanningAndReproductiveForm.controls['dosesTaken'].reset();
      this.familyPlanningAndReproductiveForm.controls[
        'dateOfLastDoseTaken'
      ].reset();
    }
    String(this.familyPlanningMode) === 'view' ||
    String(this.familyPlanningMode) === 'update'
      ? this.doctorService.familyPlanningValueChanged(true)
      : null;
  }

  populateSterilizationForTubectomyOrVasectomy() {
    if (
      this.currentlyUsingFpMethod !== undefined &&
      this.currentlyUsingFpMethod !== null &&
      (this.currentlyUsingFpMethod.includes(
        'Tubectomy (Female Sterilization)',
      ) ||
        this.currentlyUsingFpMethod.includes('Vasectomy (Male sterilization)'))
    ) {
      this.enableSterilizationFields = true;
    } else {
      this.enableSterilizationFields = false;
      this.familyPlanningAndReproductiveForm.controls[
        'dateOfSterilization'
      ].reset();
      this.familyPlanningAndReproductiveForm.controls[
        'placeOfSterilization'
      ].reset();
    }
    String(this.familyPlanningMode) === 'view' ||
    String(this.familyPlanningMode) === 'update'
      ? this.doctorService.familyPlanningValueChanged(true)
      : null;
  }

  currentlyUsingFPOther() {
    if (
      this.currentlyUsingFpMethod !== undefined &&
      this.currentlyUsingFpMethod !== null &&
      this.currentlyUsingFpMethod.includes('Other')
    ) {
      this.enablecurrentlyUsingFPOther = true;
    } else {
      this.enablecurrentlyUsingFPOther = false;
      this.familyPlanningAndReproductiveForm.controls[
        'otherCurrentlyUsingFpMethod'
      ].reset();
    }
  }

  onValueChange() {
    String(this.familyPlanningMode) === 'view' ||
    String(this.familyPlanningMode) === 'update'
      ? this.doctorService.familyPlanningValueChanged(true)
      : null;
  }

  resetcurrentlyUsingFPOptions(selectedOption: any) {
    if (
      selectedOption !== undefined &&
      selectedOption !== null &&
      selectedOption.length > 0
    ) {
      if (selectedOption.includes('None')) {
        this.disableAllOptions = true;
        this.disableCurrentlyUsingFPNone = false;
      } else {
        this.disableAllOptions = false;
        this.disableCurrentlyUsingFPNone = true;
      }
    } else {
      this.disableCurrentlyUsingFPNone = false;
      this.disableAllOptions = false;
    }
    String(this.familyPlanningMode) === 'view' ||
    String(this.familyPlanningMode) === 'update'
      ? this.doctorService.familyPlanningValueChanged(true)
      : null;
  }

  get fertilityStatus() {
    return this.familyPlanningAndReproductiveForm.controls['fertilityStatus']
      .value;
  }

  get parity() {
    return this.familyPlanningAndReproductiveForm.controls['parity'].value;
  }

  get totalNoOfChildrenBorn() {
    return this.familyPlanningAndReproductiveForm.controls[
      'totalNoOfChildrenBorn'
    ].value;
  }

  get totalNoOfChildrenBornFemale() {
    return this.familyPlanningAndReproductiveForm.controls[
      'totalNoOfChildrenBornFemale'
    ].value;
  }

  get totalNoOfChildrenBornMale() {
    return this.familyPlanningAndReproductiveForm.controls[
      'totalNoOfChildrenBornMale'
    ].value;
  }

  get numberOfLiveChildren() {
    return this.familyPlanningAndReproductiveForm.controls[
      'numberOfLiveChildren'
    ].value;
  }

  get numberOfLiveChildrenFemale() {
    return this.familyPlanningAndReproductiveForm.controls[
      'numberOfLiveChildrenFemale'
    ].value;
  }

  get numberOfLiveChildrenMale() {
    return this.familyPlanningAndReproductiveForm.controls[
      'numberOfLiveChildrenMale'
    ].value;
  }

  get ageOfYoungestChild() {
    return this.familyPlanningAndReproductiveForm.controls['ageOfYoungestChild']
      .value;
  }

  get unitOfAge() {
    return this.familyPlanningAndReproductiveForm.controls['unitOfAge'].value;
  }

  get youngestChildGender() {
    return this.familyPlanningAndReproductiveForm.controls[
      'youngestChildGender'
    ].value;
  }

  get currentlyUsingFpMethod() {
    return this.familyPlanningAndReproductiveForm.controls[
      'currentlyUsingFpMethod'
    ].value;
  }

  get youngestChildGenderOther() {
    return this.familyPlanningAndReproductiveForm.controls[
      'youngestChildGenderOther'
    ].value;
  }

  get otherCurrentlyUsingFpMethod() {
    return this.familyPlanningAndReproductiveForm.controls[
      'otherCurrentlyUsingFpMethod'
    ].value;
  }

  get dateOfSterilization() {
    return this.familyPlanningAndReproductiveForm.controls[
      'dateOfSterilization'
    ].value;
  }

  get placeOfSterilization() {
    return this.familyPlanningAndReproductiveForm.controls[
      'placeOfSterilization'
    ].value;
  }

  get dosesTaken() {
    return this.familyPlanningAndReproductiveForm.controls['dosesTaken'].value;
  }

  get dateOfLastDoseTaken() {
    return this.familyPlanningAndReproductiveForm.controls[
      'dateOfLastDoseTaken'
    ].value;
  }

  ngOnChanges() {
    this.attendant = this.route.snapshot.params['attendant'];
    if (String(this.familyPlanningMode) === 'view') {
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
      const familyPlanningReproductiveData =
        this.doctorService.familyPlanningDetailsResponseFromNurse
          .familyPlanningReproductiveDetails;
      const familyPlanningReproductiveFormData = Object.assign(
        {},
        familyPlanningReproductiveData,
        {
          dateOfSterilization: new Date(
            familyPlanningReproductiveData.dateOfSterilization,
          ),
        },
        {
          dateOfLastDoseTaken: new Date(
            familyPlanningReproductiveData.dateOfLastDoseTaken,
          ),
        },
      );
      this.familyPlanningAndReproductiveForm.patchValue(
        familyPlanningReproductiveFormData,
      );
      this.populateDosesFieldForAntara();
      this.populateSterilizationForTubectomyOrVasectomy();
      this.currentlyUsingFPOther();
      this.resetcurrentlyUsingFPOptions(
        familyPlanningReproductiveData.currentlyUsingFpMethod,
      );
    }
    if (
      this.fertilityStatus !== undefined &&
      this.fertilityStatus !== null &&
      this.fertilityStatus.toLowerCase() === 'fertile'
    ) {
      this.enableDispensationDetailsForm = true;
    } else {
      this.enableDispensationDetailsForm = false;
    }
    this.registrarService.enableDispenseOnFertility(
      this.enableDispensationDetailsForm,
    );
  }

  getFamilyPlanningFetchDetailsForRevisit() {
    this.benFamilyPlanningSubscription =
      this.doctorService.benFamilyPlanningDetails$.subscribe((response) => {
        if (
          response !== undefined &&
          response !== null &&
          response.familyPlanningReproductiveDetails !== undefined &&
          response.familyPlanningReproductiveDetails !== null
        ) {
          const familyPlanningReproductiveData =
            response.familyPlanningReproductiveDetails;
          const familyPlanningReproductiveFormData = Object.assign(
            {},
            familyPlanningReproductiveData,
            {
              dateOfSterilization: new Date(
                familyPlanningReproductiveData.dateOfSterilization,
              ),
            },
            {
              dateOfLastDoseTaken: new Date(
                familyPlanningReproductiveData.dateOfLastDoseTaken,
              ),
            },
          );
          this.familyPlanningAndReproductiveForm.patchValue(
            familyPlanningReproductiveFormData,
          );
          this.populateDosesFieldForAntara();
          this.populateSterilizationForTubectomyOrVasectomy();
          this.currentlyUsingFPOther();
          this.resetcurrentlyUsingFPOptions(
            familyPlanningReproductiveFormData.currentlyUsingFpMethod,
          );
        }
        if (
          this.fertilityStatus !== undefined &&
          this.fertilityStatus !== null &&
          this.fertilityStatus.toLowerCase() === 'fertile'
        ) {
          this.enableDispensationDetailsForm = true;
        } else {
          this.enableDispensationDetailsForm = false;
        }
        this.registrarService.enableDispenseOnFertility(
          this.enableDispensationDetailsForm,
        );
        this.familyPlanningAndReproductiveForm.patchValue({ id: null });
      });
  }

  resetCurrentFPOptions() {
    this.enableDoseFields = false;
    this.enableSterilizationFields = false;
    this.enablecurrentlyUsingFPOther = false;
  }

  ngOnDestroy() {
    this.familyPlanningAndReproductiveForm.reset();
    if (this.beneficiaryDetailsSubscription)
      this.beneficiaryDetailsSubscription.unsubscribe();
    if (this.masterDataServiceSubscription)
      this.masterDataServiceSubscription.unsubscribe();
    if (this.benFamilyPlanningSubscription)
      this.benFamilyPlanningSubscription.unsubscribe();
  }
}
