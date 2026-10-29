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
import { RouterTestingModule } from '@angular/router/testing';
import { environment } from 'src/environments/environment';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { createSessionStorageMock } from 'src/testing/test-utils';
import { ServicePointService } from './service-point.service';

describe('ServicePointService', () => {
  let service: ServicePointService;
  let http: HttpTestingController;
  let session: any;

  beforeEach(() => {
    session = createSessionStorageMock({
      providerServiceID: 11,
      userID: 42,
      facilityID: 77,
    });
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [
        ServicePointService,
        { provide: SessionStorageService, useValue: session },
      ],
    });
    service = TestBed.inject(ServicePointService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getServicePoints posts user and provider mapping', () => {
    let result: any;
    service.getServicePoints('42', '11').subscribe((r) => (result = r));
    const req = http.expectOne(environment.servicePointUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      userID: '42',
      providerServiceMapID: '11',
    });
    req.flush({ statusCode: 200 });
    expect(result).toEqual({ statusCode: 200 });
  });

  it('getMMUDemographics uses the given facility id', () => {
    service.getMMUDemographics(5).subscribe();
    const req = http.expectOne(environment.demographicsCurrentMasterUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      facilityID: 5,
      spPSMID: 11,
      userID: 42,
    });
    req.flush({});
  });

  it('getMMUDemographics falls back to the stored facility id', () => {
    service.getMMUDemographics().subscribe();
    const req = http.expectOne(environment.demographicsCurrentMasterUrl);
    expect(req.request.body.facilityID).toBe(77);
    req.flush({});
  });

  it('getSwymedMailLogin GETs with the user id', () => {
    service.getSwymedMailLogin().subscribe();
    const req = http.expectOne(environment.getSwymedMailLoginUrl + 42);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('getCdssAdminDetails GETs by provider service map id', () => {
    service.getCdssAdminDetails(11).subscribe();
    const req = http.expectOne(environment.getAdminCdssStatus + '/11');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });
});
