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
import { MyPasswordDirective } from './myPassword.directive';

describe('MyPasswordDirective', () => {
  let directive: MyPasswordDirective;
  let input: HTMLInputElement;
  let hint: HTMLElement;
  let wrapper: HTMLElement;

  beforeEach(() => {
    directive = new MyPasswordDirective(new ElementRef(null));
    wrapper = document.createElement('div');
    input = document.createElement('input');
    hint = document.createElement('span');
    wrapper.appendChild(input);
    wrapper.appendChild(document.createTextNode(' '));
    wrapper.appendChild(hint);
  });

  const keyup = (value: string) => {
    input.value = value;
    directive.onKeyUp({ target: input });
  };

  it('marks a valid 8-12 char password starting with a letter as strong', () => {
    keyup('Abcdef12');
    expect(hint.innerHTML).toBe('Strong Password');
    expect(input.style.border).toContain('green');
  });

  it('marks a password not starting with a letter as invalid', () => {
    keyup('1bcdefgh');
    expect(hint.innerHTML).toContain('password should be 8-12 characters long');
    expect(input.style.border).toContain('red');
  });

  it('marks a too-short password as invalid', () => {
    keyup('Abc');
    expect(hint.innerHTML).toContain('8-12 characters');
    expect(input.style.border).toContain('red');
  });

  it('marks a too-long password as invalid', () => {
    keyup('Abcdefghijklm');
    expect(input.style.border).toContain('red');
  });

  it('prevents whitespace key presses', () => {
    const ev = {
      charCode: 32,
      which: 32,
      preventDefault: jasmine.createSpy('preventDefault'),
    };
    directive.onKeyPress(ev);
    expect(ev.preventDefault).toHaveBeenCalled();
  });

  it('allows non-whitespace key presses, falling back to which', () => {
    const ev = {
      charCode: 0,
      which: 65,
      preventDefault: jasmine.createSpy('preventDefault'),
    };
    directive.onKeyPress(ev);
    expect(ev.preventDefault).not.toHaveBeenCalled();
  });

  ['blockPaste', 'blockCopy', 'blockCut'].forEach((m) =>
    it(`${m} prevents the clipboard event`, () => {
      const ev = { preventDefault: jasmine.createSpy('preventDefault') };
      (directive as any)[m](ev);
      expect(ev.preventDefault).toHaveBeenCalled();
    }),
  );
});
