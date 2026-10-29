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
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { environment } from 'src/environments/environment';
import { IotService } from './iot.service';

describe('IotService', () => {
  let service: IotService;
  let httpMock: HttpTestingController;
  const base = environment.ioturl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [IotService],
    });
    service = TestBed.inject(IotService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created with urls from environment', () => {
    expect(service).toBeTruthy();
    expect(service.baseurl).toBe(environment.ioturl);
    expect(service.disconnectdeviceBluetoothurl).toBe(
      environment.deviceDisconnectUrl,
    );
  });

  it('setBluetoothConnected updates flag and emits', () => {
    const values: any[] = [];
    service.disconnectValue$.subscribe((v) => values.push(v));
    service.setBluetoothConnected(true);
    expect(service.disconnect).toBeTrue();
    expect(values).toEqual([false, true]);
  });

  it('startAPI posts null to base+input', () => {
    service.startAPI('start/x').subscribe((r) => expect(r).toEqual({ a: 1 }));
    const req = httpMock.expectOne(base + 'start/x');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBeNull();
    req.flush({ a: 1 });
  });

  it('statusAPI gets base+input', () => {
    service.statusAPI('status').subscribe();
    const req = httpMock.expectOne(base + 'status');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('endAPI puts base+input', () => {
    service.endAPI('end').subscribe();
    const req = httpMock.expectOne(base + 'end');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toBeNull();
    req.flush({});
  });

  it('endCalibrationAPI puts headers object as body', () => {
    service.endCalibrationAPI('cal').subscribe();
    const req = httpMock.expectOne(base + 'cal');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      headers: { 'Content-Type': ['application/json'] },
    });
    req.flush({});
  });

  it('getDeviceStatus / getBluetoothDevice do GETs', () => {
    service.getDeviceStatus().subscribe();
    service.getBluetoothDevice().subscribe();
    expect(httpMock.expectOne(environment.deviceStatusurl).request.method).toBe(
      'GET',
    );
    httpMock.expectOne(environment.deviceBluetoothurl).flush({});
    httpMock.match(environment.deviceStatusurl);
  });

  it('connectBluetoothDevice posts to url/str', () => {
    service.connectBluetoothDevice('dev1').subscribe();
    const req = httpMock.expectOne(
      environment.connectdeviceBluetoothurl + '/dev1',
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({});
  });

  it('disconnectBluetoothDevice posts null', () => {
    service.disconnectBluetoothDevice().subscribe();
    const req = httpMock.expectOne(environment.deviceDisconnectUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBeNull();
    req.flush({});
  });

  it('pairExternalDevice posts {} to base+url', () => {
    service.pairExternalDevice('pair').subscribe();
    const req = httpMock.expectOne(base + 'pair');
    expect(req.request.body).toEqual({});
    req.flush({});
  });
});
