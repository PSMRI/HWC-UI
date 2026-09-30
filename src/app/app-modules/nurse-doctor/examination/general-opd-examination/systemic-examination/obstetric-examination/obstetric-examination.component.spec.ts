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
import { FormBuilder, FormGroup } from '@angular/forms';
import { BehaviorSubject, of } from 'rxjs';
import { AmritTrackingService } from 'Common-UI/src/tracking';

import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  createSessionStorageMock,
  throwingObs,
} from 'src/testing/test-utils';
import { MaterialModule } from 'src/app/app-modules/core/material.module';
import {
  BeneficiaryDetailsService,
  ConfirmationService,
} from 'src/app/app-modules/core/services';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from 'src/app/app-modules/nurse-doctor/shared/services';
import { HrpService } from 'src/app/app-modules/nurse-doctor/shared/services/hrp.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { GeneralUtils } from '../../../../shared/utility/general-utility';
import { ObstetricExaminationComponent } from './obstetric-examination.component';

const SESSION = {
  serviceLineDetails: JSON.stringify({ facilityID: 11, parkingPlaceID: 2 }),
  providerServiceID: '7',
  userName: 'nurse1',
  beneficiaryRegID: '555',
};

describe('ObstetricExaminationComponent', () => {
  let component: ObstetricExaminationComponent;
  let fixture: ComponentFixture<ObstetricExaminationComponent>;
  let form: FormGroup;
  let nurse: any;
  let doctor: any;
  let hrp: any;
  let confirm: any;
  let session: any;
  let benDetails$: BehaviorSubject<any>;
  let masterData$: BehaviorSubject<any>;
  let lmp$: BehaviorSubject<any>;
  let hrpStatus$: BehaviorSubject<boolean>;

  const beneficiary = {
    beneficiaryRegID: 555,
    benFlowID: 99,
    ageVal: 25,
    beneficiaryName: 'Asha',
  };

  async function setup(session: Record<string, any> = SESSION) {
    benDetails$ = new BehaviorSubject<any>(null);
    masterData$ = new BehaviorSubject<any>(null);
    lmp$ = new BehaviorSubject<any>(null);
    hrpStatus$ = new BehaviorSubject<boolean>(false);
    nurse = autoSpy(NurseService, {
      lmpFetosenseTestValue$: lmp$.asObservable(),
    });
    doctor = autoSpy(DoctorService, {
      enableHRPStatusAndReasons$: hrpStatus$.asObservable(),
    });
    hrp = autoSpy(HrpService, { checkHrpStatus: false });
    nurse.fetchPrescribedFetosenseTests.and.returnValue(
      of({ statusCode: 200, data: { benFetosenseData: [] } }),
    );
    hrp.getHrpForFollowUP.and.returnValue(
      of({ statusCode: 200, data: { isHRP: true, reasonsForHRP: ['x'] } }),
    );

    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [ObstetricExaminationComponent],
      providers: [
        ...commonTestProviders({ session }),
        { provide: NurseService, useValue: nurse },
        { provide: DoctorService, useValue: doctor },
        { provide: HrpService, useValue: hrp },
        {
          provide: MasterdataService,
          useValue: { nurseMasterData$: masterData$.asObservable() },
        },
        {
          provide: BeneficiaryDetailsService,
          useValue: { beneficiaryDetails$: benDetails$.asObservable() },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ObstetricExaminationComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    session = TestBed.inject(SessionStorageService);
    const utils = new GeneralUtils(
      new FormBuilder(),
      createSessionStorageMock(SESSION) as any,
    );
    form = utils.createObstetricExaminationForANCForm();
    component.obstetricExaminationForANCForm = form;
    fixture.detectChanges();
  }

  describe('initialisation', () => {
    beforeEach(async () => setup());

    it('should create and clear HRP / LMP state', () => {
      expect(component).toBeTruthy();
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
      expect(doctor.clearHrpReasonsStatus).toHaveBeenCalled();
      expect(nurse.clearLMPForFetosenseTest).toHaveBeenCalled();
      expect(hrp.getHrpForFollowUP).not.toHaveBeenCalled();
    });

    it('loads fetosense master when nurse master data arrives', () => {
      masterData$.next({ fetosenseTestMaster: [{ id: 1 }] });
      expect(component.fetosenseTestMaster).toEqual([{ id: 1 }]);
    });

    it('fetches prescribed tests when beneficiary details arrive', () => {
      nurse.fetchPrescribedFetosenseTests.and.returnValue(
        of({
          statusCode: 200,
          data: { benFetosenseData: [{ foetalMonitorTestId: 3 }] },
        }),
      );
      benDetails$.next(beneficiary);
      expect(component.beneficiary).toEqual(beneficiary);
      expect(nurse.fetchPrescribedFetosenseTests).toHaveBeenCalledWith(99);
      expect(component.checkTestPrescribed(3)).toBeTrue();
      expect(component.checkTestPrescribed(4)).toBeFalse();
    });

    it('alerts when prescribed tests fetch fails with non-200', () => {
      nurse.fetchPrescribedFetosenseTests.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'bad' }),
      );
      benDetails$.next(beneficiary);
      expect(confirm.alert).toHaveBeenCalledWith('bad', 'error');
    });

    it('alerts when prescribed tests fetch errors', () => {
      nurse.fetchPrescribedFetosenseTests.and.returnValue(throwingObs('oops'));
      benDetails$.next(beneficiary);
      expect(confirm.alert).toHaveBeenCalledWith('oops', 'error');
    });

    it('tracks the LMP date from the nurse service', () => {
      const d = new Date(2024, 0, 1);
      lmp$.next(d);
      expect(component.lmpDate).toBe(d);
    });

    it('applies nurse HRP reasons when HRP status is enabled', () => {
      doctor.isHrpFromNurse = true;
      doctor.reasonHrpFromNurse = ['Anemia'];
      hrp.checkHrpStatus = true;
      hrpStatus$.next(true);
      expect(component.enableSuspectedHrp).toBeTrue();
      expect(component.reasonsForHrp).toEqual(['Anemia']);
      expect(hrp.checkHrpStatus).toBeFalse();
    });

    it('ignores HRP status when nurse values are missing', () => {
      doctor.isHrpFromNurse = null;
      doctor.reasonHrpFromNurse = null;
      hrp.checkHrpStatus = true;
      hrpStatus$.next(true);
      expect(component.enableSuspectedHrp).toBeFalse();
      expect(hrp.checkHrpStatus).toBeTrue();
    });

    it('re-assigns the language set on ngDoCheck', () => {
      component.current_language_set = null;
      component.ngDoCheck();
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
    });

    it('unsubscribes on destroy', () => {
      const a = component.beneficiaryDetailsSubscription;
      const b = component.nurseMasterDataSubscription;
      fixture.destroy();
      expect(a.closed).toBeTrue();
      expect(b.closed).toBeTrue();
    });

    it('ngOnDestroy tolerates missing subscriptions', () => {
      component.beneficiaryDetailsSubscription = null;
      component.nurseMasterDataSubscription = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('follow up HRP', () => {
    it('fetches HRP for follow-up visits beyond the first', async () => {
      await setup({ ...SESSION, visitReason: 'Follow Up', benVisitNo: 2 });
      expect(hrp.getHrpForFollowUP).toHaveBeenCalledWith({
        beneficiaryRegId: '555',
      });
      expect(component.enableSuspectedHrp).toBeTrue();
      expect(component.reasonsForHrp).toEqual(['x']);
    });

    it('logs and keeps defaults when follow-up HRP fetch fails', async () => {
      await setup({ ...SESSION, visitReason: 'follow up', benVisitNo: 3 });
      hrp.getHrpForFollowUP.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'e' }),
      );
      component.enableSuspectedHrp = false;
      spyOn(console, 'log');
      component.getHrpDetailsForFollowUp();
      expect(console.log).toHaveBeenCalledWith('hrp status fetch issue', 'e');
      expect(component.enableSuspectedHrp).toBeFalse();
    });

    it('skips the HRP fetch for the first visit', async () => {
      await setup({ ...SESSION, visitReason: 'Follow Up', benVisitNo: 1 });
      expect(hrp.getHrpForFollowUP).not.toHaveBeenCalled();
    });

    it('skips the HRP fetch when visit number is missing', async () => {
      await setup({ ...SESSION, visitReason: 'Follow Up' });
      expect(hrp.getHrpForFollowUP).not.toHaveBeenCalled();
    });

    it('skips the HRP fetch for new visits', async () => {
      await setup({
        ...SESSION,
        visitReason: 'New Chief Complaint',
        benVisitNo: 2,
      });
      expect(hrp.getHrpForFollowUP).not.toHaveBeenCalled();
    });
  });

  describe('HRP status and form helpers', () => {
    beforeEach(async () => {
      await setup();
      component.beneficiary = beneficiary;
    });

    it('checkForHRP copies obstetric values and flags a status check', () => {
      form.patchValue({
        malPresentation: 'true',
        lowLyingPlacenta: 'false',
        vertebralDeformity: 'true',
      });
      component.checkForHRP();
      expect(component.malPresentation).toBe('true');
      expect(component.lowLyingPlacenta).toBe('false');
      expect(component.vertebralDeformity).toBe('true');
      expect(hrp.checkHrpStatus).toBeTrue();
    });

    it('getHRPStatus sends collected values and patches the form on success', () => {
      Object.assign(hrp, {
        heightValue: 150,
        comorbidityConcurrentCondition: ['DM'],
        hemoglobin: 9,
        bloodGroup: 'O+',
        pastIllness: ['TB'],
        pastObstetric: ['LSCS'],
      });
      form.patchValue({ malPresentation: true });
      hrp.getHRPStatus.and.returnValue(
        of({ statusCode: 200, data: { isHRP: true, reasonForHrp: ['Short'] } }),
      );
      component.getHRPStatus();
      expect(hrp.getHRPStatus).toHaveBeenCalledWith(
        jasmine.objectContaining({
          beneficiaryRegID: 555,
          benificiaryAge: 25,
          beneficiaryHeight: 150,
          comorbidConditions: ['DM'],
          malPresentation: true,
          hemoglobin: 9,
          bloodGroupType: 'O+',
          pastIllness: ['TB'],
          pastObstetric: ['LSCS'],
        }),
      );
      expect(form.value.isHRP).toBeTrue();
      expect(form.value.reasonsForHRP).toEqual(['Short']);
      expect(hrp.checkHrpStatus).toBeFalse();
      expect(nurse.setUpdateForHrpStatus).toHaveBeenCalledWith(true);
    });

    it('getHRPStatus sends nulls for missing HRP inputs and alerts on failure', () => {
      hrp.getHRPStatus.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'nope' }),
      );
      component.getHRPStatus();
      expect(hrp.getHRPStatus).toHaveBeenCalledWith(
        jasmine.objectContaining({
          beneficiaryHeight: null,
          comorbidConditions: null,
          hemoglobin: null,
          bloodGroupType: null,
          pastIllness: null,
          pastObstetric: null,
        }),
      );
      expect(confirm.alert).toHaveBeenCalledWith('nope', 'error');
      expect(nurse.setUpdateForHrpStatus).toHaveBeenCalledWith(false);
    });

    it('getHRPStatus alerts on error', () => {
      hrp.getHRPStatus.and.returnValue(throwingObs('err'));
      component.getHRPStatus();
      expect(confirm.alert).toHaveBeenCalledWith('err', 'error');
    });

    it('enableHRPStatus toggles based on HRPData', () => {
      component.HRPData = ['a'];
      component.enableHRPStatus();
      expect(component.enableSuspectedHrp).toBeTrue();
      expect(component.reasonsForHrp).toEqual(['a']);
      component.HRPData = null;
      component.enableHRPStatus();
      expect(component.enableSuspectedHrp).toBeFalse();
    });

    it('resetFetalHeartRate clears the rate only when not audible', () => {
      form.patchValue({ fetalHeartRate_BeatsPerMinute: '120-160' });
      component.resetFetalHeartRate({ value: 'Audible' });
      expect(form.value.fetalHeartRate_BeatsPerMinute).toBe('120-160');
      component.resetFetalHeartRate({ value: 'Not Audible' });
      expect(form.value.fetalHeartRate_BeatsPerMinute).toBeNull();
    });

    it('getters read fetal heart sounds and SFH', () => {
      form.patchValue({ fetalHeartSounds: 'Audible', sfh: 24 });
      expect(component.fetalHeartSounds).toBe('Audible');
      expect(component.SFH).toBe(24);
    });

    it('tracks field interactions under "Obstetric Examination"', () => {
      const tracking = TestBed.inject(AmritTrackingService) as any;
      component.trackFieldInteraction('SFH');
      expect(tracking.trackFieldInteraction).toHaveBeenCalledWith(
        'SFH',
        'Obstetric Examination',
      );
    });
  });

  describe('sendTestDetails', () => {
    beforeEach(async () => {
      await setup();
      component.beneficiary = beneficiary;
    });

    it('asks for LMP when none is selected', () => {
      component.lmpDate = null;
      component.sendTestDetails(1, 'NST');
      expect(nurse.sendTestDetailsToFetosense).not.toHaveBeenCalled();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.pleaseSelectLastMenstrualPeriod,
        'info',
      );
    });

    it('asks for LMP when the date is invalid', () => {
      component.lmpDate = new Date('invalid');
      component.sendTestDetails(1, 'NST');
      expect(nurse.sendTestDetailsToFetosense).not.toHaveBeenCalled();
    });

    it('sends the test and refreshes prescribed tests on success', () => {
      component.lmpDate = new Date(2024, 0, 15);
      nurse.sendTestDetailsToFetosense.and.returnValue(
        of({ statusCode: 200, data: { response: 'Sent' } }),
      );
      component.sendTestDetails(4, 'NST');
      expect(nurse.sendTestDetailsToFetosense).toHaveBeenCalledWith(
        jasmine.objectContaining({
          beneficiaryRegID: 555,
          benFlowID: 99,
          motherLMPDate: '2024-01-15',
          motherName: 'Asha',
          foetalMonitorTestId: 4,
          testName: 'NST',
          facilityID: 11,
          ProviderServiceMapID: 7,
          createdBy: 'nurse1',
        }),
      );
      expect(component.testStaus).toBe('Sent');
      expect(nurse.fetchPrescribedFetosenseTests).toHaveBeenCalledWith(99);
      expect(confirm.alertFetsenseMessage).toHaveBeenCalledWith(
        'Sent',
        'Fetosense Device',
      );
    });

    it('alerts on non-200 send response', () => {
      component.lmpDate = new Date(2024, 0, 15);
      nurse.sendTestDetailsToFetosense.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'fail' }),
      );
      component.sendTestDetails(4, 'NST');
      expect(confirm.alert).toHaveBeenCalledWith('fail', 'error');
    });

    it('alerts on send error', () => {
      component.lmpDate = new Date(2024, 0, 15);
      nurse.sendTestDetailsToFetosense.and.returnValue(
        throwingObs({ errorMessage: 'down' }),
      );
      component.sendTestDetails(4, 'NST');
      expect(confirm.alert).toHaveBeenCalledWith('down', 'error');
    });
  });
});
