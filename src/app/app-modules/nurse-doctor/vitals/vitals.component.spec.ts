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
import { By } from '@angular/platform-browser';

import { VitalsComponent } from './vitals.component';
import { COMMON_TEST_IMPORTS, NO_ERRORS_SCHEMA } from 'src/testing/test-utils';

describe('VitalsComponent', () => {
  let component: VitalsComponent;
  let fixture: ComponentFixture<VitalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [VitalsComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(VitalsComponent);
    component = fixture.componentInstance;
    component.patientVitalsDataForm = new FormBuilder().group({});
  });

  it('should create with all sections hidden by default', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.showGeneralOPD).toBeFalse();
    expect(component.showNeonatal).toBeFalse();
    expect(component.showChildAndAdolescent).toBeFalse();
  });

  it('should leave flags untouched when visitCategory is empty', () => {
    component.showGeneralOPD = true;
    component.visitCategory = '';
    component.ngOnChanges();
    expect(component.showGeneralOPD).toBeTrue();
  });

  const cases = [
    {
      cat: 'General OPD',
      opd: true,
      neo: false,
      child: false,
      selector: 'app-nurse-general-patient-vitals',
    },
    {
      cat: 'Neonatal and Infant Health Care Services',
      opd: false,
      neo: true,
      child: false,
      selector: 'app-nurse-neonatal-patient-vitals',
    },
    {
      cat: 'Childhood & Adolescent Healthcare Services',
      opd: false,
      neo: false,
      child: true,
      selector: 'app-nurse-neonatal-patient-vitals',
    },
  ];
  cases.forEach((c) => {
    it(`should set flags and render ${c.selector} for "${c.cat}"`, () => {
      component.visitCategory = c.cat;
      component.ngOnChanges();
      fixture.detectChanges();
      expect(component.showGeneralOPD).toBe(c.opd);
      expect(component.showNeonatal).toBe(c.neo);
      expect(component.showChildAndAdolescent).toBe(c.child);
      expect(fixture.debugElement.query(By.css(c.selector))).toBeTruthy();
    });
  });
});
