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
import { of } from 'rxjs';
import { AmritTrackingService } from 'Common-UI/src/tracking';

import { PreviousSignificiantFindingsComponent } from './previous-significiant-findings.component';
import { DoctorService } from '../../../shared/services';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('PreviousSignificiantFindingsComponent', () => {
  let component: PreviousSignificiantFindingsComponent;
  let fixture: ComponentFixture<PreviousSignificiantFindingsComponent>;
  let doctorService: any;
  const findings = () => [
    { significantfindings: 'High BP', captureddate: '2020-01-01' },
    { significantfindings: 'Low Sugar', captureddate: '2021-02-02' },
    { significantfindings: 'Anemia', captureddate: '2022-03-03' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [PreviousSignificiantFindingsComponent],
      providers: [
        ...commonTestProviders({ session: { beneficiaryRegID: 'B9' } }),
        { provide: DoctorService, useValue: autoSpy(DoctorService) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(PreviousSignificiantFindingsComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(PreviousSignificiantFindingsComponent);
    component = fixture.componentInstance;
    doctorService = TestBed.inject(DoctorService) as any;
    doctorService.getPreviousSignificiantFindings.and.returnValue(
      of({ statusCode: 200, data: { findings: findings() } }),
    );
  });

  it('loads findings on init and numbers them', () => {
    fixture.detectChanges();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
    expect(doctorService.getPreviousSignificiantFindings).toHaveBeenCalledWith({
      beneficiaryRegID: 'B9',
    });
    expect(component.previousSignificiantFindingsList.length).toBe(3);
    expect(component.dataSource.data.map((d: any) => d.sno)).toEqual([1, 2, 3]);
  });

  [
    { statusCode: 5000 },
    { statusCode: 200, data: null },
    { statusCode: 200, data: {} },
  ].forEach((resp) => {
    it(`keeps list empty for ${JSON.stringify(resp)}`, () => {
      doctorService.getPreviousSignificiantFindings.and.returnValue(of(resp));
      fixture.detectChanges();
      expect(component.previousSignificiantFindingsList).toEqual([]);
      expect(component.dataSource.data).toEqual([]);
    });
  });

  it('filters by any field and restores on empty term', () => {
    fixture.detectChanges();
    component.filterPreviousSignificiantFindingsList('sugar');
    expect(component.filteredPreviousSignificiantFindingsList.length).toBe(1);
    expect(component.dataSource.data.length).toBe(1);
    component.filterPreviousSignificiantFindingsList('2022');
    expect(
      component.filteredPreviousSignificiantFindingsList[0].significantfindings,
    ).toBe('Anemia');
    component.filterPreviousSignificiantFindingsList();
    expect(component.filteredPreviousSignificiantFindingsList.length).toBe(3);
    expect(component.dataSource.data.length).toBe(3);
  });

  it('pages the filtered list', () => {
    fixture.detectChanges();
    component.pageChanged({ page: 2, itemsPerPage: 2 });
    expect(component.pagedList.length).toBe(1);
    expect(component.pagedList[0].significantfindings).toBe('Anemia');
  });

  it('refreshes language on ngDoCheck', () => {
    fixture.detectChanges();
    component.current_language_set = null;
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  it('unsubscribes on destroy', () => {
    fixture.detectChanges();
    const sub = component.previousSignificantFindingsSubs;
    component.ngOnDestroy();
    expect(sub.closed).toBeTrue();
    component.previousSignificantFindingsSubs = null;
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('tracks field interaction', () => {
    const tracking = TestBed.inject(AmritTrackingService) as any;
    component.trackFieldInteraction('Search');
    expect(tracking.trackFieldInteraction).toHaveBeenCalledWith(
      'Search',
      'Previous Significant Findings',
    );
  });
});
