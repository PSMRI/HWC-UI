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
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { DiseaseconfirmationComponent } from './diseaseconfirmation.component';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../shared/services';
import { IdrsscoreService } from '../../shared/services/idrsscore.service';
import { NcdScreeningService } from '../../shared/services/ncd-screening.service';
import { BeneficiaryDetailsService } from 'src/app/app-modules/core/services';
import {
  COMMON_TEST_IMPORTS,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

const CBAC_CONDITIONS = [
  { name: 'Diabetes Mellitus' },
  { name: 'Hypertension' },
  { name: 'Oral cancer' },
  { name: 'Breast cancer' },
  { name: 'Cervical cancer' },
  { name: 'Other' },
];

const IDRS_QUESTIONS = [
  { DiseaseQuestionType: 'Diabetes' },
  { DiseaseQuestionType: 'Diabetes' },
  { DiseaseQuestionType: 'Epilepsy' },
  { DiseaseQuestionType: 'Hypertension' },
  { DiseaseQuestionType: 'Asthma' },
  { DiseaseQuestionType: 'Other' },
];

describe('DiseaseconfirmationComponent', () => {
  let component: DiseaseconfirmationComponent;
  let fixture: ComponentFixture<DiseaseconfirmationComponent>;
  let masterData$: BehaviorSubject<any>;
  let benDetails$: BehaviorSubject<any>;
  let enableForm$: BehaviorSubject<any>;
  let nurse: any;
  let doctor: any;
  let idrs: any;
  let ncd: any;
  let routeParams: any;
  const fb = new FormBuilder();

  async function setup(session: Record<string, any> = {}) {
    masterData$ = new BehaviorSubject<any>(null);
    benDetails$ = new BehaviorSubject<any>({ genderName: 'Female' });
    enableForm$ = new BehaviorSubject<any>(false);
    routeParams = { attendant: 'nurse' };
    nurse = autoSpy(NurseService, { diseaseFileUpload: false });
    doctor = autoSpy(DoctorService);
    idrs = autoSpy(IdrsscoreService);
    ncd = autoSpy(NcdScreeningService, {
      enableDiseaseConfirmForm$: enableForm$,
    });
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [DiseaseconfirmationComponent],
      providers: [
        ...commonTestProviders({
          session: { beneficiaryRegID: 'BEN1', visitCode: 'VC1', ...session },
        }),
        { provide: NurseService, useValue: nurse },
        { provide: DoctorService, useValue: doctor },
        { provide: IdrsscoreService, useValue: idrs },
        { provide: NcdScreeningService, useValue: ncd },
        {
          provide: MasterdataService,
          useValue: { nurseMasterData$: masterData$ },
        },
        {
          provide: BeneficiaryDetailsService,
          useValue: { beneficiaryDetails$: benDetails$ },
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: routeParams } },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(DiseaseconfirmationComponent);
    component = fixture.componentInstance;
    component.diseaseFormsGroup = fb.group({
      diseaseFormsArray: fb.array([]),
    });
  }

  function formArray(): FormArray {
    return component.diseaseFormsGroup.get('diseaseFormsArray') as FormArray;
  }

  function rows(): any[] {
    return formArray().getRawValue();
  }

  function selectedDisabled(i: number): boolean {
    return (formArray().at(i) as FormGroup).controls['selected'].disabled;
  }

  afterEach(() => {
    component?.ngOnDestroy();
    fixture?.destroy();
  });

  describe('ngOnInit', () => {
    beforeEach(async () => {
      await setup();
    });

    it('clears the flag, reads gender and stores previous confirmed diseases', () => {
      nurse.getPreviousVisitConfirmedDiseases.and.returnValue(
        of({ statusCode: 200, data: { confirmedDiseases: ['Hypertension'] } }),
      );
      formArray().push(
        fb.group({ diseaseName: 'x', flag: null, selected: false }),
      );
      component.ngOnInit();
      expect(ncd.clearDiseaseConfirmationScreenFlag).toHaveBeenCalled();
      expect(component.beneficiaryGender).toBe('Female');
      expect(nurse.getPreviousVisitConfirmedDiseases).toHaveBeenCalledWith({
        beneficiaryRegId: 'BEN1',
      });
      expect(component.confirmedDiseasesOnPreviousVisit).toEqual([
        'Hypertension',
      ]);
      expect(doctor.setPreviousVisitConfirmedDiseases).toHaveBeenCalledWith([
        'Hypertension',
      ]);
      expect(formArray().length).toBe(0);
      expect(component.isDoctor).toBeUndefined();
    });

    it('ignores previous-visit responses without confirmed diseases', () => {
      nurse.getPreviousVisitConfirmedDiseases.and.returnValue(
        of({ statusCode: 200, data: {} }),
      );
      component.ngOnInit();
      expect(component.confirmedDiseasesOnPreviousVisit).toBeUndefined();
      expect(doctor.setPreviousVisitConfirmedDiseases).not.toHaveBeenCalled();
    });

    it('logs the error message when fetching previous diseases fails', () => {
      spyOn(console, 'log');
      nurse.getPreviousVisitConfirmedDiseases.and.returnValue(
        throwingObs({ errorMessage: () => 'failed' }),
      );
      component.ngOnInit();
      expect(console.log).toHaveBeenCalledWith('failed');
    });

    it('ignores a missing beneficiary', () => {
      benDetails$.next(null);
      component.ngOnInit();
      expect(component.beneficiaryGender).toBeUndefined();
    });

    ['doctor', 'tcspecialist'].forEach((role) => {
      it(`marks ${role} as doctor`, () => {
        routeParams.attendant = role;
        component.ngOnInit();
        expect(component.isDoctor).toBeTrue();
      });
    });

    it('loads cbac diseases in edit mode for cbac', () => {
      spyOn(component, 'getpatientDiseasesata');
      component.idrsOrCbac = 'cbac';
      component.ngOnInit();
      expect(component.getpatientDiseasesata).toHaveBeenCalled();
    });

    it('loads idrs diseases in edit mode for idrs', () => {
      spyOn(component, 'getPatientRevisitSuspectedDieseaData');
      component.idrsOrCbac = 'idrs';
      component.ngOnInit();
      expect(component.getPatientRevisitSuspectedDieseaData).toHaveBeenCalled();
    });

    it('does not load diseases in view mode', () => {
      spyOn(component, 'getpatientDiseasesata');
      component.mode = 'view';
      component.idrsOrCbac = 'cbac';
      component.ngOnInit();
      expect(component.getpatientDiseasesata).not.toHaveBeenCalled();
    });

    it('reacts to enableDiseaseConfirmForm$ idrs/cbac emissions', () => {
      spyOn(component, 'getpatientDiseasesata');
      spyOn(component, 'getPatientRevisitSuspectedDieseaData');
      component.ngOnInit();
      formArray().push(
        fb.group({ diseaseName: 'x', flag: null, selected: false }),
      );
      enableForm$.next('idrs');
      expect(component.idrsOrCbac).toBe('idrs');
      expect(formArray().length).toBe(0);
      expect(component.getPatientRevisitSuspectedDieseaData).toHaveBeenCalled();
      formArray().push(
        fb.group({ diseaseName: 'x', flag: null, selected: false }),
      );
      enableForm$.next('cbac');
      expect(component.idrsOrCbac).toBe('cbac');
      expect(formArray().length).toBe(0);
      expect(component.getpatientDiseasesata).toHaveBeenCalled();
    });

    it('ngOnDestroy unsubscribes the confirm-form subscription', () => {
      component.ngOnInit();
      component.ngOnDestroy();
      expect(enableForm$.observed).toBeFalse();
      expect(benDetails$.observed).toBeFalse();
    });
  });

  describe('cbac edit flow (getpatientDiseasesata)', () => {
    beforeEach(async () => {
      await setup();
      component.diseaseFormsArray = formArray();
    });

    it('builds all five screening diseases for a female and disables previous ones', () => {
      component.beneficiaryGender = 'Female';
      component.confirmedDiseasesOnPreviousVisit = ['hypertension '];
      component.getpatientDiseasesata();
      masterData$.next({ screeningCondition: CBAC_CONDITIONS });
      expect(rows().map((r) => r.diseaseName)).toEqual([
        'Diabetes Mellitus',
        'Hypertension',
        'Oral cancer',
        'Breast cancer',
        'Cervical cancer',
      ]);
      expect(rows()[1].selected).toBeTrue();
      expect(selectedDisabled(1)).toBeTrue();
      expect(selectedDisabled(0)).toBeFalse();
      expect(ncd.setConfirmedDiseasesForScreening).toHaveBeenCalledWith([
        'Hypertension',
      ]);
      expect(nurse.diseaseFileUpload).toBeFalse();
      expect(masterData$.observed).toBeFalse();
    });

    it('builds only male-applicable diseases for a male', () => {
      component.beneficiaryGender = 'Male';
      component.confirmedDiseasesOnPreviousVisit = [];
      component.getpatientDiseasesata();
      masterData$.next({ screeningCondition: CBAC_CONDITIONS });
      expect(rows().map((r) => r.diseaseName)).toEqual([
        'Diabetes Mellitus',
        'Hypertension',
        'Oral cancer',
      ]);
      expect(ncd.setConfirmedDiseasesForScreening).toHaveBeenCalledWith([]);
    });

    it('handles missing previous-visit data and empty master data', () => {
      component.getpatientDiseasesata();
      masterData$.next({ screeningCondition: [] });
      expect(formArray().length).toBe(0);
      masterData$.next(null);
      expect(ncd.setConfirmedDiseasesForScreening).not.toHaveBeenCalled();
    });

    it('getPreviousVisitConfirmedDiseases with null previous list keeps nothing selected', () => {
      component.confirmedDiseasesOnPreviousVisit = null;
      component.diseaseArray = [
        { disease: 'Diabetes Mellitus', flag: null, selected: false },
      ];
      component.getPreviousVisitConfirmedDiseases();
      expect(component.previousConfirmedDiseases).toEqual([]);
      expect(rows()).toEqual([
        { diseaseName: 'Diabetes Mellitus', flag: null, selected: false },
      ]);
    });
  });

  describe('checkedCbacDiseases', () => {
    beforeEach(async () => {
      await setup();
    });

    function seed(selected: boolean[]) {
      selected.forEach((s, i) =>
        formArray().push(
          fb.group({ diseaseName: 'D' + i, flag: null, selected: s }),
        ),
      );
    }

    it('flags file upload when new diseases are confirmed without previous ones', () => {
      seed([true, false]);
      component.previousConfirmedDiseases = [];
      component.checkedCbacDiseases();
      expect(ncd.setConfirmedDiseasesForScreening).toHaveBeenCalledWith(['D0']);
      expect(nurse.diseaseFileUpload).toBeTrue();
    });

    it('flags file upload when more diseases than previously confirmed', () => {
      seed([true, true]);
      component.previousConfirmedDiseases = ['D0'];
      component.checkedCbacDiseases();
      expect(nurse.diseaseFileUpload).toBeTrue();
    });

    it('clears file upload when nothing new is confirmed', () => {
      nurse.diseaseFileUpload = true;
      seed([false]);
      component.previousConfirmedDiseases = [];
      component.checkedCbacDiseases();
      expect(nurse.diseaseFileUpload).toBeFalse();
    });

    it('works when the form array control is missing', () => {
      component.diseaseFormsGroup = fb.group({});
      component.checkedCbacDiseases();
      expect(ncd.setConfirmedDiseasesForScreening).toHaveBeenCalledWith([]);
    });
  });

  describe('ngOnChanges (view mode)', () => {
    it('loads IDRS details for idrs', async () => {
      await setup({ visitID: 'V1' });
      spyOn(component, 'getIDRSDetailsFrmNurse');
      component.mode = 'view';
      component.idrsOrCbac = 'idrs';
      component.ngOnChanges();
      expect(component.getIDRSDetailsFrmNurse).toHaveBeenCalledWith(
        'V1',
        'BEN1',
      );
    });

    it('loads CBAC details for cbac', async () => {
      await setup({ visitID: 'V1' });
      spyOn(component, 'getCbacDiseaseDetailsFromNurse');
      component.mode = 'view';
      component.idrsOrCbac = 'cbac';
      component.ngOnChanges();
      expect(component.getCbacDiseaseDetailsFromNurse).toHaveBeenCalledWith(
        'V1',
        'BEN1',
      );
    });

    it('does nothing without a visit id or outside view mode', async () => {
      await setup();
      spyOn(component, 'getIDRSDetailsFrmNurse');
      component.mode = 'view';
      component.idrsOrCbac = 'idrs';
      component.ngOnChanges();
      component.mode = 'edit';
      component.ngOnChanges();
      expect(component.getIDRSDetailsFrmNurse).not.toHaveBeenCalled();
    });
  });

  describe('getCbacDiseaseDetailsFromNurse', () => {
    const cbacData = {
      diabetes: { confirmed: true },
      hypertension: { confirmed: null },
      breast: null,
      cervical: { confirmed: false },
    };

    beforeEach(async () => {
      await setup();
    });

    it('builds the female disease list from nurse CBAC details', () => {
      nurse.getCbacDetailsFromNurse.and.returnValue(
        of({ statusCode: 200, data: cbacData }),
      );
      component.beneficiaryGender = 'Female';
      component.getCbacDiseaseDetailsFromNurse('V1', 'BEN9');
      masterData$.next({ screeningCondition: CBAC_CONDITIONS });
      expect(nurse.getCbacDetailsFromNurse).toHaveBeenCalledWith({
        beneficiaryRegId: 'BEN9',
        visitCode: 'VC1',
      });
      expect(rows()).toEqual(
        [
          { diseaseName: 'Diabetes Mellitus', flag: null, selected: true },
          { diseaseName: 'Hypertension', flag: null, selected: false },
          { diseaseName: 'Breast cancer', flag: null, selected: false },
          { diseaseName: 'Cervical cancer', flag: null, selected: false },
          { diseaseName: 'Oral cancer', flag: null, selected: false },
        ].sort(
          (a, b) =>
            CBAC_CONDITIONS.findIndex((c) => c.name === a.diseaseName) -
            CBAC_CONDITIONS.findIndex((c) => c.name === b.diseaseName),
        ),
      );
      expect(ncd.setConfirmedDiseasesForScreening).toHaveBeenCalledWith([
        'Diabetes Mellitus',
      ]);
    });

    it('treats every flag as confirmed when all diseases are confirmed', () => {
      nurse.getCbacDetailsFromNurse.and.returnValue(
        of({
          statusCode: 200,
          data: {
            diabetes: { confirmed: true },
            hypertension: { confirmed: true },
            breast: { confirmed: true },
            cervical: { confirmed: null },
            oral: { confirmed: true },
          },
        }),
      );
      component.beneficiaryGender = 'Male';
      component.getCbacDiseaseDetailsFromNurse('V1', 'BEN9');
      masterData$.next({ screeningCondition: CBAC_CONDITIONS });
      expect(rows().map((r) => [r.diseaseName, r.selected])).toEqual([
        ['Diabetes Mellitus', true],
        ['Hypertension', true],
        ['Oral cancer', true],
      ]);
      expect(component.diseaseArray.length).toBe(5);
    });

    it('ignores unsuccessful responses and empty master data', () => {
      nurse.getCbacDetailsFromNurse.and.returnValue(of({ statusCode: 500 }));
      component.getCbacDiseaseDetailsFromNurse('V1', 'BEN9');
      masterData$.next({ screeningCondition: CBAC_CONDITIONS });
      expect(formArray().length).toBe(0);
      nurse.getCbacDetailsFromNurse.calls.reset();
      masterData$.next({ screeningCondition: [] });
      expect(nurse.getCbacDetailsFromNurse).not.toHaveBeenCalled();
    });

    it('unsubscribes a pending cbac master-data subscription', () => {
      const sub = { unsubscribe: jasmine.createSpy('unsub') };
      component.patientDiseasesata = sub;
      component.getCbacDiseaseDetailsFromNurse('V1', 'BEN9');
      masterData$.next({ screeningCondition: [] });
      expect(sub.unsubscribe).toHaveBeenCalled();
    });
  });

  describe('getIDRSDetailsFrmNurse', () => {
    beforeEach(async () => {
      await setup();
      spyOn(console, 'log');
    });

    it('marks IDRS confirmed diseases as current when there were no previous suspects', () => {
      nurse.getPreviousVisitData.and.returnValue(
        of({ statusCode: 200, data: {} }),
      );
      doctor.getIDRSDetails.and.returnValue(
        of({
          statusCode: 200,
          data: { IDRSDetail: { confirmedDisease: 'Diabetes,Asthma' } },
        }),
      );
      component.getIDRSDetailsFrmNurse('V1', 'BEN1');
      masterData$.next({ IDRSQuestions: IDRS_QUESTIONS });
      expect(nurse.getPreviousVisitData).toHaveBeenCalledWith({
        benRegID: 'BEN1',
      });
      expect(doctor.getIDRSDetails).toHaveBeenCalledWith('BEN1', 'V1');
      expect(rows().map((r) => r.diseaseName)).toEqual([
        'Diabetes',
        'Epilepsy',
        'Hypertension',
        'Asthma',
        'Other',
      ]);
      expect(rows()[0].selected).toBeTrue();
      expect(rows()[3].selected).toBeTrue();
      expect(selectedDisabled(0)).toBeFalse();
      expect(idrs.setDiseasesSelected).toHaveBeenCalledWith([
        'Diabetes',
        'Asthma',
      ]);
    });

    it('merges IDRS diseases with previous suspects and disables old ones', () => {
      nurse.getPreviousVisitData.and.returnValue(
        of({
          statusCode: 200,
          data: {
            confirmedDisease: 'Hypertension',
            isDiabetic: true,
            isDefectiveVision: true,
            isEpilepsy: false,
            isHypertension: true,
          },
        }),
      );
      doctor.getIDRSDetails.and.returnValue(
        of({
          statusCode: 200,
          data: { IDRSDetail: { confirmedDisease: 'Hypertension,Epilepsy' } },
        }),
      );
      component.getIDRSDetailsFrmNurse('V1', 'BEN1');
      masterData$.next({ IDRSQuestions: IDRS_QUESTIONS });
      expect(component.suspect).toEqual([
        'Hypertension',
        'Diabetes',
        'Vision Screening',
        'Epilepsy',
      ]);
      expect(idrs.setHypertensionSelected).toHaveBeenCalled();
      // Diabetes and Hypertension are previous (disabled); Epilepsy is current
      expect(selectedDisabled(0)).toBeTrue();
      expect(selectedDisabled(1)).toBeFalse();
      expect(selectedDisabled(2)).toBeTrue();
      expect(idrs.setDiseasesSelected).toHaveBeenCalledWith([
        'Diabetes',
        'Epilepsy',
        'Hypertension',
      ]);
    });

    it('handles IDRS details without confirmed diseases', () => {
      nurse.getPreviousVisitData.and.returnValue(
        of({ statusCode: 200, data: { confirmedDisease: null } }),
      );
      doctor.getIDRSDetails.and.returnValue(
        of({ statusCode: 200, data: { IDRSDetail: null } }),
      );
      component.getIDRSDetailsFrmNurse('V1', 'BEN1');
      masterData$.next({ IDRSQuestions: [] });
      expect(component.diseaseArray).toEqual([]);
      expect(idrs.setDiseasesSelected).toHaveBeenCalledWith([]);
    });

    it('skips form rebuild when IDRS details are unavailable', () => {
      nurse.getPreviousVisitData.and.returnValue(
        of({ statusCode: 200, data: {} }),
      );
      doctor.getIDRSDetails.and.returnValue(of(null));
      component.getIDRSDetailsFrmNurse('V1', 'BEN1');
      masterData$.next({ IDRSQuestions: IDRS_QUESTIONS });
      expect(formArray().length).toBe(0);
      expect(idrs.setDiseasesSelected).toHaveBeenCalledWith([]);
    });

    it('stops when previous visit data fails', () => {
      nurse.getPreviousVisitData.and.returnValue(of({ statusCode: 500 }));
      component.getIDRSDetailsFrmNurse('V1', 'BEN1');
      masterData$.next({ IDRSQuestions: IDRS_QUESTIONS });
      expect(doctor.getIDRSDetails).not.toHaveBeenCalled();
      masterData$.next(null);
      expect(nurse.getPreviousVisitData).toHaveBeenCalledTimes(1);
    });

    it('unsubscribes from master data on subsequent emissions', () => {
      nurse.getPreviousVisitData.and.returnValue(of({ statusCode: 500 }));
      component.getIDRSDetailsFrmNurse('V1', 'BEN1');
      masterData$.next({ IDRSQuestions: [] });
      masterData$.next({ IDRSQuestions: [] });
      expect(masterData$.observed).toBeFalse();
    });
  });

  describe('getPatientRevisitSuspectedDieseaData', () => {
    beforeEach(async () => {
      await setup();
      spyOn(console, 'log');
      component.diseaseFormsArray = formArray();
    });

    it('adds IDRS diseases and disables previously suspected ones', () => {
      nurse.getPreviousVisitData.and.returnValue(
        of({
          statusCode: 200,
          data: {
            confirmedDisease: 'Epilepsy',
            isDiabetic: true,
            isDefectiveVision: true,
            isEpilepsy: true,
            isHypertension: true,
          },
        }),
      );
      component.getPatientRevisitSuspectedDieseaData();
      masterData$.next({ IDRSQuestions: IDRS_QUESTIONS });
      expect(rows().map((r) => r.diseaseName)).toEqual([
        'Diabetes',
        'Epilepsy',
        'Hypertension',
        'Asthma',
      ]);
      expect(selectedDisabled(0)).toBeTrue();
      expect(selectedDisabled(1)).toBeTrue();
      expect(selectedDisabled(2)).toBeTrue();
      expect(selectedDisabled(3)).toBeFalse();
      expect(idrs.setHypertensionSelected).toHaveBeenCalled();
      expect(idrs.setDiseasesSelected).toHaveBeenCalledWith([
        'Diabetes',
        'Epilepsy',
        'Hypertension',
      ]);
      expect(masterData$.observed).toBeFalse();
    });

    it('selects nothing when previous data is unavailable', () => {
      nurse.getPreviousVisitData.and.returnValue(of({ statusCode: 500 }));
      component.getPatientRevisitSuspectedDieseaData();
      masterData$.next({ IDRSQuestions: IDRS_QUESTIONS });
      expect(formArray().length).toBe(0);
      expect(idrs.setDiseasesSelected).toHaveBeenCalledWith([]);
    });

    it('ignores empty master data', () => {
      component.getPatientRevisitSuspectedDieseaData();
      masterData$.next({ IDRSQuestions: [] });
      masterData$.next(null);
      expect(nurse.getPreviousVisitData).not.toHaveBeenCalled();
    });
  });

  describe('getDiseasesMasterData', () => {
    beforeEach(async () => {
      await setup();
      spyOn(console, 'log');
    });

    it('adds one row per distinct question type', () => {
      component.getDiseasesMasterData();
      masterData$.next({ IDRSQuestions: IDRS_QUESTIONS });
      expect(rows().map((r) => r.diseaseName)).toEqual([
        'Diabetes',
        'Epilepsy',
        'Hypertension',
        'Asthma',
        'Other',
      ]);
      expect(rows().every((r) => r.selected === false)).toBeTrue();
    });

    it('ignores empty data', () => {
      component.getDiseasesMasterData();
      masterData$.next({ IDRSQuestions: [] });
      masterData$.next(null);
      expect(formArray().length).toBe(0);
    });
  });

  describe('helpers', () => {
    beforeEach(async () => {
      await setup();
      spyOn(console, 'log');
    });

    it('addToSuspected ignores duplicates', () => {
      component.suspect = ['A'];
      component.addToSuspected('A');
      component.addToSuspected('B');
      expect(component.suspect).toEqual(['A', 'B']);
    });

    it('addMoreDiseases / getDiseaseFormArray expose the rows', () => {
      component.addMoreDiseases({ disease: 'X', flag: null, selected: true });
      component.addMoreDiseases(null);
      expect(component.getDiseaseFormArray().length).toBe(2);
      expect(rows()[0]).toEqual({
        diseaseName: 'X',
        flag: null,
        selected: true,
      });
    });

    function seed() {
      ['Hypertension', 'Diabetes'].forEach((d) =>
        formArray().push(
          fb.group({ diseaseName: d, flag: null, selected: true }),
        ),
      );
    }

    it('checked(false) on Hypertension clears and unchecks', () => {
      seed();
      component.checked(
        { checked: false },
        { value: { diseaseName: 'Hypertension' } },
      );
      expect(idrs.clearHypertensionSelected).toHaveBeenCalled();
      expect(idrs.setUnchecked).toHaveBeenCalledWith('Hypertension');
    });

    it('checked(false) on Diabetes only unchecks', () => {
      seed();
      component.checked(
        { checked: false },
        { value: { diseaseName: 'Diabetes' } },
      );
      expect(idrs.clearHypertensionSelected).not.toHaveBeenCalled();
      expect(idrs.setUnchecked).toHaveBeenCalledWith('Diabetes');
    });

    it('checked(true) sets selected diseases', () => {
      seed();
      component.checked(
        { checked: true },
        { value: { diseaseName: 'Hypertension' } },
      );
      expect(idrs.setHypertensionSelected).toHaveBeenCalled();
      expect(idrs.setDiseasesSelected).toHaveBeenCalledWith([
        'Hypertension',
        'Diabetes',
      ]);
      idrs.setHypertensionSelected.calls.reset();
      component.checked(
        { checked: true },
        { value: { diseaseName: 'Diabetes' } },
      );
      expect(idrs.setHypertensionSelected).not.toHaveBeenCalled();
    });

    it('checked works without a form array control', () => {
      component.diseaseFormsGroup = fb.group({});
      component.checked({ checked: true }, { value: { diseaseName: 'Other' } });
      expect(idrs.setDiseasesSelected).toHaveBeenCalledWith([]);
    });

    it('addToChronicDiseases selects and disables chronic rows', () => {
      [
        'Vision Screening',
        'Diabetes',
        'Epilepsy',
        'Hypertension',
        'Other',
      ].forEach((d) =>
        formArray().push(
          fb.group({ diseaseName: d, flag: null, selected: false }),
        ),
      );
      component.addToChronicDiseases({
        data: {
          isDefectiveVision: true,
          isDiabetic: true,
          isEpilepsy: true,
          isHypertension: true,
        },
      });
      [0, 1, 2, 3].forEach((i) => {
        expect(selectedDisabled(i)).toBeTrue();
        expect(formArray().at(i).getRawValue().selected).toBeTrue();
      });
      expect(selectedDisabled(4)).toBeFalse();
    });

    it('ngOnDestroy unsubscribes every tracked subscription', () => {
      const mk = () => ({ unsubscribe: jasmine.createSpy('u') });
      const subs = [mk(), mk(), mk(), mk(), mk(), mk()];
      component.beneficiaryDetailsSubscription = subs[0];
      component.cbacDiseaseDetailsSubscription = subs[1];
      component.patientDiseasesDataSub = subs[2];
      component.patientDiseasesata = subs[3];
      component.IDRSDetailsSubscription = subs[4];
      component.confirmDiseasesSubscription = subs[5];
      component.ngOnDestroy();
      subs.forEach((s) => expect(s.unsubscribe).toHaveBeenCalled());
    });
  });
});
