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
import { MaterialModule } from 'src/app/app-modules/core/material.module';
import { GeneralUtils } from '../../../shared/utility/general-utility';
import { GeneralOralExaminationComponent } from './general-oral-examination.component';

describe('GeneralOralExaminationComponent', () => {
  let component: GeneralOralExaminationComponent;
  let fixture: ComponentFixture<GeneralOralExaminationComponent>;
  let form: FormGroup;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [GeneralOralExaminationComponent],
      providers: [...commonTestProviders()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(GeneralOralExaminationComponent);
    component = fixture.componentInstance;
    form = new GeneralUtils(
      new FormBuilder(),
      createSessionStorageMock({
        serviceLineDetails: JSON.stringify({
          facilityID: 1,
          parkingPlaceID: 2,
        }),
      }) as any,
    ).createOralExaminationForm();
    component.oralExaminationForm = form;
    fixture.detectChanges();
  });

  it('should create and load the language set', () => {
    expect(component).toBeTruthy();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
    expect(component.showOther).toBeFalse();
  });

  it('shows the "other" field when "Any other lesion" is selected', () => {
    form.patchValue({ preMalignantLesionTypeList: ['Any other lesion'] });
    expect(component.showOther).toBeTrue();
  });

  it('hides "other" and clears its value for other selections', () => {
    form.patchValue({ preMalignantLesionTypeList: ['Any other lesion'] });
    form.patchValue({ otherLesionType: 'Custom' });
    form.patchValue({ preMalignantLesionTypeList: ['Leukoplakia'] });
    expect(component.showOther).toBeFalse();
    expect(form.value.otherLesionType).toBeNull();
  });

  it('clears the other lesion type when the list is reset to null', () => {
    form.patchValue({ otherLesionType: 'Custom' });
    component.checkWithPremalignantLesion();
    expect(form.value.preMalignantLesionTypeList).toBeNull();
    expect(form.value.otherLesionType).toBeNull();
  });

  it('getters expose the underlying controls', () => {
    expect(component.premalignantLesions).toBe(form.get('premalignantLesions'));
    expect(component.preMalignantLesionType).toBeNull();
    expect(component.observation).toBe(form.get('observation'));
  });

  it('re-assigns the language set on ngDoCheck', () => {
    component.current_language_set = null;
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  it('tolerates a form without the lesion list control', () => {
    component.oralExaminationForm = new FormGroup({});
    expect(() => component.ngOnInit()).not.toThrow();
  });
});
