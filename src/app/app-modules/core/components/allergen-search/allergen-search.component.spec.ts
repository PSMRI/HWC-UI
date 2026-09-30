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
import { AllergenSearchComponent } from './allergen-search.component';
import { MasterdataService } from 'src/app/app-modules/nurse-doctor/shared/services';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

describe('AllergenSearchComponent', () => {
  let fixture: ComponentFixture<AllergenSearchComponent>;
  let component: AllergenSearchComponent;
  let master: any;
  let dialogRef: any;
  const results = () => [
    { conceptID: 'A1', term: 'Peanut' },
    { conceptID: 'A2', term: 'Dust' },
  ];

  beforeEach(async () => {
    master = autoSpy(MasterdataService);
    master.searchDiagnosisBasedOnPageNo1.and.callFake(() =>
      of({ statusCode: 200, data: { sctMaster: results(), pageCount: 3 } }),
    );
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [AllergenSearchComponent],
      providers: [
        ...commonTestProviders({ dialogData: { searchTerm: 'pea' } }),
        { provide: MasterdataService, useValue: master },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(AllergenSearchComponent);
    component = fixture.componentInstance;
    dialogRef = TestBed.inject(MatDialogRef);
  });

  it('loads language and searches on init, numbering results', () => {
    fixture.detectChanges();
    expect(component.currentLanguageSet).toBe(LANGUAGE_EN);
    expect(master.searchDiagnosisBasedOnPageNo1).toHaveBeenCalledWith('pea', 0);
    expect(component.dataSource.data.map((d: any) => d.ConceptID)).toEqual([
      1, 2,
    ]);
    expect(component.pageCount).toBe(3);
    expect(component.pager.pages).toEqual([0, 1, 2]);
    expect(component.showProgressBar).toBeFalse();
  });

  it('ignores short search terms', () => {
    component.search('pe', 0);
    expect(master.searchDiagnosisBasedOnPageNo1).not.toHaveBeenCalled();
  });

  it('keeps the page count for later pages', () => {
    component.pageCount = 8;
    component.search('peanut', 3);
    expect(component.pageCount).toBe(8);
    expect(component.pager.currentPage).toBe(3);
  });

  it('shows no-record message for empty results', () => {
    component.assignSelectedLanguage();
    master.searchDiagnosisBasedOnPageNo1.and.returnValue(
      of({ statusCode: 200, data: { sctMaster: [] } }),
    );
    component.search('peanut', 0);
    expect(component.message).toBe(LANGUAGE_EN.common.noRecordFound);
  });

  it('resets data on non-200 and error', () => {
    component.pageCount = 3;
    master.searchDiagnosisBasedOnPageNo1.and.returnValue(
      of({ statusCode: 500 }),
    );
    component.search('peanut', 0);
    expect(component.pageCount).toBeNull();
    expect(component.components).toEqual([]);
    component.pageCount = 3;
    master.searchDiagnosisBasedOnPageNo1.and.returnValue(throwingObs());
    component.search('peanut', 0);
    expect(component.pageCount).toBeNull();
    expect(component.showProgressBar).toBeFalse();
  });

  it('ngDoCheck refreshes the language', () => {
    component.ngDoCheck();
    expect(component.currentLanguageSet).toBe(LANGUAGE_EN);
  });

  it('selects a component and submits it', () => {
    component.selectComponentName(2, { term: 'Dust' });
    expect(component.selectedComponentNo).toBe(2);
    expect(component.selectedItem).toEqual({ term: 'Dust' });
    component.submitComponentList();
    expect(dialogRef.close).toHaveBeenCalledWith({
      componentNo: 2,
      component: { term: 'Dust' },
    });
  });

  it('checkPager / setPage navigate within range only', () => {
    component.pageCount = 3;
    spyOn(component, 'search');
    component.checkPager({ currentPage: 2 }, 0);
    expect(component.search).toHaveBeenCalledWith('pea', 0);
    component.checkPager({ currentPage: 0 }, 2);
    expect(component.search).toHaveBeenCalledWith('pea', 2);
    (component.search as jasmine.Spy).calls.reset();
    component.checkPager({ currentPage: 0 }, 0);
    component.checkPager({ currentPage: 2 }, 1);
    component.setPage(5);
    expect(component.search).not.toHaveBeenCalled();
  });

  it('getPager windows pages', () => {
    component.pageCount = 10;
    expect(component.getPager(0).pages).toEqual([0, 1, 2, 3, 4]);
    expect(component.getPager(5).pages).toEqual([3, 4, 5, 6, 7]);
    expect(component.getPager(8).pages).toEqual([5, 6, 7, 8, 9]);
    expect(component.getPager(12).currentPage).toBe(9);
  });
});
