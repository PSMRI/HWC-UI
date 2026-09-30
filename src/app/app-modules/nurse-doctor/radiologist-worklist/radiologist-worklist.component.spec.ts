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
import { RadiologistWorklistComponent } from './radiologist-worklist.component';
import { BeneficiaryDetailsService } from '../../core/services/beneficiary-details.service';
import { CameraService } from '../../core/services/camera.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { DoctorService } from '../shared/services/doctor.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

describe('RadiologistWorklistComponent', () => {
  let component: RadiologistWorklistComponent;
  let fixture: ComponentFixture<RadiologistWorklistComponent>;
  let doctorService: any;
  let benService: any;
  let camera: any;
  let confirm: any;
  let session: any;
  let router: Router;
  const info = LANGUAGE_EN.alerts.info;
  const ben = {
    benFlowID: 11,
    beneficiaryRegID: 22,
    beneficiaryID: 33,
    benVisitID: 44,
    visitCode: 55,
    doctorFlag: 1,
    nurseFlag: 9,
    pharmacist_flag: 0,
    VisitCategory: 'Cancer Screening',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [RadiologistWorklistComponent],
      providers: [
        ...commonTestProviders(),
        { provide: DoctorService, useValue: autoSpy(DoctorService) },
        {
          provide: BeneficiaryDetailsService,
          useValue: autoSpy(BeneficiaryDetailsService),
        },
        { provide: CameraService, useValue: autoSpy(CameraService) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(RadiologistWorklistComponent);
    component = fixture.componentInstance;
    doctorService = TestBed.inject(DoctorService);
    benService = TestBed.inject(BeneficiaryDetailsService);
    camera = TestBed.inject(CameraService);
    confirm = TestBed.inject(ConfirmationService);
    session = TestBed.inject(SessionStorageService);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    doctorService.getRadiologistWorklist.and.returnValue(
      of({
        statusCode: 200,
        data: [{ benName: 'Ravi', visitDate: '2024-01-02T09:00:00' }],
      }),
    );
  });

  it('renders and loads the worklist on init', () => {
    fixture.detectChanges();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(session.setItem).toHaveBeenCalledWith('currentRole', 'Radiologist');
    ['visitCode', 'beneficiaryGender', 'benFlowID', 'specialistFlag'].forEach(
      (k) => expect(session.removeItem).toHaveBeenCalledWith(k),
    );
    expect(doctorService.getRadiologistWorklist).toHaveBeenCalled();
    const row = component.dataSource.data[0];
    expect(row.sno).toBe(1);
    expect(row.genderName).toBe('Not Available');
    expect(row.visitDate).toContain('02-01-2024');
    expect(component.filterTerm).toBeNull();
  });

  it('ngOnDestroy removes current role', () => {
    component.ngOnDestroy();
    expect(session.removeItem).toHaveBeenCalledWith('currentRole');
  });

  it('ngDoCheck refreshes language', () => {
    component.currentLanguageSet = undefined;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });

  it('alerts and clears table on non-200 response', () => {
    component.dataSource.data = [{ a: 1 }];
    doctorService.getRadiologistWorklist.and.returnValue(
      of({ statusCode: 5000, errorMessage: 'bad' }),
    );
    component.loadWorklist();
    expect(confirm.alert).toHaveBeenCalledWith('bad', 'error');
    expect(component.dataSource.data).toEqual([]);
  });

  it('alerts when data is null', () => {
    doctorService.getRadiologistWorklist.and.returnValue(
      of({ statusCode: 200, data: null, errorMessage: 'none' }),
    );
    component.loadWorklist();
    expect(confirm.alert).toHaveBeenCalledWith('none', 'error');
  });

  it('alerts on error', () => {
    doctorService.getRadiologistWorklist.and.returnValue(throwingObs('e'));
    component.loadWorklist();
    expect(confirm.alert).toHaveBeenCalledWith('e', 'error');
  });

  it('pageChanged slices filtered list', () => {
    component.filteredBeneficiaryList = [1, 2, 3, 4, 5, 6];
    component.pageChanged({ page: 1, itemsPerPage: 5 });
    expect(component.pagedList).toEqual([1, 2, 3, 4, 5]);
  });

  describe('filterBeneficiaryList', () => {
    beforeEach(() => {
      component.beneficiaryList = [
        { benName: 'Ravi', statusMessage: 'sita' },
        { benName: 'Sita' },
      ];
    });
    it('resets for empty term', () => {
      component.filterBeneficiaryList('');
      expect(component.filteredBeneficiaryList.length).toBe(2);
    });
    it('matches searchable keys only (statusMessage excluded)', () => {
      component.filterBeneficiaryList('SITA');
      expect(component.filteredBeneficiaryList).toEqual([
        { benName: 'Sita', sno: 1 },
      ]);
    });
  });

  describe('patientImageView', () => {
    beforeEach(() => (component.currentLanguageSet = LANGUAGE_EN));
    it('views image', () => {
      benService.getBeneficiaryImage.and.returnValue(of({ benImage: 'img' }));
      component.patientImageView(1);
      expect(camera.viewImage).toHaveBeenCalledWith('img');
    });
    it('alerts when missing', () => {
      benService.getBeneficiaryImage.and.returnValue(of(null));
      component.patientImageView(1);
      expect(confirm.alert).toHaveBeenCalledWith(info.imageNotFound);
    });
  });

  describe('loadDoctorExaminationPage', () => {
    beforeEach(() => (component.currentLanguageSet = LANGUAGE_EN));

    it('opens the patient work area for fresh visits on confirm', () => {
      component.loadDoctorExaminationPage({ ...ben, visitFlowStatusFlag: 'N' });
      expect(confirm.confirm).toHaveBeenCalledWith(
        'info',
        info.confirmtoProceedFurther,
      );
      expect(session.setItem).toHaveBeenCalledWith('benFlowID', 11);
      expect(session.setItem).toHaveBeenCalledWith('visitCode', 55);
      expect(session.setItem).toHaveBeenCalledWith('visitID', 44);
      expect(session.setItem).toHaveBeenCalledWith('beneficiaryID', 33);
      expect(session.setItem).toHaveBeenCalledWith(
        'visitCategory',
        'Cancer Screening',
      );
      expect(router.navigate).toHaveBeenCalledWith([
        '/nurse-doctor/patient',
        22,
      ]);
    });

    it('does not navigate for fresh visit when declined', () => {
      confirm.confirm.and.returnValue(of(false));
      component.loadDoctorExaminationPage({ ...ben, visitFlowStatusFlag: 'N' });
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('opens the case sheet for completed visits on confirm', () => {
      component.loadDoctorExaminationPage({ ...ben, visitFlowStatusFlag: 'D' });
      expect(confirm.confirm).toHaveBeenCalledWith('info', info.consulation);
      expect(session.setItem).toHaveBeenCalledWith('caseSheetBenFlowID', 11);
      expect(session.setItem).toHaveBeenCalledWith(
        'caseSheetBeneficiaryRegID',
        22,
      );
      expect(session.setItem).toHaveBeenCalledWith('caseSheetVisitID', 44);
      expect(router.navigate).toHaveBeenCalledWith([
        '/nurse-doctor/print/TM/current',
      ]);
    });

    it('does not open case sheet when declined', () => {
      confirm.confirm.and.returnValue(of(false));
      component.loadDoctorExaminationPage({ ...ben, visitFlowStatusFlag: 'D' });
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });
});
