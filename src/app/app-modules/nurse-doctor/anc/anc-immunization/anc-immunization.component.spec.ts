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
import { BehaviorSubject } from 'rxjs';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
  createSessionStorageMock,
} from 'src/testing/test-utils';
import { MaterialModule } from 'src/app/app-modules/core/material.module';
import { BeneficiaryDetailsService } from '../../../core/services/beneficiary-details.service';
import { GeneralUtils } from '../../shared/utility/general-utility';
import { AncImmunizationComponent } from './anc-immunization.component';

const SESSION = {
  serviceLineDetails: JSON.stringify({ facilityID: 1, parkingPlaceID: 2 }),
};

describe('AncImmunizationComponent', () => {
  let component: AncImmunizationComponent;
  let fixture: ComponentFixture<AncImmunizationComponent>;
  let form: FormGroup;
  let ben$: BehaviorSubject<any>;
  let session: any;

  const filled = {
    tT_1Status: 'Received',
    dateReceivedForTT_1: new Date(2024, 0, 1),
    facilityNameOfTT_1: 'PHC',
    tT_2Status: 'Received',
    dateReceivedForTT_2: new Date(2024, 1, 1),
    facilityNameOfTT_2: 'PHC',
    tT_3Status: 'Received',
    dateReceivedForTT_3: new Date(2024, 2, 1),
    facilityNameOfTT_3: 'PHC',
  };

  beforeEach(async () => {
    ben$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [AncImmunizationComponent],
      providers: [
        ...commonTestProviders({ session: SESSION }),
        {
          provide: BeneficiaryDetailsService,
          useValue: { beneficiaryDetails$: ben$.asObservable() },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AncImmunizationComponent);
    component = fixture.componentInstance;
    session = TestBed.inject(SessionStorageService);
    form = new GeneralUtils(
      new FormBuilder(),
      createSessionStorageMock(SESSION) as any,
    ).createPatientANCImmunizationForm();
    component.patientANCImmunizationForm = form;
    fixture.detectChanges();
  });

  it('should create and load the language set', () => {
    expect(component).toBeTruthy();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
    component.current_language_set = null;
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  it('computes dob from beneficiary age', () => {
    ben$.next({ ageVal: 30 });
    expect(component.beneficiaryAge).toBe(30);
    expect(component.dob.getFullYear()).toBe(
      component.today.getFullYear() - 30,
    );
  });

  it('unsubscribes on destroy and tolerates a missing subscription', () => {
    const sub = component.beneficiaryDetailsSubscription;
    component.ngOnDestroy();
    expect(sub.closed).toBeTrue();
    component.beneficiaryDetailsSubscription = null;
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  describe('checkStatus / ngOnChanges', () => {
    it('enables TT 1/2 booster when not primi gravida', () => {
      component.gravidaStatus = false;
      component.checkStatus();
      expect(component.enableTTStatus_1_2_b).toBeTrue();
      expect(component.enableTTStatus_1_2).toBeFalse();
    });

    it('enables TT 1/2 when primi gravida', () => {
      component.gravidaStatus = true;
      component.checkStatus();
      expect(component.enableTTStatus_1_2).toBeTrue();
      expect(component.enableTTStatus_1_2_b).toBeFalse();
    });

    it('disables both when gravida status is unknown', () => {
      component.gravidaStatus = null;
      component.checkStatus();
      expect(component.enableTTStatus_1_2).toBeFalse();
      expect(component.enableTTStatus_1_2_b).toBeFalse();
    });

    it('nullifies TT status in a fresh nurse visit with a non-100 specialist flag', () => {
      session.setItem('specialistFlag', '0');
      form.patchValue(filled);
      component.mode = 'new';
      component.ngOnChanges({});
      expect(form.value.tT_1Status).toBeNull();
      expect(form.value.facilityID).toBe(1);
      expect(form.value.parkingPlaceID).toBe(2);
    });

    ['view', 'update'].forEach((mode) => {
      it(`keeps values in ${mode} mode`, () => {
        session.setItem('specialistFlag', '0');
        form.patchValue(filled);
        component.mode = mode;
        component.ngOnChanges({});
        expect(form.value.tT_1Status).toBe('Received');
      });
    });

    it('keeps values when specialist flag is 100 or missing', () => {
      form.patchValue(filled);
      component.mode = 'new';
      component.ngOnChanges({});
      session.setItem('specialistFlag', '100');
      component.ngOnChanges({});
      expect(form.value.tT_1Status).toBe('Received');
    });
  });

  it('checkTT_1Status clears all later TT fields', () => {
    form.patchValue(filled);
    component.checkedTT_1Status = true;
    component.checkTT_1Status('Received');
    expect(component.checkedTT_1Status).toBeFalse();
    expect(form.value.tT_1Status).toBe('Received');
    expect(form.value.dateReceivedForTT_1).toBeNull();
    expect(form.value.tT_2Status).toBeNull();
    expect(form.value.facilityNameOfTT_3).toBeNull();
  });

  it('checkTT_1Date clears TT1 facility and later fields', () => {
    form.patchValue(filled);
    component.checkTT_1Date(new Date());
    expect(form.value.dateReceivedForTT_1).toEqual(filled.dateReceivedForTT_1);
    expect(form.value.facilityNameOfTT_1).toBeNull();
    expect(form.value.tT_3Status).toBeNull();
  });

  it('checkTT_2Date clears TT2 facility and TT3 fields', () => {
    form.patchValue(filled);
    component.checkTT_2Date(new Date());
    expect(form.value.facilityNameOfTT_2).toBeNull();
    expect(form.value.dateReceivedForTT_3).toBeNull();
    expect(form.value.facilityNameOfTT_1).toBe('PHC');
  });

  describe('checkTT_2Status', () => {
    beforeEach(() => {
      ben$.next({ ageVal: 25 });
    });

    it('uses dob as min date when TT1 date is missing', () => {
      component.checkTT_2Status('Received');
      expect(component.tT_1Date).toBe(component.dob);
      expect(form.value.dateReceivedForTT_2).toBeNull();
    });

    it('uses TT1 date when present', () => {
      form.patchValue({ dateReceivedForTT_1: filled.dateReceivedForTT_1 });
      component.checkTT_2Status('Received');
      expect(component.tT_1Date).toEqual(filled.dateReceivedForTT_1);
    });

    it('does not set a min date when not received', () => {
      component.checkTT_2Status('Not Received');
      expect(component.tT_1Date).toBeUndefined();
    });
  });

  describe('checkTT_3Status', () => {
    beforeEach(() => ben$.next({ ageVal: 25 }));

    it('uses TT2 date when TT2 was received', () => {
      form.patchValue(filled);
      component.checkTT_3Status('Received');
      expect(component.tT_3Date).toEqual(filled.dateReceivedForTT_2);
      expect(form.value.dateReceivedForTT_3).toBeNull();
    });

    it('falls back to TT1 date', () => {
      form.patchValue({
        tT_1Status: 'Received',
        dateReceivedForTT_1: filled.dateReceivedForTT_1,
        tT_2Status: 'Not Received',
      });
      component.checkTT_3Status('Received');
      expect(component.tT_3Date).toEqual(filled.dateReceivedForTT_1);
    });

    it('falls back to dob', () => {
      component.checkTT_3Status('Received');
      expect(component.tT_3Date).toBe(component.dob);
    });

    it('does nothing for not received', () => {
      component.checkTT_3Status('NA');
      expect(component.tT_3Date).toBeUndefined();
      expect(component.checkedTT_3Status).toBeFalse();
    });
  });

  it('getters return form values', () => {
    form.patchValue(filled);
    expect(component.tT_1Status).toBe('Received');
    expect(component.tT_2Status).toBe('Received');
    expect(component.tT_3Status).toBe('Received');
    expect(component.dateReceivedForTT_1).toEqual(filled.dateReceivedForTT_1);
    expect(component.dateReceivedForTT_2).toEqual(filled.dateReceivedForTT_2);
  });
});
