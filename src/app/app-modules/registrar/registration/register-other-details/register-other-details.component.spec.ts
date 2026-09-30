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
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { BehaviorSubject, of } from 'rxjs';

import {
  HealthIdValidateComponent,
  RegisterOtherDetailsComponent,
} from './register-other-details.component';
import { RegistrarService } from '../../shared/services/registrar.service';
import { RegistrationUtils } from '../../shared/utility/registration-utility';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { MaterialModule } from '../../../core/material.module';
import { ConsentFormComponent } from '../../consent-form/consent-form.component';
import { BiometricAuthenticationComponent } from '../../biometric-authentication/biometric-authentication.component';
import { HealthIdOtpSuccessComponent } from '../../health-id-otp-generation/health-id-otp-generation.component';
import { ViewHealthIdCardComponent } from './view-health-id-card/view-health-id-card.component';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

function master() {
  return {
    govIdEntityMaster: [
      { govtIdentityTypeID: 1, identityType: 'Aadhar' },
      { govtIdentityTypeID: 2, identityType: 'Voter ID' },
      { govtIdentityTypeID: 4, identityType: 'PAN' },
    ],
    otherGovIdEntityMaster: [
      { govtIdentityTypeID: 10, identityType: 'X' },
      { govtIdentityTypeID: 11, identityType: 'Y' },
      { govtIdentityTypeID: 12, identityType: 'Z' },
    ],
    religionMaster: [
      { religionID: 1, religionType: 'Hindu' },
      { religionID: 7, religionType: 'Other' },
    ],
    communityMaster: [
      { communityID: 1, communityType: 'General' },
      { communityID: 2, communityType: 'OBC' },
    ],
  };
}

const REVISIT = {
  beneficiaryID: 9,
  fatherName: 'F',
  motherName: 'M',
  email: 'a@b.c',
  i_bendemographics: { communityID: 2, communityName: 'OBC' },
  bankName: 'B',
  branchName: 'BR',
  ifscCode: 'IFSC',
  accountNo: '123',
  religionId: 1,
  religion: 'Hindu',
  beneficiaryIdentities: [
    {
      govtIdentityTypeID: 2,
      govtIdentityNo: 'AB12345678',
      benIdentityId: 100,
      deleted: false,
      createdBy: 'u',
      govtIdentityType: { isGovtID: true },
    },
    {
      govtIdentityTypeID: 10,
      govtIdentityNo: 'X1',
      benIdentityId: 101,
      deleted: false,
      createdBy: 'u',
      govtIdentityType: { isGovtID: false },
    },
    {
      govtIdentityTypeID: 4,
      govtIdentityNo: 'DEL',
      deleted: true,
      govtIdentityType: { isGovtID: true },
    },
  ],
};

describe('RegisterOtherDetailsComponent', () => {
  let fixture: ComponentFixture<RegisterOtherDetailsComponent>;
  let component: RegisterOtherDetailsComponent;
  let registrar: any;
  let confirmation: any;
  let dialog: any;
  let form: FormGroup;

  async function setup(
    opts: { revisit?: boolean; edit?: any; abha?: any; master?: any } = {},
  ) {
    registrar = autoSpy(RegistrarService, {
      registrationMasterDetails$: new BehaviorSubject<any>(
        opts.master === undefined ? master() : opts.master,
      ),
      beneficiaryEditDetails$: new BehaviorSubject<any>(opts.edit ?? null),
      abhaDetailDetails$: new BehaviorSubject<any>(
        'abha' in opts ? opts.abha : 'idle',
      ),
      abhaGenerateData: 'x',
      aadharNumberNew: 'y',
    });
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [RegisterOtherDetailsComponent],
      providers: [
        ...commonTestProviders(),
        { provide: RegistrarService, useValue: registrar },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(RegisterOtherDetailsComponent);
    component = fixture.componentInstance;
    form = new RegistrationUtils(new FormBuilder()).createOtherDetailsForm();
    component.otherDetailsForm = form;
    component.patientRevisit = !!opts.revisit;
    confirmation = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    fixture.detectChanges();
  }

  const govArr = () => form.controls['govID'] as FormArray;
  const otherArr = () => form.controls['otherGovID'] as FormArray;

  afterEach(() => fixture?.destroy());

  describe('new beneficiary', () => {
    beforeEach(async () => setup());

    it('initialises language, patterns, defaults and masters', () => {
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.patterns.length).toBe(5);
      expect(component.patterns[0].error).toBe(
        LANGUAGE_EN.common.enterCharacterVoterID,
      );
      expect(form.value.checked).toBeFalse();
      expect(form.value.checked1).toBeTrue();
      expect(component.isMandatory).toBeTrue();
      expect(component.govLength).toBe(3);
      expect(component.otherGovLength).toBe(3);
      expect(component.govIDMaster[0].govIdEntityMaster.length).toBe(3);
      expect(component.otherGovIDMaster[0].otherGovIdEntityMaster.length).toBe(
        3,
      );
      expect(registrar.beneficiaryEditDetails$.observers?.length ?? 0).toBe(0);
    });

    it('form control accessors return FormArray controls or null', () => {
      expect(component.getGovIDControls()?.length).toBe(1);
      expect(component.getOtherGovIDControls()?.length).toBe(1);
      const bare = new FormBuilder().group({ govID: null, otherGovID: null });
      component.otherDetailsForm = bare;
      expect(component.getGovIDControls()).toBeNull();
      expect(component.getOtherGovIDControls()).toBeNull();
      component.otherDetailsForm = form;
    });

    it('abha detail true selects Aadhar in first gov id', () => {
      registrar.abhaDetailDetails$.next(true);
      expect(component.previousGovID[0]).toBe(1);
      expect(
        component.govIDMaster[1].govIdEntityMaster.map(
          (g: any) => g.govtIdentityTypeID,
        ),
      ).toEqual([2, 4]);
    });

    it('abha detail false resets the form', () => {
      form.patchValue({ fatherName: 'X' });
      registrar.abhaDetailDetails$.next(false);
      expect(form.value.fatherName).toBeNull();
    });

    it('patchDetails tolerates missing gov master', () => {
      component.govIDMaster[0] = { govIdEntityMaster: null };
      component.masterData = { govIdEntityMaster: [] };
      component.patchDetails();
      expect(component.previousGovID[0]).toBeUndefined();
    });

    it('ngDoCheck applies patterns to selected gov IDs', () => {
      govArr().at(0).patchValue({ type: 4 });
      component.ngDoCheck();
      expect(govArr().at(0).value.maxLength).toBe(10);
      expect(govArr().at(0).value.allow).toBe('alphanumeric');
      expect(govArr().at(0).value.error).toBe(
        LANGUAGE_EN.common.EnterCharacterPanID,
      );
    });

    it('ngOnDestroy clears abha data and unsubscribes', () => {
      const u = spyOn(component.masterDataSubscription, 'unsubscribe');
      component.ngOnDestroy();
      expect(u).toHaveBeenCalled();
      expect(registrar.abhaGenerateData).toBeNull();
      expect(registrar.aadharNumberNew).toBeNull();
      expect(registrar.getabhaDetail).toHaveBeenCalledWith(false);
    });

    it('ngOnDestroy without subscription still clears abha', () => {
      component.masterDataSubscription = null;
      component.ngOnDestroy();
      expect(registrar.getabhaDetail).toHaveBeenCalledWith(false);
    });

    it('alerting only logs', () => {
      const log = spyOn(console, 'log');
      component.alerting('c');
      expect(log).toHaveBeenCalledWith('c', 'a');
    });

    it('resetForm clears masters and reloads', () => {
      component.previousGovID = [1];
      component.previousOtherGovID = [2];
      component.resetForm();
      expect(component.previousGovID).toEqual([]);
      expect(component.previousOtherGovID).toEqual([]);
      expect(component.govLength).toBe(3);
      expect(component.govIDMaster.length).toBe(1);
    });

    it('openConsent opens consent dialog and forwards result', () => {
      dialog.open.and.returnValue({ afterClosed: () => of('granted') });
      component.openConsent();
      expect(dialog.open).toHaveBeenCalledWith(ConsentFormComponent, {
        width: '650px',
        height: '700px',
        disableClose: true,
      });
      expect(component.consentGranted).toBe('granted');
      expect(registrar.sendConsentStatus).toHaveBeenCalledWith('granted');
    });

    it('openConsent does nothing on revisit', () => {
      component.patientRevisit = true;
      component.openConsent();
      expect(dialog.open).not.toHaveBeenCalled();
    });

    it('checkIDPattern reads current id values', () => {
      const log = spyOn(console, 'log');
      govArr().at(0).patchValue({ idValue: 'ABCDE', maxLength: 5 });
      component.checkIDPattern(0);
      expect(log).toHaveBeenCalledWith('ok');
      log.calls.reset();
      govArr().at(0).patchValue({ idValue: 'AB', maxLength: 5 });
      component.checkIDPattern(0);
      expect(log).not.toHaveBeenCalledWith('ok');
    });

    it('getAllowedGovChars returns allow for known types', () => {
      expect(component.getAllowedGovChars(2) as any).toBe('alphanumeric');
      expect(component.getAllowedGovChars(3) as any).toBeUndefined();
      expect(component.getAllowedGovChars(99)).toBeNull();
    });

    describe('filtergovIDs', () => {
      it('first selection removes it from the next list and applies pattern', () => {
        component.filtergovIDs(2, 0);
        expect(component.previousGovID).toEqual([2]);
        expect(
          component.govIDMaster[1].govIdEntityMaster.map(
            (g: any) => g.govtIdentityTypeID,
          ),
        ).toEqual([1, 4]);
        expect(govArr().at(0).value.maxLength).toBe(10);
        expect(govArr().at(0).value.type).toBe(2);
      });

      it('first selection on second row removes it from other lists', () => {
        component.filtergovIDs(2, 0);
        govArr().push(component.utils.initGovID());
        component.filtergovIDs(4, 1);
        expect(
          component.govIDMaster[0].govIdEntityMaster.map(
            (g: any) => g.govtIdentityTypeID,
          ),
        ).toEqual([1, 2]);
        expect(
          component.govIDMaster[2].govIdEntityMaster.map(
            (g: any) => g.govtIdentityTypeID,
          ),
        ).toEqual([1]);
      });

      it('changing selection returns the previous id to other lists', () => {
        component.filtergovIDs(2, 0);
        govArr().at(0).patchValue({ idValue: 'abc' });
        component.filtergovIDs(4, 0);
        expect(govArr().at(0).value.idValue).toBeNull();
        expect(
          component.govIDMaster[1].govIdEntityMaster
            .map((g: any) => g.govtIdentityTypeID)
            .sort(),
        ).toEqual([1, 2]);
        expect(component.previousGovID[0]).toBe(4);
      });

      it('changing to an unknown previous id pushes nothing', () => {
        component.previousGovID[0] = 99;
        component.govIDMaster[1] = { govIdEntityMaster: [] };
        component.filtergovIDs(4, 0);
        expect(component.govIDMaster[1].govIdEntityMaster).toEqual([]);
      });
    });

    describe('filterOtherGovIDs', () => {
      it('first selection filters next list', () => {
        component.filterOtherGovIDs(10, 0);
        expect(component.previousOtherGovID).toEqual([10]);
        expect(
          component.otherGovIDMaster[1].otherGovIdEntityMaster.map(
            (g: any) => g.govtIdentityTypeID,
          ),
        ).toEqual([11, 12]);
      });

      it('second row removes selection from the first list', () => {
        component.filterOtherGovIDs(10, 0);
        otherArr().push(component.utils.initGovID());
        component.filterOtherGovIDs(11, 1);
        expect(
          component.otherGovIDMaster[0].otherGovIdEntityMaster.map(
            (g: any) => g.govtIdentityTypeID,
          ),
        ).toEqual([10, 12]);
      });

      it('changing selection restores previous and clears value', () => {
        component.filterOtherGovIDs(10, 0);
        otherArr().at(0).patchValue({ idValue: 'v' });
        component.filterOtherGovIDs(11, 0);
        expect(otherArr().at(0).value.idValue).toBeNull();
        expect(
          component.otherGovIDMaster[1].otherGovIdEntityMaster
            .map((g: any) => g.govtIdentityTypeID)
            .sort(),
        ).toEqual([10, 12]);
        expect(component.previousOtherGovID[0]).toBe(11);
      });

      it('changing from an unknown id pushes nothing', () => {
        component.previousOtherGovID[0] = 99;
        component.otherGovIDMaster[1] = { otherGovIdEntityMaster: [] };
        component.filterOtherGovIDs(10, 0);
        expect(component.otherGovIDMaster[1].otherGovIdEntityMaster).toEqual(
          [],
        );
      });
    });

    describe('addID', () => {
      it('adds gov ID row when current is filled', () => {
        govArr().at(0).patchValue({ type: 2, idValue: 'A1' });
        component.addID(1, 0);
        expect(govArr().length).toBe(2);
      });

      it('warns when gov ID row incomplete', () => {
        component.addID(1, 0);
        expect(govArr().length).toBe(1);
        expect(confirmation.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.alerts.info.PleaseInputFieldFirst,
          'warn',
        );
      });

      it('adds other gov ID row when filled, warns otherwise', () => {
        otherArr().at(0).patchValue({ type: 10, idValue: 'X' });
        component.addID(0, 0);
        expect(otherArr().length).toBe(2);
        component.addID(0, 1);
        expect(confirmation.alert).toHaveBeenCalledTimes(1);
        component.addID(0, 5);
        expect(confirmation.alert).toHaveBeenCalledTimes(2);
      });
    });

    describe('removeID', () => {
      it('clears the only gov ID row and returns its type to the list', () => {
        component.filtergovIDs(4, 0);
        govArr().at(0).patchValue({ idValue: 'X' });
        component.removeID(1, 0);
        expect(govArr().length).toBe(1);
        expect(govArr().at(0).value.type).toBeNull();
        expect(govArr().at(0).value.idValue).toBeNull();
        expect(component.previousGovID).toEqual([]);
        expect(
          component.govIDMaster[0].govIdEntityMaster.map(
            (g: any) => g.govtIdentityTypeID,
          ),
        ).toEqual([1, 2, 4]);
        expect(component.removedGovIDs).toEqual([]);
      });

      it('removes a non-last gov ID row and tracks removed ids on revisit', () => {
        component.patientRevisit = true;
        govArr().at(0).patchValue({ type: 2, createdBy: 'u' });
        govArr().push(component.utils.initGovID());
        component.govIDMaster[1] = master();
        component.removeID(1, 0);
        expect(govArr().length).toBe(1);
        expect(component.removedGovIDs.length).toBe(1);
        expect(component.removedGovIDs[0].type).toBe(2);
      });

      it('removing an empty row skips master bookkeeping', () => {
        govArr().push(component.utils.initGovID());
        component.removeID(1, 1);
        expect(govArr().length).toBe(1);
        expect(component.govIDMaster.length).toBe(1);
      });

      it('clears the only other gov ID row', () => {
        component.filterOtherGovIDs(11, 0);
        otherArr().at(0).patchValue({ type: 11, idValue: 'v' });
        component.removeID(0, 0);
        expect(otherArr().at(0).value.type).toBeNull();
        expect(component.previousOtherGovID).toEqual([]);
        expect(component.removedOtherGovIDs).toEqual([]);
      });

      it('removes other gov ID row and tracks removal on revisit', () => {
        component.patientRevisit = true;
        otherArr().at(0).patchValue({ type: 10, createdBy: 'u' });
        otherArr().push(component.utils.initGovID());
        govArr().push(component.utils.initGovID());
        component.otherGovIDMaster[1] = master();
        component.removeID(0, 0);
        expect(otherArr().length).toBe(1);
        expect(component.removedOtherGovIDs.length).toBe(1);
        expect(component.getRemovedIDs()).toEqual({
          removedGovIDs: [],
          removedOtherGovIDs: component.removedOtherGovIDs,
        });
      });

      it('removing empty other row just removes it', () => {
        otherArr().push(component.utils.initGovID());
        govArr().push(component.utils.initGovID());
        component.removeID(0, 1);
        expect(otherArr().length).toBe(1);
      });
    });

    it('getReligionName sets religion name, clears for other', () => {
      form.patchValue({ religion: 1 });
      component.getReligionName();
      expect(form.value.religionOther).toBe('Hindu');
      form.patchValue({ religion: 7 });
      component.getReligionName();
      expect(form.value.religionOther).toBeNull();
    });

    it('onCommunityChanged sets community name', () => {
      form.patchValue({ community: 2 });
      component.onCommunityChanged();
      expect(form.value.communityName).toBe('OBC');
    });

    describe('checkPattern', () => {
      const base = {
        pattern: /^[A-Z0-9]+$/,
        error: 'bad id',
        minLength: 8,
        maxLength: 10,
      };

      it('alerts and clears for pattern mismatch', () => {
        govArr().at(0).patchValue({ idValue: 'abc' });
        component.checkPattern(0, { ...base, type: 2, idValue: 'ab!' });
        expect(confirmation.alert).toHaveBeenCalledWith('bad id');
        expect(govArr().at(0).value.idValue).toBeNull();
      });

      it('alerts when driving licence below min length', () => {
        component.checkPattern(0, { ...base, type: 3, idValue: 'AB12' });
        expect(confirmation.alert).toHaveBeenCalled();
      });

      it('alerts when other id length differs from max', () => {
        component.checkPattern(0, { ...base, type: 2, idValue: 'AB12' });
        expect(confirmation.alert).toHaveBeenCalled();
      });

      it('accepts valid values and ignores empty', () => {
        component.checkPattern(0, { ...base, type: 2, idValue: 'AB12345678' });
        component.checkPattern(0, { ...base, type: 3, idValue: 'AB123456' });
        component.checkPattern(0, { ...base, type: 2, idValue: '' });
        expect(confirmation.alert).not.toHaveBeenCalled();
      });
    });

    it('mandatory-field checkboxes toggle flags', () => {
      component.checkMandatoryIsRequired({ checked: true });
      expect(component.isMandatory).toBeFalse();
      expect(component.isFatherRequired).toBeFalse();
      expect(component.isCommunityRequired).toBeFalse();
      expect(component.isGidRequired).toBeFalse();
      component.checkMandatoryIsRequired({ checked: false });
      expect(component.isMandatory).toBeTrue();
      expect(component.isGidRequired).toBeTrue();

      component.checkFatherIsRequired({ checked: true });
      expect(component.isFatherRequired).toBeFalse();
      component.checkFatherIsRequired({ checked: false });
      expect(component.isFatherRequired).toBeTrue();

      component.checkCommunityIsRequired({ checked: true });
      expect(component.isCommunityRequired).toBeFalse();
      component.checkCommunityIsRequired({ checked: false });
      expect(component.isCommunityRequired).toBeTrue();

      component.checkGidIsRequired({ checked: false });
      expect(component.isGidRequired).toBeFalse();
      component.checkGidIsRequired({ checked: true });
      expect(component.isGidRequired).toBeTrue();
    });

    it('isLetter / is_numeric', () => {
      expect(component.isLetter('a')).toBeTruthy();
      expect(component.isLetter('1')).toBeFalsy();
      expect(component.isLetter('ab')).toBeFalsy();
      expect(component.is_numeric('123')).toBeTrue();
      expect(component.is_numeric('1a')).toBeFalse();
    });

    describe('checkValidHealthID', () => {
      const check = (v: any) => {
        form.controls['healthId'].setValue(v);
        return component.checkValidHealthID();
      };
      it('accepts one dot after the fourth character', () => {
        expect(check('abcd.ef12')).toBeTrue();
      });
      it('rejects invalid ids', () => {
        expect(check('ab.cdef')).toBeFalse();
        expect(check('abcdef')).toBeFalse();
        expect(check('abcd.e.f')).toBeFalse();
        expect(check('abcd.e$')).toBeFalse();
        expect(check('abc')).toBeFalse();
        expect(check('')).toBeFalse();
        expect(check(null)).toBeFalse();
      });
    });

    describe('validateHealthId', () => {
      let open: jasmine.Spy;
      beforeEach(() => (open = spyOn(component, 'openDialogForValidate')));

      it('opens validation dialog for a valid id', () => {
        form.controls['healthId'].setValue('abcd.ef');
        component.validateHealthId();
        expect(open).toHaveBeenCalled();
      });

      it('does not open for invalid ids', () => {
        for (const v of ['ab.cd', 'abcdef', 'abcd$x', 'abcd.e.f', null]) {
          form.controls['healthId'].setValue(v);
          component.validateHealthId();
        }
        expect(open).not.toHaveBeenCalled();
      });
    });

    describe('openDialogForValidate', () => {
      let openVal: jasmine.Spy;
      beforeEach(() => {
        openVal = spyOn(component, 'openHealthIDValidateDialog');
        form.controls['healthId'].setValue(' abcd.ef ');
      });

      for (const mode of ['MOBILE', 'AADHAR']) {
        it(`confirms and opens OTP dialog for ${mode}`, () => {
          form.controls['healthIdMode'].setValue(mode);
          registrar.generateOTPValidateHealthID.and.returnValue(
            of({ statusCode: 200, data: { txnId: 'T1' } }),
          );
          component.openDialogForValidate();
          expect(registrar.generateOTPValidateHealthID).toHaveBeenCalledWith({
            healthID: 'abcd.ef',
            isValidate: true,
            authenticationMode: mode,
          });
          expect(confirmation.confirmHealthId).toHaveBeenCalledWith(
            'success',
            LANGUAGE_EN.OTPSentToRegMobNo,
          );
          expect(openVal).toHaveBeenCalledWith('T1');
        });

        it(`does not open for ${mode} when not confirmed`, () => {
          form.controls['healthIdMode'].setValue(mode);
          confirmation.confirmHealthId.and.returnValue(of(false));
          registrar.generateOTPValidateHealthID.and.returnValue(
            of({ statusCode: 200, data: { txnId: 'T1' } }),
          );
          component.openDialogForValidate();
          expect(openVal).not.toHaveBeenCalled();
        });
      }

      it('ignores unknown modes', () => {
        form.controls['healthIdMode'].setValue('OTHER');
        registrar.generateOTPValidateHealthID.and.returnValue(
          of({ statusCode: 200, data: { txnId: 'T1' } }),
        );
        component.openDialogForValidate();
        expect(confirmation.confirmHealthId).not.toHaveBeenCalled();
      });

      it('alerts when txnId missing', () => {
        form.controls['healthId'].setValue(null);
        registrar.generateOTPValidateHealthID.and.returnValue(
          of({ statusCode: 200, data: {} }),
        );
        component.openDialogForValidate();
        expect(
          registrar.generateOTPValidateHealthID.calls.mostRecent().args[0]
            .healthID,
        ).toBeNull();
        expect(confirmation.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.errorInABHAValidation,
          'error',
        );
      });

      it('clears health id on non-200', () => {
        form.controls['healthIdMode'].setValue('MOBILE');
        registrar.generateOTPValidateHealthID.and.returnValue(
          of({ statusCode: 500, status: 'fail' }),
        );
        component.openDialogForValidate();
        expect(form.controls['healthId'].value).toBeNull();
        expect(form.controls['healthIdMode'].value).toBeNull();
        expect(confirmation.alert).toHaveBeenCalledWith('fail', 'error');
      });

      it('alerts on error', () => {
        registrar.generateOTPValidateHealthID.and.returnValue(throwingObs());
        component.openDialogForValidate();
        expect(confirmation.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.issueInGettingBeneficiaryABHADetails,
          'error',
        );
      });
    });

    describe('openHealthIDValidateDialog', () => {
      beforeEach(() => {
        form.controls['healthId'].setValue(' abcd.ef ');
        form.controls['healthIdMode'].setValue('MOBILE');
      });

      it('applies the validated health id and emits', () => {
        const emitted: any[] = [];
        component.disableGenerateHealthID.subscribe((v) => emitted.push(v));
        const result = { healthIdNumber: '12-3', healthIdMode: 'AADHAR' };
        dialog.open.and.returnValue({ afterClosed: () => of(result) });
        component.openHealthIDValidateDialog('T9');
        expect(dialog.open).toHaveBeenCalledWith(HealthIdValidateComponent, {
          height: '300px',
          width: '450px',
          disableClose: true,
          data: {
            healthId: 'abcd.ef',
            authenticationMode: 'MOBILE',
            healthIDDetailsTxnID: 'T9',
          },
        });
        expect(form.controls['healthId'].value).toBe('12-3');
        expect(form.controls['healthId'].disabled).toBeTrue();
        expect(form.controls['healthIdMode'].value).toBe('AADHAR');
        expect(registrar.changePersonalDetailsData).toHaveBeenCalledWith(
          result,
        );
        expect(emitted).toEqual([true]);
      });

      it('clears health id when dialog asks to', () => {
        dialog.open.and.returnValue({
          afterClosed: () => of({ clearHealthID: true }),
        });
        component.openHealthIDValidateDialog('T9');
        expect(form.controls['healthId'].value).toBeNull();
        expect(form.controls['healthIdMode'].value).toBeNull();
      });

      it('does nothing when dismissed', () => {
        form.controls['healthId'].setValue(null);
        dialog.open.and.returnValue({ afterClosed: () => of(undefined) });
        component.openHealthIDValidateDialog('T9');
        expect(dialog.open.calls.mostRecent().args[1].data.healthId).toBeNull();
        expect(registrar.changePersonalDetailsData).not.toHaveBeenCalled();
      });
    });
  });

  describe('master data missing', () => {
    beforeEach(async () => setup({ master: null }));
    it('does not populate masters', () => {
      expect(component.masterData).toBeUndefined();
      expect(component.govIDMaster).toEqual([]);
    });
  });

  describe('revisit', () => {
    beforeEach(async () => setup({ revisit: true, edit: REVISIT }));

    it('patches other details from edit data', () => {
      expect(component.revisitData.beneficiaryID).toBe(9);
      expect(form.value).toEqual(
        jasmine.objectContaining({
          fatherName: 'F',
          motherName: 'M',
          emailID: 'a@b.c',
          community: 2,
          communityName: 'OBC',
          bankName: 'B',
          branchName: 'BR',
          ifscCode: 'IFSC',
          accountNo: '123',
          religion: 1,
          religionOther: 'Hindu',
          checked: false,
        }),
      );
    });

    it('loads non-deleted government and other IDs', () => {
      expect(govArr().at(0).value).toEqual(
        jasmine.objectContaining({
          type: 2,
          idValue: 'AB12345678',
          allow: 'alphanumeric',
          benIdentityId: 100,
          createdBy: 'u',
        }),
      );
      expect(otherArr().at(0).value).toEqual(
        jasmine.objectContaining({
          type: 10,
          idValue: 'X1',
          benIdentityId: 101,
        }),
      );
      // workAround removes the empty trailing rows added by addID
      expect(govArr().length).toBe(1);
      expect(otherArr().length).toBe(1);
      expect(component.previousGovID).toEqual([2]);
      expect(component.previousOtherGovID).toEqual([10]);
    });

    it('ngOnDestroy unsubscribes revisit subscription', () => {
      const u = spyOn(component.revisitDataSubscription, 'unsubscribe');
      component.ngOnDestroy();
      expect(u).toHaveBeenCalled();
    });

    it('ignores edit data without beneficiary id', () => {
      const spy = spyOn(component, 'loadBenEditDetails');
      registrar.beneficiaryEditDetails$.next({});
      expect(spy).not.toHaveBeenCalled();
    });

    it('loadBenEditDetails falls back to null values and skips missing identities', () => {
      component.revisitData = { beneficiaryID: 1 };
      component.loadBenEditDetails();
      expect(form.value.fatherName).toBeNull();
      expect(form.value.community).toBeNull();
      expect(form.value.communityName).toBeNull();
      expect(form.value.religionOther).toBeNull();
    });

    it('configMasterForOthers skips loading when revisit flag cleared', () => {
      const spy = spyOn(component, 'loadBenEditDetails');
      component.patientRevisit = false;
      component.configMasterForOthers();
      expect(spy).not.toHaveBeenCalled();
      expect(component.revisitData.beneficiaryID).toBe(9);
    });
  });
});

describe('HealthIdValidateComponent', () => {
  let fixture: ComponentFixture<HealthIdValidateComponent>;
  let component: HealthIdValidateComponent;
  let registrar: any;
  let confirmation: any;
  let dialog: any;
  let dialogRef: any;

  async function setup(data: any, init = true) {
    registrar = autoSpy(RegistrarService);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [HealthIdValidateComponent],
      providers: [
        ...commonTestProviders({ dialogData: data }),
        { provide: RegistrarService, useValue: registrar },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(HealthIdValidateComponent);
    component = fixture.componentInstance;
    confirmation = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    dialogRef = TestBed.inject(MatDialogRef);
    component.assignSelectedLanguage();
    if (init) component.ngOnInit();
  }

  describe('init', () => {
    it('search form mode when healthId is NO', async () => {
      await setup({ healthId: 'NO', generateHealthIDCard: true });
      expect(component.enablehealthIdOTP).toBe('form');
      expect(component.enableHealthIDCard).toBeTrue();
      expect(component.healthIdValidateForm.value).toEqual({
        validateotp: null,
      });
      expect(component.healthIdSearchForm.value).toEqual({
        searchHealth: null,
        modeofhealthID: null,
      });
    });

    it('OTP mode with txn id resets the form and stores txn', async () => {
      await setup({ healthId: 'a.b', healthIDDetailsTxnID: 'TX' });
      expect(component.enableHealthIDCard).toBeFalse();
      expect(component.enablehealthIdOTP).toBe('OTP');
      expect(component.transactionId).toBe('TX');
      expect(registrar.generateOTPValidateHealthID).not.toHaveBeenCalled();
    });

    it('OTP mode without txn requests OTP', async () => {
      registrar = null;
      await setup({ healthId: 'a.b', authenticationMode: 'MOBILE' }, false);
      registrar.generateOTPValidateHealthID.and.returnValue(
        of({ statusCode: 200, data: { txnId: 'N' } }),
      );
      component.ngOnInit();
      expect(registrar.generateOTPValidateHealthID).toHaveBeenCalledWith({
        healthID: 'a.b',
        isValidate: true,
        authenticationMode: 'MOBILE',
      });
      expect(component.transactionId).toBe('N');
    });

    it('ngDoCheck loads language and closeDialog closes', async () => {
      await setup({ healthId: 'NO' });
      component.currentLanguageSet = null;
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      component.closeDialog();
      expect(dialogRef.close).toHaveBeenCalledWith();
    });
  });

  describe('helpers', () => {
    beforeEach(async () => setup({ healthId: 'NO' }));

    it('numberOnly allows digits and control chars', () => {
      expect(component.numberOnly({ which: 50 })).toBeTrue();
      expect(component.numberOnly({ keyCode: 65 })).toBeFalse();
      expect(component.numberOnly({ which: 8 })).toBeTrue();
    });

    it('isLetter / is_numeric', () => {
      expect(component.isLetter('Z')).toBeTruthy();
      expect(component.isLetter('9')).toBeFalsy();
      expect(component.is_numeric('9')).toBeTrue();
    });

    it('checkOTP validates numeric 4-32 chars', () => {
      const f = component.healthIdValidateForm.controls['validateotp'];
      f.setValue('123456');
      expect(component.checkOTP()).toBeTrue();
      f.setValue('12a4');
      expect(component.checkOTP()).toBeFalse();
      f.setValue('12');
      expect(component.checkOTP()).toBeFalse();
      f.setValue(null);
      expect(component.checkOTP()).toBeFalse();
    });

    it('checkValidHealthID handles numbers and addresses', () => {
      const f = component.healthIdSearchForm.controls['searchHealth'];
      f.setValue('12345678901234');
      expect(component.checkValidHealthID()).toBeTrue();
      f.setValue('12-3456-7890-1234');
      expect(component.checkValidHealthID()).toBeTrue();
      f.setValue('abcdefghij@sbx');
      expect(component.checkValidHealthID()).toBeTrue();
      f.setValue('abcdefghijklm@sbx');
      expect(component.checkValidHealthID()).toBeTrue();
      f.setValue('abcdefgh!!');
      expect(component.checkValidHealthID()).toBeUndefined();
      f.setValue('abc');
      expect(component.checkValidHealthID()).toBeUndefined();
      expect(component.idErrorText).toBe(
        'Please Valid Health ID / HealthID Number',
      );
    });
  });

  describe('getHealthIDDetails', () => {
    beforeEach(async () => setup({ healthId: 'NO' }));

    it('alerts for missing fields', () => {
      component.getHealthIDDetails();
      expect(confirmation.alert).toHaveBeenCalledWith(
        [LANGUAGE_EN.enterABHA, LANGUAGE_EN.aBHAGenerationMode].toString(),
        'info',
      );
    });

    it('requests OTP for a valid id', () => {
      const spy = spyOn(component, 'getHealthIdOtpForInitial');
      component.healthIdSearchForm.setValue({
        searchHealth: '12345678901234',
        modeofhealthID: 'MOBILE',
      });
      component.getHealthIDDetails();
      expect(confirmation.alert).not.toHaveBeenCalled();
      expect(component.valhealthId).toBe('12345678901234');
      expect(spy).toHaveBeenCalled();
    });

    it('does not request OTP for an invalid id', () => {
      const spy = spyOn(component, 'getHealthIdOtpForInitial');
      component.healthIdSearchForm.setValue({
        searchHealth: 'abc',
        modeofhealthID: 'MOBILE',
      });
      component.getHealthIDDetails();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('getHealthIdOtpForInitial', () => {
    describe('health id card flow', () => {
      beforeEach(async () =>
        setup({ healthId: 'NO', generateHealthIDCard: true }),
      );

      it('AADHAR requests card OTP and alerts success', () => {
        component.healthIdMode = 'AADHAR';
        component.valhealthId = 'id1';
        registrar.generateHealthIDCard.and.returnValue(
          of({ statusCode: 200, data: { txnId: 'C1' } }),
        );
        component.getHealthIdOtpForInitial();
        expect(registrar.generateHealthIDCard).toHaveBeenCalledWith({
          authMethod: 'AADHAAR_OTP',
          healthid: 'id1',
        });
        expect(component.transactionId).toBe('C1');
        expect(component.enablehealthIdOTP).toBe('OTP');
        expect(component.showProgressBar).toBeFalse();
        expect(confirmation.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.OTPSentToAadharLinkedNo,
          'success',
        );
      });

      it('AADHAR with empty data alerts error', () => {
        component.healthIdMode = 'AADHAR';
        registrar.generateHealthIDCard.and.returnValue(
          of({ statusCode: 200, data: {} }),
        );
        component.getHealthIdOtpForInitial();
        expect(confirmation.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.issueInGettingBeneficiaryABHADetails,
          'error',
        );
      });

      it('AADHAR error alerts', () => {
        component.healthIdMode = 'AADHAR';
        registrar.generateHealthIDCard.and.returnValue(throwingObs());
        component.getHealthIdOtpForInitial();
        expect(component.showProgressBar).toBeFalse();
        expect(confirmation.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.issueInGettingBeneficiaryABHADetails,
          'error',
        );
      });

      it('BIOMETRIC opens biometric dialog', () => {
        component.healthIdMode = 'BIOMETRIC';
        component.getHealthIdOtpForInitial();
        expect(dialog.open).toHaveBeenCalledWith(
          BiometricAuthenticationComponent,
          { width: '500px', height: '320px', disableClose: true },
        );
        expect(registrar.generateHealthIDCard).not.toHaveBeenCalled();
      });

      it('other mode does nothing', () => {
        component.healthIdMode = 'MOBILE';
        component.getHealthIdOtpForInitial();
        expect(dialog.open).not.toHaveBeenCalled();
        expect(registrar.generateHealthIDCard).not.toHaveBeenCalled();
      });
    });

    describe('validation flow', () => {
      beforeEach(async () => setup({ healthId: 'NO' }));

      it('MOBILE success alerts mobile OTP sent', () => {
        component.healthIdMode = 'MOBILE';
        component.valhealthId = 'v';
        registrar.generateOTPValidateHealthID.and.returnValue(
          of({ statusCode: 200, data: { txnId: 'V1' } }),
        );
        component.getHealthIdOtpForInitial();
        expect(registrar.generateOTPValidateHealthID).toHaveBeenCalledWith({
          healthID: 'v',
          isValidate: true,
          authenticationMode: 'MOBILE',
        });
        expect(component.enablehealthIdOTP).toBe('OTP');
        expect(component.transactionId).toBe('V1');
        expect(confirmation.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.OTPSentToRegMobNo,
          'success',
        );
      });

      it('AADHAR success alerts aadhaar OTP sent', () => {
        component.healthIdMode = 'AADHAR';
        registrar.generateOTPValidateHealthID.and.returnValue(
          of({ statusCode: 200, data: { txnId: 'V1' } }),
        );
        component.getHealthIdOtpForInitial();
        expect(confirmation.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.OTPSentToAadharLinkedNo,
          'success',
        );
      });

      it('other mode success alerts nothing', () => {
        component.healthIdMode = 'X';
        registrar.generateOTPValidateHealthID.and.returnValue(
          of({ statusCode: 200, data: { txnId: 'V1' } }),
        );
        component.getHealthIdOtpForInitial();
        expect(confirmation.alert).not.toHaveBeenCalled();
      });

      it('non-200 closes with clearHealthID', () => {
        registrar.generateOTPValidateHealthID.and.returnValue(
          of({ statusCode: 500 }),
        );
        component.getHealthIdOtpForInitial();
        expect(dialogRef.close).toHaveBeenCalledWith({ clearHealthID: true });
        expect(confirmation.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.issueInGettingBeneficiaryABHADetails,
          'error',
        );
      });

      it('error alerts', () => {
        registrar.generateOTPValidateHealthID.and.returnValue(throwingObs());
        component.getHealthIdOtpForInitial();
        expect(component.showProgressBar).toBeFalse();
        expect(confirmation.alert).toHaveBeenCalled();
      });
    });
  });

  describe('getHealthIdOtp', () => {
    describe('health id card flow', () => {
      beforeEach(async () =>
        setup({ healthId: 'NO', generateHealthIDCard: true }),
      );

      it('AADHAR converts mode and alerts aadhaar', () => {
        component.healthIdMode = 'AADHAR';
        component.valhealthId = 'h';
        registrar.generateHealthIDCard.and.returnValue(
          of({ statusCode: 200, data: { txnId: 'G' } }),
        );
        component.getHealthIdOtp();
        expect(registrar.generateHealthIDCard).toHaveBeenCalledWith({
          authMethod: 'AADHAAR_OTP',
          healthid: 'h',
        });
        expect(component.transactionId).toBe('G');
        expect(confirmation.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.OTPSentToAadharLinkedNo,
          'success',
        );
      });

      it('MOBILE alerts mobile', () => {
        component.healthIdMode = 'MOBILE';
        registrar.generateHealthIDCard.and.returnValue(
          of({ statusCode: 200, data: { txnId: 'G' } }),
        );
        component.getHealthIdOtp();
        expect(
          registrar.generateHealthIDCard.calls.mostRecent().args[0].authMethod,
        ).toBe('MOBILE_OTP');
        expect(confirmation.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.OTPSentToRegMobNo,
          'success',
        );
      });

      it('other mode success alerts nothing', () => {
        component.healthIdMode = 'X';
        registrar.generateHealthIDCard.and.returnValue(
          of({ statusCode: 200, data: { txnId: 'G' } }),
        );
        component.getHealthIdOtp();
        expect(confirmation.alert).not.toHaveBeenCalled();
      });

      it('failure alerts status', () => {
        registrar.generateHealthIDCard.and.returnValue(
          of({ statusCode: 500, status: 'nope', data: {} }),
        );
        component.getHealthIdOtp();
        expect(confirmation.alert).toHaveBeenCalledWith('nope', 'error');
      });

      it('error alerts', () => {
        registrar.generateHealthIDCard.and.returnValue(throwingObs());
        component.getHealthIdOtp();
        expect(component.showProgressBar).toBeFalse();
        expect(confirmation.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.issueInGettingBeneficiaryABHADetails,
          'error',
        );
      });
    });

    describe('validation flow', () => {
      beforeEach(async () => setup({ healthId: 'NO' }));

      it('MOBILE / AADHAR / other success', () => {
        registrar.generateOTPValidateHealthID.and.returnValue(
          of({ statusCode: 200, data: { txnId: 'Q' } }),
        );
        component.healthIdMode = 'MOBILE';
        component.getHealthIdOtp();
        expect(confirmation.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.OTPSentToRegMobNo,
          'success',
        );
        component.healthIdMode = 'AADHAR';
        component.getHealthIdOtp();
        expect(confirmation.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.OTPSentToAadharLinkedNo,
          'success',
        );
        component.healthIdMode = 'X';
        component.getHealthIdOtp();
        expect(confirmation.alert).toHaveBeenCalledTimes(2);
        expect(component.transactionId).toBe('Q');
      });

      it('non-200 closes and alerts status', () => {
        registrar.generateOTPValidateHealthID.and.returnValue(
          of({ statusCode: 400, status: 'bad' }),
        );
        component.getHealthIdOtp();
        expect(dialogRef.close).toHaveBeenCalledWith({ clearHealthID: true });
        expect(confirmation.alert).toHaveBeenCalledWith('bad', 'error');
      });

      it('error alerts', () => {
        registrar.generateOTPValidateHealthID.and.returnValue(throwingObs());
        component.getHealthIdOtp();
        expect(confirmation.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.issueInGettingBeneficiaryABHADetails,
          'error',
        );
      });
    });
  });

  describe('posthealthIDValidationCall', () => {
    beforeEach(async () => {
      await setup({ healthId: 'NO' });
      component.valhealthId = 'hid';
      component.transactionId = 'T';
      component.healthIdMode = 'MOBILE';
      component.healthIdValidateForm.setValue({ validateotp: '1234' });
    });

    function success(gender: string, name: string) {
      return {
        statusCode: 200,
        data: {
          RequestId: 'R',
          Auth: {
            Patient: { Gender: gender, Name: name, Id: 'PID', Address: 'Addr' },
          },
        },
      };
    }

    it('opens success dialog and closes with patient details', () => {
      const res = success('0', 'Ravi Kumar');
      registrar.verifyOTPForHealthIDValidation.and.returnValue(of(res));
      component.posthealthIDValidationCall();
      expect(registrar.verifyOTPForHealthIDValidation).toHaveBeenCalledWith({
        otp: '1234',
        txnId: 'T',
        healthId: 'hid',
      });
      expect(dialog.open).toHaveBeenCalledWith(HealthIdOtpSuccessComponent, {
        height: '460px',
        width: '520px',
        disableClose: true,
        data: res,
      });
      expect(dialogRef.close).toHaveBeenCalledWith({
        healthIdNumber: 'PID',
        RequestId: 'R',
        gender: 1,
        firstName: 'Ravi',
        lastName: 'Kumar',
        healthIdMode: 'MOBILE',
        address: 'Addr',
      });
      expect(component.showProgressBar).toBeFalse();
    });

    it('maps other genders and single names', () => {
      const cases: [string, number][] = [
        ['1', 2],
        ['2', 3],
        ['9', 3],
      ];
      for (const [g, expected] of cases) {
        registrar.verifyOTPForHealthIDValidation.and.returnValue(
          of(success(g, 'Solo')),
        );
        component.posthealthIDValidationCall();
        expect(component.gender).toBe(expected);
        expect(component.firstName).toBe('Solo');
        expect(component.lastName).toBe('');
      }
    });

    it('closes with clearHealthID when RequestId missing', () => {
      registrar.verifyOTPForHealthIDValidation.and.returnValue(
        of({ statusCode: 200, data: { response: 'no req' } }),
      );
      component.posthealthIDValidationCall();
      expect(dialogRef.close).toHaveBeenCalledWith({ clearHealthID: true });
      expect(confirmation.alert).toHaveBeenCalledWith('no req', 'error');
    });

    it('alerts status on non-200 and on error', () => {
      registrar.verifyOTPForHealthIDValidation.and.returnValue(
        of({ statusCode: 500, status: 'x' }),
      );
      component.posthealthIDValidationCall();
      expect(confirmation.alert).toHaveBeenCalledWith('x', 'error');
      registrar.verifyOTPForHealthIDValidation.and.returnValue(throwingObs());
      component.posthealthIDValidationCall();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.issueInGettingBeneficiaryABHADetails,
        'error',
      );
      expect(component.showProgressBar).toBeFalse();
    });
  });

  describe('postHealthIDCardCall', () => {
    beforeEach(async () => {
      await setup({ healthId: 'NO' });
      component.transactionId = 'T';
      component.healthIdValidateForm.setValue({ validateotp: '9999' });
    });

    it('opens health card for AADHAR (converted to AADHAAR)', () => {
      component.healthIdMode = 'AADHAR';
      registrar.verifyOTPForHealthIDCard.and.returnValue(
        of({ statusCode: 200, data: { data: 'b64' } }),
      );
      component.postHealthIDCardCall();
      expect(registrar.verifyOTPForHealthIDCard).toHaveBeenCalledWith({
        authMethod: 'AADHAAR_OTP',
        otp: '9999',
        txnId: 'T',
      });
      expect(dialog.open).toHaveBeenCalledWith(ViewHealthIdCardComponent, {
        height: '530px',
        width: '800px',
        data: { imgBase64: 'b64' },
      });
      expect(dialogRef.close).toHaveBeenCalled();
    });

    it('alerts when card missing', () => {
      component.healthIdMode = 'MOBILE';
      registrar.verifyOTPForHealthIDCard.and.returnValue(
        of({ statusCode: 200, data: {} }),
      );
      component.postHealthIDCardCall();
      expect(
        registrar.verifyOTPForHealthIDCard.calls.mostRecent().args[0]
          .authMethod,
      ).toBe('MOBILE_OTP');
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.aBHACardNotAvailable,
        'error',
      );
    });

    it('alerts on non-200 and error', () => {
      registrar.verifyOTPForHealthIDCard.and.returnValue(
        of({ statusCode: 500, status: 's' }),
      );
      component.postHealthIDCardCall();
      expect(confirmation.alert).toHaveBeenCalledWith('s', 'error');
      registrar.verifyOTPForHealthIDCard.and.returnValue(throwingObs());
      component.postHealthIDCardCall();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.issueInGettingBeneficiaryABHADetails,
        'error',
      );
    });
  });
});
