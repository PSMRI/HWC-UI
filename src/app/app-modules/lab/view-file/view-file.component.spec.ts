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
import { of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { ViewFileComponent } from './view-file.component';

describe('Lab ViewFileComponent', () => {
  let component: ViewFileComponent;
  let fixture: ComponentFixture<ViewFileComponent>;
  let data: any;
  let dialogRef: any;
  let confirm: any;

  beforeEach(async () => {
    data = {
      procedureID: 7,
      viewFileObj: { 7: [{ name: 'a' }, { name: 'b' }] },
    };
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [ViewFileComponent],
      providers: [
        ...commonTestProviders(),
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(ViewFileComponent);
    component = fixture.componentInstance;
    dialogRef = TestBed.inject(MatDialogRef) as any;
    confirm = TestBed.inject(ConfirmationService) as any;
    fixture.detectChanges();
  });

  it('disables close and assigns the procedure file list', () => {
    expect(dialogRef.disableClose).toBeTrue();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.fileObj).toBe(data.viewFileObj[7]);
  });

  it('remove deletes the file after confirm', () => {
    const f = data.viewFileObj[7][0];
    component.remove(f);
    expect(confirm.confirm).toHaveBeenCalledWith(
      'info',
      LANGUAGE_EN.alerts.info.wantToRemoveFile,
    );
    expect(data.viewFileObj[7]).toEqual([{ name: 'b' }]);
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('remove closes dialog when last file removed', () => {
    data.viewFileObj[7].splice(1, 1);
    component.remove(data.viewFileObj[7][0]);
    expect(dialogRef.close).toHaveBeenCalledWith({ 7: [] });
  });

  it('remove ignores unknown file', () => {
    component.remove({ name: 'zzz' });
    expect(data.viewFileObj[7].length).toBe(2);
  });

  it('remove does nothing when declined', () => {
    confirm.confirm.and.returnValue(of(false));
    component.remove(data.viewFileObj[7][0]);
    expect(data.viewFileObj[7].length).toBe(2);
  });

  it('closeDialog returns file object', () => {
    component.closeDialog();
    expect(dialogRef.close).toHaveBeenCalledWith(data.viewFileObj);
  });

  it('ngDoCheck re-assigns language', () => {
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });
});
