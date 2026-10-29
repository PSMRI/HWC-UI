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
import { FormBuilder } from '@angular/forms';
import { AmritTrackingService } from 'Common-UI/src/tracking';

import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
  createSessionStorageMock,
} from 'src/testing/test-utils';
import { MaterialModule } from 'src/app/app-modules/core/material.module';
import { GeneralUtils } from '../../../shared/utility/general-utility';
import { HeadToToeExaminationComponent } from './head-to-toe-examination.component';

const FIELDS = [
  'head',
  'eyes',
  'ears',
  'nose',
  'oralCavity',
  'throat',
  'breastAndNipples',
  'trunk',
  'upperLimbs',
  'lowerLimbs',
  'skin',
  'hair',
  'nails',
];

describe('HeadToToeExaminationComponent', () => {
  let component: HeadToToeExaminationComponent;
  let fixture: ComponentFixture<HeadToToeExaminationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [HeadToToeExaminationComponent],
      providers: [...commonTestProviders()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(HeadToToeExaminationComponent);
    component = fixture.componentInstance;
    component.headToToeExaminationForm = new GeneralUtils(
      new FormBuilder(),
      createSessionStorageMock({
        serviceLineDetails: JSON.stringify({
          facilityID: 1,
          parkingPlaceID: 2,
        }),
      }) as any,
    ).createHeadToToeExaminationForm();
    fixture.detectChanges();
  });

  function fillAll() {
    const patch: any = { headtoToeExam: 'Abnormal', nipples: 'Cracked' };
    FIELDS.forEach((f) => (patch[f] = `${f}-val`));
    component.headToToeExaminationForm.patchValue(patch);
  }

  it('should create and load the language set', () => {
    expect(component).toBeTruthy();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  it('re-assigns the language set on ngDoCheck', () => {
    component.current_language_set = null;
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  it('getters return the form values', () => {
    fillAll();
    expect(component.headtoToeExam).toBe('Abnormal');
    expect(component.nipples).toBe('Cracked');
    FIELDS.forEach((f) => expect((component as any)[f]).toBe(`${f}-val`));
  });

  it('checkWithHeadToToe clears all fields but keeps nipples for non-PNC', () => {
    fillAll();
    component.visitCategory = 'ANC';
    component.checkWithHeadToToe();
    FIELDS.forEach((f) => expect((component as any)[f]).toBeNull());
    expect(component.nipples).toBe('Cracked');
  });

  it('checkWithHeadToToe also clears nipples for PNC', () => {
    fillAll();
    component.visitCategory = 'PNC';
    component.checkWithHeadToToe();
    expect(component.nipples).toBeNull();
    expect(component.head).toBeNull();
  });

  it('tracks field interactions under "Head to Toe Examination"', () => {
    const tracking = TestBed.inject(AmritTrackingService) as any;
    component.trackFieldInteraction('Head');
    expect(tracking.trackFieldInteraction).toHaveBeenCalledWith(
      'Head',
      'Head to Toe Examination',
    );
  });
});
