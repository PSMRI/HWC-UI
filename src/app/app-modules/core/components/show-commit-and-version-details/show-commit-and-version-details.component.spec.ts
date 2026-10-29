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
import { ShowCommitAndVersionDetailsComponent } from './show-commit-and-version-details.component';
import {
  COMMON_TEST_IMPORTS,
  commonTestProviders,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
} from 'src/testing/test-utils';

describe('ShowCommitAndVersionDetailsComponent', () => {
  let fixture: ComponentFixture<ShowCommitAndVersionDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [ShowCommitAndVersionDetailsComponent],
      providers: [
        ...commonTestProviders({
          dialogData: {
            commitDetailsAPI: { version: '1' },
            commitDetailsUI: { version: '2' },
          },
        }),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(ShowCommitAndVersionDetailsComponent);
    spyOn(console, 'log');
    fixture.detectChanges();
  });

  it('assigns language and logs input on init', () => {
    const c = fixture.componentInstance;
    expect(c.currentLanguageSet).toBe(LANGUAGE_EN);
    expect(console.log).toHaveBeenCalledWith('input', c.input);
    expect(c.displayedColumns).toEqual(['action', 'api', 'ui']);
  });
});
