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
import { PreviousImmunizationServiceDetailsComponent } from './previous-immunization-service-details.component';
import {
  COMMON_TEST_IMPORTS,
  commonTestProviders,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
} from 'src/testing/test-utils';

describe('PreviousImmunizationServiceDetailsComponent', () => {
  let fixture: ComponentFixture<PreviousImmunizationServiceDetailsComponent>;
  let component: PreviousImmunizationServiceDetailsComponent;
  const dataList = [
    { vaccineName: 'BCG', route: 'IM' },
    { vaccineName: 'OPV', route: 'Oral' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [PreviousImmunizationServiceDetailsComponent],
      providers: [...commonTestProviders({ dialogData: { dataList } })],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    spyOn(console, 'log');
    fixture = TestBed.createComponent(
      PreviousImmunizationServiceDetailsComponent,
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads data and language', () => {
    expect(component.currentLanguageSet).toBe(LANGUAGE_EN);
    expect(component.filteredDataList).toEqual(dataList as any);
    expect(component.filteredDataList).not.toBe(component.dataList);
  });

  it('filters by any field case-insensitively', () => {
    component.filterPreviousData('oral');
    expect(component.filteredDataList).toEqual([dataList[1]] as any);
  });

  it('empty search resets list', () => {
    component.filterPreviousData('zzz');
    expect(component.filteredDataList).toEqual([]);
    component.filterPreviousData('');
    expect(component.filteredDataList).toBe(component.dataList);
  });

  it('closeDialog closes', () => {
    component.closeDialog();
    expect(TestBed.inject(MatDialogRef).close).toHaveBeenCalled();
  });
});
