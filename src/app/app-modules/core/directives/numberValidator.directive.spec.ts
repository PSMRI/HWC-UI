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
import { NumberValidatorDirective } from './numberValidator.directive';

describe('NumberValidatorDirective', () => {
  let directive: NumberValidatorDirective;

  beforeEach(() => {
    directive = new NumberValidatorDirective(new ElementRef(null));
    directive.allowMax = '100';
  });

  it('validates values against allowMax numerically', () => {
    expect(directive.validate('99')).toBeTrue();
    expect(directive.validate('100')).toBeTrue();
    expect(directive.validate('101')).toBeFalse();
    expect(directive.validate('abc')).toBeFalse();
  });

  it('remembers the value on focus and keeps valid input', () => {
    directive.onFocus({ target: { value: '10' } });
    expect(directive.lastValue).toBe('10' as any);
    const ev = { target: { value: '50' } };
    directive.onInput(ev);
    expect(ev.target.value).toBe('50');
    expect(directive.lastValue).toBe('50' as any);
  });

  it('reverts input that exceeds allowMax to the last value', () => {
    directive.onFocus({ target: { value: '10' } });
    const ev = { target: { value: '500' } };
    directive.onInput(ev);
    expect(ev.target.value).toBe('10');
    expect(directive.lastValue).toBe('10' as any);
  });

  ['blockPaste', 'blockCopy', 'blockCut'].forEach((m) =>
    it(`${m} prevents the clipboard event`, () => {
      const ev = { preventDefault: jasmine.createSpy('preventDefault') };
      (directive as any)[m](ev);
      expect(ev.preventDefault).toHaveBeenCalled();
    }),
  );
});
