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
import { ElementRef } from '@angular/core';
import { FormControl, NgControl } from '@angular/forms';
import { NullDefaultValueDirective } from './null-default-value.directive';

describe('NullDefaultValueDirective', () => {
  let control: FormControl;
  let directive: NullDefaultValueDirective;

  beforeEach(() => {
    control = new FormControl('x');
    directive = new NullDefaultValueDirective(new ElementRef(null), {
      control,
    } as unknown as NgControl);
  });

  it('sets the control to null when the input is emptied', () => {
    directive.onEvent({ value: '' } as HTMLInputElement);
    expect(control.value).toBeNull();
  });

  it('copies non-empty input values to the control', () => {
    directive.onEvent({ value: 'abc' } as HTMLInputElement);
    expect(control.value).toBe('abc');
  });

  it('does nothing when the NgControl has no control', () => {
    const d = new NullDefaultValueDirective(new ElementRef(null), {
      control: null,
    } as unknown as NgControl);
    expect(() => d.onEvent({ value: 'a' } as HTMLInputElement)).not.toThrow();
  });

  ['blockPaste', 'blockCopy', 'blockCut'].forEach((m) =>
    it(`${m} prevents the clipboard event`, () => {
      const ev = { preventDefault: jasmine.createSpy('preventDefault') };
      (directive as any)[m](ev);
      expect(ev.preventDefault).toHaveBeenCalled();
    }),
  );
});
