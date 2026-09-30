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
import { BehaviorSubject, of } from 'rxjs';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { RegistrarService } from '../../registrar/shared/services/registrar.service';
import { DoctorService } from '../shared/services/doctor.service';
import { FamilyPlanningUtils } from '../shared/utility/family-planning-utlity';
import { FamilyPlanningComponent } from './family-planning.component';

describe('FamilyPlanningComponent', () => {
  let component: FamilyPlanningComponent;
  let fixture: ComponentFixture<FamilyPlanningComponent>;
  let doctor: any;
  let registrar: any;
  let confirm: any;
  let session: any;
  let route: any;
  let dispense$: BehaviorSubject<boolean>;
  let medicalForm: FormGroup;

  beforeEach(async () => {
    dispense$ = new BehaviorSubject<boolean>(false);
    doctor = autoSpy(DoctorService, {
      familyPlanningDetailsResponseFromNurse: 'stale',
    });
    registrar = autoSpy(RegistrarService, {
      enablingDispense$: dispense$.asObservable(),
    });
    route = { snapshot: { params: { attendant: 'doctor' } } };
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [FamilyPlanningComponent],
      providers: [
        ...commonTestProviders(),
        { provide: DoctorService, useValue: doctor },
        { provide: RegistrarService, useValue: registrar },
        { provide: ActivatedRoute, useValue: route },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(FamilyPlanningComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    session = TestBed.inject(SessionStorageService);
    medicalForm = new FormGroup({
      familyPlanningForm: new FamilyPlanningUtils(
        new FormBuilder(),
      ).createFamilyPlanningForm(),
    });
    component.patientMedicalForm = medicalForm;
  });

  describe('ngOnInit', () => {
    it('binds sub-forms, resets revisit data and dispense flag', () => {
      fixture.detectChanges();
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
      expect(component.familyPlanningAndReprodForm).toBe(
        medicalForm.get(
          'familyPlanningForm.familyPlanningAndReproductiveForm',
        ) as FormGroup,
      );
      expect(component.IecCounsellingForm).toBe(
        medicalForm.get('familyPlanningForm.IecCounsellingForm') as FormGroup,
      );
      expect(component.dispensationDetailsForm).toBe(
        medicalForm.get(
          'familyPlanningForm.dispensationDetailsForm',
        ) as FormGroup,
      );
      expect(doctor.getBenFamilyDetailsRevisit).toHaveBeenCalledWith(null);
      expect(registrar.enableDispenseOnFertility).toHaveBeenCalledWith(false);
      expect(doctor.familyPlanningDetailsResponseFromNurse).toBeNull();
      expect(doctor.getFamilyPlanningFetchDetails).not.toHaveBeenCalled();
    });

    it('fetches revisit details for a nurse follow-up', () => {
      route.snapshot.params.attendant = 'nurse';
      session.setItem('visitReason', ' Follow Up ');
      doctor.getFamilyPlanningFetchDetailsOnRevisit.and.returnValue(
        of({ statusCode: 200, data: { a: 1 } }),
      );
      component.ngOnInit();
      expect(doctor.getBenFamilyDetailsRevisit).toHaveBeenCalledWith({ a: 1 });
      expect(component.visitReason).toBe(' Follow Up ');
    });

    it('ignores empty revisit responses', () => {
      doctor.getFamilyPlanningFetchDetailsOnRevisit.and.returnValue(
        of({ statusCode: 200, data: null }),
      );
      component.getFamilyPlanningDetailsRevisit();
      expect(doctor.getBenFamilyDetailsRevisit).not.toHaveBeenCalled();
    });

    it('fetches nurse details in view mode', () => {
      component.familyPlanningMode = 'view';
      doctor.getFamilyPlanningFetchDetails.and.returnValue(
        of({ statusCode: 200, data: { x: 1 } }),
      );
      component.ngOnInit();
      expect(doctor.familyPlanningDetailsResponseFromNurse).toEqual({ x: 1 });
      expect(doctor.setFamilyDataFetch).toHaveBeenCalledWith(true);
    });

    it('does not store nurse details on a failed fetch', () => {
      component.familyPlanningMode = 'update';
      doctor.getFamilyPlanningFetchDetails.and.returnValue(
        of({ statusCode: 5000, data: null }),
      );
      component.getFamilyPlanningNurseFetchDetails();
      expect(doctor.familyPlanningDetailsResponseFromNurse).toBeNull();
      expect(doctor.setFamilyDataFetch).not.toHaveBeenCalled();
    });

    it('toggles the dispense form from registrar status', () => {
      fixture.detectChanges();
      expect(component.enableDispenseForm).toBeFalse();
      dispense$.next(true);
      expect(component.enableDispenseForm).toBeTrue();
      dispense$.next(false);
      expect(component.enableDispenseForm).toBeFalse();
    });
  });

  it('re-assigns the language set on ngDoCheck', () => {
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  describe('ngOnChanges / updateFamilyPlanningFromDoctor', () => {
    beforeEach(() =>
      session.setItem('visitCategory', 'FP & Contraceptive Services'),
    );

    it('does nothing outside update mode', () => {
      component.familyPlanningMode = 'view';
      component.ngOnChanges();
      expect(doctor.updateFamilyPlanning).not.toHaveBeenCalled();
    });

    it('updates and refreshes on success', () => {
      component.familyPlanningMode = 'update';
      doctor.updateFamilyPlanning.and.returnValue(
        of({ statusCode: 200, data: { response: 'Updated' } }),
      );
      doctor.getFamilyPlanningFetchDetails.and.returnValue(
        of({ statusCode: 200, data: { y: 1 } }),
      );
      medicalForm.markAsDirty();
      component.ngOnChanges();
      expect(doctor.updateFamilyPlanning).toHaveBeenCalledWith(
        medicalForm,
        'FP & Contraceptive Services',
      );
      expect(confirm.alert).toHaveBeenCalledWith('Updated', 'success');
      expect(doctor.familyPlanningValueChanged).toHaveBeenCalledWith(false);
      expect(doctor.getFamilyPlanningFetchDetails).toHaveBeenCalled();
      expect(medicalForm.pristine).toBeTrue();
    });

    it('alerts on non-200', () => {
      doctor.updateFamilyPlanning.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'bad', data: null }),
      );
      component.updateFamilyPlanningFromDoctor(medicalForm, 'x');
      expect(confirm.alert).toHaveBeenCalledWith('bad', 'error');
    });

    it('alerts on error', () => {
      doctor.updateFamilyPlanning.and.returnValue(throwingObs('e'));
      component.updateFamilyPlanningFromDoctor(medicalForm, 'x');
      expect(confirm.alert).toHaveBeenCalledWith('e', 'error');
    });
  });

  it('unsubscribes on destroy and tolerates no subscription', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
    fixture.detectChanges();
    const sub = component.enablingDispenseSubscription;
    component.ngOnDestroy();
    expect(sub.closed).toBeTrue();
  });
});
