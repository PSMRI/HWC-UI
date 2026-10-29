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

import { BeneficiaryMctsCallHistoryComponent } from './beneficiary-mcts-call-history.component';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('BeneficiaryMctsCallHistoryComponent', () => {
  let component: BeneficiaryMctsCallHistoryComponent;
  let fixture: ComponentFixture<BeneficiaryMctsCallHistoryComponent>;
  const calls = Array.from({ length: 7 }, (_, i) => ({
    questionnaireDetail: { question: i % 2 ? `Fever ${i}` : `Cough ${i}` },
    answer: 'yes',
  }));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [BeneficiaryMctsCallHistoryComponent],
      providers: [...commonTestProviders({ dialogData: calls })],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(BeneficiaryMctsCallHistoryComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(BeneficiaryMctsCallHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load call details with first page', () => {
    expect(component).toBeTruthy();
    expect(component.callDetails).toBe(calls);
    expect(component.filteredCallDetails).toBe(calls);
    expect(component.callDetailsPagedList.length).toBe(5);
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  it('pages call details', () => {
    component.callDetailsPageChanged({ page: 2, itemsPerPage: 5 });
    expect(component.callDetailsPagedList).toEqual(calls.slice(5, 10));
  });

  it('filters by question (case insensitive) and resets page', () => {
    component.callDetailsActivePage = 2;
    component.filterCallHistory('FEVER');
    expect(component.filteredCallDetails.length).toBe(3);
    expect(component.callDetailsActivePage).toBe(1);
    expect(component.callDetailsPagedList.length).toBe(3);
  });

  it('restores full list on empty search term', () => {
    component.filterCallHistory('fever');
    component.filterCallHistory('');
    expect(component.filteredCallDetails).toBe(calls);
    expect(component.callDetailsPagedList.length).toBe(5);
  });

  it('refreshes language on ngDoCheck', () => {
    component.current_language_set = null;
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });
});
