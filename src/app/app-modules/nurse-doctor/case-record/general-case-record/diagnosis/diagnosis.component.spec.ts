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
import { AmritTrackingService } from 'Common-UI/src/tracking';

import { DiagnosisComponent } from './diagnosis.component';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('DiagnosisComponent', () => {
  let component: DiagnosisComponent;
  let fixture: ComponentFixture<DiagnosisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [DiagnosisComponent],
      providers: [...commonTestProviders()],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(DiagnosisComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(DiagnosisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and set language', () => {
    expect(component).toBeTruthy();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  it('refreshes language on ngDoCheck', () => {
    component.current_language_set = undefined;
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  it('tracks field interaction under Diagnosis', () => {
    const tracking = TestBed.inject(AmritTrackingService) as any;
    component.trackFieldInteraction('Provisional Diagnosis');
    expect(tracking.trackFieldInteraction).toHaveBeenCalledWith(
      'Provisional Diagnosis',
      'Diagnosis',
    );
  });
});
