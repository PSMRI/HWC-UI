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
import { of } from 'rxjs';

import { HypertensionScreeningComponent } from './hypertension-screening.component';
import { DoctorService } from '../../shared/services/doctor.service';
import { NurseService } from '../../shared/services/nurse.service';
import { NcdScreeningService } from '../../shared/services/ncd-screening.service';
import { NCDScreeningUtils } from '../../shared/utility/ncd-screening-utility';
import { ConfirmationService } from 'src/app/app-modules/core/services/confirmation.service';
import { IotcomponentComponent } from 'src/app/app-modules/core/components/iotcomponent/iotcomponent.component';
import { environment } from 'src/environments/environment';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('HypertensionScreeningComponent', () => {
  let component: HypertensionScreeningComponent;
  let fixture: ComponentFixture<HypertensionScreeningComponent>;
  let ncd: NcdScreeningService;
  let doctor: any;
  let nurse: any;
  let confirm: any;
  let dialog: any;
  let params: any;
  let form: FormGroup;

  beforeEach(async () => {
    params = { attendant: 'nurse' };
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [HypertensionScreeningComponent],
      providers: [
        ...commonTestProviders(),
        NcdScreeningService,
        { provide: DoctorService, useValue: autoSpy(DoctorService) },
        { provide: NurseService, useValue: autoSpy(NurseService) },
        { provide: ActivatedRoute, useValue: { snapshot: { params } } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    ncd = TestBed.inject(NcdScreeningService);
    doctor = TestBed.inject(DoctorService);
    nurse = TestBed.inject(NurseService);
    confirm = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    form = new NCDScreeningUtils(
      new FormBuilder(),
      {} as any,
    ).createHypertensionForm();
    fixture = TestBed.createComponent(HypertensionScreeningComponent);
    component = fixture.componentInstance;
    component.hypertensionScreeningForm = form;
    component.confirmDiseasesList = [];
  });

  describe('nurse mode', () => {
    beforeEach(() => fixture.detectChanges());

    it('initialises with language, attendant and disabled checkbox', () => {
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.attendant).toBe('nurse');
      expect(component.disableCheckbox).toBeTrue();
      expect(component.hideStatusButton).toBeFalse();
      expect(
        fixture.nativeElement.querySelector('[formcontrolname]'),
      ).not.toBeNull();
    });

    it('disables form when hypertension confirmed', () => {
      ncd.setConfirmedDiseasesForScreening([environment.hypertension]);
      expect(form.disabled).toBeTrue();
      expect(component.hideStatusButton).toBeTrue();
      expect(component.disableCheckbox).toBeTrue();
      expect(form.getRawValue().formDisable).toBeTrue();
    });

    it('re-enables form when other disease confirmed and re-emits suspicion', () => {
      spyOn(ncd, 'hypertensionSuspectStatus').and.callThrough();
      component.isHypertensionSuspected = true;
      ncd.isHypertensionConfirmed = true;
      form.disable();
      ncd.setConfirmedDiseasesForScreening(['Other']);
      expect(form.enabled).toBeTrue();
      expect(ncd.isHypertensionConfirmed).toBeFalse();
      expect(component.disableCheckbox).toBeFalse();
      expect(ncd.hypertensionSuspectStatus).toHaveBeenCalledWith(true);
    });

    it('enables checkbox for suspected hypertension with empty confirmed list', () => {
      component.isHypertensionSuspected = true;
      ncd.setConfirmedDiseasesForScreening([]);
      expect(component.disableCheckbox).toBeFalse();
    });

    it('fetches nurse data when screening data fetch flag set', () => {
      doctor.screeningDetailsResponseFromNurse = {
        hypertension: { suspected: true, systolicBP_1stReading: 150 },
      };
      ncd.setScreeningDataFetch(true);
      expect(component.hideRemoveFunctionalityInDoctorIfSuspected).toBeTrue();
      expect(component.isHypertensionSuspected).toBeTrue();
      expect(form.value.systolicBP_1stReading).toBe(150);
      expect(ncd.hypertensionScreeningStatus.value).toBeTrue();
    });

    it('getNcdScreeningDataForCbac ignores missing data', () => {
      doctor.screeningDetailsResponseFromNurse = { hypertension: null };
      component.getNcdScreeningDataForCbac();
      expect(component.hideRemoveFunctionalityInDoctorIfSuspected).toBeFalse();
    });

    it('marks non-suspected from nurse data', () => {
      doctor.screeningDetailsResponseFromNurse = {
        hypertension: { suspected: false },
      };
      component.getNcdScreeningDataForCbac();
      expect(component.isHypertensionSuspected).toBeFalse();
    });

    describe('range checks', () => {
      [30, 330].forEach((v) =>
        it(`alerts for systolic ${v}`, () => {
          component.bpStatus = 'x';
          component.checkSystolicBP(v);
          expect(confirm.alert).toHaveBeenCalledWith(
            LANGUAGE_EN.alerts.info.recheckValue,
          );
          expect(component.bpStatus).toBeNull();
        }),
      );
      it('no alert for valid systolic', () => {
        component.checkSystolicBP(120);
        expect(confirm.alert).not.toHaveBeenCalled();
      });
      [5, 190].forEach((v) =>
        it(`alerts for diastolic ${v}`, () => {
          component.checkDiastolicBP(v);
          expect(confirm.alert).toHaveBeenCalledWith(
            LANGUAGE_EN.alerts.info.recheckValue,
          );
        }),
      );
      it('no alert for valid diastolic', () => {
        component.isHypertensionSuspected = true;
        component.checkDiastolicBP(80);
        expect(confirm.alert).not.toHaveBeenCalled();
        expect(component.isHypertensionSuspected).toBeFalse();
      });
    });

    describe('averages', () => {
      it('averages systolic readings ignoring blanks', () => {
        form.patchValue({
          systolicBP_1stReading: '120',
          systolicBP_2ndReading: '',
          systolicBP_3rdReading: 131,
        });
        component.calculateAverageSystolicBP();
        expect(form.value.averageSystolicBP).toBe('126');
        expect(component.disableStatusButton).toBeTrue();
        form.patchValue({ averageDiastolicBP: '80' });
        component.calculateAverageSystolicBP();
        expect(component.disableStatusButton).toBeFalse();
      });

      it('sets systolic average null when no readings', () => {
        component.calculateAverageSystolicBP();
        expect(form.value.averageSystolicBP).toBeNull();
      });

      it('averages diastolic readings', () => {
        form.patchValue({
          diastolicBP_1stReading: 80,
          diastolicBP_2ndReading: 90,
          diastolicBP_3rdReading: null,
        });
        component.calculateAverageDiastolicBP();
        expect(form.value.averageDiastolicBP).toBe('85');
        expect(component.disableStatusButton).toBeTrue();
        form.patchValue({ averageSystolicBP: '120' });
        form.patchValue({ diastolicBP_3rdReading: 100 });
        component.calculateAverageDiastolicBP();
        expect(form.value.averageDiastolicBP).toBe('90');
        expect(component.disableStatusButton).toBeFalse();
        expect(ncd.valueChangedForNCD.value).toBeTrue();
      });

      it('sets diastolic average null when no readings', () => {
        component.calculateAverageDiastolicBP();
        expect(form.value.averageDiastolicBP).toBeNull();
      });
    });

    describe('systolic/diastolic cross checks', () => {
      const sys: [string, string][] = [
        ['checkSystolicGreater1', 'systolicBP_1stReading'],
        ['checkSystolicGreater2', 'systolicBP_2ndReading'],
        ['checkSystolicGreater3', 'systolicBP_3rdReading'],
      ];
      sys.forEach(([m, ctrl]) => {
        it(`${m} clears systolic when <= diastolic`, () => {
          form.patchValue({ [ctrl]: 80 });
          (component as any)[m]('80', '90');
          expect(confirm.alert).toHaveBeenCalledWith(
            LANGUAGE_EN.alerts.info.sysBp,
          );
          expect(form.value[ctrl]).toBeNull();
        });
        it(`${m} keeps valid systolic`, () => {
          form.patchValue({ [ctrl]: 120 });
          (component as any)[m]('120', '80');
          (component as any)[m]('120', null);
          expect(confirm.alert).not.toHaveBeenCalled();
          expect(form.value.averageSystolicBP).toBe('120');
        });
      });
      const dia: [string, string][] = [
        ['checkDiastolicLesser1', 'diastolicBP_1stReading'],
        ['checkDiastolicLesser2', 'diastolicBP_2ndReading'],
        ['checkDiastolicLesser3', 'diastolicBP_3rdReading'],
      ];
      dia.forEach(([m, ctrl]) => {
        it(`${m} clears diastolic when >= systolic`, () => {
          form.patchValue({ [ctrl]: 130 });
          (component as any)[m]('120', '130');
          expect(confirm.alert).toHaveBeenCalledWith(
            LANGUAGE_EN.alerts.info.DiaBp,
          );
          expect(form.value[ctrl]).toBeNull();
        });
        it(`${m} keeps valid diastolic`, () => {
          form.patchValue({ [ctrl]: 80 });
          (component as any)[m]('120', '80');
          (component as any)[m](null, '80');
          expect(confirm.alert).not.toHaveBeenCalled();
          expect(form.value.averageDiastolicBP).toBe('80');
        });
      });
    });

    describe('checkBloodPressureStatus', () => {
      beforeEach(() =>
        form.patchValue({ averageSystolicBP: '150', averageDiastolicBP: '95' }),
      );

      it('does nothing without averages', () => {
        form.patchValue({ averageSystolicBP: '' });
        component.checkBloodPressureStatus();
        expect(nurse.getBloodPressureStatus).not.toHaveBeenCalled();
      });

      it('marks suspected for hypertensive status', () => {
        nurse.getBloodPressureStatus.and.returnValue(
          of({ statusCode: 200, data: { status: 'Stage 1 Hypertension' } }),
        );
        component.checkBloodPressureStatus();
        expect(nurse.getBloodPressureStatus).toHaveBeenCalledWith({
          averageSystolic: '150',
          averageDiastolic: '95',
        });
        expect(component.bpStatus).toBe('Stage 1 Hypertension');
        expect(component.isHypertensionSuspected).toBeTrue();
        expect(component.disableCheckbox).toBeFalse();
        expect(form.value.suspected).toBeTrue();
        expect(ncd.hypertensionScreeningStatus.value).toBeTrue();
      });

      it('does not mark suspected when already confirmed and other attendant', () => {
        ncd.isHypertensionConfirmed = true;
        component.attendant = 'tcspecialist';
        component.disableCheckbox = true;
        nurse.getBloodPressureStatus.and.returnValue(
          of({ statusCode: 200, data: { status: 'Stage 2' } }),
        );
        component.checkBloodPressureStatus();
        expect(component.isHypertensionSuspected).toBeFalse();
        expect(component.disableCheckbox).toBeTrue();
      });

      ['Normal BP', 'Pre-Hypertension'].forEach((status) =>
        it(`unsuspects for ${status}`, () => {
          component.isHypertensionSuspected = true;
          nurse.getBloodPressureStatus.and.returnValue(
            of({ statusCode: 200, data: { status } }),
          );
          component.checkBloodPressureStatus();
          expect(component.isHypertensionSuspected).toBeFalse();
          expect(form.value.suspected).toBeFalse();
        }),
      );

      it('alerts on non-200', () => {
        nurse.getBloodPressureStatus.and.returnValue(of({ statusCode: 500 }));
        component.checkBloodPressureStatus();
        expect(confirm.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.issueFetchingBPStatus,
          'error',
        );
      });
    });

    describe('IOT dialogs', () => {
      const cases: [string, string, string][] = [
        ['openIOTBP1Model', 'systolicBP_1stReading', 'diastolicBP_1stReading'],
        ['openIOTBP2Model', 'systolicBP_2ndReading', 'diastolicBP_2ndReading'],
        ['openIOTBP3Model', 'systolicBP_3rdReading', 'diastolicBP_3rdReading'],
      ];
      cases.forEach(([m, s, d]) =>
        it(`${m} patches readings from device`, () => {
          dialog.open.and.returnValue({
            afterClosed: () => of({ sys: 130, dia: 85 }),
          });
          (component as any)[m]();
          expect(dialog.open).toHaveBeenCalledWith(IotcomponentComponent, {
            width: '600px',
            height: '180px',
            disableClose: true,
            data: { startAPI: environment.startBPurl },
          });
          expect(form.value[s]).toBe(130);
          expect(form.value[d]).toBe(85);
        }),
      );
    });

    describe('hideHypertensionForm', () => {
      it('removes form on confirm', () => {
        const emitted: boolean[] = [];
        component.hypertensionFormStatus.subscribe((v) => emitted.push(v));
        form.patchValue({ systolicBP_1stReading: 120 });
        spyOn(ncd, 'screeningValueChanged').and.callThrough();
        component.hideHypertensionForm();
        expect(confirm.confirm).toHaveBeenCalledWith(
          'warn',
          LANGUAGE_EN.alerts.info.warn,
        );
        expect(component.hideBpForm).toBeTrue();
        expect(emitted).toEqual([false]);
        expect(form.value.systolicBP_1stReading).toBeNull();
        expect(ncd.screeningValueChanged).not.toHaveBeenCalled();
      });

      it('flags value change in update mode', () => {
        component.mode = 'update';
        spyOn(ncd, 'screeningValueChanged').and.callThrough();
        component.hideHypertensionForm();
        expect(ncd.screeningValueChanged).toHaveBeenCalledWith(true);
      });

      it('keeps form on cancel', () => {
        confirm.confirm.and.returnValue(of(false));
        component.hideBpForm = true;
        component.hideHypertensionForm();
        expect(component.hideBpForm).toBeFalse();
      });
    });

    [true, false].forEach((v) => {
      it(`markAsUnsuspected(${v}) updates form and badge`, () => {
        component.markAsUnsuspected(v);
        expect(form.value.suspected).toBe(v);
        expect(component.isHypertensionSuspected).toBe(v);
        expect(form.dirty).toBeTrue();
        expect(ncd.hypertensionScreeningStatus.value).toBe(v);
      });
      it(`markAsUnSuspectedOnLoad(${v}) updates form without dirtying`, () => {
        component.markAsUnSuspectedOnLoad(v);
        expect(form.value.suspected).toBe(v);
        expect(form.dirty).toBeFalse();
        expect(ncd.valueChangedForNCD.value).toBeTrue();
      });
    });

    it('ngOnDestroy unsubscribes and resets form', () => {
      component.screeningDataSubscription = {
        unsubscribe: jasmine.createSpy(),
      };
      const sub = component.confirmedDiseasesListSubscription;
      form.patchValue({ systolicBP_1stReading: 120 });
      fixture.destroy();
      expect(
        component.screeningDataSubscription.unsubscribe,
      ).toHaveBeenCalled();
      expect(sub.closed).toBeTrue();
      expect(form.value.systolicBP_1stReading).toBeNull();
    });
  });

  it('view mode loads nurse data and disables status button', () => {
    doctor.screeningDetailsResponseFromNurse = {
      hypertension: { suspected: true },
    };
    component.mode = 'view';
    fixture.detectChanges();
    expect(component.isHypertensionSuspected).toBeTrue();
    expect(form.value.suspected).toBeTrue();
    expect(component.disableStatusButton).toBeTrue();
  });
});
