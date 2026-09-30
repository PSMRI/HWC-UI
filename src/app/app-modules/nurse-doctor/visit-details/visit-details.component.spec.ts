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
import { BehaviorSubject } from 'rxjs';

import { VisitDetailsComponent } from './visit-details.component';
import { DoctorService } from '../shared/services';
import { NcdScreeningService } from '../shared/services/ncd-screening.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('VisitDetailsComponent (wrapper)', () => {
  let component: VisitDetailsComponent;
  let fixture: ComponentFixture<VisitDetailsComponent>;
  let ncd: any;
  let session: any;
  const fb = new FormBuilder();

  function buildForm(): FormGroup {
    return fb.group({
      patientVisitDetailsForm: fb.group({
        visitCategory: [null],
        visitReason: [null],
      }),
      cbacScreeningForm: fb.group({}),
      covidVaccineStatusForm: fb.group({}),
      patientChiefComplaintsForm: fb.group({}),
      patientAdherenceForm: fb.group({}),
      patientInvestigationsForm: fb.group({}),
      patientCovidForm: fb.group({}),
      patientFileUploadDetailsForm: fb.group({}),
      patientDiseaseForm: fb.group({}),
      cdssForm: fb.group({
        presentChiefComplaintDb: fb.group({}),
        diseaseSummaryDb: fb.group({}),
      }),
    });
  }

  async function setup(sessionSeed: Record<string, any> = {}) {
    ncd = {
      enableDiseaseConfirmForm$: new BehaviorSubject<any>(false),
      enablingIdrs$: new BehaviorSubject<any>(false),
      clearDiseaseConfirmationScreenFlag: jasmine.createSpy('clear'),
    };
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [VisitDetailsComponent],
      providers: [
        ...commonTestProviders({ session: sessionSeed }),
        { provide: DoctorService, useValue: autoSpy(DoctorService) },
        { provide: NcdScreeningService, useValue: ncd },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(VisitDetailsComponent);
    component = fixture.componentInstance;
    component.patientVisitForm = buildForm();
    session = TestBed.inject(SessionStorageService) as any;
  }

  describe('init', () => {
    beforeEach(async () => {
      await setup({ isCdss: 'true', specialistFlag: '100', visitCat: 'ANC' });
      fixture.detectChanges();
    });

    it('should wire sub forms, language and clear disease flag', () => {
      expect(component.patientVisitDetailsForm).toBe(
        component.patientVisitForm.get('patientVisitDetailsForm') as FormGroup,
      );
      expect(component.presentChiefComplaintDb).toBeTruthy();
      expect(component.diseaseSummaryDb).toBeTruthy();
      expect(ncd.clearDiseaseConfirmationScreenFlag).toHaveBeenCalled();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });

    it('should set isCdssStatus when isCdss is "true"', () => {
      expect(component.isCdssStatus).toBeTrue();
    });

    it('should copy visitCat to visitCategory for specialist flag 100', () => {
      expect(session.setItem).toHaveBeenCalledWith('visitCategory', 'ANC');
    });

    it('should store visitReason on change', () => {
      component.patientVisitDetailsForm.patchValue({ visitReason: 'Fever' });
      expect(component.visitReason).toBe('Fever');
    });

    it('should ignore falsy visitReason/visitCategory', () => {
      component.patientVisitDetailsForm.patchValue({
        visitReason: '',
        visitCategory: '',
      });
      expect(component.visitReason).toBeUndefined();
      expect(component.visitCategory).toBeUndefined();
    });

    it('should enable disease confirmation form for idrs in NCD screening', () => {
      component.patientVisitDetailsForm.patchValue({
        visitCategory: 'NCD screening',
      });
      ncd.enableDiseaseConfirmForm$.next('idrs');
      expect(component.idrsOrCbac).toBe('idrs');
      expect(component.enableDiseaseConfirmationForm).toBeTrue();
      expect(component.enableCBACForm).toBeFalse();
    });

    it('should enable CBAC form for cbac in NCD screening', () => {
      component.visitCategory = 'NCD screening';
      ncd.enableDiseaseConfirmForm$.next('cbac');
      expect(component.idrsOrCbac).toBe('cbac');
      expect(component.enableCBACForm).toBeTrue();
    });

    it('should enable disease confirmation without touching CBAC for other categories', () => {
      component.visitCategory = 'ANC';
      component.enableCBACForm = false;
      ncd.enableDiseaseConfirmForm$.next('cbac');
      expect(component.enableDiseaseConfirmationForm).toBeTrue();
      expect(component.enableCBACForm).toBeFalse();
    });

    it('should ignore other disease confirm values', () => {
      ncd.enableDiseaseConfirmForm$.next('other');
      expect(component.enableDiseaseConfirmationForm).toBeFalse();
    });

    it('NCD screening should toggle CBAC form with enablingIdrs$', () => {
      component.patientVisitDetailsForm.patchValue({
        visitCategory: 'NCD screening',
      });
      expect(component.enableFileSelection).toBeTrue();
      expect(component.showNcdScreeningVisit).toBeTrue();
      expect(component.enableCBACForm).toBeTrue();
      ncd.enablingIdrs$.next(true);
      expect(component.enableCBACForm).toBeFalse();
    });

    const catCases: [string, keyof VisitDetailsComponent][] = [
      ['General OPD (QC)', 'showOPD'],
      ['ANC', 'showANCVisit'],
      ['PNC', 'showPNCVisit'],
      ['General OPD', 'showOPD'],
      ['FP & Contraceptive Services', 'showFamilyPlanning'],
      ['Neonatal and Infant Health Care Services', 'showNeonatalVisit'],
      ['Childhood & Adolescent Healthcare Services', 'showChildAndAdolescent'],
      ['NCD care', 'showNCDCare'],
      ['COVID-19 Screening', 'showCOVID'],
    ];
    catCases.forEach(([cat, flag]) => {
      it(`should set ${String(flag)} for "${cat}"`, () => {
        component.patientVisitDetailsForm.patchValue({ visitCategory: cat });
        fixture.detectChanges();
        expect(component.visitCategory).toBe(cat);
        expect(component[flag]).toBeTrue();
        expect(component.hideAll).toBeFalse();
      });
    });

    it('should hide all for unknown category', () => {
      component.showANCVisit = true;
      component.patientVisitDetailsForm.patchValue({ visitCategory: 'XYZ' });
      expect(component.hideAll).toBeFalse();
      expect(component.showANCVisit).toBeFalse();
    });

    it('should not reset tabs in view mode', () => {
      component.mode = 'view';
      component.showANCVisit = true;
      component.patientVisitDetailsForm.patchValue({ visitCategory: 'PNC' });
      expect(component.showANCVisit).toBeTrue();
      expect(component.showPNCVisit).toBeTrue();
    });

    it('ngDoCheck should refresh language', () => {
      component.currentLanguageSet = null;
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });

    it('ngOnDestroy should unsubscribe CBAC subscription', () => {
      component.patientVisitDetailsForm.patchValue({
        visitCategory: 'NCD screening',
      });
      const sub = component.enablingCBACSectionSubscription;
      spyOn(sub, 'unsubscribe').and.callThrough();
      component.ngOnDestroy();
      expect(sub.unsubscribe).toHaveBeenCalled();
    });
  });

  describe('without cdss / specialist flag', () => {
    beforeEach(async () => {
      await setup({ isCdss: 'false' });
      fixture.detectChanges();
    });

    it('should set isCdssStatus false and not copy visitCategory', () => {
      expect(component.isCdssStatus).toBeFalse();
      expect(session.setItem).not.toHaveBeenCalled();
    });

    it('ngOnDestroy without subscription should not throw', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
      expect(component.enablingCBACSectionSubscription).toBeUndefined();
    });
  });
});
