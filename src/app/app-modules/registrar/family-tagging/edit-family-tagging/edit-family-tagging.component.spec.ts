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
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { of } from 'rxjs';

import { EditFamilyTaggingComponent } from './edit-family-tagging.component';
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

function familyData(withHead = true) {
  return {
    familyMembers: [
      withHead
        ? { memberId: 1, memberName: 'Ravi ', relationWithHead: 'Self' }
        : { memberId: 1, memberName: 'Ravi', relationWithHead: 'Son' },
      { memberId: 2, memberName: 'Sita', relationWithHead: 'Wife' },
    ],
  };
}

describe('EditFamilyTaggingComponent', () => {
  let component: EditFamilyTaggingComponent;
  let fixture: ComponentFixture<EditFamilyTaggingComponent>;
  let familySvc: any;
  let confirm: any;
  let dialogRef: any;

  async function setup(
    isEdit: boolean,
    opts: { relRes?: any; withHead?: boolean } = {},
  ) {
    familySvc = autoSpy(FamilyTaggingService);
    familySvc.getRelationShips.and.returnValue(
      of(
        opts.relRes ?? {
          statusCode: 200,
          data: { relationshipMaster: RELATIONS },
        },
      ),
    );
    await TestBed.configureTestingModule({
      imports: [
        ...COMMON_TEST_IMPORTS,
        MatSelectModule,
        MatInputModule,
        MatTableModule,
        MatCheckboxModule,
      ],
      declarations: [EditFamilyTaggingComponent],
      providers: [
        ...commonTestProviders({
          dialogData: {
            familyData: familyData(opts.withHead ?? true),
            memberFamilyId: 'FAM1',
            headInFamily: 'Ravi',
            beneficiaryName: 'Newbie',
            beneficiaryRegID: 99,
            isEdit,
          },
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
    fixture = TestBed.createComponent(EditFamilyTaggingComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    dialogRef = TestBed.inject(MatDialogRef);
    fixture.detectChanges();
  }

  describe('edit mode', () => {
    beforeEach(async () => setup(true));

    it('initialises from dialog data', () => {
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.relationShipType).toEqual(RELATIONS);
      expect(component.memberFamilyId).toBe('FAM1');
      expect(component.headInFamily).toBe('Ravi');
      expect(component.beneficiaryName).toBe('Newbie');
      expect(component.showCheckbox).toBeTrue();
      expect(component.disableForm).toBeTrue();
      expect(fixture.nativeElement.querySelectorAll('tr[mat-row]').length).toBe(
        2,
      );
      component.currentLanguageSet = null;
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });

    it('selectMember adds/removes members and toggles form + untag', () => {
      const resetSpy = spyOn(component.form, 'reset');
      const m1: any = {
        memberId: 1,
        memberName: 'Ravi',
        relationWithHead: 'Self',
      };
      const m2: any = {
        memberId: 2,
        memberName: 'Sita',
        relationWithHead: 'Wife',
      };
      component.selectMember({ checked: true }, m1);
      expect(m1.selected).toBeTrue();
      expect(component.uncheckMember).toBeTrue();
      expect(component.disableForm).toBeFalse();
      expect(component.disableUntag).toBeFalse();
      component.selectMember({ checked: true }, m2);
      expect(component.disableForm).toBeTrue();
      component.selectMember({ checked: false }, m2);
      expect(m2.selected).toBeFalse();
      expect(component.selectedMembersList).toEqual([m1]);
      component.selectMember({ checked: false }, m1);
      expect(component.disableUntag).toBeTrue();
      expect(component.disableForm).toBeTrue();
      expect(resetSpy).toHaveBeenCalledTimes(4);
    });

    it('resetEditFamilyTaggingorm clears selection (edit mode disables form)', () => {
      spyOn(component.form, 'reset');
      const m: any = { selected: true };
      component.selectedMembersList = [m];
      component.enableOther = true;
      component.disableUntag = false;
      component.resetEditFamilyTaggingorm();
      expect(m.selected).toBeFalse();
      expect(component.selectedMembersList).toEqual([]);
      expect(component.disableUntag).toBeTrue();
      expect(component.enableOther).toBeFalse();
      expect(component.disableForm).toBeTrue();
    });

    it('populateRelation yes/no', () => {
      component.populateRelation('YES');
      expect(component.relationShipList).toEqual([RELATIONS[0]]);
      expect(component.relationWithHead).toBe(1);
      component.populateRelation('no');
      expect(component.relationShipList).toEqual([RELATIONS[1], RELATIONS[2]]);
      expect(component.relationWithHead).toBeNull();
      expect(component.disableUntag).toBeTrue();
    });

    it('checkOtherRelation enables for Other only', () => {
      component.checkOtherRelation(3);
      expect(component.enableOther).toBeTrue();
      component.checkOtherRelation(1);
      expect(component.enableOther).toBeFalse();
      component.relationShipType = [];
      component.checkOtherRelation(3);
      expect(component.enableOther).toBeFalse();
    });

    describe('saveFamilyTagging', () => {
      it('alerts when a different head already exists and Self selected', () => {
        component.relationWithHead = 1;
        component.selectedMembersList = [{ memberId: 2, memberName: 'Sita' }];
        component.saveFamilyTagging();
        expect(confirm.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.HeadOfTheFamilyAlreadyPresentRemoveExistingAndContinue,
          'Info',
        );
        expect(familySvc.editFamilyTagging).not.toHaveBeenCalled();
      });

      it('alerts when head exists, Self selected, and no member selected', () => {
        component.relationWithHead = 1;
        component.selectedMembersList = [];
        component.saveFamilyTagging();
        expect(confirm.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.HeadOfTheFamilyAlreadyPresentRemoveExisting,
          'Info',
        );
      });

      it('edits member and closes true on success', () => {
        component.relationWithHead = 1;
        component.other = null;
        component.selectedMembersList = [{ memberId: 1, memberName: 'ravi' }];
        familySvc.editFamilyTagging.and.returnValue(
          of({ statusCode: 200, data: { response: 'Updated' } }),
        );
        component.saveFamilyTagging();
        expect(familySvc.editFamilyTagging).toHaveBeenCalledWith({
          familyId: 'FAM1',
          beneficiaryRegId: 1,
          isHeadOfTheFamily: true,
          memberName: 'ravi',
          headofFamily_RelationID: 1,
          headofFamily_Relation: 'Self',
          other: null,
          facilityID: 4,
          parkingPlaceID: 6,
          modifiedBy: 'nurse1',
        });
        expect(confirm.alert).toHaveBeenCalledWith('Updated', 'success');
        expect(dialogRef.close).toHaveBeenCalledWith(true);
      });

      it('edit non-200 and error alert', () => {
        component.relationWithHead = 2;
        component.selectedMembersList = [{ memberId: 2, memberName: 'Sita' }];
        familySvc.editFamilyTagging.and.returnValue(
          of({ statusCode: 5000, errorMessage: 'e1' }),
        );
        component.saveFamilyTagging();
        expect(
          familySvc.editFamilyTagging.calls.mostRecent().args[0]
            .isHeadOfTheFamily,
        ).toBeFalse();
        expect(confirm.alert).toHaveBeenCalledWith('e1', 'error');
        familySvc.editFamilyTagging.and.returnValue(throwingObs('e2'));
        component.saveFamilyTagging();
        expect(confirm.alert).toHaveBeenCalledWith('e2', 'error');
        expect(dialogRef.close).not.toHaveBeenCalled();
      });
    });

    describe('untagFamilyMember', () => {
      beforeEach(() => {
        component.selectedMembersList = [
          { memberId: 1, relationWithHead: 'Self' },
          { memberId: 2, relationWithHead: 'Wife' },
        ];
      });

      it('builds member list and closes on success', () => {
        familySvc.untagFamilyMember.and.returnValue(
          of({ statusCode: 200, data: { response: 'Untagged' } }),
        );
        component.untagFamilyMember();
        expect(familySvc.untagFamilyMember).toHaveBeenCalledWith({
          memberList: [
            {
              familyId: 'FAM1',
              beneficiaryRegId: 1,
              isHeadOfTheFamily: true,
              facilityID: 4,
              parkingPlaceID: 6,
              modifiedBy: 'nurse1',
            },
            {
              familyId: 'FAM1',
              beneficiaryRegId: 2,
              isHeadOfTheFamily: false,
              facilityID: 4,
              parkingPlaceID: 6,
              modifiedBy: 'nurse1',
            },
          ],
        });
        expect(confirm.alert).toHaveBeenCalledWith('Untagged', 'success');
        expect(dialogRef.close).toHaveBeenCalledWith(true);
      });

      it('non-200 alerts', () => {
        familySvc.untagFamilyMember.and.returnValue(
          of({ statusCode: 5000, errorMessage: 'no' }),
        );
        component.untagFamilyMember();
        expect(confirm.alert).toHaveBeenCalledWith('no', 'error');
      });

      it('error alerts', () => {
        familySvc.untagFamilyMember.and.returnValue(throwingObs('bad'));
        component.untagFamilyMember();
        expect(confirm.alert).toHaveBeenCalledWith('bad', 'error');
        expect(dialogRef.close).not.toHaveBeenCalled();
      });
    });
  });

  describe('tag (non-edit) mode', () => {
    beforeEach(async () => setup(false, { withHead: false }));

    it('enables form when not editing and reset keeps it enabled', () => {
      expect(component.disableForm).toBeFalse();
      spyOn(component.form, 'reset');
      component.resetEditFamilyTaggingorm();
      expect(component.disableForm).toBeFalse();
    });

    it('saves new member tagging', () => {
      component.relationWithHead = 1;
      component.other = 'x';
      familySvc.saveFamilyTagging.and.returnValue(
        of({ statusCode: 200, data: { response: 'Saved' } }),
      );
      component.saveFamilyTagging();
      expect(familySvc.saveFamilyTagging).toHaveBeenCalledWith({
        familyId: 'FAM1',
        beneficiaryRegId: 99,
        isHeadOfTheFamily: true,
        memberName: 'Newbie',
        headofFamily_RelationID: 1,
        headofFamily_Relation: 'Self',
        other: 'x',
        facilityID: 4,
        parkingPlaceID: 6,
        createdBy: 'nurse1',
      });
      expect(confirm.alert).toHaveBeenCalledWith('Saved', 'success');
      expect(dialogRef.close).toHaveBeenCalledWith(true);
    });

    it('save non-200 / error alerts', () => {
      component.relationWithHead = 2;
      familySvc.saveFamilyTagging.and.returnValue(
        of({ statusCode: 5000, errorMessage: 's1' }),
      );
      component.saveFamilyTagging();
      expect(
        familySvc.saveFamilyTagging.calls.mostRecent().args[0]
          .isHeadOfTheFamily,
      ).toBeFalse();
      expect(confirm.alert).toHaveBeenCalledWith('s1', 'error');
      familySvc.saveFamilyTagging.and.returnValue(throwingObs('s2'));
      component.saveFamilyTagging();
      expect(confirm.alert).toHaveBeenCalledWith('s2', 'error');
    });
  });

  it('alerts when relationship master fails', async () => {
    await setup(true, { relRes: { statusCode: 5000 } });
    expect(confirm.alert).toHaveBeenCalledWith(
      LANGUAGE_EN.issueFetchingRelationship,
      'error',
    );
  });
});
