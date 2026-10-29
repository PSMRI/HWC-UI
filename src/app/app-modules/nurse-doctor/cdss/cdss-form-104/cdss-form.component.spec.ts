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
import { MatDialog } from '@angular/material/dialog';
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
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { CDSSService } from '../../shared/services/cdss-service';
import { MasterdataService } from '../../shared/services/masterdata.service';
import { CdssFormResultPopupComponent } from '../cdss-form-result-popup/cdss-form-result-popup.component';
import { Cdss104FormComponent } from './cdss-form.component';

describe('Cdss104FormComponent', () => {
  let component: Cdss104FormComponent;
  let fixture: ComponentFixture<Cdss104FormComponent>;
  let cdss: any;
  let master: any;
  let confirm: any;
  let session: any;
  let dialog: any;
  let router: Router;

  const seed = {
    serviceLineDetails: JSON.stringify({ facilityID: 1, parkingPlaceID: 2 }),
    patientAge: 40,
    beneficiaryGender: 'Male',
    beneficiaryRegID: 6,
    beneficiaryID: 7,
    patientName: 'Asha',
    sessionID: 's',
    serviceID: 4,
    providerServiceID: 3,
    userName: 'nurse',
    benCallID: 9,
  };

  beforeEach(async () => {
    cdss = autoSpy(CDSSService);
    cdss.getcheifComplaintSymptoms.and.returnValue(
      of({ statusCode: 200, data: ['Fever', 'Cough'] }),
    );
    cdss.getActionMaster.and.returnValue(
      of({
        statusCode: 200,
        data: [
          { id: 1, name: 'Refer' },
          { id: 2, name: 'Rest' },
        ],
      }),
    );
    master = autoSpy(MasterdataService);
    master.getSnomedCTRecord.and.returnValue(of({ data: { conceptID: 11 } }));
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [Cdss104FormComponent],
      providers: [
        ...commonTestProviders({ session: seed }),
        { provide: CDSSService, useValue: cdss },
        { provide: MasterdataService, useValue: master },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(Cdss104FormComponent, '')
      .compileComponents();
    confirm = TestBed.inject(ConfirmationService) as any;
    session = TestBed.inject(SessionStorageService) as any;
    dialog = TestBed.inject(MatDialog) as any;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(Cdss104FormComponent);
    component = fixture.componentInstance;
  });

  describe('init', () => {
    it('loads complaints and actions', () => {
      fixture.detectChanges();
      expect(component.chiefComplaints).toEqual(['Fever', 'Cough']);
      expect(component.actions.length).toBe(2);
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });

    it('alerts on failures and sends F for female', () => {
      session.store.set('beneficiaryGender', 'Female');
      cdss.getcheifComplaintSymptoms.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'cc' }),
      );
      cdss.getActionMaster.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'am' }),
      );
      fixture.detectChanges();
      expect(cdss.getcheifComplaintSymptoms).toHaveBeenCalledWith({
        age: 40,
        gender: 'F',
      });
      expect(confirm.alert).toHaveBeenCalledWith('cc', 'error');
      expect(confirm.alert).toHaveBeenCalledWith('am', 'error');
    });

    it('filteredOptions uses prefix match and full list for empty', () => {
      fixture.detectChanges();
      const seen: any[] = [];
      component.filteredOptions.subscribe((v: any) => seen.push(v));
      expect(seen[0]).toEqual(['Fever', 'Cough']);
      component.cdssForm.controls.presentChiefComplaint.setValue('co' as any);
      expect(seen[1]).toEqual(['Cough']);
      component.cdssForm.controls.presentChiefComplaint.setValue('ough' as any);
      expect(seen[2]).toEqual([]);
    });
  });

  it('getActionId patches matching action id', () => {
    fixture.detectChanges();
    component.cdssForm.controls.action.setValue('Rest' as any);
    component.getActionId();
    expect(component.cdssForm.value.actionId).toBe(2 as any);
  });

  it('resetForm resets', () => {
    component.cdssForm.patchValue({ remarks: 'x' as any });
    component.resetForm();
    expect(component.cdssForm.value.remarks).toBeNull();
  });

  describe('getQuestions', () => {
    beforeEach(() => fixture.detectChanges());

    it('clears diagnosis for empty symptom', () => {
      component.cdssForm.patchValue({
        selectedProvisionalDiagnosis: 'x' as any,
        recommendedAction: 'y' as any,
      });
      component.getQuestions(null);
      expect(cdss.getCdssQuestions).not.toHaveBeenCalled();
      expect(component.cdssForm.value.selectedProvisionalDiagnosis).toBeNull();
      expect(component.cdssForm.value.recommendedAction).toBeNull();
    });

    it('opens dialog when questions found', () => {
      cdss.getCdssQuestions.and.returnValue(
        of({ statusCode: 200, data: { Questions: [1] } }),
      );
      const spy = spyOn(component, 'openDialog');
      component.getQuestions('Fever');
      expect(cdss.getCdssQuestions).toHaveBeenCalledWith({
        age: 40,
        gender: 'M',
        symptom: 'Fever',
      });
      expect(spy).toHaveBeenCalledWith('Fever');
      expect(component.sctID_pcc_toSave).toBe(11);
    });

    [
      { statusCode: 200, data: { Msg: 'No Question Found' } },
      { statusCode: 200, data: 'No Question Found' },
      { statusCode: 5000, data: {} },
    ].forEach((res, i) => {
      it(`alerts when no questions (case ${i})`, () => {
        session.store.set('beneficiaryGender', 'Female');
        cdss.getCdssQuestions.and.returnValue(of(res));
        const spy = spyOn(component, 'openDialog');
        component.getQuestions('Fever');
        expect(spy).not.toHaveBeenCalled();
        expect(confirm.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.noQuestionsFoundForCorrespondingInput,
        );
      });
    });
  });

  describe('openDialog', () => {
    beforeEach(() => fixture.detectChanges());

    it('patches provisional diagnosis and action', () => {
      master.getSnomedCTRecord.and.returnValues(
        of({ data: { conceptID: 1 } }),
        of({ data: {} }),
      );
      dialog.open.and.returnValue({
        afterClosed: () =>
          of([
            { diseases: 'Malaria', action: 'Refer', symptoms: ['a'] },
            { diseases: 'Dengue', action: 'Rest', symptoms: ['b', 'c'] },
          ]),
      });
      component.openDialog('Fever');
      const args = dialog.open.calls.mostRecent().args;
      expect(args[0]).toBe(CdssFormResultPopupComponent);
      expect(args[1].data.patientData).toEqual({
        age: 40,
        gender: 'M',
        symptom: 'Fever',
      });
      expect(component.psd).toBe('Malaria,Dengue');
      expect(component.recommendedAction).toBe('Refer,Rest');
      expect(component.selectedSymptoms).toBe('a b c');
      expect(component.sctID_psd).toBe('Malaria(SCTID): 1\n');
      expect(component.sctID_psd_toSave).toBe('1,NA');
      expect(component.cdssForm.value.selectedProvisionalDiagnosis).toBe(
        'Malaria,Dengue' as any,
      );
    });

    it('handles empty result and female gender', () => {
      session.store.set('beneficiaryGender', 'Female');
      dialog.open.and.returnValue({ afterClosed: () => of([]) });
      component.openDialog('x');
      expect(
        dialog.open.calls.mostRecent().args[1].data.patientData.gender,
      ).toBe('F');
      expect(component.psd).toBe('');
    });

    it('resets form when dismissed', () => {
      component.cdssForm.patchValue({ remarks: 'x' as any });
      dialog.open.and.returnValue({ afterClosed: () => of(undefined) });
      component.openDialog('x');
      expect(component.cdssForm.value.remarks).toBeNull();
    });
  });

  describe('getSnomedCTRecord', () => {
    it('NA branches', () => {
      master.getSnomedCTRecord.and.returnValue(of({ data: {} }));
      component.getSnomedCTRecord('a', 'pcc');
      expect(component.sctID_pcc_toSave).toBe('NA');
      component.sctID_psd_toSave = '';
      component.getSnomedCTRecord('a', 'psd');
      expect(component.sctID_psd_toSave).toBe('NA');
    });
    it('psd concept appended to existing', () => {
      component.sctID_psd = '';
      component.sctID_psd_toSave = '5';
      component.getSnomedCTRecord('a', 'psd');
      expect(component.sctID_psd_toSave).toBe('5,11');
    });
    it('swallows errors', () => {
      master.getSnomedCTRecord.and.returnValue(throwingObs());
      component.getSnomedCTRecord('a', 'pcc');
      expect(component.sctID_pcc_toSave).toBeUndefined();
    });
  });

  describe('saveData', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.cdssForm.patchValue({
        presentChiefComplaint: 'Fever' as any,
        selectedProvisionalDiagnosis: 'Malaria' as any,
        recommendedAction: 'Refer' as any,
        remarks: 'r' as any,
        action: 'Refer' as any,
        actionId: 1 as any,
      });
      component.sctID_psd_toSave = '1';
      component.sctID_pcc_toSave = '2';
      component.selectedSymptoms = 'a';
    });

    it('saves and navigates to worklist', () => {
      cdss.saveCheifComplaints.and.returnValue(of({ statusCode: 200 }));
      component.saveData();
      expect(cdss.saveCheifComplaints).toHaveBeenCalledWith(
        jasmine.objectContaining({
          beneficiaryRegID: 6,
          patientGenderID: 1,
          facilityID: 1,
          parkingPlaceID: 2,
          selecteDiagnosisID: '1',
          selecteDiagnosis: 'Malaria',
          presentChiefComplaintID: '2',
          presentChiefComplaint: 'Fever',
          recommendedAction: 'Refer',
          remarks: 'r',
          algorithm: 'a',
          actionId: 1,
          action: 'Refer',
        }),
      );
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.savedBeneficiaryDetailsSuccessfully,
        'Success',
      );
      expect(router.navigate).toHaveBeenCalledWith(['/common/nurse-worklist']);
    });

    it('alerts on failure (female)', () => {
      session.store.set('beneficiaryGender', 'Female');
      cdss.saveCheifComplaints.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'bad' }),
      );
      component.saveData();
      expect(
        cdss.saveCheifComplaints.calls.mostRecent().args[0].patientGenderID,
      ).toBe(2);
      expect(confirm.alert).toHaveBeenCalledWith('bad', 'error');
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });
});
