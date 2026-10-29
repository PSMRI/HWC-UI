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

import { DevelopmentHistoryComponent } from './development-history.component';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../../shared/services';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { PreviousDetailsComponent } from 'src/app/app-modules/core/components/previous-details/previous-details.component';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

describe('DevelopmentHistoryComponent', () => {
  let component: DevelopmentHistoryComponent;
  let fixture: ComponentFixture<DevelopmentHistoryComponent>;
  let masterData$: BehaviorSubject<any>;
  let history$: BehaviorSubject<any>;
  let nurseService: any;
  let confirmation: any;
  let dialog: any;
  let session: any;

  beforeEach(async () => {
    masterData$ = new BehaviorSubject<any>(null);
    history$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [DevelopmentHistoryComponent],
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
      .overrideTemplate(DevelopmentHistoryComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(DevelopmentHistoryComponent);
    component = fixture.componentInstance;
    component.developmentHistoryForm = new FormGroup({
      grossMotorMilestones: new FormControl([]),
      fineMotorMilestones: new FormControl([]),
      socialMilestones: new FormControl([]),
      languageMilestones: new FormControl([]),
      developmentProblems: new FormControl(null),
    });
    nurseService = TestBed.inject(NurseService);
    confirmation = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    session = TestBed.inject(SessionStorageService);
  });

  it('sets language on init and ignores empty master data', () => {
    const spy = spyOn(component, 'getGeneralHistory');
    fixture.detectChanges();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.masterData).toBeUndefined();
    expect(spy).not.toHaveBeenCalled();
  });

  it('stores master data and does not load history in edit mode', () => {
    component.mode = 'edit';
    const spy = spyOn(component, 'getGeneralHistory');
    fixture.detectChanges();
    masterData$.next({ a: 1 });
    expect(component.masterData).toEqual({ a: 1 });
    expect(spy).not.toHaveBeenCalled();
  });

  it('loads history in view mode', () => {
    component.mode = 'view';
    const spy = spyOn(component, 'getGeneralHistory');
    fixture.detectChanges();
    masterData$.next({ a: 1 });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('loads history for specialist flag 100', () => {
    session.setItem('specialistFlag', '100');
    const spy = spyOn(component, 'getGeneralHistory');
    fixture.detectChanges();
    masterData$.next({ a: 1 });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('getGeneralHistory patches the form with DevelopmentHistory', () => {
    component.getGeneralHistory();
    history$.next({
      statusCode: 200,
      data: { DevelopmentHistory: { developmentProblems: 'delay' } },
    });
    expect(component.developmentHistoryData).toEqual({
      developmentProblems: 'delay',
    });
    expect(component.developmentHistoryForm.value.developmentProblems).toBe(
      'delay',
    );
  });

  it('getGeneralHistory ignores responses without DevelopmentHistory', () => {
    component.getGeneralHistory();
    history$.next({ statusCode: 200, data: {} });
    history$.next({ statusCode: 5000, data: null });
    expect(component.developmentHistoryData).toBeUndefined();
  });

  describe('getPreviousDevelopmentalHistory', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.visitCategory = 'PNC';
    });

    it('opens dialog when data exists', () => {
      const data = { data: [{ x: 1 }] };
      nurseService.getPreviousDevelopmentalHistory.and.returnValue(
        of({ data }),
      );
      component.getPreviousDevelopmentalHistory();
      expect(nurseService.getPreviousDevelopmentalHistory).toHaveBeenCalledWith(
        'B1',
        'PNC',
      );
      expect(dialog.open).toHaveBeenCalledWith(PreviousDetailsComponent, {
        data: {
          dataList: data,
          title:
            LANGUAGE_EN.historyData.Perinatalhistorydetails
              .developmentalhistorydetails,
        },
      });
    });

    it('alerts when no previous data', () => {
      nurseService.getPreviousDevelopmentalHistory.and.returnValue(
        of({ data: { data: [] } }),
      );
      component.getPreviousDevelopmentalHistory();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.historyData.ancHistory.previousHistoryDetails
          .pastHistoryalert,
      );
    });

    it('alerts error for null data', () => {
      nurseService.getPreviousDevelopmentalHistory.and.returnValue(
        of({ data: null }),
      );
      component.getPreviousDevelopmentalHistory();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.errorFetchingHistory,
        'error',
      );
    });

    it('alerts error on failure', () => {
      nurseService.getPreviousDevelopmentalHistory.and.returnValue(
        throwingObs(),
      );
      component.getPreviousDevelopmentalHistory();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.errorFetchingHistory,
        'error',
      );
    });
  });

  it('milestone reset handlers leave the form untouched', () => {
    const before = component.developmentHistoryForm.value;
    component.resetGrossMotorMilestoneAttaintedStatus();
    component.resetfineMotorMilestonesAttaintedStatus();
    component.resetsocialMilestonesAttaintedStatus();
    component.resetlanguageMilestonesAttaintedStatus();
    component.developmentHistoryForm.patchValue({
      grossMotorMilestones: ['a'],
      fineMotorMilestones: ['a'],
      socialMilestones: ['a'],
      languageMilestones: ['a'],
    });
    component.resetGrossMotorMilestoneAttaintedStatus();
    component.resetfineMotorMilestonesAttaintedStatus();
    component.resetsocialMilestonesAttaintedStatus();
    component.resetlanguageMilestonesAttaintedStatus();
    expect(before.grossMotorMilestones).toEqual([]);
    expect(component.developmentHistoryForm.value.socialMilestones).toEqual([
      'a',
    ]);
  });

  it('unsubscribes on destroy', () => {
    fixture.detectChanges();
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
