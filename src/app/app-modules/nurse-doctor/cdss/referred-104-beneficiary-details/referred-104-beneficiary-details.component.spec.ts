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
import { of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';
import { BeneficiaryDetailsService } from 'src/app/app-modules/core/services';
import { RegistrarService } from 'src/app/app-modules/registrar/shared/services/registrar.service';
import { Referred104BeneficiaryDetailsComponent } from './referred-104-beneficiary-details.component';

describe('Referred104BeneficiaryDetailsComponent', () => {
  let component: Referred104BeneficiaryDetailsComponent;
  let fixture: ComponentFixture<Referred104BeneficiaryDetailsComponent>;
  let registrar: any;
  let benSvc: any;

  beforeEach(async () => {
    registrar = autoSpy(RegistrarService);
    registrar.identityQuickSearch.and.returnValue(
      of([
        {
          firstName: 'Asha',
          lastName: 'K',
          createdDate: '2024-01-02T10:30:00Z',
        },
      ]),
    );
    benSvc = autoSpy(BeneficiaryDetailsService);
    benSvc.getBeneficiaryImage.and.returnValue(of({ benImage: 'img' }));
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [Referred104BeneficiaryDetailsComponent],
      providers: [
        ...commonTestProviders({
          session: { beneficiaryID: 'B1', beneficiaryRegID: 77 },
        }),
        { provide: RegistrarService, useValue: registrar },
        { provide: BeneficiaryDetailsService, useValue: benSvc },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(Referred104BeneficiaryDetailsComponent, '')
      .compileComponents();
    fixture = TestBed.createComponent(Referred104BeneficiaryDetailsComponent);
    component = fixture.componentInstance;
  });

  it('loads beneficiary by ID, formats name/date and attaches image', () => {
    fixture.detectChanges();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
    expect(component.today instanceof Date).toBeTrue();
    expect(registrar.identityQuickSearch).toHaveBeenCalledWith({
      beneficiaryRegID: null,
      beneficiaryName: null,
      beneficiaryID: 'B1',
      phoneNo: null,
      HealthID: null,
      HealthIDNumber: null,
      familyId: null,
      identity: null,
    });
    expect(component.beneficiaryName).toBe('Asha K');
    expect(component.regDate).toBe('02-01-2024 10:30 AM');
    expect(benSvc.getBeneficiaryImage).toHaveBeenCalledWith(77);
    expect(component.beneficiary.benImage).toBe('img');
  });

  it('omits last name when undefined and skips missing image', () => {
    registrar.identityQuickSearch.and.returnValue(of([{ firstName: 'Ravi' }]));
    benSvc.getBeneficiaryImage.and.returnValue(of({}));
    fixture.detectChanges();
    expect(component.beneficiaryName).toBe('Ravi');
    expect(component.beneficiary.benImage).toBeUndefined();
  });

  it('ignores empty search response', () => {
    registrar.identityQuickSearch.and.returnValue(of(null));
    benSvc.getBeneficiaryImage.and.returnValue(of(null));
    fixture.detectChanges();
    expect(component.beneficiary).toBeUndefined();
    expect(component.beneficiaryName).toBeUndefined();
  });

  it('ngDoCheck re-assigns language', () => {
    fixture.detectChanges();
    component.current_language_set = null;
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });
});
