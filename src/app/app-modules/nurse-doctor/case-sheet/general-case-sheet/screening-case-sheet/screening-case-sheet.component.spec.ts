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
import { ScreeningCaseSheetComponent } from './screening-case-sheet.component';

const KEYS: [string, string, string, string, string][] = [
  // nurseData key, casesheet prop, suspected prop, confirmed prop, enable prop
  [
    'diabetes',
    'diabetesCasesheet',
    'diabetesSuspected',
    'diabetesConfirmed',
    'enableDiabetesForm',
  ],
  [
    'hypertension',
    'hypertensionCasesheet',
    'hypertensionSuspected',
    'hypertensionConfirmed',
    'enableHypertensionForm',
  ],
  [
    'oral',
    'oralCancerCasesheet',
    'oralSuspected',
    'oralCancerConfirmed',
    'enableOralForm',
  ],
  [
    'breast',
    'breastCancerCasesheet',
    'breastSuspected',
    'breastCancerConfirmed',
    'enableBreastForm',
  ],
  [
    'cervical',
    'cervicalCancerCasesheet',
    'cervicalSuspected',
    'cervicalCancerConfirmed',
    'enableCervicalForm',
  ],
];

describe('ScreeningCaseSheetComponent', () => {
  let component: ScreeningCaseSheetComponent;
  let http: any;

  function setup(session: Record<string, any> = {}) {
    TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [ScreeningCaseSheetComponent],
      providers: [...commonTestProviders({ session })],
      schemas: [NO_ERRORS_SCHEMA],
    });
    const fixture = TestBed.createComponent(ScreeningCaseSheetComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpServiceService);
    return fixture;
  }

  it('maps all screening sections when suspected is set, and renders', () => {
    const fixture = setup();
    const nurseData: any = { cbac: { totalScore: 6 } };
    KEYS.forEach(
      ([k]) => (nurseData[k] = { suspected: true, confirmed: false, k }),
    );
    component.caseSheetData = { nurseData };
    component.ngOnChanges();
    fixture.detectChanges();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.cbacScore).toBe(6);
    KEYS.forEach(([k, sheet, sus, conf, en]) => {
      expect((component as any)[sheet]).toBe(nurseData[k]);
      expect((component as any)[sus]).toBeTrue();
      expect((component as any)[conf]).toBeFalse();
      expect((component as any)[en]).toBeTrue();
    });
  });

  it('disables sections whose suspected flag is null', () => {
    setup();
    const nurseData: any = {};
    KEYS.forEach(
      ([k]) => (nurseData[k] = { suspected: null, confirmed: true }),
    );
    KEYS.forEach(([, , , , en]) => ((component as any)[en] = true));
    component.caseSheetData = { nurseData };
    component.ngOnChanges();
    KEYS.forEach(([, , , conf, en]) => {
      expect((component as any)[conf]).toBeTrue();
      expect((component as any)[en]).toBeFalse();
    });
  });

  it('ignores undefined or empty case sheet', () => {
    setup();
    component.ngOnChanges();
    component.caseSheetData = null;
    component.ngOnChanges();
    component.caseSheetData = { nurseData: {} };
    component.ngOnChanges();
    expect(component.cbacScore).toBeUndefined();
    expect(component.enableDiabetesForm).toBeFalse();
  });

  it('falls back to session language', () => {
    setup({ currentLanguageSet: { s: 1 } });
    http.appCurrentLanguge.next(undefined);
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual({ s: 1 });
  });
});
