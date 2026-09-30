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
import { SimpleChange } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';

import { PastObstericHistoryComponent } from './past-obsteric-history.component';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../../shared/services';
import { HrpService } from '../../../shared/services/hrp.service';
import { BeneficiaryDetailsService } from 'src/app/app-modules/core/services';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { AmritTrackingService } from 'Common-UI/src/tracking';
import { PreviousDetailsComponent } from 'src/app/app-modules/core/components/previous-details/previous-details.component';
import { GeneralUtils } from '../../../shared/utility';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

const SLD = JSON.stringify({ facilityID: 7, parkingPlaceID: 8 });
const MASTER = {
  deliveryTypes: [
    { deliveryType: 'Normal Delivery' },
    { deliveryType: 'Cesarean Section (LSCS)' },
    { deliveryType: 'Assisted Delivery' },
  ],
  deliveryPlaces: [{ deliveryPlace: 'PHC' }, { deliveryPlace: 'Other' }],
  pregComplicationTypes: [
    { pregComplicationType: 'None' },
    { pregComplicationType: 'Anaemia' },
    { pregComplicationType: 'Other' },
  ],
  pregDuration: [{ durationType: 'Term' }, { durationType: 'Preterm' }],
  deliveryComplicationTypes: [
    { deliveryComplicationType: 'None' },
    { deliveryComplicationType: 'Other' },
  ],
  postpartumComplicationTypes: [
    { postpartumComplicationType: 'None' },
    { postpartumComplicationType: 'Sepsis' },
    { postpartumComplicationType: 'Other' },
  ],
  pregOutcomes: [
    { pregOutcome: 'Live Birth' },
    { pregOutcome: 'Abortion' },
    { pregOutcome: 'Stillbirth' },
  ],
  newBornComplications: [{ complicationValue: 'Jaundice' }],
  typeOfAbortion: [{ complicationValue: 'Induced' }],
  serviceFacilities: [{ facilityName: 'PHC' }],
  postAbortionComplications: [
    { complicationValue: 'None' },
    { complicationValue: 'Bleeding' },
  ],
};

describe('PastObstericHistoryComponent', () => {
  let component: PastObstericHistoryComponent;
  let fixture: ComponentFixture<PastObstericHistoryComponent>;
  let masterData$: BehaviorSubject<any>;
  let history$: BehaviorSubject<any>;
  let nurse: any;
  let hrp: any;
  let confirm: any;
  let dialog: any;
  let session: any;
  let tracking: any;
  let utils: GeneralUtils;

  const list = () =>
    component.pastObstericHistoryForm.get(
      'pastObstericHistoryList',
    ) as FormArray;
  const complList = () =>
    component.pastObstericHistoryForm.get('complicationPregList') as FormArray;

  beforeEach(async () => {
    masterData$ = new BehaviorSubject<any>(null);
    history$ = new BehaviorSubject<any>(null);
    hrp = autoSpy(HrpService, { checkHrpStatus: false });
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [PastObstericHistoryComponent],
      providers: [
        ...commonTestProviders({
          session: { beneficiaryRegID: 'B1', serviceLineDetails: SLD },
        }),
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
          useValue: autoSpy(BeneficiaryDetailsService),
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(PastObstericHistoryComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(PastObstericHistoryComponent);
    component = fixture.componentInstance;
    session = TestBed.inject(SessionStorageService);
    utils = new GeneralUtils(TestBed.inject(FormBuilder), session);
    component.pastObstericHistoryForm = utils.createPastObstericHistoryForm();
    component.visitCategory = 'General OPD';
    nurse = TestBed.inject(NurseService);
    confirm = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    tracking = TestBed.inject(AmritTrackingService);
  });

  it('init sets language, primes hrp and stores master data', () => {
    fixture.detectChanges();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(hrp.setPastObstetric).toHaveBeenCalledWith([]);
    masterData$.next(MASTER);
    expect(component.selectDeliveryTypes).toEqual(MASTER.deliveryTypes);
  });

  it('loads history in view mode and for specialist flag 100', () => {
    component.mode = 'view';
    const spy = spyOn(component, 'getGeneralHistory');
    fixture.detectChanges();
    masterData$.next(MASTER);
    expect(spy).toHaveBeenCalledTimes(1);
    session.setItem('specialistFlag', '100');
    component.mode = 'edit';
    masterData$.next(MASTER);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('ngOnChanges builds a constraint entry per existing pregnancy row', () => {
    list().push(utils.initPastObstericHistory(1));
    list().push(utils.initPastObstericHistory(2));
    component.ngOnChanges({
      pastObstericHistoryForm: new SimpleChange(null, {}, true),
    });
    expect(component.complicationOptionConstraints.length).toBe(2);
    component.ngOnChanges({});
    expect(component.complicationOptionConstraints.length).toBe(2);
  });

  it('ngOnDestroy clears arrays and resets with facility data', () => {
    fixture.detectChanges();
    component.getGeneralHistory();
    list().push(utils.initPastObstericHistory(1));
    complList().push(new FormBuilder().group({ value: true }));
    component.pastObstericHistoryForm.patchValue({ totalNoOfPreg: null });
    component.ngOnDestroy();
    expect(list().length).toBe(0);
    expect(complList().length).toBe(0);
    expect(component.pastObstericHistoryForm.value.facilityID).toBe(7);
    expect(component.pastObstericHistoryForm.value.parkingPlaceID).toBe(8);
  });

  it('ngOnDestroy skips the reset without service line details', () => {
    session.removeItem('serviceLineDetails');
    component.pastObstericHistoryForm.patchValue({ totalNoOfPreg: 3 });
    component.ngOnDestroy();
    expect(component.pastObstericHistoryForm.value.totalNoOfPreg).toBe(3);
  });

  describe('total number of pregnancies', () => {
    beforeEach(() => fixture.detectChanges());

    it('creates one complication row per pregnancy (non ANC)', () => {
      component.pastObstericHistoryForm.patchValue({ totalNoOfPreg: 3 });
      expect(complList().length).toBe(3);
      expect(component.totalNoOfPreg).toBe(3);
    });

    it('creates n-1 rows for ANC', () => {
      component.visitCategory = 'ANC';
      component.pastObstericHistoryForm.patchValue({ totalNoOfPreg: 3 });
      expect(complList().length).toBe(2);
    });

    it('ignores empty values', () => {
      component.pastObstericHistoryForm.patchValue({ totalNoOfPreg: 0 });
      expect(complList().length).toBe(0);
    });

    it('shrinks the lists when the number decreases', () => {
      component.pastObstericHistoryForm.patchValue({ totalNoOfPreg: 3 });
      component.togglePastObstericHistory({ checked: true }, 3);
      component.pastObstericHistoryForm.patchValue({ totalNoOfPreg: 2 });
      expect(complList().length).toBe(2);
      expect(list().length).toBe(0);
    });
  });

  describe('toggle / remove pregnancy', () => {
    beforeEach(() => fixture.detectChanges());

    it('adds a pregnancy row with constraints when checked', () => {
      component.togglePastObstericHistory({ checked: true }, 1);
      expect(list().length).toBe(1);
      expect(list().at(0).value.pregOrder).toBe(1);
      expect(component.complicationOptionConstraints.length).toBe(1);
      expect(component.findPastObstericHistory(1)).toBe(0);
      expect(component.findPastObstericHistory(9)).toBe(-1);
    });

    it('removes a row on confirm and trims history data', () => {
      component.togglePastObstericHistory({ checked: true }, 1);
      component.pastObstericHistoryData = {
        femaleObstetricHistoryList: [{ pregOrder: 1 }],
      };
      component.togglePastObstericHistory({ checked: false }, 1);
      expect(confirm.confirm).toHaveBeenCalledWith(
        'warn',
        LANGUAGE_EN.alerts.info.warn,
      );
      expect(list().length).toBe(0);
      expect(component.pastObstericHistoryForm.dirty).toBeTrue();
      expect(
        component.pastObstericHistoryData.femaleObstetricHistoryList,
      ).toEqual([]);
    });

    it('re-checks the complication box when removal is cancelled', () => {
      confirm.confirm.and.returnValue(of(false));
      complList().push(new FormBuilder().group({ value: false }));
      component.togglePastObstericHistory({ checked: true }, 1);
      component.togglePastObstericHistory({ checked: false }, 1);
      expect(list().length).toBe(1);
      expect(complList().at(0).value.value).toBeTrue();
    });

    it('does nothing when unchecking a missing row', () => {
      component.togglePastObstericHistory({ checked: false }, 5);
      expect(confirm.confirm).not.toHaveBeenCalled();
    });
  });

  describe('populating history', () => {
    const hist = () => ({
      totalNoOfPreg: 2,
      femaleObstetricHistoryList: [
        {
          pregOrder: 1,
          pregComplicationList: [{ pregComplicationType: 'Anaemia' }],
          durationType: 'Term',
          deliveryType: 'Normal Delivery',
          deliveryPlace: 'PHC',
          deliveryComplicationList: [{ deliveryComplicationType: 'Other' }],
          postpartumComplicationList: [{ postpartumComplicationType: 'None' }],
          pregOutcome: 'Live Birth',
          newBornComplication: 'Jaundice',
        },
        {
          pregOrder: 2,
          pregComplicationList: [],
          deliveryComplicationList: [],
          postpartumComplicationList: [],
          pregOutcome: 'Abortion',
          typeOfAbortionValue: 'Induced',
          serviceFacilityValue: 'PHC',
          postAbortionComplication: [{ complicationValue: 'Bleeding' }],
        },
        { pregOrder: null },
      ],
    });

    it('maps master values onto the pregnancy rows', () => {
      component.mode = 'view';
      fixture.detectChanges();
      masterData$.next(MASTER);
      history$.next({
        statusCode: 200,
        data: { FemaleObstetricHistory: hist() },
      });
      expect(component.pastObstericHistoryForm.value.totalNoOfPreg).toBe(2);
      expect(list().length).toBe(2);
      const r0 = list().at(0).value;
      expect(r0.pregComplicationList).toEqual([
        MASTER.pregComplicationTypes[1],
      ]);
      expect(r0.durationType).toEqual(MASTER.pregDuration[0]);
      expect(r0.deliveryType).toEqual(MASTER.deliveryTypes[0]);
      expect(r0.deliveryPlace).toEqual(MASTER.deliveryPlaces[0]);
      expect(r0.newBornComplication).toEqual(MASTER.newBornComplications[0]);
      const r1 = list().at(1).value;
      expect(r1.abortionType).toEqual(MASTER.typeOfAbortion[0]);
      expect(r1.typeofFacility).toEqual(MASTER.serviceFacilities[0]);
      expect(r1.postAbortionComplication).toEqual([
        MASTER.postAbortionComplications[1],
      ]);
      expect(complList().at(0).value.value).toBeTrue();
      expect(complList().at(1).value.value).toBeTrue();
      expect(
        component.complicationOptionConstraints[0]
          .showOtherDeliveryComplication,
      ).toBeTrue();
      expect(hrp.setPastObstetric).toHaveBeenCalled();
    });

    // App bug: an Abortion outcome without postAbortionComplication leaves the
    // control null, and resetPostComplicationType reads null.length.
    it('throws for abortion without post abortion complications (current behaviour)', () => {
      component.masterData = MASTER;
      component.pastObstericHistoryData = {
        femaleObstetricHistoryList: [
          {
            pregOrder: 1,
            pregComplicationList: [],
            deliveryComplicationList: [],
            postpartumComplicationList: [],
            pregOutcome: 'Abortion',
          },
        ],
      };
      expect(() => component.handlePastObstetricHistoryData()).toThrowError(
        TypeError,
      );
      expect(component.pastObstericHistoryForm.value.totalNoOfPreg).toBeNull();
      expect(list().at(0).value.pregOutcome).toEqual(MASTER.pregOutcomes[1]);
    });

    it('ignores history without obstetric data', () => {
      component.getGeneralHistory();
      history$.next({ statusCode: 200, data: {} });
      expect(component.pastObstericHistoryData).toBeUndefined();
    });
  });

  describe('complication constraint helpers', () => {
    let row: FormGroup;
    beforeEach(() => {
      fixture.detectChanges();
      component.togglePastObstericHistory({ checked: true }, 1);
      row = list().at(0) as FormGroup;
    });
    const c = () => component.complicationOptionConstraints[0];

    it('pregnancy complications: many / none / single / empty', () => {
      row.patchValue({
        pregComplicationList: [
          { pregComplicationType: 'Anaemia' },
          { pregComplicationType: 'Other' },
        ],
        otherPregComplication: 'x',
      });
      component.resetOtherPregnancyComplication(row, 0, true);
      expect(c().showOtherPregnancyComplication).toBeTrue();
      expect(c().disableNonePregnancyComplication).toBeTrue();
      expect(row.value.otherPregComplication).toBe('x');
      expect(hrp.checkHrpStatus).toBeTrue();

      row.patchValue({
        pregComplicationList: [{ pregComplicationType: 'None' }],
      });
      component.resetOtherPregnancyComplication(row, 0, false);
      expect(c().disableNonePregnancyComplication).toBeFalse();
      expect(c().showAllPregComplication).toBeFalse();
      expect(row.value.otherPregComplication).toBeNull();

      row.patchValue({
        pregComplicationList: [{ pregComplicationType: 'Anaemia' }],
      });
      component.resetOtherPregnancyComplication(row, 0, false);
      expect(c().disableNonePregnancyComplication).toBeTrue();

      row.patchValue({ pregComplicationList: [] });
      component.resetOtherPregnancyComplication(row, 0, false);
      expect(c().showAllPregComplication).toBeTrue();
    });

    it('delivery complications: many / none / single / empty', () => {
      row.patchValue({
        deliveryComplicationList: [
          { deliveryComplicationType: 'A' },
          { deliveryComplicationType: 'B' },
        ],
        otherDeliveryComplication: 'x',
      });
      component.resetOtherDeliveryComplication(row, 0, false);
      expect(c().disableNoneDeliveryComplication).toBeTrue();
      expect(row.value.otherDeliveryComplication).toBeNull();
      row.patchValue({
        deliveryComplicationList: [{ deliveryComplicationType: 'None' }],
      });
      component.resetOtherDeliveryComplication(row, 0, false);
      expect(c().disableNoneDeliveryComplication).toBeFalse();
      row.patchValue({
        deliveryComplicationList: [{ deliveryComplicationType: 'Other' }],
      });
      component.resetOtherDeliveryComplication(row, 0, false);
      expect(c().disableNoneDeliveryComplication).toBeTrue();
      expect(c().showOtherDeliveryComplication).toBeTrue();
      row.patchValue({ deliveryComplicationList: [] });
      component.resetOtherDeliveryComplication(row, 0, false);
      expect(c().showAllDeliveryComplication).toBeTrue();
    });

    it('postpartum complications: many / none / single / empty', () => {
      row.patchValue({
        postpartumComplicationList: [
          { postpartumComplicationType: 'Other' },
          { postpartumComplicationType: 'Sepsis' },
        ],
      });
      component.resetOtherPostpartumComplicationType(row, 0);
      expect(c().showOtherPostpartumComplication).toBeTrue();
      expect(c().disableNonePostpartumComplication).toBeTrue();
      row.patchValue({
        postpartumComplicationList: [{ postpartumComplicationType: 'None' }],
        otherPostpartumCompType: 'x',
      });
      component.resetOtherPostpartumComplicationType(row, 0);
      expect(c().disableNonePostpartumComplication).toBeFalse();
      expect(row.value.otherPostpartumCompType).toBeNull();
      row.patchValue({
        postpartumComplicationList: [{ postpartumComplicationType: 'Sepsis' }],
      });
      component.resetOtherPostpartumComplicationType(row, 0);
      expect(c().disableNonePostpartumComplication).toBeTrue();
      row.patchValue({ postpartumComplicationList: [] });
      component.resetOtherPostpartumComplicationType(row, 0);
      expect(c().showAllPostpartumComplication).toBeTrue();
    });

    it('post abortion complications: many / none / single / empty', () => {
      row.patchValue({
        postAbortionComplication: [
          { complicationValue: 'A' },
          { complicationValue: 'B' },
        ],
      });
      component.resetPostComplicationType(row, 0);
      expect(c().disableNonePostComplication).toBeTrue();
      row.patchValue({
        postAbortionComplication: [{ complicationValue: 'None' }],
      });
      component.resetPostComplicationType(row, 0);
      expect(c().disableNonePostComplication).toBeFalse();
      expect(c().showAllPostComplication).toBeFalse();
      row.patchValue({
        postAbortionComplication: [{ complicationValue: 'A' }],
      });
      component.resetPostComplicationType(row, 0);
      expect(c().disableNonePostComplication).toBeTrue();
      row.patchValue({ postAbortionComplication: [] });
      component.resetPostComplicationType(row, 0);
      expect(c().showAllPostComplication).toBeTrue();
    });
  });

  describe('field helpers', () => {
    let row: FormGroup;
    beforeEach(() => {
      fixture.detectChanges();
      masterData$.next(MASTER);
      row = utils.initPastObstericHistory(1);
    });

    it('resetOtherDeliveryPlace narrows delivery types by place', () => {
      row.patchValue({ deliveryPlace: { deliveryPlace: 'Home-Supervised' } });
      component.resetOtherDeliveryPlace(row);
      expect(component.selectDeliveryTypes).toEqual([MASTER.deliveryTypes[0]]);
      row.patchValue({ deliveryPlace: { deliveryPlace: 'Home-Unsupervised' } });
      component.resetOtherDeliveryPlace(row);
      expect(component.selectDeliveryTypes.length).toBe(1);
      row.patchValue({ deliveryPlace: { deliveryPlace: 'Subcentre' } });
      component.resetOtherDeliveryPlace(row);
      expect(component.selectDeliveryTypes.length).toBe(2);
      row.patchValue({ deliveryPlace: { deliveryPlace: 'PHC' } });
      component.resetOtherDeliveryPlace(row);
      expect(component.selectDeliveryTypes).not.toContain(
        MASTER.deliveryTypes[1],
      );
      row.patchValue({
        deliveryPlace: { deliveryPlace: 'Other' },
        otherDeliveryPlace: 'x',
      });
      component.resetOtherDeliveryPlace(row);
      expect(component.selectDeliveryTypes).toEqual(MASTER.deliveryTypes);
      expect(row.value.otherDeliveryPlace).toBeNull();
    });

    it('resetOtherNewBornComplications clears other text only for Other', () => {
      row.patchValue({
        newBornComplication: { complicationValue: 'Jaundice' },
        otherNewBornComplication: 'x',
      });
      component.resetOtherNewBornComplications(row);
      expect(row.value.otherNewBornComplication).toBe('x');
      row.patchValue({ newBornComplication: { complicationValue: 'Other' } });
      component.resetOtherNewBornComplications(row);
      expect(row.value.otherNewBornComplication).toBeNull();
    });

    it('checkPregnancyOutcome clears fields for abortion', () => {
      row.patchValue({
        pregOutcome: { pregOutcome: 'Abortion' },
        deliveryType: MASTER.deliveryTypes[0],
        congenitalAnomalies: 'x',
      });
      component.checkPregnancyOutcome(row);
      expect(row.value.deliveryType).toBeNull();
      expect(row.value.congenitalAnomalies).toBeNull();
      expect(hrp.checkHrpStatus).toBeTrue();
    });

    it('checkPregnancyOutcome clears newborn fields for stillbirth', () => {
      row.patchValue({
        pregOutcome: { pregOutcome: 'Stillbirth' },
        deliveryType: MASTER.deliveryTypes[0],
        newBornComplication: 'x',
      });
      component.checkPregnancyOutcome(row);
      expect(row.value.newBornComplication).toBeNull();
      expect(row.value.deliveryType).toEqual(MASTER.deliveryTypes[0]);
    });

    it('onAbortionType clears facility unless induced', () => {
      row.patchValue({ typeofFacility: 'PHC' });
      component.onAbortionType(row, 'Induced');
      expect(row.value.typeofFacility).toBe('PHC');
      component.onAbortionType(row, 'Spontaneous');
      expect(row.value.typeofFacility).toBeNull();
    });

    it('checkDurationType alerts outside 4-24 weeks', () => {
      row.patchValue({ pregDuration: 10 });
      component.checkDurationType(row);
      expect(confirm.alert).not.toHaveBeenCalled();
      row.patchValue({ pregDuration: 30 });
      component.checkDurationType(row);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.pregnancyRange,
      );
      expect(row.value.pregDuration).toBeNull();
    });

    it('checkTotalPregnancy alerts when zero for ANC/PNC only', () => {
      component.visitCategory = 'General OPD';
      component.checkTotalPregnancy(0);
      expect(confirm.alert).not.toHaveBeenCalled();
      component.visitCategory = 'PNC';
      component.checkTotalPregnancy(0);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.totalNumberOfPastPregnancyFor + ' ',
        'PNC',
        ' ' + LANGUAGE_EN.cannotBeZero,
      );
      confirm.alert.calls.reset();
      component.visitCategory = 'ANC';
      component.checkTotalPregnancy(1);
      expect(confirm.alert).not.toHaveBeenCalled();
    });

    it('hrpPastObstetricDetails publishes selected pregnancy details', () => {
      component.togglePastObstericHistory({ checked: true }, 1);
      list()
        .at(0)
        .patchValue({
          pregComplicationList: ['a'],
          durationType: 'Term',
          deliveryType: 'Normal',
          deliveryComplicationList: ['b'],
          congenitalAnomalies: 'no',
        });
      component.setCongenitalAnomalies();
      expect(hrp.setPastObstetric).toHaveBeenCalledWith([
        {
          complicationDuringPregnancy: ['a'],
          durationOfPregnancy: 'Term',
          typeOfDelivery: 'Normal',
          deliveryComplication: ['b'],
          congenitalAnomalies: 'no',
        },
      ]);
      expect(hrp.checkHrpStatus).toBeTrue();
    });

    it('trackComplication returns the value when present', () => {
      expect(component.trackComplication({ value: 3 }, 0)).toBe(3);
      expect(component.trackComplication(null, 0)).toBeUndefined();
    });

    it('list getters return controls or null', () => {
      expect(component.getComplicationPregList()).toEqual([]);
      expect(component.getPastObstericHistoryList()).toEqual([]);
      const original = component.pastObstericHistoryForm;
      component.pastObstericHistoryForm = new FormBuilder().group({
        complicationPregList: null,
        pastObstericHistoryList: null,
      });
      expect(component.getComplicationPregList()).toBeNull();
      expect(component.getPastObstericHistoryList()).toBeNull();
      // restore so ngOnDestroy can clear the real FormArrays during cleanup
      component.pastObstericHistoryForm = original;
    });
  });

  describe('getPreviousObstetricHistory', () => {
    beforeEach(() => fixture.detectChanges());

    it('opens the previous details dialog', () => {
      const data = { data: [{ x: 1 }] };
      nurse.getPreviousObstetricHistory.and.returnValue(
        of({ statusCode: 200, data }),
      );
      component.getPreviousObstetricHistory();
      expect(nurse.getPreviousObstetricHistory).toHaveBeenCalledWith(
        'B1',
        'General OPD',
      );
      expect(dialog.open).toHaveBeenCalledWith(PreviousDetailsComponent, {
        data: {
          dataList: data,
          title:
            LANGUAGE_EN.historyData.obstetrichistory.previousobstetrichistory,
        },
      });
    });

    it('alerts when empty', () => {
      nurse.getPreviousObstetricHistory.and.returnValue(
        of({ statusCode: 200, data: { data: [] } }),
      );
      component.getPreviousObstetricHistory();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.pastHistoryNot,
      );
    });

    it('alerts error on non-200 and on failure', () => {
      nurse.getPreviousObstetricHistory.and.returnValue(
        of({ statusCode: 500, data: null }),
      );
      component.getPreviousObstetricHistory();
      nurse.getPreviousObstetricHistory.and.returnValue(throwingObs());
      component.getPreviousObstetricHistory();
      expect(confirm.alert).toHaveBeenCalledTimes(2);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.errorFetchingHistory,
        'error',
      );
    });
  });

  it('trackFieldInteraction and ngDoCheck', () => {
    component.trackFieldInteraction('f');
    expect(tracking.trackFieldInteraction).toHaveBeenCalledWith(
      'f',
      'Past Obstetric History',
    );
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });
});
