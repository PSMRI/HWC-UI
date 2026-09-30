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

import { TreatmentsOnSideEffectsComponent } from './treatments-on-side-effects.component';
import { DoctorService } from '../../../shared/services';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('TreatmentsOnSideEffectsComponent', () => {
  let component: TreatmentsOnSideEffectsComponent;
  let fixture: ComponentFixture<TreatmentsOnSideEffectsComponent>;
  let caseRecord$: BehaviorSubject<any>;

  beforeEach(async () => {
    caseRecord$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [TreatmentsOnSideEffectsComponent],
      providers: [
        ...commonTestProviders(),
        {
          provide: DoctorService,
          useValue: autoSpy(DoctorService, {
            populateCaserecordResponse$: caseRecord$.asObservable(),
          }),
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(TreatmentsOnSideEffectsComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(TreatmentsOnSideEffectsComponent);
    component = fixture.componentInstance;
    component.treatmentsOnSideEffectsForm = new FormGroup({
      treatmentsOnSideEffects: new FormControl(null),
    });
    fixture.detectChanges();
  });

  it('should create and set language', () => {
    expect(component).toBeTruthy();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });

  it('patches treatments in view mode', () => {
    component.caseRecordMode = 'view';
    component.ngOnChanges();
    caseRecord$.next({
      statusCode: 200,
      data: { treatmentsOnSideEffects: 'Paracetamol' },
    });
    expect(
      component.treatmentsOnSideEffectsForm.value.treatmentsOnSideEffects,
    ).toBe('Paracetamol');
  });

  it('ignores responses without treatments', () => {
    component.caseRecordMode = 'view';
    component.ngOnChanges();
    caseRecord$.next({ statusCode: 200, data: {} });
    caseRecord$.next({ statusCode: 5000, data: {} });
    expect(
      component.treatmentsOnSideEffectsForm.value.treatmentsOnSideEffects,
    ).toBeNull();
  });

  it('does not subscribe when not in view mode', () => {
    component.caseRecordMode = 'edit';
    component.ngOnChanges();
    expect(component.sideEffectsTretmentSubscription).toBeUndefined();
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('unsubscribes on destroy', () => {
    component.caseRecordMode = 'view';
    component.ngOnChanges();
    const sub = component.sideEffectsTretmentSubscription;
    component.ngOnDestroy();
    expect(sub.closed).toBeTrue();
  });
});
