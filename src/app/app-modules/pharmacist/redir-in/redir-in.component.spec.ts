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

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { HttpServiceService } from '../../core/services/http-service.service';
import { RedirInComponent } from './redir-in.component';

describe('RedirInComponent', () => {
  let component: RedirInComponent;
  let fixture: ComponentFixture<RedirInComponent>;
  let router: Router;
  let http: any;
  let confirm: any;
  let params$: BehaviorSubject<any>;

  beforeEach(async () => {
    params$ = new BehaviorSubject<any>({
      resolve: 'true',
      currentLanguage: 'English',
    });
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [RedirInComponent],
      providers: [
        ...commonTestProviders(),
        { provide: ActivatedRoute, useValue: { queryParams: params$ } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(RedirInComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    http = TestBed.inject(HttpServiceService) as any;
    http.getLanguage = jasmine
      .createSpy('getLanguage')
      .and.returnValue(of({ English: LANGUAGE_EN }));
    confirm = TestBed.inject(ConfirmationService) as any;
  });

  afterEach(() => sessionStorage.removeItem('setLanguage'));

  it('loads language file, alerts dispensed and navigates when resolved', () => {
    fixture.detectChanges();
    expect(sessionStorage.getItem('setLanguage')).toBe('English');
    expect(http.getLanguage).toHaveBeenCalledWith('./assets/English.json');
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
    expect(confirm.alert).toHaveBeenCalledWith(
      LANGUAGE_EN.itemDispensed,
      'info',
    );
    expect(router.navigate).toHaveBeenCalledWith([
      '/pharmacist/pharmacist-worklist',
    ]);
  });

  it('treats "undefined" params as unresolved / English', () => {
    params$.next({ resolve: 'undefined', currentLanguage: 'undefined' });
    fixture.detectChanges();
    expect(http.getLanguage).toHaveBeenCalledWith('./assets/English.json');
    expect(confirm.alert).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalled();
  });

  it('does not navigate when language file response is empty', () => {
    http.getLanguage.and.returnValue(of(null));
    fixture.detectChanges();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('does not navigate on language file error', () => {
    http.getLanguage.and.returnValue(throwingObs());
    fixture.detectChanges();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  it('falls back to currentLangugae$ when stored language is undefined', () => {
    const orig = Storage.prototype.getItem;
    spyOn(Storage.prototype, 'getItem').and.callFake(function (
      this: Storage,
      k: string,
    ) {
      return k === 'setLanguage' ? (undefined as any) : orig.call(this, k);
    });
    fixture.detectChanges();
    expect(http.getLanguage).not.toHaveBeenCalled();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
    expect(confirm.alert).toHaveBeenCalledWith(
      LANGUAGE_EN.itemDispensed,
      'info',
    );
    expect(router.navigate).toHaveBeenCalledWith([
      '/pharmacist/pharmacist-worklist',
    ]);
  });

  it('currentLangugae$ fallback without resolve does not alert', () => {
    params$.next({ currentLanguage: 'English' });
    const orig = Storage.prototype.getItem;
    spyOn(Storage.prototype, 'getItem').and.callFake(function (
      this: Storage,
      k: string,
    ) {
      return k === 'setLanguage' ? (undefined as any) : orig.call(this, k);
    });
    fixture.detectChanges();
    expect(confirm.alert).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalled();
  });

  it('ngDoCheck re-assigns language', () => {
    component.current_language_set = undefined;
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  describe('routeToDesignation', () => {
    [
      ['Registrar', '/registrar/registration'],
      ['Nurse', '/nurse-doctor/nurse-worklist'],
      ['Doctor', '/nurse-doctor/doctor-worklist'],
      ['Lab Technician', '/lab'],
      ['Pharmacist', '/pharmacist'],
      ['Radiologist', '/nurse-doctor/radiologist-worklist'],
      ['Oncologist', '/nurse-doctor/oncologist-worklist'],
    ].forEach(([role, url]) => {
      it(`routes ${role} to ${url}`, () => {
        component.routeToDesignation(role);
        expect(router.navigate).toHaveBeenCalledWith([url]);
      });
    });

    it('does nothing for unknown designation', () => {
      component.routeToDesignation('Janitor');
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });
});
