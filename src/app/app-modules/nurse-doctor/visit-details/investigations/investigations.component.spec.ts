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

import { InvestigationsComponent } from './investigations.component';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../shared/services';
import { AmritTrackingService } from 'Common-UI/src/tracking';
import { MaterialModule } from 'src/app/app-modules/core/material.module';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('InvestigationsComponent', () => {
  let component: InvestigationsComponent;
  let fixture: ComponentFixture<InvestigationsComponent>;
  let doctor: any;
  let nurse: any;
  let tracking: any;
  let masterData$: BehaviorSubject<any>;
  let rbs$: BehaviorSubject<any>;

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
  const CBC = {
    procedureID: 3,
    procedureName: 'CBC',
    procedureType: 'Laboratory',
  };
  const XRAY = {
    procedureID: 4,
    procedureName: 'X-Ray',
    procedureType: 'Radiology',
  };
  const MASTER = { procedures: [RBS, HB, CBC, XRAY] };

  async function setup(seed: Record<string, any> = {}, mode?: string) {
    masterData$ = new BehaviorSubject<any>(null);
    rbs$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [InvestigationsComponent],
      providers: [
        ...commonTestProviders({ session: seed }),
        { provide: DoctorService, useValue: autoSpy(DoctorService) },
        {
          provide: NurseService,
          useValue: autoSpy(NurseService, {
            rbsTestResultCurrent$: rbs$,
            rbsTestResultFromDoctorFetch: null,
          }),
        },
        {
          provide: MasterdataService,
          useValue: autoSpy(MasterdataService, {
            nurseMasterData$: masterData$,
          }),
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(InvestigationsComponent);
    component = fixture.componentInstance;
    component.mode = mode as any;
    component.patientInvestigationsForm = new FormBuilder().group({
      laboratoryList: [[]],
    });
    doctor = TestBed.inject(DoctorService) as any;
    nurse = TestBed.inject(NurseService) as any;
    tracking = TestBed.inject(AmritTrackingService) as any;
  }

  describe('default mode', () => {
    beforeEach(async () => {
      await setup({ visitID: 'V1', beneficiaryRegID: 'B1' });
      fixture.detectChanges();
    });

    it('should init: clear RBS, set language', () => {
      expect(nurse.clearRbsInVitals).toHaveBeenCalled();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.rbsTestResultCurrent).toBeNull();
    });

    it('should filter laboratory procedures from master data without fetching', () => {
      masterData$.next(MASTER);
      fixture.detectChanges();
      expect(component.selectLabTest).toEqual([RBS, HB, CBC]);
      expect(doctor.getVisitComplaintDetails).not.toHaveBeenCalled();
    });

    it('should record RBS result from nurse service', () => {
      rbs$.next(120);
      expect(component.RBSTestScore).toBe(120);
      expect(component.RBStestDone).toBeTrue();
      expect(component.rbsTestResultCurrent).toBe(120);
    });

    it('canDisable returns true for RBS test when result present', () => {
      expect(component.canDisable(RBS)).toBeUndefined();
      rbs$.next(100);
      expect(component.canDisable(RBS)).toBeTrue();
      expect(component.canDisable(CBC)).toBeUndefined();
      rbs$.next(null);
      nurse.rbsTestResultFromDoctorFetch = 90;
      expect(component.canDisable(RBS)).toBeTrue();
    });

    it('checkTestName with RBS adds hemoglobin test', () => {
      masterData$.next(MASTER);
      component.checkTestName({ value: [RBS] });
      expect(component.RBStestDone).toBeTrue();
      expect(nurse.setRbsSelectedInInvestigation).toHaveBeenCalledWith(true);
      expect(component.laboratoryList.value).toEqual([RBS, HB]);
    });

    it('checkTestName with RBS and HB already selected does not duplicate', () => {
      masterData$.next(MASTER);
      component.checkTestName({ value: [RBS, HB] });
      expect(component.laboratoryList.value).toEqual([RBS, HB]);
    });

    it('checkTestName without RBS resets flag', () => {
      masterData$.next(MASTER);
      component.RBStestDone = true;
      component.checkTestName({ value: [CBC] });
      expect(component.RBStestDone).toBeFalse();
      expect(nurse.setRbsSelectedInInvestigation).toHaveBeenCalledWith(false);
      expect(nurse.setRbsSelectedInInvestigation).not.toHaveBeenCalledWith(
        true,
      );
      expect(component.laboratoryList.value).toEqual([CBC]);
    });

    it('checkTestName with RBS but no HB in master', () => {
      component.selectLabTest = [RBS];
      component.checkTestName({ value: [RBS] });
      expect(component.laboratoryList.value).toEqual([RBS]);
    });

    it('checkLabTest does nothing without details or laboratoryList', () => {
      component.patientInvestigationDetails = null;
      component.checkLabTest();
      component.patientInvestigationDetails = {};
      component.checkLabTest();
      expect(component.laboratoryList.value).toEqual([]);
      expect(component.checkInvestigation([])).toBeUndefined();
    });

    it('trackFieldInteraction should call tracking service', () => {
      component.trackFieldInteraction('Lab');
      expect(tracking.trackFieldInteraction).toHaveBeenCalledWith(
        'Lab',
        'Investigations',
      );
    });

    it('getInvestigation ignores non-200', () => {
      doctor.getVisitComplaintDetails.and.returnValue(
        of({ statusCode: 5000, data: null }),
      );
      component.getInvestigation('B', 'V');
      expect(component.patientInvestigationDetails).toBeUndefined();
    });

    it('ngOnDestroy should unsubscribe everything', () => {
      component.getInvestigation('B', 'V');
      const s1 = spyOn(component.nurseMasterDataSubscription, 'unsubscribe');
      const s2 = spyOn(component.getInvestigationDetails, 'unsubscribe');
      const s3 = spyOn(component.rbsTestResultSubscription, 'unsubscribe');
      component.ngOnDestroy();
      expect(s1).toHaveBeenCalled();
      expect(s2).toHaveBeenCalled();
      expect(s3).toHaveBeenCalled();
    });

    it('ngOnDestroy without subscriptions should not throw', () => {
      component.nurseMasterDataSubscription = null;
      component.rbsTestResultSubscription = null as any;
      expect(() => component.ngOnDestroy()).not.toThrow();
      expect(component.getInvestigationDetails).toBeUndefined();
    });
  });

  describe('view mode', () => {
    beforeEach(async () => {
      await setup({ visitID: 'V1', beneficiaryRegID: 'B1' }, 'view');
      fixture.detectChanges();
    });

    it('should fetch investigation and patch matching lab tests', () => {
      doctor.getVisitComplaintDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            Investigation: {
              laboratoryList: [
                { procedureID: 1, procedureName: 'RBS Test' },
                { procedureID: 99, procedureName: 'Unknown' },
              ],
            },
          },
        }),
      );
      masterData$.next(MASTER);
      expect(doctor.getVisitComplaintDetails).toHaveBeenCalledWith('B1', 'V1');
      expect(component.laboratoryList.value).toEqual([RBS]);
      expect(nurse.setRbsSelectedInInvestigation).toHaveBeenCalledWith(true);
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

    it('should fetch investigation for specialist', () => {
      doctor.getVisitComplaintDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            Investigation: {
              laboratoryList: [{ procedureID: 3, procedureName: 'CBC' }],
            },
          },
        }),
      );
      masterData$.next(MASTER);
      expect(doctor.getVisitComplaintDetails).toHaveBeenCalledWith('B2', 'V2');
      expect(component.laboratoryList.value).toEqual([CBC]);
      expect(nurse.setRbsSelectedInInvestigation).not.toHaveBeenCalled();
    });
  });
});
