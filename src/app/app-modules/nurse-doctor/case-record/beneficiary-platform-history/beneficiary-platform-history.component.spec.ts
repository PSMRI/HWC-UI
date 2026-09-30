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
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';
import { environment } from 'src/environments/environment';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { DoctorService } from '../../shared/services';
import { CaseSheetComponent } from '../../case-sheet/case-sheet.component';
import { BeneficiaryMctsCallHistoryComponent } from '../beneficiary-mcts-call-history/beneficiary-mcts-call-history.component';
import { BeneficiaryPlatformHistoryComponent } from './beneficiary-platform-history.component';

describe('BeneficiaryPlatformHistoryComponent', () => {
  let component: BeneficiaryPlatformHistoryComponent;
  let fixture: ComponentFixture<BeneficiaryPlatformHistoryComponent>;
  let doctor: any;
  let confirm: any;
  let dialog: any;
  let session: any;

  const states = [
    { serviceID: 1, serviceName: 'MMU' },
    { serviceID: 2, serviceName: 'MMU2' },
    { serviceID: 3, serviceName: '104' },
    { serviceID: 4, serviceName: 'TM' },
    { serviceID: 5, serviceName: 'X' },
  ];

  beforeEach(async () => {
    doctor = autoSpy(DoctorService);
    doctor.getServiceOnState.and.returnValue(
      of({ statusCode: 200, data: states.map((s) => ({ ...s })) }),
    );
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [BeneficiaryPlatformHistoryComponent],
      providers: [
        ...commonTestProviders(),
        { provide: DoctorService, useValue: doctor },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    spyOn(console, 'log');
    fixture = TestBed.createComponent(BeneficiaryPlatformHistoryComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    session = TestBed.inject(SessionStorageService);
  });

  afterEach(() => fixture.destroy());

  it('ngOnInit loads services excluding IDs 1 and 5 and sets language', () => {
    fixture.detectChanges();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
    expect(component.serviceOnState).toEqual([
      { serviceID: 2, serviceName: 'MMU2', serviceLoaded: false },
      { serviceID: 3, serviceName: '104', serviceLoaded: false },
      { serviceID: 4, serviceName: 'TM', serviceLoaded: false },
    ]);
  });

  it('keeps services empty when state services call fails status', () => {
    doctor.getServiceOnState.and.returnValue(of({ statusCode: 500 }));
    component.ngOnInit();
    expect(component.serviceOnState).toEqual([]);
  });

  it('ngDoCheck re-assigns language', () => {
    component.current_language_set = null;
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  describe('getServiceHistory dispatch', () => {
    [
      [2, 'getMMUHistory'],
      [3, 'get104History'],
      [4, 'getTMHistory'],
      [6, 'getMCTSHistory'],
      [9, 'getHWCHistory'],
    ].forEach(([id, method]) => {
      it(`service ${id} calls ${method}`, () => {
        const spy = spyOn(component as any, method as string);
        component.getServiceHistory(id);
        expect(spy).toHaveBeenCalled();
      });
    });
  });

  function rows(n: number, key = 'VisitCategory') {
    return Array.from({ length: n }, (_, i) => ({
      [key]: i % 2 ? 'ANC' : 'General OPD',
      visitCode: i + 1,
    }));
  }

  describe('MMU history', () => {
    beforeEach(() => component.ngOnInit());

    it('loads history, marks service loaded and pages the list', () => {
      const data = rows(7);
      doctor.getMMUHistory.and.returnValue(of({ statusCode: 200, data }));
      component.getMMUHistory();
      expect(component.hideMMUFetch).toBeTrue();
      expect(
        component.serviceOnState.find((s: any) => s.serviceID === 2)
          .serviceLoaded,
      ).toBeTrue();
      expect(component.dataSource.data).toBe(data);
      expect(component.previousMMUHistoryPagedList.length).toBe(5);
    });

    it('alerts on bad status and error', () => {
      doctor.getMMUHistory.and.returnValue(of({ statusCode: 500 }));
      component.getMMUHistory();
      doctor.getMMUHistory.and.returnValue(throwingObs());
      component.getMMUHistory();
      expect(confirm.alert).toHaveBeenCalledTimes(2);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.unableToLoadData,
        'error',
      );
    });

    it('filterMMUHistory filters by visit category and resets page', () => {
      component.historyOfMMU = rows(6);
      component.previousMMUHistoryActivePage = 3;
      component.filterMMUHistory('anc');
      expect(component.filteredMMUHistory.length).toBe(3);
      expect(component.previousMMUHistoryActivePage).toBe(1);
      component.filterMMUHistory();
      expect(component.filteredMMUHistory.length).toBe(6);
      expect(component.previousMMUHistoryPagedList.length).toBe(5);
    });
  });

  describe('MCTS history', () => {
    beforeEach(() => component.ngOnInit());

    it('loads history into the table', () => {
      const data = [{ mctsOutboundCall: { displayOBCallType: 'ANC' } }];
      doctor.getMCTSHistory.and.returnValue(of({ statusCode: 200, data }));
      component.getMCTSHistory();
      expect(component.hideMCTSFetch).toBeTrue();
      expect(component.historyOfMCTS.data).toEqual(data);
      expect(component.previousMCTSHistoryPagedList).toEqual(data);
    });

    it('alerts on bad status and error', () => {
      doctor.getMCTSHistory.and.returnValue(of({ statusCode: 500 }));
      component.getMCTSHistory();
      doctor.getMCTSHistory.and.returnValue(throwingObs());
      component.getMCTSHistory();
      expect(confirm.alert).toHaveBeenCalledTimes(2);
    });

    it('filterMCTSHistory filters by call type', () => {
      component.historyOfMCTS.data = [
        { mctsOutboundCall: { displayOBCallType: 'ANC Call' } },
        { mctsOutboundCall: { displayOBCallType: 'PNC Call' } },
      ];
      component.filterMCTSHistory('pnc');
      expect(component.filteredMCTSHistory.length).toBe(1);
      expect(component.previousMCTSHistoryPagedList.length).toBe(1);
    });

    it('filterMCTSHistory without a term throws (assigns the data source, not an array)', () => {
      // Production bug: filteredMCTSHistory is set to the MatTableDataSource, which has no slice().
      expect(() => component.filterMCTSHistory()).toThrowError(TypeError);
      expect(component.filteredMCTSHistory).toBe(component.historyOfMCTS);
    });
  });

  describe('104 history', () => {
    beforeEach(() => component.ngOnInit());

    it('loads history and marks 104 loaded', () => {
      const data = [{ diseaseSummary: 'Fever' }];
      doctor.get104History.and.returnValue(of({ statusCode: 200, data }));
      component.get104History();
      expect(component.hide104Fetch).toBeTrue();
      expect(
        component.serviceOnState.find((s: any) => s.serviceID === 3)
          .serviceLoaded,
      ).toBeTrue();
      expect(component.previous104HistoryPagedList).toEqual(data);
    });

    it('alerts on bad status and error', () => {
      doctor.get104History.and.returnValue(of({ statusCode: 500 }));
      component.get104History();
      doctor.get104History.and.returnValue(throwingObs());
      component.get104History();
      expect(confirm.alert).toHaveBeenCalledTimes(2);
    });

    it('filter104History filters by disease summary', () => {
      component.historyOf104.data = [
        { diseaseSummary: 'Fever' },
        { diseaseSummary: 'Cough' },
      ];
      component.filter104History('cou');
      expect(component.filtered104History).toEqual([
        { diseaseSummary: 'Cough' },
      ]);
    });

    it('filter104History without a term throws (data source bug)', () => {
      expect(() => component.filter104History('')).toThrowError(TypeError);
    });
  });

  describe('TM history', () => {
    beforeEach(() => component.ngOnInit());

    it('loads history and pages it', () => {
      const data = rows(3);
      doctor.getTMHistory.and.returnValue(of({ statusCode: 200, data }));
      component.getTMHistory();
      expect(component.hideTMFetch).toBeTrue();
      expect(component.previousTMHistoryPagedList.length).toBe(3);
    });

    it('alerts on bad status and error', () => {
      doctor.getTMHistory.and.returnValue(of({ statusCode: 500 }));
      component.getTMHistory();
      doctor.getTMHistory.and.returnValue(throwingObs());
      component.getTMHistory();
      expect(confirm.alert).toHaveBeenCalledTimes(2);
    });

    it('filterTMHistory filters by category (and re-appends matches to the table data)', () => {
      component.historyOfTM.data = rows(4);
      component.filterTMHistory('ANC');
      expect(component.filteredTMHistory.length).toBe(2);
      // Production quirk: matched rows are pushed again onto historyOfTM.data.
      expect(component.historyOfTM.data.length).toBe(6);
      component.filterTMHistory();
      expect(component.filteredTMHistory).toBe(component.historyOfTM.data);
    });
  });

  describe('HWC history', () => {
    beforeEach(() => component.ngOnInit());

    it('loads history then fetches each visit case sheet', () => {
      const data = [
        {
          visitCode: 10,
          VisitCategory: 'ANC',
          benFlowID: 1,
          beneficiaryRegID: 2,
        },
        { visitCode: null },
      ];
      doctor.getTMHistory.and.returnValue(of({ statusCode: 200, data }));
      doctor.getTMCasesheetData.and.returnValue(
        of({ statusCode: 200, data: { cs: 1 } }),
      );
      component.getHWCHistory();
      expect(component.hideHWCFetch).toBeTrue();
      expect(doctor.getTMCasesheetData).toHaveBeenCalledOnceWith({
        VisitCategory: 'ANC',
        benFlowID: 1,
        beneficiaryRegID: 2,
        visitCode: 10,
      });
      expect(component.historyOfHWC.data[0].benPreviousData).toEqual({
        cs: 1,
      });
      expect(component.filteredHWCHistory).toEqual({ cs: 1 });
      expect(component.previousHWCHistoryPagedList.length).toBe(2);
    });

    it('ignores empty case sheet response', () => {
      component.historyOfHWC.data = [{ visitCode: 1 }];
      doctor.getTMCasesheetData.and.returnValue(
        of({ statusCode: 200, data: null }),
      );
      component.getEachVisitData();
      expect(component.historyOfHWC.data[0].benPreviousData).toBeUndefined();
    });

    it('alerts on bad status and error', () => {
      doctor.getTMHistory.and.returnValue(of({ statusCode: 500 }));
      component.getHWCHistory();
      doctor.getTMHistory.and.returnValue(throwingObs());
      component.getHWCHistory();
      expect(confirm.alert).toHaveBeenCalledTimes(2);
    });

    it('filterHWCHistory filters and resets paging', () => {
      component.historyOfHWC.data = rows(2);
      component.filterHWCHistory('general');
      expect(component.filteredHWCHistory.length).toBe(1);
      expect(component.previousHWCHistoryActivePage).toBe(1);
      component.filterHWCHistory();
      expect(component.filteredHWCHistory).toBe(component.historyOfHWC.data);
    });
  });

  describe('getVisitDetails', () => {
    const visit = {
      visitCode: 'VC',
      benFlowID: 'BF',
      VisitCategory: 'ANC',
      beneficiaryRegID: 'BR',
    };

    beforeEach(() => component.ngOnInit());

    it('stores case sheet keys and opens the case sheet dialog', () => {
      component.getVisitDetails('MMU', visit, false);
      expect(confirm.confirm).toHaveBeenCalledWith(
        'info',
        LANGUAGE_EN.alerts.info.viewCasesheet,
      );
      expect(session.setItem).toHaveBeenCalledWith(
        'previousCaseSheetVisitCode',
        'VC',
      );
      expect(session.setItem).toHaveBeenCalledWith(
        'previousCaseSheetBenFlowID',
        'BF',
      );
      expect(session.setItem).toHaveBeenCalledWith(
        'previousCaseSheetVisitCategory',
        'ANC',
      );
      expect(session.setItem).toHaveBeenCalledWith(
        'previousCaseSheetBeneficiaryRegID',
        'BR',
      );
      expect(dialog.open).toHaveBeenCalledWith(CaseSheetComponent, {
        disableClose: true,
        width: '95%',
        panelClass: 'preview-casesheet',
        data: { previous: true, serviceType: 'MMU' },
      });
    });

    it('opens the print page in a new tab when printing', () => {
      const open = spyOn(window, 'open');
      component.getVisitDetails('TM', visit, true);
      expect(open).toHaveBeenCalledWith(
        environment.newTaburl + '#/nurse-doctor/print/TM/previous',
      );
      expect(dialog.open).not.toHaveBeenCalled();
    });

    it('does nothing when declined', () => {
      confirm.confirm.and.returnValue(of(false));
      component.getVisitDetails('TM', visit, false);
      expect(session.setItem).not.toHaveBeenCalled();
      expect(dialog.open).not.toHaveBeenCalled();
    });
  });

  describe('MCTS call details', () => {
    it('opens call details dialog on success', () => {
      doctor.getPatientMCTSCallHistory.and.returnValue(
        of({ statusCode: 200, data: { calls: [] } }),
      );
      component.getPatientMCTSCallHistory({ callDetailID: 5, other: 1 });
      expect(doctor.getPatientMCTSCallHistory).toHaveBeenCalledWith({
        callDetailID: 5,
      });
      expect(dialog.open).toHaveBeenCalledWith(
        BeneficiaryMctsCallHistoryComponent,
        {
          width: '70%',
          panelClass: 'preview-casesheet',
          data: { calls: [] },
        },
      );
    });

    it('does not open dialog on failure status', () => {
      doctor.getPatientMCTSCallHistory.and.returnValue(of({ statusCode: 500 }));
      component.getPatientMCTSCallHistory({ callDetailID: 5 });
      expect(dialog.open).not.toHaveBeenCalled();
    });

    it('showCallDetails handles a truthy close result', () => {
      dialog.open.and.returnValue({ afterClosed: () => of(true) });
      expect(() => component.showCallDetails({})).not.toThrow();
    });
  });

  it('checkServiceLoader only flags the matching service', () => {
    const services = [
      { serviceID: 2, serviceLoaded: false },
      { serviceID: 3, serviceLoaded: false },
    ];
    component.checkServiceLoader(services, 3);
    expect(services.map((s) => s.serviceLoaded)).toEqual([false, true]);
  });
});
