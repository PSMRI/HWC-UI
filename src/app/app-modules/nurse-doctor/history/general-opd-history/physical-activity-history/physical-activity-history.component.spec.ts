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

import { PhysicalActivityHistoryComponent } from './physical-activity-history.component';
import { IdrsscoreService } from '../../../shared/services/idrsscore.service';
import {
  BeneficiaryDetailsService,
  ConfirmationService,
} from 'src/app/app-modules/core/services';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../../shared/services';
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

const QUESTIONS = [
  { pAID: 1, activityType: 'Vigorous', score: 0 },
  { pAID: 2, activityType: 'Mild', score: 20 },
];

describe('PhysicalActivityHistoryComponent', () => {
  let component: PhysicalActivityHistoryComponent;
  let fixture: ComponentFixture<PhysicalActivityHistoryComponent>;
  let masterData$: BehaviorSubject<any>;
  let history$: BehaviorSubject<any>;
  let beneficiary$: BehaviorSubject<any>;
  let idrs: any;
  let nurseService: any;
  let confirmation: any;
  let dialog: any;
  let session: any;

  beforeEach(async () => {
    masterData$ = new BehaviorSubject<any>(null);
    history$ = new BehaviorSubject<any>(null);
    beneficiary$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [PhysicalActivityHistoryComponent],
      providers: [
        ...commonTestProviders({ session: { beneficiaryRegID: 'B1' } }),
        { provide: IdrsscoreService, useValue: autoSpy(IdrsscoreService) },
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
        {
          provide: BeneficiaryDetailsService,
          useValue: autoSpy(BeneficiaryDetailsService, {
            beneficiaryDetails$: beneficiary$.asObservable(),
          }),
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(PhysicalActivityHistoryComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(PhysicalActivityHistoryComponent);
    component = fixture.componentInstance;
    component.physicalActivityHistory = new FormGroup({
      pAID: new FormControl(null),
      activityType: new FormControl(null),
      physicalActivityType: new FormControl(null),
      score: new FormControl(null),
    });
    idrs = TestBed.inject(IdrsscoreService);
    nurseService = TestBed.inject(NurseService);
    confirmation = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    session = TestBed.inject(SessionStorageService);
  });

  it('initialises language and does nothing without master data', () => {
    const spy = spyOn(component, 'getGeneralHistory');
    fixture.detectChanges();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.masterData).toBeUndefined();
    expect(spy).not.toHaveBeenCalled();
  });

  it('stores physical activity questions from master data', () => {
    fixture.detectChanges();
    masterData$.next({ physicalActivity: QUESTIONS });
    expect(component.physicalActivityQuestions).toEqual(QUESTIONS);
  });

  it('loads history in view mode for NCD screening visit', () => {
    session.setItem('visitID', 'V1');
    session.setItem('visitCategory', 'NCD screening');
    component.mode = 'view';
    const spy = spyOn(component, 'getGeneralHistory');
    fixture.detectChanges();
    masterData$.next({ physicalActivity: QUESTIONS });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('does not load history in view mode for other visit categories', () => {
    session.setItem('visitID', 'V1');
    session.setItem('visitCategory', 'ANC');
    component.mode = 'view';
    const spy = spyOn(component, 'getGeneralHistory');
    fixture.detectChanges();
    masterData$.next({ physicalActivity: QUESTIONS });
    expect(spy).not.toHaveBeenCalled();
  });

  it('loads history for specialist flag 100', () => {
    session.setItem('specialistFlag', '100');
    const spy = spyOn(component, 'getGeneralHistory');
    fixture.detectChanges();
    masterData$.next({ physicalActivity: QUESTIONS });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('ngOnChanges in view mode keeps state unchanged', () => {
    component.mode = 'view';
    component.ngOnChanges();
    component.mode = 'edit';
    component.ngOnChanges();
    expect(component.physicalActivityHistoryData).toBeUndefined();
  });

  describe('getGeneralHistory', () => {
    beforeEach(() => {
      component.physicalActivityQuestions = QUESTIONS;
    });

    it('patches form and sets IDRS score for matching activity', () => {
      component.getGeneralHistory();
      history$.next({
        statusCode: 200,
        data: {
          FamilyHistory: {},
          PhysicalActivityHistory: { activityType: 'Mild', pAID: 2 },
        },
      });
      expect(component.physicalActivityHistory.value.activityType).toBe('Mild');
      expect(idrs.setIRDSscorePhysicalActivity).toHaveBeenCalledWith(20);
    });

    it('does not set score if no activity matches', () => {
      component.getGeneralHistory();
      history$.next({
        statusCode: 200,
        data: {
          FamilyHistory: {},
          PhysicalActivityHistory: { activityType: 'None' },
        },
      });
      expect(idrs.setIRDSscorePhysicalActivity).not.toHaveBeenCalled();
    });

    it('skips when physical activity history is missing', () => {
      const spy = spyOn(component, 'handlePysicalActivityHistoryData');
      component.getGeneralHistory();
      history$.next({ statusCode: 200, data: { FamilyHistory: {} } });
      expect(spy).not.toHaveBeenCalled();
    });

    it('skips when FamilyHistory is absent', () => {
      const spy = spyOn(component, 'handlePysicalActivityHistoryData');
      component.getGeneralHistory();
      history$.next({ statusCode: 200, data: {} });
      expect(spy).not.toHaveBeenCalled();
    });
  });

  it('calculateIDRSScore patches pAID/score and sets IDRS flags', () => {
    component.physicalActivityQuestions = QUESTIONS;
    component.calculateIDRSScore(
      { value: 'Mild' },
      component.physicalActivityHistory,
    );
    expect(component.physicalActivityHistory.value.pAID).toBe(2);
    expect(component.physicalActivityHistory.value.score).toBe(20);
    expect(idrs.setIRDSscorePhysicalActivity).toHaveBeenCalledWith(20);
    expect(idrs.setIDRSScoreFlag).toHaveBeenCalled();
  });

  describe('getPreviousPhysicalActivityHistory', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.visitType = 'NCD screening';
    });

    it('opens dialog when data exists', () => {
      const data = { data: [{ a: 1 }] };
      nurseService.getPreviousPhysicalActivityHistory.and.returnValue(
        of({ statusCode: 200, data }),
      );
      component.getPreviousPhysicalActivityHistory();
      expect(
        nurseService.getPreviousPhysicalActivityHistory,
      ).toHaveBeenCalledWith('B1', 'NCD screening');
      expect(dialog.open).toHaveBeenCalledWith(PreviousDetailsComponent, {
        data: {
          dataList: data,
          title: LANGUAGE_EN.previousPhyscialActivityHistoryDetails,
        },
      });
    });

    it('alerts when list is empty', () => {
      nurseService.getPreviousPhysicalActivityHistory.and.returnValue(
        of({ statusCode: 200, data: { data: [] } }),
      );
      component.getPreviousPhysicalActivityHistory();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.historyData.ancHistory.previousHistoryDetails
          .pastHistoryalert,
      );
    });

    it('alerts error on non-200', () => {
      nurseService.getPreviousPhysicalActivityHistory.and.returnValue(
        of({ statusCode: 5000, data: null }),
      );
      component.getPreviousPhysicalActivityHistory();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.errorFetchingHistory,
        'error',
      );
    });

    it('alerts error on failure', () => {
      nurseService.getPreviousPhysicalActivityHistory.and.returnValue(
        throwingObs(),
      );
      component.getPreviousPhysicalActivityHistory();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.errorFetchingHistory,
        'error',
      );
    });
  });

  describe('beneficiary age', () => {
    beforeEach(() => fixture.detectChanges());

    it('uses ageVal when present', () => {
      beneficiary$.next({ ageVal: 45 });
      expect(component.age).toBe(45);
    });

    it('defaults to 0 when ageVal missing', () => {
      beneficiary$.next({});
      expect(component.age).toBe(0);
    });
  });

  it('ngDoCheck assigns language', () => {
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });
});
