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
import { BehaviorSubject } from 'rxjs';

import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';
import { FollowUpForImmunizationComponent } from './follow-up-for-immunization.component';
import { BeneficiaryDetailsService } from '../../core/services/beneficiary-details.service';
import { DoctorService } from '../shared/services/doctor.service';
import { MasterdataService } from '../shared/services/masterdata.service';

describe('FollowUpForImmunizationComponent', () => {
  let component: FollowUpForImmunizationComponent;
  let fixture: ComponentFixture<FollowUpForImmunizationComponent>;
  let benDetails$: BehaviorSubject<any>;
  let master$: BehaviorSubject<any>;
  let caseRecord$: BehaviorSubject<any>;

  const vaccines = [
    { id: 1, name: '6 weeks' },
    { id: 2, name: '16-24 Months' },
    { id: 3, name: '5-6 Years' },
    { id: 4, name: '10 Years' },
    { id: 5, name: '16 Years' },
  ];
  const locations = [
    { id: 10, name: 'School' },
    { id: 11, name: 'Anganwadi' },
  ];

  const makeForm = () =>
    new FormGroup({
      dueDateForNextImmunization: new FormControl(null),
      nextDueVaccines: new FormControl(null),
      nextDueVaccinesID: new FormControl(null),
      locationOfNextImmunization: new FormControl(null),
      locationOfNextImmunizationID: new FormControl(null),
    });

  const create = async (visitCategory: any) => {
    benDetails$ = new BehaviorSubject<any>(null);
    master$ = new BehaviorSubject<any>(null);
    caseRecord$ = new BehaviorSubject<any>(null);
    TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [FollowUpForImmunizationComponent],
      providers: [
        ...commonTestProviders({ session: { visitCategory } }),
        {
          provide: DoctorService,
          useValue: autoSpy(DoctorService, {
            populateCaserecordResponse$: caseRecord$,
          }),
        },
        {
          provide: MasterdataService,
          useValue: autoSpy(MasterdataService, { doctorMasterData$: master$ }),
        },
        {
          provide: BeneficiaryDetailsService,
          useValue: autoSpy(BeneficiaryDetailsService, {
            beneficiaryDetails$: benDetails$,
          }),
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    // Template binds formControlName to Material selects/datepicker, which
    // have no value accessor under NO_ERRORS_SCHEMA; test class logic only.
    TestBed.overrideTemplate(FollowUpForImmunizationComponent, '');
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(FollowUpForImmunizationComponent);
    component = fixture.componentInstance;
    component.patientFollowUpImmunizationForm = makeForm();
  };

  describe('neonatal visit', () => {
    beforeEach(async () => {
      await create('Neonatal and Infant Health Care Services');
    });

    it('renders, loads language, category and future date', () => {
      fixture.detectChanges();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.visitCategory).toBe(
        'Neonatal and Infant Health Care Services',
      );
      expect(component.futureDate.getTime()).toBeGreaterThan(Date.now());
    });

    it('filters school location and older-age vaccines for neonatal visits', () => {
      fixture.detectChanges();
      master$.next({ nextDueVaccines: vaccines, nextImmuLocations: locations });
      expect(component.dueVaccines).toEqual([{ id: 1, name: '6 weeks' }]);
      expect(component.nextImmunizationSession).toEqual([
        { id: 11, name: 'Anganwadi' },
      ]);
    });

    it('handles missing master lists for neonatal visits', () => {
      fixture.detectChanges();
      master$.next({ nextDueVaccines: null, nextImmuLocations: null });
      expect(component.dueVaccines).toBeNull();
      expect(component.nextImmunizationSession).toBeNull();
    });

    it('patches the form from case record in view mode', () => {
      component.followUpImmunizationMode = 'view';
      fixture.detectChanges();
      master$.next({ nextDueVaccines: vaccines, nextImmuLocations: locations });
      caseRecord$.next({
        statusCode: 200,
        data: {
          followUpForImmunization: {
            dueDateForNextImmunization: '2024-06-01',
            nextDueVaccines: '6 weeks',
            locationOfNextImmunization: 'Anganwadi',
          },
        },
      });
      expect(component.dueDateForNextImmunization).toEqual(
        new Date('2024-06-01'),
      );
      expect(component.nextDueVaccines).toBe('6 weeks');
      expect(component.locationOfNextImmunization).toBe('Anganwadi');
    });

    it('ignores case record without follow up data', () => {
      component.followUpImmunizationMode = 'view';
      fixture.detectChanges();
      master$.next({ nextDueVaccines: [], nextImmuLocations: [] });
      caseRecord$.next({
        statusCode: 200,
        data: { followUpForImmunization: null },
      });
      expect(component.nextDueVaccines).toBeNull();
    });

    it('sets vaccine and location IDs from selected names', () => {
      fixture.detectChanges();
      component.dueVaccines = vaccines;
      component.nextImmunizationSession = locations;
      const f = component.patientFollowUpImmunizationForm;
      f.patchValue({
        nextDueVaccines: '10 Years',
        locationOfNextImmunization: 'School',
      });
      component.onClickOfNextDueVaccine();
      component.onClickOfLocationOfNextImmunization();
      expect(f.value.nextDueVaccinesID).toBe(4);
      expect(f.value.locationOfNextImmunizationID).toBe(10);
    });

    it('computes beneficiary age from years and months', () => {
      fixture.detectChanges();
      benDetails$.next({ age: '1 years - 2 months' });
      expect(component.beneficiary).toEqual({ age: '1 years - 2 months' });
      expect(component.beneficiaryAge).toBe(360 + 60 + ' days');
    });

    it('uses years string when months are zero', () => {
      fixture.detectChanges();
      benDetails$.next({ age: '3 years - 0 months' });
      expect(component.beneficiaryAge).toBe('3 years');
    });

    it('handles age without month part', () => {
      fixture.detectChanges();
      benDetails$.next({ age: '10 days' });
      expect(component.beneficiaryAge).toBe('10 days');
    });

    it('unsubscribes everything on destroy', () => {
      component.followUpImmunizationMode = 'view';
      fixture.detectChanges();
      master$.next({ nextDueVaccines: [], nextImmuLocations: [] });
      fixture.destroy();
      expect(master$.observers.length).toBe(0);
      expect(benDetails$.observers.length).toBe(0);
      expect(caseRecord$.observers.length).toBe(0);
    });

    it('ngOnDestroy tolerates missing subscriptions', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('other visit category', () => {
    beforeEach(async () => {
      await create('General OPD');
    });
    it('keeps master lists unfiltered', () => {
      fixture.detectChanges();
      master$.next({ nextDueVaccines: vaccines, nextImmuLocations: locations });
      expect(component.dueVaccines).toBe(vaccines);
      expect(component.nextImmunizationSession).toBe(locations);
    });
  });

  describe('getAgeValueNew', () => {
    beforeEach(async () => {
      await create('General OPD');
    });
    const cases: [any, number][] = [
      [null, 0],
      ['', 0],
      ['5-6 years', 1800],
      ['2 years', 720],
      ['9-12 months', 360],
      ['16-24 months', 720],
      ['3 months', 90],
      ['6 weeks', 42],
      ['12 days', 12],
      ['4 hours', 0],
      ['7', 0],
    ];
    cases.forEach(([input, out]) =>
      it(`${input} -> ${out}`, () => {
        expect(component.getAgeValueNew(input)).toBe(out);
      }),
    );
  });
});
