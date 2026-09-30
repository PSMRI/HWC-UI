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
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { IdrsscoreService } from './idrsscore.service';

describe('IdrsscoreService', () => {
  let service: IdrsscoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [IdrsscoreService],
    });
    service = TestBed.inject(IdrsscoreService);
    spyOn(console, 'log');
  });

  it('has default flags', () => {
    expect(service.finalHypertension).toBeFalse();
    expect(service.visualAcuityTestInMMU).toBe(1);
    expect(service.diabetesNotPresentInMMU).toBe(0);
    expect(service.IDRSFamilyScore.value).toBeNull();
  });

  it('filter emits to listen()', () => {
    const got: any[] = [];
    service.listen().subscribe((v) => got.push(v));
    service.filter('x');
    expect(got).toEqual(['x']);
  });

  // [method, arg, subject, expected emitted, property, expected property]
  const cases: Array<[string, any, string, any, string | null, any]> = [
    ['setIDRSFamilyScore', 10, 'IDRSFamilyScore', 10, 'IRDSscore', 10],
    ['setConfirmedDisease', 'd', 'confirmed', 'd', 'confirmedValue', 'd'],
    ['setIDRSScoreWaist', 20, 'IDRSWaistScore', 20, 'IRDSscoreWaist', 20],
    [
      'setIRDSscorePhysicalActivity',
      30,
      'IDRSPhysicalActivityScore',
      30,
      'IRDSscorePhysicalActivity',
      30,
    ],
    [
      'setIDRSScoreFlag',
      undefined,
      'IDRSScoreFlagCheck',
      1,
      'IDRSScoreFlag',
      1,
    ],
    ['clearScoreFlag', undefined, 'IDRSScoreFlagCheck', 0, 'IDRSScoreFlag', 0],
    [
      'setSuspectedArrayValue',
      undefined,
      'IDRSSuspectedFlag',
      1,
      'IDRSSuspected',
      1,
    ],
    [
      'clearSuspectedArrayFlag',
      undefined,
      'IDRSSuspectedFlag',
      0,
      'IDRSSuspected',
      0,
    ],
    [
      'setDiabetesSelected',
      undefined,
      'diabetesSelectedFlag',
      1,
      'diabetesSelected',
      1,
    ],
    [
      'clearDiabetesSelected',
      undefined,
      'diabetesSelectedFlag',
      0,
      'diabetesSelected',
      0,
    ],
    [
      'setVisualAcuityTestMandatoryFlag',
      undefined,
      'VisualAcuityTestMandatoryFlag',
      1,
      'VisualAcuityTestMandatory',
      1,
    ],
    [
      'clearVisualAcuityTestMandatoryFlag',
      undefined,
      'VisualAcuityTestMandatoryFlag',
      0,
      'VisualAcuityTestMandatory',
      0,
    ],
    ['setSystolicBp', 120, 'systolicBpValue', 120, 'systolicBp', 120],
    ['clearSystolicBp', undefined, 'systolicBpValue', 0, 'systolicBp', 0],
    ['setDiastolicBp', 80, 'diastolicBpValue', 80, 'diastolicBp', 80],
    ['clearDiastolicBp', undefined, 'diastolicBpValue', 0, 'diastolicBp', 0],
    ['rBSPresentInMaster', undefined, 'rBSPresentFlag', 1, 'rBSPresent', 1],
    [
      'visualAcuityPresentInMaster',
      undefined,
      'visualAcuityPresentFlag',
      1,
      'visualAcuityPresent',
      1,
    ],
    [
      'haemoglobinPresentInMaster',
      undefined,
      'heamoglobinPresentFlag',
      1,
      'heamoglobinPresent',
      1,
    ],
    [
      'setReferralSuggested',
      undefined,
      'referralSuggestedFlag',
      1,
      'referralSuggested',
      1,
    ],
    [
      'clearReferralSuggested',
      undefined,
      'referralSuggestedFlag',
      0,
      'referralSuggested',
      0,
    ],
    [
      'setDiseasesSelected',
      ['Diabetes'],
      'visitDiseases',
      ['Diabetes'],
      null,
      null,
    ],
    ['clearDiseaseSelected', undefined, 'visitDiseases', null, null, null],
    ['setUnchecked', ['Oral'], 'uncheckedDiseases', ['Oral'], null, null],
    ['clearUnchecked', undefined, 'uncheckedDiseases', null, null, null],
    [
      'enableDiseaseConfirmation',
      true,
      'enableDiseaseConfirmationOnCaseRecord',
      true,
      'enableDiagnosis',
      true,
    ],
    [
      'setHypertensionSelected',
      undefined,
      'hypertensionSelectedFlag',
      1,
      'hypertensionSelected',
      1,
    ],
    [
      'clearHypertensionSelected',
      undefined,
      'hypertensionSelectedFlag',
      0,
      'hypertensionSelected',
      0,
    ],
    [
      'finalDiagnosisDiabetesConfirm',
      true,
      'finalDiagnosisDiseaseconfirm',
      true,
      null,
      null,
    ],
    [
      'finalDiagnosisHypertensionConfirm',
      true,
      'finalDiagnosisHypertensionConfirmation',
      true,
      'finalHypertension',
      true,
    ],
    [
      'setConfirmedDiabeticSelected',
      undefined,
      'confirmedDiabeticSelectedFlag',
      1,
      'confirmedDiabeticSelected',
      1,
    ],
    [
      'clearConfirmedDiabeticSelected',
      undefined,
      'confirmedDiabeticSelectedFlag',
      0,
      'confirmedDiabeticSelected',
      0,
    ],
    ['rbsTestResultsInVitals', 210, 'rbsResultsFromVitals', 210, null, null],
  ];

  cases.forEach(([method, arg, subject, emitted, prop, propVal]) => {
    it(`${method} emits ${JSON.stringify(emitted)} on ${subject}`, () => {
      const s = service as any;
      if (subject === 'visitDiseases' || subject === 'uncheckedDiseases') {
        s[subject].next('seed');
      }
      let last: any = 'unset';
      s[subject + '$'].subscribe((v: any) => (last = v));
      s[method](arg);
      expect(last).toEqual(emitted);
      if (prop) expect(s[prop]).toEqual(propVal);
    });
  });

  it('clearMessage resets family, waist and physical activity scores to 0', () => {
    service.setIDRSFamilyScore(1);
    service.setIDRSScoreWaist(2);
    service.setIRDSscorePhysicalActivity(3);
    service.clearMessage();
    expect(service.IDRSFamilyScore.value).toBe(0);
    expect(service.IDRSWaistScore.value).toBe(0);
    expect(service.IDRSPhysicalActivityScore.value).toBe(0);
  });
});
