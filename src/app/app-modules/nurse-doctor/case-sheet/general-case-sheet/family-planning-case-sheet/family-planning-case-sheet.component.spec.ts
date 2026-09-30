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
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';
import { FamilyPlanningCaseSheetComponent } from './family-planning-case-sheet.component';

const FLAGS = [
  'enableFPDetails',
  'enableDoses',
  'enableSterilization',
  'otherCurrentFpMethod',
  'enableOtherCounselled',
  'enableOtherTypeOfContraceptive',
  'enableDoseTaken',
  'enableTypeOfIUCD',
  'enableOtherContraceptivePrescribed',
  'enableOtherInstitute',
];

const FULL = () => ({
  nurseData: {
    fpData: {
      familyPlanningReproductiveDetails: {
        fertilityStatus: 'Fertile',
        dosesTaken: 2,
        dateOfLastDoseTaken: '2024-01-01',
        dateOfSterilization: '2024-01-01',
        placeOfSterilization: 'PHC',
        otherCurrentlyUsingFpMethod: 'x',
      },
      iecAndCounsellingDetails: {
        otherCounselledOn: 'y',
        otherTypeOfContraceptiveOpted: 'z',
      },
      dispensationDetails: {
        dosesTaken: 1,
        dateOfLastDoseTaken: 'd',
        typeOfIUCDInserted: 'Cu-T',
        dateOfIUCDInsertion: 'd',
        iucdInsertionDoneBy: 'Dr',
        otherTypeOfContraceptivePrescribed: 'w',
      },
    },
  },
  doctorData: {
    Refer: {
      otherReferredToInstituteName: 'Other Hosp',
      otherReferralReason: 'reason',
      referralReason: ['A', null, 'B'],
    },
  },
});

describe('FamilyPlanningCaseSheetComponent', () => {
  let component: FamilyPlanningCaseSheetComponent;
  let http: any;

  function setup(session: Record<string, any> = {}) {
    TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [FamilyPlanningCaseSheetComponent],
      providers: [...commonTestProviders({ session })],
      schemas: [NO_ERRORS_SCHEMA],
    });
    const fixture = TestBed.createComponent(FamilyPlanningCaseSheetComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpServiceService);
    return fixture;
  }

  beforeEach(() => spyOn(console, 'log'));

  it('enables every section for full data and renders', () => {
    const fixture = setup();
    component.caseSheetData = FULL();
    component.ngOnChanges();
    fixture.detectChanges();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    FLAGS.forEach((f) =>
      expect((component as any)[f])
        .withContext(f)
        .toBeTrue(),
    );
    expect(component.enableOtherReferral).toBeTrue();
    expect(component.referralReasonList).toBe('A,B');
    expect(component.dispensationDetailsCasesheet.typeOfIUCDInserted).toBe(
      'Cu-T',
    );
  });

  it('disables every flag for empty sections', () => {
    setup();
    FLAGS.forEach((f) => ((component as any)[f] = true));
    component.caseSheetData = {
      nurseData: {
        fpData: {
          familyPlanningReproductiveDetails: { fertilityStatus: 'Infertile' },
          iecAndCounsellingDetails: {},
          dispensationDetails: {},
        },
      },
      doctorData: { Refer: {} },
    };
    component.ngOnChanges();
    FLAGS.forEach((f) =>
      expect((component as any)[f])
        .withContext(f)
        .toBeFalse(),
    );
    expect(component.enableOtherReferral).toBeFalse();
    expect(component.referralReasonList).toBe('');
  });

  it('treats null otherReferralReason as present (duplicated undefined check in app code)', () => {
    setup();
    component.caseSheetData = {
      doctorData: { Refer: { otherReferralReason: null } },
    };
    component.ngOnChanges();
    expect(component.enableOtherReferral).toBeTrue();
  });

  it('ignores null data and missing fertility status', () => {
    setup();
    component.caseSheetData = null;
    component.ngOnChanges();
    expect(component.familyPlanningAndReproductiveCasesheet).toBeUndefined();
    component.caseSheetData = {
      nurseData: { fpData: { familyPlanningReproductiveDetails: {} } },
    };
    component.ngOnChanges();
    expect(component.enableFPDetails).toBeFalse();
  });

  it('falls back to session language', () => {
    setup({ currentLanguageSet: { s: 1 } });
    http.appCurrentLanguge.next(undefined);
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual({ s: 1 });
  });
});
