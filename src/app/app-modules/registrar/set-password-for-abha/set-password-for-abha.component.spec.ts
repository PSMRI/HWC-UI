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
import { MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';

import { SetPasswordForAbhaComponent } from './set-password-for-abha.component';
import { ConfirmationService } from '../../core/services/confirmation.service';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('SetPasswordForAbhaComponent', () => {
  let component: SetPasswordForAbhaComponent;
  let fixture: ComponentFixture<SetPasswordForAbhaComponent>;
  let dialogRef: any;
  let confirm: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [SetPasswordForAbhaComponent],
      providers: [...commonTestProviders()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(SetPasswordForAbhaComponent);
    component = fixture.componentInstance;
    dialogRef = TestBed.inject(MatDialogRef);
    confirm = TestBed.inject(ConfirmationService);
    fixture.detectChanges();
  });

  it('should create, disable close and load language', () => {
    expect(component).toBeTruthy();
    expect(dialogRef.disableClose).toBeTrue();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });

  it('ngDoCheck refreshes language', () => {
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });

  it('toggles password visibility', () => {
    component.showPWD();
    component.showPWDConfirm();
    expect(component.dynamictype).toBe('text');
    expect(component.dynamictypeConfirm).toBe('text');
    component.hidePWD();
    component.hidePWDConfirm();
    expect(component.dynamictype).toBe('password');
    expect(component.dynamictypeConfirm).toBe('password');
  });

  it('closeDialog closes without value', () => {
    component.closeDialog();
    expect(dialogRef.close).toHaveBeenCalledWith();
  });

  describe('updatePass', () => {
    [
      [null, null],
      [undefined, undefined],
      ['', ''],
    ].forEach(([n, c]) => {
      it(`asks to proceed without password when both empty (${n})`, () => {
        component.newpwd = n;
        component.confirmpwd = c;
        component.updatePass();
        expect(confirm.confirm).toHaveBeenCalledWith(
          'info',
          LANGUAGE_EN.proceedWithOutPassword,
          'Yes',
          'No',
        );
        expect(dialogRef.close).toHaveBeenCalledWith(null);
      });
    });

    it('does not close when user declines proceeding without password', () => {
      confirm.confirm.and.returnValue(of(false));
      component.updatePass();
      expect(dialogRef.close).not.toHaveBeenCalled();
    });

    it('alerts when passwords do not match', () => {
      component.newpwd = 'Abcdef@1';
      component.confirmpwd = 'x';
      component.updatePass();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.passwordDoesNotMatch,
        'error',
      );
    });

    it('alerts when password contains sequence', () => {
      component.newpwd = component.confirmpwd = 'Abc@1234';
      component.updatePass();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.passwordNotContainSequence,
        'error',
      );
    });

    it('alerts when password fails complexity', () => {
      component.newpwd = component.confirmpwd = 'abcdefgh';
      component.updatePass();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.mustContainForSetPassword,
        'error',
      );
    });

    it('closes with password when valid', () => {
      component.newpwd = component.confirmpwd = 'Abcdef@17';
      component.updatePass();
      expect(confirm.alert).not.toHaveBeenCalled();
      expect(dialogRef.close).toHaveBeenCalledWith('Abcdef@17');
    });
  });

  it('testPassword detects ascending and descending digit sequences', () => {
    expect(component.testPassword('a12')).toBeFalse();
    expect(component.testPassword('a21')).toBeFalse();
    expect(component.testPassword('a1b3')).toBeTrue();
  });

  it('passwordValidator enforces complexity', () => {
    expect(component.passwordValidator('Abcdef@1')).toBeTrue();
    expect(component.passwordValidator('short')).toBeFalse();
  });
});
