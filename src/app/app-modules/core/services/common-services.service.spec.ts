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
import { CommonService } from './common-services.service';

describe('CommonService', () => {
  let service: CommonService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CommonService],
    });
    service = TestBed.inject(CommonService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getStates GETs states url', () => {
    service.getStates(1).subscribe();
    expect(httpMock.expectOne(environment.getStatesURL).request.method).toBe(
      'GET',
    );
  });

  it('getDistricts GETs districts url + stateId', () => {
    service.getDistricts(7).subscribe();
    httpMock.expectOne(environment.getDistrictsURL + 7).flush({});
    expect(service.getDistrictsURL).toBe(environment.getDistrictsURL);
  });
});
