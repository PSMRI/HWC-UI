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
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import {
  HttpClientTestingModule,
  HttpTestingController,
  TestRequest,
} from '@angular/common/http/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';

import { DoctorService } from './doctor.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { createSessionStorageMock } from 'src/testing/test-utils';
import { environment } from 'src/environments/environment';

const env: any = environment;

const NEONATAL = 'Neonatal and Infant Health Care Services';
const CHILDHOOD = 'Childhood & Adolescent Healthcare Services';

const SESSION = {
  serviceLineDetails: JSON.stringify({
    facilityID: 11,
    parkingPlaceID: 22,
    vanID: 33,
  }),
  providerServiceID: '4',
  serviceID: '5',
  userID: '6',
  beneficiaryRegID: '7',
  visitID: '8',
  visitCode: '9',
  userName: 'docUser',
  username: 'docLower',
  benFlowID: '10',
  beneficiaryID: '12',
  doctorFlag: '2',
  nurseFlag: '9',
  pharmacist_flag: '1',
  sessionID: 'sess-1',
  visitCategory: 'ANC',
  referredVisitCode: 'ref-vc',
};

/** Builds a FormGroup whose controls are plain FormControls holding the given values. */
function ctrlGroup(values: Record<string, any>): FormGroup {
  const controls: Record<string, FormControl> = {};
  Object.keys(values).forEach(
    (k) => (controls[k] = new FormControl(values[k])),
  );
  return new FormGroup(controls);
}

/** Minimal "form-like" object for methods that only read `.value`. */
function valueOf(value: any) {
  return { value };
}

function buildMedicalForm(diagnosis: Record<string, any> = {}): FormGroup {
  return new FormGroup({
    patientVisitForm: new FormGroup({
      patientVisitDetailsForm: ctrlGroup({ subVisitCategory: 'subCat' }),
    }),
    patientCaseRecordForm: new FormGroup({
      generalFindingsForm: ctrlGroup({
        complaints: [
          {
            chiefComplaint: { chiefComplaintID: 1, chiefComplaint: 'Fever' },
            duration: 3,
          },
          { chiefComplaint: null, duration: 2 },
        ],
        clinicalObservation: 'obs',
      }),
      generalDoctorInvestigationForm: ctrlGroup({
        labTest: [{ procedureID: 1 }, { procedureID: 2, disabled: true }],
        radiologyTest: [{ procedureID: 3 }],
        externalInvestigations: 'ext',
      }),
      drugPrescriptionForm: ctrlGroup({
        prescribedDrugs: [{ drugID: 1, createdBy: 'docUser' }, { drugID: 2 }],
      }),
      generalDiagnosisForm: ctrlGroup(
        Object.keys(diagnosis).length
          ? diagnosis
          : { provisionalDiagnosisList: [{ term: 'x' }], dateOfDeath: null },
      ),
      treatmentsOnSideEffectsForm: ctrlGroup({
        treatmentsOnSideEffects: ['tx1'],
      }),
    }),
    provideCounselling: ctrlGroup({ counsellingProvidedList: ['c1'] }),
    patientReferForm: ctrlGroup({
      referredToInstituteName: { institutionID: 5, institutionName: 'PHC' },
      refrredToAdditionalServiceList: [
        { serviceID: 1 },
        { serviceID: 2, disabled: true },
      ],
      referralReason: 'reason',
      revisitDate: '2024-02-01',
      otherReferredToInstituteName: 'otherInst',
      referralReasonList: ['r1'],
      otherReferralReason: 'otherReason',
    }),
    patientFollowUpImmunizationForm: ctrlGroup({
      dueDateForNextImmunization: '2024-03-01',
      location: 'loc',
    }),
  });
}

function buildGeneralHistoryForm(): FormGroup {
  return new FormGroup({
    pastHistory: ctrlGroup({
      pastIllness: [
        { illnessType: { illnessType: 'TB', illnessID: 3 }, timePeriodAgo: 2 },
      ],
      pastSurgery: [{ surgeryType: null }],
    }),
    comorbidityHistory: ctrlGroup({
      comorbidityConcurrentConditionsList: [
        {
          comorbidConditions: {
            comorbidCondition: 'DM',
            comorbidConditionID: 1,
          },
        },
      ],
    }),
    medicationHistory: ctrlGroup({ medicationHistoryList: [] }),
    pastObstericHistory: ctrlGroup({ pastObstericHistoryList: [] }),
    menstrualHistory: ctrlGroup({ menstrualCycleStatus: null, lMPDate: null }),
    familyHistory: ctrlGroup({ familyDiseaseList: [] }),
    personalHistory: ctrlGroup({ tobaccoList: null }),
    otherVaccines: ctrlGroup({ otherVaccines: [] }),
    immunizationHistory: ctrlGroup({ immunizationList: [{ a: 1 }] }),
    developmentHistory: ctrlGroup({ grossMotorMilestones: ['m'] }),
    feedingHistory: ctrlGroup({ foodIntoleranceStatus: '0' }),
    perinatalHistory: ctrlGroup({ placeOfDelivery: null }),
  });
}

function isoAdjusted(date: string) {
  const d = new Date(date);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
}

describe('DoctorService', () => {
  let service: DoctorService;
  let httpMock: HttpTestingController;
  let session: ReturnType<typeof createSessionStorageMock>;

  function expectReq(method: string, url: string): TestRequest {
    return httpMock.expectOne(
      (r) => r.method === method && r.urlWithParams === url,
    );
  }

  /** Subscribes, flushes a response, checks passthrough and returns the request body. */
  function flushed(obs: Observable<any>, method: string, url: string): any {
    let result: any;
    obs.subscribe((r) => (result = r));
    const req = expectReq(method, url);
    const response = { statusCode: 200, data: { ok: true } };
    req.flush(response);
    expect(result).toEqual(response);
    return req.request.body;
  }

  function expectEmpty(obs: Observable<any>) {
    let emitted = false;
    let completed = false;
    obs.subscribe({
      next: () => (emitted = true),
      complete: () => (completed = true),
    });
    expect(emitted).toBeFalse();
    expect(completed).toBeTrue();
    httpMock.expectNone(() => true);
  }

  function setCategory(cat: string | null) {
    if (cat === null) session.store.delete('visitCategory');
    else session.store.set('visitCategory', cat);
  }

  beforeEach(() => {
    spyOn(console, 'log');
    session = createSessionStorageMock({ ...SESSION });
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        DoctorService,
        { provide: SessionStorageService, useValue: session },
      ],
    });
    service = TestBed.inject(DoctorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('construction & defaults', () => {
    it('reads sessionID from session storage', () => {
      expect(service).toBeTruthy();
      expect(service.sessionID).toBe('sess-1');
      expect(service.enableDispenseFlag).toBeFalse();
      expect(service.caseRecordAndReferDetails1).toBeNull();
    });

    it('stores null sessionID when session storage has an empty string', () => {
      session.store.set('sessionID', '');
      const s = new DoctorService(TestBed.inject(HttpClient), session as any);
      expect(s.sessionID).toBeNull();
    });
  });

  describe('state subjects', () => {
    it('setInfantDataFetch / setFamilyDataFetch emit the new flags', () => {
      const infant: any[] = [];
      const family: any[] = [];
      service.fetchInfantDataCheck$.subscribe((v) => infant.push(v));
      service.fetchFamilyDataCheck$.subscribe((v) => family.push(v));
      service.setInfantDataFetch(true);
      service.setFamilyDataFetch(true);
      expect(infant).toEqual([false, true]);
      expect(family).toEqual([false, true]);
    });

    it('history, case record and confirmed disease setters push to their observables', () => {
      let history: any;
      let caseRecord: any;
      let diseases: any;
      service.populateHistoryResponse$.subscribe((v) => (history = v));
      service.populateCaserecordResponse$.subscribe((v) => (caseRecord = v));
      service.previousVisitConfirmedDiseases$.subscribe((v) => (diseases = v));
      service.setCapturedHistoryByNurse({ h: 1 });
      service.setCapturedCaserecordDeatilsByDoctor({ c: 2 });
      service.setPreviousVisitConfirmedDiseases(['TB']);
      expect(history).toEqual({ h: 1 });
      expect(caseRecord).toEqual({ c: 2 });
      expect(diseases).toEqual(['TB']);
    });

    it('infant & immunization history can be set and cleared', () => {
      let val: any;
      service.infantAndImmunizationData$.subscribe((v) => (val = v));
      service.getPreviousInfantAndImmunizationHistoryDetails({ x: 1 });
      expect(val).toEqual({ x: 1 });
      service.clearPreviousInfantAndImmunizationHistoryDetails();
      expect(val).toBeNull();
    });

    it('getBenFamilyDetailsRevisit pushes family planning data', () => {
      let val: any;
      service.benFamilyPlanningDetails$.subscribe((v) => (val = v));
      service.getBenFamilyDetailsRevisit({ fp: true });
      expect(val).toEqual({ fp: true });
    });

    it('reset clears nurse screening data', () => {
      let val: any = 'initial';
      service.screeninDataFromNurse.next({ s: 1 });
      service.screeningData$.subscribe((v) => (val = v));
      expect(val).toEqual({ s: 1 });
      service.reset();
      expect(val).toBeNull();
    });

    it('enableHrpReasonsStatus / clearHrpReasonsStatus toggle HRP status', () => {
      let val: any;
      service.enableHRPStatusAndReasons$.subscribe((v) => (val = v));
      service.enableHRPReasons = true;
      service.enableHrpReasonsStatus(true);
      expect(val).toBeTrue();
      service.clearHrpReasonsStatus();
      expect(val).toBeFalse();
      expect(service.enableHRPReasons).toBeFalse();
    });

    it('familyPlanningValueChanged / BirthAndImmunizationValueChanged emit flags', () => {
      let fp: any;
      let bi: any;
      service.valueChangeForFamilyPlanning$.subscribe((v) => (fp = v));
      service.valueChangedForBirthAndImmunizationCheck$.subscribe(
        (v) => (bi = v),
      );
      service.familyPlanningValueChanged(true);
      service.BirthAndImmunizationValueChanged(true);
      expect(fp).toBeTrue();
      expect(bi).toBeTrue();
    });

    it('immunizationServiceChildhoodValueChanged emits on the birth & immunization subject', () => {
      let bi: any;
      let childhood: any;
      service.valueChangedForBirthAndImmunizationCheck$.subscribe(
        (v) => (bi = v),
      );
      service.valueChangedForImmunizationServiceChildhoodCheck$.subscribe(
        (v) => (childhood = v),
      );
      service.immunizationServiceChildhoodValueChanged(true);
      expect(bi).toBeTrue();
      // current behaviour: the childhood-specific subject is not updated
      expect(childhood).toBeFalse();
    });

    it('setValueToEnableVitalsUpdateButton emits on enableVitalsUpdateButton$', () => {
      let val: any = 'x';
      service.enableVitalsUpdateButton$.subscribe((v) => (val = v));
      expect(val).toBeNull();
      service.setValueToEnableVitalsUpdateButton(true);
      expect(val).toBeTrue();
    });

    it('getHistoricalTrends and setCommonDataForFP are no-ops returning undefined', () => {
      expect(service.getHistoricalTrends()).toBeUndefined();
      expect(service.setCommonDataForFP()).toBeUndefined();
      expect(session.getItem).toHaveBeenCalledWith('serviceLineDetails');
    });

    it('clearCache resets all cached observables', () => {
      service.generalHistory = 'a';
      service.getVisitComplaint = 'b';
      service.caseRecordAndReferDetails = 'c';
      service.caseRecordAndReferDetails1 = 'd';
      service.clearCache();
      expect(service.generalHistory).toBeNull();
      expect(service.getVisitComplaint).toBeNull();
      expect(service.caseRecordAndReferDetails).toBeNull();
      expect(service.caseRecordAndReferDetails1).toBeNull();
    });
  });

  describe('simple GET endpoints', () => {
    const suffix = '4/5/11';
    const cases: [
      string,
      (s: DoctorService) => Observable<any>,
      () => string,
    ][] = [
      [
        'getDoctorWorklist',
        (s) => s.getDoctorWorklist(),
        () => env.doctorWorkList + suffix,
      ],
      [
        'getDoctorFutureWorklist',
        (s) => s.getDoctorFutureWorklist(),
        () => env.doctorFutureWorkList + suffix,
      ],
      [
        'getRadiologistWorklist',
        (s) => s.getRadiologistWorklist(),
        () => env.radiologistWorklist + suffix,
      ],
      [
        'getOncologistWorklist',
        (s) => s.getOncologistWorklist(),
        () => env.oncologistWorklist + suffix,
      ],
      [
        'getSpecialistWorklist',
        (s) => s.getSpecialistWorklist(),
        () => env.specialistWorkListURL + '4/5/6',
      ],
      [
        'getSpecialistFutureWorklist',
        (s) => s.getSpecialistFutureWorklist(),
        () => env.specialistFutureWorkListURL + '4/5/6',
      ],
      [
        'getSwymedMail',
        (s) => s.getSwymedMail(),
        () => env.getSwymedMailUrl + '/33',
      ],
      [
        'invokeSwymedCall',
        (s) => s.invokeSwymedCall(99),
        () => env.invokeSwymedCallUrl + '6/99',
      ],
      [
        'invokeSwymedCallSpecialist',
        (s) => s.invokeSwymedCallSpecialist(),
        () => env.invokeSwymedCallSpecialistUrl + '6/33',
      ],
      ['getUserId', (s) => s.getUserId('bob'), () => env.getUserId + 'bob'],
      [
        'getAssessment',
        (s) => s.getAssessment(7),
        () => env.getAssessmentIdUrl + '/7',
      ],
      [
        'getAssessmentDet',
        (s) => s.getAssessmentDet('a1'),
        () => env.getAssessmentUrl + '/a1',
      ],
      [
        'checkUsersignatureExist',
        (s) => s.checkUsersignatureExist(6),
        () => env.checkUsersignExistUrl + '6',
      ],
    ];
    cases.forEach(([name, call, url]) => {
      it(`${name} issues GET ${name}`, () => {
        flushed(call(service), 'GET', url());
      });
    });

    it('downloadSign requests a blob', () => {
      service.downloadSign(6).subscribe();
      const req = expectReq('GET', env.downloadSignUrl + '6');
      expect(req.request.responseType).toBe('blob');
      req.flush(new Blob(['x']));
    });

    it('propagates HTTP errors to the subscriber', () => {
      let err: any;
      service.getDoctorWorklist().subscribe({ error: (e) => (err = e) });
      expectReq('GET', env.doctorWorkList + suffix).flush('boom', {
        status: 500,
        statusText: 'Server Error',
      });
      expect(err.status).toBe(500);
    });
  });

  describe('simple POST endpoints', () => {
    const cases: [
      string,
      (s: DoctorService) => Observable<any>,
      () => string,
      any,
    ][] = [
      [
        'getServiceOnState',
        (s) => s.getServiceOnState(),
        () => env.getServiceOnStateUrl,
        {},
      ],
      [
        'updateBeneficiaryArrivalStatus',
        (s) => s.updateBeneficiaryArrivalStatus({ a: 1 }),
        () => env.updateBeneficiaryArrivalStatusUrl,
        { a: 1 },
      ],
      [
        'cancelBeneficiaryTCRequest',
        (s) => s.cancelBeneficiaryTCRequest({ t: 1 }),
        () => env.cancelBeneficiaryTCRequestUrl,
        { t: 1 },
      ],
      [
        'confirmStatus',
        (s) => s.confirmStatus(8),
        () => env.updateVisitStatus,
        { benVisitID: 8 },
      ],
      [
        'getMMUHistory',
        (s) => s.getMMUHistory(),
        () => env.previousMMUHistoryUrl,
        { beneficiaryRegID: '7' },
      ],
      [
        'getTMHistory',
        (s) => s.getTMHistory(),
        () => env.previousTMHistoryUrl,
        { beneficiaryRegID: '7' },
      ],
      [
        'getMCTSHistory',
        (s) => s.getMCTSHistory(),
        () => env.previousMCTSHistoryUrl,
        { beneficiaryRegID: '7' },
      ],
      [
        'get104History',
        (s) => s.get104History(),
        () => env.previous104HistoryUrl,
        { beneficiaryRegID: '7' },
      ],
      [
        'getNcdScreeningDetails',
        (s) => s.getNcdScreeningDetails('b', 'v'),
        () => env.getNCDScreeningDetails,
        { benRegID: 'b', benVisitID: 'v', visitCode: '9' },
      ],
      [
        'getNcdScreeningForCbac',
        (s) => s.getNcdScreeningForCbac(),
        () => env.getNcdScreeningDetailsForCbac,
        { beneficiaryRegId: '7', visitCode: '9' },
      ],
      [
        'getAncCareDetails',
        (s) => s.getAncCareDetails('b', 'v'),
        () => env.getANCDetailsUrl,
        { benRegID: 'b', benVisitID: 'v', visitCode: '9' },
      ],
      [
        'getAncCareDetailsRevisit',
        (s) => s.getAncCareDetailsRevisit('b'),
        () => env.getANCDetailsUrl,
        { benRegID: 'b' },
      ],
      [
        'getPreviousVisitAnthropometry',
        (s) => s.getPreviousVisitAnthropometry({ r: 1 }),
        () => env.getPreviousAnthropometryUrl,
        { r: 1 },
      ],
      [
        'deleteMedicine',
        (s) => s.deleteMedicine(3),
        () => env.drugDeleteUrl,
        { id: 3 },
      ],
      [
        'postOncologistRemarksforCancerCaseSheet',
        (s) => s.postOncologistRemarksforCancerCaseSheet('rem', 'v', 'r'),
        () => env.updateOncologistRemarksCancelUrl,
        {
          beneficiaryRegID: 'r',
          benVisitID: 'v',
          modifiedBy: 'docUser',
          providerServiceMapID: '4',
          visitCode: '9',
          provisionalDiagnosisOncologist: 'rem',
        },
      ],
      [
        'getPNCDetails',
        (s) => s.getPNCDetails('b', 'v'),
        () => env.getPNCDetailsUrl,
        { benRegID: 'b', benVisitID: 'v', visitCode: '9' },
      ],
      [
        'getPreviousPNCDetails',
        (s) => s.getPreviousPNCDetails('b'),
        () => env.getPNCDetailsUrl,
        { benRegID: 'b' },
      ],
      [
        'getCovidDetails',
        (s) => s.getCovidDetails('b', 'v'),
        () => env.getPNCDetailsUrl,
        { benRegID: 'b', benVisitID: 'v', visitCode: '9' },
      ],
      [
        'getPreviousSignificiantFindings',
        (s) => s.getPreviousSignificiantFindings({ r: 1 }),
        () => env.getPreviousSignificiantFindingUrl,
        { r: 1 },
      ],
      [
        'getMMUCasesheetData',
        (s) => s.getMMUCasesheetData({ c: 1 }),
        () => env.getMMUCasesheetDataUrl,
        { c: 1 },
      ],
      [
        'getTMCasesheetData',
        (s) => s.getTMCasesheetData({ c: 2 }),
        () => env.getTMCasesheetDataUrl,
        { c: 2 },
      ],
      [
        'getArchivedReports',
        (s) => s.getArchivedReports({ a: 1 }),
        () => env.archivedReportsUrl,
        { a: 1 },
      ],
      [
        'getReportsBase64',
        (s) => s.getReportsBase64({ f: 1 }),
        () => env.ReportsBase64Url,
        { f: 1 },
      ],
      [
        'getPatientMCTSCallHistory',
        (s) => s.getPatientMCTSCallHistory({ id: 1 }),
        () => env.patientMCTSCallHistoryUrl,
        { id: 1 },
      ],
      [
        'getMasterSpecialization',
        (s) => s.getMasterSpecialization(),
        () => env.getMasterSpecializationUrl,
        {},
      ],
      [
        'getSpecialist',
        (s) => s.getSpecialist({ sp: 1 }),
        () => env.getSpecialistUrl,
        { sp: 1 },
      ],
      [
        'getAvailableSlot',
        (s) => s.getAvailableSlot({ sl: 1 }),
        () => env.getAvailableSlotUrl,
        { sl: 1 },
      ],
      [
        'scheduleTC',
        (s) => s.scheduleTC({ sc: 1 }),
        () => env.scheduleTCUrl,
        { sc: 1 },
      ],
      [
        'beneficiaryTCRequestStatus',
        (s) => s.beneficiaryTCRequestStatus({ st: 1 }),
        () => env.beneficiaryTCRequestStatusUrl,
        { st: 1 },
      ],
      [
        'updateTCStartTime',
        (s) => s.updateTCStartTime({ t: 1 }),
        () => env.updateTCStartTimeUrl,
        { t: 1 },
      ],
      [
        'getMMUData',
        (s) => s.getMMUData({ m: 1 }),
        () => env.loadMMUDataUrl,
        { m: 1 },
      ],
      [
        'getHRPDetails',
        (s) => s.getHRPDetails('r', 'vc'),
        () => env.loadHRPUrl,
        { benRegID: 'r', visitCode: 'vc' },
      ],
      [
        'getFamilyPlanningFetchDetails',
        (s) => s.getFamilyPlanningFetchDetails(),
        () => env.getFamilyPlanningDetailsUrl,
        { benRegID: '7', benVisitId: '8', visitCode: '9' },
      ],
      [
        'getFamilyPlanningFetchDetailsOnRevisit',
        (s) => s.getFamilyPlanningFetchDetailsOnRevisit(),
        () => env.getFamilyPlanningDetailsUrl,
        { benRegID: '7' },
      ],
      [
        'getBirthImmunizationHistoryNurseDetails',
        (s) => s.getBirthImmunizationHistoryNurseDetails(),
        () => env.getBirthImmunizationHistoryDetailsUrl,
        { benRegID: '7', benVisitId: '8', visitCode: '9' },
      ],
      [
        'getBirthImmunizationHistoryNurseDetailsForChildAndAdolescent',
        (s) => s.getBirthImmunizationHistoryNurseDetailsForChildAndAdolescent(),
        () => env.getBirthImmunizationHistoryDataUrl,
        { benRegID: '7', benVisitId: '8', visitCode: '9' },
      ],
      [
        'fetchImmunizationServiceDeatilsFromNurse',
        (s) => s.fetchImmunizationServiceDeatilsFromNurse(),
        () => env.fetchNeonatalImmunizationService,
        { benRegID: '7', benVisitId: '8', visitCode: '9' },
      ],
      [
        'fetchOralVitaminADeatilsFromNurse',
        (s) => s.fetchOralVitaminADeatilsFromNurse(),
        () => env.fetchChildAndAdolescentService,
        { benRegID: '7', benVisitId: '8', visitCode: '9' },
      ],
    ];
    cases.forEach(([name, call, url, body]) => {
      it(`${name} POSTs the expected body`, () => {
        expect(flushed(call(service), 'POST', url())).toEqual(body);
      });
    });

    it('getHRPDetails caches the observable on HRPDetails', () => {
      const obs = service.getHRPDetails('r', 'vc');
      expect(service.HRPDetails).toBe(obs);
    });
  });

  describe('quick consult', () => {
    const data = { quickConsultation: { chiefComplaint: 'cough' } };

    it('postQuickConsultDetails merges consultation data with session details', () => {
      const body = flushed(
        service.postQuickConsultDetails(data, 'tc', true, 'sig'),
        'POST',
        env.saveDoctorGeneralQuickConsult,
      );
      expect(body.quickConsultation).toEqual(
        jasmine.objectContaining({
          chiefComplaint: 'cough',
          beneficiaryRegID: '7',
          benVisitID: '8',
          providerServiceMapID: '4',
          serviceID: '5',
          createdBy: 'docUser',
          facilityID: 11,
          parkingPlaceID: 22,
          sessionID: 'sess-1',
          tcRequest: 'tc',
          isSpecialist: true,
          doctorSignatureFlag: 'sig',
        }),
      );
    });

    it('updateQuickConsultDetails posts to the update URL without signature flag', () => {
      const body = flushed(
        service.updateQuickConsultDetails(data, 'tc', false),
        'POST',
        env.updateGeneralOPDQuickConsultDoctorDetails,
      );
      expect(body.quickConsultation.chiefComplaint).toBe('cough');
      expect(body.quickConsultation.isSpecialist).toBeFalse();
      expect(body.quickConsultation.doctorSignatureFlag).toBeUndefined();
      expect(body.quickConsultation.visitCode).toBe('9');
    });
  });

  describe('NCD screening update', () => {
    it('maps nested master objects and lab orders', () => {
      const body = flushed(
        service.updateNCDScreeningDetails(
          {
            reasonForScreening: {
              ncdScreeningReasonID: 1,
              ncdScreeningReason: 'Routine',
            },
            diabeticStatus: {
              bpAndDiabeticStatusID: 2,
              bpAndDiabeticStatus: 'Known',
            },
            bloodPressureStatus: {
              bpAndDiabeticStatusID: 3,
              bpAndDiabeticStatus: 'Normal',
            },
            labTestOrders: [
              { procedureName: 'BP Measurement' },
              { procedureName: 'Blood Glucose Measurement' },
              { procedureName: 'Other' },
            ],
          },
          { patientFileUploadDetailsForm: { fileIDs: [1] } },
        ),
        'POST',
        env.updateNCDScreeningDetails,
      );
      expect(body).toEqual(
        jasmine.objectContaining({
          ncdScreeningReasonID: 1,
          reasonForScreening: 'Routine',
          diabeticStatusID: 2,
          diabeticStatus: 'Known',
          bloodPressureStatusID: 3,
          bloodPressureStatus: 'Normal',
          isBloodGlucosePrescribed: true,
          isBPPrescribed: true,
          benFlowID: '10',
          modifiedBy: 'docUser',
          fileIDs: [1],
        }),
      );
    });

    it('leaves fields untouched when optional values are absent', () => {
      const body = flushed(
        service.updateNCDScreeningDetails(
          { labTestOrders: [{ procedureName: 'Other' }] },
          {},
        ),
        'POST',
        env.updateNCDScreeningDetails,
      );
      expect(body.isBPPrescribed).toBeFalse();
      expect(body.isBloodGlucosePrescribed).toBeFalse();
      expect(body.ncdScreeningReasonID).toBeUndefined();
      expect(body.diabeticStatusID).toBeUndefined();
      expect(body.bloodPressureStatusID).toBeUndefined();
    });

    it('does not set lab-order flags when labTestOrders is missing', () => {
      const body = flushed(
        service.updateNCDScreeningDetails({ x: 1 }, {}),
        'POST',
        env.updateNCDScreeningDetails,
      );
      expect(body.isBPPrescribed).toBeUndefined();
      expect(body.x).toBe(1);
    });
  });

  describe('ANC details', () => {
    function ancForm(lmpDate: any) {
      return new FormGroup({
        patientANCDetailsForm: ctrlGroup({ lmpDate, expDelDt: 'e' }),
        obstetricFormulaForm: ctrlGroup({
          gravida_G: 2,
          para: 1,
          abortions_A: 0,
          stillBirth: 0,
          livebirths_L: 1,
          bloodGroup: 'O+',
          extra: 'ignored',
        }),
        patientANCImmunizationForm: ctrlGroup({ tt1: 'yes' }),
      });
    }

    it('updateANCDetails posts obstetric details with timezone-adjusted LMP and immunization', () => {
      const lmp = '2024-01-15T10:00:00.000Z';
      const temp = { modifiedBy: 'docUser' };
      const body = flushed(
        service.updateANCDetails(ancForm(lmp), temp),
        'POST',
        env.updateANCDetailsUrl,
      );
      expect(body.ancObstetricDetails).toEqual({
        lmpDate: isoAdjusted(lmp),
        expDelDt: 'e',
        gravida_G: 2,
        para: 1,
        abortions_A: 0,
        stillBirth: 0,
        livebirths_L: 1,
        bloodGroup: 'O+',
        modifiedBy: 'docUser',
      });
      expect(body.ancImmunization).toEqual({
        tt1: 'yes',
        modifiedBy: 'docUser',
      });
      expect(body.modifiedBy).toBe('docUser');
    });

    it('updateANCDetailsandObstetricFormula keeps an empty LMP date unchanged', () => {
      const res = service.updateANCDetailsandObstetricFormula(
        ancForm(null),
        {},
      );
      expect(res.lmpDate).toBeNull();
      expect(res.bloodGroup).toBe('O+');
      expect(res.extra).toBeUndefined();
    });
  });

  describe('doctor case-record save endpoints', () => {
    const otherDetails = { createdBy: 'docUser', vanID: 33 };

    function expectCommon(body: any) {
      expect(body.findings.complaints).toEqual([
        {
          chiefComplaintID: 1,
          chiefComplaint: 'Fever',
          duration: '3',
        },
      ]);
      expect(body.findings.clinicalObservation).toBe('obs');
      expect(body.findings.vanID).toBe(33);
      expect(body.investigation.laboratoryList).toEqual([
        { procedureID: 1 },
        { procedureID: 3 },
      ]);
      expect(body.investigation.externalInvestigations).toBe('ext');
      expect(body.prescription).toEqual([{ drugID: 1, createdBy: 'docUser' }]);
      expect(body).toEqual(
        jasmine.objectContaining({
          benFlowID: '10',
          beneficiaryID: '12',
          doctorFlag: '2',
          nurseFlag: '9',
          pharmacist_flag: '1',
          parkingPlaceID: 22,
          facilityID: 11,
          beneficiaryRegID: '7',
          providerServiceMapID: '4',
          visitCode: '9',
          benVisitID: '8',
          serviceID: '5',
          createdBy: 'docUser',
          tcRequest: 'tc',
          sessionID: 'sess-1',
        }),
      );
    }

    function expectGeneralRefer(body: any) {
      expect(body.refer.referredToInstituteID).toBe(5);
      expect(body.refer.referredToInstituteName).toBe('PHC');
      expect(body.refer.refrredToAdditionalServiceList).toEqual([
        { serviceID: 1 },
      ]);
      expect(body.refer.revisitDate).toBe('2024-02-01');
    }

    const withCounselling: [
      string,
      (s: DoctorService, f: any) => Observable<any>,
      () => string,
    ][] = [
      [
        'postDoctorNCDScreeningDetails',
        (s, f) =>
          s.postDoctorNCDScreeningDetails(f, otherDetails, 'tc', true, 'sig'),
        () => env.saveDoctorNCDScreeningDetails,
      ],
      [
        'postDoctorANCDetails',
        (s, f) => s.postDoctorANCDetails(f, otherDetails, 'tc', true, 'sig'),
        () => env.saveDoctorANCDetails,
      ],
      [
        'postDoctorGeneralOPDDetails',
        (s, f) =>
          s.postDoctorGeneralOPDDetails(f, otherDetails, 'tc', true, 'sig'),
        () => env.saveDoctorGeneralOPDDetails,
      ],
      [
        'postDoctorNCDCareDetails',
        (s, f) =>
          s.postDoctorNCDCareDetails(f, otherDetails, 'tc', true, 'sig'),
        () => env.saveDoctorNCDCareDetails,
      ],
      [
        'postDoctorPNCDetails',
        (s, f) => s.postDoctorPNCDetails(f, otherDetails, 'tc', true, 'sig'),
        () => env.savePNCDoctorDetailsUrl,
      ],
    ];
    withCounselling.forEach(([name, call, url]) => {
      it(`${name} builds the full case-record payload`, () => {
        const body = flushed(call(service, buildMedicalForm()), 'POST', url());
        expectCommon(body);
        expectGeneralRefer(body);
        expect(body.counsellingProvidedList).toEqual(['c1']);
        expect(body.isSpecialist).toBeTrue();
        expect(body.doctorSignatureFlag).toBe('sig');
      });
    });

    it('postDoctorGeneralOPDDetails includes the sub visit category', () => {
      const body = flushed(
        service.postDoctorGeneralOPDDetails(
          buildMedicalForm(),
          {},
          'tc',
          false,
          'sig',
        ),
        'POST',
        env.saveDoctorGeneralOPDDetails,
      );
      expect(body.subVisitCategory).toBe('subCat');
    });

    it('postDoctorANCDetails drops a null dateOfDeath from the diagnosis', () => {
      const body = flushed(
        service.postDoctorANCDetails(
          buildMedicalForm(),
          {},
          'tc',
          false,
          'sig',
        ),
        'POST',
        env.saveDoctorANCDetails,
      );
      expect('dateOfDeath' in body.diagnosis).toBeFalse();
      expect(body.diagnosis.provisionalDiagnosisList).toEqual([{ term: 'x' }]);
    });

    it('postDoctorNCDCareDetails maps NCD condition/care type in diagnosis', () => {
      const form = buildMedicalForm({
        ncdScreeningCondition: {
          ncdScreeningConditionID: 4,
          screeningCondition: 'Diabetes',
        },
        ncdCareType: { ncdCareTypeID: 6, ncdCareType: 'Screening' },
      });
      const body = flushed(
        service.postDoctorNCDCareDetails(form, {}, 'tc', false, 'sig'),
        'POST',
        env.saveDoctorNCDCareDetails,
      );
      expect(body.diagnosis).toEqual({
        ncdScreeningConditionID: 4,
        ncdScreeningCondition: 'Diabetes',
        ncdCareTypeID: 6,
        ncdCareType: 'Screening',
      });
    });

    it('postDoctorCovidDetails builds the payload without signature flag', () => {
      const body = flushed(
        service.postDoctorCovidDetails(
          buildMedicalForm(),
          otherDetails,
          'tc',
          true,
        ),
        'POST',
        env.saveDoctorCovidDetails,
      );
      expectCommon(body);
      expectGeneralRefer(body);
      expect(body.doctorSignatureFlag).toBeUndefined();
      expect(body.diagnosis.dateOfDeath).toBeNull();
    });

    it('postDoctorFamilyPlanningetails adds side effects and family planning refer', () => {
      const body = flushed(
        service.postDoctorFamilyPlanningetails(
          buildMedicalForm(),
          otherDetails,
          'tc',
          true,
        ),
        'POST',
        env.saveDoctorFamilyPlanningDetails,
      );
      expectCommon(body);
      expect(body.treatmentsOnSideEffects).toEqual(['tx1']);
      expect(body.refer).toEqual(
        jasmine.objectContaining({
          referredToInstituteID: 5,
          referredToInstituteName: 'PHC',
          otherReferredToInstituteName: 'otherInst',
          referralReasonList: ['r1'],
          otherReferralReason: 'otherReason',
          revisitDate: '2024-02-01',
        }),
      );
      expect(body.counsellingProvidedList).toEqual(['c1']);
    });

    const immunizationCases: [
      string,
      (s: DoctorService, f: any) => Observable<any>,
      () => string,
    ][] = [
      [
        'postDoctorNeonatalAndInfantService',
        (s, f) =>
          s.postDoctorNeonatalAndInfantService(f, otherDetails, 'tc', true),
        () => env.saveDoctorNeonatalAndInfantService,
      ],
      [
        'postDoctorChildAndAdolescentService',
        (s, f) =>
          s.postDoctorChildAndAdolescentService(f, otherDetails, 'tc', true),
        () => env.saveDoctorChildAndAdolescentService,
      ],
    ];
    immunizationCases.forEach(([name, call, url]) => {
      it(`${name} includes follow-up immunization`, () => {
        const body = flushed(call(service, buildMedicalForm()), 'POST', url());
        expectCommon(body);
        expect(body.followUpForImmunization).toEqual({
          dueDateForNextImmunization: '2024-03-01',
          location: 'loc',
          createdBy: 'docUser',
          vanID: 33,
        });
        expect(body.refer).toBeUndefined();
      });
    });
  });

  describe('doctor case-record update endpoints', () => {
    const otherDetails = { modifiedBy: 'docUser', isSpecialist: true };

    const categories: [string, () => string][] = [
      ['ANC', () => env.updateANCDoctorDetails],
      ['General OPD', () => env.updateGeneralOPDDoctorDetails],
      ['NCD care', () => env.updateNCDCareDoctorDetails],
      ['PNC', () => env.updatePNCDoctorDetails],
      ['COVID-19 Screening', () => env.updateCovidDoctorDetails],
      ['NCD screening', () => env.updateNCDScreeningDoctorDetails],
    ];
    categories.forEach(([cat, url]) => {
      it(`updateDoctorDiagnosisDetails posts to the ${cat} URL`, () => {
        const body = flushed(
          service.updateDoctorDiagnosisDetails(
            buildMedicalForm(),
            cat,
            otherDetails,
            'tc',
            'sig',
          ),
          'POST',
          url(),
        );
        expect(body.subVisitCategory).toBe('subCat');
        expect(body.isSpecialist).toBeTrue();
        expect(body.doctorSignatureFlag).toBe('sig');
        expect(body.diagnosis.modifiedBy).toBe('docUser');
        expect(body.refer.referredToInstituteID).toBe(5);
      });
    });

    it('updateDoctorDiagnosisDetails returns an empty observable for other categories', () => {
      expectEmpty(
        service.updateDoctorDiagnosisDetails(
          buildMedicalForm(),
          'FP & Contraceptive Services',
          otherDetails,
          'tc',
          'sig',
        ),
      );
    });

    it('updateFamilyPlanningDoctorDiagnosisDetails posts FP payload', () => {
      const body = flushed(
        service.updateFamilyPlanningDoctorDiagnosisDetails(
          buildMedicalForm(),
          'FP & Contraceptive Services',
          otherDetails,
          'tc',
        ),
        'POST',
        env.updateFamilyPlanningDoctorDetails,
      );
      expect(body.treatmentsOnSideEffects).toEqual(['tx1']);
      expect(body.refer.otherReferralReason).toBe('otherReason');
      expect(body.diagnosis.modifiedBy).toBe('docUser');
      expect(body.isSpecialist).toBeTrue();
    });

    it('updateNeonatalAndInfantDoctorDiagnosisDetails posts neonatal payload', () => {
      const body = flushed(
        service.updateNeonatalAndInfantDoctorDiagnosisDetails(
          buildMedicalForm(),
          NEONATAL,
          otherDetails,
          'tc',
        ),
        'POST',
        env.updateNeonatalAndInfantService,
      );
      expect(body.followUpForImmunization.dueDateForNextImmunization).toBe(
        '2024-03-01',
      );
      expect(body.diagnosis.modifiedBy).toBe('docUser');
      expect(body.tcRequest).toBe('tc');
    });

    it('updateChildAndAdolescentDoctorDiagnosisDetails posts childhood payload', () => {
      const body = flushed(
        service.updateChildAndAdolescentDoctorDiagnosisDetails(
          buildMedicalForm(),
          CHILDHOOD,
          otherDetails,
          'tc',
        ),
        'POST',
        env.updateChildAndAdolescentServiceDoctor,
      );
      expect(body.followUpForImmunization.location).toBe('loc');
      expect(body.diagnosis.modifiedBy).toBe('docUser');
      expect(body.counsellingProvidedList).toEqual(['c1']);
    });
  });

  describe('postGeneralCaseRecordDiagnosis', () => {
    const form = valueOf({ a: 1, dateOfDeath: null });
    const other = { o: 2 };
    ['ANC', 'PNC'].forEach((cat) => {
      it(`${cat} removes null dateOfDeath`, () => {
        expect(
          service.postGeneralCaseRecordDiagnosis(form, cat, other),
        ).toEqual({
          a: 1,
          o: 2,
        });
      });
    });
    [
      'General OPD',
      'COVID-19 Screening',
      'NCD screening',
      'FP & Contraceptive Services',
      NEONATAL,
      CHILDHOOD,
    ].forEach((cat) => {
      it(`${cat} merges diagnosis value with other details`, () => {
        expect(
          service.postGeneralCaseRecordDiagnosis(form, cat, other),
        ).toEqual({
          a: 1,
          dateOfDeath: null,
          o: 2,
        });
      });
    });
    it('NCD care maps care-type fields', () => {
      expect(
        service.postGeneralCaseRecordDiagnosis(
          valueOf({ ncdCareType: { ncdCareTypeID: 1, ncdCareType: 'T' } }),
          'NCD care',
          other,
        ),
      ).toEqual({ ncdCareTypeID: 1, ncdCareType: 'T', o: 2 });
    });
    it('returns undefined for an unknown category', () => {
      expect(
        service.postGeneralCaseRecordDiagnosis(form, 'Unknown', other),
      ).toBeUndefined();
    });
  });

  describe('case-record helpers', () => {
    it('postANCCaseRecordDiagnosis keeps a non-null dateOfDeath', () => {
      expect(
        service.postANCCaseRecordDiagnosis(valueOf({ dateOfDeath: 'd' }), {}),
      ).toEqual({ dateOfDeath: 'd' });
    });

    it('postNCDscreeningCaseRecordDiagnosis merges value with other details', () => {
      expect(
        service.postNCDscreeningCaseRecordDiagnosis(valueOf({ a: 1 }), {
          b: 2,
        }),
      ).toEqual({ a: 1, b: 2 });
    });

    it('postNCDCareCaseRecordDiagnosis leaves plain values alone', () => {
      expect(
        service.postNCDCareCaseRecordDiagnosis(valueOf({ note: 'n' }), {
          b: 2,
        }),
      ).toEqual({ note: 'n', b: 2 });
    });

    it('postGeneralCaseRecordFindings nulls missing durations and drops empty complaints', () => {
      const res = service.postGeneralCaseRecordFindings(
        valueOf({
          complaints: [
            { chiefComplaint: { chiefComplaintID: 9, chiefComplaint: 'Pain' } },
            { chiefComplaint: '' },
          ],
        }),
        { x: 1 },
      );
      expect(res).toEqual({
        complaints: [
          { chiefComplaintID: 9, chiefComplaint: 'Pain', duration: null },
        ],
        x: 1,
      });
    });

    it('postGeneralCaseRecordInvestigation returns an empty lab list when radiology tests are missing', () => {
      const res = service.postGeneralCaseRecordInvestigation(
        valueOf({ labTest: [{ procedureID: 1 }], radiologyTest: null }),
        {},
      );
      expect(res.laboratoryList).toEqual([]);
      expect(res.labTest).toBeUndefined();
      expect(res.radiologyTest).toBeUndefined();
    });

    it('postGeneralCaseRecordPrescription keeps only drugs with createdBy', () => {
      expect(
        service.postGeneralCaseRecordPrescription(
          valueOf({ prescribedDrugs: [{ id: 1 }, { id: 2, createdBy: 'u' }] }),
          {},
        ),
      ).toEqual([{ id: 2, createdBy: 'u' }]);
    });

    it('postFamilyCaseRecordTreatmentOnSideEffects returns the side-effect list', () => {
      expect(
        service.postFamilyCaseRecordTreatmentOnSideEffects(
          valueOf({ treatmentsOnSideEffects: ['a'] }),
        ),
      ).toEqual(['a']);
    });

    it('postGeneralRefer passes through a refer form with no optional fields', () => {
      const res = service.postGeneralRefer(
        ctrlGroup({
          referredToInstituteName: null,
          refrredToAdditionalServiceList: null,
          referralReason: null,
          revisitDate: null,
        }),
        { y: 1 },
      );
      expect(res).toEqual({
        referredToInstituteName: null,
        refrredToAdditionalServiceList: null,
        referralReason: null,
        revisitDate: null,
        y: 1,
      });
    });

    it('postGeneralRefer uses the raw control value for referralReason and revisitDate', () => {
      const date = new Date('2024-05-05T00:00:00Z');
      const res = service.postGeneralRefer(
        ctrlGroup({ referralReason: ['a', 'b'], revisitDate: date }),
        {},
      );
      expect(res.revisitDate).toBe(date);
      expect(res.referralReason).toEqual(['a', 'b']);
    });

    it('postFamilyPlanningRefer passes through a refer form with no optional fields', () => {
      const res = service.postFamilyPlanningRefer(
        ctrlGroup({
          referredToInstituteName: null,
          otherReferredToInstituteName: null,
          referralReasonList: null,
          otherReferralReason: null,
          revisitDate: null,
        }),
        {},
      );
      expect(res.referredToInstituteID).toBeUndefined();
      expect(res.otherReferralReason).toBeNull();
    });

    it('postFollowUpForImmunization copies the raw due date when present', () => {
      const due = new Date('2024-06-01T00:00:00Z');
      const res = service.postFollowUpForImmunization(
        ctrlGroup({ dueDateForNextImmunization: due }),
        { z: 1 },
      );
      expect(res.dueDateForNextImmunization).toBe(due);
      expect(res.z).toBe(1);
    });

    it('postFollowUpForImmunization leaves an empty due date alone', () => {
      expect(
        service.postFollowUpForImmunization(
          ctrlGroup({ dueDateForNextImmunization: null }),
          {},
        ),
      ).toEqual({ dueDateForNextImmunization: null });
    });

    it('simple diagnosis mappers merge value with other details', () => {
      const f = valueOf({ a: 1 });
      expect(service.postGeneralOPDCaseRecordDiagnosis(f, { b: 2 })).toEqual({
        a: 1,
        b: 2,
      });
      expect(
        service.postFamilyPlanningCaseRecordDiagnosis(f, { b: 2 }),
      ).toEqual({ a: 1, b: 2 });
      expect(service.postNeonatalCaseRecordDiagnosis(f, { b: 2 })).toEqual({
        a: 1,
        b: 2,
      });
      expect(
        service.postChildAndAdolescentCaseRecordDiagnosis(f, { b: 2 }),
      ).toEqual({ a: 1, b: 2 });
      expect(service.postCovidCaseRecordDiagnosis(f, { b: 2 })).toEqual({
        a: 1,
        b: 2,
      });
    });
  });

  describe('getVisitComplaintDetails', () => {
    const cats: [string, () => string][] = [
      ['General OPD (QC)', () => env.getGeneralOPDQuickConsultVisitDetails],
      ['ANC', () => env.getANCVisitDetailsUrl],
      ['General OPD', () => env.getGeneralOPDVisitDetailsUrl],
      ['NCD screening', () => env.getNCDScreeningVisitDetails],
      ['NCD care', () => env.getNCDCareVisitDetailsUrl],
      ['COVID-19 Screening', () => env.getCovidVisitDetails],
      ['FP & Contraceptive Services', () => env.getFamilyPlanningVisitDetails],
      [NEONATAL, () => env.getNeonatalVisitDetails],
      [CHILDHOOD, () => env.getChildAndAdolescentVisitDetails],
    ];
    cats.forEach(([cat, url]) => {
      it(`${cat} posts visit details and caches the observable`, () => {
        setCategory(cat);
        const obs = service.getVisitComplaintDetails('b', 'v');
        expect(flushed(obs, 'POST', url())).toEqual({
          benRegID: 'b',
          benVisitID: 'v',
          visitCode: '9',
        });
        expect(service.getVisitComplaintDetails('b', 'v')).toBe(obs);
      });
    });

    it('PNC returns a fresh, uncached request', () => {
      setCategory('PNC');
      flushed(
        service.getVisitComplaintDetails('b', 'v'),
        'POST',
        env.getPNCVisitDetailsUrl,
      );
      expect(service.getVisitComplaint).toBeUndefined();
    });

    it('returns undefined when no category is set', () => {
      setCategory(null);
      expect(service.getVisitComplaintDetails('b', 'v')).toBeUndefined();
    });
  });

  describe('getGeneralHistoryDetails', () => {
    const cats: [string, () => string][] = [
      ['ANC', () => env.getANCHistoryDetailsUrl],
      ['General OPD', () => env.getGeneralOPDHistoryDetailsUrl],
      ['NCD care', () => env.getNCDCareHistoryDetailsUrl],
      ['COVID-19 Screening', () => env.getCovidHistoryDetailsUrl],
      ['PNC', () => env.getPNCHistoryDetailsUrl],
      ['NCD screening', () => env.getNCDScreeningHistoryDetails],
    ];
    cats.forEach(([cat, url]) => {
      it(`${cat} posts history request and caches it`, () => {
        setCategory(cat);
        const obs = service.getGeneralHistoryDetails('b', 'v');
        expect(flushed(obs, 'POST', url()).benRegID).toBe('b');
        expect(service.getGeneralHistoryDetails('x', 'y')).toBe(obs);
      });
    });

    it('returns undefined for unsupported categories', () => {
      setCategory('Other');
      expect(service.getGeneralHistoryDetails('b', 'v')).toBeUndefined();
    });
  });

  describe('vitals & examination fetches', () => {
    const genericCats: [string, () => string][] = [
      ['General OPD (QC)', () => env.getGeneralOPDQuickConsultVitalDetails],
      ['ANC', () => env.getANCVitalsDetailsUrl],
      ['General OPD', () => env.getGeneralOPDVitalDetailsUrl],
      ['NCD care', () => env.getNCDCareVitalDetailsUrl],
      ['COVID-19 Screening', () => env.getCovidVitalDetailsUrl],
      ['PNC', () => env.getPNCVitalsDetailsUrl],
      ['NCD screening', () => env.getNCDSceeriningVitalDetails],
      [
        'FP & Contraceptive Services',
        () => env.getFamilyPlanningVitalDetailsUrl,
      ],
      [NEONATAL, () => env.getNeonatalVitalsDetailsUrl],
      [CHILDHOOD, () => env.getChildAndAdolescentVitalsDetailsUrl],
    ];
    genericCats.forEach(([cat, url]) => {
      it(`getGenericVitals uses the ${cat} URL`, () => {
        setCategory(cat);
        expect(
          flushed(service.getGenericVitals({ benRegID: 'b' }), 'POST', url()),
        ).toEqual({ benRegID: 'b', visitCode: '9' });
      });
    });

    it('getGenericVitals returns an empty observable for unknown category', () => {
      setCategory(null);
      expectEmpty(service.getGenericVitals({}));
    });

    genericCats.slice(0, 7).forEach(([cat, url]) => {
      it(`getGenericVitalsForMMULabReport uses the ${cat} URL with referred visit code`, () => {
        setCategory(cat);
        expect(
          flushed(
            service.getGenericVitalsForMMULabReport({ benRegID: 'b' }),
            'POST',
            url(),
          ),
        ).toEqual({ benRegID: 'b', visitCode: 'ref-vc' });
      });
    });

    it('getGenericVitalsForMMULabReport returns empty observable for other categories', () => {
      setCategory(NEONATAL);
      expectEmpty(service.getGenericVitalsForMMULabReport({}));
    });

    it('getRBSPreviousVitals posts for NCD screening only', () => {
      setCategory('NCD screening');
      expect(
        flushed(
          service.getRBSPreviousVitals({ b: 1 }),
          'POST',
          env.getNCDSceeriningVitalDetails,
        ),
      ).toEqual({ b: 1 });
      setCategory('ANC');
      expectEmpty(service.getRBSPreviousVitals({ b: 1 }));
    });

    const examCats: [string, () => string][] = [
      ['ANC', () => env.getANCExaminationDataUrl],
      ['General OPD', () => env.getGeneralOPDExaminationDetailsUrl],
      ['PNC', () => env.getPNCExaminationDataUrl],
    ];
    examCats.forEach(([cat, url]) => {
      it(`getGeneralExamintionData uses the ${cat} URL`, () => {
        setCategory(cat);
        expect(
          flushed(service.getGeneralExamintionData('b', 'v'), 'POST', url()),
        ).toEqual({ benRegID: 'b', benVisitID: 'v', visitCode: '9' });
      });
    });

    it('getGeneralExamintionData returns empty observable for other categories', () => {
      setCategory('NCD care');
      expectEmpty(service.getGeneralExamintionData('b', 'v'));
    });

    it('getIDRSDetails posts for NCD screening and is empty otherwise', () => {
      setCategory('NCD screening');
      expect(
        flushed(
          service.getIDRSDetails('b', 'v'),
          'POST',
          env.getNCDScreeningIDRSDetails,
        ).benVisitID,
      ).toBe('v');
      setCategory('ANC');
      expectEmpty(service.getIDRSDetails('b', 'v'));
    });
  });

  describe('updateGeneralHistory', () => {
    const cats: [string, () => string, boolean][] = [
      ['ANC', () => env.updateANCHistoryDetailsUrl, true],
      ['General OPD', () => env.updateGeneralOPDHistoryDetailsUrl, false],
      ['NCD care', () => env.updateNCDCareHistoryDetailsUrl, false],
      ['COVID-19 Screening', () => env.updateCovidHistoryDetailsUrl, false],
      ['PNC', () => env.updatePNCHistoryDetailsUrl, true],
    ];
    cats.forEach(([cat, url, strips]) => {
      it(`${cat} posts history${strips ? ' without paediatric sections' : ''}`, () => {
        setCategory(cat);
        const body = flushed(
          service.updateGeneralHistory(buildGeneralHistoryForm(), { m: 1 }, 30),
          'POST',
          url(),
        );
        expect(body.pastHistory.pastIllness[0]).toEqual({
          illnessType: 'TB',
          illnessTypeID: '3',
          timePeriodAgo: '2',
        });
        expect(body.comorbidConditions.m).toBe(1);
        expect(body.immunizationHistory.immunizationList).toEqual([{ a: 1 }]);
        expect(body.facilityID).toBe(11);
        expect(body.beneficiaryRegID).toBe('7');
        if (strips) {
          expect(body.feedingHistory).toBeUndefined();
          expect(body.developmentHistory).toBeUndefined();
          expect(body.perinatalHistroy).toBeUndefined();
        } else {
          expect(body.feedingHistory.foodIntoleranceStatus).toBe(0);
          expect(body.developmentHistory.grossMotorMilestones).toEqual(['m']);
          expect(body.perinatalHistroy.m).toBe(1);
        }
      });
    });

    it('returns an empty observable for other categories', () => {
      setCategory('NCD screening');
      expectEmpty(
        service.updateGeneralHistory(buildGeneralHistoryForm(), {}, 30),
      );
    });
  });

  describe('history section mappers', () => {
    it('updateGeneralDevelopmentHistory merges value and details', () => {
      expect(
        service.updateGeneralDevelopmentHistory(valueOf({ a: 1 }), { b: 2 }),
      ).toEqual({ a: 1, b: 2 });
    });

    it('updateGeneralFeedingHistory converts food intolerance to a number', () => {
      expect(
        service.updateGeneralFeedingHistory(
          valueOf({ foodIntoleranceStatus: '1', typeOfFood: 'x' }),
          { b: 2 },
        ),
      ).toEqual({ foodIntoleranceStatus: 1, typeOfFood: 'x', b: 2 });
    });

    it('updateGeneralPerinatalHistory flattens master objects', () => {
      expect(
        service.updateGeneralPerinatalHistory(
          valueOf({
            placeOfDelivery: { deliveryPlaceID: 1, deliveryPlace: 'Home' },
            typeOfDelivery: { deliveryTypeID: 2, deliveryType: 'Normal' },
            complicationAtBirth: {
              complicationID: 3,
              complicationValue: 'None',
            },
          }),
          { b: 2 },
        ),
      ).toEqual({
        deliveryPlaceID: 1,
        placeOfDelivery: 'Home',
        deliveryTypeID: 2,
        typeOfDelivery: 'Normal',
        complicationAtBirthID: 3,
        complicationAtBirth: 'None',
        b: 2,
      });
    });

    it('updateGeneralPerinatalHistory leaves empty fields alone', () => {
      expect(
        service.updateGeneralPerinatalHistory(
          valueOf({ placeOfDelivery: null }),
          {},
        ),
      ).toEqual({ placeOfDelivery: null });
    });

    it('updateGeneralPastHistory maps surgeries and nulls missing time periods', () => {
      const res = service.updateGeneralPastHistory(
        valueOf({
          pastIllness: [{ illnessType: { illnessType: 'A', illnessID: 1 } }],
          pastSurgery: [
            {
              surgeryType: { surgeryType: 'S', surgeryID: 4 },
              timePeriodAgo: 5,
            },
            { surgeryType: { surgeryType: 'T', surgeryID: 6 } },
          ],
          otherField: 'dropped',
        }),
        { d: 1 },
      );
      expect(res.pastIllness).toEqual([
        { illnessType: 'A', illnessTypeID: '1', timePeriodAgo: null },
      ]);
      expect(res.pastSurgery).toEqual([
        { surgeryType: 'S', surgeryID: '4', timePeriodAgo: '5' },
        { surgeryType: 'T', surgeryID: '6', timePeriodAgo: null },
      ]);
      expect(res.d).toBe(1);
      // current behaviour: non-list fields are lost (reads `.value` of a plain object)
      expect(res.otherField).toBeUndefined();
    });

    it('updateGeneralComorbidityHistory maps conditions and inverts isForHistory', () => {
      const res = service.updateGeneralComorbidityHistory(
        valueOf({
          comorbidityConcurrentConditionsList: [
            {
              comorbidConditions: {
                comorbidCondition: 'DM',
                comorbidConditionID: 2,
              },
              isForHistory: true,
            },
            {
              comorbidConditions: { comorbidCondition: 'HTN' },
              isForHistory: false,
            },
            { comorbidConditions: null, isForHistory: null },
          ],
        }),
        { x: 1 },
      );
      const list = res.comorbidityConcurrentConditionsList;
      expect(list[0]).toEqual(
        jasmine.objectContaining({
          comorbidCondition: 'DM',
          comorbidConditionID: '2',
          isForHistory: false,
        }),
      );
      expect(list[0].comorbidConditions).toBeUndefined();
      expect(list[1].comorbidConditionID).toBeUndefined();
      expect(list[1].isForHistory).toBeTrue();
      expect(list[2].isForHistory).toBeTrue();
      expect(res.x).toBe(1);
    });

    it('updateGeneralMedicationHistory merges value and details', () => {
      expect(
        service.updateGeneralMedicationHistory(valueOf({ m: [1] }), { t: 1 }),
      ).toEqual({ m: [1], t: 1 });
    });

    it('updateGeneralPersonalHistory maps habit and allergy lists', () => {
      const res = service.updateGeneralPersonalHistory(
        valueOf({
          tobaccoList: [
            { tobaccoUseType: { personalHabitTypeID: 1, habitValue: 'Beedi' } },
            { tobaccoUseType: null },
          ],
          alcoholList: [
            {
              typeOfAlcohol: { personalHabitTypeID: 2, habitValue: 'Beer' },
              avgAlcoholConsumption: { habitValue: '1-2' },
            },
            { typeOfAlcohol: null, avgAlcoholConsumption: null },
          ],
          allergicList: [
            {
              allergyType: { allergyType: 'Food' },
              typeOfAllergicReactions: [{ allergicReactionTypeID: 7 }],
            },
            { allergyType: null, typeOfAllergicReactions: null },
          ],
          riskySexualPracticesStatus: '1',
        }),
        { t: 1 },
      );
      expect(res.tobaccoList[0]).toEqual({
        tobaccoUseTypeID: 1,
        tobaccoUseType: 'Beedi',
      });
      expect(res.tobaccoList[1]).toEqual({ tobaccoUseType: null });
      expect(res.alcoholList[0]).toEqual({
        alcoholTypeID: 2,
        typeOfAlcohol: 'Beer',
        avgAlcoholConsumption: '1-2',
      });
      expect(res.alcoholList[1].alcoholTypeID).toBeUndefined();
      expect(res.allergicList[0]).toEqual({
        allergyType: 'Food',
        typeOfAllergicReactions: [{ allergicReactionTypeID: '7' }],
      });
      expect(res.allergicList[1].allergyType).toBeNull();
      expect(res.riskySexualPracticesStatus).toBe(1);
      expect(res.t).toBe(1);
    });

    it('updateGeneralPersonalHistory tolerates missing lists and risky status', () => {
      const res = service.updateGeneralPersonalHistory(
        valueOf({ riskySexualPracticesStatus: null }),
        {},
      );
      expect(res.riskySexualPracticesStatus).toBeNull();
      expect(res.tobaccoList).toBeUndefined();
      expect(res.alcoholList).toBeUndefined();
      expect(res.allergicList).toBeUndefined();
    });

    it('updateGeneralFamilyHistory maps disease types', () => {
      const res = service.updateGeneralFamilyHistory(
        valueOf({
          familyDiseaseList: [
            { diseaseType: { diseaseTypeID: 3, diseaseType: 'Asthma' } },
            { diseaseType: null },
          ],
        }),
        { t: 1 },
      );
      expect(res.familyDiseaseList).toEqual([
        { diseaseTypeID: '3', diseaseType: 'Asthma' },
        { diseaseType: null },
      ]);
      expect(res.t).toBe(1);
    });

    it('updateGeneralMenstrualHistory flattens masters and adjusts LMP date', () => {
      const lmp = '2024-01-10T05:00:00.000Z';
      const res = service.updateGeneralMenstrualHistory(
        ctrlGroup({
          menstrualCycleStatus: { menstrualCycleStatusID: 1, name: 'Regular' },
          cycleLength: { menstrualRangeID: 2, menstrualCycleRange: '28' },
          bloodFlowDuration: { menstrualRangeID: 3, menstrualCycleRange: '5' },
          lMPDate: lmp,
        }),
        { o: 1 },
      );
      expect(res).toEqual({
        menstrualCycleStatusID: '1',
        menstrualCycleStatus: 'Regular',
        menstrualCyclelengthID: '2',
        cycleLength: '28',
        menstrualFlowDurationID: '3',
        bloodFlowDuration: '5',
        lMPDate: isoAdjusted(lmp),
        o: 1,
      });
    });

    [null, undefined, 'Invalid Date'].forEach((lmp) => {
      it(`updateGeneralMenstrualHistory drops lMPDate when it is ${lmp}`, () => {
        const res = service.updateGeneralMenstrualHistory(
          { getRawValue: () => ({ lMPDate: lmp, cycleLength: null }) },
          {},
        );
        expect('lMPDate' in res).toBeFalse();
        expect(res.cycleLength).toBeNull();
      });
    });

    it('updateGeneralPastObstetricHistory renames list and flattens masters', () => {
      const res = service.updateGeneralPastObstetricHistory(
        valueOf({
          totalNoOfPreg: 2,
          pastObstericHistoryList: [
            {
              durationType: { pregDurationID: 1, durationType: 'Term' },
              deliveryType: { deliveryTypeID: 2, deliveryType: 'Normal' },
              deliveryPlace: { deliveryPlaceID: 3, deliveryPlace: 'Home' },
              pregOutcome: { pregOutcomeID: 4, pregOutcome: 'Live' },
              newBornComplication: {
                complicationID: 5,
                complicationValue: 'None',
              },
            },
            {},
          ],
        }),
        { t: 1 },
      );
      expect(res.femaleObstetricHistoryList[0]).toEqual({
        pregDurationID: 1,
        durationType: 'Term',
        deliveryTypeID: 2,
        deliveryType: 'Normal',
        deliveryPlaceID: 3,
        deliveryPlace: 'Home',
        pregOutcomeID: 4,
        pregOutcome: 'Live',
        newBornComplicationID: 5,
        newBornComplication: 'None',
      });
      expect(res.femaleObstetricHistoryList[1]).toEqual({});
      expect(res.pastObstericHistoryList).toBeUndefined();
      expect(res.totalNoOfPreg).toBe(2);
      expect(res.t).toBe(1);
    });

    it('updateGeneralImmunizationHistory keeps only the immunization list', () => {
      expect(
        service.updateGeneralImmunizationHistory(
          valueOf({ immunizationList: [1], other: 2 }),
          { t: 1 },
        ),
      ).toEqual({ immunizationList: [1], t: 1 });
    });

    it('updateGeneralOtherVaccines maps vaccine names', () => {
      expect(
        service.updateGeneralOtherVaccines(
          valueOf({
            otherVaccines: [
              { vaccineName: { vaccineID: 1, vaccineName: 'BCG' } },
              { vaccineName: null },
            ],
          }),
          { t: 1 },
        ),
      ).toEqual({
        childOptionalVaccineList: [
          { vaccineID: 1, vaccineName: 'BCG' },
          { vaccineName: null },
        ],
        t: 1,
      });
    });

    it('updatePhyscialActivityHistory merges value and details', () => {
      expect(
        service.updatePhyscialActivityHistory(valueOf({ p: 1 }), { q: 2 }),
      ).toEqual({ p: 1, q: 2 });
    });
  });

  describe('vitals updates', () => {
    const cats: [string, () => string][] = [
      ['ANC', () => env.updateANCVitalsDetailsUrl],
      ['General OPD', () => env.updateGeneralOPDVitalsDetailsUrl],
      ['NCD care', () => env.updateNCDCareVitalsDetailsUrl],
      ['COVID-19 Screening', () => env.updateCovidVitalsDetailsUrl],
      ['PNC', () => env.updatePNCVitalsDetailsUrl],
      ['NCD screening', () => env.updateNCDVitalsDetailsUrl],
      [
        'FP & Contraceptive Services',
        () => env.updateFamilyPlanningVitalsDetailsUrl,
      ],
    ];

    function vitalsForm() {
      const f = ctrlGroup({ weight: 60, bmi: 22 });
      f.controls['bmi'].disable();
      return f;
    }

    cats.forEach(([cat, url]) => {
      it(`updateGeneralVitals posts ${cat} vitals including disabled values`, () => {
        const body = flushed(
          service.updateGeneralVitals(vitalsForm(), cat),
          'POST',
          url(),
        );
        expect(body).toEqual(
          jasmine.objectContaining({
            weight: 60,
            bmi: 22,
            modifiedBy: 'docUser',
            facilityID: 11,
            parkingPlaceID: 22,
            beneficiaryRegID: '7',
            visitCode: '9',
            benVisitID: '8',
          }),
        );
      });
    });

    it('updateGeneralVitals returns empty observable for other categories', () => {
      expectEmpty(service.updateGeneralVitals(vitalsForm(), NEONATAL));
    });

    it('updateNeonatalVitals posts for neonatal and childhood categories', () => {
      expect(
        flushed(
          service.updateNeonatalVitals(vitalsForm(), NEONATAL),
          'POST',
          env.updateNeonatalVitalsDetailsUrl,
        ).bmi,
      ).toBe(22);
      expect(
        flushed(
          service.updateNeonatalVitals(vitalsForm(), CHILDHOOD),
          'POST',
          env.updateChildAndAdolescentVitalsDetailsUrl,
        ).weight,
      ).toBe(60);
    });

    it('updateNeonatalVitals returns empty observable for other categories', () => {
      expectEmpty(service.updateNeonatalVitals(vitalsForm(), 'ANC'));
    });
  });

  describe('examination updates', () => {
    const exam = {
      generalExaminationForm: { g: 1 },
      headToToeExaminationForm: { h: 1 },
      systemicExaminationForm: {
        gastroIntestinalSystemForm: { gi: 1 },
        cardioVascularSystemForm: { cv: 1 },
        respiratorySystemForm: { rs: 1 },
        centralNervousSystemForm: { cns: 1 },
        musculoSkeletalSystemForm: { ms: 1 },
        genitoUrinarySystemForm: { gu: 1 },
        obstetricExaminationForANCForm: { ob: 1 },
      },
    };
    const upd = { modifiedBy: 'docUser' };

    it('ANC posts obstetric examination but no GI examination', () => {
      const body = flushed(
        service.updatePatientExamination(exam, 'ANC', upd),
        'POST',
        env.updateANCExaminationDetailsUrl,
      );
      expect(body.generalExamination).toEqual({ g: 1, modifiedBy: 'docUser' });
      expect(body.headToToeExamination).toEqual({
        h: 1,
        modifiedBy: 'docUser',
      });
      expect(body.obstetricExamination).toEqual({
        ob: 1,
        modifiedBy: 'docUser',
      });
      expect(body.cardioVascularExamination.cv).toBe(1);
      expect(body.respiratorySystemExamination.rs).toBe(1);
      expect(body.centralNervousSystemExamination.cns).toBe(1);
      expect(body.musculoskeletalSystemExamination.ms).toBe(1);
      expect(body.genitoUrinarySystemExamination.gu).toBe(1);
      expect(body.gastroIntestinalExamination).toBeUndefined();
    });

    [
      ['PNC', () => env.updatePNCExaminationDetailsUrl],
      ['General OPD', () => env.updateGeneralOPDExaminationDetailsUrl],
    ].forEach(([cat, url]: any) => {
      it(`${cat} posts GI examination and no obstetric examination`, () => {
        const body = flushed(
          service.updatePatientExamination(exam, cat, upd),
          'POST',
          url(),
        );
        expect(body.gastroIntestinalExamination).toEqual({
          gi: 1,
          modifiedBy: 'docUser',
        });
        expect(body.obstetricExamination).toBeUndefined();
        expect(body.genitoUrinarySystemExamination.gu).toBe(1);
        expect(body.benVisitID).toBe('8');
      });
    });

    it('returns empty observable for other categories', () => {
      expectEmpty(service.updatePatientExamination(exam, 'NCD care', upd));
    });

    describe('updateOralExaminationForm', () => {
      it('passes through a pristine form', () => {
        expect(
          service.updateOralExaminationForm(
            { dirty: false, otherLesionType: 'x' },
            { u: 1 },
          ),
        ).toEqual({ dirty: false, otherLesionType: 'x', u: 1 });
      });

      it('replaces a trailing "Any other lesion" with the typed lesion', () => {
        const res = service.updateOralExaminationForm(
          {
            dirty: true,
            preMalignantLesionTypeList: ['Leukoplakia', 'Any other lesion'],
            otherLesionType: 'Custom',
          },
          {},
        );
        expect(res.preMalignantLesionTypeList).toEqual([
          'Leukoplakia',
          'Custom',
        ]);
        expect(res.otherLesionType).toBeUndefined();
      });

      it('keeps the list when "Any other lesion" is not the last entry', () => {
        const res = service.updateOralExaminationForm(
          {
            dirty: true,
            preMalignantLesionTypeList: ['Any other lesion', 'Leukoplakia'],
            otherLesionType: 'Custom',
          },
          {},
        );
        expect(res.preMalignantLesionTypeList).toEqual([
          'Any other lesion',
          'Leukoplakia',
        ]);
      });

      it('handles a null lesion list on a dirty form', () => {
        const res = service.updateOralExaminationForm(
          {
            dirty: true,
            preMalignantLesionTypeList: null,
            otherLesionType: 'c',
          },
          { u: 2 },
        );
        expect(res.preMalignantLesionTypeList).toBeNull();
        expect(res.otherLesionType).toBeUndefined();
        expect(res.u).toBe(2);
      });
    });
  });

  describe('PNC details update', () => {
    it('flattens all master objects', () => {
      const body = flushed(
        service.updatePNCDetails(
          valueOf({
            deliveryPlace: { deliveryPlaceID: 1, deliveryPlace: 'Home' },
            deliveryType: { deliveryTypeID: 2, deliveryType: 'Normal' },
            deliveryConductedBy: {
              deliveryConductedByID: 3,
              deliveryConductedBy: 'ANM',
            },
            deliveryComplication: {
              complicationID: 4,
              deliveryComplicationType: 'PPH',
            },
            pregOutcome: { pregOutcomeID: 5, pregOutcome: 'Live' },
            postNatalComplication: {
              complicationID: 6,
              complicationValue: 'Fever',
            },
            gestationName: { gestationID: 7, name: 'Term' },
            newBornHealthStatus: {
              newBornHealthStatusID: 8,
              newBornHealthStatus: 'Healthy',
            },
          }),
          { m: 1 },
        ),
        'POST',
        env.updatePNCDetailsUrl,
      );
      expect(body.PNCDetails).toEqual({
        deliveryPlaceID: 1,
        deliveryPlace: 'Home',
        deliveryTypeID: 2,
        deliveryType: 'Normal',
        deliveryConductedByID: 3,
        deliveryConductedBy: 'ANM',
        deliveryComplicationID: 4,
        deliveryComplication: 'PPH',
        pregOutcomeID: 5,
        pregOutcome: 'Live',
        postNatalComplicationID: 6,
        postNatalComplication: 'Fever',
        gestationID: 7,
        gestationName: 'Term',
        newBornHealthStatusID: 8,
        newBornHealthStatus: 'Healthy',
        m: 1,
      });
    });

    it('passes through empty values', () => {
      const body = flushed(
        service.updatePNCDetails(valueOf({ deliveryPlace: null }), {}),
        'POST',
        env.updatePNCDetailsUrl,
      );
      expect(body).toEqual({ PNCDetails: { deliveryPlace: null } });
    });
  });

  describe('case record & refer fetches', () => {
    const cats: [string, () => string][] = [
      ['General OPD (QC)', () => env.getGeneralOPDQuickConsultDoctorDetails],
      ['ANC', () => env.getANCDoctorDetails],
      ['General OPD', () => env.getGeneralOPDDoctorDetails],
      ['NCD screening', () => env.getNCDScreeningDoctorDetails],
      ['NCD care', () => env.getNCDCareDoctorDetails],
      ['COVID-19 Screening', () => env.getCovidDoctorDetails],
      ['PNC', () => env.getPNCDoctorDetails],
      ['FP & Contraceptive Services', () => env.getFamilyPlanningDoctorDetails],
      [NEONATAL, () => env.getNeonatalAndInfantDetails],
      [CHILDHOOD, () => env.getChildAndAdolescentDetails],
    ];
    cats.forEach(([cat, url]) => {
      it(`getCaseRecordAndReferDetails fetches and caches ${cat}`, () => {
        const obs = service.getCaseRecordAndReferDetails(
          'ignored',
          'ignored',
          cat,
        );
        expect(flushed(obs, 'POST', url())).toEqual({
          benRegID: '7',
          benVisitID: '8',
          visitCode: '9',
        });
        expect(service.getCaseRecordAndReferDetails('a', 'b', 'ANC')).toBe(obs);
      });
    });

    it('getCaseRecordAndReferDetails returns undefined for unknown category', () => {
      expect(
        service.getCaseRecordAndReferDetails('a', 'b', 'Unknown'),
      ).toBeUndefined();
    });

    cats.slice(0, 7).forEach(([cat, url]) => {
      it(`getMMUCaseRecordAndReferDetails fetches ${cat} without caching`, () => {
        const obs = service.getMMUCaseRecordAndReferDetails(
          'a',
          'b',
          cat,
          'vc',
        );
        expect(service.caseRecordAndReferDetails1).toBe(obs);
        expect(flushed(obs, 'POST', url()).visitCode).toBe('9');
      });
    });

    it('getMMUCaseRecordAndReferDetails returns the previous value for other categories', () => {
      expect(
        service.getMMUCaseRecordAndReferDetails('a', 'b', NEONATAL, 'vc'),
      ).toBeNull();
      const prev = service.getMMUCaseRecordAndReferDetails(
        'a',
        'b',
        'ANC',
        'vc',
      );
      expect(
        service.getMMUCaseRecordAndReferDetails('a', 'b', 'Other', 'vc'),
      ).toBe(prev);
    });
  });

  describe('specialist observation & IDRS', () => {
    it('saveSpecialistCancerObservation removes the institute name before posting', () => {
      const form = new FormGroup({
        patientCaseRecordForm: ctrlGroup({ provisionalDiagnosis: 'Ca' }),
        patientReferForm: ctrlGroup({
          referredToInstituteName: { institutionID: 1 },
          refer: 'y',
        }),
      });
      const body = flushed(
        service.saveSpecialistCancerObservation(form, { o: 1 }),
        'POST',
        env.saveSpecialistCancerObservationUrl,
      );
      expect(body).toEqual({
        diagnosis: { refer: 'y', provisionalDiagnosis: 'Ca', o: 1 },
      });
    });

    it('saveSpecialistCancerObservation works without an institute name', () => {
      const form = new FormGroup({
        patientCaseRecordForm: ctrlGroup({ d: 1 }),
        patientReferForm: ctrlGroup({ referredToInstituteName: null }),
      });
      const body = flushed(
        service.saveSpecialistCancerObservation(form, {}),
        'POST',
        env.saveSpecialistCancerObservationUrl,
      );
      expect(body.diagnosis).toEqual({ referredToInstituteName: null, d: 1 });
    });

    it('updateIDRSDetails wraps IDRS data for NCD screening', () => {
      const body = flushed(
        service.updateIDRSDetails(valueOf({ idrsScore: 30 }), 'NCD screening'),
        'POST',
        env.updateNCDScreeningIDRSDetailsUrl,
      );
      expect(body.idrsDetails).toEqual(
        jasmine.objectContaining({
          idrsScore: 30,
          createdBy: 'docUser',
          modifiedBy: 'docUser',
          deleted: false,
          facilityID: 11,
        }),
      );
    });

    it('updateIDRSDetails returns empty observable for other categories', () => {
      expectEmpty(service.updateIDRSDetails(valueOf({}), 'ANC'));
    });

    function ncdHistoryForm() {
      return new FormGroup({
        familyHistory: ctrlGroup({ familyDiseaseList: [] }),
        physicalActivityHistory: ctrlGroup({ activity: 'walk' }),
        personalHistory: ctrlGroup({ riskySexualPracticesStatus: '0' }),
      });
    }

    it('updateNCDScreeningHistory posts for NCD screening', () => {
      setCategory('NCD screening');
      const body = flushed(
        service.updateNCDScreeningHistory(ncdHistoryForm(), { t: 1 }, 40),
        'POST',
        env.updateNCDScreeningHistoryDetailsUrl,
      );
      expect(body.physicalActivityHistory).toEqual({ activity: 'walk', t: 1 });
      expect(body.personalHistory.riskySexualPracticesStatus).toBe(0);
      expect(body.familyHistory.familyDiseaseList).toEqual([]);
      expect(body.visitCode).toBe('9');
    });

    it('updateNCDScreeningHistory returns empty observable for other categories', () => {
      setCategory('ANC');
      expectEmpty(service.updateNCDScreeningHistory(ncdHistoryForm(), {}, 40));
    });
  });

  describe('family planning, birth & immunization and NCD screening updates', () => {
    function fpForm() {
      return new FormGroup({
        familyPlanningForm: new FormGroup({
          familyPlanningAndReproductiveForm: ctrlGroup({ fp: 1 }),
          IecCounsellingForm: ctrlGroup({ iec: 1 }),
          dispensationDetailsForm: ctrlGroup({ disp: 1 }),
        }),
      });
    }

    it('updateFamilyPlanning posts the three FP sections', () => {
      const body = flushed(
        service.updateFamilyPlanning(fpForm(), 'FP & Contraceptive Services'),
        'POST',
        env.updateFamilyPlanningScreenDetailsUrl,
      );
      expect(body.familyPlanningReproductiveDetails).toEqual(
        jasmine.objectContaining({
          fp: 1,
          modifiedBy: 'docLower',
          createdBy: 'docUser',
        }),
      );
      expect(body.iecAndCounsellingDetails.iec).toBe(1);
      expect(body.dispensationDetails.disp).toBe(1);
      // current behaviour: top-level beneficiaryRegID comes from beneficiaryID
      expect(body.beneficiaryRegID).toBe('12');
    });

    it('updateFamilyPlanning returns empty observable for other categories', () => {
      expectEmpty(service.updateFamilyPlanning(fpForm(), 'ANC'));
    });

    function birthForm() {
      return new FormGroup({
        infantBirthDetailsForm: ctrlGroup({ birthWeight: 3 }),
        immunizationHistory: ctrlGroup({ list: [1] }),
      });
    }

    it('updateBirthAndImmunizationHistory posts neonatal details', () => {
      const body = flushed(
        service.updateBirthAndImmunizationHistory(birthForm(), NEONATAL),
        'POST',
        env.updateBirthImmunizationHistoryDetailsUrl,
      );
      expect(body.infantBirthDetails.birthWeight).toBe(3);
      expect(body.immunizationHistory.list).toEqual([1]);
      expect(body.infantBirthDetails.beneficiaryRegID).toBe('7');
    });

    it('updateBirthAndImmunizationHistory posts childhood details', () => {
      const body = flushed(
        service.updateBirthAndImmunizationHistory(birthForm(), CHILDHOOD),
        'POST',
        env.updateBirthAndImmunizationHistoryDataUrl,
      );
      expect(body.immunizationHistory.modifiedBy).toBe('docLower');
    });

    it('updateBirthAndImmunizationHistory returns empty observable otherwise', () => {
      expectEmpty(
        service.updateBirthAndImmunizationHistory(birthForm(), 'ANC'),
      );
    });

    function ncdForm() {
      return new FormGroup({
        diabetes: ctrlGroup({ d: 1 }),
        hypertension: ctrlGroup({ h: 1 }),
        oral: ctrlGroup({ o: 1 }),
        breast: ctrlGroup({ b: 1 }),
        cervical: ctrlGroup({ c: 1 }),
      });
    }

    it('updateNCDSreeningDetails posts all five screenings', () => {
      const body = flushed(
        service.updateNCDSreeningDetails(ncdForm(), 'NCD screening'),
        'POST',
        env.updateNCDScreeningDetailsUrl,
      );
      expect(body).toEqual(
        jasmine.objectContaining({
          diabetes: { d: 1 },
          hypertension: { h: 1 },
          oral: { o: 1 },
          breast: { b: 1 },
          cervical: { c: 1 },
          benFlowID: '10',
          modifiedBy: 'docUser',
        }),
      );
    });

    it('updateNCDSreeningDetails returns empty observable otherwise', () => {
      expectEmpty(service.updateNCDSreeningDetails(ncdForm(), 'ANC'));
    });

    it('getPreviousBirthImmunizationHistoryDetails selects URL by category', () => {
      expect(
        flushed(
          service.getPreviousBirthImmunizationHistoryDetails(NEONATAL),
          'POST',
          env.getPreviousBirthImmunizationDetailsUrl,
        ),
      ).toEqual({ benRegID: '7' });
      expect(
        flushed(
          service.getPreviousBirthImmunizationHistoryDetails(CHILDHOOD),
          'POST',
          env.getPreviousBirthImmunizationDataForChildAndAdolascentUrl,
        ),
      ).toEqual({ benRegID: '7' });
      expectEmpty(service.getPreviousBirthImmunizationHistoryDetails('ANC'));
    });

    it('updateImmunizationServices wraps immunization service data', () => {
      const body = flushed(
        service.updateImmunizationServices(valueOf({ vaccines: ['BCG'] })),
        'POST',
        env.updateNeonatalImmunizationService,
      );
      expect(body.immunizationServices).toEqual(
        jasmine.objectContaining({
          vaccines: ['BCG'],
          facilityID: 11,
          modifiedBy: 'docLower',
          benVisitID: '8',
        }),
      );
    });

    function childhoodForm() {
      return new FormGroup({
        immunizationServicesForm: ctrlGroup({ i: 1 }),
        oralVitaminAForm: ctrlGroup({ v: 1 }),
      });
    }

    it('updateChildhoodImmunizationServices posts for childhood category (trimmed, case-insensitive)', () => {
      const body = flushed(
        service.updateChildhoodImmunizationServices(
          childhoodForm(),
          '  ' + CHILDHOOD.toUpperCase() + ' ',
        ),
        'POST',
        env.updateChildAndAdolescentService,
      );
      expect(body.immunizationServices.i).toBe(1);
      expect(body.oralVitaminAProphylaxis.v).toBe(1);
      expect(body.beneficiaryRegID).toBe('12');
    });

    it('updateChildhoodImmunizationServices returns empty observable otherwise', () => {
      expectEmpty(
        service.updateChildhoodImmunizationServices(childhoodForm(), NEONATAL),
      );
    });
  });
});
