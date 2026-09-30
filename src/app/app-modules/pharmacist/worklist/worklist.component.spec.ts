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
  fakeAsync,
  tick,
} from '@angular/core/testing';
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
import { InventoryService } from '../../core/services/inventory.service';
import { RegistrarService } from '../../registrar/shared/services/registrar.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { PharmacistService } from '../shared/services/pharmacist.service';
import { WorklistComponent } from './worklist.component';

describe('Pharmacist WorklistComponent', () => {
  let component: WorklistComponent;
  let fixture: ComponentFixture<WorklistComponent>;
  let pharma: any;
  let benSvc: any;
  let camera: any;
  let inventory: any;
  let registrar: any;
  let confirm: any;
  let session: any;

  const list = () => [
    {
      beneficiaryID: 'B1',
      benName: 'Asha',
      beneficiaryRegID: 1,
      visitDate: '2024-01-02T10:00:00',
      benVisitDate: '2024-01-02T10:00:00',
      age: '30',
      genderName: 'Female',
    },
    {
      beneficiaryID: 'B2',
      benName: 'Ravi',
      beneficiaryRegID: 2,
      visitDate: '2024-01-03T10:00:00',
      benVisitDate: '2024-01-03T10:00:00',
    },
  ];

  beforeEach(async () => {
    pharma = autoSpy(PharmacistService);
    pharma.getPharmacistWorklist.and.returnValue(
      of({ statusCode: 200, data: list() }),
    );
    benSvc = autoSpy(BeneficiaryDetailsService);
    benSvc.reset.and.returnValue(undefined);
    camera = autoSpy(CameraService);
    inventory = autoSpy(InventoryService);
    inventory.moveToInventory.and.returnValue(undefined);
    registrar = autoSpy(RegistrarService);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [WorklistComponent],
      providers: [
        ...commonTestProviders(),
        { provide: PharmacistService, useValue: pharma },
        { provide: BeneficiaryDetailsService, useValue: benSvc },
        { provide: CameraService, useValue: camera },
        { provide: InventoryService, useValue: inventory },
        { provide: RegistrarService, useValue: registrar },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(WorklistComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService) as any;
    session = TestBed.inject(SessionStorageService) as any;
    fixture.detectChanges();
  });

  afterEach(() => sessionStorage.removeItem('setLanguage'));

  it('ngOnInit sets role, clears visit data, loads list and resets ben details', () => {
    expect(session.setItem).toHaveBeenCalledWith('currentRole', 'Pharmacist');
    expect(session.removeItem).toHaveBeenCalledWith('visitCode');
    expect(session.removeItem).toHaveBeenCalledWith('pharmacist_flag');
    expect(benSvc.reset).toHaveBeenCalled();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
    expect(component.dataSource.data.length).toBe(2);
    expect(component.dataSource.data[1].sno).toBe(2);
    expect(component.filterTerm).toBeNull();
  });

  it('loadDataToBenList fills defaults and formats dates', () => {
    const b = component.beneficiaryList[1];
    expect(b.genderName).toBe('Not Available');
    expect(b.age).toBe('Not Available');
    expect(b.districtName).toBe('Not Available');
    expect(b.visitDate).toBe('03-01-2024 10:00 AM ');
    expect(component.beneficiaryList[0].genderName).toBe('Female');
  });

  it('loadPharmaWorklist alerts and clears on non-200', () => {
    pharma.getPharmacistWorklist.and.returnValue(
      of({ statusCode: 5000, errorMessage: 'nope' }),
    );
    component.loadPharmaWorklist();
    expect(confirm.alert).toHaveBeenCalledWith('nope', 'error');
    expect(component.dataSource.data).toEqual([]);
  });

  it('loadPharmaWorklist alerts on unhandled error', () => {
    pharma.getPharmacistWorklist.and.returnValue(throwingObs('err'));
    component.loadPharmaWorklist();
    expect(confirm.alert).toHaveBeenCalledWith('err', 'error');
  });

  it('loadPharmaWorklist stays silent on handled error', () => {
    pharma.getPharmacistWorklist.and.returnValue(
      throwingObs({ handled: true }),
    );
    component.loadPharmaWorklist();
    expect(confirm.alert).not.toHaveBeenCalled();
  });

  it('ngOnDestroy removes currentRole', () => {
    component.ngOnDestroy();
    expect(session.removeItem).toHaveBeenCalledWith('currentRole');
  });

  it('ngDoCheck re-assigns language', () => {
    component.current_language_set = null;
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  it('pageChanged slices filtered list', () => {
    component.pageChanged({ page: 2, itemsPerPage: 1 });
    expect(component.pagedList.map((b: any) => b.beneficiaryID)).toEqual([
      'B2',
    ]);
  });

  describe('filterBeneficiaryList', () => {
    it('restores full list for empty term', () => {
      component.filteredBeneficiaryList = [];
      component.filterBeneficiaryList('');
      expect(component.filteredBeneficiaryList).toBe(component.beneficiaryList);
    });

    it('filters by matching fields case-insensitively', () => {
      component.filterBeneficiaryList('ravi');
      expect(component.filteredBeneficiaryList.length).toBe(1);
      expect(component.dataSource.data[0].beneficiaryID).toBe('B2');
      expect(component.dataSource.data[0].sno).toBe(1);
    });

    it('returns empty for no matches', () => {
      component.filterBeneficiaryList('zzz');
      expect(component.filteredBeneficiaryList).toEqual([]);
    });
  });

  describe('patientImageView', () => {
    it('skips when no id', () => {
      component.patientImageView('');
      expect(benSvc.getBeneficiaryImage).not.toHaveBeenCalled();
    });

    it('shows image when present', () => {
      benSvc.getBeneficiaryImage.and.returnValue(of({ benImage: 'img' }));
      component.patientImageView(5);
      expect(benSvc.getBeneficiaryImage).toHaveBeenCalledWith(5);
      expect(camera.viewImage).toHaveBeenCalledWith('img');
    });

    it('alerts when image missing', () => {
      benSvc.getBeneficiaryImage.and.returnValue(of({}));
      component.patientImageView(5);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.imageNotFound,
      );
    });
  });

  describe('loadPharmaPage', () => {
    const ben = {
      beneficiaryID: 'B1',
      visitCode: 'V1',
      benFlowID: 'F1',
      beneficiaryRegID: 1,
    };

    it('collects health IDs and moves to inventory after confirm', fakeAsync(() => {
      registrar.getHealthIdDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            BenHealthDetails: [
              { healthId: 'h1' },
              { healthId: null },
              { healthId: 'h2' },
            ],
          },
        }),
      );
      component.loadPharmaPage(ben);
      expect(registrar.getHealthIdDetails).toHaveBeenCalledWith({
        beneficiaryRegID: 1,
        beneficiaryID: null,
      });
      expect(component.healthIDArray).toEqual(['h1,', 'h2']);
      expect(component.healthIDValue).toBe('h1,h2');
      tick(500);
      expect(inventory.moveToInventory).toHaveBeenCalledWith(
        'B1',
        'V1',
        'F1',
        1,
        'English',
        'h1,h2',
      );
    }));

    it('handles null BenHealthDetails and uses session language', fakeAsync(() => {
      sessionStorage.setItem('setLanguage', 'Hindi');
      registrar.getHealthIdDetails.and.returnValue(
        of({ statusCode: 200, data: { BenHealthDetails: null } }),
      );
      component.loadPharmaPage(ben);
      expect(component.healthIDValue).toBe('');
      tick(500);
      expect(inventory.moveToInventory).toHaveBeenCalledWith(
        'B1',
        'V1',
        'F1',
        1,
        'Hindi',
        '',
      );
    }));

    it('handles empty BenHealthDetails array', fakeAsync(() => {
      registrar.getHealthIdDetails.and.returnValue(
        of({ statusCode: 200, data: { BenHealthDetails: [] } }),
      );
      component.loadPharmaPage(ben);
      expect(component.healthIDArray).toEqual([]);
      tick(500);
    }));

    it('alerts on non-200 and does not move when not confirmed', fakeAsync(() => {
      registrar.getHealthIdDetails.and.returnValue(of({ statusCode: 5000 }));
      confirm.confirm.and.returnValue(of(false));
      component.loadPharmaPage(ben);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.issueInGettingBeneficiaryABHADetails,
        'error',
      );
      tick(500);
      expect(confirm.confirm).toHaveBeenCalledWith(
        'info',
        LANGUAGE_EN.alerts.info.confirmtoProceedFurther,
      );
      expect(inventory.moveToInventory).not.toHaveBeenCalled();
    }));

    it('alerts on error', fakeAsync(() => {
      registrar.getHealthIdDetails.and.returnValue(throwingObs());
      component.loadPharmaPage(ben);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.issueInGettingBeneficiaryABHADetails,
        'error',
      );
      tick(500);
    }));
  });
});
