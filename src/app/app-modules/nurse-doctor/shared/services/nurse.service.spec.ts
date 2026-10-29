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
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { environment } from 'src/environments/environment';
import { createSessionStorageMock } from 'src/testing/test-utils';
import { SpinnerService } from '../../../core/services/spinner.service';
import { NcdScreeningService } from './ncd-screening.service';
import { NurseService } from './nurse.service';

const SESSION = {
  providerServiceID: 11,
  serviceID: 4,
  serviceLineDetails: JSON.stringify({ facilityID: 7, parkingPlaceID: 9 }),
  beneficiaryRegID: 123,
  userName: 'nurse1',
  benFlowID: 55,
  beneficiaryID: 66,
  sessionID: 3,
  visitCategoryId: 2,
};

const COMMON = {
  beneficiaryRegID: 123,
  providerServiceMapID: 11,
  createdBy: 'nurse1',
};

/** Minimal stand-in for an AbstractControl: exposes value and getRawValue. */
function f(value: any): any {
  return { value, getRawValue: () => value };
}

/** Minimal FormGroup-like object supporting removeControl. */
function g(controls: any, value: any = {}): any {
  return {
    controls,
    value,
    removeControl(name: string) {
      delete this.controls[name];
    },
  };
}

function visitForm(): any {
  return g({
    patientVisitDetailsForm: f({ visitReason: 'Illness' }),
    patientFileUploadDetailsForm: f({ fileIDs: [1] }),
    patientChiefComplaintsForm: f({
      complaints: [
        {
          chiefComplaint: { chiefComplaintID: 5, chiefComplaint: 'Fever' },
          duration: 2,
        },
        { chiefComplaint: null, duration: 1 },
      ],
    }),
    patientAdherenceForm: f({ toDrugs: true }),
    cdssForm: {
      value: { cdss: 1 },
      controls: {
        presentChiefComplaintDb: f({ pcc: 1 }),
        diseaseSummaryDb: f({ ds: 1 }),
      },
    },
    patientInvestigationsForm: f({ labTest: 'RBS' }),
    patientCovidForm: f({ symptom: 'cough' }),
    cbacScreeningForm: f({ cbac: 1 }),
  });
}

function fullHistoryForm(): any {
  return g({
    pastHistory: f({
      pastIllness: [
        { illnessType: { illnessType: 'TB', illnessID: 3 } },
        { illnessType: null },
      ],
      pastSurgery: [
        { surgeryType: { surgeryType: 'Appendix', surgeryID: 4 } },
        { surgeryType: null },
      ],
    }),
    comorbidityHistory: f({
      comorbidityConcurrentConditionsList: [
        {
          comorbidConditions: {
            comorbidCondition: 'DM',
            comorbidConditionID: 1,
          },
          isForHistory: true,
        },
        {
          comorbidConditions: {
            comorbidCondition: 'HTN',
            comorbidConditionID: 2,
          },
          isForHistory: null,
        },
        { comorbidConditions: null },
      ],
    }),
    medicationHistory: f({ medicationHistoryList: [{ drug: 'x' }] }),
    pastObstericHistory: f({
      pastObstericHistoryList: [
        {
          durationType: { pregDurationID: 1, durationType: 'Term' },
          deliveryType: { deliveryTypeID: 2, deliveryType: 'Normal' },
          deliveryPlace: { deliveryPlaceID: 3, deliveryPlace: 'Home' },
          pregOutcome: { pregOutcomeID: 4, pregOutcome: 'Live' },
          newBornComplication: { complicationID: 5, complicationValue: 'None' },
        },
        {},
      ],
    }),
    menstrualHistory: f({
      menstrualCycleStatus: { menstrualCycleStatusID: 1, name: 'Regular' },
      cycleLength: { menstrualRangeID: 2, menstrualCycleRange: '28' },
      bloodFlowDuration: { menstrualRangeID: 3, menstrualCycleRange: '5' },
      lMPDate: '2024-01-10T00:00:00.000Z',
    }),
    familyHistory: f({
      familyDiseaseList: [
        { diseaseType: { diseaseTypeID: 8, diseaseType: 'Asthma' } },
        { diseaseType: null },
      ],
    }),
    personalHistory: f({
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
          typeOfAllergicReactions: [{ allergicReactionTypeID: 6 }],
        },
        { allergyType: null, typeOfAllergicReactions: null },
      ],
      riskySexualPracticesStatus: '1',
    }),
    otherVaccines: f({
      otherVaccines: [
        { vaccineName: { vaccineID: 1, vaccineName: 'BCG' } },
        { vaccineName: null },
      ],
    }),
    immunizationHistory: f({ immunizationList: [{ v: 1 }] }),
    developmentHistory: f({ grossMotor: 'ok' }),
    feedingHistory: f({ foodIntoleranceStatus: '1' }),
    perinatalHistory: f({
      placeOfDelivery: { deliveryPlaceID: 1, deliveryPlace: 'Home' },
      typeOfDelivery: { deliveryTypeID: 2, deliveryType: 'Normal' },
      complicationAtBirth: { complicationID: 3, complicationValue: 'None' },
    }),
    physicalActivityHistory: f({ activity: 'low' }),
  });
}

function examinationValue(): any {
  return {
    generalExaminationForm: { ge: 1 },
    headToToeExaminationForm: { htt: 1 },
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
}

function vitalsForm(): any {
  return f({ temperature: '', pulseRate: 70 });
}

describe('NurseService', () => {
  let service: NurseService;
  let httpMock: HttpTestingController;
  let ncd: NcdScreeningService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        NurseService,
        NcdScreeningService,
        { provide: SpinnerService, useValue: {} },
        {
          provide: SessionStorageService,
          useValue: createSessionStorageMock(SESSION),
        },
      ],
    });
    service = TestBed.inject(NurseService);
    httpMock = TestBed.inject(HttpTestingController);
    ncd = TestBed.inject(NcdScreeningService);
    spyOn(console, 'log');
  });

  afterEach(() => httpMock.verify());

  describe('listeners and subjects', () => {
    it('filter/contactfilter emit to listen()', () => {
      const got: any[] = [];
      service.listen().subscribe((v) => got.push(v));
      service.filter('a');
      service.contactfilter('b');
      expect(got).toEqual(['a', 'b']);
    });

    const subjectCases: Array<[string, any, string, any]> = [
      ['setNCDTemp', true, 'ncdTemp', true],
      ['clearNCDTemp', undefined, 'ncdTemp', false],
      ['setEnableLAssessment', true, 'enableLAssessment', true],
      ['clearEnableLAssessment', undefined, 'enableLAssessment', false],
      ['setIsMMUTC', 'yes', 'ismmutc', 'yes'],
      [
        'setLMPForFetosenseTest',
        '2024-01-01',
        'lmpFetosenseTestValue',
        '2024-01-01',
      ],
      ['clearLMPForFetosenseTest', undefined, 'lmpFetosenseTestValue', null],
      [
        'setRbsSelectedInInvestigation',
        true,
        'rbsSelectedInInvestigation',
        true,
      ],
      [
        'clearRbsSelectedInInvestigation',
        undefined,
        'rbsSelectedInInvestigation',
        false,
      ],
      ['setRbsInCurrentVitals', 150, 'rbsTestResultCurrent', 150],
      ['clearRbsInVitals', undefined, 'rbsTestResultCurrent', null],
      ['setUpdateForHrpStatus', true, 'hrpStatusUpdateValue', true],
      ['setNCDScreeningProvision', true, 'enableProvisionalDiag', true],
      ['clearNCDScreeningProvision', undefined, 'enableProvisionalDiag', false],
    ];
    subjectCases.forEach(([method, arg, subject, expected]) => {
      it(`${method} pushes ${JSON.stringify(expected)} to ${subject}`, () => {
        const s = service as any;
        s[subject].next('seed');
        s[method](arg);
        expect(s[subject].value).toEqual(expected);
      });
    });

    it('setters also update backing fields', () => {
      service.setNCDTemp(true);
      expect(service.temp).toBeTrue();
      service.setLMPForFetosenseTest('x');
      expect(service.lmpFetosenseTest).toBe('x');
      service.clearLMPForFetosenseTest();
      expect(service.lmpFetosenseTest).toBeNull();
      service.setRbsSelectedInInvestigation(true);
      expect(service.rbsSelectedInvestigation).toBeTrue();
      service.setRbsInCurrentVitals(99);
      expect(service.rbsCurrentTestResult).toBe(99);
      service.setUpdateForHrpStatus(true);
      expect(service.hrpStatusUpdate).toBeTrue();
      service.clearNCDScreeningProvision();
      expect(service.temp).toBeFalse();
    });
  });

  describe('worklist GET calls', () => {
    const cases: Array<[string, string]> = [
      ['getNurseWorklist', 'nurseWorklist'],
      ['getNurseTMFutureWorklist', 'getNurseTMFutureWorklistUrl'],
      ['getNurseTMWorklist', 'getNurseTMWorklistUrl'],
      ['getMMUNurseWorklist', 'mmuNurseWorklist'],
    ];
    cases.forEach(([method, key]) => {
      it(`${method} builds providerServiceID/serviceID/facilityID url`, () => {
        let res: any;
        (service as any)[method]().subscribe((r: any) => (res = r));
        const t = httpMock.expectOne((environment as any)[key] + '11/4/7');
        expect(t.request.method).toBe('GET');
        t.flush({ statusCode: 200, data: [] });
        expect(res.statusCode).toBe(200);
      });
    });

    it('loadNursePatientDetails GETs referred worklist for van', () => {
      service.loadNursePatientDetails(22).subscribe();
      const t = httpMock.expectOne(
        environment.getnurse104referredworklisturls + '/22',
      );
      expect(t.request.method).toBe('GET');
      t.flush({});
    });
  });

  describe('simple HTTP calls', () => {
    const benRegPosts: Array<[string, string]> = [
      ['getPreviousPastHistory', 'previousPastHistoryUrl'],
      ['getPreviousMedicationHistory', 'previousMedicationHistoryUrl'],
      ['getPreviousOtherVaccines', 'previousOtherVaccineHistoryUrl'],
      ['getPreviousTobaccoHistory', 'previousTobaccoHistoryUrl'],
      ['getPreviousAlcoholHistory', 'previousAlcoholHistoryUrl'],
      ['getPreviousAllergyHistory', 'previousAllergyHistoryUrl'],
      ['getPreviousFamilyHistory', 'previousFamilyHistoryUrl'],
      ['getPreviousMenstrualHistory', 'previousMestrualHistoryUrl'],
      ['getPreviousObstetricHistory', 'previousPastObstetricHistoryUrl'],
      ['getPreviousComorbidityHistory', 'previousComorbidityHistoryUrl'],
      ['getPreviousDevelopmentalHistory', 'previousDevelopmentHistory'],
      [
        'getPreviousImmunizationServicesData',
        'previousImmunizationServiceDataUrl',
      ],
      ['getPreviousPerinatalHistory', 'previousPerinatalHistory'],
      ['getPreviousFeedingHistory', 'previousFeedingHistory'],
      ['getPreviousImmunizationHistory', 'previousImmunizationHistoryUrl'],
      [
        'getPreviousPhysicalActivityHistory',
        'previousPhyscialactivityHistoryUrl',
      ],
      ['getPreviousDiabetesHistory', 'previousDiabetesHistoryUrl'],
      ['getPreviousReferredHistory', 'previousReferredHistoryUrl'],
    ];
    benRegPosts.forEach(([method, key]) => {
      it(`${method} POSTs {benRegID}`, () => {
        (service as any)[method]('123', 'General OPD').subscribe();
        const t = httpMock.expectOne((environment as any)[key]);
        expect(t.request.method).toBe('POST');
        expect(t.request.body).toEqual({ benRegID: '123' });
        t.flush({});
      });
    });

    const bodyPosts: Array<[string, string]> = [
      ['getPreviousVisitData', 'previousVisitDataUrl'],
      ['sendTestDetailsToFetosense', 'savefetosenseTestDetailsUrl'],
      ['calculateBmiStatus', 'calculateBmiStatus'],
      ['getDiabetesStatus', 'diabetesStatusUrl'],
      ['getBloodPressureStatus', 'bloodPressureStatusUrl'],
      ['getCbacDetailsFromNurse', 'confirmedDiseaseUrl'],
      ['getPreviousVisitConfirmedDiseases', 'previousVisitConfirmedUrl'],
    ];
    bodyPosts.forEach(([method, key]) => {
      it(`${method} POSTs the request body`, () => {
        const body = { x: method };
        (service as any)[method](body).subscribe();
        const t = httpMock.expectOne((environment as any)[key]);
        expect(t.request.method).toBe('POST');
        expect(t.request.body).toEqual(body);
        t.flush({});
      });
    });

    const gets: Array<[string, any, string]> = [
      [
        'fetchPrescribedFetosenseTests',
        5,
        environment.getPrescribedFetosenseTests + 5,
      ],
      ['getESanjeevaniDetails', 6, environment.getESanjeevaniDetailsUrl + 6],
      [
        'getNcdScreeningVisitCount',
        7,
        environment.getNcdScreeningVisitCountUrl + 7,
      ],
      ['getStateName', 1, environment.getStateName + 1],
      ['getDistrictName', 2, environment.getDistrictName + 2],
      ['getSubDistrictName', 3, environment.getSubDistrictName + 3],
      ['getCountryName', undefined, environment.getCountryName],
      ['getCityName', 91, environment.getCityName + 91 + '/'],
    ];
    gets.forEach(([method, arg, url]) => {
      it(`${method} GETs ${url}`, () => {
        (service as any)[method](arg).subscribe();
        const t = httpMock.expectOne(url);
        expect(t.request.method).toBe('GET');
        t.flush({});
      });
    });
  });

  describe('form mappers', () => {
    it('postCheifComplaintForm flattens chief complaint and adds ids without mutating input', () => {
      const input = [
        { chiefComplaint: { chiefComplaintID: 5, chiefComplaint: 'Fever' } },
        { chiefComplaint: null },
      ];
      const out = service.postCheifComplaintForm(input, 99);
      expect(out[0]).toEqual(
        jasmine.objectContaining({
          chiefComplaintID: 5,
          chiefComplaint: 'Fever',
          benVisitID: 99,
          ...COMMON,
        }),
      );
      expect(out[1].chiefComplaintID).toBeUndefined();
      expect(out[1].beneficiaryRegID).toBe(123);
      expect(input[0].chiefComplaint).toEqual({
        chiefComplaintID: 5,
        chiefComplaint: 'Fever',
      });
    });

    it('simple Object.assign mappers add beneficiary/visit metadata', () => {
      const withVisit = [
        'postAdherenceForm',
        'postCdssForm',
        'postInvestigationForm',
        'postCovidForm',
        'postANCImmunizationForm',
        'postGeneralExaminationForm',
        'postHeadToToeExaminationForm',
        'postGastroIntestinalSystemForm',
        'postCardioVascularSystemForm',
        'postRespiratorySystemForm',
        'postCentralNervousSystemForm',
        'postMusculoSkeletalSystemForm',
        'postGenitoUrinarySystemForm',
        'postANCObstetricExamination',
        'postInfantBirthDetailsForm',
        'postFpAndReproductiveForm',
        'postIecDetailsForm',
        'postDispensationDetailsForm',
      ];
      withVisit.forEach((m) => {
        const out = (service as any)[m]({ field: m }, 42);
        expect(out).toEqual({ field: m, benVisitID: 42, ...COMMON });
      });
    });

    it('postOralVitaminImmunizationServiceForm and postImmunizationServiceForm read .value', () => {
      expect(
        service.postOralVitaminImmunizationServiceForm(f({ dose: 1 }), 3),
      ).toEqual({
        dose: 1,
        benVisitID: 3,
        ...COMMON,
      });
      expect(service.postImmunizationServiceForm(f({ vacc: 2 }), 3)).toEqual({
        vacc: 2,
        benVisitID: 3,
        ...COMMON,
      });
    });

    it('postImmunizationHistoryForm adds facility and parking place', () => {
      expect(service.postImmunizationHistoryForm({ h: 1 }, 8)).toEqual({
        h: 1,
        facilityID: 7,
        parkingPlaceID: 9,
        benVisitID: 8,
        ...COMMON,
      });
    });

    it('postPatientVisitDetails merges visit form and files', () => {
      expect(
        service.postPatientVisitDetails({ a: 1 }, { fileIDs: [2] }),
      ).toEqual({
        a: 1,
        fileIDs: [2],
        ...COMMON,
      });
    });

    it('postGenericVitalForm converts empty temperature to null', () => {
      const out = service.postGenericVitalForm(vitalsForm(), 1);
      expect(out.temperature).toBeNull();
      expect(out.pulseRate).toBe(70);
      expect(out.benVisitID).toBe(1);
    });

    it('postGenericVitalForm keeps non-empty temperature', () => {
      const out = service.postGenericVitalForm(f({ temperature: 98 }), 1);
      expect(out.temperature).toBe(98);
    });

    it('postPhyscialActivityHistory merges value with other details', () => {
      expect(
        service.postPhyscialActivityHistory(f({ a: 1 }), { b: 2 }),
      ).toEqual({ a: 1, b: 2 });
    });

    describe('postOralExaminationForm', () => {
      it('returns falsy input unchanged', () => {
        expect(service.postOralExaminationForm(null, 1)).toBeNull();
      });

      it('replaces trailing "Any other lesion" with otherLesionType', () => {
        const out = service.postOralExaminationForm(
          {
            preMalignantLesionTypeList: ['A', 'Any other lesion'],
            otherLesionType: 'Custom',
          },
          1,
        );
        expect(out.preMalignantLesionTypeList).toEqual(['A', 'Custom']);
        expect(out.otherLesionType).toBeUndefined();
        expect(out.beneficiaryRegID).toBe(123);
      });

      it('leaves list alone if "Any other lesion" is not last', () => {
        const out = service.postOralExaminationForm(
          {
            preMalignantLesionTypeList: ['Any other lesion', 'B'],
            otherLesionType: 'C',
          },
          1,
        );
        expect(out.preMalignantLesionTypeList).toEqual([
          'Any other lesion',
          'B',
        ]);
      });

      it('handles null lesion list', () => {
        const out = service.postOralExaminationForm(
          { preMalignantLesionTypeList: null },
          1,
        );
        expect(out.preMalignantLesionTypeList).toBeNull();
        expect(out.createdBy).toBe('nurse1');
      });
    });

    describe('postANCDetailForm', () => {
      function ancForm(lmpDate: any) {
        return g({
          patientANCDetailsForm: f({ lmpDate, trimester: 2 }),
          obstetricFormulaForm: f({
            gravida_G: 2,
            para: 1,
            abortions_A: 0,
            stillBirth: 0,
            livebirths_L: 1,
            bloodGroup: 'A+',
          }),
          patientANCImmunizationForm: f({ tt1: 'yes' }),
        });
      }

      it('adjusts lmpDate to ISO and merges obstetric formula', () => {
        const out = service.postANCDetailForm(
          ancForm('2024-02-01T00:00:00.000Z'),
          5,
        );
        const d = new Date('2024-02-01T00:00:00.000Z');
        const expected = new Date(
          d.getTime() - d.getTimezoneOffset() * 60000,
        ).toISOString();
        expect(out.lmpDate).toBe(expected);
        expect(out.gravida_G).toBe(2);
        expect(out.bloodGroup).toBe('A+');
        expect(out.benVisitID).toBe(5);
      });

      it('leaves missing lmpDate alone', () => {
        const out = service.postANCDetailForm(ancForm(null), 5);
        expect(out.lmpDate).toBeNull();
      });

      it('postANCForm returns obstetric details and immunization', () => {
        const out = service.postANCForm(ancForm(null), 5);
        expect(out.ancObstetricDetails.trimester).toBe(2);
        expect(out.ancImmunization).toEqual({
          tt1: 'yes',
          benVisitID: 5,
          ...COMMON,
        });
      });
    });

    describe('history mappers', () => {
      const other = { other: true };

      it('postGeneralPastHistory maps illness and surgery types', () => {
        const out = service.postGeneralPastHistory(
          fullHistoryForm().controls.pastHistory,
          other,
        );
        expect(out.pastIllness[0]).toEqual({
          illnessType: 'TB',
          illnessTypeID: '3',
        });
        expect(out.pastIllness[1]).toEqual({ illnessType: null });
        expect(out.pastSurgery[0]).toEqual({
          surgeryType: 'Appendix',
          surgeryID: '4',
        });
        expect(out.other).toBeTrue();
      });

      it('postGeneralComorbidityHistory maps conditions and toggles isForHistory', () => {
        const out = service.postGeneralComorbidityHistory(
          fullHistoryForm().controls.comorbidityHistory,
          other,
        );
        const list = out.comorbidityConcurrentConditionsList;
        expect(list[0].comorbidCondition).toBe('DM');
        expect(list[0].comorbidConditionID).toBe('1');
        expect(list[0].isForHistory).toBeFalse();
        expect(list[1].isForHistory).toBeTrue();
        expect(list[2].comorbidCondition).toBeUndefined();
        expect(out.other).toBeTrue();
      });

      it('postGeneralDevelopmentHistory / Medication / Immunization merge details', () => {
        const h = fullHistoryForm().controls;
        expect(
          service.postGeneralDevelopmentHistory(h.developmentHistory, other),
        ).toEqual({
          grossMotor: 'ok',
          other: true,
        });
        expect(
          service.postGeneralMedicationHistroy(h.medicationHistory, other)
            .other,
        ).toBeTrue();
        expect(
          service.postGeneralImmunizationHistroy(h.immunizationHistory, other),
        ).toEqual({
          immunizationList: [{ v: 1 }],
          other: true,
        });
      });

      it('postGeneralFamilyHistory maps disease types', () => {
        const out = service.postGeneralFamilyHistory(
          fullHistoryForm().controls.familyHistory,
          other,
        );
        expect(out.familyDiseaseList[0]).toEqual({
          diseaseTypeID: '8',
          diseaseType: 'Asthma',
        });
        expect(out.familyDiseaseList[1]).toEqual({ diseaseType: null });
      });

      it('postGeneralFeedingHistory coerces foodIntoleranceStatus to number', () => {
        const out = service.postGeneralFeedingHistory(
          fullHistoryForm().controls.feedingHistory,
          other,
        );
        expect(out.foodIntoleranceStatus).toBe(1);
        expect(out.other).toBeTrue();
      });

      it('postGeneralMenstrualHistory maps all nested masters and adjusts lMPDate', () => {
        const out = service.postGeneralMenstrualHistory(
          fullHistoryForm().controls.menstrualHistory,
          other,
        );
        expect(out.menstrualCycleStatusID).toBe('1');
        expect(out.menstrualCycleStatus).toBe('Regular');
        expect(out.menstrualCyclelengthID).toBe('2');
        expect(out.cycleLength).toBe('28');
        expect(out.menstrualFlowDurationID).toBe('3');
        expect(out.bloodFlowDuration).toBe('5');
        const d = new Date('2024-01-10T00:00:00.000Z');
        expect(out.lMPDate).toBe(
          new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString(),
        );
      });

      it('postGeneralMenstrualHistory with empty values leaves lMPDate undefined', () => {
        const out = service.postGeneralMenstrualHistory(
          f({ lMPDate: null }),
          other,
        );
        expect(out.lMPDate).toBeUndefined();
        expect(out.menstrualCycleStatusID).toBeUndefined();
        expect(out.other).toBeTrue();
      });

      it('postGeneralOtherVaccines maps vaccines to childOptionalVaccineList', () => {
        const out = service.postGeneralOtherVaccines(
          fullHistoryForm().controls.otherVaccines,
          other,
        );
        expect(out.otherVaccines).toBeUndefined();
        expect(out.childOptionalVaccineList[0]).toEqual({
          vaccineID: 1,
          vaccineName: 'BCG',
        });
        expect(out.childOptionalVaccineList[1]).toEqual({ vaccineName: null });
      });

      it('postGeneralPastObstetricHistory maps every master and renames list', () => {
        const out = service.postGeneralPastObstetricHistory(
          fullHistoryForm().controls.pastObstericHistory,
          other,
        );
        expect(out.pastObstericHistoryList).toBeUndefined();
        expect(out.femaleObstetricHistoryList[0]).toEqual({
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
        expect(out.femaleObstetricHistoryList[1]).toEqual({});
      });

      it('postGeneralPerinatalHistory maps delivery masters', () => {
        const out = service.postGeneralPerinatalHistory(
          fullHistoryForm().controls.perinatalHistory,
          other,
        );
        expect(out).toEqual({
          deliveryPlaceID: 1,
          placeOfDelivery: 'Home',
          deliveryTypeID: 2,
          typeOfDelivery: 'Normal',
          complicationAtBirthID: 3,
          complicationAtBirth: 'None',
          other: true,
        });
      });

      it('postGeneralPerinatalHistory with empty value just merges', () => {
        expect(service.postGeneralPerinatalHistory(f({}), other)).toEqual({
          other: true,
        });
      });

      it('postGeneralPersonalHistory maps tobacco, alcohol and allergies', () => {
        const out = service.postGeneralPersonalHistory(
          fullHistoryForm().controls.personalHistory,
          other,
        );
        expect(out.tobaccoList[0]).toEqual({
          tobaccoUseTypeID: 1,
          tobaccoUseType: 'Beedi',
        });
        expect(out.tobaccoList[1]).toEqual({ tobaccoUseType: null });
        expect(out.alcoholList[0]).toEqual({
          alcoholTypeID: 2,
          typeOfAlcohol: 'Beer',
          avgAlcoholConsumption: '1-2',
        });
        expect(out.alcoholList[1]).toEqual({
          typeOfAlcohol: null,
          avgAlcoholConsumption: null,
        });
        expect(out.allergicList[0].allergyType).toBe('Food');
        expect(
          out.allergicList[0].typeOfAllergicReactions[0].allergicReactionTypeID,
        ).toBe('6');
        expect(out.allergicList[1].allergyType).toBeNull();
        expect(out.riskySexualPracticesStatus).toBe(1);
        expect(out.other).toBeTrue();
      });

      it('postGeneralPersonalHistory handles missing lists and null risky status', () => {
        const out = service.postGeneralPersonalHistory(
          f({ riskySexualPracticesStatus: null }),
          other,
        );
        expect(out.tobaccoList).toBeUndefined();
        expect(out.alcoholList).toBeUndefined();
        expect(out.allergicList).toBeUndefined();
        expect(out.riskySexualPracticesStatus).toBeNull();
        const out2 = service.postGeneralPersonalHistory(f({}), other);
        expect(out2.riskySexualPracticesStatus).toBeNull();
      });

      it('postANCHistoryForm includes child vaccines/immunization only for age <= 16', () => {
        const young = service.postANCHistoryForm(fullHistoryForm(), 1, 10);
        expect(Object.keys(young)).toContain('childVaccineDetails');
        expect(Object.keys(young)).toContain('immunizationHistory');
        expect(young.pastHistory.beneficiaryRegID).toBe('123');
        expect(young.pastHistory.benVisitID).toBeNull();
        const adult = service.postANCHistoryForm(fullHistoryForm(), 1, 30);
        expect(Object.keys(adult)).not.toContain('childVaccineDetails');
        expect(Object.keys(adult)).toContain('personalHistory');
      });

      it('postGeneralHistoryForm returns every history section', () => {
        const out = service.postGeneralHistoryForm(fullHistoryForm(), {});
        expect(Object.keys(out).sort()).toEqual(
          [
            'pastHistory',
            'comorbidConditions',
            'medicationHistory',
            'femaleObstetricHistory',
            'menstrualHistory',
            'familyHistory',
            'personalHistory',
            'childVaccineDetails',
            'immunizationHistory',
            'developmentHistory',
            'feedingHistory',
            'perinatalHistroy',
          ].sort(),
        );
      });

      it('postNCDScreeningHistoryForm returns family, physical activity, personal', () => {
        const out = service.postNCDScreeningHistoryForm(
          fullHistoryForm(),
          {},
          'NCD screening',
        );
        expect(Object.keys(out).sort()).toEqual([
          'familyHistory',
          'personalHistory',
          'physicalActivityHistory',
        ]);
        expect(out.physicalActivityHistory.activity).toBe('low');
      });

      it('postNCDScreeningHistoryFormForCbac returns only personal history', () => {
        const out = service.postNCDScreeningHistoryFormForCbac(
          fullHistoryForm(),
          {},
          'x',
        );
        expect(Object.keys(out)).toEqual(['personalHistory']);
      });
    });

    describe('postPNCDetailForm', () => {
      it('maps all masters', () => {
        const out = service.postPNCDetailForm(
          f({
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
              newBornHealthStatus: 'Good',
            },
          }),
          9,
        );
        expect(out).toEqual({
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
          newBornHealthStatus: 'Good',
          benVisitID: 9,
          ...COMMON,
        });
      });

      it('leaves empty form as-is', () => {
        expect(service.postPNCDetailForm(f({}), null)).toEqual({
          benVisitID: null,
          ...COMMON,
        });
      });
    });
  });

  describe('postGenericVisitDetailForm', () => {
    const cases: Array<[string, boolean, string[]]> = [
      [
        'ANC',
        false,
        [
          'visitDetails',
          'chiefComplaints',
          'adherence',
          'cdss',
          'investigation',
        ],
      ],
      [
        'General OPD',
        false,
        ['visitDetails', 'chiefComplaints', 'adherence', 'cdss'],
      ],
      ['PNC', false, ['visitDetails', 'chiefComplaints', 'adherence', 'cdss']],
      [
        'FP & Contraceptive Services',
        false,
        ['visitDetails', 'chiefComplaints', 'adherence', 'cdss'],
      ],
      [
        'Neonatal and Infant Health Care Services',
        false,
        ['visitDetails', 'chiefComplaints', 'cdss'],
      ],
      [
        'Childhood & Adolescent Healthcare Services',
        false,
        ['visitDetails', 'chiefComplaints', 'cdss'],
      ],
      [
        'NCD care',
        false,
        ['visitDetails', 'adherence', 'investigation', 'cdss'],
      ],
      ['COVID-19 Screening', false, ['visitDetails', 'covidDetails', 'cdss']],
      ['NCD screening', true, ['visitDetails', 'chiefComplaints', 'cdss']],
      ['NCD screening', false, ['visitDetails', 'cdss']],
    ];
    cases.forEach(([cat, idrs, keys]) => {
      it(`${cat} (showIDRS=${idrs}) returns ${keys.join(',')}`, () => {
        const out: any = service.postGenericVisitDetailForm(
          visitForm(),
          10,
          cat,
          idrs,
        );
        expect(Object.keys(out).sort()).toEqual([...keys].sort());
        expect(out.visitDetails).toEqual({
          visitReason: 'Illness',
          fileIDs: [1],
          ...COMMON,
        });
        expect(out.cdss.benVisitID).toBe(10);
      });
    });

    it('returns undefined for an unknown category', () => {
      expect(
        service.postGenericVisitDetailForm(visitForm(), 1, 'Other', false),
      ).toBeUndefined();
    });
  });

  describe('postGenericExaminationForm', () => {
    it('ANC includes obstetric examination but not gastro', () => {
      const out: any = service.postGenericExaminationForm(
        examinationValue(),
        1,
        'ANC',
      );
      expect(out.obstetricExamination).toEqual({
        ob: 1,
        benVisitID: 1,
        ...COMMON,
      });
      expect(out.gastroIntestinalExamination).toBeUndefined();
      expect(Object.keys(out).length).toBe(8);
    });

    ['General OPD', 'PNC'].forEach((cat) => {
      it(`${cat} includes gastro but not obstetric`, () => {
        const out: any = service.postGenericExaminationForm(
          examinationValue(),
          2,
          cat,
        );
        expect(out.gastroIntestinalExamination).toEqual({
          gi: 1,
          benVisitID: 2,
          ...COMMON,
        });
        expect(out.obstetricExamination).toBeUndefined();
        expect(Object.keys(out).length).toBe(8);
      });
    });

    it('returns undefined for other categories', () => {
      expect(
        service.postGenericExaminationForm(examinationValue(), 1, 'NCD care'),
      ).toBeUndefined();
    });
  });

  describe('save calls', () => {
    it('postNurseGeneralQCVisitForm posts combined quick consult payload', () => {
      const form = g({
        patientVisitForm: visitForm(),
        patientVitalsForm: f({ bp: 1 }),
      });
      service.postNurseGeneralQCVisitForm(form, { tc: 1 }).subscribe();
      const t = httpMock.expectOne(environment.saveNurseGeneralQuickConsult);
      const body = t.request.body;
      expect(t.request.method).toBe('POST');
      expect(body.visitDetails).toEqual(
        jasmine.objectContaining({
          visitReason: 'Illness',
          pcc: 1,
          ds: 1,
          beneficiaryRegID: '123',
        }),
      );
      expect(body.vitalsDetails.bp).toBe(1);
      expect(body.chiefComplaintList[0].chiefComplaintID).toBe(5);
      expect(body.chiefComplaintList[0].benVisitID).toBeNull();
      expect(body).toEqual(
        jasmine.objectContaining({
          benFlowID: 55,
          beneficiaryID: 66,
          sessionID: 3,
          parkingPlaceID: 9,
          facilityID: 7,
          serviceID: 4,
          createdBy: 'nurse1',
          tcRequest: { tc: 1 },
          beneficiaryRegID: 123,
          providerServiceMapID: 11,
        }),
      );
      t.flush({});
    });

    it('postNurseANCVisitForm posts ANC payload', () => {
      const form = g({
        patientVisitForm: visitForm(),
        patientANCForm: g({
          patientANCDetailsForm: f({ lmpDate: null }),
          obstetricFormulaForm: f({ gravida_G: 1 }),
          patientANCImmunizationForm: f({}),
        }),
        patientVitalsForm: vitalsForm(),
        patientHistoryForm: fullHistoryForm(),
        patientExaminationForm: f(examinationValue()),
      });
      service.postNurseANCVisitForm(form, 1, 'ANC', 25, null).subscribe();
      const t = httpMock.expectOne(environment.saveNurseANCDetails);
      const body = t.request.body;
      expect(body.visitDetails.investigation).toBeDefined();
      expect(body.ancDetails.ancObstetricDetails.gravida_G).toBe(1);
      expect(body.vitalDetails.temperature).toBeNull();
      expect(body.historyDetails.childVaccineDetails).toBeUndefined();
      expect(body.examinationDetails.obstetricExamination).toBeDefined();
      expect(body.facilityID).toBe(7);
      t.flush({});
    });

    it('postNurseFamilyPlanningVisitForm posts FP payload', () => {
      const form = g({
        patientVisitForm: visitForm(),
        patientVitalsForm: vitalsForm(),
        familyPlanningForm: g({
          familyPlanningAndReproductiveForm: f({ fp: 1 }),
          IecCounsellingForm: f({ iec: 1 }),
          dispensationDetailsForm: f({ disp: 1 }),
        }),
      });
      service
        .postNurseFamilyPlanningVisitForm(
          form,
          2,
          'FP & Contraceptive Services',
          30,
          null,
        )
        .subscribe();
      const t = httpMock.expectOne(environment.saveNurseFamilyPlanningDetails);
      const body = t.request.body;
      expect(body.familyPlanningReproductiveDetails).toEqual({
        fp: 1,
        benVisitID: 2,
        ...COMMON,
      });
      expect(body.iecAndCounsellingDetails.iec).toBe(1);
      expect(body.dispensationDetails.disp).toBe(1);
      expect(body.visitDetails.adherence).toBeDefined();
      t.flush({});
    });

    function neonatalForm() {
      return g({
        patientVisitForm: visitForm(),
        patientVitalsForm: vitalsForm(),
        patientBirthImmunizationHistoryForm: g({
          infantBirthDetailsForm: f({ birthWeight: 3 }),
          immunizationHistory: f({ ih: 1 }),
        }),
        patientImmunizationServicesForm: g({
          immunizationServicesForm: f({ is: 1 }),
          oralVitaminAForm: f({ vitA: 1 }),
        }),
      });
    }

    it('postNurseNeoatalAndInfantVisitForm posts neonatal payload', () => {
      service
        .postNurseNeoatalAndInfantVisitForm(
          neonatalForm(),
          3,
          'Neonatal and Infant Health Care Services',
          null,
        )
        .subscribe();
      const t = httpMock.expectOne(
        environment.saveNurseNeonatalAndInfantDetails,
      );
      const body = t.request.body;
      expect(body.infantBirthDetails.birthWeight).toBe(3);
      expect(body.immunizationHistory.facilityID).toBe(7);
      expect(body.immunizationServices.is).toBe(1);
      expect(body.oralVitaminAProphylaxis).toBeUndefined();
      t.flush({});
    });

    it('postNurseChildAndAdolescentVisitForm posts child payload with vitamin A', () => {
      service
        .postNurseChildAndAdolescentVisitForm(
          neonatalForm(),
          4,
          'Childhood & Adolescent Healthcare Services',
          null,
        )
        .subscribe();
      const t = httpMock.expectOne(
        environment.saveNurseChildAndAdloescentDetails,
      );
      expect(t.request.body.oralVitaminAProphylaxis).toEqual({
        vitA: 1,
        benVisitID: 4,
        ...COMMON,
      });
      t.flush({});
    });

    function opdForm() {
      return g({
        patientVisitForm: visitForm(),
        patientVitalsForm: vitalsForm(),
        patientHistoryForm: fullHistoryForm(),
        patientExaminationForm: f(examinationValue()),
        patientPNCForm: f({
          deliveryPlace: { deliveryPlaceID: 1, deliveryPlace: 'Home' },
        }),
      });
    }

    it('postNurseGeneralOPDVisitForm posts OPD payload with history and examination', () => {
      service
        .postNurseGeneralOPDVisitForm(
          opdForm(),
          'General OPD',
          {},
          { tc: true },
        )
        .subscribe();
      const t = httpMock.expectOne(environment.saveNurseGeneralOPDDetails);
      const body = t.request.body;
      expect(body.historyDetails.perinatalHistroy.placeOfDelivery).toBe('Home');
      expect(body.examinationDetails.gastroIntestinalExamination.gi).toBe(1);
      expect(body.tcRequest).toEqual({ tc: true });
      t.flush({});
    });

    it('postNurseNCDCareVisitForm posts NCD care payload', () => {
      service
        .postNurseNCDCareVisitForm(opdForm(), 'NCD care', {}, null)
        .subscribe();
      const t = httpMock.expectOne(environment.saveNurseNCDCareDetails);
      expect(t.request.body.visitDetails.investigation).toBeDefined();
      expect(t.request.body.historyDetails.pastHistory).toBeDefined();
      expect(t.request.body.examinationDetails).toBeUndefined();
      t.flush({});
    });

    it('postNurseCovidVisitForm posts covid payload', () => {
      service
        .postNurseCovidVisitForm(opdForm(), 'COVID-19 Screening', {}, null)
        .subscribe();
      const t = httpMock.expectOne(environment.saveNurseCovidDetails);
      expect(t.request.body.visitDetails.covidDetails.symptom).toBe('cough');
      t.flush({});
    });

    it('postNursePNCVisitForm posts PNC payload using beneficiary age', () => {
      service
        .postNursePNCVisitForm(opdForm(), 'PNC', { ageVal: 12 }, null)
        .subscribe();
      const t = httpMock.expectOne(environment.savePNCNurseDetailsUrl);
      const body = t.request.body;
      expect(body.pNCDeatils.deliveryPlaceID).toBe(1);
      expect(body.historyDetails.childVaccineDetails).toBeDefined();
      expect(body.examinationDetails.gastroIntestinalExamination).toBeDefined();
      t.flush({});
    });

    describe('saveBenCovidVaccinationDetails', () => {
      it('includes covidVSID and modifiedBy when present', () => {
        service
          .saveBenCovidVaccinationDetails(
            f({
              covidVSID: 4,
              vaccineStatus: 'yes',
              vaccineTypes: 1,
              doseTaken: 2,
            }),
          )
          .subscribe();
        const t = httpMock.expectOne(
          environment.saveCovidVaccinationDetailsUrl,
        );
        expect(t.request.body).toEqual({
          covidVSID: 4,
          beneficiaryRegID: 123,
          vaccineStatus: 'yes',
          covidVaccineTypeID: 1,
          doseTypeID: 2,
          providerServiceMapID: 11,
          createdBy: 'nurse1',
          facilityID: 7,
          parkingPlaceID: 9,
          modifiedBy: 'nurse1',
        });
        t.flush({});
      });

      it('sends null covidVSID and no modifiedBy when absent', () => {
        service
          .saveBenCovidVaccinationDetails(
            f({
              covidVSID: null,
              vaccineStatus: 'no',
              vaccineTypes: null,
              doseTaken: null,
            }),
          )
          .subscribe();
        const t = httpMock.expectOne(
          environment.saveCovidVaccinationDetailsUrl,
        );
        expect(t.request.body.covidVSID).toBeNull();
        expect(t.request.body.modifiedBy).toBeUndefined();
        expect(t.request.body.vaccineStatus).toBe('no');
        t.flush({});
      });
    });

    describe('postNCDScreeningForm', () => {
      function diseaseGroup() {
        return new FormGroup({
          confirmed: new FormControl(null),
          suspected: new FormControl(true),
        });
      }
      function ncdForm(): any {
        return g({
          patientVisitForm: visitForm(),
          patientVitalsForm: vitalsForm(),
          patientHistoryForm: fullHistoryForm(),
          idrsScreeningForm: f({ idrsScore: 30 }),
          diabetes: diseaseGroup(),
          hypertension: diseaseGroup(),
          oral: diseaseGroup(),
          breast: diseaseGroup(),
          cervical: diseaseGroup(),
        });
      }

      it('IDRS flow removes disease controls and posts idrs details', () => {
        const form = ncdForm();
        service
          .postNCDScreeningForm(form, 'NCD screening', {}, null, true)
          .subscribe();
        expect(form.controls.diabetes).toBeUndefined();
        expect(form.controls.cervical).toBeUndefined();
        const t = httpMock.expectOne(environment.postNCDScreeningDetails);
        const body = t.request.body;
        expect(body.idrsDetails).toEqual({
          idrsScore: 30,
          benVisitID: null,
          ...COMMON,
        });
        expect(body.visitDetails.visitDetails.chiefComplaints).toBeUndefined();
        expect(body.historyDetails.physicalActivityHistory).toBeDefined();
        expect(body.facilityID).toBe(7);
        expect(service.ncdScreeningidrsDetails.idrsScore).toBe(30);
        t.flush({});
      });

      it('CBAC flow sets confirmed flags, removes idrs/chief complaints and posts diseases', () => {
        ncd.isDiabetesConfirmed = true;
        ncd.isHypertensionConfirmed = false;
        ncd.isOralConfirmed = true;
        ncd.isBreastConfirmed = false;
        ncd.isCervicalConfirmed = true;
        const form = ncdForm();
        service
          .postNCDScreeningForm(form, 'NCD screening', {}, null, false)
          .subscribe();
        expect(form.controls.idrsScreeningForm).toBeUndefined();
        expect(
          form.controls.patientVisitForm.controls.patientChiefComplaintsForm,
        ).toBeUndefined();
        const t = httpMock.expectOne(environment.postNCDScreeningDetails);
        const body = t.request.body;
        expect(body.cbac).toEqual({ cbac: 1 });
        expect(body.diabetes).toEqual({ confirmed: true, suspected: true });
        expect(body.hypertension.confirmed).toBeFalse();
        expect(body.oral.confirmed).toBeTrue();
        expect(body.breast.confirmed).toBeFalse();
        expect(body.cervical.confirmed).toBeTrue();
        expect(Object.keys(body.historyDetails)).toEqual(['personalHistory']);
        expect(service.ncdScreeningidrsDetails).toBeNull();
        t.flush({});
      });
    });
  });
});
