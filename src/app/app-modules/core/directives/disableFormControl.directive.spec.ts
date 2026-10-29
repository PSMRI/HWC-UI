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
import { FormControl, FormGroup, NgControl } from '@angular/forms';
import { DisableFormControlDirective } from './disableFormControl.directive';

describe('DisableFormControlDirective', () => {
  let group: FormGroup;
  let control: FormControl;
  let directive: DisableFormControlDirective;

  beforeEach(() => {
    control = new FormControl('value');
    group = new FormGroup({ field: control, other: new FormControl('o') });
    directive = new DisableFormControlDirective({
      control,
    } as unknown as NgControl);
  });

  it('disables and clears the control when the condition is true', () => {
    directive.disableFormControl = true;
    expect(control.disabled).toBeTrue();
    expect(control.value).toBeNull();
    expect(control.touched).toBeTrue();
  });

  it('enables the control when the condition is false', () => {
    control.disable();
    directive.disableFormControl = false;
    expect(control.enabled).toBeTrue();
    expect(control.touched).toBeTrue();
  });

  it('keeps the value but disables when the parent is already disabled', () => {
    group.disable();
    directive.disableFormControl = false;
    expect(control.disabled).toBeTrue();
    expect(control.value).toBe('value');
  });

  it('does nothing when the control has no parent', () => {
    const orphan = new FormControl('v');
    const d = new DisableFormControlDirective({
      control: orphan,
    } as unknown as NgControl);
    d.disableFormControl = true;
    expect(orphan.enabled).toBeTrue();
    expect(orphan.value).toBe('v');
  });

  it('does nothing when there is no control', () => {
    const d = new DisableFormControlDirective({
      control: null,
    } as unknown as NgControl);
    expect(() => (d.disableFormControl = true)).not.toThrow();
  });
});
