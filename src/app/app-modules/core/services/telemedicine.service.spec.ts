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
import { TelemedicineService } from './telemedicine.service';
import { ConfirmationService } from './confirmation.service';
import { commonTestProviders } from 'src/testing/test-utils';

describe('TelemedicineService', () => {
  let service: TelemedicineService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [...commonTestProviders(), TelemedicineService],
    });
    service = TestBed.inject(TelemedicineService);
  });

  afterEach(() => {
    sessionStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('key');
  });

  it('getAuthKey returns null when not authenticated', () => {
    sessionStorage.setItem('key', 'k');
    expect(service.getAuthKey()).toBeNull();
    sessionStorage.setItem('isAuthenticated', 'true');
    expect(service.getAuthKey()).toBe('k');
  });

  it('getProtocol / getHost', () => {
    expect(service.getProtocol()).toBe(document.location.protocol);
    expect(service.getHost()).toBe(
      `${document.location.host}${document.location.pathname}`,
    );
  });

  it('routeToTeleMedecine does nothing without auth key', () => {
    service.routeToTeleMedecine();
    expect(service.telemedicineUrl).toBeUndefined();
    expect(TestBed.inject(ConfirmationService)).toBeTruthy();
  });

  it('routeToTeleMedecine builds url and redirects', () => {
    const originalUrl = environment.TELEMEDICINE_URL;
    const originalHref = window.location.href;
    const base = originalHref.split('#')[0];
    (environment as any).TELEMEDICINE_URL = base + '#tm-test?';
    sessionStorage.setItem('isAuthenticated', 'true');
    sessionStorage.setItem('key', 'KK');
    try {
      service.routeToTeleMedecine();
      expect(service.telemedicineUrl).toBe(
        `${base}#tm-test?protocol=${document.location.protocol}&host=${document.location.host}${document.location.pathname}&user=KK&app=${environment.app}&fallback=${environment.fallbackMMUUrl}&back=${environment.redirInMMUUrl}`,
      );
      expect(window.location.hash).toContain('tm-test');
    } finally {
      (environment as any).TELEMEDICINE_URL = originalUrl;
      history.replaceState(null, '', originalHref);
    }
  });
});
