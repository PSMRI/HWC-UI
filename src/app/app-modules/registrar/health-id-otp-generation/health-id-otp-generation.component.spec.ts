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
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { BehaviorSubject, of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  createDialogRefMock,
  throwingObs,
} from 'src/testing/test-utils';
import { ServicePointService } from 'src/app/user-login/service-point/service-point.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { GenerateMobileOtpGenerationComponent } from '../generate-mobile-otp-generation/generate-mobile-otp-generation.component';
import { SetPasswordForAbhaComponent } from '../set-password-for-abha/set-password-for-abha.component';
import { HealthIdValidateComponent } from '../registration/register-other-details/register-other-details.component';
import { RegistrarService } from '../shared/services/registrar.service';
import {
  HealthIdOtpGenerationComponent,
  HealthIdOtpSuccessComponent,
} from './health-id-otp-generation.component';

const LOCATION = {
  stateMaster: [
    { govtLGDStateID: 29, stateID: 10, stateName: 'Karnataka' },
    { govtLGDStateID: 30, stateID: 11, stateName: 'Kerala' },
  ],
};

describe('Registrar HealthIdOtpGenerationComponent', () => {
  let component: HealthIdOtpGenerationComponent;
  let fixture: ComponentFixture<HealthIdOtpGenerationComponent>;
  let registrar: any;
  let confirm: any;
  let dialogRef: any;
  let dialog: any;
  let master: BehaviorSubject<any>;

  async function setup(data: any) {
    master = new BehaviorSubject<any>({
      genderMaster: [
        { genderID: 1, genderName: 'Male' },
        { genderID: 2, genderName: 'Female' },
        { genderID: 3, genderName: 'Transgender' },
      ],
    });
    registrar = autoSpy(RegistrarService, {
      registrationMasterDetails$: master.asObservable(),
    });
    registrar.generateOTP.and.returnValue(
      of({ statusCode: 200, data: { mobile: '99xx', txnId: 'T1' } }),
    );
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [HealthIdOtpGenerationComponent],
      providers: [
        ...commonTestProviders({
          session: {
            userName: 'reg1',
            providerServiceID: 4,
            location: JSON.stringify(LOCATION),
          },
        }),
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: RegistrarService, useValue: registrar },
        {
          provide: ServicePointService,
          useValue: autoSpy(ServicePointService),
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(HealthIdOtpGenerationComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    dialogRef = TestBed.inject(MatDialogRef);
    dialog = TestBed.inject(MatDialog);
    fixture.detectChanges();
  }

  afterEach(() => fixture?.destroy());

  describe('MOBILE mode', () => {
    beforeEach(async () => {
      await setup({ mobileNumber: '9999999999', healthIdMode: 'MOBILE' });
    });

    it('initialises forms without sending OTP', () => {
      expect(dialogRef.disableClose).toBeTrue();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.healthIdMobileForm.value).toEqual({ mobileNo: null });
      expect(component.healthIdOTPForm.value).toEqual({ otp: null });
      expect(component.enablehealthIdOTPForm).toBeFalse();
      expect(registrar.generateOTP).not.toHaveBeenCalled();
    });

    it('numberOnly accepts digits and control chars only', () => {
      expect(component.numberOnly({ which: 50 })).toBeTrue();
      expect(component.numberOnly({ keyCode: 8 })).toBeTrue();
      expect(component.numberOnly({ which: 65 })).toBeFalse();
    });

    it('enableMobileNo toggles alternate number and resets form', () => {
      component.enableMobileNo({ checked: true });
      expect(component.altNum).toBeTrue();
      component.healthIdMobileForm.patchValue({ mobileNo: '1' });
      component.enableMobileNo({ checked: false });
      expect(component.altNum).toBeFalse();
      expect(component.healthIdMobileForm.value.mobileNo).toBeNull();
    });

    it('closeDialog closes', () => {
      component.closeDialog();
      expect(dialogRef.close).toHaveBeenCalledWith();
    });

    it('getHealthIdOtp sends OTP to default mobile', () => {
      component.getHealthIdOtp();
      expect(registrar.generateOTP).toHaveBeenCalledWith(
        { mobile: '9999999999' },
        'MOBILE',
      );
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.OTPSentToMobNo + '99xx',
        'success',
      );
      expect(component.transactionId).toBe('T1');
      expect(component.enablehealthIdOTPForm).toBeTrue();
      expect(component.showProgressBar).toBeFalse();
    });

    it('getHealthIdOtp uses alternate mobile number', () => {
      component.altNum = true;
      component.healthIdMobileForm.patchValue({ mobileNo: '8888888888' });
      component.getHealthIdOtp();
      expect(registrar.generateOTP).toHaveBeenCalledWith(
        { mobile: '8888888888' },
        'MOBILE',
      );
    });

    it('getHealthIdOtp disables OTP form on failure', () => {
      registrar.generateOTP.and.returnValue(
        of({ statusCode: 500, errorMessage: 'bad' }),
      );
      component.getHealthIdOtp();
      expect(confirm.alert).toHaveBeenCalledWith('bad', 'error');
      expect(component.enablehealthIdOTPForm).toBeFalse();
    });

    it('getHealthIdOtp disables OTP form on error', () => {
      registrar.generateOTP.and.returnValue(throwingObs({ errorMessage: 'x' }));
      component.getHealthIdOtp();
      expect(confirm.alert).toHaveBeenCalledWith('x', 'error');
      expect(component.enablehealthIdOTPForm).toBeFalse();
      expect(component.showProgressBar).toBeFalse();
    });

    it('getHealthIdOtpForInitial alerts mobile number on success', () => {
      component.altNum = true;
      component.healthIdMobileForm.patchValue({ mobileNo: '7777777777' });
      component.getHealthIdOtpForInitial();
      expect(registrar.generateOTP).toHaveBeenCalledWith(
        { mobile: '7777777777' },
        'MOBILE',
      );
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.OTPSentToMobNo + '99xx',
        'success',
      );
    });

    it('getHealthIdOtpForInitial closes and alerts on failure', () => {
      registrar.generateOTP.and.returnValue(
        of({ statusCode: 500, errorMessage: 'nope' }),
      );
      component.getHealthIdOtpForInitial();
      expect(dialogRef.close).toHaveBeenCalled();
      expect(confirm.alert).toHaveBeenCalledWith('nope', 'error');
    });

    it('getHealthIdOtpForInitial closes and alerts on error', () => {
      registrar.generateOTP.and.returnValue(throwingObs());
      component.getHealthIdOtpForInitial();
      expect(dialogRef.close).toHaveBeenCalled();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.issueInGettingBeneficiaryABHADetails,
        'error',
      );
    });

    it('checkOTP validates numeric 4..32 length', () => {
      const set = (v: any) => component.healthIdOTPForm.patchValue({ otp: v });
      set(null);
      expect(component.checkOTP()).toBeFalse();
      set('12');
      expect(component.checkOTP()).toBeFalse();
      set('12a4');
      expect(component.checkOTP()).toBeFalse();
      set('123456');
      expect(component.checkOTP()).toBeTrue();
    });

    it('isLetter and is_numeric helpers', () => {
      expect(component.isLetter('a')).toBeTruthy();
      expect(component.isLetter('1')).toBeFalsy();
      expect(component.is_numeric('5')).toBeTrue();
      expect(component.is_numeric('x')).toBeFalse();
    });

    it('ngDoCheck re-assigns language', () => {
      component.currentLanguageSet = null;
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });
  });

  describe('AADHAR mode', () => {
    const data = {
      mobileNumber: '9999999999',
      healthIdMode: 'AADHAR',
      aadharNumber: '123412341234',
      email: 'a@b.c',
      firstName: 'Asha',
      middleName: '',
      lastName: 'Rao',
      profilePhoto: 'p',
      healthId: 'asha',
    };
    beforeEach(async () => {
      await setup(data);
    });

    it('sends aadhaar OTP on init and loads master data', () => {
      expect(registrar.generateOTP).toHaveBeenCalledWith(
        { aadhaar: '123412341234' },
        'AADHAR',
      );
      expect(component.aadharNum).toBe('123412341234');
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.OTPSentToAadharLinkedNo,
        'success',
      );
      expect(component.registrarMasterData.genderMaster.length).toBe(3);
      expect(component.enablehealthIdOTPForm).toBeTrue();
    });

    it('ignores null master data', () => {
      component.registrarMasterData = 'kept';
      master.next(null);
      expect(component.registrarMasterData).toBe('kept');
    });

    it('getHealthIdOtp resends aadhaar OTP and keeps form open on failure', () => {
      component.getHealthIdOtp();
      expect(registrar.generateOTP).toHaveBeenCalledWith(
        { aadhaar: '123412341234' },
        'AADHAR',
      );
      registrar.generateOTP.and.returnValue(of({ statusCode: 400 }));
      component.getHealthIdOtp();
      expect(component.enablehealthIdOTPForm).toBeTrue();
      registrar.generateOTP.and.returnValue(throwingObs({}));
      component.getHealthIdOtp();
      expect(component.enablehealthIdOTPForm).toBeTrue();
    });

    it('verifyOTPOnSubmit without mobile opens mobile OTP dialog then creates ABHA', () => {
      component.transactionId = 'T1';
      component.healthIdOTPForm.patchValue({ otp: '123456' });
      registrar.verifyOTPForAadharHealthId.and.returnValue(
        of({ statusCode: 200, data: { tnxId: 'T2' } }),
      );
      registrar.generateHealthIdWithUID.and.returnValue(
        of({ statusCode: 500, errorMessage: 'create failed' }),
      );
      dialog.open.and.callFake((cmp: any) =>
        createDialogRefMock(
          cmp === GenerateMobileOtpGenerationComponent
            ? { tnxId: 'T3' }
            : 'secret',
        ),
      );
      component.verifyOTPOnSubmit();
      expect(registrar.verifyOTPForAadharHealthId).toHaveBeenCalledWith({
        otp: '123456',
        txnId: 'T1',
      });
      expect(dialog.open).toHaveBeenCalledWith(
        GenerateMobileOtpGenerationComponent,
        jasmine.objectContaining({ data: { transactionId: 'T2' } }),
      );
      expect(dialog.open).toHaveBeenCalledWith(
        SetPasswordForAbhaComponent,
        jasmine.objectContaining({ disableClose: true }),
      );
      expect(registrar.generateHealthIdWithUID).toHaveBeenCalledWith({
        email: 'a@b.c',
        firstName: 'Asha',
        middleName: '',
        lastName: 'Rao',
        password: 'secret',
        txnId: 'T3',
        profilePhoto: 'p',
        healthId: 'asha',
        createdBy: 'reg1',
        providerServiceMapID: 4,
      });
      expect(confirm.alert).toHaveBeenCalledWith('create failed', 'error');
    });

    it('checkandGenerateToVerifyMobileOTP ignores empty dialog result', () => {
      dialog.open.and.returnValue(createDialogRefMock(null));
      spyOn(component, 'posthealthIDButtonCall');
      component.checkandGenerateToVerifyMobileOTP();
      expect(component.posthealthIDButtonCall).not.toHaveBeenCalled();
      expect(component.showProgressBar).toBeFalse();
    });

    it('verifyOTPOnSubmit with mobile generates mobile OTP then posts', () => {
      registrar.verifyOTPForAadharHealthId.and.returnValue(
        of({ statusCode: 200, data: { tnxId: 'T2', mobileNumber: '9' } }),
      );
      registrar.checkAndGenerateMobileOTPHealthId.and.returnValue(
        of({ statusCode: 200, data: { txnId: 'T4' } }),
      );
      spyOn(component, 'posthealthIDButtonCall');
      component.verifyOTPOnSubmit();
      expect(registrar.checkAndGenerateMobileOTPHealthId).toHaveBeenCalledWith({
        mobile: '9',
        txnId: 'T2',
      });
      expect(component.transactionId).toBe('T4');
      expect(component.posthealthIDButtonCall).toHaveBeenCalled();
    });

    it('verifyOTPOnSubmit with mobile does not post when mobile OTP fails', () => {
      registrar.verifyOTPForAadharHealthId.and.returnValue(
        of({ statusCode: 200, data: { tnxId: 'T2', mobileNumber: '9' } }),
      );
      registrar.checkAndGenerateMobileOTPHealthId.and.returnValue(
        of({ statusCode: 500 }),
      );
      spyOn(component, 'posthealthIDButtonCall');
      component.verifyOTPOnSubmit();
      expect(component.posthealthIDButtonCall).not.toHaveBeenCalled();
    });

    it('verifyOTPOnSubmit alerts on failure and error', () => {
      registrar.verifyOTPForAadharHealthId.and.returnValue(
        of({ statusCode: 400, errorMessage: 'wrong otp' }),
      );
      component.verifyOTPOnSubmit();
      expect(confirm.alert).toHaveBeenCalledWith('wrong otp', 'error');
      registrar.verifyOTPForAadharHealthId.and.returnValue(throwingObs());
      component.verifyOTPOnSubmit();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.issueInGettingBeneficiaryABHADetails,
        'error',
      );
      expect(component.showProgressBar).toBeFalse();
    });

    function abhaResponse(gender: string) {
      return {
        statusCode: 200,
        data: {
          dayOfBirth: 1,
          monthOfBirth: 2,
          yearOfBirth: 1990,
          gender,
          stateCode: 29,
          districtCode: 501,
          healthIdNumber: '11-2222-3333-4444',
          healthId: 'asha@sbx',
          firstName: 'Asha',
          lastName: 'Rao',
          mobile: '9999999999',
        },
      };
    }

    it('posthealthIDButtonCall creates ABHA, resolves location and closes with details', () => {
      component.transactionId = 'T9';
      const res = abhaResponse('F');
      registrar.generateHealthIdWithUID.and.returnValue(of(res));
      registrar.getDistrictList.and.returnValue(
        of({
          statusCode: 200,
          data: [
            { govtLGDDistrictID: 500, districtID: 1, districtName: 'A' },
            { govtLGDDistrictID: 501, districtID: 2, districtName: 'Mysore' },
          ],
        }),
      );
      registrar.getSubDistrictList.and.returnValue(
        of({ statusCode: 200, data: [{ blockID: 1 }] }),
      );
      dialog.open.and.callFake(() => createDialogRefMock('pw'));
      component.posthealthIDButtonCall();
      expect(registrar.abhaGenerateData).toBe(res.data);
      expect(registrar.getabhaDetail).toHaveBeenCalledWith(true);
      expect(dialog.open).toHaveBeenCalledWith(
        HealthIdOtpSuccessComponent,
        jasmine.objectContaining({ data: res }),
      );
      expect(registrar.getDistrictList).toHaveBeenCalledWith(10);
      expect(registrar.updateDistrictList).toHaveBeenCalled();
      expect(registrar.getSubDistrictList).toHaveBeenCalledWith(2);
      expect(registrar.updateSubDistrictList).toHaveBeenCalledWith([
        { blockID: 1 },
      ]);
      const expected = {
        healthIdNumber: '11-2222-3333-4444',
        healthId: 'asha@sbx',
        firstName: 'Asha',
        lastName: 'Rao',
        phoneNo: '9999999999',
        dob: '1/2/1990',
        gender: 2,
        genderName: 'Female',
        stateID: 10,
        stateName: 'Karnataka',
        districtID: 2,
        districtName: 'Mysore',
      };
      expect(registrar.setHealthIdMobVerification).toHaveBeenCalledWith(
        expected,
      );
      expect(dialogRef.close).toHaveBeenCalledWith(expected);
    });

    it('posthealthIDButtonCall maps male/other gender and skips failed district lookups', () => {
      registrar.getDistrictList.and.returnValue(of({ statusCode: 500 }));
      dialog.open.and.callFake(() => createDialogRefMock('pw'));
      registrar.generateHealthIdWithUID.and.returnValue(of(abhaResponse('M')));
      component.posthealthIDButtonCall();
      registrar.generateHealthIdWithUID.and.returnValue(of(abhaResponse('T')));
      component.registrarMasterData = { genderMaster: [] };
      component.posthealthIDButtonCall();
      expect(registrar.getDistrictList).toHaveBeenCalledTimes(2);
      expect(registrar.setHealthIdMobVerification).not.toHaveBeenCalled();
    });

    it('posthealthIDButtonCall ignores failed sub-district lookup', () => {
      dialog.open.and.callFake(() => createDialogRefMock('pw'));
      registrar.generateHealthIdWithUID.and.returnValue(of(abhaResponse('M')));
      registrar.getDistrictList.and.returnValue(
        of({ statusCode: 200, data: [] }),
      );
      registrar.getSubDistrictList.and.returnValue(of(null));
      component.posthealthIDButtonCall();
      expect(registrar.updateSubDistrictList).not.toHaveBeenCalled();
      expect(dialogRef.close).toHaveBeenCalledWith(
        jasmine.objectContaining({ gender: 1, genderName: 'Male' }),
      );
    });

    it('posthealthIDButtonCall alerts on create error', () => {
      dialog.open.and.callFake(() => createDialogRefMock('pw'));
      registrar.generateHealthIdWithUID.and.returnValue(throwingObs());
      component.posthealthIDButtonCall();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.issueInGettingBeneficiaryABHADetails,
        'error',
      );
    });
  });

  describe('AADHAR mode without aadhaar number', () => {
    beforeEach(async () => {
      await setup({ healthIdMode: 'AADHAR', aadharNumber: null });
    });
    it('does not store aadhaar number', () => {
      expect(component.aadharNum).toBeUndefined();
    });
  });

  describe('unknown mode', () => {
    beforeEach(async () => {
      await setup({ healthIdMode: 'OTHER', mobileNumber: '1' });
    });
    it('sends a null request and no mode-specific alert', () => {
      component.getHealthIdOtp();
      expect(registrar.generateOTP).toHaveBeenCalledWith(null, 'OTHER');
      component.getHealthIdOtpForInitial();
      expect(registrar.generateOTP).toHaveBeenCalledWith(null, 'OTHER');
      expect(confirm.alert).not.toHaveBeenCalled();
    });
  });
});

describe('Registrar HealthIdOtpSuccessComponent', () => {
  let component: HealthIdOtpSuccessComponent;
  let fixture: ComponentFixture<HealthIdOtpSuccessComponent>;
  let registrar: any;
  let confirm: any;
  let dialogRef: any;
  let dialog: any;
  let healthIdOtp: BehaviorSubject<any>;

  async function setup(succdata: any, mode: any = 'MOBILE') {
    healthIdOtp = new BehaviorSubject<any>({ healthIdMode: mode });
    registrar = autoSpy(RegistrarService, {
      generateHealthIdOtp$: healthIdOtp.asObservable(),
    });
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [HealthIdOtpSuccessComponent],
      providers: [
        ...commonTestProviders(),
        { provide: MAT_DIALOG_DATA, useValue: { data: succdata } },
        { provide: RegistrarService, useValue: registrar },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(HealthIdOtpSuccessComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    dialogRef = TestBed.inject(MatDialogRef);
    dialog = TestBed.inject(MatDialog);
    component.ngOnInit();
  }

  afterEach(() => fixture?.destroy());

  ['0', '1', '2', '9'].forEach((g, i) => {
    it(`maps Auth patient gender ${g}`, async () => {
      await setup({ Auth: { Patient: { Gender: g } } });
      expect(component.verify).toBeTrue();
      expect(component.genderName).toBe(
        ['Male', 'Female', 'Transgender', 'Transgender'][i],
      );
      expect(component.fetchHealthIds).toEqual({ healthIdMode: 'MOBILE' });
    });
  });

  it('leaves verify false when there is no Auth', async () => {
    await setup({});
    expect(component.verify).toBeFalse();
    expect(component.genderName).toBeUndefined();
  });

  it('leaves gender unset when Auth patient has none', async () => {
    await setup({ Auth: { Patient: {} } });
    expect(component.verify).toBeTrue();
    expect(component.genderName).toBeUndefined();
  });

  describe('fetchOtp', () => {
    it('MOBILE: confirms after close and opens health id card dialog', async () => {
      await setup({});
      registrar.generateHealthIDCard.and.returnValue(
        of({ statusCode: 200, data: { tnxId: 'M1' } }),
      );
      component.fetchOtp('asha@sbx', '11-22');
      expect(dialogRef.close).toHaveBeenCalled();
      expect(registrar.generateHealthIDCard).toHaveBeenCalledWith({
        authMethod: 'MOBILE_OTP',
        healthid: 'asha@sbx',
        healthIdNumber: '11-22',
      });
      expect(confirm.confirmHealthId).toHaveBeenCalledWith(
        'success',
        LANGUAGE_EN.OTPSentToRegMobNo,
      );
      expect(dialog.open).toHaveBeenCalledWith(HealthIdValidateComponent, {
        height: '240px',
        width: '500px',
        disableClose: true,
        data: {
          healthId: 'asha@sbx',
          authenticationMode: 'MOBILE',
          generateHealthIDCard: true,
          healthIDDetailsTxnID: 'M1',
        },
      });
      expect(component.showProgressBar).toBeFalse();
    });

    it('MOBILE without component instance confirms directly; declined skips dialog', async () => {
      await setup({});
      dialogRef.componentInstance = null;
      confirm.confirmHealthId.and.returnValue(of(false));
      registrar.generateHealthIDCard.and.returnValue(
        of({ statusCode: 200, data: { tnxId: 'M1' } }),
      );
      component.fetchOtp(null, null);
      expect(registrar.generateHealthIDCard).toHaveBeenCalledWith({
        authMethod: 'MOBILE_OTP',
        healthid: null,
        healthIdNumber: null,
      });
      expect(confirm.confirmHealthId).toHaveBeenCalled();
      expect(dialog.open).not.toHaveBeenCalled();
    });

    it('MOBILE without component instance opens dialog when confirmed', async () => {
      await setup({});
      dialogRef.componentInstance = null;
      registrar.generateHealthIDCard.and.returnValue(
        of({ statusCode: 200, data: { tnxId: 'M1' } }),
      );
      component.fetchOtp('h', null);
      expect(dialog.open).toHaveBeenCalled();
    });

    it('AADHAAR: confirms after close and opens dialog', async () => {
      await setup({}, 'AADHAR');
      registrar.generateHealthIDCard.and.returnValue(
        of({ statusCode: 200, data: { txnId: 'A1' } }),
      );
      component.fetchOtp('h', 'n');
      expect(
        registrar.generateHealthIDCard.calls.mostRecent().args[0].authMethod,
      ).toBe('AADHAAR_OTP');
      expect(confirm.confirmHealthId).toHaveBeenCalledWith(
        'success',
        LANGUAGE_EN.OTPSentToAadharLinkedNo,
      );
      expect(component.transactionId).toBe('A1');
      expect(dialog.open).toHaveBeenCalled();
    });

    it('AADHAAR without component instance confirms directly', async () => {
      await setup({}, 'AADHAR');
      dialogRef.componentInstance = null;
      registrar.generateHealthIDCard.and.returnValue(
        of({ statusCode: 200, data: { txnId: 'A1' } }),
      );
      component.fetchOtp('h', 'n');
      expect(dialog.open).toHaveBeenCalled();
      confirm.confirmHealthId.and.returnValue(of(false));
      dialog.open.calls.reset();
      component.fetchOtp('h', 'n');
      expect(dialog.open).not.toHaveBeenCalled();
    });

    it('AADHAAR after-close confirm declined skips dialog', async () => {
      await setup({}, 'AADHAR');
      confirm.confirmHealthId.and.returnValue(of(false));
      registrar.generateHealthIDCard.and.returnValue(
        of({ statusCode: 200, data: { txnId: 'A1' } }),
      );
      component.fetchOtp('h', 'n');
      expect(dialog.open).not.toHaveBeenCalled();
    });

    it('MOBILE after-close confirm declined skips dialog', async () => {
      await setup({});
      confirm.confirmHealthId.and.returnValue(of(false));
      registrar.generateHealthIDCard.and.returnValue(
        of({ statusCode: 200, data: { tnxId: 'M1' } }),
      );
      component.fetchOtp('h', 'n');
      expect(dialog.open).not.toHaveBeenCalled();
    });

    it('unknown mode sends null_OTP and does nothing further', async () => {
      await setup({}, null);
      registrar.generateHealthIDCard.and.returnValue(
        of({ statusCode: 200, data: { x: 1 } }),
      );
      component.fetchOtp('h', 'n');
      expect(
        registrar.generateHealthIDCard.calls.mostRecent().args[0].authMethod,
      ).toBe('null_OTP');
      expect(confirm.confirmHealthId).not.toHaveBeenCalled();
    });

    it('alerts status on empty data and generic message on error', async () => {
      await setup({});
      registrar.generateHealthIDCard.and.returnValue(
        of({ statusCode: 200, data: {}, status: 'Empty' }),
      );
      component.fetchOtp('h', 'n');
      expect(confirm.alert).toHaveBeenCalledWith('Empty', 'error');
      registrar.generateHealthIDCard.and.returnValue(throwingObs());
      component.fetchOtp('h', 'n');
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.issueInGettingBeneficiaryABHADetails,
        'error',
      );
      expect(component.showProgressBar).toBeFalse();
    });
  });

  it('closeSuccessDialog, ngDoCheck and card dialog close handler', async () => {
    await setup({});
    component.closeSuccessDialog();
    expect(dialogRef.close).toHaveBeenCalled();
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    component.openDialogForprintHealthIDCard('h', 't');
    expect(dialog.open).toHaveBeenCalled();
  });
});
