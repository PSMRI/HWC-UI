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
  discardPeriodicTasks,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';
import { TcSpecialistWorklistComponent } from './tc-specialist-worklist.component';
import { BeneficiaryDetailsService } from '../../core/services/beneficiary-details.service';
import { CameraService } from '../../core/services/camera.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { TelemedicineService } from '../../core/services/telemedicine.service';
import { DoctorService, MasterdataService } from '../shared/services';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

describe('TcSpecialistWorklistComponent', () => {
  let component: TcSpecialistWorklistComponent;
  let fixture: ComponentFixture<TcSpecialistWorklistComponent>;
  let doctorService: any;
  let benService: any;
  let masterService: any;
  let camera: any;
  let confirm: any;
  let tele: any;
  let session: any;
  let router: Router;
  const info = LANGUAGE_EN.alerts.info;

  const makeBen = (over: any = {}) => ({
    benFlowID: 11,
    beneficiaryRegID: 22,
    beneficiaryID: 33,
    benVisitID: 44,
    visitCode: 55,
    vanID: 66,
    parkingPlaceID: 3,
    genderName: 'Female',
    VisitCategory: 'ANC',
    VisitReason: 'Follow up',
    specialist_flag: 1,
    doctorFlag: 1,
    nurseFlag: 9,
    pharmacist_flag: 0,
    referredVisitCode: 'RV',
    referred_visit_id: 'RID',
    tCSpecialistUserID: 77,
    benName: 'Sita',
    visitDate: '2024-01-02',
    ...over,
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [TcSpecialistWorklistComponent],
      providers: [
        ...commonTestProviders({ session: { userName: 'spec1', userID: 5 } }),
        { provide: DoctorService, useValue: autoSpy(DoctorService) },
        { provide: MasterdataService, useValue: autoSpy(MasterdataService) },
        {
          provide: BeneficiaryDetailsService,
          useValue: autoSpy(BeneficiaryDetailsService, { cbacData: [] }),
        },
        { provide: CameraService, useValue: autoSpy(CameraService) },
        {
          provide: TelemedicineService,
          useValue: autoSpy(TelemedicineService),
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TcSpecialistWorklistComponent);
    component = fixture.componentInstance;
    doctorService = TestBed.inject(DoctorService);
    benService = TestBed.inject(BeneficiaryDetailsService);
    masterService = TestBed.inject(MasterdataService);
    camera = TestBed.inject(CameraService);
    confirm = TestBed.inject(ConfirmationService);
    tele = TestBed.inject(TelemedicineService);
    session = TestBed.inject(SessionStorageService);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    doctorService.getSpecialistWorklist.and.returnValue(
      of({ statusCode: 200, data: [makeBen()] }),
    );
    component.currentLanguageSet = LANGUAGE_EN;
  });

  afterEach(() => clearInterval(component.intervalref));

  describe('lifecycle', () => {
    it('renders, loads worklist and starts polling on init', fakeAsync(() => {
      fixture.detectChanges();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(session.setItem).toHaveBeenCalledWith('currentRole', 'Doctor');
      ['visitCode', 'referredVisitCode', 'referredVisitID'].forEach((k) =>
        expect(session.removeItem).toHaveBeenCalledWith(k),
      );
      expect(benService.reset).toHaveBeenCalled();
      expect(masterService.reset).toHaveBeenCalled();
      expect(doctorService.getSpecialistWorklist).toHaveBeenCalledTimes(1);
      const row = component.dataSource.data[0];
      expect(row.sno).toBe(1);
      expect(row.statusCode).toBe(1);
      expect(row.visitDate).toBe('02-01-2024');
      expect(component.pagedList.length).toBe(1);
      tick(60 * 1000);
      expect(doctorService.getSpecialistWorklist).toHaveBeenCalledTimes(2);
      fixture.destroy();
      expect(session.removeItem).toHaveBeenCalledWith('currentRole');
      tick(60 * 1000);
      expect(doctorService.getSpecialistWorklist).toHaveBeenCalledTimes(2);
    }));

    it('ngOnChanges "current" starts the timer', fakeAsync(() => {
      spyOn(component, 'loadWorklist');
      component.getChangedTab = 'current';
      component.ngOnChanges();
      tick(60 * 1000);
      expect(component.loadWorklist).toHaveBeenCalledTimes(1);
      discardPeriodicTasks();
    }));

    it('ngOnChanges "future" stops the timer', fakeAsync(() => {
      spyOn(component, 'loadWorklist');
      component.setTimer();
      component.getChangedTab = 'future';
      component.ngOnChanges();
      tick(120 * 1000);
      expect(component.loadWorklist).not.toHaveBeenCalled();
    }));

    it('ngDoCheck recomputes meta data status', () => {
      component.beneficiaryMetaData = [{ specialist_flag: 9 }];
      component.ngDoCheck();
      expect(component.beneficiaryMetaData[0].statusCode).toBe(9);
      expect(component.beneficiaryMetaData[0].statusMessage).toBe(
        'Consultation done',
      );
    });

    it('ngDoCheck skips when meta data is null', () => {
      component.beneficiaryMetaData = null;
      component.ngDoCheck();
      expect(component.beneficiaryMetaData).toBeNull();
    });
  });

  describe('loadWorklist', () => {
    it('alerts on non-200', () => {
      doctorService.getSpecialistWorklist.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'bad' }),
      );
      component.loadWorklist();
      expect(confirm.alert).toHaveBeenCalledWith('bad', 'error');
    });
    it('alerts on error', () => {
      doctorService.getSpecialistWorklist.and.returnValue(throwingObs('e'));
      component.loadWorklist();
      expect(confirm.alert).toHaveBeenCalledWith('e', 'error');
    });
    it('reLoadWorklist clears the filter and reloads', () => {
      spyOn(component, 'loadWorklist');
      component.filterTerm = 'x';
      component.reLoadWorklist();
      expect(component.filterTerm).toBeNull();
      expect(component.loadWorklist).toHaveBeenCalled();
    });
  });

  it('loadDataToBenList fills defaults', () => {
    const [row] = component.loadDataToBenList([{}]);
    expect(row.genderName).toBe('Not Available');
    expect(row.preferredPhoneNum).toBe('Not Available');
    expect(row.arrival).toBeFalse();
  });

  describe('filterBeneficiaryList', () => {
    beforeEach(() => {
      component.beneficiaryList = [
        { benName: 'Ravi', other: 'sita' },
        { benName: 'Sita' },
      ];
    });
    it('resets on empty term', () => {
      component.filterBeneficiaryList('');
      expect(component.filteredBeneficiaryList.length).toBe(2);
      expect(component.currentPage).toBe(1);
    });
    it('filters by searchable keys only', () => {
      component.filterBeneficiaryList('SITA');
      expect(component.filteredBeneficiaryList).toEqual([
        { benName: 'Sita', sno: 1 },
      ]);
      expect(component.pagedList.length).toBe(1);
    });
  });

  describe('patientImageView', () => {
    it('views image', () => {
      benService.getBeneficiaryImage.and.returnValue(of({ benImage: 'i' }));
      component.patientImageView(1);
      expect(camera.viewImage).toHaveBeenCalledWith('i');
    });
    it('alerts when missing', () => {
      benService.getBeneficiaryImage.and.returnValue(of(null));
      component.patientImageView(1);
      expect(confirm.alert).toHaveBeenCalledWith(info.imageNotFound);
    });
  });

  describe('loadTcConsultation', () => {
    beforeEach(() => {
      spyOn(component, 'redirectToWorkArea');
      spyOn(component, 'viewAndPrintCaseSheet');
    });
    [1, 3, 11].forEach((code) =>
      it(`redirects for status ${code}`, () => {
        component.loadTcConsultation({ statusCode: code, visitCode: 5 });
        expect(session.setItem).toHaveBeenCalledWith('visitCode', 5);
        expect(component.redirectToWorkArea).toHaveBeenCalled();
      }),
    );
    [2, 5, 10].forEach((code) =>
      it(`alerts for status ${code}`, () => {
        component.loadTcConsultation({ statusCode: code, statusMessage: 'm' });
        expect(confirm.alert).toHaveBeenCalledWith('m');
      }),
    );
    it('views case sheet for status 9', () => {
      component.loadTcConsultation({ statusCode: 9 });
      expect(component.viewAndPrintCaseSheet).toHaveBeenCalled();
    });
    it('does nothing for unknown status', () => {
      component.loadTcConsultation({ statusCode: 4 });
      expect(component.redirectToWorkArea).not.toHaveBeenCalled();
      expect(confirm.alert).not.toHaveBeenCalled();
    });
  });

  describe('viewAndPrintCaseSheet', () => {
    it('stores case sheet keys and navigates on confirm', () => {
      component.viewAndPrintCaseSheet(makeBen());
      expect(confirm.confirm).toHaveBeenCalledWith('info', info.consulation);
      expect(session.setItem).toHaveBeenCalledWith('caseSheetBenFlowID', 11);
      expect(session.setItem).toHaveBeenCalledWith(
        'caseSheetVisitCategory',
        'ANC',
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
    it('does nothing when declined', () => {
      confirm.confirm.and.returnValue(of(false));
      component.viewAndPrintCaseSheet(makeBen());
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  it('checkBeneficiaryStatus redirects to work area', () => {
    spyOn(component, 'redirectToWorkArea');
    const b = makeBen();
    component.checkBeneficiaryStatus(b);
    expect(component.redirectToWorkArea).toHaveBeenCalledWith(b);
  });

  describe('beneficiaryTCRequestStatus', () => {
    it('loads consultation when status OK', () => {
      spyOn(component, 'loadTcConsultation');
      const b = makeBen();
      component.beneficiaryTCRequestStatus(b);
      expect(doctorService.beneficiaryTCRequestStatus).toHaveBeenCalledWith({
        benflowID: 11,
        benRegID: 22,
        visitCode: 55,
        userID: 5,
      });
      expect(component.loadTcConsultation).toHaveBeenCalledWith(b);
    });
    it('alerts when beneficiary not arrived', () => {
      doctorService.beneficiaryTCRequestStatus.and.returnValue(
        of({ statusCode: 5000 }),
      );
      component.beneficiaryTCRequestStatus(makeBen());
      expect(confirm.alert).toHaveBeenCalledWith(info.beneficiaryNotArrived);
    });
  });

  describe('redirectToWorkArea', () => {
    const target = ['/nurse-doctor/attendant/tcspecialist/patient/', 22];

    it('collects CBAC suspicions, stores data and navigates on confirm', () => {
      benService.getCBACDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            benRegID: 22,
            suspectedHRP: 'YES',
            suspectedTB: 'yes',
            suspectedNCDDiseases:
              'diabetes,hypertension,breast cancer,mental health disorder,oral cancer,x',
          },
        }),
      );
      component.redirectToWorkArea(makeBen());
      expect(component.cbacData).toEqual([
        'High Risk Pregnancy',
        'Tuberculosis',
        'Diabetes',
        'Hypertension',
        'Breast cancer',
        'Mental health disorder',
        'Oral cancer',
      ]);
      expect(benService.cbacData).toEqual(component.cbacData);
      expect(session.setItem).toHaveBeenCalledWith(
        'serviceLineDetails',
        JSON.stringify({ vanID: 66, parkingPlaceID: 3 }),
      );
      expect(session.setItem).toHaveBeenCalledWith('specialist_flag', 1);
      expect(session.setItem).toHaveBeenCalledWith('referredVisitCode', 'RV');
      expect(session.setItem).toHaveBeenCalledWith('referredVisitID', 'RID');
      expect(router.navigate).toHaveBeenCalledWith(target);
    });

    it('does not navigate when CBAC confirm declined', () => {
      confirm.confirm.and.returnValue(of(false));
      benService.getCBACDetails.and.returnValue(
        of({ statusCode: 200, data: { benRegID: 1, suspectedHRP: 'yes' } }),
      );
      component.redirectToWorkArea(makeBen());
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('confirms plainly for negative suspicions', () => {
      benService.getCBACDetails.and.returnValue(
        of({
          statusCode: 200,
          data: { benRegID: 1, suspectedNCD: 'no', suspectedNCDDiseases: '' },
        }),
      );
      component.redirectToWorkArea(makeBen());
      expect(component.cbacData).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(target);
    });

    it('does not navigate when declined for negative suspicions', () => {
      confirm.confirm.and.returnValue(of(false));
      benService.getCBACDetails.and.returnValue(
        of({ statusCode: 200, data: { benRegID: 1, suspectedTB: 'no' } }),
      );
      component.redirectToWorkArea(makeBen());
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('confirms plainly when no CBAC record', () => {
      benService.getCBACDetails.and.returnValue(
        of({ statusCode: 200, data: {} }),
      );
      component.redirectToWorkArea(makeBen());
      expect(benService.cbacData).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(target);
    });

    it('does not navigate when declined without CBAC record', () => {
      confirm.confirm.and.returnValue(of(false));
      benService.getCBACDetails.and.returnValue(
        of({ statusCode: 200, data: {} }),
      );
      component.redirectToWorkArea(makeBen());
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('alerts on non-200 CBAC response', () => {
      benService.getCBACDetails.and.returnValue(
        of({ statusCode: 5000, data: null, errorMessage: 'err' }),
      );
      component.redirectToWorkArea(makeBen());
      expect(component.cbacData).toBeNull();
      expect(confirm.alert).toHaveBeenCalledWith('err', 'error');
    });

    it('alerts on CBAC error', () => {
      benService.getCBACDetails.and.returnValue(throwingObs('x'));
      component.redirectToWorkArea(makeBen());
      expect(benService.cbacData).toBeNull();
      expect(confirm.alert).toHaveBeenCalledWith('x', 'error');
    });
  });

  describe('getVisitStatus', () => {
    const L = LANGUAGE_EN;
    const cases: [any, number, any][] = [
      [{ lab_technician_flag: 2 }, 10, L.alerts.info.fetosenseTest_pending],
      [{ doctorFlag: 2 }, 2, L.alerts.info.pendingforLabtestResult],
      [{ nurseFlag: 2 }, 2, L.alerts.info.pendingforLabtestResult],
      [{ specialist_flag: 1 }, 1, L.common.pendingForConsultation],
      [{ specialist_flag: 2 }, 2, L.alerts.info.pendingforLabtestResult],
      [{ lab_technician_flag: 3 }, 11, L.alerts.info.fetosenseTest_done],
      [{ specialist_flag: 3 }, 3, L.alerts.info.labtestDone],
      [{ specialist_flag: 9 }, 9, 'Consultation done'],
      [{ specialist_flag: 7 }, 0, ''],
    ];
    cases.forEach(([input, code, msg]) =>
      it(`${JSON.stringify(input)} -> ${code}`, () => {
        const s = component.getVisitStatus(input);
        expect(s.statusCode).toBe(code);
        expect(s.statusMessage).toBe(msg);
      }),
    );
  });

  it('navigateToTeleMedicine delegates to telemedicine service', () => {
    component.navigateToTeleMedicine();
    expect(tele.routeToTeleMedecine).toHaveBeenCalled();
  });

  describe('cancelTCRequest', () => {
    beforeEach(() => spyOn(component, 'reLoadWorklist'));
    it('cancels and reloads on success', () => {
      doctorService.cancelBeneficiaryTCRequest.and.returnValue(
        of({ statusCode: 200, data: { response: 'ok' } }),
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
        modifiedBy: 'spec1',
      });
      expect(confirm.alert).toHaveBeenCalledWith('ok', 'success');
      expect(component.reLoadWorklist).toHaveBeenCalled();
    });
    it('alerts on failure response', () => {
      doctorService.cancelBeneficiaryTCRequest.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'no' }),
      );
      component.cancelTCRequest(makeBen());
      expect(confirm.alert).toHaveBeenCalledWith('no', 'error');
    });
    it('alerts on error', () => {
      doctorService.cancelBeneficiaryTCRequest.and.returnValue(
        throwingObs('z'),
      );
      component.cancelTCRequest(makeBen());
      expect(confirm.alert).toHaveBeenCalledWith('z', 'error');
    });
    it('does nothing when declined', () => {
      confirm.confirm.and.returnValue(of(false));
      component.cancelTCRequest(makeBen());
      expect(doctorService.cancelBeneficiaryTCRequest).not.toHaveBeenCalled();
    });
  });
});
