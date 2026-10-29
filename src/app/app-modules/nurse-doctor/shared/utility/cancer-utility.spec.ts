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
import { CancerUtils } from './cancer-utility';

describe('CancerUtils', () => {
  let utils: CancerUtils;
  let session: ReturnType<typeof createSessionStorageMock>;

  beforeEach(() => {
    session = createSessionStorageMock({
      serviceLineDetails: JSON.stringify({ facilityID: 5, parkingPlaceID: 6 }),
    });
    utils = new CancerUtils(new FormBuilder(), session as any);
  });

  it('builds a FormGroup from every create*/init* factory', () => {
    const names = Object.getOwnPropertyNames(CancerUtils.prototype).filter(
      (n) => /^(create|init)/.test(n),
    );
    expect(names.length).toBeGreaterThan(10);
    names.forEach((n) => {
      const f = (utils as any)[n]();
      expect(f instanceof FormGroup)
        .withContext(n)
        .toBeTrue();
      if (f.contains('facilityID')) {
        expect(f.get('facilityID').value).withContext(n).toBe(5);
        expect(f.get('parkingPlaceID').value).withContext(n).toBe(6);
      }
    });
  });

  it('ngOnInIt reads service line details from session', () => {
    utils.ngOnInIt();
    expect(session.getItem).toHaveBeenCalledWith('serviceLineDetails');
  });

  it('family medical history starts with one disease row', () => {
    const f = utils.createCancerPatientFamilyMedicalHistoryForm();
    expect((f.get('diseases') as any).length).toBe(1);
  });
});
