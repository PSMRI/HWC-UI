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
import { PharmacistService } from './pharmacist.service';

describe('PharmacistService', () => {
  let service: PharmacistService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        PharmacistService,
        {
          provide: SessionStorageService,
          useValue: createSessionStorageMock({
            serviceLineDetails: JSON.stringify({ facilityID: 11 }),
            providerServiceID: 4,
            serviceID: 2,
          }),
        },
      ],
    });
    service = TestBed.inject(PharmacistService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getPharmacistWorklist GETs worklist by provider/service/facility', () => {
    let result: any;
    service.getPharmacistWorklist().subscribe((r) => (result = r));
    const req = httpMock.expectOne(environment.pharmacistWorklist + '4/2/11');
    expect(req.request.method).toBe('GET');
    req.flush({ statusCode: 200, data: [] });
    expect(result).toEqual({ statusCode: 200, data: [] });
  });
});
