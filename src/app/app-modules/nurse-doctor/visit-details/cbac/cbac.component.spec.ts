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
import { FormControl, FormGroup } from '@angular/forms';
import { BehaviorSubject, of } from 'rxjs';

import { CbacComponent } from './cbac.component';
import { CbacService } from '../../shared/services/cbac.service';
import { BeneficiaryDetailsService } from 'src/app/app-modules/core/services/beneficiary-details.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { MaterialModule } from 'src/app/app-modules/core/material.module';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';

const CONTROLS =
  'cbacAge cbacAgeScore cbacAlcohol cbacAlcoholScore cbacAntiTBDrugs cbacBleedingIntercourse cbacBleedingMenopause cbacBleedingPeriods cbacBloodnippleDischarge cbacBloodsputum cbacBlurredVision cbacBreastsizechange cbacClawingfingers cbacConsumeGutka cbacConsumeGutkaScore cbacCough2weeks cbacDifficultHoldingObjects cbacDifficultyHearing cbacDifficultyreading cbacFamilyHistoryBpdiabetes cbacFamilyHistoryBpdiabetesScore cbacFeelingUnsteady cbacFeetweakness cbacFever2weeks cbacFitsHistory cbacForgetnearones cbacHandTingling cbacHypopigmentedpatches cbacInabilityCloseeyelid cbacLumpBreast cbacMouthUlcers cbacMouthUlcersGrowth cbacMouthopeningDifficulty cbacMouthredpatch cbacNeedhelpEverydayActivities cbacNightSweats cbacNodulesonskin cbacPainchewing cbacPhysicalActivity cbacPhysicalActivityScore cbacPhysicalDisabilitySuffering cbacRecurrentNumbness cbacRecurrentTingling cbacRednessPain cbacShortnessBreath cbacTBHistory cbacTb cbacThickenedskin cbacTonechange cbacUlceration cbacVaginalDischarge cbacWaistFemale cbacWaistFemaleScore cbacWaistMale cbacWaistMaleScore cbacWeightLoss totalScore'.split(
    ' ',
  );

function buildForm(): FormGroup {
  const g: Record<string, FormControl> = {};
  CONTROLS.forEach((c) => (g[c] = new FormControl(null)));
  return new FormGroup(g);
}

describe('CbacComponent', () => {
  let component: CbacComponent;
  let fixture: ComponentFixture<CbacComponent>;
  let cbac: any;
  let ben$: BehaviorSubject<any>;
  let session: any;

  beforeEach(async () => {
    ben$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [CbacComponent],
      providers: [
        ...commonTestProviders({
          session: { visitID: 'V1', beneficiaryRegID: 'B1', visitCode: 'VC1' },
        }),
        { provide: CbacService, useValue: autoSpy(CbacService) },
        {
          provide: BeneficiaryDetailsService,
          useValue: { beneficiaryDetails$: ben$ },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(CbacComponent);
    component = fixture.componentInstance;
    component.cbacScreeningForm = buildForm();
    cbac = TestBed.inject(CbacService) as any;
    session = TestBed.inject(SessionStorageService) as any;
  });

  it('should init language, reset form and default to >=60 age option', () => {
    component.cbacScreeningForm.patchValue({ cbacAge: 'x' });
    fixture.detectChanges();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.cbacScreeningForm.value.cbacAge).toBeNull();
    expect(component.cbacAgeOptions).toEqual([
      { option: '>=60 years', score: 4 },
    ]);
  });

  it('should read beneficiary gender and age', () => {
    ben$.next({ genderName: 'Female', ageVal: 35 });
    fixture.detectChanges();
    expect(component.beneficiaryGender).toBe('female');
    expect(component.beneficiaryAge).toBe(35);
    expect(component.cbacAgeOptions).toEqual([
      { option: '30-39 years', score: 1 },
    ]);
  });

  [
    { age: 10, opt: '0-29 years', score: 0 },
    { age: 30, opt: '30-39 years', score: 1 },
    { age: 45, opt: '40-49 years', score: 2 },
    { age: 55, opt: '50-59 years', score: 3 },
    { age: 70, opt: '>=60 years', score: 4 },
  ].forEach((c) => {
    it(`setAgeQuetionOptions for age ${c.age}`, () => {
      component.beneficiaryAge = c.age;
      component.setAgeQuetionOptions();
      expect(component.cbacAgeOptions).toEqual([
        { option: c.opt, score: c.score },
      ]);
    });
  });

  it('ngOnChanges outside view mode does not fetch', () => {
    component.ngOnChanges();
    expect(cbac.fetchCbacDetails).not.toHaveBeenCalled();
  });

  describe('view mode fetch', () => {
    beforeEach(() => (component.mode = 'view'));

    it('patches every field when present', () => {
      const data: any = {};
      CONTROLS.forEach((c) => (data[c] = c + '-v'));
      data.totalScore = 7;
      cbac.fetchCbacDetails.and.returnValue(of({ statusCode: 200, data }));
      component.ngOnChanges();
      expect(cbac.fetchCbacDetails).toHaveBeenCalledWith({
        visitID: 'V1',
        beneficiaryRegId: 'B1',
        visitCode: 'VC1',
      });
      expect(component.totalScore).toBe(7);
      expect(component.cbacDetailsFromNurse).toBe(data);
      const v = component.cbacScreeningForm.value;
      expect(v.totalScore).toBe(7);
      expect(v.cbacAge).toBe('cbacAge-v');
      expect(v.cbacForgetnearones).toBe('cbacForgetnearones-v');
      expect(v.cbacTb).toBe('cbacTb-v');
    });

    it('patches nulls for missing fields', () => {
      component.cbacScreeningForm.patchValue({ cbacAge: 'old', cbacTb: 'x' });
      cbac.fetchCbacDetails.and.returnValue(
        of({ statusCode: 200, data: { totalScore: 3 } }),
      );
      component.ngOnChanges();
      const v = component.cbacScreeningForm.value;
      expect(v.totalScore).toBe(3);
      expect(v.cbacAge).toBeNull();
      expect(v.cbacTb).toBeNull();
    });

    it('ignores data without total score, null data, or non-200', () => {
      cbac.fetchCbacDetails.and.returnValues(
        of({ statusCode: 200, data: { cbacAge: 'a' } }),
        of({ statusCode: 200, data: null }),
        of({ statusCode: 5000, data: { totalScore: 1 } }),
      );
      component.getCbacDetails();
      expect(component.cbacDetailsFromNurse).toEqual({ cbacAge: 'a' });
      component.getCbacDetails();
      component.getCbacDetails();
      expect(component.totalScore).toBe(0);
      expect(component.cbacScreeningForm.value.cbacAge).toBeNull();
    });
  });

  describe('score calculations', () => {
    beforeEach(() => fixture.detectChanges());

    it('calculates each score and the total', () => {
      component.cbacAgeOptions = [{ option: '40-49 years', score: 2 }];
      const f = component.cbacScreeningForm;
      f.patchValue({ cbacAge: '40-49 years' });
      component.calculateAgeScore();
      expect(f.value.cbacAgeScore).toBe(2);

      f.patchValue({ cbacConsumeGutka: 'Daily' });
      component.calculatecbacConsumeGutka();
      expect(f.value.cbacConsumeGutkaScore).toBe(2);

      f.patchValue({ cbacAlcohol: 'yes' });
      component.calculatecbacAlcohol();
      expect(f.value.cbacAlcoholScore).toBe(1);

      f.patchValue({ cbacWaistMale: 'More than 100cm' });
      component.calculatecbacWaistMaleScore();
      expect(f.value.cbacWaistMaleScore).toBe(2);

      f.patchValue({ cbacWaistFemale: '81-90 cm' });
      component.calculatecbacWaistFemaleScore();
      expect(f.value.cbacWaistFemaleScore).toBe(1);

      f.patchValue({ cbacPhysicalActivity: 'Less than 150 minutes in a week' });
      component.calculateCbacPhysicalActivity();
      expect(f.value.cbacPhysicalActivityScore).toBe(1);

      f.patchValue({ cbacFamilyHistoryBpdiabetes: 'yes' });
      component.calculateCbacFamilyHistoryBpdiabetes();
      expect(f.value.cbacFamilyHistoryBpdiabetesScore).toBe(2);

      expect(component.totalCbacScore).toBe(11);
      expect(f.value.totalScore).toBe(11);
    });

    it('alcohol and family history "no" score 0', () => {
      component.cbacAlcoholScore = 1;
      component.cbacFamilyHistoryBpdiabetesScore = 2;
      component.cbacScreeningForm.patchValue({
        cbacAlcohol: 'no',
        cbacFamilyHistoryBpdiabetes: 'no',
      });
      component.calculatecbacAlcohol();
      component.calculateCbacFamilyHistoryBpdiabetes();
      expect(component.cbacAlcoholScore).toBe(0);
      expect(component.cbacFamilyHistoryBpdiabetesScore).toBe(0);
      expect(component.cbacScreeningForm.value.totalScore).toBe(0);
    });
  });

  it('ngOnDestroy unsubscribes beneficiary subscription', () => {
    fixture.detectChanges();
    const s = spyOn(component.beneficiaryDetailsSubscription, 'unsubscribe');
    component.ngOnDestroy();
    expect(s).toHaveBeenCalled();
  });

  it('ngOnDestroy without subscription does not throw', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
    expect(session).toBeTruthy();
  });
});
