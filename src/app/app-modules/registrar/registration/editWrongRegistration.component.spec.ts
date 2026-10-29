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
} from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import { RegistrationComponent } from './registration.component';
import { RegistrarService } from '../shared/services/registrar.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';

/**
 * Edit mode where the beneficiary data in the service is missing or belongs
 * to a different beneficiary than the one in the route: the component must
 * redirect back to search.
 */
describe('RegistrationComponent (edit with wrong/missing beneficiary)', () => {
  let fixture: ComponentFixture<RegistrationComponent>;
  let component: RegistrationComponent;
  let registrar: any;
  let confirmation: any;
  let router: Router;

  async function setup(editData: any) {
    registrar = autoSpy(RegistrarService, {
      registrationMasterDetails$: new BehaviorSubject<any>(null),
      beneficiaryEditDetails$: new BehaviorSubject<any>(editData),
      healthIdMobVerificationCheck$: new BehaviorSubject<any>(null),
    });
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [RegistrationComponent],
      providers: [
        ...commonTestProviders(),
        { provide: RegistrarService, useValue: registrar },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: { beneficiaryID: '100' } } },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(RegistrationComponent);
    component = fixture.componentInstance;
    const children: Record<string, any> = {
      otherDetails: {
        resetForm: () => undefined,
        setcheckBoxEnabledByDefault: () => undefined,
      },
      demographicDetails: { setDemographicDefaults: () => undefined },
      personalDetails: { setPhoneSelectionEnabledByDefault: () => undefined },
    };
    Object.keys(children).forEach((k) =>
      Object.defineProperty(component, k, {
        get: () => children[k],
        set: () => undefined,
        configurable: true,
      }),
    );
    confirmation = TestBed.inject(ConfirmationService);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  }

  describe('with no beneficiary data', () => {
    beforeEach(async () => setup(null));

    it('redirects to search and alerts', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(component.patientRevisit).toBeTrue();
      expect(component.revisitData).toBeUndefined();
      expect(router.navigate).toHaveBeenCalledWith(['/registrar/search/']);
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.issueInFetchDetails,
        'info',
      );
    }));

    it('accepts later matching data and never opens the consent dialog', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      registrar.beneficiaryEditDetails$.next({
        beneficiaryID: '100',
        firstName: 'X',
      });
      expect(component.revisitData).toEqual({
        beneficiaryID: '100',
        firstName: 'X',
      });
      expect((TestBed.inject(MatDialog) as any).open).not.toHaveBeenCalled();
    }));
  });

  describe('with data for another beneficiary', () => {
    beforeEach(async () => setup({ beneficiaryID: '999' }));

    it('redirects to search', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(component.revisitData).toBeUndefined();
      expect(router.navigate).toHaveBeenCalledWith(['/registrar/search/']);
    }));
  });
});
