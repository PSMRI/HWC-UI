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
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, of } from 'rxjs';

import { GeneralPatientVitalsComponent } from './general-patient-vitals.component';
import { DoctorService, NurseService } from '../../shared/services';
import { IdrsscoreService } from '../../shared/services/idrsscore.service';
import { TestInVitalsService } from '../../shared/services/test-in-vitals.service';
import { NcdScreeningService } from '../../shared/services/ncd-screening.service';
import { HrpService } from '../../shared/services/hrp.service';
import { GeneralUtils } from '../../shared/utility/general-utility';
import { BeneficiaryDetailsService } from 'src/app/app-modules/core/services/beneficiary-details.service';
import { ConfirmationService } from 'src/app/app-modules/core/services/confirmation.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { AmritTrackingService } from 'Common-UI/src/tracking';
import { IotcomponentComponent } from 'src/app/app-modules/core/components/iotcomponent/iotcomponent.component';
import { MmuRbsDetailsComponent } from 'src/app/app-modules/core/components/mmu-rbs-details/mmu-rbs-details.component';
import { environment } from 'src/environments/environment';
import { MaterialModule } from 'src/app/app-modules/core/material.module';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  createDialogRefMock,
  throwingObs,
} from 'src/testing/test-utils';

describe('GeneralPatientVitalsComponent', () => {
  let component: GeneralPatientVitalsComponent;
  let fixture: ComponentFixture<GeneralPatientVitalsComponent>;
  let doctor: any;
  let nurse: any;
  let idrs: any;
  let hrp: any;
  let testInVitals: any;
  let ncd: any;
  let benService: any;
  let confirm: any;
  let dialog: any;
  let tracking: any;
  let session: any;
  let form: FormGroup;
  let ben$: BehaviorSubject<any>;
  let ncdTemp$: BehaviorSubject<any>;
  let rbsInv$: BehaviorSubject<any>;
  let diabetes$: BehaviorSubject<any>;
  let enablingIdrs$: BehaviorSubject<any>;
  let screeningDiseases$: BehaviorSubject<any>;
  let routeParams: any;
  const RECHECK = LANGUAGE_EN.alerts.info.recheckValue;

  const ADULT_M = {
    ageVal: 30,
    age: '30 years - 0 months',
    genderName: 'Male',
  };
  const ADULT_F = {
    ageVal: 30,
    age: '30 years - 0 months',
    genderName: 'Female',
  };
  const TEEN_F = {
    ageVal: 10,
    age: '10 years - 2 months',
    genderName: 'Female',
  };

  async function setup(
    opts: {
      session?: Record<string, any>;
      attendant?: string;
      ben?: any;
      visitCategory?: string;
      mode?: string;
    } = {},
  ) {
    ben$ = new BehaviorSubject<any>(
      opts.ben === undefined ? ADULT_M : opts.ben,
    );
    ncdTemp$ = new BehaviorSubject<any>(undefined);
    rbsInv$ = new BehaviorSubject<any>(undefined);
    diabetes$ = new BehaviorSubject<any>(0);
    enablingIdrs$ = new BehaviorSubject<any>(false);
    screeningDiseases$ = new BehaviorSubject<any>(false);
    routeParams = { attendant: opts.attendant ?? 'doctor' };
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [GeneralPatientVitalsComponent],
      providers: [
        ...commonTestProviders({
          session: {
            serviceLineDetails: JSON.stringify({
              facilityID: 1,
              parkingPlaceID: 2,
            }),
            visitID: 'V1',
            beneficiaryRegID: 'B1',
            visitCode: 'VC1',
            ...(opts.session ?? {}),
          },
        }),
        { provide: DoctorService, useValue: autoSpy(DoctorService) },
        {
          provide: NurseService,
          useValue: autoSpy(NurseService, {
            ncdTemp$,
            rbsSelectedInInvestigation$: rbsInv$,
            rbsTestResultFromDoctorFetch: null,
            isAssessmentDone: true,
          }),
        },
        {
          provide: IdrsscoreService,
          useValue: autoSpy(IdrsscoreService, {
            diabetesSelectedFlag$: diabetes$,
          }),
        },
        {
          provide: HrpService,
          useValue: autoSpy(HrpService, { checkHrpStatus: false }),
        },
        {
          provide: TestInVitalsService,
          useValue: autoSpy(TestInVitalsService),
        },
        {
          provide: NcdScreeningService,
          useValue: autoSpy(NcdScreeningService, {
            enablingIdrs$,
            enablingScreeningDiseases$: screeningDiseases$,
          }),
        },
        {
          provide: BeneficiaryDetailsService,
          useValue: {
            beneficiaryDetails$: ben$,
            setHRPPositive: jasmine.createSpy('setHRPPositive'),
            resetHRPPositive: jasmine.createSpy('resetHRPPositive'),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: routeParams } },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(GeneralPatientVitalsComponent);
    component = fixture.componentInstance;
    session = TestBed.inject(SessionStorageService) as any;
    form = new GeneralUtils(
      new FormBuilder(),
      session,
    ).createGeneralVitalDetailsForm();
    component.patientVitalsForm = form;
    component.visitCategory = opts.visitCategory ?? 'General OPD';
    component.mode = opts.mode as any;
    doctor = TestBed.inject(DoctorService) as any;
    nurse = TestBed.inject(NurseService) as any;
    idrs = TestBed.inject(IdrsscoreService) as any;
    hrp = TestBed.inject(HrpService) as any;
    testInVitals = TestBed.inject(TestInVitalsService) as any;
    ncd = TestBed.inject(NcdScreeningService) as any;
    benService = TestBed.inject(BeneficiaryDetailsService) as any;
    confirm = TestBed.inject(ConfirmationService) as any;
    dialog = TestBed.inject(MatDialog) as any;
    tracking = TestBed.inject(AmritTrackingService) as any;
  }

  describe('initialisation', () => {
    beforeEach(async () => {
      await setup({ session: { beneficiaryGender: 'Male' } });
      fixture.detectChanges();
    });

    it('should reset shared state and subscribe to services', () => {
      expect(hrp.setHeightFromVitals).toHaveBeenCalledWith(null);
      expect(hrp.setHemoglobinValue).toHaveBeenCalledWith(null);
      expect(nurse.clearEnableLAssessment).toHaveBeenCalled();
      expect(nurse.clearNCDTemp).toHaveBeenCalled();
      expect(nurse.clearRbsSelectedInInvestigation).toHaveBeenCalled();
      expect(idrs.clearDiabetesSelected).toHaveBeenCalled();
      expect(doctor.setValueToEnableVitalsUpdateButton).toHaveBeenCalledWith(
        false,
      );
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.attendant).toBe('doctor');
      expect(component.referredVisitcode).toBe('undefined');
      expect(component.benGenderType).toBe(0);
      expect(component.male).toBeTrue();
      expect(component.benAge).toBe(30);
      expect(component.totalMonths).toBe(360);
      expect(component.enableCBACForm).toBeFalse();
      expect(component.ncdTemperature).toBeFalse();
      expect(component.rbsSelectedInInvestigation).toBeFalse();
      expect(component.hideVitalsFormForNcdScreening).toBeTrue();
      expect(component.startWeightTest).toBe(environment.startWeighturl);
    });

    it('reacts to service subjects', () => {
      enablingIdrs$.next(true);
      ncdTemp$.next(true);
      rbsInv$.next(true);
      diabetes$.next(1);
      expect(component.enableCBACForm).toBeTrue();
      expect(component.ncdTemperature).toBeTrue();
      expect(component.rbsSelectedInInvestigation).toBeTrue();
      expect(component.diabetesSelected).toBe(1);
    });

    it('ngOnChanges for General OPD shows glucose, no fetch for doctor', () => {
      component.ngOnChanges();
      expect(component.hideForANCAndQC).toBeTrue();
      expect(component.showGlucoseQC).toBeTrue();
      expect(doctor.getGenericVitals).not.toHaveBeenCalled();
      expect(doctor.getPreviousVisitAnthropometry).not.toHaveBeenCalled();
    });

    it('ngOnChanges for General OPD (QC) hides ANC/QC fields', () => {
      component.visitCategory = 'General OPD (QC)';
      component.ngOnChanges();
      fixture.detectChanges();
      expect(component.hideForANCAndQC).toBeFalse();
      expect(component.showGlucoseQC).toBeFalse();
    });

    it('trackFieldInteraction and onCheckboxChange', () => {
      component.trackFieldInteraction('Height');
      expect(tracking.trackFieldInteraction).toHaveBeenCalledWith(
        'Height',
        'Vitals',
      );
      expect(component.onCheckboxChange(0, { checked: true })).toBeUndefined();
    });

    it('onRbsCheckBox toggles flag', () => {
      component.onRbsCheckBox({ checked: false });
      expect(component.rbsCheckBox).toBeFalse();
      component.onRbsCheckBox({ checked: true });
      expect(component.rbsCheckBox).toBeTrue();
    });

    it('ngOnDestroy unsubscribes and resets nurse state', () => {
      component.getGeneralVitalsData();
      component.getPreviousVisitAnthropometry();
      component.visitCategory = 'NCD screening';
      component.hideVitalsForm();
      const spies = [
        spyOn(component.beneficiaryDetailSubscription, 'unsubscribe'),
        spyOn(component.generalVitalsDataSubscription, 'unsubscribe'),
        spyOn(component.rbsSelectedInInvestigationSubscription, 'unsubscribe'),
        spyOn(component.disablingVitalsSectionSubscription, 'unsubscribe'),
        spyOn(component.previousAnthropometryDataSubscription, 'unsubscribe'),
      ];
      nurse.rbsTestResultFromDoctorFetch = 5;
      component.ngOnDestroy();
      spies.forEach((s) => expect(s).toHaveBeenCalled());
      expect(nurse.rbsTestResultFromDoctorFetch).toBeNull();
      expect(nurse.isAssessmentDone).toBeFalse();
    });

    it('ngOnDestroy without subscriptions', () => {
      component.beneficiaryDetailSubscription = null;
      component.rbsSelectedInInvestigationSubscription = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
      expect(nurse.isAssessmentDone).toBeFalse();
    });
  });

  describe('referred visit code and gender', () => {
    it('uses mmuReferredVisitCode first', async () => {
      await setup({
        session: {
          mmuReferredVisitCode: 'MMU1',
          referredVisitCode: 'R1',
          beneficiaryGender: 'Female',
        },
      });
      fixture.detectChanges();
      expect(component.referredVisitcode).toBe('MMU1');
      expect(component.benGenderType).toBe(1);
    });

    it('falls back to referredVisitCode', async () => {
      await setup({
        session: { referredVisitCode: 'R1', beneficiaryGender: 'Transgender' },
      });
      fixture.detectChanges();
      expect(component.referredVisitcode).toBe('R1');
      expect(component.benGenderType).toBe(2);
    });

    it('female beneficiary flag and null beneficiary ignored', async () => {
      await setup({ ben: ADULT_F });
      fixture.detectChanges();
      expect(component.female).toBeTrue();
      expect(component.male).toBeFalse();
      ben$.next(null);
      ben$.next({ ageVal: -1, genderName: null });
      expect(component.benAge).toBe(30);
    });
  });

  describe('NCD screening vitals visibility', () => {
    it('hides/shows vitals based on enablingScreeningDiseases$', async () => {
      await setup({ visitCategory: 'NCD screening' });
      fixture.detectChanges();
      expect(component.hideVitalsFormForNcdScreening).toBeFalse();
      screeningDiseases$.next(true);
      expect(component.hideVitalsFormForNcdScreening).toBeTrue();
    });
  });

  describe('BMI', () => {
    beforeEach(async () => {
      await setup({ ben: ADULT_M });
      fixture.detectChanges();
    });

    it('calculates BMI and normal status for adults', () => {
      form.patchValue({ height_cm: 170, weight_Kg: 65 });
      component.calculateBMI();
      expect(component.BMI).toBe(22.5);
      expect(component.bMI).toBe(22.5);
      expect(component.normalBMI).toBeTrue();
      expect(nurse.calculateBmiStatus).not.toHaveBeenCalled();
    });

    it('flags abnormal adult BMI', () => {
      form.patchValue({ height_cm: 160, weight_Kg: 90 });
      component.calculateBMI();
      expect(component.BMI).toBe(35.2);
      expect(component.normalBMI).toBeFalse();
    });

    it('clears BMI when height or weight missing', () => {
      form.patchValue({ bMI: 20, height_cm: 170, weight_Kg: null });
      component.calculateBMI();
      expect(component.bMI).toBeNull();
    });

    it('uses API status for minors (61-228 months)', () => {
      component.benGenderAndAge = TEEN_F;
      nurse.calculateBmiStatus.and.returnValue(
        of({ statusCode: 200, data: { bmiStatus: 'Normal' } }),
      );
      form.patchValue({ height_cm: 140, weight_Kg: 35 });
      component.calculateBMI();
      expect(component.totalMonths).toBe(122);
      expect(nurse.calculateBmiStatus).toHaveBeenCalledWith({
        yearMonth: TEEN_F.age,
        gender: 'Female',
        bmi: 17.9,
      });
      expect(component.bmiStatusMinor).toBe('normal');
      expect(component.normalBMI).toBeTrue();
    });

    it('minor abnormal status, missing status, non-200 and error', () => {
      component.benGenderAndAge = TEEN_F;
      component.BMI = 30;
      nurse.calculateBmiStatus.and.returnValues(
        of({ statusCode: 200, data: { bmiStatus: 'Overweight' } }),
        of({ statusCode: 200, data: {} }),
        of({ statusCode: 5000, errorMessage: 'bad' }),
        throwingObs('boom'),
      );
      component.calculateBMIStatusBasedOnAge();
      expect(component.normalBMI).toBeFalse();
      component.calculateBMIStatusBasedOnAge();
      expect(component.bmiStatusMinor).toBe('overweight');
      component.calculateBMIStatusBasedOnAge();
      expect(confirm.alert).toHaveBeenCalledWith('bad', 'error');
      component.calculateBMIStatusBasedOnAge();
      expect(confirm.alert).toHaveBeenCalledWith('boom', 'error');
    });
  });

  describe('range checks', () => {
    beforeEach(async () => {
      await setup();
      fixture.detectChanges();
    });

    const argChecks: [keyof GeneralPatientVitalsComponent, number, boolean][] =
      [
        ['checkHeight', 5, true],
        ['checkHeight', 250, true],
        ['checkHeight', 170, false],
        ['checkWeight', 20, true],
        ['checkWeight', 160, true],
        ['checkWeight', 70, false],
        ['checkSystolic', 40, true],
        ['checkSystolic', 320, true],
        ['checkSystolic', 120, false],
        ['checkDiastolic', 10, true],
        ['checkDiastolic', 180, true],
        ['checkDiastolic', 80, false],
        ['checkBloodSugarFasting', 40, true],
        ['checkBloodSugarFasting', 800, true],
        ['checkBloodSugarFasting', 100, false],
        ['checkBloodSugarRandom', 40, true],
        ['checkBloodSugarRandom', 800, true],
        ['checkBloodSugarRandom', 100, false],
        ['checkBloodSugar2HrPostPrandial', 40, true],
        ['checkBloodSugar2HrPostPrandial', 800, true],
        ['checkBloodSugar2HrPostPrandial', 100, false],
      ];
    argChecks.forEach(([fn, v, alerts]) => {
      it(`${String(fn)}(${v}) alerts=${alerts}`, () => {
        (component[fn] as any)(v);
        if (alerts) expect(confirm.alert).toHaveBeenCalledWith(RECHECK);
        else expect(confirm.alert).not.toHaveBeenCalled();
      });
    });

    const formChecks: [
      string,
      keyof GeneralPatientVitalsComponent,
      number,
      boolean,
    ][] = [
      ['headCircumference_cm', 'checkHeadCircumference', 25, true],
      ['headCircumference_cm', 'checkHeadCircumference', 75, true],
      ['headCircumference_cm', 'checkHeadCircumference', 40, false],
      [
        'midUpperArmCircumference_MUAC_cm',
        'checkMidUpperArmCircumference',
        6,
        true,
      ],
      [
        'midUpperArmCircumference_MUAC_cm',
        'checkMidUpperArmCircumference',
        30,
        true,
      ],
      [
        'midUpperArmCircumference_MUAC_cm',
        'checkMidUpperArmCircumference',
        15,
        false,
      ],
      ['temperature', 'checkTemperature', 90, true],
      ['temperature', 'checkTemperature', 110, true],
      ['temperature', 'checkTemperature', 98, false],
      ['hemoglobin', 'checkHemoglobin', 0.5, true],
      ['hemoglobin', 'checkHemoglobin', 25, true],
      ['hemoglobin', 'checkHemoglobin', 12, false],
      ['pulseRate', 'checkPulseRate', 48, true],
      ['pulseRate', 'checkPulseRate', 201, true],
      ['pulseRate', 'checkPulseRate', 72, false],
      ['sPO2', 'checkSpo2', 0, true],
      ['sPO2', 'checkSpo2', 101, true],
      ['sPO2', 'checkSpo2', 98, false],
      ['respiratoryRate', 'checkRespiratoryRate', 10, true],
      ['respiratoryRate', 'checkRespiratoryRate', 100, true],
      ['respiratoryRate', 'checkRespiratoryRate', 18, false],
      ['rbsTestResult', 'checkForRange', -1, true],
      ['rbsTestResult', 'checkForRange', 1001, true],
      ['rbsTestResult', 'checkForRange', 120, false],
    ];
    formChecks.forEach(([ctrl, fn, v, alerts]) => {
      it(`${String(fn)} with ${ctrl}=${v} alerts=${alerts}`, () => {
        form.patchValue({ [ctrl]: v });
        (component[fn] as any)(v);
        if (alerts) expect(confirm.alert).toHaveBeenCalledWith(RECHECK);
        else expect(confirm.alert).not.toHaveBeenCalled();
      });
    });

    it('checkForRange skips high value while RBS popup open', () => {
      component.rbsPopup = true;
      form.patchValue({ rbsTestResult: 1500 });
      component.checkForRange();
      expect(confirm.alert).not.toHaveBeenCalled();
    });

    it('checkHeight and checkHemoglobin push values to HRP', () => {
      form.patchValue({ height_cm: 150, hemoglobin: 11 });
      component.checkHeight(150);
      component.checkHemoglobin();
      expect(hrp.setHeightFromVitals).toHaveBeenCalledWith(150);
      expect(hrp.setHemoglobinValue).toHaveBeenCalledWith(11);
      expect(hrp.checkHrpStatus).toBeTrue();
    });

    it('checkSystolic / checkDiastolic send values (or 0) to IDRS', () => {
      component.checkSystolic(120);
      component.checkSystolic(null);
      component.checkDiastolic(80);
      component.checkDiastolic(null);
      expect(idrs.setSystolicBp).toHaveBeenCalledWith(120);
      expect(idrs.setSystolicBp).toHaveBeenCalledWith(0);
      expect(idrs.setDiastolicBp).toHaveBeenCalledWith(80);
      expect(idrs.setDiastolicBp).toHaveBeenCalledWith(0);
    });

    it('checkSystolicGreater clears systolic when not above diastolic', () => {
      form.patchValue({ systolicBP_1stReading: 80 });
      component.checkSystolicGreater('120', '130');
      expect(confirm.alert).toHaveBeenCalledWith(LANGUAGE_EN.alerts.info.sysBp);
      expect(component.systolicBP_1stReading).toBeNull();
      confirm.alert.calls.reset();
      component.checkSystolicGreater('130', '80');
      component.checkSystolicGreater(null, '80');
      expect(confirm.alert).not.toHaveBeenCalled();
    });

    it('checkDiastolicLower clears diastolic when not below systolic', () => {
      form.patchValue({ diastolicBP_1stReading: 130 });
      component.checkDiastolicLower('120', '130');
      expect(component.diastolicBP_1stReading).toBeNull();
      confirm.alert.calls.reset();
      component.checkDiastolicLower('130', '80');
      expect(confirm.alert).not.toHaveBeenCalled();
    });
  });

  describe('hip / waist', () => {
    it('male hip and waist-hip ratio', async () => {
      await setup({ ben: ADULT_M });
      fixture.detectChanges();
      form.patchValue({ hipCircumference_cm: 100, waistCircumference_cm: 95 });
      component.checkHip(100);
      expect(component.normalHip).toBeTrue();
      component.hipWaistRatio();
      expect(component.waistHipRatio).toBe('0.95');
      expect(component.normalWaistHipRatio).toBeFalse();
      form.patchValue({ hipCircumference_cm: 110, waistCircumference_cm: 80 });
      component.checkHip(110);
      expect(component.normalHip).toBeFalse();
      component.hipWaistRatio();
      expect(component.normalWaistHipRatio).toBeTrue();
      form.patchValue({ hipCircumference_cm: null });
      component.hipWaistRatio();
      expect(component.waistHipRatio).toBeNull();
    });

    it('female hip and waist-hip ratio', async () => {
      await setup({ ben: ADULT_F });
      fixture.detectChanges();
      form.patchValue({ hipCircumference_cm: 100, waistCircumference_cm: 78 });
      component.checkHip(100);
      expect(component.normalHip).toBeTrue();
      component.hipWaistRatio();
      expect(component.normalWaistHipRatio).toBeTrue();
      form.patchValue({ hipCircumference_cm: 120, waistCircumference_cm: 110 });
      component.checkHip(120);
      expect(component.normalHip).toBeFalse();
      component.hipWaistRatio();
      expect(component.normalWaistHipRatio).toBeFalse();
    });

    [
      { ben: ADULT_M, waist: 85, score: 0 },
      { ben: ADULT_M, waist: 95, score: 10 },
      { ben: ADULT_M, waist: 105, score: 20 },
      { ben: ADULT_F, waist: 75, score: 0 },
      { ben: ADULT_F, waist: 85, score: 10 },
      { ben: ADULT_F, waist: 95, score: 20 },
    ].forEach((c) => {
      it(`IDRS waist score ${c.ben.genderName} ${c.waist} -> ${c.score}`, async () => {
        await setup({ ben: c.ben });
        fixture.detectChanges();
        component.checkIDRSForWaist(c.waist);
        expect(component.IDRSWaistScore).toBe(c.score);
        expect(idrs.setIDRSScoreWaist).toHaveBeenCalledWith(c.score);
        expect(idrs.setIDRSScoreFlag).toHaveBeenCalled();
        idrs.setIDRSScoreFlag.calls.reset();
        component.IDRSWaistScore = undefined;
        component.patchIDRSForWaist(c.waist);
        expect(component.IDRSWaistScore).toBe(c.score);
        expect(idrs.setIDRSScoreFlag).not.toHaveBeenCalled();
      });
    });

    it('IDRS waist with unknown gender keeps score undefined', async () => {
      await setup({ ben: null });
      fixture.detectChanges();
      component.checkIDRSForWaist(100);
      component.patchIDRSForWaist(100);
      expect(idrs.setIDRSScoreWaist).toHaveBeenCalledWith(undefined);
    });
  });

  describe('nurse requirements & update', () => {
    beforeEach(async () => {
      await setup();
      fixture.detectChanges();
    });

    function requireAll() {
      Object.keys(form.controls).forEach((k) =>
        form.controls[k].setErrors({ required: true }),
      );
    }

    it('returns 1 when no errors', () => {
      expect(component.checkNurseRequirements(form)).toBe(1);
      expect(confirm.notify).not.toHaveBeenCalled();
    });

    it('NCD screening lists all NCD fields', () => {
      component.visitCategory = 'NCD screening';
      requireAll();
      expect(component.checkNurseRequirements(form)).toBe(0);
      const list = confirm.notify.calls.mostRecent().args[1];
      expect(confirm.notify.calls.mostRecent().args[0]).toBe(
        LANGUAGE_EN.alerts.info.belowFields,
      );
      expect(list.length).toBe(8);
      expect(list).toContain(LANGUAGE_EN.rbsTestResult);
    });

    it('ANC lists BP + anthropometry + vitals', () => {
      component.visitCategory = 'ANC';
      requireAll();
      component.checkNurseRequirements(form);
      const list = confirm.notify.calls.mostRecent().args[1];
      expect(list.length).toBe(6);
      expect(list).toContain(LANGUAGE_EN.systolicBPReading);
    });

    it('other categories list 4 fields', () => {
      requireAll();
      component.checkNurseRequirements(form);
      expect(confirm.notify.calls.mostRecent().args[1].length).toBe(4);
    });

    it('update mode with validation failure does not call API', () => {
      form.controls['height_cm'].setErrors({ required: true });
      component.mode = 'update';
      component.ngOnChanges();
      expect(component.doctorScreen).toBeTrue();
      expect(doctor.updateGeneralVitals).not.toHaveBeenCalled();
    });

    it('update success for ANC fetches HRP and reports RBS', () => {
      component.visitCategory = 'ANC';
      doctor.updateGeneralVitals.and.returnValue(
        of({ statusCode: 200, data: { response: 'Saved' } }),
      );
      doctor.getHRPDetails.and.returnValue(
        of({ statusCode: 200, data: { isHRP: true } }),
      );
      form.patchValue({ rbsTestResult: 150 });
      form.controls['rbsTestResult'].markAsDirty();
      component.updateGeneralVitals(form);
      expect(doctor.updateGeneralVitals).toHaveBeenCalledWith(form, 'ANC');
      expect(idrs.rbsTestResultsInVitals).toHaveBeenCalledWith(150);
      expect(doctor.getHRPDetails).toHaveBeenCalledWith('B1', 'VC1');
      expect(benService.setHRPPositive).toHaveBeenCalled();
      expect(confirm.alert).toHaveBeenCalledWith('Saved', 'success');
      expect(
        testInVitals.setVitalsRBSValueInReportsInUpdate,
      ).toHaveBeenCalledWith(jasmine.objectContaining({ rbsTestResult: 150 }));
      expect(form.pristine).toBeTrue();
    });

    it('update non-200 and error alert', () => {
      doctor.updateGeneralVitals.and.returnValues(
        of({ statusCode: 5000, errorMessage: 'bad' }),
        throwingObs('boom'),
      );
      component.updateGeneralVitals(form);
      component.updateGeneralVitals(form);
      expect(confirm.alert).toHaveBeenCalledWith('bad', 'error');
      expect(confirm.alert).toHaveBeenCalledWith('boom', 'error');
    });

    it('getHRPDetails resets HRP when negative; ignores bad responses', () => {
      doctor.getHRPDetails.and.returnValues(
        of({ statusCode: 200, data: { isHRP: false } }),
        of({ statusCode: 5000 }),
      );
      component.getHRPDetails();
      component.getHRPDetails();
      expect(benService.resetHRPPositive).toHaveBeenCalledTimes(1);
      expect(benService.setHRPPositive).not.toHaveBeenCalled();
    });

    it('setRBSResultInReport skips when RBS untouched or disabled', () => {
      component.setRBSResultInReport(form);
      form.controls['rbsTestResult'].markAsDirty();
      form.controls['rbsTestResult'].disable();
      component.setRBSResultInReport(form);
      component.setRBSResultInReport({ value: null });
      expect(
        testInVitals.setVitalsRBSValueInReportsInUpdate,
      ).not.toHaveBeenCalled();
    });
  });

  describe('fetching vitals', () => {
    const VITALS = {
      data: {
        benAnthropometryDetail: {
          height_cm: 160,
          weight_Kg: 64,
          waistCircumference_cm: 95,
          hipCircumference_cm: 100,
          waistHipRatio: 0.95,
        },
        benPhysicalVitalDetail: {
          systolicBP_1stReading: 120,
          diastolicBP_1stReading: 80,
          rbsTestResult: 140,
          rbsTestRemarks: 'ok',
          hemoglobin: 12,
        },
      },
    };

    it('view mode (doctor) patches form and derived values', async () => {
      await setup({ mode: 'view', visitCategory: 'General OPD', ben: ADULT_M });
      doctor.getGenericVitals.and.returnValue(of(VITALS));
      fixture.detectChanges();
      component.ngOnChanges();
      expect(component.doctorScreen).toBeTrue();
      expect(doctor.getGenericVitals).toHaveBeenCalledWith({
        benRegID: 'B1',
        benVisitID: 'V1',
      });
      expect(component.height_cm).toBe(160);
      expect(component.rbsResult).toBe(140);
      expect(component.rbsRemarks).toBe('ok');
      expect(idrs.setSystolicBp).toHaveBeenCalledWith(120);
      expect(idrs.setDiastolicBp).toHaveBeenCalledWith(80);
      expect(idrs.setIDRSScoreWaist).toHaveBeenCalledWith(10);
      expect(nurse.rbsTestResultFromDoctorFetch).toBe(140);
      expect(nurse.setRbsInCurrentVitals).toHaveBeenCalledWith(140);
      expect(form.controls['rbsTestResult'].disabled).toBeTrue();
      expect(component.normalHip).toBeTrue();
      expect(component.waistHipRatio).toBe('0.95');
      expect(component.bMI).toBe(25);
      expect(testInVitals.setVitalsRBSValueInReports).toHaveBeenCalledWith(
        VITALS.data.benPhysicalVitalDetail,
      );
    });

    it('ANC view sets HRP height/hemoglobin; null readings skip IDRS', async () => {
      await setup({ mode: 'view', visitCategory: 'ANC', attendant: 'nurse' });
      doctor.getGenericVitals.and.returnValue(
        of({
          data: {
            benAnthropometryDetail: {
              height_cm: 150,
              waistCircumference_cm: null,
            },
            benPhysicalVitalDetail: null,
          },
        }),
      );
      doctor.getPreviousVisitAnthropometry.and.returnValue(of(null));
      fixture.detectChanges();
      hrp.setHeightFromVitals.calls.reset();
      idrs.setSystolicBp.calls.reset();
      component.getGeneralVitalsData();
      expect(hrp.setHeightFromVitals).toHaveBeenCalledWith(150);
      expect(hrp.setHemoglobinValue).toHaveBeenCalledWith(null);
      expect(idrs.setIDRSScoreWaist).not.toHaveBeenCalled();
      expect(nurse.rbsTestResultFromDoctorFetch).toBeNull();
      expect(testInVitals.setVitalsRBSValueInReports).not.toHaveBeenCalled();
    });

    it('null vitals response loads MMU RBS and opens details dialog', async () => {
      await setup({
        session: {
          specialistFlag: '100',
          referredVisitID: 'RV',
          referredVisitCode: 'RVC',
        },
      });
      doctor.getGenericVitals.and.returnValue(of(null));
      doctor.getRBSPreviousVitals.and.returnValue(
        of({
          benAnthropometryDetail: {},
          benPhysicalVitalDetail: { rbsTestResult: 99, rbsTestRemarks: 'r' },
        }),
      );
      fixture.detectChanges();
      component.ngOnChanges();
      expect(doctor.getRBSPreviousVitals).toHaveBeenCalledWith({
        benRegID: 'B1',
        benVisitID: 'RV',
        visitCode: 'RVC',
      });
      expect(component.rbsResult).toBe(99);
      expect(dialog.open).toHaveBeenCalledWith(MmuRbsDetailsComponent, {
        data: { rbsResult: 99, rbsRemarks: 'r' },
      });
    });

    it('loadMMURBS for nurse uses mmuReferredVisitCode; patches when controls absent; ignores null', async () => {
      await setup({
        attendant: 'nurse',
        session: { mmuReferredVisitCode: 'MMU' },
      });
      fixture.detectChanges();
      component.patientVitalsForm = new FormBuilder().group({});
      doctor.getRBSPreviousVitals.and.returnValues(
        of({ benPhysicalVitalDetail: { rbsTestResult: 7 } }),
        of(null),
      );
      component.loadMMURBS();
      expect(
        doctor.getRBSPreviousVitals.calls.mostRecent().args[0].visitCode,
      ).toBe('MMU');
      expect(component.rbsResult).toBe(7);
      dialog.open.calls.reset();
      component.loadMMURBS();
      expect(dialog.open).not.toHaveBeenCalled();
    });
  });

  describe('previous anthropometry (nurse)', () => {
    it('patches rounded height and pushes to HRP for ANC', async () => {
      await setup({ attendant: 'nurse', visitCategory: 'ANC' });
      doctor.getPreviousVisitAnthropometry.and.returnValue(
        of({ data: { response: 155.0 } }),
      );
      fixture.detectChanges();
      component.ngOnChanges();
      expect(doctor.getPreviousVisitAnthropometry).toHaveBeenCalledWith({
        benRegID: 'B1',
      });
      expect(component.height_cm).toBe(155);
      expect(hrp.setHeightFromVitals).toHaveBeenCalledWith(155);
    });

    it('keeps decimal heights and ignores not-found responses', async () => {
      await setup({ attendant: 'nurse' });
      doctor.getPreviousVisitAnthropometry.and.returnValues(
        of({ data: { response: '155.5' } }),
        of({ data: { response: 'No data found' } }),
        of({ data: { response: 'Visit code is not found' } }),
      );
      fixture.detectChanges();
      component.getPreviousVisitAnthropometry();
      expect(component.height_cm).toBe('155.5');
      form.patchValue({ height_cm: null });
      component.getPreviousVisitAnthropometry();
      component.getPreviousVisitAnthropometry();
      expect(component.height_cm).toBeNull();
    });
  });

  describe('RBS enable/disable', () => {
    beforeEach(async () => {
      await setup();
      fixture.detectChanges();
    });

    it('checkDiasableRBS', () => {
      expect(component.checkDiasableRBS()).toBeFalse();
      component.rbsSelectedInInvestigation = true;
      expect(component.checkDiasableRBS()).toBeTrue();
      component.rbsSelectedInInvestigation = false;
      nurse.rbsTestResultFromDoctorFetch = 10;
      expect(component.checkDiasableRBS()).toBeTrue();
    });

    it('rbsResultChange enables controls when no RBS source', () => {
      form.controls['rbsTestResult'].disable();
      expect(component.rbsResultChange()).toBeFalse();
      expect(nurse.setRbsInCurrentVitals).toHaveBeenCalledWith(null);
      expect(form.controls['rbsTestResult'].enabled).toBeTrue();
      expect(form.controls['rbsCheckBox'].enabled).toBeTrue();
    });

    it('rbsResultChange disables controls when selected in investigation', () => {
      component.rbsSelectedInInvestigation = true;
      form.patchValue({ rbsTestResult: 130 });
      expect(component.rbsResultChange()).toBeTrue();
      expect(nurse.setRbsInCurrentVitals).toHaveBeenCalledWith(130);
      expect(form.controls['rbsTestRemarks'].disabled).toBeTrue();
    });
  });

  describe('IoT dialogs', () => {
    beforeEach(async () => {
      await setup();
      fixture.detectChanges();
    });

    const cases: {
      fn: keyof GeneralPatientVitalsComponent;
      api: string;
      result: any;
      ctrl: Record<string, any>;
    }[] = [
      {
        fn: 'openIOTWeightModel',
        api: environment.startWeighturl,
        result: { result: 60 },
        ctrl: { weight_Kg: 60 },
      },
      {
        fn: 'openIOTTempModel',
        api: environment.startTempurl,
        result: { temperature: 99 },
        ctrl: { temperature: 99 },
      },
      {
        fn: 'openIOTPulseRateModel',
        api: environment.startPulseurl,
        result: { pulseRate: 70 },
        ctrl: { pulseRate: 70 },
      },
      {
        fn: 'openIOTSPO2Model',
        api: environment.startPulseurl,
        result: { spo2: 97 },
        ctrl: { sPO2: 97 },
      },
      {
        fn: 'openIOTBPModel',
        api: environment.startBPurl,
        result: { sys: 120, dia: 80 },
        ctrl: { systolicBP_1stReading: 120, diastolicBP_1stReading: 80 },
      },
      {
        fn: 'openIOTBGFastingModel',
        api: environment.startBloodGlucoseurl,
        result: { result: 90 },
        ctrl: { bloodGlucose_Fasting: 90 },
      },
      {
        fn: 'openIOTBGRandomModel',
        api: environment.startBloodGlucoseurl,
        result: { result: 110 },
        ctrl: { bloodGlucose_Random: 110 },
      },
      {
        fn: 'openIOTBGPostPrandialModel',
        api: environment.startBloodGlucoseurl,
        result: { result: 130 },
        ctrl: { bloodGlucose_2hr_PP: 130 },
      },
      {
        fn: 'openIOTRBSModel',
        api: environment.startRBSurl,
        result: { result: 150 },
        ctrl: { rbsTestResult: 150 },
      },
    ];
    cases.forEach((c) => {
      it(`${String(c.fn)} patches ${Object.keys(c.ctrl).join(',')}`, () => {
        dialog.open.and.returnValue(createDialogRefMock(c.result));
        (component[c.fn] as any)();
        expect(dialog.open).toHaveBeenCalledWith(
          IotcomponentComponent,
          jasmine.objectContaining({ data: { startAPI: c.api } }),
        );
        Object.entries(c.ctrl).forEach(([k, v]) =>
          expect(form.controls[k].value).toBe(v),
        );
        expect(doctor.setValueToEnableVitalsUpdateButton).toHaveBeenCalledWith(
          true,
        );
      });
    });

    it('RBS dialog marks dirty, pushes RBS and resets popup flag', () => {
      dialog.open.and.returnValue(createDialogRefMock({ result: 150 }));
      component.openIOTRBSModel();
      expect(component.rbsPopup).toBeFalse();
      expect(form.controls['rbsTestResult'].dirty).toBeTrue();
      expect(nurse.setRbsInCurrentVitals).toHaveBeenCalledWith(150);
    });

    it('RBS dialog closed with null does nothing', () => {
      dialog.open.and.returnValue(createDialogRefMock(null));
      component.openIOTRBSModel();
      expect(form.controls['rbsTestResult'].value).toBeNull();
      expect(component.rbsPopup).toBeFalse();
    });

    it('RBS dialog with empty result does not push RBS', () => {
      dialog.open.and.returnValue(createDialogRefMock({ result: null }));
      nurse.setRbsInCurrentVitals.calls.reset();
      component.openIOTRBSModel();
      expect(nurse.setRbsInCurrentVitals).not.toHaveBeenCalled();
    });

    it('SPO2 dialog closed with null does nothing', () => {
      dialog.open.and.returnValue(createDialogRefMock(null));
      component.openIOTSPO2Model();
      expect(component.sPO2).toBeNull();
    });

    it('weight dialog recalculates BMI', () => {
      form.patchValue({ height_cm: 170 });
      dialog.open.and.returnValue(createDialogRefMock({ result: 65 }));
      component.openIOTWeightModel();
      expect(component.bMI).toBe(22.5);
    });

    it('exposes remaining getters', () => {
      form.patchValue({
        bloodGlucose_Fasting: 1,
        bloodGlucose_Random: 2,
        bloodGlucose_2hr_PP: 3,
      });
      expect(component.bloodGlucose_Fasting).toBe(1);
      expect(component.bloodGlucose_Random).toBe(2);
      expect(component.bloodGlucose_2hr_PP).toBe(3);
    });
  });
});
