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
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthGuard } from './auth-guard.service';
import { AuthService } from './auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let auth: any;
  let router: any;

  beforeEach(() => {
    auth = { validateSessionKey: jasmine.createSpy() };
    router = { navigate: jasmine.createSpy('navigate') };
    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });
    guard = TestBed.inject(AuthGuard);
  });

  it('passes through valid session without navigating', () => {
    const res = { statusCode: 200, data: { ok: 1 } };
    auth.validateSessionKey.and.returnValue(of(res));
    let out: any;
    guard.canActivate({}, {}).subscribe((r) => (out = r));
    expect(out).toEqual(res);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  [
    { statusCode: 5002, data: {} },
    { statusCode: 200, data: null },
    null,
  ].forEach((res) => {
    it(`navigates to login for ${JSON.stringify(res)}`, () => {
      auth.validateSessionKey.and.returnValue(of(res));
      guard.canActivate({}, {}).subscribe();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });
});
