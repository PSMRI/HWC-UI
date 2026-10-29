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
import { RegistrarService } from 'src/app/app-modules/registrar/shared/services/registrar.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { NurseService } from '../../shared/services';
import { Nurse104RefferedWorklistComponent } from './nurse-104-reffered-worklist.component';

describe('Nurse104RefferedWorklistComponent', () => {
  let component: Nurse104RefferedWorklistComponent;
  let fixture: ComponentFixture<Nurse104RefferedWorklistComponent>;
  let nurse: any;
  let benSvc: any;
  let camera: any;
  let confirm: any;
  let session: any;
  let router: Router;

  const list = () => [
    {
      beneficiaryID: 'B1',
      benName: 'Asha',
      beneficiaryRegID: 1,
      benVisitNo: 1,
      referredFlag: true,
      age: '30',
    },
    {
      beneficiaryID: 'B2',
      benName: 'Ravi',
      beneficiaryRegID: 2,
      benVisitNo: 3,
    },
  ];

  beforeEach(async () => {
    nurse = autoSpy(NurseService);
    nurse.loadNursePatientDetails.and.returnValue(of(list()));
    benSvc = autoSpy(BeneficiaryDetailsService);
    camera = autoSpy(CameraService);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [Nurse104RefferedWorklistComponent],
      providers: [
        ...commonTestProviders({
          session: { serviceLineDetails: JSON.stringify({ facilityID: 12 }) },
        }),
        { provide: NurseService, useValue: nurse },
        { provide: BeneficiaryDetailsService, useValue: benSvc },
        { provide: CameraService, useValue: camera },
        { provide: RegistrarService, useValue: autoSpy(RegistrarService) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(Nurse104RefferedWorklistComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService) as any;
    session = TestBed.inject(SessionStorageService) as any;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();
  });

  it('ngOnInit sets role, resets and loads referred list by facility', () => {
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(session.setItem).toHaveBeenCalledWith('currentRole', 'Nurse');
    expect(benSvc.reset).toHaveBeenCalled();
    expect(nurse.loadNursePatientDetails).toHaveBeenCalledWith(12);
    expect(component.beneficiaryList.length).toBe(2);
    expect(component.beneficiaryList[1].genderName).toBe('Not Available');
    expect(component.beneficiaryList[1].referredFlag).toBe('Not Available');
    expect(component.beneficiaryList[0].sno).toBe(1);
    // current behaviour: table data is cleared after loading
    expect(component.dataSource.data).toEqual([]);
  });

  it('alerts on error', () => {
    nurse.loadNursePatientDetails.and.returnValue(throwingObs('e'));
    component.nurse104ReferredWorklistResponce();
    expect(confirm.alert).toHaveBeenCalledWith('e', 'error');
  });

  it('ngOnDestroy removes role', () => {
    component.ngOnDestroy();
    expect(session.removeItem).toHaveBeenCalledWith('currentRole');
  });

  it('removeBeneficiaryDataForNurseVisit clears keys', () => {
    component.removeBeneficiaryDataForNurseVisit();
    [
      'benCallID',
      'beneficiaryGender',
      'patientName',
      'patientAge',
      'referredFlag',
      'beneficiaryRegID',
      'beneficiaryID',
      'doctorFlag',
    ].forEach((k) => expect(session.removeItem).toHaveBeenCalledWith(k));
  });

  it('pageChanged slices', () => {
    component.pageChanged({ page: 2, itemsPerPage: 1 });
    expect(component.pagedList[0].beneficiaryID).toBe('B2');
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

  describe('loadNursePatientDetails', () => {
    const ben = {
      referredFlag: false,
      benCallID: 1,
      genderName: 'Female',
      benName: 'Asha',
      age: 30,
      beneficiaryRegID: 2,
      beneficiaryID: 3,
      benVisitNo: 1,
      benFlowID: 4,
    };

    it('stores 104 details and navigates when confirmed', () => {
      component.loadNursePatientDetails(ben);
      expect(session.setItem).toHaveBeenCalledWith('benCallID', 1);
      expect(session.setItem).toHaveBeenCalledWith('patientName', 'Asha');
      expect(session.setItem).toHaveBeenCalledWith('referredFlag', false);
      expect(session.setItem).toHaveBeenCalledWith('benFlowID', 4);
      expect(router.navigate).toHaveBeenCalledWith([
        '/nurse-doctor/attendant/nurse/104referredpatient/',
        2,
      ]);
    });

    it('does not navigate when declined', () => {
      confirm.confirm.and.returnValue(of(false));
      component.loadNursePatientDetails(ben);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('alerts consultation done when already referred', () => {
      component.loadNursePatientDetails({ referredFlag: true });
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.consultation_done,
      );
    });
  });

  describe('filterBeneficiaryList', () => {
    it('empty term restores list', () => {
      component.filterBeneficiaryList('');
      expect(component.dataSource.data.length).toBe(2);
      expect(component.dataSource.data[1].sno).toBe(2);
    });
    it('matches name / age', () => {
      component.filterBeneficiaryList('30');
      expect(
        component.filteredBeneficiaryList.map((b: any) => b.beneficiaryID),
      ).toEqual(['B1']);
    });
    it('matches first visit / revisit', () => {
      component.filterBeneficiaryList('first');
      expect(
        component.filteredBeneficiaryList.map((b: any) => b.beneficiaryID),
      ).toEqual(['B1']);
      component.filterBeneficiaryList('revisit');
      expect(
        component.dataSource.data.map((b: any) => b.beneficiaryID),
      ).toEqual(['B2']);
    });
    it('no match', () => {
      component.filterBeneficiaryList('zzzz');
      expect(component.filteredBeneficiaryList).toEqual([]);
    });
  });

  it('ngDoCheck re-assigns language', () => {
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });
});
