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
import { BehaviorSubject, of, Subject } from 'rxjs';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

import { GeneralOpdDiagnosisComponent } from './general-opd-diagnosis.component';
import { DoctorService, MasterdataService } from '../../../../shared/services';
import { ConfirmationService } from '../../../../../core/services/confirmation.service';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

describe('GeneralOpdDiagnosisComponent', () => {
  let component: GeneralOpdDiagnosisComponent;
  let fixture: ComponentFixture<GeneralOpdDiagnosisComponent>;
  let caseRecord$: BehaviorSubject<any>;
  let doctorService: any;
  let masterService: any;
  let confirmation: any;
  let session: any;

  const list = () =>
    component.generalDiagnosisForm.get('provisionalDiagnosisList') as FormArray;

  beforeEach(async () => {
    caseRecord$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [GeneralOpdDiagnosisComponent],
      providers: [
        ...commonTestProviders({
          session: {
            serviceLineDetails: JSON.stringify({
              facilityID: 1,
              parkingPlaceID: 2,
            }),
            beneficiaryRegID: 'B1',
            visitID: 'V1',
            visitCategory: 'General OPD',
            visitCode: 'VC1',
          },
        }),
        {
          provide: DoctorService,
          useValue: autoSpy(DoctorService, {
            populateCaserecordResponse$: caseRecord$.asObservable(),
          }),
        },
        { provide: MasterdataService, useValue: autoSpy(MasterdataService) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(GeneralOpdDiagnosisComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(GeneralOpdDiagnosisComponent);
    component = fixture.componentInstance;
    doctorService = TestBed.inject(DoctorService) as any;
    masterService = TestBed.inject(MasterdataService) as any;
    confirmation = TestBed.inject(ConfirmationService) as any;
    session = TestBed.inject(SessionStorageService) as any;
    component.generalDiagnosisForm =
      component.utils.createGeneralDiagnosisForm();
  });

  describe('ngOnInit', () => {
    it('disables instruction for non-specialist', () => {
      fixture.detectChanges();
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
      expect(component.specialist).toBeFalse();
      expect(component.specialistDaignosis?.disabled).toBeTrue();
    });

    it('enables instruction for TC Specialist', () => {
      session.setItem('designation', 'TC Specialist');
      fixture.detectChanges();
      expect(component.specialist).toBeTrue();
      expect(component.specialistDaignosis?.enabled).toBeTrue();
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

  describe('ngOnChanges', () => {
    const diagnosis = {
      instruction: 'rest',
      provisionalDiagnosisList: [
        { term: 'Fever', conceptID: 'C1' },
        { term: 'Cold', conceptID: 'C2' },
      ],
    };

    it('does nothing when not in view mode', () => {
      component.caseRecordMode = 'edit';
      component.ngOnChanges();
      expect(component.diagnosisSubscription).toBeUndefined();
      expect(
        doctorService.getMMUCaseRecordAndReferDetails,
      ).not.toHaveBeenCalled();
    });

    ['undefined', null].forEach((ref) => {
      it(`uses populated case record when referredVisitCode is ${ref}`, () => {
        if (ref !== null) session.setItem('referredVisitCode', ref);
        component.caseRecordMode = 'view';
        component.ngOnChanges();
        caseRecord$.next({ statusCode: 200, data: { diagnosis } });
        expect(component.generalDiagnosisForm.get('instruction')?.value).toBe(
          'rest',
        );
        expect(list().length).toBe(3);
        expect(list().at(0).value.term).toBe('Fever');
        expect(list().at(1).value.conceptID).toBe('C2');
        expect(
          (list().at(0) as FormGroup).controls[
            'viewProvisionalDiagnosisProvided'
          ].disabled,
        ).toBeTrue();
      });
    });

    it('ignores populated responses without provisional list', () => {
      component.caseRecordMode = 'view';
      component.ngOnChanges();
      caseRecord$.next({
        statusCode: 200,
        data: { diagnosis: { instruction: 'x' } },
      });
      caseRecord$.next({ statusCode: 5000 });
      expect(component.generalDiagnosisForm.get('instruction')?.value).toBe(
        'x',
      );
      expect(list().length).toBe(1);
    });

    it('fetches MMU details for specialist flag 3', () => {
      session.setItem('referredVisitCode', 'RVC');
      session.setItem('specialist_flag', '3');
      doctorService.getMMUCaseRecordAndReferDetails.and.returnValue(
        of({ statusCode: 200, data: { diagnosis } }),
      );
      component.caseRecordMode = 'view';
      component.ngOnChanges();
      expect(
        doctorService.getMMUCaseRecordAndReferDetails,
      ).toHaveBeenCalledWith('B1', 'V1', 'General OPD', 'VC1');
      expect(list().length).toBe(3);
    });

    it('fetches MMU details with referred visit otherwise', () => {
      session.setItem('referredVisitCode', 'RVC');
      session.setItem('referredVisitID', 'RV');
      doctorService.getMMUCaseRecordAndReferDetails.and.returnValue(
        of({ statusCode: 200, data: { diagnosis: { instruction: 'y' } } }),
      );
      component.caseRecordMode = 'view';
      component.ngOnChanges();
      expect(
        doctorService.getMMUCaseRecordAndReferDetails,
      ).toHaveBeenCalledWith('B1', 'RV', 'General OPD', 'RVC');
      expect(component.generalDiagnosisForm.get('instruction')?.value).toBe(
        'y',
      );
      expect(list().length).toBe(1);
    });
  });

  it('getMMUDiagnosisDetails tolerates a missing observable and bad response', () => {
    doctorService.getMMUCaseRecordAndReferDetails.and.returnValue(undefined);
    component.getMMUDiagnosisDetails('B', 'V', 'C', 'VC');
    expect(component.MMUdiagnosisSubscription).toBeUndefined();
    doctorService.getMMUCaseRecordAndReferDetails.and.returnValue(
      of({ statusCode: 5000 }),
    );
    component.getMMUDiagnosisDetails('B', 'V', 'C', 'VC');
    expect(list().length).toBe(1);
  });

  it('patchDiagnosisDetails skips empty first diagnosis', () => {
    component.patchDiagnosisDetails([{ term: '', conceptID: '' }]);
    expect(list().length).toBe(1);
    expect(list().at(0).value.term).toBeNull();
  });

  describe('addDiagnosis', () => {
    it('adds until 30 then alerts', () => {
      fixture.detectChanges();
      for (let i = 0; i < 29; i++) component.addDiagnosis();
      expect(list().length).toBe(30);
      component.addDiagnosis();
      expect(list().length).toBe(30);
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.maxDiagnosis,
      );
    });
  });

  describe('removeDiagnosisFromList', () => {
    beforeEach(() => fixture.detectChanges());

    function fillValid(i: number) {
      list()
        .at(i)
        .patchValue({ term: 'T' + i, conceptID: 'C' + i });
    }

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
      expect(list().at(0).value.term).toBe('T0');
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
      component.checkProvisionalDiagnosisValidity({ value: { term: 'a' } }),
    ).toBeTrue();
  });

  it('ngOnDestroy unsubscribes', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
    component.caseRecordMode = 'view';
    component.ngOnChanges();
    const sub = component.diagnosisSubscription;
    const mmu = { unsubscribe: jasmine.createSpy('unsub') };
    component.MMUdiagnosisSubscription = mmu;
    component.ngOnDestroy();
    expect(sub.closed).toBeTrue();
    expect(mmu.unsubscribe).toHaveBeenCalled();
    component.MMUdiagnosisSubscription = {};
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  describe('diagnosis autocomplete', () => {
    const res = (items: any[]) => of({ data: { sctMaster: items } });

    it('resets state for short terms', () => {
      component.suggestedDiagnosisList[0] = [{ term: 'x' }];
      component.onDiagnosisInputKeyup('ab', 0);
      expect(component.suggestedDiagnosisList[0]).toEqual([]);
      expect(component.lastQueryByIndex[0]).toBe('');
      component.onDiagnosisInputKeyup(undefined as any, 0);
      expect(masterService.searchDiagnosisBasedOnPageNo).not.toHaveBeenCalled();
    });

    it('fetches first page for new term', () => {
      masterService.searchDiagnosisBasedOnPageNo.and.returnValue(
        res([{ id: 1, term: 'Fever' }]),
      );
      component.onDiagnosisInputKeyup(' fev ', 0);
      expect(masterService.searchDiagnosisBasedOnPageNo).toHaveBeenCalledWith(
        'fev',
        0,
      );
      expect(component.suggestedDiagnosisList[0]).toEqual([
        { id: 1, term: 'Fever' },
      ]);
      expect(component.pageByIndex[0]).toBe(0);
      expect(component.loadingMore[0]).toBeFalse();
      expect(component.noMore[0]).toBeFalse();
    });

    it('re-fetches same term without resetting list', () => {
      masterService.searchDiagnosisBasedOnPageNo.and.returnValue(
        res([{ id: 1 }]),
      );
      component.onDiagnosisInputKeyup('fev', 0);
      component.onDiagnosisInputKeyup('fev', 0);
      expect(masterService.searchDiagnosisBasedOnPageNo).toHaveBeenCalledTimes(
        2,
      );
      expect(component.suggestedDiagnosisList[0]).toEqual([{ id: 1 }]);
    });

    it('marks noMore for empty results and missing payload', () => {
      masterService.searchDiagnosisBasedOnPageNo.and.returnValue(of(null));
      component.onDiagnosisInputKeyup('fev', 0);
      expect(component.suggestedDiagnosisList[0]).toEqual([]);
      expect(component.noMore[0]).toBeTrue();
    });

    it('appends next page with de-duplication', () => {
      masterService.searchDiagnosisBasedOnPageNo.and.returnValues(
        res([{ id: 1 }, { code: 'c2' }]),
        res([{ id: 1 }, { code: 'c2' }, { term: 't3' }]),
      );
      component.onDiagnosisInputKeyup('fev', 0);
      component.onAutoNearEnd(0);
      expect(
        masterService.searchDiagnosisBasedOnPageNo.calls.mostRecent().args,
      ).toEqual(['fev', 1]);
      expect(component.suggestedDiagnosisList[0]).toEqual([
        { id: 1 },
        { code: 'c2' },
        { term: 't3' },
      ]);
      expect(component.pageByIndex[0]).toBe(1);
    });

    it('append works when no previous list exists', () => {
      component.lastQueryByIndex[2] = 'abc';
      masterService.searchDiagnosisBasedOnPageNo.and.returnValue(
        res([{ id: 5 }]),
      );
      component.onAutoNearEnd(2);
      expect(
        masterService.searchDiagnosisBasedOnPageNo.calls.mostRecent().args,
      ).toEqual(['abc', 1]);
      expect(component.suggestedDiagnosisList[2]).toEqual([{ id: 5 }]);
    });

    it('does nothing near end without a query or when noMore', () => {
      component.onAutoNearEnd(0);
      component.lastQueryByIndex[0] = 'abc';
      component.noMore[0] = true;
      component.onAutoNearEnd(0);
      expect(masterService.searchDiagnosisBasedOnPageNo).not.toHaveBeenCalled();
      expect(component.wantMore[0]).toBeUndefined();
    });

    it('queues and chains a request while loading', () => {
      const first = new Subject<any>();
      masterService.searchDiagnosisBasedOnPageNo.and.returnValues(
        first.asObservable(),
        res([{ id: 2 }]),
      );
      component.onDiagnosisInputKeyup('fev', 0);
      expect(component.loadingMore[0]).toBeTrue();
      component.onAutoNearEnd(0);
      expect(component.wantMore[0]).toBeTrue();
      component.onDiagnosisInputKeyup('fev', 0);
      expect(masterService.searchDiagnosisBasedOnPageNo).toHaveBeenCalledTimes(
        1,
      );
      first.next({ data: { sctMaster: [{ id: 1 }] } });
      first.complete();
      expect(masterService.searchDiagnosisBasedOnPageNo).toHaveBeenCalledTimes(
        2,
      );
      expect(component.suggestedDiagnosisList[0]).toEqual([
        { id: 1 },
        { id: 2 },
      ]);
      expect(component.wantMore[0]).toBeFalse();
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
      expect(component.loadingMore[0]).toBeFalse();
    });

    it('logs on search error', () => {
      const err = spyOn(console, 'error');
      masterService.searchDiagnosisBasedOnPageNo.and.returnValue(throwingObs());
      component.onDiagnosisInputKeyup('fev', 0);
      expect(err).toHaveBeenCalledWith('Error fetching diagnosis data');
    });
  });

  it('displayDiagnosis handles strings, objects and nulls', () => {
    expect(component.displayDiagnosis('abc')).toBe('abc');
    expect(component.displayDiagnosis({ term: 'Fever' })).toBe('Fever');
    expect(component.displayDiagnosis(null)).toBe('');
  });

  it('onDiagnosisSelected patches the row', () => {
    const sel = { term: 'Fever', conceptID: 'C1' };
    component.onDiagnosisSelected(sel, 0);
    expect(list().at(0).value).toEqual({
      viewProvisionalDiagnosisProvided: sel,
      conceptID: 'C1',
      term: 'Fever',
    });
    component.onDiagnosisSelected(null, 0);
    expect(list().at(0).value.term).toBeNull();
  });
});
