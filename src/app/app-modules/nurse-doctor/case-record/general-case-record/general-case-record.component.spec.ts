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

import { GeneralCaseRecordComponent } from './general-case-record.component';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('GeneralCaseRecordComponent', () => {
  let component: GeneralCaseRecordComponent;
  let fixture: ComponentFixture<GeneralCaseRecordComponent>;
  let form: FormGroup;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [GeneralCaseRecordComponent],
      providers: [...commonTestProviders()],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(GeneralCaseRecordComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(GeneralCaseRecordComponent);
    component = fixture.componentInstance;
    form = new FormGroup({
      generalFindingsForm: new FormGroup({ a: new FormControl() }),
      generalDiagnosisForm: new FormGroup({ b: new FormControl() }),
      generalDoctorInvestigationForm: new FormGroup({ c: new FormControl() }),
      drugPrescriptionForm: new FormGroup({ d: new FormControl() }),
      treatmentsOnSideEffectsForm: new FormGroup({ e: new FormControl() }),
    });
    component.generalCaseRecordForm = form;
    fixture.detectChanges();
  });

  it('should create and set language', () => {
    expect(component).toBeTruthy();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  it('extracts sub forms from the case record form on ngDoCheck', () => {
    component.ngDoCheck();
    expect(component.generalFindingsForm).toBe(
      form.get('generalFindingsForm') as FormGroup,
    );
    expect(component.generalDiagnosisForm).toBe(
      form.get('generalDiagnosisForm') as FormGroup,
    );
    expect(component.generalDoctorInvestigationForm).toBe(
      form.get('generalDoctorInvestigationForm') as FormGroup,
    );
    expect(component.drugPrescriptionForm).toBe(
      form.get('drugPrescriptionForm') as FormGroup,
    );
    expect(component.treatmentsOnSideEffectsFormData).toBe(
      form.get('treatmentsOnSideEffectsForm') as FormGroup,
    );
  });
});
