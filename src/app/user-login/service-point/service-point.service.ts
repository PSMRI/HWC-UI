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
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Injectable({
  providedIn: 'root',
})
export class ServicePointService {
  constructor(
    private http: HttpClient,
    private router: Router,
    readonly sessionstorage: SessionStorageService,
  ) {}

  getServicePoints(userId: string, serviceProviderId: string) {
    return this.http.post(environment.servicePointUrl, {
      userID: userId,
      providerServiceMapID: serviceProviderId,
    });
  }

  getMMUDemographics(vanId?: any) {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    let vanIDJsn: any;
    let vanIDx: any;
    if (serviceLineDetails && serviceLineDetails !== '') {
      vanIDJsn = JSON.parse(serviceLineDetails);
      vanIDx = vanIDJsn.vanID;
      console.error('vanID><', vanIDx);
    }
    if (!vanIDx || vanIDx === '') {
      vanIDx = vanId;
    }
    const spPSMIDx = this.sessionstorage.getItem('providerServiceID');
    const userId = this.sessionstorage.getItem('userID');

    return this.http.post(environment.demographicsCurrentMasterUrl, {
      vanID: vanIDx,
      spPSMID: spPSMIDx,
      userID: userId,
    });
  }

  getSwymedMailLogin() {
    const userID = this.sessionstorage.getItem('userID');
    return this.http.get(environment.getSwymedMailLoginUrl + userID);
  }

  getCdssAdminDetails(providerServiceMapID: any) {
    console.error('providerServiceMapID', providerServiceMapID);
    return this.http.get(
      environment.getAdminCdssStatus + '/' + providerServiceMapID,
    );
  }
}
