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
import { StringValidatorDirective } from './stringValidator.directive';

describe('StringValidatorDirective', () => {
  let directive: StringValidatorDirective;

  const make = (pattern: string) => {
    directive = new StringValidatorDirective(new ElementRef(null));
    directive.allowText = pattern;
    return directive;
  };

  /** Simulates focus with `from` and then typing so the value becomes `to`. */
  const type = (from: string, to: string, extra: any = {}) => {
    const target: any = { value: from, maxLength: -1, ...extra };
    directive.onFocus({ target });
    target.value = to;
    directive.onInput({ target });
    return target.value;
  };

  describe('validate()', () => {
    const cases: [string, string, string][] = [
      ['alphabet', 'abcXYZ', 'ab1'],
      ['alphaspace', 'ab cd', 'ab-cd'],
      ['alphanumeric', 'ab12', 'ab 12'],
      ['alphanumericspace', 'ab 12', 'ab_12'],
      ['number', '123', '12a'],
      ['numberslash', '12/3', '12-3'],
      ['alphanumerichyphen', 'a-1/b 2', 'a_1'],
      ['numerichyphen', '12-34 5', '12a'],
      ['decimal', '12.34', '12.345'],
      ['tempDecimal', '36.5', '36.55'],
      ['address', '12, Main St. #4/B', 'x@y'],
      ['inputFieldValidator', 'abc 1', 'abc!'],
      ['textAreaValidator', 'a, b.', 'a;b'],
      ['questionnaireValidator', 'why?', 'why!'],
      ['addressValidator', 'a/b-c #1', 'a@b'],
      ['smsTemplateValidator', 'Hi $1: (ok);', 'hi!'],
      ['itemNameSearchValidator', 'para 50%', 'para-50'],
      ['itemNameMasterValidator', 'Para-50%(x)', 'para 50'],
      ['answerValidator', 'a, b/c-d.', 'a?'],
      ['usernameValidator', 'user1', 'user_1'],
    ];
    cases.forEach(([pattern, ok, bad]) =>
      it(`${pattern}: accepts "${ok}" and rejects "${bad}"`, () => {
        make(` ${pattern} `);
        expect(directive.validate(ok)).toBeTrue();
        expect(directive.validate(bad)).toBeFalse();
      }),
    );

    it('rejects null and empty input', () => {
      make('alphabet');
      expect(directive.validate(null)).toBeFalse();
      expect(directive.validate('')).toBeFalse();
    });

    it('rejects everything for an unknown pattern', () => {
      make('unknown');
      expect(directive.validate('abc')).toBeFalse();
    });
  });

  describe('decimal / tempDecimal input', () => {
    ['decimal', 'tempDecimal'].forEach((p) => {
      it(`${p}: keeps valid values`, () => {
        make(p);
        expect(type('1', '1.5')).toBe('1.5');
        expect(directive.lastValue).toBe('1.5' as any);
      });
      it(`${p}: reverts invalid values`, () => {
        make(p);
        expect(type('1.5', '1.5x')).toBe('1.5');
      });
      it(`${p}: allows clearing the field`, () => {
        make(p);
        expect(type('1.5', '')).toBe('');
      });
    });
  });

  describe('number input', () => {
    beforeEach(() => make('number'));

    it('clears a leading zero entry', () => {
      expect(type('', '0')).toBe('');
    });

    it('accepts digits', () => {
      expect(type('1', '12')).toBe('12');
    });

    it('rejects non-digit characters', () => {
      expect(type('1', '1a')).toBe('1');
    });

    it('validates without the zero check when the target has a length', () => {
      expect(type('', '0', { length: 1 })).toBe('0');
    });
  });

  describe('generic validateEntry()', () => {
    beforeEach(() => make('alphabet'));

    it('accepts valid typed characters', () => {
      expect(type('ab', 'abc')).toBe('abc');
    });

    it('rejects invalid typed characters', () => {
      expect(type('ab', 'ab1')).toBe('ab');
    });

    it('reverts values longer than maxLength', () => {
      expect(type('abc', 'abcd', { maxLength: 3 })).toBe('abc');
    });

    it('allows deletions', () => {
      expect(type('abc', 'ab')).toBe('ab');
    });

    it('re-validates an unchanged value (no insert, no removal)', () => {
      // inserted === '' so isValidChar('') is false and the (same) last value is restored
      expect(type('abc', 'abc')).toBe('abc');
    });
  });

  it('findDelta returns the inserted substring', () => {
    make('alphabet');
    expect(directive.findDelta('abXYc', 'abc')).toBe('XY');
    expect(directive.findDelta('abc', 'abc')).toBe('');
  });

  it('isValidString checks every character', () => {
    make('alphabet');
    expect(directive.isValidString('abc')).toBeTrue();
    expect(directive.isValidString('a1c')).toBeFalse();
  });

  ['blockPaste', 'blockCopy', 'blockCut'].forEach((m) =>
    it(`${m} prevents the clipboard event`, () => {
      make('alphabet');
      const ev = { preventDefault: jasmine.createSpy('preventDefault') };
      (directive as any)[m](ev);
      expect(ev.preventDefault).toHaveBeenCalled();
    }),
  );
});
