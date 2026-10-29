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
import { FormControl, FormGroup } from '@angular/forms';
import { BehaviorSubject, of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import { MenstrualHistoryComponent } from './menstrual-history.component';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../../shared/services';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { AmritTrackingService } from 'Common-UI/src/tracking';
import { PreviousDetailsComponent } from 'src/app/app-modules/core/components/previous-details/previous-details.component';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

const MASTER = {
  menstrualCycleStatus: [
    { name: 'Active', menstrualCycleStatusID: 1 },
    { name: 'Amenorrhea', menstrualCycleStatusID: 2 },
  ],
  menstrualCycleLengths: [{ menstrualCycleRange: '21-35 days' }],
  menstrualCycleBloodFlowDuration: [{ menstrualCycleRange: '3-5 days' }],
  menstrualProblem: [{ problemName: 'None' }, { problemName: 'Dysmenorrhea' }],
};

function buildForm() {
  return new FormGroup({
    menstrualCycleStatus: new FormControl(null),
    menstrualCycleStatusID: new FormControl(null),
    regularity: new FormControl(null),
    cycleLength: new FormControl(null),
    menstrualCyclelengthID: new FormControl(null),
    menstrualFlowDurationID: new FormControl(null),
    bloodFlowDuration: new FormControl(null),
    menstrualProblemID: new FormControl(null),
    problemName: new FormControl(null),
    menstrualProblemList: new FormControl([]),
    lMPDate: new FormControl(null),
  });
}

describe('MenstrualHistoryComponent', () => {
  let component: MenstrualHistoryComponent;
  let fixture: ComponentFixture<MenstrualHistoryComponent>;
  let masterData$: BehaviorSubject<any>;
  let history$: BehaviorSubject<any>;
  let nurseService: any;
  let confirmation: any;
  let dialog: any;
  let session: any;
  let tracking: any;

  beforeEach(async () => {
    masterData$ = new BehaviorSubject<any>(null);
    history$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [MenstrualHistoryComponent],
      providers: [
        ...commonTestProviders({ session: { beneficiaryRegID: 'B1' } }),
        {
          provide: MasterdataService,
          useValue: autoSpy(MasterdataService, {
            nurseMasterData$: masterData$.asObservable(),
          }),
        },
        { provide: NurseService, useValue: autoSpy(NurseService) },
        {
          provide: DoctorService,
          useValue: autoSpy(DoctorService, {
            populateHistoryResponse$: history$.asObservable(),
          }),
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(MenstrualHistoryComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(MenstrualHistoryComponent);
    component = fixture.componentInstance;
    component.menstrualHistoryForm = buildForm();
    nurseService = TestBed.inject(NurseService);
    confirmation = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    session = TestBed.inject(SessionStorageService);
    tracking = TestBed.inject(AmritTrackingService);
  });

  it('initialises language and LMP date bounds', () => {
    fixture.detectChanges();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.today instanceof Date).toBeTrue();
    const diff = component.today.getTime() - component.minimumLMPDate.getTime();
    expect(diff).toBe(365 * 24 * 60 * 60 * 1000);
  });

  it('ignores incomplete master data', () => {
    fixture.detectChanges();
    masterData$.next({ menstrualCycleStatus: [] });
    expect(component.masterData).toBeUndefined();
  });

  it('for ANC sets Amenorrhea and disables LMP date', () => {
    component.visitCategory = 'ANC';
    const spy = spyOn(component, 'getGeneralHistory');
    fixture.detectChanges();
    masterData$.next(MASTER);
    expect(component.masterData).toBe(MASTER);
    expect(component.menstrualCycleStatus).toEqual(
      MASTER.menstrualCycleStatus[1],
    );
    expect(component.menstrualHistoryForm.get('lMPDate')?.disabled).toBeTrue();
    expect(spy).not.toHaveBeenCalled();
  });

  it('for non-ANC enables LMP date', () => {
    component.visitCategory = 'General OPD';
    component.menstrualHistoryForm.get('lMPDate')?.disable();
    fixture.detectChanges();
    masterData$.next(MASTER);
    expect(component.menstrualHistoryForm.get('lMPDate')?.enabled).toBeTrue();
  });

  it('loads history in view mode', () => {
    component.mode = 'view';
    const spy = spyOn(component, 'getGeneralHistory');
    fixture.detectChanges();
    masterData$.next(MASTER);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('loads history for specialist flag 100', () => {
    session.setItem('specialistFlag', '100');
    const spy = spyOn(component, 'getGeneralHistory');
    fixture.detectChanges();
    masterData$.next(MASTER);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  describe('getGeneralHistory', () => {
    beforeEach(() => (component.masterData = MASTER));

    it('maps master values and patches the form', () => {
      component.getGeneralHistory();
      history$.next({
        statusCode: 200,
        data: {
          MenstrualHistory: {
            menstrualCycleStatus: 'Active',
            cycleLength: '21-35 days',
            bloodFlowDuration: '3-5 days',
            menstrualProblemList: [{ problemName: 'None' }],
            lMPDate: '2026-01-15T00:00:00.000Z',
          },
        },
      });
      const v = component.menstrualHistoryForm.value;
      expect(v.menstrualCycleStatus).toEqual(MASTER.menstrualCycleStatus[0]);
      expect(v.cycleLength).toEqual(MASTER.menstrualCycleLengths[0]);
      expect(v.bloodFlowDuration).toEqual(
        MASTER.menstrualCycleBloodFlowDuration[0],
      );
      expect(v.menstrualProblemList).toEqual([MASTER.menstrualProblem[0]]);
      expect(v.lMPDate instanceof Date).toBeTrue();
      expect(component.disableNoneMenstrualProblem).toBeTrue();
    });

    it('handles empty problem list', () => {
      component.getGeneralHistory();
      history$.next({
        statusCode: 200,
        data: {
          MenstrualHistory: {
            menstrualCycleStatus: 'Active',
            menstrualProblemList: [],
          },
        },
      });
      expect(component.menstrualHistoryForm.value.menstrualProblemList).toEqual(
        [],
      );
      expect(component.disableNoneMenstrualProblem).toBeFalse();
    });

    it('ignores response without MenstrualHistory', () => {
      component.getGeneralHistory();
      history$.next({ statusCode: 200, data: {} });
      expect(
        component.menstrualHistoryForm.value.menstrualCycleStatus,
      ).toBeNull();
    });
  });

  describe('getPreviousMenstrualHistory', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.visitCategory = 'ANC';
    });

    it('opens dialog when data exists', () => {
      const data = { data: [{ a: 1 }] };
      nurseService.getPreviousMenstrualHistory.and.returnValue(
        of({ statusCode: 200, data }),
      );
      component.getPreviousMenstrualHistory();
      expect(nurseService.getPreviousMenstrualHistory).toHaveBeenCalledWith(
        'B1',
        'ANC',
      );
      expect(dialog.open).toHaveBeenCalledWith(PreviousDetailsComponent, {
        data: {
          dataList: data,
          title:
            LANGUAGE_EN.historyData.Previousmenstrualhistory
              .previousmenstrualhistory,
        },
      });
    });

    it('alerts when empty', () => {
      nurseService.getPreviousMenstrualHistory.and.returnValue(
        of({ statusCode: 200, data: { data: [] } }),
      );
      component.getPreviousMenstrualHistory();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.pastHistoryNot,
      );
    });

    it('alerts error on non-200', () => {
      nurseService.getPreviousMenstrualHistory.and.returnValue(
        of({ statusCode: 5000, data: null }),
      );
      component.getPreviousMenstrualHistory();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.errorFetchingHistory,
        'error',
      );
    });

    it('alerts error on failure', () => {
      nurseService.getPreviousMenstrualHistory.and.returnValue(throwingObs());
      component.getPreviousMenstrualHistory();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.errorFetchingHistory,
        'error',
      );
    });
  });

  describe('checkMenstrualCycleStatus', () => {
    beforeEach(() => {
      component.menstrualHistoryForm.patchValue({
        regularity: 'Regular',
        problemName: 'x',
        lMPDate: new Date(),
      });
    });

    it('keeps LMP date for ANC', () => {
      component.visitCategory = 'ANC';
      component.checkMenstrualCycleStatus();
      expect(component.menstrualHistoryForm.value.regularity).toBeNull();
      expect(component.lMPDate).not.toBeNull();
    });

    it('clears LMP date otherwise', () => {
      component.visitCategory = 'PNC';
      component.checkMenstrualCycleStatus();
      expect(component.menstrualHistoryForm.value.problemName).toBeNull();
      expect(component.lMPDate).toBeNull();
    });
  });

  it('resetOtherMenstrualProblems flags None only when present', () => {
    component.menstrualHistoryForm.patchValue({
      menstrualProblemList: [{ problemName: 'Dysmenorrhea' }],
    });
    component.resetOtherMenstrualProblems();
    expect(component.disableNoneMenstrualProblem).toBeFalse();
    component.menstrualHistoryForm.patchValue({
      menstrualProblemList: [{ problemName: 'None' }],
    });
    component.resetOtherMenstrualProblems();
    expect(component.disableNoneMenstrualProblem).toBeTrue();
  });

  it('trackFieldInteraction delegates to tracking service', () => {
    component.trackFieldInteraction('LMP');
    expect(tracking.trackFieldInteraction).toHaveBeenCalledWith(
      'LMP',
      'Menstrual History',
    );
  });

  it('unsubscribes on destroy', () => {
    fixture.detectChanges();
    component.masterData = MASTER;
    component.getGeneralHistory();
    const s1 = spyOn(component.nurseMasterDataSubscription, 'unsubscribe');
    const s2 = spyOn(component.generalHistorySubscription, 'unsubscribe');
    component.ngOnDestroy();
    expect(s1).toHaveBeenCalled();
    expect(s2).toHaveBeenCalled();
  });

  it('ngOnDestroy without subscriptions does not throw', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('ngDoCheck assigns language', () => {
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });
});
