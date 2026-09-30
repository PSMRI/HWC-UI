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

import { FamilyTaggingService } from './familytagging.service';

describe('FamilyTaggingService', () => {
  let service: FamilyTaggingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FamilyTaggingService],
    });
    service = TestBed.inject(FamilyTaggingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getRelationShips posts spID wrapper', () => {
    let res: any;
    service.getRelationShips(7).subscribe((r) => (res = r));
    const req = httpMock.expectOne(environment.relationShipUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ spID: 7 });
    req.flush({ statusCode: 200, data: [1] });
    expect(res).toEqual({ statusCode: 200, data: [1] });
  });

  const cases: [keyof FamilyTaggingService, string][] = [
    ['saveFamilyTagging', 'saveFamilyTaggingUrl'],
    ['editFamilyTagging', 'editFamilyTaggingUrl'],
    ['untagFamilyMember', 'untagFamilyUrl'],
    ['benFamilySearch', 'familySearchUrl'],
    ['createFamilyTagging', 'createFamilyUrl'],
    ['getFamilyMemberDetails', 'getFamilyMemberUrl'],
    ['getBenFamilyDetailsByBenRegId', 'getBenFamilyDetailsUrl'],
  ];
  cases.forEach(([method, urlKey]) => {
    it(`${method} posts request body to ${urlKey}`, () => {
      const body = { a: method };
      let res: any;
      (service as any)[method](body).subscribe((r: any) => (res = r));
      const req = httpMock.expectOne((environment as any)[urlKey]);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush({ statusCode: 200 });
      expect(res.statusCode).toBe(200);
    });
  });
});
