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
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { ConfirmationService } from './confirmation.service';
import { CommonDialogComponent } from '../components/common-dialog/common-dialog.component';

describe('ConfirmationService (real)', () => {
  let service: ConfirmationService;
  let dialog: any;
  let ref: any;

  beforeEach(() => {
    ref = {
      componentInstance: { updateTimer: jasmine.createSpy('updateTimer') },
      disableClose: false,
      afterClosed: jasmine.createSpy('afterClosed').and.returnValue(of(true)),
    };
    dialog = { open: jasmine.createSpy('open').and.returnValue(ref) };
    TestBed.configureTestingModule({
      providers: [
        ConfirmationService,
        { provide: MatDialog, useValue: dialog },
      ],
    });
    service = TestBed.inject(ConfirmationService);
  });

  const ci = () => ref.componentInstance;

  it('confirm sets confirmAlert and default buttons', () => {
    let r: any;
    service.confirm('T', 'M').subscribe((x) => (r = x));
    expect(dialog.open).toHaveBeenCalledWith(CommonDialogComponent, {
      width: '420px',
      disableClose: false,
    });
    expect(ci().title).toBe('T');
    expect(ci().message).toBe('M');
    expect(ci().btnOkText).toBe('OK');
    expect(ci().btnCancelText).toBe('Cancel');
    expect(ci().confirmAlert).toBeTrue();
    expect(ref.disableClose).toBeTrue();
    expect(r).toBeTrue();
  });

  it('confirmHealthId', () => {
    service.confirmHealthId('T', 'M', 'Go').subscribe();
    expect(ci().confirmHealthID).toBeTrue();
    expect(ci().btnOkText).toBe('Go');
    expect(ref.disableClose).toBeTrue();
  });

  it('alert lowercases status and returns ref', () => {
    const out = service.alert('msg', 'ERROR');
    expect(out).toBe(ref);
    expect(ci().status).toBe('error');
    expect(ci().alert).toBeTrue();
    expect(ci().btnOkText).toBe('OK');
  });

  it('alert defaults to info', () => {
    service.alert('msg');
    expect(ci().status).toBe('info');
  });

  it('remarks', () => {
    service.remarks('m').subscribe();
    expect(ci().remarks).toBeTrue();
    expect(ci().btnOkText).toBe('Submit');
    expect(ci().btnCancelText).toBe('Cancel');
  });

  it('editRemarks', () => {
    service.editRemarks('m', 'c').subscribe();
    expect(dialog.open).toHaveBeenCalledWith(CommonDialogComponent, {
      width: '60%',
    });
    expect(ci().editRemarks).toBeTrue();
    expect(ci().comments).toBe('c');
  });

  it('notify', () => {
    service.notify('m', ['a']).subscribe();
    expect(ci().notify).toBeTrue();
    expect(ci().mandatories).toEqual(['a']);
  });

  it('choice', () => {
    service.choice('m', [1, 2]).subscribe();
    expect(ci().choice).toBeTrue();
    expect(ci().values).toEqual([1, 2]);
    expect(ci().btnOkText).toBe('Confirm');
  });

  it('startTimer sets sessionTimeout and starts timer', () => {
    service.startTimer('t', 'm', 30).subscribe();
    expect(dialog.open).toHaveBeenCalledWith(CommonDialogComponent, {
      width: '420px',
      disableClose: true,
    });
    expect(ci().sessionTimeout).toBeTrue();
    expect(ci().updateTimer).toHaveBeenCalledWith(30);
    expect(ci().btnOkText).toBe('Continue');
  });

  it('choiceSelect', () => {
    service.choiceSelect('m', ['x']).subscribe();
    expect(ci().choiceSelect).toBeTrue();
    expect(ci().choice).toBeFalse();
    expect(ci().btnOkText).toBe('Proceed');
  });

  it('alertFetsenseMessage', () => {
    service.alertFetsenseMessage('m');
    expect(ci().alertFetsenseMessage).toBeTrue();
    expect(ci().status).toBe('Fetosense Device');
  });

  it('confirmCalibration', () => {
    service.confirmCalibration('t', 'm').subscribe();
    expect(ci().confirmcalibration).toBeTrue();
    expect(ci().btnOkText).toBe('Yes');
    expect(ci().btnCancelText).toBe('No');
  });

  it('confirmCBAC', () => {
    service.confirmCBAC('t', 'm', { d: 1 }).subscribe();
    expect(ci().confirmCBAC).toBeTrue();
    expect(ci().cbacData).toEqual({ d: 1 });
  });

  it('confirmCareContext', () => {
    service.confirmCareContext('t', 'm').subscribe();
    expect(ci().confirmCareContext).toBeTrue();
    expect(ci().confirmCBAC).toBeFalse();
    expect(ref.disableClose).toBeTrue();
  });
});
