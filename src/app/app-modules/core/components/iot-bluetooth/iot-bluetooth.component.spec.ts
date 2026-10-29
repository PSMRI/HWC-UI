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
import { Subject, of } from 'rxjs';
import { IotBluetoothComponent } from './iot-bluetooth.component';
import { IotService } from '../../services/iot.service';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

describe('IotBluetoothComponent', () => {
  let fixture: ComponentFixture<IotBluetoothComponent>;
  let component: IotBluetoothComponent;
  let iot: any;

  const body = (o: any) => ({ _body: JSON.stringify(o) });
  const connectedBody = {
    deviceConnected: true,
    bloodPressureIntro: true,
    cholUaIntro: false,
    glucometerIntro: true,
    ecgIntro: false,
    hbIntro: true,
    pulseOxIntro: true,
    urtCam1Intro: false,
    bgbenecheck: true,
  };

  beforeEach(async () => {
    iot = autoSpy(IotService);
    iot.getDeviceStatus.and.returnValue(of(body({ deviceConnected: false })));
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [IotBluetoothComponent],
      providers: [
        ...commonTestProviders(),
        { provide: IotService, useValue: iot },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(IotBluetoothComponent);
    component = fixture.componentInstance;
  });

  it('initialises modules, language and reports API available with no device', () => {
    fixture.detectChanges();
    expect(component.current_language_set).toBe(LANGUAGE_EN);
    expect(component.infoDetails.length).toBe(10);
    expect(component.apiAvailable).toBeTrue();
    expect(component.deviceConnected).toBeFalse();
    expect(component.spinner).toBeFalse();
    expect(component.errMsg).toBeUndefined();
  });

  it('configures modules when a device is already connected', () => {
    // Real HTTP responds asynchronously, after infoDetails is built.
    const status$ = new Subject<any>();
    iot.getDeviceStatus.and.returnValue(status$);
    component.ngOnInit();
    status$.next(body(connectedBody));
    expect(iot.setBluetoothConnected).toHaveBeenCalledWith(true);
    expect(component.deviceConnected).toBeTrue();
    expect(component.infoDetails.slice(0, 8).map((i) => i.status)).toEqual([
      true,
      false,
      true,
      false,
      true,
      true,
      false,
      true,
    ]);
  });

  it('treats a non-object error body as API reachable', () => {
    iot.getDeviceStatus.and.returnValue(throwingObs({ _body: 'text' }));
    component.ngOnInit();
    expect(component.apiAvailable).toBeTrue();
    expect(component.errMsg).toBeUndefined();
    expect(component.spinner).toBeFalse();
  });

  it('shows the not-running message for an object error body', () => {
    const status$ = new Subject<any>();
    iot.getDeviceStatus.and.returnValue(status$);
    component.ngOnInit();
    status$.error({ _body: {} });
    expect(component.apiAvailable).toBeFalse();
    expect(component.errMsg).toBe(LANGUAGE_EN.IOTDeviceNotRunning);
  });

  it('ngDoCheck refreshes the language', () => {
    component.current_language_set = null;
    component.ngDoCheck();
    expect(component.current_language_set).toBe(LANGUAGE_EN);
  });

  it('lists bluetooth devices and stops the spinner on error', () => {
    iot.getBluetoothDevice.and.returnValue(of(body([{ name: 'd1' }])));
    component.getBluetoothDevice();
    expect(component.bluetoothDevices).toEqual([{ name: 'd1' }]);
    expect(component.spinner).toBeFalse();
    iot.getBluetoothDevice.and.returnValue(throwingObs());
    component.getBluetoothDevice();
    expect(component.spinner).toBeFalse();
  });

  it('connects a bluetooth device and configures it', () => {
    component.ngOnInit();
    iot.connectBluetoothDevice.and.returnValue(of(body(connectedBody)));
    component.connectBluetoothDevice('AA:BB');
    expect(iot.connectBluetoothDevice).toHaveBeenCalledWith('AA:BB');
    expect(component.deviceConnected).toBeTrue();
    expect(component.spinner).toBeFalse();
    iot.connectBluetoothDevice.and.returnValue(throwingObs());
    component.spinner = true;
    component.connectBluetoothDevice('AA:BB');
    expect(component.spinner).toBeFalse();
  });

  [200, 202].forEach((status) =>
    it(`disconnects on status ${status}`, () => {
      component.deviceConnected = true;
      iot.disconnectBluetoothDevice.and.returnValue(
        of({ status, _body: JSON.stringify({ deviceConnected: false }) }),
      );
      component.disconnectBluetoothDevice();
      expect(iot.setBluetoothConnected).toHaveBeenCalledWith(false);
      expect(component.deviceConnected).toBeFalse();
      expect(component.spinner).toBeFalse();
    }),
  );

  it('shows the message when disconnect returns another status and handles errors', () => {
    iot.disconnectBluetoothDevice.and.returnValue(
      of({ status: 500, message: 'failed' }),
    );
    component.disconnectBluetoothDevice();
    expect(component.errMsg).toBe('failed');
    iot.disconnectBluetoothDevice.and.returnValue(throwingObs());
    component.disconnectBluetoothDevice();
    expect(component.spinner).toBeFalse();
  });

  it('pairs an external device and sets pair status', () => {
    const item: any = { pairAPI: '/pair', pairStatus: 'NP' };
    component.pairDevice(item);
    expect(iot.pairExternalDevice).toHaveBeenCalledWith('/pair');
    expect(item.pairStatus).toBe('PC');
    iot.pairExternalDevice.and.returnValue(throwingObs());
    component.pairDevice(item);
    expect(item.pairStatus).toBe('R');
  });
});
