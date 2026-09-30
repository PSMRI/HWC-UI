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
import { GeneralUtils } from './general-utility';

describe('GeneralUtils', () => {
  let utils: GeneralUtils;
  let session: ReturnType<typeof createSessionStorageMock>;

  beforeEach(() => {
    session = createSessionStorageMock({
      serviceLineDetails: JSON.stringify({
        facilityID: 11,
        parkingPlaceID: 22,
      }),
    });
    utils = new GeneralUtils(new FormBuilder(), session as any);
  });

  const factoryNames = () =>
    Object.getOwnPropertyNames(GeneralUtils.prototype).filter(
      (n) => /^(create|init)/.test(n) && n !== 'initMedicineWithData',
    );

  it('builds a FormGroup from every create*/init* factory', () => {
    const names = factoryNames();
    expect(names.length).toBeGreaterThan(50);
    names.forEach((name) => {
      const result = (utils as any)[name](1);
      expect(result instanceof FormGroup)
        .withContext(name)
        .toBeTrue();
    });
  });

  it('stamps facilityID/parkingPlaceID from session on forms that carry them', () => {
    names: for (const name of factoryNames()) {
      const form: FormGroup = (utils as any)[name](1);
      if (!form.contains('facilityID')) continue names;
      expect(form.get('facilityID')?.value).withContext(name).toBe(11);
      expect(form.get('parkingPlaceID')?.value).withContext(name).toBe(22);
    }
    expect(session.getItem).toHaveBeenCalledWith('serviceLineDetails');
  });

  it('composes the general history form from its sub-forms', () => {
    const form = utils.createGeneralHistoryForm(false);
    [
      'pastHistory',
      'comorbidityHistory',
      'medicationHistory',
      'personalHistory',
      'familyHistory',
      'menstrualHistory',
      'perinatalHistory',
      'pastObstericHistory',
      'immunizationHistory',
      'otherVaccines',
      'feedingHistory',
      'developmentHistory',
    ].forEach((k) =>
      expect(form.get(k) instanceof FormGroup)
        .withContext(k)
        .toBeTrue(),
    );
  });

  it('initialises past obstetric history with the given pregnancy order and empty arrays', () => {
    expect(utils.initPastObstericHistory(3).get('pregOrder')?.value).toBe(3);
    const past = utils.createPastObstericHistoryForm();
    expect((past.get('pastObstericHistoryList') as FormArray).length).toBe(0);
    expect((past.get('complicationPregList') as FormArray).length).toBe(0);
  });

  it('marks provisional and confirmatory diagnosis concept/term as required', () => {
    const prov: FormGroup = utils.initProvisionalDiagnosisList() as any;
    expect(prov.valid).toBeFalse();
    prov.patchValue({ conceptID: 'c1', term: 't1' });
    expect(prov.get('conceptID')?.valid).toBeTrue();
    expect(prov.get('term')?.valid).toBeTrue();
    const conf = utils.initConfirmatoryDiagnosisList();
    expect(conf.get('conceptID')?.valid).toBeFalse();
  });

  it('starts drug prescription form with an empty prescribedDrugs array', () => {
    const f = utils.createDrugPrescriptionForm();
    expect((f.get('prescribedDrugs') as FormArray).length).toBe(0);
    expect(f.get('facilityID')?.value).toBe(11);
  });

  describe('initMedicineWithData', () => {
    const base = {
      drugID: 5,
      drugName: 'Paracetamol',
      drugStrength: '500',
      formName: 'Tablet',
      formID: 2,
      dose: '1',
      qtyPrescribed: 10,
      frequency: 'BD',
      duration: 5,
      route: 'Oral',
      unit: 'Days',
      instructions: 'after food',
      sctCode: 'S1',
      sctTerm: 'T1',
      isEDL: true,
    };

    it('concatenates strength and unit when drugUnit is present', () => {
      const f = utils.initMedicineWithData(
        { ...base, drugUnit: 'mg', createdBy: 'nurse' },
        7 as any,
      );
      expect(f.value).toEqual(
        jasmine.objectContaining({
          id: 7,
          drugID: 5,
          drugStrength: '500mg',
          formID: 2,
          durationView: '5 Days',
          createdBy: 'nurse',
          facilityID: 11,
          parkingPlaceID: 22,
          isEDL: true,
        }),
      );
    });

    it('keeps plain strength; absent createdBy/id become null controls', () => {
      const f = utils.initMedicineWithData({ ...base });
      expect(f.get('drugStrength')?.value).toBe('500');
      expect(f.get('createdBy')?.value).toBeNull();
      expect(f.get('id')?.value).toBeNull();
    });
  });
});
