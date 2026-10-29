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
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, of } from 'rxjs';

import { RegistrationComponent } from './registration.component';
import { RegistrarService } from '../shared/services/registrar.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { RegistrationUtils } from '../shared/utility/registration-utility';
import { HealthIdDisplayModalComponent } from '../../core/components/health-id-display-modal/health-id-display-modal.component';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

const MASTER = {
  govIdEntityMaster: [
    { govtIdentityTypeID: 1, identityType: 'Aadhar' },
    { govtIdentityTypeID: 2, identityType: 'Voter ID' },
    { govtIdentityTypeID: 1, identityType: 'Aadhar' },
  ],
  otherGovIdEntityMaster: [
    { govtIdentityTypeID: 7, identityType: 'State Card' },
    { govtIdentityTypeID: 7, identityType: 'State Card' },
  ],
};

const REVISIT = {
  beneficiaryID: '100',
  beneficiaryRegID: 555,
  firstName: 'Ravi',
  lastName: 'Kumar',
  familyName: 'Kumars',
  familyId: 'F1',
  i_bendemographics: { districtID: 1, blockID: 2, districtBranchID: 3 },
};

const SESSION = {
  serviceLineDetails: JSON.stringify({ facilityID: 9 }),
  userName: 'reg-user',
  providerServiceID: 42,
};

describe('RegistrationComponent (edit beneficiary)', () => {
  let fixture: ComponentFixture<RegistrationComponent>;
  let component: RegistrationComponent;
  let registrar: any;
  let confirmation: any;
  let dialog: any;
  let router: Router;
  let removedIDs: any;

  beforeEach(async () => {
    registrar = autoSpy(RegistrarService, {
      registrationMasterDetails$: new BehaviorSubject<any>(MASTER),
      beneficiaryEditDetails$: new BehaviorSubject<any>(REVISIT),
      healthIdMobVerificationCheck$: new BehaviorSubject<any>(null),
    });
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [RegistrationComponent],
      providers: [
        ...commonTestProviders({ session: SESSION }),
        { provide: RegistrarService, useValue: registrar },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: { beneficiaryID: '100' } } },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(RegistrationComponent);
    component = fixture.componentInstance;
    removedIDs = { removedGovIDs: [], removedOtherGovIDs: [] };
    const children: Record<string, any> = {
      otherDetails: {
        resetForm: jasmine.createSpy('resetForm'),
        setcheckBoxEnabledByDefault: jasmine.createSpy('setcheck'),
        getRemovedIDs: () => removedIDs,
      },
      demographicDetails: { setDemographicDefaults: jasmine.createSpy('d') },
      personalDetails: {
        setPhoneSelectionEnabledByDefault: jasmine.createSpy('p'),
      },
    };
    Object.keys(children).forEach((k) =>
      Object.defineProperty(component, k, {
        get: () => children[k],
        set: () => undefined,
        configurable: true,
      }),
    );
    confirmation = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();
  });

  const personal = () =>
    component.beneficiaryRegistrationForm.controls[
      'personalDetailsForm'
    ] as FormGroup;
  const other = () =>
    component.beneficiaryRegistrationForm.controls[
      'otherDetailsForm'
    ] as FormGroup;

  it('loads the component in edit mode with the beneficiary data', () => {
    expect(component.patientRevisit).toBeTrue();
    expect(component.revisitData).toEqual(REVISIT);
    expect(router.navigate).not.toHaveBeenCalled();
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('renders update/cancel buttons and edit header in edit mode', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('#saveButton')).toBeTruthy();
    expect(el.querySelector('#cancelButton')).toBeTruthy();
    expect(el.querySelector('#resetButton')).toBeNull();
    expect(el.querySelector('#familyTagging')).toBeTruthy();
    expect(el.querySelector('h3')?.textContent).toContain(
      LANGUAGE_EN.bendetails.edit,
    );
  });

  it('ngOnDestroy unsubscribes from beneficiary data and clears it', () => {
    const sub = component.revisitDataSubscription;
    component.ngOnDestroy();
    expect(sub.closed).toBeTrue();
    expect(registrar.clearBeneficiaryEditDetails).toHaveBeenCalled();
  });

  describe('updateBeneficiarynPassToNurse', () => {
    beforeEach(() => {
      personal().patchValue({
        beneficiaryID: '100',
        beneficiaryRegID: 555,
        dob: new Date(1980, 0, 1),
      });
    });

    it('updates, maps ABHA and navigates to search', () => {
      other().patchValue({ healthId: 'a.b', healthIdMode: 'AADHAR' });
      registrar.updateBeneficiary.and.returnValue(
        of({ statusCode: 200, data: { response: 'Updated' } }),
      );
      component.updateBeneficiarynPassToNurse();
      const payload = registrar.updateBeneficiary.calls.mostRecent().args[0];
      expect(payload.passToNurse).toBeTrue();
      expect(payload.facilityID).toBe(9);
      expect(payload.benPhoneMaps[0].modifiedBy).toBe('reg-user');
      expect(confirmation.alert).toHaveBeenCalledWith('Updated', 'success');
      expect(registrar.mapHealthId).toHaveBeenCalledWith(
        jasmine.objectContaining({
          beneficiaryID: '100',
          healthId: 'a.b',
          authenticationMode: 'AADHAR',
        }),
      );
      expect(router.navigate).toHaveBeenCalledWith(['/registrar/search/']);
    });

    it('alerts when ABHA mapping fails', () => {
      other().patchValue({ healthIdNumber: '12' });
      registrar.updateBeneficiary.and.returnValue(
        of({ statusCode: 200, data: { response: 'ok' } }),
      );
      registrar.mapHealthId.and.returnValue(of({ statusCode: 400 }));
      component.updateBeneficiarynPassToNurse(false);
      expect(
        registrar.updateBeneficiary.calls.mostRecent().args[0].passToNurse,
      ).toBeFalse();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.issueInSavngData,
        'error',
      );
    });

    it('skips mapping without ABHA and alerts on failure', () => {
      registrar.updateBeneficiary.and.returnValue(
        of({ statusCode: 200, data: { response: 'ok' } }),
      );
      component.updateBeneficiarynPassToNurse();
      expect(registrar.mapHealthId).not.toHaveBeenCalled();

      registrar.updateBeneficiary.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'bad' }),
      );
      component.updateBeneficiarynPassToNurse();
      expect(confirmation.alert).toHaveBeenCalledWith('bad', 'error');
    });
  });

  describe('updateBeneficiaryDetails', () => {
    beforeEach(() => {
      personal().patchValue({
        beneficiaryID: '100',
        dob: new Date(1980, 0, 1),
      });
      component.beneficiaryRegistrationForm.controls[
        'demographicDetailsForm'
      ].patchValue({ stateID: 1 });
    });

    it('does nothing when the form is invalid', () => {
      spyOn(component, 'checkValids').and.returnValue(false);
      component.updateBeneficiaryDetails();
      expect(registrar.updateBeneficiary).not.toHaveBeenCalled();
    });

    it('updates without passing to nurse and maps a verified ABHA', () => {
      other().patchValue({ healthId: 'a.b', healthIdNumber: '1' });
      component.disableGenerateOTP = true;
      registrar.updateBeneficiary.and.returnValue(
        of({ statusCode: 200, data: { response: 'Saved' } }),
      );
      component.updateBeneficiaryDetails();
      expect(
        registrar.updateBeneficiary.calls.mostRecent().args[0].passToNurse,
      ).toBeFalse();
      expect(confirmation.alert).toHaveBeenCalledWith('Saved', 'success');
      expect(registrar.mapHealthId).toHaveBeenCalledWith(
        jasmine.objectContaining({
          beneficiaryID: '100',
          healthIdNumber: '1',
          providerServiceMapId: 42,
        }),
      );
      expect(router.navigate).toHaveBeenCalledWith(['/registrar/search/']);
    });

    it('alerts when mapping fails', () => {
      other().patchValue({ healthIdNumber: '1' });
      component.disableGenerateOTP = true;
      registrar.updateBeneficiary.and.returnValue(
        of({ statusCode: 200, data: { response: 'Saved' } }),
      );
      registrar.mapHealthId.and.returnValue(of({ statusCode: 500 }));
      component.updateBeneficiaryDetails();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.issueInSavngData,
        'error',
      );
    });

    it('does not map when no ABHA was generated', () => {
      registrar.updateBeneficiary.and.returnValue(
        of({ statusCode: 200, data: { response: 'Saved' } }),
      );
      component.updateBeneficiaryDetails();
      expect(registrar.mapHealthId).not.toHaveBeenCalled();
    });

    it('alerts the error message on failure', () => {
      registrar.updateBeneficiary.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'nope' }),
      );
      component.updateBeneficiaryDetails();
      expect(confirmation.alert).toHaveBeenCalledWith('nope', 'error');
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('iEMRFormUpdate / iEMRidsUpdate', () => {
    it('builds the update payload from the form', () => {
      personal().patchValue({
        beneficiaryRegID: 555,
        beneficiaryID: '100',
        firstName: 'Ravi',
        gender: 1,
        genderName: 'Male',
        benPhMapID: 'null',
        parentRelation: 1,
        phoneNo: '9',
      });
      other().patchValue({
        community: 3,
        communityName: 'OBC',
        emailID: 'e@x',
      });
      const form: any = component.iEMRFormUpdate();
      expect(form.beneficiaryRegID).toBe(555);
      expect(form.firstName).toBe('Ravi');
      expect(form.m_gender).toEqual({ genderID: 1, genderName: 'Male' });
      expect(form.i_bendemographics.communityID).toBe(3);
      expect(form.email).toBe('e@x');
      expect(form.benPhoneMaps[0].benPhMapID).toBeNull();
      expect(form.benPhoneMaps[0].benRelationshipType.benRelationshipType).toBe(
        'Self',
      );
      expect(form.beneficiaryIdentities).toBeUndefined();
      expect(form.createdBy).toBe('reg-user');
    });

    it('collects existing, new and removed identities (de-duplicated master)', () => {
      const utils = new RegistrationUtils(new FormBuilder());
      const govID = other().controls['govID'] as FormArray;
      const otherGovID = other().controls['otherGovID'] as FormArray;
      govID.at(0).patchValue({
        type: 1,
        idValue: 'A1',
        deleted: false,
        benIdentityId: 10,
      });
      govID.push(utils.initGovID());
      govID.at(1).patchValue({
        type: 2,
        idValue: 'V1',
        deleted: false,
        benIdentityId: null,
      });
      otherGovID.at(0).patchValue({
        type: 7,
        idValue: 'S1',
        deleted: false,
        benIdentityId: 20,
      });
      otherGovID.push(utils.initGovID());
      otherGovID.at(1).patchValue({ type: 7, idValue: 'S2' });
      removedIDs.removedGovIDs = [
        { type: 2, idValue: 'OLD', benIdentityId: 30, createdBy: 'u0' },
      ];
      removedIDs.removedOtherGovIDs = [
        { type: 7, idValue: 'OLDS', benIdentityId: 40, createdBy: 'u1' },
      ];

      const ids: any[] = (component.iEMRFormUpdate() as any)
        .beneficiaryIdentities;
      expect(
        ids.map((i) => [
          i.govtIdentityNo,
          i.govtIdentityType.isGovtID,
          i.deleted,
        ]),
      ).toEqual([
        ['A1', true, false],
        ['S1', false, false],
        ['OLD', true, true],
        ['OLDS', false, true],
        ['V1', true, false],
        ['S2', false, false],
      ]);
      expect(ids[0].govtIdentityType.identityType).toBe('Aadhar');
      expect(ids[2].createdBy).toBe('u0');
      expect(ids[4].createdBy).toBe('reg-user');
    });
  });

  describe('NavigateToFamilyTagging', () => {
    it('navigates with the full beneficiary details', () => {
      component.NavigateToFamilyTagging();
      expect(router.navigate).toHaveBeenCalledWith([
        '/registrar/familyTagging',
        {
          beneficiaryRegID: 555,
          familyName: 'Kumars',
          familyId: 'F1',
          beneficiaryName: 'Ravi Kumar',
          benDistrictId: 1,
          benBlockId: 2,
          benVillageId: 3,
          beneficiaryId: '100',
        },
      ]);
    });

    it('falls back to nulls / last name when details are missing', () => {
      component.revisitData = {
        beneficiaryRegID: 1,
        beneficiaryID: 2,
        lastName: '',
        i_bendemographics: {},
      };
      component.NavigateToFamilyTagging();
      const req = (router.navigate as jasmine.Spy).calls.mostRecent()
        .args[0][1];
      expect(req).toEqual({
        beneficiaryRegID: 1,
        familyName: '',
        familyId: null,
        beneficiaryName: null,
        benDistrictId: null,
        benBlockId: null,
        benVillageId: null,
        beneficiaryId: 2,
      });
    });
  });

  describe('viewHealthIdData', () => {
    it('opens the ABHA details modal on success', () => {
      const res = { statusCode: 200, data: [{ healthId: 'x' }] };
      registrar.getHealthIdDetails.and.returnValue(of(res));
      component.viewHealthIdData();
      expect(registrar.getHealthIdDetails).toHaveBeenCalledWith({
        beneficiaryRegID: 555,
        beneficiaryID: '100',
      });
      expect(dialog.open).toHaveBeenCalledWith(HealthIdDisplayModalComponent, {
        data: { dataList: res },
      });
    });

    it('alerts on non-200 and on error', () => {
      registrar.getHealthIdDetails.and.returnValue(of({ statusCode: 5000 }));
      component.viewHealthIdData();
      registrar.getHealthIdDetails.and.returnValue(throwingObs());
      component.viewHealthIdData();
      expect(confirmation.alert).toHaveBeenCalledTimes(2);
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.issueInGettingBeneficiaryABHADetails,
        'error',
      );
      expect(dialog.open).not.toHaveBeenCalled();
    });
  });
});
