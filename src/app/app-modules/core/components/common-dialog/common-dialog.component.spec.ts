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
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
  discardPeriodicTasks,
} from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { CommonDialogComponent } from './common-dialog.component';
import {
  COMMON_TEST_IMPORTS,
  commonTestProviders,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
} from 'src/testing/test-utils';

describe('CommonDialogComponent', () => {
  let component: CommonDialogComponent;
  let fixture: ComponentFixture<CommonDialogComponent>;
  let ref: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MatRadioModule],
      declarations: [CommonDialogComponent],
      providers: [...commonTestProviders()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(CommonDialogComponent);
    component = fixture.componentInstance;
    ref = TestBed.inject(MatDialogRef);
  });

  it('assigns language on init', () => {
    component.alert = true;
    component.message = 'Hello';
    component.status = 'info';
    fixture.detectChanges();
    expect(component.current_language_set).toBe(LANGUAGE_EN);
  });

  it('renders each dialog variant', () => {
    const flags = [
      'alert',
      'confirmAlert',
      'remarks',
      'editRemarks',
      'notify',
      'choice',
      'choiceSelect',
      'confirmcalibration',
      'confirmHealthID',
      'confirmCBAC',
      'confirmCareContext',
      'alertFetsenseMessage',
      'sessionTimeout',
    ];
    flags.forEach((f) => {
      const fx = TestBed.createComponent(CommonDialogComponent);
      (fx.componentInstance as any)[f] = true;
      fx.componentInstance.values = ['a', 'b'];
      fx.componentInstance.mandatories = ['m'];
      fx.componentInstance.message = 'msg';
      fx.componentInstance.title = 'info';
      fx.componentInstance.status = 'info';
      fx.detectChanges();
      expect(fx.nativeElement).toBeTruthy();
      fx.destroy();
    });
    expect(flags.length).toBe(13);
  });

  it('Confirm emits cancelEvent', () => {
    const spy = jasmine.createSpy();
    component.cancelEvent.subscribe(spy);
    component.Confirm();
    expect(spy).toHaveBeenCalledWith(null);
  });

  it('updateTimer counts down and closes with timeout', fakeAsync(() => {
    component.updateTimer(2);
    expect(component.timer).toBe(2);
    tick(1000);
    expect(component.timer).toBe(1);
    expect(component.seconds).toBe(2);
    tick(1000);
    expect(component.timer).toBe(0);
    tick(1000);
    expect(ref.close).toHaveBeenCalledWith({ action: 'timeout' });
    discardPeriodicTasks();
  }));

  it('updateTimer does nothing for zero', fakeAsync(() => {
    component.updateTimer(0);
    tick(2000);
    expect(component.intervalRef).toBeUndefined();
    expect(ref.close).not.toHaveBeenCalled();
  }));

  it('stopTimer closes with cancel + remaining time', fakeAsync(() => {
    component.updateTimer(10);
    tick(3000);
    component.stopTimer();
    expect(ref.close).toHaveBeenCalledWith({
      action: 'cancel',
      remainingTime: 7,
    });
    tick(5000);
    expect(component.timer).toBe(7);
  }));

  it('continueSession closes with continue', fakeAsync(() => {
    component.updateTimer(10);
    component.continueSession();
    expect(ref.close).toHaveBeenCalledWith({ action: 'continue' });
    tick(3000);
    expect(component.timer).toBe(10);
  }));
});
