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
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';

import { GenerateAbhaComponentComponent } from './generate-abha-component.component';
import { RegistrarService } from '../shared/services/registrar.service';
import { HealthIdOtpGenerationComponent } from '../health-id-otp-generation/health-id-otp-generation.component';
import { BiometricAuthenticationComponent } from '../biometric-authentication/biometric-authentication.component';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  createDialogRefMock,
} from 'src/testing/test-utils';

describe('GenerateAbhaComponentComponent', () => {
  let component: GenerateAbhaComponentComponent;
  let fixture: ComponentFixture<GenerateAbhaComponentComponent>;
  let dialog: any;
  let dialogRef: any;
  let registrar: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MatRadioModule],
      declarations: [GenerateAbhaComponentComponent],
      providers: [
        ...commonTestProviders(),
        { provide: RegistrarService, useValue: autoSpy(RegistrarService) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(GenerateAbhaComponentComponent);
    component = fixture.componentInstance;
    dialog = TestBed.inject(MatDialog);
    dialogRef = TestBed.inject(MatDialogRef);
    registrar = TestBed.inject(RegistrarService);
    fixture.detectChanges();
  });

  it('should create with language and empty form', () => {
    expect(component).toBeTruthy();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.abhaGenerateForm.value).toEqual({
      modeofAbhaHealthID: null,
      aadharNumber: null,
    });
  });

  it('closeDialog closes and resets fields', () => {
    component.modeofAbhaHealthID = 'AADHAR';
    component.aadharNumber = '1';
    component.closeDialog();
    expect(dialogRef.close).toHaveBeenCalled();
    expect(component.modeofAbhaHealthID).toBeNull();
    expect(component.aadharNumber).toBeNull();
  });

  it('resetAbhaValidateForm clears form values', () => {
    component.abhaGenerateForm.patchValue({
      modeofAbhaHealthID: 'AADHAR',
      aadharNumber: '123',
    });
    component.resetAbhaValidateForm();
    expect(component.abhaGenerateForm.value).toEqual({
      modeofAbhaHealthID: null,
      aadharNumber: null,
    });
  });

  it('getAbhaValues copies form values', () => {
    component.abhaGenerateForm.patchValue({
      modeofAbhaHealthID: 'AADHAR',
      aadharNumber: '123',
    });
    component.getAbhaValues();
    expect(component.modeofAbhaHealthID).toBe('AADHAR');
    expect(component.aadharNumber).toBe('123');
  });

  it('generateABHACard with AADHAR passes ids and opens OTP dialog', () => {
    spyOn(console, 'log');
    component.abhaGenerateForm.patchValue({
      modeofAbhaHealthID: 'AADHAR',
      aadharNumber: '999',
    });
    component.generateABHACard();
    expect(dialogRef.close).toHaveBeenCalled();
    expect(registrar.passIDsToFetchOtp).toHaveBeenCalledWith({
      aadharNumber: '999',
      healthIdMode: 'AADHAR',
    });
    expect(dialog.open).toHaveBeenCalledWith(
      HealthIdOtpGenerationComponent,
      jasmine.objectContaining({
        data: { aadharNumber: '999', healthIdMode: 'AADHAR' },
      }),
    );
    expect(component.disableGenerateOTP).toBeUndefined();
  });

  it('generateABHACard with BIOMETRIC opens biometric dialog', () => {
    component.abhaGenerateForm.patchValue({ modeofAbhaHealthID: 'BIOMETRIC' });
    component.generateABHACard();
    expect(dialog.open).toHaveBeenCalledWith(
      BiometricAuthenticationComponent,
      jasmine.objectContaining({ width: '500px', disableClose: true }),
    );
    expect(registrar.passIDsToFetchOtp).not.toHaveBeenCalled();
  });

  it('generateABHACard with no mode does not open any dialog', () => {
    component.generateABHACard();
    expect(dialogRef.close).toHaveBeenCalled();
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('getOTP patches health id into otherDetailsForm when result returned', () => {
    spyOn(console, 'log');
    // NOTE: the component form has no otherDetailsForm control; add one so the
    // result branch can run (see bug report).
    component.abhaGenerateForm.addControl(
      'otherDetailsForm',
      new FormGroup({
        healthId: new FormControl(null),
        healthIdNumber: new FormControl(null),
      }),
    );
    const ref = createDialogRefMock({
      healthId: 'h@abdm',
      healthIdNumber: '12',
    });
    dialog.open.and.returnValue(ref);
    component.getOTP();
    const other = component.abhaGenerateForm.get('otherDetailsForm')!;
    expect(other.get('healthId')?.value).toBe('h@abdm');
    expect(other.get('healthId')?.disabled).toBeTrue();
    expect(other.get('healthIdNumber')?.value).toBe('12');
    expect(component.disableGenerateOTP).toBeTrue();
  });

  it('getOTP does nothing when dialog closes without result', () => {
    spyOn(console, 'log');
    dialog.open.and.returnValue(createDialogRefMock(null));
    component.getOTP();
    expect(component.disableGenerateOTP).toBeUndefined();
  });
});
