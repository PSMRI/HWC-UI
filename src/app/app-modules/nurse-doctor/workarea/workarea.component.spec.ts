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
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, of, Subject } from 'rxjs';

import { WorkareaComponent } from './workarea.component';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../shared/services';
import { IdrsscoreService } from '../shared/services/idrsscore.service';
import { NcdScreeningService } from '../shared/services/ncd-screening.service';
import { HrpService } from '../shared/services/hrp.service';
import { BeneficiaryDetailsService } from '../../core/services/beneficiary-details.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { RegistrarService } from 'Common-UI/src/registrar/services/registrar.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { environment } from 'src/environments/environment';
import {
  autoSpy,
  COMMON_TEST_IMPORTS,
  commonTestProviders,
  createDialogRefMock,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  throwingObs,
} from 'src/testing/test-utils';

const L: any = LANGUAGE_EN;
const OK = (data: any = { response: 'Saved' }) => of({ statusCode: 200, data });
const FAIL = of({ statusCode: 5000, errorMessage: 'failed' });
const SUCCESS_MSG = L.alerts.info.datafillSuccessfully;

const SESSION_BASE: Record<string, any> = {
  serviceLineDetails: JSON.stringify({ facilityID: 1, parkingPlaceID: 2 }),
  visitCategory: 'General OPD',
  beneficiaryRegID: '100',
  visitID: '10',
  visitCode: 'VC1',
  providerServiceID: 5,
  userName: 'nurse1',
  userID: 7,
  designation: 'Nurse',
  serviceName: 'HWC',
  visitReason: 'New',
  nurseFlag: 1,
  doctorFlag: 1,
  specialist_flag: 1,
  beneficiaryID: 'B1',
  benFlowID: 99,
  sessionID: 'S1',
  serviceID: 4,
};

/** Builds a minimal but complete patientMedicalForm covering every control the component reads. */
function buildForm(): FormGroup {
  const c = (v: any = null) => new FormControl(v);
  const group = (names: string[]) => {
    const g: any = {};
    names.forEach((n) => (g[n] = c()));
    return new FormGroup(g);
  };
  return new FormGroup({
    patientVisitForm: new FormGroup({
      patientVisitDetailsForm: group([
        'followUpForFpMethod',
        'subVisitCategory',
        'visitCategory',
        'pregnancyStatus',
      ]),
      patientCovidForm: group(['contactStatus', 'travelStatus', 'symptom']),
      covidVaccineStatusForm: group(['vaccineStatus']),
      cbacScreeningForm: group([
        'cbacAge',
        'cbacConsumeGutka',
        'cbacAlcohol',
        'cbacWaistMale',
        'cbacWaistFemale',
        'cbacPhysicalActivity',
        'cbacFamilyHistoryBpdiabetes',
      ]),
      patientChiefComplaintsForm: new FormGroup({ complaints: c([]) }),
    }),
    patientVitalsForm: group([
      'systolicBP_1stReading',
      'diastolicBP_1stReading',
      'height_cm',
      'weight_Kg',
      'temperature',
      'pulseRate',
      'waistCircumference_cm',
      'rbsCheckBox',
      'rbsTestResult',
    ]),
    patientReferForm: group([
      'refrredToAdditionalServiceList',
      'referredToInstituteName',
      'referralReason',
      'referralReasonList',
    ]),
    patientHistoryForm: new FormGroup({
      pastObstericHistory: new FormGroup({
        pastObstericHistoryList: new FormArray<any>([]),
        totalNoOfPreg: c(),
      }),
      personalHistory: new FormGroup({ allergicList: c([]) }),
      comorbidityHistory: new FormGroup({
        comorbidityConcurrentConditionsList: new FormArray<any>([
          group(['comorbidConditions']),
        ]),
      }),
      familyHistory: new FormGroup({ familyDiseaseList: c([]) }),
      physicalActivityHistory: group(['activityType']),
      menstrualHistory: group(['lMPDate']),
    }),
    patientCaseRecordForm: new FormGroup({
      generalDiagnosisForm: new FormGroup({
        provisionalDiagnosisList: new FormArray<any>([
          group(['viewProvisionalDiagnosisProvided', 'conceptID']),
        ]),
        doctorDiagnosis: c(),
        ncdScreeningConditionArray: c(),
        ncdScreeningConditionOther: c(),
        diabetesConfirmed: c(),
        hypertensionConfirmed: c(),
        diabetesScreeningConfirmed: c(),
        hypertensionScreeningConfirmed: c(),
        breastCancerConfirmed: c(),
        cervicalCancerConfirmed: c(),
        oralCancerConfirmed: c(),
      }),
      diagnosisForm: group(['provisionalDiagnosisPrimaryDoctor']),
      generalFindingsForm: new FormGroup({
        clinicalObservationsList: c([]),
        significantFindingsList: c([]),
      }),
      generalDoctorInvestigationForm: new FormGroup({ labTest: c([]) }),
    }),
    patientExaminationForm: new FormGroup({
      generalExaminationForm: group([
        'typeOfDangerSigns',
        'lymphnodesInvolved',
        'typeOfLymphadenopathy',
        'extentOfEdema',
        'edemaType',
      ]),
      oralExaminationForm: group(['image', 'observation']),
      abdominalExaminationForm: group(['image', 'observation']),
      gynecologicalExaminationForm: group(['image', 'observation']),
      breastExaminationForm: group(['image']),
    }),
    patientPNCForm: group(['deliveryPlace', 'deliveryType']),
    patientANCForm: new FormGroup({
      patientANCDetailsForm: group(['primiGravida', 'lmpDate']),
      obstetricFormulaForm: group(['gravida_G']),
    }),
    idrsScreeningForm: group(['requiredList']),
    diabetes: group(['formDisable', 'bloodGlucoseTypeID', 'bloodGlucose']),
    hypertension: group([
      'formDisable',
      'systolicBP_1stReading',
      'diastolicBP_1stReading',
      'averageSystolicBP',
      'averageDiastolicBP',
    ]),
    oral: group([
      'formDisable',
      'oralCavityFindingId',
      'mouthOpeningId',
      'palpationofOralCavityId',
      'temporomandibularJointRightId',
      'temporomandibularJointLeftId',
      'cervicalLymphnodesId',
    ]),
    breast: group([
      'formDisable',
      'inspectionBreastsId',
      'palpationBreastsId',
      'palpationLymphNodesId',
    ]),
    cervical: group(['formDisable', 'visualExaminationId']),
    patientQuickConsultForm: new FormGroup({
      chiefComplaintList: c([]),
      clinicalObservation: c(),
      provisionalDiagnosisList: new FormArray<any>([
        group(['viewProvisionalDiagnosisProvided', 'conceptID']),
      ]),
      instruction: c(),
      prescription: c({ prescribedDrugs: [] }),
      test: c(null),
      radiology: c(null),
    }),
    familyPlanningForm: new FormGroup({
      familyPlanningAndReproductiveForm: group(['x']),
      IecCounsellingForm: group(['x']),
      dispensationDetailsForm: group(['x']),
    }),
    patientBirthImmunizationHistoryForm: new FormGroup({
      infantBirthDetailsForm: group(['x']),
      immunizationHistory: group(['x']),
    }),
    patientImmunizationServicesForm: new FormGroup({
      immunizationServicesForm: group(['x']),
      oralVitaminAForm: group(['x']),
    }),
  });
}

const err = (form: FormGroup, path: string) =>
  form.get(path)!.setErrors({ required: true });

const pregGroup = (v: any) =>
  new FormGroup({
    pregOutcome: new FormControl(v.pregOutcome ?? null),
    abortionType: new FormControl(v.abortionType ?? null),
    typeofFacility: new FormControl(null),
    postAbortionComplication: new FormControl(null),
    pregDuration: new FormControl(null),
    pregOrder: new FormControl(v.pregOrder ?? 1),
  });

describe('WorkareaComponent', () => {
  let component: WorkareaComponent;
  let fixture: ComponentFixture<WorkareaComponent>;
  let nurse: any;
  let doctor: any;
  let masterdata: any;
  let ncd: any;
  let idrs: any;
  let hrp: any;
  let benDetails: any;
  let registrar: any;
  let confirmation: any;
  let dialog: any;
  let snack: any;
  let router: Router;
  let session: any;
  let route: any;
  let s: any;

  beforeEach(async () => {
    s = {
      hrp: new Subject<boolean>(),
      diseaseConfirm: new Subject<any>(),
      ncdTemp: new Subject<any>(),
      lAssess: new Subject<any>(),
      ismmutc: new BehaviorSubject<any>('no'),
      enablingIdrs: new Subject<any>(),
      valueChangedForNCD: new Subject<any>(),
      diabetesStatus: new BehaviorSubject<any>(false),
      hypertensionStatus: new BehaviorSubject<any>(false),
      oralStatus: new BehaviorSubject<any>(false),
      breastStatus: new BehaviorSubject<any>(false),
      cervicalStatus: new BehaviorSubject<any>(false),
      rbs: new Subject<any>(),
      va: new Subject<any>(),
      hb: new Subject<any>(),
      diab: new Subject<any>(),
      vaMand: new Subject<any>(),
      vitalsBtn: new Subject<any>(),
      fp: new Subject<any>(),
      bih: new Subject<any>(),
      ben: new BehaviorSubject<any>({
        ageVal: 35,
        beneficiaryID: 'B1',
        nurseFlag: 1,
        doctorFlag: 0,
      }),
      master: new BehaviorSubject<any>({
        visitCategories: [
          { visitCategory: 'General OPD', visitCategoryID: 3 },
          { visitCategory: 'ANC', visitCategoryID: 4 },
        ],
      }),
    };
    nurse = autoSpy(NurseService, {
      hrpStatusUpdateCheck$: s.hrp,
      ncdTemp$: s.ncdTemp,
      enableLAssessment$: s.lAssess,
      ismmutc$: s.ismmutc,
      fileData: null,
      diseaseFileUpload: false,
    });
    doctor = autoSpy(DoctorService, {
      enableVitalsUpdateButton$: s.vitalsBtn,
      valueChangeForFamilyPlanning$: s.fp,
      valueChangedForBirthAndImmunizationCheck$: s.bih,
      covidVaccineAgeGroup: null,
      enableCovidVaccinationButton: false,
    });
    doctor.postGeneralCaseRecordInvestigation.and.returnValue({
      laboratoryList: [],
    });
    doctor.postGeneralRefer.and.returnValue({ refer: true });
    masterdata = autoSpy(MasterdataService, {
      visitDetailMasterData$: s.master,
    });
    ncd = autoSpy(NcdScreeningService, {
      enableDiseaseConfirmForm$: s.diseaseConfirm,
      enablingIdrs$: s.enablingIdrs,
      valueChangedForNCD$: s.valueChangedForNCD,
      diabetesStatus$: s.diabetesStatus,
      hypertensionStatus$: s.hypertensionStatus,
      oralStatus$: s.oralStatus,
      breastStatus$: s.breastStatus,
      cervicalStatus$: s.cervicalStatus,
      fetchCBACResponseFromNurse: false,
      diabetesScreeningValidationOnSave: false,
      hypertensionScreeningValidationOnSave: false,
      oralScreeningValidationOnSave: false,
      breastScreeningValidationOnSave: false,
      cervicalScreeningValidationOnSave: false,
    });
    idrs = autoSpy(IdrsscoreService, {
      rBSPresentFlag$: s.rbs,
      visualAcuityPresentFlag$: s.va,
      heamoglobinPresentFlag$: s.hb,
      diabetesSelectedFlag$: s.diab,
      VisualAcuityTestMandatoryFlag$: s.vaMand,
      visualAcuityTestInMMU: 1,
      diabetesNotPresentInMMU: 1,
    });
    hrp = autoSpy(HrpService, { checkHrpStatus: false });
    benDetails = { beneficiaryDetails$: s.ben };
    registrar = autoSpy(RegistrarService);
    registrar.getHealthIdDetails.and.returnValue(
      of({ statusCode: 200, data: { BenHealthDetails: [] } }),
    );
    snack = {
      open: jasmine.createSpy('open'),
      openFromComponent: jasmine
        .createSpy('openFromComponent')
        .and.returnValue({ afterDismissed: () => of(undefined) }),
    };
    route = {
      snapshot: { params: { attendant: 'nurse' } },
      params: of({ beneficiaryRegID: '100' }),
    };

    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [WorkareaComponent],
      providers: [
        ...commonTestProviders({ session: { ...SESSION_BASE } }),
        { provide: NurseService, useValue: nurse },
        { provide: DoctorService, useValue: doctor },
        { provide: MasterdataService, useValue: masterdata },
        { provide: NcdScreeningService, useValue: ncd },
        { provide: IdrsscoreService, useValue: idrs },
        { provide: HrpService, useValue: hrp },
        { provide: BeneficiaryDetailsService, useValue: benDetails },
        { provide: RegistrarService, useValue: registrar },
        { provide: MatSnackBar, useValue: snack },
        { provide: ActivatedRoute, useValue: route },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(WorkareaComponent, '')
      .compileComponents();

    session = TestBed.inject(SessionStorageService) as any;
    confirmation = TestBed.inject(ConfirmationService) as any;
    dialog = TestBed.inject(MatDialog) as any;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    spyOn(console, 'log');
  });

  function create(
    overrides: Record<string, any> = {},
    attendant = 'nurse',
  ): WorkareaComponent {
    Object.entries(overrides).forEach(([k, v]) =>
      v === undefined ? session.store.delete(k) : session.store.set(k, v),
    );
    route.snapshot.params.attendant = attendant;
    fixture = TestBed.createComponent(WorkareaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    return component;
  }

  /** Create with General OPD then swap in the hand-built form. */
  function createWithForm(
    visitCategory = 'General OPD',
    attendant = 'nurse',
  ): FormGroup {
    create({}, attendant);
    const form = buildForm();
    component.patientMedicalForm = form;
    component.visitCategory = visitCategory;
    component.attendant = attendant;
    return form;
  }

  const stepperMock = (labels: string[]) => ({
    previous: jasmine.createSpy('previous'),
    selectedIndex: 0,
    steps: { toArray: () => labels.map((label) => ({ label })) },
  });

  // ---------------------------------------------------------------------------
  describe('initialisation', () => {
    it('creates with an existing visit category in view mode', () => {
      create();
      expect(component).toBeTruthy();
      expect(component.newLookupMode).toBeFalse();
      expect(component.showHistory).toBeTrue();
      expect(component.showCaseRecord).toBeTrue();
      expect(String(component.visitMode)).toBe('view');
      expect(component.current_language_set).toEqual(L);
      expect(nurse.setUpdateForHrpStatus).toHaveBeenCalledWith(false);
      expect(nurse.clearEnableLAssessment).toHaveBeenCalled();
      expect(nurse.clearNCDTemp).toHaveBeenCalled();
      expect(ncd.clearDiseaseConfirmationScreenFlag).toHaveBeenCalled();
      expect(masterdata.getVisitDetailMasterData).toHaveBeenCalled();
      expect(masterdata.getNurseMasterData).toHaveBeenCalledWith(3, 5);
      expect(masterdata.getDoctorMasterData).toHaveBeenCalledWith(3, 5);
      expect(session.setItem).toHaveBeenCalledWith('visitCategoryId', 3);
      expect(doctor.checkUsersignatureExist).toHaveBeenCalledWith(7);
      expect(component.nurseFlag).toBe('1');
      expect(component.beneficiary.ageVal).toBe(35);
      expect(component.beneficiaryAge).toBe(35);
    });

    it('sets doctorSignatureFlag from the signature API', () => {
      doctor.checkUsersignatureExist.and.returnValue(
        of({ statusCode: 200, data: { signStatus: true } }),
      );
      create();
      expect(component.doctorSignatureFlag).toBeTrue();
    });

    it('leaves doctorSignatureFlag false when signature data is null', () => {
      doctor.checkUsersignatureExist.and.returnValue(
        of({ statusCode: 200, data: null }),
      );
      create();
      expect(component.doctorSignatureFlag).toBeFalse();
    });

    it('reacts to service subjects subscribed in ngOnInit', () => {
      create({ visitCategory: 'NCD screening' });
      s.hrp.next(true);
      expect(component.enableExaminationUpdateForHrp).toBeTrue();
      s.diseaseConfirm.next('cbac');
      expect(component.isCbac).toBeTrue();
      s.diseaseConfirm.next('idrs');
      expect(component.isCbac).toBeFalse();
      s.diseaseConfirm.next('other');
      expect(component.isCbac).toBeFalse();
      s.ncdTemp.next(true);
      expect(component.ncdTemperature).toBeTrue();
      s.ncdTemp.next(undefined);
      expect(component.ncdTemperature).toBeFalse();
      s.lAssess.next(true);
      expect(component.enableLungAssessment).toBeTrue();
      s.lAssess.next(false);
      expect(component.enableLungAssessment).toBeFalse();
      s.rbs.next(1);
      s.va.next(2);
      s.hb.next(3);
      s.diab.next(1);
      s.vaMand.next(4);
      expect(component.rbsPresent).toBe(1);
      expect(component.visualAcuityPresent).toBe(2);
      expect(component.heamoglobinPresent).toBe(3);
      expect(component.diabetesSelected).toBe(1);
      expect(component.visualAcuityMandatory).toBe(4);
      s.vitalsBtn.next(true);
      expect(component.enableUpdateButtonInVitals).toBeTrue();
      s.vitalsBtn.next(undefined);
      expect(component.enableUpdateButtonInVitals).toBeFalse();
    });

    it('ignores disease-confirm events for other visit categories', () => {
      create();
      component.isCbac = false;
      s.diseaseConfirm.next('cbac');
      expect(component.isCbac).toBeFalse();
    });

    it('collects health ID numbers from the registrar', () => {
      registrar.getHealthIdDetails.and.returnValue(
        of({
          statusCode: 200,
          data: { BenHealthDetails: [{ healthIdNumber: 'H1' }] },
        }),
      );
      create();
      expect(registrar.getHealthIdDetails).toHaveBeenCalledWith({
        beneficiaryRegID: '100',
        beneficiaryID: null,
      });
      expect(component.healthDetailsArr).toEqual([{ healthIdNumber: 'H1' }]);
    });

    it('ignores health ID responses that are not 200', () => {
      registrar.getHealthIdDetails.and.returnValue(FAIL);
      create();
      expect(component.healthDetailsArr).toEqual([]);
    });

    it('uses the nurse eSanjeevani flag for nurse beneficiaries', () => {
      confirmation.eSanjeevaniFlagArry = 'ESanjeevani';
      create();
      expect(component.showESanjeevaniBtn).toBe(1);
    });

    it('uses the doctor eSanjeevani flag for doctor beneficiaries', () => {
      confirmation.eSanjeevaniDoctorFlagArry = 'Swymed';
      s.ben.next({ ageVal: 20, nurseFlag: 0, doctorFlag: 1 });
      create();
      expect(component.showESanjeevaniBtn).toBe(2);
    });

    it('ignores a null beneficiary', () => {
      s.ben.next(null);
      create();
      expect(component.beneficiary).toBeUndefined();
    });

    it('skips master data when the master data subject is empty', () => {
      s.master.next(null);
      create();
      expect(masterdata.getNurseMasterData).not.toHaveBeenCalled();
    });

    it('does not request master data for an unknown category id', () => {
      create({ visitCategory: 'PNC' });
      expect(masterdata.getNurseMasterData).not.toHaveBeenCalled();
      expect(session.setItem).toHaveBeenCalledWith('visitCategoryId', null);
    });

    describe('new lookup (no visit category)', () => {
      beforeEach(() => create({ visitCategory: undefined }));

      it('enters new lookup mode', () => {
        expect(component.newLookupMode).toBeTrue();
        expect(component.showHistory).toBeFalse();
      });

      it('handles a visit category chosen in the visit form', () => {
        const ctrl = component.patientVisitForm.get(
          'patientVisitDetailsForm.visitCategory',
        )!;
        component.schedulerData = { x: 1 };
        ctrl.setValue('ANC');
        expect(component.visitCategory).toBe('ANC');
        expect(component.schedulerData).toBeNull();
        expect(masterdata.reset).toHaveBeenCalled();
        expect(masterdata.getNurseMasterData).toHaveBeenCalledWith(4, 5);
        expect(component.showAnc).toBeTrue();
        expect(component.showCaseRecord).toBeFalse();
        expect(component.schedulerButton).toBe(L.common.scheduleforTM + ' HWC');
      });

      it('ignores an empty visit category value', () => {
        const ctrl = component.patientVisitForm.get(
          'patientVisitDetailsForm.visitCategory',
        )!;
        ctrl.setValue('');
        expect(masterdata.reset).not.toHaveBeenCalled();
      });

      it('tracks pregnancy status from the visit details form', () => {
        const details = component.patientVisitForm.get(
          'patientVisitDetailsForm',
        )!;
        details.patchValue({ pregnancyStatus: 'Yes' });
        expect(component.pregnancyStatus).toBe('Yes');
        details.patchValue({ pregnancyStatus: null });
        expect(component.pregnancyStatus).toBeNull();
      });
    });
  });

  // ---------------------------------------------------------------------------
  describe('setValues', () => {
    beforeEach(() => create());

    it('keeps an existing "View schedule" button label', () => {
      component.schedulerButton = 'View HWC Schedule';
      component.setValues();
      expect(component.schedulerButton).toBe('View HWC Schedule');
    });

    const cases: any[] = [
      ['tcspecialist', '1', '1', 'save', L.common.submit, true],
      ['tcspecialist', '1', '3', 'update', L.common.update, true],
      ['tcspecialist', '2', '1', 'update', L.common.submit, true],
      ['tcspecialist', '2', '3', 'update', L.common.update, true],
      ['doctor', '1', '1', 'save', L.common.submit, false],
      ['doctor', '2', '1', 'update', L.common.update, false],
    ];
    cases.forEach(([attendant, doc, spec, kind, label, isSpec]) => {
      it(`${attendant} doctorFlag=${doc} specialistFlag=${spec} -> ${kind}`, () => {
        component.attendant = attendant;
        component.doctorFlag = doc;
        component.specialistFlag = spec;
        component.isDoctorSave = false;
        component.isDoctorUpdate = false;
        component.doctorSaveAndTCSave = undefined;
        component.doctorUpdateAndTCSubmit = undefined;
        component.setValues();
        expect(component.isSpecialist).toBe(isSpec);
        if (kind === 'save') {
          expect(component.isDoctorSave).toBeTrue();
          expect(component.doctorSaveAndTCSave).toBe(label);
        } else {
          expect(component.isDoctorUpdate).toBeTrue();
          expect(component.doctorUpdateAndTCSubmit).toBe(label);
        }
      });
    });

    it('tcspecialist with doctorFlag 1 and other specialist flag sets nothing', () => {
      component.attendant = 'tcspecialist';
      component.doctorFlag = '1';
      component.specialistFlag = '2';
      component.isDoctorSave = false;
      component.isDoctorUpdate = false;
      component.setValues();
      expect(component.isDoctorSave).toBeFalse();
      expect(component.isDoctorUpdate).toBeFalse();
    });

    it('assignSelectedLanguage skips setValues when no language is loaded', () => {
      spyOn(component, 'setValues');
      (component.httpServiceService as any).appCurrentLanguge.next(null);
      component.assignSelectedLanguage();
      expect(component.setValues).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  describe('update-button subscriptions', () => {
    it('NCD screening: enables update when a screening form is dirty', () => {
      create({ visitCategory: 'NCD screening' });
      component.patientMedicalForm.get('diabetes')!.markAsDirty();
      s.valueChangedForNCD.next(true);
      expect(component.disableScreeningUpdateButton).toBeFalse();
      s.valueChangedForNCD.next(false);
      expect(component.disableScreeningUpdateButton).toBeTrue();
    });

    it('NCD screening: stays disabled when nothing is dirty', () => {
      create({ visitCategory: 'NCD screening' });
      s.valueChangedForNCD.next(true);
      expect(component.disableScreeningUpdateButton).toBeTrue();
    });

    it('family planning: enables update when a FP sub form is dirty', () => {
      create({ visitCategory: 'FP & Contraceptive Services' });
      const fp = component.patientMedicalForm.get('familyPlanningForm')!;
      fp.get('IecCounsellingForm')!.markAsDirty();
      s.fp.next(true);
      expect(component.disableFamilyPlanningUpdateButton).toBeFalse();
      s.fp.next(false);
      expect(component.disableFamilyPlanningUpdateButton).toBeTrue();
    });

    it('family planning: stays disabled without a FP form', () => {
      create();
      s.fp.next(true);
      expect(component.disableFamilyPlanningUpdateButton).toBeTrue();
    });

    it('birth & immunization: enables update when history is dirty', () => {
      create({ visitCategory: 'Neonatal and Infant Health Care Services' });
      const f = component.patientMedicalForm.get(
        'patientBirthImmunizationHistoryForm',
      )!;
      f.get('immunizationHistory')!.markAsDirty();
      s.bih.next(true);
      expect(component.disablebImmunizationHistoryUpdateButton).toBeFalse();
      s.bih.next(false);
      expect(component.disablebImmunizationHistoryUpdateButton).toBeTrue();
    });

    it('birth & immunization: stays disabled without that form', () => {
      create();
      s.bih.next(true);
      expect(component.disablebImmunizationHistoryUpdateButton).toBeTrue();
    });
  });

  // ---------------------------------------------------------------------------
  describe('handleVisitType', () => {
    beforeEach(() => create({ visitCategory: undefined }));

    it('does nothing without a category', () => {
      spyOn(component, 'hideAll');
      component.handleVisitType(null);
      expect(component.hideAll).not.toHaveBeenCalled();
    });

    it('General OPD (QC) in view mode builds quick consult and refer', () => {
      component.handleVisitType('General OPD (QC)', 'view');
      expect(component.showQuickConsult).toBeTrue();
      expect(component.showRefer).toBeTrue();
      expect(component.patientQuickConsultForm).toBeTruthy();
      expect(component.patientReferForm).toBeTruthy();
      expect(String(component.quickConsultMode)).toBe('view');
    });

    it('General OPD (QC) without mode shows only vitals', () => {
      component.handleVisitType('General OPD (QC)');
      expect(component.showVitals).toBeTrue();
      expect(component.showQuickConsult).toBeFalse();
      expect(component.patientVitalsForm).toBeTruthy();
    });

    it('Cancer Screening in view mode wires findings', () => {
      component.handleVisitType('Cancer Screening', 'view');
      expect(component.showHistory && component.showExamination).toBeTrue();
      expect(component.showCaseRecord).toBeTrue();
      expect(String(component.caseRecordMode)).toBe('view');
      component.patientExaminationForm
        .get('signsForm.observation')!
        .setValue('lump');
      expect(component.findings.briefHistory).toBe('lump');
    });

    it('Cancer Screening without mode only shows nurse sections', () => {
      component.handleVisitType('Cancer Screening');
      expect(component.showVitals).toBeTrue();
      expect(component.showCaseRecord).toBeFalse();
    });

    it('General OPD without mode tracks current vitals', () => {
      component.handleVisitType('General OPD');
      expect(component.showExamination).toBeTrue();
      expect(component.showCaseRecord).toBeFalse();
      component.patientVitalsForm.patchValue({});
      component.patientMedicalForm
        .get('patientVitalsForm')!
        .updateValueAndValidity();
      expect(component.currentVitals).toBeTruthy();
    });

    it('General OPD in view mode patches general findings', () => {
      component.handleVisitType('General OPD', 'view');
      expect(component.showRefer).toBeTrue();
      component.patientVisitForm
        .get('patientChiefComplaintsForm')!
        .updateValueAndValidity();
      expect(component.findings).toBeTruthy();
    });

    it('NCD screening reacts to IDRS enabling', () => {
      component.handleVisitType('NCD screening', 'view');
      expect(component.idrsScreeningForm).toBeTruthy();
      expect(component.patientMedicalForm.get('diabetes')).toBeTruthy();
      s.enablingIdrs.next(true);
      expect(component.showIDRSScreen).toBeTrue();
      expect(component.showNCDScreening).toBeTrue();
      s.enablingIdrs.next(false);
      expect(component.showIDRSScreen).toBeFalse();
      expect(component.showHistory).toBeTrue();
      expect(String(component.ncdScreeningMode)).toBe('view');
    });

    it('NCD screening without mode', () => {
      component.handleVisitType('NCD screening');
      expect(component.showVitals).toBeTrue();
      expect(component.showCaseRecord).toBeFalse();
    });

    ['PNC', 'COVID-19 Screening', 'NCD care'].forEach((cat) => {
      it(`${cat} in view and new modes`, () => {
        component.handleVisitType(cat);
        expect(component.showVitals).toBeTrue();
        expect(component.showCaseRecord).toBeFalse();
        component.handleVisitType(cat, 'view');
        expect(component.showCaseRecord).toBeTrue();
        expect(String(component.referMode)).toBe('view');
      });
    });

    it('PNC shows the PNC section', () => {
      component.handleVisitType('PNC', 'view');
      expect(component.showPNC).toBeTrue();
      expect(String(component.pncMode)).toBe('view');
    });

    it('ANC wires LMP, gravida and diagnosis patching', () => {
      component.handleVisitType('ANC', 'view');
      expect(component.showAnc).toBeTrue();
      const anc = component.patientANCForm;
      anc.get('patientANCDetailsForm.lmpDate')!.setValue(new Date(2024, 0, 1));
      expect(nurse.setLMPForFetosenseTest).toHaveBeenCalled();
      expect(
        component.patientHistoryForm.get('menstrualHistory.lMPDate')!.value,
      ).toEqual(new Date(2024, 0, 1));
      anc.get('patientANCDetailsForm.primiGravida')!.setValue(true);
      expect(component.primeGravidaStatus).toBeTrue();
      anc.get('obstetricFormulaForm.gravida_G')!.setValue(3);
      expect(
        component.patientHistoryForm.get('pastObstericHistory.totalNoOfPreg')!
          .value,
      ).toBe(3);
    });

    it('ANC without mode does not create the case record', () => {
      component.handleVisitType('ANC');
      expect(component.showAnc).toBeTrue();
      expect(
        component.patientMedicalForm.get('patientCaseRecordForm'),
      ).toBeNull();
      component.patientANCForm
        .get('obstetricFormulaForm.gravida_G')!
        .setValue(1);
      expect(
        component.patientHistoryForm.get('pastObstericHistory.totalNoOfPreg')!
          .value,
      ).not.toBe(1);
    });

    it('FP & Contraceptive Services in both modes', () => {
      component.handleVisitType('FP & Contraceptive Services');
      expect(component.showFamilyPlanning).toBeTrue();
      expect(component.showCaseRecord).toBeFalse();
      component.handleVisitType('FP & Contraceptive Services', 'view');
      expect(component.showCaseRecord).toBeTrue();
      expect(String(component.familyPlanningMode)).toBe('view');
    });

    [
      ['Neonatal and Infant Health Care Services', false],
      ['Childhood & Adolescent Healthcare Services', true],
    ].forEach(([cat, child]: any) => {
      it(`${cat} in both modes`, () => {
        component.handleVisitType(cat);
        expect(component.showImmunizationHistory).toBeTrue();
        expect(component.showNeonatal).toBeTrue();
        expect(component.showChildAndAdolescent).toBe(child);
        expect(component.showCaseRecord).toBeFalse();
        component.handleVisitType(cat, 'view');
        expect(component.showFollowUpImmunization).toBeTrue();
        expect(component.showRefer).toBeFalse();
        expect(component.provideCounsellingForm).toBeTruthy();
        expect(String(component.followUpImmunizationMode)).toBe('view');
      });
    });

    it('hideAll clears every section flag', () => {
      component.handleVisitType('General OPD', 'view');
      component.hideAll();
      expect(component.showHistory).toBeFalse();
      expect(component.showCaseRecord).toBeFalse();
      expect(component.patientMedicalForm.get('patientHistoryForm')).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  describe('submit dispatchers', () => {
    beforeEach(() => create());

    const nurseMap: any[] = [
      ['NCD screening', 'submitNurseNCDScreeningVisitDetails'],
      ['General OPD (QC)', 'submitNurseQuickConsultVisitDetails'],
      ['ANC', 'submitNurseANCVisitDetails'],
      ['PNC', 'submitPatientMedicalDetailsPNC'],
      ['General OPD', 'submitNurseGeneralOPDVisitDetails'],
      ['NCD care', 'submitNurseNCDcareVisitDetails'],
      ['COVID-19 Screening', 'submitNurseCovidVisitDetails'],
      ['FP & Contraceptive Services', 'submitNurseFamilyPlanningVisitDetails'],
      [
        'Neonatal and Infant Health Care Services',
        'submitNurseNeonatalAndInfantDetails',
      ],
      [
        'Childhood & Adolescent Healthcare Services',
        'submitNurseChildAndAdolesentDetails',
      ],
    ];
    nurseMap.forEach(([cat, method]) => {
      it(`nurse submit for ${cat} calls ${method}`, () => {
        const spies = nurseMap.map(([, m]) => spyOn<any>(component, m));
        component.visitCategory = cat;
        const form = { f: 1 };
        component.submitPatientMedicalDetailsForm(form);
        expect(component.disableSubmitButton).toBeTrue();
        expect(component.showProgressBar).toBeTrue();
        expect((component as any)[method]).toHaveBeenCalledWith(form);
        expect(spies.filter((sp) => sp.calls.any()).length).toBe(1);
      });
    });

    const doctorMap: any[] = [
      ['General OPD (QC)', 'submitQuickConsultDiagnosisForm'],
      ['ANC', 'submitANCDiagnosisForm'],
      ['PNC', 'submitPNCDiagnosisForm'],
      ['General OPD', 'submitGeneralOPDDiagnosisForm'],
      ['NCD care', 'submitNCDCareDiagnosisForm'],
      ['COVID-19 Screening', 'submitCovidDiagnosisForm'],
      ['NCD screening', 'submitNCDScreeningDiagnosisForm'],
      ['FP & Contraceptive Services', 'submitFamilyPlanningDiagnosis'],
      [
        'Neonatal and Infant Health Care Services',
        'submitNeonatalAndInfantServiceDiagnosis',
      ],
      [
        'Childhood & Adolescent Healthcare Services',
        'submitChildAndAdolescentServiceDiagnosis',
      ],
    ];
    doctorMap.forEach(([cat, method]) => {
      it(`doctor submit for ${cat} calls ${method}`, () => {
        const spies = doctorMap.map(([, m]) => spyOn<any>(component, m));
        component.visitCategory = cat;
        component.submitDoctorDiagnosisForm();
        expect(component.disableSubmitButton).toBeTrue();
        expect((component as any)[method]).toHaveBeenCalled();
        expect(spies.filter((sp) => sp.calls.any()).length).toBe(1);
      });
    });
  });

  // ---------------------------------------------------------------------------
  describe('nurse submit flows', () => {
    const flows: any[] = [
      [
        'submitNurseQuickConsultVisitDetails',
        'postNurseGeneralQCVisitForm',
        'checkNurseRequirements',
      ],
      [
        'submitNurseANCVisitDetails',
        'postNurseANCVisitForm',
        'checkNurseRequirements',
      ],
      [
        'submitNurseNCDcareVisitDetails',
        'postNurseNCDCareVisitForm',
        'checkNurseRequirements',
      ],
      [
        'submitNurseCovidVisitDetails',
        'postNurseCovidVisitForm',
        'checkNurseRequirements',
      ],
      [
        'submitNurseNCDScreeningVisitDetails',
        'postNCDScreeningForm',
        'checkNCDScreeningRequiredData',
      ],
      [
        'submitPatientMedicalDetailsPNC',
        'postNursePNCVisitForm',
        'checkNurseRequirements',
      ],
      [
        'submitNurseGeneralOPDVisitDetails',
        'postNurseGeneralOPDVisitForm',
        'checkNurseRequirements',
      ],
      [
        'submitNurseFamilyPlanningVisitDetails',
        'postNurseFamilyPlanningVisitForm',
        'checkNurseRequirements',
      ],
      [
        'submitNurseNeonatalAndInfantDetails',
        'postNurseNeoatalAndInfantVisitForm',
        'checkNurseRequirements',
      ],
      [
        'submitNurseChildAndAdolesentDetails',
        'postNurseChildAndAdolescentVisitForm',
        'checkNurseRequirements',
      ],
    ];

    flows.forEach(([method, api, validator]) => {
      describe(method, () => {
        const form = { medical: true };
        beforeEach(() => {
          create();
          component.beneficiary = { ageVal: 40 };
          component.disableSubmitButton = true;
          component.showProgressBar = true;
        });

        it('saves and navigates to the nurse worklist on success', () => {
          spyOn<any>(component, validator).and.returnValue(1);
          nurse[api].and.returnValue(OK());
          (component as any)[method](form);
          expect(nurse[api]).toHaveBeenCalled();
          expect(nurse[api].calls.mostRecent().args[0]).toBe(form);
          expect(confirmation.alert).toHaveBeenCalledWith(
            SUCCESS_MSG,
            'success',
          );
          expect(router.navigate).toHaveBeenCalledWith([
            '/nurse-doctor/nurse-worklist',
          ]);
          expect(session.removeItem).toHaveBeenCalledWith('beneficiaryRegID');
        });

        it('alerts and re-enables submit on a non-200 response', () => {
          spyOn<any>(component, validator).and.returnValue(1);
          nurse[api].and.returnValue(FAIL);
          (component as any)[method](form);
          expect(confirmation.alert).toHaveBeenCalledWith('failed', 'error');
          expect(component.disableSubmitButton).toBeFalse();
          expect(component.showProgressBar).toBeFalse();
          expect(router.navigate).not.toHaveBeenCalled();
        });

        it('alerts on an API error', () => {
          spyOn<any>(component, validator).and.returnValue(1);
          nurse[api].and.returnValue(throwingObs('boom'));
          (component as any)[method](form);
          expect(confirmation.alert).toHaveBeenCalledWith('boom', 'error');
          expect(component.disableSubmitButton).toBeFalse();
        });

        it('does not call the API when validation fails', () => {
          spyOn<any>(component, validator).and.returnValue(0);
          (component as any)[method](form);
          expect(nurse[api]).not.toHaveBeenCalled();
        });
      });
    });
  });

  // ---------------------------------------------------------------------------
  describe('doctor submit flows', () => {
    const flows: any[] = [
      [
        'submitANCDiagnosisForm',
        'postDoctorANCDetails',
        'checkNurseRequirements',
      ],
      [
        'submitNCDCareDiagnosisForm',
        'postDoctorNCDCareDetails',
        'checkNurseRequirements',
      ],
      [
        'submitGeneralOPDDiagnosisForm',
        'postDoctorGeneralOPDDetails',
        'checkNurseRequirements',
      ],
      [
        'submitPNCDiagnosisForm',
        'postDoctorPNCDetails',
        'checkNurseRequirements',
      ],
      [
        'submitFamilyPlanningDiagnosis',
        'postDoctorFamilyPlanningetails',
        'checkNurseRequirements',
      ],
      [
        'submitNeonatalAndInfantServiceDiagnosis',
        'postDoctorNeonatalAndInfantService',
        'checkNurseRequirements',
      ],
      [
        'submitChildAndAdolescentServiceDiagnosis',
        'postDoctorChildAndAdolescentService',
        'checkNurseRequirements',
      ],
      [
        'submitNCDScreeningDiagnosisForm',
        'postDoctorNCDScreeningDetails',
        'checkNCDScreeningRequiredData',
      ],
    ];

    flows.forEach(([method, api, validator]) => {
      describe(method, () => {
        beforeEach(() => {
          createWithForm('General OPD', 'doctor');
          spyOn(component, 'linkCareContextBasedOnSpecialistScheduled');
          spyOn(component, 'linkCareContextBasedOnTestsPrescribed');
        });

        it('links care context based on tests for a doctor', () => {
          spyOn<any>(component, validator).and.returnValue(1);
          doctor.postGeneralCaseRecordInvestigation.and.returnValue({
            laboratoryList: [{ id: 1 }],
          });
          doctor[api].and.returnValue(OK());
          (component as any)[method]();
          expect(doctor[api]).toHaveBeenCalled();
          expect(doctor[api].calls.mostRecent().args[1]).toEqual(
            jasmine.objectContaining({
              beneficiaryRegID: '100',
              benVisitID: '10',
              visitCode: 'VC1',
            }),
          );
          expect(component.testsPrescribed).toEqual({
            laboratoryList: [{ id: 1 }],
          });
          expect(
            component.linkCareContextBasedOnTestsPrescribed,
          ).toHaveBeenCalled();
          expect(
            component.linkCareContextBasedOnSpecialistScheduled,
          ).not.toHaveBeenCalled();
        });

        it('links care context for a specialist', () => {
          spyOn<any>(component, validator).and.returnValue(1);
          component.isSpecialist = true;
          doctor[api].and.returnValue(OK());
          (component as any)[method]();
          expect(
            component.linkCareContextBasedOnSpecialistScheduled,
          ).toHaveBeenCalled();
        });

        it('alerts on non-200', () => {
          spyOn<any>(component, validator).and.returnValue(1);
          doctor[api].and.returnValue(FAIL);
          (component as any)[method]();
          expect(confirmation.alert).toHaveBeenCalledWith('failed', 'error');
          expect(component.disableSubmitButton).toBeFalse();
        });

        it('alerts on API error', () => {
          spyOn<any>(component, validator).and.returnValue(1);
          doctor[api].and.returnValue(throwingObs('x'));
          (component as any)[method]();
          expect(confirmation.alert).toHaveBeenCalledWith('x', 'error');
        });

        it('skips the API when validation fails', () => {
          spyOn<any>(component, validator).and.returnValue(0);
          (component as any)[method]();
          expect(doctor[api]).not.toHaveBeenCalled();
        });
      });
    });

    it('NCD screening diagnosis updates IDRS details and clears flags', () => {
      createWithForm('NCD screening', 'doctor');
      spyOn(component, 'linkCareContextBasedOnTestsPrescribed');
      spyOn(component, 'checkNCDScreeningRequiredData').and.returnValue(true);
      sessionStorage.setItem('instFlag', 'true');
      sessionStorage.setItem('suspectFlag', 'true');
      doctor.postDoctorNCDScreeningDetails.and.returnValue(OK());
      doctor.updateIDRSDetails.and.returnValue(throwingObs('idrs'));
      component.submitNCDScreeningDiagnosisForm();
      expect(doctor.updateIDRSDetails).toHaveBeenCalledWith(
        component.patientMedicalForm.controls['idrsScreeningForm'],
        'NCD screening',
      );
      expect(sessionStorage.getItem('instFlag')).toBeNull();
      expect(sessionStorage.getItem('suspectFlag')).toBeNull();
      expect(
        component.linkCareContextBasedOnTestsPrescribed,
      ).toHaveBeenCalled();
    });

    describe('submitCovidDiagnosisForm', () => {
      beforeEach(() => {
        createWithForm('COVID-19 Screening', 'doctor');
        spyOn(component, 'checkNurseRequirements').and.returnValue(1);
        spyOn(component, 'getHealthIDDetails');
        spyOn(component, 'navigateToDoctorWorklist');
        spyOn(component, 'linkCareContextBasedOnSpecialistScheduled');
      });

      it('specialist links care context', () => {
        component.isSpecialist = true;
        doctor.postDoctorCovidDetails.and.returnValue(OK());
        component.submitCovidDiagnosisForm();
        expect(
          component.linkCareContextBasedOnSpecialistScheduled,
        ).toHaveBeenCalled();
      });

      it('doctor with prescribed tests navigates to worklist', () => {
        doctor.postGeneralCaseRecordInvestigation.and.returnValue({
          laboratoryList: [1],
        });
        doctor.postDoctorCovidDetails.and.returnValue(OK());
        component.submitCovidDiagnosisForm();
        expect(confirmation.alert).toHaveBeenCalledWith(SUCCESS_MSG, 'success');
        expect(component.navigateToDoctorWorklist).toHaveBeenCalled();
      });

      it('doctor with a TM schedule navigates to worklist', () => {
        component.schedulerData = { slot: 1 };
        doctor.postDoctorCovidDetails.and.returnValue(OK());
        component.submitCovidDiagnosisForm();
        expect(component.navigateToDoctorWorklist).toHaveBeenCalled();
      });

      it('doctor without tests offers care-context linking', () => {
        doctor.postDoctorCovidDetails.and.returnValue(OK());
        component.submitCovidDiagnosisForm();
        expect(component.getHealthIDDetails).toHaveBeenCalledWith(SUCCESS_MSG);
      });

      it('handles non-200 and errors', () => {
        doctor.postDoctorCovidDetails.and.returnValue(FAIL);
        component.submitCovidDiagnosisForm();
        expect(confirmation.alert).toHaveBeenCalledWith('failed', 'error');
        doctor.postDoctorCovidDetails.and.returnValue(throwingObs('e'));
        component.submitCovidDiagnosisForm();
        expect(confirmation.alert).toHaveBeenCalledWith('e', 'error');
      });

      it('skips when validation fails', () => {
        (component.checkNurseRequirements as jasmine.Spy).and.returnValue(0);
        component.submitCovidDiagnosisForm();
        expect(doctor.postDoctorCovidDetails).not.toHaveBeenCalled();
      });
    });
  });

  // ---------------------------------------------------------------------------
  describe('updateDoctorDiagnosisForm', () => {
    const branches: any[] = [
      [
        'NCD screening',
        'updateDoctorDiagnosisDetails',
        'checkNCDScreeningRequiredData',
      ],
      [
        'FP & Contraceptive Services',
        'updateFamilyPlanningDoctorDiagnosisDetails',
        'checkNurseRequirements',
      ],
      [
        'Neonatal and Infant Health Care Services',
        'updateNeonatalAndInfantDoctorDiagnosisDetails',
        'checkNurseRequirements',
      ],
      [
        'Childhood & Adolescent Healthcare Services',
        'updateChildAndAdolescentDoctorDiagnosisDetails',
        'checkNurseRequirements',
      ],
      ['General OPD', 'updateDoctorDiagnosisDetails', 'checkNurseRequirements'],
    ];

    branches.forEach(([cat, api, validator]) => {
      describe(cat, () => {
        beforeEach(() => {
          createWithForm(cat, 'doctor');
          session.store.set('visitCategory', cat);
          spyOn(component, 'getHealthIDDetails');
          spyOn(component, 'navigateToSpecialistWorklist');
          spyOn(component, 'navigateToDoctorWorklist');
        });
        const labs = { laboratoryList: [{ id: 1 }] };

        it('specialist with labs goes to specialist worklist', () => {
          spyOn<any>(component, validator).and.returnValue(1);
          component.isSpecialist = true;
          doctor.postGeneralCaseRecordInvestigation.and.returnValue(labs);
          doctor[api].and.returnValue(OK());
          component.updateDoctorDiagnosisForm();
          expect(doctor[api].calls.mostRecent().args[1]).toBe(cat);
          expect(doctor[api].calls.mostRecent().args[2]).toEqual(
            jasmine.objectContaining({
              facilityID: 1,
              parkingPlaceID: 2,
              isSpecialist: true,
            }),
          );
          expect(confirmation.alert).toHaveBeenCalledWith('Saved', 'success');
          expect(component.navigateToSpecialistWorklist).toHaveBeenCalled();
        });

        it('specialist without labs links care context', () => {
          spyOn<any>(component, validator).and.returnValue(1);
          component.isSpecialist = true;
          doctor[api].and.returnValue(OK());
          component.updateDoctorDiagnosisForm();
          expect(component.getHealthIDDetails).toHaveBeenCalledWith('Saved');
        });

        it('doctor with labs goes to doctor worklist', () => {
          spyOn<any>(component, validator).and.returnValue(1);
          doctor.postGeneralCaseRecordInvestigation.and.returnValue(labs);
          doctor[api].and.returnValue(OK());
          component.updateDoctorDiagnosisForm();
          expect(component.navigateToDoctorWorklist).toHaveBeenCalled();
        });

        it('doctor with a schedule goes to doctor worklist', () => {
          spyOn<any>(component, validator).and.returnValue(1);
          component.schedulerData = { tm: 1 };
          doctor[api].and.returnValue(OK());
          component.updateDoctorDiagnosisForm();
          expect(component.navigateToDoctorWorklist).toHaveBeenCalled();
        });

        it('doctor without labs links care context', () => {
          spyOn<any>(component, validator).and.returnValue(1);
          doctor[api].and.returnValue(OK());
          component.updateDoctorDiagnosisForm();
          expect(component.getHealthIDDetails).toHaveBeenCalledWith('Saved');
        });

        it('non-200 and error re-enable submit', () => {
          spyOn<any>(component, validator).and.returnValue(1);
          doctor[api].and.returnValue(FAIL);
          component.updateDoctorDiagnosisForm();
          expect(confirmation.alert).toHaveBeenCalledWith('failed', 'error');
          expect(component.disableSubmitButton).toBeFalse();
          doctor[api].and.returnValue(throwingObs('err'));
          component.updateDoctorDiagnosisForm();
          expect(confirmation.alert).toHaveBeenCalledWith('err', 'error');
        });

        it('does nothing when validation fails', () => {
          spyOn<any>(component, validator).and.returnValue(0);
          component.updateDoctorDiagnosisForm();
          expect(doctor[api]).not.toHaveBeenCalled();
        });
      });
    });

    it('NCD screening update also pushes IDRS details', () => {
      createWithForm('NCD screening', 'doctor');
      session.store.set('visitCategory', 'NCD screening');
      spyOn(component, 'checkNCDScreeningRequiredData').and.returnValue(true);
      spyOn(component, 'getHealthIDDetails');
      doctor.updateDoctorDiagnosisDetails.and.returnValue(OK());
      doctor.updateIDRSDetails.and.returnValue(OK());
      component.updateDoctorDiagnosisForm();
      expect(doctor.updateIDRSDetails).toHaveBeenCalled();
      expect(component.getHealthIDDetails).toHaveBeenCalled();
    });

    it('NCD screening update tolerates IDRS update failure', () => {
      createWithForm('NCD screening', 'doctor');
      session.store.set('visitCategory', 'NCD screening');
      spyOn(component, 'checkNCDScreeningRequiredData').and.returnValue(true);
      spyOn(component, 'getHealthIDDetails');
      doctor.updateDoctorDiagnosisDetails.and.returnValue(OK());
      doctor.updateIDRSDetails.and.returnValue(throwingObs('x'));
      component.updateDoctorDiagnosisForm();
      expect(component.getHealthIDDetails).toHaveBeenCalledWith('Saved');
    });
  });

  afterEach(() => {
    sessionStorage.removeItem('instFlag');
    sessionStorage.removeItem('suspectFlag');
    sessionStorage.removeItem('wa-spec');
  });

  // ---------------------------------------------------------------------------
  describe('checkNurseRequirements', () => {
    const run = (form: FormGroup) => component.checkNurseRequirements(form);
    const notified = (): string[] =>
      confirmation.notify.calls.mostRecent().args[1];

    it('returns 1 when a General OPD nurse form is complete', () => {
      const form = createWithForm('General OPD', 'nurse');
      expect(run(form)).toBe(1);
      expect(confirmation.notify).not.toHaveBeenCalled();
    });

    it('requires FP follow-up method for nurse follow-up visits', () => {
      const form = createWithForm('FP & Contraceptive Services', 'nurse');
      session.store.set('visitReason', 'Follow Up');
      err(form, 'patientVisitForm.patientVisitDetailsForm.followUpForFpMethod');
      expect(run(form)).toBe(0);
      expect(notified()).toContain(L.followUpFpMethod);
      expect(component.disableSubmitButton).toBeFalse();
    });

    it('requires PNC delivery place and type', () => {
      const form = createWithForm('PNC', 'nurse');
      err(form, 'patientPNCForm.deliveryPlace');
      err(form, 'patientPNCForm.deliveryType');
      run(form);
      expect(notified()).toContain(L.pncData.placeofDelivery);
      expect(notified()).toContain(L.pncData.typeofDelivery);
    });

    it('General OPD doctor: provisional diagnosis required and navigates to case record', () => {
      const form = createWithForm('General OPD', 'doctor');
      component.stepper = stepperMock(['Visit Details', 'Case Record']) as any;
      err(
        form,
        'patientCaseRecordForm.generalDiagnosisForm.provisionalDiagnosisList.0.viewProvisionalDiagnosisProvided',
      );
      expect(run(form)).toBe(0);
      expect(notified()).toContain(
        `${L.common.caseRecord}: ${L.DiagnosisDetails.provisionaldiagnosis}`,
      );
      expect(component.stepper.selectedIndex).toBe(1);
    });

    it('General OPD doctor: diagnosis without SNOMED code is flagged', () => {
      const form = createWithForm('General OPD', 'doctor');
      form
        .get(
          'patientCaseRecordForm.generalDiagnosisForm.provisionalDiagnosisList.0',
        )!
        .patchValue({
          viewProvisionalDiagnosisProvided: 'Fever',
          conceptID: '',
        });
      run(form);
      expect(notified()).toContain(
        `${L.common.caseRecord}: ${L.pleaseSelectprovisionalDiagnosisWithSnomedCode}`,
      );
    });

    it('doctor errors outside case record do not move the stepper', () => {
      const form = createWithForm('General OPD', 'doctor');
      component.stepper = stepperMock(['Vitals', 'Case Record']) as any;
      err(form, 'patientVitalsForm.pulseRate');
      run(form);
      expect(component.stepper.selectedIndex).toBe(0);
    });

    it('validates abortion details in past obstetric history for nurses', () => {
      const form = createWithForm('General OPD', 'nurse');
      const list = form.get(
        'patientHistoryForm.pastObstericHistory.pastObstericHistoryList',
      ) as FormArray;
      const g = pregGroup({
        pregOutcome: { pregOutcome: 'Abortion' },
        abortionType: { complicationValue: 'Induced' },
        pregOrder: 2,
      });
      list.push(g);
      list.push(pregGroup({ pregOutcome: { pregOutcome: 'Live Birth' } }));
      [
        'typeofFacility',
        'postAbortionComplication',
        'abortionType',
        'pregDuration',
      ].forEach((n) => g.get(n)!.setErrors({ required: true }));
      run(form);
      const ob = L.historyData.opd_NCD_PNCHistory.obstetric;
      expect(notified()).toEqual(
        jasmine.arrayContaining([
          ob.typeofFacility + '-' + ob.orderofPregnancy + ' 2',
          ob.complicationPostAbortion + '-' + ob.orderofPregnancy + ' 2',
          ob.typeOfAbortion + '-' + ob.orderofPregnancy + ' 2',
          ob.noOfcompletedWeeks + '-' + ob.orderofPregnancy + ' 2',
        ]),
      );
    });

    it('requires sub visit category for General OPD', () => {
      const form = createWithForm('General OPD', 'nurse');
      err(form, 'patientVisitForm.patientVisitDetailsForm.subVisitCategory');
      run(form);
      expect(notified()).toContain(
        L.nurseData.visitDetailsForm.subVisitCategory,
      );
    });

    [
      'General OPD',
      'Neonatal and Infant Health Care Services',
      'Childhood & Adolescent Healthcare Services',
      'PNC',
    ].forEach((cat) => {
      it(`${cat} TC Specialist: provisional diagnosis rules`, () => {
        const form = createWithForm(cat, 'tcspecialist');
        component.designation = 'TC Specialist';
        err(
          form,
          'patientCaseRecordForm.generalDiagnosisForm.provisionalDiagnosisList.0.viewProvisionalDiagnosisProvided',
        );
        run(form);
        expect(notified()).toContain(
          `${L.common.caseRecord}: ${L.DiagnosisDetails.provisionaldiagnosis}`,
        );
      });

      it(`${cat} TC Specialist: SNOMED code missing`, () => {
        const form = createWithForm(cat, 'tcspecialist');
        component.designation = 'TC Specialist';
        form
          .get(
            'patientCaseRecordForm.generalDiagnosisForm.provisionalDiagnosisList.0',
          )!
          .patchValue({
            viewProvisionalDiagnosisProvided: 'X',
            conceptID: null,
          });
        run(form);
        expect(notified()).toContain(
          `${L.common.caseRecord}: ${L.pleaseSelectprovisionalDiagnosisWithSnomedCode}`,
        );
      });
    });

    it('PNC doctor: SNOMED code missing', () => {
      const form = createWithForm('PNC', 'doctor');
      form
        .get(
          'patientCaseRecordForm.generalDiagnosisForm.provisionalDiagnosisList.0',
        )!
        .patchValue({
          viewProvisionalDiagnosisProvided: 'X',
          conceptID: undefined,
        });
      run(form);
      expect(notified()).toContain(
        `${L.common.caseRecord}: ${L.pleaseSelectprovisionalDiagnosisWithSnomedCode}`,
      );
    });

    [
      ['doctor', 'Doctor'],
      ['tcspecialist', 'TC Specialist'],
    ].forEach(([attendant, designation]) => {
      it(`Cancer Screening ${designation}: primary provisional diagnosis`, () => {
        const form = createWithForm('Cancer Screening', attendant);
        component.designation = designation;
        err(
          form,
          'patientCaseRecordForm.diagnosisForm.provisionalDiagnosisPrimaryDoctor',
        );
        run(form);
        expect(notified()).toContain(
          `${L.common.caseRecord}: ${L.DiagnosisDetails.provisionaldiagnosis}`,
        );
      });
    });

    it('COVID-19: doctor diagnosis, contact/travel/symptom and comorbidity', () => {
      const form = createWithForm('COVID-19 Screening', 'doctor');
      err(form, 'patientCaseRecordForm.generalDiagnosisForm.doctorDiagnosis');
      err(form, 'patientVisitForm.patientCovidForm.contactStatus');
      err(form, 'patientVisitForm.patientCovidForm.travelStatus');
      err(form, 'patientVisitForm.patientCovidForm.symptom');
      err(
        form,
        'patientHistoryForm.comorbidityHistory.comorbidityConcurrentConditionsList.0.comorbidConditions',
      );
      run(form);
      expect(notified()).toEqual(
        jasmine.arrayContaining([
          L.doctorDiagnosis,
          L.contactHistory,
          L.covid.travelHistory,
          L.ExaminationData.cancerScreeningExamination.symptoms.symptoms,
          L.historyData.ancHistory.combordityANC_OPD_NCD_PNC.comorbidConditions,
        ]),
      );
    });

    it('ANC nurse: primigravida, LMP and HRP status', () => {
      const form = createWithForm('ANC', 'nurse');
      hrp.checkHrpStatus = true;
      err(form, 'patientANCForm.patientANCDetailsForm.primiGravida');
      err(form, 'patientANCForm.patientANCDetailsForm.lmpDate');
      run(form);
      expect(notified()).toEqual(
        jasmine.arrayContaining([
          L.ancData.ancDataDetails.primiGravida,
          L.ancData.ancDataDetails.lastMenstrualPeriod,
          'Please check HRP status under obstetric examination',
        ]),
      );
    });

    it('ANC doctor: requires haemoglobin test when haemoglobin is present', () => {
      const form = createWithForm('ANC', 'doctor');
      component.rbsPresent = 1;
      component.heamoglobinPresent = 1;
      form
        .get('patientCaseRecordForm.generalDoctorInvestigationForm.labTest')!
        .setValue([
          { procedureName: environment.RBSTest },
          { procedureName: null },
        ]);
      run(form);
      expect(notified()).toContain(
        L.pleaseSelectHeamoglobinTestInInvestigation,
      );
    });

    it('ANC doctor: haemoglobin test prescribed passes', () => {
      const form = createWithForm('ANC', 'doctor');
      component.heamoglobinPresent = 1;
      form
        .get('patientCaseRecordForm.generalDoctorInvestigationForm.labTest')!
        .setValue([{ procedureName: environment.haemoglobinTest }]);
      expect(run(form)).toBe(1);
    });

    it('flags allergies with unmapped SNOMED terms', () => {
      const form = createWithForm('General OPD', 'nurse');
      form
        .get('patientHistoryForm.personalHistory.allergicList')!
        .setValue([
          { allergyType: 'Food', snomedCode: null, snomedTerm: 'Peanut' },
          { allergyType: 'Drug', snomedCode: '1', snomedTerm: null },
          { allergyType: null },
          { allergyType: 'Drug', snomedCode: '1', snomedTerm: 'x' },
        ]);
      run(form);
      expect(notified()).toContain(L.allergyNameIsNotValid);
    });

    it('flags allergy with code but no term', () => {
      const form = createWithForm('General OPD', 'nurse');
      form
        .get('patientHistoryForm.personalHistory.allergicList')!
        .setValue([{ allergyType: 'Drug', snomedCode: '1', snomedTerm: null }]);
      run(form);
      expect(notified()).toContain(L.allergyNameIsNotValid);
    });

    it('validates vitals fields', () => {
      const form = createWithForm('General OPD', 'nurse');
      [
        'systolicBP_1stReading',
        'diastolicBP_1stReading',
        'height_cm',
        'weight_Kg',
        'temperature',
        'pulseRate',
      ].forEach((n) => err(form, 'patientVitalsForm.' + n));
      run(form);
      const v = L.vitalsDetails;
      expect(notified()).toEqual(
        jasmine.arrayContaining([
          v.vitalsDataANC_OPD_NCD_PNC.systolicBP,
          v.vitalsDataANC_OPD_NCD_PNC.diastolicBP,
          v.AnthropometryDataANC_OPD_NCD_PNC.height,
          v.AnthropometryDataANC_OPD_NCD_PNC.weight,
          v.vitalsDataANC_OPD_NCD_PNC.temperature,
          v.vitalsDataANC_OPD_NCD_PNC.pulseRate,
        ]),
      );
    });

    it('doctor: removes clinical observations/findings without SNOMED code', () => {
      const form = createWithForm('General OPD', 'doctor');
      const obs = [
        { clinicalObservationsProvided: 'a', conceptID: null },
        { clinicalObservationsProvided: 'b', conceptID: '1' },
      ];
      const find = [
        { significantFindingsProvided: 'a', conceptID: '' },
        { significantFindingsProvided: 'b', conceptID: '2' },
      ];
      form
        .get(
          'patientCaseRecordForm.generalFindingsForm.clinicalObservationsList',
        )!
        .setValue(obs);
      form
        .get(
          'patientCaseRecordForm.generalFindingsForm.significantFindingsList',
        )!
        .setValue(find);
      run(form);
      expect(
        form.get(
          'patientCaseRecordForm.generalFindingsForm.clinicalObservationsList',
        )!.value,
      ).toEqual([{ clinicalObservationsProvided: 'b', conceptID: '1' }]);
      expect(
        form.get(
          'patientCaseRecordForm.generalFindingsForm.significantFindingsList',
        )!.value,
      ).toEqual([{ significantFindingsProvided: 'b', conceptID: '2' }]);
    });

    describe('doctor referral reasons', () => {
      const setRefer = (form: FormGroup, list: any, inst: any) =>
        form.get('patientReferForm')!.patchValue({
          refrredToAdditionalServiceList: list,
          referredToInstituteName: inst,
        });

      it('service list given requires referral reason', () => {
        const form = createWithForm('General OPD', 'doctor');
        setRefer(form, ['Lab'], null);
        err(form, 'patientReferForm.referralReason');
        run(form);
        expect(notified()).toContain(L.Referdetails.referralReason);
      });

      it('empty service list with institute requires referral reason', () => {
        const form = createWithForm('General OPD', 'doctor');
        setRefer(form, [], 'PHC');
        err(form, 'patientReferForm.referralReason');
        run(form);
        expect(notified()).toContain(L.Referdetails.referralReason);
      });

      it('no service list with institute requires referral reason', () => {
        const form = createWithForm('General OPD', 'doctor');
        setRefer(form, null, 'PHC');
        err(form, 'patientReferForm.referralReason');
        run(form);
        expect(notified()).toContain(L.Referdetails.referralReason);
      });

      it('FP with institute requires referral reason list', () => {
        const form = createWithForm('FP & Contraceptive Services', 'doctor');
        setRefer(form, null, 'PHC');
        err(form, 'patientReferForm.referralReasonList');
        run(form);
        expect(notified()).toContain(L.Referdetails.referralReason);
      });

      it('QC doctor skips SNOMED checks but still validates referral', () => {
        const form = createWithForm('General OPD (QC)', 'doctor');
        spyOn(component, 'checkForSnomedCTCode');
        setRefer(form, ['x'], null);
        err(form, 'patientReferForm.referralReason');
        run(form);
        expect(component.checkForSnomedCTCode).not.toHaveBeenCalled();
        expect(notified()).toContain(L.Referdetails.referralReason);
      });
    });

    it('validates general examination fields', () => {
      const form = createWithForm('General OPD', 'nurse');
      [
        'typeOfDangerSigns',
        'lymphnodesInvolved',
        'typeOfLymphadenopathy',
        'extentOfEdema',
        'edemaType',
      ].forEach((n) =>
        err(form, 'patientExaminationForm.generalExaminationForm.' + n),
      );
      run(form);
      const g = L.ExaminationData.ANC_OPD_PNCExamination.genExamination;
      expect(notified()).toEqual(
        jasmine.arrayContaining([
          g.dangersigns,
          g.lymph,
          g.typeofLymphadenopathy,
          g.extentofEdema,
          g.typeofEdema,
        ]),
      );
    });

    it('nurse in MMU TC without a schedule must schedule TM', () => {
      const form = createWithForm('General OPD', 'nurse');
      s.ismmutc.next('yes');
      run(form);
      expect(notified()).toContain(L.nurseData.scheduleTM);
    });

    it('NCD care doctor: NCD condition required, and Other needs text', () => {
      const form = createWithForm('NCD care', 'doctor');
      form
        .get(
          'patientCaseRecordForm.generalDiagnosisForm.ncdScreeningConditionArray',
        )!
        .setValue(['Other']);
      err(
        form,
        'patientCaseRecordForm.generalDiagnosisForm.ncdScreeningConditionArray',
      );
      run(form);
      expect(notified()).toEqual(
        jasmine.arrayContaining([
          `${L.common.caseRecord}: ${L.casesheet.ncdCondition}`,
          `${L.common.caseRecord}: ${L.nCDConditionOther}`,
        ]),
      );
    });

    it('neonatal nurse form skips vitals/history checks', () => {
      const form = createWithForm(
        'Neonatal and Infant Health Care Services',
        'nurse',
      );
      err(form, 'patientVitalsForm.pulseRate');
      expect(run(form)).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  describe('step navigation and SNOMED helpers', () => {
    beforeEach(() => create());

    it('navigateToCaseRecordStep is a no-op without a stepper', () => {
      component.stepper = undefined as any;
      expect(() => component.navigateToCaseRecordStep()).not.toThrow();
      expect(() => component.navigateToQuickConsultStep()).not.toThrow();
    });

    it('navigateToCaseRecordStep selects the case record step', () => {
      component.stepper = stepperMock(['Vitals', 'Case Record']) as any;
      component.navigateToCaseRecordStep();
      expect(component.stepper.selectedIndex).toBe(1);
    });

    it('navigateToCaseRecordStep leaves index when no match', () => {
      component.stepper = stepperMock(['Vitals', '']) as any;
      (component.stepper as any).steps = {
        toArray: () => [{ label: 'Vitals' }, {}],
      };
      component.navigateToCaseRecordStep();
      expect(component.stepper.selectedIndex).toBe(0);
    });

    it('navigateToQuickConsultStep selects the quick consult step', () => {
      component.stepper = stepperMock(['Vitals', 'Quick Consult']) as any;
      component.navigateToQuickConsultStep();
      expect(component.stepper.selectedIndex).toBe(1);
      component.stepper = stepperMock(['Vitals']) as any;
      (component.stepper as any).steps = { toArray: () => [{}] };
      component.navigateToQuickConsultStep();
      expect(component.stepper.selectedIndex).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  describe('getImageCoordinates', () => {
    it('collects annotated images with facility info', () => {
      const form = createWithForm();
      form
        .get('patientExaminationForm.oralExaminationForm.image')!
        .setValue({ id: 1 });
      form
        .get('patientExaminationForm.gynecologicalExaminationForm.image')!
        .setValue({ id: 3 });
      form
        .get('patientExaminationForm.breastExaminationForm.image')!
        .setValue({ id: 4 });
      form
        .get('patientExaminationForm.abdominalExaminationForm.image')!
        .setValue({ id: 2 });
      const res = component.getImageCoordinates(form);
      expect(res.length).toBe(4);
      expect(res[0]).toEqual({ id: 1, facilityID: 1, parkingPlaceID: 2 });
    });

    it('returns empty when there are no images', () => {
      const form = createWithForm();
      expect(component.getImageCoordinates(form)).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  describe('visualAcuityTestValidation', () => {
    let caseRecord: any;
    beforeEach(() => {
      const form = createWithForm();
      caseRecord = form.get('patientCaseRecordForm');
      component.visualAcuityPresent = 1;
      component.visualAcuityMandatory = 1;
    });

    it('requires visual acuity test when mandatory and missing', () => {
      const req: any[] = [];
      caseRecord
        .get('generalDoctorInvestigationForm.labTest')
        .setValue([{ procedureName: null }, { procedureName: 'X' }]);
      component.visualAcuityTestValidation(caseRecord, req);
      expect(req).toEqual([L.pleaseSelectVisualAcuityTestInInvestigation]);
    });

    it('passes when the test is prescribed', () => {
      const req: any[] = [];
      caseRecord
        .get('generalDoctorInvestigationForm.labTest')
        .setValue([{ procedureName: environment.visualAcuityTest }]);
      component.visualAcuityTestValidation(caseRecord, req);
      expect(req).toEqual([]);
    });

    it('does nothing when not mandatory', () => {
      const req: any[] = [];
      idrs.visualAcuityTestInMMU = 0;
      component.visualAcuityTestValidation(caseRecord, req);
      expect(req).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  describe('checkNCDScreeningRequiredData', () => {
    const notified = (): string[] =>
      confirmation.notify.calls.mostRecent().args[1];
    let form: FormGroup;

    it('returns true when everything is filled (nurse, CBAC path)', () => {
      form = createWithForm('NCD screening', 'nurse');
      spyOn(component, 'validateNCDScreeningFormsOnNurseSave');
      expect(component.checkNCDScreeningRequiredData(form)).toBeTrue();
      expect(
        component.validateNCDScreeningFormsOnNurseSave,
      ).toHaveBeenCalledWith(form, []);
    });

    it('IDRS nurse: RBS, family history, physical activity and required list', () => {
      form = createWithForm('NCD screening', 'nurse');
      component.showIDRSScreen = true;
      component.isCbac = false;
      component.beneficiary = { ageVal: 45 };
      component.diabetesSelected = 1;
      form
        .get('patientVitalsForm')!
        .patchValue({ rbsCheckBox: true, rbsTestResult: null });
      form.get('patientHistoryForm.familyHistory.familyDiseaseList')!.setValue([
        {
          diseaseType: { diseaseType: 'Asthma' },
          deleted: false,
          familyMembers: [],
        },
        { diseaseType: null, deleted: false },
      ]);
      err(form, 'patientHistoryForm.physicalActivityHistory.activityType');
      form
        .get('idrsScreeningForm.requiredList')!
        .setValue(['Diabetes', 'Hypertension']);
      expect(component.checkNCDScreeningRequiredData(form)).toBeFalse();
      expect(notified()).toEqual([
        'Please perform RBS Test under Vitals',
        L.pleaseSelectDiabetesMellitusInFamilyHistory,
        L.physicalActivity,
        L.familyMemberInFamilyHistory,
        'Diabetes',
      ]);
      expect(component.disableSubmitButton).toBeFalse();
    });

    it('IDRS nurse: diabetes in family history with members passes', () => {
      form = createWithForm('NCD screening', 'nurse');
      component.showIDRSScreen = true;
      component.isCbac = false;
      component.beneficiary = { ageVal: 45 };
      form.get('patientHistoryForm.familyHistory.familyDiseaseList')!.setValue([
        {
          diseaseType: { diseaseType: 'Diabetes Mellitus' },
          deleted: false,
          familyMembers: ['Father'],
        },
      ]);
      expect(component.checkNCDScreeningRequiredData(form)).toBeTrue();
    });

    it('IDRS TC specialist: RBS under vitals/investigation and final diagnosis', () => {
      form = createWithForm('NCD screening', 'tcspecialist');
      component.designation = 'TC Specialist';
      component.showIDRSScreen = true;
      component.isCbac = true;
      component.rbsPresent = 1;
      component.diabetesSelected = 1;
      spyOn(component, 'visualAcuityTestValidation');
      form
        .get('patientVitalsForm')!
        .patchValue({ rbsCheckBox: true, rbsTestResult: null });
      form
        .get('patientCaseRecordForm.generalDoctorInvestigationForm.labTest')!
        .setValue([{ procedureName: null }, { procedureName: 'Other' }]);
      component.checkNCDScreeningRequiredData(form);
      expect(notified()).toContain(
        'Please select RBS Test under Vitals or Investigation',
      );
      expect(notified()).toContain(L.pleaseSelectFinalDiagnosis);
      expect(component.visualAcuityTestValidation).toHaveBeenCalled();

      form.get('patientVitalsForm')!.patchValue({ rbsCheckBox: false });
      component.checkNCDScreeningRequiredData(form);
      expect(notified()).toContain(
        'Please select RBS Test under Investigation',
      );
    });

    it('IDRS doctor: RBS prescribed in investigations passes', () => {
      form = createWithForm('NCD screening', 'doctor');
      component.showIDRSScreen = true;
      component.isCbac = true;
      component.rbsPresent = 1;
      component.diabetesSelected = 1;
      form.get('patientVitalsForm')!.patchValue({ rbsCheckBox: true });
      form
        .get('patientCaseRecordForm.generalDoctorInvestigationForm.labTest')!
        .setValue([{ procedureName: environment.RBSTest }]);
      expect(component.checkNCDScreeningRequiredData(form)).toBeTrue();
    });

    it('validates NCD vitals including BP when not CBAC', () => {
      form = createWithForm('NCD screening', 'nurse');
      spyOn(component, 'validateNCDScreeningFormsOnNurseSave');
      component.isCbac = false;
      [
        'height_cm',
        'weight_Kg',
        'waistCircumference_cm',
        'pulseRate',
        'systolicBP_1stReading',
        'diastolicBP_1stReading',
      ].forEach((n) => err(form, 'patientVitalsForm.' + n));
      component.checkNCDScreeningRequiredData(form);
      expect(notified().length).toBe(6);
      component.isCbac = true;
      component.checkNCDScreeningRequiredData(form);
      expect(notified().length).toBe(4);
    });

    it('doctor with CBAC response validates final diagnosis and higher centre referral', () => {
      form = createWithForm('NCD screening', 'doctor');
      spyOn(component, 'validateNCDScreeningFormsOnNurseSave');
      spyOn(component, 'validateFinalDiagnosisOfNCDBasedOnConfirmedDiseases');
      ncd.fetchCBACResponseFromNurse = true;
      sessionStorage.setItem('instFlag', 'true');
      sessionStorage.setItem('suspectFlag', 'true');
      component.checkNCDScreeningRequiredData(form);
      expect(
        component.validateFinalDiagnosisOfNCDBasedOnConfirmedDiseases,
      ).toHaveBeenCalled();
      expect(notified()).toContain(L.Referdetails.higherhealthcarecenter);
    });

    const referCases: any[] = [
      ['NCD screening', ['x'], null, 'referralReasonList'],
      ['General OPD', ['x'], null, 'referralReason'],
      ['NCD screening', [], 'PHC', 'referralReasonList'],
      ['General OPD', [], 'PHC', 'referralReason'],
      ['NCD screening', null, 'PHC', 'referralReasonList'],
      ['General OPD', null, 'PHC', 'referralReason'],
    ];
    referCases.forEach(([cat, list, inst, ctrl]) => {
      it(`doctor referral (${cat}, list=${JSON.stringify(list)}, inst=${inst}) checks ${ctrl}`, () => {
        form = createWithForm(cat, 'doctor');
        spyOn(component, 'validateNCDScreeningFormsOnNurseSave');
        form.get('patientReferForm')!.patchValue({
          refrredToAdditionalServiceList: list,
          referredToInstituteName: inst,
        });
        err(form, 'patientReferForm.' + ctrl);
        expect(component.checkNCDScreeningRequiredData(form)).toBeFalse();
        expect(notified()).toContain(L.Referdetails.referralReason);
      });
    });

    it('nurse in MMU TC must schedule TM', () => {
      form = createWithForm('NCD screening', 'nurse');
      spyOn(component, 'validateNCDScreeningFormsOnNurseSave');
      s.ismmutc.next('yes');
      component.checkNCDScreeningRequiredData(form);
      expect(notified()).toContain(L.nurseData.scheduleTM);
    });
  });

  // ---------------------------------------------------------------------------
  describe('NCD screening form validation', () => {
    let form: FormGroup;
    beforeEach(() => {
      form = createWithForm('NCD screening', 'nurse');
      [
        'diabetesScreeningValidationOnSave',
        'hypertensionScreeningValidationOnSave',
        'oralScreeningValidationOnSave',
        'breastScreeningValidationOnSave',
        'cervicalScreeningValidationOnSave',
      ].forEach((k) => (ncd[k] = true));
      nurse.diseaseFileUpload = true;
    });
    const all = [
      'Please perform diabetes screening',
      'Please perform hypertension screening',
      'Please perform oral cancer screening',
      'Please perform breast cancer screening',
      'Please perform cervical cancer screening',
    ];

    it('on update: flags every incomplete screening and returns false', () => {
      expect(
        component.validateNCDScreeningFormsOnNurseUpdate(form, []),
      ).toBeFalse();
      expect(confirmation.notify).toHaveBeenCalledWith(
        L.alerts.info.belowFields,
        all,
      );
    });

    it('on update: disabled forms pass', () => {
      ['diabetes', 'hypertension', 'oral', 'breast', 'cervical'].forEach((f) =>
        form.get(f + '.formDisable')!.setValue(true),
      );
      expect(
        component.validateNCDScreeningFormsOnNurseUpdate(form, []),
      ).toBeTrue();
    });

    it('on save: pushes messages into the provided list', () => {
      const req: any[] = [];
      component.validateNCDScreeningFormsOnNurseSave(form, req);
      expect(req).toEqual(all);
    });

    it('updateNurseNcdScreeningData sets update mode only when valid', () => {
      component.patientMedicalForm = form;
      component.ncdScreeningMode = 'view';
      component.updateNurseNcdScreeningData();
      expect(String(component.ncdScreeningMode)).toBe('view');
      ['diabetes', 'hypertension', 'oral', 'breast', 'cervical'].forEach((f) =>
        form.get(f + '.formDisable')!.setValue(true),
      );
      component.updateNurseNcdScreeningData();
      expect(String(component.ncdScreeningMode)).toBe('update');
    });
  });

  describe('validateFinalDiagnosisOfNCDBasedOnConfirmedDiseases', () => {
    it('requires final diagnosis for each suspected disease', () => {
      const form = createWithForm('NCD screening', 'doctor');
      session.store.set('beneficiaryGender', 'Female');
      const diag = form.get('patientCaseRecordForm.generalDiagnosisForm');
      const cases: any[] = [
        s.diabetesStatus,
        s.hypertensionStatus,
        s.breastStatus,
        s.cervicalStatus,
        s.oralStatus,
      ];
      cases.forEach((subj) => {
        cases.forEach((x) => x.next(false));
        subj.next(true);
        const req: any[] = [];
        component.validateFinalDiagnosisOfNCDBasedOnConfirmedDiseases(
          diag,
          req,
        );
        expect(req).toEqual([
          'Please perform final diagnosis under case record',
        ]);
      });
      cases.forEach((x) => x.next(false));
      const req: any[] = [];
      component.validateFinalDiagnosisOfNCDBasedOnConfirmedDiseases(diag, req);
      expect(req).toEqual([]);
      expect(component.diabetesSuspected).toBeFalse();
    });
  });

  // ---------------------------------------------------------------------------
  describe('quick consult', () => {
    let form: FormGroup;
    const notified = (): string[] =>
      confirmation.notify.calls.mostRecent().args[1];
    const qcLabel = L.historyData.QuickConsultDetails.quickconsult;

    beforeEach(() => {
      form = createWithForm('General OPD (QC)', 'doctor');
      component.patientReferForm = form.get('patientReferForm') as FormGroup;
    });

    describe('checkQuickConsultDoctorData', () => {
      it('returns 1 when valid', () => {
        expect(component.checkQuickConsultDoctorData(form)).toBe(1);
      });

      it('flags chief complaints, observation and diagnosis and moves to QC step', () => {
        component.stepper = stepperMock(['Quick Consult']) as any;
        (component.stepper as any).selectedIndex = 5;
        err(form, 'patientQuickConsultForm.chiefComplaintList');
        err(form, 'patientQuickConsultForm.clinicalObservation');
        err(
          form,
          'patientQuickConsultForm.provisionalDiagnosisList.0.viewProvisionalDiagnosisProvided',
        );
        (
          form.get(
            'patientQuickConsultForm.provisionalDiagnosisList',
          ) as FormArray
        ).setErrors({
          required: true,
        });
        expect(component.checkQuickConsultDoctorData(form)).toBe(0);
        expect(notified()).toEqual(
          jasmine.arrayContaining([
            L.nurseData.chiefComplaintsDetails.chiefComplaints,
            `${qcLabel}: ${L.casesheet.clinicalObs}`,
            `${qcLabel}: ${L.DiagnosisDetails.provisionaldiagnosis}`,
          ]),
        );
        expect(component.stepper.selectedIndex).toBe(0);
      });

      it('flags diagnosis without SNOMED code for doctor', () => {
        form
          .get('patientQuickConsultForm.provisionalDiagnosisList.0')!
          .patchValue({
            viewProvisionalDiagnosisProvided: 'Fever',
            conceptID: null,
          });
        component.checkQuickConsultDoctorData(form);
        expect(notified()).toContain(
          `${qcLabel}: ${L.pleaseSelectprovisionalDiagnosisWithSnomedCode}`,
        );
      });

      it('TC specialist: diagnosis, SNOMED and instruction', () => {
        component.attendant = 'tcspecialist';
        component.designation = 'TC Specialist';
        err(form, 'patientQuickConsultForm.instruction');
        err(
          form,
          'patientQuickConsultForm.provisionalDiagnosisList.0.viewProvisionalDiagnosisProvided',
        );
        component.checkQuickConsultDoctorData(form);
        expect(notified()).toContain(L.casesheet.sprcAdvice);
        expect(notified()).toContain(
          `${qcLabel}: ${L.DiagnosisDetails.provisionaldiagnosis}`,
        );

        const f2 = createWithForm('General OPD (QC)', 'tcspecialist');
        component.designation = 'TC Specialist';
        f2.get(
          'patientQuickConsultForm.provisionalDiagnosisList.0',
        )!.patchValue({
          viewProvisionalDiagnosisProvided: 'X',
          conceptID: '',
        });
        component.checkQuickConsultDoctorData(f2);
        expect(notified()).toContain(
          `${qcLabel}: ${L.pleaseSelectprovisionalDiagnosisWithSnomedCode}`,
        );
      });

      const referCases: any[] = [
        ['General OPD (QC)', ['x'], null, 'referralReason'],
        ['General OPD (QC)', [], 'PHC', 'referralReason'],
        ['General OPD (QC)', null, 'PHC', 'referralReason'],
        ['FP & Contraceptive Services', null, 'PHC', 'referralReasonList'],
      ];
      referCases.forEach(([cat, list, inst, ctrl]) => {
        it(`referral (${cat}, ${JSON.stringify(list)}, ${inst}) requires ${ctrl}`, () => {
          component.visitCategory = cat;
          form.get('patientReferForm')!.patchValue({
            refrredToAdditionalServiceList: list,
            referredToInstituteName: inst,
          });
          err(form, 'patientReferForm.' + ctrl);
          expect(component.checkQuickConsultDoctorData(form)).toBe(0);
          expect(notified()).toContain(L.Referdetails.referralReason);
        });
      });
    });

    const fillQC = (test: any, radiology: any) =>
      form.get('patientQuickConsultForm')!.patchValue({
        chiefComplaintList: [
          { chiefComplaint: { chiefComplaintID: 1, chiefComplaint: 'Fever' } },
          { chiefComplaint: null },
        ],
        prescription: {
          prescribedDrugs: [
            { createdBy: 'doc', drug: 'A' },
            { createdBy: null },
          ],
        },
        test,
        radiology,
      });

    describe('submitQuickConsultDiagnosisForm', () => {
      beforeEach(() => {
        spyOn(component, 'getHealthIDDetails');
        spyOn(component, 'navigateToDoctorWorklist');
        spyOn(component, 'navigateToSpecialistWorklist');
      });
      const payload = () =>
        doctor.postQuickConsultDetails.calls.mostRecent().args[0]
          .quickConsultation;

      it('maps complaints, drugs and lab orders (test + radiology)', () => {
        fillQC([{ id: 't' }], [{ id: 'r' }]);
        doctor.postQuickConsultDetails.and.returnValue(OK());
        component.submitQuickConsultDiagnosisForm();
        const p = payload();
        expect(p.chiefComplaintList[0]).toEqual(
          jasmine.objectContaining({
            chiefComplaintID: 1,
            chiefComplaint: 'Fever',
          }),
        );
        expect(p.prescription).toEqual([{ createdBy: 'doc', drug: 'A' }]);
        expect(p.labTestOrders).toEqual([{ id: 't' }, { id: 'r' }]);
        expect(p.refer).toEqual({ refer: true });
        expect(confirmation.alert).toHaveBeenCalledWith(SUCCESS_MSG, 'success');
        expect(component.navigateToDoctorWorklist).toHaveBeenCalled();
      });

      it('test only; specialist with labs goes to specialist worklist', () => {
        component.isSpecialist = true;
        fillQC([{ id: 't' }], null);
        doctor.postQuickConsultDetails.and.returnValue(OK());
        component.submitQuickConsultDiagnosisForm();
        expect(payload().labTestOrders).toEqual([{ id: 't' }]);
        expect(component.navigateToSpecialistWorklist).toHaveBeenCalled();
      });

      it('radiology only (empty); specialist without labs links care context', () => {
        component.isSpecialist = true;
        fillQC(null, []);
        doctor.postQuickConsultDetails.and.returnValue(OK());
        component.submitQuickConsultDiagnosisForm();
        expect(payload().labTestOrders).toEqual([]);
        expect(component.getHealthIDDetails).toHaveBeenCalledWith(SUCCESS_MSG);
      });

      it('doctor with schedule goes to worklist; without links care context', () => {
        fillQC(null, []);
        doctor.postQuickConsultDetails.and.returnValue(OK());
        component.submitQuickConsultDiagnosisForm();
        expect(component.getHealthIDDetails).toHaveBeenCalled();
        expect(
          form.get('patientQuickConsultForm.chiefComplaintList')!.value,
        ).toBeNull();
        fillQC(null, []);
        component.schedulerData = { tm: 1 };
        component.submitQuickConsultDiagnosisForm();
        expect(component.navigateToDoctorWorklist).toHaveBeenCalled();
      });

      it('non-200, error and invalid form', () => {
        fillQC(null, []);
        doctor.postQuickConsultDetails.and.returnValue(FAIL);
        component.submitQuickConsultDiagnosisForm();
        expect(confirmation.alert).toHaveBeenCalledWith('failed', 'error');
        expect(component.disableSubmitButton).toBeFalse();
        doctor.postQuickConsultDetails.and.returnValue(throwingObs('e'));
        component.submitQuickConsultDiagnosisForm();
        expect(confirmation.alert).toHaveBeenCalledWith('e', 'error');
        doctor.postQuickConsultDetails.calls.reset();
        spyOn(component, 'checkQuickConsultDoctorData').and.returnValue(0);
        component.submitQuickConsultDiagnosisForm();
        expect(doctor.postQuickConsultDetails).not.toHaveBeenCalled();
      });
    });

    describe('updateQuickConsultDiagnosisForm', () => {
      beforeEach(() => {
        spyOn(component, 'getHealthIDDetails');
        spyOn(component, 'navigateToDoctorWorklist');
        spyOn(component, 'navigateToSpecialistWorklist');
      });
      const payload = () =>
        doctor.updateQuickConsultDetails.calls.mostRecent().args[0]
          .quickConsultation;

      it('mapDoctorQuickConsultDetails drops disabled tests', () => {
        fillQC([{ id: 't' }, { id: 'd', disabled: true }], [{ id: 'r' }]);
        const p = component.mapDoctorQuickConsultDetails();
        expect(p.labTestOrders).toEqual([{ id: 't' }, { id: 'r' }]);
        expect(p.prescribedDrugs).toEqual([{ createdBy: 'doc', drug: 'A' }]);
        expect(doctor.postGeneralRefer).toHaveBeenCalledWith(
          form.get('patientReferForm'),
          jasmine.objectContaining({ facilityID: 1, parkingPlaceID: 2 }),
        );
      });

      it('specialist with lab orders goes to specialist worklist', () => {
        component.isSpecialist = true;
        fillQC([{ id: 't' }], null);
        doctor.updateQuickConsultDetails.and.returnValue(OK());
        component.updateQuickConsultDiagnosisForm();
        expect(payload().labTestOrders).toEqual([{ id: 't' }]);
        expect(confirmation.alert).toHaveBeenCalledWith('Saved', 'success');
        expect(component.navigateToSpecialistWorklist).toHaveBeenCalled();
      });

      it('specialist without lab orders links care context', () => {
        component.isSpecialist = true;
        fillQC(null, []);
        doctor.updateQuickConsultDetails.and.returnValue(OK());
        component.updateQuickConsultDiagnosisForm();
        expect(component.getHealthIDDetails).toHaveBeenCalledWith('Saved');
      });

      it('doctor branches: tests prescribed, schedule, none', () => {
        fillQC(null, []);
        doctor.updateQuickConsultDetails.and.returnValue(OK());
        component.testsPrescribed = { laboratoryList: [1] };
        component.updateQuickConsultDiagnosisForm();
        expect(component.navigateToDoctorWorklist).toHaveBeenCalledTimes(1);
        component.testsPrescribed = null;
        component.schedulerData = { x: 1 };
        component.updateQuickConsultDiagnosisForm();
        expect(component.navigateToDoctorWorklist).toHaveBeenCalledTimes(2);
        component.schedulerData = null;
        component.updateQuickConsultDiagnosisForm();
        expect(component.getHealthIDDetails).toHaveBeenCalledWith('Saved');
      });

      it('non-200, error and invalid', () => {
        fillQC(null, []);
        doctor.updateQuickConsultDetails.and.returnValue(FAIL);
        component.updateQuickConsultDiagnosisForm();
        expect(confirmation.alert).toHaveBeenCalledWith('failed', 'error');
        doctor.updateQuickConsultDetails.and.returnValue(throwingObs('e'));
        component.updateQuickConsultDiagnosisForm();
        expect(confirmation.alert).toHaveBeenCalledWith('e', 'error');
        doctor.updateQuickConsultDetails.calls.reset();
        spyOn(component, 'checkQuickConsultDoctorData').and.returnValue(0);
        component.updateQuickConsultDiagnosisForm();
        expect(doctor.updateQuickConsultDetails).not.toHaveBeenCalled();
      });
    });
  });

  // ---------------------------------------------------------------------------
  describe('worklist navigation and care context', () => {
    beforeEach(() => create({}, 'doctor'));

    it('navigateToDoctorWorklist resets state and routes', () => {
      component.testsPrescribed = { laboratoryList: [] };
      component.navigateToDoctorWorklist();
      expect(component.testsPrescribed).toBeNull();
      expect(session.removeItem).toHaveBeenCalledWith('visitCategory');
      expect(session.removeItem).toHaveBeenCalledWith('pharmacist_flag');
      expect(router.navigate).toHaveBeenCalledWith([
        '/nurse-doctor/doctor-worklist',
      ]);
    });

    it('navigateToSpecialistWorklist routes to TC worklist', () => {
      component.navigateToSpecialistWorklist();
      expect(router.navigate).toHaveBeenCalledWith([
        '/nurse-doctor/tcspecialist-worklist',
      ]);
    });

    it('basedOnRoleNavigateToWorklist picks by role', () => {
      spyOn(component, 'navigateToSpecialistWorklist');
      spyOn(component, 'navigateToDoctorWorklist');
      component.isSpecialist = true;
      component.basedOnRoleNavigateToWorklist();
      expect(component.navigateToSpecialistWorklist).toHaveBeenCalled();
      component.isSpecialist = false;
      component.basedOnRoleNavigateToWorklist();
      expect(component.navigateToDoctorWorklist).toHaveBeenCalled();
    });

    describe('linkCareContextBasedOnSpecialistScheduled', () => {
      beforeEach(() => {
        spyOn(component, 'navigateToSpecialistWorklist');
        spyOn(component, 'getHealthIDDetails');
      });
      it('with labs alerts and navigates', () => {
        component.testsPrescribed = { laboratoryList: [1] };
        component.linkCareContextBasedOnSpecialistScheduled();
        expect(confirmation.alert).toHaveBeenCalledWith(SUCCESS_MSG, 'success');
        expect(component.navigateToSpecialistWorklist).toHaveBeenCalled();
      });
      it('without labs offers linking', () => {
        component.testsPrescribed = null;
        component.linkCareContextBasedOnSpecialistScheduled();
        expect(component.getHealthIDDetails).toHaveBeenCalledWith(SUCCESS_MSG);
      });
    });

    describe('linkCareContextBasedOnTestsPrescribed', () => {
      beforeEach(() => {
        spyOn(component, 'navigateToDoctorWorklist');
        spyOn(component, 'getHealthIDDetails');
      });
      it('with labs navigates to doctor worklist', () => {
        component.testsPrescribed = { laboratoryList: [1] };
        component.linkCareContextBasedOnTestsPrescribed();
        expect(component.navigateToDoctorWorklist).toHaveBeenCalled();
      });
      it('with schedule navigates to doctor worklist', () => {
        component.testsPrescribed = { laboratoryList: [] };
        component.schedulerData = { tm: 1 };
        component.linkCareContextBasedOnTestsPrescribed();
        expect(component.navigateToDoctorWorklist).toHaveBeenCalled();
      });
      it('otherwise offers linking', () => {
        component.testsPrescribed = { laboratoryList: [] };
        component.linkCareContextBasedOnTestsPrescribed();
        expect(component.getHealthIDDetails).toHaveBeenCalledWith(SUCCESS_MSG);
      });
      it('throws when testsPrescribed is null (logs before null check)', () => {
        component.testsPrescribed = null;
        expect(() =>
          component.linkCareContextBasedOnTestsPrescribed(),
        ).toThrowError(TypeError);
      });
    });

    describe('getHealthIDDetails', () => {
      beforeEach(() => {
        spyOn(component, 'getMappedAbdmFacility');
        spyOn(component, 'fetchHealthIDDetailsOnConfirmation');
        spyOn(component, 'basedOnRoleNavigateToWorklist');
      });
      it('confirmed -> fetch health IDs', () => {
        component.getHealthIDDetails('Saved');
        expect(component.getMappedAbdmFacility).toHaveBeenCalled();
        expect(confirmation.confirmCareContext).toHaveBeenCalledWith(
          'info',
          'Saved. ' + L.common.doYouWantToLinkCareContext,
        );
        expect(component.fetchHealthIDDetailsOnConfirmation).toHaveBeenCalled();
      });
      it('declined -> go to worklist', () => {
        confirmation.confirmCareContext.and.returnValue(of(false));
        component.getHealthIDDetails(null);
        expect(
          confirmation.confirmCareContext.calls.mostRecent().args[1],
        ).toContain(SUCCESS_MSG);
        expect(component.basedOnRoleNavigateToWorklist).toHaveBeenCalled();
      });
    });

    describe('getMappedAbdmFacility', () => {
      beforeEach(() => spyOn(component, 'saveAbdmFacilityForVisit'));
      const login = (roles: any) =>
        session.store.set(
          'loginDataResponse',
          JSON.stringify({ previlegeObj: [{ roles }] }),
        );

      it('without login data clears facility', () => {
        component.getMappedAbdmFacility();
        expect(component.abdmFacilityId).toBeNull();
        expect(session.setItem).toHaveBeenCalledWith('abdmFacilityId', null);
        expect(registrar.getMappedFacility).not.toHaveBeenCalled();
        expect(component.saveAbdmFacilityForVisit).toHaveBeenCalled();
      });

      it('uses the doctor role location and stores the facility', () => {
        login([
          { RoleName: 'Nurse', workingLocationID: 4 },
          { RoleName: 'Doctor', workingLocationID: 9 },
        ]);
        registrar.getMappedFacility.and.returnValue(
          OK({ abdmFacilityID: 'F1', abdmFacilityName: 'PHC' }),
        );
        component.getMappedAbdmFacility();
        expect(registrar.getMappedFacility).toHaveBeenCalledWith(9);
        expect(component.abdmFacilityId).toBe('F1');
        expect(session.setItem).toHaveBeenCalledWith('abdmFacilityName', 'PHC');
      });

      it('falls back to first role with a location; missing ids clear facility', () => {
        login([{ RoleName: 'Nurse', workingLocationID: 4 }]);
        registrar.getMappedFacility.and.returnValue(OK({}));
        component.abdmFacilityId = 'old';
        component.getMappedAbdmFacility();
        expect(registrar.getMappedFacility).toHaveBeenCalledWith(4);
        expect(component.abdmFacilityId).toBeNull();
      });

      it('non-200 shows info and clears facility', () => {
        login([{ RoleName: 'Doctor', workingLocationID: 9 }]);
        registrar.getMappedFacility.and.returnValue(FAIL);
        component.getMappedAbdmFacility();
        expect(confirmation.confirm).toHaveBeenCalledWith('failed', 'info');
        expect(component.abdmFacilityName).toBeNull();
      });

      it('error alerts and still saves', () => {
        login([{ RoleName: 'Doctor', workingLocationID: 9 }]);
        registrar.getMappedFacility.and.returnValue(
          throwingObs({ errorMessage: 'bad' }),
        );
        component.getMappedAbdmFacility();
        expect(confirmation.alert).toHaveBeenCalledWith('bad', 'error');
        expect(component.saveAbdmFacilityForVisit).toHaveBeenCalled();
      });
    });

    describe('saveAbdmFacilityForVisit', () => {
      it('posts visit code and facility', () => {
        component.abdmFacilityId = 'F1';
        component.saveAbdmFacilityForVisit();
        expect(registrar.saveAbdmFacilityForVisit).toHaveBeenCalledWith({
          visitCode: 'VC1',
          abdmFacilityId: 'F1',
        });
        expect(confirmation.alert).not.toHaveBeenCalled();
      });
      it('alerts on non-200 and error', () => {
        registrar.saveAbdmFacilityForVisit.and.returnValue(FAIL);
        component.saveAbdmFacilityForVisit();
        expect(confirmation.alert).toHaveBeenCalledWith('failed', 'error');
        registrar.saveAbdmFacilityForVisit.and.returnValue(
          throwingObs({ errorMessage: 'x' }),
        );
        component.saveAbdmFacilityForVisit();
        expect(confirmation.alert).toHaveBeenCalledWith('x', 'error');
      });
    });

    describe('fetchHealthIDDetailsOnConfirmation', () => {
      it('opens the health ID dialog then routes by role', () => {
        spyOn(component, 'basedOnRoleNavigateToWorklist');
        registrar.getHealthIdDetails.and.returnValue(
          of({ statusCode: 200, data: {} }),
        );
        component.fetchHealthIDDetailsOnConfirmation();
        expect(registrar.getHealthIdDetails).toHaveBeenCalledWith({
          beneficiaryID: 'B1',
          beneficiaryRegID: '100',
        });
        expect(dialog.open).toHaveBeenCalled();
        expect(dialog.open.calls.mostRecent().args[1].data.visitCode).toBe(
          'VC1',
        );
        expect(component.basedOnRoleNavigateToWorklist).toHaveBeenCalled();
      });
      it('non-200 or error alerts and routes to nurse worklist', () => {
        registrar.getHealthIdDetails.and.returnValue(FAIL);
        component.fetchHealthIDDetailsOnConfirmation();
        expect(confirmation.alert).toHaveBeenCalledWith(
          L.issueInGettingBeneficiaryABHADetails,
          'error',
        );
        expect(router.navigate).toHaveBeenCalledWith([
          '/nurse-doctor/nurse-worklist',
        ]);
        registrar.getHealthIdDetails.and.returnValue(throwingObs());
        component.fetchHealthIDDetailsOnConfirmation();
        expect(router.navigate).toHaveBeenCalledTimes(2);
      });
    });
  });

  // ---------------------------------------------------------------------------
  describe('section update modes', () => {
    beforeEach(() => create());

    it('sets update modes', () => {
      component.updatePatientVitals();
      component.updatePatientExamination();
      component.updatePatientANC();
      component.updatePatientPNC();
      component.updateFamilyPlanningData();
      component.updateBirthImmunizationHistoryForm();
      component.updateImmunizationServiceForm();
      [
        component.vitalsMode,
        component.examinationMode,
        component.ancMode,
        component.pncMode,
        component.familyPlanningMode,
        component.immunizationHistoryMode,
        component.immunizationServiceMode,
      ].forEach((m) => expect(String(m)).toBe('update'));
    });

    it('idrsChange stores the value', () => {
      component.idrsChange(false);
      expect(component.enableIDRSUpdate).toBeFalse();
    });

    it('updatePatientHistory uses NCD history check for NCD screening', () => {
      component.visitCategory = 'NCD screening';
      spyOn(component, 'checkNCDScreeningHistory').and.returnValues(0, 1);
      component.historyMode = 'view';
      component.updatePatientHistory();
      expect(String(component.historyMode)).toBe('view');
      component.updatePatientHistory();
      expect(String(component.historyMode)).toBe('update');
    });

    it('updatePatientHistory uses past obstetric check otherwise', () => {
      spyOn(component, 'checkPastObstericHistory').and.returnValues(0, 1);
      component.historyMode = 'view';
      component.updatePatientHistory();
      expect(String(component.historyMode)).toBe('view');
      component.updatePatientHistory();
      expect(String(component.historyMode)).toBe('update');
    });

    it('updatePatientNcdScreening notifies required IDRS items', () => {
      component.patientMedicalForm = buildForm();
      component.patientMedicalForm
        .get('idrsScreeningForm.requiredList')!
        .setValue(['Hypertension', 'Diabetes']);
      component.updatePatientNcdScreening();
      expect(confirmation.notify).toHaveBeenCalledWith(
        L.alerts.info.mandatoryFields,
        ['Diabetes'],
      );
      component.patientMedicalForm
        .get('idrsScreeningForm.requiredList')!
        .setValue(null);
      component.updatePatientNcdScreening();
      expect(String(component.ncdScreeningMode)).toBe('update');
    });
  });

  describe('checkPastObstericHistory', () => {
    it('flags abortion details and unmapped allergy', () => {
      const form = createWithForm();
      const list = form.get(
        'patientHistoryForm.pastObstericHistory.pastObstericHistoryList',
      ) as FormArray;
      const g = pregGroup({
        pregOutcome: { pregOutcome: 'Abortion' },
        abortionType: { complicationValue: 'Induced' },
        pregOrder: 1,
      });
      list.push(g);
      list.push(pregGroup({}));
      [
        'typeofFacility',
        'postAbortionComplication',
        'abortionType',
        'pregDuration',
      ].forEach((n) => g.get(n)!.setErrors({ required: true }));
      form
        .get('patientHistoryForm.personalHistory.allergicList')!
        .setValue([
          { allergyType: 'x', snomedCode: null, snomedTerm: 't' },
          { allergyType: 'x', snomedCode: 'c', snomedTerm: null },
          { allergyType: null },
        ]);
      expect(component.checkPastObstericHistory(form)).toBe(0);
      expect(confirmation.notify.calls.mostRecent().args[1].length).toBe(5);
    });

    it('returns 1 when history is valid', () => {
      const form = createWithForm();
      expect(component.checkPastObstericHistory(form)).toBe(1);
    });
  });

  describe('checkNCDScreeningHistory', () => {
    it('requires diabetes and family members when IDRS is shown', () => {
      const form = createWithForm('NCD screening');
      component.showIDRSScreen = true;
      component.beneficiaryAge = 40;
      form.get('patientHistoryForm.familyHistory.familyDiseaseList')!.setValue([
        {
          diseaseType: { diseaseType: 'Asthma' },
          deleted: false,
          familyMembers: null,
        },
        { diseaseType: null, deleted: true },
      ]);
      expect(component.checkNCDScreeningHistory(form)).toBe(0);
      expect(confirmation.notify).toHaveBeenCalledWith(
        L.alerts.info.mandatoryFields,
        [
          L.pleaseSelectDiabetesMellitusInFamilyHistory,
          L.familyMemberInFamilyHistory,
        ],
      );
    });

    it('passes for young beneficiaries with complete family history', () => {
      const form = createWithForm('NCD screening');
      component.showIDRSScreen = true;
      component.beneficiaryAge = 20;
      form.get('patientHistoryForm.familyHistory.familyDiseaseList')!.setValue([
        {
          diseaseType: { diseaseType: 'Diabetes Mellitus' },
          deleted: false,
          familyMembers: ['Mother'],
        },
      ]);
      expect(component.checkNCDScreeningHistory(form)).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  describe('checkCbac / checkMandatory', () => {
    it('alerts and steps back when CBAC part is incomplete', () => {
      const form = createWithForm('NCD screening', 'nurse');
      component.isCbac = true;
      component.stepper = stepperMock([]) as any;
      confirmation.alert.and.returnValue(createDialogRefMock());
      form.get('patientVisitForm.cbacScreeningForm')!.markAsDirty();
      component.checkCbac();
      expect(confirmation.alert).toHaveBeenCalledWith(L.pleaseCompletePartCbac);
      expect((component.stepper as any).previous).toHaveBeenCalled();
    });

    it('does not alert when CBAC is complete', () => {
      const form = createWithForm('NCD screening', 'nurse');
      component.isCbac = true;
      const cbac = form.get('patientVisitForm.cbacScreeningForm')!;
      cbac.patchValue({
        cbacAge: 1,
        cbacConsumeGutka: 1,
        cbacAlcohol: 1,
        cbacWaistMale: 1,
        cbacPhysicalActivity: 1,
        cbacFamilyHistoryBpdiabetes: 1,
      });
      cbac.markAsDirty();
      component.checkCbac();
      expect(confirmation.alert).not.toHaveBeenCalled();
    });

    it('checkMandatory alerts on missing category and pending files', () => {
      create();
      component.visitCategory = null;
      nurse.fileData = [{ f: 1 }];
      component.checkMandatory();
      expect(confirmation.alert).toHaveBeenCalledWith(
        L.alerts.info.proceedFurther,
      );
      expect(confirmation.alert).toHaveBeenCalledWith(
        L.common.Kindlyuploadthefiles,
      );
      expect(nurse.fileData).toBeNull();
    });

    it('checkMandatory is silent when all is fine', () => {
      create();
      component.checkMandatory();
      expect(confirmation.alert).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  describe('checkGravidaValue / updatePending', () => {
    let form: FormGroup;
    const ev = (label: string) => ({ previouslySelectedStep: { label } });
    const dontForget = (label: string) =>
      L.alerts.info.dontForget + ' ' + label + ' ' + L.alerts.info.changes;

    beforeEach(() => {
      form = createWithForm('General OPD');
      component.newLookupMode = false;
    });

    it('checkGravidaValue alerts for multigravida with gravida <= 1', () => {
      form.get('patientANCForm')!.patchValue({
        patientANCDetailsForm: { primiGravida: false },
        obstetricFormulaForm: { gravida_G: 1 },
      });
      component.checkGravidaValue(ev('ANC'));
      expect(confirmation.alert).toHaveBeenCalledTimes(1);
      confirmation.alert.calls.reset();
      form.get('patientANCForm.obstetricFormulaForm.gravida_G')!.setValue(3);
      component.checkGravidaValue(ev('ANC'));
      component.checkGravidaValue(ev('Vitals'));
      expect(confirmation.alert).not.toHaveBeenCalled();
    });

    const dirtyCases: any[] = [
      ['ANC', 'patientANCForm', () => L.ancData.anc],
      ['History', 'patientHistoryForm', () => L.common.history],
      [
        'Vitals',
        'patientVitalsForm',
        () => L.vitalsDetails.vitalsDataANC_OPD_NCD_PNC.vitals,
      ],
      [
        'Examination',
        'patientExaminationForm',
        () => L.ExaminationData.examination,
      ],
      [
        'Immunization Services',
        'patientImmunizationServicesForm.oralVitaminAForm',
        () => 'Immunization Services',
      ],
    ];
    dirtyCases.forEach(([label, path, text]) => {
      it(`reminds about unsaved ${label} changes`, () => {
        form.get(path)!.markAsDirty();
        component.updatePending(ev(label));
        expect(confirmation.alert).toHaveBeenCalledWith(dontForget(text()));
      });
      it(`no reminder when ${label} is pristine`, () => {
        component.updatePending(ev(label));
        expect(confirmation.alert).not.toHaveBeenCalled();
      });
    });

    it('reminds for vitals when vitals update button is enabled', () => {
      component.enableUpdateButtonInVitals = true;
      component.updatePending(ev('Vitals'));
      expect(confirmation.alert).toHaveBeenCalled();
    });

    it('IDRS reminder when IDRS changed or screening enabled', () => {
      component.enableIDRSUpdate = false;
      component.updatePending(ev('IDRS'));
      expect(confirmation.alert).toHaveBeenCalledWith(dontForget('Screening'));
      confirmation.alert.calls.reset();
      component.enableIDRSUpdate = true;
      component.disableScreeningUpdateButton = false;
      component.updatePending(ev('IDRS'));
      expect(confirmation.alert).toHaveBeenCalled();
      confirmation.alert.calls.reset();
      component.disableScreeningUpdateButton = true;
      component.updatePending(ev('IDRS'));
      expect(confirmation.alert).not.toHaveBeenCalled();
    });

    it('Family Planning reminder only when dirty and update enabled', () => {
      form.get('familyPlanningForm.dispensationDetailsForm')!.markAsDirty();
      component.updatePending(ev('Family Planning'));
      expect(confirmation.alert).not.toHaveBeenCalled();
      component.disableFamilyPlanningUpdateButton = false;
      component.updatePending(ev('Family Planning'));
      expect(confirmation.alert).toHaveBeenCalledWith(
        dontForget('Family Planning'),
      );
    });

    it('Birth & Immunization History reminder', () => {
      form
        .get('patientBirthImmunizationHistoryForm.infantBirthDetailsForm')!
        .markAsDirty();
      component.disablebImmunizationHistoryUpdateButton = false;
      component.updatePending(ev('Birth & Immunization History'));
      expect(confirmation.alert).toHaveBeenCalledWith(
        dontForget('Birth & Immunization History'),
      );
    });

    [false, true].forEach((lookup) => {
      describe(`Visit Details (newLookupMode=${lookup})`, () => {
        beforeEach(() => {
          component.newLookupMode = lookup;
          spyOn(component, 'checkCbac');
        });

        it('asks for temperature and reminds about covid vaccination', () => {
          component.ncdTemperature = true;
          doctor.covidVaccineAgeGroup = '>=12 years';
          doctor.enableCovidVaccinationButton = true;
          component.updatePending(ev('Visit Details'));
          expect(confirmation.alert).toHaveBeenCalledWith(
            L.recordTemperatureUnderVitals,
          );
          expect(confirmation.alert).toHaveBeenCalledWith(
            dontForget(L.covidVaccinationStatus),
          );
          expect(component.checkCbac).toHaveBeenCalled();
        });

        it('no alerts when temperature recorded and vaccination untouched', () => {
          component.ncdTemperature = true;
          form.get('patientVitalsForm.temperature')!.setValue(98);
          doctor.covidVaccineAgeGroup = '>=12 years';
          component.updatePending(ev('Visit Details'));
          expect(confirmation.alert).not.toHaveBeenCalled();
        });
      });
    });

    it('new lookup: ANC checks gravida, other steps do nothing', () => {
      component.newLookupMode = true;
      spyOn(component, 'checkGravidaValue');
      component.updatePending(ev('ANC'));
      expect(component.checkGravidaValue).toHaveBeenCalled();
      component.updatePending(ev('Other'));
      expect(confirmation.alert).not.toHaveBeenCalled();
    });

    it('default step does nothing', () => {
      component.updatePending(ev('Case Record'));
      expect(confirmation.alert).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  describe('misc UI helpers', () => {
    beforeEach(() => create());

    it('sideNavModeChange picks mode by width', () => {
      const nav = { mode: '', toggle: jasmine.createSpy('toggle') };
      const w = spyOnProperty(window.screen, 'width', 'get').and.returnValue(
        500,
      );
      component.sideNavModeChange(nav);
      expect(nav.mode).toBe('over');
      w.and.returnValue(1500);
      component.sideNavModeChange(nav);
      expect(nav.mode).toBe('side');
      expect(nav.toggle).toHaveBeenCalledTimes(2);
    });

    it('canDeactivate confirms when the form is dirty', () => {
      sessionStorage.setItem('wa-spec', '1');
      component.patientMedicalForm.markAsDirty();
      let result: any;
      component.canDeactivate().subscribe((r) => (result = r));
      expect(confirmation.confirm).toHaveBeenCalledWith(
        'info',
        L.alerts.info.navigateFurtherAlert,
        'Yes',
        'No',
      );
      expect(result).toBeTrue();
    });

    it('canDeactivate confirms when vitals update is pending', () => {
      component.enableUpdateButtonInVitals = true;
      component.canDeactivate().subscribe();
      expect(confirmation.confirm).toHaveBeenCalled();
    });

    it('canDeactivate allows navigation when pristine', () => {
      let result: any;
      component.canDeactivate().subscribe((r) => (result = r));
      expect(result).toBeTrue();
      expect(confirmation.confirm).not.toHaveBeenCalled();
    });

    it('preventSubmitOnEnter prevents default', () => {
      const e = { preventDefault: jasmine.createSpy('pd') } as any;
      component.preventSubmitOnEnter(e);
      expect(e.preventDefault).toHaveBeenCalled();
    });

    it('ngAfterViewChecked runs change detection', () => {
      expect(() => component.ngAfterViewChecked()).not.toThrow();
      expect(component.current_language_set).toEqual(L);
    });

    describe('openScheduler', () => {
      it('stores a chosen TM slot', () => {
        dialog.open.and.returnValue(createDialogRefMock({ tmSlot: { id: 1 } }));
        component.openScheduler();
        expect(component.schedulerData).toEqual({ id: 1 });
        expect(component.schedulerButton).toBe('View HWC Schedule');
      });
      it('clears the schedule', () => {
        component.schedulerData = { id: 1 };
        dialog.open.and.returnValue(createDialogRefMock({ clear: true }));
        component.openScheduler();
        expect(component.schedulerData).toBeNull();
        expect(component.schedulerFormData).toBeNull();
        expect(component.schedulerButton).toBe(L.common.scheduleforTM + ' HWC');
      });
      it('ignores empty results', () => {
        component.schedulerData = { id: 1 };
        dialog.open.and.returnValue(createDialogRefMock({ other: 1 }));
        component.openScheduler();
        dialog.open.and.returnValue(createDialogRefMock(undefined));
        component.openScheduler();
        expect(component.schedulerData).toEqual({ id: 1 });
      });
    });

    it('startTC alerts on non-200 and error (success redirect not exercised)', () => {
      doctor.invokeSwymedCallSpecialist.and.returnValue(FAIL);
      component.startTC();
      expect(confirmation.alert).toHaveBeenCalledWith('failed', 'error');
      doctor.invokeSwymedCallSpecialist.and.returnValue(throwingObs('tc'));
      component.startTC();
      expect(confirmation.alert).toHaveBeenCalledWith('tc', 'error');
    });

    it('updateTCStartTime posts ids', () => {
      component.updateTCStartTime();
      expect(doctor.updateTCStartTime).toHaveBeenCalledWith({
        benRegID: '100',
        visitCode: 'VC1',
      });
    });

    it('provideLogin opens the snackbar on yes, then starts TC', () => {
      spyOn(component, 'startTC');
      component.provideLogin();
      expect(snack.openFromComponent).toHaveBeenCalled();
      expect(component.startTC).toHaveBeenCalled();
    });

    it('provideLogin alerts on no', () => {
      confirmation.confirm.and.returnValue(of(false));
      component.provideLogin();
      expect(confirmation.alert).toHaveBeenCalledWith(
        L.loginManuallyThroughSwyMed,
      );
    });

    describe('getMMUInvestigationDetails', () => {
      it('skips when referred visit is undefined', () => {
        session.store.set('referredVisitCode', 'undefined');
        session.store.set('referredVisitID', 'undefined');
        component.getMMUInvestigationDetails();
        expect(doctor.getMMUData).not.toHaveBeenCalled();
      });
      it('sets diabetesSelected when MMU labs exist', () => {
        session.store.set('referredVisitCode', 'R1');
        session.store.set('referredVisitID', 'R2');
        doctor.getMMUData.and.returnValue(
          OK({ data: { laboratoryList: [{ procedureName: 'RBS Test' }] } }),
        );
        component.diabetesSelected = 0;
        component.getMMUInvestigationDetails();
        expect(doctor.getMMUData).toHaveBeenCalledWith({
          benRegID: '100',
          visitCode: 'R1',
          benVisitID: 'R2',
          fetchMMUDataFor: 'Investigation',
        });
        expect(component.diabetesSelected).toBe(1);
      });
      it('leaves diabetesSelected when no MMU labs', () => {
        doctor.getMMUData.and.returnValue(OK({ data: { laboratoryList: [] } }));
        component.diabetesSelected = 0;
        component.getMMUInvestigationDetails();
        expect(component.diabetesSelected).toBe(0);
      });
      it('alerts on non-200 and error', () => {
        doctor.getMMUData.and.returnValue(FAIL);
        component.getMMUInvestigationDetails();
        doctor.getMMUData.and.returnValue(throwingObs());
        component.getMMUInvestigationDetails();
        expect(confirmation.alert).toHaveBeenCalledTimes(2);
        expect(confirmation.alert).toHaveBeenCalledWith(
          L.errorInFetchingMMUInvestigationDetails,
          'error',
        );
      });
    });

    it('openBenPreviousisitDetails opens the dialog', () => {
      component.openBenPreviousisitDetails();
      expect(dialog.open.calls.mostRecent().args[1]).toEqual(
        jasmine.objectContaining({ data: { previous: true }, width: '100%' }),
      );
    });

    it('checkNurseFlag maps flags', () => {
      component.eSanjeevaniFlagArry = 'ESanjeevani';
      component.checkNurseFlag();
      expect(component.showESanjeevaniBtn).toBe(1);
      component.eSanjeevaniFlagArry = 'Swymed';
      component.checkNurseFlag();
      expect(component.showESanjeevaniBtn).toBe(2);
      component.eSanjeevaniFlagArry = null;
      component.checkNurseFlag();
      expect(component.showESanjeevaniBtn).toBe(0);
    });

    describe('openEsanjeevaniPortal', () => {
      let openSpy: jasmine.Spy;
      beforeEach(() => (openSpy = spyOn(window, 'open')));

      it('opens the portal URL', () => {
        component.healthDetailsArr = [{ healthIdNumber: 'H1' }];
        nurse.getESanjeevaniDetails.and.returnValue(
          OK({ response: 'http://e' }),
        );
        component.openEsanjeevaniPortal();
        expect(nurse.getESanjeevaniDetails).toHaveBeenCalledWith('100');
        expect(openSpy).toHaveBeenCalledWith('http://e', '_blank');
      });
      it('alerts on non-200', () => {
        component.healthDetailsArr = [{ healthIdNumber: 'H1' }];
        nurse.getESanjeevaniDetails.and.returnValue(FAIL);
        component.openEsanjeevaniPortal();
        expect(confirmation.alert).toHaveBeenCalledWith('failed', 'error');
        expect(openSpy).not.toHaveBeenCalled();
      });
      it('alerts when there is no health ID', () => {
        component.healthDetailsArr = [{ healthIdNumber: null }];
        component.openEsanjeevaniPortal();
        component.healthDetailsArr = [];
        component.openEsanjeevaniPortal();
        expect(confirmation.alert).toHaveBeenCalledTimes(2);
        expect(confirmation.alert).toHaveBeenCalledWith(
          L.noHealthIDForBeneficiary,
          'error',
        );
      });
    });
  });

  // ---------------------------------------------------------------------------
  describe('ngOnDestroy', () => {
    it('unsubscribes and resets services', () => {
      create({ visitCategory: 'NCD screening' });
      component.diabetesScreeningStatus();
      component.hypertensionScreeningStatus();
      component.oralScreeningStatus();
      component.breastScreeningStatus();
      component.cervicalScreeningStatus();
      component.diabetesSuspected = true;
      const subs = [
        component.rbsPresentSubscription,
        component.enablingHistorySectionSubscription,
        component.enableupdateButtonSubcriptionForScreening,
        component.diabetesScreeningStatusSubscription,
        component.visitDetailMasterDataSubscription,
      ];
      component.ngOnDestroy();
      subs.forEach((sub) => expect(sub.closed).toBeTrue());
      expect(component.diabetesSuspected).toBeFalse();
      expect(doctor.clearCache).toHaveBeenCalled();
      expect(masterdata.reset).toHaveBeenCalled();
    });

    it('tolerates missing subscriptions', () => {
      create();
      component.visitDetailMasterDataSubscription = null;
      component.beneficiaryDetailsSubscription = null;
      (component as any).rbsPresentSubscription = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
      expect(doctor.clearCache).toHaveBeenCalled();
    });
  });
});
