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

import { CovidVaccinationStatusComponent } from './covid-vaccination-status.component';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../shared/services';
import { BeneficiaryDetailsService } from 'src/app/app-modules/core/services/beneficiary-details.service';
import { ConfirmationService } from 'src/app/app-modules/core/services/confirmation.service';
import { MaterialModule } from 'src/app/app-modules/core/material.module';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

describe('CovidVaccinationStatusComponent', () => {
  let component: CovidVaccinationStatusComponent;
  let fixture: ComponentFixture<CovidVaccinationStatusComponent>;
  let doctor: any;
  let nurse: any;
  let master: any;
  let confirm: any;
  let ben$: BehaviorSubject<any>;
  let form: FormGroup;

  const MASTER_RES = {
    statusCode: 200,
    data: {
      doseType: [{ covidDoseTypeID: 1, doseType: 'First' }],
      vaccineType: [{ covidVaccineTypeID: 7, vaccineType: 'X' }],
    },
  };

  beforeEach(async () => {
    ben$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [CovidVaccinationStatusComponent],
      providers: [
        ...commonTestProviders({ session: { beneficiaryRegID: 'B1' } }),
        { provide: DoctorService, useValue: autoSpy(DoctorService) },
        { provide: NurseService, useValue: autoSpy(NurseService) },
        { provide: MasterdataService, useValue: autoSpy(MasterdataService) },
        {
          provide: BeneficiaryDetailsService,
          useValue: { beneficiaryDetails$: ben$ },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(CovidVaccinationStatusComponent);
    component = fixture.componentInstance;
    form = new FormBuilder().group({
      covidVSID: [null],
      ageGroup: [null],
      isApplicableForVaccine: [null],
      vaccineStatus: [null],
      vaccineTypes: [null],
      doseTaken: [null],
    });
    component.covidVaccineStatusForm = form;
    doctor = TestBed.inject(DoctorService) as any;
    nurse = TestBed.inject(NurseService) as any;
    master = TestBed.inject(MasterdataService) as any;
    confirm = TestBed.inject(ConfirmationService) as any;
  });

  it('should init defaults and load master (no beneficiary yet)', () => {
    master.getVaccinationTypeAndDoseMaster.and.returnValue(of(MASTER_RES));
    fixture.detectChanges();
    expect(doctor.enableCovidVaccinationButton).toBeFalse();
    expect(doctor.covidVaccineAgeGroup).toBeNull();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.doseTypeList).toEqual(MASTER_RES.data.doseType);
    expect(component.vaccineTypeList).toEqual(MASTER_RES.data.vaccineType);
    expect(component.today instanceof Date).toBeTrue();
    expect(master.getPreviousCovidVaccinationDetails).not.toHaveBeenCalled();
  });

  it('beneficiary < 12 years sets not applicable and disables fields', () => {
    fixture.detectChanges();
    ben$.next({ ageVal: 5 });
    expect(form.controls['ageGroup'].value).toBe('<12 years');
    expect(form.controls['isApplicableForVaccine'].value).toBe(
      'Not Applicable for Vaccination',
    );
    expect(doctor.covidVaccineAgeGroup).toBe('<12 years');
    expect(component.enableVaccinationStatusFields).toBeFalse();
    expect(form.controls['ageGroup'].disabled).toBeTrue();
    expect(form.controls['isApplicableForVaccine'].disabled).toBeTrue();
  });

  it('beneficiary >= 12 loads previous vaccination details (YES)', () => {
    ben$.next({ ageVal: 30 });
    master.getVaccinationTypeAndDoseMaster.and.returnValue(of(MASTER_RES));
    master.getPreviousCovidVaccinationDetails.and.returnValue(
      of({
        statusCode: 200,
        data: {
          covidVSID: 11,
          vaccineStatus: 'YES',
          covidVaccineTypeID: 7,
          doseTypeID: 1,
        },
      }),
    );
    fixture.detectChanges();
    expect(form.controls['ageGroup'].value).toBe('>=12 years');
    expect(component.enableVaccinationStatusFields).toBeTrue();
    expect(master.getPreviousCovidVaccinationDetails).toHaveBeenCalledWith(
      'B1',
    );
    expect(form.controls['covidVSID'].value).toBe(11);
    expect(form.controls['vaccineTypes'].value).toBe(7);
    expect(form.controls['doseTaken'].value).toBe(1);
    expect(component.enableVaccineTypeAndDoseTakenFlag).toBeTrue();
    expect(component.enableSaveButton).toBeTrue();
    expect(doctor.enableCovidVaccinationButton).toBeFalse();
  });

  it('previous details with NO status does not set vaccine type', () => {
    component.beneficiaryAge = 20;
    master.getPreviousCovidVaccinationDetails.and.returnValue(
      of({ statusCode: 200, data: { covidVSID: 3, vaccineStatus: 'NO' } }),
    );
    component.getPreviousCovidVaccinationDetails();
    expect(form.controls['vaccineStatus'].value).toBe('NO');
    expect(form.controls['vaccineTypes'].value).toBeNull();
    expect(component.enableVaccineTypeAndDoseTakenFlag).toBeFalse();
  });

  it('previous details without covidVSID / non-200 / error are ignored', () => {
    master.getPreviousCovidVaccinationDetails.and.returnValues(
      of({ statusCode: 200, data: {} }),
      of({ statusCode: 5000, data: {} }),
      throwingObs({ errorMessage: 'e' }),
    );
    component.getPreviousCovidVaccinationDetails();
    component.getPreviousCovidVaccinationDetails();
    component.getPreviousCovidVaccinationDetails();
    expect(form.controls['covidVSID'].value).toBeNull();
  });

  it('master data non-200, no data, and error are handled', () => {
    master.getVaccinationTypeAndDoseMaster.and.returnValues(
      of({ statusCode: 5000 }),
      of({ statusCode: 200, data: null }),
      throwingObs({ errorMessage: 'e' }),
    );
    component.getVaccinationTypeAndDoseMaster();
    component.getVaccinationTypeAndDoseMaster();
    component.getVaccinationTypeAndDoseMaster();
    expect(component.doseTypeList).toEqual([]);
  });

  it('setIsApplicable for <12 years', () => {
    form.patchValue({ ageGroup: '<12 years', vaccineStatus: 'YES' });
    component.setIsApplicable();
    expect(form.controls['vaccineStatus'].value).toBeNull();
    expect(form.controls['isApplicableForVaccine'].value).toBe(
      'Not Applicable for Vaccination',
    );
    expect(component.enableSaveButton).toBeFalse();
    expect(doctor.enableCovidVaccinationButton).toBeTrue();
    expect(doctor.covidVaccineAgeGroup).toBe('<12 years');
  });

  it('setIsApplicable for >=12 years', () => {
    form.patchValue({ ageGroup: '>=12 years' });
    component.setIsApplicable();
    expect(form.controls['isApplicableForVaccine'].value).toBe(
      'Applicable for Vaccination',
    );
    expect(component.enableVaccinationStatusFields).toBeTrue();
    expect(component.enableSaveButton).toBeTrue();
    expect(doctor.enableCovidVaccinationButton).toBeFalse();
  });

  it('enableVaccineTypeAndDoseTaken YES vs NO', () => {
    form.patchValue({ vaccineStatus: 'YES', vaccineTypes: 1, doseTaken: 2 });
    component.enableVaccineTypeAndDoseTaken();
    expect(form.controls['vaccineTypes'].value).toBeNull();
    expect(component.enableVaccineTypeAndDoseTakenFlag).toBeTrue();
    expect(component.enableSaveButton).toBeTrue();
    form.patchValue({ vaccineStatus: 'NO' });
    component.enableVaccineTypeAndDoseTaken();
    expect(component.enableVaccineTypeAndDoseTakenFlag).toBeFalse();
    expect(component.enableSaveButton).toBeFalse();
    expect(doctor.enableCovidVaccinationButton).toBeTrue();
  });

  it('enableSaveButtonInForm toggles based on type & dose', () => {
    form.patchValue({ vaccineTypes: 1, doseTaken: 2 });
    component.enableSaveButtonInForm();
    expect(component.enableSaveButton).toBeFalse();
    expect(doctor.enableCovidVaccinationButton).toBeTrue();
    form.patchValue({ doseTaken: null });
    component.enableSaveButtonInForm();
    expect(component.enableSaveButton).toBeTrue();
    expect(doctor.enableCovidVaccinationButton).toBeFalse();
  });

  describe('saveBenCovidVaccinationDetails', () => {
    beforeEach(() => fixture.detectChanges());

    it('success sets covidVSID and alerts success', () => {
      nurse.saveBenCovidVaccinationDetails.and.returnValue(
        of({ statusCode: 200, data: { covidVSID: 42 } }),
      );
      form.markAsDirty();
      component.enableSaveButton = false;
      component.saveBenCovidVaccinationDetails();
      expect(nurse.saveBenCovidVaccinationDetails).toHaveBeenCalledWith(form);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.covidVaccinationDetailsSaved,
        'success',
      );
      expect(form.controls['covidVSID'].value).toBe(42);
      expect(form.pristine).toBeTrue();
      expect(component.enableSaveButton).toBeTrue();
    });

    it('non-200 alerts error message', () => {
      nurse.saveBenCovidVaccinationDetails.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'bad' }),
      );
      component.saveBenCovidVaccinationDetails();
      expect(confirm.alert).toHaveBeenCalledWith('bad', 'error');
    });

    it('error alerts error', () => {
      nurse.saveBenCovidVaccinationDetails.and.returnValue(throwingObs('boom'));
      component.saveBenCovidVaccinationDetails();
      expect(confirm.alert).toHaveBeenCalledWith('boom', 'error');
    });
  });
});
