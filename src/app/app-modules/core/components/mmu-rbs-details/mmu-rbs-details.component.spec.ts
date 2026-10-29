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
import { MatDialogRef } from '@angular/material/dialog';
import { MmuRbsDetailsComponent } from './mmu-rbs-details.component';
import {
  COMMON_TEST_IMPORTS,
  commonTestProviders,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
} from 'src/testing/test-utils';

describe('MmuRbsDetailsComponent', () => {
  let fixture: ComponentFixture<MmuRbsDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [MmuRbsDetailsComponent],
      providers: [...commonTestProviders({ dialogData: [{ rbs: 1 }] })],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(MmuRbsDetailsComponent);
    fixture.detectChanges();
  });

  it('subscribes to language set', () => {
    expect(fixture.componentInstance.current_language_set).toBe(LANGUAGE_EN);
  });

  it('closeDialog closes the ref', () => {
    fixture.componentInstance.closeDialog();
    expect(TestBed.inject(MatDialogRef).close).toHaveBeenCalled();
  });
});
