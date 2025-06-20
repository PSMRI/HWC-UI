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

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { environment } from 'src/environments/environment';

@Injectable()
export class DataSyncService {
  constructor(
    private http: HttpClient,
    readonly sessionstorage: SessionStorageService,
  ) {}

  getDataSYNCGroup() {
    return this.http.get(environment.getDataSYNCGroupUrl);
  }

  dataSyncLogin(userName: string, password: string, doLogout: any) {
    return this.http.post(environment.syncLoginUrl, {
      userName,
      password,
      doLogout,
    });
  }

  syncUploadData(groupID: any) {
    const req = {
      groupID: groupID,
      user: this.sessionstorage.getItem('userName'),
      vanID: JSON.parse(
        this.sessionstorage.getItem('serviceLineDetails') ?? '{}',
      )?.vanID,
    };
    console.log(req, 'reqobj');

    return this.http.post(environment.syncDataUploadUrl, req);
  }

  syncDownloadData(reqObj: any) {
    return this.http.post(environment.syncDataDownloadUrl, reqObj);
  }

  syncDownloadDataProgress() {
    return this.http.get(environment.syncDownloadProgressUrl);
  }

  getVanDetailsForMasterDownload() {
    return this.http.get(environment.getVanDetailsForMasterDownloadUrl);
  }
}
