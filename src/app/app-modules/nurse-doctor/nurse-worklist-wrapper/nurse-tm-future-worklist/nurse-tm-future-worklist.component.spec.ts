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
import { NurseTmFutureWorklistComponent } from './nurse-tm-future-worklist.component';
import { DoctorService, NurseService } from '../../shared/services';
import { CameraService } from '../../../core/services/camera.service';
import { BeneficiaryDetailsService } from '../../../core/services/beneficiary-details.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { SchedulerComponent } from '../../scheduler/scheduler.component';

describe('NurseTmFutureWorklistComponent', () => {
  let component: NurseTmFutureWorklistComponent;
  let fixture: ComponentFixture<NurseTmFutureWorklistComponent>;
  let nurseService: any;
  let doctorService: any;
  let benService: any;
  let camera: any;
  let confirm: any;
  let session: any;
  let dialog: any;
  const info = LANGUAGE_EN.alerts.info;

  const makeBen = (over: any = {}) => ({
    benFlowID: 11,
    beneficiaryRegID: 22,
    benVisitID: 44,
    visitCode: 55,
    vanID: 66,
    tCSpecialistUserID: 77,
    tCRequestDate: '2024-02-04T11:30:00',
    ...over,
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [NurseTmFutureWorklistComponent],
      providers: [
        ...commonTestProviders({
          session: { userName: 'nurse1', providerServiceID: 9 },
        }),
        { provide: NurseService, useValue: autoSpy(NurseService) },
        { provide: DoctorService, useValue: autoSpy(DoctorService) },
        {
          provide: BeneficiaryDetailsService,
          useValue: autoSpy(BeneficiaryDetailsService),
        },
        { provide: CameraService, useValue: autoSpy(CameraService) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(NurseTmFutureWorklistComponent);
    component = fixture.componentInstance;
    nurseService = TestBed.inject(NurseService);
    doctorService = TestBed.inject(DoctorService);
    benService = TestBed.inject(BeneficiaryDetailsService);
    camera = TestBed.inject(CameraService);
    confirm = TestBed.inject(ConfirmationService);
    session = TestBed.inject(SessionStorageService);
    dialog = TestBed.inject(MatDialog);
    spyOn(console, 'log');
    nurseService.getNurseTMFutureWorklist.and.returnValue(
      of({ statusCode: 200, data: [makeBen(), makeBen({ benFlowID: 12 })] }),
    );
  });

  describe('initialisation', () => {
    it('sets role, clears visit data and loads the future worklist', () => {
      fixture.detectChanges();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(session.setItem).toHaveBeenCalledWith('currentRole', 'Nurse');
      [
        'visitCode',
        'beneficiaryGender',
        'visitID',
        'doctorFlag',
        'pharmacist_flag',
      ].forEach((k) => expect(session.removeItem).toHaveBeenCalledWith(k));
      expect(nurseService.getNurseTMFutureWorklist).toHaveBeenCalled();
      expect(benService.reset).toHaveBeenCalled();
      expect(component.beneficiaryList.length).toBe(2);
      component.beneficiaryList.forEach((b: any) => {
        expect(b.statusCode).toBe(1);
        expect(b.statusMessage).toBe('Scheduled for TC');
      });
      expect(component.beneficiaryList.map((b: any) => b.sno)).toEqual([1, 2]);
      expect(component.filterTerm).toBeNull();
      // production resets the table data after a successful load
      expect(component.dataSource.data).toEqual([]);
    });

    it('ngOnDestroy removes current role', () => {
      component.ngOnDestroy();
      expect(session.removeItem).toHaveBeenCalledWith('currentRole');
    });

    it('ngDoCheck refreshes language', () => {
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });
  });

  describe('getNurseTMFutureWorklist', () => {
    it('alerts on non-200 response', () => {
      nurseService.getNurseTMFutureWorklist.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'bad' }),
      );
      component.getNurseTMFutureWorklist();
      expect(confirm.alert).toHaveBeenCalledWith('bad', 'error');
      expect(component.beneficiaryList).toBeUndefined();
    });
    it('alerts on error', () => {
      nurseService.getNurseTMFutureWorklist.and.returnValue(
        throwingObs('boom'),
      );
      component.getNurseTMFutureWorklist();
      expect(confirm.alert).toHaveBeenCalledWith('boom', 'error');
    });
  });

  it('loadDataToBenList fills defaults and formats TC date', () => {
    const [b] = component.loadDataToBenList([makeBen({ fatherName: 'Mohan' })]);
    expect(b.fatherName).toBe('Mohan');
    [
      'genderName',
      'age',
      'benVisitNo',
      'districtName',
      'villageName',
      'preferredPhoneNum',
    ].forEach((k) => expect(b[k]).toBe('Not Available'));
    expect(b.tCRequestDate).toBe('04-02-2024 11:30 AM ');
  });

  it('pageChanged slices the filtered list', () => {
    component.filteredBeneficiaryList = [1, 2, 3, 4, 5, 6];
    component.pageChanged({ page: 2, itemsPerPage: 5 });
    expect(component.pagedList).toEqual([6]);
  });

  it('getBeneficiryStatus alerts status message', () => {
    component.getBeneficiryStatus({ statusMessage: 'Scheduled for TC' });
    expect(confirm.alert).toHaveBeenCalledWith('Scheduled for TC');
  });

  it('getVisitStatus always reports scheduled', () => {
    expect(component.getVisitStatus({})).toEqual({
      statusCode: 1,
      statusMessage: 'Scheduled for TC',
    });
  });

  describe('patientImageView', () => {
    beforeEach(() => (component.currentLanguageSet = LANGUAGE_EN));
    it('shows image when available', () => {
      benService.getBeneficiaryImage.and.returnValue(of({ benImage: 'img' }));
      component.patientImageView(22);
      expect(camera.viewImage).toHaveBeenCalledWith('img');
    });
    it('alerts when image missing', () => {
      benService.getBeneficiaryImage.and.returnValue(of(null));
      component.patientImageView(22);
      expect(confirm.alert).toHaveBeenCalledWith(info.imageNotFound);
    });
  });

  describe('cancelTCRequest', () => {
    beforeEach(() => {
      component.currentLanguageSet = LANGUAGE_EN;
      spyOn(component, 'getNurseTMFutureWorklist');
    });
    it('cancels and reloads on success', () => {
      doctorService.cancelBeneficiaryTCRequest.and.returnValue(
        of({ statusCode: 200, data: { response: 'cancelled' } }),
      );
      component.cancelTCRequest(makeBen());
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
        modifiedBy: 'nurse1',
      });
      expect(confirm.alert).toHaveBeenCalledWith('cancelled', 'success');
      expect(component.getNurseTMFutureWorklist).toHaveBeenCalled();
    });
    it('alerts on failure response', () => {
      doctorService.cancelBeneficiaryTCRequest.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'no' }),
      );
      component.cancelTCRequest(makeBen());
      expect(confirm.alert).toHaveBeenCalledWith('no', 'error');
      expect(component.getNurseTMFutureWorklist).not.toHaveBeenCalled();
    });
    it('alerts on error', () => {
      doctorService.cancelBeneficiaryTCRequest.and.returnValue(
        throwingObs('e'),
      );
      component.cancelTCRequest(makeBen());
      expect(confirm.alert).toHaveBeenCalledWith('e', 'error');
    });
    it('does nothing when declined', () => {
      confirm.confirm.and.returnValue(of(false));
      component.cancelTCRequest(makeBen());
      expect(doctorService.cancelBeneficiaryTCRequest).not.toHaveBeenCalled();
    });
  });

  describe('rescheduling', () => {
    beforeEach(() => {
      component.currentLanguageSet = LANGUAGE_EN;
      spyOn(component, 'getNurseTMFutureWorklist');
    });
    it('reSchedule opens scheduler and schedules the chosen slot', () => {
      dialog.open.and.returnValue({
        afterClosed: () => of({ tmSlot: 'slot' }),
      });
      component.reSchedule(makeBen());
      expect(dialog.open).toHaveBeenCalledWith(SchedulerComponent, {});
      expect(doctorService.scheduleTC).toHaveBeenCalledWith({
        benFlowID: 11,
        beneficiaryRegID: 22,
        benVisitID: 44,
        visitCode: 55,
        vanID: 66,
        providerServiceMapID: 9,
        createdBy: 'nurse1',
        tcRequest: 'slot',
      });
      expect(confirm.alert).toHaveBeenCalledWith(
        info.beneficiaryDetails,
        'success',
      );
      expect(component.getNurseTMFutureWorklist).toHaveBeenCalled();
    });
    it('does not schedule when dialog dismissed', () => {
      dialog.open.and.returnValue({ afterClosed: () => of(null) });
      component.openScheduler(makeBen());
      expect(doctorService.scheduleTC).not.toHaveBeenCalled();
    });
    it('alerts on schedule failure', () => {
      doctorService.scheduleTC.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'f' }),
      );
      component.scheduleTC(makeBen(), {});
      expect(confirm.alert).toHaveBeenCalledWith('f', 'error');
      expect(component.getNurseTMFutureWorklist).not.toHaveBeenCalled();
    });
    it('alerts on schedule error', () => {
      doctorService.scheduleTC.and.returnValue(throwingObs('g'));
      component.scheduleTC(makeBen(), {});
      expect(confirm.alert).toHaveBeenCalledWith('g', 'error');
    });
  });

  describe('filterBeneficiaryList', () => {
    beforeEach(() => {
      component.beneficiaryList = [
        {
          beneficiaryID: 'ABC1',
          districtName: 'Pune',
          benVisitNo: 1,
          tCRequestDate: 'zzz',
        },
        { beneficiaryID: 'XYZ9', preferredPhoneNum: '98765', benVisitNo: 4 },
      ];
    });
    it('restores the full list for an empty term', () => {
      component.filterBeneficiaryList('');
      expect(component.dataSource.data.map((b: any) => b.sno)).toEqual([1, 2]);
    });
    it('matches searchable keys', () => {
      component.filterBeneficiaryList('987');
      expect(
        component.filteredBeneficiaryList.map((b: any) => b.beneficiaryID),
      ).toEqual(['XYZ9']);
      expect(component.dataSource.data[0].sno).toBe(1);
    });
    it('matches first visit', () => {
      component.filterBeneficiaryList('first');
      expect(
        component.filteredBeneficiaryList.map((b: any) => b.beneficiaryID),
      ).toEqual(['ABC1']);
    });
    it('matches revisit', () => {
      component.filterBeneficiaryList('REVISIT');
      expect(
        component.filteredBeneficiaryList.map((b: any) => b.beneficiaryID),
      ).toEqual(['XYZ9']);
    });
    it('ignores non-searchable keys', () => {
      component.filterBeneficiaryList('zzz');
      expect(component.filteredBeneficiaryList).toEqual([]);
    });
  });
});
