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

import { NeonatalPatientVitalsComponent } from './neonatal-patient-vitals.component';
import { DoctorService, NurseService } from '../../shared/services';
import { BeneficiaryDetailsService } from 'src/app/app-modules/core/services/beneficiary-details.service';
import { ConfirmationService } from 'src/app/app-modules/core/services/confirmation.service';
import { IotcomponentComponent } from 'src/app/app-modules/core/components/iotcomponent/iotcomponent.component';
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

describe('NeonatalPatientVitalsComponent', () => {
  let component: NeonatalPatientVitalsComponent;
  let fixture: ComponentFixture<NeonatalPatientVitalsComponent>;
  let doctor: any;
  let nurse: any;
  let confirm: any;
  let dialog: any;
  let ben$: BehaviorSubject<any>;
  let routeParams: any;
  let form: FormGroup;
  const RECHECK = LANGUAGE_EN.alerts.info.recheckValue;

  async function setup(
    opts: { session?: Record<string, any>; attendant?: string; ben?: any } = {},
  ) {
    ben$ = new BehaviorSubject<any>(opts.ben ?? null);
    routeParams = { attendant: opts.attendant ?? 'doctor' };
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [NeonatalPatientVitalsComponent],
      providers: [
        ...commonTestProviders({
          session: {
            visitID: 'V1',
            beneficiaryRegID: 'B1',
            ...(opts.session ?? {}),
          },
        }),
        { provide: DoctorService, useValue: autoSpy(DoctorService) },
        {
          provide: NurseService,
          useValue: autoSpy(NurseService, { isAssessmentDone: true }),
        },
        {
          provide: BeneficiaryDetailsService,
          useValue: { beneficiaryDetails$: ben$ },
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: routeParams } },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(NeonatalPatientVitalsComponent);
    component = fixture.componentInstance;
    form = new FormBuilder().group({
      height_cm: [null],
      weight_Kg: [null],
      temperature: [null],
      headCircumference_cm: [null],
    });
    component.neonatalVitalsForm = form;
    component.visitCategory = 'Neonatal and Infant Health Care Services';
    doctor = TestBed.inject(DoctorService) as any;
    nurse = TestBed.inject(NurseService) as any;
    confirm = TestBed.inject(ConfirmationService) as any;
    dialog = TestBed.inject(MatDialog) as any;
  }

  describe('basic', () => {
    beforeEach(async () => {
      await setup({ session: { beneficiaryGender: 'Female' } });
      fixture.detectChanges();
    });

    it('should init: clear assessment, gender type and language', () => {
      expect(nurse.clearEnableLAssessment).toHaveBeenCalled();
      expect(component.benGenderType).toBe(1);
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.startWeightTest).toBe(environment.startWeighturl);
      expect(component.startTempTest).toBe(environment.startTempurl);
    });

    it('beneficiary details set age, months and gender flags', () => {
      ben$.next({ ageVal: 1, age: '1 years - 3 months', genderName: 'Female' });
      expect(component.benAge).toBe(1);
      expect(component.totalMonths).toBe(15);
      expect(component.female).toBeTrue();
      expect(component.male).toBeFalse();
      ben$.next({ ageVal: 0, genderName: 'Male' });
      expect(component.male).toBeTrue();
      ben$.next({ ageVal: 0, genderName: null });
      expect(component.benAge).toBe(1);
    });

    it('ngOnChanges for doctor in non-view mode does not fetch', () => {
      component.ngOnChanges();
      expect(component.attendant).toBe('doctor');
      expect(doctor.getGenericVitals).not.toHaveBeenCalled();
      expect(doctor.getPreviousVisitAnthropometry).not.toHaveBeenCalled();
      expect(component.doctorScreen).toBeFalse();
    });

    it('view mode fetches vitals and patches form', () => {
      doctor.getGenericVitals.and.returnValue(
        of({
          data: {
            benAnthropometryDetail: { height_cm: 50, weight_Kg: 4 },
            benPhysicalVitalDetail: { temperature: 98 },
          },
        }),
      );
      component.mode = 'view';
      component.ngOnChanges();
      expect(doctor.getGenericVitals).toHaveBeenCalledWith({
        benRegID: 'B1',
        benVisitID: 'V1',
      });
      expect(component.doctorScreen).toBeTrue();
      expect(component.height_cm).toBe(50);
      expect(component.weight_Kg).toBe(4);
      expect(component.temperature).toBe(98);
    });

    it('getGeneralVitalsData ignores null response', () => {
      doctor.getGenericVitals.and.returnValue(of(null));
      component.getGeneralVitalsData();
      expect(component.height_cm).toBeNull();
    });

    describe('update mode', () => {
      beforeEach(() => (component.mode = 'update'));

      it('success alerts and marks pristine', () => {
        doctor.updateNeonatalVitals.and.returnValue(
          of({ statusCode: 200, data: { response: 'Updated' } }),
        );
        form.markAsDirty();
        component.ngOnChanges();
        expect(doctor.updateNeonatalVitals).toHaveBeenCalledWith(
          form,
          'Neonatal and Infant Health Care Services',
        );
        expect(confirm.alert).toHaveBeenCalledWith('Updated', 'success');
        expect(doctor.setValueToEnableVitalsUpdateButton).toHaveBeenCalledWith(
          false,
        );
        expect(form.pristine).toBeTrue();
        expect(component.doctorScreen).toBeTrue();
      });

      it('non-200 alerts error', () => {
        doctor.updateNeonatalVitals.and.returnValue(
          of({ statusCode: 5000, errorMessage: 'bad' }),
        );
        component.ngOnChanges();
        expect(confirm.alert).toHaveBeenCalledWith('bad', 'error');
      });

      it('error alerts error', () => {
        doctor.updateNeonatalVitals.and.returnValue(throwingObs('boom'));
        component.ngOnChanges();
        expect(confirm.alert).toHaveBeenCalledWith('boom', 'error');
      });
    });

    it('openIOTWeightModel patches weight from dialog', () => {
      dialog.open.and.returnValue(createDialogRefMock({ result: 3.2 }));
      component.openIOTWeightModel();
      expect(dialog.open).toHaveBeenCalledWith(
        IotcomponentComponent,
        jasmine.objectContaining({
          width: '600px',
          disableClose: true,
          data: { startAPI: environment.startWeighturl },
        }),
      );
      expect(component.weight_Kg).toBe(3.2);
      expect(doctor.setValueToEnableVitalsUpdateButton).toHaveBeenCalledWith(
        true,
      );
    });

    it('openIOTTempModel patches temperature from dialog', () => {
      dialog.open.and.returnValue(createDialogRefMock({ temperature: 99 }));
      component.openIOTTempModel();
      expect(dialog.open).toHaveBeenCalledWith(
        IotcomponentComponent,
        jasmine.objectContaining({
          data: { startAPI: environment.startTempurl },
        }),
      );
      expect(component.temperature).toBe(99);
    });

    describe('range checks', () => {
      const neo = 'Neonatal and Infant Health Care Services';
      const child = 'Childhood & Adolescent Healthcare Services';
      const cases: [
        string,
        keyof NeonatalPatientVitalsComponent,
        number,
        boolean,
      ][] = [
        [neo, 'checkHeight', 30, true],
        [neo, 'checkHeight', 90, true],
        [neo, 'checkHeight', 50, false],
        [child, 'checkHeight', 50, true],
        [child, 'checkHeight', 200, true],
        [child, 'checkHeight', 100, false],
        [neo, 'checkWeight', 0.5, true],
        [neo, 'checkWeight', 16, true],
        [neo, 'checkWeight', 5, false],
        [child, 'checkWeight', 5, true],
        [child, 'checkWeight', 100, true],
        [child, 'checkWeight', 20, false],
        [neo, 'checkHeadCircumference', 29, true],
        [neo, 'checkHeadCircumference', 61, true],
        [neo, 'checkHeadCircumference', 40, false],
        [neo, 'checkTemperature', 94, true],
        [neo, 'checkTemperature', 107, true],
        [neo, 'checkTemperature', 98, false],
      ];
      cases.forEach(([cat, fn, val, alerts]) => {
        it(`${String(fn)}(${val}) in ${cat} alerts=${alerts}`, () => {
          component.visitCategory = cat;
          (component[fn] as any)(val);
          if (alerts) expect(confirm.alert).toHaveBeenCalledWith(RECHECK);
          else expect(confirm.alert).not.toHaveBeenCalled();
        });
      });
    });

    it('ngOnDestroy unsubscribes and resets assessment flag', () => {
      component.getGeneralVitalsData();
      const s1 = spyOn(component.beneficiaryDetailSubscription, 'unsubscribe');
      const s2 = spyOn(component.generalVitalsDataSubscription, 'unsubscribe');
      component.ngOnDestroy();
      expect(s1).toHaveBeenCalled();
      expect(s2).toHaveBeenCalled();
      expect(nurse.isAssessmentDone).toBeFalse();
    });

    it('ngOnDestroy without subscriptions', () => {
      component.beneficiaryDetailSubscription = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
      expect(nurse.isAssessmentDone).toBeFalse();
    });
  });

  describe('getGender', () => {
    [
      ['Male', 0],
      ['Transgender', 2],
      [null, undefined],
    ].forEach(([g, expected]) => {
      it(`${g} -> ${expected}`, async () => {
        await setup({ session: { beneficiaryGender: g } });
        component.getGender();
        expect(component.benGenderType).toBe(expected as any);
      });
    });
  });

  describe('nurse / specialist', () => {
    it('nurse loads previous anthropometry, rounding .0 values', async () => {
      await setup({ attendant: 'nurse' });
      doctor.getPreviousVisitAnthropometry.and.returnValue(
        of({ data: { response: 72.0 } }),
      );
      component.ngOnChanges();
      expect(doctor.getPreviousVisitAnthropometry).toHaveBeenCalledWith({
        benRegID: 'B1',
      });
      expect(component.height_cm).toBe(72);
      doctor.getPreviousVisitAnthropometry.and.returnValue(
        of({ data: { response: '72.5' } }),
      );
      component.getPreviousVisitAnthropometry();
      expect(component.height_cm).toBe('72.5');
      doctor.getPreviousVisitAnthropometry.and.returnValue(
        of({ data: { response: '72.0' } }),
      );
      component.getPreviousVisitAnthropometry();
      expect(component.height_cm).toBe(72);
    });

    it('nurse ignores "No data found" / missing anthropometry', async () => {
      await setup({ attendant: 'nurse' });
      doctor.getPreviousVisitAnthropometry.and.returnValues(
        of({ data: { response: 'No data found' } }),
        of({ data: { response: 'Visit code is not found' } }),
        of(null),
      );
      component.getPreviousVisitAnthropometry();
      component.getPreviousVisitAnthropometry();
      component.getPreviousVisitAnthropometry();
      expect(component.height_cm).toBeNull();
    });

    it('specialist fetches vitals', async () => {
      await setup({ session: { specialistFlag: '100' } });
      doctor.getGenericVitals.and.returnValue(of(null));
      component.ngOnChanges();
      expect(doctor.getGenericVitals).toHaveBeenCalled();
      expect(component.doctorScreen).toBeFalse();
    });
  });
});
