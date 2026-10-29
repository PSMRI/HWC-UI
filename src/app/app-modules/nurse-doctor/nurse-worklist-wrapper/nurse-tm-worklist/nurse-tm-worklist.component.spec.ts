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
import { Router } from '@angular/router';
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
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { CameraService } from '../../../core/services/camera.service';
import { BeneficiaryDetailsService } from '../../../core/services/beneficiary-details.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { DoctorService, NurseService } from '../../shared/services';
import { SchedulerComponent } from '../../scheduler/scheduler.component';
import { NurseTmWorklistComponent } from './nurse-tm-worklist.component';

describe('NurseTmWorklistComponent', () => {
  let component: NurseTmWorklistComponent;
  let fixture: ComponentFixture<NurseTmWorklistComponent>;
  let nurse: any;
  let doctor: any;
  let benSvc: any;
  let camera: any;
  let confirm: any;
  let session: any;
  let dialog: any;
  let router: Router;

  const list = () => [
    {
      beneficiaryID: 'B1',
      benName: 'Asha',
      beneficiaryRegID: 1,
      benFlowID: 10,
      visitCode: 100,
      benVisitNo: 1,
      specialist_flag: 1,
      tCSpecialistUserID: 7,
      visitDate: '2024-01-02T10:00:00',
    },
    {
      beneficiaryID: 'B2',
      benName: 'Ravi',
      beneficiaryRegID: 2,
      benFlowID: 20,
      benVisitNo: 2,
      specialist_flag: 4,
    },
    { beneficiaryID: 'B3', benName: 'Kiran', specialist_flag: 9 },
    { beneficiaryID: 'B4', benName: 'Mani', specialist_flag: 0 },
  ];

  beforeEach(async () => {
    nurse = autoSpy(NurseService);
    nurse.getNurseTMWorklist.and.returnValue(
      of({ statusCode: 200, data: list() }),
    );
    doctor = autoSpy(DoctorService);
    benSvc = autoSpy(BeneficiaryDetailsService);
    camera = autoSpy(CameraService);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [NurseTmWorklistComponent],
      providers: [
        ...commonTestProviders({
          session: { userName: 'nurse', providerServiceID: 3 },
        }),
        { provide: NurseService, useValue: nurse },
        { provide: DoctorService, useValue: doctor },
        { provide: BeneficiaryDetailsService, useValue: benSvc },
        { provide: CameraService, useValue: camera },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(NurseTmWorklistComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService) as any;
    session = TestBed.inject(SessionStorageService) as any;
    dialog = TestBed.inject(MatDialog) as any;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();
  });

  it('ngOnInit sets role, clears data, loads worklist', () => {
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(session.setItem).toHaveBeenCalledWith('currentRole', 'Nurse');
    expect(session.removeItem).toHaveBeenCalledWith('visitCode');
    expect(benSvc.reset).toHaveBeenCalled();
    expect(component.beneficiaryList.length).toBe(4);
    expect(component.beneficiaryList.map((b: any) => b.statusCode)).toEqual([
      5, 4, 9, 0,
    ]);
    expect(component.beneficiaryList[3].statusMessage).toBe('Not Available');
    expect(component.beneficiaryList[0].visitDate).toBe('02-01-2024 10:00 AM');
    expect(component.beneficiaryList[0].sno).toBe(1);
    // current behaviour: table data is cleared after the success branch
    expect(component.dataSource.data).toEqual([]);
  });

  it('getVisitStatus maps specialist flags', () => {
    [
      [2, 5, 'Pending For Tele-Consultation'],
      [3, 5, 'Pending For Tele-Consultation'],
      [4, 4, 'Tele-Consultation Cancelled'],
      [9, 9, 'Tele-Consultation Done'],
      [undefined, 0, ''],
    ].forEach(([flag, code, msg]) => {
      expect(component.getVisitStatus({ specialist_flag: flag })).toEqual({
        statusCode: code as number,
        statusMessage: msg as string,
      });
    });
  });

  it('getNurseTMWorklist alerts on non-200 and error', () => {
    nurse.getNurseTMWorklist.and.returnValue(
      of({ statusCode: 5000, errorMessage: 'bad' }),
    );
    component.getNurseTMWorklist();
    expect(confirm.alert).toHaveBeenCalledWith('bad', 'error');
    nurse.getNurseTMWorklist.and.returnValue(throwingObs('e'));
    component.getNurseTMWorklist();
    expect(confirm.alert).toHaveBeenCalledWith('e', 'error');
  });

  it('ngOnDestroy removes role', () => {
    component.ngOnDestroy();
    expect(session.removeItem).toHaveBeenCalledWith('currentRole');
  });

  it('pageChanged slices', () => {
    component.pageChanged({ page: 2, itemsPerPage: 3 });
    expect(component.pagedList.length).toBe(1);
  });

  it('patientImageView shows or alerts', () => {
    benSvc.getBeneficiaryImage.and.returnValue(of({ benImage: 'i' }));
    component.patientImageView(1);
    expect(camera.viewImage).toHaveBeenCalledWith('i');
    benSvc.getBeneficiaryImage.and.returnValue(of(null));
    component.patientImageView(1);
    expect(confirm.alert).toHaveBeenCalledWith(
      LANGUAGE_EN.alerts.info.imageNotFound,
    );
  });

  describe('loadNursePatientDetails', () => {
    it('alerts pending / cancelled status', () => {
      component.loadNursePatientDetails({
        visitCode: 1,
        statusCode: 5,
        statusMessage: 'p',
      });
      component.loadNursePatientDetails({ statusCode: 4, statusMessage: 'c' });
      expect(session.setItem).toHaveBeenCalledWith('visitCode', 1);
      expect(confirm.alert).toHaveBeenCalledWith('p');
      expect(confirm.alert).toHaveBeenCalledWith('c');
    });

    it('opens case sheet for done status', () => {
      const ben = {
        statusCode: 9,
        benFlowID: 1,
        VisitCategory: 'General',
        beneficiaryRegID: 2,
        benVisitID: 3,
      };
      component.loadNursePatientDetails(ben);
      expect(confirm.confirm).toHaveBeenCalledWith(
        'info',
        LANGUAGE_EN.alerts.info.consulation,
      );
      expect(session.setItem).toHaveBeenCalledWith('caseSheetBenFlowID', 1);
      expect(session.setItem).toHaveBeenCalledWith(
        'caseSheetVisitCategory',
        'General',
      );
      expect(session.setItem).toHaveBeenCalledWith('caseSheetVisitID', 3);
      expect(router.navigate).toHaveBeenCalledWith([
        '/nurse-doctor/print/TM/current',
      ]);
    });

    it('does nothing for other statuses or declined case sheet', () => {
      component.loadNursePatientDetails({ statusCode: 0 });
      confirm.confirm.and.returnValue(of(false));
      component.viewAndPrintCaseSheet({});
      expect(router.navigate).not.toHaveBeenCalled();
      expect(confirm.alert).not.toHaveBeenCalled();
    });
  });

  describe('filterBeneficiaryList', () => {
    it('empty term restores list', () => {
      component.filterBeneficiaryList('');
      expect(component.dataSource.data.length).toBe(4);
    });
    it('matches name', () => {
      component.filterBeneficiaryList('kiran');
      expect(
        component.dataSource.data.map((b: any) => b.beneficiaryID),
      ).toEqual(['B3']);
    });
    it('matches first visit / revisit', () => {
      component.filterBeneficiaryList('first visit');
      expect(
        component.filteredBeneficiaryList.map((b: any) => b.beneficiaryID),
      ).toEqual(['B1']);
      component.filterBeneficiaryList('revisit');
      expect(
        component.filteredBeneficiaryList.map((b: any) => b.beneficiaryID),
      ).toEqual(['B2', 'B3', 'B4']);
    });
  });

  describe('toggleArrivalStatus', () => {
    it('updates arrival status on success', () => {
      doctor.updateBeneficiaryArrivalStatus.and.returnValue(
        of({ statusCode: 200, data: { response: 'ok' } }),
      );
      component.toggleArrivalStatus({ checked: true }, 10);
      expect(confirm.confirm).toHaveBeenCalledWith(
        'info',
        LANGUAGE_EN.alerts.info.beneficiaryArrive,
        'YES',
        'NO',
      );
      expect(doctor.updateBeneficiaryArrivalStatus).toHaveBeenCalledWith({
        benflowID: 10,
        benRegID: 1,
        visitCode: 100,
        status: true,
        userID: 7,
        modifiedBy: 'nurse',
      });
      expect(component.beneficiaryList[0].benArrivedFlag).toBeTrue();
      expect(confirm.alert).toHaveBeenCalledWith('ok', 'success');
    });

    it('reverts on failure response', () => {
      doctor.updateBeneficiaryArrivalStatus.and.returnValue(
        of({ errorMessage: 'no' }),
      );
      component.toggleArrivalStatus({ checked: false }, 10);
      expect(confirm.confirm.calls.mostRecent().args[1]).toBe(
        LANGUAGE_EN.alerts.info.cancelStatus,
      );
      expect(component.beneficiaryList[0].benArrivedFlag).toBeTrue();
      expect(confirm.alert).toHaveBeenCalledWith('no', 'error');
    });

    it('reverts on error', () => {
      doctor.updateBeneficiaryArrivalStatus.and.returnValue(throwingObs('x'));
      component.toggleArrivalStatus({ checked: true }, 10);
      expect(component.beneficiaryList[0].benArrivedFlag).toBeFalse();
      expect(confirm.alert).toHaveBeenCalledWith('x', 'error');
    });

    it('skips unknown beneficiary or declined confirm', () => {
      component.toggleArrivalStatus({ checked: true }, 999);
      confirm.confirm.and.returnValue(of(false));
      component.toggleArrivalStatus({ checked: true }, 10);
      expect(doctor.updateBeneficiaryArrivalStatus).not.toHaveBeenCalled();
    });
  });

  describe('cancelTCRequest', () => {
    const ben = {
      benFlowID: 1,
      beneficiaryRegID: 2,
      visitCode: 3,
      tCSpecialistUserID: 4,
    };
    it('cancels and reloads on success', () => {
      doctor.cancelBeneficiaryTCRequest.and.returnValue(
        of({ statusCode: 200, data: { response: 'cancelled' } }),
      );
      nurse.getNurseTMWorklist.calls.reset();
      component.cancelTCRequest(ben);
      expect(doctor.cancelBeneficiaryTCRequest).toHaveBeenCalledWith({
        benflowID: 1,
        benRegID: 2,
        visitCode: 3,
        userID: 4,
        modifiedBy: 'nurse',
      });
      expect(confirm.alert).toHaveBeenCalledWith('cancelled', 'success');
      expect(nurse.getNurseTMWorklist).toHaveBeenCalled();
    });
    it('alerts on failure and error', () => {
      doctor.cancelBeneficiaryTCRequest.and.returnValue(
        of({ errorMessage: 'f' }),
      );
      component.cancelTCRequest(ben);
      expect(confirm.alert).toHaveBeenCalledWith('f', 'error');
      doctor.cancelBeneficiaryTCRequest.and.returnValue(throwingObs('e'));
      component.cancelTCRequest(ben);
      expect(confirm.alert).toHaveBeenCalledWith('e', 'error');
    });
    it('does nothing when declined', () => {
      confirm.confirm.and.returnValue(of(false));
      component.cancelTCRequest(ben);
      expect(doctor.cancelBeneficiaryTCRequest).not.toHaveBeenCalled();
    });
  });

  describe('scheduler', () => {
    it('openScheduler schedules when a slot is chosen', () => {
      dialog.open.and.returnValue({ afterClosed: () => of({ tmSlot: 'S' }) });
      const spy = spyOn(component, 'scheduleTC');
      component.openScheduler({ benFlowID: 1 });
      expect(dialog.open).toHaveBeenCalledWith(SchedulerComponent, {});
      expect(spy).toHaveBeenCalledWith({ benFlowID: 1 }, 'S');
    });

    it('openScheduler does nothing when dismissed', () => {
      dialog.open.and.returnValue({ afterClosed: () => of(undefined) });
      const spy = spyOn(component, 'scheduleTC');
      component.openScheduler({});
      expect(spy).not.toHaveBeenCalled();
    });

    it('scheduleTC posts request and reloads', () => {
      doctor.scheduleTC.and.returnValue(of({ statusCode: 200 }));
      nurse.getNurseTMWorklist.calls.reset();
      component.scheduleTC(
        {
          benFlowID: 1,
          beneficiaryRegID: 2,
          benVisitID: 3,
          visitCode: 4,
          vanID: 5,
        },
        'slot',
      );
      expect(doctor.scheduleTC).toHaveBeenCalledWith({
        benFlowID: 1,
        beneficiaryRegID: 2,
        benVisitID: 3,
        visitCode: 4,
        vanID: 5,
        providerServiceMapID: 3,
        createdBy: 'nurse',
        tcRequest: 'slot',
      });
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.beneficiaryDetails,
        'success',
      );
      expect(nurse.getNurseTMWorklist).toHaveBeenCalled();
    });

    it('scheduleTC alerts on failure and error', () => {
      doctor.scheduleTC.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'x' }),
      );
      component.scheduleTC({}, null);
      expect(confirm.alert).toHaveBeenCalledWith('x', 'error');
      doctor.scheduleTC.and.returnValue(throwingObs('y'));
      component.scheduleTC({}, null);
      expect(confirm.alert).toHaveBeenCalledWith('y', 'error');
    });
  });

  describe('initiateTC', () => {
    it('alerts when beneficiary not arrived', () => {
      component.initiateTC({ benArrivedFlag: false });
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.benificiary,
      );
      expect(doctor.invokeSwymedCall).not.toHaveBeenCalled();
    });

    it('alerts on failure and error', () => {
      doctor.invokeSwymedCall.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'n' }),
      );
      component.initiateTC({ benArrivedFlag: true });
      expect(confirm.alert).toHaveBeenCalledWith('n', 'error');
      doctor.invokeSwymedCall.and.returnValue(throwingObs('e'));
      component.initiateTC({ benArrivedFlag: true });
      expect(confirm.alert).toHaveBeenCalledWith('e', 'error');
    });
  });

  it('updateTCStartTime posts ben/visit', () => {
    component.updateTCStartTime({ beneficiaryRegID: 1, visitCode: 2 });
    expect(doctor.updateTCStartTime).toHaveBeenCalledWith({
      benRegID: 1,
      visitCode: 2,
    });
  });

  it('ngDoCheck re-assigns language', () => {
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });
});
