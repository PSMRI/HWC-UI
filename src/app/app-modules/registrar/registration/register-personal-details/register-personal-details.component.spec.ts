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
import { FormBuilder, FormGroup } from '@angular/forms';
import { BehaviorSubject, of } from 'rxjs';
import * as moment from 'moment';

import { RegisterPersonalDetailsComponent } from './register-personal-details.component';
import { RegistrarService } from '../../shared/services/registrar.service';
import { RegistrationUtils } from '../../shared/utility/registration-utility';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { CameraService } from '../../../core/services/camera.service';
import { BeneficiaryDetailsService } from '../../../core/services/beneficiary-details.service';
import { MaterialModule } from '../../../core/material.module';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

const MASTER = {
  genderMaster: [
    { genderID: 1, genderName: 'Male' },
    { genderID: 2, genderName: 'Female' },
    { genderID: 3, genderName: 'Transgender' },
  ],
  maritalStatusMaster: [
    { maritalStatusID: 1, status: 'Unmarried' },
    { maritalStatusID: 2, status: 'Married' },
    { maritalStatusID: 5, status: 'Widow' },
    { maritalStatusID: 6, status: 'Widower' },
    { maritalStatusID: 7, status: 'NotApplicable' },
  ],
  incomeMaster: [
    { incomeStatusID: 1, incomeStatus: 'BPL' },
    { incomeStatusID: 2, incomeStatus: 'APL' },
  ],
  literacyStatus: [
    { literacystatusID: 1, literacystatus: 'Literate' },
    { literacystatusID: 2, literacystatus: 'Illiterate' },
  ],
  qualificationMaster: [
    { educationID: 1, educationType: 'Primary' },
    { educationID: 2, educationType: 'Graduate' },
  ],
  occupationMaster: [
    { occupationID: 1, occupationType: 'Farmer' },
    { occupationID: 7, occupationType: 'Other' },
  ],
  ageUnit: [
    { id: 'Years', name: 'Years' },
    { id: 'Months', name: 'Months' },
  ],
};

function editData(overrides: any = {}) {
  return {
    beneficiaryID: 11,
    beneficiaryRegID: 22,
    firstName: 'Ravi',
    lastName: 'Kumar',
    benAccountID: 33,
    dOB: '1990-01-01T00:00:00.000Z',
    name: 'Years',
    m_gender: { genderID: 1, genderName: 'Male' },
    maritalStatus: { maritalStatusID: 2, status: 'Married' },
    spouseName: 'Sita',
    ageAtMarriage: 25,
    literacyStatus: 'Literate',
    benPhoneMaps: [
      {
        phoneNo: '9999999999',
        alternateContactNumber: '8888888888',
        parentBenRegID: 44,
        benRelationshipID: 1,
        benPhMapID: 55,
        benRelationshipType: { benRelationshipType: 'Self' },
      },
    ],
    i_bendemographics: {
      incomeStatus: 'APL',
      i_beneficiaryeducation: { educationID: 2, educationType: 'Graduate' },
      occupationID: 1,
      occupationName: 'Farmer',
    },
    ...overrides,
  };
}

describe('RegisterPersonalDetailsComponent', () => {
  let fixture: ComponentFixture<RegisterPersonalDetailsComponent>;
  let component: RegisterPersonalDetailsComponent;
  let registrar: any;
  let confirmation: any;
  let camera: any;
  let benDetails: any;
  let form: FormGroup;

  async function setup(
    opts: {
      revisit?: boolean;
      master?: any;
      edit?: any;
      marital?: any;
      dialog?: any;
      render?: boolean;
    } = {},
  ) {
    registrar = autoSpy(RegistrarService, {
      registrationMasterDetails$: new BehaviorSubject<any>(
        opts.master === undefined ? MASTER : opts.master,
      ),
      beneficiaryEditDetails$: new BehaviorSubject<any>(opts.edit ?? null),
      maritalStatus$: new BehaviorSubject<any>(opts.marital ?? null),
      dialogResult$: new BehaviorSubject<any>(opts.dialog ?? null),
    });
    registrar.changePersonalDetailsData.and.returnValue(undefined);
    registrar.clearMaritalDetails.and.returnValue(undefined);
    camera = autoSpy(CameraService);
    benDetails = autoSpy(BeneficiaryDetailsService);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [RegisterPersonalDetailsComponent],
      providers: [
        ...commonTestProviders(),
        { provide: RegistrarService, useValue: registrar },
        { provide: CameraService, useValue: camera },
        { provide: BeneficiaryDetailsService, useValue: benDetails },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(RegisterPersonalDetailsComponent);
    component = fixture.componentInstance;
    form = new RegistrationUtils(new FormBuilder()).createPersonalDetailsForm();
    component.personalDetailsForm = form;
    component.patientRevisit = !!opts.revisit;
    confirmation = TestBed.inject(ConfirmationService);
    if (opts.render === false) {
      component.ngOnInit();
    } else {
      fixture.detectChanges();
    }
  }

  afterEach(() => {
    fixture?.destroy();
  });

  describe('new registration', () => {
    beforeEach(async () => setup());

    it('initialises defaults, language and calendar config', () => {
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
      expect(component.masterData).toEqual(MASTER);
      expect(form.value.ageUnit).toBe('Years');
      expect(form.value.checked).toBeTrue();
      expect(form.value.imageChangeFlag).toBeFalse();
      expect(component.isMobileNoRequired).toBeTrue();
      expect(component.bsConfig).toEqual({
        containerClass: 'theme-dark-blue',
        dateInputFormat: 'DD/MM/YYYY',
        showWeekNumbers: false,
      });
      expect(component.minDate.getFullYear()).toBe(
        component.today.getFullYear() - 121,
      );
      expect(registrar.changePersonalDetailsData).toHaveBeenCalledWith(null);
      expect(component.MaritalStatus).toBeFalse();
    });

    it('patches name and gender from health-id dialog result', () => {
      registrar.dialogResult$.next({
        firstName: 'A',
        lastName: 'B',
        gender: 2,
      });
      expect(form.value.firstName).toBe('A');
      expect(form.value.lastName).toBe('B');
      expect(form.value.genderName).toBe('Female');
      expect(
        component.maritalStatusMaster.map((m: any) => m.maritalStatusID),
      ).toEqual([1, 2, 5, 7]);
    });

    it('ngDoCheck re-reads language', () => {
      component.current_language_set = null;
      component.ngDoCheck();
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
    });

    it('hides datepicker on window scroll', () => {
      const hide = jasmine.createSpy('hide');
      component.datepicker = { hide } as any;
      component.onScrollEvent();
      expect(hide).toHaveBeenCalled();
    });

    it('ngOnDestroy unsubscribes and clears marital details', () => {
      const m = spyOn(component.masterDataSubscription, 'unsubscribe');
      const p = spyOn(
        component.personalDataOnHealthIDSubscription,
        'unsubscribe',
      );
      component.ngOnDestroy();
      expect(m).toHaveBeenCalled();
      expect(p).toHaveBeenCalled();
      expect(registrar.clearMaritalDetails).toHaveBeenCalled();
    });

    it('ngOnDestroy tolerates missing subscriptions', () => {
      component.masterDataSubscription = null;
      component.personalDataOnHealthIDSubscription = null as any;
      component.ngOnDestroy();
      expect(registrar.clearMaritalDetails).toHaveBeenCalled();
    });

    it('marital status stream toggles flags', () => {
      form.patchValue({ gender: 1 });
      registrar.maritalStatus$.next(true);
      expect(component.MaritalStatus).toBeTrue();
      expect(component.enableMaritalStatus).toBeTrue();
      expect(form.value.genderName).toBe('Male');
      registrar.maritalStatus$.next(false);
      expect(component.MaritalStatus).toBeFalse();
      expect(component.enableMaritalStatus).toBeFalse();
    });

    it('phone map helpers return first entry or null', () => {
      const maps = editData().benPhoneMaps;
      expect(component.getPhoneMaps(maps)).toBe('9999999999');
      expect(component.getAlternatePhoneMaps(maps)).toBe('8888888888');
      expect(component.getPhoneMaps([])).toBeNull();
      expect(component.getAlternatePhoneMaps(null as any)).toBeNull();
    });

    it('checkMobileNoIsRequired / checkFingerPrintIsRequired follow the checkbox', () => {
      component.checkMobileNoIsRequired({ checked: false });
      expect(component.isMobileNoRequired).toBeFalse();
      component.checkMobileNoIsRequired({ checked: true });
      expect(component.isMobileNoRequired).toBeTrue();
      component.checkFingerPrintIsRequired({ checked: false });
      expect(component.isFingerPrintRequired).toBeFalse();
      component.checkFingerPrintIsRequired({ checked: true });
      expect(component.isFingerPrintRequired).toBeTrue();
    });

    describe('captureImage', () => {
      it('patches captured image without change flag for new ben', () => {
        camera.capture.and.returnValue(of('img64'));
        component.captureImage();
        expect(form.value.image).toBe('img64');
        expect(form.value.imageChangeFlag).toBeFalse();
      });

      it('sets imageChangeFlag on revisit', () => {
        component.patientRevisit = true;
        camera.capture.and.returnValue(of('img64'));
        component.captureImage();
        expect(form.value.imageChangeFlag).toBeTrue();
      });

      it('ignores empty result', () => {
        camera.capture.and.returnValue(of(null));
        component.captureImage();
        expect(form.value.image).toBeNull();
      });
    });

    describe('onGenderSelected', () => {
      it('male filters out widow (5)', () => {
        form.patchValue({ gender: 1 });
        component.onGenderSelected();
        expect(form.value.genderName).toBe('Male');
        expect(
          component.maritalStatusMaster.map((m: any) => m.maritalStatusID),
        ).toEqual([1, 2, 6, 7]);
      });

      it('transgender confirmed keeps full master', () => {
        form.patchValue({ gender: 3 });
        component.onGenderSelected();
        expect(confirmation.confirm).toHaveBeenCalledWith(
          'info',
          LANGUAGE_EN.alerts.info.transGender,
        );
        expect(component.maritalStatusMaster).toEqual(
          MASTER.maritalStatusMaster,
        );
      });

      it('transgender rejected clears gender', () => {
        confirmation.confirm.and.returnValue(of(false));
        form.patchValue({ gender: 3 });
        component.onGenderSelected();
        expect(form.value.gender).toBeNull();
        expect(form.value.genderName).toBeNull();
      });

      it('transgender confirm error is swallowed', () => {
        confirmation.confirm.and.returnValue(throwingObs());
        form.patchValue({ gender: 3, genderName: 'X' });
        component.onGenderSelected();
        expect(form.value.gender).toBe(3);
      });
    });

    describe('validateMaritalStatusMaster', () => {
      it('uses full list for transgender', () => {
        component.validateMaritalStatusMaster({ m_gender: { genderID: 3 } });
        expect(component.maritalStatusMaster).toEqual(
          MASTER.maritalStatusMaster,
        );
      });
      it('filters for male and female', () => {
        component.validateMaritalStatusMaster({ m_gender: { genderID: 1 } });
        expect(
          component.maritalStatusMaster.map((m: any) => m.maritalStatusID),
        ).toEqual([1, 2, 6, 7]);
        component.validateMaritalStatusMaster({ m_gender: { genderID: 2 } });
        expect(
          component.maritalStatusMaster.map((m: any) => m.maritalStatusID),
        ).toEqual([1, 2, 5, 7]);
      });
    });

    describe('getParentDetails', () => {
      it('sets parent from quick search result', () => {
        registrar.identityQuickSearch.and.returnValue(
          of([{ benPhoneMaps: [{ parentBenRegID: 99 }] }]),
        );
        form.patchValue({ phoneNo: '9876543210' });
        component.getParentDetails();
        expect(registrar.identityQuickSearch).toHaveBeenCalledWith({
          beneficiaryRegID: null,
          beneficiaryID: null,
          phoneNo: '9876543210',
        });
        expect(form.value.parentRegID).toBe(99);
        expect(form.value.parentRelation).toBe(11);
      });

      it('self relation when no match (new ben)', () => {
        registrar.identityQuickSearch.and.returnValue(of([]));
        form.patchValue({ phoneNo: '9876543210' });
        component.getParentDetails();
        expect(form.value.parentRegID).toBeNull();
        expect(form.value.parentRelation).toBe(1);
      });

      it('self relation uses own regID on revisit', () => {
        component.patientRevisit = true;
        registrar.identityQuickSearch.and.returnValue(
          of([{ benPhoneMaps: [] }]),
        );
        form.patchValue({ phoneNo: '9876543210', beneficiaryRegID: 5 });
        component.getParentDetails();
        expect(form.value.parentRegID).toBe(5);
        expect(form.value.parentRelation).toBe(1);
      });

      it('alerts and resets on search error', () => {
        registrar.identityQuickSearch.and.returnValue(throwingObs('bad'));
        form.patchValue({ phoneNo: '9876543210' });
        component.getParentDetails();
        expect(confirmation.alert).toHaveBeenCalledWith('bad', 'error');
        expect(form.value.phoneNo).toBeNull();
        expect(form.value.parentRelation).toBe(1);
      });

      it('clears fields for invalid number (new ben)', () => {
        form.patchValue({ phoneNo: '123', parentRegID: 3 });
        component.getParentDetails();
        expect(registrar.identityQuickSearch).not.toHaveBeenCalled();
        expect(form.value.parentRegID).toBeNull();
        expect(form.value.phoneNo).toBeNull();
      });

      it('restores stored parent for invalid number on revisit', () => {
        component.patientRevisit = true;
        component._parentBenRegID = '77';
        form.patchValue({ phoneNo: null });
        component.getParentDetails();
        expect(form.value.parentRegID).toBe('77');
        expect(form.value.parentRelation).toBeNull();
      });
    });

    describe('age handling', () => {
      it('rejects age above limit in years', () => {
        form.patchValue({ age: 130, ageUnit: 'Years' });
        component.onAgeEntered();
        expect(confirmation.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.alerts.info.ageRestriction,
          'info',
        );
        expect(form.value.age).toBeNull();
      });

      it('derives dob from age and enables marital status when adult', () => {
        form.patchValue({ age: 30, ageUnit: 'Years' });
        component.onAgeEntered();
        const years = moment().diff(moment(form.value.dob), 'years');
        expect(years).toBe(30);
        expect(component.enableMaritalStatus).toBeTrue();
        expect(component.MaritalStatus).toBeTrue();
      });

      it('minor clears marital status and marriage details', () => {
        form.patchValue({
          age: 5,
          ageUnit: 'Years',
          maritalStatus: 2,
          maritalStatusName: 'Married',
          spouseName: 'S',
        });
        component.onAgeEntered();
        expect(component.enableMaritalStatus).toBeFalse();
        expect(form.value.maritalStatus).toBeNull();
        expect(form.value.spouseName).toBeNull();
        expect(component.enableMarriageDetails).toBeFalse();
      });

      it('no age just re-evaluates eligibility', () => {
        form.patchValue({ age: null });
        const patch = spyOn(form, 'patchValue').and.callThrough();
        component.onAgeEntered();
        expect(patch).not.toHaveBeenCalledWith(
          jasmine.objectContaining({ dob: jasmine.anything() }),
        );
        expect(component.enableMaritalStatus).toBeFalse();
      });

      it('onAgeUnitEntered sets unit name and recalculates when age present', () => {
        form.patchValue({ ageUnit: 'Months', age: 3 });
        component.onAgeUnitEntered();
        expect(form.value.name).toBe('Months');
        expect(moment().diff(moment(form.value.dob), 'months')).toBe(3);
      });

      it('onAgeUnitEntered without age skips recalculation', () => {
        const spy = spyOn(component, 'onAgeEntered');
        form.patchValue({ ageUnit: 'Years', age: null });
        component.onAgeUnitEntered();
        expect(spy).not.toHaveBeenCalled();
      });
    });

    describe('dobChangeByCalender', () => {
      it('computes age in years', () => {
        component.dateForCalendar = moment().subtract(20, 'years').toDate();
        component.dobChangeByCalender('01/01/2000');
        expect([19, 20]).toContain(form.value.age);
        expect(form.value.ageUnit).toBe('Years');
        expect(component.enableMaritalStatus).toBeTrue();
      });

      it('computes age in months', () => {
        component.dateForCalendar = moment()
          .subtract(3, 'months')
          .subtract(2, 'days')
          .toDate();
        component.dobChangeByCalender('x');
        expect(form.value.ageUnit).toBe('Months');
        expect(form.value.age).toBeGreaterThanOrEqual(2);
      });

      it('computes age in days', () => {
        component.dateForCalendar = moment().subtract(5, 'days').toDate();
        component.dobChangeByCalender('x');
        expect(form.value.ageUnit).toBe('Days');
        expect(form.value.age).toBeGreaterThan(0);
      });

      it('today yields 1 Day', () => {
        component.dateForCalendar = new Date();
        component.dobChangeByCalender('x');
        expect(form.value.age).toBe(1);
        expect(form.value.ageUnit).toBe('Day');
      });

      it('alerts on invalid date', () => {
        form.patchValue({ dob: new Date() });
        component.dateForCalendar = null;
        const patch = spyOn(form, 'patchValue').and.callThrough();
        component.dobChangeByCalender('Invalid date');
        expect(patch).toHaveBeenCalledWith({ dob: null });
        expect(component.dateForCalendar).toBeNull();
        expect(confirmation.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.alerts.info.invalidData,
          'info',
        );
      });

      it('clears age otherwise', () => {
        component.dateForCalendar = null;
        form.patchValue({ age: 4 });
        component.dobChangeByCalender('');
        expect(form.value.age).toBeNull();
      });

      it('throws when called with undefined and a date is set (production bug)', () => {
        component.dateForCalendar = new Date();
        expect(() => component.dobChangeByCalender(undefined)).toThrowError(
          TypeError,
        );
      });
    });

    describe('checkAgeAtMarriage', () => {
      const msg =
        LANGUAGE_EN.alerts.info.marriageAge +
        ' 12 ' +
        LANGUAGE_EN.alerts.info.years;

      it('does nothing when ageAtMarriage empty', () => {
        component.checkAgeAtMarriage();
        expect(confirmation.alert).not.toHaveBeenCalled();
      });

      it('requires age first', () => {
        form.patchValue({ ageAtMarriage: 20, age: null });
        component.checkAgeAtMarriage();
        expect(confirmation.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.common.PleaseenterBeneficiaryagefirst,
          'info',
        );
        expect(form.value.ageAtMarriage).toBeNull();
      });

      it('requires age unit years', () => {
        form.patchValue({ ageAtMarriage: 20, age: 5, ageUnit: 'Months' });
        component.checkAgeAtMarriage();
        expect(confirmation.alert).toHaveBeenCalledWith(msg, 'info');
        expect(form.value.ageAtMarriage).toBeNull();
      });

      it('requires age above marriage limit', () => {
        form.patchValue({ ageAtMarriage: 20, age: 10, ageUnit: 'Years' });
        component.checkAgeAtMarriage();
        expect(confirmation.alert).toHaveBeenCalledWith(msg, 'info');
      });

      it('requires ageAtMarriage above limit', () => {
        form.patchValue({ ageAtMarriage: 10, age: 30, ageUnit: 'Years' });
        component.checkAgeAtMarriage();
        expect(confirmation.alert).toHaveBeenCalledWith(msg, 'info');
        expect(form.value.ageAtMarriage).toBeNull();
      });

      it('rejects ageAtMarriage greater than age', () => {
        form.patchValue({ ageAtMarriage: 40, age: 30, ageUnit: 'Years' });
        component.checkAgeAtMarriage();
        expect(confirmation.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.common.Marriageatageismorethantheactualage,
          'info',
        );
        expect(form.value.ageAtMarriage).toBeNull();
      });

      it('accepts valid ageAtMarriage', () => {
        form.patchValue({ ageAtMarriage: 20, age: 30, ageUnit: 'Years' });
        component.checkAgeAtMarriage();
        expect(confirmation.alert).not.toHaveBeenCalled();
        expect(form.value.ageAtMarriage).toBe(20);
      });
    });

    describe('master lookups', () => {
      it('onIncomeChanged sets income name', () => {
        form.patchValue({ income: 2 });
        component.onIncomeChanged();
        expect(form.value.incomeName).toBe('APL');
      });

      it('changeLiteracyStatus sets literacystatus', () => {
        form.patchValue({ literacyStatus: 2 });
        component.changeLiteracyStatus();
        expect(form.value.literacystatus).toBe('Illiterate');
      });

      it('onEducationQualificationChanged sets education name', () => {
        form.patchValue({ educationQualification: 1 });
        component.onEducationQualificationChanged();
        expect(form.value.educationQualificationName).toBe('Primary');
      });

      it('getOccupationName sets occupation name', () => {
        form.patchValue({ occupation: 1 });
        component.getOccupationName();
        expect(form.value.occupationOther).toBe('Farmer');
      });

      it('getOccupationName clears for "other" (7)', () => {
        form.patchValue({ occupation: 7, occupationOther: 'prev' });
        component.getOccupationName();
        expect(form.value.occupationOther).toBeNull();
      });
    });

    describe('onMaritalStatusChanged', () => {
      it('unmarried disables marriage details and clears them', () => {
        form.patchValue({
          maritalStatus: 1,
          spouseName: 'x',
          ageAtMarriage: 20,
        });
        component.onMaritalStatusChanged();
        expect(component.enableMarriageDetails).toBeFalse();
        expect(component.enableSpouseMandatory).toBeFalse();
        expect(form.value.spouseName).toBeNull();
        expect(form.value.ageAtMarriage).toBeNull();
        expect(form.value.maritalStatusName).toBe('Unmarried');
      });

      it('married enables marriage details and spouse mandatory', () => {
        form.patchValue({ maritalStatus: 2 });
        component.onMaritalStatusChanged();
        expect(component.enableMarriageDetails).toBeTrue();
        expect(component.enableSpouseMandatory).toBeTrue();
        expect(form.value.maritalStatusName).toBe('Married');
      });

      it('widow enables details without spouse mandatory', () => {
        form.patchValue({ maritalStatus: 5 });
        component.onMaritalStatusChanged();
        expect(component.enableMarriageDetails).toBeTrue();
        expect(component.enableSpouseMandatory).toBeFalse();
      });
    });

    describe('setFullName', () => {
      it('first name only', () => {
        form.patchValue({ firstName: 'A', lastName: null });
        component.setFullName();
        expect(form.value.fullName).toBe('A');
      });
      it('first and last', () => {
        form.patchValue({ firstName: 'A', lastName: 'B' });
        component.setFullName();
        expect(form.value.fullName).toBe('A B');
      });
      it('last name only', () => {
        form.patchValue({ firstName: null, lastName: 'B' });
        component.setFullName();
        expect(form.value.fullName).toBe('B');
      });
      it('empty first name with last name concatenates', () => {
        form.patchValue({ firstName: '', lastName: 'B' });
        component.setFullName();
        expect(form.value.fullName).toBe(' B');
      });
    });
  });

  describe('master data not yet loaded', () => {
    beforeEach(async () => setup({ master: null }));

    it('leaves masterData undefined', () => {
      expect(component.masterData).toBeUndefined();
    });
  });

  describe('revisit (editing)', () => {
    beforeEach(async () => setup({ revisit: true, edit: null, render: false }));

    it('loads edit data, image and validates marital master', () => {
      const push = spyOn(component, 'pushEditingDatatoForm');
      benDetails.getBeneficiaryImage.and.returnValue(of({ benImage: 'IMG' }));
      registrar.beneficiaryEditDetails$.next(editData());
      expect(component.revisitData.beneficiaryID).toBe(11);
      expect(push).toHaveBeenCalledWith(
        jasmine.objectContaining({ beneficiaryID: 11 }),
      );
      expect(benDetails.getBeneficiaryImage).toHaveBeenCalledWith(22);
      expect(form.value.image).toBe('IMG');
      expect(
        component.maritalStatusMaster.map((m: any) => m.maritalStatusID),
      ).toEqual([1, 2, 6, 7]);
    });

    it('ignores edit data without beneficiaryID and empty image', () => {
      const push = spyOn(component, 'pushEditingDatatoForm');
      registrar.beneficiaryEditDetails$.next({ x: 1 });
      expect(push).not.toHaveBeenCalled();
      component.revisitData = { beneficiaryRegID: 1 };
      benDetails.getBeneficiaryImage.and.returnValue(of({}));
      component.getBenImage();
      expect(form.value.image).toBeNull();
    });

    it('ngOnDestroy unsubscribes revisit subscription', () => {
      spyOn(component, 'pushEditingDatatoForm');
      registrar.beneficiaryEditDetails$.next(editData());
      const r = spyOn(component.revisitDataSubscription, 'unsubscribe');
      component.ngOnDestroy();
      expect(r).toHaveBeenCalled();
    });

    it('pushEditingDatatoForm patches the form then fails in dobChangeByCalender(undefined) (production bug)', () => {
      const el = editData();
      expect(() => component.pushEditingDatatoForm(el)).toThrowError(TypeError);
      expect(form.value).toEqual(
        jasmine.objectContaining({
          beneficiaryID: 11,
          beneficiaryRegID: 22,
          firstName: 'Ravi',
          lastName: 'Kumar',
          fullName: 'Ravi Kumar',
          phoneNo: '9999999999',
          alternateContactNumber: '8888888888',
          parentRegID: '44',
          parentRelation: '1',
          benPhMapID: '55',
          benRelationshipType: 'Self',
          gender: 1,
          genderName: 'Male',
          maritalStatus: 2,
          maritalStatusName: 'Married',
          spouseName: 'Sita',
          ageAtMarriage: 25,
          incomeName: 'APL',
          income: 2,
          educationQualification: 2,
          educationQualificationName: 'Graduate',
          occupation: 1,
          occupationOther: 'Farmer',
        }),
      );
      expect(component.genderCategory).toBe('Male');
    });

    it('pushEditingDatatoForm with empty maps and demographics uses null fallbacks', () => {
      const el = editData({
        benPhoneMaps: [],
        maritalStatus: null,
        spouseName: null,
        ageAtMarriage: null,
        literacyStatus: null,
        i_bendemographics: {},
      });
      expect(() => component.pushEditingDatatoForm(el)).toThrow();
      expect(form.value.parentRegID).toBe('null');
      expect(form.value.benRelationshipType).toBe('null');
      expect(form.value.maritalStatus).toBeNull();
      expect(form.value.maritalStatusName).toBe('null');
      expect(form.value.educationQualification).toBeNull();
      expect(form.value.occupationOther).toBeNull();
      expect(form.value.phoneNo).toBeNull();
    });
  });
});
