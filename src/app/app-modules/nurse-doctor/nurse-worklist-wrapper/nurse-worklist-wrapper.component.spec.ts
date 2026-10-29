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
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';
import { NurseService } from '../shared/services';
import { NurseWorklistWrapperComponent } from './nurse-worklist-wrapper.component';

describe('NurseWorklistWrapperComponent', () => {
  let component: NurseWorklistWrapperComponent;
  let fixture: ComponentFixture<NurseWorklistWrapperComponent>;
  let nurse: any;

  beforeEach(async () => {
    nurse = autoSpy(NurseService);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [NurseWorklistWrapperComponent],
      providers: [
        ...commonTestProviders(),
        { provide: NurseService, useValue: nurse },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(NurseWorklistWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('ngOnInit sets language and resets MMU TC flag', () => {
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(nurse.setIsMMUTC).toHaveBeenCalledWith('no');
  });

  it('tabChanged sets MMU TC to yes on tab 3', () => {
    component.tabChanged({ index: 3 } as any);
    expect(nurse.setIsMMUTC).toHaveBeenCalledWith('yes');
  });

  it('tabChanged sets MMU TC to no on other tabs', () => {
    nurse.setIsMMUTC.calls.reset();
    component.tabChanged({ index: 1 } as any);
    expect(nurse.setIsMMUTC).toHaveBeenCalledOnceWith('no');
  });

  it('ngDoCheck re-assigns language', () => {
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });
});
