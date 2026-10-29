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
import { BehaviorSubject } from 'rxjs';

import { ImmunizationHistoryComponent } from './immunization-history.component';
import { DoctorService, MasterdataService } from '../../../shared/services';
import { BeneficiaryDetailsService } from '../../../../core/services/beneficiary-details.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';

const v = (
  vaccinationTime: string,
  vaccineName: string,
  sctCode: any = null,
) => ({
  vaccinationTime,
  vaccineName,
  sctCode,
  sctTerm: sctCode ? 'term-' + vaccineName : null,
});
const VACCINES = [
  v('14 weeks', 'Pentavalent-3'),
  v('14 weeks', 'Rota Vaccine-3'),
  v('14 weeks', 'OPV-3'),
  v('14 weeks', 'fIPV-2'),
  v('14 weeks', 'PCV2'),
  v('Birth', 'BCG', '111'),
  v('Birth', 'OPV-0'),
  v('Birth', 'HBV-0'),
  v('6 weeks', 'Pentavalent-1'),
  v('6 weeks', 'Rota Vaccine-1'),
  v('6 weeks', 'OPV-1'),
  v('6 weeks', 'fIPV-1'),
  v('6 weeks', 'PCV1'),
  v('10 weeks', 'Pentavalent-2'),
  v('10 weeks', 'Rota Vaccine-2'),
  v('10 weeks', 'OPV-2'),
  v('9-12 months', 'MR-1'),
  v('5-6 years', 'DPT Booster-2'),
  v('16 years', 'TT'),
];

describe('ImmunizationHistoryComponent', () => {
  let component: ImmunizationHistoryComponent;
  let fixture: ComponentFixture<ImmunizationHistoryComponent>;
  let masterData$: BehaviorSubject<any>;
  let history$: BehaviorSubject<any>;
  let ben$: BehaviorSubject<any>;
  let session: any;

  const list = () =>
    component.immunizationHistoryForm.get('immunizationList') as FormArray;
  const group = (age: string) =>
    list().controls.find(
      (c) => c.value.defaultReceivingAge === age,
    ) as FormGroup;
  const vac = (age: string, name: string) =>
    (group(age).get('vaccines') as FormArray).controls.find(
      (c) => c.value.vaccine === name,
    ) as FormGroup;

  beforeEach(async () => {
    masterData$ = new BehaviorSubject<any>(null);
    history$ = new BehaviorSubject<any>(null);
    ben$ = new BehaviorSubject<any>({ age: '1 years - 2 months' });
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [ImmunizationHistoryComponent],
      providers: [
        ...commonTestProviders(),
        {
          provide: MasterdataService,
          useValue: autoSpy(MasterdataService, {
            nurseMasterData$: masterData$.asObservable(),
          }),
        },
        {
          provide: DoctorService,
          useValue: autoSpy(DoctorService, {
            populateHistoryResponse$: history$.asObservable(),
          }),
        },
        {
          provide: BeneficiaryDetailsService,
          useValue: autoSpy(BeneficiaryDetailsService, {
            beneficiaryDetails$: ben$.asObservable(),
          }),
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(ImmunizationHistoryComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(ImmunizationHistoryComponent);
    component = fixture.componentInstance;
    component.immunizationHistoryForm = TestBed.inject(FormBuilder).group({
      immunizationList: new FormArray([]),
    });
    session = TestBed.inject(SessionStorageService);
  });

  const load = () => {
    fixture.detectChanges();
    masterData$.next({ childVaccinations: VACCINES });
  };

  describe('building the immunization list', () => {
    it('groups vaccines by age up to the beneficiary age, sorted by age', () => {
      load();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.beneficiaryAge).toBe('420 days');
      expect(list().length).toBe(4);
      expect(list().value.map((g: any) => g.defaultReceivingAge)).toEqual([
        'Birth',
        '6 weeks',
        '10 weeks',
        '14 weeks',
      ]);
      expect(vac('Birth', 'BCG').value).toEqual({
        vaccine: 'BCG',
        sctCode: '111',
        sctTerm: 'term-BCG',
        status: false,
        hide: true,
      });
      expect(vac('Birth', 'OPV-0').value.sctCode).toBeNull();
    });

    it('hides second/third doses and age-expired vaccines', () => {
      load();
      expect(group('Birth').value.hideSelectAll).toBeTrue();
      expect(group('14 weeks').value.hideSelectAll).toBeTrue();
      expect(group('6 weeks').value.hideSelectAll).toBeFalse();
      expect(vac('6 weeks', 'Pentavalent-1').value.hide).toBeTrue();
      expect(vac('6 weeks', 'OPV-1').value.hide).toBeFalse();
      expect(vac('10 weeks', 'OPV-2').value.hide).toBeTrue();
    });

    it('uses the year part only when months are zero', () => {
      ben$.next({ age: '2 years - 0 months' });
      load();
      expect(component.beneficiaryAge).toBe('2 years');
    });

    it('handles an age string without months', () => {
      ben$.next({ age: '5 days' });
      load();
      expect(component.beneficiaryAge).toBe('5 days');
      expect(list().length).toBe(1);
      expect(vac('Birth', 'OPV-0').value.hide).toBeFalse();
      expect(vac('Birth', 'HBV-0').value.hide).toBeTrue();
    });

    it('treats an unknown beneficiary as newborn', () => {
      ben$.next(null);
      load();
      expect(component.beneficiaryAge).toBeUndefined();
      expect(list().length).toBe(1);
      expect(group('Birth').value.hideSelectAll).toBeFalse();
    });

    it('ignores master data without child vaccinations', () => {
      fixture.detectChanges();
      masterData$.next({});
      expect(list().length).toBe(0);
    });
  });

  describe('getAgeValue', () => {
    it('converts units to days', () => {
      expect(component.getAgeValue('2 years')).toBe(720);
      expect(component.getAgeValue('3 months')).toBe(90);
      expect(component.getAgeValue('2 weeks')).toBe(14);
      expect(component.getAgeValue('4 days')).toBe(4);
      expect(component.getAgeValue('4 hours')).toBe(0);
      expect(component.getAgeValue('Birth')).toBe(0);
      expect(component.getAgeValue(null)).toBe(0);
    });
  });

  describe('loading saved vaccine data', () => {
    const savedHistory = () => ({
      statusCode: 200,
      data: {
        ImmunizationHistory: {
          immunizationList: [
            { defaultReceivingAge: 'Birth', vaccines: [{ status: true }] },
            {
              defaultReceivingAge: '6 weeks',
              vaccines: [
                { status: true },
                { status: false },
                { status: true },
                { status: true },
                { status: true },
              ],
            },
          ],
        },
      },
    });

    it('patches statuses and reveals follow-up doses in view mode', () => {
      component.mode = 'view';
      load();
      history$.next(savedHistory());
      expect(vac('Birth', 'BCG').value.status).toBeTrue();
      expect(vac('Birth', 'BCG').value.hide).toBeFalse();
      expect(vac('10 weeks', 'Pentavalent-2').value.hide).toBeFalse();
      expect(vac('10 weeks', 'OPV-2').value.hide).toBeFalse();
      expect(vac('10 weeks', 'Rota Vaccine-2').value.hide).toBeTrue();
      expect(vac('14 weeks', 'fIPV-2').value.hide).toBeFalse();
      expect(vac('14 weeks', 'PCV2').value.hide).toBeFalse();
    });

    it('loads for specialist flag 100', () => {
      session.setItem('specialistFlag', '100');
      const spy = spyOn(component, 'loadVaccineData');
      load();
      expect(spy).toHaveBeenCalled();
    });

    it('ignores history without immunization list', () => {
      component.mode = 'view';
      load();
      history$.next({ statusCode: 200, data: { ImmunizationHistory: {} } });
      expect(vac('Birth', 'BCG').value.status).toBeFalse();
    });
  });

  describe('onVaccineCheck', () => {
    beforeEach(load);

    const check = (age: string, name: string, status: boolean) => {
      const g = vac(age, name);
      g.patchValue({ status });
      component.onVaccineCheck(g);
    };

    const cases: [string, string, [string, string][]][] = [
      ['6 weeks', 'fIPV-1', [['14 weeks', 'fIPV-2']]],
      ['6 weeks', 'Pentavalent-1', [['10 weeks', 'Pentavalent-2']]],
      ['10 weeks', 'Pentavalent-2', [['14 weeks', 'Pentavalent-3']]],
      ['6 weeks', 'Rota Vaccine-1', [['10 weeks', 'Rota Vaccine-2']]],
      ['10 weeks', 'Rota Vaccine-2', [['14 weeks', 'Rota Vaccine-3']]],
      ['6 weeks', 'OPV-1', [['10 weeks', 'OPV-2']]],
      ['10 weeks', 'OPV-2', [['14 weeks', 'OPV-3']]],
      ['6 weeks', 'PCV1', [['14 weeks', 'PCV2']]],
    ];

    cases.forEach(([age, name, targets]) => {
      it(`${name} checked reveals and unchecked hides the next dose`, () => {
        check(age, name, true);
        targets.forEach(([a, n]) => {
          expect(vac(a, n).value.hide).toBeFalse();
          expect(group(a).value.hideSelectAll).toBeFalse();
        });
        vac(targets[0][0], targets[0][1]).patchValue({ status: true });
        check(age, name, false);
        targets.forEach(([a, n]) => {
          expect(vac(a, n).value.hide).toBeTrue();
          expect(vac(a, n).value.status).toBeFalse();
        });
      });
    });

    it('unchecking dose 1 also hides dose 3', () => {
      check('6 weeks', 'Pentavalent-1', true);
      check('10 weeks', 'Pentavalent-2', true);
      expect(vac('14 weeks', 'Pentavalent-3').value.hide).toBeFalse();
      check('6 weeks', 'Pentavalent-1', false);
      expect(vac('14 weeks', 'Pentavalent-3').value.hide).toBeTrue();

      check('6 weeks', 'Rota Vaccine-1', true);
      check('10 weeks', 'Rota Vaccine-2', true);
      check('6 weeks', 'Rota Vaccine-1', false);
      expect(vac('14 weeks', 'Rota Vaccine-3').value.hide).toBeTrue();

      check('6 weeks', 'OPV-1', true);
      check('10 weeks', 'OPV-2', true);
      check('6 weeks', 'OPV-1', false);
      expect(vac('14 weeks', 'OPV-3').value.hide).toBeTrue();
      expect(group('14 weeks').value.hideSelectAll).toBeTrue();
    });

    it('ignores unrelated vaccines and undefined input', () => {
      const hides = () =>
        JSON.stringify(
          list().value.map((g: any) => g.vaccines.map((v: any) => v.hide)),
        );
      const before = hides();
      check('Birth', 'BCG', true);
      component.onVaccineCheck(undefined);
      expect(hides()).toBe(before);
      expect(vac('Birth', 'BCG').value.status).toBeTrue();
    });
  });

  describe('checkSelectALLValue', () => {
    beforeEach(load);

    it('is false while a visible vaccine is unchecked, true once all are', () => {
      expect(component.checkSelectALLValue('6 WEEKS')).toBeFalse();
      ['OPV-1', 'fIPV-1', 'PCV1'].forEach((n) =>
        vac('6 weeks', n).patchValue({ status: true }),
      );
      expect(component.checkSelectALLValue('6 weeks')).toBeTrue();
      expect(component.checkSelectALLValue('14 weeks')).toBeTrue();
    });

    it('returns undefined for an empty list', () => {
      list().clear();
      expect(component.checkSelectALLValue('6 weeks')).toBeUndefined();
    });
  });

  it('selectAll marks the list dirty', () => {
    load();
    component.selectAll(true, 0);
    expect(list().dirty).toBeTrue();
  });

  it('ngOnDestroy unsubscribes', () => {
    load();
    const a = spyOn(component.nurseMasterDataSubscription, 'unsubscribe');
    const b = spyOn(component.beneficiaryDetailSubscription, 'unsubscribe');
    component.ngOnDestroy();
    expect(a).toHaveBeenCalled();
    expect(b).toHaveBeenCalled();
    component.nurseMasterDataSubscription = null;
    component.beneficiaryDetailSubscription = null;
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('ngDoCheck refreshes language', () => {
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });
});
