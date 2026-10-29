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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { CommonService } from '../../core/services/common-services.service';
import { RegistrarService } from '../shared/services/registrar.service';
import { FamilyTaggingService } from '../shared/services/familytagging.service';
import { SearchFamilyComponent } from './search-family.component';

describe('Registrar SearchFamilyComponent', () => {
  let component: SearchFamilyComponent;
  let fixture: ComponentFixture<SearchFamilyComponent>;
  let registrar: any;
  let family: any;
  let confirm: any;
  let dialogRef: any;

  async function setup(data: any) {
    registrar = autoSpy(RegistrarService, { stateIdFamily: 5 });
    registrar.getDistrictList.and.returnValue(
      of({ statusCode: 200, data: [{ districtID: 1 }] }),
    );
    registrar.getSubDistrictList.and.returnValue(
      of({ statusCode: 200, data: [{ blockID: 2 }] }),
    );
    registrar.getVillageList.and.returnValue(
      of({
        statusCode: 200,
        data: [
          { districtBranchID: 3, villageName: 'V3' },
          { districtBranchID: 4, villageName: 'V4' },
        ],
      }),
    );
    family = autoSpy(FamilyTaggingService);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MatSelectModule, MatInputModule],
      declarations: [SearchFamilyComponent],
      providers: [
        ...commonTestProviders(),
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: RegistrarService, useValue: registrar },
        { provide: FamilyTaggingService, useValue: family },
        { provide: CommonService, useValue: autoSpy(CommonService) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(SearchFamilyComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    dialogRef = TestBed.inject(MatDialogRef);
    fixture.detectChanges();
  }

  afterEach(() => fixture?.destroy());

  describe('with beneficiary data', () => {
    beforeEach(async () => {
      await setup({
        benSurname: 'Rao',
        benDistrictId: '1',
        benBlockId: '2',
        benVillageId: '3',
      });
    });

    it('prefills surname and cascades district/block/village', () => {
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(registrar.getDistrictList).toHaveBeenCalledWith(5);
      expect(registrar.getSubDistrictList).toHaveBeenCalledWith(1);
      expect(registrar.getVillageList).toHaveBeenCalledWith(2);
      expect(component.familySearchForm.value).toEqual({
        villageID: 3,
        districtID: 1,
        blockID: 2,
        surname: 'Rao',
        familyId: null,
      });
      expect(component.familySearchForm.valid).toBeTrue();
      expect(component.showProgressBar).toBeFalse();
      expect(component.districtList).toEqual([{ districtID: 1 }]);
      expect(component.blockList).toEqual([{ blockID: 2 }]);
    });

    it('getFamilySearchMaster closes with family details on success', () => {
      family.benFamilySearch.and.returnValue(
        of({ statusCode: 200, data: [{ familyId: 'F1' }] }),
      );
      component.familySearchForm.patchValue({ familyId: 'F1' });
      component.getFamilySearchMaster();
      const req = {
        villageId: 3,
        districtId: 1,
        blockId: 2,
        familyName: 'Rao',
        familyId: 'F1',
      };
      expect(family.benFamilySearch).toHaveBeenCalledWith(req);
      expect(dialogRef.close).toHaveBeenCalledWith({
        familyDetails: [{ familyId: 'F1' }],
        searchRequest: req,
      });
    });

    it('getFamilySearchMaster alerts and closes with null when no record', () => {
      family.benFamilySearch.and.returnValue(
        of({ statusCode: 200, data: { response: 'No record' } }),
      );
      component.getFamilySearchMaster();
      expect(confirm.alert).toHaveBeenCalledWith('No record', 'info');
      expect(dialogRef.close).toHaveBeenCalledWith(null);
    });

    it('startSearch on Enter searches only when form is valid', () => {
      spyOn(component, 'getFamilySearchMaster');
      component.startSearch({ code: 'KeyA' } as KeyboardEvent);
      expect(component.getFamilySearchMaster).not.toHaveBeenCalled();
      component.startSearch({ code: 'Enter' } as KeyboardEvent);
      expect(component.getFamilySearchMaster).toHaveBeenCalledTimes(1);
      component.familySearchForm.patchValue({ surname: null });
      component.startSearch({ code: 'Enter' } as KeyboardEvent);
      expect(component.getFamilySearchMaster).toHaveBeenCalledTimes(1);
    });

    it('onDistrictChange reloads blocks and clears block/village', () => {
      component.onDistrictChange();
      expect(registrar.getSubDistrictList).toHaveBeenCalledTimes(2);
      expect(component.familySearchForm.value.blockID).toBeNull();
      expect(component.familySearchForm.value.villageID).toBeNull();
    });

    it('fetchBlockSelection alerts on failure', () => {
      registrar.getSubDistrictList.and.returnValue(of({ statusCode: 500 }));
      component.fetchBlockSelection();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.IssuesInFetchingDemographics,
        'error',
      );
    });

    it('onBlockChange reloads villages and clears village', () => {
      component.onBlockChange();
      expect(component.villageList.length).toBe(2);
      expect(component.familySearchForm.value.villageID).toBeNull();
    });

    it('onBlockChange alerts on failure', () => {
      registrar.getVillageList.and.returnValue(of(null));
      component.onBlockChange();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.IssuesInFetchingLocationDetails,
        'error',
      );
    });

    it('onVillageChange looks up the selected village', () => {
      component.familySearchForm.patchValue({ villageID: 4 });
      spyOn(component.familySearchForm, 'patchValue').and.callThrough();
      component.onVillageChange();
      expect(component.familySearchForm.patchValue).toHaveBeenCalledWith({
        villageName: 'V4',
      });
    });

    it('emptyState, onClose, getSearchResult and ngDoCheck', () => {
      component.emptyState();
      component.onClose();
      expect(dialogRef.close).toHaveBeenCalledWith();
      component.getSearchResult({ village: 9 });
      expect(component.dataObj).toEqual({ villageID: 9 });
      component.currentLanguageSet = null;
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });
  });

  describe('without beneficiary surname', () => {
    beforeEach(async () => {
      await setup({ benSurname: 'null' });
    });

    it('leaves surname empty and form invalid', () => {
      expect(component.familySearchForm.value.surname).toBeNull();
      expect(isNaN(component.benDistrictId)).toBeTrue();
      expect(component.familySearchForm.valid).toBeFalse();
    });

    it('alerts when district fetch fails', () => {
      registrar.getDistrictList.and.returnValue(of({ statusCode: 500 }));
      component.fetchDistrictsOnStateSelection();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.IssuesInFetchingDemographics,
        'error',
      );
    });

    it('alerts when initial block fetch fails', () => {
      registrar.getSubDistrictList.and.returnValue(of({ statusCode: 500 }));
      component.fetchBlockSelectionInitial();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.IssuesInFetchingDemographics,
        'error',
      );
    });

    it('alerts when initial village fetch fails', () => {
      registrar.getVillageList.and.returnValue(of({ statusCode: 500 }));
      component.onBlockChangeInitial();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.IssuesInFetchingLocationDetails,
        'error',
      );
    });
  });

  describe('with null dialog data', () => {
    beforeEach(async () => {
      await setup(null);
    });

    it('still loads districts with null ids', () => {
      expect(registrar.getDistrictList).toHaveBeenCalledWith(5);
      expect(component.benDistrictId).toBeUndefined();
      expect(component.familySearchForm.value.districtID).toBeNull();
      expect(component.familySearchForm.value.blockID).toBeNull();
      expect(component.familySearchForm.value.villageID).toBeNull();
    });
  });
});
