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
import { DataSyncUtils } from './data-sync-utility';

describe('DataSyncUtils', () => {
  let utils: DataSyncUtils;

  beforeEach(() => {
    utils = new DataSyncUtils(new FormBuilder());
  });

  it('createBenIDForm builds a group with a null benID_Range control', () => {
    const form = utils.createBenIDForm();
    expect(form instanceof FormGroup).toBeTrue();
    expect(Object.keys(form.controls)).toEqual(['benID_Range']);
    expect(form.value).toEqual({ benID_Range: null });
  });

  it('GenerateBenIDsForm wraps the benID form under generateBenIDForm', () => {
    const form = utils.GenerateBenIDsForm();
    const inner = form.get('generateBenIDForm') as FormGroup;
    expect(inner instanceof FormGroup).toBeTrue();
    expect(inner.get('benID_Range')).toBeTruthy();
    expect(form.value).toEqual({ generateBenIDForm: { benID_Range: null } });
  });
});
