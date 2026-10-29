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
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';
import { ConfirmationService } from 'src/app/app-modules/core/services/confirmation.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { RegistrarService } from 'src/app/app-modules/registrar/shared/services/registrar.service';
import { ServicePointService } from './service-point.service';
import { ServicePointComponent } from './service-point.component';

const DEMOGRAPHICS = {
  stateMaster: [{ stateID: 2, stateName: 'Goa' }],
  otherLoc: {
    stateID: 2,
    districtList: [
      {
        districtID: 10,
        districtName: 'North',
        blockId: 20,
        blockName: 'Block',
        villageList: [{ districtBranchID: 31, villageName: 'Village' }],
      },
    ],
  },
};

describe('ServicePointComponent', () => {
  let component: ServicePointComponent;
  let fixture: ComponentFixture<ServicePointComponent>;
  let sps: any;
  let registrar: any;
  let confirm: any;
  let session: any;
  let router: Router;
  let routeData: BehaviorSubject<any>;

  beforeEach(async () => {
    sps = autoSpy(ServicePointService);
    registrar = autoSpy(RegistrarService);
    routeData = new BehaviorSubject<any>({
      servicePoints: { statusCode: 200, data: {} },
    });
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [ServicePointComponent],
      providers: [
        ...commonTestProviders({
          session: {
            providerServiceID: 11,
            userID: 42,
            designation: 'Nurse',
          },
        }),
        { provide: ServicePointService, useValue: sps },
        { provide: RegistrarService, useValue: registrar },
        { provide: ActivatedRoute, useValue: { data: routeData } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(ServicePointComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    session = TestBed.inject(SessionStorageService);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
  });

  describe('ngOnInit', () => {
    it('reads session, language and fetches CDSS status', () => {
      sps.getCdssAdminDetails.and.returnValue(of({ data: { isCdss: false } }));
      fixture.detectChanges();
      expect(component.serviceProviderId).toBe(11 as any);
      expect(component.userId).toBe(42 as any);
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
      expect(sps.getCdssAdminDetails).toHaveBeenCalledWith(11);
      expect(session.store.get('isCdss')).toBeFalse();
    });

    it('does not store isCdss when missing', () => {
      sps.getCdssAdminDetails.and.returnValue(of({ data: { isCdss: null } }));
      component.ngOnInit();
      component.ngDoCheck();
      expect(session.store.has('isCdss')).toBeFalse();
    });
  });

  describe('getServicePoint', () => {
    it('auto-logs in with the facility entry and routes to worklist', () => {
      const entry = { vanID: 5, facilityID: 77, vanSession: 2 };
      routeData.next({
        servicePoints: {
          statusCode: 200,
          data: { UserVanSpDetails: [{ vanID: 4 }, entry] },
        },
      });
      sps.getMMUDemographics.and.returnValue(
        of({ statusCode: 200, data: DEMOGRAPHICS }),
      );
      component.getServicePoint();
      expect(session.store.get('serviceLineDetails')).toBe(
        JSON.stringify(entry),
      );
      expect(session.store.get('facilityID')).toBe(77);
      expect(session.store.get('servicePointID')).toBe(77);
      expect(session.store.get('servicePointName')).toBe('Facility');
      expect(session.store.get('sessionID')).toBe(2);
      expect(component.currVanId).toBe(5);
      expect(sps.getMMUDemographics).toHaveBeenCalledWith(77);
      expect(JSON.parse(session.store.get('locationData'))).toEqual({
        stateID: 2,
        districtID: 10,
        districtName: 'North',
        blockID: 20,
        blockName: 'Block',
        subDistrictID: 31,
        villageName: 'Village',
      });
      expect(router.navigate).toHaveBeenCalledWith([
        '/nurse-doctor/nurse-worklist',
      ]);
    });

    it('prefers explicit service point id/name and skips sessionID without a session', () => {
      component.autoLoginWithFacility({
        vanID: 1,
        facilityID: 7,
        servicePointID: 8,
        vanNoAndType: 'Van X',
      });
      expect(session.store.get('servicePointID')).toBe(8);
      expect(session.store.get('servicePointName')).toBe('Van X');
      expect(session.store.has('sessionID')).toBeFalse();
    });

    it('builds the van list when there is no facility', () => {
      routeData.next({
        servicePoints: {
          statusCode: 200,
          data: {
            UserVanSpDetails: [
              { vanID: 1, vanSession: 3 },
              { vanID: 1, vanSession: 1 },
              { vanID: 2, vanSession: 3 },
            ],
          },
        },
      });
      component.getServicePoint();
      expect(component.currVanId).toBe(1);
      expect(component.vansList.map((v) => v.vanID)).toEqual([1, 2]);
      expect(sps.getMMUDemographics).not.toHaveBeenCalled();
    });

    it('does nothing without van details', () => {
      routeData.next({ servicePoints: { statusCode: 200, data: {} } });
      component.getServicePoint();
      expect(component.vanServicepointDetails).toBeUndefined();
    });

    it('alerts on 5002 without navigating', () => {
      routeData.next({
        servicePoints: { statusCode: 5002, errorMessage: 'expired' },
      });
      component.getServicePoint();
      expect(confirm.alert).toHaveBeenCalledWith('expired', 'error');
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('alerts and routes to /service for other failures', () => {
      routeData.next({
        servicePoints: { statusCode: 500, errorMessage: 'bad' },
      });
      component.getServicePoint();
      expect(confirm.alert).toHaveBeenCalledWith('bad', 'error');
      expect(router.navigate).toHaveBeenCalledWith(['/service']);
    });

    it('alerts when route data errors', () => {
      (component as any).route = { data: throwingObs('oops') };
      component.getServicePoint();
      expect(confirm.alert).toHaveBeenCalledWith('oops', 'error');
    });
  });

  describe('getServiceLineDetails', () => {
    it('stores all details of the selected van', () => {
      component.vansList = [
        {
          vanID: 3,
          facilityID: 9,
          servicePointID: 10,
          servicePointName: 'SP',
          vanSession: 1,
        },
      ];
      component.vanID = 3 as any;
      component.getServiceLineDetails();
      expect(session.store.get('facilityID')).toBe(9);
      expect(session.store.get('servicePointID')).toBe(10);
      expect(session.store.get('servicePointName')).toBe('SP');
      expect(session.store.get('sessionID')).toBe(1);
    });

    it('stores only serviceLineDetails for a bare van', () => {
      component.vansList = [{ vanID: 3 }];
      component.vanID = 3 as any;
      component.getServiceLineDetails();
      expect(session.setItem).toHaveBeenCalledTimes(1);
      expect(session.store.get('serviceLineDetails')).toBe(
        JSON.stringify({ vanID: 3 }),
      );
    });
  });

  it('resetLocalStorage removes selection keys', () => {
    component.resetLocalStorage();
    [
      'sessionID',
      'serviceLineDetails',
      'vanType',
      'location',
      'servicePointID',
      'servicePointName',
      'facilityID',
    ].forEach((k) => expect(session.removeItem).toHaveBeenCalledWith(k));
  });

  describe('routeToDesignation', () => {
    const cases: [string, string][] = [
      ['Registrar', '/registrar/registration'],
      ['Nurse', '/nurse-doctor/nurse-worklist'],
      ['Doctor', '/nurse-doctor/doctor-worklist'],
      ['Lab Technician', '/lab'],
      ['Pharmacist', '/pharmacist'],
      ['Radiologist', '/nurse-doctor/radiologist-worklist'],
      ['Oncologist', '/nurse-doctor/oncologist-worklist'],
    ];
    cases.forEach(([d, url]) =>
      it(`routes ${d}`, () => {
        component.routeToDesignation(d);
        expect(router.navigate).toHaveBeenCalledWith([url]);
      }),
    );
    it('ignores unknown designations', () => {
      component.routeToDesignation('Clerk');
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('demographics', () => {
    it('getDemographics alerts on failure', () => {
      sps.getMMUDemographics.and.returnValue(of({ statusCode: 500 }));
      component.getDemographics();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.coreComponents.issuesInGettingLocationTryToReLogin,
        'error',
      );
    });

    it('saveDemographicsToStorage alerts for missing data', () => {
      component.saveDemographicsToStorage(null);
      component.saveDemographicsToStorage({ stateMaster: [] });
      expect(confirm.alert).toHaveBeenCalledTimes(2);
      expect(session.setItem).not.toHaveBeenCalled();
    });

    it('stores location without locationData when there are no districts', () => {
      component.saveDemographicsToStorage({
        stateMaster: [{ stateID: 1 }],
        otherLoc: { districtList: [] },
      });
      expect(session.store.has('location')).toBeTrue();
      expect(session.store.has('locationData')).toBeFalse();
      expect(router.navigate).toHaveBeenCalledWith([
        '/nurse-doctor/nurse-worklist',
      ]);
    });

    it('uses null village fields when there are no villages', () => {
      component.saveDemographicsToStorage({
        stateMaster: [{ stateID: 1 }],
        otherLoc: { stateID: 1, districtList: [{ districtID: 2 }] },
      });
      const loc = JSON.parse(session.store.get('locationData'));
      expect(loc.subDistrictID).toBeNull();
      expect(loc.villageName).toBeNull();
    });
  });

  it('setStateName stores the name', () => {
    component.setStateName('Goa');
    expect(component.stateName).toBe('Goa');
  });

  describe('location cascades', () => {
    beforeEach(() => {
      component.current_language_set = LANGUAGE_EN;
    });

    it('fetchDistrictsOnStateSelection loads districts and resets children', () => {
      component.stateID = 2;
      component.blockID = { blockID: 1 };
      component.districtBranchID = { id: 1 };
      registrar.getDistrictList.and.returnValue(
        of({ statusCode: 200, data: [{ districtID: 1 }] }),
      );
      component.fetchDistrictsOnStateSelection(2);
      expect(registrar.getDistrictList).toHaveBeenCalledWith(2);
      expect(component.districtList).toEqual([{ districtID: 1 }]);
      expect(component.blockID).toBeNull();
      expect(component.districtBranchID).toBeNull();
    });

    it('fetchDistrictsOnStateSelection alerts on failure', () => {
      registrar.getDistrictList.and.returnValue(of({ statusCode: 500 }));
      component.fetchDistrictsOnStateSelection(2);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.IssuesInFetchingDemographics,
        'error',
      );
    });

    it('fetchSubDistrictsOnDistrictSelection loads sub districts', () => {
      component.districtID = { districtID: 10 };
      registrar.getSubDistrictList.and.returnValue(
        of({ statusCode: 200, data: [{ blockID: 1 }] }),
      );
      component.fetchSubDistrictsOnDistrictSelection(null);
      expect(registrar.getSubDistrictList).toHaveBeenCalledWith(10);
      expect(component.subDistrictList).toEqual([{ blockID: 1 }]);
    });

    it('fetchSubDistrictsOnDistrictSelection alerts on failure', () => {
      component.districtID = { districtID: 10 };
      registrar.getSubDistrictList.and.returnValue(of(null));
      component.fetchSubDistrictsOnDistrictSelection(null);
      expect(confirm.alert).toHaveBeenCalled();
    });

    it('onSubDistrictChange loads villages', () => {
      component.blockID = { blockID: 20 };
      registrar.getVillageList.and.returnValue(
        of({ statusCode: 200, data: [{ villageName: 'V' }] }),
      );
      component.onSubDistrictChange(null);
      expect(registrar.getVillageList).toHaveBeenCalledWith(20);
      expect(component.villageList).toEqual([{ villageName: 'V' }]);
    });

    it('onSubDistrictChange alerts on failure', () => {
      component.blockID = { blockID: 20 };
      registrar.getVillageList.and.returnValue(of({ statusCode: 500 }));
      component.onSubDistrictChange(null);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.IssuesInFetchingLocationDetails,
        'error',
      );
    });
  });

  it('saveLocationDataToStorage stores selected location and routes', () => {
    component.stateID = 2;
    component.stateName = 'Goa';
    component.districtID = { districtID: 10, districtName: 'North' };
    component.blockID = { blockID: 20, blockName: 'Block' };
    component.districtBranchID = { districtBranchID: 31, villageName: 'V' };
    component.saveLocationDataToStorage();
    expect(JSON.parse(session.store.get('locationData'))).toEqual({
      stateID: 2,
      stateName: 'Goa',
      districtID: 10,
      districtName: 'North',
      blockName: 'Block',
      blockID: 20,
      subDistrictID: 31,
      villageName: 'V',
    });
    expect(router.navigate).toHaveBeenCalledWith([
      '/nurse-doctor/nurse-worklist',
    ]);
  });
});
