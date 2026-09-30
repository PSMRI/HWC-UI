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
import { FormBuilder } from '@angular/forms';
import { BehaviorSubject, of } from 'rxjs';

import { SymptomsComponent } from './symptoms.component';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../shared/services';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { MaterialModule } from 'src/app/app-modules/core/material.module';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('SymptomsComponent', () => {
  let component: SymptomsComponent;
  let fixture: ComponentFixture<SymptomsComponent>;
  let doctor: any;
  let master: any;
  let session: any;
  let masterData$: BehaviorSubject<any>;

  const MASTER = {
    covidSymptomsMaster: [
      { symptoms: 'Fever' },
      { symptoms: 'Cough' },
      { symptoms: 'Breathlessness' },
      { symptoms: 'No Symptoms' },
    ],
  };

  async function setup(seed: Record<string, any> = {}) {
    masterData$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [SymptomsComponent],
      providers: [
        ...commonTestProviders({ session: seed }),
        { provide: DoctorService, useValue: autoSpy(DoctorService) },
        { provide: NurseService, useValue: autoSpy(NurseService) },
        {
          provide: MasterdataService,
          useValue: autoSpy(MasterdataService, {
            nurseMasterData$: masterData$,
          }),
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(SymptomsComponent);
    component = fixture.componentInstance;
    component.patientCovidForm = new FormBuilder().group({ symptom: [[]] });
    doctor = TestBed.inject(DoctorService) as any;
    master = TestBed.inject(MasterdataService) as any;
    session = TestBed.inject(SessionStorageService) as any;
  }

  describe('default', () => {
    beforeEach(async () => {
      await setup({ visitID: 'V1', beneficiaryRegID: 'B1' });
      fixture.detectChanges();
    });

    it('should init language, reset session symptom and flags', () => {
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(session.setItem).toHaveBeenCalledWith('symptom', 'null');
      expect(component.checked).toEqual([false, false, false, false]);
    });

    it('should ignore null / missing master data', () => {
      masterData$.next({});
      expect(component.symptomsList).toEqual([]);
    });

    it('should build symptom list from master data without fetching', () => {
      masterData$.next(MASTER);
      expect(component.symptomsList).toEqual([
        'Fever',
        'Cough',
        'Breathlessness',
        'No Symptoms',
      ]);
      expect(component.symptomsArray).toBe(component.symptomsList);
      expect(doctor.getVisitComplaintDetails).not.toHaveBeenCalled();
    });

    it('ngOnChanges view mode should load history', () => {
      doctor.getVisitComplaintDetails.and.returnValue(
        of({ statusCode: 200, data: { covidDetails: { symptom: ['Fever'] } } }),
      );
      component.mode = 'view';
      component.ngOnChanges();
      expect(doctor.getVisitComplaintDetails).toHaveBeenCalledWith('B1', 'V1');
      expect(component.covidSymptoms).toEqual(['Fever']);
      expect(component.symptom).toEqual(['Fever']);
    });

    it('ngOnChanges non-view should not load; null covidDetails should not patch', () => {
      component.ngOnChanges();
      expect(doctor.getVisitComplaintDetails).not.toHaveBeenCalled();
      doctor.getVisitComplaintDetails.and.returnValue(
        of({ statusCode: 200, data: { covidDetails: null } }),
      );
      component.getHistoryDetails('B', 'V');
      component.getMMUHistoryDetails('B', 'V');
      expect(component.covidSymptoms).toBeUndefined();
    });

    it('symptomSelected with No Symptoms', () => {
      masterData$.next(MASTER);
      component.patientCovidForm.patchValue({ symptom: ['No Symptoms'] });
      component.symptomSelected();
      expect(session.setItem).toHaveBeenCalledWith('symptom', 'false');
      expect(component.symptomsList).toEqual(['No Symptoms']);
      expect(master.filter).toHaveBeenCalledWith('false');
    });

    it('symptomSelected with 3 symptoms sets allSymptom true', () => {
      masterData$.next(MASTER);
      component.patientCovidForm.patchValue({
        symptom: ['Fever', 'Cough', 'Breathlessness'],
      });
      component.symptomSelected();
      expect(session.setItem).toHaveBeenCalledWith('symptom', 'true');
      expect(session.setItem).toHaveBeenCalledWith('allSymptom', 'true');
      expect(component.symptomsList).not.toContain('No Symptoms');
      expect(component.answer1).toBe('true');
    });

    it('symptomSelected with 1 symptom sets allSymptom false', () => {
      component.patientCovidForm.patchValue({ symptom: ['Fever'] });
      component.symptomSelected();
      expect(session.setItem).toHaveBeenCalledWith('allSymptom', 'false');
    });

    it('symptomSelected with none resets list', () => {
      masterData$.next(MASTER);
      component.symptomsList = [];
      component.symptomSelected();
      expect(component.symptomsList).toBe(component.symptomsArray);
      expect(session.setItem).toHaveBeenCalledWith('allSymptom', 'null');
      expect(master.filter).toHaveBeenCalledWith('null');
    });

    it('ngOnDestroy should unsubscribe', () => {
      doctor.getVisitComplaintDetails.and.returnValue(of({ statusCode: 5000 }));
      component.getHistoryDetails('B', 'V');
      const s1 = spyOn(component.nurseMasterDataSubscription, 'unsubscribe');
      const s2 = spyOn(component.coividSymptomsHistory, 'unsubscribe');
      component.ngOnDestroy();
      expect(s1).toHaveBeenCalled();
      expect(s2).toHaveBeenCalled();
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

    it('should fetch MMU history after master data and select symptoms', () => {
      doctor.getVisitComplaintDetails.and.returnValue(
        of({ statusCode: 200, data: { covidDetails: { symptom: ['Fever'] } } }),
      );
      masterData$.next(MASTER);
      expect(doctor.getVisitComplaintDetails).toHaveBeenCalledWith('B2', 'V2');
      expect(component.symptom).toEqual(['Fever']);
      expect(master.filter).toHaveBeenCalledWith('true');
    });

    it('ngOnDestroy with no subscriptions should not throw', () => {
      component.nurseMasterDataSubscription = null;
      component.coividSymptomsHistory = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
      expect(component.coividSymptomsHistory).toBeNull();
    });
  });
});
