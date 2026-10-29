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
import { CDSSService } from './cdss-service';

describe('CDSSService', () => {
  let service: CDSSService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CDSSService],
    });
    service = TestBed.inject(CDSSService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  const posts: Array<[string, keyof CDSSService, string, any]> = [
    ['getCdssQuestions', 'getCdssQuestions', 'getCdssQuestionsUrl', { q: 1 }],
    ['getCdssAnswers', 'getCdssAnswers', 'getCdssAnswersUrl', { a: 1 }],
    [
      'getSnomedCtRecord',
      'getSnomedCtRecord',
      'getSnomedCtRecordUrl',
      { s: 1 },
    ],
    [
      'getcheifComplaintSymptoms',
      'getcheifComplaintSymptoms',
      'getCheifComplaintsSymptomsUrl',
      { c: 1 },
    ],
    [
      'saveCheifComplaints',
      'saveCheifComplaints',
      'closeVisitSaveComplaintsUrl',
      { save: 1 },
    ],
    ['getDiseaseData', 'getDiseaseData', 'getDiseaseDataUrls', { d: 1 }],
  ];

  posts.forEach(([label, method, urlKey, body]) => {
    it(`${label} POSTs body to environment.${urlKey}`, () => {
      let res: any;
      (service as any)[method](body).subscribe((r: any) => (res = r));
      const t = httpMock.expectOne((environment as any)[urlKey]);
      expect(t.request.method).toBe('POST');
      expect(t.request.body).toEqual(body);
      t.flush({ statusCode: 200 });
      expect(res).toEqual({ statusCode: 200 });
    });
  });

  it('getActionMaster GETs action master url', () => {
    let res: any;
    service.getActionMaster().subscribe((r) => (res = r));
    const t = httpMock.expectOne(environment.getActionMasterUrl);
    expect(t.request.method).toBe('GET');
    t.flush({ data: [1] });
    expect(res).toEqual({ data: [1] });
  });

  it('getDiseaseName POSTs empty body', () => {
    service.getDiseaseName().subscribe();
    const t = httpMock.expectOne(environment.getDiseaseNamesUrls);
    expect(t.request.method).toBe('POST');
    expect(t.request.body).toEqual({});
    t.flush({});
  });
});
