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

import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
  createSessionStorageMock,
} from 'src/testing/test-utils';
import { GeneralUtils } from '../../../shared/utility/general-utility';
import { SystemicExaminationComponent } from './systemic-examination.component';

const SESSION = {
  serviceLineDetails: JSON.stringify({ facilityID: 1, parkingPlaceID: 2 }),
};

describe('SystemicExaminationComponent', () => {
  let component: SystemicExaminationComponent;
  let fixture: ComponentFixture<SystemicExaminationComponent>;
  let form: FormGroup;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [SystemicExaminationComponent],
      providers: [...commonTestProviders({ session: SESSION })],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SystemicExaminationComponent);
    component = fixture.componentInstance;
    const utils = new GeneralUtils(
      new FormBuilder(),
      createSessionStorageMock(SESSION) as any,
    );
    form = utils.createSystemicExaminationForm();
    component.systemicExaminationForm = form;
  });

  it('should create and render with a General OPD visit', () => {
    component.visitCategory = 'General OPD';
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
    expect(component.displayGeneral).toBeTrue();
    expect(component.displayANC).toBeFalse();
    expect(component.gastroIntestinalSystemForm).toBe(
      form.get('gastroIntestinalSystemForm') as FormGroup,
    );
  });

  describe('ngOnInit', () => {
    it('adds the obstetric form for ANC', () => {
      component.visitCategory = 'ANC';
      component.ngOnInit();
      expect(component.displayANC).toBeTrue();
      expect(component.displayGeneral).toBeFalse();
      expect(form.contains('obstetricExaminationForANCForm')).toBeTrue();
      expect(component.obstetricExaminationForANCForm).toBe(
        form.get('obstetricExaminationForANCForm') as FormGroup,
      );
    });

    it('shows general sections for PNC', () => {
      component.visitCategory = 'PNC';
      component.ngOnInit();
      expect(component.displayGeneral).toBeTrue();
      expect(component.displayANC).toBeFalse();
      expect(form.contains('obstetricExaminationForANCForm')).toBeFalse();
    });

    it('shows neither for other categories', () => {
      component.visitCategory = 'NCD care';
      component.ngOnInit();
      expect(component.displayGeneral).toBeFalse();
      expect(component.displayANC).toBeFalse();
      expect(component.cardioVascularSystemForm).toBe(
        form.get('cardioVascularSystemForm') as FormGroup,
      );
    });
  });

  describe('ngOnChanges', () => {
    it('adds the obstetric form when category becomes ANC', () => {
      component.visitCategory = 'ANC';
      component.ngOnChanges();
      expect(component.displayANC).toBeTrue();
      expect(form.contains('obstetricExaminationForANCForm')).toBeTrue();
    });

    it('removes the obstetric form and shows general for General OPD', () => {
      component.visitCategory = 'ANC';
      component.ngOnChanges();
      component.visitCategory = 'General OPD';
      component.ngOnChanges();
      expect(component.displayANC).toBeFalse();
      expect(component.displayGeneral).toBeTrue();
      expect(form.contains('obstetricExaminationForANCForm')).toBeFalse();
      expect(component.obstetricExaminationForANCForm).toBeNull();
    });

    it('does not show general for other categories', () => {
      component.visitCategory = 'NCD screening';
      component.ngOnChanges();
      expect(component.displayANC).toBeFalse();
      expect(component.displayGeneral).toBeFalse();
    });
  });

  it('re-assigns the language set on ngDoCheck', () => {
    component.current_language_set = null;
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });
});
