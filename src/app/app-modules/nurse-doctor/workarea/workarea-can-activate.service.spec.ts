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
import { WorkareaCanActivate } from './workarea-can-activate.service';
import { createSessionStorageMock } from 'src/testing/test-utils';

describe('WorkareaCanActivate', () => {
  const fullVisit = {
    visitCategory: 'General OPD',
    visitCode: 'VC1',
    beneficiaryGender: 'Female',
    benFlowID: 11,
    beneficiaryRegID: 22,
    visitID: 33,
    beneficiaryID: 44,
    nurseFlag: 1,
  };
  const guard = (session: Record<string, any>) =>
    new WorkareaCanActivate(createSessionStorageMock(session) as any);

  it('allows activation when a visit category and all visit keys exist', () => {
    expect(guard(fullVisit).canActivate()).toBeTrue();
  });

  [
    'visitCode',
    'beneficiaryGender',
    'benFlowID',
    'beneficiaryRegID',
    'visitID',
    'beneficiaryID',
    'nurseFlag',
  ].forEach((missing) => {
    it(`blocks activation with a visit category when ${missing} is missing`, () => {
      const s: any = { ...fullVisit };
      delete s[missing];
      expect(guard(s).canActivate()).toBeFalse();
    });
  });

  const benOnly = {
    beneficiaryGender: 'Male',
    beneficiaryRegID: 1,
    beneficiaryID: 2,
    benFlowID: 3,
  };

  it('allows activation without visit category when beneficiary keys exist', () => {
    expect(guard(benOnly).canActivate()).toBeTrue();
  });

  [
    'beneficiaryGender',
    'beneficiaryRegID',
    'beneficiaryID',
    'benFlowID',
  ].forEach((missing) => {
    it(`blocks activation without visit category when ${missing} is missing`, () => {
      const s: any = { ...benOnly };
      delete s[missing];
      expect(guard(s).canActivate()).toBeFalse();
    });
  });
});
