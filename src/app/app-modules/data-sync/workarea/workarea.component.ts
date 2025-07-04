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
  ChangeDetectorRef,
  OnDestroy,
  DoCheck,
} from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { DataSyncService } from './../shared/service/data-sync.service';
import { DataSyncUtils } from '../shared/utility/data-sync-utility';
import { CanComponentDeactivate } from '../../core/services/can-deactivate-guard.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpServiceService } from '../../core/services/http-service.service';
import { SetLanguageComponent } from '../../core/components/set-language.component';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-workarea',
  templateUrl: './workarea.component.html',
  styleUrls: ['./workarea.component.css'],
})
export class WorkareaComponent
  implements OnInit, CanComponentDeactivate, DoCheck, OnDestroy
{
  generateBenIDForm!: FormGroup;
  current_language_set: any;
  blankTable: any[] = [];

  constructor(
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef,
    private confirmationService: ConfirmationService,
    private dataSyncService: DataSyncService,
    private fb: FormBuilder,
    private httpServiceService: HttpServiceService,
    readonly sessionstorage: SessionStorageService,
  ) {}

  syncTableGroupList: any = [];
  benID_Count: any;

  ngOnInit() {
    this.assignSelectedLanguage();
    if (
      this.sessionstorage.getItem('serverKey') !== null ||
      this.sessionstorage.getItem('serverKey') !== undefined
    ) {
      this.getDataSYNCGroup();
    } else {
      this.router.navigate(['datasync/sync-login']);
    }
    this.generateBenIDForm = new DataSyncUtils(this.fb).createBenIDForm();
  }
  ngDoCheck() {
    this.assignSelectedLanguage();
  }

  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }
  ngOnDestroy() {
    this.sessionstorage.removeItem('serverKey');
  }

  getDataSYNCGroup() {
    this.dataSyncService.getDataSYNCGroup().subscribe((res: any) => {
      if (res.statusCode === 200) {
        this.syncTableGroupList = this.createSyncActivity(res.data);
        console.log('syncTableGroupList', this.syncTableGroupList);
      }
    });
  }

  createSyncActivity(data: any) {
    data.forEach((element: any) => {
      element.benDetailSynced = false;
      element.visitSynced = false;
    });
    return data;
  }

  checkSelectedGroup(syncTableGroup: any) {
    console.log(syncTableGroup, 'syncTableGroup');

    if (syncTableGroup.processed === 'N') {
      if (syncTableGroup.syncTableGroupID === 1) {
        this.syncUploadData(syncTableGroup);
      } else if (syncTableGroup.syncTableGroupID === 2) {
        if (!syncTableGroup.benDetailSynced && !syncTableGroup.visitSynced) {
          this.confirmationService.alert('SYNC Beneficiary Details first');
        } else {
          this.syncUploadData(syncTableGroup);
        }
      } else if (
        !syncTableGroup.benDetailSynced &&
        !syncTableGroup.visitSynced
      ) {
        this.confirmationService.alert(
          'SYNC Beneficiary Details and Beneficiary Visit first',
        );
      } else if (
        syncTableGroup.benDetailSynced &&
        !syncTableGroup.visitSynced
      ) {
        this.confirmationService.alert('SYNC Beneficiary Visit first');
      } else {
        this.syncUploadData(syncTableGroup);
      }
    } else {
      this.confirmationService.alert('Data already synced');
    }
  }

  syncUploadData(syncTableGroup: any) {
    this.confirmationService
      .confirm('info', 'Confirm to upload data')
      .subscribe((result) => {
        if (result) {
          this.dataSyncService
            .syncUploadData(syncTableGroup.syncTableGroupID)
            .subscribe(
              (res: any) => {
                console.log(res);
                if (res.statusCode === 200) {
                  const syncTableGroups = this.syncTableGroupList;
                  this.syncTableGroupList = [];
                  this.syncTableGroupList = this.modifySYNCEDGroup(
                    syncTableGroups,
                    syncTableGroup,
                  );
                  console.log(
                    this.syncTableGroupList,
                    'this.syncTableGroupList',
                  );
                  this.confirmationService.alert(res.data.response, 'success');
                } else {
                  this.confirmationService.alert(res.errorMessage, 'error');
                }
              },
              (err) => {
                this.confirmationService.alert(err, 'error');
              },
            );
        }
      });
  }

  modifySYNCEDGroup(syncTableGroups: any, syncTableGroup: any) {
    console.log('syncTableGroup', syncTableGroup);
    syncTableGroups.forEach((element: any) => {
      if (element.syncTableGroupID === syncTableGroup.syncTableGroupID) {
        element.processed = 'D';
      }
      if (syncTableGroup.syncTableGroupID === 1) {
        element.benDetailSynced = true;
        element.visitSynced = false;
      }
      if (syncTableGroup.syncTableGroupID === 2) {
        element.benDetailSynced = true;
        element.visitSynced = true;
      }
    });
    return syncTableGroups;
  }

  showProgressBar = false;
  progressValue = 0;
  failedMasterList: any;
  intervalref: any;

  syncDownloadData() {
    this.failedMasterList = undefined;
    this.progressValue = 0;
    this.confirmationService
      .confirm('info', 'Confirm to download data')
      .subscribe((result) => {
        if (result) {
          const serviceLineDetails: any =
            this.sessionstorage.getItem('serviceLineDetails');
          const vanID = JSON.parse(serviceLineDetails).vanID;
          const reqObj = {
            vanID: vanID,
            providerServiceMapID: this.sessionstorage.getItem(
              'dataSyncProviderServiceMapID',
            ),
          };
          this.dataSyncService
            .syncDownloadData(reqObj)
            .subscribe((res: any) => {
              if (res.statusCode === 200) {
                this.showProgressBar = true;
                this.intervalref = setInterval(() => {
                  this.syncDownloadProgressStatus();
                }, 2000);
              } else {
                this.confirmationService.alert(res.errorMessage, 'error');
              }
            });
        }
      });
  }

  syncDownloadProgressStatus() {
    this.dataSyncService.syncDownloadDataProgress().subscribe((res: any) => {
      if (res.statusCode === 200 && res.data) {
        this.progressValue = res.data.percentage;

        if (this.progressValue >= 100) {
          this.failedMasterList = res.data.failedMasters.split('|');
          if (
            this.failedMasterList !== undefined &&
            this.failedMasterList !== null &&
            this.failedMasterList.length > 0 &&
            this.failedMasterList[this.failedMasterList.length - 1].trim() ===
              ''
          )
            this.failedMasterList.pop();
          this.showProgressBar = false;
          clearInterval(this.intervalref);
          this.confirmationService.alert('Master download finished');
        }
      }
    });
  }

  canDeactivate() {
    if (this.showProgressBar) {
      this.confirmationService.alert('Download in progress');
      return false;
    } else {
      return true;
    }
  }
}
