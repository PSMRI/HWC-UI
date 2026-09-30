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
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, Subject, of } from 'rxjs';
import {
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  createDialogRefMock,
  throwingObs,
} from 'src/testing/test-utils';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { environment } from 'src/environments/environment';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { CameraService } from '../../core/services/camera.service';
import { BeneficiaryDetailsService } from '../../core/services/beneficiary-details.service';
import { CommonService } from '../../core/services/common-services.service';
import { HealthIdDisplayModalComponent } from '../../core/components/health-id-display-modal/health-id-display-modal.component';
import { RegistrarService } from '../shared/services/registrar.service';
import { SearchDialogComponent } from '../search-dialog/search-dialog.component';
import { QuickSearchComponent } from '../quick-search/quick-search.component';
import { SearchComponent } from './search.component';

function identityBen(overrides: any = {}) {
  return {
    beneficiaryID: '123456789012',
    beneficiaryRegID: 55,
    firstName: 'Asha',
    lastName: 'Rao',
    m_gender: { genderName: 'Female' },
    fatherName: 'Ravi',
    i_bendemographics: { districtName: 'Pune', districtBranchName: 'Kothrud' },
    benPhoneMaps: [{ phoneNo: '9999999999' }, { phoneNo: '8888888888' }],
    dOB: '1990-01-01T00:00:00.000Z',
    createdDate: '2024-03-05T10:00:00.000Z',
    ...overrides,
  };
}

/** MatTableDataSource subscribes to paginator.page / initialized. */
function fakePaginator(extra: any = {}) {
  return {
    page: new Subject<any>(),
    initialized: of(undefined),
    pageIndex: 0,
    pageSize: 5,
    length: 0,
    firstPage: () => undefined,
    ...extra,
  };
}

function externalBen(gender = 'F') {
  return {
    id: 'mongo1',
    amritId: 'A1',
    healthId: 'asha@sbx',
    healthIdNumber: '12-3456-7890-1234',
    externalId: 'EXT1',
    profile: {
      patient: {
        name: 'Asha Rao',
        firstName: 'Asha',
        lastName: 'Rao',
        gender,
        yearOfBirth: 1990,
        monthOfBirth: 1,
        dayOfBirth: 2,
        address: { state: 'Karnataka', district: 'Mysore', village: 'V1' },
      },
    },
  };
}

describe('Registrar SearchComponent', () => {
  let component: SearchComponent;
  let fixture: ComponentFixture<SearchComponent>;
  let registrar: any;
  let common: any;
  let camera: any;
  let benDetails: any;
  let confirm: any;
  let dialog: any;
  let session: any;
  let router: any;
  let masterSubject: BehaviorSubject<any>;
  const origExt = environment.abhaExtension;

  beforeEach(async () => {
    masterSubject = new BehaviorSubject<any>({
      genderMaster: [
        { genderID: 1, genderName: 'Male' },
        { genderID: 2, genderName: 'Female' },
        { genderID: 3, genderName: 'Transgender' },
      ],
    });
    registrar = autoSpy(RegistrarService, {
      registrationMasterDetails$: masterSubject.asObservable(),
    });
    common = autoSpy(CommonService);
    common.getStates.and.returnValue(
      of([
        { stateID: 10, stateName: 'Karnataka' },
        { stateID: 11, stateName: 'Kerala' },
      ]),
    );
    camera = autoSpy(CameraService);
    benDetails = autoSpy(BeneficiaryDetailsService);
    router = {
      navigate: jasmine.createSpy('navigate').and.resolveTo(true),
      routerState: { snapshot: { url: '/registrar/search' } },
    };
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        NoopAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
      ],
      declarations: [SearchComponent],
      providers: [
        ...commonTestProviders({
          session: {
            serviceLineDetails: JSON.stringify({
              vanID: 7,
              facilityID: 8,
              parkingPlaceID: 9,
            }),
            providerServiceID: 4,
            servicePointID: 3,
            servicePointName: 'SP',
            userName: 'nurse1',
          },
        }),
        { provide: RegistrarService, useValue: registrar },
        { provide: CommonService, useValue: common },
        { provide: CameraService, useValue: camera },
        { provide: BeneficiaryDetailsService, useValue: benDetails },
        { provide: Router, useValue: router },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(SearchComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    session = TestBed.inject(SessionStorageService);
    fixture.detectChanges();
  });

  afterEach(() => {
    (environment as any).abhaExtension = origExt;
    fixture.destroy();
  });

  describe('init', () => {
    it('sets defaults, language, states and loads registration master', () => {
      expect(component.searchCategory).toBe('Beneficiary ID');
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(common.getStates).toHaveBeenCalledWith(1);
      expect(component.statesList.length).toBe(2);
      expect(registrar.getRegistrationMaster).toHaveBeenCalledWith(1);
    });

    it('ignores a null states response', () => {
      component.statesList = undefined;
      common.getStates.and.returnValue(of(null));
      component.stateMaster();
      expect(component.statesList).toBeUndefined();
    });

    it('alerts when fetching states fails', () => {
      common.getStates.and.returnValue(throwingObs());
      component.stateMaster();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.errorInfetchingStates,
        'error',
      );
    });

    it('ngDoCheck re-assigns language and ngAfterViewInit binds paginator', () => {
      component.currentLanguageSet = null;
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      const p: any = fakePaginator({ pageSize: 0 });
      component.paginator = p;
      component.ngAfterViewInit();
      expect(component.dataSource.paginator).toBe(p);
    });

    it('matPaginator setter stores and binds the paginator', () => {
      const p: any = fakePaginator();
      component.matPaginator = p;
      expect(component.paginator).toBe(p);
      expect(component.dataSource.paginator).toBe(p);
    });

    it('clearSearchTerm nulls the quick search term', () => {
      component.quicksearchTerm = 'x';
      component.clearSearchTerm();
      expect(component.quicksearchTerm).toBeNull();
    });
  });

  describe('validateSearchTerm / searchBeneficiaryDetails', () => {
    beforeEach(() => {
      registrar.identityQuickSearch.and.returnValue(
        of({ data: [identityBen()] }),
      );
    });

    [undefined, null, '   '].forEach((term) => {
      it(`rejects empty term ${JSON.stringify(term)}`, () => {
        component.beneficiaryList = [1];
        component.validateSearchTerm(term, 'Phone No');
        expect(component.beneficiaryList).toEqual([]);
        expect(confirm.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.pleaseEnterValidInput,
          'info',
        );
        expect(registrar.identityQuickSearch).not.toHaveBeenCalled();
      });
    });

    it('searches by phone number', () => {
      component.validateSearchTerm('9999999999', 'Phone No');
      expect(registrar.identityQuickSearch).toHaveBeenCalledWith({
        beneficiaryRegID: null,
        beneficiaryID: null,
        phoneNo: '9999999999',
        HealthID: null,
        HealthIDNumber: null,
        familyId: null,
        identity: null,
      });
      expect(component.beneficiaryList.length).toBe(1);
      expect(component.dataSource.data.length).toBe(1);
      expect(component.filteredBeneficiaryList).toBe(component.beneficiaryList);
    });

    it('searches by beneficiary id and resets the paginator', () => {
      const paginator: any = fakePaginator({
        pageSize: 10,
        firstPage: jasmine.createSpy('firstPage'),
      });
      component.paginator = paginator;
      component.searchBeneficiaryDetails('123456789012', 'Beneficiary ID');
      expect(
        registrar.identityQuickSearch.calls.mostRecent().args[0].beneficiaryID,
      ).toBe('123456789012');
      expect(paginator.pageSize).toBe(5);
      expect(paginator.firstPage).toHaveBeenCalled();
    });

    it('searches by family id', () => {
      component.searchBeneficiaryDetails('12345678901234567', 'Family ID');
      expect(
        registrar.identityQuickSearch.calls.mostRecent().args[0].familyId,
      ).toBe('12345678901234567');
    });

    it('searches by health id number (14 digits)', () => {
      component.searchBeneficiaryDetails('12345678901234', 'HealthID Number');
      expect(
        registrar.identityQuickSearch.calls.mostRecent().args[0].HealthID,
      ).toBe('12345678901234');
    });

    it('searches by health id (17 chars)', () => {
      component.searchBeneficiaryDetails('12-3456-7890-1234', 'Health ID');
      expect(
        registrar.identityQuickSearch.calls.mostRecent().args[0].HealthID,
      ).toBe('12-3456-7890-1234');
    });

    it('searches by government id (10 and 12)', () => {
      component.searchBeneficiaryDetails('ABCDE12345', 'GovID');
      expect(
        registrar.identityQuickSearch.calls.mostRecent().args[0].identity,
      ).toBe('ABCDE12345');
    });

    it('alerts for a term that does not match the category', () => {
      component.searchBeneficiaryDetails('123456789', 'Phone No');
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.pleaseEnterValidInputFor + 'Phone No',
        'info',
      );
      expect(registrar.identityQuickSearch).not.toHaveBeenCalled();
    });

    it('alerts for a term outside 8..32 chars', () => {
      component.searchBeneficiaryDetails('123', 'Phone No');
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.pleaseEnterValidInput,
        'info',
      );
    });

    it('clears lists and alerts when nothing is found', () => {
      component.beneficiaryList = [];
      registrar.identityQuickSearch.and.returnValue(of({ data: [] }));
      component.getSearchResult({}, 'Phone No');
      expect(component.filteredBeneficiaryList).toEqual([]);
      expect(component.dataSource.data).toEqual([]);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.beneNotFound,
        'info',
      );
    });

    it('alerts on search error', () => {
      registrar.identityQuickSearch.and.returnValue(throwingObs('fail'));
      component.getSearchResult({}, 'Phone No');
      expect(confirm.alert).toHaveBeenCalledWith('fail', 'error');
    });
  });

  describe('searchRestruct / getCorrectPhoneNo', () => {
    it('maps identity data to table rows with fallbacks', () => {
      const rows = component.searchRestruct(
        {
          data: [
            identityBen(),
            identityBen({
              lastName: null,
              m_gender: {},
              fatherName: null,
              i_bendemographics: {},
              benPhoneMaps: [],
              dOB: new Date().toISOString(),
            }),
          ],
        },
        { phoneNo: '8888888888' },
      );
      expect(rows[0]).toEqual(
        jasmine.objectContaining({
          beneficiaryID: '123456789012',
          benName: 'Asha Rao',
          genderName: 'Female',
          fatherName: 'Ravi',
          districtName: 'Pune',
          villageName: 'Kothrud',
          phoneNo: '8888888888',
          registeredOn: '05-03-2024',
        }),
      );
      expect(rows[0].age).not.toBe('Not Available');
      expect(rows[1]).toEqual(
        jasmine.objectContaining({
          benName: 'Asha ',
          genderName: 'Not Available',
          fatherName: 'Not Available',
          districtName: 'Not Available',
          villageName: 'Not Available',
          phoneNo: 'Not Available',
          age: 'Not Available',
        }),
      );
    });

    it('returns the first phone when there is no match or no search phone', () => {
      const maps = [{ phoneNo: '1' }, { phoneNo: '2' }];
      expect(component.getCorrectPhoneNo(maps, { phoneNo: '3' })).toBe('1');
      expect(component.getCorrectPhoneNo(maps, null)).toBe('1');
      expect(component.getCorrectPhoneNo(maps, { phoneNo: '2' })).toBe('2');
    });
  });

  describe('searchBeneficiary (quick search by any id)', () => {
    beforeEach(() => {
      registrar.identityQuickSearch.and.returnValue(
        of({ data: [identityBen()] }),
      );
    });

    it('rejects empty input', () => {
      component.searchBeneficiary('  ');
      expect(registrar.identityQuickSearch).not.toHaveBeenCalled();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.pleaseEnterValidInput,
        'info',
      );
    });

    it('rejects too short input', () => {
      component.searchBeneficiary('1234');
      expect(registrar.identityQuickSearch).not.toHaveBeenCalled();
    });

    it('searches a 10 digit phone number', () => {
      component.externalBeneficiaryList = [1];
      component.searchBeneficiary('9999999999');
      const req = registrar.identityQuickSearch.calls.mostRecent().args[0];
      expect(req.phoneNo).toBe('9999999999');
      expect(req.beneficiaryID).toBeNull();
      expect(component.externalBeneficiaryList).toEqual([]);
      expect(component.dataSource.data.length).toBe(1);
    });

    it('searches a 12 digit beneficiary id (also written into phoneNo)', () => {
      component.searchBeneficiary('123456789012');
      const req = registrar.identityQuickSearch.calls.mostRecent().args[0];
      expect(req.beneficiaryID).toBe('123456789012');
      // production quirk: phoneNo receives the chained assignment result
      expect(req.phoneNo).toBe('123456789012');
    });

    it('falls back to health id pattern for 10/12 chars that are not digits', () => {
      component.searchBeneficiary('ab12@sbx12');
      expect(registrar.identityQuickSearch).not.toHaveBeenCalled();
      component.searchBeneficiary('abcd@sbx');
      expect(
        registrar.identityQuickSearch.calls.mostRecent().args[0].HealthID,
      ).toBe('abcd@sbx');
    });

    it('accepts 14 digit and hyphenated 17 char health id numbers', () => {
      component.searchBeneficiary('12345678901234');
      component.searchBeneficiary('12-3456-7890-1234');
      expect(registrar.identityQuickSearch).toHaveBeenCalledTimes(2);
    });

    it('falls back to abha address pattern for invalid 14/17 char terms', () => {
      component.searchBeneficiary('asha.rao12@sbx');
      expect(
        registrar.identityQuickSearch.calls.mostRecent().args[0].HealthID,
      ).toBe('asha.rao12@sbx');
      component.searchBeneficiary('xx-xxxx-xxxx-xxxx');
      expect(registrar.identityQuickSearch).toHaveBeenCalledTimes(1);
    });

    it('uses the 4 letter pattern for @abdm environments', () => {
      (environment as any).abhaExtension = '@abdm';
      component.searchBeneficiary('ashara@abdm');
      expect(
        registrar.identityQuickSearch.calls.mostRecent().args[0].HealthID,
      ).toBe('ashara@abdm');
      component.searchBeneficiary('ashara@sbx');
      expect(registrar.identityQuickSearch).toHaveBeenCalledTimes(1);
    });

    it('clears and alerts on empty response', () => {
      registrar.identityQuickSearch.and.returnValue(of([]));
      component.searchBeneficiary('9999999999');
      expect(component.beneficiaryList).toEqual([]);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.beneNotFound,
        'info',
      );
    });

    it('alerts on error', () => {
      registrar.identityQuickSearch.and.returnValue(throwingObs('e'));
      component.searchBeneficiary('9999999999');
      expect(confirm.alert).toHaveBeenCalledWith('e', 'error');
    });

    it('checkValidHealthIDNumber falls through for other lengths', () => {
      const obj: any = {};
      expect(component.checkValidHealthIDNumber('abcd@sbx', obj)).toBeTrue();
      expect(obj.HealthID).toBe('abcd@sbx');
    });
  });

  describe('getHealthIDDetails', () => {
    it('opens the ABHA modal when details exist', () => {
      const abha = [{ healthID: 'x' }];
      component.getHealthIDDetails({ benObject: { abhaDetails: abha } });
      expect(dialog.open).toHaveBeenCalledWith(HealthIdDisplayModalComponent, {
        data: { dataList: abha, search: true },
      });
    });

    it('alerts when ABHA details are missing', () => {
      component.getHealthIDDetails({ benObject: { abhaDetails: [] } });
      expect(dialog.open).not.toHaveBeenCalled();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.abhaDetailsNotAvailable,
        'info',
      );
    });
  });

  describe('filters', () => {
    it('filterBeneficiaryList resets without term and filters by value', () => {
      component.beneficiaryList = [
        { benName: 'Asha', phoneNo: '1', benObject: { x: 'zzz' } },
        { benName: 'Ravi', phoneNo: '2', benObject: {} },
      ];
      component.filterBeneficiaryList('');
      expect(component.filteredBeneficiaryList).toBe(component.beneficiaryList);
      component.filterBeneficiaryList('ASH');
      expect(component.filteredBeneficiaryList.length).toBe(1);
      expect(component.dataSource.data[0].sno).toBe(1);
      component.filterBeneficiaryList('zzz');
      expect(component.filteredBeneficiaryList.length).toBe(0);
    });

    it('filterExternalBeneficiaryList resets without term and filters by value', () => {
      component.externalBeneficiaryList = [
        { benName: 'Asha', state: 'KA' },
        { benName: 'Ravi', state: 'KL' },
      ];
      component.filterExternalBeneficiaryList(undefined);
      expect(component.filteredExternalBeneficiaryList).toBe(
        component.externalBeneficiaryList,
      );
      component.filterExternalBeneficiaryList('kl');
      expect(component.filteredExternalBeneficiaryList).toEqual([
        jasmine.objectContaining({ benName: 'Ravi', sno: 1 }),
      ]);
    });
  });

  describe('patientRevisited / sendToNurseWindow', () => {
    const ben = () => ({ m_gender: { genderName: 'Male' }, dOB: '1990-01-01' });

    it('confirms and sends to nurse with service line info', () => {
      registrar.identityPatientRevisit.and.returnValue(of({ data: 'ok' }));
      const b: any = ben();
      component.patientRevisited(b);
      expect(b.vanID).toBe(7);
      expect(b.facilityID).toBe(8);
      expect(b.providerServiceMapId).toBe(4);
      expect(confirm.confirm).toHaveBeenCalledWith(
        'info',
        LANGUAGE_EN.confirmSubmitBeneficiary,
      );
      expect(registrar.identityPatientRevisit).toHaveBeenCalledWith(b);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.common.beneficiaryMovedtoNurse,
        'success',
      );
    });

    it('does not send when confirmation declined', () => {
      confirm.confirm.and.returnValue(of(false));
      component.patientRevisited(ben());
      expect(registrar.identityPatientRevisit).not.toHaveBeenCalled();
    });

    it('warns when beneficiary already added', () => {
      registrar.identityPatientRevisit.and.returnValue(of({ data: null }));
      component.sendToNurseWindow(true, {});
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.common.beneAlreadyAdded,
        'warn',
      );
    });

    it('alerts on revisit error and ignores false response', () => {
      registrar.identityPatientRevisit.and.returnValue(throwingObs('x'));
      component.sendToNurseWindow(true, {});
      expect(confirm.alert).toHaveBeenCalledWith('x', 'error');
      registrar.identityPatientRevisit.calls.reset();
      component.sendToNurseWindow(false, {});
      expect(registrar.identityPatientRevisit).not.toHaveBeenCalled();
    });

    it('alerts for missing gender and age', () => {
      component.patientRevisited({ m_gender: {}, dOB: null });
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.genderAndAgeDetails,
        'info',
      );
    });

    it('alerts for missing gender only', () => {
      component.patientRevisited({ m_gender: {}, dOB: '1990' });
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.noGenderDetails,
        'info',
      );
    });

    it('alerts for missing age only', () => {
      component.patientRevisited({ m_gender: { genderName: 'M' }, dOB: null });
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.noAgeDetailsAvail,
        'info',
      );
    });
  });

  describe('editPatientInfo', () => {
    it('stores beneficiary and navigates on confirm', () => {
      const b = { beneficiaryID: '42', benObject: { id: 1 } };
      component.editPatientInfo(b);
      expect(confirm.confirm).toHaveBeenCalledWith(
        'info',
        LANGUAGE_EN.alerts.info.editDetails,
      );
      expect(
        registrar.saveBeneficiaryEditDataASobservable,
      ).toHaveBeenCalledWith(b.benObject);
      expect(router.navigate).toHaveBeenCalledWith(['/registrar/search/42']);
    });

    it('does nothing when declined', () => {
      confirm.confirm.and.returnValue(of(false));
      component.editPatientInfo({ beneficiaryID: '42' });
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('patientImageView', () => {
    it('views the image when returned', () => {
      benDetails.getBeneficiaryImage.and.returnValue(of({ benImage: 'img' }));
      component.patientImageView(5);
      expect(benDetails.getBeneficiaryImage).toHaveBeenCalledWith(5);
      expect(camera.viewImage).toHaveBeenCalledWith('img');
    });

    it('alerts when no image', () => {
      benDetails.getBeneficiaryImage.and.returnValue(of({}));
      component.patientImageView(5);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.imageNotFound,
      );
    });

    it('ignores an empty id', () => {
      component.patientImageView('');
      expect(benDetails.getBeneficiaryImage).not.toHaveBeenCalled();
    });
  });

  describe('openSearchDialog (advance search)', () => {
    function dialogReturns(result: any) {
      dialog.open.and.returnValue(createDialogRefMock(result));
    }

    it('runs an advance search and fills the table', () => {
      dialogReturns({ firstName: 'Asha' });
      registrar.advanceSearchIdentity.and.returnValue(
        of({ data: [identityBen(), identityBen()] }),
      );
      component.openSearchDialog();
      expect(dialog.open).toHaveBeenCalledWith(SearchDialogComponent, {
        width: '60%',
        disableClose: true,
      });
      expect(registrar.advanceSearchIdentity).toHaveBeenCalledWith({
        firstName: 'Asha',
      });
      expect(component.dataSource.data.map((r: any) => r.sno)).toEqual([1, 2]);
    });

    it('alerts when the advance search is empty', () => {
      dialogReturns({ firstName: 'x' });
      registrar.advanceSearchIdentity.and.returnValue(of([]));
      component.openSearchDialog();
      expect(component.beneficiaryList).toEqual([]);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.beneNotFound,
        'info',
      );
    });

    it('alerts on advance search error', () => {
      dialogReturns({ firstName: 'x' });
      registrar.advanceSearchIdentity.and.returnValue(throwingObs('bad'));
      component.openSearchDialog();
      expect(confirm.alert).toHaveBeenCalledWith('bad', 'error');
    });

    it('does nothing when dialog is cancelled', () => {
      dialogReturns(undefined);
      component.openSearchDialog();
      expect(registrar.advanceSearchIdentity).not.toHaveBeenCalled();
    });
  });

  describe('external (mongo) search', () => {
    beforeEach(() => {
      registrar.externalSearchIdentity.and.returnValue(
        of([externalBen('F'), externalBen('M'), externalBen('O')]),
      );
    });

    it('openQuickSearch searches mongo with the dialog result', () => {
      dialog.open.and.returnValue(createDialogRefMock({ pageNo: 0 }));
      component.openQuickSearch();
      expect(dialog.open).toHaveBeenCalledWith(QuickSearchComponent, {
        width: '60%',
        disableClose: true,
      });
      expect(registrar.externalSearchIdentity).toHaveBeenCalledWith({
        pageNo: 0,
      });
      const rows = component.externalBeneficiaryList;
      expect(rows.map((r: any) => r.gender)).toEqual([
        'Female',
        'Male',
        'Others',
      ]);
      expect(rows[0]).toEqual(
        jasmine.objectContaining({
          amritID: 'A1',
          dob: '1990-1-2',
          state: 'Karnataka',
          district: 'Mysore',
          sno: 1,
        }),
      );
    });

    it('openQuickSearch ignores a cancelled dialog', () => {
      dialog.open.and.returnValue(createDialogRefMock(null));
      component.openQuickSearch();
      expect(registrar.externalSearchIdentity).not.toHaveBeenCalled();
    });

    it('searchBeneficiaryInMongo sets pageNo from argument', () => {
      component.externalSearchTerm = { pageNo: 0 };
      component.searchBeneficiaryInMongo(3);
      expect(component.externalSearchTerm.pageNo).toBe(2);
    });

    it('alerts when patient not found', () => {
      component.externalSearchTerm = {};
      registrar.externalSearchIdentity.and.returnValue(
        of({ response: 'patient not found' }),
      );
      component.searchBeneficiaryInMongo(null);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.beneNotFound,
        'info',
      );
    });

    it('clears lists on empty result', () => {
      component.externalSearchTerm = {};
      component.externalBeneficiaryList = [1];
      registrar.externalSearchIdentity.and.returnValue(of([]));
      component.searchBeneficiaryInMongo(null);
      expect(component.externalBeneficiaryList).toEqual([]);
      expect(component.dataSource.data).toEqual([]);
    });

    it('clears lists and alerts on error', () => {
      component.externalSearchTerm = {};
      component.externalBeneficiaryList = [1];
      registrar.externalSearchIdentity.and.returnValue(throwingObs('err'));
      component.searchBeneficiaryInMongo(null);
      expect(component.externalBeneficiaryList).toEqual([]);
      expect(confirm.alert).toHaveBeenCalledWith('err', 'error');
    });

    it('nextPage loads the following page into dataSourceOne', () => {
      component.externalSearchTerm = { pageNo: 0 };
      component.nextPage();
      expect(component.pageNo).toBe(2);
      expect(component.externalSearchTerm.pageNo).toBe(1);
      expect(component.dataSourceOne.data.length).toBe(3);
    });

    it('nextPage steps back when no further records', () => {
      component.externalSearchTerm = {};
      registrar.externalSearchIdentity.and.returnValue(of([]));
      component.nextPage();
      expect(component.pageNo).toBe(1);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.noFurtherRecordsToShow,
        'info',
      );
    });

    it('nextPage alerts when patient not found', () => {
      component.externalSearchTerm = {};
      registrar.externalSearchIdentity.and.returnValue(
        of({ response: 'patient not found' }),
      );
      component.nextPage();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.beneNotFound,
        'info',
      );
    });

    it('nextPage steps back on error', () => {
      component.externalSearchTerm = {};
      registrar.externalSearchIdentity.and.returnValue(throwingObs('e'));
      component.nextPage();
      expect(component.pageNo).toBe(1);
      expect(confirm.alert).toHaveBeenCalledWith('e', 'error');
    });

    it('prevPage searches the previous page', () => {
      component.externalSearchTerm = { pageNo: 3 };
      component.pageNo = 3;
      component.prevPage();
      expect(component.pageNo).toBe(2);
      expect(component.externalSearchTerm.pageNo).toBe(1);
    });

    it('clearTableContents resets every list', () => {
      component.pageNo = 4;
      component.quicksearchTerm = 'x';
      component.dataSourceOne.data = [1];
      component.clearTableContents();
      expect(component.pageNo).toBe(1);
      expect(component.quicksearchTerm).toBeNull();
      expect(component.dataSourceOne.data).toEqual([]);
    });
  });

  describe('migrateBeneficiaryToAmrit', () => {
    beforeEach(() => {
      registrar.getDistrictList.and.returnValue(
        of({
          statusCode: 200,
          data: [
            { districtID: 100, districtName: 'Mysore' },
            { districtID: 101, districtName: 'Other' },
          ],
        }),
      );
    });

    it('resolves ids, submits to AMRIT and updates mongo', () => {
      registrar.submitBeneficiary.and.returnValue(
        of({ statusCode: 200, data: { response: 'Registered BenID 1234' } }),
      );
      registrar.updateBenDetailsInMongo.and.returnValue(
        of({ data: { response: 'ok' } }),
      );
      registrar.externalSearchIdentity.and.returnValue(of([]));
      component.externalSearchTerm = {};
      const ben = externalBen('F');
      component.migrateBeneficiaryToAmrit(ben);
      expect(component.stateID).toBe(10);
      expect(registrar.getDistrictList).toHaveBeenCalledWith(10);
      expect(component.districtID).toBe(100);
      expect(component.genderID).toBe(2);
      expect(confirm.confirm).toHaveBeenCalledWith(
        'info',
        'Please confirm to register in AMRIT',
      );
      const req = registrar.submitBeneficiary.calls.mostRecent().args[0];
      expect(req).toEqual(
        jasmine.objectContaining({
          firstName: 'Asha',
          lastName: 'Rao',
          genderName: 'Female',
          genderID: 2,
          vanID: 7,
          parkingPlaceID: 9,
          facilityID: 8,
          providerServiceMapId: 4,
          createdBy: 'nurse1',
        }),
      );
      expect(req.i_bendemographics).toEqual({
        stateName: 'Karnataka',
        stateID: 10,
        districtName: 'Mysore',
        districtID: 100,
        servicePointID: 3,
        servicePointName: 'SP',
      });
      expect(confirm.alert).toHaveBeenCalledWith(
        'Registered BenID 1234',
        'success',
      );
      expect(registrar.updateBenDetailsInMongo).toHaveBeenCalledWith({
        id: 'mongo1',
        externalId: 'EXT1',
        amritId: '1234',
      });
      expect(registrar.externalSearchIdentity).toHaveBeenCalled();
    });

    it('maps M and other genders', () => {
      confirm.confirm.and.returnValue(of(false));
      component.migrateBeneficiaryToAmrit(externalBen('M'));
      expect(component.genderID).toBe(1);
      component.migrateBeneficiaryToAmrit(externalBen('X'));
      expect(component.genderID).toBe(3);
      expect(registrar.submitBeneficiary).not.toHaveBeenCalled();
    });

    it('skips state lookup when state list is empty and ignores bad districts', () => {
      confirm.confirm.and.returnValue(of(false));
      component.statesList = [];
      component.migrateBeneficiaryToAmrit(externalBen('F'));
      expect(registrar.getDistrictList).not.toHaveBeenCalled();
      registrar.getDistrictList.and.returnValue(of({ statusCode: 500 }));
      component.getDistrict(externalBen(), 1);
      expect(component.districtList).toBeUndefined();
      registrar.getDistrictList.and.returnValue(
        of({ statusCode: 200, data: [] }),
      );
      component.getDistrict(externalBen(), 1);
      expect(component.districtID).toBeUndefined();
    });

    it('alerts error message when submit fails with non-200', () => {
      registrar.submitBeneficiary.and.returnValue(
        of({ statusCode: 500, errorMessage: 'nope' }),
      );
      component.genderID = 2;
      component.sendBenToAmrit(externalBen());
      expect(confirm.alert).toHaveBeenCalledWith('nope', 'error');
      expect(registrar.updateBenDetailsInMongo).not.toHaveBeenCalled();
    });

    it('alerts on submit error', () => {
      registrar.submitBeneficiary.and.returnValue(throwingObs('boom'));
      component.sendBenToAmrit(externalBen());
      expect(confirm.alert).toHaveBeenCalledWith('boom', 'error');
    });

    it('updateAmritIDInMongo ignores null response and logs errors', () => {
      spyOn(component, 'searchBeneficiaryInMongo');
      registrar.updateBenDetailsInMongo.and.returnValue(of(null));
      component.updateAmritIDInMongo(externalBen(), 'ID 77');
      expect(component.searchBeneficiaryInMongo).not.toHaveBeenCalled();
      registrar.updateBenDetailsInMongo.and.returnValue(throwingObs());
      component.updateAmritIDInMongo(externalBen(), 'ID 77');
      expect(component.searchBeneficiaryInMongo).not.toHaveBeenCalled();
    });
  });

  describe('sendRegisteredBeneficiaryToNurse / transferMigratedBeneficiaryToNurse', () => {
    it('sends a registered beneficiary to nurse', () => {
      registrar.identityPatientRevisit.and.returnValue(of({ data: 'ok' }));
      const b: any = { amritID: 'A1' };
      component.sendRegisteredBeneficiaryToNurse(b);
      expect(b.vanID).toBe(7);
      expect(registrar.identityPatientRevisit).toHaveBeenCalledWith(b);
    });

    it('does not send when declined', () => {
      confirm.confirm.and.returnValue(of(false));
      component.sendRegisteredBeneficiaryToNurse({ amritID: 'A1' });
      expect(registrar.identityPatientRevisit).not.toHaveBeenCalled();
    });

    it('asks to register first when no amrit id', () => {
      component.sendRegisteredBeneficiaryToNurse({ amritID: '' });
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.pleaseRegisterBeneficiaryInAMRIT,
        'info',
      );
    });

    it('transfers a migrated beneficiary', () => {
      registrar.identityPatientRevisit.and.returnValue(of({ data: 'ok' }));
      const b: any = {};
      component.transferMigratedBeneficiaryToNurse(b);
      expect(b.facilityID).toBe(8);
      expect(b.providerServiceMapId).toBe(4);
      expect(registrar.identityPatientRevisit).toHaveBeenCalledWith(b);
    });

    it('transfer does nothing when declined', () => {
      confirm.confirm.and.returnValue(of(false));
      component.transferMigratedBeneficiaryToNurse({});
      expect(registrar.identityPatientRevisit).not.toHaveBeenCalled();
    });
  });

  describe('navigateTORegistrar', () => {
    it('navigates directly when there are no results', () => {
      component.beneficiaryList = undefined;
      component.navigateTORegistrar();
      expect(router.navigate).toHaveBeenCalledWith(['/registrar/registration']);
      router.navigate.calls.reset();
      component.beneficiaryList = [];
      component.navigateTORegistrar();
      expect(router.navigate).toHaveBeenCalledWith(['/registrar/registration']);
    });

    it('confirms before leaving search results', () => {
      component.beneficiaryList = [{}];
      component.navigateTORegistrar();
      expect(confirm.confirm).toHaveBeenCalledWith(
        'info',
        LANGUAGE_EN.alerts.info.navigateSearchedData,
        'Yes',
        'No',
      );
      expect(router.navigate).toHaveBeenCalledWith(['/registrar/registration']);
    });

    it('stays when declined', () => {
      confirm.confirm.and.returnValue(of(false));
      component.beneficiaryList = [{}];
      component.navigateTORegistrar();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('does nothing when already on registration', () => {
      router.routerState.snapshot.url = '/registrar/registration';
      component.navigateTORegistrar();
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });
});
