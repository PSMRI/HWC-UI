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
import { BehaviorSubject, of, Subject } from 'rxjs';

import { TravelHistoryComponent } from './travel-history.component';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../shared/services';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { MaterialModule } from 'src/app/app-modules/core/material.module';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('TravelHistoryComponent', () => {
  let component: TravelHistoryComponent;
  let fixture: ComponentFixture<TravelHistoryComponent>;
  let doctor: any;
  let nurse: any;
  let session: any;
  let http: any;
  let masterData$: BehaviorSubject<any>;
  let masterListen$: Subject<any>;

  const RECOMMENDATIONS = Array.from({ length: 15 }, (_, i) => ({
    CovidrecommendationID: i + 1,
    recommendation: `R${i + 1}`,
  }));

  function buildForm(): FormGroup {
    const fb = new FormBuilder();
    return fb.group({
      travelStatus: [null],
      travelList: fb.array([]),
      recommendation: fb.array([]),
      suspectedStatusUI: [null],
      modeOfTravelDomestic: [null],
      fromStateDom: [null],
      fromDistrictDom: [null],
      fromSubDistrictDom: [null],
      toStateDom: [null],
      toDistrictDom: [null],
      toSubDistrictDom: [null],
      modeOfTravelInter: [null],
      fromCountryInter: [null],
      fromCityInter: [null],
      toCountryInter: [null],
      toCityInter: [null],
    });
  }

  async function setup(seed: Record<string, any> = {}) {
    masterData$ = new BehaviorSubject<any>({
      covidRecommendationMaster: RECOMMENDATIONS,
    });
    masterListen$ = new Subject<any>();
    const masterMock: any = autoSpy(MasterdataService, {
      nurseMasterData$: masterData$,
    });
    masterMock.listen.and.returnValue(masterListen$);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [TravelHistoryComponent],
      providers: [
        ...commonTestProviders({ session: seed }),
        { provide: DoctorService, useValue: autoSpy(DoctorService) },
        { provide: NurseService, useValue: autoSpy(NurseService) },
        { provide: MasterdataService, useValue: masterMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(TravelHistoryComponent);
    component = fixture.componentInstance;
    component.patientCovidForm = buildForm();
    doctor = TestBed.inject(DoctorService) as any;
    nurse = TestBed.inject(NurseService) as any;
    session = TestBed.inject(SessionStorageService) as any;
    http = TestBed.inject(HttpServiceService) as any;
    nurse.getCountryName.and.returnValue(
      of({ statusCode: 200, data: [{ countryID: 1 }] }),
    );
    nurse.getStateName.and.returnValue(
      of({ statusCode: 200, data: [{ stateID: 5 }] }),
    );
    nurse.getCityName.and.returnValue(
      of({ statusCode: 200, data: [{ cityID: 9 }] }),
    );
    nurse.getDistrictName.and.returnValue(
      of({ statusCode: 200, data: [{ districtID: 3 }] }),
    );
    nurse.getSubDistrictName.and.returnValue(
      of({ statusCode: 200, data: [{ blockID: 4 }] }),
    );
  }

  const recIds = () =>
    (component.patientCovidForm.controls['recommendation'] as FormArray)
      .value[0];

  describe('default', () => {
    beforeEach(async () => {
      await setup({ visitID: 'V1', beneficiaryRegID: 'B1' });
      fixture.detectChanges();
    });

    it('should init masters, language and travel types', () => {
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.domestictype).toEqual([
        'Bus',
        'Flight',
        'Train',
        'Ship',
      ]);
      expect(component.internationaltype).toEqual(['Flight', 'Ship']);
      expect(nurse.getStateName).toHaveBeenCalledWith(1);
      expect(component.states).toEqual([{ stateID: 5 }]);
      expect(component.countries).toEqual([{ countryID: 1 }]);
      expect(component.recommendationMaster.length).toBe(15);
      expect(component.recommendationTemporarayList[0].length).toBe(15);
    });

    it('should ignore non-200 master responses', () => {
      nurse.getCountryName.and.returnValue(of({ statusCode: 5000 }));
      nurse.getStateName.and.returnValue(of({ statusCode: 200, data: null }));
      component.countries = [];
      component.states = [];
      component.getCountryNames();
      component.getStateNames();
      expect(component.countries).toEqual([]);
      expect(component.states).toEqual([]);
    });

    it('ngOnChanges without view/specialist does nothing', () => {
      component.ngOnChanges();
      expect(component.readTravel).toBeFalse();
      expect(doctor.getVisitComplaintDetails).not.toHaveBeenCalled();
    });

    describe('getrecommendedtext combinations', () => {
      const table: {
        q: string;
        s: string | null;
        c: string | null;
        all?: string;
        status: string | null;
        ids: string[];
      }[] = [
        {
          q: 'yes',
          s: 'true',
          c: 'true',
          status: 'YES',
          ids: ['R1', 'R2', 'R3', 'R4', 'R5'],
        },
        {
          q: 'yes',
          s: 'true',
          c: 'false',
          status: 'YES',
          ids: ['R1', 'R2', 'R3', 'R4', 'R5'],
        },
        {
          q: 'no',
          s: 'true',
          c: 'true',
          status: 'YES',
          ids: ['R1', 'R2', 'R3', 'R4', 'R5'],
        },
        {
          q: 'no',
          s: 'false',
          c: 'true',
          status: 'YES',
          ids: ['R6', 'R7', 'R8', 'R9', 'R10', 'R11'],
        },
        {
          q: 'yes',
          s: 'false',
          c: 'true',
          status: 'YES',
          ids: ['R6', 'R7', 'R8', 'R9', 'R10', 'R11'],
        },
        {
          q: 'yes',
          s: 'false',
          c: 'false',
          status: 'YES',
          ids: ['R11', 'R12', 'R13'],
        },
        { q: 'no', s: 'true', c: 'false', status: 'NO', ids: ['R5', 'R14'] },
        { q: 'no', s: 'false', c: 'false', status: 'NO', ids: ['R11', 'R15'] },
        {
          q: 'x',
          s: 'null',
          c: 'null',
          all: 'true',
          status: 'YES',
          ids: ['R1', 'R2', 'R3', 'R4', 'R5'],
        },
      ];
      table.forEach((t) => {
        it(`q=${t.q} symptom=${t.s} contact=${t.c} all=${t.all}`, () => {
          session.setItem('symptom', t.s);
          session.setItem('contact', t.c);
          session.setItem('allSymptom', t.all ?? 'false');
          component.question1 = t.q;
          component.getrecommendedtext();
          expect(component.suspectedStatusUI).toBe(t.status);
          expect(recIds()).toEqual(t.ids);
          expect(component.recommendationText).toBe(t.ids.join('\n'));
          expect(component.travelReqiured).toBe(
            t.all === 'true' ? 'false' : 'true',
          );
        });
      });

      it('no match clears recommendations', () => {
        session.setItem('symptom', 'true');
        session.setItem('contact', 'true');
        component.question1 = 'yes';
        component.getrecommendedtext();
        expect(recIds()).toBeDefined();
        session.setItem('symptom', 'null');
        component.getrecommendedtext();
        expect(component.suspectedStatusUI).toBeNull();
        expect(component.recommendationText).toBeNull();
        expect(component.recommendation).toEqual([]);
      });
    });

    it('masterdata listen triggers recommendation refresh', () => {
      const spy = spyOn(component, 'getrecommendedtext');
      masterListen$.next('true');
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('http listen (contact filter) triggers recommendation refresh', () => {
      const spy = spyOn(component, 'getrecommendedtext');
      http.filter('true');
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('travelStatuschange true', () => {
      session.setItem('symptom', 'true');
      session.setItem('contact', 'true');
      component.travelStatuschange('true');
      expect(session.setItem).toHaveBeenCalledWith('travelstat', 'true');
      expect(component.travelStatus).toBe('true');
      expect(component.question1).toBe('yes');
      expect(component.istravelStatus).toBeTrue();
      expect(component.disableTravelButton).toBeFalse();
      expect(component.travelSelected).toBeTrue();
      expect(component.suspectedStatusUI).toBe('YES');
    });

    it('travelStatuschange false clears travel list and resets', () => {
      component.onChange('Domestic', true);
      component.onChange('International', true);
      component.patientCovidForm.patchValue({
        fromStateDom: 1,
        fromCountryInter: 2,
      });
      component.travelStatuschange('false');
      expect(component.question1).toBe('no');
      expect(component.istravelStatus).toBeFalse();
      expect(component.istravelModeDomestic).toBeFalse();
      expect(component.istravelModeInternatinal).toBeFalse();
      expect(
        (component.patientCovidForm.controls['travelList'] as FormArray).length,
      ).toBe(0);
      expect(component.fromStateDom).toBeNull();
      expect(component.fromCountryInter).toBeNull();
      expect(component.domtravel).toBeFalse();
    });

    it('onChange with checkbox event objects adds/removes', () => {
      component.onChange('Domestic', { target: { checked: true } });
      expect(component.istravelModeDomestic).toBeTrue();
      component.onChange('International', { target: { checked: true } });
      expect(component.istravelModeInternatinal).toBeTrue();
      component.patientCovidForm.patchValue({
        modeOfTravelDomestic: 'Bus',
        modeOfTravelInter: 'Flight',
      });
      component.onChange('Domestic', { target: { checked: false } });
      expect(component.istravelModeDomestic).toBeFalse();
      expect(component.modeOfTravelDomestic).toBeNull();
      component.onChange('International', 'unknown');
      expect(component.istravelModeInternatinal).toBeFalse();
      expect(component.modeOfTravelInter).toBeNull();
      expect(
        (component.patientCovidForm.controls['travelList'] as FormArray).length,
      ).toBe(0);
    });

    it('location lookups patch form and store results', () => {
      component.getCitiesFromInter(10);
      component.getCitiesToInter(11);
      component.GetDistrictsFromDom(12);
      component.GetDistrictsToDom(13);
      component.GetSubDistrictFromDom(14);
      component.getSubDistrictToDom(15);
      expect(nurse.getCityName).toHaveBeenCalledWith(10);
      expect(nurse.getDistrictName).toHaveBeenCalledWith(13);
      expect(nurse.getSubDistrictName).toHaveBeenCalledWith(15);
      expect(component.fromCountryInter).toBe(10);
      expect(component.toCountryInter).toBe(11);
      expect(component.fromStateDom).toBe(12);
      expect(component.toStateDom).toBe(13);
      expect(component.fromDistrictDom).toBe(14);
      expect(component.toDistrictDom).toBe(15);
      expect(component.citiesFromInter).toEqual([{ cityID: 9 }]);
      expect(component.citiesToInter).toEqual([{ cityID: 9 }]);
      expect(component.districtsFromDom).toEqual([{ districtID: 3 }]);
      expect(component.districtsToDom).toEqual([{ districtID: 3 }]);
      expect(component.subDistrictsFromDom).toEqual([{ blockID: 4 }]);
      expect(component.subDistrictsToDom).toEqual([{ blockID: 4 }]);
    });

    it('location lookups ignore non-200', () => {
      nurse.getCityName.and.returnValue(of({ statusCode: 5000 }));
      nurse.getDistrictName.and.returnValue(of({ statusCode: 5000 }));
      nurse.getSubDistrictName.and.returnValue(of({ statusCode: 5000 }));
      component.getCitiesFromInter(1);
      component.getCitiesToInter(1);
      component.GetDistrictsFromDom(1);
      component.GetDistrictsToDom(1);
      component.GetSubDistrictFromDom(1);
      component.getSubDistrictToDom(1);
      expect(component.citiesFromInter).toEqual([]);
      expect(component.citiesToInter).toEqual([]);
      expect(component.districtsFromDom).toEqual([]);
      expect(component.districtsToDom).toEqual([]);
      expect(component.subDistrictsFromDom).toEqual([]);
      expect(component.subDistrictsToDom).toEqual([]);
    });

    it('simple setters patch form / assign lists', () => {
      component.traveldomesticStatuschange('Bus');
      component.travelinternationalStatuschange('Ship');
      component.CitiesFromInter(1);
      component.CitiesToInter(2);
      component.getVillage(3);
      component.getVillageTosubDistrictDom(4);
      expect(component.modeOfTravelDomestic).toBe('Bus');
      expect(component.modeOfTravelInter).toBe('Ship');
      expect(component.fromCityInter).toBe(1);
      expect(component.toCityInter).toBe(2);
      expect(component.fromSubDistrictDom).toBe(3);
      expect(component.toSubDistrictDom).toBe(4);
      component.getAllCitySuccessHandelerFromInter(['a']);
      component.getAllCitySuccessHandelerToInter(['b']);
      component.getAllStatesSuccessHandeler(['c']);
      component.SetDistrictsFromDom(['d']);
      component.SetDistrictsTomDom(['e']);
      component.getSubDistrictSuccessHandelerFromDom(['f']);
      component.getSubDistrictSuccessHandelerToDom(['g']);
      component.getVillageSuccessHandeler(['h']);
      expect(component.citiesFromInter).toEqual(['a']);
      expect(component.citiesToInter).toEqual(['b']);
      expect(component.states).toEqual(['c']);
      expect(component.districtsFromDom).toEqual(['d']);
      expect(component.districtsToDom).toEqual(['e']);
      expect(component.subDistrictsFromDom).toEqual(['f']);
      expect(component.subDistrictsToDom).toEqual(['g']);
      expect(component.villages).toEqual(['h']);
    });

    it('travelListStatus without history does nothing', () => {
      component.covidHistoryDetails = null;
      component.travelListStatus();
      expect(component.formArray.length).toBe(0);
    });

    it('ngOnDestroy unsubscribes', () => {
      component.getHistoryDetails('B', 'V');
      const s1 = spyOn(component.covidHistory, 'unsubscribe');
      const s2 = spyOn(component.nurseMasterDataSubscription, 'unsubscribe');
      component.ngOnDestroy();
      expect(s1).toHaveBeenCalled();
      expect(s2).toHaveBeenCalled();
    });

    it('ngOnDestroy without subscriptions does not throw', () => {
      component.covidHistory = null;
      component.nurseMasterDataSubscription = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
      expect(component.covidHistory).toBeNull();
    });

    it('getHistoryDetails ignores missing covidDetails', () => {
      doctor.getVisitComplaintDetails.and.returnValue(
        of({ statusCode: 200, data: { covidDetails: null } }),
      );
      component.getHistoryDetails('B', 'V');
      expect(component.covidHistoryDetails).toBeUndefined();
    });
  });

  describe('view mode history', () => {
    beforeEach(async () => {
      await setup({ visitID: 'V1', beneficiaryRegID: 'B1' });
      fixture.detectChanges();
    });

    it('loads domestic + international history', () => {
      doctor.getVisitComplaintDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            covidDetails: {
              suspectedStatus: true,
              recommendation: [['A', 'B']],
              travelStatus: true,
              travelList: ['Domestic', 'International'],
              modeOfTravelDomestic: 'Bus',
              fromStateDom: 1,
              fromDistrictDom: 2,
              fromSubDistrictDom: 3,
              toStateDom: 4,
              toDistrictDom: 5,
              toSubDistrictDom: 6,
              modeOfTravelInter: 'Flight',
              fromCountryInter: 7,
              fromCityInter: 8,
              toCountryInter: 9,
              toCityInter: 10,
            },
          },
        }),
      );
      component.mode = 'VIEW';
      component.ngOnChanges();
      expect(component.readTravel).toBeTrue();
      expect(doctor.getVisitComplaintDetails).toHaveBeenCalledWith('B1', 'V1');
      expect(component.suspectedStatusUI).toBe('YES');
      expect(component.recommendationText).toBe('A\nB');
      expect(component.travelStatus).toBe('true');
      expect(component.istravelStatus).toBeTrue();
      expect(component.domtravel).toBeTrue();
      expect(component.intertravel).toBeTrue();
      expect(component.toSubDistrictDom).toBe(6);
      expect(component.toCityInter).toBe(10);
      expect(component.fromCityInter).toBe(8);
      expect(
        (component.patientCovidForm.controls['travelList'] as FormArray).value,
      ).toEqual(['Domestic', 'International']);
    });

    it('loads history without travel', () => {
      doctor.getVisitComplaintDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            covidDetails: {
              suspectedStatus: false,
              recommendation: [['C']],
              travelStatus: false,
              travelList: [],
            },
          },
        }),
      );
      component.getHistoryDetails('B', 'V');
      expect(component.suspectedStatusUI).toBe('NO');
      expect(component.travelStatus).toBe('false');
      expect(component.istravelModeDomestic).toBeFalse();
      expect(component.istravelModeInternatinal).toBeFalse();
    });
  });

  describe('specialist', () => {
    beforeEach(async () => {
      await setup({
        visitID: 'V2',
        beneficiaryRegID: 'B2',
        specialistFlag: '100',
      });
      fixture.detectChanges();
    });

    it('ngOnChanges fetches history and re-applies travel status', () => {
      doctor.getVisitComplaintDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            covidDetails: {
              suspectedStatus: false,
              recommendation: [['C']],
              travelStatus: true,
              travelList: ['International'],
              fromCountryInter: 7,
            },
          },
        }),
      );
      component.ngOnChanges();
      expect(component.readTravel).toBeTrue();
      expect(component.readTravel1).toBeTrue();
      expect(doctor.getVisitComplaintDetails).toHaveBeenCalledWith('B2', 'V2');
      expect(session.setItem).toHaveBeenCalledWith('travelstat', 'true');
      expect(component.question1).toBe('yes');
      expect(component.intertravel).toBeTrue();
      expect(component.domtravel).toBeFalse();
    });
  });
});
