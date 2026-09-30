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
import { OpenPreviousVisitDetailsComponent } from './open-previous-visit-details.component';
import { DoctorService } from 'src/app/app-modules/nurse-doctor/shared/services';
import { ConfirmationService } from '../../services/confirmation.service';
import {
  COMMON_TEST_IMPORTS,
  commonTestProviders,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  throwingObs,
} from 'src/testing/test-utils';

describe('OpenPreviousVisitDetailsComponent', () => {
  let fixture: ComponentFixture<OpenPreviousVisitDetailsComponent>;
  let component: OpenPreviousVisitDetailsComponent;
  let doctor: any;
  let confirmation: any;

  const visits = [
    {
      VisitCategory: 'ANC',
      benFlowID: 1,
      beneficiaryRegID: 2,
      visitCode: 3,
    },
    { VisitCategory: 'General OPD', benFlowID: 4, beneficiaryRegID: 5 },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [OpenPreviousVisitDetailsComponent],
      providers: [
        ...commonTestProviders(),
        { provide: DoctorService, useValue: autoSpy(DoctorService) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    spyOn(console, 'log');
    doctor = TestBed.inject(DoctorService);
    confirmation = TestBed.inject(ConfirmationService);
    fixture = TestBed.createComponent(OpenPreviousVisitDetailsComponent);
    component = fixture.componentInstance;
  });

  it('loads history and casesheet data for visits with visitCode', () => {
    doctor.getTMHistory.and.returnValue(
      of({ statusCode: 200, data: JSON.parse(JSON.stringify(visits)) }),
    );
    doctor.getTMCasesheetData.and.returnValue(
      of({ statusCode: 200, data: { cs: 1 } }),
    );
    fixture.detectChanges();
    expect(component.currentLanguageSet).toBe(LANGUAGE_EN);
    expect(doctor.getTMCasesheetData).toHaveBeenCalledTimes(1);
    expect(doctor.getTMCasesheetData).toHaveBeenCalledWith({
      VisitCategory: 'ANC',
      benFlowID: 1,
      beneficiaryRegID: 2,
      visitCode: 3,
    });
    expect(component.previousVisitData[0].benPreviousData).toEqual({ cs: 1 });
    expect(component.filteredHistory).toEqual({ cs: 1 });
    expect(component.previousHistoryPagedList.length).toBe(2);
  });

  it('ignores casesheet with null data', () => {
    doctor.getTMHistory.and.returnValue(
      of({ statusCode: 200, data: JSON.parse(JSON.stringify(visits)) }),
    );
    doctor.getTMCasesheetData.and.returnValue(
      of({ statusCode: 200, data: null }),
    );
    fixture.detectChanges();
    expect(component.previousVisitData[0].benPreviousData).toBeUndefined();
  });

  it('alerts on non-200 history', () => {
    doctor.getTMHistory.and.returnValue(of({ statusCode: 5000 }));
    fixture.detectChanges();
    expect(confirmation.alert).toHaveBeenCalledWith(
      LANGUAGE_EN.unableToLoadData,
      'error',
    );
  });

  it('alerts on history error', () => {
    doctor.getTMHistory.and.returnValue(throwingObs());
    fixture.detectChanges();
    expect(confirmation.alert).toHaveBeenCalledWith(
      LANGUAGE_EN.unableToLoadData,
      'error',
    );
  });

  it('filterHistory filters by VisitCategory', () => {
    doctor.getTMHistory.and.returnValue(of({ statusCode: 5000 }));
    fixture.detectChanges();
    component.previousVisitData = visits;
    component.filterHistory('anc');
    expect(component.filteredHistory).toEqual([visits[0]]);
    expect(component.previousHistoryActivePage).toBe(1);
    component.filterHistory();
    expect(component.filteredHistory).toBe(visits);
  });
});
