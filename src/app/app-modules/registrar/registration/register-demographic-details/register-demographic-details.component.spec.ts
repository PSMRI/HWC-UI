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
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { RegisterDemographicDetailsComponent } from './register-demographic-details.component';
import { RegistrarService } from '../../shared/services/registrar.service';
import { RegistrationUtils } from '../../shared/utility/registration-utility';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { MaterialModule } from '../../../core/material.module';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';

const DISTRICT = {
  districtID: 10,
  districtName: 'Bengaluru',
  blockId: 100,
  blockName: 'North',
  villageList: [{ districtBranchID: 1000, villageName: 'Hebbal' }],
};

function location(overrides: any = {}) {
  return {
    stateMaster: [
      { stateID: 1, stateName: 'Karnataka' },
      { stateID: 2, stateName: 'Kerala' },
    ],
    otherLoc: {
      stateID: 1,
      stateName: 'Karnataka',
      districtList: [DISTRICT],
      zoneID: 3,
      zoneName: 'Z',
      parkingPlaceID: 4,
      parkingPlaceName: 'PP',
    },
    ...overrides,
  };
}

const EDIT_DATA = {
  beneficiaryID: 77,
  i_bendemographics: {
    habitation: 'H',
    addressLine1: 'A1',
    addressLine2: 'A2',
    addressLine3: 'A3',
    pinCode: '560001',
    m_state: { stateID: 2, stateName: 'Kerala', stateCode: 'KL' },
    m_district: { districtID: 20, districtName: 'Kochi' },
    m_districtblock: { blockID: 200, blockName: 'Blk' },
    m_districtbranchmapping: { districtBranchID: 2000, villageName: 'Vil' },
    zoneID: 5,
    zoneName: 'ZN',
    parkingPlaceID: 6,
    parkingPlaceName: 'PPN',
    servicePointID: 7,
    servicePointName: 'SPN',
  },
};

describe('RegisterDemographicDetailsComponent', () => {
  let fixture: ComponentFixture<RegisterDemographicDetailsComponent>;
  let component: RegisterDemographicDetailsComponent;
  let registrar: any;
  let confirmation: any;
  let router: Router;
  let form: FormGroup;

  async function setup(
    opts: { revisit?: boolean; loc?: any; edit?: any } = {},
  ) {
    registrar = autoSpy(RegistrarService, {
      registrationMasterDetails$: new BehaviorSubject<any>({ m: 1 }),
      beneficiaryEditDetails$: new BehaviorSubject<any>(opts.edit ?? null),
      districtList$: new BehaviorSubject<any>([{ districtID: 1 }]),
      subDistrictList$: new BehaviorSubject<any>([{ blockID: 1 }]),
      dialogResult$: new BehaviorSubject<any>(null),
      stateIdFamily: 'unset',
    });
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [RegisterDemographicDetailsComponent],
      providers: [
        ...commonTestProviders({
          session: {
            location: JSON.stringify(opts.loc ?? location()),
            servicePointID: 8,
            servicePointName: 'SP',
          },
        }),
        { provide: RegistrarService, useValue: registrar },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(RegisterDemographicDetailsComponent);
    component = fixture.componentInstance;
    form = new RegistrationUtils(
      new FormBuilder(),
    ).createDemographicDetailsForm();
    component.demographicDetailsForm = form;
    component.patientRevisit = !!opts.revisit;
    confirmation = TestBed.inject(ConfirmationService);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();
  }

  describe('new beneficiary with full location', () => {
    beforeEach(async () => setup());

    it('loads language, masters and district lists', () => {
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.demographicsEditText).toBe(
        LANGUAGE_EN.bendetails.editLocation,
      );
      expect(component.masterData).toEqual({ m: 1 });
      expect(component.subDistrictList).toEqual([
        { blockID: 100, blockName: 'North' },
      ]);
    });

    it('patches location defaults from storage', () => {
      expect(form.value).toEqual(
        jasmine.objectContaining({
          stateID: 1,
          stateName: 'Karnataka',
          districtID: 10,
          districtName: 'Bengaluru',
          blockID: 100,
          blockName: 'North',
          villageID: 1000,
          villageName: 'Hebbal',
          zoneID: 3,
          zoneName: 'Z',
          parkingPlace: 4,
          parkingPlaceName: 'PP',
          servicePoint: 8,
          servicePointName: 'SP',
        }),
      );
      expect(registrar.stateIdFamily).toBe(1);
      expect(component.districtList).toEqual([DISTRICT]);
      expect(component.disableDistrict).toBeFalse();
    });

    it('reacts to district list updates from the service', () => {
      registrar.districtList$.next([{ districtID: 99 }]);
      expect(component.districtList).toEqual([{ districtID: 99 }]);
      registrar.subDistrictList$.next([{ blockID: 9 }]);
      expect(component.subDistrictList).toEqual([{ blockID: 9 }]);
    });

    it('patches state and pincode from an ABHA result', () => {
      registrar.getDistrictList.and.returnValue(
        of({
          statusCode: 200,
          data: [{ districtID: 30, districtName: 'Mysuru' }],
        }),
      );
      registrar.getSubDistrictList.and.returnValue(
        of({ statusCode: 200, data: [{ blockID: 1 }] }),
      );
      registrar.dialogResult$.next({
        address: { State: 'kerala', District: 'MYSURU', PinCode: '570001' },
      });
      expect(component.abhaSearchResponse).toBeTruthy();
      expect(form.value.stateID).toBe(2);
      expect(registrar.stateIdFamily).toBe(2);
      expect(registrar.getDistrictList).toHaveBeenCalledWith(2);
      expect(form.value.districtID).toBe(30);
      expect(form.value.districtName).toBe('Mysuru');
      expect(registrar.getSubDistrictList).toHaveBeenCalledWith(30);
      expect(form.value.pincode).toBe('570001');
    });

    it('ngOnDestroy unsubscribes', () => {
      const subs = [
        component.masterDataSubscription,
        component.personalDataOnHealthIDSubscription,
      ];
      component.ngOnDestroy();
      subs.forEach((s) => expect(s.closed).toBeTrue());
    });

    it('setDemographicDefaults reloads storage defaults', () => {
      form.reset();
      component.setDemographicDefaults();
      expect(form.value.stateID).toBe(1);
      expect(component.disableState).toBeTrue();
    });

    it('locationErrors alerts and navigates to search', () => {
      component.locationErrors();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.IssuesinfetchingLocation,
        'error',
      );
      expect(router.navigate).toHaveBeenCalledWith(['/registrar/search/']);
    });

    it('chooseLocations offers the state level', () => {
      expect(component.chooseLocations()).toEqual([
        { id: 3, name: LANGUAGE_EN.ro.locInfo.state },
      ]);
    });

    describe('confirmEditDemographics', () => {
      it('enables state editing when state level chosen', () => {
        confirmation.choice.and.returnValue(of(3));
        component.confirmEditDemographics({ checked: true });
        expect(component.demographicsEditEnabled).toBeTrue();
        expect(component.demographicsEditText).toBe(
          LANGUAGE_EN.common.RestoreDefault,
        );
        expect(component.disableState).toBeFalse();
        expect(form.value.stateID).toBeNull();
        expect(registrar.stateIdFamily).toBeNull();
        expect(component.districtList).toEqual([]);
      });

      it('reverts when no choice made', () => {
        confirmation.choice.and.returnValue(of(null));
        component.confirmEditDemographics({ checked: true });
        expect(component.demographicsEditEnabled).toBeFalse();
        expect(component.demographicsEditText).toBe(
          LANGUAGE_EN.bendetails.editLocation,
        );
      });

      it('restores defaults when unchecked and confirmed', () => {
        spyOn(component, 'setDemographicDefaults');
        component.confirmEditDemographics({ checked: false });
        expect(component.demographicsEditEnabled).toBeFalse();
        expect(component.setDemographicDefaults).toHaveBeenCalled();
        expect(component.demographicsEditText).toBe(
          LANGUAGE_EN.bendetails.editLocation,
        );
      });

      it('keeps editing when unchecking is declined', () => {
        confirmation.confirm.and.returnValue(of(false));
        component.confirmEditDemographics({ checked: false });
        expect(component.demographicsEditEnabled).toBeTrue();
        expect(component.demographicsEditText).toBe(
          LANGUAGE_EN.common.RestoreDefault,
        );
      });
    });

    describe('editReConfig', () => {
      it('1 enables up to taluk and reloads sub districts', () => {
        registrar.getSubDistrictList.and.returnValue(
          of({ statusCode: 200, data: [{ blockID: 5 }] }),
        );
        component.editReConfig(1);
        expect(component.villageList).toEqual([]);
        expect(component.disableSubDistrict).toBeFalse();
        expect(registrar.getSubDistrictList).toHaveBeenCalledWith(10);
        expect(component.subDistrictList).toEqual([{ blockID: 5 }]);
        expect(form.value.blockID).toBeNull();
      });

      it('2 enables up to district and reloads districts', () => {
        registrar.getDistrictList.and.returnValue(
          of({ statusCode: 200, data: [{ districtID: 1 }] }),
        );
        component.editReConfig(2);
        expect(component.disableDistrict).toBeFalse();
        expect(registrar.getDistrictList).toHaveBeenCalledWith(1);
        expect(component.districtList).toEqual([{ districtID: 1 }]);
        expect(form.value.districtID).toBeNull();
      });

      it('unknown option changes nothing', () => {
        const before = form.value;
        component.editReConfig(9);
        expect(form.value).toEqual(before);
      });
    });

    describe('location change handlers', () => {
      it('fetchDistrictsOnStateSelection alerts on failure', () => {
        registrar.getDistrictList.and.returnValue(of({ statusCode: 500 }));
        component.fetchDistrictsOnStateSelection();
        expect(confirmation.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.alerts.info.IssuesInFetchingDemographics,
          'error',
        );
      });

      it('fetchSubDistrictsOnDistrictSelection alerts on failure', () => {
        registrar.getSubDistrictList.and.returnValue(of(null));
        component.fetchSubDistrictsOnDistrictSelection();
        expect(confirmation.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.alerts.info.IssuesInFetchingDemographics,
          'error',
        );
      });

      it('onSubDistrictChange loads villages or alerts', () => {
        registrar.getVillageList.and.returnValue(
          of({
            statusCode: 200,
            data: [{ districtBranchID: 1, villageName: 'V1' }],
          }),
        );
        component.onSubDistrictChange();
        expect(registrar.getVillageList).toHaveBeenCalledWith(100);
        expect(component.villageList).toEqual([
          { districtBranchID: 1, villageName: 'V1' },
        ]);
        expect(form.value.villageID).toBeNull();

        registrar.getVillageList.and.returnValue(of({ statusCode: 500 }));
        component.onSubDistrictChange();
        expect(confirmation.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.alerts.info.IssuesInFetchingLocationDetails,
          'error',
        );
      });

      it('onVillageChange updates the village name', () => {
        component.villageList = [{ districtBranchID: 5, villageName: 'Five' }];
        form.patchValue({ villageID: 5 });
        component.onVillageChange();
        expect(form.value.villageName).toBe('Five');
      });

      it('stateChangeOnLoad cascades using locationData', () => {
        component.statesList = location().stateMaster;
        component.locationData = {
          districtID: 10,
          districtName: 'Bengaluru',
          blockID: 100,
          blockName: 'North',
          subDistrictID: 1000,
          villageName: 'Hebbal',
        };
        registrar.getDistrictList.and.returnValue(
          of({
            statusCode: 200,
            data: [{ districtID: 10, districtName: 'Bengaluru' }],
          }),
        );
        registrar.getSubDistrictList.and.returnValue(
          of({ statusCode: 200, data: [{ blockID: 100, blockName: 'North' }] }),
        );
        registrar.getVillageList.and.returnValue(
          of({
            statusCode: 200,
            data: [{ districtBranchID: 1000, villageName: 'Hebbal' }],
          }),
        );
        form.patchValue({ stateID: 1 });
        component.stateChangeOnLoad();
        expect(form.value).toEqual(
          jasmine.objectContaining({
            districtID: 10,
            blockID: 100,
            villageID: 1000,
            villageName: 'Hebbal',
          }),
        );
      });

      it('stateChangeOnLoad and on-load cascades alert on failure', () => {
        component.statesList = [];
        component.locationData = {};
        registrar.getDistrictList.and.returnValue(of({ statusCode: 500 }));
        component.stateChangeOnLoad();
        registrar.getSubDistrictList.and.returnValue(of({ statusCode: 500 }));
        component.onDistrictChangeOnLoad();
        registrar.getVillageList.and.returnValue(of({ statusCode: 500 }));
        component.onSubDistrictOnLoad();
        expect(confirmation.alert).toHaveBeenCalledTimes(3);
        expect(confirmation.alert.calls.argsFor(2)).toEqual([
          LANGUAGE_EN.alerts.info.IssuesInFetchingLocationDetails,
          'error',
        ]);
      });

      it('updateDistrictName / updateStateName ignore null values', () => {
        const before = form.value;
        component.updateDistrictName(null);
        component.updateStateName(undefined);
        expect(form.value).toEqual(before);
      });

      it('updateDistrictName / updateStateName match by id', () => {
        component.districtList = [{ districtID: 44, districtName: 'Forty' }];
        component.statesList = [{ stateID: 2, stateName: 'Kerala' }];
        component.updateDistrictName(44);
        component.updateStateName(2);
        expect(form.value.districtName).toBe('Forty');
        expect(form.value.stateName).toBe('Kerala');
        expect(registrar.stateIdFamily).toBe(2);
      });
    });
  });

  describe('new beneficiary with multiple villages', () => {
    beforeEach(async () =>
      setup({
        loc: location({
          otherLoc: {
            ...location().otherLoc,
            districtList: [
              {
                ...DISTRICT,
                villageList: [
                  { districtBranchID: 1, villageName: 'a' },
                  { districtBranchID: 2, villageName: 'b' },
                ],
              },
            ],
          },
        }),
      }),
    );

    it('does not auto-select a village', () => {
      expect(component.villageList.length).toBe(2);
      expect(form.value.villageID).toBeNull();
      expect(form.value.districtID).toBe(10);
    });
  });

  describe('new beneficiary with only state master', () => {
    beforeEach(async () =>
      setup({ loc: { stateMaster: [{ stateID: 1, stateName: 'K' }] } }),
    );

    it('lists states and clears the cascade', () => {
      expect(component.statesList).toEqual([{ stateID: 1, stateName: 'K' }]);
      expect(component.districtList).toEqual([]);
      expect(component.subDistrictList).toEqual([]);
      expect(component.villageList).toEqual([]);
      expect(form.value.stateID).toBeNull();
      expect(form.value.servicePoint).toBe(8);
      expect(registrar.stateIdFamily).toBeNull();
    });
  });

  describe('new beneficiary without location masters', () => {
    beforeEach(async () => setup({ loc: {} }));

    it('leaves the form untouched', () => {
      expect(component.statesList).toBeUndefined();
      expect(form.value.servicePoint).toBeNull();
      expect(component.demographicsMaster.servicePointID).toBe(8);
    });
  });

  describe('edit beneficiary', () => {
    beforeEach(async () => setup({ revisit: true, edit: EDIT_DATA }));

    it('loads the beneficiary location for editing', () => {
      expect(component.revisitData).toEqual(EDIT_DATA);
      expect(component.statesList).toEqual(location().stateMaster);
      expect(form.value).toEqual(
        jasmine.objectContaining({
          habitation: 'H',
          addressLine1: 'A1',
          addressLine2: 'A2',
          addressLine3: 'A3',
          pincode: '560001',
          stateID: 2,
          stateCode: 'KL',
          districtID: 20,
          blockID: 200,
          villageID: 2000,
          zoneID: 5,
          parkingPlace: 6,
          servicePoint: 7,
          servicePointName: 'SPN',
        }),
      );
      expect(registrar.stateIdFamily).toBe(2);
      expect(component.disableSubDistrict).toBeTrue();
      expect(component.districtList).toEqual([
        { districtID: 20, districtName: 'Kochi' },
      ]);
    });

    it('falls back to nulls for missing edit details', () => {
      component.revisitData = { i_bendemographics: { m_state: {} } };
      component.loadEditDefaults();
      component.loadBenEditDetails();
      expect(form.value).toEqual(
        jasmine.objectContaining({
          stateID: null,
          districtID: null,
          blockID: null,
          villageID: null,
          zoneID: null,
          parkingPlace: null,
          servicePoint: null,
          habitation: null,
          pincode: null,
        }),
      );
      component.revisitData = {};
      component.loadBenEditDetails();
      expect(form.value.addressLine1).toBeNull();
    });

    it('ignores edit data without a beneficiaryID', () => {
      registrar.beneficiaryEditDetails$.next({ foo: 1 });
      expect(component.revisitData).toEqual(EDIT_DATA);
    });

    it('ngOnDestroy unsubscribes the revisit subscription', () => {
      const sub = component.revisitDataSubscription;
      component.ngOnDestroy();
      expect(sub.closed).toBeTrue();
    });
  });

  describe('edit beneficiary with empty location storage', () => {
    beforeEach(async () => setup({ revisit: true, edit: EDIT_DATA, loc: {} }));

    it('does not set states list', () => {
      expect(component.statesList).toBeUndefined();
      expect(form.value.stateID).toBe(2);
    });
  });
});
