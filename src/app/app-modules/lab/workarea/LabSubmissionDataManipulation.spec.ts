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

import { DataManipulation } from './LabSubmissionDataManipulation';

describe('Lab DataManipulation', () => {
  let dm: DataManipulation;
  beforeEach(() => (dm = new DataManipulation()));

  it('technicalDataRestruct returns undefined lab results without labForm', () => {
    expect(dm.technicalDataRestruct({})).toEqual({
      labTestResults: undefined,
      radiologyTestResults: undefined,
    });
  });

  it('technicalDataRestruct restructures lab form', () => {
    const out = dm.technicalDataRestruct({
      labForm: [
        {
          prescriptionID: 1,
          procedureID: 2,
          compListDetails: [
            {
              testComponentID: 10,
              inputValue: '5',
              measurementUnit: 'mg',
              remarks: 'ok',
            },
          ],
        },
      ],
    });
    expect(out.labTestResults).toEqual([
      {
        prescriptionID: 1,
        procedureID: 2,
        compList: [
          {
            testComponentID: 10,
            testResultValue: '5',
            testResultUnit: 'mg',
            remarks: 'ok',
          },
        ],
      },
    ]);
  });

  it('laboratoryDataRestruct drops entries missing ids or with no components', () => {
    const out = dm.laboratoryDataRestruct([
      { prescriptionID: 1, compListDetails: [] },
      { prescriptionID: 1, procedureID: 2, compListDetails: [] },
      {
        prescriptionID: 3,
        procedureID: 4,
        compListDetails: [{ testComponentID: 1, compOptSelected: 'Pos' }],
      },
    ]);
    expect(out.length).toBe(1);
    expect(out[0].procedureID).toBe(4);
    expect(out[0].compList[0].testResultValue).toBe('Pos');
  });

  describe('labComponentRestruct', () => {
    it('includes strips-not-available components with an id', () => {
      const out = dm.labComponentRestruct([
        { stripsNotavailable: true, testComponentID: 5 },
        { stripsNotavailable: true },
      ]);
      expect(out).toEqual([
        {
          testComponentID: 5,
          testResultValue: undefined,
          testResultUnit: undefined,
          remarks: undefined,
          stripsNotAvailable: true,
        },
      ]);
    });

    it('strips-not-available keeps provided values', () => {
      const out = dm.labComponentRestruct([
        {
          stripsNotavailable: true,
          testComponentID: 5,
          inputValue: '1',
          measurementUnit: 'u',
          remarks: 'r',
        },
      ]);
      expect(out[0].testResultValue).toBe('1');
      expect(out[0].testResultUnit).toBe('u');
      expect(out[0].remarks).toBe('r');
    });

    it('skips components without a value', () => {
      expect(
        dm.labComponentRestruct([{ testComponentID: 5 }, { inputValue: '3' }]),
      ).toEqual([]);
    });

    it('uses compOptSelected when inputValue absent', () => {
      const out = dm.labComponentRestruct([
        { testComponentID: 5, compOptSelected: 'Neg' },
      ]);
      expect(out).toEqual([
        {
          testComponentID: 5,
          testResultValue: 'Neg',
          testResultUnit: undefined,
          remarks: undefined,
        },
      ]);
    });
  });
});
