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
import { Router } from '@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { DataSyncService } from '../shared/service/data-sync.service';
import { DataSyncLoginComponent } from './data-sync-login.component';

describe('DataSyncLoginComponent', () => {
  let component: DataSyncLoginComponent;
  let fixture: ComponentFixture<DataSyncLoginComponent>;
  let dataSync: any;
  let confirm: any;
  let session: any;
  let router: Router;

  const loginRes = (services: any[]) =>
    of({
      statusCode: 200,
      data: { key: 'KEY', previlegeObj: services },
    });

  async function setup(dialogData: any) {
    dataSync = autoSpy(DataSyncService);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [DataSyncLoginComponent],
      providers: [...commonTestProviders({ dialogData })],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(DataSyncLoginComponent, {
        set: { providers: [{ provide: DataSyncService, useValue: dataSync }] },
      })
      .compileComponents();
    fixture = TestBed.createComponent(DataSyncLoginComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService) as any;
    session = TestBed.inject(SessionStorageService) as any;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();
  }

  afterEach(() => sessionStorage.removeItem('authorizeToViewTMcasesheet'));

  describe('without dialog flags', () => {
    beforeEach(async () => setup({}));

    it('initialises language and dialog injections', () => {
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
      expect(component.dialogRef).toBe(TestBed.inject(MatDialogRef));
      expect(component.data).toEqual({});
      expect(component.loginForm.value).toEqual({ userName: '', password: '' });
    });

    it('ngDoCheck re-assigns language', () => {
      component.current_language_set = undefined;
      component.ngDoCheck();
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
    });

    it('showPWD / hidePWD toggle input type', () => {
      component.showPWD();
      expect(component.dynamictype).toBe('text');
      component.hidePWD();
      expect(component.dynamictype).toBe('password');
    });

    it('keySize and iterationCount accessors', () => {
      expect(component.keySize).toBe(256);
      component.keySize = 128;
      expect(component.keySize).toBe(128);
      expect(component.iterationCount).toBe(1989);
      component.iterationCount = 10;
      expect(component.iterationCount).toBe(10);
    });

    it('encrypt returns salt(64)+iv(32)+base64 ciphertext', () => {
      component.iterationCount = 1;
      const out = component.encrypt('pass', 'secret');
      expect(out.length).toBeGreaterThan(96);
      expect(/^[0-9a-f]{96}/.test(out)).toBeTrue();
      expect(component.encrypt('pass', 'secret')).not.toBe(out);
    });

    it('alerts when credentials missing', () => {
      component.iterationCount = 1;
      component.userName = 'u';
      component.password = '';
      component.dataSyncLogin();
      expect(dataSync.dataSyncLogin).not.toHaveBeenCalled();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.usernamenPass,
      );
      expect(component.showProgressBar).toBeFalse();
    });

    it('navigates to workarea for MMU user', () => {
      component.iterationCount = 1;
      component.userName = 'u';
      component.password = 'p';
      dataSync.dataSyncLogin.and.returnValue(
        loginRes([{ serviceName: 'MMU', providerServiceMapID: 4 }]),
      );
      component.dataSyncLogin();
      expect(dataSync.dataSyncLogin).toHaveBeenCalledWith(
        'u',
        jasmine.any(String),
        false,
      );
      expect(session.setItem).toHaveBeenCalledWith('serverKey', 'KEY');
      expect(sessionStorage.getItem('authorizeToViewTMcasesheet')).toBe(
        'NotAuthorized',
      );
      expect(router.navigate).toHaveBeenCalledWith(['/datasync/workarea']);
    });

    it('rejects user without MMU privilege', () => {
      component.iterationCount = 1;
      component.userName = 'u';
      component.password = 'p';
      dataSync.dataSyncLogin.and.returnValue(loginRes([{ serviceName: 'TM' }]));
      component.dataSyncLogin();
      expect(session.removeItem).toHaveBeenCalledWith('serverKey');
      expect(confirm.alert).toHaveBeenCalledWith(
        "User doesn't have previlege to perform this activity. Please contact administrator.",
      );
      expect(component.showProgressBar).toBeFalse();
    });

    it('alerts concurrent login when data is null', () => {
      component.iterationCount = 1;
      component.userName = 'u';
      component.password = 'p';
      dataSync.dataSyncLogin.and.returnValue(
        of({ statusCode: 200, data: null }),
      );
      component.dataSyncLogin();
      expect(confirm.alert).toHaveBeenCalledWith(
        'Seems you are logged in from somewhere else, Logout from there & try back in.',
        'error',
      );
    });

    it('does nothing further on non-200', () => {
      component.iterationCount = 1;
      component.userName = 'u';
      component.password = 'p';
      dataSync.dataSyncLogin.and.returnValue(of({ statusCode: 5000 }));
      component.dataSyncLogin();
      expect(confirm.alert).not.toHaveBeenCalled();
      expect(component.showProgressBar).toBeTrue();
    });

    it('alerts on http error', () => {
      component.iterationCount = 1;
      component.userName = 'u';
      component.password = 'p';
      dataSync.dataSyncLogin.and.returnValue(
        throwingObs({ errorMessage: 'net' }),
      );
      component.dataSyncLogin();
      expect(confirm.alert).toHaveBeenCalledWith('net', 'error');
      expect(component.showProgressBar).toBeFalse();
    });

    it('closeDialog marks NotAuthorized and closes with false', () => {
      component.closeDialog();
      expect(sessionStorage.getItem('authorizeToViewTMcasesheet')).toBe(
        'NotAuthorized',
      );
      expect(component.dialogRef.close).toHaveBeenCalledWith(false);
    });
  });

  describe('with masterDowloadFirstTime', () => {
    beforeEach(async () => setup({ masterDowloadFirstTime: true }));

    it('stores provider map ID and closes dialog with true', () => {
      component.getDataSyncMMU({
        data: {
          previlegeObj: [{ serviceName: 'MMU', providerServiceMapID: 77 }],
        },
      });
      expect(session.setItem).toHaveBeenCalledWith(
        'dataSyncProviderServiceMapID',
        77,
      );
      expect(sessionStorage.getItem('authorizeToViewTMcasesheet')).toBeNull();
      expect(component.dialogRef.close).toHaveBeenCalledWith(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('with provideAuthorizationToViewTmCS', () => {
    beforeEach(async () => setup({ provideAuthorizationToViewTmCS: true }));

    it('marks Authorized and closes dialog', () => {
      component.getDataSyncMMU({
        data: {
          previlegeObj: [{ serviceName: 'MMU', providerServiceMapID: 1 }],
        },
      });
      expect(sessionStorage.getItem('authorizeToViewTMcasesheet')).toBe(
        'Authorized',
      );
      expect(component.dialogRef.close).toHaveBeenCalledWith(true);
    });
  });

  it('works without dialog providers (injector returns null)', async () => {
    dataSync = autoSpy(DataSyncService);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [DataSyncLoginComponent],
      providers: commonTestProviders().filter(
        (p: any) => p.provide !== MatDialogRef && p.provide !== MAT_DIALOG_DATA,
      ),
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(DataSyncLoginComponent, {
        set: { providers: [{ provide: DataSyncService, useValue: dataSync }] },
      })
      .compileComponents();
    const f = TestBed.createComponent(DataSyncLoginComponent);
    f.detectChanges();
    expect(f.componentInstance.dialogRef).toBeNull();
    expect(f.componentInstance.data).toBeNull();
  });
});
