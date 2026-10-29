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
import { Component } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormControl, FormsModule, NgModel } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { MyEmailDirective } from './myEmail.directive';

@Component({
  template: '<input name="email" [(ngModel)]="email" appValidateEmail />',
})
class EmailHostComponent {
  email = 'bad-email';
}

describe('MyEmailDirective', () => {
  let directive: MyEmailDirective;

  beforeEach(() => (directive = new MyEmailDirective()));

  it('treats empty and null values as valid', () => {
    expect(directive.validate(new FormControl(''))).toBeNull();
    expect(directive.validate(new FormControl(null))).toBeNull();
  });

  it('accepts well-formed emails with allowed TLDs', () => {
    expect(
      directive.validate(new FormControl('john.doe@example.com')),
    ).toBeNull();
    expect(directive.validate(new FormControl('a_b@gov.in'))).toBeNull();
    expect(directive.validate(new FormControl('X@ORG.ORG'))).toBeNull();
  });

  it('rejects malformed emails or unsupported TLDs', () => {
    expect(directive.validate(new FormControl('john@'))).toEqual({
      valid: false,
    });
    expect(directive.validate(new FormControl('john@example.net'))).toEqual({
      valid: false,
    });
    expect(directive.validate(new FormControl('john-doe@example.com'))).toEqual(
      { valid: false },
    );
  });

  ['blockPaste', 'blockCopy', 'blockCut'].forEach((m) =>
    it(`${m} prevents the clipboard event`, () => {
      const ev = { preventDefault: jasmine.createSpy('preventDefault') };
      (directive as any)[m](ev);
      expect(ev.preventDefault).toHaveBeenCalled();
    }),
  );

  it('registers itself as an NG_VALIDATORS validator on ngModel', fakeAsync(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [EmailHostComponent, MyEmailDirective],
    });
    const fx = TestBed.createComponent(EmailHostComponent);
    fx.detectChanges();
    tick();
    const model = fx.debugElement
      .query(By.directive(NgModel))
      .injector.get(NgModel);
    expect(model.valid).toBeFalse();
    expect(model.errors).toEqual({ valid: false });
  }));
});
