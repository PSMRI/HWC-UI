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
import { MasterdataService } from './masterdata.service';

describe('MasterdataService', () => {
  let service: MasterdataService;
  let httpMock: HttpTestingController;
  let store: Map<string, any>;

  beforeEach(() => {
    store = new Map<string, any>([
      ['beneficiaryGender', 'Female'],
      ['visitCategoryId', '7'],
      ['serviceLineDetails', JSON.stringify({ facilityID: 12 })],
    ]);
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        MasterdataService,
        {
          provide: SessionStorageService,
          useValue: {
            getItem: (k: string) => (store.has(k) ? store.get(k) : null),
          },
        },
      ],
    });
    service = TestBed.inject(MasterdataService);
    httpMock = TestBed.inject(HttpTestingController);
    spyOn(console, 'log');
  });

  afterEach(() => httpMock.verify());

  it('filter and contactfilter emit to listeners', () => {
    const got: any[] = [];
    service.listen().subscribe((v) => got.push(v));
    service.filter('a');
    service.contactfilter('b');
    expect(got).toEqual(['a', 'b']);
  });

  it('getVisitDetailMasterData publishes data', () => {
    let data: any;
    service.visitDetailMasterData$.subscribe((d) => (data = d));
    service.getVisitDetailMasterData();
    const t = httpMock.expectOne(environment.visitDetailMasterDataUrl);
    expect(t.request.method).toBe('GET');
    t.flush({ data: { v: 1 } });
    expect(data).toEqual({ v: 1 });
  });

  it('getNurseMasterData builds url with gender and publishes data', () => {
    let data: any;
    service.nurseMasterData$.subscribe((d) => (data = d));
    service.getNurseMasterData('3', 4);
    const t = httpMock.expectOne(environment.nurseMasterDataUrl + '3/4/Female');
    t.flush({ data: { n: 1 } });
    expect(data).toEqual({ n: 1 });
  });

  it('getDoctorMasterData includes facilityID when present', () => {
    let data: any;
    service.doctorMasterData$.subscribe((d) => (data = d));
    service.getDoctorMasterData('3', 4);
    const t = httpMock.expectOne(
      environment.doctorMasterDataUrl + '3/4/Female/12',
    );
    t.flush({ data: { d: 1 } });
    expect(data).toEqual({ d: 1 });
  });

  it('getDoctorMasterData defaults facilityID to 0 when null/undefined', () => {
    store.set('serviceLineDetails', JSON.stringify({ facilityID: null }));
    service.getDoctorMasterData('3', 4);
    httpMock
      .expectOne(environment.doctorMasterDataUrl + '3/4/Female/0')
      .flush({ data: 1 });
    store.set('serviceLineDetails', JSON.stringify({}));
    service.getDoctorMasterData('3', 4);
    httpMock
      .expectOne(environment.doctorMasterDataUrl + '3/4/Female/0')
      .flush({ data: 2 });
    expect(service.doctorMasterDataSource.value).toBe(2);
  });

  it('getSnomedCTRecord posts term', () => {
    service.getSnomedCTRecord('fever').subscribe();
    const t = httpMock.expectOne(environment.snomedCTRecordURL);
    expect(t.request.body).toEqual({ term: 'fever' });
    t.flush({});
  });

  it('reset clears all master data sources', () => {
    service.visitDetailMasterDataSource.next(1);
    service.nurseMasterDataSource.next(2);
    service.doctorMasterDataSource.next(3);
    service.reset();
    expect(service.visitDetailMasterDataSource.value).toBeNull();
    expect(service.nurseMasterDataSource.value).toBeNull();
    expect(service.doctorMasterDataSource.value).toBeNull();
  });

  it('getJSON GETs arbitrary url', () => {
    let r: any;
    service.getJSON('assets/x.json').subscribe((v) => (r = v));
    httpMock.expectOne('assets/x.json').flush({ ok: 1 });
    expect(r).toEqual({ ok: 1 });
  });

  it('searchDiagnosisBasedOnPageNo posts term, pageNo, type', () => {
    service.searchDiagnosisBasedOnPageNo('abc', 1, 'provisional').subscribe();
    const t = httpMock.expectOne(environment.snomedCTRecordListURL);
    expect(t.request.body).toEqual({
      term: 'abc',
      pageNo: 1,
      type: 'provisional',
    });
    t.flush({});
  });

  it('searchDiagnosisBasedOnPageNo1 posts term and pageNo', () => {
    service.searchDiagnosisBasedOnPageNo1('abc', 2).subscribe();
    const t = httpMock.expectOne(environment.snomedCTRecordListURL1);
    expect(t.request.body).toEqual({ term: 'abc', pageNo: 2 });
    t.flush({});
  });

  it('fetchCalibrationStrips posts providerServiceMapID and pageNo', () => {
    service.fetchCalibrationStrips(5, 0).subscribe();
    const t = httpMock.expectOne(environment.getCalibrationStrips);
    expect(t.request.body).toEqual({ providerServiceMapID: 5, pageNo: 0 });
    t.flush({});
  });

  it('getVaccinationTypeAndDoseMaster GETs', () => {
    service.getVaccinationTypeAndDoseMaster().subscribe();
    const t = httpMock.expectOne(environment.vaccinationTypeAndDoseMasterUrl);
    expect(t.request.method).toBe('GET');
    t.flush({});
  });

  it('getPreviousCovidVaccinationDetails posts beneficiaryRegID', () => {
    service.getPreviousCovidVaccinationDetails(9).subscribe();
    const t = httpMock.expectOne(environment.previousCovidVaccinationUrl);
    expect(t.request.body).toEqual({ beneficiaryRegID: 9 });
    t.flush({});
  });

  it('getVaccineList uses visitCategoryId from session', () => {
    service.getVaccineList(11).subscribe();
    const t = httpMock.expectOne(environment.vaccineListUrl + '11/7');
    expect(t.request.method).toBe('GET');
    t.flush({});
  });
});
