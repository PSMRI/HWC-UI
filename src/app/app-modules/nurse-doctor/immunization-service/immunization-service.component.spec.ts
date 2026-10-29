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

import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  createSessionStorageMock,
  throwingObs,
} from 'src/testing/test-utils';
import { BeneficiaryDetailsService } from '../../core/services/beneficiary-details.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { DoctorService } from '../shared/services/doctor.service';
import { GeneralUtils } from '../shared/utility/general-utility';
import { ImmunizationServiceComponent } from './immunization-service.component';

const NEONATAL = 'Neonatal and Infant Health Care Services';
const CHILD = 'Childhood & Adolescent Healthcare Services';

describe('ImmunizationServiceComponent', () => {
  let component: ImmunizationServiceComponent;
  let fixture: ComponentFixture<ImmunizationServiceComponent>;
  let doctor: any;
  let confirm: any;
  let ben$: BehaviorSubject<any>;
  let form: FormGroup;

  beforeEach(async () => {
    ben$ = new BehaviorSubject<any>(null);
    doctor = autoSpy(DoctorService, {
      immunizationServiceFetchDetails: 'stale',
    });
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [ImmunizationServiceComponent],
      providers: [
        ...commonTestProviders(),
        { provide: DoctorService, useValue: doctor },
        {
          provide: BeneficiaryDetailsService,
          useValue: { beneficiaryDetails$: ben$.asObservable() },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ImmunizationServiceComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    form = new GeneralUtils(
      new FormBuilder(),
      createSessionStorageMock({
        serviceLineDetails: JSON.stringify({
          facilityID: 1,
          parkingPlaceID: 2,
        }),
      }) as any,
    ).createImmunizationServiceForm();
    component.patientImmunizationServicesForm = form;
    component.visitCategory = NEONATAL;
    spyOn(console, 'log');
  });

  it('should create and bind sub-forms', () => {
    fixture.detectChanges();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.neonatalImmunizationServicesForm).toBe(
      form.get('immunizationServicesForm') as FormGroup,
    );
    expect(component.oralVitaminAForm).toBe(
      form.get('oralVitaminAForm') as FormGroup,
    );
    expect(doctor.fetchOralVitaminADeatilsFromNurse).not.toHaveBeenCalled();
  });

  [
    ['12 years - 3 months', 13],
    ['12 years - 0 months', 12],
    ['8 months', 0],
    ['', 0],
  ].forEach(([age, expected]) => {
    it(`derives beneficiary age ${expected} from "${age}"`, () => {
      fixture.detectChanges();
      ben$.next({ age });
      expect(component.beneficiary).toEqual({ age });
      expect(component.beneficiaryAge).toBe(expected as number);
    });
  });

  describe('child & adolescent nurse fetch in view mode', () => {
    beforeEach(() => {
      component.mode = 'view';
      component.visitCategory = CHILD;
    });

    it('stores fetched details', () => {
      doctor.fetchOralVitaminADeatilsFromNurse.and.returnValue(
        of({ statusCode: 200, data: { oral: 1 } }),
      );
      component.ngOnInit();
      expect(doctor.immunizationServiceFetchDetails).toEqual({ oral: 1 });
    });

    it('keeps null when response has no data', () => {
      doctor.fetchOralVitaminADeatilsFromNurse.and.returnValue(of(null));
      component.ngOnInit();
      expect(doctor.immunizationServiceFetchDetails).toBeNull();
    });

    it('logs errors', () => {
      doctor.fetchOralVitaminADeatilsFromNurse.and.returnValue(
        throwingObs('x'),
      );
      component.ngOnInit();
      expect(console.log).toHaveBeenCalledWith('error', 'x');
    });
  });

  describe('ngOnChanges', () => {
    it('shows the neonatal section for neonatal visits', () => {
      component.visitCategory = ` ${NEONATAL} `;
      component.ngOnChanges();
      expect(component.showNeonatalImmunization).toBeTrue();
      expect(component.showChildAndAdolescentImmunization).toBeFalse();
    });

    it('shows the child section for child visits', () => {
      component.visitCategory = CHILD;
      component.ngOnChanges();
      expect(component.showChildAndAdolescentImmunization).toBeTrue();
      expect(component.showNeonatalImmunization).toBeFalse();
    });

    it('does nothing without a visit category', () => {
      component.visitCategory = '';
      component.ngOnChanges();
      expect(component.showNeonatalImmunization).toBeFalse();
    });

    it('updates child immunization in update mode', () => {
      component.visitCategory = CHILD;
      component.mode = 'update';
      doctor.updateChildhoodImmunizationServices.and.returnValue(
        of({ statusCode: 200, data: { response: 'ok' } }),
      );
      form.markAsDirty();
      component.ngOnChanges();
      expect(doctor.updateChildhoodImmunizationServices).toHaveBeenCalledWith(
        form,
        CHILD,
      );
      expect(confirm.alert).toHaveBeenCalledWith('ok', 'success');
      expect(
        doctor.immunizationServiceChildhoodValueChanged,
      ).toHaveBeenCalledWith(false);
      expect(form.pristine).toBeTrue();
    });

    it('does not update neonatal visits', () => {
      component.mode = 'update';
      component.ngOnChanges();
      expect(doctor.updateChildhoodImmunizationServices).not.toHaveBeenCalled();
    });
  });

  describe('updateChildhoodImmunizationServicesFromDoctor errors', () => {
    beforeEach(() => (component.visitCategory = CHILD));

    it('alerts on non-200', () => {
      doctor.updateChildhoodImmunizationServices.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'bad', data: null }),
      );
      component.updateChildhoodImmunizationServicesFromDoctor(form, CHILD);
      expect(confirm.alert).toHaveBeenCalledWith('bad', 'error');
    });

    it('alerts on error', () => {
      doctor.updateChildhoodImmunizationServices.and.returnValue(
        throwingObs('e'),
      );
      component.updateChildhoodImmunizationServicesFromDoctor(form, CHILD);
      expect(confirm.alert).toHaveBeenCalledWith('e', 'error');
    });
  });

  it('unsubscribes on destroy and tolerates no subscription', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
    fixture.detectChanges();
    const sub = component.beneficiaryDetailsSubscription;
    component.ngOnDestroy();
    expect(sub.closed).toBeTrue();
  });
});
