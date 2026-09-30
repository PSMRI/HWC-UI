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
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

import { NcdCareDiagnosisComponent } from './ncd-care-diagnosis.component';
import { DoctorService, MasterdataService } from '../../../../shared/services';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

describe('NcdCareDiagnosisComponent', () => {
  let component: NcdCareDiagnosisComponent;
  let fixture: ComponentFixture<NcdCareDiagnosisComponent>;
  let doctorMaster$: BehaviorSubject<any>;
  let doctorService: any;
  let masterService: any;
  let confirmation: any;
  let session: any;
  let routeParams: any;

  const master = () => ({
    ncdCareConditions: [
      { screeningCondition: 'Diabetes' },
      { screeningCondition: 'Breast Cancer' },
      { screeningCondition: 'Cervical Cancer' },
      { screeningCondition: 'Hypertension' },
    ],
    ncdCareTypes: [{ ncdCareType: 'Screening' }, { ncdCareType: 'Treatment' }],
  });

  const list = () =>
    component.generalDiagnosisForm.get('provisionalDiagnosisList') as FormArray;

  beforeEach(async () => {
    doctorMaster$ = new BehaviorSubject<any>(null);
    routeParams = { attendant: 'doctor' };
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [NcdCareDiagnosisComponent],
      providers: [
        ...commonTestProviders({
          session: {
            serviceLineDetails: JSON.stringify({
              facilityID: 1,
              parkingPlaceID: 2,
            }),
            beneficiaryRegID: 'B1',
            visitID: 'V1',
            visitCategory: 'NCD care',
          },
        }),
        { provide: DoctorService, useValue: autoSpy(DoctorService) },
        {
          provide: MasterdataService,
          useValue: autoSpy(MasterdataService, {
            doctorMasterData$: doctorMaster$.asObservable(),
          }),
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              get params() {
                return routeParams;
              },
            },
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(NcdCareDiagnosisComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(NcdCareDiagnosisComponent);
    component = fixture.componentInstance;
    doctorService = TestBed.inject(DoctorService) as any;
    masterService = TestBed.inject(MasterdataService) as any;
    confirmation = TestBed.inject(ConfirmationService) as any;
    session = TestBed.inject(SessionStorageService) as any;
    component.generalDiagnosisForm =
      component.utils.createNCDCareDiagnosisForm();
  });

  describe('ngOnInit', () => {
    it('initialises a doctor', () => {
      fixture.detectChanges();
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
      expect(component.specialist).toBeFalse();
      expect(
        component.generalDiagnosisForm.controls['specialistDiagnosis'].disabled,
      ).toBeTrue();
      expect(component.visitCategory).toBe('NCD care');
      expect(component.attendantType).toBe('doctor');
      expect(component.enableNCDCondition).toBeTrue();
    });

    it('initialises a TC specialist', () => {
      session.setItem('designation', 'TC Specialist');
      fixture.detectChanges();
      expect(component.specialist).toBeTrue();
      expect(
        component.generalDiagnosisForm.controls['specialistDiagnosis'].enabled,
      ).toBeTrue();
      expect(component.enableNCDCondition).toBeFalse();
    });

    it('keeps NCD condition disabled for nurse', () => {
      routeParams = { attendant: 'nurse' };
      fixture.detectChanges();
      expect(component.enableNCDCondition).toBeFalse();
    });
  });

  it('refreshes language on ngDoCheck', () => {
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  it('exposes provisional diagnosis controls', () => {
    expect(component.provisionalDiagnosisControls.length).toBe(1);
    component.generalDiagnosisForm.removeControl('provisionalDiagnosisList');
    expect(component.provisionalDiagnosisControls).toEqual([]);
  });

  describe('getDoctorMasterData', () => {
    it('filters cancer conditions for male beneficiaries', () => {
      session.setItem('beneficiaryGender', 'Male');
      component.getDoctorMasterData();
      doctorMaster$.next(master());
      expect(
        component.ncdCareConditions.map((c: any) => c.screeningCondition),
      ).toEqual(['Diabetes', 'Hypertension']);
      expect(component.ncdCareTypes.length).toBe(2);
    });

    it('logs when male master data has no conditions', () => {
      const log = spyOn(console, 'log');
      session.setItem('beneficiaryGender', 'Male');
      component.getDoctorMasterData();
      doctorMaster$.next({ ncdCareConditions: null });
      expect(log).toHaveBeenCalledWith(
        'Unable to fetch master data for ncd care conditions',
      );
      expect(component.ncdCareConditions).toEqual([]);
      expect(component.ncdCareTypes).toBeUndefined();
    });

    it('keeps all conditions for female beneficiaries', () => {
      session.setItem('beneficiaryGender', 'Female');
      component.getDoctorMasterData();
      doctorMaster$.next(master());
      expect(component.ncdCareConditions.length).toBe(4);
    });

    it('uses empty conditions for female when missing', () => {
      component.getDoctorMasterData();
      doctorMaster$.next({});
      expect(component.ncdCareConditions).toEqual([]);
    });

    it('fetches and patches diagnosis in view mode', () => {
      component.caseRecordMode = 'view';
      doctorService.getCaseRecordAndReferDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            diagnosis: {
              ncdScreeningConditionArray: ['Diabetes'],
              ncdScreeningConditionOther: 'Other thing',
              ncdCareType: 'Treatment',
              provisionalDiagnosisList: [{ term: 'DM', conceptID: 'C1' }],
            },
          },
        }),
      );
      component.getDoctorMasterData();
      doctorMaster$.next(master());
      expect(doctorService.getCaseRecordAndReferDetails).toHaveBeenCalledWith(
        'B1',
        'V1',
        'NCD care',
      );
      expect(component.temp).toEqual(['Diabetes']);
      expect(component.isNcdScreeningConditionOther).toBeTrue();
      expect(component.generalDiagnosisForm.value.ncdCareType).toEqual({
        ncdCareType: 'Treatment',
      });
      expect(list().length).toBe(2);
      expect(list().at(0).value.term).toBe('DM');
    });

    it('ignores failed diagnosis responses and missing provisional list', () => {
      component.caseRecordMode = 'view';
      doctorService.getCaseRecordAndReferDetails.and.returnValues(
        of({ statusCode: 5000 }),
        of({ statusCode: 200, data: { diagnosis: { ncdCareType: 'None' } } }),
      );
      component.getDoctorMasterData();
      doctorMaster$.next(master());
      expect(component.temp).toEqual([]);
      doctorMaster$.next(master());
      expect(component.generalDiagnosisForm.value.ncdCareType).toBe('None');
      expect(component.isNcdScreeningConditionOther).toBeFalse();
      expect(list().length).toBe(1);
    });

    it('ignores null master data', () => {
      component.getDoctorMasterData();
      expect(component.ncdCareConditions).toEqual([]);
      expect(component.ncdCareTypes).toBeUndefined();
    });
  });

  it('patchProvisionalDiagnosisDetails skips empty first diagnosis', () => {
    component.patchProvisionalDiagnosisDetails([{ term: '', conceptID: '' }]);
    expect(list().length).toBe(1);
  });

  it('addDiagnosis adds until 30 then alerts', () => {
    fixture.detectChanges();
    for (let i = 0; i < 29; i++) component.addDiagnosis();
    expect(list().length).toBe(30);
    component.addDiagnosis();
    expect(list().length).toBe(30);
    expect(confirmation.alert).toHaveBeenCalledWith(
      LANGUAGE_EN.alerts.info.maxDiagnosis,
    );
  });

  describe('removeDiagnosisFromList', () => {
    beforeEach(() => fixture.detectChanges());
    const fillValid = (i: number) =>
      list()
        .at(i)
        .patchValue({ term: 'T' + i, conceptID: 'C' + i });

    it('removes a valid entry after confirmation when multiple', () => {
      component.addDiagnosis();
      fillValid(0);
      fillValid(1);
      component.removeDiagnosisFromList(0);
      expect(confirmation.confirm).toHaveBeenCalledWith(
        'warn',
        LANGUAGE_EN.alerts.info.warn,
      );
      expect(list().length).toBe(1);
      expect(list().at(0).value.term).toBe('T1');
    });

    it('resets the last valid entry after confirmation', () => {
      fillValid(0);
      component.removeDiagnosisFromList(0);
      expect(list().length).toBe(1);
      expect(list().at(0).value.term).toBeNull();
    });

    it('keeps entry when confirmation declined', () => {
      confirmation.confirm.and.returnValue(of(false));
      fillValid(0);
      component.removeDiagnosisFromList(0);
      expect(list().at(0).value.term).toBe('T0');
    });

    it('removes invalid entry directly when multiple', () => {
      component.addDiagnosis();
      fillValid(0);
      component.removeDiagnosisFromList(1);
      expect(confirmation.confirm).not.toHaveBeenCalled();
      expect(list().length).toBe(1);
    });

    it('replaces the only invalid entry', () => {
      const first = list().at(0);
      component.removeDiagnosisFromList(0);
      expect(list().length).toBe(1);
      expect(list().at(0)).not.toBe(first);
    });
  });

  it('checkProvisionalDiagnosisValidity', () => {
    expect(
      component.checkProvisionalDiagnosisValidity({
        value: { term: 'a', conceptID: 'b' },
      }),
    ).toBeFalse();
    expect(
      component.checkProvisionalDiagnosisValidity({ value: {} }),
    ).toBeTrue();
  });

  describe('changeNcdScreeningCondition', () => {
    it('shows other when Other selected', () => {
      component.changeNcdScreeningCondition(['Diabetes', 'Other'], null);
      expect(component.isNcdScreeningConditionOther).toBeTrue();
      expect(
        component.generalDiagnosisForm.value.ncdScreeningConditionArray,
      ).toEqual(['Diabetes', 'Other']);
    });

    [['Diabetes'], [], null].forEach((val) => {
      it(`clears other for ${JSON.stringify(val)}`, () => {
        component.generalDiagnosisForm.patchValue({
          ncdScreeningConditionOther: 'x',
        });
        component.isNcdScreeningConditionOther = true;
        component.changeNcdScreeningCondition(val, null);
        expect(component.isNcdScreeningConditionOther).toBeFalse();
        expect(
          component.generalDiagnosisForm.value.ncdScreeningConditionOther,
        ).toBeNull();
        expect(component.temp).toEqual(val);
      });
    });
  });

  it('ngOnDestroy unsubscribes', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
    component.getDiagnosisDetails('B', 'V', 'C');
    const sub = component.diagnosisSubscription;
    component.ngOnDestroy();
    expect(sub.closed).toBeTrue();
  });

  describe('diagnosis autocomplete', () => {
    const res = (items: any[]) => of({ data: { sctMaster: items } });

    it('resets state for short terms', () => {
      component.suggestedDiagnosisList[0] = [{ term: 'x' }];
      component.onDiagnosisInputKeyup('ab', 0);
      component.onDiagnosisInputKeyup(undefined as any, 0);
      expect(component.suggestedDiagnosisList[0]).toEqual([]);
      expect(component.lastQueryByIndex[0]).toBe('');
      expect(masterService.searchDiagnosisBasedOnPageNo).not.toHaveBeenCalled();
    });

    it('fetches first page and re-fetches same term', () => {
      masterService.searchDiagnosisBasedOnPageNo.and.returnValue(
        res([{ id: 1 }]),
      );
      component.onDiagnosisInputKeyup(' fev ', 0);
      component.onDiagnosisInputKeyup('fev', 0);
      expect(masterService.searchDiagnosisBasedOnPageNo).toHaveBeenCalledWith(
        'fev',
        0,
      );
      expect(masterService.searchDiagnosisBasedOnPageNo).toHaveBeenCalledTimes(
        2,
      );
      expect(component.suggestedDiagnosisList[0]).toEqual([{ id: 1 }]);
    });

    it('marks noMore for missing payload', () => {
      masterService.searchDiagnosisBasedOnPageNo.and.returnValue(of(null));
      component.onDiagnosisInputKeyup('fev', 0);
      expect(component.noMore[0]).toBeTrue();
    });

    it('appends next page with de-duplication', () => {
      masterService.searchDiagnosisBasedOnPageNo.and.returnValues(
        res([{ id: 1 }, { code: 'c2' }]),
        res([{ id: 1 }, { code: 'c2' }, { term: 't3' }]),
      );
      component.onDiagnosisInputKeyup('fev', 0);
      component.onAutoNearEnd(0);
      expect(component.suggestedDiagnosisList[0].length).toBe(3);
      expect(component.pageByIndex[0]).toBe(1);
    });

    it('append works when no previous list exists', () => {
      component.lastQueryByIndex[2] = 'abc';
      masterService.searchDiagnosisBasedOnPageNo.and.returnValue(
        res([{ id: 5 }]),
      );
      component.onAutoNearEnd(2);
      expect(component.suggestedDiagnosisList[2]).toEqual([{ id: 5 }]);
    });

    it('does nothing near end without query or when noMore', () => {
      component.onAutoNearEnd(0);
      component.lastQueryByIndex[0] = 'abc';
      component.noMore[0] = true;
      component.onAutoNearEnd(0);
      expect(masterService.searchDiagnosisBasedOnPageNo).not.toHaveBeenCalled();
    });

    it('queues and chains a request while loading', () => {
      const first = new Subject<any>();
      masterService.searchDiagnosisBasedOnPageNo.and.returnValues(
        first.asObservable(),
        res([{ id: 2 }]),
      );
      component.onDiagnosisInputKeyup('fev', 0);
      component.onAutoNearEnd(0);
      expect(component.wantMore[0]).toBeTrue();
      component.onDiagnosisInputKeyup('fev', 0);
      expect(masterService.searchDiagnosisBasedOnPageNo).toHaveBeenCalledTimes(
        1,
      );
      first.next({ data: { sctMaster: [{ id: 1 }] } });
      first.complete();
      expect(component.suggestedDiagnosisList[0]).toEqual([
        { id: 1 },
        { id: 2 },
      ]);
    });

    it('ignores stale results', () => {
      const first = new Subject<any>();
      masterService.searchDiagnosisBasedOnPageNo.and.returnValue(
        first.asObservable(),
      );
      component.onDiagnosisInputKeyup('fev', 0);
      component.lastQueryByIndex[0] = 'other';
      first.next({ data: { sctMaster: [{ id: 1 }] } });
      first.complete();
      expect(component.suggestedDiagnosisList[0]).toEqual([]);
    });

    it('logs on search error', () => {
      const err = spyOn(console, 'error');
      masterService.searchDiagnosisBasedOnPageNo.and.returnValue(throwingObs());
      component.onDiagnosisInputKeyup('fev', 0);
      expect(err).toHaveBeenCalledWith('Error fetching diagnosis data');
    });
  });

  it('displayDiagnosis and onDiagnosisSelected', () => {
    expect(component.displayDiagnosis('abc')).toBe('abc');
    expect(component.displayDiagnosis({ term: 'X' })).toBe('X');
    expect(component.displayDiagnosis(undefined)).toBe('');
    const sel = { term: 'Fever', conceptID: 'C1' };
    component.onDiagnosisSelected(sel, 0);
    expect((list().at(0) as FormGroup).value).toEqual({
      viewProvisionalDiagnosisProvided: sel,
      conceptID: 'C1',
      term: 'Fever',
    });
    component.onDiagnosisSelected(null, 0);
    expect(list().at(0).value.conceptID).toBeNull();
  });
});
