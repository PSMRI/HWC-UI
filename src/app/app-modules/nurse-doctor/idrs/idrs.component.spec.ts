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
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, of } from 'rxjs';

import { IdrsComponent } from './idrs.component';
import { IdrsscoreService } from '../shared/services/idrsscore.service';
import { DoctorService } from '../shared/services/doctor.service';
import { NurseService } from '../shared/services/nurse.service';
import { MasterdataService } from '../shared/services/masterdata.service';
import { BeneficiaryDetailsService } from '../../core/services/beneficiary-details.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { PreviousDetailsComponent } from '../../core/components/previous-details/previous-details.component';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

const QUESTIONS = [
  { idrsQuestionID: 1, question: 'd1', DiseaseQuestionType: 'Diabetes' },
  { idrsQuestionID: 2, question: 'd2', DiseaseQuestionType: 'Diabetes' },
  { idrsQuestionID: 3, question: 'a1', DiseaseQuestionType: 'Asthma' },
  { idrsQuestionID: 4, question: 'e1', DiseaseQuestionType: 'Epilepsy' },
  {
    idrsQuestionID: 5,
    question: 'v1',
    DiseaseQuestionType: 'Vision Screening',
  },
  {
    idrsQuestionID: 6,
    question: 't1',
    DiseaseQuestionType: 'Tuberculosis Screening',
  },
  {
    idrsQuestionID: 7,
    question: 'm1',
    DiseaseQuestionType: 'Malaria Screening',
  },
];

describe('IdrsComponent', () => {
  let component: IdrsComponent;
  let fixture: ComponentFixture<IdrsComponent>;
  let idrs: IdrsscoreService;
  let nurse: any;
  let doctor: any;
  let confirm: any;
  let dialog: any;
  let session: any;
  let masterData$: BehaviorSubject<any>;
  let ben$: BehaviorSubject<any>;
  let params: any;
  let form: FormGroup;
  let medical: FormGroup;

  beforeEach(async () => {
    masterData$ = new BehaviorSubject<any>(null);
    ben$ = new BehaviorSubject<any>(null);
    params = { attendant: 'nurse' };
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [IdrsComponent],
      providers: [
        ...commonTestProviders({
          session: {
            serviceLineDetails: JSON.stringify({
              facilityID: 1,
              parkingPlaceID: 2,
            }),
            beneficiaryRegID: 'B1',
          },
        }),
        IdrsscoreService,
        {
          provide: MasterdataService,
          useValue: { nurseMasterData$: masterData$ },
        },
        {
          provide: BeneficiaryDetailsService,
          useValue: { beneficiaryDetails$: ben$ },
        },
        { provide: NurseService, useValue: autoSpy(NurseService) },
        { provide: DoctorService, useValue: autoSpy(DoctorService) },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params } },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    idrs = TestBed.inject(IdrsscoreService);
    nurse = TestBed.inject(NurseService);
    doctor = TestBed.inject(DoctorService);
    confirm = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    session = TestBed.inject(SessionStorageService);
    nurse.getPreviousVisitData.and.returnValue(
      of({ statusCode: 200, data: null }),
    );
    fixture = TestBed.createComponent(IdrsComponent);
    component = fixture.componentInstance;
    const fb = new FormBuilder();
    form = component.utils.createIDRSForm();
    medical = fb.group({ idrsScreeningForm: form });
    component.idrsScreeningForm = form;
    component.patientMedicalForm = medical;
    component.visitType = 'NCD screening';
  });

  function init(age = 55) {
    ben$.next({ ageVal: age, beneficiaryRegID: 'B1' });
    fixture.detectChanges();
  }

  function loadQuestions() {
    masterData$.next({ IDRSQuestions: QUESTIONS.map((q) => ({ ...q })) });
  }

  function disease(name: string) {
    return component.diseases.find((d: any) => d.disease === name);
  }

  describe('initialisation', () => {
    it('clears idrs service flags and language on init', () => {
      spyOn(idrs, 'clearScoreFlag').and.callThrough();
      spyOn(idrs, 'finalDiagnosisDiabetesConfirm').and.callThrough();
      init();
      expect(idrs.clearScoreFlag).toHaveBeenCalled();
      expect(idrs.finalDiagnosisDiabetesConfirm).toHaveBeenCalledWith(null);
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.suspect).toEqual([]);
    });

    [
      { age: 25, score: 0 },
      { age: 40, score: 20 },
      { age: 60, score: 30 },
    ].forEach(({ age, score }) => {
      it(`sets idrs age score ${score} for age ${age}`, () => {
        init(age);
        expect(component.age).toBe(age);
        expect(component.idrsScore).toBe(score);
        expect(nurse.getNcdScreeningVisitCount).toHaveBeenCalledWith('B1');
      });
    });

    it('defaults age to 0 when ageVal missing', () => {
      ben$.next({ beneficiaryRegID: 'B1' });
      fixture.detectChanges();
      expect(component.age).toBe(0);
    });

    it('does not fetch visit count without beneficiary', () => {
      fixture.detectChanges();
      expect(nurse.getNcdScreeningVisitCount).not.toHaveBeenCalled();
    });

    it('aggregates waist, family and physical scores into the form', () => {
      init(55);
      idrs.setIDRSScoreWaist(10);
      idrs.setIDRSFamilyScore(20);
      idrs.setIRDSscorePhysicalActivity(30);
      expect(form.value.idrsScore).toBe(90);
      idrs.IDRSWaistScore.next(undefined);
      idrs.IDRSFamilyScore.next(undefined);
      idrs.IDRSPhysicalActivityScore.next(undefined);
      expect(component.idrsScoreWaist).toBe(0);
      expect(component.idrsScoreFamily).toBe(0);
      expect(component.IRDSscorePhysicalActivity).toBe(0);
      expect(form.value.idrsScore).toBe(30);
    });
  });

  describe('master data', () => {
    it('builds questions and disease list, skips Diabetes below score 60 and loads previous visit for nurse', () => {
      init(55);
      loadQuestions();
      expect(component.questions1.length).toBe(7);
      expect(component.diseases.map((d: any) => d.disease)).toEqual([
        'Diabetes',
        'Asthma',
        'Epilepsy',
        'Vision Screening',
        'Tuberculosis Screening',
        'Malaria Screening',
      ]);
      expect(disease('Diabetes').flag).toBeFalse();
      expect(form.value.requiredList).not.toContain('Diabetes');
      expect(form.value.requiredList).toContain('Asthma');
      expect(nurse.getPreviousVisitData).toHaveBeenCalledWith({
        benRegID: 'B1',
      });
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('d1');
    });

    it('keeps Diabetes required when score is >= 60', () => {
      init(55);
      idrs.setIDRSScoreWaist(30);
      loadQuestions();
      expect(disease('Diabetes').flag).toBeTrue();
      expect(form.value.requiredList).toContain('Diabetes');
    });

    it('does not flag diseases for patients under 30', () => {
      init(20);
      loadQuestions();
      expect(disease('Asthma').flag).toBeNull();
    });

    it('does not fetch previous visit for doctor but loads nurse details in view mode', () => {
      params.attendant = 'doctor';
      session.store.set('visitID', 'V1');
      component.ncdScreeningMode = 'view';
      doctor.getIDRSDetails.and.returnValue(
        of({ statusCode: 200, data: null }),
      );
      init(55);
      loadQuestions();
      expect(nurse.getPreviousVisitData).not.toHaveBeenCalled();
      expect(doctor.getIDRSDetails).toHaveBeenCalledWith('B1', 'V1');
    });

    it('loads nurse details for specialist flag 100', () => {
      params.attendant = 'tcspecialist';
      session.store.set('visitID', 'V1');
      session.store.set('specialistFlag', '100');
      init(55);
      loadQuestions();
      expect(doctor.getIDRSDetails).toHaveBeenCalledWith('B1', 'V1');
    });

    it('ignores master data without IDRS questions', () => {
      init(55);
      masterData$.next({ IDRSQuestions: [] });
      expect(component.diseases).toEqual([]);
      expect(nurse.getPreviousVisitData).not.toHaveBeenCalled();
    });
  });

  describe('getPreviousVisit', () => {
    const prev = (data: any) =>
      nurse.getPreviousVisitData.and.returnValue(of({ statusCode: 200, data }));

    it('disables chronic diseases and confirms from previous visit', () => {
      prev({
        isDiabetic: true,
        isDefectiveVision: true,
        isEpilepsy: true,
        questionariesData: [{ q: 1 }],
        confirmedDisease: 'Tuberculosis Screening,Malaria Screening,Asthma',
      });
      spyOn(idrs, 'clearDiabetesSelected').and.callThrough();
      init(55);
      loadQuestions();
      expect(component.isDiabetic).toBeTrue();
      expect(disease('Diabetes').disabled).toBeTrue();
      expect(disease('Vision Screening').disabled).toBeTrue();
      expect(disease('Epilepsy').disabled).toBeTrue();
      expect(disease('Tuberculosis Screening').disabled).toBeTrue();
      expect(disease('Malaria Screening').disabled).toBeTrue();
      expect(disease('Asthma').disabled).toBeTrue();
      expect(component.chronicDisabled).toBeTrue();
      expect(component.confirmDiseaseArray).toEqual(
        jasmine.arrayContaining([
          'Tuberculosis Screening',
          'Diabetes',
          'Epilepsy',
          'Vision Screening',
        ]),
      );
      expect(idrs.clearDiabetesSelected).toHaveBeenCalled();
      expect(form.value.requiredList).toEqual([]);
    });

    it('handles non-diabetic patient with score below 60', () => {
      prev({
        isDiabetic: false,
        isDefectiveVision: false,
        isEpilepsy: false,
        questionariesData: [{ q: 1 }],
        confirmedDisease: null,
      });
      init(55);
      loadQuestions();
      expect(disease('Diabetes').flag).toBeFalse();
      expect(disease('Diabetes').disabled).toBeFalse();
      expect(component.confirmDiseaseArray).toEqual([]);
      expect(form.value.requiredList).toContain('Asthma');
    });

    it('does not process chronic data for age < 30', () => {
      prev({
        isDiabetic: false,
        questionariesData: [{ q: 1 }],
        confirmedDisease: 'Asthma',
      });
      init(20);
      loadQuestions();
      expect(component.chronicDisabled).toBeFalse();
    });

    it('ignores empty questionaries data', () => {
      prev({ isDiabetic: true, questionariesData: [] });
      init(55);
      loadQuestions();
      expect(component.isDiabetic).toBeTrue();
      expect(component.chronicDisabled).toBeFalse();
    });

    it('alerts and emits false on error', () => {
      nurse.getPreviousVisitData.and.returnValue(throwingObs('bad'));
      const emitted: any[] = [];
      component.IDRSChanged.subscribe((v) => emitted.push(v));
      init(55);
      component.getPreviousVisit();
      expect(confirm.alert).toHaveBeenCalledWith('bad', 'error');
      expect(emitted).toContain(false);
    });

    it('patches arrays for doctor revisit', () => {
      params.attendant = 'doctor';
      init(55);
      loadQuestions();
      component.revisit = true;
      component.questions1[0].answer = 'yes';
      component.suspect = ['Diabetes'];
      component.getPreviousVisit();
      expect(form.value.questionArray.length).toBe(1);
      expect(form.value.suspectArray).toEqual(['Diabetes']);
    });
  });

  describe('radioChange', () => {
    beforeEach(() => {
      init(55);
      loadQuestions();
    });

    it('adds suspected disease on yes and sets diabetic flag', () => {
      spyOn(idrs, 'setDiabetesSelected').and.callThrough();
      const emitted: any[] = [];
      component.IDRSChanged.subscribe((v) => emitted.push(v));
      const q = component.questions1[0];
      component.radioChange(q, 'yes', 'Diabetes');
      expect(emitted).toEqual([false]);
      expect(q.answer).toBe('yes');
      expect(component.suspect).toEqual(['Diabetes']);
      expect(idrs.setDiabetesSelected).toHaveBeenCalled();
      expect(form.value.isDiabetic).toBeTrue();
      expect(form.value.questionArray.length).toBe(1);
    });

    it('marks disease complete once all its questions are answered', () => {
      component.radioChange(component.questions1[2], 'yes', 'Asthma');
      expect(disease('Asthma').flag).toBeFalse();
      expect(form.value.requiredList).not.toContain('Asthma');
      expect(idrs.IDRSSuspectedFlag.value).toBe(1);
    });

    it('removes suspected disease when answered no', () => {
      component.radioChange(component.questions1[2], 'yes', 'Asthma');
      component.radioChange(component.questions1[2], 'no', 'Asthma');
      expect(component.suspect).toEqual([]);
      expect(idrs.IDRSSuspectedFlag.value).toBe(0);
      expect(form.value.isDiabetic).toBeFalse();
    });

    it('uses rev array when chronic disabled for nurse', () => {
      component.chronicDisabled = true;
      component.rev = [{ idrsQuestionID: 3 }];
      component.radioChange(component.questions1[2], 'no', 'Asthma');
      expect(form.value.questionArray).toEqual([component.questions1[2]]);
    });

    it('keeps Diabetes required only when score >= 60', () => {
      disease('Diabetes').flag = true;
      component.radioChange(component.questions1[2], 'no', 'Asthma');
      expect(form.value.requiredList).not.toContain('Diabetes');
    });
  });

  describe('suspect helpers', () => {
    beforeEach(() => {
      init(55);
      loadQuestions();
    });

    it('does not add duplicates or confirmed diseases', () => {
      component.addToSuspected('Asthma');
      component.addToSuspected('Asthma');
      component.confirmDiseaseArray = ['Epilepsy'];
      component.addToSuspected('Epilepsy');
      expect(component.suspect).toEqual(['Asthma']);
    });

    it('removeSuspected keeps disease when a yes answer exists', () => {
      component.suspect = ['Asthma'];
      component.questions1[2].answer = 'yes';
      component.removeSuspected('Asthma');
      expect(component.suspect).toEqual(['Asthma']);
    });

    it('removeSuspected sets diabetes flag when Diabetes remains', () => {
      spyOn(idrs, 'setDiabetesSelected').and.callThrough();
      component.suspect = ['Diabetes', 'Hypertension'];
      component.removeSuspected('Hypertension');
      expect(component.suspect).toEqual(['Diabetes']);
      expect(idrs.setDiabetesSelected).toHaveBeenCalled();
      expect(idrs.IDRSSuspectedFlag.value).toBe(0);
    });

    it('removeSuspected sets suspected flag when chronic suspect remains', () => {
      component.suspect = ['Epilepsy', 'Hypertension'];
      component.removeSuspected('Hypertension');
      expect(idrs.IDRSSuspectedFlag.value).toBe(1);
    });

    it('removeSuspect handles remaining lists', () => {
      component.suspect = ['Diabetes', 'Malaria Screening'];
      component.removeSuspect('Diabetes');
      expect(component.suspect).toEqual(['Malaria Screening']);
      expect(idrs.IDRSSuspectedFlag.value).toBe(1);
      component.suspect = ['Diabetes', 'Hypertension'];
      component.removeSuspect('Hypertension');
      expect(idrs.IDRSSuspectedFlag.value).toBe(0);
      component.removeSuspect('Diabetes');
      expect(component.suspect).toEqual([]);
      expect(idrs.diabetesSelectedFlag.value).toBe(0);
    });

    it('removeSuspect does nothing without questions', () => {
      component.questions1 = [];
      component.suspect = ['Asthma'];
      component.removeSuspect('Asthma');
      expect(component.suspect).toEqual(['Asthma']);
    });

    it('addToconfirmDiseaseArray adds once and patches the form', () => {
      component.addToconfirmDiseaseArray('Asthma');
      component.addToconfirmDiseaseArray('Asthma');
      expect(component.confirmDiseaseArray).toEqual(['Asthma']);
      expect(form.value.confirmArray).toEqual(['Asthma']);
    });

    it('removeConfirmDiseaseArray removes and drops Diabetes from required below 60', () => {
      component.confirmDiseaseArray = ['Asthma'];
      component.required = ['Diabetes', 'Asthma'];
      component.removeConfirmDiseaseArray('Asthma');
      expect(component.confirmDiseaseArray).toEqual([]);
      expect(form.value.requiredList).toEqual(['Asthma']);
    });

    it('updateDiabetesQuestionValue keeps Diabetes at score 60', () => {
      component.idrsScoreWaist = 30;
      component.required = ['Diabetes'];
      component.updateDiabetesQuestionValue();
      expect(form.value.requiredList).toEqual(['Diabetes']);
    });

    it('settingSuspectedObservable sets flag only for chronic diseases', () => {
      spyOn(idrs, 'setSuspectedArrayValue').and.callThrough();
      component.suspect = ['Diabetes'];
      component.settingSuspectedObservable();
      expect(idrs.setSuspectedArrayValue).not.toHaveBeenCalled();
      component.suspect = ['Asthma', 'Epilepsy'];
      component.settingSuspectedObservable();
      expect(idrs.setSuspectedArrayValue).toHaveBeenCalledTimes(1);
    });
  });

  describe('service observables', () => {
    beforeEach(() => {
      init(55);
      loadQuestions();
    });

    it('confirms visit diseases and removes them from suspects', () => {
      spyOn(idrs, 'enableDiseaseConfirmation').and.callThrough();
      spyOn(idrs, 'clearDiabetesSelected').and.callThrough();
      component.suspect = ['Diabetes', 'Asthma'];
      idrs.setDiseasesSelected(['Diabetes'] as any);
      expect(idrs.enableDiseaseConfirmation).toHaveBeenCalledWith(true);
      expect(disease('Diabetes').confirmed).toBeTrue();
      expect(component.confirmDiseaseArray).toEqual(['Diabetes']);
      expect(component.suspect).toEqual(['Asthma']);
      expect(idrs.clearDiabetesSelected).toHaveBeenCalled();
    });

    it('ignores empty visit disease list', () => {
      spyOn(idrs, 'enableDiseaseConfirmation');
      idrs.setDiseasesSelected([] as any);
      expect(idrs.enableDiseaseConfirmation).not.toHaveBeenCalled();
    });

    it('unchecked disease with yes answer moves back to suspected', () => {
      component.confirmDiseaseArray = ['Asthma'];
      disease('Asthma').confirmed = true;
      component.questions1[2].answer = 'yes';
      idrs.setUnchecked('Asthma');
      expect(component.confirmDiseaseArray).toEqual([]);
      expect(component.suspect).toEqual(['Asthma']);
      expect(disease('Asthma').confirmed).toBeFalse();
      expect(form.value.requiredList).toContain('Asthma');
    });

    it('unchecked disease without yes answer just unconfirms', () => {
      component.confirmDiseaseArray = ['Epilepsy'];
      disease('Epilepsy').confirmed = true;
      idrs.setUnchecked('Epilepsy');
      expect(component.suspect).toEqual([]);
      expect(disease('Epilepsy').confirmed).toBeFalse();
    });

    it('final diabetes diagnosis confirm and revoke', () => {
      component.suspect = ['Diabetes'];
      idrs.finalDiagnosisDiabetesConfirm(true);
      expect(component.confirmDiseaseArray).toContain('Diabetes');
      expect(component.suspect).toEqual([]);
      expect(disease('Diabetes').confirmed).toBeTrue();
      component.questions1[0].answer = 'yes';
      idrs.finalDiagnosisDiabetesConfirm(false);
      expect(component.confirmDiseaseArray).not.toContain('Diabetes');
      expect(component.suspect).toEqual(['Diabetes']);
      expect(disease('Diabetes').confirmed).toBeFalse();
    });

    it('final hypertension diagnosis confirm and revoke', () => {
      component.suspect = ['Hypertension'];
      idrs.finalDiagnosisHypertensionConfirm(true);
      expect(component.confirmDiseaseArray).toContain('Hypertension');
      expect(component.suspect).toEqual([]);
      idrs.finalDiagnosisHypertensionConfirm(false);
      expect(component.confirmDiseaseArray).not.toContain('Hypertension');
    });

    it('systolic BP >= 140 adds and < 140 removes Hypertension', () => {
      idrs.setSystolicBp(150);
      idrs.setSystolicBp(160);
      expect(component.suspect).toEqual(['Hypertension']);
      idrs.setSystolicBp(120);
      expect(component.suspect).toEqual([]);
    });

    it('diastolic BP >= 90 adds and < 90 removes Hypertension', () => {
      idrs.setDiastolicBp(95);
      idrs.setDiastolicBp(96);
      expect(component.suspect).toEqual(['Hypertension']);
      idrs.setDiastolicBp(80);
      expect(component.suspect).toEqual([]);
    });

    it('does not evaluate BP once hypertension checkbox selected', () => {
      idrs.setHypertensionSelected();
      idrs.setSystolicBp(180);
      expect(component.hypertensionChecked).toBeTrue();
      expect(component.suspect).toEqual([]);
    });

    it('ignores undefined BP values', () => {
      idrs.systolicBpValue.next(undefined);
      idrs.diastolicBpValue.next(undefined);
      expect(component.systolicValueFromVital).toBeNull();
      expect(component.diastolicValueFromVital).toBeNull();
      expect(component.suspect).toEqual([]);
    });
  });

  describe('score flag', () => {
    let emitted: any[];
    beforeEach(() => {
      init(55);
      loadQuestions();
      emitted = [];
      component.IDRSChanged.subscribe((v) => emitted.push(v));
    });

    it('emits true when flag cleared', () => {
      idrs.clearScoreFlag();
      expect(emitted).toEqual([true]);
    });

    it('requires Diabetes when score >= 60 and unanswered', () => {
      idrs.setIDRSScoreWaist(30);
      idrs.setIDRSScoreFlag();
      expect(emitted).toEqual([false]);
      expect(disease('Diabetes').flag).toBeTrue();
      expect(component.required).toContain('Diabetes');
    });

    it('does not require Diabetes when its questions are all answered', () => {
      idrs.setIDRSScoreWaist(30);
      component.questions1[0].answer = 'no';
      component.questions1[1].answer = 'no';
      idrs.setIDRSScoreFlag();
      expect(disease('Diabetes').flag).toBeFalse();
    });

    it('revisit non-diabetic still checks score', () => {
      component.revisit = true;
      component.isDiabetic = false;
      idrs.setIDRSScoreWaist(30);
      idrs.setIDRSScoreFlag();
      expect(disease('Diabetes').flag).toBeTrue();
    });

    it('known diabetic never requires Diabetes', () => {
      component.isDiabetic = true;
      idrs.setIDRSScoreWaist(30);
      disease('Diabetes').flag = true;
      idrs.setIDRSScoreFlag();
      expect(disease('Diabetes').flag).toBeFalse();
      expect(component.required).not.toContain('Diabetes');
      expect(component.required).toContain('Asthma');
    });
  });

  describe('ngOnChanges and nurse details', () => {
    const idrsDetails = {
      statusCode: 200,
      data: {
        IDRSDetail: {
          suspectedDisease: 'Diabetes,Asthma',
          idrsDetails: [
            { idrsQuestionId: 1, answer: 'Yes', ID: 11 },
            { idrsQuestionId: 3, answer: 'No', ID: 13 },
          ],
        },
      },
    };

    it('view mode fetches and patches IDRS details', () => {
      init(55);
      loadQuestions();
      session.store.set('visitID', 'V1');
      doctor.getIDRSDetails.and.returnValue(of(idrsDetails));
      component.ncdScreeningMode = 'view';
      component.ngOnChanges();
      expect(component.doctorScreen).toBeTrue();
      expect(doctor.screeningType).toBe('Idrs');
      expect(component.suspect).toEqual(['Diabetes', 'Asthma']);
      expect(component.questions1[0].answer).toBe('yes');
      expect(component.questions1[0].id).toBe(11);
      expect(disease('Asthma').flag).toBeFalse();
      expect(component.revisit).toBeFalse();
      expect(form.value.isDiabetic).toBeTrue();
      expect(form.value.questionArray.length).toBe(2);
      expect(component.rev.length).toBe(2);
      expect(nurse.getPreviousVisitData).toHaveBeenCalled();
    });

    it('marks revisit when no questions match', () => {
      init(55);
      loadQuestions();
      session.store.set('visitID', 'V1');
      doctor.getIDRSDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            IDRSDetail: {
              suspectedDisease: null,
              idrsDetails: [{ idrsQuestionId: 99, answer: 'Yes', ID: 1 }],
            },
          },
        }),
      );
      component.ncdScreeningMode = 'view';
      component.ngOnChanges();
      expect(component.revisit).toBeTrue();
      expect(component.suspect).toEqual([]);
      expect(form.value.isDiabetic).toBeFalse();
    });

    it('ignores response with no data', () => {
      init(55);
      session.store.set('visitID', 'V1');
      doctor.getIDRSDetails.and.returnValue(
        of({ statusCode: 200, data: null }),
      );
      component.getIDRSDetailsFrmNurse('V1', 'B1');
      expect(doctor.screeningType).toBeUndefined();
    });

    it('handles detail without IDRSDetail', () => {
      init(55);
      doctor.getIDRSDetails.and.returnValue(
        of({ statusCode: 200, data: { IDRSDetail: null } }),
      );
      component.getIDRSDetailsFrmNurse('V1', 'B1');
      expect(doctor.screeningType).toBe('Idrs');
      expect(component.suspect).toEqual([]);
    });

    it('view mode without visit id does not fetch', () => {
      init(55);
      component.ncdScreeningMode = 'view';
      component.ngOnChanges();
      expect(doctor.getIDRSDetails).not.toHaveBeenCalled();
    });

    it('specialist flag 100 fetches IDRS details', () => {
      init(55);
      session.store.set('visitID', 'V1');
      session.store.set('specialistFlag', '100');
      component.ngOnChanges();
      expect(component.doctorScreen).toBeTrue();
      expect(doctor.getIDRSDetails).toHaveBeenCalledWith('B1', 'V1');
    });

    it('update mode success', () => {
      init(55);
      session.store.set('visitCategory', 'NCD screening');
      doctor.updateIDRSDetails.and.returnValue(
        of({ statusCode: 200, data: { response: 'ok' } }),
      );
      const emitted: any[] = [];
      component.IDRSChanged.subscribe((v) => emitted.push(v));
      form.markAsDirty();
      component.ncdScreeningMode = 'update';
      component.ngOnChanges();
      expect(doctor.updateIDRSDetails).toHaveBeenCalledWith(
        form,
        'NCD screening',
      );
      expect(confirm.alert).toHaveBeenCalledWith('ok', 'success');
      expect(emitted).toEqual(['check', true]);
      expect(form.pristine).toBeTrue();
    });

    it('update mode non-200', () => {
      init(55);
      doctor.updateIDRSDetails.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'nope' }),
      );
      const emitted: any[] = [];
      component.IDRSChanged.subscribe((v) => emitted.push(v));
      component.updateIDRSDetails(form, 'x');
      expect(confirm.alert).toHaveBeenCalledWith('nope', 'error');
      expect(emitted).toEqual(['check', false]);
    });

    it('update mode error', () => {
      init(55);
      doctor.updateIDRSDetails.and.returnValue(throwingObs('err'));
      const emitted: any[] = [];
      component.IDRSChanged.subscribe((v) => emitted.push(v));
      component.updateIDRSDetails(form, 'x');
      expect(confirm.alert).toHaveBeenCalledWith('err', 'error');
      expect(emitted).toEqual(['check', false]);
    });
  });

  describe('previous diabetes history', () => {
    beforeEach(() => init(55));

    it('opens dialog when data present', () => {
      const data = { data: [{ a: 1 }] };
      nurse.getPreviousDiabetesHistory.and.returnValue(
        of({ statusCode: 200, data }),
      );
      component.getPreviousDiabetesHistory();
      expect(nurse.getPreviousDiabetesHistory).toHaveBeenCalledWith(
        'B1',
        'NCD screening',
      );
      expect(dialog.open).toHaveBeenCalledWith(PreviousDetailsComponent, {
        data: {
          dataList: data,
          title: LANGUAGE_EN.previousDiabetesHistoryDetails,
        },
      });
    });

    it('alerts when no data', () => {
      nurse.getPreviousDiabetesHistory.and.returnValue(
        of({ statusCode: 200, data: { data: [] } }),
      );
      component.getPreviousDiabetesHistory();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.pastDiabetesHistoryNotAvailable,
      );
    });

    it('alerts on non-200', () => {
      nurse.getPreviousDiabetesHistory.and.returnValue(of({ statusCode: 500 }));
      component.getPreviousDiabetesHistory();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.errorFetchingHistory,
        'error',
      );
    });

    it('alerts on error', () => {
      nurse.getPreviousDiabetesHistory.and.returnValue(throwingObs());
      component.getPreviousDiabetesHistory();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.errorFetchingHistory,
        'error',
      );
    });
  });

  it('ngOnDestroy clears state and unsubscribes', () => {
    init(55);
    spyOn(idrs, 'clearDiseaseSelected').and.callThrough();
    spyOn(idrs, 'clearSystolicBp').and.callThrough();
    const subs = [
      component.IDRSScoreFlagCheckSubscription,
      component.visitDiseaseSubscription,
      component.systolicBpValueSubscription,
      component.diastolicBpValueSubscription,
      component.hypertensionSelectedFlagSubscription,
    ];
    component.suspect = ['x'];
    fixture.destroy();
    expect(component.suspect).toEqual([]);
    expect(idrs.clearDiseaseSelected).toHaveBeenCalled();
    expect(idrs.clearSystolicBp).toHaveBeenCalled();
    subs.forEach((s) => expect(s.closed).toBeTrue());
  });
});
