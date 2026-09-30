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
import { FormControl, FormGroup } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

import { CovidDiagnosisComponent } from './covid-diagnosis.component';
import { DoctorService } from '../../../../shared/services';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('CovidDiagnosisComponent', () => {
  let component: CovidDiagnosisComponent;
  let fixture: ComponentFixture<CovidDiagnosisComponent>;
  let caseRecord$: BehaviorSubject<any>;
  let session: any;

  beforeEach(async () => {
    caseRecord$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [CovidDiagnosisComponent],
      providers: [
        ...commonTestProviders(),
        {
          provide: DoctorService,
          useValue: autoSpy(DoctorService, {
            populateCaserecordResponse$: caseRecord$.asObservable(),
          }),
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(CovidDiagnosisComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(CovidDiagnosisComponent);
    component = fixture.componentInstance;
    session = TestBed.inject(SessionStorageService) as any;
    component.generalDiagnosisForm = new FormGroup({
      doctorDiagnosis: new FormControl(null),
      specialistDiagnosis: new FormControl(null),
    });
  });

  it('enables doctor diagnosis for a non-specialist', () => {
    session.setItem('designation', 'Doctor');
    fixture.detectChanges();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
    expect(component.specialist).toBeFalse();
    expect(component.doctorDaignosis?.enabled).toBeTrue();
    expect(component.specialistDaignosis?.disabled).toBeTrue();
  });

  it('enables specialist diagnosis for TC Specialist', () => {
    session.setItem('designation', 'TC Specialist');
    fixture.detectChanges();
    expect(component.specialist).toBeTrue();
    expect(component.doctorDaignosis?.disabled).toBeTrue();
    expect(component.specialistDaignosis?.enabled).toBeTrue();
  });

  it('refreshes language on ngDoCheck', () => {
    fixture.detectChanges();
    component.current_language_set = null;
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  it('patches diagnosis in view mode', () => {
    fixture.detectChanges();
    component.caseRecordMode = 'view';
    component.ngOnChanges();
    caseRecord$.next({
      statusCode: 200,
      data: {
        diagnosis: { doctorDiagnonsis: 'Covid', specialistDiagnosis: 'S' },
      },
    });
    expect(component.generalDiagnosisForm.get('doctorDiagnosis')?.value).toBe(
      'Covid',
    );
    expect(
      component.generalDiagnosisForm.get('specialistDiagnosis')?.value,
    ).toBe('S');
  });

  it('ignores responses without diagnosis', () => {
    component.caseRecordMode = 'view';
    component.ngOnChanges();
    caseRecord$.next({ statusCode: 200, data: {} });
    expect(component.generalDiagnosisForm.value.doctorDiagnosis).toBeNull();
  });

  it('does not subscribe outside view mode and unsubscribes on destroy', () => {
    component.caseRecordMode = 'edit';
    component.ngOnChanges();
    expect(component.diagnosisSubscription).toBeUndefined();
    component.ngOnDestroy();
    component.caseRecordMode = 'view';
    component.ngOnChanges();
    const sub = component.diagnosisSubscription;
    component.ngOnDestroy();
    expect(sub.closed).toBeTrue();
  });
});
