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

import { GeneralPersonalHistoryComponent } from './personal-history.component';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../../shared/services';
import { NcdScreeningService } from '../../../shared/services/ncd-screening.service';
import { BeneficiaryDetailsService } from '../../../../core/services/beneficiary-details.service';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { AmritTrackingService } from 'Common-UI/src/tracking';
import { PreviousDetailsComponent } from 'src/app/app-modules/core/components/previous-details/previous-details.component';
import { AllergenSearchComponent } from 'src/app/app-modules/core/components/allergen-search/allergen-search.component';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  createDialogRefMock,
  throwingObs,
} from 'src/testing/test-utils';

const TOBACCO = [
  { habitID: 1, habitValue: 'Beedi' },
  { habitID: 2, habitValue: 'Cigarettes' },
  { habitID: 3, habitValue: 'Other' },
];
const ALCOHOL = [
  { habitID: 1, habitValue: 'Beer' },
  { habitID: 2, habitValue: 'Whisky' },
];
const QTY = [
  { habitID: 1, habitValue: '1-2 drinks' },
  { habitID: 2, habitValue: '3-4 drinks' },
];
const REACTIONS = [
  { allergicReactionTypeID: 1, name: 'Rash' },
  { allergicReactionTypeID: 11, name: 'Other' },
];
const master = () => ({
  typeOfTobaccoProducts: TOBACCO.map((t) => ({ ...t })),
  typeOfAlcoholProducts: ALCOHOL.map((t) => ({ ...t })),
  quantityOfAlcoholIntake: QTY,
  AllergicReactionTypes: REACTIONS,
});

describe('GeneralPersonalHistoryComponent', () => {
  let component: GeneralPersonalHistoryComponent;
  let fixture: ComponentFixture<GeneralPersonalHistoryComponent>;
  let masterData$: BehaviorSubject<any>;
  let history$: BehaviorSubject<any>;
  let idrs$: BehaviorSubject<any>;
  let ben$: BehaviorSubject<any>;
  let nurse: any;
  let confirm: any;
  let dialog: any;
  let tracking: any;
  let fb: FormBuilder;

  const buildForm = () =>
    fb.group({
      dietaryType: null,
      physicalActivityType: null,
      riskySexualPracticesStatus: null,
      tobaccoUseStatus: null,
      alcoholIntakeStatus: null,
      allergyStatus: null,
      tobaccoList: new FormArray([]),
      alcoholList: new FormArray([]),
      allergicList: new FormArray([]),
    });

  const arr = (name: string) =>
    component.generalPersonalHistoryForm.get(name) as FormArray;

  beforeEach(async () => {
    masterData$ = new BehaviorSubject<any>(null);
    history$ = new BehaviorSubject<any>(null);
    idrs$ = new BehaviorSubject<any>(false);
    ben$ = new BehaviorSubject<any>({ age: '30 Years', ageVal: 30 });
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [GeneralPersonalHistoryComponent],
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
        {
          provide: NcdScreeningService,
          useValue: autoSpy(NcdScreeningService, {
            enablingIdrs$: idrs$.asObservable(),
          }),
        },
        {
          provide: BeneficiaryDetailsService,
          useValue: autoSpy(BeneficiaryDetailsService, {
            beneficiaryDetails$: ben$.asObservable(),
          }),
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(GeneralPersonalHistoryComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(GeneralPersonalHistoryComponent);
    component = fixture.componentInstance;
    fb = TestBed.inject(FormBuilder);
    component.generalPersonalHistoryForm = buildForm();
    component.visitCategory = 'General OPD';
    nurse = TestBed.inject(NurseService);
    confirm = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    tracking = TestBed.inject(AmritTrackingService);
  });

  afterEach(() => fixture.destroy());

  describe('init', () => {
    it('sets language, beneficiary and seeds one row per list from master data', () => {
      fixture.detectChanges();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.beneficiary.age).toBe('30 Years');
      masterData$.next(master());
      expect(component.tobaccoMasterData.length).toBe(3);
      expect(arr('tobaccoList').length).toBe(1);
      expect(arr('alcoholList').length).toBe(1);
      expect(arr('allergicList').length).toBe(1);
      expect(component.tobaccoSelectList[0].length).toBe(3);
      expect(component.alcoholSelectList[0].length).toBe(2);
      expect(component.allerySelectList[0].length).toBe(3);
      expect(component.getTobaccoList()?.length).toBe(1);
      expect(component.getAlcoholList()?.length).toBe(1);
      expect(component.getAllergyList()?.length).toBe(1);
      expect(component.tobaccoList.length).toBe(1);
    });

    it('ignores master data once already loaded', () => {
      fixture.detectChanges();
      masterData$.next(master());
      masterData$.next({ typeOfTobaccoProducts: [] });
      expect(component.tobaccoMasterData.length).toBe(3);
      expect(arr('tobaccoList').length).toBe(1);
    });

    it('does not subscribe to master data in view mode until history arrives', () => {
      component.mode = 'view';
      masterData$.next(master());
      fixture.detectChanges();
      expect(component.masterData).toBeNull();
    });

    it('resets the form whenever idrs flag emits (true or false)', () => {
      fixture.detectChanges();
      const spy = spyOn(component.generalPersonalHistoryForm, 'reset');
      idrs$.next(true);
      idrs$.next(false);
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('does not subscribe to idrs in update mode', () => {
      component.mode = 'update';
      fixture.detectChanges();
      const spy = spyOn(component.generalPersonalHistoryForm, 'reset');
      idrs$.next(true);
      expect(spy).not.toHaveBeenCalled();
    });

    it('list getters return null when the control is not a FormArray', () => {
      component.generalPersonalHistoryForm = fb.group({
        tobaccoList: null,
        alcoholList: null,
        allergicList: null,
      });
      expect(component.getTobaccoList()).toBeNull();
      expect(component.getAlcoholList()).toBeNull();
      expect(component.getAllergyList()).toBeNull();
    });

    it('status getters read the form', () => {
      component.generalPersonalHistoryForm.patchValue({
        tobaccoUseStatus: 'Yes',
        alcoholIntakeStatus: 'No',
        allergyStatus: 'Unknown',
      });
      expect(component.tobaccoUseStatus).toBe('Yes');
      expect(component.alcoholIntakeStatus).toBe('No');
      expect(component.allergyStatus).toBe('Unknown');
    });

    it('ngOnDestroy resets and unsubscribes', () => {
      fixture.detectChanges();
      masterData$.next(master());
      const spy = spyOn(component.generalPersonalHistoryForm, 'reset');
      const u1 = spyOn(component.nurseMasterDataSubscription, 'unsubscribe');
      const u2 = spyOn(component.beneficiaryDetailSubscription, 'unsubscribe');
      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
      expect(u1).toHaveBeenCalled();
      expect(u2).toHaveBeenCalled();
    });

    it('ngOnDestroy tolerates missing subscriptions', () => {
      component.nurseMasterDataSubscription = null;
      component.beneficiaryDetailSubscription = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('populating history', () => {
    const historyData = () => ({
      dietaryType: 'Vegetarian',
      tobaccoUseStatus: 'Yes',
      alcoholIntakeStatus: 'Yes',
      allergyStatus: 'Yes',
      tobaccoList: [
        {
          tobaccoUseType: 'Beedi',
          numberperDay: 5,
          duration: 2,
          durationUnit: 'Years',
        },
        {
          tobaccoUseType: 'Cigarettes',
          numberperWeek: 3,
          duration: 1,
          durationUnit: 'Months',
        },
        { tobaccoUseType: 'Unknown' },
      ],
      alcoholList: [
        {
          alcoholType: 'Beer',
          avgAlcoholConsumption: '1-2 drinks',
          alcoholIntakeFrequency: 'Daily',
          duration: 2,
          durationUnit: 'Years',
        },
        { alcoholType: 'Unknown', avgAlcoholConsumption: 'x' },
      ],
      allergicList: [
        {
          allergyType: 'Drugs',
          snomedTerm: 'Penicillin',
          typeOfAllergicReactions: [{ name: 'Rash' }],
          otherAllergicReaction: 'itchy',
        },
        {
          allergyType: 'Food',
          typeOfAllergicReactions: [{ name: 'Other' }],
        },
      ],
    });

    it('patches all three lists from the history response', () => {
      fixture.detectChanges();
      masterData$.next(master());
      // master data already loaded: history triggers getMasterData but no re-add
      component.masterData = null;
      history$.next({
        statusCode: 200,
        data: { PersonalHistory: historyData() },
      });

      expect(component.generalPersonalHistoryForm.value.dietaryType).toBe(
        'Vegetarian',
      );
      const tob = arr('tobaccoList');
      expect(tob.at(0).value.tobaccoUseType.habitValue).toBe('Beedi');
      expect(tob.at(0).value.perDay).toBeTrue();
      expect(tob.at(0).value.number).toBe(5);
      expect(tob.at(1).value.perDay).toBeFalse();
      expect(tob.at(1).value.number).toBe(3);
      expect(tob.at(0).get('number')?.enabled).toBeTrue();

      const alc = arr('alcoholList');
      expect(alc.at(0).value.typeOfAlcohol.habitValue).toBe('Beer');
      expect(alc.at(0).value.avgAlcoholConsumption).toEqual(QTY[0]);

      const all = arr('allergicList');
      expect(all.at(0).value.allergyType.allergyType).toBe('Drugs');
      expect(all.at(0).value.enableOtherAllergy).toBeTrue();
      expect(all.at(0).value.typeOfAllergicReactions).toEqual([REACTIONS[0]]);
      expect(all.at(1).get('typeOfAllergicReactions')?.value).toEqual([
        REACTIONS[1],
      ]);
    });

    it('ignores history responses without personal history', () => {
      fixture.detectChanges();
      history$.next({ statusCode: 200, data: {} });
      history$.next({ statusCode: 500, data: null });
      expect(component.personalHistoryData).toBeUndefined();
    });

    it('getGeneralHistory patches and dispatches to list handlers', () => {
      component.personalHistoryData = { dietaryType: 'Mixed' };
      const t = spyOn(component, 'handlePersonalTobaccoHistoryData');
      const a = spyOn(component, 'handlePersonalAlcoholHistoryData');
      const al = spyOn(component, 'handlePersonalAllergyHistoryData');
      component.getGeneralHistory();
      expect(component.generalPersonalHistoryForm.value.dietaryType).toBe(
        'Mixed',
      );
      expect(t).toHaveBeenCalled();
      expect(a).toHaveBeenCalled();
      expect(al).toHaveBeenCalled();
    });

    it('getGeneralHistory does nothing when history data is null', () => {
      component.personalHistoryData = null;
      const t = spyOn(component, 'handlePersonalTobaccoHistoryData');
      component.getGeneralHistory();
      expect(t).not.toHaveBeenCalled();
    });

    it('allergy handler skips reaction mapping when master has none and keeps unknown type as-is', () => {
      component.masterData = {};
      const reactions = [{ name: 'Rash' }];
      component.personalHistoryData = {
        allergicList: [
          { allergyType: 'Nope', typeOfAllergicReactions: reactions },
        ],
      };
      arr('allergicList').push(component.initAllergyList());
      component.handlePersonalAllergyHistoryData();
      expect(
        component.personalHistoryData.allergicList[0].typeOfAllergicReactions,
      ).toBe(reactions);
      expect(arr('allergicList').at(0).value.allergyType).toBe('Nope');
    });

    it('handlers do nothing without list data', () => {
      component.personalHistoryData = {};
      component.handlePersonalTobaccoHistoryData();
      component.handlePersonalAlcoholHistoryData();
      component.handlePersonalAllergyHistoryData();
      expect(arr('tobaccoList').length).toBe(0);
    });

    it('addMasters stops adding allergies once all types are used', () => {
      component.tobaccoMasterData = null;
      component.alcoholMasterData = null;
      for (let i = 0; i < 3; i++)
        arr('allergicList').push(component.initAllergyList());
      component.addMasters();
      expect(arr('allergicList').length).toBe(3);
      expect(arr('tobaccoList').length).toBe(1);
      expect(component.tobaccoSelectList.length).toBe(0);
    });
  });

  describe('tobacco rows', () => {
    beforeEach(() => {
      fixture.detectChanges();
      masterData$.next(master());
    });

    it('addTobacco excludes already chosen types', () => {
      arr('tobaccoList').at(0).patchValue({ tobaccoUseType: TOBACCO[0] });
      component.addTobacco();
      expect(arr('tobaccoList').length).toBe(2);
      expect(
        component.tobaccoSelectList[1].map((t: any) => t.habitValue),
      ).toEqual(['Cigarettes', 'Other']);
    });

    it('addTobacco without master data just adds a row', () => {
      component.tobaccoMasterData = null;
      component.addTobacco();
      expect(arr('tobaccoList').length).toBe(2);
      expect(component.tobaccoSelectList.length).toBe(1);
    });

    it('filterTobaccoList removes selection from other lists and enables number', () => {
      component.addTobacco();
      const row0 = arr('tobaccoList').at(0);
      const beedi = component.tobaccoSelectList[1].find(
        (t: any) => t.habitValue === 'Cigarettes',
      );
      row0.patchValue({ tobaccoUseType: beedi, otherTobaccoUseType: 'x' });
      component.filterTobaccoList({ value: beedi }, 0, row0);
      expect(component.tobaccoSelectList[1]).not.toContain(beedi);
      expect(row0.get('number')?.enabled).toBeTrue();
      expect(row0.value.otherTobaccoUseType).toBeNull();
      expect(component.previousSelectedTobaccoList[0]).toBe(beedi);

      // change selection: previous value is returned to other lists (sorted)
      const other = component.tobaccoSelectList[1][0];
      component.filterTobaccoList({ value: other }, 0, row0);
      expect(component.tobaccoSelectList[1]).toContain(beedi);
    });

    it('filterTobaccoList disables dependent fields when nothing selected', () => {
      const row0 = arr('tobaccoList').at(0);
      row0.get('number')?.enable();
      component.filterTobaccoList(
        { value: { tobaccoUseType: 'Other' } },
        0,
        row0,
      );
      expect(row0.get('number')?.disabled).toBeTrue();
      expect(row0.get('perDay')?.disabled).toBeTrue();
      expect(row0.get('duration')?.disabled).toBeTrue();
      expect(row0.get('durationUnit')?.disabled).toBeTrue();
    });

    it('removeTobacco resets the last remaining row', () => {
      const row0 = arr('tobaccoList').at(0);
      row0.patchValue({ tobaccoUseType: TOBACCO[0] });
      component.removeTobacco(0, row0);
      expect(confirm.confirm).toHaveBeenCalledWith(
        'warn',
        LANGUAGE_EN.alerts.info.warn,
      );
      expect(arr('tobaccoList').length).toBe(1);
      expect(row0.value.tobaccoUseType).toBeNull();
      expect(component.generalPersonalHistoryForm.dirty).toBeTrue();
    });

    it('removeTobacco removes a row and restores its value to the other lists', () => {
      component.addTobacco();
      const val = component.tobaccoSelectList[1][0];
      component.previousSelectedTobaccoList[1] = val;
      component.tobaccoSelectList[0] = component.tobaccoSelectList[0].filter(
        (x: any) => x !== val,
      );
      component.removeTobacco(1, arr('tobaccoList').at(1));
      expect(arr('tobaccoList').length).toBe(1);
      expect(component.tobaccoSelectList.length).toBe(1);
      expect(component.tobaccoSelectList[0]).toContain(val);
    });

    it('removeTobacco does nothing when not confirmed', () => {
      confirm.confirm.and.returnValue(of(false));
      component.addTobacco();
      component.removeTobacco(1, arr('tobaccoList').at(1));
      expect(arr('tobaccoList').length).toBe(2);
    });

    it('perDayChange maps number into per-day or per-week', () => {
      component.addTobacco();
      const [r0, r1] = [arr('tobaccoList').at(0), arr('tobaccoList').at(1)];
      r0.get('number')?.enable();
      r0.get('perDay')?.enable();
      r1.get('number')?.enable();
      r1.get('perDay')?.enable();
      r0.patchValue({ number: 4, perDay: true });
      r1.patchValue({ number: 7, perDay: false });
      component.perDayChange();
      expect(r0.value.numberperDay).toBe(4);
      expect(r0.value.numberperWeek).toBeNull();
      expect(r1.value.numberperWeek).toBe(7);
      expect(r1.value.numberperDay).toBeNull();
    });

    it('enableFields toggles perDay/duration on number', () => {
      const row = arr('tobaccoList').at(0);
      row.get('number')?.enable();
      row.patchValue({ number: 3 });
      component.enableFields(row);
      expect(row.get('perDay')?.enabled).toBeTrue();
      expect(row.get('duration')?.enabled).toBeTrue();
      row.patchValue({ number: null });
      component.enableFields(row);
      expect(row.get('perDay')?.disabled).toBeTrue();
      expect(row.get('durationUnit')?.disabled).toBeTrue();
    });

    it('checkTobaccoValidity is false only when all fields filled', () => {
      const row = arr('tobaccoList').at(0);
      expect(component.checkTobaccoValidity(row)).toBeTrue();
      row.enable();
      row.patchValue({
        tobaccoUseType: TOBACCO[0],
        number: 1,
        duration: 1,
        durationUnit: 'Years',
      });
      expect(component.checkTobaccoValidity(row)).toBeFalse();
    });

    it('checkTobaccoStatus resets the list when non-empty', () => {
      const row = arr('tobaccoList').at(0);
      row.patchValue({ tobaccoUseType: TOBACCO[0] });
      component.checkTobaccoStatus();
      expect(row.value.tobaccoUseType).toBeNull();
      arr('tobaccoList').clear();
      expect(() => component.checkTobaccoStatus()).not.toThrow();
    });

    it('sortTobaccoList sorts by habitValue', () => {
      const list = [
        { habitValue: 'b' },
        { habitValue: 'a' },
        { habitValue: 'a' },
        { habitValue: 'c' },
      ];
      component.sortTobaccoList(list);
      expect(list.map((l) => l.habitValue)).toEqual(['a', 'a', 'b', 'c']);
    });
  });

  describe('alcohol rows', () => {
    beforeEach(() => {
      fixture.detectChanges();
      masterData$.next(master());
    });

    it('addAlcohol excludes chosen types and works without master data', () => {
      arr('alcoholList').at(0).patchValue({ typeOfAlcohol: ALCOHOL[0] });
      component.addAlcohol();
      expect(
        component.alcoholSelectList[1].map((a: any) => a.habitValue),
      ).toEqual(['Whisky']);
      component.alcoholMasterData = null;
      component.addAlcohol();
      expect(arr('alcoholList').length).toBe(3);
      expect(component.alcoholSelectList.length).toBe(2);
    });

    it('filterAlcoholList moves selection between lists and enables frequency', () => {
      component.addAlcohol();
      const row0 = arr('alcoholList').at(0);
      const beer = component.alcoholSelectList[1][0];
      row0.patchValue({ typeOfAlcohol: beer, otherAlcoholType: 'x' });
      component.filterAlcoholList({ value: beer }, 0, row0);
      expect(component.alcoholSelectList[1]).not.toContain(beer);
      expect(row0.get('alcoholIntakeFrequency')?.enabled).toBeTrue();
      expect(row0.value.otherAlcoholType).toBeNull();
      const whisky = component.alcoholSelectList[1][0];
      component.filterAlcoholList({ value: whisky }, 0, row0);
      expect(component.alcoholSelectList[1]).toContain(beer);
    });

    it('filterAlcoholList disables dependent fields when nothing selected', () => {
      const row0 = arr('alcoholList').at(0);
      row0.get('alcoholIntakeFrequency')?.enable();
      component.filterAlcoholList(
        { value: { typeOfAlcohol: 'Other' } },
        0,
        row0,
      );
      expect(row0.get('alcoholIntakeFrequency')?.disabled).toBeTrue();
      expect(row0.get('durationUnit')?.disabled).toBeTrue();
    });

    it('removeAlcohol resets the last row or removes one of many', () => {
      const row0 = arr('alcoholList').at(0);
      row0.patchValue({ typeOfAlcohol: ALCOHOL[0] });
      component.removeAlcohol(0, row0);
      expect(row0.value.typeOfAlcohol).toBeNull();
      expect(arr('alcoholList').length).toBe(1);

      component.addAlcohol();
      component.previousSelectedAlcoholList[1] = ALCOHOL[1];
      component.alcoholSelectList[0] = [];
      component.removeAlcohol(1, arr('alcoholList').at(1));
      expect(arr('alcoholList').length).toBe(1);
      expect(component.alcoholSelectList[0]).toEqual([ALCOHOL[1]]);
    });

    it('removeAlcohol does nothing when not confirmed', () => {
      confirm.confirm.and.returnValue(of(false));
      component.removeAlcohol(0, arr('alcoholList').at(0));
      expect(arr('alcoholList').length).toBe(1);
    });

    it('onChangeAlcIntakFreq and onChangeAvgAlcoholConsumption toggle fields', () => {
      const row = arr('alcoholList').at(0);
      row.enable();
      row.patchValue({ alcoholIntakeFrequency: 'Daily' });
      component.onChangeAlcIntakFreq(row);
      expect(row.get('avgAlcoholConsumption')?.enabled).toBeTrue();
      row.patchValue({ avgAlcoholConsumption: QTY[0] });
      component.onChangeAvgAlcoholConsumption(row);
      expect(row.get('duration')?.enabled).toBeTrue();
      row.patchValue({ avgAlcoholConsumption: null });
      component.onChangeAvgAlcoholConsumption(row);
      expect(row.get('duration')?.disabled).toBeTrue();
      expect(row.get('durationUnit')?.disabled).toBeTrue();
      row.patchValue({ alcoholIntakeFrequency: null });
      component.onChangeAlcIntakFreq(row);
      expect(row.get('avgAlcoholConsumption')?.disabled).toBeTrue();
    });

    it('checkAlcoholValidity is false only when all fields filled', () => {
      const row = arr('alcoholList').at(0);
      expect(component.checkAlcoholValidity(row)).toBeTrue();
      row.enable();
      row.patchValue({
        typeOfAlcohol: ALCOHOL[0],
        alcoholIntakeFrequency: 'Daily',
        avgAlcoholConsumption: QTY[0],
        duration: 1,
        durationUnit: 'Years',
      });
      expect(component.checkAlcoholValidity(row)).toBeFalse();
    });

    it('checkAlcoholStatus never resets (length is never negative)', () => {
      const row = arr('alcoholList').at(0);
      row.patchValue({ typeOfAlcohol: ALCOHOL[0] });
      component.checkAlcoholStatus();
      expect(row.value.typeOfAlcohol).toEqual(ALCOHOL[0]);
    });

    it('sortAlcoholList sorts by habitValue', () => {
      const list = [
        { habitValue: 'z' },
        { habitValue: 'a' },
        { habitValue: 'z' },
      ];
      component.sortAlcoholList(list);
      expect(list.map((l) => l.habitValue)).toEqual(['a', 'z', 'z']);
    });
  });

  describe('allergy rows', () => {
    beforeEach(() => {
      fixture.detectChanges();
      masterData$.next(master());
    });

    it('addAllergy excludes chosen types and caps at three rows', () => {
      arr('allergicList')
        .at(0)
        .patchValue({ allergyType: component.allergyMasterData[0] });
      component.addAllergy();
      expect(
        component.allerySelectList[1].map((a: any) => a.allergyType),
      ).toEqual(['Food', 'Environmental']);
      component.addAllergy();
      component.addAllergy();
      expect(arr('allergicList').length).toBe(3);
    });

    it('filterAlleryList moves selections and toggles snomed field', () => {
      component.addAllergy();
      const row0 = arr('allergicList').at(0);
      const food = component.allerySelectList[1].find(
        (a: any) => a.allergyType === 'Food',
      );
      row0.patchValue({ allergyType: food });
      component.filterAlleryList({ value: food }, 0, row0);
      expect(component.allerySelectList[1]).not.toContain(food);
      expect(row0.get('snomedTerm')?.enabled).toBeTrue();
      const drugs = component.allerySelectList[1][0];
      component.filterAlleryList({ value: drugs }, 0, row0);
      expect(component.allerySelectList[1]).toContain(food);

      row0.patchValue({ allergyType: null });
      component.filterAlleryList({ value: drugs }, 0, row0);
      expect(row0.get('snomedTerm')?.disabled).toBeTrue();
      expect(row0.get('typeOfAllergicReactions')?.disabled).toBeTrue();
    });

    it('removeAllergy resets the last row or removes one of many', () => {
      const row0 = arr('allergicList').at(0);
      row0.patchValue({ allergyType: component.allergyMasterData[0] });
      component.selectedSnomedTerm = 'x';
      component.removeAllergy(0, row0);
      expect(row0.value.allergyType).toBeNull();
      expect(component.selectedSnomedTerm).toBeNull();

      component.addAllergy();
      const env = component.allergyMasterData[2];
      component.previousSelectedAlleryList[1] = env;
      component.allerySelectList[0] = [];
      component.removeAllergy(1, arr('allergicList').at(1));
      expect(arr('allergicList').length).toBe(1);
      expect(component.allerySelectList[0]).toEqual([env]);
    });

    it('removeAllergy does nothing when not confirmed', () => {
      confirm.confirm.and.returnValue(of(false));
      component.addAllergy();
      component.removeAllergy(1, arr('allergicList').at(1));
      expect(arr('allergicList').length).toBe(2);
    });

    it('canEnableOtherAllergy flags reaction type 11', () => {
      const row = arr('allergicList').at(0);
      row.enable();
      row.patchValue({ typeOfAllergicReactions: [REACTIONS[1]] });
      component.canEnableOtherAllergy(row);
      expect(row.value.enableOtherAllergy).toBeTrue();
      row.patchValue({ typeOfAllergicReactions: [REACTIONS[0]] });
      component.canEnableOtherAllergy(row);
      expect(row.value.enableOtherAllergy).toBeFalse();
    });

    it('checkAllergyValidity is false only when all fields filled', () => {
      const row = arr('allergicList').at(0);
      expect(component.checkAllergyValidity(row)).toBeTrue();
      row.enable();
      row.patchValue({
        allergyType: component.allergyMasterData[0],
        snomedTerm: 'Peanut',
        snomedCode: '123',
        typeOfAllergicReactions: [REACTIONS[0]],
      });
      expect(component.checkAllergyValidity(row)).toBeFalse();
    });

    it('checkAllergicStatus resets a non-empty list', () => {
      const row = arr('allergicList').at(0);
      row.patchValue({ allergyName: 'x' });
      component.checkAllergicStatus();
      expect(row.value.allergyName).toBeNull();
      arr('allergicList').clear();
      expect(() => component.checkAllergicStatus()).not.toThrow();
    });

    it('sortAllergyList sorts by allergyType', () => {
      const list = [
        { allergyType: 'Food' },
        { allergyType: 'Drugs' },
        { allergyType: 'Food' },
      ];
      component.sortAllergyList(list);
      expect(list.map((l) => l.allergyType)).toEqual(['Drugs', 'Food', 'Food']);
    });

    it('searchComponents opens allergen search and patches the chosen term', () => {
      const row = arr('allergicList').at(0);
      row.enable();
      row.patchValue({ snomedTerm: 'Pean' });
      const ref = createDialogRefMock({
        component: 'Peanut',
        componentNo: '99',
      });
      dialog.open.and.returnValue(ref);
      component.searchComponents('Pean', 0, row);
      expect(dialog.open).toHaveBeenCalledWith(AllergenSearchComponent, {
        data: { searchTerm: 'Pean' },
      });
      expect(row.value.snomedTerm).toBe('Peanut');
      expect(row.value.snomedCode).toBe('99');
      expect(row.value.allergyName).toBe('Peanut');
      expect(component.selectedSnomedTerm).toBe('Peanut');
      expect(component.componentFlag).toBeTrue();
      expect(component.enableAlert).toBeFalse();
      expect(row.get('typeOfAllergicReactions')?.enabled).toBeTrue();
    });

    it('searchComponents with no result re-enables alert', () => {
      const row = arr('allergicList').at(0);
      dialog.open.and.returnValue(createDialogRefMock(undefined));
      component.enableAlert = false;
      component.searchComponents('Peanut', 0, row);
      expect(component.enableAlert).toBeTrue();
      expect(row.get('typeOfAllergicReactions')?.disabled).toBeTrue();
    });

    it('searchComponents with result but empty list only flags component', () => {
      const row = arr('allergicList').at(0);
      arr('allergicList').clear();
      dialog.open.and.returnValue(createDialogRefMock({ component: 'X' }));
      component.searchComponents('Peanut', 0, row);
      expect(component.componentFlag).toBeTrue();
      expect(component.selectedSnomedTerm).toBeUndefined();
    });

    it('searchComponents ignores short terms', () => {
      component.searchComponents('ab', 0, arr('allergicList').at(0));
      expect(dialog.open).not.toHaveBeenCalled();
    });

    it('removeSnomedCode clears a term edited away from the selection', () => {
      const row = arr('allergicList').at(0);
      row.enable();
      row.patchValue({
        snomedTerm: 'Peanut',
        snomedCode: '1',
        allergyName: 'Peanut',
      });
      component.selectedSnomedTerm = undefined;
      component.removeSnomedCode(row, 0);
      // first call adopts the current name as the selection
      expect(component.selectedSnomedTerm).toBe('Peanut');
      expect(confirm.alert).not.toHaveBeenCalled();

      row.patchValue({ snomedTerm: 'Peanu' });
      component.removeSnomedCode(row, 0);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.historyData.ancHistory.personalHistoryANC_OPD_NCD_PNC
          .snomedTermRemoved,
      );
      expect(row.value.snomedCode).toBeNull();
      expect(row.value.allergyName).toBeNull();
      expect(component.selectedSnomedTerm).toBeNull();
    });

    it('removeSnomedCode clears when the term was emptied', () => {
      const row = arr('allergicList').at(0);
      row.enable();
      row.patchValue({ snomedTerm: null, snomedCode: '1' });
      component.selectedSnomedTerm = 'Peanut';
      component.countForSearch = 0;
      component.removeSnomedCode(row, 0);
      expect(confirm.alert).toHaveBeenCalled();
      expect(row.value.snomedCode).toBeNull();
    });

    it('removeSnomedCode drops the selection for a later row', () => {
      const row = arr('allergicList').at(0);
      component.selectedSnomedTerm = 'Peanut';
      component.countForSearch = 0;
      component.removeSnomedCode(row, 2);
      expect(component.selectedSnomedTerm).toBeNull();
      expect(confirm.alert).not.toHaveBeenCalled();
    });
  });

  describe('previous history', () => {
    const cases: [string, string, string][] = [
      [
        'getPreviousTobaccoHistory',
        'getPreviousTobaccoHistory',
        'previousTobaccohistoryDet',
      ],
      [
        'getPreviousAlcoholHistory',
        'getPreviousAlcoholHistory',
        'previousAlcoholhistoryDet',
      ],
      [
        'getPreviousAllergyHistory',
        'getPreviousAllergyHistory',
        'previousAllergyhistoryDet',
      ],
    ];
    beforeEach(() => fixture.detectChanges());

    cases.forEach(([method, svc, titleKey]) => {
      describe(method, () => {
        it('opens previous details dialog when data exists', () => {
          const data = { data: [{ a: 1 }] };
          nurse[svc].and.returnValue(of({ statusCode: 200, data }));
          (component as any)[method]();
          expect(nurse[svc]).toHaveBeenCalledWith('B1', 'General OPD');
          expect(dialog.open).toHaveBeenCalledWith(PreviousDetailsComponent, {
            data: { dataList: data, title: LANGUAGE_EN[titleKey] },
          });
        });

        it('alerts when there is no previous data', () => {
          nurse[svc].and.returnValue(
            of({ statusCode: 200, data: { data: [] } }),
          );
          (component as any)[method]();
          expect(confirm.alert).toHaveBeenCalledWith(
            LANGUAGE_EN.historyData.ancHistory.previousHistoryDetails
              .pastHistoryalert,
          );
        });

        it('alerts error on non-200', () => {
          nurse[svc].and.returnValue(of({ statusCode: 500, data: null }));
          (component as any)[method]();
          expect(confirm.alert).toHaveBeenCalledWith(
            LANGUAGE_EN.alerts.info.errorFetchingHistory,
            'error',
          );
        });

        it('alerts error on failure', () => {
          nurse[svc].and.returnValue(throwingObs());
          (component as any)[method]();
          expect(confirm.alert).toHaveBeenCalledWith(
            LANGUAGE_EN.alerts.info.errorFetchingHistory,
            'error',
          );
        });
      });
    });
  });

  describe('validateDuration', () => {
    let row: FormGroup;
    beforeEach(() => {
      fixture.detectChanges();
      row = component.initTobaccoList();
      row.enable();
    });

    it('accepts a duration within age and enables unit when missing', () => {
      row.patchValue({ duration: 2, durationUnit: null });
      component.validateDuration(row);
      expect(confirm.alert).not.toHaveBeenCalled();
      expect(row.get('durationUnit')?.enabled).toBeTrue();
    });

    it('rejects a duration exceeding age', () => {
      row.patchValue({ duration: 40, durationUnit: 'Years' });
      component.validateDuration(row);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.durationGreaterThanAge,
      );
      expect(row.value.duration).toBeNull();
      expect(row.value.durationUnit).toBeNull();
    });

    it('disables unit when no duration', () => {
      row.patchValue({ duration: null, durationUnit: 'Years' });
      component.validateDuration(row);
      expect(row.get('durationUnit')?.disabled).toBeTrue();
    });

    it('keeps unit when both valid', () => {
      row.patchValue({ duration: 5, durationUnit: 'Years' });
      component.validateDuration(row);
      expect(row.value.durationUnit).toBe('Years');
    });
  });

  it('trackFieldInteraction delegates to tracking service', () => {
    component.trackFieldInteraction('tobacco');
    expect(tracking.trackFieldInteraction).toHaveBeenCalledWith(
      'tobacco',
      'Personal History',
    );
  });

  it('ngDoCheck refreshes the language', () => {
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });
});
