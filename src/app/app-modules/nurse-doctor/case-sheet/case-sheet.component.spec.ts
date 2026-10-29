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
import { ActivatedRoute } from '@angular/router';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BehaviorSubject } from 'rxjs';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { HttpServiceService } from '../../core/services/http-service.service';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';
import { CaseSheetComponent } from './case-sheet.component';

describe('CaseSheetComponent', () => {
  function setup(
    opts: {
      params?: any;
      session?: Record<string, any>;
      dialogData?: any;
    } = {},
  ) {
    TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [CaseSheetComponent],
      providers: [
        ...commonTestProviders({ session: opts.session }),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: opts.params ?? {} } },
        },
        { provide: MAT_DIALOG_DATA, useValue: opts.dialogData ?? null },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    const fixture = TestBed.createComponent(CaseSheetComponent);
    return { fixture, component: fixture.componentInstance };
  }

  beforeEach(() => {
    spyOn(console, 'log');
  });

  it('reads serviceType from the route and loads the language set', () => {
    const { fixture, component } = setup({
      params: { serviceType: 'HWC', printablePage: 'current' },
      session: { caseSheetVisitCategory: 'ANC' },
    });
    fixture.detectChanges();
    expect(component.serviceType).toBe('HWC');
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
    expect(component.General).toBeTrue();
    expect(component.previous).toBeUndefined();
  });

  it('dialog data overrides serviceType and sets previous', () => {
    const { component } = setup({
      params: { serviceType: 'HWC' },
      dialogData: { previous: true, serviceType: 'MMU' },
    });
    component.ngOnInit();
    expect(component.previous).toBeTrue();
    expect(component.serviceType).toBe('MMU');
  });

  it('defaults to the previous data store when printablePage is absent', () => {
    const { component } = setup({
      session: { previousCaseSheetVisitCategory: 'NCD care' },
    });
    component.caseSheetCategory();
    expect(component.General).toBeTrue();
  });

  it('uses previous visit category when previous flag is already set', () => {
    const { component } = setup({
      params: { printablePage: 'previous' },
      session: {
        previousCaseSheetVisitCategory: 'PNC',
        caseSheetVisitCategory: 'Unknown',
      },
    });
    component.previous = true;
    component.caseSheetCategory();
    expect(component.General).toBeTrue();
  });

  it('ignores current category when previous flag is set with current store', () => {
    const { component } = setup({
      params: { printablePage: 'current' },
      session: { caseSheetVisitCategory: 'ANC' },
    });
    component.previous = true;
    component.caseSheetCategory();
    expect(component.General).toBeFalse();
  });

  [
    'General OPD (QC)',
    'General OPD',
    'NCD care',
    'PNC',
    'ANC',
    'COVID-19 Screening',
    'NCD screening',
    'FP & Contraceptive Services',
    'Neonatal and Infant Health Care Services',
    'Childhood & Adolescent Healthcare Services',
  ].forEach((category) => {
    it(`marks ${category} as a general case sheet`, () => {
      const { component } = setup({
        params: { printablePage: 'current' },
        session: { caseSheetVisitCategory: category },
      });
      component.caseSheetCategory();
      expect(component.General).toBeTrue();
    });
  });

  it('resets flags for an unknown visit category', () => {
    const { component } = setup({
      params: { printablePage: 'current' },
      session: { caseSheetVisitCategory: 'Something else' },
    });
    component.General = true;
    component.QC = true;
    component.caseSheetCategory();
    expect(component.General).toBeFalse();
    expect(component.QC).toBeFalse();
  });

  it('leaves flags untouched when there is no stored category', () => {
    const { component } = setup({ params: { printablePage: 'current' } });
    component.General = true;
    component.caseSheetCategory();
    expect(component.General).toBeTrue();
  });

  it('falls back to session language set when the service emits undefined', () => {
    const { component } = setup({
      session: { currentLanguageSet: { hello: 'x' } },
    });
    const http: any = TestBed.inject(HttpServiceService);
    (http.appCurrentLanguge as BehaviorSubject<any>).next(undefined);
    component.ngDoCheck();
    expect(component.current_language_set).toEqual({ hello: 'x' });
    const session: any = TestBed.inject(SessionStorageService);
    expect(session.getItem).toHaveBeenCalledWith('currentLanguageSet');
  });

  it('keeps undefined language when neither source has it', () => {
    const { component } = setup();
    const http: any = TestBed.inject(HttpServiceService);
    http.appCurrentLanguge.next(undefined);
    component.assignSelectedLanguage();
    expect(component.current_language_set).toBeUndefined();
  });

  it('ngOnDestroy logs', () => {
    const { component } = setup();
    component.ngOnDestroy();
    expect(console.log).toHaveBeenCalledWith('success');
  });
});
