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
import { BeneficiaryDetailsService } from './beneficiary-details.service';

describe('BeneficiaryDetailsService', () => {
  let service: BeneficiaryDetailsService;
  let httpMock: HttpTestingController;
  let latest: any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BeneficiaryDetailsService],
    });
    service = TestBed.inject(BeneficiaryDetailsService);
    httpMock = TestBed.inject(HttpTestingController);
    service.beneficiaryDetails$.subscribe((d) => (latest = d));
  });

  afterEach(() => httpMock.verify());

  it('getBeneficiaryDetails emits data on success', () => {
    service.getBeneficiaryDetails('1', '2');
    const req = httpMock.expectOne(environment.getBeneficiaryDetail);
    expect(req.request.body).toEqual({ beneficiaryRegID: '1', benFlowID: '2' });
    req.flush({ data: { name: 'x' } });
    expect(latest).toEqual({ name: 'x' });
  });

  it('getBeneficiaryDetails does not emit when no data', () => {
    service.beneficiaryDetails.next('prev');
    service.getBeneficiaryDetails('1', '2');
    httpMock.expectOne(environment.getBeneficiaryDetail).flush({});
    expect(latest).toBe('prev');
  });

  it('getBeneficiaryDetails emits null on error', () => {
    service.beneficiaryDetails.next('prev');
    service.getBeneficiaryDetails('1', '2');
    httpMock
      .expectOne(environment.getBeneficiaryDetail)
      .flush('err', { status: 500, statusText: 'x' });
    expect(latest).toBeNull();
  });

  it('getBeneficiaryImage posts regID', () => {
    service.getBeneficiaryImage('5').subscribe();
    const req = httpMock.expectOne(environment.getBeneficiaryImage);
    expect(req.request.body).toEqual({ beneficiaryRegID: '5' });
    req.flush({});
  });

  it('reset emits null', () => {
    service.beneficiaryDetails.next('a');
    service.reset();
    expect(latest).toBeNull();
  });

  it('set/reset HRP positive flag', () => {
    const flags: any[] = [];
    service.HRPPositiveFlag$.subscribe((f) => flags.push(f));
    service.setHRPPositive();
    expect(service.HRPPositive).toBe(1);
    service.resetHRPPositive();
    expect(service.HRPPositive).toBe(0);
    expect(flags).toEqual(['', 1, 0]);
  });

  it('getCBACDetails posts benRegID', () => {
    service.getCBACDetails('9').subscribe();
    const req = httpMock.expectOne(environment.getBenCBACDetails);
    expect(req.request.body).toEqual({ benRegID: '9' });
    req.flush({});
  });
});
