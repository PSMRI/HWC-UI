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

import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { BehaviorSubject, of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';
import { environment } from 'src/environments/environment';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { CommonService } from '../../core/services/common-services.service';
import { RegistrarService } from '../shared/services/registrar.service';
import { SearchDialogComponent } from './search-dialog.component';

describe('Registrar SearchDialogComponent', () => {
  let component: SearchDialogComponent;
  let fixture: ComponentFixture<SearchDialogComponent>;
  let registrar: any;
  let common: any;
  let confirm: any;
  let dialogRef: any;
  let session: any;
  let master: BehaviorSubject<any>;

  beforeEach(async () => {
    master = new BehaviorSubject<any>({
      genderMaster: [{ genderID: 1, genderName: 'Male' }],
      govIdEntityMaster: [{ id: 1 }],
      otherGovIdEntityMaster: [{ id: 2 }, { id: 3 }],
    });
    registrar = autoSpy(RegistrarService, {
      registrationMasterDetails$: master.asObservable(),
    });
    common = autoSpy(CommonService);
    await TestBed.configureTestingModule({
      imports: [
        ...COMMON_TEST_IMPORTS,
        MatSelectModule,
        MatInputModule,
        MatDatepickerModule,
        MatNativeDateModule,
      ],
      declarations: [SearchDialogComponent],
      providers: [
        ...commonTestProviders({
          session: {
            location: JSON.stringify({
              stateMaster: [{ stateID: 10, stateName: 'Karnataka' }],
            }),
          },
        }),
        { provide: RegistrarService, useValue: registrar },
        { provide: CommonService, useValue: common },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(SearchDialogComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    dialogRef = TestBed.inject(MatDialogRef);
    session = TestBed.inject(SessionStorageService);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('initialises form, master data, gov ids and states', () => {
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(registrar.getRegistrationMaster).toHaveBeenCalledWith(
      environment.countryId,
    );
    expect(component.govtIDs).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    expect(component.states).toEqual([{ stateID: 10, stateName: 'Karnataka' }]);
    expect(component.today instanceof Date).toBeTrue();
    expect(component.newSearchForm.valid).toBeFalse();
    expect(
      component.newSearchForm.controls['firstName'].hasError('required'),
    ).toBeTrue();
    expect(
      component.newSearchForm.controls['gender'].hasError('required'),
    ).toBeTrue();
    component.newSearchForm.patchValue({ firstName: 'Anil', gender: 1 });
    expect(
      component.newSearchForm.controls['firstName'].hasError('required'),
    ).toBeFalse();
    expect(component.newSearchForm.controls['gender'].valid).toBeTrue();
  });

  it('ignores null master data', () => {
    component.govtIDs = 'kept';
    master.next(null);
    expect(component.govtIDs).toBe('kept');
  });

  it('getStatesData leaves states unset without session location', () => {
    session.store.delete('location');
    component.states = undefined;
    component.getStatesData();
    expect(component.states).toBeUndefined();
  });

  it('resetBeneficiaryForm resets form and reloads states', () => {
    component.newSearchForm.patchValue({ firstName: 'A' });
    component.resetBeneficiaryForm();
    expect(component.newSearchForm.value.firstName).toBeNull();
    expect(component.states.length).toBe(1);
  });

  it('onStateChange loads districts and clears dependent ids', () => {
    registrar.getDistrictList.and.returnValue(
      of({ statusCode: 200, data: [{ districtID: 5 }] }),
    );
    component.districtID = 1;
    component.blockID = 2;
    component.villageID = 3;
    component.newSearchForm.patchValue({ stateID: 10 });
    component.onStateChange();
    expect(registrar.getDistrictList).toHaveBeenCalledWith(10);
    expect(component.districts).toEqual([{ districtID: 5 }]);
    expect(component.districtID).toBeNull();
    expect(component.blockID).toBeNull();
    expect(component.villageID).toBeNull();
  });

  it('onStateChange alerts and closes on failure', () => {
    registrar.getDistrictList.and.returnValue(of({ statusCode: 500 }));
    component.newSearchForm.patchValue({ stateID: 10 });
    component.onStateChange();
    expect(confirm.alert).toHaveBeenCalledWith(
      LANGUAGE_EN.alerts.info.issueFetching,
      'error',
    );
    expect(dialogRef.close).toHaveBeenCalledWith(false);
  });

  it('onStateChange does nothing without state', () => {
    component.onStateChange();
    expect(registrar.getDistrictList).not.toHaveBeenCalled();
  });

  it('getDistricts uses the common service', () => {
    common.getDistricts.and.returnValue(of([{ d: 1 }]));
    component.getDistricts(10);
    expect(common.getDistricts).toHaveBeenCalledWith(10);
    expect(component.districts).toEqual([{ d: 1 }]);
  });

  it('getSearchResult closes with the advance search payload', () => {
    component.getSearchResult({
      firstName: 'Asha',
      lastName: 'Rao',
      fatherName: 'Ravi',
      dob: 'd',
      gender: 2,
      stateID: 1,
      districtID: 2,
      blockID: 3,
      villageID: 4,
    });
    expect(dialogRef.close).toHaveBeenCalledWith({
      firstName: 'Asha',
      lastName: 'Rao',
      fatherName: 'Ravi',
      dob: 'd',
      genderID: 2,
      i_bendemographics: {
        stateID: 1,
        districtID: 2,
        blockID: 3,
        districtBranchID: 4,
      },
    });
  });

  it('onDistrictChange loads blocks for the selected district', () => {
    registrar.getSubDistrictList.and.returnValue(
      of({ statusCode: 200, data: [{ blockID: 1 }] }),
    );
    component.districtID = 7;
    component.blockID = 1;
    component.onDistrictChange();
    expect(registrar.getSubDistrictList).toHaveBeenCalledWith(7);
    expect(component.blockList).toEqual([{ blockID: 1 }]);
    expect(component.blockID).toBeNull();
  });

  it('onDistrictChange alerts on failure', () => {
    registrar.getSubDistrictList.and.returnValue(of(null));
    component.onDistrictChange();
    expect(confirm.alert).toHaveBeenCalledWith(
      LANGUAGE_EN.alerts.info.IssuesInFetchingDemographics,
      'error',
    );
  });

  it('onBlockChange loads villages or alerts', () => {
    registrar.getVillageList.and.returnValue(
      of({ statusCode: 200, data: [{ v: 1 }] }),
    );
    component.blockID = 3;
    component.villageID = 9;
    component.onBlockChange();
    expect(registrar.getVillageList).toHaveBeenCalledWith(3);
    expect(component.villageList).toEqual([{ v: 1 }]);
    expect(component.villageID).toBeNull();
    registrar.getVillageList.and.returnValue(of({ statusCode: 500 }));
    component.onBlockChange();
    expect(confirm.alert).toHaveBeenCalledWith(
      LANGUAGE_EN.alerts.info.IssuesInFetchingLocationDetails,
      'error',
    );
  });

  it('selectGender does not add a genderName control (compares to control object)', () => {
    component.newSearchForm.patchValue({ gender: 1 });
    component.selectGender();
    expect(component.newSearchForm.contains('genderName')).toBeFalse();
  });

  it('helpers: emptyState, onIDCardSelected, AfterViewChecked, ngDoCheck', () => {
    component.stateID = 1;
    component.emptyState();
    expect(component.stateID).toBeNull();
    component.onIDCardSelected();
    expect(() => component.AfterViewChecked()).not.toThrow();
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });
});
