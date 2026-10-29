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
import { SpinnerComponent } from './spinner.component';
import { SpinnerService } from '../../services/spinner.service';
import { NO_ERRORS_SCHEMA } from 'src/testing/test-utils';

describe('SpinnerComponent', () => {
  let fixture: ComponentFixture<SpinnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SpinnerComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(SpinnerComponent);
    fixture.detectChanges();
  });

  it('exposes the spinner service', () => {
    expect(fixture.componentInstance.spinnerService).toBe(
      TestBed.inject(SpinnerService),
    );
  });

  it('re-renders when loading changes', () => {
    TestBed.inject(SpinnerService).setLoading(true);
    fixture.detectChanges();
    expect(fixture.componentInstance.spinnerService.getLoading()).toBeTrue();
  });
});
