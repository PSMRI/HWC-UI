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
import { DoctorService, MasterdataService } from '../../shared/services';
import { ViewDiseaseSummaryDetailsComponent } from '../viewDiseaseSummaryDetails/viewDiseaseSummaryDet.component';
import { DiseaseFormComponent } from './diseaseSummary.component';

describe('DiseaseFormComponent', () => {
  let component: DiseaseFormComponent;
  let fixture: ComponentFixture<DiseaseFormComponent>;
  let cdss: any;
  let master: any;
  let doctor: any;
  let confirm: any;
  let session: any;
  let dialog: any;

  const buildForm = (): FormGroup =>
    new FormBuilder().group({
      diseaseSummary: null,
      diseaseSummaryView: null,
      informationGiven: null,
      recommendedAction: null,
      remarks: null,
      diseasesummaryID: null,
    });

  beforeEach(async () => {
    cdss = autoSpy(CDSSService);
    cdss.getcheifComplaintSymptoms.and.returnValue(
      of({ statusCode: 200, data: ['Fever'] }),
    );
    cdss.getDiseaseName.and.returnValue(
      of({
        statusCode: 200,
        data: [
          { diseaseName: 'Malaria', id: 1 },
          { diseaseName: 'Dengue', id: 2 },
        ],
      }),
    );
    master = autoSpy(MasterdataService);
    doctor = autoSpy(DoctorService);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [DiseaseFormComponent],
      providers: [
        ...commonTestProviders({
          session: {
            patientAge: 30,
            beneficiaryGender: 'Male',
            visitID: 5,
            beneficiaryRegID: 6,
          },
        }),
        { provide: CDSSService, useValue: cdss },
        { provide: MasterdataService, useValue: master },
        { provide: DoctorService, useValue: doctor },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(DiseaseFormComponent, '')
      .compileComponents();
    fixture = TestBed.createComponent(DiseaseFormComponent);
    component = fixture.componentInstance;
    component.DiseaseSummaryForm = buildForm();
    confirm = TestBed.inject(ConfirmationService) as any;
    session = TestBed.inject(SessionStorageService) as any;
    dialog = TestBed.inject(MatDialog) as any;
  });

  afterEach(() => sessionStorage.removeItem('diseaseClose'));

  describe('ngOnInit', () => {
    it('loads chief complaints (male) and disease names', () => {
      fixture.detectChanges();
      expect(cdss.getcheifComplaintSymptoms).toHaveBeenCalledWith({
        age: 30,
        gender: 'M',
      });
      expect(component.chiefComplaints).toEqual(['Fever']);
      expect(component.diseaseNames).toEqual(['Malaria', 'Dengue']);
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });

    it('sends F for non-male and alerts on failures', () => {
      session.store.set('beneficiaryGender', 'Female');
      cdss.getcheifComplaintSymptoms.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'cc' }),
      );
      cdss.getDiseaseName.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'dn' }),
      );
      fixture.detectChanges();
      expect(cdss.getcheifComplaintSymptoms).toHaveBeenCalledWith({
        age: 30,
        gender: 'F',
      });
      expect(confirm.alert).toHaveBeenCalledWith('cc', 'error');
      expect(confirm.alert).toHaveBeenCalledWith('dn', 'error');
    });

    it('filteredOptions filters disease names by form value', () => {
      fixture.detectChanges();
      const seen: string[][] = [];
      component.filteredOptions.subscribe((v: any) => seen.push(v));
      expect(seen[0]).toEqual(['Malaria', 'Dengue']);
      component.DiseaseSummaryForm.controls['diseaseSummary'].setValue('den');
      expect(seen[1]).toEqual(['Dengue']);
      component.DiseaseSummaryForm.controls['diseaseSummary'].setValue(null);
      expect(seen[2]).toEqual(['Malaria', 'Dengue']);
    });
  });

  it('resetForm resets the form', () => {
    component.DiseaseSummaryForm.patchValue({ remarks: 'x' });
    component.resetForm();
    expect(component.DiseaseSummaryForm.value.remarks).toBeNull();
  });

  describe('getSnomedCTRecord', () => {
    it('pcc with concept', () => {
      master.getSnomedCTRecord.and.returnValue(of({ data: { conceptID: 9 } }));
      component.getSnomedCTRecord('t', 'pcc');
      expect(component.sctID_pcc).toBe('SCTID: 9');
      expect(component.sctID_pcc_toSave).toBe(9);
    });
    it('psd with concept appends', () => {
      master.getSnomedCTRecord.and.returnValue(of({ data: { conceptID: 9 } }));
      component.sctID_psd = '';
      component.sctID_psd_toSave = '';
      component.getSnomedCTRecord('a', 'psd');
      expect(component.sctID_psd).toBe('a(SCTID): 9\n');
      expect(component.sctID_psd_toSave).toBe(9);
      component.getSnomedCTRecord('b', 'psd');
      expect(component.sctID_psd_toSave).toBe('9,9');
    });
    it('no concept yields NA', () => {
      master.getSnomedCTRecord.and.returnValue(of({ data: {} }));
      component.getSnomedCTRecord('t', 'pcc');
      expect(component.sctID_pcc_toSave).toBe('NA');
      component.sctID_psd_toSave = '';
      component.getSnomedCTRecord('t', 'psd');
      expect(component.sctID_psd_toSave).toBe('NA');
      component.getSnomedCTRecord('t', 'psd');
      expect(component.sctID_psd_toSave).toBe('NA,NA');
    });
    it('swallows errors', () => {
      master.getSnomedCTRecord.and.returnValue(throwingObs());
      component.getSnomedCTRecord('t', 'pcc');
      expect(component.sctID_pcc_toSave).toBeUndefined();
    });
  });

  describe('ngOnChanges / getDiseaseSummaryDet', () => {
    const cdssVal = {
      diseaseSummary: 'Malaria',
      informationGiven: 'info',
      remarks: 'r',
    };

    it('does nothing when not view mode and no specialist flag', () => {
      component.mode = 'edit';
      component.ngOnChanges();
      expect(doctor.getVisitComplaintDetails).not.toHaveBeenCalled();
    });

    it('view mode loads Cdss details for normal visits', () => {
      doctor.getVisitComplaintDetails.and.returnValue(
        of({ statusCode: 200, data: { Cdss: { diseaseSummary: cdssVal } } }),
      );
      component.mode = 'view';
      component.ngOnChanges();
      expect(doctor.getVisitComplaintDetails).toHaveBeenCalledWith(6, 5);
      expect(component.disableVisit).toBeTrue();
      expect(component.viewMode).toBeTrue();
      expect(component.DiseaseSummaryForm.value.informationGiven).toBe('info');
      expect(component.DiseaseSummaryForm.value.diseaseSummaryView).toBe(
        'Malaria',
      );
    });

    it('view mode with empty diseaseSummary patches undefined view value', () => {
      doctor.getVisitComplaintDetails.and.returnValue(
        of({ statusCode: 200, data: { Cdss: { diseaseSummary: {} } } }),
      );
      component.getDiseaseSummaryDet(1, 2);
      expect(
        component.DiseaseSummaryForm.value.diseaseSummaryView,
      ).toBeUndefined();
      expect(component.disableVisit).toBeTrue();
    });

    it('specialist flag 100 loads QC cdss details', () => {
      session.store.set('specialistFlag', '100');
      session.store.set('visitCategory', 'General OPD (QC)');
      doctor.getVisitComplaintDetails.and.returnValue(
        of({ statusCode: 200, data: { cdss: cdssVal } }),
      );
      component.mode = 'edit';
      component.ngOnChanges();
      expect(doctor.getVisitComplaintDetails).toHaveBeenCalledWith(6, 5);
      expect(component.viewMode).toBeTrue();
      expect(component.DiseaseSummaryForm.value.remarks).toBe('r');
      expect(component.DiseaseSummaryForm.value.diseaseSummaryView).toBe(
        'Malaria',
      );
    });

    it('QC visit with non-200 still patches (current behaviour)', () => {
      session.store.set('visitCategory', 'General OPD (QC)');
      doctor.getVisitComplaintDetails.and.returnValue(
        of({ statusCode: 5000, data: { cdss: cdssVal } }),
      );
      component.getDiseaseSummaryDet(1, 2);
      expect(component.DiseaseSummaryForm.value.informationGiven).toBe('info');
    });

    it('other specialist flags do not load', () => {
      session.store.set('specialistFlag', '5');
      component.ngOnChanges();
      expect(doctor.getVisitComplaintDetails).not.toHaveBeenCalled();
    });
  });

  describe('showDiseaseSummary', () => {
    const autocomplete = () => ({
      _elementRef: {
        nativeElement: { classList: { remove: jasmine.createSpy('remove') } },
      },
    });
    const input = () => ({ blur: jasmine.createSpy('blur') });

    beforeEach(() => fixture.detectChanges());

    it('clears info when no disease chosen', () => {
      component.DiseaseSummaryForm.patchValue({
        informationGiven: 'x',
        recommendedAction: 'y',
      });
      component.showDiseaseSummary('', autocomplete(), input());
      expect(cdss.getDiseaseData).not.toHaveBeenCalled();
      expect(component.DiseaseSummaryForm.value.informationGiven).toBeNull();
      expect(component.DiseaseSummaryForm.value.recommendedAction).toBeNull();
    });

    it('opens summary dialog and patches result', () => {
      const data = { data: { diseaseName: 'Malaria' } };
      cdss.getDiseaseData.and.returnValue(of(data));
      dialog.open.and.returnValue({
        afterClosed: () =>
          of({
            data: {
              diseaseName: 'Malaria',
              self_care: '$rest$fluids',
              diseasesummaryID: 42,
            },
          }),
      });
      const ac = autocomplete();
      const el = input();
      component.showDiseaseSummary('Malaria', ac, el);
      expect(cdss.getDiseaseData).toHaveBeenCalledWith({
        diseaseName: 'Malaria',
        id: 1,
      });
      expect(
        ac._elementRef.nativeElement.classList.remove,
      ).toHaveBeenCalledWith('mat-focused');
      expect(el.blur).toHaveBeenCalled();
      expect(dialog.open).toHaveBeenCalledWith(
        ViewDiseaseSummaryDetailsComponent,
        jasmine.objectContaining({ data: { summaryDetails: data } }),
      );
      expect(component.DiseaseSummaryForm.value.informationGiven).toBe(
        'Malaria',
      );
      expect(component.DiseaseSummaryForm.value.recommendedAction).toBe(
        'rest,fluids',
      );
      expect(component.DiseaseSummaryForm.value.diseasesummaryID).toBe(42);
    });

    it('resets form when dialog cancelled', () => {
      sessionStorage.setItem('diseaseClose', 'False');
      cdss.getDiseaseData.and.returnValue(of({}));
      dialog.open.and.returnValue({ afterClosed: () => of(undefined) });
      component.DiseaseSummaryForm.patchValue({ remarks: 'keep?' });
      component.showDiseaseSummary('Unknown', autocomplete(), input());
      expect(component.summaryObj).toBeNull();
      expect(component.DiseaseSummaryForm.value.remarks).toBeNull();
    });

    it('does not open dialog when no data returned', () => {
      cdss.getDiseaseData.and.returnValue(of(null));
      component.showDiseaseSummary('Malaria', autocomplete(), input());
      expect(dialog.open).not.toHaveBeenCalled();
    });
  });
});
