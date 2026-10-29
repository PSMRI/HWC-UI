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
import { FormGroup } from '@angular/forms';

import {
  COMMON_TEST_IMPORTS,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';
import { ReferComponent } from './refer.component';

describe('ReferComponent', () => {
  let component: ReferComponent;
  let fixture: ComponentFixture<ReferComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [ReferComponent],
      providers: [...commonTestProviders()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ReferComponent);
    component = fixture.componentInstance;
    component.patientReferForm = new FormGroup({});
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('leaves showGeneralOPD false when no visit category is set', () => {
    component.ngOnInit();
    expect(component.showGeneralOPD).toBeFalse();
  });

  [
    'General OPD',
    'ANC',
    'NCD care',
    'PNC',
    'COVID-19 Screening',
    'NCD screening',
    'FP & Contraceptive Services',
    'General OPD (QC)',
  ].forEach((category) => {
    it(`shows general OPD referral for "${category}"`, () => {
      component.visitCategory = category;
      component.ngOnInit();
      expect(component.showGeneralOPD).toBeTrue();
    });
  });

  it('hides general OPD referral for other categories', () => {
    component.visitCategory = 'Cancer Screening';
    component.ngOnInit();
    expect(component.showGeneralOPD).toBeFalse();
  });
});
