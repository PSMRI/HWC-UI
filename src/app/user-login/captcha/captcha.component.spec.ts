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
import { NO_ERRORS_SCHEMA } from 'src/testing/test-utils';
import { environment } from 'src/environments/environment';
import { CaptchaService } from '../captcha-service/captcha.service';
import { CaptchaComponent } from './captcha.component';

describe('CaptchaComponent', () => {
  let component: CaptchaComponent;
  let fixture: ComponentFixture<CaptchaComponent>;
  let captchaService: any;
  let turnstile: any;
  let hadTurnstile: boolean;
  let prevTurnstile: any;

  beforeEach(async () => {
    hadTurnstile = 'turnstile' in window;
    prevTurnstile = (window as any).turnstile;
    turnstile = {
      render: jasmine.createSpy('render').and.returnValue('widget-1'),
      reset: jasmine.createSpy('reset'),
      remove: jasmine.createSpy('remove'),
    };
    (window as any).turnstile = turnstile;
    captchaService = {
      loadScript: jasmine
        .createSpy('loadScript')
        .and.returnValue(Promise.resolve()),
    };
    await TestBed.configureTestingModule({
      declarations: [CaptchaComponent],
      providers: [{ provide: CaptchaService, useValue: captchaService }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(CaptchaComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    if (hadTurnstile) (window as any).turnstile = prevTurnstile;
    else delete (window as any).turnstile;
  });

  it('renders the turnstile widget after the script loads and emits tokens', async () => {
    const tokens: string[] = [];
    component.tokenResolved.subscribe((t) => tokens.push(t));
    fixture.detectChanges();
    await fixture.whenStable();
    await component.ngAfterViewInit();
    expect(captchaService.loadScript).toHaveBeenCalled();
    // rendered only once even though ngAfterViewInit ran twice
    expect(turnstile.render).toHaveBeenCalledTimes(1);
    const [el, opts] = turnstile.render.calls.mostRecent().args;
    expect(el).toBe(component.captchaRef.nativeElement);
    expect(opts.sitekey).toBe(environment.siteKey);
    expect(opts.theme).toBe('light');
    opts.callback('tok-123');
    expect(tokens).toEqual(['tok-123']);
  });

  it('logs and stops when the container element is missing', async () => {
    const err = spyOn(console, 'error');
    component.captchaRef = undefined as any;
    await component.ngAfterViewInit();
    expect(err).toHaveBeenCalledWith('CAPTCHA container element not found');
    expect(turnstile.render).not.toHaveBeenCalled();
  });

  it('logs when the script fails to load', async () => {
    const err = spyOn(console, 'error');
    const failure = new Error('nope');
    captchaService.loadScript.and.returnValue(Promise.reject(failure));
    await component.ngAfterViewInit();
    expect(err).toHaveBeenCalledWith('Failed to initialize CAPTCHA:', failure);
  });

  it('reset and destroy use the widget id', async () => {
    component.captchaRef = { nativeElement: document.createElement('div') };
    await component.ngAfterViewInit();
    component.reset();
    expect(turnstile.reset).toHaveBeenCalledWith('widget-1');
    component.ngOnDestroy();
    expect(turnstile.remove).toHaveBeenCalledWith('widget-1');
  });

  it('reset and destroy are no-ops without a widget', () => {
    component.reset();
    component.ngOnDestroy();
    expect(turnstile.reset).not.toHaveBeenCalled();
    expect(turnstile.remove).not.toHaveBeenCalled();
  });

  it('reset and destroy are no-ops when turnstile is unavailable', async () => {
    component.captchaRef = { nativeElement: document.createElement('div') };
    await component.ngAfterViewInit();
    delete (window as any).turnstile;
    component.reset();
    component.ngOnDestroy();
    expect(turnstile.reset).not.toHaveBeenCalled();
    expect(turnstile.remove).not.toHaveBeenCalled();
  });
});
