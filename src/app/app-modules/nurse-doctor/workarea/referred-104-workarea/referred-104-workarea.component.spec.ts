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
import { Referred104WorkareaComponent } from './referred-104-workarea.component';
import {
  COMMON_TEST_IMPORTS,
  commonTestProviders,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
} from 'src/testing/test-utils';

describe('Referred104WorkareaComponent', () => {
  let component: Referred104WorkareaComponent;
  let fixture: ComponentFixture<Referred104WorkareaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [Referred104WorkareaComponent],
      providers: [...commonTestProviders()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(Referred104WorkareaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and assign the language set on init', () => {
    expect(component).toBeTruthy();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });

  it('ngDoCheck re-assigns the language set', () => {
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });

  describe('sideNavModeChange', () => {
    const makeNav = () => ({ mode: '', toggle: jasmine.createSpy('toggle') });

    it('uses "over" mode on narrow screens', () => {
      spyOnProperty(window.screen, 'width', 'get').and.returnValue(500);
      const nav = makeNav();
      component.sideNavModeChange(nav);
      expect(nav.mode).toBe('over');
      expect(nav.toggle).toHaveBeenCalled();
    });

    it('uses "side" mode on wide screens', () => {
      spyOnProperty(window.screen, 'width', 'get').and.returnValue(1200);
      const nav = makeNav();
      component.sideNavModeChange(nav);
      expect(nav.mode).toBe('side');
      expect(nav.toggle).toHaveBeenCalled();
    });
  });
});
