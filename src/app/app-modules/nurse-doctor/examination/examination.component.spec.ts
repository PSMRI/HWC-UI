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

import {
  COMMON_TEST_IMPORTS,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';
import { ExaminationComponent } from './examination.component';

describe('ExaminationComponent', () => {
  let component: ExaminationComponent;
  let fixture: ComponentFixture<ExaminationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [ExaminationComponent],
      providers: [...commonTestProviders()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ExaminationComponent);
    component = fixture.componentInstance;
  });

  it('should create with the general OPD section hidden', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.showGeneralOPD).toBeFalse();
  });

  ['General OPD', 'ANC', 'PNC'].forEach((category) => {
    it(`shows the general OPD examination for "${category}"`, () => {
      component.visitCategory = category;
      component.ngOnChanges();
      expect(component.showGeneralOPD).toBeTrue();
    });
  });

  it('hides the general OPD examination for other categories', () => {
    component.visitCategory = 'ANC';
    component.ngOnChanges();
    component.visitCategory = 'NCD care';
    component.ngOnChanges();
    expect(component.showGeneralOPD).toBeFalse();
  });

  it('keeps the previous value when no visit category is set', () => {
    component.showGeneralOPD = true;
    component.visitCategory = '';
    component.ngOnChanges();
    expect(component.showGeneralOPD).toBeTrue();
  });
});
