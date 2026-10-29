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
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, of } from 'rxjs';

import { PastHistoryComponent } from './past-history.component';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../../shared/services';
import { HrpService } from '../../../shared/services/hrp.service';
import { BeneficiaryDetailsService } from '../../../../core/services/beneficiary-details.service';
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

const illness = () => [
  { illnessID: 1, illnessType: 'Asthma' },
  { illnessID: 2, illnessType: 'Diabetes' },
  { illnessID: 3, illnessType: 'Nil' },
  { illnessID: 4, illnessType: 'None' },
  { illnessID: 5, illnessType: 'Other' },
];
const surgery = () => [
  { surgeryID: 1, surgeryType: 'Appendectomy' },
  { surgeryID: 2, surgeryType: 'Cesarean Section/LSCS' },
  { surgeryID: 3, surgeryType: 'Nil' },
  { surgeryID: 4, surgeryType: 'None' },
  { surgeryID: 5, surgeryType: 'Other' },
];

describe('PastHistoryComponent', () => {
  let component: PastHistoryComponent;
  let fixture: ComponentFixture<PastHistoryComponent>;
  let masterData$: BehaviorSubject<any>;
  let history$: BehaviorSubject<any>;
  let ben$: BehaviorSubject<any>;
  let nurse: any;
  let hrp: any;
  let confirm: any;
  let dialog: any;
  let session: any;
  let tracking: any;

  const ill = () => component.pastHistoryForm.get('pastIllness') as FormArray;
  const sur = () => component.pastHistoryForm.get('pastSurgery') as FormArray;

  beforeEach(async () => {
    masterData$ = new BehaviorSubject<any>(null);
    history$ = new BehaviorSubject<any>(null);
    ben$ = new BehaviorSubject<any>({
      age: '30 Years',
      ageVal: 30,
      genderName: 'Female',
    });
    hrp = autoSpy(HrpService, { checkHrpStatus: false });
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [PastHistoryComponent],
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
        { provide: HrpService, useValue: hrp },
        {
          provide: BeneficiaryDetailsService,
          useValue: autoSpy(BeneficiaryDetailsService, {
            beneficiaryDetails$: ben$.asObservable(),
          }),
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(PastHistoryComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(PastHistoryComponent);
    component = fixture.componentInstance;
    const fb = TestBed.inject(FormBuilder);
    component.pastHistoryForm = fb.group({
      pastIllness: new FormArray([]),
      pastSurgery: new FormArray([]),
    });
    component.visitCategory = 'General OPD';
    nurse = TestBed.inject(NurseService);
    confirm = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    session = TestBed.inject(SessionStorageService);
    tracking = TestBed.inject(AmritTrackingService);
  });

  const load = () => {
    fixture.detectChanges();
    masterData$.next({ illnessTypes: illness(), surgeryTypes: surgery() });
  };

  describe('init', () => {
    it('sets language, clears hrp illness and seeds rows', () => {
      load();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(hrp.setPastIllness).toHaveBeenCalledWith([]);
      expect(ill().length).toBe(1);
      expect(sur().length).toBe(1);
      expect(component.surgeryMasterData.length).toBe(5);
      expect(component.pastIllnessSelectList[0].length).toBe(5);
      expect(component.getPastIllness()?.length).toBe(1);
      expect(component.getPastSurgery()?.length).toBe(1);
    });

    it('removes female surgeries for male beneficiaries', () => {
      ben$.next({ age: '30 Years', ageVal: 30, genderName: 'Male' });
      load();
      expect(
        component.surgeryMasterData.map((s: any) => s.surgeryType),
      ).not.toContain('Cesarean Section/LSCS');
    });

    it('removes female surgeries for children', () => {
      ben$.next({ age: '5 Years', ageVal: 5, genderName: 'Female' });
      load();
      expect(component.surgeryMasterData.length).toBe(4);
    });

    it('ignores incomplete master data and null beneficiary', () => {
      fixture.detectChanges();
      ben$.next(null);
      masterData$.next({ illnessTypes: [] });
      expect(ill().length).toBe(0);
      expect(component.beneficiary.genderName).toBe('Female');
    });

    it('loads history in view mode and for specialist flag 100', () => {
      const spy = spyOn(component, 'getGeneralHistory');
      component.mode = 'view';
      session.setItem('specialistFlag', '100');
      load();
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('ngOnChanges is a no-op', () => {
      expect(() => component.ngOnChanges()).not.toThrow();
    });

    it('ngOnDestroy unsubscribes everything', () => {
      load();
      component.getGeneralHistory();
      const subs = [
        component.nurseMasterDataSubscription,
        component.generalHistorySubscription,
        component.beneficiaryDetailSubscription,
      ].map((s) => spyOn(s, 'unsubscribe'));
      component.ngOnDestroy();
      subs.forEach((s) => expect(s).toHaveBeenCalled());
    });

    it('list getters return null for non arrays', () => {
      component.pastHistoryForm = new FormBuilder().group({
        pastIllness: null,
        pastSurgery: null,
      });
      expect(component.getPastIllness()).toBeNull();
      expect(component.getPastSurgery()).toBeNull();
    });
  });

  describe('populating history', () => {
    it('patches illness and surgery rows from the history response', () => {
      component.mode = 'view';
      load();
      history$.next({
        statusCode: 200,
        data: {
          PastHistory: {
            pastIllness: [
              {
                illnessType: 'Asthma',
                timePeriodAgo: 2,
                timePeriodUnit: 'Years',
              },
              { illnessType: 'Unknown' },
              { illnessType: 'Diabetes', timePeriodAgo: null },
            ],
            pastSurgery: [
              {
                surgeryType: 'Appendectomy',
                timePeriodAgo: 1,
                timePeriodUnit: 'Years',
              },
              { surgeryType: 'Other', timePeriodAgo: null },
            ],
          },
        },
      });
      expect(ill().length).toBe(3);
      expect(ill().at(0).value.illnessType.illnessType).toBe('Asthma');
      expect(ill().at(0).get('timePeriodAgo')?.enabled).toBeTrue();
      expect(ill().at(2).get('timePeriodAgo')?.enabled).toBeFalse();
      expect(sur().length).toBe(2);
      expect(sur().at(0).value.surgeryType.surgeryType).toBe('Appendectomy');
      expect(component.illnessHRP).toContain('Asthma');
      expect(hrp.checkHrpStatus).toBeFalse();
    });

    it('ignores responses without past history', () => {
      load();
      component.getGeneralHistory();
      history$.next({ statusCode: 200, data: {} });
      expect(component.pastHistoryData).toBeUndefined();
    });

    it('handlers tolerate missing lists', () => {
      load();
      component.pastHistoryData = {};
      component.handlePastHistoryIllnessData();
      component.handlePastHistorySurgeryData();
      expect(ill().length).toBe(1);
    });

    it('filterPastIllnessTypeInDoctor with None removes other rows', () => {
      load();
      component.addPastIllness();
      const none = illness()[3];
      component.filterPastIllnessTypeInDoctor(
        none,
        0,
        ill().at(0) as FormGroup,
      );
      expect(ill().length).toBe(1);
      expect(component.illnessHRP).toContain('None');
    });

    it('filterPastIllnessTypeInDoctor restores a previous selection', () => {
      load();
      component.addPastIllness();
      const asthma = component.pastIllnessSelectList[1][0];
      component.filterPastIllnessTypeInDoctor(asthma, 0);
      expect(component.pastIllnessSelectList[1]).not.toContain(asthma);
      const diab = component.pastIllnessSelectList[1][0];
      component.filterPastIllnessTypeInDoctor(diab, 0);
      expect(component.pastIllnessSelectList[1]).toContain(asthma);
      component.filterPastIllnessTypeInDoctor({}, 0);
      expect(component.illnessHRP.length).toBe(2);
    });
  });

  describe('illness rows', () => {
    beforeEach(load);

    it('addPastIllness excludes used types and None once a row exists', () => {
      ill().at(0).patchValue({ illnessType: illness()[0] });
      component.addPastIllness();
      const types = component.pastIllnessSelectList[1].map(
        (i: any) => i.illnessType,
      );
      expect(types).not.toContain('Asthma');
      expect(types).not.toContain('None');
      expect(types).toContain('Other');
    });

    it('addPastIllness keeps Other available even if chosen', () => {
      ill()
        .at(0)
        .patchValue({ illnessType: { illnessType: 'Other' } });
      component.addPastIllness();
      expect(
        component.pastIllnessSelectList[1].map((i: any) => i.illnessType),
      ).toContain('Other');
    });

    it('addPastIllness without master only adds a row', () => {
      component.filteredIllnessMasterData = null;
      component.addPastIllness();
      expect(ill().length).toBe(2);
      expect(component.pastIllnessSelectList.length).toBe(1);
    });

    it('filterPastIllnessType enables time period and publishes hrp', () => {
      component.addPastIllness();
      const row = ill().at(0);
      row.patchValue({ otherIllnessType: 'x' });
      const asthma = component.pastIllnessSelectList[1][0];
      component.filterPastIllnessType(asthma, 0, row);
      expect(row.value.otherIllnessType).toBeNull();
      expect(row.get('timePeriodAgo')?.enabled).toBeTrue();
      expect(component.pastIllnessSelectList[1]).not.toContain(asthma);
      expect(hrp.setPastIllness).toHaveBeenCalledWith(['Asthma']);
      expect(hrp.checkHrpStatus).toBeTrue();

      const diab = component.pastIllnessSelectList[1][0];
      component.filterPastIllnessType(diab, 0, row);
      expect(component.pastIllnessSelectList[1]).toContain(asthma);
    });

    it('filterPastIllnessType with Nil disables time fields', () => {
      const row = ill().at(0);
      row.get('timePeriodAgo')?.enable();
      row.get('timePeriodUnit')?.enable();
      component.filterPastIllnessType({ illnessType: 'Nil' }, 0, row);
      expect(row.get('timePeriodAgo')?.disabled).toBeTrue();
      expect(row.get('timePeriodUnit')?.disabled).toBeTrue();
    });

    it('filterPastIllnessType with Other does not publish hrp', () => {
      hrp.setPastIllness.calls.reset();
      component.filterPastIllnessType({ illnessType: 'Other' }, 0, ill().at(0));
      expect(hrp.setPastIllness).not.toHaveBeenCalled();
    });

    it('filterPastIllnessType with None collapses the list', () => {
      component.addPastIllness();
      component.addPastIllness();
      component.previousSelectedIllnessTypeList[2] = illness()[1];
      component.filterPastIllnessType({ illnessType: 'None' }, 0, ill().at(0));
      expect(ill().length).toBe(1);
      expect(component.pastIllnessSelectList.length).toBe(1);
    });

    it('otherIlnessForHrp pushes other illness names', () => {
      ill().at(0).patchValue({ otherIllnessType: 'Gout' });
      component.otherIlnessForHrp();
      expect(hrp.setPastIllness).toHaveBeenCalledWith(['Gout']);
      expect(hrp.checkHrpStatus).toBeTrue();
    });

    it('removePastIllness resets the only row', () => {
      const row = ill().at(0);
      row.patchValue({ illnessType: illness()[0] });
      component.removePastIllness(0, row);
      expect(confirm.confirm).toHaveBeenCalledWith(
        'warn',
        LANGUAGE_EN.alerts.info.warn,
      );
      expect(row.value.illnessType).toBeNull();
      expect(row.get('timePeriodAgo')?.disabled).toBeTrue();
      expect(hrp.setPastIllness).toHaveBeenCalledWith([]);
    });

    it('removePastIllness at index 0 moves None to the next list', () => {
      component.addPastIllness();
      ill().at(1).patchValue({ illnessType: illness()[1] });
      component.previousSelectedIllnessTypeList[0] = illness()[0];
      component.removePastIllness(0, ill().at(0));
      expect(ill().length).toBe(1);
      expect(
        component.pastIllnessSelectList[0].map((i: any) => i.illnessType),
      ).toContain('None');
      expect(hrp.setPastIllness).toHaveBeenCalledWith(['Diabetes']);
      expect(hrp.checkHrpStatus).toBeTrue();
    });

    it('removePastIllness at index > 0 without a previous value', () => {
      component.addPastIllness();
      ill().at(0).patchValue({ illnessType: illness()[0] });
      component.removePastIllness(1, ill().at(1));
      expect(ill().length).toBe(1);
      expect(hrp.setPastIllness).toHaveBeenCalledWith(['Asthma']);
    });

    it('removePastIllness does nothing when cancelled', () => {
      confirm.confirm.and.returnValue(of(false));
      component.removePastIllness(0, ill().at(0));
      expect(ill().length).toBe(1);
    });

    it('checkIllnessValidity', () => {
      const row = ill().at(0);
      expect(component.checkIllnessValidity(row)).toBeTrue();
      row.enable();
      row.patchValue({
        illnessType: illness()[0],
        timePeriodAgo: 1,
        timePeriodUnit: 'Years',
      });
      expect(component.checkIllnessValidity(row)).toBeFalse();
    });

    it('sortIllnessList', () => {
      const l = [
        { illnessType: 'b' },
        { illnessType: 'a' },
        { illnessType: 'b' },
      ];
      component.sortIllnessList(l);
      expect(l.map((x) => x.illnessType)).toEqual(['a', 'b', 'b']);
    });
  });

  describe('surgery rows', () => {
    beforeEach(load);

    it('addPastSurgery excludes used types and None once a row exists', () => {
      sur().at(0).patchValue({ surgeryType: surgery()[0] });
      component.addPastSurgery();
      const types = component.pastSurgerySelectList[1].map(
        (s: any) => s.surgeryType,
      );
      expect(types).not.toContain('Appendectomy');
      expect(types).not.toContain('None');
    });

    it('addPastSurgery without master only adds a row', () => {
      component.filteredSurgeryMasterData = null;
      component.addPastSurgery();
      expect(sur().length).toBe(2);
      expect(component.pastSurgerySelectList.length).toBe(1);
    });

    it('filterPastSurgeryType enables time and moves selections', () => {
      component.addPastSurgery();
      const row = sur().at(0);
      row.patchValue({ otherSurgeryType: 'x' });
      const app = component.pastSurgerySelectList[1][0];
      component.filterPastSurgeryType(app, 0, row);
      expect(row.value.otherSurgeryType).toBeNull();
      expect(row.get('timePeriodAgo')?.enabled).toBeTrue();
      expect(component.pastSurgerySelectList[1]).not.toContain(app);
      const next = component.pastSurgerySelectList[1][0];
      component.filterPastSurgeryType(next, 0, row);
      expect(component.pastSurgerySelectList[1]).toContain(app);
    });

    it('filterPastSurgeryType with Nil disables and with None collapses', () => {
      const row = sur().at(0);
      row.get('timePeriodAgo')?.enable();
      component.filterPastSurgeryType({ surgeryType: 'Nil' }, 0, row);
      expect(row.get('timePeriodAgo')?.disabled).toBeTrue();
      component.addPastSurgery();
      component.addPastSurgery();
      component.previousSelectedSurgeryTypeList[2] = surgery()[0];
      component.filterPastSurgeryType({ surgeryType: 'None' }, 0, row);
      expect(sur().length).toBe(1);
      expect(component.pastSurgerySelectList.length).toBe(1);
    });

    it('removePastSurgery resets the only row', () => {
      const row = sur().at(0);
      row.patchValue({ surgeryType: surgery()[0] });
      row.markAsTouched();
      component.removePastSurgery(0, row);
      expect(row.value.surgeryType).toBeNull();
      expect(row.get('timePeriodAgo')?.disabled).toBeTrue();
      expect(row.get('timePeriodUnit')?.disabled).toBeTrue();
      expect(row.touched).toBeFalse();
      expect(sur().length).toBe(1);
    });

    it('removePastSurgery at index 0 moves None to the next list', () => {
      component.addPastSurgery();
      component.previousSelectedSurgeryTypeList[0] = surgery()[0];
      component.removePastSurgery(0, sur().at(0));
      expect(sur().length).toBe(1);
      expect(
        component.pastSurgerySelectList[0].map((s: any) => s.surgeryType),
      ).toContain('None');
    });

    it('removePastSurgery at index > 0 and cancel path', () => {
      component.addPastSurgery();
      component.removePastSurgery(1, sur().at(1));
      expect(sur().length).toBe(1);
      confirm.confirm.and.returnValue(of(false));
      component.addPastSurgery();
      component.removePastSurgery(1, sur().at(1));
      expect(sur().length).toBe(2);
    });

    it('checkSurgeryValidity and sortSurgeryList', () => {
      const row = sur().at(0);
      expect(component.checkSurgeryValidity(row)).toBeTrue();
      row.enable();
      row.patchValue({
        surgeryType: surgery()[0],
        timePeriodAgo: 1,
        timePeriodUnit: 'Years',
      });
      expect(component.checkSurgeryValidity(row)).toBeFalse();
      const l = [
        { surgeryType: 'z' },
        { surgeryType: 'a' },
        { surgeryType: 'z' },
      ];
      component.sortSurgeryList(l);
      expect(l.map((x) => x.surgeryType)).toEqual(['a', 'z', 'z']);
    });
  });

  describe('validateDuration', () => {
    let row: FormGroup;
    beforeEach(() => {
      load();
      row = component.initPastIllness();
      row.enable();
    });

    it('alerts when longer than the age', () => {
      row.patchValue({ timePeriodAgo: 50, timePeriodUnit: 'Years' });
      component.validateDuration(row);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.durationGreaterThanAge,
      );
      expect(row.value.timePeriodAgo).toBeNull();
    });

    it('enables unit when only duration given', () => {
      row.get('timePeriodUnit')?.disable();
      row.patchValue({ timePeriodAgo: 5 });
      component.validateDuration(row);
      expect(row.get('timePeriodUnit')?.enabled).toBeTrue();
    });

    it('disables unit without duration', () => {
      component.validateDuration(row);
      expect(row.get('timePeriodUnit')?.disabled).toBeTrue();
    });

    it('accepts valid durations', () => {
      row.patchValue({ timePeriodAgo: 5, timePeriodUnit: 'Years' });
      component.validateDuration(row);
      expect(confirm.alert).not.toHaveBeenCalled();
      expect(row.value.timePeriodUnit).toBe('Years');
    });
  });

  describe('getPreviousPastHistory', () => {
    beforeEach(() => fixture.detectChanges());

    it('opens the dialog with data', () => {
      const data = { data: [{}] };
      nurse.getPreviousPastHistory.and.returnValue(
        of({ statusCode: 200, data }),
      );
      component.getPreviousPastHistory();
      expect(nurse.getPreviousPastHistory).toHaveBeenCalledWith(
        'B1',
        'General OPD',
      );
      expect(dialog.open).toHaveBeenCalledWith(PreviousDetailsComponent, {
        data: {
          dataList: data,
          title: LANGUAGE_EN.historyData.Previousillness.previouspasthistory,
        },
      });
    });

    it('alerts when empty, on error status and on failure', () => {
      nurse.getPreviousPastHistory.and.returnValue(
        of({ statusCode: 200, data: { data: [] } }),
      );
      component.getPreviousPastHistory();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.pastHistoryNot,
      );
      nurse.getPreviousPastHistory.and.returnValue(of({ statusCode: 500 }));
      component.getPreviousPastHistory();
      nurse.getPreviousPastHistory.and.returnValue(throwingObs());
      component.getPreviousPastHistory();
      expect(
        confirm.alert.calls.allArgs().filter((a: any[]) => a[1] === 'error')
          .length,
      ).toBe(2);
    });
  });

  it('trackFieldInteraction and ngDoCheck', () => {
    component.trackFieldInteraction('x');
    expect(tracking.trackFieldInteraction).toHaveBeenCalledWith(
      'x',
      'Past History',
    );
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });
});
