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
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { of } from 'rxjs';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  createSessionStorageMock,
  throwingObs,
} from 'src/testing/test-utils';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { DoctorService, NurseService } from '../../shared/services';
import { GeneralUtils } from '../../shared/utility/general-utility';
import { GeneralOpdExaminationComponent } from './general-opd-examination.component';

const SESSION = {
  serviceLineDetails: JSON.stringify({ facilityID: 1, parkingPlaceID: 2 }),
  visitID: '10',
  beneficiaryRegID: '20',
  providerServiceID: '3',
  userName: 'doc',
  beneficiaryID: '40',
  sessionID: '5',
  benFlowID: '6',
  visitCode: '77',
};

describe('GeneralOpdExaminationComponent', () => {
  let component: GeneralOpdExaminationComponent;
  let fixture: ComponentFixture<GeneralOpdExaminationComponent>;
  let doctor: any;
  let nurse: any;
  let confirm: any;
  let session: any;
  let utils: GeneralUtils;
  let form: FormGroup;

  const examData = () => ({
    generalExamination: { consciousness: 'Conscious' },
    headToToeExamination: { head: 'Normal' },
    gastrointestinalExamination: { inspection: 'GI' },
    cardiovascularExamination: { murmurs: 'None' },
    respiratoryExamination: { trachea: 'Central' },
    centralNervousExamination: { handedness: 'Right Handed' },
    musculoskeletalExamination: { spine: 'OK' },
    genitourinaryExamination: { renalAngle: 'Normal' },
    obstetricExamination: {
      malPresentation: true,
      lowLyingPlacenta: false,
      vertebralDeformity: true,
      isHRP: true,
      reasonsForHRP: 'Short stature',
      sfh: 20,
    },
  });

  beforeEach(async () => {
    doctor = autoSpy(DoctorService);
    nurse = autoSpy(NurseService);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [GeneralOpdExaminationComponent],
      providers: [
        ...commonTestProviders({ session: SESSION }),
        { provide: DoctorService, useValue: doctor },
        { provide: NurseService, useValue: nurse },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(GeneralOpdExaminationComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    session = TestBed.inject(SessionStorageService);
    utils = new GeneralUtils(
      new FormBuilder(),
      createSessionStorageMock(SESSION) as any,
    );
    form = utils.createPatientExaminationForm();
    component.patientExaminationForm = form;
  });

  it('should create and bind the sub-forms', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
    expect(component.generalExaminationForm).toBe(
      form.get('generalExaminationForm') as FormGroup,
    );
    expect(component.headToToeExaminationForm).toBe(
      form.get('headToToeExaminationForm') as FormGroup,
    );
    expect(component.systemicExaminationForm).toBe(
      form.get('systemicExaminationForm') as FormGroup,
    );
  });

  it('re-assigns the language set on ngDoCheck', () => {
    component.current_language_set = null;
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  describe('ngOnChanges', () => {
    beforeEach(() => component.assignSelectedLanguage());

    it('does not fetch or update in a fresh (non view/update) mode', () => {
      component.mode = 'new';
      component.ngOnChanges();
      expect(doctor.getGeneralExamintionData).not.toHaveBeenCalled();
      expect(doctor.updatePatientExamination).not.toHaveBeenCalled();
    });

    it('fetches examination data in view mode', () => {
      component.mode = 'view';
      component.ngOnChanges();
      expect(doctor.getGeneralExamintionData).toHaveBeenCalledWith('20', '10');
    });

    it('fetches examination data for specialist flag 100', () => {
      session.setItem('specialistFlag', '100');
      component.mode = 'new';
      component.ngOnChanges();
      expect(doctor.getGeneralExamintionData).toHaveBeenCalledTimes(1);
    });

    it('does not fetch for other specialist flags', () => {
      session.setItem('specialistFlag', '200');
      component.mode = 'new';
      component.ngOnChanges();
      expect(doctor.getGeneralExamintionData).not.toHaveBeenCalled();
    });

    it('updates the examination in update mode', () => {
      component.mode = 'update';
      component.visitCategory = 'General OPD';
      component.ngOnChanges();
      expect(doctor.updatePatientExamination).toHaveBeenCalled();
    });
  });

  describe('checkRequired', () => {
    beforeEach(() => component.assignSelectedLanguage());

    it('returns true when all conditional fields are valid', () => {
      expect(component.checkRequired(form)).toBeTrue();
      expect(confirm.notify).not.toHaveBeenCalled();
    });

    it('lists every invalid conditional field and notifies', () => {
      const gen = form.get('generalExaminationForm') as FormGroup;
      [
        'typeOfDangerSigns',
        'lymphnodesInvolved',
        'typeOfLymphadenopathy',
        'extentOfEdema',
        'edemaType',
      ].forEach((c) => {
        gen.controls[c].setValidators(Validators.required);
        gen.controls[c].setValue(null);
      });
      const g =
        LANGUAGE_EN.ExaminationData.ANC_OPD_PNCExamination.genExamination;
      expect(component.checkRequired(form)).toBeFalse();
      expect(confirm.notify).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.mandatoryFields,
        [
          g.dangersigns,
          g.lymph,
          g.typeofLymphadenopathy,
          g.extentofEdema,
          g.typeofEdema,
        ],
      );
    });
  });

  describe('updatePatientExamination', () => {
    beforeEach(() => {
      component.assignSelectedLanguage();
      component.visitCategory = 'ANC';
    });

    it('sends update details and marks the form pristine on success', () => {
      doctor.updatePatientExamination.and.returnValue(
        of({ statusCode: 200, data: { ok: true } }),
      );
      form.markAsDirty();
      component.updatePatientExamination(form);
      expect(doctor.updatePatientExamination).toHaveBeenCalledWith(
        form.value,
        'ANC',
        {
          beneficiaryRegID: '20',
          benVisitID: '10',
          providerServiceMapID: '3',
          modifiedBy: 'doc',
          beneficiaryID: '40',
          sessionID: '5',
          parkingPlaceID: 2,
          facilityID: 1,
          benFlowID: '6',
          visitCode: '77',
        },
      );
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.examUpdated,
        'success',
      );
      expect(form.pristine).toBeTrue();
      expect(nurse.setUpdateForHrpStatus).toHaveBeenCalledWith(false);
    });

    it('alerts on non-200 response', () => {
      doctor.updatePatientExamination.and.returnValue(
        of({ statusCode: 5000, data: null }),
      );
      component.updatePatientExamination(form);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.errorInExamUpdated,
        'error',
      );
    });

    it('alerts when data is null even with 200', () => {
      doctor.updatePatientExamination.and.returnValue(
        of({ statusCode: 200, data: null }),
      );
      component.updatePatientExamination(form);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.errorInExamUpdated,
        'error',
      );
    });

    it('alerts on error', () => {
      doctor.updatePatientExamination.and.returnValue(throwingObs());
      component.updatePatientExamination(form);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.errorInExamUpdated,
        'error',
      );
    });

    it('does nothing when required fields are missing', () => {
      spyOn(component, 'checkRequired').and.returnValue(false);
      component.updatePatientExamination(form);
      expect(doctor.updatePatientExamination).not.toHaveBeenCalled();
    });
  });

  describe('getAncExaminationData', () => {
    beforeEach(() => spyOn(console, 'log'));

    it('patches ANC data, stringifies obstetric flags and enables HRP reasons', () => {
      (form.get('systemicExaminationForm') as FormGroup).addControl(
        'obstetricExaminationForANCForm',
        utils.createObstetricExaminationForANCForm(),
      );
      doctor.getGeneralExamintionData.and.returnValue(
        of({ statusCode: 200, data: examData() }),
      );
      component.visitCategory = 'ANC';
      component.getAncExaminationData('20', '10');
      const obs = form.get(
        'systemicExaminationForm.obstetricExaminationForANCForm',
      )!.value;
      expect(obs.malPresentation).toBe('true');
      expect(obs.lowLyingPlacenta).toBe('false');
      expect(obs.vertebralDeformity).toBe('true');
      expect(form.get('generalExaminationForm.consciousness')!.value).toBe(
        'Conscious',
      );
      expect(
        form.get('systemicExaminationForm.cardioVascularSystemForm.murmurs')!
          .value,
      ).toBe('None');
      expect(doctor.isHrpFromNurse).toBeTrue();
      expect(doctor.reasonHrpFromNurse).toBe('Short stature');
      expect(doctor.enableHrpReasonsStatus).toHaveBeenCalledWith(true);
    });

    it('does not enable HRP reasons when HRP values are missing', () => {
      const data: any = examData();
      data.obstetricExamination = {
        malPresentation: null,
        lowLyingPlacenta: null,
        vertebralDeformity: null,
        isHRP: null,
        reasonsForHRP: null,
      };
      doctor.getGeneralExamintionData.and.returnValue(
        of({ statusCode: 200, data }),
      );
      component.visitCategory = 'ANC';
      component.getAncExaminationData('20', '10');
      expect(doctor.enableHrpReasonsStatus).not.toHaveBeenCalled();
      expect(data.obstetricExamination.malPresentation).toBeNull();
    });

    ['PNC', 'General OPD'].forEach((cat) => {
      it(`patches ${cat} data including GI section`, () => {
        doctor.getGeneralExamintionData.and.returnValue(
          of({ statusCode: 200, data: examData() }),
        );
        component.visitCategory = cat;
        component.getAncExaminationData('20', '10');
        expect(
          form.get(
            'systemicExaminationForm.gastroIntestinalSystemForm.inspection',
          )!.value,
        ).toBe('GI');
        expect(form.get('headToToeExaminationForm.head')!.value).toBe('Normal');
        expect(doctor.enableHrpReasonsStatus).not.toHaveBeenCalled();
      });
    });

    it('ignores non-200 responses', () => {
      doctor.getGeneralExamintionData.and.returnValue(
        of({ statusCode: 5000, data: null }),
      );
      component.visitCategory = 'PNC';
      component.getAncExaminationData('20', '10');
      expect(form.get('headToToeExaminationForm.head')!.value).toBeNull();
    });

    it('unsubscribes on destroy', () => {
      component.getAncExaminationData('20', '10');
      const sub = component.ancExaminationDataSubscription;
      component.ngOnDestroy();
      expect(sub.closed).toBeTrue();
    });

    it('ngOnDestroy tolerates a missing subscription', () => {
      component.ancExaminationDataSubscription = undefined;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('checkObstetricExamination', () => {
    it('leaves data untouched when obstetric examination is missing', () => {
      const temp: any = { obstetricExamination: null };
      component.checkObstetricExamination(temp);
      expect(temp.obstetricExamination).toBeNull();
    });
  });

  describe('patchOralExamination', () => {
    beforeEach(() => {
      form.addControl('oralExaminationForm', utils.createOralExaminationForm());
    });

    it('moves an unknown lesion into otherLesionType', () => {
      component.patchOralExamination({
        oralDetails: {
          preMalignantLesionTypeList: ['Leukoplakia', 'Weird lesion'],
          observation: 'obs',
        },
      });
      const oral = form.get('oralExaminationForm')!.value;
      expect(oral.otherLesionType).toBe('Weird lesion');
      expect(oral.preMalignantLesionTypeList).toEqual([
        'Leukoplakia',
        'Weird lesion',
        'Any other lesion',
      ]);
      expect(oral.observation).toBe('obs');
    });

    it('keeps known lesions without adding "Any other lesion"', () => {
      component.patchOralExamination({
        oralDetails: { preMalignantLesionTypeList: ['Melanoplakia'] },
      });
      const oral = form.get('oralExaminationForm')!.value;
      expect(oral.preMalignantLesionTypeList).toEqual(['Melanoplakia']);
      expect(oral.otherLesionType).toBeNull();
    });

    it('patches when the lesion list is null', () => {
      component.patchOralExamination({
        oralDetails: { preMalignantLesionTypeList: null, observation: 'x' },
      });
      expect(form.get('oralExaminationForm')!.value.observation).toBe('x');
    });

    it('does nothing without oral details', () => {
      component.patchOralExamination({ oralDetails: null });
      expect(form.get('oralExaminationForm')!.value.observation).toBeNull();
    });
  });
});
