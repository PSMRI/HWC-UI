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
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';

import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';
import { SchedulerComponent } from './scheduler.component';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { DoctorService } from '../shared/services/doctor.service';
import { NurseService } from '../shared/services';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

describe('SchedulerComponent', () => {
  let component: SchedulerComponent;
  let fixture: ComponentFixture<SchedulerComponent>;
  let doctorService: any;
  let nurseService: any;
  let confirm: any;
  let dialogRef: any;
  let session: any;

  const setup = async (dialogData: any) => {
    TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [SchedulerComponent],
      providers: [
        ...commonTestProviders({
          session: { providerServiceID: 7, userID: 8 },
        }),
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: DoctorService, useValue: autoSpy(DoctorService) },
        {
          provide: NurseService,
          useValue: autoSpy(NurseService, {}, undefined),
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    if (!dialogData) {
      // The new-schedule form uses Material controls (mat-radio/mat-select)
      // that have no value accessor under NO_ERRORS_SCHEMA; test class logic.
      TestBed.overrideTemplate(SchedulerComponent, '');
    }
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(SchedulerComponent);
    component = fixture.componentInstance;
    doctorService = TestBed.inject(DoctorService);
    nurseService = TestBed.inject(NurseService);
    confirm = TestBed.inject(ConfirmationService);
    dialogRef = TestBed.inject(MatDialogRef);
    session = TestBed.inject(SessionStorageService);
  };

  describe('with existing scheduled data', () => {
    const data = {
      schedulerForm: {
        allocation: true,
        allocationDate: new Date(2024, 0, 2),
        specialization: { specialization: 'Cardio' },
        specialistDetails: { userName: 'drx' },
      },
      tmSlot: { fromTime: '10:00', toTime: '10:15' },
    };
    beforeEach(async () => {
      await setup(data);
      fixture.detectChanges();
    });

    it('shows the scheduled data and does not build a form', () => {
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.scheduledData).toBe(data);
      expect(component.schedulerForm).toBeUndefined();
      expect(fixture.nativeElement.textContent).toContain('Cardio');
      expect(fixture.nativeElement.textContent).toContain('drx');
    });

    it('clearScheduledSlot flags comorbid false and closes with clear', () => {
      component.clearScheduledSlot();
      expect(session.setItem).toHaveBeenCalledWith('setComorbid', 'false');
      expect(component.ansComorbid).toBe('false');
      expect(nurseService.filter).toHaveBeenCalledWith('false');
      expect(dialogRef.close).toHaveBeenCalledWith({ clear: true });
    });

    it('closeModal closes with false', () => {
      component.closeModal();
      expect(dialogRef.close).toHaveBeenCalledWith(false);
    });

    it('ngDoCheck refreshes language', () => {
      component.currentLanguageSet = null;
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });
  });

  describe('new schedule', () => {
    beforeEach(async () => {
      await setup(null);
      doctorService.getMasterSpecialization.and.returnValue(
        of({ statusCode: 200, data: [{ specializationID: 3 }] }),
      );
      fixture.detectChanges();
    });

    it('builds an empty form', () => {
      expect(component.scheduledData).toBeNull();
      expect(component.schedulerForm.value).toEqual({
        allocation: null,
        allocationDate: null,
        specialization: null,
        specialistDetails: null,
      });
      expect(component.today instanceof Date).toBeTrue();
    });

    it('walk-in allocation sets today and loads specializations', () => {
      component.masterSpecialistDetails = [1];
      component.checkAllocation(true);
      expect(component.allocationDate instanceof Date).toBeTrue();
      expect(component.masterSpecialization).toEqual([{ specializationID: 3 }]);
      expect(component.masterSpecialistDetails).toEqual([]);
      expect(component.availableSlotList).toBeNull();
    });

    it('scheduled allocation sets future window and loads specializations', () => {
      component.checkAllocation(false);
      expect(component.allocationDate).toBeNull();
      expect(component.today.getTime()).toBeGreaterThan(Date.now());
      expect(component.schedulerDate.getTime()).toBeGreaterThan(
        component.today.getTime(),
      );
      expect(component.masterSpecialization).toEqual([{ specializationID: 3 }]);
    });

    it('other allocation values do nothing but reset', () => {
      component.checkAllocation(undefined);
      expect(doctorService.getMasterSpecialization).not.toHaveBeenCalled();
      expect(component.masterSpecialization).toEqual([]);
    });

    it('getMasterSpecialization alerts on non-200 and on error', () => {
      component.schedulerForm.patchValue({ allocationDate: new Date() });
      doctorService.getMasterSpecialization.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'm' }),
      );
      component.getMasterSpecialization();
      expect(confirm.alert).toHaveBeenCalledWith('m', 'error');
      doctorService.getMasterSpecialization.and.returnValue(throwingObs('x'));
      component.getMasterSpecialization();
      expect(confirm.alert).toHaveBeenCalledWith('x', 'error');
    });

    it('getMasterSpecializationSchedule alerts on non-200 and on error', () => {
      doctorService.getMasterSpecialization.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'n' }),
      );
      component.getMasterSpecializationSchedule();
      expect(confirm.alert).toHaveBeenCalledWith('n', 'error');
      doctorService.getMasterSpecialization.and.returnValue(throwingObs('y'));
      component.getMasterSpecializationSchedule();
      expect(confirm.alert).toHaveBeenCalledWith('y', 'error');
    });

    describe('getSpecialist', () => {
      beforeEach(() =>
        component.schedulerForm.patchValue({
          specialization: { specializationID: 3 },
          specialistDetails: { userID: 1 },
        }),
      );
      it('loads specialists for the chosen specialization', () => {
        doctorService.getSpecialist.and.returnValue(
          of({ statusCode: 200, data: [{ userID: 9 }] }),
        );
        component.getSpecialist();
        expect(doctorService.getSpecialist).toHaveBeenCalledWith({
          providerServiceMapID: 7,
          specializationID: 3,
          userID: 8,
        });
        expect(component.specialistDetails).toBeNull();
        expect(component.masterSpecialistDetails).toEqual([{ userID: 9 }]);
      });
      it('alerts on non-200', () => {
        doctorService.getSpecialist.and.returnValue(
          of({ statusCode: 5000, errorMessage: 's' }),
        );
        component.getSpecialist();
        expect(confirm.alert).toHaveBeenCalledWith('s', 'error');
      });
      it('alerts on error', () => {
        doctorService.getSpecialist.and.returnValue(throwingObs('t'));
        component.getSpecialist();
        expect(confirm.alert).toHaveBeenCalledWith('t', 'error');
      });
    });

    describe('getAvailableSlot', () => {
      const date = new Date(2024, 4, 5);
      beforeEach(() =>
        component.schedulerForm.patchValue({
          allocationDate: date,
          specialistDetails: { userID: 9 },
        }),
      );
      it('loads slots for the specialist and date', () => {
        doctorService.getAvailableSlot.and.returnValue(
          of({ statusCode: 200, data: { slots: [{ status: 'Available' }] } }),
        );
        component.getAvailableSlot(null);
        expect(doctorService.getAvailableSlot).toHaveBeenCalledWith({
          userID: 9,
          date,
        });
        expect(component.availableSlotList).toEqual([{ status: 'Available' }]);
      });
      it('alerts on non-200', () => {
        doctorService.getAvailableSlot.and.returnValue(
          of({ statusCode: 5000, errorMessage: 'u' }),
        );
        component.getAvailableSlot(null);
        expect(confirm.alert).toHaveBeenCalledWith('u', 'error');
      });
      it('alerts on error', () => {
        doctorService.getAvailableSlot.and.returnValue(throwingObs('v'));
        component.getAvailableSlot(null);
        expect(confirm.alert).toHaveBeenCalledWith('v', 'error');
      });
    });

    it('selectAvailableSlot only accepts available slots', () => {
      component.selectAvailableSlot({ status: 'Booked' });
      expect(component.selectedSlot).toBeUndefined();
      const slot = { status: 'AVAILABLE' };
      component.selectAvailableSlot(slot);
      expect(component.selectedSlot).toBe(slot);
    });

    it('saveScheduledSlot closes with slot details when complete', () => {
      const date = new Date(2024, 4, 5);
      component.schedulerForm.patchValue({
        allocation: false,
        allocationDate: date,
        specialization: { specializationID: 3 },
        specialistDetails: { userID: 9 },
      });
      component.selectedSlot = { fromTime: '10:00', toTime: '10:15' };
      component.saveScheduledSlot();
      expect(session.setItem).toHaveBeenCalledWith('setComorbid', 'true');
      expect(nurseService.filter).toHaveBeenCalledWith('true');
      expect(dialogRef.close).toHaveBeenCalledWith({
        schedulerForm: component.schedulerForm.value,
        tmSlot: {
          walkIn: false,
          specializationID: 3,
          allocationDate: date,
          userID: 9,
          fromTime: '10:00',
          toTime: '10:15',
        },
      });
    });

    it('saveScheduledSlot closes with null when incomplete', () => {
      component.saveScheduledSlot();
      expect(dialogRef.close).toHaveBeenCalledWith(null);
      expect(nurseService.filter).not.toHaveBeenCalled();
    });
  });
});
