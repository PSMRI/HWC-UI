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
import { HrpService } from './hrp.service';

describe('HrpService', () => {
  let service: HrpService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HrpService],
    });
    service = TestBed.inject(HrpService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('has sensible defaults', () => {
    expect(service.comorbidityConcurrentCondition).toEqual([]);
    expect(service.heightValue).toBeNull();
    expect(service.bloodGroup).toBeNull();
    expect(service.hemoglobin).toBeNull();
    expect(service.pastIllness).toEqual([]);
    expect(service.pastObstetric).toEqual([]);
    expect(service.checkHrpStatus).toBeFalse();
  });

  it('getHRPStatus POSTs to getHrpStatusURL', () => {
    spyOn(console, 'log');
    let res: any;
    service.getHRPStatus({ id: 1 }).subscribe((r) => (res = r));
    const t = httpMock.expectOne(environment.getHrpStatusURL);
    expect(t.request.method).toBe('POST');
    expect(t.request.body).toEqual({ id: 1 });
    t.flush({ statusCode: 200 });
    expect(res.statusCode).toBe(200);
  });

  it('getHrpForFollowUP POSTs to getHrpFollowUpURL', () => {
    service.getHrpForFollowUP({ id: 2 }).subscribe();
    const t = httpMock.expectOne(environment.getHrpFollowUpURL);
    expect(t.request.method).toBe('POST');
    expect(t.request.body).toEqual({ id: 2 });
    t.flush({});
  });

  it('setters store values', () => {
    service.setcomorbidityConcurrentConditions(['a']);
    service.setPastIllness(['b']);
    service.setHeightFromVitals(170);
    service.setBloodGroup('O+');
    service.setPastObstetric(['c']);
    service.setHemoglobinValue(11);
    expect(service.comorbidityConcurrentCondition).toEqual(['a']);
    expect(service.pastIllness).toEqual(['b']);
    expect(service.heightValue).toBe(170);
    expect(service.bloodGroup).toBe('O+');
    expect(service.pastObstetric).toEqual(['c']);
    expect(service.hemoglobin).toBe(11);
  });
});
