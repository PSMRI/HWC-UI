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
import { MatTabChangeEvent } from '@angular/material/tabs';

import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';
import { TcSpecialistWorklistWrapperComponent } from './tc-specialist-worklist-wrapper.component';

describe('TcSpecialistWorklistWrapperComponent', () => {
  let component: TcSpecialistWorklistWrapperComponent;
  let fixture: ComponentFixture<TcSpecialistWorklistWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [TcSpecialistWorklistWrapperComponent],
      providers: [...commonTestProviders()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TcSpecialistWorklistWrapperComponent);
    component = fixture.componentInstance;
  });

  it('renders and assigns the language set on init', () => {
    fixture.detectChanges();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });

  it('ngDoCheck refreshes the language set', () => {
    component.currentLanguageSet = undefined;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });

  it('tab 0 selects the current worklist', () => {
    component.tabChanged({ index: 0 } as MatTabChangeEvent);
    expect(component.getChangedTab).toBe('current');
  });

  it('any other tab selects the future worklist', () => {
    component.tabChanged({ index: 1 } as MatTabChangeEvent);
    expect(component.getChangedTab).toBe('future');
  });
});
