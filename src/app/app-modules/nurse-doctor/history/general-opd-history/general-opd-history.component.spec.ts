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
import { FormGroup } from '@angular/forms';
import { BehaviorSubject, of } from 'rxjs';

import { GeneralOpdHistoryComponent } from './general-opd-history.component';
import {
  BeneficiaryDetailsService,
  ConfirmationService,
} from 'src/app/app-modules/core/services';
import { DoctorService } from '../../shared/services';
import { NcdScreeningService } from '../../shared/services/ncd-screening.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import {
  COMMON_TEST_IMPORTS,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

const SECTIONS = [
  'pastHistory',
  'comorbidityHistory',
  'medicationHistory',
  'personalHistory',
  'familyHistory',
  'menstrualHistory',
  'perinatalHistory',
  'pastObstericHistory',
  'immunizationHistory',
  'otherVaccines',
  'feedingHistory',
  'developmentHistory',
  'physicalActivityHistory',
  'generalPersonalHistory',
];

function buildHistoryForm() {
  const controls: any = {};
  SECTIONS.forEach((s) => (controls[s] = new FormGroup({})));
  return new FormGroup(controls);
}

describe('GeneralOpdHistoryComponent', () => {
  let component: GeneralOpdHistoryComponent;
  let fixture: ComponentFixture<GeneralOpdHistoryComponent>;
  let doctorService: any;
  let benService: any;
  let ncdService: any;
  let confirmation: any;
  let session: any;
  let beneficiary$: BehaviorSubject<any>;
  let enablingIdrs$: BehaviorSubject<any>;

  beforeEach(async () => {
    beneficiary$ = new BehaviorSubject<any>(null);
    enablingIdrs$ = new BehaviorSubject<any>(false);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [GeneralOpdHistoryComponent],
      providers: [
        ...commonTestProviders({
          session: {
            serviceLineDetails: JSON.stringify({
              facilityID: 11,
              parkingPlaceID: 22,
            }),
            beneficiaryRegID: 'B1',
            visitID: 'V1',
            providerServiceID: 'P1',
            userName: 'nurse1',
            beneficiaryID: 'BEN',
            sessionID: 'S1',
            benFlowID: 'F1',
            visitCode: 'VC1',
          },
        }),
        { provide: DoctorService, useValue: autoSpy(DoctorService) },
        {
          provide: BeneficiaryDetailsService,
          useValue: autoSpy(BeneficiaryDetailsService, {
            beneficiaryDetails$: beneficiary$.asObservable(),
          }),
        },
        {
          provide: NcdScreeningService,
          useValue: autoSpy(NcdScreeningService, {
            enablingIdrs$: enablingIdrs$.asObservable(),
          }),
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(GeneralOpdHistoryComponent);
    component = fixture.componentInstance;
    component.patientHistoryForm = buildHistoryForm();
    doctorService = TestBed.inject(DoctorService);
    benService = TestBed.inject(BeneficiaryDetailsService);
    ncdService = TestBed.inject(NcdScreeningService);
    confirmation = TestBed.inject(ConfirmationService);
    session = TestBed.inject(SessionStorageService);
  });

  it('loads sub forms and language on init and renders', () => {
    component.visitCategory = 'General OPD';
    fixture.detectChanges();
    SECTIONS.forEach((s) =>
      expect((component as any)[s]).toBe(component.patientHistoryForm.get(s)),
    );
    expect(component.currentLanguageSet).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('app-general-past-history'),
    ).not.toBeNull();
  });

  describe('beneficiary details', () => {
    it('ignores null beneficiary', () => {
      fixture.detectChanges();
      expect(component.beneficiary).toBeUndefined();
      expect(component.beneficiaryAge).toBe(0);
    });

    it('adds one year when months are non-zero', () => {
      fixture.detectChanges();
      beneficiary$.next({
        age: '25 years - 3 months',
        ageVal: 25,
        genderName: 'Female',
      });
      expect(component.beneficiaryAge).toBe(26);
      expect(component.showObstetricHistory).toBeTrue();
    });

    it('keeps age when months are 0', () => {
      fixture.detectChanges();
      beneficiary$.next({
        age: '25 years - 0 months',
        ageVal: 25,
        genderName: 'Male',
      });
      expect(component.beneficiaryAge).toBe(25);
      expect(component.showObstetricHistory).toBeFalse();
    });

    it('handles age without months part', () => {
      fixture.detectChanges();
      beneficiary$.next({ age: '5 years', ageVal: 5, genderName: 'Female' });
      expect(component.beneficiaryAge).toBe(6);
      expect(component.showObstetricHistory).toBeFalse();
    });

    it('keeps zero age for non-year units', () => {
      fixture.detectChanges();
      beneficiary$.next({ age: '3 months', ageVal: 0, genderName: 'Female' });
      expect(component.beneficiaryAge).toBe(0);
    });
  });

  describe('getAgeValueNew', () => {
    it('returns 0 for falsy age', () => {
      expect(component.getAgeValueNew('')).toBe(0);
      expect(component.getAgeValueNew(null)).toBe(0);
    });
    it('returns years', () => {
      expect(component.getAgeValueNew('30 Years')).toBe(30);
    });
    it('returns 0 for other units or missing unit', () => {
      expect(component.getAgeValueNew('4 days')).toBe(0);
      expect(component.getAgeValueNew('4')).toBe(0);
    });
  });

  it('ageCalculator computes age from dob and ignores empty dob', () => {
    component.beneficiaryAge = 7;
    component.ageCalculator(null);
    expect(component.beneficiaryAge).toBe(7);
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - 10);
    dob.setDate(dob.getDate() - 10);
    component.ageCalculator(dob.toISOString());
    expect(component.beneficiaryAge).toBe(10);
  });

  describe('canShowObstetricHistory', () => {
    const cases: any[] = [
      { primi: true, cat: 'ANC', ben: null, expected: false },
      { primi: false, cat: 'NCD care', ben: null, expected: false },
      {
        primi: false,
        cat: 'ANC',
        ben: { genderName: 'Male' },
        expected: false,
      },
      {
        primi: false,
        cat: 'ANC',
        ben: { genderName: 'Female', ageVal: 10 },
        expected: false,
      },
      {
        primi: false,
        cat: 'ANC',
        ben: { genderName: 'Female', ageVal: 20 },
        expected: true,
      },
      { primi: false, cat: 'PNC', ben: null, expected: true },
      { primi: false, cat: 'General OPD', ben: null, expected: true },
    ];
    cases.forEach((c, i) => {
      it(`case ${i} -> ${c.expected}`, () => {
        component.primiGravida = c.primi;
        component.visitCategory = c.cat;
        component.beneficiary = c.ben;
        component.showObstetricHistory = !c.expected;
        component.canShowObstetricHistory();
        expect(component.showObstetricHistory).toBe(c.expected);
      });
    });
  });

  describe('enableIdrsHistoryForm', () => {
    it('does not subscribe for non NCD screening', () => {
      component.visitCategory = 'ANC';
      component.enableIdrsHistoryForm();
      expect(component.enablingHistorySectionSubscription).toBeUndefined();
    });

    it('toggles showHistory from enablingIdrs$', () => {
      component.visitCategory = 'NCD screening';
      component.enableIdrsHistoryForm();
      expect(component.showHistory).toBeFalse();
      enablingIdrs$.next(true);
      expect(component.showHistory).toBeTrue();
      enablingIdrs$.next(false);
      expect(component.showHistory).toBeFalse();
    });
  });

  describe('ngOnChanges', () => {
    beforeEach(() => {
      component.beneficiary = { ageVal: 30 };
    });

    it('updates general history in update mode', () => {
      session.setItem('visitCategory', 'General OPD');
      const spy = spyOn(component, 'updatePatientGeneralHistory');
      component.mode = 'update';
      component.ngOnChanges({ mode: {} });
      expect(spy).toHaveBeenCalledWith(component.patientHistoryForm);
    });

    it('updates NCD screening history in update mode for NCD screening', () => {
      session.setItem('visitCategory', 'NCD screening');
      const spy = spyOn(component, 'updatePatientNCDScreeningHistory');
      component.mode = 'update';
      component.ngOnChanges({ mode: {} });
      expect(spy).toHaveBeenCalledWith(component.patientHistoryForm);
    });

    it('does not update when mode is not update', () => {
      const spy = spyOn(component, 'updatePatientGeneralHistory');
      component.mode = 'view';
      component.ngOnChanges({ mode: {} });
      expect(spy).not.toHaveBeenCalled();
    });

    it('recomputes obstetric flag on pregnancyStatus / primiGravida change', () => {
      const spy = spyOn(component, 'canShowObstetricHistory');
      component.ngOnChanges({ pregnancyStatus: {}, primiGravida: {} });
      expect(spy).toHaveBeenCalledTimes(2);
      expect(component.pastHistory).toBe(
        component.patientHistoryForm.get('pastHistory') as FormGroup,
      );
    });
  });

  describe('updatePatientGeneralHistory', () => {
    beforeEach(() => {
      component.beneficiary = { ageVal: 30 };
    });

    it('sends expected payload and alerts success', () => {
      session.setItem('visitCategory', 'General OPD');
      doctorService.updateGeneralHistory.and.returnValue(
        of({ statusCode: 200, data: { response: 'saved' } }),
      );
      const hrp = spyOn(component, 'getHRPDetails');
      component.patientHistoryForm.markAsDirty();
      component.updatePatientGeneralHistory(component.patientHistoryForm);
      expect(doctorService.updateGeneralHistory).toHaveBeenCalledWith(
        component.patientHistoryForm,
        {
          beneficiaryRegID: 'B1',
          benVisitID: 'V1',
          providerServiceMapID: 'P1',
          createdBy: 'nurse1',
          modifiedBy: 'nurse1',
          beneficiaryID: 'BEN',
          sessionID: 'S1',
          parkingPlaceID: 22,
          facilityID: 11,
          benFlowID: 'F1',
          visitCode: 'VC1',
        },
        30,
      );
      expect(hrp).not.toHaveBeenCalled();
      expect(confirmation.alert).toHaveBeenCalledWith('saved', 'success');
      expect(component.patientHistoryForm.pristine).toBeTrue();
    });

    it('fetches HRP details for ANC', () => {
      session.setItem('visitCategory', 'ANC');
      doctorService.updateGeneralHistory.and.returnValue(
        of({ statusCode: 200, data: { response: 'saved' } }),
      );
      const hrp = spyOn(component, 'getHRPDetails');
      component.updatePatientGeneralHistory(component.patientHistoryForm);
      expect(hrp).toHaveBeenCalled();
    });

    it('alerts error message on failure status', () => {
      doctorService.updateGeneralHistory.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'bad' }),
      );
      component.updatePatientGeneralHistory(component.patientHistoryForm);
      expect(confirmation.alert).toHaveBeenCalledWith('bad', 'error');
    });

    it('alerts on observable error', () => {
      doctorService.updateGeneralHistory.and.returnValue(throwingObs('boom'));
      component.updatePatientGeneralHistory(component.patientHistoryForm);
      expect(confirmation.alert).toHaveBeenCalledWith('boom', 'error');
    });
  });

  describe('updatePatientNCDScreeningHistory', () => {
    beforeEach(() => {
      component.beneficiary = { ageVal: 40 };
    });

    it('alerts success', () => {
      doctorService.updateNCDScreeningHistory.and.returnValue(
        of({ statusCode: 200, data: { response: 'ok' } }),
      );
      component.patientHistoryForm.markAsDirty();
      component.updatePatientNCDScreeningHistory(component.patientHistoryForm);
      expect(doctorService.updateNCDScreeningHistory).toHaveBeenCalledWith(
        component.patientHistoryForm,
        jasmine.objectContaining({ facilityID: 11, parkingPlaceID: 22 }),
        40,
      );
      expect(confirmation.alert).toHaveBeenCalledWith('ok', 'success');
      expect(component.patientHistoryForm.pristine).toBeTrue();
    });

    it('alerts failure', () => {
      doctorService.updateNCDScreeningHistory.and.returnValue(
        of({ statusCode: 5000, data: null, errorMessage: 'nope' }),
      );
      component.updatePatientNCDScreeningHistory(component.patientHistoryForm);
      expect(confirmation.alert).toHaveBeenCalledWith('nope', 'error');
    });

    it('alerts on error', () => {
      doctorService.updateNCDScreeningHistory.and.returnValue(
        throwingObs('err'),
      );
      component.updatePatientNCDScreeningHistory(component.patientHistoryForm);
      expect(confirmation.alert).toHaveBeenCalledWith('err', 'error');
    });
  });

  describe('getHRPDetails', () => {
    it('sets HRP positive', () => {
      doctorService.getHRPDetails.and.returnValue(
        of({ statusCode: 200, data: { isHRP: true } }),
      );
      component.getHRPDetails();
      expect(doctorService.getHRPDetails).toHaveBeenCalledWith('B1', 'VC1');
      expect(benService.setHRPPositive).toHaveBeenCalled();
    });

    it('resets HRP positive', () => {
      doctorService.getHRPDetails.and.returnValue(
        of({ statusCode: 200, data: { isHRP: false } }),
      );
      component.getHRPDetails();
      expect(benService.resetHRPPositive).toHaveBeenCalled();
    });

    it('does nothing for bad response', () => {
      doctorService.getHRPDetails.and.returnValue(of({ statusCode: 5000 }));
      component.getHRPDetails();
      expect(benService.setHRPPositive).not.toHaveBeenCalled();
      expect(benService.resetHRPPositive).not.toHaveBeenCalled();
    });
  });

  it('unsubscribes on destroy', () => {
    component.visitCategory = 'NCD screening';
    fixture.detectChanges();
    const s1 = spyOn(
      component.beneficiaryDetailsSubscription,
      'unsubscribe',
    ).and.callThrough();
    const s2 = spyOn(
      component.enablingHistorySectionSubscription,
      'unsubscribe',
    ).and.callThrough();
    component.ngOnDestroy();
    expect(s1).toHaveBeenCalled();
    expect(s2).toHaveBeenCalled();
  });

  it('ngOnDestroy tolerates missing subscriptions', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('ngDoCheck refreshes language', () => {
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toBeTruthy();
    expect(ncdService).toBeTruthy();
  });
});
