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

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';
import { ViewRadiologyUploadedFilesComponent } from './view-radiology-uploaded-files.component';

describe('ViewRadiologyUploadedFilesComponent', () => {
  let component: ViewRadiologyUploadedFilesComponent;
  let fixture: ComponentFixture<ViewRadiologyUploadedFilesComponent>;

  async function setup(data: any) {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [ViewRadiologyUploadedFilesComponent],
      providers: [
        ...commonTestProviders(),
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(ViewRadiologyUploadedFilesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('loads file ids from dialog input', async () => {
    const files = [{ fileID: 1, fileName: 'a.png' }];
    await setup({ filesDetails: files });
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.fileIds).toBe(files);
  });

  it('keeps empty list without filesDetails', async () => {
    await setup({});
    expect(component.fileIds).toEqual([]);
  });

  it('keeps empty list with null input', async () => {
    await setup(null);
    expect(component.fileIds).toEqual([]);
  });

  it('openFileContent closes dialog with file id', async () => {
    await setup({});
    component.openFileContent(9);
    expect((TestBed.inject(MatDialogRef) as any).close).toHaveBeenCalledWith(9);
  });

  it('ngDoCheck re-assigns language', async () => {
    await setup({});
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });
});
