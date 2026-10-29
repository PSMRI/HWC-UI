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
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  createDialogRefMock,
} from 'src/testing/test-utils';
import { DoctorService } from '../../shared/services/doctor.service';
import { PrintPageSelectComponent } from '../../print-page-select/print-page-select.component';
import { GeneralCaseSheetComponent } from './general-case-sheet.component';

describe('GeneralCaseSheetComponent', () => {
  let doctorService: any;
  let location: any;

  const SESSION = {
    caseSheetVisitCategory: 'ANC',
    caseSheetBenFlowID: 11,
    caseSheetVisitID: 22,
    caseSheetBeneficiaryRegID: 33,
    visitCode: 44,
    previousCaseSheetVisitCategory: 'PNC',
    previousCaseSheetBenFlowID: 55,
    previousCaseSheetBeneficiaryRegID: 66,
    previousCaseSheetVisitCode: 77,
  };

  function setup(params: any = {}, session: Record<string, any> = SESSION) {
    doctorService = autoSpy(DoctorService);
    location = { back: jasmine.createSpy('back') };
    TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [GeneralCaseSheetComponent],
      providers: [
        ...commonTestProviders({ session }),
        { provide: DoctorService, useValue: doctorService },
        { provide: Location, useValue: location },
        { provide: ActivatedRoute, useValue: { snapshot: { params } } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    const fixture = TestBed.createComponent(GeneralCaseSheetComponent);
    return { fixture, component: fixture.componentInstance };
  }

  beforeEach(() => spyOn(console, 'log'));

  it('current store requests TM case sheet with current session keys', () => {
    const { fixture, component } = setup({ printablePage: 'current' });
    component.serviceType = 'TM';
    doctorService.getTMCasesheetData.and.returnValue(
      of({ statusCode: 200, data: { a: 1 } }),
    );
    fixture.detectChanges();
    expect(component.visitCategory).toBe('ANC');
    expect(component.hideBack).toBeFalse();
    expect(doctorService.getTMCasesheetData).toHaveBeenCalledWith({
      VisitCategory: 'ANC',
      benFlowID: 11,
      benVisitID: 22,
      beneficiaryRegID: 33,
      visitCode: 44,
    });
    expect(component.caseSheetData).toEqual({ a: 1 });
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
    fixture.destroy();
  });

  it('previous store (default) requests MMU case sheet with previous keys', () => {
    const { component } = setup({});
    component.serviceType = 'MMU';
    doctorService.getMMUCasesheetData.and.returnValue(
      of({ statusCode: 200, data: { b: 2 } }),
    );
    component.ngOnInit();
    expect(component.dataStore).toBe('previous');
    expect(component.hideBack).toBeTrue();
    expect(component.visitCategory).toBe('PNC');
    expect(doctorService.getMMUCasesheetData).toHaveBeenCalledWith({
      VisitCategory: 'PNC',
      benFlowID: 55,
      beneficiaryRegID: 66,
      visitCode: 77,
    });
    expect(component.caseSheetData).toEqual({ b: 2 });
  });

  it('HWC service type uses the TM endpoint', () => {
    const { component } = setup();
    component.serviceType = 'HWC';
    component.getCasesheetData({ x: 1 });
    expect(doctorService.getTMCasesheetData).toHaveBeenCalledWith({ x: 1 });
    expect(doctorService.getMMUCasesheetData).not.toHaveBeenCalled();
  });

  it('unknown service type makes no request', () => {
    const { component } = setup();
    component.serviceType = 'OTHER';
    component.getCasesheetData({});
    expect(doctorService.getTMCasesheetData).not.toHaveBeenCalled();
    expect(doctorService.getMMUCasesheetData).not.toHaveBeenCalled();
  });

  it('ignores non-200 responses', () => {
    const { component } = setup();
    doctorService.getTMCasesheetData.and.returnValue(of({ statusCode: 500 }));
    doctorService.getMMUCasesheetData.and.returnValue(
      of({ statusCode: 200, data: null }),
    );
    component.getTMCasesheetData({});
    component.getMMUCasesheetData({});
    expect(component.caseSheetData).toBeUndefined();
  });

  it('unrecognised printablePage makes no request', () => {
    const { component } = setup({ printablePage: 'other' });
    component.serviceType = 'TM';
    component.ngOnInit();
    expect(doctorService.getTMCasesheetData).not.toHaveBeenCalled();
    expect(component.visitCategory).toBeUndefined();
  });

  it('ngOnDestroy unsubscribes from the case sheet subscription', () => {
    const { component } = setup();
    component.serviceType = 'TM';
    component.getCasesheetData({});
    const sub = component.casesheetSubs;
    spyOn(sub, 'unsubscribe').and.callThrough();
    component.ngOnDestroy();
    expect(sub.unsubscribe).toHaveBeenCalled();
  });

  it('ngOnDestroy without a subscription does nothing', () => {
    const { component } = setup();
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('falls back to session language set', () => {
    const { component } = setup({}, { currentLanguageSet: { k: 'v' } });
    const http: any = TestBed.inject(HttpServiceService);
    http.appCurrentLanguge.next(undefined);
    component.ngDoCheck();
    expect(component.current_language_set).toEqual({ k: 'v' });
  });

  it('selectPrintPage opens dialog and applies the selection', () => {
    const { component } = setup();
    component.visitCategory = 'ANC';
    const result: any = {};
    Object.keys(component.printPagePreviewSelect).forEach(
      (k) => (result[k] = false),
    );
    const dialog: any = TestBed.inject(MatDialog);
    dialog.open.and.returnValue(createDialogRefMock(result));
    component.selectPrintPage();
    expect(dialog.open).toHaveBeenCalledWith(PrintPageSelectComponent, {
      width: '520px',
      disableClose: false,
      data: {
        printPagePreviewSelect: component.printPagePreviewSelect,
        visitCategory: 'ANC',
      },
    });
    Object.values(component.printPagePreviewSelect).forEach((v) =>
      expect(v).toBeFalse(),
    );
  });

  it('selectPrintPage keeps selection when dialog is dismissed', () => {
    const { component } = setup();
    const dialog: any = TestBed.inject(MatDialog);
    dialog.open.and.returnValue(createDialogRefMock(undefined));
    component.selectPrintPage();
    Object.values(component.printPagePreviewSelect).forEach((v) =>
      expect(v).toBeTrue(),
    );
  });

  it('downloadCasesheet prints, goBack navigates back, goToTop scrolls', () => {
    const { component } = setup();
    const print = spyOn(window, 'print');
    const scroll = spyOn(window, 'scrollTo');
    component.downloadCasesheet();
    component.goBack();
    component.goToTop();
    expect(print).toHaveBeenCalled();
    expect(location.back).toHaveBeenCalled();
    expect(scroll).toHaveBeenCalledWith(0, 0);
  });
});
