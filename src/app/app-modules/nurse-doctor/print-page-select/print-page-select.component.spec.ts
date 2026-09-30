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
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of } from 'rxjs';

import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
  createHttpServiceMock,
  throwingObs,
} from 'src/testing/test-utils';
import { HttpServiceService } from '../../core/services/http-service.service';
import { PrintPageSelectComponent } from './print-page-select.component';

const KEYS = [
  'caseSheetANC',
  'caseSheetPNC',
  'caseSheetHistory',
  'caseSheetExamination',
  'caseSheetPrescription',
  'caseSheetDiagnosis',
  'caseSheetInvestigations',
  'caseSheetExtInvestigation',
  'caseSheetCurrentVitals',
  'caseSheetChiefComplaints',
  'caseSheetClinicalObservations',
  'caseSheetFindings',
  'caseSheetCovidVaccinationDetails',
  'caseSheetNCDScreeningDetails',
  'caseSheetFamilyPlanning',
  'caseSheetVisitDetails',
  'caseSheetTreatmentOnSideEffects',
  'caseSheetCounsellingProvided',
  'caseSheetNeonatalAndInfant',
  'caseSheetOralVitaminA',
];

function selection(value: boolean, overrides: Record<string, boolean> = {}) {
  const s: any = {};
  KEYS.forEach((k) => (s[k] = value));
  return { ...s, ...overrides };
}

describe('PrintPageSelectComponent', () => {
  let http: any;

  function create(data: any) {
    http = {
      ...createHttpServiceMock(),
      getLanguage: jasmine
        .createSpy('getLanguage')
        .and.returnValue(of({ English: LANGUAGE_EN })),
    };
    TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [PrintPageSelectComponent],
      providers: [
        ...commonTestProviders(),
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: HttpServiceService, useValue: http },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    const fixture = TestBed.createComponent(PrintPageSelectComponent);
    return { fixture, component: fixture.componentInstance };
  }

  beforeEach(() => {
    spyOn(console, 'log');
  });

  describe('ngOnInit', () => {
    it('copies the selection from dialog data and keeps select-all when everything is on', () => {
      const { component } = create({
        visitCategory: 'General OPD',
        printPagePreviewSelect: selection(true),
      });
      spyOn(Storage.prototype, 'getItem').and.returnValue('English');
      component.ngOnInit();
      expect(component.visitCategory).toBe('General OPD');
      KEYS.forEach((k) =>
        expect((component.printPagePreviewSelect as any)[k]).toBeTrue(),
      );
      expect(component.printPagePreviewSelect.selectAllCheckBox).toBeTrue();
      expect(http.getLanguage).toHaveBeenCalledWith('./assets/English.json');
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });

    it('clears select-all when a mandatory section is unchecked', () => {
      const { component } = create({
        visitCategory: 'General OPD',
        printPagePreviewSelect: selection(true, { caseSheetDiagnosis: false }),
      });
      component.ngOnInit();
      expect(component.printPagePreviewSelect.caseSheetDiagnosis).toBeFalse();
      expect(component.printPagePreviewSelect.selectAllCheckBox).toBeFalse();
    });

    it('works without dialog data (select-all off because no category)', () => {
      const { component } = create(null);
      component.visitCategory = '';
      component.ngOnInit();
      expect(component.printPagePreviewSelect.selectAllCheckBox).toBeFalse();
    });

    it('rendering the template runs ngDoCheck language assignment', () => {
      const { fixture, component } = create({
        visitCategory: 'General OPD',
        printPagePreviewSelect: selection(true),
      });
      fixture.detectChanges();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      fixture.destroy();
    });
  });

  describe('setLanguage', () => {
    it('logs when the language response is empty', () => {
      const { component } = create(null);
      component.currentLanguageSet = LANGUAGE_EN;
      http.getLanguage.and.returnValue(of(null));
      spyOn(Storage.prototype, 'getItem').and.returnValue('Hindi');
      component.setLanguage();
      expect(http.getLanguage).toHaveBeenCalledWith('./assets/Hindi.json');
      expect(console.log).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.comingUpWithThisLang + ' Hindi',
      );
    });

    it('logs when loading the language fails', () => {
      const { component } = create(null);
      component.currentLanguageSet = LANGUAGE_EN;
      http.getLanguage.and.returnValue(throwingObs());
      spyOn(Storage.prototype, 'getItem').and.returnValue('Hindi');
      component.setLanguage();
      expect(console.log).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.comingUpWithThisLang + ' Hindi',
      );
    });

    it('falls back to the current language stream when no language is stored', () => {
      const { component } = create(null);
      spyOn(Storage.prototype, 'getItem').and.returnValue(undefined as any);
      component.setLanguage();
      expect(http.getLanguage).not.toHaveBeenCalled();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });
  });

  it('ngDoCheck assigns the selected language', () => {
    const { component } = create(null);
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });

  describe('selectUnselectCheckBox', () => {
    const cases: Array<{
      category: string;
      on: string[];
      untouched: string[];
    }> = [
      {
        category: 'ANC',
        on: [
          'caseSheetANC',
          'caseSheetHistory',
          'caseSheetExamination',
          'caseSheetFindings',
        ],
        untouched: [
          'caseSheetPNC',
          'caseSheetNCDScreeningDetails',
          'caseSheetFamilyPlanning',
        ],
      },
      {
        category: 'PNC',
        on: ['caseSheetPNC', 'caseSheetHistory', 'caseSheetExamination'],
        untouched: ['caseSheetANC'],
      },
      {
        category: 'General OPD (QC)',
        on: ['caseSheetPrescription'],
        untouched: [
          'caseSheetHistory',
          'caseSheetExamination',
          'caseSheetFindings',
        ],
      },
      {
        category: 'NCD care',
        on: ['caseSheetHistory', 'caseSheetFindings'],
        untouched: ['caseSheetExamination'],
      },
      {
        category: 'COVID-19 Screening',
        on: ['caseSheetHistory'],
        untouched: ['caseSheetExamination'],
      },
      {
        category: 'NCD screening',
        on: ['caseSheetNCDScreeningDetails'],
        untouched: ['caseSheetFamilyPlanning'],
      },
      {
        category: 'FP & Contraceptive Services',
        on: [
          'caseSheetFamilyPlanning',
          'caseSheetVisitDetails',
          'caseSheetTreatmentOnSideEffects',
        ],
        untouched: ['caseSheetNCDScreeningDetails'],
      },
      {
        category: 'Neonatal and Infant Health Care Services',
        on: ['caseSheetNeonatalAndInfant'],
        untouched: ['caseSheetOralVitaminA'],
      },
      {
        category: 'Childhood & Adolescent Healthcare Services',
        on: ['caseSheetOralVitaminA'],
        untouched: ['caseSheetNeonatalAndInfant'],
      },
    ];

    const common = [
      'caseSheetPrescription',
      'caseSheetDiagnosis',
      'caseSheetInvestigations',
      'caseSheetExtInvestigation',
      'caseSheetCurrentVitals',
      'caseSheetChiefComplaints',
      'caseSheetClinicalObservations',
      'caseSheetCovidVaccinationDetails',
      'caseSheetCounsellingProvided',
    ];

    cases.forEach(({ category, on, untouched }) => {
      it(`checks and unchecks the right sections for ${category}`, () => {
        const { component } = create(null);
        component.visitCategory = category;
        const sel: any = component.printPagePreviewSelect;

        KEYS.forEach((k) => (sel[k] = false));
        component.selectUnselectCheckBox({ checked: true });
        [...on, ...common].forEach((k) =>
          expect(sel[k]).withContext(k).toBeTrue(),
        );
        untouched.forEach((k) => expect(sel[k]).withContext(k).toBeFalse());

        KEYS.forEach((k) => (sel[k] = true));
        component.selectUnselectCheckBox({ checked: false });
        [...on, ...common].forEach((k) =>
          expect(sel[k]).withContext(k).toBeFalse(),
        );
        untouched.forEach((k) => expect(sel[k]).withContext(k).toBeTrue());
      });
    });
  });

  describe('unCheckSelectAll', () => {
    [
      'ANC',
      'PNC',
      'General OPD (QC)',
      'General OPD',
      'NCD care',
      'COVID-19 Screening',
      'NCD screening',
      'FP & Contraceptive Services',
      'Neonatal and Infant Health Care Services',
      'Childhood & Adolescent Healthcare Services',
    ].forEach((category) => {
      it(`keeps select-all when all sections are checked for ${category}`, () => {
        const { component } = create(null);
        component.visitCategory = category;
        Object.assign(component.printPagePreviewSelect, selection(true));
        component.printPagePreviewSelect.selectAllCheckBox = false;
        component.unCheckSelectAll();
        expect(component.printPagePreviewSelect.selectAllCheckBox).toBeTrue();
      });
    });

    it('clears select-all when category-specific sections are missing', () => {
      const { component } = create(null);
      component.visitCategory = 'NCD screening';
      Object.assign(
        component.printPagePreviewSelect,
        selection(true, { caseSheetNCDScreeningDetails: false }),
      );
      component.unCheckSelectAll();
      expect(component.printPagePreviewSelect.selectAllCheckBox).toBeFalse();
    });

    it('isMandatoryChecked clears select-all if counselling is unchecked', () => {
      const { component } = create(null);
      Object.assign(
        component.printPagePreviewSelect,
        selection(true, { caseSheetCounsellingProvided: false }),
      );
      component.isMandatoryChecked();
      expect(component.printPagePreviewSelect.selectAllCheckBox).toBeFalse();
    });
  });
});
