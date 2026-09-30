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
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { autoSpy, createSessionStorageMock } from 'src/testing/test-utils';
import { ServicePointService } from './service-point.service';
import { ServicePointResolve } from './service-point-resolve.service';

describe('ServicePointResolve', () => {
  let resolver: ServicePointResolve;
  let sps: any;
  let router: Router;

  beforeEach(() => {
    sps = autoSpy(ServicePointService);
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        ServicePointResolve,
        { provide: ServicePointService, useValue: sps },
        {
          provide: SessionStorageService,
          useValue: createSessionStorageMock({
            providerServiceID: 11,
            userID: 42,
          }),
        },
      ],
    });
    resolver = TestBed.inject(ServicePointResolve);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
  });

  it('resolves the service points for the stored user and provider', () => {
    const payload = { statusCode: 200, data: { UserVanSpDetails: [] } };
    sps.getServicePoints.and.returnValue(of(payload));
    let result: any;
    resolver.resolve({} as any).subscribe((r) => (result = r));
    expect(sps.getServicePoints).toHaveBeenCalledWith(42, 11);
    expect(result).toBe(payload);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('navigates to /service and resolves null for an empty response', () => {
    sps.getServicePoints.and.returnValue(of(null));
    let result: any = 'unset';
    resolver.resolve({} as any).subscribe((r) => (result = r));
    expect(result).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/service']);
  });
});
