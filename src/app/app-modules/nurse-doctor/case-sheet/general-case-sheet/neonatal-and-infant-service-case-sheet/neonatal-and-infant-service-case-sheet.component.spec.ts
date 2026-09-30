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
import { NeonatalAndInfantServiceCaseSheetComponent } from './neonatal-and-infant-service-case-sheet.component';

const FULL = () => ({
  nurseData: {
    history: {
      infantBirthDetails: {
        otherDeliveryPlace: 'Home',
        otherDeliveryComplication: 'None',
        timeOfBirth: '10:30',
      },
      immunizationHistory: {
        immunizationList: [
          {
            defaultReceivingAge: 'Birth',
            vaccinationReceivedAt: 'PHC',
            vaccines: [
              { vaccine: 'BCG', status: true },
              { vaccine: 'OPV', status: true },
              { vaccine: 'HepB', status: false },
            ],
          },
        ],
      },
    },
    immunizationServices: {
      immunizationServices: {
        vaccines: [
          {
            vaccineName: 'Penta',
            vaccineDose: '1',
            siteOfInjection: 'Thigh',
            route: 'IM',
            batchNo: 'B1',
          },
        ],
      },
    },
  },
  doctorData: { followUpForImmunization: { due: 'x' } },
  BeneficiaryData: { age: '1 years - 2 months' },
});

describe('NeonatalAndInfantServiceCaseSheetComponent', () => {
  let component: NeonatalAndInfantServiceCaseSheetComponent;
  let http: any;

  function setup(session: Record<string, any> = {}) {
    TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [NeonatalAndInfantServiceCaseSheetComponent],
      providers: [...commonTestProviders({ session })],
      schemas: [NO_ERRORS_SCHEMA],
    });
    const fixture = TestBed.createComponent(
      NeonatalAndInfantServiceCaseSheetComponent,
    );
    component = fixture.componentInstance;
    http = TestBed.inject(HttpServiceService);
    return fixture;
  }

  beforeEach(() => spyOn(console, 'log'));

  it('maps full case sheet and renders', () => {
    const fixture = setup({ caseSheetVisitCategory: 'Neonatal' });
    component.caseSheetData = FULL();
    component.ngOnChanges();
    fixture.detectChanges();
    expect(component.visitCategory).toBe('Neonatal');
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.otherDelPlace).toBeTrue();
    expect(component.otherDelComplication).toBeTrue();
    expect(component.birthTime).toEqual(new Date(1970, 0, 1, 10, 30));
    expect(component.vaccinetaken).toEqual([
      {
        vaccine: 'BCG,OPV',
        defaultReceivingAge: 'Birth',
        vaccinationReceivedAt: 'PHC',
      },
    ]);
    expect(component.serviceVaccinetaken).toEqual([
      {
        vaccine: 'Penta',
        vaccineDose: '1',
        siteOfInjection: 'Thigh',
        route: 'IM',
        batchNo: 'B1',
      },
    ]);
    expect(component.enableImmunizationServiceVaccine).toBeTrue();
    expect(component.followUpImmunizationCasesheet).toEqual({ due: 'x' });
    expect(component.beneficiaryAge).toBe(2);
  });

  it('handles missing optional fields', () => {
    setup();
    const data: any = FULL();
    data.nurseData.history.infantBirthDetails = {
      otherDeliveryPlace: null,
      otherDeliveryComplication: undefined,
    };
    data.nurseData.immunizationServices.immunizationServices.vaccines = [
      { vaccineName: null, vaccineDose: '2' },
    ];
    data.BeneficiaryData.age = '3 years - 0 months';
    component.caseSheetData = data;
    component.ngOnChanges();
    expect(component.otherDelPlace).toBeFalse();
    expect(component.otherDelComplication).toBeFalse();
    expect(component.birthTime).toBeUndefined();
    expect(component.enableImmunizationServiceVaccine).toBeFalse();
    expect(component.serviceVaccinetaken[0].vaccine).toBe('');
    expect(component.beneficiaryAge).toBe(3);
  });

  it('months-only age and missing months part', () => {
    setup();
    component.caseSheetData = { BeneficiaryData: { age: '6 months' } };
    component.ngOnChanges();
    expect(component.beneficiaryAge).toBe(0);
    component.caseSheetData = { BeneficiaryData: { age: '2 years' } };
    component.ngOnChanges();
    expect(component.beneficiaryAge).toBe(3);
  });

  it('ignores null / empty case sheet', () => {
    setup();
    component.caseSheetData = null;
    component.ngOnChanges();
    component.caseSheetData = {};
    component.ngOnChanges();
    expect(component.infantBirthDeatilsCasesheet).toBeUndefined();
    expect(component.vaccinetaken).toEqual([]);
  });

  it('getAgeValueNew variants', () => {
    setup();
    expect(component.getAgeValueNew('7 Years')).toBe(7);
    expect(component.getAgeValueNew('7 days')).toBe(0);
    expect(component.getAgeValueNew('7')).toBe(0);
    expect(component.getAgeValueNew(null)).toBe(0);
  });

  it('falls back to session language', () => {
    setup({ currentLanguageSet: { s: 1 } });
    http.appCurrentLanguge.next(undefined);
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual({ s: 1 });
  });
});
