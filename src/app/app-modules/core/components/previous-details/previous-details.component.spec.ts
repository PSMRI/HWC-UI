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
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PreviousDetailsComponent } from './previous-details.component';
import {
  COMMON_TEST_IMPORTS,
  commonTestProviders,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
} from 'src/testing/test-utils';

describe('PreviousDetailsComponent', () => {
  const setup = async (input: any, renderTemplate = false) => {
    TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [PreviousDetailsComponent],
      providers: [
        ...commonTestProviders(),
        { provide: MAT_DIALOG_DATA, useValue: input },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    if (!renderTemplate) {
      TestBed.overrideTemplate(PreviousDetailsComponent, '');
    }
    await TestBed.compileComponents();
    const fx = TestBed.createComponent(PreviousDetailsComponent);
    fx.detectChanges();
    return fx.componentInstance;
  };

  const generic = () => ({
    title: 'Past History',
    dataList: {
      data: [
        { name: 'Asthma', year: 2010 },
        { name: 'Fever', year: 2020 },
      ],
      columns: [{ keyName: 'name' }, { keyName: 'year' }, { other: 1 }],
    },
  });

  it('loads generic data and columns (rendered)', async () => {
    const c = await setup(generic(), true);
    expect(c.current_language_set).toBe(LANGUAGE_EN);
    expect(c.dataList.length).toBe(2);
    expect(c.filteredDataList.data.length).toBe(2);
    expect(c.columnList.length).toBe(3);
    expect(c.displayedColumns).toEqual(['sno', 'name', 'year']);
  });

  it('filterPreviousData filters and resets', async () => {
    spyOn(console, 'log');
    const c = await setup(generic());
    c.filterPreviousData('fev');
    expect(c.filteredDataList.data).toEqual([c.dataList[1]]);
    c.filterPreviousData('');
    expect(c.filteredDataList.data).toEqual(c.dataList);
  });

  it('non-array data leaves dataList empty', async () => {
    const c = await setup({
      title: 'x',
      dataList: { data: null, columns: [] },
    });
    expect(c.dataList).toEqual([]);
  });

  it('MMU Referral Details builds a summary row', async () => {
    const c = await setup({
      title: 'MMU Referral Details',
      dataList: {
        data: {
          referralReason: 'r',
          referredToInstituteName: 'inst',
          refrredToAdditionalServiceList: [
            { serviceName: 'A' },
            { serviceName: 'B' },
          ],
          revisitDate: '2024-01-02T10:00:00',
          createdDate: '2024-01-01T09:00:00',
        },
        columns: [],
      },
    });
    expect(c.dataList[0].refrredToAdditionalServiceList).toBe('A,B');
    expect(c.dataList[0].referralReason).toBe('r');
    expect(c.dataList[0].revisitDate).toContain('02-01-2024');
    expect(c.columnList).toEqual([]);
  });

  it('MMU Referral Details with no additional services', async () => {
    const c = await setup({
      title: 'MMU Referral Details',
      dataList: { data: {}, columns: [] },
    });
    expect(c.dataList[0].refrredToAdditionalServiceList).toBe('');
  });

  it('MMU Investigation Details copies laboratory list', async () => {
    const c = await setup({
      title: 'MMU Investigation Details',
      dataList: { data: { laboratoryList: [{ t: 1 }, { t: 2 }] }, columns: [] },
    });
    expect(c.dataList).toEqual([{ t: 1 }, { t: 2 }]);
    const c2 = await (async () => {
      TestBed.resetTestingModule();
      return setup({
        title: 'MMU Investigation Details',
        dataList: { data: {}, columns: [] },
      });
    })();
    expect(c2.dataList).toEqual([]);
  });

  it('MMU Prescription Details formats created dates', async () => {
    const c = await setup({
      title: 'MMU Prescription Details',
      dataList: {
        data: [{ createdDate: '2024-03-05T08:00:00', drug: 'x' }],
        columns: [],
      },
    });
    expect(c.dataList[0].createdDate).toContain('05-03-2024');
  });

  it('closeDialog closes', async () => {
    const c = await setup(generic());
    c.closeDialog();
    expect(TestBed.inject(MatDialogRef).close).toHaveBeenCalled();
  });
});
