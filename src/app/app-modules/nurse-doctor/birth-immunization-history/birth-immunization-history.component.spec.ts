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
import { BehaviorSubject, of } from 'rxjs';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  createSessionStorageMock,
  throwingObs,
} from 'src/testing/test-utils';
import {
  BeneficiaryDetailsService,
  ConfirmationService,
} from '../../core/services';
import { DoctorService } from '../shared/services';
import { GeneralUtils } from '../shared/utility/general-utility';
import { BirthImmunizationHistoryComponent } from './birth-immunization-history.component';

const NEONATAL = 'Neonatal and Infant Health Care Services';
const CHILD = 'Childhood & Adolescent Healthcare Services';

describe('BirthImmunizationHistoryComponent', () => {
  let component: BirthImmunizationHistoryComponent;
  let fixture: ComponentFixture<BirthImmunizationHistoryComponent>;
  let doctor: any;
  let confirm: any;
  let session: any;
  let route: any;
  let ben$: BehaviorSubject<any>;
  let form: FormGroup;

  beforeEach(async () => {
    ben$ = new BehaviorSubject<any>(null);
    doctor = autoSpy(DoctorService, {
      birthAndImmunizationDetailsFromNurse: 'stale',
    });
    route = { snapshot: { params: { attendant: 'doctor' } } };
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [BirthImmunizationHistoryComponent],
      providers: [
        ...commonTestProviders(),
        { provide: DoctorService, useValue: doctor },
        { provide: ActivatedRoute, useValue: route },
        {
          provide: BeneficiaryDetailsService,
          useValue: { beneficiaryDetails$: ben$.asObservable() },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(BirthImmunizationHistoryComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    session = TestBed.inject(SessionStorageService);
    form = new GeneralUtils(
      new FormBuilder(),
      createSessionStorageMock() as any,
    ).createBirthImmunizationHistoryForm();
    component.patientBirthImmunizationHistoryForm = form;
    component.visitCategory = NEONATAL;
  });

  describe('ngOnInit', () => {
    it('binds sub-forms and clears previous history', () => {
      fixture.detectChanges();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(
        doctor.clearPreviousInfantAndImmunizationHistoryDetails,
      ).toHaveBeenCalled();
      expect(component.immunizationHistory).toBe(
        form.get('immunizationHistory') as FormGroup,
      );
      expect(component.infantBirthDetailsForm).toBe(
        form.get('infantBirthDetailsForm') as FormGroup,
      );
      expect(
        doctor.getBirthImmunizationHistoryNurseDetails,
      ).not.toHaveBeenCalled();
      expect(
        doctor.getPreviousBirthImmunizationHistoryDetails,
      ).not.toHaveBeenCalled();
    });

    it('stores beneficiary age', () => {
      fixture.detectChanges();
      ben$.next({ ageVal: 2 });
      expect(component.beneficiaryAge).toBe(2);
    });

    it('fetches nurse details in view mode for neonatal visits', () => {
      component.immunizationHistoryMode = 'view';
      doctor.getBirthImmunizationHistoryNurseDetails.and.returnValue(
        of({ statusCode: 200, data: { a: 1 } }),
      );
      component.ngOnInit();
      expect(doctor.birthAndImmunizationDetailsFromNurse).toEqual({ a: 1 });
      expect(doctor.setInfantDataFetch).toHaveBeenCalledWith(true);
      expect(
        doctor.getBirthImmunizationHistoryNurseDetailsForChildAndAdolescent,
      ).not.toHaveBeenCalled();
    });

    it('fetches previous visit details for nurses', () => {
      route.snapshot.params.attendant = 'nurse';
      doctor.getPreviousBirthImmunizationHistoryDetails.and.returnValue(
        of({ statusCode: 200, data: { prev: true } }),
      );
      component.ngOnInit();
      expect(
        doctor.getPreviousBirthImmunizationHistoryDetails,
      ).toHaveBeenCalledWith(NEONATAL);
      expect(
        doctor.getPreviousInfantAndImmunizationHistoryDetails,
      ).toHaveBeenCalledWith({ prev: true });
      expect(doctor.birthAndImmunizationDetailsFromNurse).toBeNull();
    });

    it('ignores empty previous visit details', () => {
      doctor.getPreviousBirthImmunizationHistoryDetails.and.returnValue(
        of({ statusCode: 200, data: null }),
      );
      component.getPreviousVisitBirthImmunizationDetails(NEONATAL);
      expect(
        doctor.getPreviousInfantAndImmunizationHistoryDetails,
      ).not.toHaveBeenCalled();
    });
  });

  describe('getNurseImmunizationHistoryDetailsFromNurse', () => {
    it('uses the child & adolescent API for that category', () => {
      component.immunizationHistoryMode = 'update';
      component.visitCategory = CHILD;
      doctor.getBirthImmunizationHistoryNurseDetailsForChildAndAdolescent.and.returnValue(
        of({ statusCode: 200, data: { c: 1 } }),
      );
      component.getNurseImmunizationHistoryDetailsFromNurse();
      expect(doctor.birthAndImmunizationDetailsFromNurse).toEqual({ c: 1 });
      expect(
        doctor.getBirthImmunizationHistoryNurseDetails,
      ).not.toHaveBeenCalled();
    });

    it('does not store failed neonatal/child responses', () => {
      component.immunizationHistoryMode = 'view';
      doctor.getBirthImmunizationHistoryNurseDetails.and.returnValue(
        of({ statusCode: 5000, data: null }),
      );
      component.getNurseImmunizationHistoryDetailsFromNurse();
      component.visitCategory = CHILD;
      doctor.getBirthImmunizationHistoryNurseDetailsForChildAndAdolescent.and.returnValue(
        of({ statusCode: 5000, data: null }),
      );
      component.getNurseImmunizationHistoryDetailsFromNurse();
      expect(doctor.birthAndImmunizationDetailsFromNurse).toBeNull();
      expect(doctor.setInfantDataFetch).not.toHaveBeenCalled();
    });

    it('does nothing in a fresh visit', () => {
      component.immunizationHistoryMode = 'new';
      component.getNurseImmunizationHistoryDetailsFromNurse();
      expect(doctor.birthAndImmunizationDetailsFromNurse).toBe('stale');
    });
  });

  describe('ngOnChanges / update', () => {
    beforeEach(() => session.setItem('visitCategory', NEONATAL));

    it('does nothing outside update mode', () => {
      component.immunizationHistoryMode = 'view';
      component.ngOnChanges();
      expect(doctor.updateBirthAndImmunizationHistory).not.toHaveBeenCalled();
    });

    it('updates and refreshes on success', () => {
      component.immunizationHistoryMode = 'update';
      doctor.updateBirthAndImmunizationHistory.and.returnValue(
        of({ statusCode: 200, data: { response: 'Done' } }),
      );
      form.markAsDirty();
      component.ngOnChanges();
      expect(doctor.updateBirthAndImmunizationHistory).toHaveBeenCalledWith(
        form,
        NEONATAL,
      );
      expect(confirm.alert).toHaveBeenCalledWith('Done', 'success');
      expect(doctor.BirthAndImmunizationValueChanged).toHaveBeenCalledWith(
        false,
      );
      expect(doctor.getBirthImmunizationHistoryNurseDetails).toHaveBeenCalled();
      expect(form.pristine).toBeTrue();
    });

    it('alerts on non-200', () => {
      doctor.updateBirthAndImmunizationHistory.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'bad', data: null }),
      );
      component.updateBirthAndImmunizationHistoryFromDoctor(form, NEONATAL);
      expect(confirm.alert).toHaveBeenCalledWith('bad', 'error');
    });

    it('alerts on error', () => {
      doctor.updateBirthAndImmunizationHistory.and.returnValue(
        throwingObs('e'),
      );
      component.updateBirthAndImmunizationHistoryFromDoctor(form, NEONATAL);
      expect(confirm.alert).toHaveBeenCalledWith('e', 'error');
    });
  });

  it('re-assigns language on ngDoCheck and unsubscribes on destroy', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
    fixture.detectChanges();
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    const sub = component.beneficiaryDetailsSubscription;
    component.ngOnDestroy();
    expect(sub.closed).toBeTrue();
  });
});
