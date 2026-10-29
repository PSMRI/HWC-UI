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
import * as moment from 'moment';

import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  createSessionStorageMock,
} from 'src/testing/test-utils';
import { MaterialModule } from 'src/app/app-modules/core/material.module';
import { BeneficiaryDetailsService } from '../../../core/services/beneficiary-details.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { NurseService } from '../../shared/services';
import { GeneralUtils } from '../../shared/utility/general-utility';
import { AncDetailsComponent } from './anc-details.component';

const DAY = 24 * 60 * 60 * 1000;

describe('AncDetailsComponent', () => {
  let component: AncDetailsComponent;
  let fixture: ComponentFixture<AncDetailsComponent>;
  let form: FormGroup;
  let ben$: BehaviorSubject<any>;
  let confirm: any;

  beforeEach(async () => {
    ben$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [AncDetailsComponent],
      providers: [
        ...commonTestProviders(),
        { provide: NurseService, useValue: autoSpy(NurseService) },
        {
          provide: BeneficiaryDetailsService,
          useValue: { beneficiaryDetails$: ben$.asObservable() },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AncDetailsComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    form = new GeneralUtils(
      new FormBuilder(),
      createSessionStorageMock({
        serviceLineDetails: JSON.stringify({
          facilityID: 1,
          parkingPlaceID: 2,
        }),
      }) as any,
    ).createPatientANCDetailsForm();
    component.patientANCDetailsForm = form;
    fixture.detectChanges();
  });

  it('should create and initialise dates', () => {
    expect(component).toBeTruthy();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
    expect(component.today instanceof Date).toBeTrue();
    expect(component.dob instanceof Date).toBeTrue();
  });

  it('stores the beneficiary age when details arrive', () => {
    ben$.next({ ageVal: 27 });
    expect(component.beneficiaryAge).toBe(27);
  });

  it('re-assigns the language set on ngDoCheck', () => {
    component.current_language_set = null;
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  it('unsubscribes on destroy and tolerates a missing subscription', () => {
    const sub = component.beneficiaryDetailsSubscription;
    component.ngOnDestroy();
    expect(sub.closed).toBeTrue();
    component.beneficiaryDetailsSubscription = null;
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  describe('checkupLMP', () => {
    it('computes EDD, gestational age, duration and trimester for a valid LMP', () => {
      const lmp = moment().subtract(70, 'days');
      component.checkupLMP(lmp);
      const v = form.value;
      expect(v.lmpDate).toEqual(lmp.toDate());
      expect(v.gestationalAgeOrPeriodofAmenorrhea_POA).toBe(10);
      expect(v.trimesterNumber).toBe(1);
      expect(v.duration).toBe(2);
      const edd = new Date(lmp.toDate());
      edd.setDate(edd.getDate() + 280);
      expect(v.expDelDt).toEqual(edd);
    });

    it('rejects an LMP in the future and clears derived fields', () => {
      form.patchValue({
        expDelDt: new Date(),
        duration: 3,
        trimesterNumber: 2,
      });
      component.checkupLMP(moment().add(5, 'days'));
      const v = form.value;
      expect(v.lmpDate).toBeNull();
      expect(v.expDelDt).toBeNull();
      expect(v.duration).toBeNull();
      expect(v.gestationalAgeOrPeriodofAmenorrhea_POA).toBeNull();
      expect(v.trimesterNumber).toBeNull();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.invalidVal,
      );
    });
  });

  describe('calculatePeriodOfPregnancy', () => {
    it('rounds up to at least one month', () => {
      component.calculatePeriodOfPregnancy(
        new Date(component.today.getTime() - 2 * DAY),
      );
      expect(component.pregnancyMonths).toBe(1);
      expect(form.value.duration).toBe(1);
    });

    it('computes months for older LMPs', () => {
      component.calculatePeriodOfPregnancy(
        new Date(component.today.getTime() - 150 * DAY),
      );
      expect(form.value.duration).toBe(5);
    });

    it('clears duration for a null LMP', () => {
      component.calculatePeriodOfPregnancy(null);
      expect(component.pregnancyMonths).toBeNull();
      expect(form.value.duration).toBeNull();
    });
  });

  describe('calculateTrimester', () => {
    [
      [5, 1],
      [12, 2],
      [20, 2],
      [27, 3],
      [35, 3],
    ].forEach(([weeks, tri]) => {
      it(`sets trimester ${tri} for ${weeks} weeks`, () => {
        component.calculateTrimester(weeks);
        expect(form.value.trimesterNumber).toBe(tri);
      });
    });

    it('clears trimester for null', () => {
      form.patchValue({ trimesterNumber: 2 });
      component.calculateTrimester(null);
      expect(form.value.trimesterNumber).toBeNull();
    });

    it('leaves trimester untouched for negative weeks', () => {
      form.patchValue({ trimesterNumber: 2 });
      component.calculateTrimester(-1);
      expect(form.value.trimesterNumber).toBe(2);
    });
  });

  describe('checkPeriodOfPregnancy', () => {
    it('rejects more than 9 months', () => {
      form.patchValue({ duration: 10 });
      component.checkPeriodOfPregnancy(10);
      expect(form.value.duration).toBeNull();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.invalidValue,
      );
    });

    it('rejects less than 1 month', () => {
      form.patchValue({ duration: 0 });
      component.checkPeriodOfPregnancy(0);
      expect(form.value.duration).toBeNull();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.common.invalidValueMorethan,
      );
    });

    it('accepts values in range', () => {
      form.patchValue({ duration: 5 });
      component.checkPeriodOfPregnancy(5);
      expect(form.value.duration).toBe(5);
      expect(confirm.alert).not.toHaveBeenCalled();
    });
  });

  it('getters return form values', () => {
    form.patchValue({
      primiGravida: true,
      lmpDate: 'x',
      gestationalAgeOrPeriodofAmenorrhea_POA: 8,
      duration: 2,
    });
    expect(component.primiGravida).toBeTrue();
    expect(component.lmpDate).toBe('x');
    expect(component.gestationalAgeOrPeriodofAmenorrhea_POA).toBe(8);
    expect(component.duration).toBe(2);
  });
});
