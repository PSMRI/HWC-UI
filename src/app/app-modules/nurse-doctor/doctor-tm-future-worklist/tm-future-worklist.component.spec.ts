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
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';
import { TmFutureWorklistComponent } from './tm-future-worklist.component';
import { BeneficiaryDetailsService } from '../../core/services/beneficiary-details.service';
import { CameraService } from '../../core/services/camera.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { DoctorService } from '../shared/services';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { SchedulerComponent } from '../scheduler/scheduler.component';

describe('TmFutureWorklistComponent', () => {
  let component: TmFutureWorklistComponent;
  let fixture: ComponentFixture<TmFutureWorklistComponent>;
  let doctorService: any;
  let benService: any;
  let camera: any;
  let confirm: any;
  let session: any;
  let dialog: any;
  const info = LANGUAGE_EN.alerts.info;

  const ben = {
    benFlowID: 11,
    beneficiaryRegID: 22,
    benVisitID: 44,
    visitCode: 55,
    vanID: 66,
    tCSpecialistUserID: 77,
    benName: 'Ravi',
    beneficiaryID: 'B1',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [TmFutureWorklistComponent],
      providers: [
        ...commonTestProviders({
          session: { userName: 'doc1', providerServiceID: 9 },
        }),
        { provide: DoctorService, useValue: autoSpy(DoctorService) },
        {
          provide: BeneficiaryDetailsService,
          useValue: autoSpy(BeneficiaryDetailsService),
        },
        { provide: CameraService, useValue: autoSpy(CameraService) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TmFutureWorklistComponent);
    component = fixture.componentInstance;
    doctorService = TestBed.inject(DoctorService);
    benService = TestBed.inject(BeneficiaryDetailsService);
    camera = TestBed.inject(CameraService);
    confirm = TestBed.inject(ConfirmationService);
    session = TestBed.inject(SessionStorageService);
    dialog = TestBed.inject(MatDialog);
    doctorService.getDoctorFutureWorklist.and.returnValue(
      of({ statusCode: 200, data: [{ ...ben, tCRequestDate: '2024-05-06' }] }),
    );
    // loadWorklist runs before assignSelectedLanguage in ngOnInit, so seed it.
    component.current_language_set = LANGUAGE_EN;
  });

  it('renders and loads the future worklist on init', () => {
    fixture.detectChanges();
    expect(session.setItem).toHaveBeenCalledWith('currentRole', 'Doctor');
    expect(doctorService.getDoctorFutureWorklist).toHaveBeenCalled();
    const row = component.dataSource.data[0];
    expect(row.sno).toBe(1);
    expect(row.statusCode).toBe(1);
    // alerts.info.scheduledTC is missing from the language file, so the status
    // message falls back to the 'Not Available' default.
    expect(info.scheduledTC).toBeUndefined();
    expect(row.statusMessage).toBe('Not Available');
    expect(row.genderName).toBe('Not Available');
    expect(row.tCRequestDate).toContain('06-05-2024');
    expect(component.filteredBeneficiaryList.length).toBe(1);
  });

  it('ngDoCheck refreshes language', () => {
    component.current_language_set = undefined;
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  it('ngOnDestroy removes current role', () => {
    component.ngOnDestroy();
    expect(session.removeItem).toHaveBeenCalledWith('currentRole');
  });

  it('alerts on non-200 worklist response', () => {
    doctorService.getDoctorFutureWorklist.and.returnValue(
      of({ statusCode: 5000, errorMessage: 'bad' }),
    );
    component.loadWorklist();
    expect(confirm.alert).toHaveBeenCalledWith('bad', 'error');
  });

  it('alerts on worklist error', () => {
    doctorService.getDoctorFutureWorklist.and.returnValue(throwingObs('e'));
    component.loadWorklist();
    expect(confirm.alert).toHaveBeenCalledWith('e', 'error');
  });

  it('pageChanged slices filtered list', () => {
    component.filteredBeneficiaryList = [1, 2, 3, 4, 5, 6];
    component.pageChanged({ page: 2, itemsPerPage: 5 });
    expect(component.pagedList).toEqual([6]);
  });

  describe('filterBeneficiaryList', () => {
    beforeEach(() => {
      component.beneficiaryList = [
        { benName: 'Ravi', other: 'sita' },
        { benName: 'Sita' },
      ];
    });
    it('resets for empty term', () => {
      component.filterBeneficiaryList('');
      expect(component.filteredBeneficiaryList.length).toBe(2);
    });
    it('matches only searchable keys', () => {
      component.filterBeneficiaryList('SITA');
      expect(component.filteredBeneficiaryList).toEqual([
        { benName: 'Sita', sno: 1 },
      ]);
    });
  });

  describe('patientImageView', () => {
    it('views image', () => {
      benService.getBeneficiaryImage.and.returnValue(of({ benImage: 'x' }));
      component.patientImageView(1);
      expect(camera.viewImage).toHaveBeenCalledWith('x');
    });
    it('alerts when no image', () => {
      benService.getBeneficiaryImage.and.returnValue(of(null));
      component.patientImageView(1);
      expect(confirm.alert).toHaveBeenCalledWith(info.imageNotFound);
    });
  });

  it('getBeneficiryStatus alerts the status message', () => {
    component.getBeneficiryStatus({ statusMessage: 'hello' });
    expect(confirm.alert).toHaveBeenCalledWith('hello');
  });

  describe('cancelTCRequest', () => {
    beforeEach(() => spyOn(component, 'loadWorklist'));
    it('cancels and reloads on success', () => {
      doctorService.cancelBeneficiaryTCRequest.and.returnValue(
        of({ statusCode: 200, data: { response: 'ok' } }),
      );
      component.cancelTCRequest(ben);
      expect(confirm.confirm).toHaveBeenCalledWith(
        'info',
        info.cancelReq,
        'Yes',
        'No',
      );
      expect(doctorService.cancelBeneficiaryTCRequest).toHaveBeenCalledWith({
        benflowID: 11,
        benRegID: 22,
        visitCode: 55,
        userID: 77,
        modifiedBy: 'doc1',
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

  describe('rescheduling', () => {
    beforeEach(() => spyOn(component, 'loadWorklist'));
    it('reSchedule opens scheduler and schedules the chosen slot', () => {
      dialog.open.and.returnValue({ afterClosed: () => of({ tmSlot: 's1' }) });
      component.reSchedule(ben);
      expect(dialog.open).toHaveBeenCalledWith(SchedulerComponent, {});
      expect(doctorService.scheduleTC).toHaveBeenCalledWith({
        benFlowID: 11,
        beneficiaryRegID: 22,
        benVisitID: 44,
        visitCode: 55,
        vanID: 66,
        providerServiceMapID: 9,
        createdBy: 'doc1',
        tcRequest: 's1',
      });
      expect(confirm.alert).toHaveBeenCalledWith(
        info.beneficiaryDetails,
        'success',
      );
      expect(component.loadWorklist).toHaveBeenCalled();
    });
    it('does not schedule when dialog dismissed', () => {
      dialog.open.and.returnValue({ afterClosed: () => of(null) });
      component.openScheduler(ben);
      expect(doctorService.scheduleTC).not.toHaveBeenCalled();
    });
    it('alerts on schedule failure', () => {
      doctorService.scheduleTC.and.returnValue(
        of({ statusCode: 400, errorMessage: 'f' }),
      );
      component.scheduleTC(ben, {});
      expect(confirm.alert).toHaveBeenCalledWith('f', 'error');
    });
    it('alerts on schedule error', () => {
      doctorService.scheduleTC.and.returnValue(throwingObs('g'));
      component.scheduleTC(ben, {});
      expect(confirm.alert).toHaveBeenCalledWith('g', 'error');
    });
  });
});
