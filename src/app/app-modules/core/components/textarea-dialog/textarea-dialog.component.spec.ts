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
import { Subject } from 'rxjs';
import { TextareaDialogComponent } from './textarea-dialog.component';
import {
  COMMON_TEST_IMPORTS,
  commonTestProviders,
  NO_ERRORS_SCHEMA,
} from 'src/testing/test-utils';

describe('TextareaDialogComponent', () => {
  let fixture: ComponentFixture<TextareaDialogComponent>;
  let ref: any;
  const backdrop = new Subject<any>();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [TextareaDialogComponent],
      providers: [
        ...commonTestProviders({
          dialogData: { observations: 'obs', length: 50 },
        }),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    ref = TestBed.inject(MatDialogRef);
    ref.backdropClick.and.returnValue(backdrop.asObservable());
    fixture = TestBed.createComponent(TextareaDialogComponent);
    fixture.detectChanges();
  });

  it('receives dialog data', () => {
    expect(fixture.componentInstance.data.observations).toBe('obs');
  });

  it('closes with current observations on backdrop click', () => {
    fixture.componentInstance.data.observations = 'changed';
    backdrop.next({});
    expect(ref.close).toHaveBeenCalledWith('changed');
  });
});
