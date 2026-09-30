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
import { BehaviorSubject, throwError, of } from 'rxjs';
import { SetLanguageComponent } from './set-language.component';

describe('SetLanguageComponent', () => {
  it('reads current language synchronously', () => {
    const svc: any = { currentLangugae$: new BehaviorSubject({ a: 1 }) };
    const c = new SetLanguageComponent(svc);
    c.setLanguage();
    expect(c.currentLanguageObject).toEqual({ a: 1 });
  });

  it('logs errors from the language stream', () => {
    spyOn(console, 'log');
    const c = new SetLanguageComponent({
      currentLangugae$: throwError(() => 'bad'),
    } as any);
    c.setLanguage();
    expect(console.log).toHaveBeenCalledWith('bad');
    expect(c.currentLanguageObject).toBeUndefined();
  });

  it('logs completion', () => {
    spyOn(console, 'log');
    const c = new SetLanguageComponent({ currentLangugae$: of('x') } as any);
    c.setLanguage();
    expect(c.currentLanguageObject).toBe('x');
    expect(console.log).toHaveBeenCalledWith('completed');
  });
});
