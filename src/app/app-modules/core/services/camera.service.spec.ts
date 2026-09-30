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
import { CameraService } from './camera.service';
import { CameraDialogComponent } from '../components/camera-dialog/camera-dialog.component';

describe('CameraService', () => {
  let service: CameraService;
  let dialog: any;
  let ref: any;

  beforeEach(() => {
    ref = {
      componentInstance: {} as any,
      afterClosed: jasmine.createSpy('afterClosed').and.returnValue(of('img')),
    };
    dialog = { open: jasmine.createSpy('open').and.returnValue(ref) };
    TestBed.configureTestingModule({
      providers: [CameraService, { provide: MatDialog, useValue: dialog }],
    });
    service = TestBed.inject(CameraService);
  });

  it('capture opens dialog in capture mode and returns afterClosed', () => {
    let result: any;
    service.capture().subscribe((r) => (result = r));
    expect(dialog.open.calls.mostRecent().args[0]).toBe(CameraDialogComponent);
    expect(ref.componentInstance.capture).toBeTrue();
    expect(ref.componentInstance.imageCode).toBeFalse();
    expect(result).toBe('img');
  });

  it('viewImage sets imageCode', () => {
    service.viewImage('code123');
    expect(ref.componentInstance.capture).toBeFalse();
    expect(ref.componentInstance.imageCode).toBe('code123');
  });

  it('annotate configures annotate mode', () => {
    let result: any;
    service.annotate('image', [1], { a: 1 }).subscribe((r) => (result = r));
    expect(dialog.open).toHaveBeenCalledWith(CameraDialogComponent, {
      width: '80%',
    });
    expect(ref.componentInstance.annotate).toBe('image');
    expect(ref.componentInstance.availablePoints).toEqual([1]);
    expect(ref.componentInstance.current_language_set).toEqual({ a: 1 });
    expect(result).toBe('img');
  });

  it('ViewGraph sets graph', () => {
    service.ViewGraph({ g: 1 });
    expect(ref.componentInstance.graph).toEqual({ g: 1 });
    expect(ref.componentInstance.annotate).toBeFalse();
    expect(ref.componentInstance.availablePoints).toBeFalse();
  });
});
