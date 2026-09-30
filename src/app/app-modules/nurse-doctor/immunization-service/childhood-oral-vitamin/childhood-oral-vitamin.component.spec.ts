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
import { BehaviorSubject } from 'rxjs';

import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  createSessionStorageMock,
} from 'src/testing/test-utils';
import { MaterialModule } from 'src/app/app-modules/core/material.module';
import { BeneficiaryDetailsService } from '../../../core/services/beneficiary-details.service';
import { DoctorService } from '../../shared/services/doctor.service';
import { MasterdataService } from '../../shared/services/masterdata.service';
import { GeneralUtils } from '../../shared/utility/general-utility';
import { ChildhoodOralVitaminComponent } from './childhood-oral-vitamin.component';

const SESSION = {
  serviceLineDetails: JSON.stringify({ facilityID: 1, parkingPlaceID: 2 }),
};

describe('ChildhoodOralVitaminComponent', () => {
  let component: ChildhoodOralVitaminComponent;
  let fixture: ComponentFixture<ChildhoodOralVitaminComponent>;
  let doctor: any;
  let master$: BehaviorSubject<any>;
  let ben$: BehaviorSubject<any>;
  let form: FormGroup;

  const FETCHED = {
    oralVitaminAProphylaxis: {
      id: 3,
      dateOfVisit: '2024-04-04',
      oralVitaminAStatus: 'Given',
      dose: '2 ml (2 lakh IU)',
    },
  };

  beforeEach(async () => {
    master$ = new BehaviorSubject<any>(null);
    ben$ = new BehaviorSubject<any>(null);
    doctor = autoSpy(DoctorService, { immunizationServiceFetchDetails: null });
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [ChildhoodOralVitaminComponent],
      providers: [
        ...commonTestProviders({ session: SESSION }),
        { provide: DoctorService, useValue: doctor },
        {
          provide: MasterdataService,
          useValue: { nurseMasterData$: master$.asObservable() },
        },
        {
          provide: BeneficiaryDetailsService,
          useValue: { beneficiaryDetails$: ben$.asObservable() },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ChildhoodOralVitaminComponent);
    component = fixture.componentInstance;
    form = new GeneralUtils(
      new FormBuilder(),
      createSessionStorageMock(SESSION) as any,
    ).createChildhoodOralVitaminAForm();
    component.oralVitaminAForm = form;
    component.visitCategory = 'Childhood & Adolescent Healthcare Services';
  });

  it('should create and default the visit date to today', () => {
    fixture.detectChanges();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(form.value.dateOfVisit).toBe(component.todayDate);
    expect(component.utils).toBeTruthy();
  });

  it('loads dose masters without patching outside view mode', () => {
    doctor.immunizationServiceFetchDetails = FETCHED;
    fixture.detectChanges();
    master$.next({ oralVitaminNoDose: [{ id: 1, name: '1st' }] });
    expect(component.oralVitaminADoses).toEqual([{ id: 1, name: '1st' }]);
    expect(form.value.id).toBeNull();
  });

  it('patches nurse data when masters arrive in view mode', () => {
    component.mode = 'view';
    doctor.immunizationServiceFetchDetails = FETCHED;
    fixture.detectChanges();
    master$.next({ oralVitaminNoDose: [] });
    expect(form.value.id).toBe(3);
    expect(form.value.dateOfVisit).toEqual(new Date('2024-04-04'));
    expect(component.oralVitaminAStatus).toBe('Given');
  });

  it('ignores master data without dose list', () => {
    fixture.detectChanges();
    master$.next({ other: 1 });
    expect(component.oralVitaminADoses).toEqual([]);
  });

  it('ngOnChanges patches in view mode only when data exists', () => {
    component.mode = 'view';
    component.ngOnChanges();
    expect(form.value.id).toBeNull();
    doctor.immunizationServiceFetchDetails = FETCHED;
    component.ngOnChanges();
    expect(form.value.id).toBe(3);
  });

  it('ngOnChanges does nothing outside view mode', () => {
    doctor.immunizationServiceFetchDetails = FETCHED;
    component.mode = 'new';
    component.ngOnChanges();
    expect(form.value.id).toBeNull();
  });

  describe('setVaccineDetails', () => {
    it('sets default dose and route when given', () => {
      component.mode = 'update';
      component.setVaccineDetails('Given');
      expect(component.dose).toBe('2 ml (2 lakh IU)');
      expect(component.route).toBe('Oral');
      expect(
        doctor.immunizationServiceChildhoodValueChanged,
      ).toHaveBeenCalledWith(true);
    });

    it('resets fields when not given', () => {
      form.patchValue({
        noOfOralVitaminADoseID: 1,
        noOfOralVitaminADose: '1st',
        dose: 'd',
        batchNo: 'b',
        route: 'Oral',
      });
      component.setVaccineDetails('Not Given');
      expect(component.noOfOralVitaminADose).toBeNull();
      expect(component.batchNo).toBeNull();
      expect(component.route).toBeNull();
      expect(
        doctor.immunizationServiceChildhoodValueChanged,
      ).not.toHaveBeenCalled();
    });

    it('ignores other statuses', () => {
      form.patchValue({ dose: 'd' });
      component.setVaccineDetails(null);
      expect(component.dose).toBe('d');
    });
  });

  it('onValueChange flags only in view/update', () => {
    component.onValueChange();
    expect(
      doctor.immunizationServiceChildhoodValueChanged,
    ).not.toHaveBeenCalled();
    component.mode = 'view';
    component.onValueChange();
    expect(
      doctor.immunizationServiceChildhoodValueChanged,
    ).toHaveBeenCalledWith(true);
  });

  it('getNoOfOralVitaminADose copies the dose name', () => {
    component.oralVitaminADoses = [
      { id: 1, name: '1st' },
      { id: 2, name: '2nd' },
    ];
    component.mode = 'update';
    form.patchValue({ noOfOralVitaminADoseID: 2 });
    component.getNoOfOralVitaminADose();
    expect(component.noOfOralVitaminADose).toBe('2nd');
    expect(doctor.immunizationServiceChildhoodValueChanged).toHaveBeenCalled();
  });

  [
    ['6 years - 2 months', 7],
    ['6 years - 0 months', 6],
    ['10 months', 0],
    ['', 0],
  ].forEach(([age, expected]) => {
    it(`derives beneficiary age ${expected} from "${age}"`, () => {
      fixture.detectChanges();
      ben$.next({ age });
      expect(component.beneficiaryAge).toBe(expected as number);
    });
  });

  it('dateOfVisit getter reads the form', () => {
    const d = new Date(2024, 1, 1);
    form.patchValue({ dateOfVisit: d });
    expect(component.dateOfVisit).toBe(d);
  });

  it('ngOnDestroy resets the form and unsubscribes', () => {
    fixture.detectChanges();
    const sub = component.beneficiaryDetailsSubscription;
    form.patchValue({ id: 9 });
    component.ngOnDestroy();
    expect(form.value.id).toBeNull();
    expect(sub.closed).toBeTrue();
  });

  it('ngOnDestroy works without a subscription', () => {
    form.patchValue({ id: 9 });
    component.ngOnDestroy();
    expect(form.value.id).toBeNull();
  });

  it('re-assigns the language set on ngDoCheck', () => {
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });
});
