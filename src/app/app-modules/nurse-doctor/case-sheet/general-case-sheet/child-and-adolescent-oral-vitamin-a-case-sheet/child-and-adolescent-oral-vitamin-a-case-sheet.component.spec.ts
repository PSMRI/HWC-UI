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
import { BehaviorSubject } from 'rxjs';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { BeneficiaryDetailsService } from 'src/app/app-modules/core/services/beneficiary-details.service';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';
import { ChildAndAdolescentOralVitaminACaseSheetComponent } from './child-and-adolescent-oral-vitamin-a-case-sheet.component';

describe('ChildAndAdolescentOralVitaminACaseSheetComponent', () => {
  let component: ChildAndAdolescentOralVitaminACaseSheetComponent;
  let http: any;

  function setup(session: Record<string, any> = {}) {
    TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [ChildAndAdolescentOralVitaminACaseSheetComponent],
      providers: [
        ...commonTestProviders({ session }),
        {
          provide: BeneficiaryDetailsService,
          useValue: { beneficiaryDetails$: new BehaviorSubject(null) },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    const fixture = TestBed.createComponent(
      ChildAndAdolescentOralVitaminACaseSheetComponent,
    );
    component = fixture.componentInstance;
    http = TestBed.inject(HttpServiceService);
    return fixture;
  }

  it('ngOnInit reads visit category and language, and renders', () => {
    const fixture = setup({ caseSheetVisitCategory: 'Neonatal' });
    component.caseSheetData = {
      nurseData: {
        immunizationServices: {
          oralVitaminAProphylaxis: { oralVitaminAStatus: 'Given' },
        },
      },
    };
    component.ngOnChanges();
    fixture.detectChanges();
    expect(component.visitCategory).toBe('Neonatal');
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('falls back to session language when service emits undefined', () => {
    setup({ currentLanguageSet: { fromSession: true } });
    http.appCurrentLanguge.next(undefined);
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual({ fromSession: true });
  });

  it('stays undefined when neither source has a language', () => {
    setup();
    http.appCurrentLanguge.next(undefined);
    component.assignSelectedLanguage();
    expect(component.currentLanguageSet).toBeUndefined();
  });

  describe('getAgeValueNew', () => {
    beforeEach(() => setup());
    it('parses years', () =>
      expect(component.getAgeValueNew(' 5 years ')).toBe(5));
    it('returns 0 for other units', () =>
      expect(component.getAgeValueNew('5 months')).toBe(0));
    it('returns 0 without unit', () =>
      expect(component.getAgeValueNew('5')).toBe(0));
    it('returns 0 for empty', () =>
      expect(component.getAgeValueNew('')).toBe(0));
  });

  describe('ngOnChanges', () => {
    beforeEach(() => setup());

    it('enables oral vitamin A data when Given', () => {
      component.caseSheetData = {
        nurseData: {
          immunizationServices: {
            oralVitaminAProphylaxis: { oralVitaminAStatus: 'Given' },
          },
        },
      };
      component.ngOnChanges();
      expect(component.enableOralVitaminAData).toBeTrue();
      expect(component.oralVitaminACasesheet.oralVitaminAStatus).toBe('Given');
    });

    it('disables when not given', () => {
      component.enableOralVitaminAData = true;
      component.caseSheetData = {
        nurseData: {
          immunizationServices: {
            oralVitaminAProphylaxis: { oralVitaminAStatus: 'Not Given' },
          },
        },
      };
      component.ngOnChanges();
      expect(component.enableOralVitaminAData).toBeFalse();
    });

    it('rounds age up when months present', () => {
      component.caseSheetData = {
        BeneficiaryData: { age: '5 years - 3 months' },
      };
      component.ngOnChanges();
      expect(component.beneficiaryAge).toBe(6);
      expect(component.beneficiary.age).toBe('5 years - 3 months');
    });

    it('keeps exact age for 0 months', () => {
      component.caseSheetData = {
        BeneficiaryData: { age: '5 years - 0 months' },
      };
      component.ngOnChanges();
      expect(component.beneficiaryAge).toBe(5);
    });

    it('age without months part is rounded up', () => {
      component.caseSheetData = { BeneficiaryData: { age: '4 years' } };
      component.ngOnChanges();
      expect(component.beneficiaryAge).toBe(5);
    });

    it('age in months gives 0', () => {
      component.caseSheetData = { BeneficiaryData: { age: '8 months' } };
      component.ngOnChanges();
      expect(component.beneficiaryAge).toBe(0);
    });

    it('ignores null case sheet', () => {
      component.caseSheetData = null;
      component.ngOnChanges();
      expect(component.oralVitaminACasesheet).toBeUndefined();
      expect(component.beneficiaryAge).toBe(0);
    });
  });
});
