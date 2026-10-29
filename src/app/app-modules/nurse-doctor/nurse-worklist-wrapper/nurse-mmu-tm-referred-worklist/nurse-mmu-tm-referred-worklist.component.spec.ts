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
import { NurseMmuTmReferredWorklistComponent } from './nurse-mmu-tm-referred-worklist.component';

describe('NurseMmuTmReferredWorklistComponent', () => {
  let component: NurseMmuTmReferredWorklistComponent;
  let fixture: ComponentFixture<NurseMmuTmReferredWorklistComponent>;
  let nurse: any;
  let benSvc: any;
  let camera: any;
  let confirm: any;
  let session: any;
  let router: Router;
  const PATH = '/nurse-doctor/attendant/nurse/patient/';

  const list = () => [
    { beneficiaryID: 'B1', benName: 'Asha', benVisitNo: 1, fatherName: 'Raj' },
    { beneficiaryID: 'B2', benName: 'Ravi', benVisitNo: 2 },
  ];

  const ben = (nurseFlag: number) => ({
    nurseFlag,
    visitCode: 1,
    genderName: 'F',
    benVisitID: 2,
    beneficiaryRegID: 3,
    benFlowID: 4,
    beneficiaryID: 5,
    specialist_flag: 6,
    referredVisitCode: 7,
    VisitCategory: 'General',
    referred_visit_id: 8,
  });

  beforeEach(async () => {
    nurse = autoSpy(NurseService);
    nurse.getMMUNurseWorklist.and.returnValue(
      of({ statusCode: 200, data: list() }),
    );
    benSvc = autoSpy(BeneficiaryDetailsService);
    camera = autoSpy(CameraService);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [NurseMmuTmReferredWorklistComponent],
      providers: [
        ...commonTestProviders(),
        { provide: NurseService, useValue: nurse },
        { provide: BeneficiaryDetailsService, useValue: benSvc },
        { provide: CameraService, useValue: camera },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(NurseMmuTmReferredWorklistComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService) as any;
    session = TestBed.inject(SessionStorageService) as any;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();
  });

  it('ngOnInit sets role, clears visit keys, loads MMU list', () => {
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(session.setItem).toHaveBeenCalledWith('currentRole', 'Nurse');
    ['visitCat', 'mmuReferredVisitCode', 'referredVisitCode'].forEach((k) =>
      expect(session.removeItem).toHaveBeenCalledWith(k),
    );
    expect(benSvc.reset).toHaveBeenCalled();
    expect(component.beneficiaryList.length).toBe(2);
    expect(component.beneficiaryList[1].fatherName).toBe('Not Available');
    expect(component.beneficiaryList[1].sno).toBe(2);
    // current behaviour: table cleared after load
    expect(component.dataSource.data).toEqual([]);
  });

  it('getNurseWorklist alerts on non-200 and error', () => {
    nurse.getMMUNurseWorklist.and.returnValue(
      of({ statusCode: 5000, errorMessage: 'x' }),
    );
    component.getNurseWorklist();
    expect(confirm.alert).toHaveBeenCalledWith('x', 'error');
    nurse.getMMUNurseWorklist.and.returnValue(throwingObs('e'));
    component.getNurseWorklist();
    expect(confirm.alert).toHaveBeenCalledWith('e', 'error');
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
    benSvc.getBeneficiaryImage.and.returnValue(of(null));
    component.patientImageView(1);
    expect(confirm.alert).toHaveBeenCalledWith(
      LANGUAGE_EN.alerts.info.imageNotFound,
    );
  });

  describe('loadNursePatientDetails', () => {
    it('nurseFlag 100 stores NCD screening visit and navigates', () => {
      component.loadNursePatientDetails(ben(100));
      expect(session.removeItem).toHaveBeenCalledWith('visitReason');
      expect(session.setItem).toHaveBeenCalledWith(
        'visitCategory',
        'NCD screening',
      );
      expect(session.setItem).toHaveBeenCalledWith('visitCode', 1);
      expect(session.setItem).toHaveBeenCalledWith('visitID', 2);
      expect(session.setItem).toHaveBeenCalledWith('specialistFlag', 6);
      expect(router.navigate).toHaveBeenCalledWith([PATH, 3]);
    });

    it('other nurseFlag stores referred visit info and navigates', () => {
      component.loadNursePatientDetails(ben(1));
      expect(session.setItem).toHaveBeenCalledWith('visitCode', 7);
      expect(session.setItem).toHaveBeenCalledWith('visitCat', 'General');
      expect(session.setItem).toHaveBeenCalledWith('visitID', 8);
      expect(session.setItem).toHaveBeenCalledWith('mmuReferredVisitCode', 7);
      expect(router.navigate).toHaveBeenCalledWith([PATH, 3]);
    });

    it('declined confirmations do not navigate', () => {
      confirm.confirm.and.returnValue(of(false));
      component.loadNursePatientDetails(ben(100));
      component.loadNursePatientDetails(ben(1));
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('filterBeneficiaryList', () => {
    it('empty term restores list', () => {
      component.filterBeneficiaryList('');
      expect(component.dataSource.data.length).toBe(2);
    });
    it('matches father name', () => {
      component.filterBeneficiaryList('RAJ');
      expect(
        component.dataSource.data.map((b: any) => b.beneficiaryID),
      ).toEqual(['B1']);
      expect(component.dataSource.data[0].sno).toBe(1);
    });
    it('matches first visit / revisit', () => {
      component.filterBeneficiaryList('first');
      expect(
        component.filteredBeneficiaryList.map((b: any) => b.beneficiaryID),
      ).toEqual(['B1']);
      component.filterBeneficiaryList('revisit');
      expect(
        component.filteredBeneficiaryList.map((b: any) => b.beneficiaryID),
      ).toEqual(['B2']);
    });
    it('no match', () => {
      component.filterBeneficiaryList('qqqq');
      expect(component.filteredBeneficiaryList).toEqual([]);
    });
  });

  it('ngDoCheck re-assigns language', () => {
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });
});
