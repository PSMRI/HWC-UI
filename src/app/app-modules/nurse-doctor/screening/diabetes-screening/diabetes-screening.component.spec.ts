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
import { MatSelectModule } from '@angular/material/select';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, of } from 'rxjs';

import { DiabetesScreeningComponent } from './diabetes-screening.component';
import { DoctorService } from '../../shared/services/doctor.service';
import { NurseService } from '../../shared/services/nurse.service';
import { MasterdataService } from '../../shared/services/masterdata.service';
import { NcdScreeningService } from '../../shared/services/ncd-screening.service';
import { NCDScreeningUtils } from '../../shared/utility/ncd-screening-utility';
import { ConfirmationService } from 'src/app/app-modules/core/services/confirmation.service';
import { IotcomponentComponent } from 'src/app/app-modules/core/components/iotcomponent/iotcomponent.component';
import { environment } from 'src/environments/environment';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';

const MASTER = {
  bloodGlucoseType: [
    { id: 1, name: 'Fasting' },
    { id: 2, name: 'Random' },
    { id: 3, name: null },
  ],
};

describe('DiabetesScreeningComponent', () => {
  let component: DiabetesScreeningComponent;
  let fixture: ComponentFixture<DiabetesScreeningComponent>;
  let ncd: NcdScreeningService;
  let doctor: any;
  let nurse: any;
  let confirm: any;
  let dialog: any;
  let params: any;
  let master$: BehaviorSubject<any>;
  let form: FormGroup;

  beforeEach(async () => {
    params = { attendant: 'nurse' };
    master$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MatSelectModule],
      declarations: [DiabetesScreeningComponent],
      providers: [
        ...commonTestProviders(),
        NcdScreeningService,
        { provide: DoctorService, useValue: {} },
        { provide: NurseService, useValue: autoSpy(NurseService) },
        { provide: MasterdataService, useValue: { nurseMasterData$: master$ } },
        { provide: ActivatedRoute, useValue: { snapshot: { params } } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    ncd = TestBed.inject(NcdScreeningService);
    doctor = TestBed.inject(DoctorService);
    nurse = TestBed.inject(NurseService);
    confirm = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    form = new NCDScreeningUtils(
      new FormBuilder(),
      {} as any,
    ).createDiabetesScreeningForm();
    fixture = TestBed.createComponent(DiabetesScreeningComponent);
    component = fixture.componentInstance;
    component.diabetesScreeningForm = form;
    component.confirmDiseasesList = [];
  });

  it('logs when master data is missing and keeps sample types empty', () => {
    fixture.detectChanges();
    expect(component.bloodGlucoseSampleTypes).toEqual([]);
    expect(component.disableCheckbox).toBeTrue();
  });

  describe('nurse mode', () => {
    beforeEach(() => {
      master$.next(MASTER);
      fixture.detectChanges();
    });

    it('defaults sample type to Random and sets language', () => {
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.attendant).toBe('nurse');
      expect(form.value.bloodGlucoseTypeID).toBe(2);
      expect(component.disableFindStatuButton).toBeTrue();
      expect(
        fixture.nativeElement.querySelector('[formcontrolname]'),
      ).not.toBeNull();
    });

    it('ignores master data without blood glucose types', () => {
      master$.next({ bloodGlucoseType: null });
      expect(component.bloodGlucoseSampleTypes).toBe(MASTER.bloodGlucoseType);
    });

    describe('checkingDiabeticStatus', () => {
      it('alerts and resets value below 10', () => {
        form.patchValue({ bloodGlucose: 5 });
        component.checkingDiabeticStatus();
        expect(confirm.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.alerts.info.recheckValue,
          'info',
        );
        expect(form.value.bloodGlucose).toBeNull();
        expect(component.disableFindStatuButton).toBeTrue();
      });

      it('enables find status within range', () => {
        form.patchValue({ bloodGlucose: 150 });
        component.checkingDiabeticStatus();
        expect(component.disableFindStatuButton).toBeFalse();
        expect(ncd.valueChangedForNCD.value).toBeTrue();
      });

      it('disables find status above 600', () => {
        form.patchValue({ bloodGlucose: 700 });
        component.checkingDiabeticStatus();
        expect(component.disableFindStatuButton).toBeTrue();
      });

      it('clears interpretation when no value', () => {
        component.interpretation = 'x';
        component.isDiabetesSuspected = true;
        component.checkingDiabeticStatus();
        expect(component.interpretation).toBeNull();
        expect(component.isDiabetesSuspected).toBeFalse();
        expect(ncd.diabetesScreeningStatus.value).toBeFalse();
      });
    });

    describe('confirmed diseases', () => {
      it('disables form when diabetes confirmed', () => {
        ncd.setConfirmedDiseasesForScreening([environment.diabetes]);
        expect(form.disabled).toBeTrue();
        expect(component.hideStatusButton).toBeTrue();
        expect(component.disableCheckbox).toBeTrue();
        expect(form.getRawValue().formDisable).toBeTrue();
      });

      it('enables form for other confirmed disease (doctor keeps checkbox enabled)', () => {
        component.attendant = 'doctor';
        ncd.isDiabetesConfirmed = true;
        form.disable();
        ncd.setConfirmedDiseasesForScreening(['Other']);
        expect(form.enabled).toBeTrue();
        expect(ncd.isDiabetesConfirmed).toBeFalse();
        expect(component.disableCheckbox).toBeFalse();
      });

      it('re-emits suspicion and enables checkbox for suspected with empty list', () => {
        component.isDiabetesSuspected = true;
        component.attendant = 'doctor';
        spyOn(ncd, 'diabetesSuspectStatus').and.callThrough();
        ncd.setConfirmedDiseasesForScreening([]);
        expect(component.disableCheckbox).toBeFalse();
        expect(ncd.diabetesSuspectStatus).toHaveBeenCalledWith(true);
      });
    });

    describe('getDiabetes', () => {
      it('does nothing without blood glucose', () => {
        component.getDiabetes();
        expect(nurse.getDiabetesStatus).not.toHaveBeenCalled();
      });

      it('marks suspected for diabetic range', () => {
        form.patchValue({ bloodGlucose: 250 });
        nurse.getDiabetesStatus.and.returnValue(
          of({ statusCode: 200, data: { status: 'Diabetic Range' } }),
        );
        component.getDiabetes();
        expect(nurse.getDiabetesStatus).toHaveBeenCalledWith({
          bloodGlucoseTypeID: 2,
          bloodGlucoseType: 'Random',
          bloodGlucose: 250,
        });
        expect(component.interpretation).toBe('Diabetic Range');
        expect(component.isDiabetesSuspected).toBeTrue();
        expect(component.disableCheckbox).toBeFalse();
        expect(form.value.suspected).toBeTrue();
      });

      it('confirmed diabetic with other attendant is not suspected', () => {
        ncd.isDiabetesConfirmed = true;
        component.attendant = 'lab';
        component.disableCheckbox = true;
        form.patchValue({ bloodGlucoseTypeID: 3, bloodGlucose: 250 });
        nurse.getDiabetesStatus.and.returnValue(
          of({ statusCode: 200, data: { status: 'Diabetic Range' } }),
        );
        component.getDiabetes();
        expect(
          nurse.getDiabetesStatus.calls.mostRecent().args[0].bloodGlucoseType,
        ).toBeNull();
        expect(component.isDiabetesSuspected).toBeFalse();
        expect(component.disableCheckbox).toBeTrue();
      });

      [
        'Non-Diabetic Range',
        'Normal/Non-Diabetic Range',
        'Pre-Diabetic Range',
      ].forEach((status) =>
        it(`not suspected for ${status}`, () => {
          form.patchValue({ bloodGlucose: 100 });
          component.isDiabetesSuspected = true;
          component.disableFindStatuButton = false;
          nurse.getDiabetesStatus.and.returnValue(
            of({ statusCode: 200, data: { status } }),
          );
          component.getDiabetes();
          expect(component.isDiabetesSuspected).toBeFalse();
          expect(form.value.suspected).toBeFalse();
          expect(component.disableFindStatuButton).toBeTrue();
        }),
      );

      it('alerts on non-200', () => {
        form.patchValue({ bloodGlucose: 100 });
        nurse.getDiabetesStatus.and.returnValue(of({ statusCode: 500 }));
        component.getDiabetes();
        expect(confirm.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.issueFetchingDiabetesStatus,
          'error',
        );
      });
    });

    it('fetches nurse data when fetch flag set', () => {
      doctor.screeningDetailsResponseFromNurse = {
        diabetes: { suspected: true, bloodGlucose: 300 },
      };
      ncd.setScreeningDataFetch(true);
      expect(component.hideRemoveFunctionalityInDoctorIfSuspected).toBeTrue();
      expect(component.isDiabetesSuspected).toBeTrue();
      expect(form.value.bloodGlucose).toBe(300);
    });

    it('nurse data unsuspected / missing', () => {
      doctor.screeningDetailsResponseFromNurse = {
        diabetes: { suspected: false },
      };
      component.getNcdScreeningDataForCbac();
      expect(component.isDiabetesSuspected).toBeFalse();
      doctor.screeningDetailsResponseFromNurse = { diabetes: null };
      component.hideRemoveFunctionalityInDoctorIfSuspected = false;
      component.getNcdScreeningDataForCbac();
      expect(component.hideRemoveFunctionalityInDoctorIfSuspected).toBeFalse();
    });

    it('openIOTRBSModel opens device dialog', () => {
      dialog.open.and.returnValue({ afterClosed: () => of({ result: 120 }) });
      component.openIOTRBSModel();
      expect(dialog.open).toHaveBeenCalledWith(IotcomponentComponent, {
        width: '600px',
        height: '180px',
        disableClose: true,
        data: { startAPI: environment.startRBSurl },
      });
      // app patches a non-existent 'testValue' control, so the form is unchanged
      expect(form.value.bloodGlucose).toBeNull();
    });

    it('hideDiabetesForm confirm removes form and flags change in view mode', () => {
      const emitted: boolean[] = [];
      component.diabetesFormStatus.subscribe((v) => emitted.push(v));
      component.mode = 'view';
      form.patchValue({ bloodGlucose: 100 });
      spyOn(ncd, 'screeningValueChanged').and.callThrough();
      component.hideDiabetesForm();
      expect(confirm.confirm).toHaveBeenCalledWith(
        'warn',
        LANGUAGE_EN.alerts.info.warn,
      );
      expect(component.hideForm).toBeTrue();
      expect(emitted).toEqual([false]);
      expect(form.value.bloodGlucose).toBeNull();
      expect(ncd.screeningValueChanged).toHaveBeenCalledWith(true);
    });

    it('hideDiabetesForm confirm in nurse mode does not flag change', () => {
      spyOn(ncd, 'screeningValueChanged');
      component.hideDiabetesForm();
      expect(ncd.screeningValueChanged).not.toHaveBeenCalled();
    });

    it('hideDiabetesForm cancel keeps form', () => {
      confirm.confirm.and.returnValue(of(false));
      component.hideForm = true;
      component.hideDiabetesForm();
      expect(component.hideForm).toBeFalse();
    });

    it('resetDiabeticValues clears state', () => {
      form.patchValue({ bloodGlucose: 100 });
      component.interpretation = 'x';
      component.isDiabetesSuspected = true;
      component.disableFindStatuButton = false;
      component.resetDiabeticValues();
      expect(form.value.bloodGlucose).toBeNull();
      expect(component.interpretation).toBeNull();
      expect(component.isDiabetesSuspected).toBeFalse();
      expect(component.disableFindStatuButton).toBeTrue();
    });

    [true, false].forEach((v) => {
      it(`markAsUnsuspected(${v})`, () => {
        component.markAsUnsuspected(v);
        expect(form.value.suspected).toBe(v);
        expect(component.isDiabetesSuspected).toBe(v);
        expect(form.dirty).toBeTrue();
        expect(ncd.diabetesScreeningStatus.value).toBe(v);
      });
      it(`markAsUnSuspectedOnLoad(${v})`, () => {
        component.markAsUnSuspectedOnLoad(v);
        expect(form.value.suspected).toBe(v);
        expect(form.dirty).toBeFalse();
        expect(ncd.diabetesScreeningStatus.value).toBe(v);
      });
    });

    it('ngOnChanges in view mode loads nurse data', () => {
      doctor.screeningDetailsResponseFromNurse = {
        diabetes: { suspected: true },
      };
      component.mode = 'view';
      component.disableFindStatuButton = false;
      component.ngOnChanges();
      expect(component.isDiabetesSuspected).toBeTrue();
      expect(component.disableFindStatuButton).toBeTrue();
    });

    it('ngOnChanges outside view mode does nothing', () => {
      component.disableFindStatuButton = false;
      component.ngOnChanges();
      expect(component.disableFindStatuButton).toBeFalse();
    });

    it('ngOnDestroy unsubscribes and resets', () => {
      component.screeningDataSubscription = {
        unsubscribe: jasmine.createSpy(),
      };
      const s1 = component.nurseMasterDataSubscription;
      const s2 = component.confirmedDiseasesListSubscription;
      fixture.destroy();
      expect(s1.closed).toBeTrue();
      expect(s2.closed).toBeTrue();
      expect(
        component.screeningDataSubscription.unsubscribe,
      ).toHaveBeenCalled();
      expect(form.value.bloodGlucoseTypeID).toBeNull();
    });
  });

  it('view mode loads nurse data after master data', () => {
    doctor.screeningDetailsResponseFromNurse = {
      diabetes: { suspected: true },
    };
    component.mode = 'view';
    master$.next(MASTER);
    fixture.detectChanges();
    expect(component.isDiabetesSuspected).toBeTrue();
    expect(form.value.suspected).toBeTrue();
    expect(component.disableFindStatuButton).toBeTrue();
  });
});
