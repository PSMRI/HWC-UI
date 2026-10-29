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
import {
  COMMON_TEST_IMPORTS,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';
import { AuthService } from 'src/app/app-modules/core/services/auth.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { TmLogoutComponent } from './tm-logout.component';

describe('TmLogoutComponent', () => {
  let fixture: ComponentFixture<TmLogoutComponent>;
  let router: Router;
  let saved: Record<string, string>;

  beforeEach(async () => {
    saved = {};
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i) as string;
      saved[k] = sessionStorage.getItem(k) as string;
    }
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [TmLogoutComponent],
      providers: [
        ...commonTestProviders({ session: { userID: 1 } }),
        { provide: AuthService, useValue: autoSpy(AuthService) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(TmLogoutComponent);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
  });

  afterEach(() => {
    sessionStorage.clear();
    Object.entries(saved).forEach(([k, v]) => sessionStorage.setItem(k, v));
  });

  it('clears both storages and navigates to login on init', () => {
    sessionStorage.setItem('tmp-key', '1');
    const session: any = TestBed.inject(SessionStorageService);
    fixture.detectChanges();
    expect(sessionStorage.getItem('tmp-key')).toBeNull();
    expect(session.clear).toHaveBeenCalled();
    expect(session.store.size).toBe(0);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
