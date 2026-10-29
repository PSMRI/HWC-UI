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
import { LabUtils } from './lab-utility';

describe('LabUtils', () => {
  let utils: LabUtils;
  beforeEach(() => (utils = new LabUtils(new FormBuilder())));

  it('createLabMasterForm has three empty arrays', () => {
    const f = utils.createLabMasterForm();
    ['labForm', 'radiologyForm', 'externalForm'].forEach((k) => {
      expect(f.get(k) instanceof FormArray).toBeTrue();
      expect((f.get(k) as FormArray).length).toBe(0);
    });
  });

  it('createLabProcedureForm has procedure fields and compListDetails array', () => {
    const f = utils.createLabProcedureForm();
    expect(f.get('procedureID')?.value).toBeNull();
    expect(f.get('calibrationEndAPI')).toBeTruthy();
    expect(f.get('compListDetails') instanceof FormArray).toBeTrue();
  });

  it('createLabComponentOfFields has field controls', () => {
    const f = utils.createLabComponentOfFields();
    expect(Object.keys(f.controls).length).toBe(16);
    expect(f.get('stripsNotavailable')?.value).toBeNull();
    expect(f.get('range_normal_min')).toBeTruthy();
  });

  it('createLabComponentOfRadioDropDowns has compOpt array', () => {
    const f = utils.createLabComponentOfRadioDropDowns();
    expect(f.get('compOpt') instanceof FormArray).toBeTrue();
    expect(f.get('compOptSelected')?.value).toBeNull();
  });

  it('createComponentRadioDropDownList has name', () => {
    expect(utils.createComponentRadioDropDownList().value).toEqual({
      name: null,
    });
  });

  it('createRadiologyProcedureForm nests radiology component', () => {
    const f = utils.createRadiologyProcedureForm();
    expect(f.get('gender')).toBeTruthy();
    const comp = f.get('compDetails') as FormGroup;
    expect(comp instanceof FormGroup).toBeTrue();
    expect(comp.value).toEqual(utils.createRadiologyComponent().value);
    expect(Object.keys(comp.controls)).toContain('testComponentName');
  });

  it('createExternalTestForm has tests control', () => {
    expect(utils.createExternalTestForm().value).toEqual({ tests: null });
  });
});
