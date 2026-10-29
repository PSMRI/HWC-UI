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
import { QuickConsultUtils } from './quick-consult-utility';

describe('QuickConsultUtils', () => {
  let utils: QuickConsultUtils;

  beforeEach(() => {
    const session = createSessionStorageMock({
      serviceLineDetails: JSON.stringify({ facilityID: 9, parkingPlaceID: 8 }),
    });
    utils = new QuickConsultUtils(new FormBuilder(), session as any);
  });

  it('initMedicine builds an empty medicine row with disabled qih', () => {
    const f = utils.initMedicine();
    expect(f.get('drug')?.value).toBeNull();
    expect(f.get('qih')?.disabled).toBeTrue();
    expect(f.get('facilityID')?.value).toBe(9);
    expect(f.get('parkingPlaceID')?.value).toBe(8);
  });

  it('initChiefComplaint carries facility details', () => {
    const f = utils.initChiefComplaint();
    expect(f.value).toEqual({
      chiefComplaint: null,
      conceptID: null,
      description: null,
      facilityID: 9,
      parkingPlaceID: 8,
    });
  });

  it('createQuickConsultForm requires clinical observation and a provisional diagnosis', () => {
    const f: FormGroup = utils.createQuickConsultForm() as any;
    expect(f.valid).toBeFalse();
    expect(f.get('clinicalObservation')?.hasError('required')).toBeTrue();
    expect(f.get('beneficiaryName')?.disabled).toBeTrue();
    expect(f.get('rbsTestResult')?.enabled).toBeTrue();
    expect((f.get('chiefComplaintList') as FormArray).length).toBe(1);
    const diag = (f.get('provisionalDiagnosisList') as FormArray).at(0);
    expect(diag.get('term')?.hasError('required')).toBeTrue();
    expect((f.get('prescription.prescribedDrugs') as FormArray).length).toBe(0);
    expect(f.get('facilityID')?.value).toBe(9);

    f.patchValue({ clinicalObservation: 'ok' });
    diag.patchValue({
      conceptID: 'c',
      term: 't',
      viewProvisionalDiagnosisProvided: 'v',
    });
    expect(f.valid).toBeTrue();
  });

  it('initMedicineWithData concatenates strength and unit', () => {
    const f = utils.initMedicineWithData(
      {
        drugID: 1,
        drugName: 'X',
        drugStrength: '10',
        drugUnit: 'mg',
        duration: 3,
        unit: 'Days',
        createdBy: 'doc',
        isEDL: false,
      },
      4 as any,
    );
    expect(f.value).toEqual(
      jasmine.objectContaining({
        id: 4,
        drugStrength: '10mg',
        durationView: '3 Days',
        createdBy: 'doc',
        facilityID: 9,
        isEDL: false,
      }),
    );
  });

  it('initMedicineWithData uses plain strength when unit missing', () => {
    const f = utils.initMedicineWithData({
      drugStrength: '250',
      duration: 1,
      unit: 'Week',
    });
    expect(f.get('drugStrength')?.value).toBe('250');
    expect(f.get('createdBy')?.value).toBeNull();
  });
});
