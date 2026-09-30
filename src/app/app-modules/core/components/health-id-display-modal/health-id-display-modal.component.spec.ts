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
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { HealthIdDisplayModalComponent } from './health-id-display-modal.component';
import { RegistrarService } from 'src/app/app-modules/registrar/shared/services/registrar.service';
import { HealthIdValidateComponent } from 'src/app/app-modules/registrar/registration/register-other-details/register-other-details.component';
import { ConfirmationService } from '../../services/confirmation.service';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

describe('HealthIdDisplayModalComponent', () => {
  let fixture: ComponentFixture<HealthIdDisplayModalComponent>;
  let component: HealthIdDisplayModalComponent;
  let registrar: any;
  let confirmation: any;
  let dialogRef: any;
  let dialog: any;

  const healthDetails = () => [
    {
      healthId: 'asha@abdm',
      healthIdNumber: '91-1111',
      authenticationMode: 'MOBILE',
      beneficiaryRegID: 77,
      createdDate: '2024-03-04T10:00:00',
    },
  ];

  function setup(input: any, session: Record<string, any> = {}) {
    registrar = autoSpy(RegistrarService);
    TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [HealthIdDisplayModalComponent],
      providers: [
        ...commonTestProviders({ dialogData: input, session }),
        { provide: RegistrarService, useValue: registrar },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(HealthIdDisplayModalComponent);
    component = fixture.componentInstance;
    confirmation = TestBed.inject(ConfirmationService);
    dialogRef = TestBed.inject(MatDialogRef);
    dialog = TestBed.inject(MatDialog);
  }

  describe('mapping mode', () => {
    beforeEach(() =>
      setup(
        {
          healthIDMapping: true,
          visitCode: 'V1',
          dataList: { data: { BenHealthDetails: healthDetails() } },
        },
        { visiCategoryANC: 'General OPD (QC)' },
      ),
    );

    it('disables closing and builds the ABHA list on init', () => {
      component.ngOnInit();
      expect(dialogRef.disableClose).toBeTrue();
      expect(component.currentLanguageSet).toBe(LANGUAGE_EN);
      expect(component.searchPopup).toBeFalse();
      expect(component.healthIDMapping).toBeTrue();
      expect(component.healthIDArray.data.length).toBe(1);
      expect(component.healthIDArray.data[0].createdDate).toBe(
        '2024-03-04 10:00:00 AM',
      );
      expect(component.healthIdOTPForm.value).toEqual({ otp: null });
    });

    it('renders the template', () => {
      fixture.detectChanges();
      // mat-table rows are not rendered under NO_ERRORS_SCHEMA; check the header.
      expect(fixture.nativeElement.textContent).toContain(
        'Care Context Mapping',
      );
      expect(component.healthIDArray.data[0].healthId).toBe('asha@abdm');
    });

    it('ngDoCheck refreshes the language', () => {
      component.ngDoCheck();
      expect(component.currentLanguageSet).toBe(LANGUAGE_EN);
    });

    it('onRadioChange stores the selected ABHA', () => {
      component.onRadioChange({ healthId: 'x' });
      expect(component.selectedHealthID).toEqual({ healthId: 'x' });
    });

    describe('OTP for care-context mapping', () => {
      beforeEach(() => {
        component.ngOnInit();
        component.onRadioChange(healthDetails()[0]);
      });

      it('generates an OTP and enables the OTP form', () => {
        registrar.generateOtpForMappingCareContext.and.returnValue(
          of({ statusCode: 200, data: { txnId: 'T1' } }),
        );
        component.generateOtpForMapping();
        expect(registrar.generateOtpForMappingCareContext).toHaveBeenCalledWith(
          {
            healthID: 'asha@abdm',
            healthIdNumber: '91-1111',
            authenticationMode: 'MOBILE',
          },
        );
        expect(confirmation.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.OTPSentToRegMobNo,
          'success',
        );
        expect(component.transactionId).toBe('T1');
        expect(component.enablehealthIdOTPForm).toBeTrue();
        expect(component.showProgressBar).toBeFalse();
      });

      it('sends null ids when missing and alerts on failure status', () => {
        component.onRadioChange({ authenticationMode: 'AADHAR' });
        registrar.generateOtpForMappingCareContext.and.returnValue(
          of({ statusCode: 500, errorMessage: 'fail' }),
        );
        component.generateOtpForMapping();
        expect(registrar.generateOtpForMappingCareContext).toHaveBeenCalledWith(
          {
            healthID: null,
            healthIdNumber: null,
            authenticationMode: 'AADHAR',
          },
        );
        expect(confirmation.alert).toHaveBeenCalledWith('fail', 'error');
        expect(component.enablehealthIdOTPForm).toBeFalse();
      });

      it('alerts on OTP generation error', () => {
        registrar.generateOtpForMappingCareContext.and.returnValue(
          throwingObs({ errorMessage: 'net' }),
        );
        component.generateOtpForMapping();
        expect(confirmation.alert).toHaveBeenCalledWith('net', 'error');
        expect(component.showProgressBar).toBeFalse();
      });

      it('resendOtp clears the OTP and generates again', () => {
        spyOn(component, 'generateOtpForMapping');
        component.healthIdOTPForm.patchValue({ otp: '1234' });
        component.resendOtp();
        expect(component.healthIdOTPForm.value.otp).toBeNull();
        expect(component.generateOtpForMapping).toHaveBeenCalled();
      });

      it('verifies the OTP (QC visit maps to Emergency) and closes', () => {
        component.transactionId = 'T1';
        component.healthIdOTPForm.patchValue({ otp: '123456' });
        registrar.verifyOtpForMappingCarecontext.and.returnValue(
          of({ statusCode: 200, data: { response: 'mapped' } }),
        );
        component.verifyOtp();
        expect(registrar.verifyOtpForMappingCarecontext).toHaveBeenCalledWith({
          otp: '123456',
          txnId: 'T1',
          beneficiaryID: 77,
          healthID: 'asha@abdm',
          healthIdNumber: '91-1111',
          visitCode: 'V1',
          visitCategory: 'Emergency',
        });
        expect(confirmation.alert).toHaveBeenCalledWith('mapped', 'success');
        expect(dialogRef.close).toHaveBeenCalled();
      });

      it('alerts on verify failure status and on error', () => {
        component.onRadioChange({ beneficiaryRegID: 1 });
        registrar.verifyOtpForMappingCarecontext.and.returnValue(
          of({ statusCode: 500, errorMessage: 'wrong otp' }),
        );
        component.verifyOtp();
        expect(confirmation.alert).toHaveBeenCalledWith('wrong otp', 'error');
        registrar.verifyOtpForMappingCarecontext.and.returnValue(
          throwingObs({ errorMessage: 'down' }),
        );
        component.verifyOtp();
        expect(confirmation.alert).toHaveBeenCalledWith('down', 'error');
        expect(dialogRef.close).not.toHaveBeenCalled();
      });
    });

    it('checkOTP validates 4-32 digit numeric OTPs', () => {
      component.ngOnInit();
      const check = (v: any) => {
        component.healthIdOTPForm.patchValue({ otp: v });
        return component.checkOTP();
      };
      expect(check(null)).toBeFalse();
      expect(check('')).toBeFalse();
      expect(check('123')).toBeFalse();
      expect(check('12a4')).toBeFalse();
      expect(check('1234')).toBeTrue();
      expect(check('1'.repeat(33))).toBeFalse();
    });

    it('numberOnly allows digits and control keys only', () => {
      expect(component.numberOnly({ which: 50 })).toBeTrue();
      expect(component.numberOnly({ which: 0, keyCode: 8 })).toBeTrue();
      expect(component.numberOnly({ which: 65 })).toBeFalse();
    });

    it('isLetter and is_numeric helpers', () => {
      expect(component.isLetter('a')).toBeTruthy();
      expect(component.isLetter('1')).toBeFalsy();
      expect(component.isLetter('ab')).toBeFalse();
      expect(component.is_numeric('12')).toBeTrue();
      expect(component.is_numeric('1a')).toBeFalse();
    });

    it('openDialogForprintHealthIDCard opens the validate dialog', () => {
      component.openDialogForprintHealthIDCard(
        { healthId: 'h', authenticationMode: 'MOBILE' },
        'T9',
      );
      expect(dialog.open).toHaveBeenCalledWith(HealthIdValidateComponent, {
        height: '250px',
        width: '420px',
        disableClose: true,
        data: {
          healthId: 'h',
          authenticationMode: 'MOBILE',
          generateHealthIDCard: true,
          healthIDDetailsTxnID: 'T9',
        },
      });
    });

    describe('printHealthIDCard', () => {
      beforeEach(() => {
        component.ngOnInit();
        spyOn(component, 'openDialogForprintHealthIDCard');
      });

      it('MOBILE: requests the card, confirms and opens the validate dialog', () => {
        registrar.generateHealthIDCard.and.returnValue(
          of({ statusCode: 200, data: { txnId: 'TX' } }),
        );
        const data = {
          healthId: 'h',
          healthIdNumber: 'n',
          authenticationMode: 'MOBILE',
        };
        component.printHealthIDCard(data);
        expect(registrar.generateHealthIDCard).toHaveBeenCalledWith({
          authMethod: 'MOBILE_OTP',
          healthid: 'h',
          healthIdNumber: 'n',
        });
        expect(dialogRef.close).toHaveBeenCalled();
        expect(component.transactionId).toBe('TX');
        expect(confirmation.confirmHealthId).toHaveBeenCalledWith(
          'success',
          LANGUAGE_EN.OTPSentToRegMobNo,
        );
        expect(component.openDialogForprintHealthIDCard).toHaveBeenCalledWith(
          data,
          'TX',
        );
        expect(component.showProgressBar).toBeFalse();
      });

      it('AADHAR: maps to AADHAAR_OTP and uses the aadhaar message', () => {
        registrar.generateHealthIDCard.and.returnValue(
          of({ statusCode: 200, data: { txnId: 'TX' } }),
        );
        component.printHealthIDCard({
          healthId: 'h',
          authenticationMode: 'AADHAR',
        });
        expect(
          registrar.generateHealthIDCard.calls.mostRecent().args[0].authMethod,
        ).toBe('AADHAAR_OTP');
        expect(confirmation.confirmHealthId).toHaveBeenCalledWith(
          'success',
          LANGUAGE_EN.OTPSentToAadharLinkedNo,
        );
        expect(component.openDialogForprintHealthIDCard).toHaveBeenCalled();
      });

      it('does not open the dialog when the confirmation is declined', () => {
        confirmation.confirmHealthId.and.returnValue(of(false));
        registrar.generateHealthIDCard.and.returnValue(
          of({ statusCode: 200, data: { txnId: 'TX' } }),
        );
        component.printHealthIDCard({ authenticationMode: 'MOBILE' });
        component.printHealthIDCard({ authenticationMode: 'AADHAR' });
        expect(component.openDialogForprintHealthIDCard).not.toHaveBeenCalled();
      });

      it('other modes send a null auth method and do not confirm', () => {
        registrar.generateHealthIDCard.and.returnValue(
          of({ statusCode: 200, data: { txnId: 'TX' } }),
        );
        component.printHealthIDCard({
          healthId: 'h',
          authenticationMode: 'OTHER',
        });
        expect(
          registrar.generateHealthIDCard.calls.mostRecent().args[0].authMethod,
        ).toBeNull();
        expect(confirmation.confirmHealthId).not.toHaveBeenCalled();
      });

      it('alerts when the card response is empty/non-200 or errors', () => {
        registrar.generateHealthIDCard.and.returnValue(
          of({ statusCode: 200, status: 'empty', data: {} }),
        );
        component.printHealthIDCard({ authenticationMode: 'MOBILE' });
        expect(confirmation.alert).toHaveBeenCalledWith('empty', 'error');
        registrar.generateHealthIDCard.and.returnValue(
          throwingObs({ errorMessage: 'e' }),
        );
        component.printHealthIDCard({ authenticationMode: 'MOBILE' });
        expect(confirmation.alert).toHaveBeenCalledWith('e', 'error');
        expect(component.showProgressBar).toBeFalse();
      });
    });
  });

  describe('search mode', () => {
    beforeEach(() =>
      setup({
        search: true,
        dataList: {
          otherFields: JSON.stringify({
            abhaNumber: '91-2222',
            abha: 'b@abdm',
          }),
          createdDate: '2024-01-01',
          data: { BenHealthDetails: [] },
        },
      }),
    );

    it('parses the search result into the table', () => {
      component.ngOnInit();
      expect(component.searchPopup).toBeTrue();
      expect(component.searchDetails.data).toEqual([
        { abhaNumber: '91-2222', abha: 'b@abdm' },
      ]);
      expect(component.healthIDArray.data.length).toBe(0);
    });
  });

  it('search mode with non-string otherFields leaves the table empty', () => {
    setup({
      search: true,
      dataList: { otherFields: { a: 1 }, data: { BenHealthDetails: [] } },
    });
    component.ngOnInit();
    expect(component.searchDetails.data).toEqual([]);
  });
});
