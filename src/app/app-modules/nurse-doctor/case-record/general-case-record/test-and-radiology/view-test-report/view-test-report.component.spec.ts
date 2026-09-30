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

import { ViewTestReportComponent } from './view-test-report.component';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('ViewTestReportComponent', () => {
  let component: ViewTestReportComponent;
  let fixture: ComponentFixture<ViewTestReportComponent>;
  const report = [{ procedureName: 'CBC', componentList: [] }];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [ViewTestReportComponent],
      providers: [...commonTestProviders({ dialogData: report })],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(ViewTestReportComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(ViewTestReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and expose dialog data as test report', () => {
    expect(component).toBeTruthy();
    expect(component.testReport).toBe(report);
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });

  it('refreshes language on ngDoCheck', () => {
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });
});
