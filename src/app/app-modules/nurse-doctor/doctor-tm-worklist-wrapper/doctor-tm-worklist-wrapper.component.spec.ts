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
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { DoctorTmWorklistWrapperComponent } from './doctor-tm-worklist-wrapper.component';

describe('DoctorTmWorklistWrapperComponent', () => {
  let component: DoctorTmWorklistWrapperComponent;
  let fixture: ComponentFixture<DoctorTmWorklistWrapperComponent>;
  let confirm: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [DoctorTmWorklistWrapperComponent],
      providers: [...commonTestProviders()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DoctorTmWorklistWrapperComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
  });

  it('renders and assigns language and teleconsultation flag on init', () => {
    confirm.eSanjeevaniDoctorFlagArry = 'Swymed';
    fixture.detectChanges();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
    expect(component.teleConsultationFlag).toBe('Swymed');
  });

  it('ngDoCheck refreshes the language set', () => {
    component.current_language_set = undefined;
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });
});
