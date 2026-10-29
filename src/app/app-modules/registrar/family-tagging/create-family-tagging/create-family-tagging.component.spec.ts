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
import { MatDialogRef } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { of } from 'rxjs';

import { CreateFamilyTaggingComponent } from './create-family-tagging.component';
import { FamilyTaggingService } from '../../shared/services/familytagging.service';
import { ConfirmationService } from 'src/app/app-modules/core/services/confirmation.service';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

const RELATIONS = [
  { benRelationshipID: 1, benRelationshipType: 'Self' },
  { benRelationshipID: 2, benRelationshipType: 'Wife' },
  { benRelationshipID: 3, benRelationshipType: 'Other' },
];

describe('CreateFamilyTaggingComponent', () => {
  let component: CreateFamilyTaggingComponent;
  let fixture: ComponentFixture<CreateFamilyTaggingComponent>;
  let familySvc: any;
  let confirm: any;
  let dialogRef: any;

  const dialogData = {
    benFamilyName: 'Sharma',
    benFamilyID: 10,
    benRegId: 55,
    beneficiaryName: 'Ravi',
    benVillageId: '77',
  };

  async function setup(
    relRes: any = {
      statusCode: 200,
      data: { relationshipMaster: RELATIONS },
    },
  ) {
    familySvc = autoSpy(FamilyTaggingService);
    familySvc.getRelationShips.and.returnValue(of(relRes));
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MatSelectModule, MatInputModule],
      declarations: [CreateFamilyTaggingComponent],
      providers: [
        ...commonTestProviders({
          dialogData,
          session: {
            serviceLineDetails: JSON.stringify({
              facilityID: 4,
              parkingPlaceID: 6,
            }),
            userName: 'nurse1',
          },
        }),
        { provide: FamilyTaggingService, useValue: familySvc },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(CreateFamilyTaggingComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    dialogRef = TestBed.inject(MatDialogRef);
    fixture.detectChanges();
  }

  describe('with relationship master', () => {
    beforeEach(async () => setup());

    it('initialises from dialog data and loads relationships', () => {
      expect(component.benFamilyName).toBe('Sharma');
      expect(component.benFamilyID).toBe(10);
      expect(component.beneficiaryRegID).toBe(55);
      expect(component.beneficiaryName).toBe('Ravi');
      expect(component.benVillageId).toBe('77');
      expect(component.familyName).toBe('Sharma');
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(familySvc.getRelationShips).toHaveBeenCalledWith(1);
      expect(component.relationShipType).toEqual(RELATIONS);
      expect(component.newFamilyTaggingForm.value).toEqual({
        familyName: null,
        isHeadOfTheFamily: null,
        relationWithHeadOfFamily: null,
        otherRelation: null,
      });
    });

    it('ngDoCheck refreshes language', () => {
      component.currentLanguageSet = null;
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });

    it('populateRelation yes picks Self', () => {
      component.enableOther = true;
      component.otherRelation = 'x';
      component.populateRelation('Yes');
      expect(component.relationShipList).toEqual([RELATIONS[0]]);
      expect(component.relationWithHeadOfFamily).toBe(1);
      expect(component.enableOther).toBeFalse();
      expect(component.otherRelation).toBeNull();
    });

    it('populateRelation no lists non-self relations', () => {
      component.populateRelation('No');
      expect(component.relationShipList).toEqual([RELATIONS[1], RELATIONS[2]]);
      expect(component.relationWithHeadOfFamily).toBeNull();
    });

    it('checkOtherRelation toggles enableOther', () => {
      component.otherRelation = 'abc';
      component.checkOtherRelation(3);
      expect(component.enableOther).toBeTrue();
      expect(component.otherRelation).toBeNull();
      component.checkOtherRelation(2);
      expect(component.enableOther).toBeFalse();
    });

    it('ResetForm resets the template form and hides other', () => {
      component.enableOther = true;
      const resetSpy = spyOn(component.form, 'reset');
      component.ResetForm();
      expect(resetSpy).toHaveBeenCalled();
      expect(component.enableOther).toBeFalse();
    });

    describe('createNewFamilyTagging', () => {
      beforeEach(() => {
        spyOn(console, 'log');
        component.relationWithHeadOfFamily = 1;
        component.otherRelation = null;
      });

      it('builds request (head of family) and closes with created data', () => {
        component.isHeadOfTheFamily = 'yes';
        familySvc.createFamilyTagging.and.returnValue(
          of({ statusCode: 200, data: { familyId: 'F1' } }),
        );
        component.createNewFamilyTagging();
        expect(familySvc.createFamilyTagging).toHaveBeenCalledWith({
          beneficiaryRegId: 55,
          familyName: 'Sharma',
          headofFamily_RelationID: 1,
          headofFamily_Relation: 'Self',
          familyHeadName: 'Ravi',
          other: null,
          villageId: 77,
          facilityID: 4,
          parkingPlaceID: 6,
          createdBy: 'nurse1',
        });
        expect(confirm.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.familyCreatedSuccessfully,
          'success',
        );
        expect(component.getCreatedFamilyDetails).toEqual({ familyId: 'F1' });
        expect(dialogRef.close).toHaveBeenCalledWith({ familyId: 'F1' });
      });

      it('non head sets familyHeadName null; non-200 alerts and closes false', () => {
        component.isHeadOfTheFamily = 'No';
        component.relationWithHeadOfFamily = 2;
        familySvc.createFamilyTagging.and.returnValue(
          of({ statusCode: 5000, errorMessage: 'fail' }),
        );
        component.createNewFamilyTagging();
        const req = familySvc.createFamilyTagging.calls.mostRecent().args[0];
        expect(req.familyHeadName).toBeNull();
        expect(req.headofFamily_Relation).toBe('Wife');
        expect(confirm.alert).toHaveBeenCalledWith('fail', 'error');
        expect(dialogRef.close).toHaveBeenCalledWith(false);
      });

      it('error alerts and closes false', () => {
        familySvc.createFamilyTagging.and.returnValue(throwingObs('boom'));
        component.createNewFamilyTagging();
        expect(confirm.alert).toHaveBeenCalledWith('boom', 'error');
        expect(dialogRef.close).toHaveBeenCalledWith(false);
      });
    });
  });

  it('alerts when relationship master fails', async () => {
    await setup({ statusCode: 5000 });
    expect(confirm.alert).toHaveBeenCalledWith(
      LANGUAGE_EN.issueFetchingRelationship,
      'error',
    );
    expect(component.relationShipType).toEqual([]);
  });
});
