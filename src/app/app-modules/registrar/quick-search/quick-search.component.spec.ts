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

import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';
import { environment } from 'src/environments/environment';
import { QuickSearchComponent } from './quick-search.component';

describe('Registrar QuickSearchComponent', () => {
  let component: QuickSearchComponent;
  let fixture: ComponentFixture<QuickSearchComponent>;
  let dialogRef: any;

  const empty = {
    amritId: null,
    beneficiaryID: null,
    beneficiaryRegID: null,
    externalId: null,
    healthId: null,
    healthIdNumber: null,
    phoneNo: null,
    state: null,
    district: null,
    village: null,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MatSelectModule, MatInputModule],
      declarations: [QuickSearchComponent],
      providers: [...commonTestProviders()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(QuickSearchComponent);
    component = fixture.componentInstance;
    dialogRef = TestBed.inject(MatDialogRef);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('defaults to National Health ID validation', () => {
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.searchIdForm.value).toEqual({
      searchId: 'National Health ID',
      ID: null,
    });
    expect(component.idMinValue).toBe('4');
    expect(component.idMaxValue).toBe('32');
    expect(component.idErrorText).toBe('Enter Valid Health ID');
    expect(component.abhaSuffix).toBe(environment.abhaExtension);
  });

  const cases: [string, any][] = [
    ['National Health ID', { healthId: 'asha' + environment.abhaExtension }],
    ['AMRIT ID', { amritId: 'asha' }],
    ['Higher Health Facility ID', { externalId: 'asha' }],
    ['Health ID Number', { healthIdNumber: 'asha' }],
    ['Phone Number', { phoneNo: 'asha', pageNo: 0 }],
    ['State', { state: 'asha' }],
    ['District', { district: 'asha' }],
    ['Village', { village: 'asha' }],
  ];
  cases.forEach(([type, expected]) => {
    it(`closes with the ${type} search payload`, () => {
      component.getQuickSearchResult({ searchId: type, ID: 'asha' });
      expect(dialogRef.close).toHaveBeenCalledWith({ ...empty, ...expected });
    });
  });

  it('closes with an empty object for an unknown type', () => {
    component.getQuickSearchResult({ searchId: 'X', ID: '1' });
    expect(dialogRef.close).toHaveBeenCalledWith({});
  });

  const rules: [string, string, string, string, string][] = [
    [
      'Higher Health Facility ID',
      '4',
      '17',
      'Enter Valid Higher Health Facility ID',
      'Enter ID',
    ],
    ['AMRIT ID', '8', '12', 'Enter Valid Amrit ID', 'Enter AMRIT ID'],
    [
      'Health ID Number',
      '10',
      '17',
      'Enter Valid Health ID Number',
      'Enter Health ID Number',
    ],
    ['Phone Number', '10', '12', 'Enter Valid Phone Number', 'Enter phone no'],
    ['State', '1', '120', 'Enter Valid State', 'Enter state'],
    ['District', '1', '120', 'Enter Valid District', 'Enter district'],
    ['Village', '1', '120', 'Enter Valid Village', 'Enter village'],
  ];
  rules.forEach(([type, min, max, err, placeholder]) => {
    it(`validateID sets rules for ${type} and clears the ID`, () => {
      component.searchIdForm.patchValue({ ID: 'old' });
      component.validateID(type);
      expect(component.searchIdForm.value.ID).toBeNull();
      expect(component.idMinValue).toBe(min);
      expect(component.idMaxValue).toBe(max);
      expect(component.idErrorText).toBe(err);
      expect(component.searchValue).toBe(placeholder);
    });
  });

  it('patterns accept and reject as expected', () => {
    component.validateIDNumber('AMRIT ID');
    expect(component.patternID.test('1234')).toBeTrue();
    expect(component.patternID.test('12a')).toBeFalse();
    component.validateIDNumber('Health ID Number');
    expect(component.patternID.test('12-34')).toBeTrue();
    component.validateIDNumber('State');
    expect(component.patternID.test('Kerala')).toBeTrue();
    expect(component.patternID.test('K1')).toBeFalse();
  });

  it('ngDoCheck re-assigns language', () => {
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });
});
