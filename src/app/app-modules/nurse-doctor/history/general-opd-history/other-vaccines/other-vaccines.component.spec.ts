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
import { FormArray, FormGroup } from '@angular/forms';
import { BehaviorSubject, of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import { OtherVaccinesComponent } from './other-vaccines.component';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../../shared/services';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { BeneficiaryDetailsService } from '../../../../core/services/beneficiary-details.service';
import { RegistrarService } from 'src/app/app-modules/registrar/shared/services/registrar.service';
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

const makeVaccines = () => [
  { vaccineName: 'Typhoid', sctCode: '1', sctTerm: 't1' },
  { vaccineName: 'Hepatitis A', sctCode: null, sctTerm: null },
  { vaccineName: 'Other', sctCode: null, sctTerm: null },
];

describe('OtherVaccinesComponent', () => {
  let component: OtherVaccinesComponent;
  let fixture: ComponentFixture<OtherVaccinesComponent>;
  let masterData$: BehaviorSubject<any>;
  let history$: BehaviorSubject<any>;
  let beneficiary$: BehaviorSubject<any>;
  let regMaster$: BehaviorSubject<any>;
  let registrar: any;
  let nurseService: any;
  let confirmation: any;
  let dialog: any;
  let session: any;
  let V: any[];

  const list = () =>
    component.otherVaccinesForm.controls['otherVaccines'] as FormArray;

  beforeEach(async () => {
    V = makeVaccines();
    masterData$ = new BehaviorSubject<any>(null);
    history$ = new BehaviorSubject<any>(null);
    beneficiary$ = new BehaviorSubject<any>({ age: '5 years - 0 months' });
    regMaster$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [OtherVaccinesComponent],
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
          provide: BeneficiaryDetailsService,
          useValue: autoSpy(BeneficiaryDetailsService, {
            beneficiaryDetails$: beneficiary$.asObservable(),
          }),
        },
        {
          provide: RegistrarService,
          useValue: autoSpy(RegistrarService, {
            registrationMasterDetails$: regMaster$.asObservable(),
          }),
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(OtherVaccinesComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(OtherVaccinesComponent);
    component = fixture.componentInstance;
    component.otherVaccinesForm = new FormGroup({
      otherVaccines: new FormArray<any>([]),
    });
    registrar = TestBed.inject(RegistrarService);
    nurseService = TestBed.inject(NurseService);
    confirmation = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    session = TestBed.inject(SessionStorageService);
  });

  it('initialises language, beneficiary and registrar master', () => {
    fixture.detectChanges();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.beneficiary).toEqual({ age: '5 years - 0 months' });
    expect(registrar.getRegistrationMaster).toHaveBeenCalledWith(1);
    expect(component.registrarMasterData).toBeUndefined();
    regMaster$.next({ ageUnit: [] });
    expect(component.registrarMasterData).toEqual({ ageUnit: [] });
  });

  it('adds a vaccine row when master data arrives (edit mode)', () => {
    const spy = spyOn(component, 'getGeneralHistory');
    fixture.detectChanges();
    masterData$.next({ vaccineMasterData: V });
    expect(component.vaccineMasterData).toBe(V);
    expect(list().length).toBe(1);
    expect(component.vaccineSelectList).toEqual([V]);
    expect(spy).not.toHaveBeenCalled();
    expect(component.getOtherVaccines()?.length).toBe(1);
  });

  it('loads history in view mode', () => {
    component.mode = 'view';
    const spy = spyOn(component, 'getGeneralHistory');
    fixture.detectChanges();
    masterData$.next({ vaccineMasterData: V });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('loads history for specialist flag 100', () => {
    session.setItem('specialistFlag', '100');
    const spy = spyOn(component, 'getGeneralHistory');
    fixture.detectChanges();
    masterData$.next({ vaccineMasterData: V });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('getOtherVaccines returns null without FormArray', () => {
    component.otherVaccinesForm = new FormGroup({});
    expect(component.getOtherVaccines()).toBeNull();
  });

  describe('addOtherVaccine', () => {
    it('excludes already selected (non-Other) vaccines', () => {
      component.vaccineMasterData = V;
      component.addOtherVaccine();
      list().at(0).patchValue({ vaccineName: V[0] });
      component.addOtherVaccine();
      expect(
        component.vaccineSelectList[1].map((v: any) => v.vaccineName),
      ).toEqual(['Hepatitis A', 'Other']);
    });

    it('keeps Other selectable', () => {
      component.vaccineMasterData = V;
      component.addOtherVaccine();
      list().at(0).patchValue({ vaccineName: V[2] });
      component.addOtherVaccine();
      expect(component.vaccineSelectList[1].length).toBe(3);
    });

    it('adds an empty option list when no master data', () => {
      component.vaccineMasterData = null;
      component.addOtherVaccine();
      expect(component.vaccineSelectList).toEqual([[]]);
      expect(list().length).toBe(1);
    });
  });

  describe('getGeneralHistory / handleOtherVaccinesData', () => {
    beforeEach(() => {
      component.vaccineMasterData = V;
      component.addOtherVaccine();
    });

    it('adds rows for each entry without a vaccine name', () => {
      component.getGeneralHistory();
      history$.next({
        statusCode: 200,
        data: {
          childOptionalVaccineHistory: {
            childOptionalVaccineList: [
              { vaccineName: null },
              { vaccineName: null },
            ],
          },
        },
      });
      expect(list().length).toBe(2);
      expect(component.otherVaccineData.childOptionalVaccineList.length).toBe(
        2,
      );
    });

    // App bug: handleOtherVaccinesData passes the vaccine object itself to
    // filterOtherVaccineList, which reads `event.value` (undefined) and then
    // dereferences it, so any entry with a vaccine name throws.
    it('throws when a history entry has a vaccine name (current behaviour)', () => {
      component.otherVaccineData = {
        childOptionalVaccineList: [{ vaccineName: 'Typhoid' }],
      };
      expect(() => component.handleOtherVaccinesData()).toThrowError(TypeError);
      expect(list().at(0).value.vaccineName).toEqual(V[0]);
    });

    it('ignores response without optional vaccine history', () => {
      component.getGeneralHistory();
      history$.next({ statusCode: 200, data: {} });
      expect(component.otherVaccineData).toBeUndefined();
    });
  });

  describe('filterOtherVaccineList', () => {
    beforeEach(() => {
      component.vaccineMasterData = V;
      component.addOtherVaccine();
      component.addOtherVaccine();
    });

    it('sets snomed codes and removes the vaccine from other rows', () => {
      const row = list().at(0);
      row.patchValue({ otherVaccineName: 'x' });
      component.filterOtherVaccineList({ value: V[0] }, 0, row);
      expect(row.value.sctCode).toBe('1');
      expect(row.value.sctTerm).toBe('t1');
      expect(row.value.otherVaccineName).toBeNull();
      expect(component.vaccineSelectList[1]).not.toContain(V[0]);
      expect(component.vaccineSelectList[0]).toContain(V[0]);
      expect(component.previousSelectedVaccineList[0]).toBe(V[0]);
    });

    it('clears snomed codes when vaccine has none and restores previous value', () => {
      const row = list().at(0);
      component.filterOtherVaccineList({ value: V[0] }, 0, row);
      component.filterOtherVaccineList({ value: V[1] }, 0, row);
      expect(row.value.sctCode).toBeNull();
      expect(component.vaccineSelectList[1]).toContain(V[0]);
      expect(component.vaccineSelectList[1]).not.toContain(V[1]);
      expect(
        component.vaccineSelectList[1].map((v: any) => v.vaccineName),
      ).toEqual(['Other', 'Typhoid']);
    });

    it('does not patch or remove Other', () => {
      const row = list().at(0);
      row.patchValue({ otherVaccineName: 'custom' });
      component.filterOtherVaccineList({ value: V[2] }, 0, row);
      expect(row.value.otherVaccineName).toBe('custom');
      expect(component.vaccineSelectList[1]).toContain(V[2]);
    });
  });

  describe('removeOtherVaccine', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.vaccineMasterData = V;
      component.addOtherVaccine();
    });

    it('resets the only row', () => {
      const row = list().at(0);
      row.patchValue({ vaccineName: V[0] });
      component.removeOtherVaccine(0, row);
      expect(confirmation.confirm).toHaveBeenCalledWith(
        'warn',
        LANGUAGE_EN.alerts.info.warn,
      );
      expect(list().length).toBe(1);
      expect(row.value.vaccineName).toBeNull();
    });

    it('removes a row and returns its vaccine to other lists', () => {
      component.addOtherVaccine();
      component.filterOtherVaccineList({ value: V[0] }, 1, list().at(1));
      expect(component.vaccineSelectList[0]).not.toContain(V[0]);
      component.removeOtherVaccine(1, list().at(1));
      expect(list().length).toBe(1);
      expect(component.vaccineSelectList.length).toBe(1);
      expect(component.vaccineSelectList[0]).toContain(V[0]);
    });

    it('removes a row without previous selection', () => {
      component.addOtherVaccine();
      component.removeOtherVaccine(1);
      expect(list().length).toBe(1);
    });

    it('does nothing when cancelled', () => {
      confirmation.confirm.and.returnValue(of(false));
      component.addOtherVaccine();
      component.removeOtherVaccine(1, list().at(1));
      expect(list().length).toBe(2);
    });
  });

  describe('getPreviousOtherVaccineDetails', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.visitCategory = 'PNC';
    });

    it('opens dialog when data exists', () => {
      const data = { data: [{ a: 1 }] };
      nurseService.getPreviousOtherVaccines.and.returnValue(
        of({ statusCode: 200, data }),
      );
      component.getPreviousOtherVaccineDetails();
      expect(nurseService.getPreviousOtherVaccines).toHaveBeenCalledWith(
        'B1',
        'PNC',
      );
      expect(dialog.open).toHaveBeenCalledWith(PreviousDetailsComponent, {
        data: { dataList: data, title: LANGUAGE_EN.common.prevVaccine },
      });
    });

    it('uses "{}" when beneficiaryRegID missing', () => {
      session.removeItem('beneficiaryRegID');
      nurseService.getPreviousOtherVaccines.and.returnValue(
        of({ statusCode: 200, data: { data: [] } }),
      );
      component.getPreviousOtherVaccineDetails();
      expect(nurseService.getPreviousOtherVaccines).toHaveBeenCalledWith(
        '{}',
        'PNC',
      );
    });

    it('alerts when empty', () => {
      nurseService.getPreviousOtherVaccines.and.returnValue(
        of({ statusCode: 200, data: { data: [] } }),
      );
      component.getPreviousOtherVaccineDetails();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.pastHistoryNot,
      );
    });

    it('alerts error on non-200', () => {
      nurseService.getPreviousOtherVaccines.and.returnValue(
        of({ statusCode: 5000, data: null }),
      );
      component.getPreviousOtherVaccineDetails();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.errorFetchingHistory,
        'error',
      );
    });

    it('alerts error on failure', () => {
      nurseService.getPreviousOtherVaccines.and.returnValue(throwingObs());
      component.getPreviousOtherVaccineDetails();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.errorFetchingHistory,
        'error',
      );
    });
  });

  describe('age validation', () => {
    let row: any;
    beforeEach(() => {
      fixture.detectChanges();
      component.vaccineMasterData = V;
      component.addOtherVaccine();
      row = list().at(0);
      component.registrarMasterData = {
        ageUnit: [
          { id: 1, name: 'Years' },
          { id: 2, name: 'Months' },
        ],
      };
    });

    it('onAgeUnitEntered sets unit id and keeps valid age', () => {
      row.patchValue({ actualReceivingAge: 2, ageUnit: 'Years' });
      component.onAgeUnitEntered(0, row);
      expect(row.value.ageUnitID).toBe(1);
      expect(row.value.actualReceivingAge).toBe(2);
      expect(confirmation.alert).not.toHaveBeenCalled();
    });

    it('alerts and clears age greater than beneficiary age', () => {
      row.patchValue({ actualReceivingAge: 10, ageUnit: 'Years' });
      component.onAgeUnitEntered(0, row);
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.ageOfReceivingVaccine,
      );
      expect(row.value.actualReceivingAge).toBeNull();
      expect(row.value.ageUnit).toBeNull();
      expect(row.value.ageUnitID).toBeNull();
    });

    it('clears unit when age missing', () => {
      row.patchValue({
        actualReceivingAge: null,
        ageUnit: 'Months',
        ageUnitID: 2,
      });
      component.validateAge(row);
      expect(row.value.ageUnit).toBeNull();
      expect(row.value.ageUnitID).toBeNull();
    });

    it('does nothing when neither set', () => {
      component.validateAge(row);
      expect(confirmation.alert).not.toHaveBeenCalled();
      expect(row.value.ageUnit).toBeNull();
    });
  });

  it('sortOtherVaccineList sorts by name', () => {
    const l = [
      { vaccineName: 'b' },
      { vaccineName: 'a' },
      { vaccineName: 'b' },
    ];
    component.sortOtherVaccineList(l);
    expect(l.map((x) => x.vaccineName)).toEqual(['a', 'b', 'b']);
  });

  it('checkValidity is false only when all required values present', () => {
    expect(component.checkValidity({ value: {} })).toBeTrue();
    expect(
      component.checkValidity({
        value: {
          vaccineName: 'x',
          actualReceivingAge: 1,
          receivedFacilityName: 'f',
        },
      }),
    ).toBeFalse();
  });

  it('unsubscribes on destroy', () => {
    fixture.detectChanges();
    component.getGeneralHistory();
    const s1 = spyOn(component.nurseMasterDataSubscription, 'unsubscribe');
    const s2 = spyOn(component.generalHistorySubscription, 'unsubscribe');
    const s3 = spyOn(component.beneficiaryDetailSubscription, 'unsubscribe');
    component.ngOnDestroy();
    expect(s1).toHaveBeenCalled();
    expect(s2).toHaveBeenCalled();
    expect(s3).toHaveBeenCalled();
  });

  it('ngOnDestroy without subscriptions does not throw', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('ngDoCheck assigns language', () => {
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });
});
