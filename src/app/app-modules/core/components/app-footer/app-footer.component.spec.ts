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
  TestBed,
  fakeAsync,
  tick,
  discardPeriodicTasks,
} from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { AppFooterComponent } from './app-footer.component';
import { AuthService } from '../../services/auth.service';
import { SpecialistLoginComponent } from '../specialist-login/specialist-login.component';
import {
  COMMON_TEST_IMPORTS,
  commonTestProviders,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  throwingObs,
} from 'src/testing/test-utils';

describe('AppFooterComponent', () => {
  let auth: any;
  let snack: any;

  beforeEach(async () => {
    snack = {
      openFromComponent: jasmine
        .createSpy('openFromComponent')
        .and.returnValue({ afterDismissed: () => of(undefined) }),
    };
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [AppFooterComponent],
      providers: [
        ...commonTestProviders(),
        { provide: AuthService, useValue: autoSpy(AuthService) },
        { provide: MatSnackBar, useValue: snack },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    auth = TestBed.inject(AuthService);
  });

  const create = () => {
    const fx = TestBed.createComponent(AppFooterComponent);
    fx.detectChanges();
    return fx.componentInstance;
  };

  it('initialises year, language and version', fakeAsync(() => {
    auth.getUIVersionAndCommitDetails.and.returnValue(of({ version: '3.1' }));
    const c = create();
    expect(c.currentLanguageSet).toBe(LANGUAGE_EN);
    expect(c.year).toBe(new Date().getFullYear());
    expect(auth.getUIVersionAndCommitDetails).toHaveBeenCalledWith(
      'assets/git-version.json',
    );
    expect(c.version).toBe('3.1');
    expect(c.commitDetailsUI).toEqual({ version: '3.1' });
    tick(1000);
    expect(c.status).toBe(navigator.onLine);
    discardPeriodicTasks();
  }));

  it('version NA when response has no version', fakeAsync(() => {
    auth.getUIVersionAndCommitDetails.and.returnValue(of({}));
    const c = create();
    expect(c.version).toBe('NA');
    discardPeriodicTasks();
  }));

  it('version NA on error', fakeAsync(() => {
    spyOn(console, 'log');
    auth.getUIVersionAndCommitDetails.and.returnValue(throwingObs());
    const c = create();
    expect(c.version).toBe('NA');
    discardPeriodicTasks();
  }));

  it('openSnackBar opens specialist login', fakeAsync(() => {
    const c = create();
    c.openSnackBar();
    expect(snack.openFromComponent).toHaveBeenCalledWith(
      SpecialistLoginComponent,
      jasmine.objectContaining({ horizontalPosition: 'right' }),
    );
    discardPeriodicTasks();
  }));
});
