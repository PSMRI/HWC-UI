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
import { Component, OnInit, ViewChild, DoCheck } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { ServicePointService } from './service-point.service';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { RegistrarService } from 'src/app/app-modules/registrar/shared/services/registrar.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-service-point',
  templateUrl: './service-point.component.html',
  styleUrls: ['./service-point.component.css'],
})
export class ServicePointComponent implements OnInit, DoCheck {
  current_language_set: any;
  @ViewChild('f') form: any;
  designation: any;
  streets = [
    { id: 0, name: 'AP' },
    { id: 1, name: 'Telangana' },
    { id: 2, name: 'Assam' },
  ];
  vanServicepointDetails: any;
  servicePointsList = [];
  vansList: any[] = [];

  showVan = false;

  userId!: string;
  serviceProviderId!: string;

  servicePointName!: string;
  servicePointID!: string;
  sessionID!: string;
  vanID!: string;
  isDisabled = true;
  stateName!: string;
  districtName!: string;
  talukName!: string;
  streetName!: string;
  statesList: any = [];
  districtList: any = [];
  subDistrictList: any = [];
  stateID: any;
  state: any;
  demographicsMaster: any;
  districtID: any;
  blockID: any;
  villageList: any = [];
  districtBranchID: any;
  blockName: any;
  villageName: any;
  currVanId: any;
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private servicePointService: ServicePointService,
    private confirmationService: ConfirmationService,
    public httpServiceService: HttpServiceService,
    private registrarService: RegistrarService,
    readonly sessionstorage: SessionStorageService,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.serviceProviderId !== this.sessionstorage.getItem('providerServiceID');
    this.userId !== this.sessionstorage.getItem('userID');
    this.getServicePoint();
    this.getCdssAdminStatus();
    console.log('here at three', this.current_language_set);
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }

  resetLocalStorage() {
    this.sessionstorage.removeItem('sessionID');
    this.sessionstorage.removeItem('serviceLineDetails');
    this.sessionstorage.removeItem('vanType');
    this.sessionstorage.removeItem('location');
    this.sessionstorage.removeItem('servicePointID');
    this.sessionstorage.removeItem('servicePointName');
    this.sessionstorage.removeItem('facilityID');
  }

  getServicePoint() {
    this.route.data.subscribe(
      (res) => {
        if (
          res['servicePoints'].statusCode === 200 &&
          res['servicePoints'].data !== null
        ) {
          const data = res['servicePoints'].data;
          if (data.UserVanSpDetails) {
            this.vanServicepointDetails = data.UserVanSpDetails;
            this.currVanId = this.vanServicepointDetails[0].vanID;
            this.filterVanList(this.vanServicepointDetails);
          }
        } else if (res['servicePoints'].statusCode === 5002) {
          this.confirmationService.alert(
            res['servicePoints'].errorMessage,
            'error',
          );
        } else {
          this.confirmationService.alert(
            res['servicePoints'].errorMessage,
            'error',
          );
          this.router.navigate(['/service']);
        }
      },
      (err) => {
        this.confirmationService.alert(err, 'error');
      },
    );
  }

  filterVanList(vanServicepointDetails: any) {
    console.log('vanServicepointDetails', vanServicepointDetails);
    this.vansList = vanServicepointDetails.filter((van: any) => {
      if (van.vanSession === 3) {
        return van;
      }
    });
    this.vansList = vanServicepointDetails.filter(
      (thing: any, i: any, arr: any) =>
        arr.findIndex((t: any) => t.vanID === thing.vanID) === i,
    );
  }
  getServiceLineDetails() {
    const serviceLineDetails: any = this.vansList.filter((van: any) => {
      return this.vanID === van.vanID;
    })[0];
    this.sessionstorage.setItem(
      'serviceLineDetails',
      JSON.stringify(serviceLineDetails),
    );
    if (serviceLineDetails.facilityID)
      this.sessionstorage.setItem('facilityID', serviceLineDetails.facilityID);
    if (serviceLineDetails.servicePointID)
      this.sessionstorage.setItem(
        'servicePointID',
        serviceLineDetails.servicePointID,
      );
    if (serviceLineDetails.servicePointName)
      this.sessionstorage.setItem(
        'servicePointName',
        serviceLineDetails.servicePointName,
      );
    if (serviceLineDetails.vanSession)
      this.sessionstorage.setItem('sessionID', serviceLineDetails.vanSession);
  }

  routeToDesignation(designation: any) {
    console.log('designation', designation);
    switch (designation) {
      case 'Registrar':
        this.router.navigate(['/registrar/registration']);
        break;
      case 'Nurse':
        this.router.navigate(['/nurse-doctor/nurse-worklist']);
        break;
      case 'Doctor':
        this.router.navigate(['/nurse-doctor/doctor-worklist']);
        break;
      case 'Lab Technician':
        this.router.navigate(['/lab']);
        break;
      case 'Pharmacist':
        this.router.navigate(['/pharmacist']);
        break;
      case 'Radiologist':
        this.router.navigate(['/nurse-doctor/radiologist-worklist']);
        break;
      case 'Oncologist':
        this.router.navigate(['/nurse-doctor/oncologist-worklist']);
        break;
      default:
    }
  }

  getDemographics() {
    this.servicePointService
      .getMMUDemographics(this.currVanId)
      .subscribe((res: any) => {
        if (res && res.statusCode === 200) {
          this.saveDemographicsToStorage(res.data);
        } else {
          this.locationGathetingIssues();
        }
      });
  }

  saveDemographicsToStorage(data: any) {
    if (data) {
      if (data.stateMaster && data.stateMaster.length >= 1) {
        this.sessionstorage.setItem('location', JSON.stringify(data));
        this.goToWorkList();
      } else {
        this.locationGathetingIssues();
      }
    } else {
      this.locationGathetingIssues();
    }
    console.log('statesList', this.statesList);
    this.stateID = data.stateMaster.stateID;
  }

  setStateName(stateName: any) {
    this.stateName = stateName;
  }

  fetchDistrictsOnStateSelection(stateID: any) {
    console.log('stateID', stateID); // Add this log statement
    this.registrarService
      .getDistrictList(this.stateID)
      .subscribe((res: any) => {
        if (res && res.statusCode === 200) {
          this.districtList = res.data;
          this.blockID = null;
          this.districtBranchID = null;
        } else {
          this.confirmationService.alert(
            this.current_language_set.alerts.info.IssuesInFetchingDemographics,
            'error',
          );
        }
      });
  }

  fetchSubDistrictsOnDistrictSelection(districtID: any) {
    this.registrarService
      .getSubDistrictList(this.districtID.districtID)
      .subscribe((res: any) => {
        if (res && res.statusCode === 200) {
          this.subDistrictList = res.data;
          this.districtBranchID = null;
        } else {
          this.confirmationService.alert(
            this.current_language_set.alerts.info.IssuesInFetchingDemographics,
            'error',
          );
        }
      });
  }

  onSubDistrictChange(blockID: any) {
    this.registrarService
      .getVillageList(this.blockID.blockID)
      .subscribe((res: any) => {
        if (res && res.statusCode === 200) {
          this.villageList = res.data;
          this.districtBranchID = null;
        } else {
          this.confirmationService.alert(
            this.current_language_set.alerts.info
              .IssuesInFetchingLocationDetails,
            'error',
          );
        }
      });
  }

  saveLocationDataToStorage() {
    const locationData = {
      stateID: this.stateID,
      stateName: this.stateName,
      districtID: this.districtID.districtID,
      districtName: this.districtID.districtName,
      blockName: this.blockID.blockName,
      blockID: this.blockID.blockID,
      subDistrictID: this.districtBranchID.districtBranchID,
      villageName: this.districtBranchID.villageName,
    };

    // Convert the object into a JSON string
    const locationDataJSON = JSON.stringify(locationData);

    // Store the JSON string in this.sessionstorage
    this.sessionstorage.setItem('locationData', locationDataJSON);
    this.goToWorkList();
  }

  goToWorkList() {
    this.designation = this.sessionstorage.getItem('designation');
    this.routeToDesignation(this.designation);
  }

  locationGathetingIssues() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
    this.confirmationService.alert(
      this.current_language_set.coreComponents
        .issuesInGettingLocationTryToReLogin,
      'error',
    );
  }

  getCdssAdminStatus() {
    const psmid = this.serviceProviderId;
    this.servicePointService
      .getCdssAdminDetails(psmid)
      .subscribe((res: any) => {
        if (
          res.data !== null &&
          res.data !== undefined &&
          res.data.isCdss !== undefined &&
          res.data.isCdss !== null
        ) {
          this.sessionstorage.setItem('isCdss', res.data.isCdss);
        }
      });
  }
}
