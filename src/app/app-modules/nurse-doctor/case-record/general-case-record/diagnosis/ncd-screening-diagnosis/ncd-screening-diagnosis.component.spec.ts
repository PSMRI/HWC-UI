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

import { NcdScreeningDiagnosisComponent } from './ncd-screening-diagnosis.component';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { MasterdataService } from 'src/app/app-modules/nurse-doctor/shared/services';
import { DoctorService } from 'src/app/app-modules/nurse-doctor/shared/services/doctor.service';
import { IdrsscoreService } from 'src/app/app-modules/nurse-doctor/shared/services/idrsscore.service';
import { NcdScreeningService } from 'src/app/app-modules/nurse-doctor/shared/services/ncd-screening.service';
import { NurseService } from 'src/app/app-modules/nurse-doctor/shared/services/nurse.service';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

describe('NcdScreeningDiagnosisComponent', () => {
  let component: NcdScreeningDiagnosisComponent;
  let fixture: ComponentFixture<NcdScreeningDiagnosisComponent>;
  let doctorService: any;
  let masterService: any;
  let idrs: any;
  let ncd: any;
  let confirmation: any;
  let session: any;
  let subj: Record<string, Subject<any>>;

  const list = () =>
    component.generalDiagnosisForm.get('provisionalDiagnosisList') as FormArray;
  const ctrl = (n: string) => component.generalDiagnosisForm.controls[n];

  beforeEach(async () => {
    subj = {
      enableDiseaseConfirmForm: new BehaviorSubject<any>(false),
      diabetes: new Subject<any>(),
      hypertension: new Subject<any>(),
      oral: new Subject<any>(),
      breast: new Subject<any>(),
      cervical: new Subject<any>(),
      prevConfirmed: new BehaviorSubject<any>(undefined),
      caseRecord: new BehaviorSubject<any>(null),
      enableConfirm: new BehaviorSubject<any>(false),
      visitDiseases: new BehaviorSubject<any>(null),
      provisional: new BehaviorSubject<any>(false),
    };
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [NcdScreeningDiagnosisComponent],
      providers: [
        ...commonTestProviders({
          session: {
            serviceLineDetails: JSON.stringify({
              facilityID: 1,
              parkingPlaceID: 2,
            }),
            beneficiaryRegID: 'B1',
            visitID: 'V1',
            visitCategory: 'NCD screening',
            visitCode: 'VC1',
            beneficiaryGender: 'Female',
          },
        }),
        {
          provide: DoctorService,
          useValue: autoSpy(DoctorService, {
            previousVisitConfirmedDiseases$: subj['prevConfirmed'],
            populateCaserecordResponse$: subj['caseRecord'],
          }),
        },
        { provide: MasterdataService, useValue: autoSpy(MasterdataService) },
        {
          provide: IdrsscoreService,
          useValue: autoSpy(IdrsscoreService, {
            enableDiseaseConfirmationOnCaseRecord$: subj['enableConfirm'],
            visitDiseases$: subj['visitDiseases'],
          }),
        },
        {
          provide: NcdScreeningService,
          useValue: autoSpy(NcdScreeningService, {
            enableDiseaseConfirmForm$: subj['enableDiseaseConfirmForm'],
            diabetesStatus$: subj['diabetes'],
            hypertensionStatus$: subj['hypertension'],
            oralStatus$: subj['oral'],
            breastStatus$: subj['breast'],
            cervicalStatus$: subj['cervical'],
          }),
        },
        {
          provide: NurseService,
          useValue: autoSpy(NurseService, {
            enableProvisionalDiag$: subj['provisional'],
          }),
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(NcdScreeningDiagnosisComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(NcdScreeningDiagnosisComponent);
    component = fixture.componentInstance;
    doctorService = TestBed.inject(DoctorService);
    masterService = TestBed.inject(MasterdataService);
    idrs = TestBed.inject(IdrsscoreService);
    ncd = TestBed.inject(NcdScreeningService);
    confirmation = TestBed.inject(ConfirmationService);
    session = TestBed.inject(SessionStorageService);
    component.generalDiagnosisForm =
      component.utils.createNCDScreeningDiagnosisForm();
  });

  afterEach(() => fixture.destroy());

  describe('ngOnInit', () => {
    it('initialises for a non-specialist', () => {
      fixture.detectChanges();
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
      expect(component.specialist).toBeFalse();
      expect(ctrl('instruction').disabled).toBeTrue();
      expect(component.designation).toBeNull();
      expect(component.benGender).toBe('Female');
      expect(idrs.finalDiagnosisDiabetesConfirm).toHaveBeenCalledWith(false);
      expect(idrs.finalDiagnosisHypertensionConfirm).toHaveBeenCalledWith(
        false,
      );
      expect(component.enableProvisionalDiag).toBeFalse();
    });

    it('initialises for a TC specialist', () => {
      session.setItem('designation', 'TC Specialist');
      fixture.detectChanges();
      expect(component.specialist).toBeTrue();
      expect(ctrl('instruction').enabled).toBeTrue();
    });

    it('tracks the provisional diagnosis flag', () => {
      fixture.detectChanges();
      subj['provisional'].next(true);
      expect(component.enableProvisionalDiag).toBeTrue();
      subj['provisional'].next('x');
      expect(component.enableProvisionalDiag).toBeFalse();
    });

    it('loads confirmed diseases when cbac form is enabled', () => {
      fixture.detectChanges();
      spyOn(component, 'getConfirmedDiseases');
      subj['enableDiseaseConfirmForm'].next('other');
      expect(component.getConfirmedDiseases).not.toHaveBeenCalled();
      subj['enableDiseaseConfirmForm'].next('cbac');
      expect(component.getConfirmedDiseases).toHaveBeenCalled();
    });

    it('runs updateIfDiseaseConfirmed when confirmation enabled', () => {
      fixture.detectChanges();
      spyOn(component, 'updateIfDiseaseConfirmed');
      subj['enableConfirm'].next(true);
      expect(component.updateIfDiseaseConfirmed).toHaveBeenCalled();
    });
  });

  describe('screening status subscriptions', () => {
    const cases: [string, string, string][] = [
      ['diabetes', 'diabetesSuspected', 'diabetesScreeningConfirmed'],
      [
        'hypertension',
        'hypertensionSuspected',
        'hypertensionScreeningConfirmed',
      ],
      ['oral', 'oralSuspected', 'oralCancerConfirmed'],
      ['breast', 'breastSuspected', 'breastCancerConfirmed'],
      ['cervical', 'cervicalSuspected', 'cervicalCancerConfirmed'],
    ];
    cases.forEach(([key, flag, control]) => {
      it(`handles ${key} status`, () => {
        fixture.detectChanges();
        ctrl(control).setValue(true);
        subj[key].next(true);
        expect((component as any)[flag]).toBeTrue();
        expect(ctrl(control).value).toBeTrue();
        subj[key].next(false);
        expect((component as any)[flag]).toBeFalse();
        expect(ctrl(control).value).toBeNull();
      });
    });
  });

  it('refreshes language on ngDoCheck', () => {
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  it('exposes getters', () => {
    expect(component.provisionalDiagnosisControls.length).toBe(1);
    expect(component.specialistDaignosis).toBe(ctrl('instruction'));
    expect(component.doctorDaignosis).toBeNull();
    component.generalDiagnosisForm.removeControl('provisionalDiagnosisList');
    expect(component.provisionalDiagnosisControls).toEqual([]);
  });

  describe('getConfirmedDiseases', () => {
    it('marks each known disease confirmed', () => {
      component.getConfirmedDiseases();
      subj['prevConfirmed'].next([
        ` ${component.diabetes} `,
        component.hypertension,
        component.oralCancer,
        component.breastCancer,
        component.cervicalCancer,
        'Other',
      ]);
      expect(component.confirmDiseaseArray[0]).toBe(component.diabetes);
      expect(component.diabetesChecked).toBeTrue();
      expect(component.hyperTensionChecked).toBeTrue();
      expect(component.oralChecked).toBeTrue();
      expect(component.breastChecked).toBeTrue();
      expect(component.cervicalChecked).toBeTrue();
      expect(ctrl('diabetesScreeningConfirmed').value).toBeTrue();
      expect(ctrl('hypertensionScreeningConfirmed').value).toBeTrue();
      expect(ctrl('oralCancerConfirmed').value).toBeTrue();
      expect(ctrl('breastCancerConfirmed').value).toBeTrue();
      expect(ctrl('cervicalCancerConfirmed').value).toBeTrue();
    });

    it('handles undefined and empty lists', () => {
      component.diabetesChecked = true;
      component.getConfirmedDiseases();
      expect(component.confirmDiseaseArray).toBeNull();
      expect(component.diabetesChecked).toBeFalse();
      subj['prevConfirmed'].next([]);
      expect(component.confirmDiseaseArray).toEqual([]);
    });
  });

  describe('ngOnChanges', () => {
    const res = (diagnosis: any) => ({
      statusCode: 200,
      data: { diagnosis },
    });

    it('does nothing outside view mode', () => {
      component.caseRecordMode = 'edit';
      component.ngOnChanges();
      expect(
        doctorService.getMMUCaseRecordAndReferDetails,
      ).not.toHaveBeenCalled();
      expect(component.diagnosisSubscription).toBeUndefined();
    });

    it('patches from case record response when no referral', () => {
      component.caseRecordMode = 'view';
      component.ngOnChanges();
      subj['caseRecord'].next(
        res({
          instruction: 'rest',
          provisionalDiagnosisList: [
            { term: 'Fever', conceptID: 'C1' },
            { term: 'Cough', conceptID: 'C2' },
          ],
        }),
      );
      expect(ctrl('instruction').value).toBe('rest');
      expect(list().length).toBe(3);
      expect(list().at(0).value).toEqual({ term: 'Fever', conceptID: 'C1' });
      expect(
        (list().at(1) as FormGroup).controls['viewProvisionalDiagnosisProvided']
          .disabled,
      ).toBeTrue();
    });

    it('patches without provisional list and ignores bad response', () => {
      component.caseRecordMode = 'view';
      session.setItem('referredVisitCode', 'undefined');
      component.ngOnChanges();
      subj['caseRecord'].next({ statusCode: 500 });
      subj['caseRecord'].next(res({ instruction: 'x' }));
      expect(ctrl('instruction').value).toBe('x');
      expect(list().length).toBe(1);
    });

    it('does not patch empty first diagnosis', () => {
      component.patchDiagnosisDetails([{ term: '', conceptID: '' }]);
      expect(list().length).toBe(1);
    });

    it('fetches MMU details with visitCode when specialist flag is 3', () => {
      component.caseRecordMode = 'view';
      session.setItem('referredVisitCode', 'RVC');
      session.setItem('referredVisitID', 'RV');
      session.setItem('specialist_flag', '3');
      doctorService.getMMUCaseRecordAndReferDetails.and.returnValue(
        of(
          res({
            instruction: 'mmu',
            provisionalDiagnosisList: [{ term: 'A', conceptID: '1' }],
          }),
        ),
      );
      component.ngOnChanges();
      expect(
        doctorService.getMMUCaseRecordAndReferDetails,
      ).toHaveBeenCalledWith('B1', 'V1', 'NCD screening', 'VC1');
      expect(ctrl('instruction').value).toBe('mmu');
      expect(list().length).toBe(2);
      // Production bug: MMUdiagnosisSubscription stores the Observable, so ngOnDestroy throws.
      expect(() => component.ngOnDestroy()).toThrowError(TypeError);
      component.MMUdiagnosisSubscription = null;
    });

    it('fetches MMU details with referred visit otherwise', () => {
      component.caseRecordMode = 'view';
      session.setItem('referredVisitCode', 'RVC');
      session.setItem('referredVisitID', 'RV');
      doctorService.getMMUCaseRecordAndReferDetails.and.returnValue(
        of(res({ instruction: 'ref' })),
      );
      component.ngOnChanges();
      expect(
        doctorService.getMMUCaseRecordAndReferDetails,
      ).toHaveBeenCalledWith('B1', 'RV', 'NCD screening', 'RVC');
      expect(ctrl('instruction').value).toBe('ref');
      // Production bug: MMUdiagnosisSubscription stores the Observable, so ngOnDestroy throws.
      expect(() => component.ngOnDestroy()).toThrowError(TypeError);
      component.MMUdiagnosisSubscription = null;
    });

    it('ignores bad MMU response and null observable', () => {
      doctorService.getMMUCaseRecordAndReferDetails.and.returnValue(
        of({ statusCode: 500 }),
      );
      component.getMMUDiagnosisDetails('B', 'V', 'C', 'VC');
      expect(ctrl('instruction').value).toBeNull();
      doctorService.getMMUCaseRecordAndReferDetails.and.returnValue(null);
      component.getMMUDiagnosisDetails('B', 'V', 'C', 'VC');
      expect(component.MMUdiagnosisSubscription).toBeNull();
    });
  });

  describe('addDiagnosis / removeDiagnosisFromList', () => {
    beforeEach(() => fixture.detectChanges());

    it('adds up to 30 and then alerts', () => {
      for (let i = 0; i < 29; i++) component.addDiagnosis();
      expect(list().length).toBe(30);
      component.addDiagnosis();
      expect(list().length).toBe(30);
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.maxDiagnosis,
      );
    });

    it('confirms removal of a valid entry (multi)', () => {
      component.addDiagnosis();
      list().at(0).patchValue({ term: 'A', conceptID: '1' });
      component.removeDiagnosisFromList(0, list().at(0));
      expect(confirmation.confirm).toHaveBeenCalledWith(
        'warn',
        LANGUAGE_EN.alerts.info.warn,
      );
      expect(list().length).toBe(1);
    });

    it('replaces the last valid entry when confirmed', () => {
      list().at(0).patchValue({ term: 'A', conceptID: '1' });
      component.removeDiagnosisFromList(0, list().at(0));
      expect(list().length).toBe(1);
      expect(list().at(0).value.term).toBeNull();
    });

    it('keeps the entry when confirmation is declined', () => {
      confirmation.confirm.and.returnValue(of(false));
      list().at(0).patchValue({ term: 'A', conceptID: '1' });
      component.removeDiagnosisFromList(0, list().at(0));
      expect(list().at(0).value.term).toBe('A');
    });

    it('removes invalid entries without confirmation', () => {
      component.addDiagnosis();
      component.removeDiagnosisFromList(1, list().at(1));
      expect(list().length).toBe(1);
      component.removeDiagnosisFromList(0, list().at(0));
      expect(list().length).toBe(1);
      expect(confirmation.confirm).not.toHaveBeenCalled();
    });
  });

  it('checks provisional diagnosis validity', () => {
    expect(
      component.checkProvisionalDiagnosisValidity({
        value: { term: 'a', conceptID: '1' },
      }),
    ).toBeFalse();
    expect(
      component.checkProvisionalDiagnosisValidity({ value: { term: 'a' } }),
    ).toBeTrue();
  });

  describe('updateIfDiseaseConfirmed', () => {
    it('confirms diabetes and hypertension', () => {
      const log = spyOn(console, 'log');
      subj['visitDiseases'].next(['Diabetes', 'Hypertension', 'Other']);
      component.updateIfDiseaseConfirmed();
      expect(component.diabetesChecked).toBeTrue();
      expect(component.hyperTensionChecked).toBeTrue();
      expect(ctrl('diabetesConfirmed').disabled).toBeTrue();
      expect(ctrl('hypertensionConfirmed').disabled).toBeTrue();
      expect(
        component.generalDiagnosisForm.getRawValue().diabetesConfirmed,
      ).toBeTrue();
      expect(log).toHaveBeenCalledWith('confirm diseases');
    });

    it('logs when nothing confirmed', () => {
      const log = spyOn(console, 'log');
      subj['visitDiseases'].next([]);
      component.updateIfDiseaseConfirmed();
      expect(log).toHaveBeenCalledWith('No confirmed diseases');
      subj['visitDiseases'].next(null);
      component.updateIfDiseaseConfirmed();
      expect(log).toHaveBeenCalledTimes(2);
    });
  });

  describe('addToConfirmScreeningDisease', () => {
    it('adds once and removes', () => {
      component.addToConfirmScreeningDisease(true, 'Oral');
      component.addToConfirmScreeningDisease(true, 'Oral');
      expect(component.confirmDiseaseArray2).toEqual(['Oral']);
      expect(ncd.setConfirmedDiseasesForScreening).toHaveBeenCalledTimes(1);
      component.addToConfirmScreeningDisease(false, 'Breast');
      expect(ncd.setConfirmedDiseasesForScreening).toHaveBeenCalledTimes(1);
      component.addToConfirmScreeningDisease(false, 'Oral');
      expect(component.confirmDiseaseArray2).toEqual([]);
      expect(ncd.setConfirmedDiseasesForScreening).toHaveBeenCalledTimes(2);
    });
  });

  it('forwards diabetes / hypertension confirmation', () => {
    component.addToConfirmDisease(true);
    component.addHyperTensionToConfirmDisease(true);
    expect(idrs.finalDiagnosisDiabetesConfirm).toHaveBeenCalledWith(true);
    expect(idrs.finalDiagnosisHypertensionConfirm).toHaveBeenCalledWith(true);
  });

  it('unsubscribes everything on destroy', () => {
    fixture.detectChanges();
    component.caseRecordMode = 'view';
    component.ngOnChanges();
    doctorService.getMMUCaseRecordAndReferDetails.and.returnValue({
      subscribe: () => undefined,
      unsubscribe: jasmine.createSpy('unsub'),
    });
    component.getMMUDiagnosisDetails('B', 'V', 'C', 'VC');
    component.getConfirmedDiseases();
    const mmu = component.MMUdiagnosisSubscription;
    component.diabetesSuspected = true;
    component.ngOnDestroy();
    expect(component.diabetesSuspected).toBeFalse();
    expect(component.diabetesScreeningStatusSubscription.closed).toBeTrue();
    expect(component.diagnosisSubscription.closed).toBeTrue();
    expect(
      component.previousVisitConfirmedDiseasesSubscription.closed,
    ).toBeTrue();
    expect(mmu.unsubscribe).toHaveBeenCalled();
  });

  it('destroys cleanly without subscriptions', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  describe('diagnosis search', () => {
    const page = (items: any[]) => of({ data: { sctMaster: items } });

    it('resets for short terms', () => {
      component.suggestedDiagnosisList[0] = [{ term: 'x' }];
      component.onDiagnosisInputKeyup('ab', 0);
      expect(component.suggestedDiagnosisList[0]).toEqual([]);
      expect(component.lastQueryByIndex[0]).toBe('');
      component.onDiagnosisInputKeyup(null as any, 0);
      expect(masterService.searchDiagnosisBasedOnPageNo).not.toHaveBeenCalled();
    });

    it('fetches the first page and appends unique results', () => {
      masterService.searchDiagnosisBasedOnPageNo.and.returnValue(
        page([{ id: 1, term: 'Fever' }]),
      );
      component.onDiagnosisInputKeyup(' fev ', 0);
      expect(masterService.searchDiagnosisBasedOnPageNo).toHaveBeenCalledWith(
        'fev',
        0,
      );
      expect(component.suggestedDiagnosisList[0]).toEqual([
        { id: 1, term: 'Fever' },
      ]);
      masterService.searchDiagnosisBasedOnPageNo.and.returnValue(
        page([
          { id: 1, term: 'Fever' },
          { code: 'c', term: 'F2' },
          { term: 'F3' },
        ]),
      );
      component.onAutoNearEnd(0);
      expect(masterService.searchDiagnosisBasedOnPageNo).toHaveBeenCalledWith(
        'fev',
        1,
      );
      expect(component.suggestedDiagnosisList[0].length).toBe(3);
      expect(component.pageByIndex[0]).toBe(1);
      // same term again keeps the current page state
      component.onDiagnosisInputKeyup('fev', 0);
      expect(component.pageByIndex[0]).toBe(1);
    });

    it('marks noMore on empty results and stops paging', () => {
      masterService.searchDiagnosisBasedOnPageNo.and.returnValue(of({}));
      component.onDiagnosisInputKeyup('abc', 0);
      expect(component.noMore[0]).toBeTrue();
      masterService.searchDiagnosisBasedOnPageNo.calls.reset();
      component.onAutoNearEnd(0);
      expect(masterService.searchDiagnosisBasedOnPageNo).not.toHaveBeenCalled();
    });

    it('appends when no existing list', () => {
      component.lastQueryByIndex[2] = 'abc';
      masterService.searchDiagnosisBasedOnPageNo.and.returnValue(
        page([{ term: 'A' }]),
      );
      component.onAutoNearEnd(2);
      expect(component.suggestedDiagnosisList[2]).toEqual([{ term: 'A' }]);
      expect(component.pageByIndex[2]).toBe(1);
    });

    it('does not fetch without a term', () => {
      component.onAutoNearEnd(0);
      expect(masterService.searchDiagnosisBasedOnPageNo).not.toHaveBeenCalled();
    });

    it('queues and chains a request while loading', () => {
      const pending = new Subject<any>();
      masterService.searchDiagnosisBasedOnPageNo.and.returnValue(pending);
      component.onDiagnosisInputKeyup('abc', 0);
      expect(component.loadingMore[0]).toBeTrue();
      component.onAutoNearEnd(0);
      expect(component.wantMore[0]).toBeTrue();
      component.onDiagnosisInputKeyup('abc', 0); // guarded by loading
      expect(masterService.searchDiagnosisBasedOnPageNo).toHaveBeenCalledTimes(
        1,
      );
      masterService.searchDiagnosisBasedOnPageNo.and.returnValue(
        page([{ id: 2, term: 'B' }]),
      );
      pending.next({ data: { sctMaster: [{ id: 1, term: 'A' }] } });
      pending.complete();
      expect(masterService.searchDiagnosisBasedOnPageNo).toHaveBeenCalledTimes(
        2,
      );
      expect(component.suggestedDiagnosisList[0].length).toBe(2);
      expect(component.loadingMore[0]).toBeFalse();
    });

    it('ignores stale responses', () => {
      const pending = new Subject<any>();
      masterService.searchDiagnosisBasedOnPageNo.and.returnValue(pending);
      component.onDiagnosisInputKeyup('abc', 0);
      component.lastQueryByIndex[0] = 'other';
      pending.next({ data: { sctMaster: [{ term: 'A' }] } });
      expect(component.suggestedDiagnosisList[0]).toEqual([]);
      pending.complete();
    });

    it('logs errors', () => {
      const err = spyOn(console, 'error');
      masterService.searchDiagnosisBasedOnPageNo.and.returnValue(throwingObs());
      component.onDiagnosisInputKeyup('abc', 0);
      expect(err).toHaveBeenCalledWith('Error fetching diagnosis data');
    });
  });

  it('displays and selects diagnoses', () => {
    expect(component.displayDiagnosis('x')).toBe('x');
    expect(component.displayDiagnosis({ term: 'T' })).toBe('T');
    expect(component.displayDiagnosis(null)).toBe('');
    component.onDiagnosisSelected({ term: 'T', conceptID: 'C' }, 0);
    expect(list().at(0).value).toEqual(
      jasmine.objectContaining({ term: 'T', conceptID: 'C' }),
    );
    component.onDiagnosisSelected(null, 0);
    expect(list().at(0).value.term).toBeNull();
  });
});
