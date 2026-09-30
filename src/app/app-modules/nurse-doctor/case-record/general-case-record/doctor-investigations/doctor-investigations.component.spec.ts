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
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, of } from 'rxjs';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

import { DoctorInvestigationsComponent } from './doctor-investigations.component';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../../shared/services';
import { IdrsscoreService } from '../../../shared/services/idrsscore.service';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { PreviousDetailsComponent } from 'src/app/app-modules/core/components/previous-details/previous-details.component';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

describe('DoctorInvestigationsComponent', () => {
  let component: DoctorInvestigationsComponent;
  let fixture: ComponentFixture<DoctorInvestigationsComponent>;
  let s: Record<string, BehaviorSubject<any>>;
  let doctorService: any;
  let idrs: any;
  let nurse: any;
  let confirmation: any;
  let dialog: any;
  let session: any;

  const RBS = {
    procedureID: 1,
    procedureName: 'RBS Test',
    procedureType: 'Laboratory',
  };
  const HB = {
    procedureID: 2,
    procedureName: 'Hemoglobin Test',
    procedureType: 'Laboratory',
  };
  const VA = {
    procedureID: 3,
    procedureName: 'Visual Acuity Test',
    procedureType: 'Laboratory',
  };
  const CBC = {
    procedureID: 4,
    procedureName: 'CBC',
    procedureType: 'Laboratory',
  };
  const XRAY = {
    procedureID: 5,
    procedureName: 'X-Ray',
    procedureType: 'Radiology',
  };
  const procedures = [RBS, HB, VA, CBC, XRAY];

  async function setup(sessionSeed: Record<string, any> = {}) {
    s = {
      hyper: new BehaviorSubject<any>(null),
      finalHyper: new BehaviorSubject<any>(false),
      sys: new BehaviorSubject<any>(null),
      dia: new BehaviorSubject<any>(null),
      diabetes: new BehaviorSubject<any>(null),
      rbsSel: new BehaviorSubject<any>(null),
      rbsRes: new BehaviorSubject<any>(null),
      caseRecord: new BehaviorSubject<any>(null),
      nurseMaster: new BehaviorSubject<any>(null),
      doctorMaster: new BehaviorSubject<any>(null),
    };
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [DoctorInvestigationsComponent],
      providers: [
        ...commonTestProviders({
          session: { beneficiaryRegID: 'B1', visitID: 'V1', ...sessionSeed },
        }),
        {
          provide: DoctorService,
          useValue: autoSpy(DoctorService, {
            populateCaserecordResponse$: s['caseRecord'].asObservable(),
          }),
        },
        {
          provide: MasterdataService,
          useValue: autoSpy(MasterdataService, {
            nurseMasterData$: s['nurseMaster'].asObservable(),
            doctorMasterData$: s['doctorMaster'].asObservable(),
          }),
        },
        {
          provide: IdrsscoreService,
          useValue: autoSpy(IdrsscoreService, {
            hypertensionSelectedFlag$: s['hyper'].asObservable(),
            finalDiagnosisHypertensionConfirmation$:
              s['finalHyper'].asObservable(),
            systolicBpValue$: s['sys'].asObservable(),
            diastolicBpValue$: s['dia'].asObservable(),
            diabetesSelectedFlag$: s['diabetes'].asObservable(),
            visualAcuityTestInMMU: 1,
            diabetesNotPresentInMMU: 0,
            diabetesSelected: null,
          }),
        },
        {
          provide: NurseService,
          useValue: autoSpy(NurseService, {
            rbsSelectedInInvestigation$: s['rbsSel'].asObservable(),
            rbsTestResultCurrent$: s['rbsRes'].asObservable(),
            rbsTestResultFromDoctorFetch: null,
          }),
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(DoctorInvestigationsComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(DoctorInvestigationsComponent);
    component = fixture.componentInstance;
    doctorService = TestBed.inject(DoctorService) as any;
    idrs = TestBed.inject(IdrsscoreService) as any;
    nurse = TestBed.inject(NurseService) as any;
    confirmation = TestBed.inject(ConfirmationService) as any;
    dialog = TestBed.inject(MatDialog) as any;
    session = TestBed.inject(SessionStorageService) as any;
    component.generalDoctorInvestigationForm = new FormGroup({
      labTest: new FormControl(null),
      radiologyTest: new FormControl(null),
      externalInvestigations: new FormControl(null),
    });
  }

  describe('default session', () => {
    beforeEach(async () => setup());

    it('initialises and clears idrs/nurse state', () => {
      fixture.detectChanges();
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
      expect(idrs.clearSystolicBp).toHaveBeenCalled();
      expect(idrs.clearDiastolicBp).toHaveBeenCalled();
      expect(idrs.clearHypertensionSelected).toHaveBeenCalled();
      expect(nurse.clearRbsInVitals).toHaveBeenCalled();
      expect(nurse.clearRbsSelectedInInvestigation).toHaveBeenCalled();
      expect(component.referredVisitcode).toBe('undefined');
      expect(doctorService.getMMUData).not.toHaveBeenCalled();
      expect(component.VisualAcuityMandatory).toBeFalse();
    });

    it('refreshes language on ngDoCheck', () => {
      component.ngDoCheck();
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
    });

    it('tracks rbs selection and vitals rbs result', () => {
      fixture.detectChanges();
      s['rbsSel'].next(true);
      expect(component.rbsSelectedUnderInvestigation).toBeTrue();
      s['rbsRes'].next(250);
      expect(component.RBSTestDoneInVitals).toBeTrue();
      expect(component.rbsTestResultCurrent).toBe(250);
      expect(component.VisualAcuityMandatory).toBeTrue();
      expect(idrs.setVisualAcuityTestMandatoryFlag).toHaveBeenCalled();
      s['rbsRes'].next(null);
      expect(component.RBSTestDoneInVitals).toBeFalse();
      expect(component.rbsTestResultCurrent).toBeNull();
      expect(component.VisualAcuityMandatory).toBeFalse();
    });

    it('reacts to hypertension and BP values', () => {
      fixture.detectChanges();
      s['hyper'].next(0);
      s['sys'].next(150);
      expect(component.systolicBpValue).toBe(150);
      expect(component.VisualAcuityMandatory).toBeTrue();
      s['sys'].next(120);
      expect(component.VisualAcuityMandatory).toBeFalse();
      s['dia'].next(95);
      expect(component.VisualAcuityMandatory).toBeTrue();
      s['dia'].next(70);
      expect(component.VisualAcuityMandatory).toBeFalse();
      s['finalHyper'].next(true);
      s['sys'].next(160);
      expect(component.finalHypertension).toBeTrue();
      expect(component.VisualAcuityMandatory).toBeFalse();
    });

    it('does not set mandatory flag when visual acuity done in MMU', () => {
      idrs.visualAcuityTestInMMU = 0;
      component.RBSTestScore = 300;
      component.checkRBSScore();
      component.changeOfSystolicBp(0);
      component.changeOdDiastolicBp(0);
      component.changeOfConfirmedDiabetes(1);
      component.changeOfConfirmedHypertension(1);
      expect(component.VisualAcuityMandatory).toBeTrue();
      expect(idrs.setVisualAcuityTestMandatoryFlag).not.toHaveBeenCalled();
    });

    it('changeOfConfirmedDiabetes / Hypertension toggle mandatory', () => {
      component.changeOfConfirmedDiabetes(1);
      expect(component.VisualAcuityMandatory).toBeFalse();
      component.RBSTestScoreInVitals = 201;
      component.changeOfConfirmedDiabetes(1);
      expect(component.VisualAcuityMandatory).toBeTrue();
      component.RBSTestScoreInVitals = 0;
      component.systolicBpValue = 145;
      component.changeOfConfirmedHypertension(0);
      expect(component.VisualAcuityMandatory).toBeTrue();
      component.changeOfConfirmedHypertension(1);
      expect(component.VisualAcuityMandatory).toBeFalse();
      component.systolicBpValue = 100;
      component.diastolicBpValue = 95;
      component.changeOfConfirmedHypertension(0);
      expect(component.VisualAcuityMandatory).toBeTrue();
      component.hypertensionSelected = 0;
      component.changeOfConfirmedDiabetes(1);
      expect(component.VisualAcuityMandatory).toBeTrue();
      component.diastolicBpValue = 60;
      component.systolicBpValue = 150;
      component.changeOfConfirmedDiabetes(1);
      expect(component.VisualAcuityMandatory).toBeTrue();
    });

    it('logs doctor master data', () => {
      const log = spyOn(console, 'log');
      fixture.detectChanges();
      s['doctorMaster'].next({ a: 1 });
      expect(log).toHaveBeenCalledWith('doctor master', { a: 1 });
    });

    it('splits nurse master procedures and flags master tests', () => {
      fixture.detectChanges();
      s['nurseMaster'].next({ procedures });
      expect(component.nonRadiologyMaster.length).toBe(4);
      expect(component.radiologyMaster).toEqual([XRAY]);
      expect(component.rbsPresent).toBeTrue();
      expect(component.visualAcuityPresent).toBeTrue();
      expect(idrs.rBSPresentInMaster).toHaveBeenCalled();
      expect(idrs.visualAcuityPresentInMaster).toHaveBeenCalled();
      expect(idrs.haemoglobinPresentInMaster).toHaveBeenCalled();
      expect(component.investigationSubscription).toBeUndefined();
    });

    it('ignores nurse master without procedures', () => {
      fixture.detectChanges();
      s['nurseMaster'].next({});
      expect(component.nonRadiologyMaster).toBeUndefined();
    });

    it('loads and patches investigation details in view mode', () => {
      component.caseRecordMode = 'view';
      session.setItem('visitCategory', 'NCD care');
      fixture.detectChanges();
      s['nurseMaster'].next({ procedures });
      expect(component.beneficiaryRegID).toBe('B1');
      expect(component.visitID).toBe('V1');
      expect(component.visitCategory).toBe('NCD care');
      s['caseRecord'].next({
        statusCode: 200,
        data: {
          investigation: {
            laboratoryList: [RBS, HB, VA, XRAY],
          },
          diagnosis: { externalInvestigation: 'Ext' },
          LabReport: [
            {
              procedureName: 'RBS Test',
              componentList: [{ testResultValue: 220 }],
            },
            { procedureName: 'CBC', componentList: [{ testResultValue: 1 }] },
          ],
        },
      });
      const v = component.generalDoctorInvestigationForm.value;
      expect(v.labTest).toEqual([RBS, HB, VA]);
      expect(v.radiologyTest).toEqual([XRAY]);
      expect(v.externalInvestigations).toBe('Ext');
      expect(component.rbsSelectedInInvestigation).toBeTrue();
      expect(nurse.setRbsSelectedInInvestigation).toHaveBeenCalledWith(true);
      expect(component.hemoglobbinSelected).toBeTrue();
      expect(component.VisualAcuityTestDone).toBeTrue();
      expect(component.RBSTestScore).toBe(220);
      expect(component.VisualAcuityMandatory).toBeTrue();
    });

    it('ignores case record without investigation', () => {
      component.getInvestigationDetails();
      s['caseRecord'].next({ statusCode: 200, data: {} });
      expect(component.generalDoctorInvestigationForm.value.labTest).toBeNull();
    });

    it('patchInvestigationDetails without lab list or diagnosis', () => {
      component.patchInvestigationDetails({}, null);
      expect(component.generalDoctorInvestigationForm.value).toEqual({
        labTest: [],
        radiologyTest: [],
        externalInvestigations: '',
      });
    });

    it('checkTestScore handles undefined reports', () => {
      component.checkTestScore(undefined);
      expect(component.RBSTestScore).toBeUndefined();
      expect(idrs.clearVisualAcuityTestMandatoryFlag).toHaveBeenCalled();
    });

    describe('canDisable', () => {
      it('disables RBS when current rbs result exists', () => {
        component.rbsTestResultCurrent = 120;
        expect(component.canDisable(RBS)).toBeTrue();
      });

      it('disables RBS when doctor fetched rbs result', () => {
        nurse.rbsTestResultFromDoctorFetch = 100;
        expect(component.canDisable({ ...RBS })).toBeTrue();
      });

      it('flags previously prescribed tests', () => {
        component.rbsTestResultCurrent = null;
        component.previousLabTestList = [CBC];
        const t1: any = { ...CBC };
        const t2: any = { ...HB };
        expect(component.canDisable(t1)).toBeTrue();
        expect(t1.disabled).toBeTrue();
        expect(component.canDisable(t2)).toBeFalse();
        expect(t2.disabled).toBeFalse();
      });

      it('returns undefined without previous list', () => {
        expect(component.canDisable({ ...CBC })).toBeUndefined();
      });
    });

    describe('checkTestName', () => {
      beforeEach(() => {
        fixture.detectChanges();
        s['nurseMaster'].next({ procedures });
      });

      it('flags RBS, Hb and visual acuity selection', () => {
        component.checkTestName({ value: [RBS, VA, HB] });
        expect(component.rbsSelectedInInvestigation).toBeTrue();
        expect(component.VisualAcuityTestDone).toBeTrue();
        expect(component.hemoglobbinSelected).toBeTrue();
        expect(nurse.setRbsSelectedInInvestigation).toHaveBeenCalledWith(true);
        expect(component.generalDoctorInvestigationForm.value.labTest).toEqual([
          RBS,
          VA,
          HB,
        ]);
      });

      it('clears flags when nothing special selected', () => {
        component.rbsSelectedInInvestigation = true;
        component.checkTestName({ value: [CBC] });
        expect(component.rbsSelectedInInvestigation).toBeFalse();
        expect(component.hemoglobbinSelected).toBeFalse();
        expect(nurse.setRbsSelectedInInvestigation).toHaveBeenCalledWith(false);
      });

      it('auto-adds hemoglobin with RBS for ANC', () => {
        component.visitCategoryCheck = 'ANC';
        const hb = component.nonRadiologyMaster.find(
          (t: any) => t.procedureName === 'Hemoglobin Test',
        );
        component.checkTestName({ value: [RBS] });
        expect(component.generalDoctorInvestigationForm.value.labTest).toEqual([
          RBS,
          hb,
        ]);
        expect(component.hemoglobbinSelected).toBeTrue();
      });

      it('does not duplicate hemoglobin for ANC', () => {
        component.visitCategoryCheck = 'ANC';
        const hb = component.nonRadiologyMaster.find(
          (t: any) => t.procedureName === 'Hemoglobin Test',
        );
        component.checkTestName({ value: [RBS, hb] });
        expect(component.generalDoctorInvestigationForm.value.labTest).toEqual([
          RBS,
          hb,
        ]);
      });

      it('handles ANC when master has no hemoglobin test', () => {
        component.visitCategoryCheck = 'ANC';
        component.nonRadiologyMaster = [RBS];
        component.checkTestName({ value: [RBS] });
        expect(component.generalDoctorInvestigationForm.value.labTest).toEqual([
          RBS,
        ]);
      });
    });

    describe('loadMMUInvestigation', () => {
      beforeEach(() => {
        fixture.detectChanges();
        session.setItem('referredVisitCode', 'RVC');
        session.setItem('referredVisitID', 'RV');
      });

      it('opens previous details dialog when data present', () => {
        const data = { data: { laboratoryList: [CBC] } };
        doctorService.getMMUData.and.returnValue(of({ statusCode: 200, data }));
        component.loadMMUInvestigation();
        expect(doctorService.getMMUData).toHaveBeenCalledWith({
          benRegID: 'B1',
          visitCode: 'RVC',
          benVisitID: 'RV',
          fetchMMUDataFor: 'Investigation',
        });
        expect(dialog.open).toHaveBeenCalledWith(PreviousDetailsComponent, {
          data: {
            dataList: data,
            title: LANGUAGE_EN.mmuInvestigationDetails,
          },
        });
      });

      it('alerts when no lab list', () => {
        doctorService.getMMUData.and.returnValue(
          of({ statusCode: 200, data: { data: { laboratoryList: [] } } }),
        );
        component.loadMMUInvestigation();
        expect(confirmation.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.mmuInvestigationDetailsNotAvailable,
        );
      });

      it('alerts error on failure status and on http error', () => {
        doctorService.getMMUData.and.returnValues(
          of({ statusCode: 5000, data: null }),
          throwingObs(),
        );
        component.loadMMUInvestigation();
        component.loadMMUInvestigation();
        expect(confirmation.alert).toHaveBeenCalledTimes(2);
        expect(confirmation.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.errorInFetchingMMUInvestigationDetails,
          'error',
        );
      });

      it('skips when referred visit is undefined', () => {
        session.setItem('referredVisitCode', 'undefined');
        component.loadMMUInvestigation();
        expect(doctorService.getMMUData).not.toHaveBeenCalled();
      });

      it('sends nulls for empty session values', () => {
        session.setItem('beneficiaryRegID', '');
        session.setItem('referredVisitCode', '');
        session.setItem('referredVisitID', '');
        doctorService.getMMUData.and.returnValue(
          of({ statusCode: 5000, data: null }),
        );
        component.loadMMUInvestigation();
        expect(doctorService.getMMUData).toHaveBeenCalledWith({
          benRegID: null,
          visitCode: null,
          benVisitID: null,
          fetchMMUDataFor: 'Investigation',
        });
      });
    });

    it('ngOnDestroy unsubscribes everything', () => {
      fixture.detectChanges();
      component.getInvestigationDetails();
      component.diabetesObservable();
      const subs = [
        component.nurseMasterDataSubscription,
        component.doctorMasterDataSubscription,
        component.investigationSubscription,
        component.diabetesSelectedFlagSubscription,
        component.hyperSuspectedSubscription,
        component.systolicSubscription,
        component.diastolicSubscription,
        component.finalHypertensionSubscription,
        component.rbsTestResultSubscription,
        component.rbsSelectedInInvestigationSubscription,
      ];
      component.ngOnDestroy();
      expect(idrs.clearDiabetesSelected).toHaveBeenCalled();
      subs.forEach((sub) => expect(sub.closed).toBeTrue());
    });

    it('ngOnDestroy without subscriptions does not throw', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
      component.rbsTestResultSubscription = { unsubscribe: () => {} } as any;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('diabetesObservable updates selection unless MMU checked', () => {
      component.diabetesObservable();
      s['diabetes'].next(1);
      expect(component.diabetesSelected).toBe(1);
      expect(idrs.diabetesNotPresentInMMU).toBe(1);
      component.checkForMMUInvestigation = true;
      s['diabetes'].next(0);
      expect(component.diabetesSelected).toBe(1);
    });
  });

  describe('NCD screening visit', () => {
    beforeEach(async () =>
      setup({
        visitCategory: 'NCD screening',
        referredVisitCode: 'RVC',
        referredVisitID: 'RV',
      }),
    );

    it('marks RBS done in MMU and visual acuity present', () => {
      doctorService.getMMUData.and.returnValue(
        of({
          statusCode: 200,
          data: { data: { laboratoryList: [RBS, VA] } },
        }),
      );
      fixture.detectChanges();
      expect(idrs.clearDiabetesSelected).toHaveBeenCalled();
      expect(component.referredVisitcode).toBe('RVC');
      expect(component.checkForMMUInvestigation).toBeTrue();
      expect(component.rbsTestDoneMMU).toBeTrue();
      expect(component.VisualAcuityTestDoneMMU).toBeTrue();
      expect(idrs.visualAcuityTestInMMU).toBe(0);
    });

    it('subscribes to diabetes when RBS not in MMU list', () => {
      doctorService.getMMUData.and.returnValue(
        of({ statusCode: 200, data: { data: { laboratoryList: [CBC] } } }),
      );
      fixture.detectChanges();
      expect(component.checkForMMUInvestigation).toBeFalse();
      expect(idrs.visualAcuityTestInMMU).toBe(1);
      s['diabetes'].next(1);
      expect(component.diabetesSelected).toBe(1);
    });

    it('handles empty MMU lab list', () => {
      const log = spyOn(console, 'log');
      doctorService.getMMUData.and.returnValue(
        of({ statusCode: 200, data: { data: { laboratoryList: [] } } }),
      );
      fixture.detectChanges();
      expect(idrs.diabetesSelected).toBe(0);
      expect(log).toHaveBeenCalledWith(
        'No data avaiable from MMU investigations',
      );
    });

    it('alerts on failed MMU response', () => {
      doctorService.getMMUData.and.returnValue(
        of({ statusCode: 5000, data: null }),
      );
      fixture.detectChanges();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.errorInFetchingMMUInvestigationDetails,
        'error',
      );
      expect(component.diabetesSelected).toBeNull();
    });

    it('alerts on MMU http error', () => {
      doctorService.getMMUData.and.returnValue(throwingObs());
      fixture.detectChanges();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.errorInFetchingMMUInvestigationDetails,
        'error',
      );
      expect(component.diabetesSelectedFlagSubscription).toBeDefined();
    });
  });
});
