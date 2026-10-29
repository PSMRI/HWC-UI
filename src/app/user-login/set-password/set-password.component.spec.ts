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

import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  flushMicrotasks,
} from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';
import { AuthService } from 'src/app/app-modules/core/services/auth.service';
import { ConfirmationService } from 'src/app/app-modules/core/services/confirmation.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { SetPasswordComponent } from './set-password.component';

describe('SetPasswordComponent', () => {
  let component: SetPasswordComponent;
  let fixture: ComponentFixture<SetPasswordComponent>;
  let auth: any;
  let confirm: any;
  let session: any;
  let router: Router;
  let navigate: jasmine.Spy;
  let saved: Record<string, string>;

  beforeEach(async () => {
    saved = {};
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i) as string;
      saved[k] = sessionStorage.getItem(k) as string;
    }
    auth = autoSpy(AuthService, { transactionId: 'tx-1' });
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [SetPasswordComponent],
      providers: [
        ...commonTestProviders({ session: { userName: 'nurse1' } }),
        { provide: AuthService, useValue: auth },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(SetPasswordComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    session = TestBed.inject(SessionStorageService);
    router = TestBed.inject(Router);
    navigate = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    fixture.detectChanges();
  });

  afterEach(() => {
    sessionStorage.clear();
    Object.entries(saved).forEach(([k, v]) => sessionStorage.setItem(k, v));
  });

  it('reads the user name on init', () => {
    expect(component.uname).toBe('nurse1');
  });

  it('toggles password visibility', () => {
    component.showPWD();
    expect(component.dynamictype).toBe('text');
    component.hidePWD();
    expect(component.dynamictype).toBe('password');
  });

  it('exposes keySize and iterationCount accessors', () => {
    component.keySize = 128;
    component.iterationCount = 5;
    expect(component.keySize).toBe(128);
    expect(component.iterationCount).toBe(5);
  });

  it('encrypt produces salt + iv + ciphertext', () => {
    const out = component.encrypt(component.Key_IV, 'Secret@1');
    expect(/^[0-9a-f]{96}.+/.test(out)).toBeTrue();
  });

  it('alerts when passwords do not match', () => {
    component.confirmpwd = 'other';
    component.updatePassword('Secret@1');
    expect(confirm.alert).toHaveBeenCalledWith(
      'Password does not match',
      'error',
    );
    expect(auth.setNewPassword).not.toHaveBeenCalled();
  });

  it('sets the new password, alerts success and logs out', fakeAsync(() => {
    sessionStorage.setItem('tmp-key', '1');
    component.confirmpwd = 'Secret@1';
    auth.setNewPassword.and.returnValue(of({ statusCode: 200 }));
    auth.logout.and.returnValue(of({}));
    component.updatePassword('Secret@1');
    const [user, pwd, tx] = auth.setNewPassword.calls.mostRecent().args;
    expect(user).toBe('nurse1');
    expect(pwd).toBe(component.password);
    expect(pwd).not.toBe('Secret@1');
    expect(tx).toBe('tx-1');
    // production code clears the transaction id eagerly (see report)
    expect(auth.transactionId).toBeUndefined();
    expect(confirm.alert).toHaveBeenCalledWith(
      'Password changed successfully',
      'success',
    );
    flushMicrotasks();
    expect(navigate).toHaveBeenCalledWith(['/login']);
    expect(session.clear).toHaveBeenCalled();
    expect(sessionStorage.getItem('tmp-key')).toBeNull();
  }));

  it('does not clear storage when navigation to login fails', fakeAsync(() => {
    navigate.and.returnValue(Promise.resolve(false));
    auth.logout.and.returnValue(of({}));
    component.logout();
    flushMicrotasks();
    expect(session.clear).not.toHaveBeenCalled();
  }));

  it('alerts and returns to reset-password on a failed response', () => {
    component.confirmpwd = 'Secret@1';
    auth.setNewPassword.and.returnValue(
      of({ statusCode: 5000, errorMessage: 'weak' }),
    );
    component.updatePassword('Secret@1');
    expect(confirm.alert).toHaveBeenCalledWith('weak', 'error');
    expect(navigate).toHaveBeenCalledWith(['/reset-password']);
  });

  it('alerts and returns to reset-password on an HTTP error', () => {
    component.confirmpwd = 'Secret@1';
    auth.setNewPassword.and.returnValue(throwingObs({ errorMessage: 'down' }));
    component.updatePassword('Secret@1');
    expect(confirm.alert).toHaveBeenCalledWith('down', 'error');
    expect(navigate).toHaveBeenCalledWith(['/reset-password']);
  });

  it('errorCallback just logs', () => {
    const log = spyOn(console, 'log');
    component.errorCallback('x');
    expect(log).toHaveBeenCalledWith('x');
  });
});
