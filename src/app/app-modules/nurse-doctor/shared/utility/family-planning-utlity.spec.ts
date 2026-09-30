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
import { FamilyPlanningUtils } from './family-planning-utlity';

describe('FamilyPlanningUtils', () => {
  const utils = new FamilyPlanningUtils(new FormBuilder());

  it('composes the family planning form from its three sub-forms', () => {
    const f = utils.createFamilyPlanningForm();
    [
      'dispensationDetailsForm',
      'familyPlanningAndReproductiveForm',
      'IecCounsellingForm',
    ].forEach((k) =>
      expect(f.get(k) instanceof FormGroup)
        .withContext(k)
        .toBeTrue(),
    );
  });

  it('initialises every sub-form control to null', () => {
    [
      utils.createDipensationDetailsForm(),
      utils.createFamilyPlanningAndReproductiveForm(),
      utils.createIecCounsellingDetails(),
    ].forEach((f) =>
      expect(Object.values(f.value).every((v) => v === null)).toBeTrue(),
    );
    expect(
      utils.createDipensationDetailsForm().contains('typeOfIUCDInserted'),
    ).toBeTrue();
    expect(
      utils
        .createFamilyPlanningAndReproductiveForm()
        .contains('fertilityStatusID'),
    ).toBeTrue();
    expect(
      utils.createIecCounsellingDetails().contains('counselledOn'),
    ).toBeTrue();
  });
});
