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
import {
  MAT_SNACK_BAR_DATA,
  MatSnackBarRef,
} from '@angular/material/snack-bar';
import { SpecialistLoginComponent } from './specialist-login.component';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import {
  COMMON_TEST_IMPORTS,
  commonTestProviders,
  NO_ERRORS_SCHEMA,
} from 'src/testing/test-utils';

describe('SpecialistLoginComponent', () => {
  let fixture: ComponentFixture<SpecialistLoginComponent>;
  let component: SpecialistLoginComponent;
  let snackRef: any;
  let session: any;

  beforeEach(async () => {
    snackRef = { dismiss: jasmine.createSpy('dismiss') };
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [SpecialistLoginComponent],
      providers: [
        ...commonTestProviders(),
        { provide: MAT_SNACK_BAR_DATA, useValue: { message: 'm' } },
        { provide: MatSnackBarRef, useValue: snackRef },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    spyOn(console, 'log');
    fixture = TestBed.createComponent(SpecialistLoginComponent);
    component = fixture.componentInstance;
    session = TestBed.inject(SessionStorageService);
    fixture.detectChanges();
  });

  it('builds the login form', () => {
    expect(component.specialistTMLoginForm.value).toEqual({
      userName: null,
      password: null,
      domain: null,
    });
  });

  it('closeSnackBar(true) only dismisses', () => {
    component.closeSnackBar(true);
    expect(snackRef.dismiss).toHaveBeenCalled();
    expect(session.setItem).not.toHaveBeenCalled();
  });

  it('closeSnackBar(false) stores credentials and dismisses', () => {
    component.specialistTMLoginForm.patchValue({ userName: 'u' });
    component.closeSnackBar(false);
    expect(session.setItem).toHaveBeenCalledWith(
      'swymedLogin',
      JSON.stringify({ userName: 'u', password: null, domain: null }),
    );
    expect(snackRef.dismiss).toHaveBeenCalled();
  });

  it('show/hide password toggles input type', () => {
    component.showPWD();
    expect(component.dynamictype).toBe('text');
    component.hidePWD();
    expect(component.dynamictype).toBe('password');
  });
});
