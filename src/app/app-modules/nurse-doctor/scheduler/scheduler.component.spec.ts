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
  let session: any;
  let dialogRef: any;

  async function setup(dialogData: any) {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [SchedulerComponent],
      providers: [
        ...commonTestProviders({
          session: { providerServiceID: 4, userID: 7 },
        }),
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: DoctorService, useValue: autoSpy(DoctorService) },
        { provide: NurseService, useValue: autoSpy(NurseService) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SchedulerComponent);
    component = fixture.componentInstance;
    doctorService = TestBed.inject(DoctorService);
    nurseService = TestBed.inject(NurseService);
    confirm = TestBed.inject(ConfirmationService);
    session = TestBed.inject(SessionStorageService);
    dialogRef = TestBed.inject(MatDialogRef);
  }

  describe('with scheduled slot data', () => {
    const scheduled = {
      schedulerForm: {
        allocation: true,
        allocationDate: new Date(2024, 2, 4),
        specialization: { specialization: 'Cardiology' },
        specialistDetails: { userName: 'drx' },
      },
      tmSlot: { fromTime: '10:00:00', toTime: '10:15:00' },
    };
    beforeEach(async () => setup(scheduled));

    it('shows the scheduled slot summary', () => {
      fixture.detectChanges();
      expect(component.scheduledData).toBe(scheduled);
      expect(component.schedulerForm).toBeUndefined();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Cardiology');
      expect(text).toContain('drx');
      expect(text).toContain('04/03/2024');
      expect(text).toContain('10:15:00');
    });

    it('clearScheduledSlot resets comorbid flag and closes with clear', () => {
      fixture.detectChanges();
      fixture.nativeElement.querySelector('#clearScheduledSlot').click();
      expect(session.setItem).toHaveBeenCalledWith('setComorbid', 'false');
      expect(component.ansComorbid).toBe('false');
      expect(nurseService.filter).toHaveBeenCalledWith('false');
      expect(dialogRef.close).toHaveBeenCalledWith({ clear: true });
    });

    it('closeModal closes with false', () => {
      fixture.detectChanges();
      fixture.nativeElement.querySelector('#closeModal').click();
      expect(dialogRef.close).toHaveBeenCalledWith(false);
    });
  });

  describe('without scheduled slot data', () => {
    const spec = { specializationID: 3, specialization: 'Cardiology' };
    const specialist = { userID: 21, userName: 'drx' };

    beforeEach(async () => {
      await setup(null);
      component.ngOnInit();
    });

    it('creates an empty scheduler form', () => {
      expect(component.scheduledData).toBeNull();
      expect(component.today instanceof Date).toBeTrue();
      expect(component.schedulerDate instanceof Date).toBeTrue();
      expect(component.schedulerForm.value).toEqual({
        allocation: null,
        allocationDate: null,
        specialization: null,
        specialistDetails: null,
      });
    });

    describe('checkAllocation', () => {
      it('walk-in (true) uses today and loads specializations', () => {
        doctorService.getMasterSpecialization.and.returnValue(
          of({ statusCode: 200, data: [spec] }),
        );
        component.availableSlotList = [1];
        component.checkAllocation(true);
        expect(component.allocationDate instanceof Date).toBeTrue();
        expect(component.specialization).toBeNull();
        expect(component.specialistDetails).toBeNull();
        expect(component.today).toBe(component.schedulerDate);
        expect(component.availableSlotList).toBeNull();
        expect(component.masterSpecialistDetails).toEqual([]);
        expect(component.masterSpecialization).toEqual([spec]);
      });

      it('schedule (false) allows tomorrow up to two months ahead', () => {
        doctorService.getMasterSpecialization.and.returnValue(
          of({ statusCode: 200, data: [spec] }),
        );
        const now = new Date();
        component.schedulerForm.patchValue({ allocationDate: now });
        component.checkAllocation(false);
        expect(component.allocationDate).toBeNull();
        expect(component.today.getTime()).toBeGreaterThan(now.getTime());
        expect(component.schedulerDate.getTime()).toBeGreaterThan(
          component.today.getTime(),
        );
        expect(component.masterSpecialization).toEqual([spec]);
      });

      it('does nothing else for other values', () => {
        component.checkAllocation(null);
        expect(doctorService.getMasterSpecialization).not.toHaveBeenCalled();
        expect(component.masterSpecialization).toEqual([]);
      });
    });

    describe('getMasterSpecialization', () => {
      beforeEach(() =>
        component.schedulerForm.patchValue({
          allocationDate: new Date(),
          specialization: spec,
          specialistDetails: specialist,
        }),
      );

      it('clears selections and stores specializations', () => {
        doctorService.getMasterSpecialization.and.returnValue(
          of({ statusCode: 200, data: [spec] }),
        );
        component.getMasterSpecialization();
        expect(component.specialization).toBeNull();
        expect(component.specialistDetails).toBeNull();
        expect(component.masterSpecialization).toEqual([spec]);
      });

      it('alerts on non-200', () => {
        doctorService.getMasterSpecialization.and.returnValue(
          of({ statusCode: 5000, errorMessage: 'bad' }),
        );
        component.getMasterSpecialization();
        expect(confirm.alert).toHaveBeenCalledWith('bad', 'error');
        expect(component.masterSpecialization).toEqual([]);
      });

      it('alerts on error', () => {
        doctorService.getMasterSpecialization.and.returnValue(throwingObs('e'));
        component.getMasterSpecialization();
        expect(confirm.alert).toHaveBeenCalledWith('e', 'error');
      });
    });

    describe('getMasterSpecializationSchedule', () => {
      it('clears selections and stores specializations', () => {
        component.schedulerForm.patchValue({ specialization: spec });
        doctorService.getMasterSpecialization.and.returnValue(
          of({ statusCode: 200, data: [spec] }),
        );
        component.getMasterSpecializationSchedule();
        expect(component.specialization).toBeNull();
        expect(component.masterSpecialization).toEqual([spec]);
      });

      it('alerts on non-200', () => {
        doctorService.getMasterSpecialization.and.returnValue(
          of({ statusCode: 5000, errorMessage: 'bad' }),
        );
        component.getMasterSpecializationSchedule();
        expect(confirm.alert).toHaveBeenCalledWith('bad', 'error');
      });

      it('alerts on error', () => {
        doctorService.getMasterSpecialization.and.returnValue(throwingObs('e'));
        component.getMasterSpecializationSchedule();
        expect(confirm.alert).toHaveBeenCalledWith('e', 'error');
      });
    });

    describe('getSpecialist', () => {
      beforeEach(() =>
        component.schedulerForm.patchValue({
          specialization: spec,
          specialistDetails: specialist,
        }),
      );

      it('requests specialists for the chosen specialization', () => {
        doctorService.getSpecialist.and.returnValue(
          of({ statusCode: 200, data: [specialist] }),
        );
        component.getSpecialist();
        expect(doctorService.getSpecialist).toHaveBeenCalledWith({
          providerServiceMapID: 4,
          specializationID: 3,
          userID: 7,
        });
        expect(component.specialistDetails).toBeNull();
        expect(component.masterSpecialistDetails).toEqual([specialist]);
      });

      it('alerts on non-200', () => {
        doctorService.getSpecialist.and.returnValue(
          of({ statusCode: 5000, errorMessage: 'bad' }),
        );
        component.getSpecialist();
        expect(confirm.alert).toHaveBeenCalledWith('bad', 'error');
        expect(component.masterSpecialistDetails).toEqual([]);
      });

      it('alerts on error', () => {
        doctorService.getSpecialist.and.returnValue(throwingObs('e'));
        component.getSpecialist();
        expect(confirm.alert).toHaveBeenCalledWith('e', 'error');
      });
    });

    describe('getAvailableSlot', () => {
      const date = new Date(2024, 2, 4);
      beforeEach(() =>
        component.schedulerForm.patchValue({
          allocationDate: date,
          specialistDetails: specialist,
        }),
      );

      it('loads slots for specialist and date', () => {
        const slots = [{ fromTime: '10:00', status: 'Available' }];
        doctorService.getAvailableSlot.and.returnValue(
          of({ statusCode: 200, data: { slots } }),
        );
        component.getAvailableSlot(specialist);
        expect(doctorService.getAvailableSlot).toHaveBeenCalledWith({
          userID: 21,
          date,
        });
        expect(component.availableSlotList).toEqual(slots);
      });

      it('alerts on non-200', () => {
        doctorService.getAvailableSlot.and.returnValue(
          of({ statusCode: 5000, errorMessage: 'bad' }),
        );
        component.getAvailableSlot(specialist);
        expect(confirm.alert).toHaveBeenCalledWith('bad', 'error');
        expect(component.availableSlotList).toBeNull();
      });

      it('alerts on error', () => {
        doctorService.getAvailableSlot.and.returnValue(throwingObs('e'));
        component.getAvailableSlot(specialist);
        expect(confirm.alert).toHaveBeenCalledWith('e', 'error');
      });
    });

    it('selectAvailableSlot only accepts available slots', () => {
      const booked = { status: 'Booked' };
      const free = { status: 'AVAILABLE' };
      component.selectAvailableSlot(booked);
      expect(component.selectedSlot).toBeUndefined();
      component.selectAvailableSlot(free);
      expect(component.selectedSlot).toBe(free);
      component.selectAvailableSlot(booked);
      expect(component.selectedSlot).toBe(free);
    });

    describe('saveScheduledSlot', () => {
      it('closes with slot data and sets comorbid flag', () => {
        const date = new Date(2024, 2, 4);
        component.schedulerForm.patchValue({
          allocation: false,
          allocationDate: date,
          specialization: spec,
          specialistDetails: specialist,
        });
        component.selectedSlot = { fromTime: '10:00', toTime: '10:15' };
        component.saveScheduledSlot();
        expect(session.setItem).toHaveBeenCalledWith('setComorbid', 'true');
        expect(component.ansComorbid).toBe('true');
        expect(nurseService.filter).toHaveBeenCalledWith('true');
        expect(dialogRef.close).toHaveBeenCalledWith({
          schedulerForm: {
            allocation: false,
            allocationDate: date,
            specialization: spec,
            specialistDetails: specialist,
          },
          tmSlot: {
            walkIn: false,
            specializationID: 3,
            allocationDate: date,
            userID: 21,
            fromTime: '10:00',
            toTime: '10:15',
          },
        });
      });

      it('closes with null when no slot selected', () => {
        component.schedulerForm.patchValue({ specialistDetails: specialist });
        component.saveScheduledSlot();
        expect(nurseService.filter).not.toHaveBeenCalled();
        expect(dialogRef.close).toHaveBeenCalledWith(null);
      });

      it('closes with null when no specialist selected', () => {
        component.selectedSlot = { fromTime: '10:00', toTime: '10:15' };
        component.saveScheduledSlot();
        expect(dialogRef.close).toHaveBeenCalledWith(null);
      });
    });

    it('ngDoCheck refreshes the language set', () => {
      component.currentLanguageSet = undefined;
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });
  });
});
