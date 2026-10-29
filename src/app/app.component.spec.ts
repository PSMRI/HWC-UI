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
import { RouterTestingModule } from '@angular/router/testing';
import {
  NO_ERRORS_SCHEMA,
  autoSpy,
  createTrackingMock,
} from 'src/testing/test-utils';
import { SpinnerService } from './app-modules/core/services/spinner.service';
import { AmritTrackingService } from 'Common-UI/src/tracking';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let component: AppComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [AppComponent],
      providers: [
        { provide: SpinnerService, useValue: autoSpy(SpinnerService) },
        { provide: AmritTrackingService, useValue: createTrackingMock() },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
  });

  it('has the app title', () => {
    expect(component.title).toBe('AAM-Facility-App');
  });

  it('logs on init and renders the spinner and router outlet', () => {
    const log = spyOn(console, 'log');
    fixture.detectChanges();
    expect(log).toHaveBeenCalledWith('success');
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('app-spinner')).toBeTruthy();
    expect(el.querySelector('router-outlet')).toBeTruthy();
  });
});
