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
  ChangeDetectorRef,
  ViewChild,
  HostListener,
  AfterViewChecked,
  DoCheck,
  OnDestroy,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { CameraService } from '../../../core/services/camera.service';
import { RegistrarService } from '../../shared/services/registrar.service';
import { BeneficiaryDetailsService } from '../../../core/services/beneficiary-details.service';
import * as moment from 'moment';
import { setTheme } from 'ngx-bootstrap/utils';
import { BsDatepickerDirective } from 'ngx-bootstrap/datepicker';
import { BsDatepickerConfig } from 'ngx-bootstrap/datepicker';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { Subscription } from 'rxjs';
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
  selector: 'app-register-personal-details',
  templateUrl: './register-personal-details.component.html',
  styleUrls: ['./register-personal-details.component.css'],
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
export class RegisterPersonalDetailsComponent
  implements OnInit, AfterViewChecked, DoCheck, OnDestroy
{
  colorTheme = 'theme-dark-blue';

  bsConfig!: Partial<BsDatepickerConfig>;
  current_language_set: any;

  _parentBenRegID: any;

  masterData: any;
  masterDataSubscription: any;
  genderCategory: any = 'Male';
  revisitData: any;
  revisitDataSubscription: any;
  maritalSubscription!: Subscription;
  MaritalStatus = false;

  @Input()
  personalDetailsForm!: FormGroup;

  @Input()
  patientRevisit!: boolean;

  @ViewChild(BsDatepickerDirective) datepicker!: BsDatepickerDirective;
  personalDataOnHealthIDSubscription!: Subscription;

  @HostListener('window:scroll')
  onScrollEvent() {
    this.datepicker.hide();
  }

  regexDob =
    /^(?:(?:31(\/|-|\.)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/|-|\.)(?:0?[1,3-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/|-|\.)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/|-|\.)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private confirmationService: ConfirmationService,
    private cameraService: CameraService,
    private registrarService: RegistrarService,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    public httpServiceService: HttpServiceService,
  ) {
    setTheme('bs4'); // or 'bs4'
  }

  ngOnInit() {
    this.setDateLimits();
    this.setDefaultAgeUnit();
    this.loadMasterDataObservable();
    this.isMaritalStatus();
    this.setPhoneSelectionEnabledByDefault();
    this.setImageChangeFlagToFalseByDefault();
    this.setCalendarConfig();
    this.assignSelectedLanguage();
    this.registrarService.changePersonalDetailsData(null);
    this.personalDataOnHealthIDSubscription =
      this.registrarService.dialogResult$.subscribe((res) => {
        if (res !== null && res !== undefined)
          this.setPersonalDetailsFromHealthId(res);
      });
  }
  setPersonalDetailsFromHealthId(res: any) {
    this.personalDetailsForm.patchValue({
      firstName: res.firstName,
      lastName: res.lastName,
      gender: res.gender,
    });
    this.onGenderSelected();
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }

  setCalendarConfig() {
    this.bsConfig = Object.assign(
      {},
      {
        containerClass: this.colorTheme,
        dateInputFormat: 'DD/MM/YYYY',
        showWeekNumbers: false,
      },
    );
  }

  ngAfterViewChecked() {
    this.changeDetectorRef.detectChanges();
  }

  ngOnDestroy() {
    if (this.masterDataSubscription) {
      this.masterDataSubscription.unsubscribe();
    }
    if (this.patientRevisit && this.revisitDataSubscription) {
      this.revisitDataSubscription.unsubscribe();
    }
    if (this.personalDataOnHealthIDSubscription) {
      this.personalDataOnHealthIDSubscription.unsubscribe();
    }
    this.registrarService.clearMaritalDetails();
  }

  setPhoneSelectionEnabledByDefault() {
    this.isMobileNoRequired = true;
    this.personalDetailsForm.patchValue({
      checked: true,
    });
  }

  setImageChangeFlagToFalseByDefault() {
    this.personalDetailsForm.patchValue({
      imageChangeFlag: false,
    });
  }
  /**
   *
   * Load Basic Master Data Observable
   */
  loadMasterDataObservable() {
    this.masterDataSubscription =
      this.registrarService.registrationMasterDetails$.subscribe((res: any) => {
        if (res !== null) {
          this.masterData = res;
          if (this.patientRevisit) {
            this.loadPersonalDataForEditing();
          }
        }
      });
  }

  validateMaritalStatusMaster(revisitData: any) {
    if (revisitData.m_gender.genderID === 3) {
      this.maritalStatusMaster = this.masterData.maritalStatusMaster;
      console.log(
        'this.maritalStatusMaster line 200',
        this.maritalStatusMaster,
      );
    } else {
      console.log(
        'this.maritalStatusMaster line 202',
        this.maritalStatusMaster,
      );
      this.maritalStatusMaster = this.masterData.maritalStatusMaster.filter(
        (maritalStatus: any) => {
          if (
            revisitData.m_gender.genderID === 1 &&
            maritalStatus.maritalStatusID !== 5
          ) {
            return maritalStatus;
          }
          if (
            revisitData.m_gender.genderID === 2 &&
            maritalStatus.maritalStatusID !== 6
          ) {
            return maritalStatus;
          }
        },
      );
    }
  }

  /**
   *
   * Load Personal Details Componen Details
   *
   */
  loadPersonalDataForEditing() {
    this.revisitDataSubscription =
      this.registrarService.beneficiaryEditDetails$.subscribe((res) => {
        if (res && res.beneficiaryID) {
          this.revisitData = Object.assign({}, res);
          this.validateMaritalStatusMaster(this.revisitData);
          this.pushEditingDatatoForm(Object.assign({}, this.revisitData));
          this.getBenImage();
        }
      });
  }

  /***
   *
   * Load Editing Data to Form
   */
  pushEditingDatatoForm(element: any) {
    console.log('element in personal 243', element);
    this.dateForCalendar = moment(element.dOB).toDate(); //calendar ngModel
    this.personalDetailsForm.patchValue({
      beneficiaryID: element.beneficiaryID,
      beneficiaryRegID: element.beneficiaryRegID,
      firstName: element.firstName,
      lastName: element.lastName,
      benAccountID: element.benAccountID,
      alternateContactNumber: this.getAlternatePhoneMaps(element.benPhoneMaps),
      phoneNo: this.getPhoneMaps(element.benPhoneMaps),
      parentRegID: `${
        (element.benPhoneMaps.length > 0 &&
          element.benPhoneMaps[0].parentBenRegID) ||
        null
      }`,
      parentRelation: `${
        (element.benPhoneMaps.length > 0 &&
          element.benPhoneMaps[0].benRelationshipID) ||
        null
      }`,
      benPhMapID: `${
        (element.benPhoneMaps.length > 0 &&
          element.benPhoneMaps[0].benPhMapID) ||
        null
      }`,
      benRelationshipType: `${
        (element.benPhoneMaps.length > 0 &&
          element.benPhoneMaps[0].benRelationshipType &&
          element.benPhoneMaps[0].benRelationshipType.benRelationshipType) ||
        null
      }`,
      gender: element.m_gender.genderID,

      genderName: element.m_gender.genderName,
      name: element.name,
      dob: moment(element.dOB).toDate(),
      maritalStatus:
        (element.maritalStatus && element.maritalStatus.maritalStatusID) ||
        null,
      maritalStatusName: `${
        (element.maritalStatus && element.maritalStatus.status) || null
      }`,
      spouseName: element.spouseName || null,
      ageAtMarriage: element.ageAtMarriage || null,
      incomeName:
        (element.i_bendemographics && element.i_bendemographics.incomeStatus) ||
        null,
      literacyStatus: element.literacyStatus || null,
      educationQualification:
        (element.i_bendemographics &&
          element.i_bendemographics.i_beneficiaryeducation &&
          element.i_bendemographics.i_beneficiaryeducation.educationID) ||
        null,
      educationQualificationName:
        (element.i_bendemographics &&
          element.i_bendemographics.i_beneficiaryeducation &&
          element.i_bendemographics.i_beneficiaryeducation.educationType) ||
        null,
      occupation:
        (element.i_bendemographics && element.i_bendemographics.occupationID) ||
        null,
      occupationOther:
        (element.i_bendemographics &&
          element.i_bendemographics.occupationName) ||
        null,
    });
    this.onGenderSelected();
    this.genderCategory = this.personalDetailsForm.value.genderName;
    this.setFullName();
    this.masterData.incomeMaster.forEach((stat: any) => {
      if (
        element.i_bendemographics.incomeStatus &&
        stat.incomeStatus === element.i_bendemographics.incomeStatus
      ) {
        this.personalDetailsForm.patchValue({
          income: stat.incomeStatusID,
        });
      }
    });

    this.dobChangeByCalender(undefined);

    if (
      element.maritalStatus.maritalStatusID === 1 ||
      element.maritalStatus.maritalStatusID === 7
    ) {
      this.enableMarriageDetails = false;
      this.clearMarriageDetails();
    } else {
      this.enableMarriageDetails = true;
    }
    this._parentBenRegID = `${
      (element.benPhoneMaps.length > 0 &&
        element.benPhoneMaps[0].parentBenRegID) ||
      null
    }`;
  }

  /**
   *
   * get ben image from api
   */
  getBenImage() {
    this.beneficiaryDetailsService
      .getBeneficiaryImage(this.revisitData.beneficiaryRegID)
      .subscribe((data: any) => {
        console.log(data, 'imagedata');
        if (data && data.benImage) {
          this.personalDetailsForm.patchValue({
            image: data.benImage,
          });
        }
      });
  }

  getPhoneMaps(phoneMap: string | any[]) {
    if (phoneMap && phoneMap.length && phoneMap.length > 0) {
      return phoneMap[0].phoneNo;
    } else {
      return null;
    }
  }

  getAlternatePhoneMaps(phoneMap: string | any[]) {
    if (phoneMap && phoneMap.length && phoneMap.length > 0) {
      return phoneMap[0].alternateContactNumber;
    } else {
      return null;
    }
  }

  /**
   *
   * Capture Image from Webcam
   *
   */
  captureImage() {
    this.cameraService.capture().subscribe((result) => {
      if (result) {
        if (this.patientRevisit) {
          this.personalDetailsForm.patchValue({
            imageChangeFlag: true,
          });
        }
        this.personalDetailsForm.patchValue({ image: result });
      }
    });
  }

  /**
   * set Date Limits for Calendar and Age
   *
   */
  today!: Date;
  minDate!: Date;
  dateForCalendar: any;
  ageLimit = 120;
  ageforMarriage = 12;
  setDateLimits() {
    this.today = new Date();
    this.minDate = new Date();
    this.minDate.setFullYear(this.today.getFullYear() - (this.ageLimit + 1));
  }

  /**
   *
   * set Default value for ageUnit to 'Year'
   */
  setDefaultAgeUnit() {
    this.personalDetailsForm.patchValue({ ageUnit: 'Years' });
  }

  /**
   * check if Mobile number is required
   *
   */
  isMobileNoRequired = true;
  checkMobileNoIsRequired(val: any) {
    if (val.checked === true) {
      this.isMobileNoRequired = true;
    } else {
      this.isMobileNoRequired = false;
    }
  }

  /**
   * check if finger print is required
   *
   */
  isFingerPrintRequired = true;
  checkFingerPrintIsRequired(val: any) {
    if (val.checked === true) {
      this.isFingerPrintRequired = true;
    } else {
      this.isFingerPrintRequired = false;
    }
  }

  /**
   *
   * Gender Selection - Transgender Confirmation
   */

  maritalStatusMaster: any = [];
  onGenderSelected() {
    const genderMaster = this.masterData.genderMaster;
    genderMaster.forEach((element: any, i: any) => {
      if (element.genderID === this.personalDetailsForm.value.gender) {
        this.personalDetailsForm.patchValue({
          genderName: element.genderName,
        });
      }
    });
    console.log(
      'this.masterData 464',

      this.masterData,
    );

    if (this.personalDetailsForm.value.gender === 3) {
      this.confirmationService
        .confirm('info', this.current_language_set.alerts.info.transGender)
        .subscribe(
          (res) => {
            if (!res) {
              this.personalDetailsForm.patchValue({
                gender: null,
                genderName: null,
              });
            } else {
              this.maritalStatusMaster = this.masterData.maritalStatusMaster;
              console.log(
                'this.maritalStatusMaster line 481',
                this.maritalStatusMaster,
              );
            }
          },
          (err) => {},
        );
    } else {
      this.maritalStatusMaster = this.masterData.maritalStatusMaster.filter(
        (maritalStatus: any) => {
          if (
            this.personalDetailsForm.value.gender === 1 &&
            maritalStatus.maritalStatusID !== 5
          ) {
            return maritalStatus;
          }

          if (
            this.personalDetailsForm.value.gender === 2 &&
            maritalStatus.maritalStatusID !== 6
          ) {
            return maritalStatus;
          }
        },
      );
      console.log(
        'this.maritalStatusMaster and masterData line 506',
        this.masterData.maritalStatusMaster,
      );
    }
  }

  /**
   * Phone Number Parent Relations
   */
  getParentDetails() {
    const searchTerm = this.personalDetailsForm.value.phoneNo;
    const searchObject = {
      beneficiaryRegID: null,
      beneficiaryID: null,
      phoneNo: null,
    };
    if (
      searchTerm !== undefined &&
      searchTerm !== null &&
      searchTerm &&
      searchTerm.trim().length === 10
    ) {
      searchObject['phoneNo'] = searchTerm;
      this.registrarService.identityQuickSearch(searchObject).subscribe(
        (beneficiaryList: any) => {
          console.log(
            'beneficiaryList ************* in  personal',
            beneficiaryList,
          );

          if (
            beneficiaryList &&
            beneficiaryList.length > 0 &&
            beneficiaryList[0].benPhoneMaps.length > 0
          ) {
            this.personalDetailsForm.patchValue({
              parentRegID: beneficiaryList[0].benPhoneMaps[0].parentBenRegID,
              parentRelation: 11,
            });
            console.log(this.personalDetailsForm.value.parentRegID);
          } else {
            this.personalDetailsForm.patchValue({
              parentRegID: null,
              parentRelation: 1,
            });
            console.log(this.personalDetailsForm.value.parentRegID);

            if (this.patientRevisit) {
              this.personalDetailsForm.patchValue({
                parentRegID: this.personalDetailsForm.value.beneficiaryRegID,
              });
              console.log(this.personalDetailsForm.value.parentRegID);
            }
          }
        },
        (error) => {
          this.confirmationService.alert(error, 'error');
          this.personalDetailsForm.patchValue({
            parentRegID: null,
            parentRelation: 1,
            phoneNo: null,
          });
        },
      );
    } else {
      if (this.patientRevisit) {
        this.personalDetailsForm.patchValue({
          parentRegID: this._parentBenRegID,
          parentRelation: null,
          phoneNo: null,
        });
      } else {
        this.personalDetailsForm.patchValue({
          parentRegID: null,
          parentRelation: null,
          phoneNo: null,
        });
      }
    }
  }
  /**
   *
   * Age Entered in Input
   */
  enableMaritalStatus = false;
  onAgeEntered() {
    const valueEntered = this.personalDetailsForm.value.age;
    if (valueEntered) {
      if (
        valueEntered > this.ageLimit &&
        this.personalDetailsForm.value.ageUnit === 'Years'
      ) {
        this.confirmationService.alert(
          this.current_language_set.alerts.info.ageRestriction,
          'info',
        );
        this.personalDetailsForm.patchValue({ age: null });
      } else {
        console.log(
          moment()
            .subtract(this.personalDetailsForm.value.ageUnit, valueEntered)
            .toDate(),
        );
        this.personalDetailsForm.patchValue({
          dob: moment()
            .subtract(this.personalDetailsForm.value.ageUnit, valueEntered)
            .toDate(),
        });
      }
    }
    this.confirmMarriageEligible();
    this.checkAgeAtMarriage();
  }

  onAgeUnitEntered() {
    const ageUnit = this.masterData.ageUnit;
    ageUnit.forEach((element: any, i: any) => {
      if (element.id === this.personalDetailsForm.value.ageUnit) {
        this.personalDetailsForm.patchValue({
          name: element.name,
        });
      }
    });
    console.log('this.masterData', ageUnit, this.masterData.ageUnit);
    if (this.personalDetailsForm.value.age !== null) {
      this.onAgeEntered();
    }
  }

  isMaritalStatus() {
    this.maritalSubscription = this.registrarService.maritalStatus$.subscribe(
      (response) => {
        if (response === true) {
          this.MaritalStatus = true;
          this.enableMaritalStatus = true;
          this.onGenderSelected();
        } else {
          this.MaritalStatus = false;
          this.enableMaritalStatus = false;
        }
      },
    );
  }

  /**
   *
   * Change Age as per changed in Calendar
   */
  dobChangeByCalender(dobval: any) {
    const date = new Date(this.dateForCalendar);
    if (
      this.dateForCalendar &&
      (dobval || dobval.length === 10) &&
      this.personalDetailsForm.controls['dob'].valid
    ) {
      const dateDiff = Date.now() - date.getTime();
      const age = new Date(dateDiff);
      const yob = Math.abs(age.getFullYear() - 1970);
      const mob = Math.abs(age.getMonth());
      const dob = Math.abs(age.getDate() - 1);
      if (yob > 0) {
        this.personalDetailsForm.patchValue({ age: yob });
        this.personalDetailsForm.patchValue({ ageUnit: 'Years' });
      } else if (mob > 0) {
        this.personalDetailsForm.patchValue({ age: mob });
        this.personalDetailsForm.patchValue({ ageUnit: 'Months' });
      } else if (dob > 0) {
        this.personalDetailsForm.patchValue({ age: dob });
        this.personalDetailsForm.patchValue({ ageUnit: 'Days' });
      }
      if (date.setHours(0, 0, 0, 0) === this.today.setHours(0, 0, 0, 0)) {
        this.personalDetailsForm.patchValue({ age: 1 });
        this.personalDetailsForm.patchValue({ ageUnit: 'Day' });
      }

      this.checkAgeAtMarriage();
      this.confirmMarriageEligible();
    } else if (dobval === 'Invalid date') {
      this.personalDetailsForm.patchValue({ dob: null });
      this.dateForCalendar = null;
      this.confirmationService.alert(
        this.current_language_set.alerts.info.invalidData,
        'info',
      );
    } else {
      this.personalDetailsForm.patchValue({ age: null });
    }
  }
  /**
   * Check Marriage Eligibility to enable Field
   *
   */
  confirmMarriageEligible() {
    if (
      this.personalDetailsForm.value.age >= this.ageforMarriage &&
      this.personalDetailsForm.value.ageUnit === 'Years'
    ) {
      this.enableMaritalStatus = true;
      this.MaritalStatus = true;
    } else {
      this.enableMaritalStatus = false;
      this.MaritalStatus = false;
      this.clearMaritalStatus();
    }
  }

  /**
   *
   * Clear Marital Status if previously entered
   */
  clearMaritalStatus() {
    if (this.personalDetailsForm.value.maritalStatus !== null) {
      this.personalDetailsForm.patchValue({
        maritalStatus: null,
        maritalStatusName: null,
      });

      this.enableMarriageDetails = false;
      this.clearMarriageDetails();
    }
  }

  /**
   * Income Status Select and get Name
   */
  onIncomeChanged() {
    const incomeMaster = this.masterData.incomeMaster;
    incomeMaster.forEach((element: any, i: any) => {
      if (element.incomeStatusID === this.personalDetailsForm.value.income) {
        this.personalDetailsForm.patchValue({
          incomeName: element.incomeStatus,
        });
      }
    });
  }

  changeLiteracyStatus() {
    const literacyStatus = this.masterData.literacyStatus;
    literacyStatus.forEach((element: any, i: any) => {
      if (
        element.literacystatusID ===
        this.personalDetailsForm.value.literacyStatus
      ) {
        this.personalDetailsForm.patchValue({
          literacystatus: element.literacystatus,
        });
      }
    });
  }

  /**
   *
   * Marital Status Changed
   */
  enableMarriageDetails = false;
  enableSpouseMandatory = false;
  onMaritalStatusChanged() {
    if (
      this.personalDetailsForm.value.maritalStatus === 1 ||
      this.personalDetailsForm.value.maritalStatus === 7
    ) {
      this.enableMarriageDetails = false;
      this.clearMarriageDetails();
    } else {
      this.enableMarriageDetails = true;
    }
    if (this.personalDetailsForm.value.maritalStatus === 2) {
      this.enableSpouseMandatory = true;
      this.clearMarriageDetails();
    } else {
      this.enableSpouseMandatory = false;
      this.clearMarriageDetails();
    }

    const maritalMaster = this.masterData.maritalStatusMaster;
    console.log('maritalMaster in line 816', maritalMaster);
    maritalMaster.forEach((element: any, i: any) => {
      if (
        element.maritalStatusID === this.personalDetailsForm.value.maritalStatus
      ) {
        this.personalDetailsForm.patchValue({
          maritalStatusName: element.status,
        });
      }
    });
  }

  /**
   * Clear Marriage Details if Entered
   *
   */
  clearMarriageDetails() {
    if (this.personalDetailsForm.value.spouseName !== null) {
      this.personalDetailsForm.patchValue({ spouseName: null });
    }
    if (this.personalDetailsForm.value.ageAtMarriage !== null) {
      this.personalDetailsForm.patchValue({ ageAtMarriage: null });
    }
  }

  /**
   *
   * check for validity of Age At Marriage with other Details
   */
  checkAgeAtMarriage() {
    if (this.personalDetailsForm.value.ageAtMarriage !== null) {
      if (this.personalDetailsForm.value.age === null) {
        this.confirmationService.alert(
          this.current_language_set.common.PleaseenterBeneficiaryagefirst,
          'info',
        );
        this.personalDetailsForm.patchValue({ ageAtMarriage: null });
      } else if (this.personalDetailsForm.value.ageUnit !== 'Years') {
        this.confirmationService.alert(
          this.current_language_set.alerts.info.marriageAge +
            ' ' +
            this.ageforMarriage +
            ' ' +
            this.current_language_set.alerts.info.years,
          'info',
        );
        this.personalDetailsForm.patchValue({ ageAtMarriage: null });
      } else if (this.personalDetailsForm.value.age < this.ageforMarriage) {
        this.confirmationService.alert(
          this.current_language_set.alerts.info.marriageAge +
            ' ' +
            this.ageforMarriage +
            ' ' +
            this.current_language_set.alerts.info.years,
          'info',
        );
        this.personalDetailsForm.patchValue({ ageAtMarriage: null });
      } else if (
        this.personalDetailsForm.value.ageAtMarriage < this.ageforMarriage
      ) {
        this.confirmationService.alert(
          this.current_language_set.alerts.info.marriageAge +
            ' ' +
            this.ageforMarriage +
            ' ' +
            this.current_language_set.alerts.info.years,
          'info',
        );
        this.personalDetailsForm.patchValue({ ageAtMarriage: null });
      } else if (
        this.personalDetailsForm.value.age -
          this.personalDetailsForm.value.ageAtMarriage <
        0
      ) {
        this.confirmationService.alert(
          this.current_language_set.common.Marriageatageismorethantheactualage,
          'info',
        );
        this.personalDetailsForm.patchValue({ ageAtMarriage: null });
      }
    }
  }

  /**
   * Occupation Name when ID is selected
   */
  getOccupationName() {
    this.masterData.occupationMaster.forEach((occupation: any) => {
      if (
        this.personalDetailsForm.value.occupation === occupation.occupationID &&
        this.personalDetailsForm.value.occupation !== 7
      ) {
        this.personalDetailsForm.patchValue({
          occupationOther: occupation.occupationType,
        });
        console.log('reached form');
      }
    });

    if (
      !this.personalDetailsForm.value.occupationOther ||
      this.personalDetailsForm.value.occupation === 7
    ) {
      this.personalDetailsForm.patchValue({
        occupationOther: null,
      });
    }
  }

  /**
   * Education Qualification when ID is selected
   */
  onEducationQualificationChanged() {
    const qualificationMaster = this.masterData.qualificationMaster;
    qualificationMaster.forEach((element: any, i: any) => {
      if (
        element.educationID ===
        this.personalDetailsForm.value.educationQualification
      ) {
        this.personalDetailsForm.patchValue({
          educationQualificationName: element.educationType,
        });
      }
    });
  }

  fname: any;
  lname: any;
  setFullName() {
    this.fname = this.personalDetailsForm.controls['firstName'].value;
    this.lname = this.personalDetailsForm.controls['lastName'].value;

    if (this.fname) {
      if (this.fname && (this.lname === undefined || this.lname === null))
        this.personalDetailsForm.patchValue({
          fullName: this.fname,
        });
      else
        this.personalDetailsForm.patchValue({
          fullName: this.fname + ' ' + this.lname,
        });
    }
    if (this.lname) {
      if (this.lname && (this.fname === undefined || this.fname === null))
        this.personalDetailsForm.patchValue({
          fullName: this.lname,
        });
      else
        this.personalDetailsForm.patchValue({
          fullName: this.fname + ' ' + this.lname,
        });
    }
  }
}
