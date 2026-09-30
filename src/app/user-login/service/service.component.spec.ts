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
  flush,
  tick,
} from '@angular/core/testing';
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
import { ConfirmationService } from 'src/app/app-modules/core/services/confirmation.service';
import { TelemedicineService } from 'src/app/app-modules/core/services/telemedicine.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { ServicePointService } from '../service-point/service-point.service';
import { ServiceComponent } from './service.component';

const SERVICE = {
  providerServiceID: 11,
  serviceName: 'HWC',
  serviceID: 9,
  apimanClientKey: 'api-key',
};

function loginResponse(designation: any = 'Nurse', screens = ['Nurse']) {
  return {
    designation: designation ? { designationName: designation } : undefined,
    previlegeObj: [
      {
        serviceName: 'HWC',
        roles: [
          {
            serviceRoleScreenMappings: screens.map((s) => ({
              screen: { screenName: s },
            })),
          },
        ],
      },
    ],
  };
}

const VAN = {
  vanID: 5,
  facilityID: 77,
  vanNoAndType: 'Facility A',
  servicePointID: 88,
  servicePointName: 'SP 1',
  vanSession: 3,
};

const DEMOGRAPHICS = {
  stateMaster: [
    { stateID: 1, stateName: 'Assam' },
    { stateID: 2, stateName: 'Goa' },
  ],
  otherLoc: {
    stateID: 2,
    districtList: [
      {
        districtID: 10,
        districtName: 'North',
        blockId: 20,
        blockName: 'Block',
        districtBranchID: 30,
        villageName: 'V-dist',
        villageList: [{ districtBranchID: 31, villageName: 'Village' }],
      },
    ],
  },
};

describe('ServiceComponent', () => {
  let component: ServiceComponent;
  let fixture: ComponentFixture<ServiceComponent>;
  let sps: any;
  let tele: any;
  let confirm: any;
  let session: any;
  let router: Router;
  let savedApiman: string | null;

  function setup(sessionSeed: Record<string, any>) {
    TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [ServiceComponent],
      providers: [
        ...commonTestProviders({ session: sessionSeed }),
        { provide: ServicePointService, useValue: sps },
        { provide: TelemedicineService, useValue: tele },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(ServiceComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    session = TestBed.inject(SessionStorageService);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
  }

  beforeEach(() => {
    savedApiman = sessionStorage.getItem('apimanClientKey');
    sps = autoSpy(ServicePointService);
    tele = autoSpy(TelemedicineService, {}, undefined);
  });

  afterEach(() => {
    if (savedApiman === null) sessionStorage.removeItem('apimanClientKey');
    else sessionStorage.setItem('apimanClientKey', savedApiman);
  });

  describe('ngOnInit', () => {
    it('auto-selects the only service and stores its details', () => {
      setup({
        services: JSON.stringify([SERVICE]),
        fullName: 'Asha Worker',
      });
      component.ngOnInit();
      expect(component.servicesList).toEqual([SERVICE]);
      expect(session.setItem).toHaveBeenCalledWith('providerServiceID', 11);
      expect(session.setItem).toHaveBeenCalledWith('serviceName', 'HWC');
      expect(session.setItem).toHaveBeenCalledWith('serviceID', 9);
      expect(sessionStorage.getItem('apimanClientKey')).toBe('api-key');
      expect(component.fullName).toBe('Asha Worker');
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });

    it('does not pre-select when several services exist', () => {
      setup({
        services: JSON.stringify([
          SERVICE,
          { ...SERVICE, providerServiceID: 12 },
        ]),
      });
      component.ngOnInit();
      expect(component.servicesList.length).toBe(2);
      expect(session.setItem).not.toHaveBeenCalled();
    });

    it('renders the template', () => {
      setup({ services: JSON.stringify([SERVICE]), fullName: 'X' });
      fixture.detectChanges();
      expect(fixture.nativeElement).toBeTruthy();
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });
  });

  describe('getServicePoint', () => {
    beforeEach(() => {
      setup({
        providerServiceID: 11,
        userID: 42,
        loginDataResponse: JSON.stringify(loginResponse()),
      });
      component.loginDataResponse = loginResponse();
      component.serviceDetails = SERVICE;
      component.currentLanguageSet = LANGUAGE_EN;
    });

    it('stores facility details, filters vans and routes to the designation', fakeAsync(() => {
      sps.getServicePoints.and.returnValue(
        of({ statusCode: 200, data: { UserVanSpDetails: [VAN, { ...VAN }] } }),
      );
      sps.getMMUDemographics.and.returnValue(
        of({ statusCode: 200, data: DEMOGRAPHICS }),
      );
      component.getServicePoint();
      expect(sps.getServicePoints).toHaveBeenCalledWith(42, 11);
      expect(component.currVanId).toBe(5);
      expect(session.store.get('facilityID')).toBe(77);
      expect(session.store.get('servicePointID')).toBe(88);
      expect(session.store.get('servicePointName')).toBe('SP 1');
      expect(session.store.get('sessionID')).toBe(3);
      expect(component.vansList.length).toBe(1);
      expect(sps.getMMUDemographics).toHaveBeenCalledWith(77);
      expect(session.store.get('role')).toBe(JSON.stringify(['Nurse']));
      expect(session.store.get('designation')).toBe('Nurse');
      expect(router.navigate).toHaveBeenCalledWith([
        '/nurse-doctor/nurse-worklist',
      ]);
      flush();
    }));

    it('uses the "Facility" default name and skips facility storage without a facilityID', fakeAsync(() => {
      sps.getServicePoints.and.returnValue(
        of({
          statusCode: 200,
          data: { UserVanSpDetails: [{ vanID: 1, facilityID: 9 }] },
        }),
      );
      sps.getMMUDemographics.and.returnValue(of({ statusCode: 500 }));
      component.getServicePoint();
      expect(session.setItem).toHaveBeenCalledWith(
        'servicePointName',
        'Facility',
      );
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.coreComponents.issuesInGettingLocationTryToReLogin,
        'error',
      );
      flush();
    }));

    it('does not store facility details when the van has no facility', fakeAsync(() => {
      sps.getServicePoints.and.returnValue(
        of({ statusCode: 200, data: { UserVanSpDetails: [{ vanID: 1 }] } }),
      );
      sps.getMMUDemographics.and.returnValue(of(null));
      component.getServicePoint();
      expect(session.store.has('facilityID')).toBeFalse();
      expect(session.store.get('serviceLineDetails')).toBe(
        JSON.stringify({ vanID: 1 }),
      );
      flush();
    }));

    it('checks roles for TC Specialists without vans', () => {
      session.store.set(
        'loginDataResponse',
        JSON.stringify(loginResponse('TC Specialist')),
      );
      component.loginDataResponse = loginResponse('TC Specialist', [
        'TC Specialist',
      ]);
      sps.getServicePoints.and.returnValue(
        of({ statusCode: 200, data: { UserVanSpDetails: [] } }),
      );
      component.getServicePoint();
      expect(router.navigate).toHaveBeenCalledWith([
        '/nurse-doctor/tcspecialist-worklist',
      ]);
    });

    it('does nothing for non TC users without vans', () => {
      sps.getServicePoints.and.returnValue(of({ statusCode: 200, data: {} }));
      component.getServicePoint();
      expect(router.navigate).not.toHaveBeenCalled();
      expect(confirm.alert).not.toHaveBeenCalled();
    });

    it('alerts on 5002', () => {
      sps.getServicePoints.and.returnValue(
        of({ statusCode: 5002, errorMessage: 'expired' }),
      );
      component.getServicePoint();
      expect(confirm.alert).toHaveBeenCalledWith('expired', 'error');
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('alerts and routes to /service on other errors', () => {
      sps.getServicePoints.and.returnValue(
        of({ statusCode: 500, errorMessage: 'bad' }),
      );
      component.getServicePoint();
      expect(confirm.alert).toHaveBeenCalledWith('bad', 'error');
      expect(router.navigate).toHaveBeenCalledWith(['/service']);
    });

    it('alerts on HTTP error', () => {
      sps.getServicePoints.and.returnValue(throwingObs('down'));
      component.getServicePoint();
      expect(confirm.alert).toHaveBeenCalledWith('down', 'error');
    });
  });

  describe('selectService', () => {
    beforeEach(() => {
      setup({
        userID: 42,
        loginDataResponse: JSON.stringify(loginResponse()),
      });
      component.currentLanguageSet = LANGUAGE_EN;
    });

    it('stores the service, routes to designation worklist and fetches CDSS status', fakeAsync(() => {
      sps.getServicePoints.and.returnValue(
        of({ statusCode: 200, data: { UserVanSpDetails: [VAN] } }),
      );
      sps.getMMUDemographics.and.returnValue(
        of({ statusCode: 200, data: DEMOGRAPHICS }),
      );
      sps.getCdssAdminDetails.and.returnValue(of({ data: { isCdss: true } }));
      component.selectService(SERVICE);
      flush();
      expect(session.store.get('providerServiceID')).toBe(11);
      expect(session.store.get('serviceName')).toBe('HWC');
      expect(session.store.get('serviceID')).toBe(9);
      expect(sessionStorage.getItem('apimanClientKey')).toBe('api-key');
      expect(component.serviceDetails).toEqual(SERVICE);
      expect(sps.getServicePoints).toHaveBeenCalledWith(42, 11);
      expect(session.store.get('facilityID')).toBe(77);
      expect(session.store.get('servicePointID')).toBe(88);
      expect(session.store.get('designation')).toBe('Nurse');
      expect(router.navigate).toHaveBeenCalledWith([
        '/nurse-doctor/nurse-worklist',
      ]);
      expect(sps.getCdssAdminDetails).toHaveBeenCalledWith(11);
      expect(session.store.get('isCdss')).toBeTrue();
      const loc = JSON.parse(session.store.get('locationData'));
      expect(loc).toEqual({
        stateID: 2,
        stateName: 'Goa',
        districtID: 10,
        districtName: 'North',
        blockName: 'Block',
        blockID: 20,
        subDistrictID: 30,
        villageName: 'V-dist',
      });
    }));

    it('uses "Facility" when the van has no name', fakeAsync(() => {
      sps.getServicePoints.and.returnValue(
        of({
          statusCode: 200,
          data: { UserVanSpDetails: [{ vanID: 2, facilityID: 4 }] },
        }),
      );
      sps.getMMUDemographics.and.returnValue(of({ statusCode: 500 }));
      sps.getCdssAdminDetails.and.returnValue(of({ data: null }));
      component.selectService(SERVICE);
      flush();
      expect(session.setItem).toHaveBeenCalledWith(
        'servicePointName',
        'Facility',
      );
      expect(session.store.has('isCdss')).toBeFalse();
    }));

    it('routes TC Specialists without vans', fakeAsync(() => {
      const lr = loginResponse('TC Specialist', ['TC Specialist']);
      session.store.set('loginDataResponse', JSON.stringify(lr));
      sps.getServicePoints.and.returnValue(
        of({ statusCode: 200, data: { UserVanSpDetails: [] } }),
      );
      component.selectService(SERVICE);
      flush();
      expect(router.navigate).toHaveBeenCalledWith([
        '/nurse-doctor/tcspecialist-worklist',
      ]);
    }));

    it('alerts and rejects when no service points exist', fakeAsync(() => {
      sps.getServicePoints.and.returnValue(of({ statusCode: 200, data: {} }));
      component.selectService(SERVICE);
      flush();
      expect(confirm.alert).toHaveBeenCalledWith(
        'Service points not found.',
        'error',
      );
      expect(router.navigate).toHaveBeenCalledWith(['/service']);
      expect(confirm.alert).toHaveBeenCalledWith(
        'An error occurred. Please try again.',
        'error',
      );
      expect(sps.getCdssAdminDetails).not.toHaveBeenCalled();
    }));

    it('alerts the error message on a failed response', fakeAsync(() => {
      sps.getServicePoints.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'nope' }),
      );
      component.selectService(SERVICE);
      flush();
      expect(confirm.alert).toHaveBeenCalledWith('nope', 'error');
      expect(router.navigate).toHaveBeenCalledWith(['/service']);
    }));

    it('alerts on HTTP error', fakeAsync(() => {
      sps.getServicePoints.and.returnValue(throwingObs('down'));
      component.selectService(SERVICE);
      flush();
      expect(confirm.alert).toHaveBeenCalledWith('down', 'error');
      expect(confirm.alert).toHaveBeenCalledWith(
        'An error occurred. Please try again.',
        'error',
      );
    }));
  });

  describe('handleRoleDesignationRouting', () => {
    beforeEach(() => {
      setup({});
      component.currentLanguageSet = LANGUAGE_EN;
      component.serviceDetails = SERVICE;
    });

    it('alerts when designation not in roles', async () => {
      component.loginDataResponse = loginResponse('Doctor', ['Nurse']);
      await component.handleRoleDesignationRouting();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.rolesNotMatched,
        'error',
      );
    });

    it('alerts when no roles for service', async () => {
      component.loginDataResponse = {
        previlegeObj: [{ serviceName: 'HWC', roles: [] }],
      };
      await component.handleRoleDesignationRouting();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.mapRoleFeature,
        'error',
      );
    });

    it('alerts when there is no privilege object', async () => {
      component.loginDataResponse = {};
      await component.handleRoleDesignationRouting();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.mapRoleFeature,
        'error',
      );
    });
  });

  describe('role and designation checks', () => {
    beforeEach(() => {
      setup({});
      component.currentLanguageSet = LANGUAGE_EN;
    });

    it('checkRoleAndDesingnationMappedForservice ignores missing previlegeObj', () => {
      component.checkRoleAndDesingnationMappedForservice({}, SERVICE);
      expect(confirm.alert).not.toHaveBeenCalled();
    });

    it('checkMappedRoleForService alerts when roles missing', () => {
      component.checkMappedRoleForService({});
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.mapRoleFeature,
        'error',
      );
    });

    it('checkMappedRoleForService alerts when roles empty', () => {
      component.checkMappedRoleForService({ roles: [] });
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.mapRoleFeature,
        'error',
      );
    });

    it('checkMappedRoleForService alerts when roles have no screens', () => {
      component.checkMappedRoleForService({
        roles: [{ serviceRoleScreenMappings: [] }],
      });
      expect(component.roleArray).toEqual([]);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.mapRoleFeature,
        'error',
      );
    });

    it('checkMappedDesignation alerts when no designation', () => {
      component.checkMappedDesignation({});
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.mapDesignation,
        'error',
      );
    });

    it('checkDesignationWithRole alerts when designation not in roles', () => {
      component.roleArray = ['Nurse'];
      component.designation = 'Doctor';
      component.checkDesignationWithRole();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.rolesNotMatched,
        'error',
      );
      expect(session.setItem).not.toHaveBeenCalled();
    });
  });

  describe('routing', () => {
    beforeEach(() => setup({}));

    const cases: [string, string][] = [
      ['Registrar', '/registrar/registration'],
      ['Nurse', '/nurse-doctor/nurse-worklist'],
      ['Doctor', '/nurse-doctor/doctor-worklist'],
      ['Lab Technician', '/lab'],
      ['Pharmacist', '/pharmacist'],
      ['Radiologist', '/nurse-doctor/radiologist-worklist'],
      ['Oncologist', '/nurse-doctor/oncologist-worklist'],
      ['TC Specialist', '/nurse-doctor/tcspecialist-worklist'],
    ];
    cases.forEach(([designation, url]) => {
      it(`routes ${designation} to ${url}`, async () => {
        await component.routeToDesignation(designation);
        expect(router.navigate).toHaveBeenCalledWith([url]);
      });
    });

    it('routes Supervisor to telemedicine', async () => {
      await expectAsync(
        component.routeToDesignation('Supervisor'),
      ).toBeResolvedTo(true);
      expect(tele.routeToTeleMedecine).toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('resolves false for unknown designations', async () => {
      await expectAsync(component.routeToDesignation('Clerk')).toBeResolvedTo(
        false,
      );
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('goToWorkList uses the stored designation', () => {
      session.store.set('designation', 'Pharmacist');
      component.goToWorkList();
      expect(component.designation).toBe('Pharmacist');
      expect(router.navigate).toHaveBeenCalledWith(['/pharmacist']);
    });
  });

  describe('demographics', () => {
    beforeEach(() => setup({}));

    it('saveDemographicsToStorage alerts for empty data', () => {
      component.saveDemographicsToStorage(null);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.coreComponents.issuesInGettingLocationTryToReLogin,
        'error',
      );
      expect(session.setItem).not.toHaveBeenCalled();
    });

    it('saveDemographicsToStorage alerts when stateMaster is empty', () => {
      component.saveDemographicsToStorage({ stateMaster: [] });
      expect(confirm.alert).toHaveBeenCalled();
      expect(session.setItem).not.toHaveBeenCalled();
    });

    it('stores location without locationData when there is no district list', fakeAsync(() => {
      const data = {
        stateMaster: [{ stateID: 1, stateName: 'Assam' }],
        otherLoc: { stateID: 1, districtList: [{ districtID: 3 }] },
      };
      component.saveDemographicsToStorage({
        stateMaster: data.stateMaster,
        otherLoc: { stateID: 1 },
      });
      expect(session.store.get('location')).toBeDefined();
      expect(session.store.has('locationData')).toBeFalse();
      // saveLocationDataToStorage then reads location after 1s
      session.store.set('location', JSON.stringify(data));
      tick(1000);
      expect(JSON.parse(session.store.get('locationData')).stateName).toBe(
        'Assam',
      );
    }));

    it('stores immediate locationData with defaults when there are no villages', fakeAsync(() => {
      const data = {
        stateMaster: [{ stateID: 1, stateName: 'Assam' }],
        otherLoc: {
          stateID: 5,
          districtList: [
            { districtID: 3, districtName: 'D', blockId: 4, blockName: 'B' },
          ],
        },
      };
      component.saveDemographicsToStorage(data);
      expect(JSON.parse(session.store.get('locationData'))).toEqual({
        stateID: 5,
        stateName: '',
        districtID: 3,
        districtName: 'D',
        blockID: 4,
        blockName: 'B',
        subDistrictID: null,
        villageName: null,
      });
      session.store.set(
        'location',
        JSON.stringify({ ...data, otherLoc: { ...data.otherLoc, stateID: 1 } }),
      );
      tick(1000);
    }));

    it('getDemographics tolerates missing van details', () => {
      sps.getMMUDemographics.and.returnValue(of({ statusCode: 500 }));
      component.getDemographics();
      expect(sps.getMMUDemographics).toHaveBeenCalledWith(undefined);
      expect(confirm.alert).toHaveBeenCalled();
    });
  });

  it('getSwymedMailLogin does not redirect on a failed response', () => {
    setup({});
    sps.getSwymedMailLogin.and.returnValue(of({ statusCode: 500 }));
    component.getSwymedMailLogin();
    expect(sps.getSwymedMailLogin).toHaveBeenCalled();
  });

  it('getCdssAdminStatus ignores a response without isCdss', async () => {
    setup({ providerServiceID: 3 });
    sps.getCdssAdminDetails.and.returnValue(of({ data: {} }));
    await component.getCdssAdminStatus();
    expect(sps.getCdssAdminDetails).toHaveBeenCalledWith(3);
    expect(session.setItem).not.toHaveBeenCalled();
  });
});
