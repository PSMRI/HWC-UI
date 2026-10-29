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
import { of } from 'rxjs';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { ConfirmationService } from 'src/app/app-modules/core/services/confirmation.service';
import { RegistrarService } from 'src/app/app-modules/registrar/shared/services/registrar.service';
import { DoctorService } from '../../../shared/services/doctor.service';
import { MasterdataService } from '../../../shared/services/masterdata.service';
import { CDSSService } from '../../../shared/services/cdss-service';
import { environment } from 'src/environments/environment';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';
import { DoctorDiagnosisCaseSheetComponent } from './doctor-diagnosis-case-sheet.component';

const E = environment as any;

function baseData(): any {
  return {
    BeneficiaryData: { ben_age_val: 10 },
    nurseData: {
      vitals: {
        benAnthropometryDetail: { weight: 60 },
        benPhysicalVitalDetail: { pulse: 70 },
      },
    },
    doctorData: { diagnosis: {} },
  };
}

function fullData(): any {
  return {
    BeneficiaryData: {
      ben_age_val: 30,
      benVisitDate: '2024-03-05T09:08:07',
      consultationDate: '2024-03-06T10:11:12',
      doctorSignatureFlag: true,
      tCSpecialistUserID: 0,
    },
    nurseData: {
      covidDetails: {
        symptom: ['Fever'],
        contactStatus: ['Yes'],
        travelStatus: true,
        suspectedStatusUI: 'Suspected',
        recommendation: [['Isolate', 'Test']],
      },
      diabetes: { confirmed: true },
      hypertension: { confirmed: true },
      oral: { confirmed: true },
      cervical: { confirmed: true },
      breast: { confirmed: true },
      vitals: {
        benAnthropometryDetail: { weight: 60, createdDate: 'd' },
        benPhysicalVitalDetail: { rbsTestResult: 150, rbsTestRemarks: 'ok' },
      },
      anc: { a: 1 },
      idrs: {
        IDRSDetail: {
          idrsDetails: [
            { idrsQuestionId: 1, answer: 'yes' },
            { idrsQuestionId: 1, answer: 'yes' },
            { idrsQuestionId: 2, answer: 'no' },
          ],
          suspectedDisease: 'Diabetes,Asthma',
          confirmedDisease: 'Epilepsy',
        },
      },
      fpNurseVisitData: { fp: 1 },
      cdss: {
        presentChiefComplaint: { presentChiefComplaint: 'cough' },
        diseaseSummary: { diseaseSummary: null },
      },
    },
    doctorData: {
      diagnosis: {
        doctorDiagnonsis: 'Flu',
        createdBy: 'drx',
        ncdScreeningCondition: 'Diabetes||Hypertension',
        complicationOfCurrentPregnancy: 'Anemia, Other-complications : null',
      },
      LabReport: [{ procedureName: 'Hb' }],
      treatmentsOnSideEffects: 'rest',
      counsellingProvidedList: ['c1'],
      Refer: { revisitDate: '05/03/2024' },
    },
  };
}

describe('DoctorDiagnosisCaseSheetComponent', () => {
  let component: DoctorDiagnosisCaseSheetComponent;
  let http: any;
  let doctor: any;
  let registrar: any;
  let master: any;
  let confirm: any;

  function setup(session: Record<string, any> = {}) {
    TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [DoctorDiagnosisCaseSheetComponent],
      providers: [
        ...commonTestProviders({ session }),
        { provide: DoctorService, useValue: autoSpy(DoctorService) },
        { provide: RegistrarService, useValue: autoSpy(RegistrarService) },
        { provide: MasterdataService, useValue: autoSpy(MasterdataService) },
        { provide: CDSSService, useValue: autoSpy(CDSSService) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    // The 1.7k-line print template needs the complete case-sheet payload; class logic is tested here.
    TestBed.overrideTemplate(DoctorDiagnosisCaseSheetComponent, '');
    const fixture = TestBed.createComponent(DoctorDiagnosisCaseSheetComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpServiceService);
    doctor = TestBed.inject(DoctorService);
    registrar = TestBed.inject(RegistrarService);
    master = TestBed.inject(MasterdataService);
    confirm = TestBed.inject(ConfirmationService);
    spyOn(component, 'showSign');
    return fixture;
  }

  beforeEach(() => {
    spyOn(console, 'log');
    spyOn(console, 'error');
  });

  describe('ngOnInit', () => {
    it('loads language, visit category, HRP and ABHA details', () => {
      const fixture = setup({
        caseSheetVisitCategory: 'General OPD',
        caseSheetBeneficiaryRegID: 'B9',
        visitCode: 'VC1',
      });
      doctor.getHRPDetails.and.returnValue(
        of({ statusCode: 200, data: { isHRP: true } }),
      );
      registrar.getHealthIdDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            BenHealthDetails: [
              { healthId: 'h1' },
              { healthId: null },
              { healthId: 'h2' },
            ],
          },
        }),
      );
      fixture.detectChanges();
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
      expect(component.visitCategory).toBe('General OPD');
      expect(doctor.getHRPDetails).toHaveBeenCalledWith('B9', 'VC1');
      expect(component.showHRP).toBe('true');
      expect(registrar.getHealthIdDetails).toHaveBeenCalledWith({
        beneficiaryRegID: 'B9',
        beneficiaryID: null,
      });
      expect(component.healthIDValue).toBe('h1,h2');
    });

    it('prefers beneficiaryRegID and handles non-HRP / empty ABHA', () => {
      const fixture = setup({ beneficiaryRegID: 'B1' });
      doctor.getHRPDetails.and.returnValue(
        of({ statusCode: 200, data: { isHRP: false } }),
      );
      registrar.getHealthIdDetails.and.returnValue(
        of({ statusCode: 200, data: { BenHealthDetails: [] } }),
      );
      fixture.detectChanges();
      expect(component.showHRP).toBe('false');
      expect(registrar.getHealthIdDetails).toHaveBeenCalledWith({
        beneficiaryRegID: 'B1',
        beneficiaryID: null,
      });
      expect(component.healthIDValue).toBe('');
    });

    it('ignores HRP failure and ABHA response without details', () => {
      const fixture = setup();
      doctor.getHRPDetails.and.returnValue(of({ statusCode: 500 }));
      registrar.getHealthIdDetails.and.returnValue(
        of({ statusCode: 200, data: { BenHealthDetails: null } }),
      );
      fixture.detectChanges();
      expect(component.showHRP).toBeUndefined();
      expect(component.benDetails).toBeUndefined();
    });

    it('alerts on ABHA non-200 and error', () => {
      setup();
      component.current_language_set = LANGUAGE_EN;
      registrar.getHealthIdDetails.and.returnValue(of({ statusCode: 500 }));
      component.getHealthIDDetails();
      registrar.getHealthIdDetails.and.returnValue(throwingObs());
      component.getHealthIDDetails();
      expect(confirm.alert).toHaveBeenCalledTimes(2);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.issueInGettingBeneficiaryABHADetails,
        'error',
      );
    });
  });

  describe('ngOnChanges', () => {
    it('maps full data for a regular visit', () => {
      setup();
      doctor.getUserId.and.returnValue(of({ userId: 42 }));
      doctor.downloadSign.and.returnValue(of(new Blob(['sig'])));
      component.visitCategory = 'Neonatal and Infant Health Care Services';
      component.casesheetData = fullData();
      component.ngOnChanges();
      expect(component.userName).toBe('drx');
      expect(component.confirmScreeningArray).toEqual([
        E.diabetes,
        E.hypertension,
        E.oral,
        E.cervical,
        E.breast,
      ]);
      expect(component.diagnosisFlag).toBeTrue();
      expect(component.doctorDiagnosis).toBe('Flu');
      expect(component.symptomsList).toEqual(['Fever']);
      expect(component.symptomFlag).toBeTrue();
      expect(component.contactFlag).toBeTrue();
      expect(component.travelStatus).toBe('Yes');
      expect(component.suspected).toBe('Suspected');
      expect(component.recommendationText).toBe('Isolate\nTest');
      expect(component.beneficiaryDetails.benVisitDate).toBe(
        '05/03/2024 09:08:07',
      );
      expect(component.beneficiaryDetails.consultationDate).toBe(
        '06/03/2024 10:11:12',
      );
      expect(component.ncdScreeningCondition).toBe('Diabetes,Hypertension');
      expect(component.enableClinicalObv).toBeTrue();
      expect(component.caseRecords.LabReport.length).toBe(2);
      expect(component.caseRecords.LabReport[0].procedureName).toBe('RBS Test');
      expect(component.tempComplication).toBeTrue();
      expect(component.newComp).toBe('Anemia');
      expect(component.ancDetails).toEqual({ a: 1 });
      expect(component.enableIDRSForm).toBeTrue();
      expect(component.temp1.length).toBe(1);
      expect(component.suspect).toEqual(['Diabetes', 'Asthma']);
      expect(component.suspectt).toEqual(['Epilepsy']);
      expect(component.visitDetailsCasesheet).toEqual({ fp: 1 });
      expect(component.followUpCaseTreatment).toBe('rest');
      expect(component.currentVitalsCasesheet.weight).toBe(60);
      expect(component.counsellingProvidedDetails).toEqual(['c1']);
      expect(component.isCdssStatus).toBeTrue();
      expect(component.referDetails).toBeUndefined();
      expect(doctor.getUserId).toHaveBeenCalledWith('drx');
      expect(doctor.downloadSign).toHaveBeenCalledWith(42);
      expect(component.showSign).toHaveBeenCalled();
      expect(master.getVaccinationTypeAndDoseMaster).toHaveBeenCalled();
    });

    it('maps General OPD (QC) records, referral lists and revisit date', () => {
      setup();
      component.visitCategory = 'General OPD (QC)';
      const data = baseData();
      data.doctorData = {
        findings: { f: 1 },
        prescription: [{ p: 1 }],
        LabReport: [],
        diagnosis: {
          diagnosisProvided: 'dx',
          instruction: 'ins',
          externalInvestigation: 'ext',
          counsellingProvided: ['cp'],
        },
        Refer: {
          refrredToAdditionalServiceList: ['S1', null, 'S2'],
          referralReason: ['R1', 'R2'],
          revisitDate: '2024-03-05T00:00:00',
        },
        counsellingProvidedList: ['ignored'],
      };
      component.casesheetData = data;
      component.ngOnChanges();
      expect(component.caseRecords).toEqual({
        findings: { f: 1 },
        prescription: [{ p: 1 }],
        diagnosis: {
          provisionalDiagnosis: 'dx',
          specialistAdvice: 'ins',
          externalInvestigation: 'ext',
        },
        LabReport: [],
      });
      expect(component.counsellingProvidedDetails).toEqual(['cp']);
      expect(component.serviceList).toBe('S1,S2');
      expect(component.referralReasonList).toBe('R1,R2');
      expect(component.referDetails.revisitDate).toBe('05/03/2024');
    });

    it('QC visit without refer details', () => {
      setup();
      component.visitCategory = 'General OPD (QC)';
      const data = baseData();
      data.doctorData = { diagnosis: {} };
      component.casesheetData = data;
      component.ngOnChanges();
      expect(component.serviceList).toBe('');
      expect(component.counsellingProvidedDetails).toBeUndefined();
    });

    it('NCD screening disables clinical sections; minimal data paths', () => {
      setup();
      component.visitCategory = 'NCD screening';
      const data = baseData();
      data.nurseData.covidDetails = {
        contactStatus: [],
        travelStatus: false,
      };
      data.nurseData.idrs = { IDRSDetail: null };
      data.nurseData.cdss = { presentChiefComplaint: null };
      data.doctorData.diagnosis.complicationOfCurrentPregnancy = 'Anemia';
      component.casesheetData = data;
      component.ngOnChanges();
      expect(component.enableClinicalObv).toBeFalse();
      expect(component.enableSignificantFindigs).toBeFalse();
      expect(component.enableCheifComplaints).toBeFalse();
      expect(component.contactFlag).toBeFalse();
      expect(component.travelFlag).toBeTrue();
      expect(component.travelStatus).toBe('No');
      expect(component.tempComplication).toBeFalse();
      expect(component.enableIDRSForm).toBeFalse();
      expect(component.isCdssStatus).toBeFalse();
      expect(component.confirmScreeningArray).toEqual([]);
      expect(component.ncdScreeningCondition).toBeNull();
      expect(component.currentVitals).toEqual({ weight: 60, pulse: 70 });
      expect(master.getVaccinationTypeAndDoseMaster).not.toHaveBeenCalled();
    });

    it('unknown travel status and IDRS without suspected/confirmed', () => {
      setup();
      const data = baseData();
      data.nurseData.covidDetails = { travelStatus: 'maybe' };
      data.nurseData.idrs = { IDRSDetail: { idrsDetails: [] } };
      component.casesheetData = data;
      component.ngOnChanges();
      expect(component.travelFlag).toBeFalse();
      expect(component.enableIDRSForm).toBeTrue();
      expect(component.suspect).toEqual([]);
    });

    it('uses TC specialist id for signature when present', () => {
      setup();
      doctor.getUserId.and.returnValue(of({}));
      doctor.downloadSign.and.returnValue(of(new Blob(['x'])));
      component.beneficiaryDetails = { tCSpecialistUserID: 77 };
      component.downloadSign();
      expect(doctor.downloadSign).toHaveBeenCalledWith(77);
    });

    it('logs signature download errors', () => {
      setup();
      doctor.getUserId.and.returnValue(of(null));
      doctor.downloadSign.and.returnValue(throwingObs('e'));
      component.downloadSign();
      expect(doctor.downloadSign).toHaveBeenCalledWith(null);
      expect(console.error).toHaveBeenCalledWith(
        'Error downloading signature:',
        'e',
      );
      expect(component.showSign).not.toHaveBeenCalled();
    });

    it('does nothing without case sheet data', () => {
      setup();
      component.casesheetData = undefined;
      component.ngOnChanges();
      expect(component.beneficiaryDetails).toBeUndefined();
      expect(component.ncdScreeningCondition).toBeNull();
    });
  });

  it('showSign converts blob to data url', async () => {
    setup();
    (component.showSign as jasmine.Spy).and.callThrough();
    component.showSign(new Blob(['abc'], { type: 'text/plain' }));
    await new Promise((r) => setTimeout(r, 50));
    expect(String(component.imgUrl)).toContain('data:text/plain');
  });

  it('padLeft pads single digits', () => {
    setup();
    expect(component.padLeft.apply(7 as any)).toBe('07');
    expect(String(component.padLeft.apply(2024 as any))).toBe('2024');
  });

  it('falls back to session language', () => {
    setup({ currentLanguageSet: { s: 1 } });
    http.appCurrentLanguge.next(undefined);
    component.ngDoCheck();
    expect(component.current_language_set).toEqual({ s: 1 });
  });

  describe('covid vaccination', () => {
    beforeEach(() => {
      setup({ caseSheetBeneficiaryRegID: 'B5' });
      component.beneficiaryDetails = { ben_age_val: 20 };
    });

    it('maps previous vaccination with dose and vaccine types', () => {
      master.getVaccinationTypeAndDoseMaster.and.returnValue(
        of({
          statusCode: 200,
          data: {
            doseType: [{ covidDoseTypeID: 1 }, { covidDoseTypeID: 2 }],
            vaccineType: [{ covidVaccineTypeID: 3 }],
          },
        }),
      );
      master.getPreviousCovidVaccinationDetails.and.returnValue(
        of({
          statusCode: 200,
          data: { covidVSID: 9, doseTypeID: 2, covidVaccineTypeID: 3 },
        }),
      );
      component.getVaccinationTypeAndDoseMaster();
      expect(master.getPreviousCovidVaccinationDetails).toHaveBeenCalledWith(
        'B5',
      );
      expect(component.covidVaccineDetails.doseTypeID).toEqual([
        { covidDoseTypeID: 2 },
      ]);
      expect(component.covidVaccineDetails.covidVaccineTypeID).toEqual([
        { covidVaccineTypeID: 3 },
      ]);
    });

    it('keeps raw vaccination data without type ids', () => {
      master.getVaccinationTypeAndDoseMaster.and.returnValue(
        of({ statusCode: 200, data: { doseType: [], vaccineType: [] } }),
      );
      master.getPreviousCovidVaccinationDetails.and.returnValue(
        of({ statusCode: 200, data: { covidVSID: 9, doseTypeID: null } }),
      );
      component.getVaccinationTypeAndDoseMaster();
      expect(component.covidVaccineDetails).toEqual({
        covidVSID: 9,
        doseTypeID: null,
      });
    });

    it('ignores previous vaccination without id, non-200 and errors', () => {
      master.getPreviousCovidVaccinationDetails.and.returnValue(
        of({ statusCode: 200, data: {} }),
      );
      component.getPreviousCovidVaccinationDetails([], []);
      master.getPreviousCovidVaccinationDetails.and.returnValue(
        of({ statusCode: 500 }),
      );
      component.getPreviousCovidVaccinationDetails([], []);
      master.getPreviousCovidVaccinationDetails.and.returnValue(
        throwingObs({ errorMessage: 'x' }),
      );
      component.getPreviousCovidVaccinationDetails([], []);
      expect(component.covidVaccineDetails).toBeUndefined();
      expect(console.log).toHaveBeenCalledWith('error', 'x');
    });

    it('master non-200, no data and error', () => {
      master.getVaccinationTypeAndDoseMaster.and.returnValue(
        of({ statusCode: 500 }),
      );
      component.getVaccinationTypeAndDoseMaster();
      master.getVaccinationTypeAndDoseMaster.and.returnValue(
        of({ statusCode: 200, data: null }),
      );
      component.getVaccinationTypeAndDoseMaster();
      master.getVaccinationTypeAndDoseMaster.and.returnValue(
        throwingObs({ errorMessage: 'm' }),
      );
      component.getVaccinationTypeAndDoseMaster();
      expect(master.getPreviousCovidVaccinationDetails).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('error', 'm');
    });

    it('skips for beneficiaries under 12 or missing', () => {
      component.beneficiaryDetails = { ben_age_val: 8 };
      component.getVaccinationTypeAndDoseMaster();
      component.beneficiaryDetails = null;
      component.getVaccinationTypeAndDoseMaster();
      expect(master.getVaccinationTypeAndDoseMaster).not.toHaveBeenCalled();
    });
  });
});
