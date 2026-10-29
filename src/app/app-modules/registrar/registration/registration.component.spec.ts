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
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, of } from 'rxjs';

import { RegistrationComponent } from './registration.component';
import { RegistrarService } from '../shared/services/registrar.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { RegistrationUtils } from '../shared/utility/registration-utility';
import { ConsentFormComponent } from '../consent-form/consent-form.component';
import { SearchFamilyComponent } from '../search-family/search-family.component';
import { HealthIdOtpGenerationComponent } from '../health-id-otp-generation/health-id-otp-generation.component';
import { HealthIdValidateComponent } from './register-other-details/register-other-details.component';
import { GenerateAbhaComponentComponent } from '../generate-abha-component/generate-abha-component.component';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  createDialogRefMock,
  throwingObs,
} from 'src/testing/test-utils';

const MASTER = {
  govIdEntityMaster: [
    { govtIdentityTypeID: 1, identityType: 'Aadhar' },
    { govtIdentityTypeID: 2, identityType: 'Voter ID' },
    { govtIdentityTypeID: 1, identityType: 'Aadhar' },
  ],
  otherGovIdEntityMaster: [
    { govtIdentityTypeID: 7, identityType: 'State Card' },
    { govtIdentityTypeID: 7, identityType: 'State Card' },
  ],
};

const SESSION = {
  serviceLineDetails: JSON.stringify({ facilityID: 9 }),
  userName: 'reg-user',
  providerServiceID: 42,
};

const alwaysInvalid = () => ({ bad: true });

function makeInvalid(group: FormGroup, names: string[]) {
  names.forEach((n) => {
    group.controls[n].setValidators(alwaysInvalid);
    group.controls[n].updateValueAndValidity();
  });
}

describe('RegistrationComponent (new registration)', () => {
  let fixture: ComponentFixture<RegistrationComponent>;
  let component: RegistrationComponent;
  let registrar: any;
  let confirmation: any;
  let dialog: any;
  let router: Router;
  let session: any;
  let otherDetailsMock: any;
  let demographicMock: any;
  let personalMock: any;

  beforeEach(async () => {
    registrar = autoSpy(RegistrarService, {
      registrationMasterDetails$: new BehaviorSubject<any>(MASTER),
      beneficiaryEditDetails$: new BehaviorSubject<any>(null),
      healthIdMobVerificationCheck$: new BehaviorSubject<any>(null),
      stateIdFamily: 'old',
    });
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [RegistrationComponent],
      providers: [
        ...commonTestProviders({ session: SESSION }),
        { provide: RegistrarService, useValue: registrar },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {} } } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(RegistrationComponent);
    component = fixture.componentInstance;
    otherDetailsMock = {
      resetForm: jasmine.createSpy('resetForm'),
      setcheckBoxEnabledByDefault: jasmine.createSpy('setcheck'),
      getRemovedIDs: jasmine
        .createSpy('getRemovedIDs')
        .and.returnValue({ removedGovIDs: [], removedOtherGovIDs: [] }),
    };
    demographicMock = {
      setDemographicDefaults: jasmine.createSpy('setDemographicDefaults'),
    };
    personalMock = {
      setPhoneSelectionEnabledByDefault: jasmine.createSpy('setPhone'),
      enableMaritalStatus: true,
      enableMarriageDetails: true,
    };
    const pin = (name: string, value: any) =>
      Object.defineProperty(component, name, {
        get: () => value,
        set: () => undefined,
        configurable: true,
      });
    pin('otherDetails', otherDetailsMock);
    pin('demographicDetails', demographicMock);
    pin('personalDetails', personalMock);

    confirmation = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    session = TestBed.inject(SessionStorageService);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();
  });

  const personal = () =>
    component.beneficiaryRegistrationForm.controls[
      'personalDetailsForm'
    ] as FormGroup;
  const demo = () =>
    component.beneficiaryRegistrationForm.controls[
      'demographicDetailsForm'
    ] as FormGroup;
  const other = () =>
    component.beneficiaryRegistrationForm.controls[
      'otherDetailsForm'
    ] as FormGroup;

  describe('initialisation', () => {
    it('creates the form, loads masters and language', () => {
      expect(component).toBeTruthy();
      expect(registrar.clearHealthIdMobVerification).toHaveBeenCalled();
      expect(registrar.stateIdFamily).toBeNull();
      expect(registrar.getRegistrationMaster).toHaveBeenCalledWith(1);
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.masterData).toEqual(MASTER);
      expect(component.govIDMaster).toEqual(MASTER.govIdEntityMaster);
      expect(component.otherGovIDMaster).toEqual(MASTER.otherGovIdEntityMaster);
      expect(component.personalDetailsForm).toBe(personal());
      expect(component.demographicDetailsForm).toBe(demo());
      expect(component.otherDetailsForm).toBe(other());
      expect(component.patientRevisit).toBeFalse();
    });

    it('ignores a null master data emission', () => {
      component.masterData = 'kept';
      registrar.registrationMasterDetails$.next(null);
      expect(component.masterData).toBe('kept');
    });

    it('opens the consent dialog for a new beneficiary and forwards the result', () => {
      const ref = createDialogRefMock('granted');
      dialog.open.and.returnValue(ref);
      component.openConsent();
      expect(dialog.open).toHaveBeenCalledWith(
        ConsentFormComponent,
        jasmine.objectContaining({ disableClose: true }),
      );
      expect(component.consentGranted).toBe('granted');
      expect(registrar.sendConsentStatus).toHaveBeenCalledWith('granted');
    });

    it('does not open the consent dialog in revisit mode', () => {
      dialog.open.calls.reset();
      component.patientRevisit = true;
      component.openConsent();
      expect(dialog.open).not.toHaveBeenCalled();
    });

    it('renders the submit and reset buttons for a new registration', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('#submitButton')).toBeTruthy();
      expect(el.querySelector('#resetButton')).toBeTruthy();
      expect(el.querySelector('#saveButton')).toBeNull();
    });

    it('setStep changes the open accordion step', () => {
      component.setStep(2);
      expect(component.step).toBe(2);
    });

    it('ngDoCheck re-reads the language', () => {
      component.currentLanguageSet = null;
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });
  });

  describe('setHealthIdAfterGeneration', () => {
    const fmt = (d: Date) =>
      `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    const base = {
      healthIdNumber: '11-2222',
      firstName: 'Asha',
      lastName: 'K',
      phoneNo: '9999999999',
      gender: 2,
      genderName: 'Female',
      stateID: 5,
      stateName: 'S',
      districtID: 6,
      districtName: 'D',
    };

    it('patches all forms and enables marital status for adults (via subscription)', () => {
      const d = new Date();
      d.setFullYear(d.getFullYear() - 30);
      d.setDate(d.getDate() - 10);
      registrar.healthIdMobVerificationCheck$.next({ ...base, dob: fmt(d) });
      expect(other().controls['healthId'].disabled).toBeTrue();
      expect(other().getRawValue().healthIdNumber).toBe('11-2222');
      expect(personal().value.firstName).toBe('Asha');
      expect(personal().value.genderName).toBe('Female');
      expect(demo().value.districtName).toBe('D');
      expect(personal().value.age).toBe(30);
      expect(personal().value.ageUnit).toBe('Years');
      expect(component.enableMaritalStatus).toBeTrue();
      expect(registrar.isMarriageEnable).toHaveBeenCalledWith(true);
    });

    it('computes age in months', () => {
      const d = new Date();
      d.setDate(d.getDate() - 95);
      component.setHealthIdAfterGeneration({ ...base, dob: fmt(d) });
      expect(personal().value.ageUnit).toBe('Months');
      expect(personal().value.age).toBeGreaterThan(0);
      expect(component.enableMaritalStatus).toBeFalse();
      expect(registrar.isMarriageEnable).toHaveBeenCalledWith(false);
    });

    it('computes age in days', () => {
      const d = new Date();
      d.setDate(d.getDate() - 5);
      component.setHealthIdAfterGeneration({ ...base, dob: fmt(d) });
      expect(personal().value.ageUnit).toBe('Days');
      expect(personal().value.age).toBe(5);
    });

    it('uses 1 Day for a child born today', () => {
      component.setHealthIdAfterGeneration({ ...base, dob: fmt(new Date()) });
      expect(personal().value.age).toBe(1);
      expect(personal().value.ageUnit).toBe('Day');
    });
  });

  describe('reset / navigation', () => {
    it('resetBeneficiaryForm resets form and child components', () => {
      const govID = other().controls['govID'] as FormArray;
      const utils = new RegistrationUtils(new FormBuilder());
      govID.push(utils.initGovID());
      govID.push(utils.initGovID());
      (other().controls['otherGovID'] as FormArray).push(utils.initGovID());
      other().controls['healthId'].disable();
      component.disableGenerateOTP = true;
      component.step = 2;

      component.resetBeneficiaryForm();

      expect(govID.length).toBe(1);
      expect((other().controls['otherGovID'] as FormArray).length).toBe(1);
      expect(personal().value.ageUnit).toBe('Years');
      expect(otherDetailsMock.resetForm).toHaveBeenCalled();
      expect(otherDetailsMock.setcheckBoxEnabledByDefault).toHaveBeenCalled();
      expect(demographicMock.setDemographicDefaults).toHaveBeenCalled();
      expect(personalMock.setPhoneSelectionEnabledByDefault).toHaveBeenCalled();
      expect(personalMock.enableMaritalStatus).toBeFalse();
      expect(personalMock.enableMarriageDetails).toBeFalse();
      const d = new Date();
      expect(personal().controls['registrationDate'].value).toBe(
        `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`,
      );
      expect(component.step).toBe(0);
      expect(other().controls['healthId'].enabled).toBeTrue();
      expect(component.disableGenerateOTP).toBeFalse();
    });

    it('confirmFormReset(true) on a dirty form resets after confirmation', () => {
      component.beneficiaryRegistrationForm.markAsDirty();
      spyOn(component, 'resetBeneficiaryForm');
      component.confirmFormReset(true);
      expect(confirmation.confirm).toHaveBeenCalledWith(
        'warn',
        LANGUAGE_EN.alerts.info.resetDetails,
      );
      expect(component.resetBeneficiaryForm).toHaveBeenCalled();
    });

    it('confirmFormReset(true) on a dirty form does nothing when declined', () => {
      component.beneficiaryRegistrationForm.markAsDirty();
      confirmation.confirm.and.returnValue(of(false));
      spyOn(component, 'resetBeneficiaryForm');
      component.confirmFormReset(true);
      expect(component.resetBeneficiaryForm).not.toHaveBeenCalled();
    });

    it('confirmFormReset(false) on a dirty form navigates after confirmation', () => {
      component.beneficiaryRegistrationForm.markAsDirty();
      component.confirmFormReset(false);
      expect(confirmation.confirm).toHaveBeenCalledWith(
        'info',
        LANGUAGE_EN.alerts.info.navigateFurtherAlert,
        'Yes',
        'No',
      );
      expect(router.navigate).toHaveBeenCalledWith(['/registrar/search/']);
    });

    it('confirmFormReset(false) on a dirty form stays when declined', () => {
      component.beneficiaryRegistrationForm.markAsDirty();
      confirmation.confirm.and.returnValue(of(false));
      component.confirmFormReset(false);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('confirmFormReset(false) on a pristine form navigates directly', () => {
      component.confirmFormReset(false);
      expect(confirmation.confirm).not.toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/registrar/search/']);
    });

    it('confirmFormReset(true) on a pristine form does nothing', () => {
      component.confirmFormReset(true);
      expect(confirmation.confirm).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('govIDReset tolerates missing arrays', () => {
      other().removeControl('govID');
      other().removeControl('otherGovID');
      expect(() => component.govIDReset()).not.toThrow();
    });

    it('cancelBeneficiaryChanges navigates when confirmed', () => {
      component.cancelBeneficiaryChanges();
      expect(confirmation.confirm).toHaveBeenCalledWith(
        'info',
        LANGUAGE_EN.alerts.info.unsavedChanges,
      );
      expect(router.navigate).toHaveBeenCalledWith(['/registrar/search/']);
    });

    it('cancelBeneficiaryChanges stays when declined', () => {
      confirmation.confirm.and.returnValue(of(false));
      component.cancelBeneficiaryChanges();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('canDeactivate asks for confirmation only when dirty', () => {
      let result: any;
      component.canDeactivate().subscribe((r) => (result = r));
      expect(result).toBeTrue();
      expect(confirmation.confirm).not.toHaveBeenCalled();

      confirmation.confirm.and.returnValue(of(false));
      component.beneficiaryRegistrationForm.markAsDirty();
      component.canDeactivate().subscribe((r) => (result = r));
      expect(result).toBeFalse();
    });

    it('redirectToSearch navigates and alerts asynchronously', fakeAsync(() => {
      component.redirectToSearch();
      expect(router.navigate).toHaveBeenCalledWith(['/registrar/search/']);
      tick();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.issueInFetchDetails,
        'info',
      );
    }));

    it('ngOnDestroy resets the form without touching revisit subscription', () => {
      spyOn(component, 'resetBeneficiaryForm');
      component.ngOnDestroy();
      expect(component.resetBeneficiaryForm).toHaveBeenCalled();
      expect(registrar.clearBeneficiaryEditDetails).not.toHaveBeenCalled();
    });
  });

  describe('checkValids', () => {
    it('returns true when everything is valid', () => {
      demo().patchValue({ stateID: 1 });
      expect(
        component.checkValids(component.beneficiaryRegistrationForm),
      ).toBeTrue();
      expect(confirmation.notify).not.toHaveBeenCalled();
    });

    it('lists every invalid field for an adult married literate beneficiary', () => {
      makeInvalid(personal(), [
        'maritalStatus',
        'firstName',
        'gender',
        'phoneNo',
        'age',
        'name',
        'ageAtMarriage',
        'spouseName',
        'occupationOther',
        'educationQualification',
        'lastName',
      ]);
      personal().addControl(
        'alternatePhoneNumber',
        new FormControl(null, alwaysInvalid),
      );
      personal().patchValue({
        age: 30,
        ageUnit: 'Years',
        maritalStatus: 2,
        literacyStatus: 'Literate',
      });
      makeInvalid(demo(), [
        'stateID',
        'districtID',
        'blockID',
        'villageID',
        'parkingPlace',
        'zoneID',
        'servicePoint',
        'habitation',
      ]);
      other().addControl('blockID', new FormControl(null, alwaysInvalid));
      makeInvalid(other(), [
        'emailID',
        'govID',
        'otherGovID',
        'fatherName',
        'community',
        'bankName',
      ]);

      expect(
        component.checkValids(component.beneficiaryRegistrationForm),
      ).toBeFalse();
      const [title, required] = confirmation.notify.calls.mostRecent().args;
      expect(title).toBe(LANGUAGE_EN.alerts.info.mandatoryFields);
      const pi = LANGUAGE_EN.ro.personalInfo;
      const li = LANGUAGE_EN.ro.locInfo;
      expect(required).toEqual(
        jasmine.arrayContaining([
          pi.maritalStatus,
          pi.firstName,
          LANGUAGE_EN.ro.personalInfo.gender,
          LANGUAGE_EN.bendetails.phoneNo,
          LANGUAGE_EN.bendetails.age,
          pi.name,
          pi.alternateNumber,
          pi.ageAtMarriage,
          pi.spouseName,
          pi.otherOccupation,
          pi.educationalQualification,
          li.state,
          li.district_Town_City,
          li.taluk,
          li.street,
          LANGUAGE_EN.emailAddress,
          LANGUAGE_EN.block,
          LANGUAGE_EN.otherGovtID,
          LANGUAGE_EN.ro.otherInfo.fName,
          LANGUAGE_EN.ro.otherInfo.community,
          LANGUAGE_EN.govID,
        ]),
      );
    });

    it('skips age-dependent fields for a minor / illiterate beneficiary', () => {
      makeInvalid(personal(), [
        'maritalStatus',
        'ageAtMarriage',
        'spouseName',
        'educationQualification',
      ]);
      personal().patchValue({
        age: 5,
        ageUnit: 'Years',
        literacyStatus: 'Illiterate',
      });
      demo().patchValue({ stateID: 1 });
      expect(
        component.checkValids(component.beneficiaryRegistrationForm),
      ).toBeTrue();
    });

    it('flags short gov IDs by maxLength and driving licence by minLength', () => {
      demo().patchValue({ stateID: 1 });
      const govID = other().controls['govID'] as FormArray;
      govID.at(0).patchValue({ type: 2, idValue: 'AB1', maxLength: 10 });
      expect(
        component.checkValids(component.beneficiaryRegistrationForm),
      ).toBeFalse();
      expect(confirmation.notify.calls.mostRecent().args[1]).toEqual([
        LANGUAGE_EN.govID,
      ]);

      govID
        .at(0)
        .patchValue({ type: 3, idValue: 'AB1', minLength: 8, maxLength: 20 });
      expect(
        component.checkValids(component.beneficiaryRegistrationForm),
      ).toBeFalse();

      govID.at(0).patchValue({ type: 3, idValue: 'ABCDEFGH1', minLength: 8 });
      expect(
        component.checkValids(component.beneficiaryRegistrationForm),
      ).toBeTrue();
    });
  });

  describe('checkgenerateOtpValids', () => {
    const form = () => component.beneficiaryRegistrationForm;

    it('requires personal fields in MOBILE mode', () => {
      makeInvalid(personal(), ['firstName', 'gender', 'age']);
      other().patchValue({ healthIdMode: 'MOBILE' });
      expect(component.checkgenerateOtpValids(form())).toBeFalse();
      expect(confirmation.notify.calls.mostRecent().args[1]).toEqual([
        LANGUAGE_EN.ro.personalInfo.firstName,
        LANGUAGE_EN.bendetails.gender,
        LANGUAGE_EN.bendetails.phoneNo,
        LANGUAGE_EN.bendetails.age,
        LANGUAGE_EN.ro.personalInfo.lastName,
        LANGUAGE_EN.aBHA,
      ]);
    });

    it('requires the ABHA generation mode when missing', () => {
      makeInvalid(personal(), ['firstName']);
      expect(component.checkgenerateOtpValids(form())).toBeFalse();
      expect(confirmation.notify.calls.mostRecent().args[1]).toEqual([
        LANGUAGE_EN.aBHA,
        LANGUAGE_EN.aBHAGenerationMode,
      ]);
    });

    it('returns true for a complete MOBILE request with a valid ABHA address', () => {
      personal().patchValue({ lastName: 'K', phoneNo: '9999999999' });
      other().patchValue({ healthIdMode: 'MOBILE', healthId: 'abcd.12ef' });
      expect(component.checkgenerateOtpValids(form())).toBeTrue();
      expect(confirmation.notify).not.toHaveBeenCalled();
    });

    ['ab.cdef', 'abc#def', 'abcdefg', 'abcd.e.f'].forEach((hid) => {
      it(`rejects malformed ABHA address "${hid}" without notifying`, () => {
        other().patchValue({ healthIdMode: 'MOBILE', healthId: hid });
        expect(component.checkgenerateOtpValids(form())).toBeFalse();
        expect(confirmation.notify).not.toHaveBeenCalled();
      });
    });

    it('AADHAR mode requires an Aadhar entry', () => {
      other().patchValue({ healthIdMode: 'AADHAR', healthId: 'abcd.efgh' });
      expect(component.checkgenerateOtpValids(form())).toBeFalse();
      expect(confirmation.notify.calls.mostRecent().args[1]).toEqual([
        LANGUAGE_EN.aadhar,
      ]);
    });

    it('AADHAR mode flags an incomplete Aadhar number', () => {
      other().patchValue({ healthIdMode: 'AADHAR', healthId: 'abcd.efgh' });
      (other().controls['govID'] as FormArray)
        .at(0)
        .patchValue({ type: 1, idValue: '1234', maxLength: 12 });
      expect(component.checkgenerateOtpValids(form())).toBeFalse();
      expect(confirmation.notify.calls.mostRecent().args[1]).toEqual([
        LANGUAGE_EN.govID,
      ]);
    });

    it('AADHAR mode with only a non-Aadhar ID and empty value requires both', () => {
      other().patchValue({ healthIdMode: 'AADHAR', healthId: 'abcd.efgh' });
      (other().controls['govID'] as FormArray)
        .at(0)
        .patchValue({ type: 2, idValue: null });
      expect(component.checkgenerateOtpValids(form())).toBeFalse();
      expect(confirmation.notify.calls.mostRecent().args[1]).toEqual([
        LANGUAGE_EN.aadhar,
        LANGUAGE_EN.govID,
      ]);
    });

    it('AADHAR mode passes with a full Aadhar number', () => {
      other().patchValue({ healthIdMode: 'AADHAR', healthId: 'abcd.efgh' });
      (other().controls['govID'] as FormArray)
        .at(0)
        .patchValue({ type: 1, idValue: '123412341234', maxLength: 12 });
      expect(component.checkgenerateOtpValids(form())).toBeTrue();
    });

    it('isLetter / is_numeric helpers', () => {
      expect(component.isLetter('a')).toBeTruthy();
      expect(component.isLetter('1')).toBeFalsy();
      expect(component.isLetter('ab')).toBeFalsy();
      expect(component.is_numeric('7')).toBeTrue();
      expect(component.is_numeric('x')).toBeFalse();
    });
  });

  describe('checkValidHealthID', () => {
    it('save mode: false without IDs, depends on disableGenerateOTP with IDs', () => {
      expect(component.checkValidHealthID('save')).toBeFalse();
      other().patchValue({ healthIdNumber: '12' });
      component.disableGenerateOTP = false;
      expect(component.checkValidHealthID('save')).toBeFalse();
      component.disableGenerateOTP = true;
      expect(component.checkValidHealthID('save')).toBeTrue();
    });

    it('validate mode: clears an unverified ABHA', () => {
      expect(component.checkValidHealthID(null)).toBeTrue();
      other().patchValue({ healthId: 'x.y' });
      component.disableGenerateOTP = false;
      expect(component.checkValidHealthID(null)).toBeFalse();
      expect(other().value.healthId).toBeNull();
      other().patchValue({ healthId: 'x.y' });
      component.disableGenerateOTP = true;
      expect(component.checkValidHealthID(null)).toBeTrue();
    });
  });

  describe('postButtonCall', () => {
    beforeEach(() => {
      spyOn(component, 'submitBeneficiaryDetails');
      spyOn(component, 'updateBeneficiarynPassToNurse');
    });

    it('submits a new beneficiary when valid', () => {
      spyOn(component, 'checkValids').and.returnValue(true);
      component.postButtonCall();
      expect(component.submitBeneficiaryDetails).toHaveBeenCalled();
      expect(component.updateBeneficiarynPassToNurse).not.toHaveBeenCalled();
    });

    it('updates when in revisit mode', () => {
      spyOn(component, 'checkValids').and.returnValue(true);
      component.patientRevisit = true;
      component.postButtonCall();
      expect(component.updateBeneficiarynPassToNurse).toHaveBeenCalled();
    });

    it('does nothing when invalid', () => {
      spyOn(component, 'checkValids').and.returnValue(false);
      component.postButtonCall();
      expect(component.submitBeneficiaryDetails).not.toHaveBeenCalled();
      expect(component.updateBeneficiarynPassToNurse).not.toHaveBeenCalled();
    });
  });

  describe('ABHA generation', () => {
    it('generateABHACard passes IDs and opens OTP when valid', () => {
      spyOn(component, 'checkgenerateOtpValids').and.returnValue(true);
      spyOn(component, 'getOTP');
      other().patchValue({ healthId: 'a.b', healthIdMode: 'MOBILE' });
      component.generateABHACard();
      expect(registrar.passIDsToFetchOtp).toHaveBeenCalledWith({
        healthId: 'a.b',
        healthIdMode: 'MOBILE',
      });
      expect(component.getOTP).toHaveBeenCalled();
    });

    it('generateABHACard does nothing when invalid', () => {
      spyOn(component, 'checkgenerateOtpValids').and.returnValue(false);
      spyOn(component, 'getOTP');
      component.generateABHACard();
      expect(registrar.passIDsToFetchOtp).not.toHaveBeenCalled();
      expect(component.getOTP).not.toHaveBeenCalled();
    });

    const openOtp = (result: any) => {
      dialog.open.and.returnValue(createDialogRefMock(result));
      component.getOTP();
      return dialog.open.calls.mostRecent().args;
    };

    it('getOTP builds dialog data (address line 1 only, female, AADHAR)', () => {
      personal().patchValue({
        dob: new Date(2000, 4, 7),
        genderName: 'Female',
        firstName: 'A',
        phoneNo: '9',
      });
      demo().patchValue({ addressLine1: 'L1', pincode: null });
      other().patchValue({ healthIdMode: 'AADHAR' });
      (other().controls['govID'] as FormArray)
        .at(0)
        .patchValue({ type: 1, idValue: '1111' });
      const [comp, cfg] = openOtp({ healthId: 'h.x', healthIdNumber: '77' });
      expect(comp).toBe(HealthIdOtpGenerationComponent);
      expect(cfg.data).toEqual(
        jasmine.objectContaining({
          gender: 'F',
          dayOfBirth: '7',
          monthOfBirth: '5',
          yearOfBirth: '2000',
          address: 'L1',
          pincode: 0,
          aadharNumber: '1111',
        }),
      );
      expect(other().getRawValue().healthId).toBe('h.x');
      expect(other().getRawValue().healthIdNumber).toBe('77');
      expect(other().controls['healthId'].disabled).toBeTrue();
      expect(component.disableGenerateOTP).toBeTrue();
    });

    it('getOTP joins address lines 1 and 3 (male)', () => {
      personal().patchValue({ dob: new Date(2000, 0, 1), genderName: 'Male' });
      demo().patchValue({ addressLine1: 'L1', addressLine3: 'L3', pincode: 5 });
      const [, cfg] = openOtp(undefined);
      expect(cfg.data.address).toBe('L1|L3');
      expect(cfg.data.gender).toBe('M');
      expect(cfg.data.pincode).toBe(5);
      expect(component.disableGenerateOTP).toBeFalse();
    });

    it('getOTP joins address lines 1 and 2 (other gender)', () => {
      personal().patchValue({ dob: new Date(2000, 0, 1), genderName: 'X' });
      demo().patchValue({ addressLine1: 'L1', addressLine2: 'L2' });
      const [, cfg] = openOtp(null);
      expect(cfg.data.address).toBe('L1|L2');
      expect(cfg.data.gender).toBe('O');
    });

    it('getOTP joins all address lines', () => {
      personal().patchValue({ dob: new Date(2000, 0, 1) });
      demo().patchValue({
        addressLine1: 'L1',
        addressLine2: 'L2',
        addressLine3: 'L3',
      });
      const [, cfg] = openOtp(null);
      expect(cfg.data.address).toBe('L1|L2|L3');
    });

    it('disableGenerateHealthID sets the flag', () => {
      component.disableGenerateHealthID();
      expect(component.disableGenerateOTP).toBeTrue();
    });

    it('healthIdSearch clears the ABHA when asked', () => {
      other().patchValue({ healthId: 'a', healthIdMode: 'MOBILE' });
      dialog.open.and.returnValue(createDialogRefMock({ clearHealthID: true }));
      component.healthIdSearch();
      expect(dialog.open.calls.mostRecent().args[0]).toBe(
        HealthIdValidateComponent,
      );
      expect(other().value.healthId).toBeNull();
      expect(other().value.healthIdMode).toBeNull();
    });

    it('healthIdSearch patches the verified ABHA', () => {
      const res = { healthIdNumber: '55', healthIdMode: 'AADHAR' };
      dialog.open.and.returnValue(createDialogRefMock(res));
      component.healthIdSearch();
      expect(other().getRawValue().healthId).toBe('55');
      expect(other().value.healthIdMode).toBe('AADHAR');
      expect(other().controls['healthId'].disabled).toBeTrue();
      expect(other().dirty).toBeTrue();
      expect(registrar.changePersonalDetailsData).toHaveBeenCalledWith(res);
      expect(component.disableGenerateOTP).toBeTrue();
    });

    it('healthIdSearch ignores an empty result', () => {
      dialog.open.and.returnValue(createDialogRefMock(undefined));
      component.healthIdSearch();
      expect(registrar.changePersonalDetailsData).not.toHaveBeenCalled();
    });

    it('printHealthIDCard opens the search in card mode', () => {
      spyOn(component, 'healthIdSearch');
      component.printHealthIDCard();
      expect(component.genrateHealthIDCard).toBeTrue();
      expect(component.healthIdSearch).toHaveBeenCalled();
    });

    it('generateAbhaCard opens the generator dialog', () => {
      component.generateAbhaCard();
      expect(dialog.open).toHaveBeenCalledWith(
        GenerateAbhaComponentComponent,
        jasmine.objectContaining({ disableClose: true }),
      );
    });
  });

  describe('submitBeneficiaryDetails', () => {
    beforeEach(() => {
      personal().patchValue({
        dob: new Date(1990, 1, 2),
        firstName: 'A',
        phoneNo: '98',
      });
      demo().patchValue({ stateID: 1 });
      (other().controls['govID'] as FormArray)
        .at(0)
        .patchValue({ type: 1, idValue: '111' });
      (other().controls['otherGovID'] as FormArray)
        .at(0)
        .patchValue({ type: 7, idValue: 'S1' });
    });

    it('submits, maps ABHA and proceeds to family tagging on confirm', () => {
      registrar.submitBeneficiary.and.returnValue(
        of({ statusCode: 200, data: { response: 'Registered ID 12345' } }),
      );
      spyOn(component, 'getBeneficiaryDetailsForFamilyTagging');
      other().patchValue({
        healthId: 'a.b',
        healthIdNumber: '99',
        healthIdMode: 'MOBILE',
      });
      component.disableGenerateOTP = true;

      component.submitBeneficiaryDetails();

      const payload = registrar.submitBeneficiary.calls.mostRecent().args[0];
      expect(payload.facilityID).toBe(9);
      expect(payload.createdBy).toBe('reg-user');
      expect(payload.dOB).toBe(new Date(1990, 1, 2).toISOString());
      expect(payload.benPhoneMaps[0]).toEqual(
        jasmine.objectContaining({
          phoneTypeID: 1,
          facilityID: 9,
          createdBy: 'reg-user',
        }),
      );
      // iEMRids does not de-duplicate the master, so duplicated master rows yield duplicates
      expect(payload.beneficiaryIdentities.length).toBe(4);
      expect(payload.beneficiaryIdentities[0]).toEqual(
        jasmine.objectContaining({
          govtIdentityNo: '111',
          identityType: 'National ID',
        }),
      );
      expect(payload.beneficiaryIdentities[3]).toEqual(
        jasmine.objectContaining({
          govtIdentityNo: 'S1',
          identityType: 'State ID',
        }),
      );
      expect(registrar.mapHealthId).toHaveBeenCalledWith(
        jasmine.objectContaining({
          beneficiaryID: '12345',
          healthId: 'a.b',
          healthIdNumber: '99',
          authenticationMode: 'MOBILE',
          providerServiceMapId: 42,
        }),
      );
      expect(confirmation.confirm).toHaveBeenCalledWith(
        'success',
        'Registered ID 12345\n' + LANGUAGE_EN.proceedForFamilyTaggingProcess,
        'Yes',
        'No',
      );
      expect(
        component.getBeneficiaryDetailsForFamilyTagging,
      ).toHaveBeenCalledWith('12345');
      expect(component.disableGenerateOTP).toBeFalse();
    });

    it('alerts when ABHA mapping fails, resets and navigates when family tagging is declined', () => {
      registrar.submitBeneficiary.and.returnValue(
        of({ statusCode: 200, data: { response: 'ID 7' } }),
      );
      registrar.mapHealthId.and.returnValue(of({ statusCode: 500 }));
      confirmation.confirm.and.returnValue(of(false));
      spyOn(component, 'resetBeneficiaryForm');
      other().patchValue({ healthIdNumber: '99' });
      component.disableGenerateOTP = true;

      component.submitBeneficiaryDetails();

      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.issueInSavngData,
        'error',
      );
      expect(component.resetBeneficiaryForm).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/registrar/search/']);
    });

    it('skips ABHA mapping when no ABHA and accepts an object service line', () => {
      session.store.set('serviceLineDetails', { facilityID: 3 });
      registrar.submitBeneficiary.and.returnValue(
        of({ statusCode: 200, data: { response: 'ID 7' } }),
      );
      spyOn(component, 'getBeneficiaryDetailsForFamilyTagging');
      personal().patchValue({ phoneNo: null });
      component.submitBeneficiaryDetails();
      const payload = registrar.submitBeneficiary.calls.mostRecent().args[0];
      expect(payload.facilityID).toBe(3);
      expect(payload.benPhoneMaps[0].phoneTypeID).toBeNull();
      expect(registrar.mapHealthId).not.toHaveBeenCalled();
    });

    it('alerts when registration fails', () => {
      registrar.submitBeneficiary.and.returnValue(of({ statusCode: 5000 }));
      component.submitBeneficiaryDetails();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.issueInSavngData,
        'error',
      );
      expect(confirmation.confirm).not.toHaveBeenCalled();
    });
  });

  describe('family tagging', () => {
    const args = [1, 'Sur', 'Name', 2, 3, 4, 5] as const;

    it('openSearchFamily navigates with selected family list', () => {
      dialog.open.and.returnValue(createDialogRefMock([{ id: 1 }]));
      component.openSearchFamily(...args);
      expect(dialog.open.calls.mostRecent().args[0]).toBe(
        SearchFamilyComponent,
      );
      expect(dialog.open.calls.mostRecent().args[1].data).toEqual({
        benSurname: 'Sur',
        benDistrictId: 2,
        benBlockId: 3,
        benVillageId: 4,
      });
      expect(router.navigate).toHaveBeenCalledWith([
        '/registrar/familyTagging',
        {
          beneficiaryRegID: 1,
          familyName: 'Sur',
          beneficiaryName: 'Name',
          familySearchListDetails: JSON.stringify([{ id: 1 }]),
          benDistrictId: 2,
          benBlockId: 3,
          benVillageId: 4,
          beneficiaryId: 5,
        },
      ]);
    });

    it('openSearchFamily navigates without list when dialog closed empty', () => {
      dialog.open.and.returnValue(createDialogRefMock(undefined));
      component.openSearchFamily(...args);
      const reqObj = (router.navigate as jasmine.Spy).calls.mostRecent()
        .args[0][1];
      expect(reqObj.familySearchListDetails).toBeUndefined();
      expect(reqObj.beneficiaryId).toBe(5);
    });

    it('getBeneficiaryDetailsForFamilyTagging opens search family with details', () => {
      spyOn(component, 'openSearchFamily');
      registrar.identityQuickSearch.and.returnValue(
        of({
          data: [
            {
              beneficiaryRegID: 11,
              firstName: 'F',
              lastName: 'L',
              beneficiaryID: 22,
              i_bendemographics: {
                districtID: 1,
                blockID: 2,
                districtBranchID: 3,
              },
            },
          ],
        }),
      );
      component.getBeneficiaryDetailsForFamilyTagging('22');
      expect(registrar.identityQuickSearch).toHaveBeenCalledWith(
        jasmine.objectContaining({
          beneficiaryID: '22',
          beneficiaryRegID: null,
        }),
      );
      expect(component.openSearchFamily).toHaveBeenCalledWith(
        11,
        'L',
        'F L',
        1,
        2,
        3,
        22,
      );
    });

    it('getBeneficiaryDetailsForFamilyTagging defaults missing fields to null', () => {
      spyOn(component, 'openSearchFamily');
      registrar.identityQuickSearch.and.returnValue(
        of({ data: [{ lastName: '', i_bendemographics: {} }] }),
      );
      component.getBeneficiaryDetailsForFamilyTagging('1');
      expect(component.openSearchFamily).toHaveBeenCalledWith(
        null,
        '',
        null,
        null,
        null,
        null,
        null,
      );
    });

    it('getBeneficiaryDetailsForFamilyTagging ignores ambiguous results', () => {
      spyOn(component, 'openSearchFamily');
      registrar.identityQuickSearch.and.returnValue(of({ data: [{}, {}] }));
      component.getBeneficiaryDetailsForFamilyTagging('1');
      expect(component.openSearchFamily).not.toHaveBeenCalled();
    });

    it('getBeneficiaryDetailsForFamilyTagging alerts on error', () => {
      registrar.identityQuickSearch.and.returnValue(throwingObs('oops'));
      component.getBeneficiaryDetailsForFamilyTagging('1');
      expect(confirmation.alert).toHaveBeenCalledWith('oops', 'error');
    });
  });

  describe('payload helpers', () => {
    it('makePhoneTypeID', () => {
      expect(component.makePhoneTypeID('1')).toBe(1);
      expect(component.makePhoneTypeID(null)).toBeNull();
    });

    it('getBenPhMapID / getBenAlternatePhMapID map "null" to null', () => {
      expect(component.getBenPhMapID('null')).toBeNull();
      expect(component.getBenPhMapID('5')).toBe('5');
      expect(component.getBenAlternatePhMapID('null')).toBeNull();
      expect(component.getBenAlternatePhMapID('6')).toBe('6');
    });

    it('getRelationTypeForUpdate', () => {
      expect(component.getRelationTypeForUpdate(1, null)).toBe('Self');
      expect(component.getRelationTypeForUpdate(11, null)).toBe('Other');
      expect(component.getRelationTypeForUpdate(3, null)).toBeNull();
    });

    it('iEMRids ignores entries without type/value', () => {
      expect(
        component.iEMRids(
          [
            { type: 1, idValue: null },
            { type: null, idValue: 'x' },
          ],
          [{}],
        ),
      ).toEqual([]);
    });

    it('dateFormatChange converts dob to ISO', () => {
      personal().patchValue({ dob: new Date(2001, 2, 3) });
      expect(component.dateFormatChange()).toBe(
        new Date(2001, 2, 3).toISOString(),
      );
    });
  });
});
