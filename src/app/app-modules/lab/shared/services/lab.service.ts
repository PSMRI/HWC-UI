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
import { environment } from 'src/environments/environment';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Injectable()
export class LabService {
  constructor(
    private http: HttpClient,
    readonly sessionstorage: SessionStorageService,
  ) {}

  getLabWorklist() {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const fetchUrl =
      this.sessionstorage.getItem('providerServiceID') +
      `/${this.sessionstorage.getItem('serviceID')}/${vanID}`;
    return this.http.get(environment.labWorklist + fetchUrl);
  }

  saveLabWork(techForm: any) {
    return this.http.post(environment.labSaveWork, techForm);
  }

  saveFile(file: any) {
    return this.http.post(environment.saveFile, file);
  }
  viewFileContent(viewFileIndex: any) {
    return this.http.post(environment.viewFileData, viewFileIndex);
  }
}
