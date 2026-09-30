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
import { ConfirmationService } from '../../core/services/confirmation.service';
import { BeneficiaryDetailsService } from '../../core/services/beneficiary-details.service';
import { CameraService } from '../../core/services/camera.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { LabService } from '../shared/services';
import { WorklistComponent } from './worklist.component';

describe('Lab WorklistComponent', () => {
  let component: WorklistComponent;
  let fixture: ComponentFixture<WorklistComponent>;
  let lab: any;
  let benSvc: any;
  let camera: any;
  let confirm: any;
  let session: any;
  let router: Router;

  const raw = () => [
    {
      beneficiaryID: 'B1',
      beneficiaryRegID: 1,
      benName: 'Asha',
      genderName: 'Female',
      benFlowID: 11,
      benVisitID: 21,
      visitDate: '2024-01-02T10:00:00',
      doctorFlag: 1,
      nurseFlag: 2,
      visitCode: 99,
      specialist_flag: 3,
    },
    {
      beneficiaryID: 'B2',
      beneficiaryRegID: 2,
      benName: 'Ravi',
      visitDate: '2024-01-03T10:00:00',
    },
  ];

  beforeEach(async () => {
    lab = autoSpy(LabService);
    lab.getLabWorklist.and.returnValue(of({ statusCode: 200, data: raw() }));
    benSvc = autoSpy(BeneficiaryDetailsService);
    camera = autoSpy(CameraService);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [WorklistComponent],
      providers: [
        ...commonTestProviders(),
        { provide: LabService, useValue: lab },
        { provide: BeneficiaryDetailsService, useValue: benSvc },
        { provide: CameraService, useValue: camera },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(WorklistComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService) as any;
    session = TestBed.inject(SessionStorageService) as any;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();
  });

  it('ngOnInit sets role, loads worklist, resets and clears visit data', () => {
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
    expect(session.setItem).toHaveBeenCalledWith(
      'currentRole',
      'Lab Technician',
    );
    expect(benSvc.reset).toHaveBeenCalled();
    expect(session.removeItem).toHaveBeenCalledWith('specialistFlag');
    expect(component.dataSource.data.length).toBe(2);
    expect(component.dataSource.data[1].sno).toBe(2);
  });

  it('loadDataToBenList maps and defaults fields', () => {
    const b = component.beneficiaryList[1];
    expect(b.genderName).toBe('Not Available');
    expect(b.preferredPhoneNum).toBe('Not Available');
    expect(b.visitDate).toBe('03-01-2024 10:00 AM ');
    expect(component.beneficiaryList[0].labObject.visitCode).toBe(99);
  });

  it('loadWorklist alerts on non-200', () => {
    lab.getLabWorklist.and.returnValue(
      of({ statusCode: 5000, errorMessage: 'bad' }),
    );
    component.loadWorklist();
    expect(confirm.alert).toHaveBeenCalledWith('bad', 'error');
    expect(component.dataSource.data).toEqual([]);
  });

  it('loadWorklist alerts on error', () => {
    lab.getLabWorklist.and.returnValue(throwingObs('e'));
    component.loadWorklist();
    expect(confirm.alert).toHaveBeenCalledWith('e', 'error');
  });

  it('loadWorklist ignores handled error', () => {
    lab.getLabWorklist.and.returnValue(throwingObs({ handled: true }));
    component.loadWorklist();
    expect(confirm.alert).not.toHaveBeenCalled();
  });

  it('ngOnDestroy removes role', () => {
    component.ngOnDestroy();
    expect(session.removeItem).toHaveBeenCalledWith('currentRole');
  });

  it('ngDoCheck reassigns language', () => {
    component.current_language_set = null;
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  describe('filterBeneficiaryList', () => {
    it('empty term restores full list and resets paging', () => {
      component.filterBeneficiaryList('');
      expect(component.filteredBeneficiaryList).toBe(component.beneficiaryList);
      expect(component.currentPage).toBe(1);
      expect(component.pagedList.length).toBe(2);
    });

    it('filters on matching term', () => {
      component.filterBeneficiaryList('ASHA');
      expect(component.filteredBeneficiaryList.length).toBe(1);
      expect(component.dataSource.data[0].beneficiaryID).toBe('B1');
      expect(component.pagedList.length).toBe(1);
    });

    it('no match yields empty', () => {
      component.filterBeneficiaryList('qqq');
      expect(component.filteredBeneficiaryList).toEqual([]);
    });
  });

  describe('patientImageView', () => {
    it('ignores empty id', () => {
      component.patientImageView(null);
      expect(benSvc.getBeneficiaryImage).not.toHaveBeenCalled();
    });
    it('views image', () => {
      benSvc.getBeneficiaryImage.and.returnValue(of({ benImage: 'x' }));
      component.patientImageView(1);
      expect(camera.viewImage).toHaveBeenCalledWith('x');
    });
    it('alerts when not found', () => {
      benSvc.getBeneficiaryImage.and.returnValue(of(null));
      component.patientImageView(1);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.imageNotFound,
      );
    });
  });

  describe('loadLabExaminationPage', () => {
    it('stores visit data and navigates when confirmed', () => {
      const ben = component.beneficiaryList[0];
      component.loadLabExaminationPage(ben);
      expect(session.setItem).toHaveBeenCalledWith('doctorFlag', 1);
      expect(session.setItem).toHaveBeenCalledWith('nurseFlag', 2);
      expect(session.setItem).toHaveBeenCalledWith('visitID', 21);
      expect(session.setItem).toHaveBeenCalledWith('benFlowID', 11);
      expect(session.setItem).toHaveBeenCalledWith('visitCode', 99);
      expect(session.setItem).toHaveBeenCalledWith('specialist_flag', 3);
      expect(router.navigate).toHaveBeenCalledWith(['/lab/patient/', 1]);
    });

    it('stores "null" specialist flag when absent', () => {
      component.loadLabExaminationPage(component.beneficiaryList[1]);
      expect(session.setItem).toHaveBeenCalledWith('specialist_flag', 'null');
    });

    it('does nothing when declined', () => {
      confirm.confirm.and.returnValue(of(false));
      component.loadLabExaminationPage(component.beneficiaryList[0]);
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });
});
