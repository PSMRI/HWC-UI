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

import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  flushMicrotasks,
} from '@angular/core/testing';
import { Router } from '@angular/router';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { RedirFallbackComponent } from './redir-fallback.component';

describe('RedirFallbackComponent', () => {
  let component: RedirFallbackComponent;
  let fixture: ComponentFixture<RedirFallbackComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [RedirFallbackComponent],
      providers: [...commonTestProviders()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(RedirFallbackComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  it('alerts inventory issue and redirects to worklist after view init', fakeAsync(() => {
    fixture.detectChanges();
    flushMicrotasks();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
    expect(
      (TestBed.inject(ConfirmationService) as any).alert,
    ).toHaveBeenCalledWith(
      LANGUAGE_EN.alerts.info.IssuesinConnectingtoInventory,
      'error',
    );
    expect(router.navigate).toHaveBeenCalledWith([
      '/pharmacist/pharmacist-worklist',
    ]);
  }));

  it('ngDoCheck re-assigns language', () => {
    component.current_language_set = undefined;
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });
});
