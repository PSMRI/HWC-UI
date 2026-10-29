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
import { DoctorWorklistComponent } from './doctor-worklist.component';
import { BeneficiaryDetailsService } from '../../core/services/beneficiary-details.service';
import { CameraService } from '../../core/services/camera.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { DoctorService, MasterdataService } from '../shared/services';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { SchedulerComponent } from '../scheduler/scheduler.component';
import { environment } from 'src/environments/environment';

describe('DoctorWorklistComponent', () => {
  let component: DoctorWorklistComponent;
  let fixture: ComponentFixture<DoctorWorklistComponent>;
  let doctorService: any;
  let benService: any;
  let masterService: any;
  let camera: any;
  let confirm: any;
  let session: any;
  let router: Router;
  let dialog: any;
  const info = LANGUAGE_EN.alerts.info;

  const makeBen = (over: any = {}) => ({
    benFlowID: 11,
    beneficiaryRegID: 22,
    beneficiaryID: 33,
    benVisitID: 44,
    visitCode: 55,
    vanID: 66,
    genderName: 'Male',
    VisitCategory: 'General OPD',
    VisitReason: 'New',
    doctorFlag: 1,
    nurseFlag: 9,
    pharmacist_flag: 0,
    specialist_flag: 0,
    tCSpecialistUserID: 77,
    benName: 'Ravi Kumar',
    visitDate: '2024-01-01T10:00:00',
    benVisitDate: '2024-01-01T10:00:00',
    ...over,
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [DoctorWorklistComponent],
      providers: [
        ...commonTestProviders({
          session: { userName: 'doc1', providerServiceID: 9 },
        }),
        { provide: DoctorService, useValue: autoSpy(DoctorService) },
        { provide: MasterdataService, useValue: autoSpy(MasterdataService) },
        {
          provide: BeneficiaryDetailsService,
          useValue: autoSpy(BeneficiaryDetailsService, { cbacData: [] }),
        },
        { provide: CameraService, useValue: autoSpy(CameraService) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DoctorWorklistComponent);
    component = fixture.componentInstance;
    doctorService = TestBed.inject(DoctorService);
    benService = TestBed.inject(BeneficiaryDetailsService);
    masterService = TestBed.inject(MasterdataService);
    camera = TestBed.inject(CameraService);
    confirm = TestBed.inject(ConfirmationService);
    session = TestBed.inject(SessionStorageService);
    dialog = TestBed.inject(MatDialog);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    doctorService.getDoctorWorklist.and.returnValue(
      of({ statusCode: 200, data: [makeBen()] }),
    );
  });

  describe('initialisation', () => {
    it('renders and loads the worklist on init', () => {
      fixture.detectChanges();
      expect(session.setItem).toHaveBeenCalledWith('currentRole', 'Doctor');
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(doctorService.getDoctorWorklist).toHaveBeenCalled();
      expect(benService.reset).toHaveBeenCalled();
      expect(masterService.reset).toHaveBeenCalled();
      expect(component.dataSource.data.length).toBe(1);
      expect(component.dataSource.data[0].sno).toBe(1);
      expect(component.beneficiaryList[0].statusCode).toBe(1);
      ['visitCode', 'beneficiaryGender', 'benFlowID', 'specialistFlag'].forEach(
        (k) => expect(session.removeItem).toHaveBeenCalledWith(k),
      );
    });

    it('uses TC columns when eSanjeevani flag is set', () => {
      confirm.eSanjeevaniDoctorFlagArry = 'ESanjeevani';
      component.ngOnInit();
      expect(component.displayedColumns).toContain('beneficiaryArrived');
      expect(component.displayedColumns).toContain('action');
    });

    it('uses TC columns when Swymed flag is set', () => {
      confirm.eSanjeevaniDoctorFlagArry = 'Swymed';
      component.ngOnInit();
      expect(component.displayedColumns.length).toBe(10);
    });

    it('uses basic columns otherwise', () => {
      confirm.eSanjeevaniDoctorFlagArry = undefined;
      component.ngOnInit();
      expect(component.displayedColumns).not.toContain('action');
      expect(component.displayedColumns.length).toBe(8);
    });

    it('ngDoCheck recomputes status for beneficiary meta data', () => {
      component.beneficiaryMetaData = [makeBen({ doctorFlag: 9 })];
      component.ngDoCheck();
      expect(component.beneficiaryMetaData[0].statusCode).toBe(9);
      expect(component.beneficiaryMetaData[0].statusMessage).toBe(
        info.consultation_done,
      );
    });

    it('ngDoCheck skips when meta data is null', () => {
      component.beneficiaryMetaData = null;
      component.ngDoCheck();
      expect(component.beneficiaryMetaData).toBeNull();
    });

    it('ngOnDestroy removes current role', () => {
      component.ngOnDestroy();
      expect(session.removeItem).toHaveBeenCalledWith('currentRole');
    });
  });

  describe('loadWorklist', () => {
    it('alerts on non-200 response', () => {
      doctorService.getDoctorWorklist.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'bad' }),
      );
      component.currentLanguageSet = LANGUAGE_EN;
      component.loadWorklist();
      expect(confirm.alert).toHaveBeenCalledWith('bad', 'error');
    });

    it('alerts on unhandled error', () => {
      doctorService.getDoctorWorklist.and.returnValue(throwingObs('boom'));
      component.loadWorklist();
      expect(confirm.alert).toHaveBeenCalledWith('boom', 'error');
    });

    it('does not alert on handled error', () => {
      doctorService.getDoctorWorklist.and.returnValue(
        throwingObs({ handled: true }),
      );
      component.loadWorklist();
      expect(confirm.alert).not.toHaveBeenCalled();
    });
  });

  it('loadDataToBenList fills defaults', () => {
    const list = component.loadDataToBenList([{ visitDate: '2024-02-03' }]);
    expect(list[0].genderName).toBe('Not Available');
    expect(list[0].age).toBe('Not Available');
    expect(list[0].districtName).toBe('Not Available');
    expect(list[0].arrival).toBeFalse();
    expect(list[0].visitDate).toContain('03-02-2024');
  });

  it('pageChanged slices the filtered list', () => {
    component.filteredBeneficiaryList = [1, 2, 3, 4, 5, 6, 7];
    component.pageChanged({ page: 2, itemsPerPage: 5 });
    expect(component.pagedList).toEqual([6, 7]);
  });

  describe('filterBeneficiaryList', () => {
    beforeEach(() => {
      component.beneficiaryList = [
        { beneficiaryID: 'ABC1', benName: 'Ravi', agentId: 'zzz' },
        { beneficiaryID: 'XYZ9', benName: 'Sita' },
      ];
    });

    it('restores full list for empty term', () => {
      component.filterBeneficiaryList('');
      expect(component.filteredBeneficiaryList.length).toBe(2);
    });

    it('filters by matching key', () => {
      component.filterBeneficiaryList('sita');
      expect(component.filteredBeneficiaryList.length).toBe(1);
      expect(component.dataSource.data[0].sno).toBe(1);
    });

    it('ignores non-searchable keys', () => {
      component.filterBeneficiaryList('zzz');
      expect(component.filteredBeneficiaryList.length).toBe(0);
    });
  });

  describe('patientImageView', () => {
    beforeEach(() => (component.currentLanguageSet = LANGUAGE_EN));
    it('shows image when available', () => {
      benService.getBeneficiaryImage.and.returnValue(of({ benImage: 'img' }));
      component.patientImageView(1);
      expect(camera.viewImage).toHaveBeenCalledWith('img');
    });
    it('alerts when image missing', () => {
      benService.getBeneficiaryImage.and.returnValue(of({}));
      component.patientImageView(1);
      expect(confirm.alert).toHaveBeenCalledWith(info.imageNotFound);
    });
  });

  it('redirectToCHOReport opens DHIS url with token', () => {
    session.store.set(
      'loginDataResponse',
      JSON.stringify({ dhistoken: 'tok' }),
    );
    const open = spyOn(window, 'open');
    component.redirectToCHOReport();
    expect(open).toHaveBeenCalledWith(
      `${environment.dhisURL}tok`,
      '_blank',
      'noopener,noreferrer',
    );
  });

  describe('loadDoctorExaminationPage', () => {
    beforeEach(() => {
      component.currentLanguageSet = LANGUAGE_EN;
      spyOn(component, 'routeToWorkArea');
      spyOn(component, 'viewAndPrintCaseSheet');
      spyOn(component, 'checkDoctorStatusAtTcCancelled');
    });
    [1, 3, 11].forEach((code) =>
      it(`routes to work area for status ${code}`, () => {
        component.loadDoctorExaminationPage({ statusCode: code, visitCode: 5 });
        expect(session.setItem).toHaveBeenCalledWith('visitCode', 5);
        expect(component.routeToWorkArea).toHaveBeenCalled();
      }),
    );
    [2, 5, 10].forEach((code) =>
      it(`alerts status message for status ${code}`, () => {
        component.loadDoctorExaminationPage({
          statusCode: code,
          statusMessage: 'msg',
        });
        expect(confirm.alert).toHaveBeenCalledWith('msg');
      }),
    );
    it('checks TC cancel for status 4', () => {
      component.loadDoctorExaminationPage({ statusCode: 4 });
      expect(component.checkDoctorStatusAtTcCancelled).toHaveBeenCalled();
    });
    it('views case sheet for status 9', () => {
      component.loadDoctorExaminationPage({ statusCode: 9 });
      expect(component.viewAndPrintCaseSheet).toHaveBeenCalled();
    });
    it('does nothing for unknown status', () => {
      component.loadDoctorExaminationPage({ statusCode: 99 });
      expect(component.routeToWorkArea).not.toHaveBeenCalled();
      expect(confirm.alert).not.toHaveBeenCalled();
    });
  });

  describe('checkDoctorStatusAtTcCancelled', () => {
    beforeEach(() => {
      spyOn(component, 'routeToWorkArea');
      spyOn(component, 'viewAndPrintCaseSheet');
    });
    it('alerts when doctor flag is 2', () => {
      component.checkDoctorStatusAtTcCancelled({
        doctorFlag: 2,
        statusMessage: 'm',
      });
      expect(confirm.alert).toHaveBeenCalledWith('m');
    });
    it('alerts when nurse flag is 2', () => {
      component.checkDoctorStatusAtTcCancelled({
        nurseFlag: 2,
        statusMessage: 'n',
      });
      expect(confirm.alert).toHaveBeenCalledWith('n');
    });
    [1, 3].forEach((f) =>
      it(`routes for doctor flag ${f}`, () => {
        component.checkDoctorStatusAtTcCancelled({ doctorFlag: f });
        expect(component.routeToWorkArea).toHaveBeenCalled();
      }),
    );
    it('views case sheet for doctor flag 9', () => {
      component.checkDoctorStatusAtTcCancelled({ doctorFlag: 9 });
      expect(component.viewAndPrintCaseSheet).toHaveBeenCalled();
    });
    it('does nothing for other flags', () => {
      component.checkDoctorStatusAtTcCancelled({ doctorFlag: 0 });
      expect(component.routeToWorkArea).not.toHaveBeenCalled();
      expect(component.viewAndPrintCaseSheet).not.toHaveBeenCalled();
    });
  });

  describe('case sheet', () => {
    beforeEach(() => (component.currentLanguageSet = LANGUAGE_EN));
    it('routes to case sheet when confirmed', () => {
      component.viewAndPrintCaseSheet(makeBen());
      expect(session.setItem).toHaveBeenCalledWith('caseSheetBenFlowID', 11);
      expect(session.setItem).toHaveBeenCalledWith(
        'caseSheetVisitCategory',
        'General OPD',
      );
      expect(session.setItem).toHaveBeenCalledWith(
        'caseSheetBeneficiaryRegID',
        22,
      );
      expect(session.setItem).toHaveBeenCalledWith('caseSheetVisitID', 44);
      expect(router.navigate).toHaveBeenCalledWith([
        '/nurse-doctor/print/TM/current',
      ]);
    });
    it('does not route when declined', () => {
      confirm.confirm.and.returnValue(of(false));
      component.viewAndPrintCaseSheet(makeBen());
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('routeToWorkArea', () => {
    const ben = makeBen();
    beforeEach(() => (component.currentLanguageSet = LANGUAGE_EN));

    it('collects CBAC suspicions and navigates on confirm', () => {
      benService.getCBACDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            benRegID: 22,
            suspectedHRP: 'Yes',
            suspectedTB: 'yes',
            suspectedNCD: 'no',
            suspectedNCDDiseases:
              'Diabetes,Hypertension,Breast cancer,Mental health disorder,Oral cancer,other',
          },
        }),
      );
      component.routeToWorkArea(ben);
      expect(benService.getCBACDetails).toHaveBeenCalledWith(22);
      expect(component.cbacData).toEqual([
        'High Risk Pregnancy',
        'Tuberculosis',
        'Diabetes',
        'Hypertension',
        'Breast cancer',
        'Mental health disorder',
        'Oral cancer',
      ]);
      expect(confirm.confirmCBAC).toHaveBeenCalledWith(
        'info',
        info.confirmtoProceedFurther,
        component.cbacData,
      );
      expect(session.setItem).toHaveBeenCalledWith('beneficiaryGender', 'Male');
      expect(session.setItem).toHaveBeenCalledWith('doctorFlag', 1);
      expect(router.navigate).toHaveBeenCalledWith([
        '/nurse-doctor/attendant/doctor/patient/',
        22,
      ]);
    });

    it('does not navigate when CBAC confirm declined', () => {
      confirm.confirmCBAC.and.returnValue(of(false));
      benService.getCBACDetails.and.returnValue(
        of({ statusCode: 200, data: { benRegID: 1, suspectedTB: 'yes' } }),
      );
      component.routeToWorkArea(ben);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('confirms plainly when suspicions are all negative', () => {
      benService.getCBACDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            benRegID: 1,
            suspectedHRP: 'no',
            suspectedTB: 'no',
            suspectedNCDDiseases: '',
          },
        }),
      );
      component.routeToWorkArea(ben);
      expect(component.cbacData).toBeNull();
      expect(benService.cbacData).toBeNull();
      expect(confirm.confirm).toHaveBeenCalledWith(
        'info',
        info.confirmtoProceedFurther,
      );
      expect(router.navigate).toHaveBeenCalled();
    });

    it('does not navigate when plain confirm declined (negative suspicions)', () => {
      confirm.confirm.and.returnValue(of(false));
      benService.getCBACDetails.and.returnValue(
        of({ statusCode: 200, data: { benRegID: 1, suspectedNCD: 'no' } }),
      );
      component.routeToWorkArea(ben);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('confirms plainly when no CBAC record exists', () => {
      benService.getCBACDetails.and.returnValue(
        of({ statusCode: 200, data: {} }),
      );
      component.routeToWorkArea(ben);
      expect(component.cbacData).toBeNull();
      expect(router.navigate).toHaveBeenCalled();
    });

    it('does not navigate when plain confirm declined (no CBAC)', () => {
      confirm.confirm.and.returnValue(of(false));
      benService.getCBACDetails.and.returnValue(
        of({ statusCode: 200, data: {} }),
      );
      component.routeToWorkArea(ben);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('alerts on non-200 CBAC response', () => {
      benService.getCBACDetails.and.returnValue(
        of({ statusCode: 5000, data: null, errorMessage: 'e' }),
      );
      component.routeToWorkArea(ben);
      expect(component.cbacData).toBeNull();
      expect(confirm.alert).toHaveBeenCalledWith('e', 'error');
    });

    it('alerts on CBAC error', () => {
      benService.getCBACDetails.and.returnValue(throwingObs('err'));
      component.routeToWorkArea(ben);
      expect(component.cbacData).toBeNull();
      expect(confirm.alert).toHaveBeenCalledWith('err', 'error');
    });
  });

  describe('toggleArrivalStatus', () => {
    beforeEach(() => {
      component.currentLanguageSet = LANGUAGE_EN;
      component.beneficiaryList = [makeBen(), makeBen({ benFlowID: 12 })];
    });

    it('updates arrival status on confirm (checked)', () => {
      doctorService.updateBeneficiaryArrivalStatus.and.returnValue(
        of({ statusCode: 200, data: {} }),
      );
      component.toggleArrivalStatus({ checked: true }, 12);
      expect(confirm.confirm).toHaveBeenCalledWith(
        'info',
        info.beneficiaryArrive,
        'YES',
        'NO',
      );
      expect(component.beneficiaryList[1].benArrivedFlag).toBeTrue();
      expect(doctorService.updateBeneficiaryArrivalStatus).toHaveBeenCalledWith(
        {
          benflowID: 12,
          benRegID: 22,
          visitCode: 55,
          status: true,
          userID: 77,
          modifiedBy: 'doc1',
        },
      );
      expect(confirm.alert).toHaveBeenCalledWith(
        info.confirmArrival,
        'success',
      );
    });

    it('re-applies filter when filter term set', () => {
      spyOn(component, 'filterBeneficiaryList');
      component.filterTerm = 'ravi';
      component.toggleArrivalStatus({ checked: false }, 11);
      expect(confirm.confirm).toHaveBeenCalledWith(
        'info',
        info.cancelStatus,
        'YES',
        'NO',
      );
      expect(component.filterBeneficiaryList).toHaveBeenCalledWith('ravi');
    });

    it('reverts flag on failure response', () => {
      doctorService.updateBeneficiaryArrivalStatus.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'x' }),
      );
      component.toggleArrivalStatus({ checked: true }, 11);
      expect(component.beneficiaryList[0].benArrivedFlag).toBeFalse();
      expect(confirm.alert).toHaveBeenCalledWith('x', 'error');
    });

    it('reverts flag on error', () => {
      doctorService.updateBeneficiaryArrivalStatus.and.returnValue(
        throwingObs('y'),
      );
      component.toggleArrivalStatus({ checked: true }, 11);
      expect(component.beneficiaryList[0].benArrivedFlag).toBeFalse();
      expect(confirm.alert).toHaveBeenCalledWith('y', 'error');
    });

    it('does nothing when beneficiary not found', () => {
      component.toggleArrivalStatus({ checked: true }, 999);
      expect(
        doctorService.updateBeneficiaryArrivalStatus,
      ).not.toHaveBeenCalled();
    });

    it('does nothing when declined', () => {
      confirm.confirm.and.returnValue(of(false));
      component.toggleArrivalStatus({ checked: true }, 11);
      expect(
        doctorService.updateBeneficiaryArrivalStatus,
      ).not.toHaveBeenCalled();
    });
  });

  describe('getVisitStatus', () => {
    beforeEach(() => (component.currentLanguageSet = LANGUAGE_EN));
    const L = LANGUAGE_EN;
    const cases: [any, number, string][] = [
      [
        { specialist_flag: 0, lab_technician_flag: 2 },
        10,
        L.alerts.info.fetosenseTest_pending,
      ],
      [{ specialist_flag: 0, nurseFlag: 2 }, 2, L.alerts.info.pending],
      [{ specialist_flag: 0, doctorFlag: 2 }, 2, L.alerts.info.pending],
      [
        { specialist_flag: 0, doctorFlag: 1 },
        1,
        L.common.pendingForConsultation,
      ],
      [
        { specialist_flag: 0, lab_technician_flag: 3 },
        11,
        L.alerts.info.fetosenseTest_done,
      ],
      [{ specialist_flag: 0, doctorFlag: 3 }, 3, L.alerts.info.labtestDone],
      [
        { specialist_flag: 0, doctorFlag: 9 },
        9,
        L.alerts.info.consultation_done,
      ],
      [{ specialist_flag: 0, doctorFlag: 7 }, 0, ''],
      [{ specialist_flag: 9 }, 9, L.alerts.info.consultation_done],
      [
        { specialist_flag: 1, lab_technician_flag: 2 },
        10,
        L.alerts.info.fetosenseTest_pending,
      ],
      [{ specialist_flag: 1, doctorFlag: 2 }, 2, L.alerts.info.pending],
      [{ specialist_flag: 1, nurseFlag: 2 }, 2, L.alerts.info.pending],
      [{ specialist_flag: 1 }, 5, L.alerts.info.pendingForConsultation],
      [{ specialist_flag: 2 }, 5, L.alerts.info.pendingForConsultation],
      [{ specialist_flag: 3 }, 5, L.alerts.info.pendingForConsultation],
      [{ specialist_flag: 4 }, 4, L.alerts.info.teleCancel],
      [
        { specialist_flag: 5, lab_technician_flag: 3 },
        11,
        L.alerts.info.fetosenseTest_done,
      ],
      [{ specialist_flag: 5, doctorFlag: 3 }, 3, L.alerts.info.labtestDone],
      [
        { specialist_flag: 5, doctorFlag: 1 },
        1,
        L.common.pendingForConsultation,
      ],
      [{ specialist_flag: 5, doctorFlag: 8 }, 0, ''],
    ];
    cases.forEach(([input, code, msg], i) =>
      it(`case ${i}: ${JSON.stringify(input)} -> ${code}`, () => {
        const s = component.getVisitStatus(input);
        expect(s.statusCode).toBe(code);
        expect(s.statusMessage).toBe(msg);
      }),
    );
  });

  describe('cancelTCRequest', () => {
    beforeEach(() => {
      component.currentLanguageSet = LANGUAGE_EN;
      spyOn(component, 'loadWorklist');
    });
    it('cancels and reloads on success', () => {
      doctorService.cancelBeneficiaryTCRequest.and.returnValue(
        of({ statusCode: 200, data: { response: 'done' } }),
      );
      component.cancelTCRequest(makeBen());
      expect(doctorService.cancelBeneficiaryTCRequest).toHaveBeenCalledWith({
        benflowID: 11,
        benRegID: 22,
        visitCode: 55,
        userID: 77,
        modifiedBy: 'doc1',
      });
      expect(confirm.alert).toHaveBeenCalledWith('done', 'success');
      expect(component.loadWorklist).toHaveBeenCalled();
    });
    it('alerts on failure response', () => {
      doctorService.cancelBeneficiaryTCRequest.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'no' }),
      );
      component.cancelTCRequest(makeBen());
      expect(confirm.alert).toHaveBeenCalledWith('no', 'error');
      expect(component.loadWorklist).not.toHaveBeenCalled();
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

  describe('scheduler', () => {
    beforeEach(() => {
      component.currentLanguageSet = LANGUAGE_EN;
      spyOn(component, 'loadWorklist');
    });
    it('schedules TC when dialog returns a slot', () => {
      dialog.open.and.returnValue({
        afterClosed: () => of({ tmSlot: 'slot' }),
      });
      component.openScheduler(makeBen());
      expect(dialog.open).toHaveBeenCalledWith(SchedulerComponent, {});
      expect(doctorService.scheduleTC).toHaveBeenCalledWith({
        benFlowID: 11,
        beneficiaryRegID: 22,
        benVisitID: 44,
        visitCode: 55,
        vanID: 66,
        providerServiceMapID: 9,
        createdBy: 'doc1',
        tcRequest: 'slot',
      });
      expect(confirm.alert).toHaveBeenCalledWith(
        info.beneficiaryDetails,
        'success',
      );
      expect(component.loadWorklist).toHaveBeenCalled();
    });
    it('does not schedule when dialog dismissed', () => {
      dialog.open.and.returnValue({ afterClosed: () => of(undefined) });
      component.openScheduler(makeBen());
      expect(doctorService.scheduleTC).not.toHaveBeenCalled();
    });
    it('alerts on schedule failure', () => {
      doctorService.scheduleTC.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'f' }),
      );
      component.scheduleTC(makeBen(), {});
      expect(confirm.alert).toHaveBeenCalledWith('f', 'error');
    });
    it('alerts on schedule error', () => {
      doctorService.scheduleTC.and.returnValue(throwingObs('g'));
      component.scheduleTC(makeBen(), {});
      expect(confirm.alert).toHaveBeenCalledWith('g', 'error');
    });
  });

  describe('initiateTC', () => {
    beforeEach(() => (component.currentLanguageSet = LANGUAGE_EN));
    it('alerts when beneficiary has not arrived', () => {
      component.initiateTC(makeBen({ benArrivedFlag: false }));
      expect(confirm.alert).toHaveBeenCalledWith(info.benificiary);
      expect(doctorService.invokeSwymedCall).not.toHaveBeenCalled();
    });
    it('redirects to call URL and updates start time on success', () => {
      // Same-document fragment URL: changes location without reloading the Karma page.
      const target = window.location.href.split('#')[0] + '#k-worklists-doctor';
      doctorService.invokeSwymedCall.and.returnValue(
        of({ statusCode: 200, data: { response: target } }),
      );
      component.initiateTC(makeBen({ benArrivedFlag: true }));
      expect(doctorService.invokeSwymedCall).toHaveBeenCalledWith(77);
      expect(window.location.hash).toBe('#k-worklists-doctor');
      expect(doctorService.updateTCStartTime).toHaveBeenCalledWith({
        benRegID: 22,
        visitCode: 55,
      });
    });
    it('alerts on failed call response', () => {
      doctorService.invokeSwymedCall.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'nope' }),
      );
      component.initiateTC(makeBen({ benArrivedFlag: true }));
      expect(confirm.alert).toHaveBeenCalledWith('nope', 'error');
    });
    it('alerts on call error', () => {
      doctorService.invokeSwymedCall.and.returnValue(throwingObs('err'));
      component.initiateTC(makeBen({ benArrivedFlag: true }));
      expect(confirm.alert).toHaveBeenCalledWith('err', 'error');
    });
  });
});
