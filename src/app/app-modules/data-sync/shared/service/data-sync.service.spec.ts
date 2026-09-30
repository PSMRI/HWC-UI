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

import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { environment } from 'src/environments/environment';
import { createSessionStorageMock } from 'src/testing/test-utils';
import { DataSyncService } from './data-sync.service';

describe('DataSyncService', () => {
  let service: DataSyncService;
  let httpMock: HttpTestingController;
  let session: any;

  beforeEach(() => {
    session = createSessionStorageMock({
      userName: 'nurse1',
      serviceLineDetails: JSON.stringify({ vanID: 42 }),
    });
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        DataSyncService,
        { provide: SessionStorageService, useValue: session },
      ],
    });
    service = TestBed.inject(DataSyncService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getDataSYNCGroup issues a GET', () => {
    let result: any;
    service.getDataSYNCGroup().subscribe((r) => (result = r));
    const req = httpMock.expectOne(environment.getDataSYNCGroupUrl);
    expect(req.request.method).toBe('GET');
    req.flush({ statusCode: 200, data: [1] });
    expect(result).toEqual({ statusCode: 200, data: [1] });
  });

  it('dataSyncLogin posts credentials', () => {
    service.dataSyncLogin('u', 'p', true).subscribe();
    const req = httpMock.expectOne(environment.syncLoginUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      userName: 'u',
      password: 'p',
      doLogout: true,
    });
    req.flush({});
  });

  it('syncUploadData posts groupID, user and vanID from session', () => {
    service.syncUploadData(3).subscribe();
    const req = httpMock.expectOne(environment.syncDataUploadUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ groupID: 3, user: 'nurse1', vanID: 42 });
    req.flush({});
  });

  it('syncUploadData tolerates missing serviceLineDetails', () => {
    session.store.delete('serviceLineDetails');
    service.syncUploadData(1).subscribe();
    const req = httpMock.expectOne(environment.syncDataUploadUrl);
    expect(req.request.body.vanID).toBeUndefined();
    req.flush({});
  });

  it('syncDownloadData posts the request object', () => {
    service.syncDownloadData({ vanID: 1 }).subscribe();
    const req = httpMock.expectOne(environment.syncDataDownloadUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ vanID: 1 });
    req.flush({});
  });

  it('syncDownloadDataProgress issues a GET', () => {
    service.syncDownloadDataProgress().subscribe();
    const req = httpMock.expectOne(environment.syncDownloadProgressUrl);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('getVanDetailsForMasterDownload issues a GET', () => {
    service.getVanDetailsForMasterDownload().subscribe();
    const req = httpMock.expectOne(
      environment.getVanDetailsForMasterDownloadUrl,
    );
    expect(req.request.method).toBe('GET');
    req.flush({});
  });
});
