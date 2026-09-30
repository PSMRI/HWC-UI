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
import { BehaviorSubject, of } from 'rxjs';

import { ScreeningComponent } from './screening.component';
import { DoctorService } from '../shared/services/doctor.service';
import { MasterdataService } from '../shared/services/masterdata.service';
import { NcdScreeningService } from '../shared/services/ncd-screening.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { environment } from 'src/environments/environment';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

const E = environment as any;
const conditions = () => [
  { name: E.diabetes },
  { name: E.hypertension },
  { name: E.oral },
  { name: ` ${E.breast} ` },
  { name: E.cervical },
];
const fullData = {
  diabetes: { bloodGlucoseType: 'RBS' },
  hypertension: { systolicBP_1stReading: 120 },
  breast: { palpationBreasts: 'x' },
  oral: { oralCavityFinding: 'y' },
  cervical: { visualExaminationVIA: 'z' },
};

describe('ScreeningComponent', () => {
  let component: ScreeningComponent;
  let fixture: ComponentFixture<ScreeningComponent>;
  let ncd: NcdScreeningService;
  let doctor: any;
  let confirm: any;
  let session: any;
  let master$: BehaviorSubject<any>;
  let medical: FormGroup;

  beforeEach(async () => {
    master$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [ScreeningComponent],
      providers: [
        ...commonTestProviders({ session: { visitCategory: 'NCD screening' } }),
        NcdScreeningService,
        { provide: DoctorService, useValue: autoSpy(DoctorService) },
        { provide: MasterdataService, useValue: { nurseMasterData$: master$ } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    ncd = TestBed.inject(NcdScreeningService);
    doctor = TestBed.inject(DoctorService);
    confirm = TestBed.inject(ConfirmationService);
    session = TestBed.inject(SessionStorageService);
    const fb = new FormBuilder();
    medical = fb.group({
      diabetes: fb.group({ a: null }),
      hypertension: fb.group({ a: null }),
      oral: fb.group({ a: null }),
      breast: fb.group({ a: null }),
      cervical: fb.group({ a: null }),
    });
    fixture = TestBed.createComponent(ScreeningComponent);
    component = fixture.componentInstance;
    component.patientMedicalForm = medical;
  });

  function byName(name: string) {
    return component.ncdScreeningDiseases.find(
      (d: any) => d.name.trim() === name,
    );
  }

  describe('nurse (default) mode', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('initialises sub forms, language and resets suspect flags', () => {
      expect(component.diabetesScreeningForm).toBe(
        medical.get('diabetes') as FormGroup,
      );
      expect(component.cervicalScreeningForm).toBe(
        medical.get('cervical') as FormGroup,
      );
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(ncd.fetchCBACResponseFromNurse).toBeTrue();
      expect(ncd.diabetesScreeningValidationOnSave).toBeFalse();
      expect(component.suspectScreeningDiseases).toEqual([]);
      expect(doctor.getNcdScreeningForCbac).not.toHaveBeenCalled();
    });

    it('lists all diseases for female beneficiaries and renders buttons', () => {
      session.store.set('beneficiaryGender', 'Female');
      master$.next({ screeningCondition: conditions() });
      expect(component.ncdScreeningDiseases.length).toBe(5);
      expect(component.ncdScreeningDiseases.every((d: any) => !d.active)).toBe(
        true,
      );
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll('button').length).toBe(5);
    });

    it('excludes breast and cervical for male beneficiaries', () => {
      session.store.set('beneficiaryGender', 'Male');
      master$.next({ screeningCondition: conditions() });
      expect(component.ncdScreeningDiseases.map((d: any) => d.name)).toEqual([
        E.diabetes,
        E.hypertension,
        E.oral,
      ]);
    });

    it('ignores master data without screening conditions', () => {
      master$.next({ screeningCondition: null });
      expect(component.ncdScreeningDiseases).toEqual([]);
    });

    it('tracks suspected diseases from service status streams', () => {
      ncd.diabetesSuspectStatus(true);
      ncd.hypertensionSuspectStatus(true);
      ncd.oralSuspectStatus(true);
      ncd.breastSuspectStatus(true);
      ncd.cervicalSuspectStatus(true);
      ncd.cervicalSuspectStatus(true);
      expect(component.suspectScreeningDiseases).toEqual([
        E.diabetes,
        E.hypertension,
        E.oral,
        E.breast,
        E.cervical,
      ]);
      expect(component.diabetesSuspected).toBeTrue();
      ncd.diabetesSuspectStatus(false);
      ncd.hypertensionSuspectStatus(false);
      ncd.oralSuspectStatus(false);
      ncd.breastSuspectStatus(false);
      ncd.cervicalSuspectStatus(false);
      expect(component.suspectScreeningDiseases).toEqual([]);
    });

    it('confirmed diseases remove suspect badges and disable buttons', () => {
      master$.next({ screeningCondition: conditions() });
      ncd.diabetesSuspectStatus(true);
      ncd.hypertensionSuspectStatus(true);
      ncd.oralSuspectStatus(true);
      ncd.breastSuspectStatus(true);
      ncd.cervicalSuspectStatus(true);
      ncd.setConfirmedDiseasesForScreening([
        E.diabetes,
        E.hypertension,
        E.oral,
        E.breast,
        E.cervical,
      ]);
      expect(component.suspectScreeningDiseases).toEqual([]);
      expect(ncd.isDiabetesConfirmed).toBeTrue();
      expect(ncd.isHypertensionConfirmed).toBeTrue();
      expect(ncd.isOralConfirmed).toBeTrue();
      expect(ncd.isBreastConfirmed).toBeTrue();
      expect(ncd.isCervicalConfirmed).toBeTrue();
      expect(
        component.ncdScreeningDiseases.every((d: any) => d.disable === true),
      ).toBeTrue();
    });

    it('confirmed list without matches keeps everything unconfirmed', () => {
      master$.next({ screeningCondition: conditions() });
      ncd.setConfirmedDiseasesForScreening(['Other']);
      expect(ncd.isDiabetesConfirmed).toBeFalse();
      expect(ncd.isBreastConfirmed).toBeFalse();
      expect(
        component.ncdScreeningDiseases.every((d: any) => d.disable === false),
      ).toBeTrue();
      ncd.setConfirmedDiseasesForScreening([]);
      expect(ncd.isOralConfirmed).toBeFalse();
      expect(component.confirmDiseaseArray).toEqual([]);
    });

    describe('redirectToScreeningPage', () => {
      const cases = [
        [
          'diabetes',
          'isDiabetesConfirmed',
          'diabetesScreeningValidationOnSave',
        ],
        [
          'hypertension',
          'isHypertensionConfirmed',
          'hypertensionScreeningValidationOnSave',
        ],
        ['oral', 'isOralConfirmed', 'oralScreeningValidationOnSave'],
        ['breast', 'isBreastConfirmed', 'breastScreeningValidationOnSave'],
        [
          'cervical',
          'isCervicalConfirmed',
          'cervicalScreeningValidationOnSave',
        ],
      ];
      cases.forEach(([key, confirmedFlag, saveFlag]) => {
        it(`opens ${key} form when not confirmed`, () => {
          const d: any = { name: E[key], active: false };
          component.redirectToScreeningPage(d);
          expect((component as any)[key]).toBeTrue();
          expect((ncd as any)[saveFlag]).toBeTrue();
          expect(d.active).toBeTrue();
        });
        it(`keeps ${key} form closed when confirmed`, () => {
          (ncd as any)[confirmedFlag] = true;
          const d: any = { name: E[key], active: false };
          component.redirectToScreeningPage(d);
          expect((component as any)[key]).toBeFalse();
          expect((ncd as any)[saveFlag]).toBeFalse();
          expect(d.active).toBeFalse();
        });
      });

      it('ignores unknown disease', () => {
        const d: any = { name: 'Other', active: false };
        component.redirectToScreeningPage(d);
        expect(d.active).toBeFalse();
        expect(component.diabetes).toBeFalse();
      });
    });

    describe('form status handlers', () => {
      const handlers: [string, string, string][] = [
        [
          'getDiabetesFormStatus',
          'diabetes',
          'diabetesScreeningValidationOnSave',
        ],
        [
          'getHypertensionFormStatus',
          'hypertension',
          'hypertensionScreeningValidationOnSave',
        ],
        ['getOralFormStatus', 'oral', 'oralScreeningValidationOnSave'],
        ['getBreastFormStatus', 'breast', 'breastScreeningValidationOnSave'],
        [
          'getCervicalFormStatus',
          'cervical',
          'cervicalScreeningValidationOnSave',
        ],
      ];
      handlers.forEach(([method, key, saveFlag]) => {
        it(`${method} true keeps button, false deactivates`, () => {
          master$.next({ screeningCondition: conditions() });
          component.ncdScreeningDiseases.forEach((d: any) => (d.active = true));
          (component as any)[method](true);
          expect((component as any)[key]).toBeTrue();
          expect((ncd as any)[saveFlag]).toBeTrue();
          expect(byName(E[key]).active).toBeTrue();
          (component as any)[method](false);
          expect((component as any)[key]).toBeFalse();
          expect((ncd as any)[saveFlag]).toBeFalse();
          expect(byName(E[key]).active).toBeFalse();
        });
      });

      it('makeButtonInactive no-ops with empty list', () => {
        component.ncdScreeningDiseases = [];
        component.makeButtonInactive(E.oral);
        expect(component.ncdScreeningDiseases).toEqual([]);
      });
    });

    it('ngOnDestroy resets and unsubscribes', () => {
      const sub = component.diabetesScreeningStatusSubscription;
      component.diabetesSuspected = true;
      fixture.destroy();
      expect(component.diabetesSuspected).toBeFalse();
      expect(component.confirmDiseaseArray).toEqual([]);
      expect(sub.closed).toBeTrue();
      expect(component.oralScreeningStatusSubscription.closed).toBeTrue();
    });
  });

  describe('view mode', () => {
    beforeEach(() => {
      component.ncdScreeningMode = 'view';
    });

    it('loads cbac data and activates buttons for fetched diseases', () => {
      doctor.getNcdScreeningForCbac.and.returnValue(
        of({ statusCode: 200, data: fullData }),
      );
      master$.next({ screeningCondition: conditions() });
      fixture.detectChanges();
      expect(doctor.screeningDetailsResponseFromNurse).toEqual(fullData);
      expect(component.ncdDataForCbac).toEqual(fullData);
      expect(component.diabetes).toBeTrue();
      expect(component.hypertension).toBeTrue();
      expect(component.breast).toBeTrue();
      expect(component.oral).toBeTrue();
      expect(component.cervical).toBeTrue();
      expect(
        component.ncdScreeningDiseases.every((d: any) => d.active === true),
      ).toBeTrue();
    });

    it('does not activate anything for empty screening data', () => {
      doctor.getNcdScreeningForCbac.and.returnValue(
        of({
          statusCode: 200,
          data: {
            diabetes: { bloodGlucoseType: null },
            hypertension: null,
          },
        }),
      );
      fixture.detectChanges();
      expect(component.ncdDiabetesData).toBeNull();
      expect(component.diabetes).toBeFalse();
      expect(component.hypertension).toBeFalse();
    });

    it('ignores non-200 responses', () => {
      doctor.getNcdScreeningForCbac.and.returnValue(of({ statusCode: 500 }));
      fixture.detectChanges();
      expect(component.ncdDataForCbac).toEqual([]);
    });

    it('makeButtonAsActive no-ops when no diseases', () => {
      component.ncdScreeningDiseases = [];
      component.makeButtonAsActive(E.oral);
      expect(component.ncdScreeningDiseases).toEqual([]);
    });
  });

  describe('update mode', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.ncdScreeningMode = 'update';
    });

    it('updates and refetches on success', () => {
      doctor.updateNCDSreeningDetails.and.returnValue(
        of({ statusCode: 200, data: { response: 'saved' } }),
      );
      doctor.getNcdScreeningForCbac.and.returnValue(
        of({ statusCode: 200, data: fullData }),
      );
      spyOn(ncd, 'setScreeningDataFetch').and.callThrough();
      medical.markAsDirty();
      component.ngOnChanges();
      expect(doctor.updateNCDSreeningDetails).toHaveBeenCalledWith(
        medical,
        'NCD screening',
      );
      expect(confirm.alert).toHaveBeenCalledWith('saved', 'success');
      expect(medical.pristine).toBeTrue();
      expect(component.diabetes).toBeTrue();
      expect(component.hypertension).toBeTrue();
      expect(component.breast).toBeTrue();
      expect(component.oral).toBeTrue();
      expect(component.cervical).toBeTrue();
      expect(ncd.setScreeningDataFetch).toHaveBeenCalledWith(true);
    });

    it('refetch with empty data keeps forms closed', () => {
      doctor.getNcdScreeningForCbac.and.returnValue(
        of({ statusCode: 200, data: {} }),
      );
      component.getNcdScreeningDataForCbacUpdate();
      expect(component.diabetes).toBeFalse();
      expect(ncd.fetchScreeningData.value).toBeTrue();
    });

    it('refetch ignores non-200', () => {
      spyOn(ncd, 'setScreeningDataFetch');
      doctor.getNcdScreeningForCbac.and.returnValue(of({ statusCode: 500 }));
      component.getNcdScreeningDataForCbacUpdate();
      expect(ncd.setScreeningDataFetch).not.toHaveBeenCalled();
    });

    it('alerts error message on non-200 update', () => {
      doctor.updateNCDSreeningDetails.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'bad' }),
      );
      component.ngOnChanges();
      expect(confirm.alert).toHaveBeenCalledWith('bad', 'error');
    });

    it('alerts on update error', () => {
      doctor.updateNCDSreeningDetails.and.returnValue(throwingObs('oops'));
      component.ngOnChanges();
      expect(confirm.alert).toHaveBeenCalledWith('oops', 'error');
    });
  });

  it('ngOnChanges does nothing outside update mode', () => {
    component.ncdScreeningMode = 'view';
    component.ngOnChanges();
    expect(doctor.updateNCDSreeningDetails).not.toHaveBeenCalled();
  });
});
