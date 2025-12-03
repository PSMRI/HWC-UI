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
  ViewChild,
  AfterContentChecked,
} from '@angular/core';
import { Router, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TelemedicineService } from '../../services/telemedicine.service';
import { HttpServiceService } from '../../services/http-service.service';
import { ShowCommitAndVersionDetailsComponent } from './../show-commit-and-version-details/show-commit-and-version-details.component';
import { IotBluetoothComponent } from '../iot-bluetooth/iot-bluetooth.component';
import { IotService } from '../../services/iot.service';
import { MatDialog } from '@angular/material/dialog';
import { environment } from 'src/environments/environment';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { AmritTrackingService } from 'Common-UI/src/tracking';

@Component({
  selector: 'app-header',
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.css'],
})
export class AppHeaderComponent implements OnInit, AfterContentChecked {
  @ViewChild('activeRegistrar')
  private activeRegistrar!: RouterLinkActive;

  language_file_path: any = './assets/';
  app_language: any = 'English';
  currentLanguageSet: any;
  languageArray: any;
  status: any;
  navigation: any;
  isConnected = true;

  @Input()
  showRoles = false;

  servicePoint: any;
  userName: any;
  isAuthenticated = false;
  roles: any;

  filteredNavigation: any;
  license: any;

  updateCSSToShowActiveRegistrar = false;
  constructor(
    private router: Router,
    private auth: AuthService,
    private telemedicineService: TelemedicineService,
    private http_service: HttpServiceService,
    private dialog: MatDialog,
    public service: IotService,
    readonly sessionstorage: SessionStorageService,
    private trackingService: AmritTrackingService,
  ) {}

  ngOnInit() {
    this.updateCSSToShowActiveRegistrar = false;
    this.service.disconnectValue$.subscribe((response) => {
      response === undefined
        ? (this.isConnected = false)
        : (this.isConnected = response);
    });
    this.http_service.currentLangugae$.subscribe((response) => {
      this.currentLanguageSet = response;
    });

    this.getUIVersionAndCommitDetails();
    this.servicePoint = this.sessionstorage.getItem('servicePointName');
    this.userName = this.sessionstorage.getItem('userName');
    this.isAuthenticated =
      sessionStorage.getItem('isAuthenticated') === 'true' ? true : false;
    this.license = environment.licenseUrl;
    if (this.isAuthenticated) {
      this.fetchLanguageSet();
    }
    this.status = this.sessionstorage.getItem('providerServiceID');
  }

  ngAfterContentChecked(): void {
    if (this.activeRegistrar !== undefined && this.activeRegistrar.isActive) {
      console.log('isActive');
      this.updateCSSToShowActiveRegistrar = true;
    }
  }

  fetchLanguageSet() {
    this.http_service.fetchLanguageSet().subscribe((languageRes: any) => {
      if (
        languageRes &&
        languageRes.data !== undefined &&
        languageRes !== null
      ) {
        this.languageArray = languageRes.data;
        this.getLanguage();
      }
    });
    console.log('language array' + this.languageArray);
  }
  changeLanguage(language: any) {
    this.http_service
      .getLanguage(this.language_file_path + language + '.json')
      .subscribe(
        (response) => {
          if (response !== undefined && response !== null) {
            this.languageSuccessHandler(response, language);
          } else {
            alert(this.currentLanguageSet.alerts.info.langNotDefinesd);
          }
        },
        (error) => {
          alert(
            this.currentLanguageSet.alerts.info.comingUpWithThisLang +
              ' ' +
              language,
          );
        },
      );
  }
  getLanguage() {
    if (sessionStorage.getItem('setLanguage') !== null) {
      this.changeLanguage(sessionStorage.getItem('setLanguage'));
    } else {
      this.changeLanguage(this.app_language);
    }
  }

  languageSuccessHandler(response: any, language: any) {
    console.log('language is ', response);
    if (response === undefined) {
      alert(this.currentLanguageSet.alerts.info.langNotDefinesd);
    }

    if (response[language] !== undefined) {
      this.currentLanguageSet = response[language];
      sessionStorage.setItem('setLanguage', language);
      if (this.currentLanguageSet) {
        this.languageArray.forEach((item: any) => {
          if (item.languageName === language) {
            this.app_language = language;
          }
        });
      } else {
        this.app_language = language;
      }

      this.http_service.getCurrentLanguage(response[language]);
      this.rolenavigation();
    } else {
      alert(
        this.currentLanguageSet.alerts.info.comingUpWithThisLang +
          ' ' +
          language,
      );
    }
  }
  rolenavigation() {
    this.navigation = [
      {
        role: 'Registrar',
        label: 'Registrar',

        work: [
          {
            link: '/registrar/registration',
            label: this.currentLanguageSet.ro.registration,
          },
          {
            link: '/registrar/search',
            label: this.currentLanguageSet.ro.registration,
          },
        ],
      },
      {
        role: 'Nurse',
        link: '/nurse-doctor/nurse-worklist',
        label: this.currentLanguageSet.role_selection.Nurse,
      },
      {
        role: 'Doctor',
        link: '/nurse-doctor/doctor-worklist',
        label: this.currentLanguageSet.role_selection.Doctor,
      },
      {
        role: 'Lab Technician',
        link: '/lab/worklist',
        label: this.currentLanguageSet.role_selection.LabTechnician,
      },
      {
        role: 'Pharmacist',
        link: '/pharmacist/pharmacist-worklist',
        label: this.currentLanguageSet.role_selection.Pharmacist,
      },
      {
        role: 'Radiologist',
        link: '/nurse-doctor/radiologist-worklist',
        label: this.currentLanguageSet.role_selection.Radiologist,
      },
      {
        role: 'Oncologist',
        link: '/nurse-doctor/oncologist-worklist',
        label: this.currentLanguageSet.role_selection.Oncologist,
      },
      {
        role: 'TC Specialist',
        label: this.currentLanguageSet.common.TCSpecialist,
        work: [
          {
            link: '/nurse-doctor/tcspecialist-worklist',
            label: 'Worklist',
            labelName: this.currentLanguageSet.common.Worklist,
          },
          {
            label: 'Timesheet',
            labelName: this.currentLanguageSet.common.timeSheet,
          },
        ],
      },
      {
        role: 'DataSync',
        link: '/datasync',
        label: this.currentLanguageSet.common.dataSync,
      },
    ];
    if (this.showRoles) {
      const role: any = this.sessionstorage.getItem('role');
      this.roles = JSON.parse(role);
      if (this.roles !== undefined && this.roles !== null) {
        this.filteredNavigation = this.navigation.filter((item: any) => {
          return this.roles.includes(item.role);
        });
      }
    }
  }
  DataSync() {
    this.router.navigate(['/datasync']);
  }

  logout() {
    this.auth.logout().subscribe((res) => {
      this.router
        .navigate(['/feedback'], { queryParams: { sl: 'HWC' } })
        .then((result) => {
          if (result) {
            this.changeLanguage('English');
            this.sessionstorage.clear();
            sessionStorage.clear();
          }
        });
    });
  }
  getSwymedLogout() {
    this.auth.getSwymedLogout().subscribe((res: any) => {
      window.location.href = res.data.response;
      this.logout();
    });
  }
  navigateToTeleMedicine() {
    this.telemedicineService.routeToTeleMedecine();
  }

  commitDetailsUI: any;
  versionUI: any;
  getUIVersionAndCommitDetails() {
    const commitDetailsPath: any = 'assets/git-version.json';
    this.auth.getUIVersionAndCommitDetails(commitDetailsPath).subscribe(
      (res) => {
        console.log('res', res);
        this.commitDetailsUI = res;
        this.versionUI = this.commitDetailsUI['version'];
      },
      (err) => {
        console.log('err', err);
      },
    );
  }
  showVersionAndCommitDetails() {
    this.auth.getAPIVersionAndCommitDetails().subscribe(
      (res: any) => {
        if (res.statusCode === 200) {
          this.constructAPIAndUIDetails(res.data);
        }
      },
      (err) => {},
    );
  }
  constructAPIAndUIDetails(apiVersionAndCommitDetails: any) {
    const data = {
      commitDetailsUI: {
        version: this.commitDetailsUI['version'],
        commit: this.commitDetailsUI['commit'],
      },
      commitDetailsAPI: {
        version: apiVersionAndCommitDetails['git.build.version'] || 'NA',
        commit: apiVersionAndCommitDetails['git.commit.id'] || 'NA',
      },
    };
    if (data) {
      this.showData(data);
    }
  }
  showData(versionData: any) {
    this.dialog.open(ShowCommitAndVersionDetailsComponent, {
      data: versionData,
    });
  }

  openIOT() {
    this.dialog.open(IotBluetoothComponent, {
      width: '600px',
    });
  }

  trackFieldInteraction(fieldName: string) {
    this.trackingService.trackFieldInteraction(fieldName, 'Roles');
  }
}
