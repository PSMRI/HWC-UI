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
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { of } from 'rxjs';

import { FamilyTaggingDetailsComponent } from './family-tagging-details.component';
import { FamilyTaggingService } from '../../shared/services/familytagging.service';
import { RegistrarService } from '../../shared/services/registrar.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { ConfirmationService } from 'src/app/app-modules/core/services/confirmation.service';
import { CreateFamilyTaggingComponent } from '../create-family-tagging/create-family-tagging.component';
import { EditFamilyTaggingComponent } from '../edit-family-tagging/edit-family-tagging.component';
import { SearchFamilyComponent } from '../../search-family/search-family.component';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  createDialogRefMock,
  throwingObs,
} from 'src/testing/test-utils';

const FULL_PARAMS = {
  familyId: 'F1',
  familyName: 'Sharma',
  beneficiaryRegID: '55',
  beneficiaryName: 'Ravi',
  benDistrictId: '2',
  benBlockId: '3',
  benVillageId: '4',
  beneficiaryId: '999',
};

describe('FamilyTaggingDetailsComponent', () => {
  let component: FamilyTaggingDetailsComponent;
  let fixture: ComponentFixture<FamilyTaggingDetailsComponent>;
  let familySvc: any;
  let registrar: any;
  let session: any;
  let dialog: any;
  let confirm: any;

  async function setup(params: Record<string, string>, searchRes?: any) {
    familySvc = autoSpy(FamilyTaggingService);
    familySvc.benFamilySearch.and.returnValue(
      of(searchRes ?? { statusCode: 200, data: [] }),
    );
    registrar = autoSpy(RegistrarService, {
      stateIdFamily: 5,
      beneficiaryEditDetails: of(null),
    });
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MatTableModule],
      declarations: [FamilyTaggingDetailsComponent],
      providers: [
        ...commonTestProviders(),
        { provide: FamilyTaggingService, useValue: familySvc },
        { provide: RegistrarService, useValue: registrar },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap(params) } },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(FamilyTaggingDetailsComponent);
    component = fixture.componentInstance;
    session = TestBed.inject(SessionStorageService);
    dialog = TestBed.inject(MatDialog);
    confirm = TestBed.inject(ConfirmationService);
    fixture.detectChanges();
  }

  describe('ngOnInit', () => {
    it('with family id loads family search details', async () => {
      await setup(FULL_PARAMS, {
        statusCode: 200,
        data: [{ familyId: 'F1' }],
      });
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(session.setItem).toHaveBeenCalledWith('beneficiaryID', '999');
      expect(session.setItem).toHaveBeenCalledWith('beneficiaryRegID', '55');
      expect(familySvc.benFamilySearch).toHaveBeenCalledWith({
        beneficiaryRegID: '55',
        familyName: 'Sharma',
        familyId: 'F1',
        districtId: '2',
        blockId: '3',
        villageId: '4',
        beneficiaryId: '999',
      });
      expect(component.familySearchList).toEqual([{ familyId: 'F1' }]);
      expect(component.enableFamilyCreateTable).toBeFalse();
    });

    it("normalises 'null'/'undefined' params to null and skips search", async () => {
      const p: any = {};
      Object.keys(FULL_PARAMS).forEach(
        (k, i) => (p[k] = i % 2 ? 'null' : 'undefined'),
      );
      await setup(p);
      expect(component.benFamilyId).toBeNull();
      expect(component.benFamilyName).toBeNull();
      expect(component.beneficiaryRegID).toBeNull();
      expect(component.beneficiaryName).toBeNull();
      expect(component.benDistrictId).toBeNull();
      expect(component.benBlockId).toBeNull();
      expect(component.benVillageId).toBeNull();
      expect(component.beneficiaryId).toBeNull();
      expect(component.familySearchList).toEqual([]);
      expect(component.enableFamilyCreateTable).toBeTrue();
      expect(familySvc.benFamilySearch).not.toHaveBeenCalled();
    });

    it('uses familySearchListDetails param when present', async () => {
      await setup({
        familySearchListDetails: JSON.stringify({
          familyDetails: [{ familyId: 'X' }],
          searchRequest: { q: 1 },
        }),
      });
      expect(component.familySearchList).toEqual([{ familyId: 'X' }]);
      expect(component.searchRequest).toEqual({ q: 1 });
      expect(component.enableFamilyCreateTable).toBeFalse();
      expect(component.createdFamilyList).toEqual([]);
    });
  });

  describe('after init', () => {
    beforeEach(async () => setup(FULL_PARAMS));

    it('ngDoCheck refreshes language', () => {
      component.currentLanguageSet = null;
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });

    it('ngOnDestroy clears state', () => {
      component.ngOnDestroy();
      expect(registrar.stateIdFamily).toBeNull();
      expect(session.removeItem).toHaveBeenCalledWith('beneficiaryRegID');
      expect(session.removeItem).toHaveBeenCalledWith('beneficiaryID');
    });

    it('loadSearchDetails empties list for response wrapper or failure', () => {
      familySvc.benFamilySearch.and.returnValue(
        of({ statusCode: 200, data: { response: 'none' } }),
      );
      component.loadSearchDetails({});
      expect(component.familySearchList).toEqual([]);
      familySvc.benFamilySearch.and.returnValue(of(null));
      component.familySearchList = [1];
      component.loadSearchDetails({});
      expect(component.familySearchList).toEqual([]);
    });

    describe('CreateFamilyDialog', () => {
      it('opens create dialog with data and handles created family', () => {
        dialog.open.and.returnValue(createDialogRefMock({ familyId: 'NEW' }));
        familySvc.getBenFamilyDetailsByBenRegId.and.returnValue(
          of({ statusCode: 200, data: { familyId: 'NEW' } }),
        );
        component.CreateFamilyDialog();
        expect(dialog.open).toHaveBeenCalledWith(
          CreateFamilyTaggingComponent,
          jasmine.objectContaining({
            data: {
              benFamilyName: 'Sharma',
              benFamilyID: 'F1',
              benRegId: '55',
              beneficiaryName: 'Ravi',
              benVillageId: '4',
            },
          }),
        );
        expect(component.createdFamilyList).toEqual([{ familyId: 'NEW' }]);
        expect(component.enableFamilyCreateTable).toBeTrue();
        expect(component.familySearchList).toEqual([]);
        expect(familySvc.getBenFamilyDetailsByBenRegId).toHaveBeenCalledWith({
          beneficiaryRegId: '55',
        });
        expect(component.benFamilyId).toBe('NEW');
        expect(registrar.getBenFamilyDetails).toHaveBeenCalledWith('NEW');
      });

      it('ignores falsy result', () => {
        dialog.open.and.returnValue(createDialogRefMock(false));
        component.createdFamilyList = [];
        component.CreateFamilyDialog();
        expect(component.createdFamilyList).toEqual([]);
        expect(familySvc.getBenFamilyDetailsByBenRegId).not.toHaveBeenCalled();
      });

      it('alerts on afterClosed error', () => {
        const ref = createDialogRefMock();
        ref.afterClosed.and.returnValue(throwingObs('oops'));
        dialog.open.and.returnValue(ref);
        component.CreateFamilyDialog();
        expect(confirm.alert).toHaveBeenCalledWith('oops', 'error');
      });
    });

    it('sideNavModeChange sets mode by width and toggles', () => {
      const sidenav = { mode: '', toggle: jasmine.createSpy('toggle') };
      component.sideNavModeChange(sidenav);
      expect(sidenav.mode).toBe(window.screen.width < 700 ? 'over' : 'side');
      expect(sidenav.toggle).toHaveBeenCalled();
      spyOnProperty(window.screen, 'width').and.returnValue(500);
      component.sideNavModeChange(sidenav);
      expect(sidenav.mode).toBe('over');
    });

    describe('openSearchFamily', () => {
      it('opens search dialog and applies result', () => {
        dialog.open.and.returnValue(
          createDialogRefMock({
            familyDetails: [{ familyId: 'S' }],
            searchRequest: { s: 1 },
          }),
        );
        familySvc.getBenFamilyDetailsByBenRegId.and.returnValue(
          of({ statusCode: 200, data: {} }),
        );
        component.openSearchFamily();
        expect(dialog.open).toHaveBeenCalledWith(
          SearchFamilyComponent,
          jasmine.objectContaining({
            data: {
              benSurname: 'Sharma',
              benDistrictId: '2',
              benBlockId: '3',
              benVillageId: '4',
            },
          }),
        );
        expect(component.familySearchList).toEqual([{ familyId: 'S' }]);
        expect(component.searchRequest).toEqual({ s: 1 });
        expect(component.enableFamilyCreateTable).toBeFalse();
        expect(component.benFamilyId).toBeNull();
        expect(registrar.getBenFamilyDetails).toHaveBeenCalledWith(null);
      });

      it('ignores null result', () => {
        dialog.open.and.returnValue(createDialogRefMock(null));
        component.openSearchFamily();
        expect(familySvc.getBenFamilyDetailsByBenRegId).not.toHaveBeenCalled();
      });
    });

    it('PatientRevistData copies non-null edit details', () => {
      registrar.beneficiaryEditDetails = of({ a: 1 });
      component.PatientRevistData();
      expect(component.revisitData).toEqual({ a: 1 });
      registrar.beneficiaryEditDetails = of(null);
      component.PatientRevistData();
      expect(component.revisitData).toEqual({ a: 1 });
    });

    it('backToRegistration navigates', () => {
      const router = TestBed.inject(Router);
      spyOn(router, 'navigate').and.resolveTo(true);
      component.backToRegistration();
      expect(router.navigate).toHaveBeenCalledWith(['/registrar/registration']);
    });

    describe('getFamilyMembers / openFamilyTagDialog', () => {
      const fam = { familyId: 'F9', familyHeadName: 'Head' };

      it('opens edit dialog with members and reloads on close true', () => {
        familySvc.getFamilyMemberDetails.and.returnValue(
          of({ statusCode: 200, data: { familyMembers: [] } }),
        );
        dialog.open.and.returnValue(createDialogRefMock(true));
        component.searchRequest = { r: 1 };
        familySvc.benFamilySearch.calls.reset();
        component.getFamilyMembers(true, fam);
        expect(familySvc.getFamilyMemberDetails).toHaveBeenCalledWith({
          familyId: 'F9',
        });
        expect(dialog.open).toHaveBeenCalledWith(
          EditFamilyTaggingComponent,
          jasmine.objectContaining({
            data: {
              isEdit: true,
              familyData: { familyMembers: [] },
              beneficiaryRegID: '55',
              memberFamilyId: 'F9',
              headInFamily: 'Head',
              beneficiaryName: 'Ravi',
            },
          }),
        );
        expect(familySvc.benFamilySearch).toHaveBeenCalledWith({ r: 1 });
        expect(familySvc.getBenFamilyDetailsByBenRegId).toHaveBeenCalled();
      });

      it('does not reload when edit dialog closes false', () => {
        dialog.open.and.returnValue(createDialogRefMock(false));
        component.openFamilyTagDialog(false, fam, {});
        expect(familySvc.getBenFamilyDetailsByBenRegId).not.toHaveBeenCalled();
      });

      it('alerts on non-200 and error', () => {
        familySvc.getFamilyMemberDetails.and.returnValue(
          of({ statusCode: 5000, errorMessage: 'm' }),
        );
        component.getFamilyMembers(true, fam);
        expect(confirm.alert).toHaveBeenCalledWith('m', 'error');
        familySvc.getFamilyMemberDetails.and.returnValue(throwingObs('x'));
        component.getFamilyMembers(true, fam);
        expect(confirm.alert).toHaveBeenCalledWith('x', 'error');
        expect(dialog.open).not.toHaveBeenCalled();
      });
    });

    it('getBeneficiaryDetailsAfterFamilyTag alerts on error', () => {
      familySvc.getBenFamilyDetailsByBenRegId.and.returnValue(
        throwingObs('fail'),
      );
      component.getBeneficiaryDetailsAfterFamilyTag();
      expect(confirm.alert).toHaveBeenCalledWith('fail', 'error');
    });
  });
});
