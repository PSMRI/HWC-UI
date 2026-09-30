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
import { AncCaseSheetComponent } from './anc-case-sheet.component';

describe('AncCaseSheetComponent', () => {
  let component: AncCaseSheetComponent;
  let http: any;

  function setup(session: Record<string, any> = {}) {
    TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [AncCaseSheetComponent],
      providers: [...commonTestProviders({ session })],
      schemas: [NO_ERRORS_SCHEMA],
    });
    const fixture = TestBed.createComponent(AncCaseSheetComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpServiceService);
    http.getLanguage = jasmine.createSpy('getLanguage');
    return fixture;
  }

  beforeEach(() => spyOn(console, 'log'));

  it('ngOnChanges maps ANC care and vaccine details', () => {
    const fixture = setup();
    const anc = { ANCCareDetail: { lmp: 'x' }, ANCWomenVaccineDetails: [1] };
    component.caseSheetData = { nurseData: { anc } };
    component.ngOnChanges();
    expect(component.aNCDetailsAndFormula).toEqual({ lmp: 'x' });
    expect(component.aNCImmunization).toEqual([1]);
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('ngOnChanges ignores data without ANC', () => {
    setup();
    component.caseSheetData = { nurseData: {} };
    component.ngOnChanges();
    component.caseSheetData = null;
    component.ngOnChanges();
    expect(component.aNCDetailsAndFormula).toBeUndefined();
    expect(component.aNCImmunization).toBeUndefined();
  });

  describe('language', () => {
    beforeEach(() => setup({ currentLanguageSet: { fromSession: true } }));

    it('ngOnInit assigns the language set from the service', () => {
      component.ngOnInit();
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
    });

    it('ngDoCheck falls back to session storage when service emits undefined', () => {
      http.appCurrentLanguge.next(undefined);
      component.ngDoCheck();
      expect(component.current_language_set).toEqual({ fromSession: true });
    });

    it('changeLanguage loads the stored language file', () => {
      spyOn(Storage.prototype, 'getItem').and.returnValue('English');
      http.getLanguage.and.returnValue(of({ English: { lang: 'en' } }));
      component.changeLanguage();
      expect(http.getLanguage).toHaveBeenCalledWith('./assets/English.json');
      expect(component.current_language_set).toEqual({ lang: 'en' });
    });

    it('changeLanguage logs when the response is empty', () => {
      spyOn(Storage.prototype, 'getItem').and.returnValue('Hindi');
      component.current_language_set = LANGUAGE_EN;
      http.getLanguage.and.returnValue(of(null));
      component.changeLanguage();
      expect(console.log).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.comingUpWithThisLang + ' Hindi',
      );
    });

    it('changeLanguage logs on error', () => {
      spyOn(Storage.prototype, 'getItem').and.returnValue('Hindi');
      component.current_language_set = LANGUAGE_EN;
      http.getLanguage.and.returnValue(throwingObs());
      component.changeLanguage();
      expect(console.log).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.comingUpWithThisLang + ' Hindi',
      );
    });

    it('changeLanguage subscribes to the current language when none stored', () => {
      spyOn(Storage.prototype, 'getItem').and.returnValue(undefined as any);
      component.current_language_set = null;
      component.changeLanguage();
      expect(http.getLanguage).not.toHaveBeenCalled();
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
    });
  });
});
