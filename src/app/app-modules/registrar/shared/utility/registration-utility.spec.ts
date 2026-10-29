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

import { RegistrationUtils } from './registration-utility';

describe('RegistrationUtils', () => {
  let utils: RegistrationUtils;

  beforeEach(() => {
    utils = new RegistrationUtils(new FormBuilder());
  });

  it('computes todayDate as d-m-yyyy', () => {
    const d = new Date();
    expect(utils.todayDate).toBe(
      `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`,
    );
  });

  it('createRegistrationDetailsForm contains all sub forms', () => {
    const form = utils.createRegistrationDetailsForm();
    expect(form.get('personalDetailsForm') instanceof FormGroup).toBeTrue();
    expect(form.get('demographicDetailsForm') instanceof FormGroup).toBeTrue();
    expect(form.get('otherDetailsForm') instanceof FormGroup).toBeTrue();
  });

  it('personal details form has disabled required registrationDate', () => {
    const form = utils.createPersonalDetailsForm();
    const reg = form.get('registrationDate');
    expect(reg?.disabled).toBeTrue();
    expect(reg?.value).toBe(utils.todayDate);
    expect(form.getRawValue().firstName).toBeNull();
    reg?.enable();
    reg?.setValue(null);
    expect(reg?.hasError('required')).toBeTrue();
  });

  it('demographicDetailsForm has location fields', () => {
    const form = utils.demographicDetailsForm();
    expect(Object.keys(form.controls)).toEqual([
      'vanID',
      'stateID',
      'districtID',
      'villageID',
      'blockID',
    ]);
  });

  it('createDemographicDetailsForm requires stateID and defaults countryID', () => {
    const form = utils.createDemographicDetailsForm();
    expect(form.get('countryID')?.value).toBe(1);
    expect(form.valid).toBeFalse();
    form.patchValue({ stateID: 3 as any });
    expect(form.valid).toBeTrue();
  });

  it('createOtherDetailsForm has govID arrays with one entry each', () => {
    const form = utils.createOtherDetailsForm();
    const gov = form.get('govID') as FormArray;
    const other = form.get('otherGovID') as FormArray;
    expect(gov.length).toBe(1);
    expect(other.length).toBe(1);
    expect(Object.keys((gov.at(0) as FormGroup).controls)).toContain('idValue');
  });

  it('initGovID builds identity group with null values', () => {
    const g = utils.initGovID();
    expect(g.value).toEqual({
      type: null,
      pattern: null,
      error: null,
      allow: null,
      benIdentityId: null,
      deleted: null,
      minLength: null,
      maxLength: null,
      idValue: null,
      createdBy: null,
    });
  });
});
