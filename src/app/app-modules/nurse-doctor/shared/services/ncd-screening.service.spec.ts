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
import { NcdScreeningService } from './ncd-screening.service';

describe('NcdScreeningService', () => {
  let service: NcdScreeningService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [NcdScreeningService] });
    service = TestBed.inject(NcdScreeningService);
  });

  it('initial observable values are false', () => {
    const vals: any[] = [];
    service.diabetesStatus$.subscribe((v) => vals.push(v));
    service.enablingIdrs$.subscribe((v) => vals.push(v));
    service.fetchScreeningDataCheck$.subscribe((v) => vals.push(v));
    expect(vals).toEqual([false, false, false]);
    expect(service.confirmedDiseasesListCheck.value as any).toEqual([]);
  });

  const cases: Array<[string, string, any]> = [
    ['diabetesSuspectStatus', 'diabetesStatus$', true],
    ['hypertensionSuspectStatus', 'hypertensionStatus$', true],
    ['oralSuspectStatus', 'oralStatus$', true],
    ['breastSuspectStatus', 'breastStatus$', true],
    ['cervicalSuspectStatus', 'cervicalStatus$', true],
    ['enableHistoryScreenOnIdrs', 'enablingIdrs$', true],
    ['enableDiseaseConfirmationScreen', 'enableDiseaseConfirmForm$', true],
    [
      'setConfirmedDiseasesForScreening',
      'confirmedDiseasesListCheck$',
      ['Diabetes'],
    ],
    ['disableViatlsFormOnCbac', 'enablingScreeningDiseases$', true],
    [
      'enableHistoryFormAfterInitialization',
      'enableHistoryFormafterFormInit$',
      true,
    ],
    ['checkIfCbac', 'enablingScreeningDiseases$', 'cbac'],
    ['screeningValueChanged', 'valueChangedForNCD$', true],
    ['setScreeningDataFetch', 'fetchScreeningDataCheck$', true],
  ];

  cases.forEach(([method, obs, value]) => {
    it(`${method} emits on ${obs}`, () => {
      let last: any;
      (service as any)[obs].subscribe((v: any) => (last = v));
      (service as any)[method](value);
      expect(last).toEqual(value);
    });
  });

  it('clearDiseaseConfirmationScreenFlag resets flag and emits false', () => {
    service.enableDiseaseConfirm = true;
    service.enableDiseaseConfirmationScreen(true);
    service.clearDiseaseConfirmationScreenFlag();
    expect(service.enableDiseaseConfirm).toBeFalse();
    expect(service.enableDiseaseConfirmForm.value).toBeFalse();
  });

  it('clearConfirmedDiseasesForScreening resets list and emits false', () => {
    service.confirmedDiseasesLists = ['x'];
    service.setConfirmedDiseasesForScreening(['x']);
    service.clearConfirmedDiseasesForScreening();
    expect(service.confirmedDiseasesLists).toEqual([]);
    expect(service.confirmedDiseasesListCheck.value).toBeFalse();
  });
});
