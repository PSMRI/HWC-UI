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
import { NurseService } from '../../shared/services';
import { NurseWorklistComponent } from './nurse-worklist.component';

describe('NurseWorklistComponent', () => {
  let component: NurseWorklistComponent;
  let fixture: ComponentFixture<NurseWorklistComponent>;
  let nurse: any;
  let benSvc: any;
  let camera: any;
  let confirm: any;
  let session: any;
  let router: Router;
  const PATH = '/nurse-doctor/attendant/nurse/patient/';

  const list = () => [
    {
      beneficiaryID: 'B1',
      benName: 'Asha',
      beneficiaryRegID: 1,
      benVisitNo: 1,
      fatherName: 'Raj',
    },
    {
      beneficiaryID: 'B2',
      benName: 'Ravi',
      beneficiaryRegID: 2,
      benVisitNo: 2,
    },
  ];

  const ben = (nurseFlag: number) => ({
    beneficiaryRegID: 1,
    beneficiaryID: 'B1',
    benFlowID: 3,
    visitCode: 4,
    benVisitID: 5,
    genderName: 'Female',
    benVisitNo: 1,
    nurseFlag,
  });

  beforeEach(async () => {
    nurse = autoSpy(NurseService);
    nurse.getNurseWorklist.and.returnValue(
      of({ statusCode: 200, data: list() }),
    );
    benSvc = autoSpy(BeneficiaryDetailsService);
    camera = autoSpy(CameraService);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [NurseWorklistComponent],
      providers: [
        ...commonTestProviders(),
        { provide: NurseService, useValue: nurse },
        { provide: BeneficiaryDetailsService, useValue: benSvc },
        { provide: CameraService, useValue: camera },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(NurseWorklistComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService) as any;
    session = TestBed.inject(SessionStorageService) as any;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();
  });

  it('ngOnInit sets role, clears visit data, loads list, resets details', () => {
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(session.setItem).toHaveBeenCalledWith('currentRole', 'Nurse');
    expect(session.removeItem).toHaveBeenCalledWith('pharmacist_flag');
    expect(benSvc.reset).toHaveBeenCalled();
    expect(component.dataSource.data.length).toBe(2);
    expect(component.dataSource.data[1].sno).toBe(2);
    expect(component.beneficiaryList[1].fatherName).toBe('Not Available');
    expect(component.beneficiaryList[0].fatherName).toBe('Raj');
  });

  it('getNurseWorklist alerts on non-200', () => {
    nurse.getNurseWorklist.and.returnValue(
      of({ statusCode: 5000, errorMessage: 'x' }),
    );
    component.getNurseWorklist();
    expect(confirm.alert).toHaveBeenCalledWith('x', 'error');
  });

  it('getNurseWorklist alerts on unhandled error only', () => {
    nurse.getNurseWorklist.and.returnValue(throwingObs({ handled: true }));
    component.getNurseWorklist();
    expect(confirm.alert).not.toHaveBeenCalled();
    nurse.getNurseWorklist.and.returnValue(throwingObs('boom'));
    component.getNurseWorklist();
    expect(confirm.alert).toHaveBeenCalledWith('boom', 'error');
  });

  it('ngOnDestroy removes role', () => {
    component.ngOnDestroy();
    expect(session.removeItem).toHaveBeenCalledWith('currentRole');
  });

  it('pageChanged slices', () => {
    component.pageChanged({ page: 1, itemsPerPage: 1 });
    expect(component.pagedList.length).toBe(1);
  });

  it('patientImageView shows or alerts', () => {
    benSvc.getBeneficiaryImage.and.returnValue(of({ benImage: 'i' }));
    component.patientImageView(1);
    expect(camera.viewImage).toHaveBeenCalledWith('i');
    benSvc.getBeneficiaryImage.and.returnValue(of({}));
    component.patientImageView(1);
    expect(confirm.alert).toHaveBeenCalledWith(
      LANGUAGE_EN.alerts.info.imageNotFound,
    );
  });

  describe('filterBeneficiaryList', () => {
    it('empty term restores list', () => {
      component.filterBeneficiaryList('');
      expect(component.dataSource.data.length).toBe(2);
    });
    it('matches text fields', () => {
      component.filterBeneficiaryList('raj');
      expect(component.filteredBeneficiaryList.length).toBe(1);
      expect(component.dataSource.data[0].sno).toBe(1);
    });
    it('matches "first visit" for benVisitNo 1', () => {
      component.filterBeneficiaryList('first');
      expect(
        component.filteredBeneficiaryList.map((b: any) => b.beneficiaryID),
      ).toEqual(['B1']);
    });
    it('matches "revisit" for other visits', () => {
      component.filterBeneficiaryList('revisit');
      expect(
        component.filteredBeneficiaryList.map((b: any) => b.beneficiaryID),
      ).toEqual(['B2']);
    });
    it('no match', () => {
      component.filterBeneficiaryList('qqqq');
      expect(component.dataSource.data).toEqual([]);
    });
  });

  describe('loadNursePatientDetails', () => {
    it('without CBAC data and nurseFlag 100 stores NCD visit and navigates', () => {
      benSvc.getCBACDetails.and.returnValue(of({ statusCode: 200, data: {} }));
      component.loadNursePatientDetails(ben(100));
      expect(benSvc.getCBACDetails).toHaveBeenCalledWith(1);
      expect(component.cbacData).toBeNull();
      expect(session.setItem).toHaveBeenCalledWith(
        'visitCategory',
        'NCD screening',
      );
      expect(session.setItem).toHaveBeenCalledWith('visitCode', 4);
      expect(router.navigate).toHaveBeenCalledWith([PATH, 1]);
    });

    it('without CBAC data and other nurseFlag uses ok/cancel dialog', () => {
      benSvc.getCBACDetails.and.returnValue(of({ statusCode: 200, data: {} }));
      component.loadNursePatientDetails(ben(1));
      expect(confirm.confirm).toHaveBeenCalledWith(
        'info',
        LANGUAGE_EN.alerts.info.confirmtoProceedFurther,
        LANGUAGE_EN.common.ok,
        LANGUAGE_EN.common.cancel,
      );
      expect(session.setItem).not.toHaveBeenCalledWith('visitCode', 4);
      expect(router.navigate).toHaveBeenCalledWith([PATH, 1]);
    });

    it('declined confirmations do not navigate', () => {
      confirm.confirm.and.returnValue(of(false));
      benSvc.getCBACDetails.and.returnValue(of({ statusCode: 200, data: {} }));
      component.loadNursePatientDetails(ben(100));
      component.loadNursePatientDetails(ben(1));
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('collects suspected conditions and confirms CBAC', () => {
      benSvc.getCBACDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            benRegID: 1,
            suspectedHRP: 'Yes',
            suspectedTB: 'YES',
            suspectedNCDDiseases:
              'Diabetes,Hypertension,Breast Cancer,Mental Health Disorder,Oral Cancer,Other',
          },
        }),
      );
      component.loadNursePatientDetails(ben(100));
      expect(component.cbacData).toEqual([
        'High Risk Pregnancy',
        'Tuberculosis',
        'Diabetes',
        'Hypertension',
        'Breast cancer',
        'Mental health disorder',
        'Oral cancer',
      ]);
      expect(benSvc.cbacData).toBe(component.cbacData);
      expect(confirm.confirmCBAC).toHaveBeenCalledWith(
        'info',
        LANGUAGE_EN.alerts.info.confirmtoProceedFurther,
        component.cbacData,
      );
      expect(session.setItem).toHaveBeenCalledWith('visitCode', 4);
      expect(router.navigate).toHaveBeenCalledWith([PATH, 1]);
    });

    it('CBAC with non-100 nurseFlag navigates without visit data', () => {
      benSvc.getCBACDetails.and.returnValue(
        of({ statusCode: 200, data: { benRegID: 1, suspectedTB: 'yes' } }),
      );
      component.loadNursePatientDetails(ben(2));
      expect(confirm.confirmCBAC).toHaveBeenCalled();
      expect(session.setItem).not.toHaveBeenCalledWith('visitCode', 4);
      expect(router.navigate).toHaveBeenCalledWith([PATH, 1]);
    });

    it('CBAC declined does not navigate', () => {
      confirm.confirmCBAC.and.returnValue(of(false));
      benSvc.getCBACDetails.and.returnValue(
        of({ statusCode: 200, data: { benRegID: 1, suspectedTB: 'yes' } }),
      );
      component.loadNursePatientDetails(ben(100));
      component.loadNursePatientDetails(ben(2));
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('suspected flags all "no" fall back to plain confirm', () => {
      benSvc.getCBACDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            benRegID: 1,
            suspectedNCD: 'no',
            suspectedHRP: 'no',
            suspectedTB: 'no',
            suspectedNCDDiseases: '',
          },
        }),
      );
      component.loadNursePatientDetails(ben(100));
      expect(component.cbacData).toBeNull();
      expect(confirm.confirmCBAC).not.toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith([PATH, 1]);
      expect(session.setItem).toHaveBeenCalledWith(
        'visitCategory',
        'NCD screening',
      );
    });

    it('non-200 alerts and nulls cbacData', () => {
      benSvc.getCBACDetails.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'err' }),
      );
      component.loadNursePatientDetails(ben(1));
      expect(confirm.alert).toHaveBeenCalledWith('err', 'error');
      expect(benSvc.cbacData).toBeNull();
    });

    it('http error alerts and nulls cbacData', () => {
      benSvc.getCBACDetails.and.returnValue(throwingObs('e'));
      component.loadNursePatientDetails(ben(1));
      expect(confirm.alert).toHaveBeenCalledWith('e', 'error');
      expect(component.cbacData).toBeNull();
    });
  });

  describe('loadNursePatientDetailsCBAC direct', () => {
    [
      [100, true],
      [100, false],
      [1, true],
      [1, false],
    ].forEach(([flag, ok]) => {
      it(`empty cbacData, nurseFlag ${flag}, confirm ${ok}`, () => {
        confirm.confirm.and.returnValue(of(ok));
        component.cbacData = [];
        component.loadNursePatientDetailsCBAC(ben(flag as number));
        expect(component.cbacData).toBeNull();
        expect(session.removeItem).toHaveBeenCalledWith('visitCategory');
        if (ok) {
          expect(router.navigate).toHaveBeenCalledWith([PATH, 1]);
        } else {
          expect(router.navigate).not.toHaveBeenCalled();
        }
        expect(
          session.setItem.calls
            .allArgs()
            .some((a: any[]) => a[0] === 'visitCode'),
        ).toBe(!!ok && flag === 100);
      });
    });
  });

  it('ngDoCheck re-assigns language', () => {
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });
});
