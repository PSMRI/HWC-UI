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
import { SimpleChange } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  createSessionStorageMock,
} from 'src/testing/test-utils';
import { MaterialModule } from 'src/app/app-modules/core/material.module';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { BeneficiaryDetailsService } from '../../../core/services/beneficiary-details.service';
import { MasterdataService } from '../../shared/services';
import { HrpService } from '../../shared/services/hrp.service';
import { GeneralUtils } from '../../shared/utility/general-utility';
import { ObstetricFormulaComponent } from './obstetric-formula.component';

describe('ObstetricFormulaComponent', () => {
  let component: ObstetricFormulaComponent;
  let fixture: ComponentFixture<ObstetricFormulaComponent>;
  let form: FormGroup;
  let master$: BehaviorSubject<any>;
  let ben$: BehaviorSubject<any>;
  let hrp: any;
  let confirm: any;

  const gravidaChange = { gravidaStatus: new SimpleChange(null, true, false) };

  beforeEach(async () => {
    master$ = new BehaviorSubject<any>(null);
    ben$ = new BehaviorSubject<any>(null);
    hrp = autoSpy(HrpService, { checkHrpStatus: false });
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [ObstetricFormulaComponent],
      providers: [
        ...commonTestProviders(),
        { provide: HrpService, useValue: hrp },
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

    fixture = TestBed.createComponent(ObstetricFormulaComponent);
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
    ).createObstetricFormulaForm();
    component.obstetricFormulaForm = form;
    fixture.detectChanges();
  });

  it('should create and reset HRP blood group', () => {
    expect(component).toBeTruthy();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
    expect(hrp.setBloodGroup).toHaveBeenCalledWith(null);
    component.current_language_set = null;
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  describe('master data and beneficiary blood group', () => {
    it('loads blood groups and applies a known beneficiary blood group', () => {
      master$.next({ bloodGroups: ['A+', 'B+'] });
      ben$.next({ bloodGroup: 'B+' });
      expect(component.selectBloodGroupType).toEqual(['A+', 'B+']);
      expect(component.disableBloodGroup).toBeTrue();
      expect(hrp.setBloodGroup).toHaveBeenCalledWith('B+');
      expect(hrp.checkHrpStatus).toBeTrue();
      expect(form.value.bloodGroup).toBe('B+');
    });

    it('does not disable for "Don\'t Know"', () => {
      master$.next({ bloodGroups: [] });
      ben$.next({ bloodGroup: "Don't Know" });
      expect(component.disableBloodGroup).toBeFalse();
      expect(form.value.bloodGroup).toBe("Don't Know");
    });

    it('ignores beneficiary details without a blood group', () => {
      master$.next({ bloodGroups: [] });
      ben$.next({ ageVal: 20 });
      expect(form.value.bloodGroup).toBeNull();
    });

    it('ignores beneficiary blood group in view/update mode', () => {
      component.mode = 'view';
      master$.next({ bloodGroups: [] });
      ben$.next({ bloodGroup: 'O+' });
      expect(form.value.bloodGroup).toBeNull();
      expect(component.disableBloodGroup).toBeFalse();
    });
  });

  describe('ngOnChanges', () => {
    it('resets the formula for primi gravida', () => {
      form.patchValue({
        gravida_G: 4,
        para: 2,
        livebirths_L: 2,
        abortions_A: 1,
        stillBirth: 1,
      });
      component.gravidaStatus = true;
      component.ngOnChanges(gravidaChange);
      expect(form.value).toEqual(
        jasmine.objectContaining({
          gravida_G: 1,
          para: null,
          livebirths_L: null,
          abortions_A: null,
          stillBirth: null,
        }),
      );
    });

    it('recalculates gravida when not primi gravida', () => {
      form.patchValue({ para: 2, abortions_A: 1 });
      component.gravidaStatus = false;
      component.ngOnChanges(gravidaChange);
      expect(form.value.gravida_G).toBe(4);
    });

    it('ignores unrelated changes', () => {
      form.patchValue({ gravida_G: 7 });
      component.ngOnChanges({});
      expect(form.value.gravida_G).toBe(7);
    });
  });

  describe('calculateGravida', () => {
    it('defaults to 1 with no para or abortions', () => {
      component.calculateGravida();
      expect(component.gravida_G).toBe(1);
    });

    it('alerts when abortions exceed 5', () => {
      form.patchValue({ abortions_A: 6 });
      component.calculateGravida('abortions_A');
      expect(component.gravida_G).toBe(7);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.recheckValue,
      );
    });

    it('alerts when still births exceed 9', () => {
      form.patchValue({ stillBirth: 10 });
      component.calculateGravida('stillBirth');
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.recheckValue,
      );
    });

    it('does not alert for in-range values', () => {
      form.patchValue({ stillBirth: 2, abortions_A: 2 });
      component.calculateGravida('stillBirth');
      component.calculateGravida('abortions_A');
      expect(confirm.alert).not.toHaveBeenCalled();
    });
  });

  it('checkLivingChildren alerts above 9 only', () => {
    component.checkLivingChildren(9);
    expect(confirm.alert).not.toHaveBeenCalled();
    component.checkLivingChildren(10);
    expect(confirm.alert).toHaveBeenCalledWith(
      LANGUAGE_EN.alerts.info.recheckValue,
    );
  });

  it('checkAbortions alerts above 5 only', () => {
    component.checkAbortions(5);
    expect(confirm.alert).not.toHaveBeenCalled();
    component.checkAbortions(6);
    expect(confirm.alert).toHaveBeenCalledWith(
      LANGUAGE_EN.alerts.info.valueRange,
    );
  });

  it('setBloodGroupHrp pushes the selected blood group to HRP service', () => {
    form.patchValue({ bloodGroup: 'AB+' });
    component.setBloodGroupHrp();
    expect(hrp.setBloodGroup).toHaveBeenCalledWith('AB+');
    expect(hrp.checkHrpStatus).toBeTrue();
  });

  it('setBloodGroupHrp only flags status when the control is missing', () => {
    component.obstetricFormulaForm = new FormGroup({});
    hrp.setBloodGroup.calls.reset();
    component.setBloodGroupHrp();
    expect(hrp.setBloodGroup).not.toHaveBeenCalled();
    expect(hrp.checkHrpStatus).toBeTrue();
  });

  it('getters return form values', () => {
    form.patchValue({ para: 1, livebirths_L: 1, bloodGroup: 'O-' });
    expect(component.para).toBe(1);
    expect(component.livebirths_L).toBe(1);
    expect(component.bloodGroup).toBe('O-');
  });
});
