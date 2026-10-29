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
  throwingObs,
} from 'src/testing/test-utils';
import { TcSpecialistFutureWorklistComponent } from './tc-specialist-future-worklist.component';
import { BeneficiaryDetailsService } from '../../core/services/beneficiary-details.service';
import { CameraService } from '../../core/services/camera.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { DoctorService, MasterdataService } from '../shared/services';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

describe('TcSpecialistFutureWorklistComponent', () => {
  let component: TcSpecialistFutureWorklistComponent;
  let fixture: ComponentFixture<TcSpecialistFutureWorklistComponent>;
  let doctorService: any;
  let benService: any;
  let masterService: any;
  let camera: any;
  let confirm: any;
  let session: any;
  const info = LANGUAGE_EN.alerts.info;
  const ben = {
    benFlowID: 11,
    beneficiaryRegID: 22,
    visitCode: 55,
    tCSpecialistUserID: 77,
    benName: 'Ravi',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [TcSpecialistFutureWorklistComponent],
      providers: [
        ...commonTestProviders({ session: { userName: 'spec1' } }),
        { provide: DoctorService, useValue: autoSpy(DoctorService) },
        { provide: MasterdataService, useValue: autoSpy(MasterdataService) },
        {
          provide: BeneficiaryDetailsService,
          useValue: autoSpy(BeneficiaryDetailsService),
        },
        { provide: CameraService, useValue: autoSpy(CameraService) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TcSpecialistFutureWorklistComponent);
    component = fixture.componentInstance;
    doctorService = TestBed.inject(DoctorService);
    benService = TestBed.inject(BeneficiaryDetailsService);
    masterService = TestBed.inject(MasterdataService);
    camera = TestBed.inject(CameraService);
    confirm = TestBed.inject(ConfirmationService);
    session = TestBed.inject(SessionStorageService);
    doctorService.getSpecialistFutureWorklist.and.returnValue(
      of({ statusCode: 200, data: [{ ...ben, visitDate: '2024-03-04' }] }),
    );
  });

  it('renders and loads the worklist on init', () => {
    fixture.detectChanges();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(session.setItem).toHaveBeenCalledWith('currentRole', 'Doctor');
    ['visitCode', 'benFlowID', 'pharmacist_flag'].forEach((k) =>
      expect(session.removeItem).toHaveBeenCalledWith(k),
    );
    expect(benService.reset).toHaveBeenCalled();
    expect(masterService.reset).toHaveBeenCalled();
    const row = component.dataSource.data[0];
    expect(row.sno).toBe(1);
    expect(row.statusCode).toBe(1);
    // alerts.info.scheduleForConsultation is missing from the language file, so the status
    // message falls back to the 'Not Available' default.
    expect(info.scheduleForConsultation).toBeUndefined();
    expect(row.statusMessage).toBe('Not Available');
    expect(row.visitDate).toContain('04-03-2024');
    expect(row.villageName).toBe('Not Available');
  });

  it('ngOnDestroy removes current role', () => {
    component.ngOnDestroy();
    expect(session.removeItem).toHaveBeenCalledWith('currentRole');
  });

  it('alerts on non-200 response', () => {
    doctorService.getSpecialistFutureWorklist.and.returnValue(
      of({ statusCode: 5000, errorMessage: 'bad' }),
    );
    component.loadWorklist();
    expect(confirm.alert).toHaveBeenCalledWith('bad', 'error');
  });

  it('alerts on error', () => {
    doctorService.getSpecialistFutureWorklist.and.returnValue(throwingObs('e'));
    component.loadWorklist();
    expect(confirm.alert).toHaveBeenCalledWith('e', 'error');
  });

  describe('filterBeneficiaryList', () => {
    beforeEach(() => {
      component.beneficiaryList = [
        { benName: 'Ravi', x: 'sita' },
        { benName: 'Sita' },
      ];
    });
    it('resets on empty term and goes to page 1', () => {
      component.filterBeneficiaryList('');
      expect(component.filteredBeneficiaryList.length).toBe(2);
      expect(component.activePage).toBe(1);
      expect(component.currentPage).toBe(1);
      expect(component.pagedList.length).toBe(2);
    });
    it('filters by searchable keys only', () => {
      component.filterBeneficiaryList('sita');
      expect(component.filteredBeneficiaryList).toEqual([
        { benName: 'Sita', sno: 1 },
      ]);
      expect(component.dataSource.data.length).toBe(1);
    });
  });

  describe('patientImageView', () => {
    beforeEach(() => (component.currentLanguageSet = LANGUAGE_EN));
    it('views image', () => {
      benService.getBeneficiaryImage.and.returnValue(of({ benImage: 'img' }));
      component.patientImageView(5);
      expect(benService.getBeneficiaryImage).toHaveBeenCalledWith(5);
      expect(camera.viewImage).toHaveBeenCalledWith('img');
    });
    it('alerts when missing', () => {
      benService.getBeneficiaryImage.and.returnValue(of({}));
      component.patientImageView(5);
      expect(confirm.alert).toHaveBeenCalledWith(info.imageNotFound);
    });
  });

  it('getBeneficiryStatus alerts the message', () => {
    component.getBeneficiryStatus({ statusMessage: 'm' });
    expect(confirm.alert).toHaveBeenCalledWith('m');
  });

  describe('cancelTCRequest', () => {
    beforeEach(() => {
      component.currentLanguageSet = LANGUAGE_EN;
      spyOn(component, 'loadWorklist');
    });
    it('cancels and reloads on success', () => {
      doctorService.cancelBeneficiaryTCRequest.and.returnValue(
        of({ statusCode: 200, data: { response: 'ok' } }),
      );
      component.cancelTCRequest(ben);
      expect(doctorService.cancelBeneficiaryTCRequest).toHaveBeenCalledWith({
        benflowID: 11,
        benRegID: 22,
        visitCode: 55,
        userID: 77,
        modifiedBy: 'spec1',
      });
      expect(confirm.alert).toHaveBeenCalledWith('ok', 'success');
      expect(component.loadWorklist).toHaveBeenCalled();
    });
    it('alerts on failure response', () => {
      doctorService.cancelBeneficiaryTCRequest.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'no' }),
      );
      component.cancelTCRequest(ben);
      expect(confirm.alert).toHaveBeenCalledWith('no', 'error');
    });
    it('alerts on error', () => {
      doctorService.cancelBeneficiaryTCRequest.and.returnValue(
        throwingObs('x'),
      );
      component.cancelTCRequest(ben);
      expect(confirm.alert).toHaveBeenCalledWith('x', 'error');
    });
    it('does nothing when declined', () => {
      confirm.confirm.and.returnValue(of(false));
      component.cancelTCRequest(ben);
      expect(doctorService.cancelBeneficiaryTCRequest).not.toHaveBeenCalled();
    });
  });
});
