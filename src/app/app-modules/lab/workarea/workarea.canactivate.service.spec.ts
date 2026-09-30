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
import { RouterTestingModule } from '@angular/router/testing';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { createSessionStorageMock } from 'src/testing/test-utils';
import { WorkareaCanActivate } from './workarea.canactivate.service';

describe('Lab WorkareaCanActivate', () => {
  const keys = [
    'visitCode',
    'benFlowID',
    'visitCategory',
    'beneficiaryRegID',
    'visitID',
    'beneficiaryID',
    'doctorFlag',
    'nurseFlag',
  ];
  let guard: WorkareaCanActivate;
  let session: any;

  beforeEach(() => {
    session = createSessionStorageMock(
      Object.fromEntries(keys.map((k) => [k, 'x'])),
    );
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        WorkareaCanActivate,
        { provide: SessionStorageService, useValue: session },
      ],
    });
    guard = TestBed.inject(WorkareaCanActivate);
  });

  it('allows when all visit keys present', () => {
    expect(guard.canActivate({} as any, {} as any)).toBeTrue();
  });

  keys.forEach((k) => {
    it(`blocks when ${k} missing`, () => {
      session.store.delete(k);
      expect(guard.canActivate({} as any, {} as any)).toBeFalse();
    });
  });
});
