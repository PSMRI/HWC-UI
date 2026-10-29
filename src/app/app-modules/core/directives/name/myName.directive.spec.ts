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
import { MyNameDirective } from './myName.directive';

describe('MyNameDirective', () => {
  let directive: MyNameDirective;

  const keyEvent = (ch: string, useWhich = false) => ({
    charCode: useWhich ? 0 : ch.charCodeAt(0),
    which: ch.charCodeAt(0),
    preventDefault: jasmine.createSpy('preventDefault'),
  });

  beforeEach(() => {
    directive = new MyNameDirective(
      new ElementRef(document.createElement('input')),
    );
  });

  it('allows letters', () => {
    const ev = keyEvent('A');
    directive.onKeyPress(ev);
    expect(ev.preventDefault).not.toHaveBeenCalled();
  });

  it('falls back to which when charCode is 0', () => {
    const ev = keyEvent('b', true);
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
