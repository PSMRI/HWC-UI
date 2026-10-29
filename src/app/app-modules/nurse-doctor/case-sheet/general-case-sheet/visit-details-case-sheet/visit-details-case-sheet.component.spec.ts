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
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { NurseService } from '../../../shared/services/nurse.service';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';
import { VisitDeatilsCaseSheetComponent } from './visit-details-case-sheet.component';

describe('VisitDeatilsCaseSheetComponent', () => {
  let component: VisitDeatilsCaseSheetComponent;
  let http: any;
  let nurse: any;

  function setup(session: Record<string, any> = {}) {
    TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [VisitDeatilsCaseSheetComponent],
      providers: [
        ...commonTestProviders({ session }),
        { provide: NurseService, useValue: autoSpy(NurseService) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    const fixture = TestBed.createComponent(VisitDeatilsCaseSheetComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpServiceService);
    nurse = TestBed.inject(NurseService);
    return fixture;
  }

  it('maps FP visit data with other method and side effects, renders', () => {
    const fixture = setup();
    component.caseSheetData = {
      nurseData: {
        fpNurseVisitData: {
          otherFollowUpForFpMethod: 'x',
          otherSideEffects: 'y',
        },
      },
    };
    component.ngOnChanges();
    fixture.detectChanges();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.enableOtherFollowFpMethod).toBeTrue();
    expect(component.enableOtherSideEffect).toBeTrue();
    expect(nurse.getPreviousVisitConfirmedDiseases).not.toHaveBeenCalled();
  });

  it('flags off when optional FP fields missing', () => {
    setup();
    component.enableOtherFollowFpMethod = true;
    component.enableOtherSideEffect = true;
    component.caseSheetData = { nurseData: { fpNurseVisitData: {} } };
    component.ngOnChanges();
    expect(component.enableOtherFollowFpMethod).toBeFalse();
    expect(component.enableOtherSideEffect).toBeFalse();
  });

  it('loads confirmed diseases for NCD care', () => {
    setup();
    nurse.getPreviousVisitConfirmedDiseases.and.returnValue(
      of({ statusCode: 200, data: { confirmedDiseases: ['Diabetes'] } }),
    );
    component.visitCategory = 'NCD care';
    component.caseSheetData = { BeneficiaryData: { beneficiaryRegID: 7 } };
    component.ngOnChanges();
    expect(component.ncdVisitDetails).toEqual({ beneficiaryRegID: 7 });
    expect(nurse.getPreviousVisitConfirmedDiseases).toHaveBeenCalledWith({
      beneficiaryRegId: 7,
    });
    expect(component.previousConfirmedDiseasesList).toEqual([
      'Diabetes',
    ] as any);
    expect(component.enableConfirmedDiseases).toBeTrue();
  });

  it('keeps list empty when no confirmed diseases', () => {
    setup();
    nurse.getPreviousVisitConfirmedDiseases.and.returnValue(
      of({ statusCode: 200, data: { confirmedDiseases: [] } }),
    );
    component.loadConfirmedDiseasesFromNCD(1);
    expect(component.enableConfirmedDiseases).toBeFalse();
    nurse.getPreviousVisitConfirmedDiseases.and.returnValue(
      of({ statusCode: 500, data: null }),
    );
    component.loadConfirmedDiseasesFromNCD(1);
    nurse.getPreviousVisitConfirmedDiseases.and.returnValue(of(null));
    component.loadConfirmedDiseasesFromNCD(1);
    expect(component.previousConfirmedDiseasesList).toEqual([]);
  });

  it('ignores null data and non-NCD category', () => {
    setup();
    component.caseSheetData = null;
    component.ngOnChanges();
    component.visitCategory = 'General OPD';
    component.caseSheetData = { BeneficiaryData: { beneficiaryRegID: 1 } };
    component.ngOnChanges();
    expect(component.ncdVisitDetails).toBeUndefined();
    expect(nurse.getPreviousVisitConfirmedDiseases).not.toHaveBeenCalled();
  });

  it('falls back to session language', () => {
    setup({ currentLanguageSet: { s: 1 } });
    http.appCurrentLanguge.next(undefined);
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual({ s: 1 });
  });
});
