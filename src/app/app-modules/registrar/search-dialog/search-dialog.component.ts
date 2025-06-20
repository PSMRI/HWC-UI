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
import { Component, OnInit, ChangeDetectorRef, DoCheck } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { CommonService } from '../../core/services/common-services.service';
import { environment } from 'src/environments/environment';
import { RegistrarService } from '../shared/services/registrar.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { HttpServiceService } from '../../core/services/http-service.service';
import { SetLanguageComponent } from '../../core/components/set-language.component';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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

interface Beneficary {
  firstName: string;
  lastName: string;
  fatherName: string;
  dob: string;
  gender: string;
  genderName: string;
  govtIDtype: string;
  govtIDvalue: string;
  stateID: string;
  districtID: string;
}

@Component({
  selector: 'app-search-dialog',
  templateUrl: './search-dialog.component.html',
  styleUrls: ['./search-dialog.component.css'],
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
export class SearchDialogComponent implements OnInit, DoCheck {
  // for ID Manpulation
  masterData: any;
  masterDataSubscription: any;

  beneficiary!: Beneficary;
  states: any;
  districts: any;
  stateID: any;
  districtID: any;
  govtIDs: any;
  countryId = environment.countryId;
  currentLanguageSet: any;
  today!: Date;
  blockList: any[] = [];
  blockID: any;
  villageID: any;
  villageList: any[] = [];
  newSearchForm!: FormGroup;
  location: any;
  maxDate = new Date();

  constructor(
    private confirmationService: ConfirmationService,
    public httpServiceService: HttpServiceService,
    public matDialogRef: MatDialogRef<SearchDialogComponent>,
    public commonService: CommonService,
    private registrarService: RegistrarService,
    private changeDetectorRef: ChangeDetectorRef,
    private fb: FormBuilder,
    readonly sessionstorage: SessionStorageService,
  ) {}

  ngOnInit() {
    this.newSearchForm = this.createBeneficiaryForm();
    this.assignSelectedLanguage();
    this.callMasterDataObservable();
    this.getStatesData(); //to be called from masterobservable method layter
    this.today = new Date();
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  AfterViewChecked() {
    this.changeDetectorRef.detectChanges();
  }

  createBeneficiaryForm() {
    return this.fb.group({
      firstName: [null, Validators.required],
      lastName: [null],
      fatherName: [null],
      dob: [null],
      gender: [null, Validators.required],
      stateID: [null],
      districtID: [null],
      blockID: [null],
      villageID: [null],
    });
  }

  resetBeneficiaryForm() {
    this.newSearchForm.reset();
    this.getStatesData();
  }

  /**
   *
   * Call Master Data Observable
   */
  callMasterDataObservable() {
    this.registrarService.getRegistrationMaster(this.countryId);
    this.loadMasterDataObservable();
  }

  /**
   *
   * Load Master Data of Id Cards as Observable
   */
  loadMasterDataObservable() {
    this.masterDataSubscription =
      this.registrarService.registrationMasterDetails$.subscribe((res: any) => {
        console.log('Registrar master data', res);
        if (res !== null) {
          this.masterData = Object.assign({}, res);
          console.log(this.masterData, 'masterDataall');
          this.govtIDData();
        }
      });
  }

  /**
   * select gender Name from id
   */
  selectGender() {
    const genderMaster = this.masterData.genderMaster;
    genderMaster.forEach((element: any) => {
      if (element.genderID === this.newSearchForm.controls['gender']) {
        this.newSearchForm.controls['genderName'] = element.genderName;
      }
    });
    console.log(this.newSearchForm.controls, 'csdvde');
  }

  /**
   * combining Govt ID lists
   */

  govtIDData() {
    console.log(this.masterData, 'govtidddds');
    const govID = this.masterData.govIdEntityMaster;
    const otherGovID = this.masterData.otherGovIdEntityMaster;

    otherGovID.forEach((element: any) => {
      govID.push(element);
    });
    this.govtIDs = govID;
    console.log(this.govtIDs, 'idsss');
  }

  onIDCardSelected() {}

  /**
   * get states from this.sessionstorage and set default state
   */
  getStatesData() {
    const location: any = this.sessionstorage.getItem('location');
    this.location = JSON.parse(location);
    console.log(location, 'gotit');
    if (location) {
      this.states = this.location.stateMaster;
      if (location.otherLoc) {
        this.newSearchForm.controls['stateID'] = this.location.otherLoc.stateID;
        this.newSearchForm.controls['districtID'] =
          this.location.otherLoc.districtList[0].districtID;
        this.onStateChange();
      }
    }
  }

  onStateChange() {
    const stateIDVal: any = this.newSearchForm.controls['stateID'].value;
    if (stateIDVal) {
      this.registrarService
        .getDistrictList(stateIDVal)
        .subscribe((res: any) => {
          if (res && res.statusCode === 200) {
            this.districts = res.data;
            this.emptyDistrict();
            this.emptyBlock();
            this.emptyVillage();
          } else {
            this.confirmationService.alert(
              this.currentLanguageSet.alerts.info.issueFetching,
              'error',
            );
            this.matDialogRef.close(false);
          }
        });
    }
  }

  getDistricts(stateID: any) {
    this.commonService.getDistricts(stateID).subscribe((res) => {
      this.districts = res;
    });
  }

  beneficiaryList: any = [];
  dataObj: any;
  getSearchResult(formValues: any) {
    this.dataObj = {
      firstName: formValues.firstName,
      lastName: formValues.lastName,
      fatherName: formValues.fatherName,
      dob: formValues.dob,
      genderID: formValues.gender,
      i_bendemographics: {
        stateID: formValues.stateID,
        districtID: formValues.districtID,
        blockID: formValues.blockID,
        districtBranchID: formValues.villageID,
      },
    };
    //Passing form data to component and closing the dialog
    this.matDialogRef.close(this.dataObj);
  }

  onDistrictChange() {
    this.registrarService
      .getSubDistrictList(this.districtID)
      .subscribe((res: any) => {
        if (res && res.statusCode === 200) {
          this.blockList = res.data;
          this.emptyBlock();
          this.emptyVillage();
        } else {
          this.confirmationService.alert(
            this.currentLanguageSet.alerts.info.IssuesInFetchingDemographics,
            'error',
          );
        }
      });
  }

  onBlockChange() {
    this.registrarService.getVillageList(this.blockID).subscribe((res: any) => {
      if (res && res.statusCode === 200) {
        this.villageList = res.data;
        this.emptyVillage();
      } else {
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.IssuesInFetchingLocationDetails,
          'error',
        );
      }
    });
  }

  emptyDistrict() {
    this.districtID = null;
  }

  emptyVillage() {
    this.villageID = null;
  }

  emptyBlock() {
    this.blockID = null;
  }

  emptyState() {
    this.stateID = null;
  }
}
