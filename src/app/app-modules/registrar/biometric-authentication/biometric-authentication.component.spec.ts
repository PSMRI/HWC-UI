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
import { MatDialogRef } from '@angular/material/dialog';

import { BiometricAuthenticationComponent } from './biometric-authentication.component';
import { NO_ERRORS_SCHEMA, createDialogRefMock } from 'src/testing/test-utils';

describe('BiometricAuthenticationComponent', () => {
  let component: BiometricAuthenticationComponent;
  let fixture: ComponentFixture<BiometricAuthenticationComponent>;
  let dialogRef: any;

  beforeEach(async () => {
    dialogRef = createDialogRefMock();
    await TestBed.configureTestingModule({
      declarations: [BiometricAuthenticationComponent],
      providers: [{ provide: MatDialogRef, useValue: dialogRef }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(BiometricAuthenticationComponent);
    component = fixture.componentInstance;
    spyOn(console, 'log');
    fixture.detectChanges();
  });

  it('should create with image hidden', () => {
    expect(component).toBeTruthy();
    expect(component.enableImage).toBeFalse();
    expect(console.log).toHaveBeenCalledWith('success');
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
  });

  it('connectDevice reports device connection issue (no device response)', () => {
    component.connectDevice();
    expect(component.enableImage).toBeTrue();
    expect(component.messageInfo).toBe('Issue in connecting with the device');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h2').textContent).toContain(
      'Issue in connecting with the device',
    );
  });

  it('closeDialog closes dialog and hides image', () => {
    component.enableImage = true;
    component.closeDialog();
    expect(dialogRef.close).toHaveBeenCalled();
    expect(component.enableImage).toBeFalse();
  });
});
