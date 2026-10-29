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
import { of } from 'rxjs';

import { AdherenceComponent } from './adherence.component';
import { DoctorService } from '../../shared/services';
import { MaterialModule } from 'src/app/app-modules/core/material.module';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('AdherenceComponent', () => {
  let component: AdherenceComponent;
  let fixture: ComponentFixture<AdherenceComponent>;
  let doctor: any;

  async function setup(session: Record<string, any> = {}) {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [AdherenceComponent],
      providers: [
        ...commonTestProviders({ session }),
        { provide: DoctorService, useValue: autoSpy(DoctorService) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(AdherenceComponent);
    component = fixture.componentInstance;
    component.patientAdherenceForm = new FormBuilder().group({
      toDrugs: [null],
      drugReason: [null],
      toReferral: [null],
      referralReason: [null],
      progress: [null],
    });
    doctor = TestBed.inject(DoctorService) as any;
  }

  describe('default', () => {
    beforeEach(async () => {
      await setup({ visitID: 'V1', beneficiaryRegID: 'B1' });
    });

    it('should create and set language', () => {
      fixture.detectChanges();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.adherenceProgressData).toEqual([
        'Improved',
        'Unchanged',
        'Worsened',
      ]);
    });

    it('ngOnChanges should not fetch when not view mode and no specialist flag', () => {
      component.ngOnChanges();
      expect(doctor.getVisitComplaintDetails).not.toHaveBeenCalled();
    });

    it('ngOnChanges in view mode should fetch and patch adherence', () => {
      doctor.getVisitComplaintDetails.and.returnValue(
        of({
          statusCode: 200,
          data: { BenAdherence: { toDrugs: true, drugReason: 'x' } },
        }),
      );
      component.mode = 'view';
      component.ngOnChanges();
      expect(doctor.getVisitComplaintDetails).toHaveBeenCalledWith('B1', 'V1');
      expect(component.toDrugs).toBeTrue();
      expect(component.drugReason).toBe('x');
    });

    it('should not patch when BenAdherence is null or status not 200', () => {
      doctor.getVisitComplaintDetails.and.returnValues(
        of({ statusCode: 200, data: { BenAdherence: null } }),
        of({ statusCode: 5000, data: { BenAdherence: { toDrugs: true } } }),
      );
      component.getAdherenceDetails('B1', 'V1');
      component.getAdherenceDetails('B1', 'V1');
      expect(component.toDrugs).toBeNull();
    });

    it('checkReferralDescription should clear referralReason only when truthy', () => {
      component.patientAdherenceForm.patchValue({ referralReason: 'r' });
      component.checkReferralDescription(false);
      expect(component.referralReason).toBe('r');
      component.checkReferralDescription(true);
      expect(component.referralReason).toBeNull();
      expect(component.toReferral).toBeNull();
    });

    it('checkDrugsDescription should clear drugReason only when truthy', () => {
      component.patientAdherenceForm.patchValue({ drugReason: 'd' });
      component.checkDrugsDescription(false);
      expect(component.drugReason).toBe('d');
      component.checkDrugsDescription(true);
      expect(component.drugReason).toBeNull();
    });
  });

  describe('specialist flag', () => {
    beforeEach(async () => {
      await setup({
        visitID: 'V2',
        beneficiaryRegID: 'B2',
        specialistFlag: '100',
      });
    });

    it('ngOnChanges should fetch for specialist', () => {
      component.ngOnChanges();
      expect(doctor.getVisitComplaintDetails).toHaveBeenCalledWith('B2', 'V2');
    });
  });
});
