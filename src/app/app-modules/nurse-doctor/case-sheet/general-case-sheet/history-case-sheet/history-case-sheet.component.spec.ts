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
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';
import { HistoryCaseSheetComponent } from './history-case-sheet.component';

const FULL = () => ({
  BeneficiaryData: { age: '30 years - 2 months' },
  nurseData: {
    anc: { ANCCareDetail: { lmp: 'x' } },
    history: {
      PastHistory: { pastIllness: [{ a: 1 }], pastSurgery: [{ b: 1 }] },
      FamilyHistory: { f: 1 },
      PhysicalActivityHistory: { p: 1 },
      childOptionalVaccineHistory: { childOptionalVaccineList: [{ v: 1 }] },
      ComorbidityConditions: {
        comorbidityConcurrentConditionsList: [{ c: 1 }],
      },
      MedicationHistory: { medicationHistoryList: [{ m: 1 }] },
      FemaleObstetricHistory: { fo: 1 },
      DevelopmentHistory: { d: 1 },
      FeedingHistory: { fe: 1 },
      MenstrualHistory: { me: 1 },
      PerinatalHistory: { pe: 1 },
      PersonalHistory: { ps: 1 },
      ImmunizationHistory: { im: 1 },
    },
  },
  doctorData: {
    Refer: {
      refrredToAdditionalServiceList: ['S1', null, 'S2'],
      referralReason: ['R1', 'R2'],
      revisitDate: '2024-03-05T00:00:00',
    },
  },
});

describe('HistoryCaseSheetComponent', () => {
  let component: HistoryCaseSheetComponent;
  let http: any;

  function setup(session: Record<string, any> = {}) {
    TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [HistoryCaseSheetComponent],
      providers: [...commonTestProviders({ session })],
      schemas: [NO_ERRORS_SCHEMA],
    });
    const fixture = TestBed.createComponent(HistoryCaseSheetComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpServiceService);
    http.getLanguage = jasmine.createSpy('getLanguage');
    return fixture;
  }

  beforeEach(() => spyOn(console, 'log'));

  it('maps full history, referral lists and revisit date', () => {
    const fixture = setup({ caseSheetVisitCategory: 'General OPD' });
    component.caseSheetData = FULL();
    component.ngOnChanges();
    fixture.detectChanges();
    expect(component.visitCategory).toBe('General OPD');
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
    expect(component.beneficiaryAge).toBe(31);
    expect(component.ANCDetailsAndFormula).toEqual({ lmp: 'x' });
    expect(component.pastIllnessList).toEqual([{ a: 1 }]);
    expect(component.pastSurgeryList).toEqual([{ b: 1 }]);
    expect(component.familyHistory).toEqual({ f: 1 });
    expect(component.previousPhysicalList).toEqual({ p: 1 });
    expect(component.childOptionalVaccineList).toEqual([{ v: 1 }]);
    expect(component.comorbidConditionList).toEqual([{ c: 1 }]);
    expect(component.medicationHistoryList).toEqual([{ m: 1 }]);
    expect(component.femaleObstetricHistory).toEqual({ fo: 1 });
    expect(component.developmentalHistory).toEqual({ d: 1 });
    expect(component.feedingHistory).toEqual({ fe: 1 });
    expect(component.menstrualHistory).toEqual({ me: 1 });
    expect(component.perinatalHistory).toEqual({ pe: 1 });
    expect(component.personalHistory).toEqual({ ps: 1 });
    expect(component.immunizationHistory).toEqual({ im: 1 });
    expect(component.serviceList).toBe('S1,S2');
    expect(component.referralReasonList).toBe('R1,R2');
    expect(component.referDetails.revisitDate).toBe('05/03/2024');
    const t = new Date();
    expect(component.date).toBe(
      `${t.getDate()}/${t.getMonth() + 1}/${t.getFullYear()}`,
    );
  });

  it('keeps already formatted revisit date', () => {
    setup();
    component.caseSheetData = {
      doctorData: { Refer: { revisitDate: '05/03/2024' } },
    };
    component.ngOnChanges();
    expect(component.referDetails.revisitDate).toBe('05/03/2024');
    expect(component.serviceList).toBe('');
  });

  it('handles beneficiary with minimal data and exact-year age', () => {
    setup();
    component.caseSheetData = {
      BeneficiaryData: { age: '30 years - 0 months' },
      nurseData: { history: {} },
      doctorData: {},
    };
    component.ngOnChanges();
    expect(component.beneficiaryAge).toBe(30);
    expect(component.generalhistory).toEqual({});
    expect(component.pastIllnessList).toBeUndefined();
    expect(component.referDetails).toBeUndefined();
  });

  it('age without months part and months-only age', () => {
    setup();
    component.caseSheetData = {
      BeneficiaryData: { age: '4 years' },
      doctorData: {},
    };
    component.ngOnChanges();
    expect(component.beneficiaryAge).toBe(5);
    component.caseSheetData = {
      BeneficiaryData: { age: '4 months' },
      doctorData: {},
    };
    component.ngOnChanges();
    expect(component.beneficiaryAge).toBe(0);
  });

  it('only sets date when no case sheet', () => {
    setup();
    component.caseSheetData = undefined;
    component.ngOnChanges();
    expect(component.date).toBeTruthy();
    expect(component.beneficiary).toBeUndefined();
  });

  it('getAgeValueNew and padLeft', () => {
    setup();
    expect(component.getAgeValueNew('')).toBe(0);
    expect(component.getAgeValueNew('3 Years')).toBe(3);
    expect(component.padLeft.apply(5 as any)).toBe('05');
    expect(String(component.padLeft.apply(12 as any))).toBe('12');
  });

  it('falls back to session language', () => {
    setup({ currentLanguageSet: { s: 1 } });
    http.appCurrentLanguge.next(undefined);
    component.ngDoCheck();
    expect(component.current_language_set).toEqual({ s: 1 });
  });

  describe('changeLanguage', () => {
    beforeEach(() => setup());

    it('loads stored language file', () => {
      spyOn(Storage.prototype, 'getItem').and.returnValue('English');
      http.getLanguage.and.returnValue(of({ English: { l: 1 } }));
      component.changeLanguage();
      expect(http.getLanguage).toHaveBeenCalledWith('./assets/English.json');
      expect(component.current_language_set).toEqual({ l: 1 });
    });

    it('logs for empty response and errors', () => {
      spyOn(Storage.prototype, 'getItem').and.returnValue('Hindi');
      component.current_language_set = LANGUAGE_EN;
      http.getLanguage.and.returnValue(of(null));
      component.changeLanguage();
      http.getLanguage.and.returnValue(throwingObs());
      component.changeLanguage();
      expect(console.log).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.comingUpWithThisLang + ' Hindi',
      );
      expect((console.log as jasmine.Spy).calls.count()).toBe(2);
    });

    it('subscribes to current language when none stored', () => {
      spyOn(Storage.prototype, 'getItem').and.returnValue(undefined as any);
      component.changeLanguage();
      expect(http.getLanguage).not.toHaveBeenCalled();
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
    });
  });
});
