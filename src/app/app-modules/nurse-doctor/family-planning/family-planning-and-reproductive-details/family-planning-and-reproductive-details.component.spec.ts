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
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';
import { MaterialModule } from 'src/app/app-modules/core/material.module';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { BeneficiaryDetailsService } from '../../../core/services/beneficiary-details.service';
import { RegistrarService } from '../../../registrar/shared/services/registrar.service';
import { MasterdataService } from '../../shared/services/masterdata.service';
import { DoctorService } from '../../shared/services';
import { FamilyPlanningUtils } from '../../shared/utility/family-planning-utlity';
import { FamilyPlanningAndReproductiveComponent } from './family-planning-and-reproductive-details.component';

describe('FamilyPlanningAndReproductiveComponent', () => {
  let component: FamilyPlanningAndReproductiveComponent;
  let fixture: ComponentFixture<FamilyPlanningAndReproductiveComponent>;
  let doctor: any;
  let registrar: any;
  let confirm: any;
  let session: any;
  let route: any;
  let form: FormGroup;
  let master$: BehaviorSubject<any>;
  let ben$: BehaviorSubject<any>;
  let fetch$: BehaviorSubject<boolean>;
  let revisit$: BehaviorSubject<any>;

  const REPRO = {
    id: 4,
    fertilityStatus: 'Fertile',
    parity: 2,
    currentlyUsingFpMethod: [
      'Injectable MPA Contraceptive (Antara)',
      'Tubectomy (Female Sterilization)',
      'Other',
    ],
    otherCurrentlyUsingFpMethod: 'Herbal',
    dateOfSterilization: '2023-01-01',
    dateOfLastDoseTaken: '2023-06-01',
    dosesTaken: 2,
  };

  beforeEach(async () => {
    master$ = new BehaviorSubject<any>(null);
    ben$ = new BehaviorSubject<any>(null);
    fetch$ = new BehaviorSubject<boolean>(false);
    revisit$ = new BehaviorSubject<any>(null);
    doctor = autoSpy(DoctorService, {
      familyPlanningDetailsResponseFromNurse: null,
      enableDispenseFlag: false,
      fetchFamilyDataCheck$: fetch$.asObservable(),
      benFamilyPlanningDetails$: revisit$.asObservable(),
    });
    registrar = autoSpy(RegistrarService);
    route = { snapshot: { params: { attendant: 'doctor' } } };
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [FamilyPlanningAndReproductiveComponent],
      providers: [
        ...commonTestProviders(),
        { provide: DoctorService, useValue: doctor },
        { provide: RegistrarService, useValue: registrar },
        { provide: ActivatedRoute, useValue: route },
        {
          provide: MasterdataService,
          useValue: { nurseMasterData$: master$.asObservable() },
        },
        {
          provide: BeneficiaryDetailsService,
          useValue: { beneficiaryDetails$: ben$.asObservable() },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(FamilyPlanningAndReproductiveComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    session = TestBed.inject(SessionStorageService);
    form = new FamilyPlanningUtils(
      new FormBuilder(),
    ).createFamilyPlanningAndReproductiveForm();
    component.familyPlanningAndReproductiveForm = form;
    spyOn(console, 'log');
  });

  function expectPatched() {
    expect(form.value.parity).toBe(2);
    expect(form.value.dateOfSterilization).toEqual(new Date('2023-01-01'));
    expect(component.enableDoseFields).toBeTrue();
    expect(component.enableSterilizationFields).toBeTrue();
    expect(component.enablecurrentlyUsingFPOther).toBeTrue();
    expect(component.disableCurrentlyUsingFPNone).toBeTrue();
    expect(component.enableDispensationDetailsForm).toBeTrue();
    expect(registrar.enableDispenseOnFertility).toHaveBeenCalledWith(true);
  }

  describe('init', () => {
    it('should create and set max date to yesterday', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
      expect(doctor.setFamilyDataFetch).toHaveBeenCalledWith(false);
      expect(component.maxEndDate.getTime()).toBeLessThan(
        component.today.getTime(),
      );
      expect(console.log).toHaveBeenCalledWith(
        'Error in fetching nurse master data details',
      );
    });

    it('loads masters, defaults unit of age and patches in view mode', () => {
      component.familyPlanningMode = 'view';
      fixture.detectChanges();
      doctor.familyPlanningDetailsResponseFromNurse = {
        familyPlanningReproductiveDetails: REPRO,
      };
      master$.next({
        m_fpmethodfollowup: ['a'],
        m_FertilityStatus: [{ id: 1, name: 'Fertile' }],
        m_gender: ['F'],
        m_ageunits: ['Years'],
      });
      expect(component.currentlyFPMethod).toEqual(['a']);
      expect(component.fertilityStatusOption).toEqual([
        { id: 1, name: 'Fertile' },
      ]);
      expect(component.genderMasterData).toEqual(['F']);
      expect(component.ageUnitMasterData).toEqual(['Years']);
      expectPatched();
    });

    it('defaults unit of age outside view mode without patching', () => {
      fixture.detectChanges();
      master$.next({ m_fpmethodfollowup: [] });
      expect(form.value.unitOfAge).toBe('Years');
      expect(registrar.enableDispenseOnFertility).not.toHaveBeenCalled();
    });

    it('patches when the fetch flag fires', () => {
      fixture.detectChanges();
      doctor.familyPlanningDetailsResponseFromNurse = {
        familyPlanningReproductiveDetails: REPRO,
      };
      fetch$.next(true);
      expectPatched();
    });

    describe('beneficiary age', () => {
      [
        ['25 years - 3 months', 26],
        ['25 years - 0 months', 25],
        ['25 years', 26],
        ['8 months', 0],
        ['', 0],
      ].forEach(([age, expected]) => {
        it(`derives ${expected} from "${age}"`, () => {
          fixture.detectChanges();
          ben$.next({ genderName: 'Female', age });
          expect(component.bengender).toBe('female');
          expect(component.beneficiaryAge).toBe(expected as number);
        });
      });
    });
  });

  describe('getAgeValueNew', () => {
    it('returns 0 for empty/unitless values', () => {
      expect(component.getAgeValueNew(null)).toBe(0);
      expect(component.getAgeValueNew('12')).toBe(0);
      expect(component.benAgeUnit).toBeUndefined();
    });

    it('parses years', () => {
      expect(component.getAgeValueNew('30 Years')).toBe(30);
      expect(component.benAgeUnit).toBe('Years');
    });
  });

  describe('checkWithFertilityStatus', () => {
    beforeEach(() => {
      component.fertilityStatusOption = [
        { id: 1, name: 'Fertile' },
        { id: 2, name: 'Infertile' },
      ];
      component.enableDoseFields = true;
    });

    it('enables dispensation for fertile and sets the status id', () => {
      component.familyPlanningMode = 'view';
      form.patchValue({ fertilityStatus: 'Fertile', parity: 3 });
      component.checkWithFertilityStatus();
      expect(doctor.familyPlanningValueChanged).toHaveBeenCalledWith(true);
      expect(form.value.parity).toBeNull();
      expect(form.value.unitOfAge).toBe('Years');
      expect(form.value.fertilityStatusID).toBe(1);
      expect(component.enableDoseFields).toBeFalse();
      expect(component.enableDispensationDetailsForm).toBeTrue();
      expect(doctor.enableDispenseFlag).toBeTrue();
      expect(registrar.enableDispenseOnFertility).toHaveBeenCalledWith(true);
    });

    it('disables dispensation for other statuses', () => {
      form.patchValue({ fertilityStatus: 'Infertile' });
      component.checkWithFertilityStatus();
      expect(form.value.fertilityStatusID).toBe(2);
      expect(component.enableDispensationDetailsForm).toBeFalse();
      expect(registrar.enableDispenseOnFertility).toHaveBeenCalledWith(false);
      expect(doctor.familyPlanningValueChanged).not.toHaveBeenCalled();
    });
  });

  describe('children count validations', () => {
    beforeEach(() => {
      component.assignSelectedLanguage();
      component.familyPlanningMode = 'update';
    });

    it('rejects fewer female born than alive and recomputes total', () => {
      form.patchValue({
        totalNoOfChildrenBornFemale: 1,
        totalNoOfChildrenBornMale: 2,
      });
      component.checktotalFemaleChildrenBorn(1, 2);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.valueEnteredMustBeGreaterThanLivingFemale,
      );
      expect(form.value.totalNoOfChildrenBornFemale).toBeNull();
      expect(form.value.totalNoOfChildrenBorn).toBe(2);
      expect(doctor.familyPlanningValueChanged).toHaveBeenCalledWith(true);
    });

    it('accepts valid female counts', () => {
      form.patchValue({ totalNoOfChildrenBornFemale: 3 });
      component.checktotalFemaleChildrenBorn(3, 1);
      expect(confirm.alert).not.toHaveBeenCalled();
      expect(form.value.totalNoOfChildrenBorn).toBe(3);
    });

    it('rejects fewer male born than alive', () => {
      form.patchValue({ totalNoOfChildrenBornMale: 1 });
      component.checktotalMaleChildrenBorn(1, 3);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.valueEnteredMustBeGreaterThanLivingMale,
      );
      expect(form.value.totalNoOfChildrenBornMale).toBeNull();
      expect(form.value.totalNoOfChildrenBorn).toBeNull();
    });

    it('handles null male counts', () => {
      component.checktotalMaleChildrenBorn(null, null);
      expect(confirm.alert).not.toHaveBeenCalled();
    });

    it('rejects more live females than born', () => {
      form.patchValue({
        numberOfLiveChildrenFemale: 4,
        numberOfLiveChildrenMale: 1,
      });
      component.checkLiveNoOfChildrenBornFemale(2, 4);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.valueEnteredCannotBeGreaterFemale,
      );
      expect(form.value.numberOfLiveChildrenFemale).toBeNull();
      expect(form.value.numberOfLiveChildren).toBe(1);
    });

    it('accepts valid live female counts (null inputs)', () => {
      component.checkLiveNoOfChildrenBornFemale(null, null);
      expect(confirm.alert).not.toHaveBeenCalled();
      expect(form.value.numberOfLiveChildren).toBeNull();
    });

    it('rejects more live males than born', () => {
      form.patchValue({ numberOfLiveChildrenMale: 5 });
      component.checkLiveNoOfChildrenBornMale(2, 5);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.valueEnteredCannotBeGreaterMale,
      );
      expect(form.value.numberOfLiveChildrenMale).toBeNull();
    });

    it('accepts valid live male counts', () => {
      form.patchValue({ numberOfLiveChildrenMale: 2 });
      component.checkLiveNoOfChildrenBornMale(3, 2);
      expect(confirm.alert).not.toHaveBeenCalled();
      expect(form.value.numberOfLiveChildren).toBe(2);
    });
  });

  describe('checkAgeOfYoungestChildValidation', () => {
    beforeEach(() => {
      component.assignSelectedLanguage();
      component.benAgeUnit = 'years';
      component.beneficiaryAge = 20;
    });

    it('rejects a child older than the beneficiary', () => {
      form.patchValue({ unitOfAge: 'Years', ageOfYoungestChild: 25 });
      component.familyPlanningMode = 'view';
      component.checkAgeOfYoungestChildValidation(25);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.youngChildAgeShouldBeLessThanBenAge,
      );
      expect(form.value.ageOfYoungestChild).toBeNull();
      expect(doctor.familyPlanningValueChanged).toHaveBeenCalledWith(true);
    });

    it('accepts a younger child', () => {
      form.patchValue({ unitOfAge: 'Years', ageOfYoungestChild: 2 });
      component.checkAgeOfYoungestChildValidation(2);
      expect(confirm.alert).not.toHaveBeenCalled();
    });

    it('skips when units differ', () => {
      form.patchValue({ unitOfAge: 'Months' });
      component.checkAgeOfYoungestChildValidation(30);
      expect(confirm.alert).not.toHaveBeenCalled();
    });

    it('skips for null age', () => {
      component.checkAgeOfYoungestChildValidation(null);
      expect(confirm.alert).not.toHaveBeenCalled();
    });
  });

  describe('range checks', () => {
    beforeEach(() => component.assignSelectedLanguage());

    [0, 16].forEach((v) => {
      it(`checkParity alerts for ${v}`, () => {
        form.patchValue({ parity: v });
        component.checkParity();
        expect(confirm.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.alerts.info.recheckValue,
        );
      });

      it(`validateNoOfChildrenBorn alerts for ${v}`, () => {
        component.validateNoOfChildrenBorn(v);
        expect(confirm.alert).toHaveBeenCalled();
      });
    });

    it('does not alert for valid values', () => {
      form.patchValue({ parity: 3 });
      component.familyPlanningMode = 'update';
      component.checkParity();
      component.validateNoOfChildrenBorn(3);
      expect(confirm.alert).not.toHaveBeenCalled();
      expect(doctor.familyPlanningValueChanged).toHaveBeenCalledTimes(2);
    });
  });

  describe('currently using FP method helpers', () => {
    it('reset dose, sterilization and other fields when not selected', () => {
      form.patchValue({
        currentlyUsingFpMethod: ['Condom'],
        dosesTaken: 1,
        dateOfLastDoseTaken: new Date(),
        dateOfSterilization: new Date(),
        placeOfSterilization: 'PHC',
        otherCurrentlyUsingFpMethod: 'x',
      });
      component.familyPlanningMode = 'view';
      component.populateDosesFieldForAntara();
      component.populateSterilizationForTubectomyOrVasectomy();
      component.currentlyUsingFPOther();
      expect(component.enableDoseFields).toBeFalse();
      expect(component.enableSterilizationFields).toBeFalse();
      expect(component.enablecurrentlyUsingFPOther).toBeFalse();
      expect(form.value.dosesTaken).toBeNull();
      expect(form.value.placeOfSterilization).toBeNull();
      expect(form.value.otherCurrentlyUsingFpMethod).toBeNull();
      expect(doctor.familyPlanningValueChanged).toHaveBeenCalledTimes(2);
    });

    it('enables sterilization fields for vasectomy', () => {
      form.patchValue({
        currentlyUsingFpMethod: ['Vasectomy (Male sterilization)'],
      });
      component.populateSterilizationForTubectomyOrVasectomy();
      expect(component.enableSterilizationFields).toBeTrue();
    });

    it('resetcurrentlyUsingFPOptions toggles None handling', () => {
      component.resetcurrentlyUsingFPOptions(['None']);
      expect(component.disableAllOptions).toBeTrue();
      expect(component.disableCurrentlyUsingFPNone).toBeFalse();
      component.resetcurrentlyUsingFPOptions([]);
      expect(component.disableAllOptions).toBeFalse();
      expect(component.disableCurrentlyUsingFPNone).toBeFalse();
    });

    it('onValueChange flags only in view/update', () => {
      component.onValueChange();
      expect(doctor.familyPlanningValueChanged).not.toHaveBeenCalled();
      component.familyPlanningMode = 'view';
      component.onValueChange();
      expect(doctor.familyPlanningValueChanged).toHaveBeenCalledWith(true);
    });
  });

  it('getters return form values', () => {
    form.patchValue({
      totalNoOfChildrenBorn: 3,
      numberOfLiveChildren: 2,
      ageOfYoungestChild: 1,
      unitOfAge: 'Years',
      youngestChildGender: 'Male',
      dateOfSterilization: 'd',
      placeOfSterilization: 'p',
      dosesTaken: 1,
      dateOfLastDoseTaken: 'l',
      otherCurrentlyUsingFpMethod: 'o',
    });
    expect(component.totalNoOfChildrenBorn).toBe(3);
    expect(component.numberOfLiveChildren).toBe(2);
    expect(component.ageOfYoungestChild).toBe(1);
    expect(component.unitOfAge).toBe('Years');
    expect(component.youngestChildGender).toBe('Male');
    expect(component.dateOfSterilization).toBe('d');
    expect(component.placeOfSterilization).toBe('p');
    expect(component.dosesTaken).toBe(1);
    expect(component.dateOfLastDoseTaken).toBe('l');
    expect(component.otherCurrentlyUsingFpMethod).toBe('o');
  });

  it('youngestChildGenderOther throws because the control does not exist', () => {
    expect(() => component.youngestChildGenderOther).toThrowError(TypeError);
  });

  describe('ngOnChanges', () => {
    it('fetches nurse details in view mode and disables dispensation when not fertile', () => {
      component.familyPlanningMode = 'view';
      component.ngOnChanges();
      expect(component.enableDispensationDetailsForm).toBeFalse();
      expect(registrar.enableDispenseOnFertility).toHaveBeenCalledWith(false);
    });

    it('patches revisit data for nurse follow-up and clears id', () => {
      route.snapshot.params.attendant = 'nurse';
      session.setItem('visitReason', 'Follow Up');
      revisit$.next({ familyPlanningReproductiveDetails: REPRO });
      component.ngOnChanges();
      expectPatched();
      expect(form.value.id).toBeNull();
    });

    it('disables dispensation for empty revisit data', () => {
      route.snapshot.params.attendant = 'nurse';
      session.setItem('visitReason', 'follow up');
      component.ngOnChanges();
      expect(registrar.enableDispenseOnFertility).toHaveBeenCalledWith(false);
    });

    it('skips revisit for doctors', () => {
      session.setItem('visitReason', 'Follow Up');
      component.ngOnChanges();
      expect(component.benFamilyPlanningSubscription).toBeUndefined();
    });
  });

  it('ngOnDestroy resets the form and unsubscribes everything', () => {
    fixture.detectChanges();
    route.snapshot.params.attendant = 'nurse';
    session.setItem('visitReason', 'Follow Up');
    component.ngOnChanges();
    const subs = [
      component.beneficiaryDetailsSubscription,
      component.masterDataServiceSubscription,
      component.benFamilyPlanningSubscription,
    ];
    form.patchValue({ parity: 2 });
    component.ngOnDestroy();
    expect(form.value.parity).toBeNull();
    subs.forEach((s) => expect(s.closed).toBeTrue());
  });

  it('ngOnDestroy works without subscriptions', () => {
    form.patchValue({ parity: 2 });
    component.ngOnDestroy();
    expect(form.value.parity).toBeNull();
  });

  it('re-assigns the language set on ngDoCheck', () => {
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });
});
