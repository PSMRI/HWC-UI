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
import { of } from 'rxjs';

import { GenerateMobileOtpGenerationComponent } from './generate-mobile-otp-generation.component';
import { RegistrarService } from '../shared/services/registrar.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

describe('GenerateMobileOtpGenerationComponent', () => {
  let component: GenerateMobileOtpGenerationComponent;
  let fixture: ComponentFixture<GenerateMobileOtpGenerationComponent>;
  let dialogRef: any;
  let confirm: any;
  let registrar: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [GenerateMobileOtpGenerationComponent],
      providers: [
        ...commonTestProviders({ dialogData: { transactionId: 'txn-1' } }),
        { provide: RegistrarService, useValue: autoSpy(RegistrarService) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      // Template's [disabled]="!form.valid" is evaluated before the `required`
      // directives register, causing ExpressionChangedAfterChecked in dev mode.
      .overrideTemplate(GenerateMobileOtpGenerationComponent, '')
      .compileComponents();
    fixture = TestBed.createComponent(GenerateMobileOtpGenerationComponent);
    component = fixture.componentInstance;
    dialogRef = TestBed.inject(MatDialogRef);
    confirm = TestBed.inject(ConfirmationService);
    registrar = TestBed.inject(RegistrarService);
    fixture.detectChanges();
    component.generateMobileOTPForm.patchValue({
      mobileNo: '9999999999',
      mobileOtp: '123456',
    });
  });

  it('should create with txnId, form, language and disableClose', () => {
    expect(component).toBeTruthy();
    expect(component.txnId).toBe('txn-1');
    expect(dialogRef.disableClose).toBeTrue();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });

  it('closeDialog closes', () => {
    component.closeDialog();
    expect(dialogRef.close).toHaveBeenCalled();
  });

  describe('onSubmitOfMobileNo', () => {
    it('sends mobile + txnId; mobile not linked -> confirm accepted enables OTP form', () => {
      registrar.checkAndGenerateMobileOTPHealthId.and.returnValue(
        of({ statusCode: 200, data: { mobileLinked: false } }),
      );
      component.onSubmitOfMobileNo();
      expect(registrar.checkAndGenerateMobileOTPHealthId).toHaveBeenCalledWith({
        mobile: '9999999999',
        txnId: 'txn-1',
      });
      expect(confirm.confirm).toHaveBeenCalledWith(
        'info',
        LANGUAGE_EN.enterOTPToVerify,
      );
      expect(component.enableMobileOTPForm).toBeTrue();
      expect(component.showProgressBar).toBeFalse();
    });

    it("mobileLinked 'false' and confirm declined keeps OTP form disabled", () => {
      confirm.confirm.and.returnValue(of(false));
      registrar.checkAndGenerateMobileOTPHealthId.and.returnValue(
        of({ statusCode: 200, data: { mobileLinked: 'false' } }),
      );
      component.onSubmitOfMobileNo();
      expect(component.enableMobileOTPForm).toBeFalse();
    });

    it('mobile linked closes dialog with data', () => {
      const data = { mobileLinked: true, healthId: 'x' };
      registrar.checkAndGenerateMobileOTPHealthId.and.returnValue(
        of({ statusCode: 200, data }),
      );
      component.onSubmitOfMobileNo();
      expect(dialogRef.close).toHaveBeenCalledWith(data);
    });

    it('non-200 alerts error message', () => {
      registrar.checkAndGenerateMobileOTPHealthId.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'bad' }),
      );
      component.onSubmitOfMobileNo();
      expect(confirm.alert).toHaveBeenCalledWith('bad', 'error');
      expect(component.showProgressBar).toBeFalse();
    });

    it('error alerts generic message', () => {
      registrar.checkAndGenerateMobileOTPHealthId.and.returnValue(
        throwingObs(),
      );
      component.onSubmitOfMobileNo();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.issueInGettingBeneficiaryABHADetails,
        'error',
      );
      expect(component.showProgressBar).toBeFalse();
    });

    it('does nothing when OTP form already enabled', () => {
      component.enableMobileOTPForm = true;
      component.onSubmitOfMobileNo();
      expect(
        registrar.checkAndGenerateMobileOTPHealthId,
      ).not.toHaveBeenCalled();
    });
  });

  describe('resendOTP', () => {
    it('success hides progress bar without alert', () => {
      registrar.checkAndGenerateMobileOTPHealthId.and.returnValue(
        of({ statusCode: 200, data: {} }),
      );
      component.resendOTP();
      expect(registrar.checkAndGenerateMobileOTPHealthId).toHaveBeenCalledWith({
        mobile: '9999999999',
        txnId: 'txn-1',
      });
      expect(component.showProgressBar).toBeFalse();
      expect(confirm.alert).not.toHaveBeenCalled();
    });

    it('non-200 alerts error', () => {
      registrar.checkAndGenerateMobileOTPHealthId.and.returnValue(
        of({ statusCode: 400, errorMessage: 'nope' }),
      );
      component.resendOTP();
      expect(confirm.alert).toHaveBeenCalledWith('nope', 'error');
    });

    it('error alerts generic message', () => {
      registrar.checkAndGenerateMobileOTPHealthId.and.returnValue(
        throwingObs(),
      );
      component.resendOTP();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.issueInGettingBeneficiaryABHADetails,
        'error',
      );
      expect(component.showProgressBar).toBeFalse();
    });
  });

  describe('verifyMobileOtp', () => {
    it('does nothing when OTP form disabled', () => {
      component.verifyMobileOtp();
      expect(registrar.verifyMobileOTPForAadhar).not.toHaveBeenCalled();
    });

    it('closes with data on success', () => {
      component.enableMobileOTPForm = true;
      registrar.verifyMobileOTPForAadhar.and.returnValue(
        of({ statusCode: 200, data: { ok: 1 } }),
      );
      component.verifyMobileOtp();
      expect(registrar.verifyMobileOTPForAadhar).toHaveBeenCalledWith({
        otp: '123456',
        txnId: 'txn-1',
      });
      expect(dialogRef.close).toHaveBeenCalledWith({ ok: 1 });
    });

    it('alerts on failure', () => {
      component.enableMobileOTPForm = true;
      registrar.verifyMobileOTPForAadhar.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'wrong otp' }),
      );
      component.verifyMobileOtp();
      expect(confirm.alert).toHaveBeenCalledWith('wrong otp', 'error');
      expect(dialogRef.close).not.toHaveBeenCalled();
    });
  });

  it('numberOnly allows digits and control chars only', () => {
    expect(component.numberOnly({ which: 50 })).toBeTrue();
    expect(component.numberOnly({ keyCode: 8 })).toBeTrue();
    expect(component.numberOnly({ which: 65 })).toBeFalse();
    expect(component.numberOnly({ keyCode: 47 })).toBeFalse();
  });
});
