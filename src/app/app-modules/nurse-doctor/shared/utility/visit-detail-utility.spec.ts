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
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { createSessionStorageMock } from 'src/testing/test-utils';
import { VisitDetailUtils } from './visit-detail-utility';

describe('VisitDetailUtils', () => {
  let utils: VisitDetailUtils;

  beforeEach(() => {
    const session = createSessionStorageMock({
      serviceLineDetails: JSON.stringify({ facilityID: 3, parkingPlaceID: 4 }),
      userName: 'nurse1',
    });
    utils = new VisitDetailUtils(new FormBuilder(), session as any);
  });

  it('composes the patient visit form with all sub-forms, facility and creator', () => {
    const f = utils.createPatientVisitForm();
    [
      'patientVisitDetailsForm',
      'patientChiefComplaintsForm',
      'patientAdherenceForm',
      'patientInvestigationsForm',
      'cdssForm',
      'patientCovidForm',
      'patientFileUploadDetailsForm',
      'patientDiseaseForm',
      'covidVaccineStatusForm',
      'cbacScreeningForm',
    ].forEach((k) =>
      expect(f.get(k) instanceof FormGroup)
        .withContext(k)
        .toBeTrue(),
    );
    expect(f.get('facilityID')?.value).toBe(3);
    expect(f.get('parkingPlaceID')?.value).toBe(4);
    expect(f.get('createdBy')?.value).toBe('nurse1');
  });

  it('leaves editable controls enabled by default', () => {
    const f = utils.createPatientVisitForm();
    expect(f.get('patientVisitDetailsForm.visitReason')?.enabled).toBeTrue();
    expect(f.get('patientVisitDetailsForm.visitCode')?.disabled).toBeTrue();
    expect(f.get('patientAdherenceForm.toDrugs')?.enabled).toBeTrue();
    expect(f.get('cbacScreeningForm.cbacAge')?.enabled).toBeTrue();
    expect(f.get('cbacScreeningForm.totalScore')?.value).toBe(0);
  });

  it('disables editable controls when the disable flag is set', () => {
    const f = utils.createPatientVisitForm(true);
    expect(f.get('patientVisitDetailsForm.visitReason')?.disabled).toBeTrue();
    expect(
      f.get('patientVisitDetailsForm.subVisitCategory')?.enabled,
    ).toBeTrue();
    expect(f.get('patientAdherenceForm.progress')?.disabled).toBeTrue();
    expect(
      f.get('patientInvestigationsForm.laboratoryList')?.disabled,
    ).toBeTrue();
    expect(f.get('patientCovidForm.symptom')?.disabled).toBeTrue();
    expect(f.get('cbacScreeningForm.cbacForgetnearones')?.disabled).toBeTrue();
    const complaint = (
      f.get('patientChiefComplaintsForm.complaints') as FormArray
    ).at(0);
    expect(complaint.get('chiefComplaint')?.disabled).toBeTrue();
  });

  it('uses default (enabled) flags when individual builders are called without args', () => {
    expect(
      utils.createPatientAdherenceForm().get('toDrugs')?.enabled,
    ).toBeTrue();
    expect(
      utils.createPatientInvestigationsForm().get('laboratoryList')?.value,
    ).toEqual([]);
    expect(
      utils.createANCPatientChiefComplaintArrayForm().get('complaints'),
    ).toBeTruthy();
    expect(
      utils.createPatientVisitDetails().get('visitCategory')?.enabled,
    ).toBeTrue();
    expect(
      utils.createPatientFileUploadDetailsForm().get('fileIDs')?.value,
    ).toBeNull();
    expect(
      (utils.createPatientDiseaseForm().get('diseaseFormsArray') as FormArray)
        .length,
    ).toBe(0);
    expect(
      utils.createPatientCovidForm().get('travelStatus')?.enabled,
    ).toBeTrue();
    expect(utils.createCBACForm().get('cbacTb')?.enabled).toBeTrue();
    expect(
      utils
        .createCdssForm()
        .get('presentChiefComplaintDb.presentChiefComplaint'),
    ).toBeTruthy();
    expect(
      utils.createCdssForm().get('diseaseSummaryDb.diseaseSummary'),
    ).toBeTruthy();
  });

  it('builds the symptoms form, disabled or not', () => {
    const on = utils.createPatientSymptomsForm();
    expect(on.get('symptoms')?.enabled).toBeTrue();
    expect(on.get('facilityID')?.value).toBe(3);
    expect(
      utils.createPatientSymptomsForm(true).get('symptoms')?.disabled,
    ).toBeTrue();
  });

  it('maps disease data (note: reads data.disease, not diseaseName)', () => {
    const f = utils.createPatientDiseaseArrayForm({
      disease: 'Diabetes',
      flag: true,
      selected: false,
    });
    expect(f.value).toEqual({
      diseaseName: 'Diabetes',
      flag: true,
      selected: false,
    });
  });

  it('defaults disease data to nulls when none is given', () => {
    const f = utils.createPatientDiseaseArrayForm(null);
    expect(f.get('diseaseName')?.value).toBeNull();
    expect(f.get('flag')?.value).toBeNull();
    expect(f.get('selected')?.value).toBeNull();
  });

  it('creates the covid vaccine status form with null defaults', () => {
    const f = utils.createCovidVaccineStatusForm(false);
    expect(Object.values(f.value).every((v) => v === null)).toBeTrue();
  });
});
