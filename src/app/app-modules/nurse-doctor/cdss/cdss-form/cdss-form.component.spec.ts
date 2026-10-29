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
import { DoctorService } from '../../shared/services';
import { VisitDetailUtils } from '../../shared/utility';
import { CdssFormResultPopupComponent } from '../cdss-form-result-popup/cdss-form-result-popup.component';
import { CdssFormComponent } from './cdss-form.component';

describe('CdssFormComponent', () => {
  let component: CdssFormComponent;
  let fixture: ComponentFixture<CdssFormComponent>;
  let cdss: any;
  let master: any;
  let doctor: any;
  let confirm: any;
  let session: any;
  let dialog: any;
  let router: Router;

  const seed = {
    serviceLineDetails: JSON.stringify({ facilityID: 1, parkingPlaceID: 2 }),
    patientAge: 40,
    beneficiaryGender: 'Male',
    currentRole: 'Nurse',
    visitID: 5,
    beneficiaryRegID: 6,
    beneficiaryID: 7,
    patientName: 'Asha',
    sessionID: 's',
    serviceID: 4,
    providerServiceID: 3,
    userName: 'nurse',
    benCallID: 9,
  };

  const buildForm = (): FormGroup => {
    const f = new VisitDetailUtils(
      new FormBuilder(),
      session,
    ).createPresentCheifComplaint();
    return f;
  };

  beforeEach(async () => {
    cdss = autoSpy(CDSSService);
    cdss.getcheifComplaintSymptoms.and.returnValue(
      of({ statusCode: 200, data: ['Fever', 'Cough'] }),
    );
    master = autoSpy(MasterdataService);
    master.getSnomedCTRecord.and.returnValue(of({ data: { conceptID: 11 } }));
    doctor = autoSpy(DoctorService);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [CdssFormComponent],
      providers: [
        ...commonTestProviders({ session: seed }),
        { provide: CDSSService, useValue: cdss },
        { provide: MasterdataService, useValue: master },
        { provide: DoctorService, useValue: doctor },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(CdssFormComponent, '')
      .compileComponents();
    confirm = TestBed.inject(ConfirmationService) as any;
    session = TestBed.inject(SessionStorageService) as any;
    dialog = TestBed.inject(MatDialog) as any;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(CdssFormComponent);
    component = fixture.componentInstance;
    component.cdssForm = buildForm();
  });

  describe('init', () => {
    it('creates form utility, shows form for nurse and loads complaints', () => {
      fixture.detectChanges();
      expect(component.formUtility instanceof VisitDetailUtils).toBeTrue();
      expect(component.showCdssForm).toBeTrue();
      expect(cdss.getcheifComplaintSymptoms).toHaveBeenCalledWith({
        age: 40,
        gender: 'M',
      });
      expect(component.chiefComplaints).toEqual(['Fever', 'Cough']);
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });

    it('hides form for other roles and alerts complaint failure (female)', () => {
      session.store.set('currentRole', 'Lab Technician');
      session.store.set('beneficiaryGender', 'Female');
      cdss.getcheifComplaintSymptoms.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'no' }),
      );
      fixture.detectChanges();
      expect(component.showCdssForm).toBeFalse();
      expect(cdss.getcheifComplaintSymptoms).toHaveBeenCalledWith({
        age: 40,
        gender: 'F',
      });
      expect(confirm.alert).toHaveBeenCalledWith('no', 'error');
    });

    it('shows form for doctors', () => {
      session.store.set('currentRole', 'Doctor');
      component.showingCdssForm();
      expect(component.showCdssForm).toBeTrue();
    });

    it('filteredOptions filters complaints', () => {
      fixture.detectChanges();
      const seen: any[] = [];
      component.filteredOptions.subscribe((v: any) => seen.push(v));
      expect(seen[0]).toEqual(['Fever', 'Cough']);
      component.cdssForm.controls['presentChiefComplaint'].setValue('cou');
      expect(seen[1]).toEqual(['Cough']);
    });
  });

  describe('ngOnChanges / getCdssDetails', () => {
    const pcc = {
      presentChiefComplaint: 'Fever',
      selectedDiagnosis: 'Malaria',
      remarksPc: 'r',
    };

    it('does nothing outside view mode without specialist flag', () => {
      component.mode = 'edit';
      component.ngOnChanges();
      expect(doctor.getVisitComplaintDetails).not.toHaveBeenCalled();
    });

    it('view mode loads Cdss complaint details', () => {
      doctor.getVisitComplaintDetails.and.returnValue(
        of({
          statusCode: 200,
          data: { Cdss: { presentChiefComplaint: pcc } },
        }),
      );
      component.mode = 'view';
      component.ngOnChanges();
      expect(cdss.getcheifComplaintSymptoms).toHaveBeenCalled();
      expect(doctor.getVisitComplaintDetails).toHaveBeenCalledWith(6, 5);
      expect(component.viewMode).toBeTrue();
      expect(component.disableVisit).toBeTrue();
      expect(component.cdssForm.value.selectedDiagnosis).toBe('Malaria');
      expect(component.cdssForm.value.presentChiefComplaintView).toBe('Fever');
    });

    it('specialist flag 100 on QC visit loads cdss details', () => {
      session.store.set('specialistFlag', '100');
      session.store.set('visitCategory', 'General OPD (QC)');
      doctor.getVisitComplaintDetails.and.returnValue(
        of({ statusCode: 200, data: { cdss: pcc } }),
      );
      component.ngOnChanges();
      expect(doctor.getVisitComplaintDetails).toHaveBeenCalledWith(6, 5);
      expect(component.cdssForm.value.remarksPc).toBe('r');
      expect(component.cdssForm.value.presentChiefComplaintView).toBe('Fever');
    });

    it('QC visit with non-200 still patches (current behaviour)', () => {
      session.store.set('visitCategory', 'General OPD (QC)');
      doctor.getVisitComplaintDetails.and.returnValue(
        of({ statusCode: 5000, data: { cdss: pcc } }),
      );
      component.getCdssDetails(1, 2);
      expect(component.cdssForm.value.selectedDiagnosis).toBe('Malaria');
    });

    it('non-QC visit with non-200 still patches (current behaviour)', () => {
      doctor.getVisitComplaintDetails.and.returnValue(
        of({
          statusCode: 5000,
          data: { Cdss: { presentChiefComplaint: pcc } },
        }),
      );
      component.getCdssDetails(1, 2);
      expect(component.cdssForm.value.remarksPc).toBe('r');
    });

    it('other specialist flag does not load', () => {
      session.store.set('specialistFlag', '3');
      component.ngOnChanges();
      expect(doctor.getVisitComplaintDetails).not.toHaveBeenCalled();
    });
  });

  it('displayChiefComplaint returns chiefComplaint', () => {
    expect(component.displayChiefComplaint({ chiefComplaint: 'x' })).toBe('x');
    expect(component.displayChiefComplaint(null)).toBeNull();
  });

  it('resetForm resets', () => {
    component.cdssForm.patchValue({ remarksPc: 'x' });
    component.resetForm();
    expect(component.cdssForm.value.remarksPc).toBeNull();
  });

  describe('getQuestions', () => {
    const ac = () => ({
      _elementRef: {
        nativeElement: { classList: { remove: jasmine.createSpy('remove') } },
      },
    });

    it('clears diagnosis when symptom empty', () => {
      component.cdssForm.patchValue({
        selectedDiagnosis: 'x',
        recommendedActionPc: 'y',
      });
      component.getQuestions('', ac(), { blur: () => {} });
      expect(cdss.getCdssQuestions).not.toHaveBeenCalled();
      expect(component.cdssForm.value.selectedDiagnosis).toBeNull();
      expect(component.cdssForm.value.recommendedActionPc).toBeNull();
    });

    it('opens dialog when questions exist and fetches snomed', () => {
      fixture.detectChanges();
      cdss.getCdssQuestions.and.returnValue(
        of({ statusCode: 200, data: { Questions: [1] } }),
      );
      const openSpy = spyOn(component, 'openDialog');
      const a = ac();
      const blur = jasmine.createSpy('blur');
      component.getQuestions('Fever', a, { blur });
      expect(cdss.getCdssQuestions).toHaveBeenCalledWith({
        age: 40,
        gender: 'M',
        symptom: 'Fever',
      });
      expect(a._elementRef.nativeElement.classList.remove).toHaveBeenCalledWith(
        'mat-focused',
      );
      expect(blur).toHaveBeenCalled();
      expect(openSpy).toHaveBeenCalledWith('Fever');
      expect(master.getSnomedCTRecord).toHaveBeenCalledWith('Fever');
      expect(component.sctID_pcc).toBe('SCTID: 11');
    });

    it('alerts when no questions (female)', () => {
      fixture.detectChanges();
      session.store.set('beneficiaryGender', 'Female');
      cdss.getCdssQuestions.and.returnValue(
        of({ statusCode: 200, data: { Questions: [] } }),
      );
      component.getQuestions('Fever', ac(), { blur: () => {} });
      expect(cdss.getCdssQuestions.calls.mostRecent().args[0].gender).toBe('F');
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.noQuestionsFoundForCorrespondingInput,
      );
    });
  });

  describe('openDialog', () => {
    beforeEach(() => fixture.detectChanges());

    it('patches diagnosis and actions from result', () => {
      master.getSnomedCTRecord.and.returnValues(
        of({ data: { conceptID: 1 } }),
        of({ data: { conceptID: 2 } }),
      );
      dialog.open.and.returnValue({
        afterClosed: () =>
          of([
            { diseases: 'Malaria', action: 'Refer', symptoms: ['a', 'b'] },
            { diseases: 'Dengue', action: 'Rest', symptoms: ['c'] },
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
      expect(component.recommendedActionPc).toBe('Refer,Rest');
      expect(component.selectedSymptoms).toBe('a b c');
      expect(component.sctID_psd_toSave).toBe('1,2');
      expect(component.cdssForm.value.selectedDiagnosis).toBe('Malaria,Dengue');
      expect(component.cdssForm.value.recommendedActionPc).toBe('Refer,Rest');
    });

    it('handles empty result list', () => {
      session.store.set('beneficiaryGender', 'Female');
      dialog.open.and.returnValue({ afterClosed: () => of([]) });
      component.openDialog('x');
      expect(
        dialog.open.calls.mostRecent().args[1].data.patientData.gender,
      ).toBe('F');
      expect(component.psd).toBe('');
      expect(component.recommendedActionPc).toBe('');
    });

    it('resets form when dialog dismissed', () => {
      component.cdssForm.patchValue({ remarksPc: 'x' });
      dialog.open.and.returnValue({ afterClosed: () => of(null) });
      component.openDialog('x');
      expect(component.cdssForm.value.remarksPc).toBeNull();
    });
  });

  describe('getSnomedCTRecord', () => {
    it('psd without concept yields NA list', () => {
      master.getSnomedCTRecord.and.returnValue(of({ data: {} }));
      component.sctID_psd_toSave = '';
      component.getSnomedCTRecord('a', 'psd');
      component.getSnomedCTRecord('b', 'psd');
      expect(component.sctID_psd_toSave).toBe('NA,NA');
      component.getSnomedCTRecord('c', 'pcc');
      expect(component.sctID_pcc_toSave).toBe('NA');
    });

    it('psd with concept records text', () => {
      component.sctID_psd = '';
      component.sctID_psd_toSave = '';
      component.getSnomedCTRecord('a', 'psd');
      expect(component.sctID_psd).toBe('a(SCTID): 11\n');
      expect(component.sctID_psd_toSave).toBe(11);
    });

    it('swallows error', () => {
      master.getSnomedCTRecord.and.returnValue(throwingObs());
      component.getSnomedCTRecord('a', 'pcc');
      expect(component.sctID_pcc).toBeUndefined();
    });
  });

  describe('saveData', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.cdssForm.addControl('actionId', new FormBuilder().control(3));
      component.cdssForm.addControl(
        'action',
        new FormBuilder().control('Refer'),
      );
      component.cdssForm.patchValue({
        selectedDiagnosis: 'Malaria',
        presentChiefComplaint: 'Fever',
        recommendedActionPc: 'Refer',
        remarksPc: 'r',
      });
      component.sctID_psd_toSave = '1';
      component.sctID_pcc_toSave = '2';
      component.selectedSymptoms = 'a b';
    });

    it('posts the complaint payload and alerts success', () => {
      cdss.saveCheifComplaints.and.returnValue(of({ statusCode: 200 }));
      component.saveData();
      expect(cdss.saveCheifComplaints).toHaveBeenCalledWith({
        beneficiaryRegID: 6,
        beneficiaryID: 7,
        patientName: 'Asha',
        patientAge: 40,
        patientGenderID: 1,
        sessionID: 's',
        serviceID: 4,
        providerServiceMapID: 3,
        createdBy: 'nurse',
        facilityID: 1,
        benCallID: 9,
        parkingPlaceID: 2,
        selecteDiagnosisID: '1',
        selecteDiagnosis: 'Malaria',
        presentChiefComplaintID: '2',
        presentChiefComplaint: 'Fever',
        recommendedActionPc: 'Refer',
        remarksPc: 'r',
        algorithm: 'a b',
        actionId: 3,
        action: 'Refer',
      });
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.savedBeneficiaryDetailsSuccessfully,
        'Success',
      );
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('navigates to worklist when isCdssTrue (female)', () => {
      session.store.set('beneficiaryGender', 'Female');
      component.isCdssTrue = true;
      cdss.saveCheifComplaints.and.returnValue(of({ statusCode: 200 }));
      component.saveData();
      expect(
        cdss.saveCheifComplaints.calls.mostRecent().args[0].patientGenderID,
      ).toBe(2);
      expect(router.navigate).toHaveBeenCalledWith(['/common/nurse-worklist']);
    });

    it('alerts on failure', () => {
      cdss.saveCheifComplaints.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'bad' }),
      );
      component.saveData();
      expect(confirm.alert).toHaveBeenCalledWith('bad', 'error');
    });
  });
});
