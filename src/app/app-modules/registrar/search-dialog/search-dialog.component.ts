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
  ViewChild,
  ChangeDetectorRef,
  AfterViewChecked,
  DoCheck,
} from '@angular/core';
import {
  MatDialogRef,
  MatDialog,
  MatDialogConfig,
} from '@angular/material/dialog';
import { CommonService } from '../../core/services/common-services.service';
import { environment } from 'src/environments/environment';
import { RegistrarService } from '../shared/services/registrar.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { HttpServiceService } from '../../core/services/http-service.service';
import { SetLanguageComponent } from '../../core/component/set-language.component';

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
  @ViewChild('newSearchForm') form: any;
  currentLanguageSet: any;
  today!: Date;
  blockList: any[] = [];
  blockID: any;
  villageID: any;
  villageList: any[] = [];

  constructor(
    private confirmationService: ConfirmationService,
    public httpServiceService: HttpServiceService,
    public matDialogRef: MatDialogRef<SearchDialogComponent>,
    public commonService: CommonService,
    private registrarService: RegistrarService,
    private changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.createBeneficiaryForm();
    this.assignSelectedLanguage();
    // this.httpServiceService.currentLangugae$.subscribe(response =>this.currentLanguageSet = response);
    // Call For MAster Data which will be loaded in Sub Components
    this.callMasterDataObservable();
    // this.getStates();
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
    this.beneficiary = {
      firstName: '',
      lastName: '',
      fatherName: '',
      dob: '',
      gender: '',
      genderName: '',
      govtIDtype: '',
      govtIDvalue: '',
      stateID: '',
      districtID: '',
    };
  }

  resetBeneficiaryForm() {
    this.form.reset();
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
          // this.getStatesData();
          this.govtIDData();
        } /* else {
          this.confirmationService.alert("Not able to get required Information, try again later.", 'warn');
          this.mdDialogRef.close(false);
        } */
      });
  }

  /**
   * select gender Name from id
   */
  selectGender() {
    const genderMaster = this.masterData.genderMaster;
    genderMaster.forEach((element: any) => {
      if (element.genderID === this.beneficiary.gender) {
        this.beneficiary.genderName = element.genderName;
      }
    });
    console.log(this.beneficiary, 'csdvde');
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
    //  this.govtIDs = Object.assign({}, this.masterData.govIdEntityMaster, this.masterData.otherGovIdEntityMaster);
    console.log(this.govtIDs, 'idsss');
  }

  onIDCardSelected() {}

  /**
   * get states from localstorage and set default state
   */
  getStatesData() {
    const location: any = localStorage.getItem('location');
    console.log(location, 'gotit');
    if (location) {
      this.states = location.stateMaster;
      if (location.otherLoc) {
        this.beneficiary.stateID = location.otherLoc.stateID;
        // this.beneficiary.districtID = location.otherLoc.districtID;
        this.onStateChange();
      }
    }
  }

  onStateChange() {
    if (this.beneficiary.stateID) {
      this.registrarService
        .getDistrictList(this.beneficiary.stateID)
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
  // getStates() {
  //   this.commonService.getStates(this.countryId).subscribe(res => {this.states = res});

  // }

  getDistricts(stateID: any) {
    this.commonService.getDistricts(stateID).subscribe((res) => {
      this.districts = res;
    });
  }

  beneficiaryList: any = [];
  dataObj: any;
  getSearchResult(formValues: any) {
    // console.log(formValues,'formValues')
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
    // console.log(this.dataObj, 'daatObj')
    /*     this.dataObj.beneficiaryID = formValues.beneficiaryID;
    this.dataObj.firstName = formValues.firstName;
    this.dataObj.lastName = formValues.lastName;
    this.dataObj.phoneNo = formValues.contactNo;
    this.dataObj.aadharNo = formValues.aadharNo;
    this.dataObj.govtIdentityNo = formValues.governmentID;
    this.dataObj.stateID = null;
  if(formValues.stateID!=undefined){
      this.dataObj.stateID = formValues.stateID;
    }
    this.dataObj.districtID = null;
    if(formValues.districtID!=undefined){
      this.dataObj.districtID = formValues.districtID;
    } */
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
