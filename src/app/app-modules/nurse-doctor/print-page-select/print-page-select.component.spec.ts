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

describe('PrintPageSelectComponent', () => {
  let component: PrintPageSelectComponent;
  let fixture: ComponentFixture<PrintPageSelectComponent>;
  let http: any;

  const allKeys = [
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
  const selection = (value: boolean, over: any = {}) => {
    const o: any = {};
    allKeys.forEach((k) => (o[k] = value));
    return { ...o, ...over };
  };

  const create = async (data: any) => {
    http = createHttpServiceMock();
    (http as any).getLanguage = jasmine
      .createSpy('getLanguage')
      .and.returnValue(of({ English: LANGUAGE_EN }));
    TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [PrintPageSelectComponent],
      providers: [
        ...commonTestProviders(),
        { provide: HttpServiceService, useValue: http },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    // Template uses [(ngModel)] on mat-checkbox (no value accessor without MatCheckboxModule).
    TestBed.overrideTemplate(PrintPageSelectComponent, '');
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(PrintPageSelectComponent);
    component = fixture.componentInstance;
  };

  beforeEach(() => sessionStorage.setItem('setLanguage', 'English'));
  afterEach(() => sessionStorage.removeItem('setLanguage'));

  describe('init', () => {
    it('copies selections from dialog data and loads the language file', async () => {
      await create({
        visitCategory: 'ANC',
        printPagePreviewSelect: selection(true, { caseSheetDiagnosis: false }),
      });
      component.ngOnInit();
      expect(component.visitCategory).toBe('ANC');
      expect(component.printPagePreviewSelect.caseSheetDiagnosis).toBeFalse();
      expect(component.printPagePreviewSelect.selectAllCheckBox).toBeFalse();
      expect(http.getLanguage).toHaveBeenCalledWith('./assets/English.json');
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });

    it('keeps language unchanged when the language response is empty', async () => {
      await create({
        visitCategory: 'General OPD',
        printPagePreviewSelect: selection(true),
      });
      http.getLanguage.and.returnValue(of(null));
      component.currentLanguageSet = LANGUAGE_EN;
      component.setLanguage();
      expect(component.currentLanguageSet).toBe(LANGUAGE_EN);
    });

    it('logs and keeps language on language load error', async () => {
      await create({
        visitCategory: 'General OPD',
        printPagePreviewSelect: selection(true),
      });
      http.getLanguage.and.returnValue(throwingObs('x'));
      const log = spyOn(console, 'log');
      component.currentLanguageSet = LANGUAGE_EN;
      component.setLanguage();
      expect(log).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.comingUpWithThisLang + ' English',
      );
    });

    it('subscribes to current language when language is undefined', async () => {
      await create({
        visitCategory: 'General OPD',
        printPagePreviewSelect: selection(true),
      });
      spyOn(sessionStorage, 'getItem').and.returnValue(undefined as any);
      component.setLanguage();
      expect(http.getLanguage).not.toHaveBeenCalled();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });

    it('ngDoCheck assigns the language set', async () => {
      await create(null);
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });

    it('renders without dialog data', async () => {
      await create(null);
      component.visitCategory = 'General OPD';
      fixture.detectChanges();
      expect(component.printPagePreviewSelect.selectAllCheckBox).toBeTrue();
    });
  });

  describe('unCheckSelectAll', () => {
    beforeEach(async () => await create(null));
    const cats: [string, any][] = [
      ['ANC', {}],
      ['PNC', {}],
      ['General OPD (QC)', {}],
      ['General OPD', {}],
      ['NCD care', {}],
      ['COVID-19 Screening', {}],
      ['NCD screening', {}],
      ['FP & Contraceptive Services', {}],
      ['Neonatal and Infant Health Care Services', {}],
      ['Childhood & Adolescent Healthcare Services', {}],
    ];
    cats.forEach(([cat]) => {
      it(`${cat}: selects all when everything is ticked`, () => {
        component.visitCategory = cat;
        Object.assign(component.printPagePreviewSelect, selection(true));
        component.printPagePreviewSelect.selectAllCheckBox = false;
        component.unCheckSelectAll();
        expect(component.printPagePreviewSelect.selectAllCheckBox).toBeTrue();
      });
      it(`${cat}: deselects when a mandatory box is unticked`, () => {
        component.visitCategory = cat;
        Object.assign(
          component.printPagePreviewSelect,
          selection(true, { caseSheetCounsellingProvided: false }),
        );
        component.unCheckSelectAll();
        expect(component.printPagePreviewSelect.selectAllCheckBox).toBeFalse();
      });
    });

    it('PNC depends on the ANC flag (current behaviour)', () => {
      component.visitCategory = 'PNC';
      Object.assign(
        component.printPagePreviewSelect,
        selection(true, { caseSheetANC: false }),
      );
      component.unCheckSelectAll();
      expect(component.printPagePreviewSelect.selectAllCheckBox).toBeFalse();
    });

    it('unknown category deselects all', () => {
      component.visitCategory = 'Cancer Screening';
      Object.assign(component.printPagePreviewSelect, selection(true));
      component.unCheckSelectAll();
      expect(component.printPagePreviewSelect.selectAllCheckBox).toBeFalse();
    });
  });

  describe('selectUnselectCheckBox', () => {
    beforeEach(async () => await create(null));

    const categoryOnly: [string, string[], string[]][] = [
      [
        'ANC',
        [
          'caseSheetANC',
          'caseSheetHistory',
          'caseSheetExamination',
          'caseSheetFindings',
        ],
        ['caseSheetPNC'],
      ],
      ['PNC', ['caseSheetPNC'], ['caseSheetANC']],
      [
        'General OPD (QC)',
        [],
        ['caseSheetHistory', 'caseSheetExamination', 'caseSheetFindings'],
      ],
      ['NCD care', ['caseSheetHistory'], ['caseSheetExamination']],
      ['COVID-19 Screening', ['caseSheetHistory'], ['caseSheetExamination']],
      [
        'NCD screening',
        ['caseSheetNCDScreeningDetails'],
        ['caseSheetFamilyPlanning'],
      ],
      [
        'FP & Contraceptive Services',
        [
          'caseSheetFamilyPlanning',
          'caseSheetVisitDetails',
          'caseSheetTreatmentOnSideEffects',
        ],
        ['caseSheetNCDScreeningDetails'],
      ],
      [
        'Neonatal and Infant Health Care Services',
        ['caseSheetNeonatalAndInfant'],
        ['caseSheetOralVitaminA'],
      ],
      [
        'Childhood & Adolescent Healthcare Services',
        ['caseSheetOralVitaminA'],
        ['caseSheetNeonatalAndInfant'],
      ],
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

    categoryOnly.forEach(([cat, changed, untouched]) => {
      it(`${cat}: check all sets category + common boxes`, () => {
        component.visitCategory = cat;
        Object.assign(component.printPagePreviewSelect, selection(false));
        component.selectUnselectCheckBox({ checked: true });
        const p: any = component.printPagePreviewSelect;
        [...changed, ...common].forEach((k) =>
          expect(p[k]).withContext(k).toBeTrue(),
        );
        untouched.forEach((k) => expect(p[k]).withContext(k).toBeFalse());
      });
      it(`${cat}: uncheck all clears category + common boxes`, () => {
        component.visitCategory = cat;
        Object.assign(component.printPagePreviewSelect, selection(true));
        component.selectUnselectCheckBox({ checked: false });
        const p: any = component.printPagePreviewSelect;
        [...changed, ...common].forEach((k) =>
          expect(p[k]).withContext(k).toBeFalse(),
        );
        untouched.forEach((k) => expect(p[k]).withContext(k).toBeTrue());
      });
    });
  });
});
