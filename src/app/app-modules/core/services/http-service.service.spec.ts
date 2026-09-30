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
import { HttpServiceService } from './http-service.service';

describe('HttpServiceService', () => {
  let httpMock: HttpTestingController;
  let saved: string | null;

  beforeEach(() => {
    saved = localStorage.getItem('appLanguage');
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HttpServiceService],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    if (saved === null) localStorage.removeItem('appLanguage');
    else localStorage.setItem('appLanguage', saved);
  });

  it('initialises language as null when nothing stored', () => {
    localStorage.removeItem('appLanguage');
    const svc = TestBed.inject(HttpServiceService);
    let v: any = 'x';
    svc.currentLangugae$.subscribe((l) => (v = l));
    expect(svc.language).toBeNull();
    expect(v).toBeNull();
  });

  it('initialises language from localStorage', () => {
    localStorage.setItem('appLanguage', JSON.stringify({ hi: 'there' }));
    const svc = TestBed.inject(HttpServiceService);
    let v: any;
    svc.currentLangugae$.subscribe((l) => (v = l));
    expect(v).toEqual({ hi: 'there' });
  });

  it('listen/filter relays values', () => {
    const svc = TestBed.inject(HttpServiceService);
    const got: any[] = [];
    svc.listen().subscribe((v) => got.push(v));
    svc.filter('abc');
    expect(got).toEqual(['abc']);
  });

  it('fetchLanguageSet GETs language list', () => {
    const svc = TestBed.inject(HttpServiceService);
    svc.fetchLanguageSet().subscribe();
    expect(httpMock.expectOne(environment.getLanguageList).request.method).toBe(
      'GET',
    );
  });

  it('getLanguage GETs url', () => {
    const svc = TestBed.inject(HttpServiceService);
    let r: any;
    svc.getLanguage('assets/x.json').subscribe((x) => (r = x));
    httpMock.expectOne('assets/x.json').flush({ k: 1 });
    expect(r).toEqual({ k: 1 });
  });

  it('getCurrentLanguage stores and emits', () => {
    const svc = TestBed.inject(HttpServiceService);
    let v: any;
    svc.currentLangugae$.subscribe((l) => (v = l));
    svc.getCurrentLanguage({ lang: 'en' });
    expect(svc.language).toEqual({ lang: 'en' });
    expect(v).toEqual({ lang: 'en' });
    expect(JSON.parse(localStorage.getItem('appLanguage') as string)).toEqual({
      lang: 'en',
    });
  });
});
