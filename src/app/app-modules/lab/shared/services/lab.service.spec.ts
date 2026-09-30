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
import { LabService } from './lab.service';

describe('LabService', () => {
  let service: LabService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        LabService,
        {
          provide: SessionStorageService,
          useValue: createSessionStorageMock({
            serviceLineDetails: JSON.stringify({ facilityID: 8 }),
            providerServiceID: 3,
            serviceID: 4,
          }),
        },
      ],
    });
    service = TestBed.inject(LabService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getLabWorklist GETs by provider/service/facility', () => {
    let res: any;
    service.getLabWorklist().subscribe((r) => (res = r));
    const req = httpMock.expectOne(environment.labWorklist + '3/4/8');
    expect(req.request.method).toBe('GET');
    req.flush({ statusCode: 200 });
    expect(res).toEqual({ statusCode: 200 });
  });

  it('saveLabWork POSTs the form', () => {
    service.saveLabWork({ a: 1 }).subscribe();
    const req = httpMock.expectOne(environment.labSaveWork);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ a: 1 });
    req.flush({});
  });

  it('saveFile POSTs the file', () => {
    service.saveFile({ f: 1 }).subscribe();
    const req = httpMock.expectOne(environment.saveFile);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ f: 1 });
    req.flush({});
  });

  it('viewFileContent POSTs the index', () => {
    service.viewFileContent({ fileID: 2 }).subscribe();
    const req = httpMock.expectOne(environment.viewFileData);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ fileID: 2 });
    req.flush({});
  });
});
