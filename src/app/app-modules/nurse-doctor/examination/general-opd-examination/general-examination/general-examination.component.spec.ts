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
import { FormBuilder } from '@angular/forms';
import { AmritTrackingService } from 'Common-UI/src/tracking';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
  createSessionStorageMock,
} from 'src/testing/test-utils';
import { MaterialModule } from 'src/app/app-modules/core/material.module';
import { GeneralUtils } from '../../../shared/utility/general-utility';
import { GeneralExaminationComponent } from './general-examination.component';

const SESSION = {
  serviceLineDetails: JSON.stringify({ facilityID: 1, parkingPlaceID: 2 }),
};

describe('GeneralExaminationComponent', () => {
  let component: GeneralExaminationComponent;
  let fixture: ComponentFixture<GeneralExaminationComponent>;
  let session: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [GeneralExaminationComponent],
      providers: [...commonTestProviders({ session: SESSION })],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(GeneralExaminationComponent);
    component = fixture.componentInstance;
    session = TestBed.inject(SessionStorageService);
    component.generalExaminationForm = new GeneralUtils(
      new FormBuilder(),
      createSessionStorageMock(SESSION) as any,
    ).createGeneralExaminationForm();
    fixture.detectChanges();
  });

  it('should create and load the language set', () => {
    expect(component).toBeTruthy();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  it('re-assigns the language set on ngDoCheck', () => {
    component.current_language_set = null;
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  describe('ngOnChanges', () => {
    it('hides ANC/QC fields when visiCategoryANC is ANC', () => {
      session.setItem('visiCategoryANC', 'ANC');
      component.ngOnChanges();
      expect(component.visitCategory).toBe('ANC');
      expect(component.hideForANCAndQC).toBeTrue();
    });

    it('hides ANC/QC fields when visitCategory is ANC', () => {
      session.setItem('visitCategory', 'ANC');
      component.ngOnChanges();
      expect(component.hideForANCAndQC).toBeTrue();
    });

    it('shows the fields for other categories', () => {
      component.hideForANCAndQC = true;
      session.setItem('visitCategory', 'General OPD');
      component.ngOnChanges();
      expect(component.hideForANCAndQC).toBeFalse();
    });
  });

  it('checkWithDangerSign clears the danger sign types', () => {
    component.generalExaminationForm.patchValue({
      typeOfDangerSigns: ['Grunt'],
    });
    component.checkWithDangerSign();
    expect(component.typeOfDangerSigns).toBeNull();
  });

  it('checkWithLymphadenopathy clears lymph node fields', () => {
    component.generalExaminationForm.patchValue({
      lymphnodesInvolved: ['Axillary LN'],
      typeOfLymphadenopathy: 'Soft',
    });
    component.checkWithLymphadenopathy();
    expect(component.lymphnodesInvolved).toBeNull();
    expect(component.typeOfLymphadenopathy).toBeNull();
  });

  it('checkWithEdema clears edema fields', () => {
    component.generalExaminationForm.patchValue({
      extentOfEdema: ['Foot'],
      edemaType: 'Pitting',
    });
    component.checkWithEdema();
    expect(component.extentOfEdema).toBeNull();
    expect(component.edemaType).toBeNull();
  });

  it('getters read the underlying form values', () => {
    component.generalExaminationForm.patchValue({
      dangerSigns: 'Yes',
      edema: 'Present',
      lymphadenopathy: 'Present',
      quickening: 'Yes',
      foetalMovements: 'Normal',
    });
    expect(component.dangerSigns).toBe('Yes');
    expect(component.edema).toBe('Present');
    expect(component.lymphadenopathy).toBe('Present');
    expect(component.Quickening).toBe('Yes');
    expect(component.FoetalMovements).toBe('Normal');
  });

  it('exposes the static option lists', () => {
    expect(component.selectConsciousness.length).toBe(3);
    expect(component.selectDangerSigns.length).toBe(13);
    expect(component.selectCooperation.length).toBe(3);
    expect(component.selectBuilt.length).toBe(3);
    expect(component.selectLymphNodes.length).toBe(4);
    expect(component.selectTypeOfLymphadenopathy.length).toBe(7);
    expect(component.selectExtentOfEdema.length).toBe(4);
  });

  it('tracks field interactions under "General Examination"', () => {
    const tracking = TestBed.inject(AmritTrackingService) as any;
    component.trackFieldInteraction('Pallor');
    expect(tracking.trackFieldInteraction).toHaveBeenCalledWith(
      'Pallor',
      'General Examination',
    );
  });
});
