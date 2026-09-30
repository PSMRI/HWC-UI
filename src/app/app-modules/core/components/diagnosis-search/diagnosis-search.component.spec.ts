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
import { of } from 'rxjs';
import { DiagnosisSearchComponent } from './diagnosis-search.component';
import { MasterdataService } from 'src/app/app-modules/nurse-doctor/shared/services';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

describe('DiagnosisSearchComponent', () => {
  let fixture: ComponentFixture<DiagnosisSearchComponent>;
  let component: DiagnosisSearchComponent;
  let master: any;
  let dialogRef: any;
  const results = [
    { conceptID: 'C1', term: 'Fever' },
    { conceptID: 'C2', term: 'Cough' },
  ];

  beforeEach(async () => {
    master = autoSpy(MasterdataService);
    master.searchDiagnosisBasedOnPageNo.and.returnValue(
      of({ statusCode: 200, data: { sctMaster: results, pageCount: 4 } }),
    );
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [DiagnosisSearchComponent],
      providers: [
        ...commonTestProviders({
          dialogData: {
            searchTerm: 'fev',
            addedDiagnosis: [{ conceptID: 'C9' }],
            diagonasisType: 'Provisional Diagnosis',
          },
        }),
        { provide: MasterdataService, useValue: master },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(DiagnosisSearchComponent);
    component = fixture.componentInstance;
    dialogRef = TestBed.inject(MatDialogRef);
  });

  it('searches with the input term and sets the placeholder on init', async () => {
    await component.ngOnInit();
    expect(component.currentLanguageSet).toBe(LANGUAGE_EN);
    expect(master.searchDiagnosisBasedOnPageNo).toHaveBeenCalledWith('fev', 0);
    expect(component.diagnosis.data).toEqual(results);
    expect(component.pageCount).toBe(4);
    expect(component.placeHolderSearch).toBe('Provisional Diagnosis');
    expect(component.showProgressBar).toBeFalse();
  });

  it('handles a missing diagnosis type on init', async () => {
    component.input = { ...component.input, diagonasisType: undefined };
    await component.ngOnInit();
    expect(component.placeHolderSearch).toBeUndefined();
  });

  it('renders the template', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
    component.ngOnChanges();
  });

  it('does not search terms with 2 or fewer characters', () => {
    component.search('ab', 0);
    expect(master.searchDiagnosisBasedOnPageNo).not.toHaveBeenCalled();
  });

  it('keeps the page count for later pages and ignores empty results', () => {
    component.pageCount = 9;
    component.search('fever', 2);
    expect(component.pageCount).toBe(9);
    master.searchDiagnosisBasedOnPageNo.and.returnValue(
      of({ statusCode: 200, data: { sctMaster: [] } }),
    );
    component.search('fever', 0);
    expect(component.diagnosis.data).toEqual(results);
    expect(component.showProgressBar).toBeFalse();
  });

  it('resets data on non-200 and error', () => {
    component.diagnosis.data = results;
    master.searchDiagnosisBasedOnPageNo.and.returnValue(
      of({ statusCode: 500 }),
    );
    component.search('fever', 0);
    expect(component.diagnosis.data).toEqual([]);
    component.diagnosis.data = results;
    master.searchDiagnosisBasedOnPageNo.and.returnValue(throwingObs());
    component.search('fever', 0);
    expect(component.diagnosis.data).toEqual([]);
    expect(component.showProgressBar).toBeFalse();
  });

  it('ngDoCheck refreshes the language', () => {
    component.ngDoCheck();
    expect(component.currentLanguageSet).toBe(LANGUAGE_EN);
  });

  it('adds and removes selections', () => {
    const item: any = { ...results[0] };
    component.selectDiagnosis({ checked: true }, item);
    expect(item.selected).toBeTrue();
    expect(component.selectedDiagnosisList).toEqual([item]);
    component.selectDiagnosis({ checked: false }, item);
    expect(item.selected).toBeFalse();
    expect(component.selectedDiagnosisList).toEqual([]);
  });

  it('submits the selected list', () => {
    component.selectedDiagnosisList = [results[0]];
    component.submitDiagnosisList();
    expect(dialogRef.close).toHaveBeenCalledWith([results[0]]);
  });

  it('selectedDiagnosis checks previously added and current selections', () => {
    expect(component.selectedDiagnosis({ conceptID: 'C9' })).toBeTrue();
    expect(component.selectedDiagnosis({ conceptID: 'C1' })).toBeFalse();
    component.selectedDiagnosisList = [{ conceptID: 'C1' }];
    expect(component.selectedDiagnosis({ conceptID: 'C1' })).toBeTrue();
  });

  it('checkSelectedDiagnosis considers added list only when it has more than one entry', () => {
    // one added entry: only the current selection counts
    expect(component.checkSelectedDiagnosis({ conceptID: 'C9' })).toBeFalse();
    component.input.addedDiagnosis = [{ conceptID: 'C9' }, { conceptID: 'C8' }];
    expect(component.checkSelectedDiagnosis({ conceptID: 'C9' })).toBeTrue();
    expect(component.checkSelectedDiagnosis({ conceptID: 'C1' })).toBeFalse();
    component.selectedDiagnosisList = [{ conceptID: 'C1' }];
    expect(component.checkSelectedDiagnosis({ conceptID: 'C1' })).toBeTrue();
    expect(component.checkSelectedDiagnosis({ conceptID: 'C2' })).toBeFalse();
  });

  it('disableSelection disables added items and items beyond the 30 limit', () => {
    component.input.addedDiagnosis = [{ conceptID: 'C9' }];
    expect(component.disableSelection({ conceptID: 'C9' })).toBeTrue();
    expect(component.disableSelection({ conceptID: 'C1' })).toBeFalse();
    component.selectedDiagnosisList = Array.from({ length: 30 }, (_, i) => ({
      conceptID: 'X' + i,
    }));
    expect(component.disableSelection({ conceptID: 'X1' })).toBeFalse();
    expect(component.disableSelection({ conceptID: 'NEW' })).toBeTrue();
  });

  it('enableCurrentSelection respects the current selection and the limit', () => {
    component.input.addedDiagnosis = [{ conceptID: 'C9' }];
    expect(component.enableCurrentSelection({ conceptID: 'C1' })).toBeFalse();
    component.selectedDiagnosisList = [{ conceptID: 'C1' }];
    expect(component.enableCurrentSelection({ conceptID: 'C1' })).toBeFalse();
    expect(component.enableCurrentSelection({ conceptID: 'C2' })).toBeFalse();
    component.selectedDiagnosisList = Array.from({ length: 30 }, (_, i) => ({
      conceptID: 'X' + i,
    }));
    expect(component.enableCurrentSelection({ conceptID: 'NEW' })).toBeTrue();
    expect(component.checkSelectionLimit()).toBeTrue();
  });
});
