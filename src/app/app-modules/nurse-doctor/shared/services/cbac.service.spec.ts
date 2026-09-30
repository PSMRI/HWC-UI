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
import { environment } from 'src/environments/environment';
import { CbacService } from './cbac.service';

describe('CbacService', () => {
  let service: CbacService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CbacService],
    });
    service = TestBed.inject(CbacService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('fetchCbacDetails posts request to getCbacDetailsUrl', () => {
    const req = { beneficiaryRegID: 1 };
    let result: any;
    service.fetchCbacDetails(req).subscribe((r) => (result = r));
    const t = httpMock.expectOne(environment.getCbacDetailsUrl);
    expect(t.request.method).toBe('POST');
    expect(t.request.body).toEqual(req);
    t.flush({ statusCode: 200, data: { a: 1 } });
    expect(result).toEqual({ statusCode: 200, data: { a: 1 } });
  });
});
