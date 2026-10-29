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
import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { environment } from 'src/environments/environment';

import { RegistrarService } from './registrar.service';

describe('RegistrarService', () => {
  let service: RegistrarService;
  let httpMock: HttpTestingController;
  const env: any = environment;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RegistrarService],
    });
    service = TestBed.inject(RegistrarService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('state subjects', () => {
    it('has sensible defaults', () => {
      expect(service.consentGranted).toBe('0');
      expect(service.stateIdFamily).toBeNull();
      expect(service.enablingDispense).toBeFalse();
    });

    it('changePersonalDetailsData emits on dialogResult$', () => {
      let v: any;
      service.dialogResult$.subscribe((x) => (v = x));
      service.changePersonalDetailsData({ a: 1 });
      expect(v).toEqual({ a: 1 });
    });

    it('enableDispenseOnFertility emits on enablingDispense$', () => {
      let v: any;
      service.enablingDispense$.subscribe((x) => (v = x));
      service.enableDispenseOnFertility(true);
      expect(v).toBeTrue();
    });

    it('getBenFamilyDetails stores and emits', () => {
      let v: any;
      service.benFamilyDetails$.subscribe((x) => (v = x));
      service.getBenFamilyDetails({ fam: 1 });
      expect(service.benFamilyDet).toEqual({ fam: 1 });
      expect(v).toEqual({ fam: 1 });
    });

    it('getabhaDetail stores and emits', () => {
      let v: any;
      service.abhaDetailDetails$.subscribe((x) => (v = x));
      service.getabhaDetail({ abha: 1 });
      expect(service.abhaDetail).toEqual({ abha: 1 });
      expect(v).toEqual({ abha: 1 });
    });

    it('updateDistrictList / updateSubDistrictList emit lists', () => {
      let d: any, s: any;
      service.districtList$.subscribe((x) => (d = x));
      service.subDistrictList$.subscribe((x) => (s = x));
      service.updateDistrictList([1]);
      service.updateSubDistrictList([2]);
      expect(d).toEqual([1]);
      expect(s).toEqual([2]);
    });

    it('isMarriageEnable and clearMaritalDetails', () => {
      let v: any;
      service.maritalStatus$.subscribe((x) => (v = x));
      service.isMarriageEnable(true);
      expect(v).toBeTrue();
      service.clearMaritalDetails();
      expect(v).toBeNull();
    });

    it('sendConsentStatus updates field and subject', () => {
      let v: any;
      service.consentStatus$.subscribe((x) => (v = x));
      service.sendConsentStatus('1');
      expect(service.consentGranted).toBe('1');
      expect(v).toBe('1');
    });

    it('saveBeneficiaryEditDataASobservable / clearBeneficiaryEditDetails', () => {
      let v: any;
      service.beneficiaryEditDetails$.subscribe((x) => (v = x));
      service.saveBeneficiaryEditDataASobservable({ b: 1 });
      expect(v).toEqual({ b: 1 });
      service.clearBeneficiaryEditDetails();
      expect(v).toBeNull();
    });

    it('passIDsToFetchOtp stores and emits', () => {
      let v: any;
      service.generateHealthIdOtp$.subscribe((x) => (v = x));
      service.passIDsToFetchOtp('hid');
      expect(service.healthId).toBe('hid');
      expect(v).toBe('hid');
    });

    it('set / clear HealthIdMobVerification', () => {
      let v: any;
      service.healthIdMobVerificationCheck$.subscribe((x) => (v = x));
      service.setHealthIdMobVerification({ m: 1 });
      expect(service.healthIdMobVerificationValue).toEqual({ m: 1 });
      expect(v).toEqual({ m: 1 });
      service.clearHealthIdMobVerification();
      expect(service.healthIdMobVerificationValue).toBeNull();
      expect(v).toBeNull();
    });
  });

  describe('master data loaders', () => {
    ['getRegistrationMaster', 'getResgistartionMasterData'].forEach((m) => {
      it(`${m} pushes response data into registrationMasterDetails`, () => {
        spyOn(console, 'log');
        let v: any;
        service.registrationMasterDetails$.subscribe((x) => (v = x));
        (service as any)[m](5);
        const req = httpMock.expectOne(env.registrarMasterDataUrl);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ spID: 5 });
        req.flush({ data: { x: 1 } });
        expect(v).toEqual({ x: 1 });
      });

      it(`${m} ignores response without data`, () => {
        spyOn(console, 'log');
        let v: any = 'unset';
        service.registrationMasterDetails$.subscribe((x) => (v = x));
        (service as any)[m](5);
        httpMock.expectOne(env.registrarMasterDataUrl).flush({});
        expect(v).toBeNull();
      });
    });

    it('loadMasterData posts spID', () => {
      service.loadMasterData(3).subscribe();
      const req = httpMock.expectOne(env.registrarMasterDataUrl);
      expect(req.request.body).toEqual({ spID: 3 });
      req.flush({});
    });
  });

  describe('POST endpoints', () => {
    it('getPatientDataAsObservable / getPatientData wrap beneficiaryRegID', () => {
      service.getPatientDataAsObservable(11).subscribe();
      let req = httpMock.expectOne(env.getCompleteBeneficiaryDetail);
      expect(req.request.body).toEqual({ beneficiaryRegID: 11 });
      req.flush({});
      service.getPatientData(12).subscribe();
      req = httpMock.expectOne(env.getCompleteBeneficiaryDetail);
      expect(req.request.body).toEqual({ beneficiaryRegID: 12 });
      req.flush({});
    });

    it('registerBeneficiary wraps in benD', () => {
      service.registerBeneficiary({ n: 1 }).subscribe();
      const req = httpMock.expectOne(env.registerBeneficiaryUrl);
      expect(req.request.body).toEqual({ benD: { n: 1 } });
      req.flush({});
    });

    it('getDistrictBlocks wraps servicePointID', () => {
      service.getDistrictBlocks(9).subscribe();
      const req = httpMock.expectOne(env.servicePointVillages);
      expect(req.request.body).toEqual({ servicePointID: 9 });
      req.flush({});
    });

    const passthrough: [string, string][] = [
      ['quickSearch', 'quickSearchUrl'],
      ['identityQuickSearch', 'identityQuickSearchUrl'],
      ['advanceSearch', 'advanceSearchUrl'],
      ['advanceSearchIdentity', 'advanceSearchIdentityUrl'],
      ['externalSearchIdentity', 'externalSearchIdentityUrl'],
      ['migrateBenToAmrit', 'externalSearchIdentityUrl'],
      ['patientRevisit', 'patientRevisitSubmitToNurse'],
      ['identityPatientRevisit', 'identityPatientRevisitSubmitToNurseURL'],
      ['updatePatientData', 'updateBeneficiaryUrl'],
      ['submitBeneficiary', 'submitBeneficiaryIdentityUrl'],
      ['updateBeneficiary', 'updateBeneficiaryIdentityUrl'],
      ['generateHealthId', 'healthIdGenerationUrl'],
      ['generateHealthIdWithUID', 'healthIdGenerationWithUIDUrl'],
      ['verifyOTPForAadharHealthId', 'verifyOTPUrl'],
      ['checkAndGenerateMobileOTPHealthId', 'checkAndGenerateMobileOTPUrl'],
      ['verifyMobileOTPForAadhar', 'verifyMobileOTPUrl'],
      ['mapHealthId', 'mapHealthIdUrl'],
      ['getHealthIdDetails', 'gethealthIdDetailsUrl'],
      ['generateOtpForMappingCareContext', 'careContextGenerateOtpUrl'],
      ['verifyOtpForMappingCarecontext', 'verifyOtpForMappingContextUrl'],
      ['generateOTPValidateHealthID', 'generateOTPForHealthIDValidation'],
      ['verifyOTPForHealthIDValidation', 'verifyOTPForHealthIDValidation'],
      ['generateHealthIDCard', 'generateOTPForHealthIDCard'],
      ['verifyOTPForHealthIDCard', 'verifyOTPAndGenerateHealthCard'],
      ['updateBenDetailsInMongo', 'updateAmritIDInMongo'],
    ];
    passthrough.forEach(([method, urlKey]) => {
      it(`${method} posts body to ${urlKey}`, () => {
        const body = { key: method };
        let res: any;
        (service as any)[method](body).subscribe((r: any) => (res = r));
        const req = httpMock.expectOne(env[urlKey]);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(body);
        req.flush({ statusCode: 200, data: method });
        expect(res.data).toBe(method);
      });
    });
  });

  describe('GET endpoints', () => {
    const gets: [string, string][] = [
      ['getVillageList', 'getVillageListUrl'],
      ['getSubDistrictList', 'getSubDistrictListUrl'],
      ['getDistrictList', 'getDistrictListUrl'],
    ];
    gets.forEach(([method, urlKey]) => {
      it(`${method} GETs ${urlKey} + id with JSON header`, () => {
        let res: any;
        (service as any)[method](42).subscribe((r: any) => (res = r));
        const req = httpMock.expectOne(`${env[urlKey]}42`);
        expect(req.request.method).toBe('GET');
        expect(req.request.headers.get('Content-Type')).toBe(
          'application/json',
        );
        req.flush({ data: [1] });
        expect(res).toEqual({ data: [1] });
      });
    });
  });

  describe('generateOTP', () => {
    it('MOBILE mode uses otpGenerationUrl', () => {
      service.generateOTP({ m: 1 }, 'MOBILE').subscribe();
      const req = httpMock.expectOne(env.otpGenerationUrl);
      expect(req.request.body).toEqual({ m: 1 });
      req.flush({});
    });

    it('AADHAR mode uses otpGenerationWithUIDUrl', () => {
      service.generateOTP({ a: 1 }, 'AADHAR').subscribe();
      const req = httpMock.expectOne(env.otpGenerationWithUIDUrl);
      expect(req.request.body).toEqual({ a: 1 });
      req.flush({});
    });

    it('throws on invalid mode', () => {
      expect(() => service.generateOTP({}, 'OTHER')).toThrowError(
        'Invalid mode',
      );
    });
  });
});
