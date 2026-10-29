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
import { FormBuilder, FormGroup } from '@angular/forms';
import { createSessionStorageMock } from 'src/testing/test-utils';
import { NCDScreeningUtils } from './ncd-screening-utility';

describe('NCDScreeningUtils', () => {
  let utils: NCDScreeningUtils;

  beforeEach(() => {
    const session = createSessionStorageMock({
      serviceLineDetails: JSON.stringify({ facilityID: 1, parkingPlaceID: 2 }),
    });
    utils = new NCDScreeningUtils(new FormBuilder(), session as any);
  });

  it('creates the NCD screening form with facility details and null readings', () => {
    const f = utils.createNCDScreeningForm();
    expect(f.get('facilityID')?.value).toBe(1);
    expect(f.get('parkingPlaceID')?.value).toBe(2);
    expect(f.get('systolicBP_1stReading')?.value).toBeNull();
    expect(f.get('labTestOrders')).toBeTruthy();
  });

  it('creates the IDRS form with deleted=false and facility details', () => {
    const f = utils.createIDRSForm();
    expect(f.get('deleted')?.value).toBeFalse();
    expect(f.get('facilityID')?.value).toBe(1);
    expect(f.get('parkingPlaceID')?.value).toBe(2);
  });

  it('creates each screening sub-form with suspected/confirmed/formDisable controls', () => {
    const forms: FormGroup[] = [
      utils.createDiabetesScreeningForm(),
      utils.createHypertensionForm(),
      utils.createOralCancerForm(),
      utils.createBreastCancerForm(),
      utils.createCervicalCancerForm(),
    ];
    forms.forEach((f, i) => {
      ['suspected', 'confirmed', 'id', 'formDisable'].forEach((k) =>
        expect(f.contains(k)).withContext(`${i}:${k}`).toBeTrue(),
      );
    });
    expect(
      utils.createHypertensionForm().contains('averageSystolicBP'),
    ).toBeTrue();
    expect(utils.createOralCancerForm().contains('mouthOpening')).toBeTrue();
    expect(
      utils.createBreastCancerForm().contains('palpationBreasts'),
    ).toBeTrue();
    expect(
      utils.createCervicalCancerForm().contains('visualExaminationVIA'),
    ).toBeTrue();
    expect(
      utils.createDiabetesScreeningForm().contains('bloodGlucose'),
    ).toBeTrue();
  });
});
