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
import { environment } from 'src/environments/environment';
import { InventoryService } from './inventory.service';
import { ConfirmationService } from './confirmation.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { commonTestProviders, LANGUAGE_EN } from 'src/testing/test-utils';

describe('InventoryService', () => {
  let service: InventoryService;
  let session: any;
  let confirmation: any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [...commonTestProviders(), InventoryService],
    });
    service = TestBed.inject(InventoryService);
    session = TestBed.inject(SessionStorageService);
    confirmation = TestBed.inject(ConfirmationService);
  });

  afterEach(() => {
    sessionStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('key');
  });

  it('subscribes to language set', () => {
    expect(service.current_language_set).toBe(LANGUAGE_EN);
  });

  it('getAuthKey returns key only when authenticated', () => {
    sessionStorage.setItem('key', 'k1');
    expect(service.getAuthKey()).toBeUndefined();
    sessionStorage.setItem('isAuthenticated', 'true');
    expect(service.getAuthKey()).toBe('k1');
  });

  it('getFacilityID / getVanID', () => {
    expect(service.getFacilityID()).toBeUndefined();
    session.setItem('facilityID', '12');
    expect(service.getFacilityID()).toBe('12');
    expect(service.getVanID()).toBe('12');
  });

  it('getProtocol / getHost read from document', () => {
    expect(service.getProtocol()).toBe(document.location.protocol);
    expect(service.getHost()).toBe(
      `${document.location.host}${document.location.pathname}`,
    );
  });

  it('getppID parses serviceLineDetails', () => {
    expect(service.getppID()).toBeUndefined();
    session.setItem(
      'serviceLineDetails',
      JSON.stringify({ parkingPlaceID: 44 }),
    );
    expect(service.getppID()).toBe(44);
  });

  it('getServiceDetails / getParentAPI', () => {
    session.setItem('serviceName', 'HWC');
    expect(service.getServiceDetails()).toBe('HWC');
    expect(service.getParentAPI()).toBe(environment.parentAPI);
  });

  it('moveToInventory alerts when facility mapping missing', () => {
    service.moveToInventory(1, 2, 3, 4, 'en', 'h');
    expect(confirmation.alert).toHaveBeenCalledWith(
      LANGUAGE_EN.alerts.info.noFacilityMapper,
      'error',
    );
    expect(service.inventoryUrl).toBeUndefined();
  });

  it('moveToInventory builds url and redirects when all present', () => {
    // Redirect to a same-document fragment so the browser never reloads.
    const originalUrl = environment.INVENTORY_URL;
    const originalHref = window.location.href;
    (environment as any).INVENTORY_URL =
      originalHref.split('#')[0] + '#inventory-test?';
    sessionStorage.setItem('isAuthenticated', 'true');
    sessionStorage.setItem('key', 'KEY');
    session.setItem('facilityID', 'F1');
    session.setItem('serviceName', 'HWC');
    session.setItem(
      'serviceLineDetails',
      JSON.stringify({ parkingPlaceID: 'P1' }),
    );
    try {
      service.moveToInventory('B', 'V', 'FL', 'R', 'en', 'HID');
      const url: string = service.inventoryUrl;
      expect(url).toContain(
        `#inventory-test?protocol=${document.location.protocol}&host=${document.location.host}${document.location.pathname}`,
      );
      expect(url).toContain('&user=KEY');
      expect(url).toContain(`&app=${environment.app}`);
      expect(url).toContain('&facility=F1&ben=B&visit=V&flow=FL&reg=R');
      expect(url).toContain('&facilityID=F1&ppID=P1&serviceName=HWC');
      expect(url).toContain('&currentLanguage=en&healthID=HID');
      expect(window.location.hash).toContain('inventory-test');
      expect(confirmation.alert).not.toHaveBeenCalled();
    } finally {
      (environment as any).INVENTORY_URL = originalUrl;
      history.replaceState(null, '', originalHref);
    }
  });
});
