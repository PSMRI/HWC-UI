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
import { FormArray, FormGroup } from '@angular/forms';
import { BehaviorSubject, of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import { MedicationHistoryComponent } from './medication-history.component';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../../shared/services';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { BeneficiaryDetailsService } from '../../../../core/services/beneficiary-details.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { AmritTrackingService } from 'Common-UI/src/tracking';
import { PreviousDetailsComponent } from 'src/app/app-modules/core/components/previous-details/previous-details.component';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

describe('MedicationHistoryComponent', () => {
  let component: MedicationHistoryComponent;
  let fixture: ComponentFixture<MedicationHistoryComponent>;
  let masterData$: BehaviorSubject<any>;
  let history$: BehaviorSubject<any>;
  let beneficiary$: BehaviorSubject<any>;
  let nurseService: any;
  let confirmation: any;
  let dialog: any;
  let session: any;
  let tracking: any;

  const list = () =>
    component.medicationHistoryForm.controls[
      'medicationHistoryList'
    ] as FormArray;

  beforeEach(async () => {
    masterData$ = new BehaviorSubject<any>(null);
    history$ = new BehaviorSubject<any>(null);
    beneficiary$ = new BehaviorSubject<any>({ age: '30 years - 2 months' });
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [MedicationHistoryComponent],
      providers: [
        ...commonTestProviders({ session: { beneficiaryRegID: 'B1' } }),
        {
          provide: MasterdataService,
          useValue: autoSpy(MasterdataService, {
            nurseMasterData$: masterData$.asObservable(),
          }),
        },
        { provide: NurseService, useValue: autoSpy(NurseService) },
        {
          provide: DoctorService,
          useValue: autoSpy(DoctorService, {
            populateHistoryResponse$: history$.asObservable(),
          }),
        },
        {
          provide: BeneficiaryDetailsService,
          useValue: autoSpy(BeneficiaryDetailsService, {
            beneficiaryDetails$: beneficiary$.asObservable(),
          }),
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(MedicationHistoryComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(MedicationHistoryComponent);
    component = fixture.componentInstance;
    component.medicationHistoryForm = new FormGroup({
      medicationHistoryList: new FormArray<any>([]),
    });
    nurseService = TestBed.inject(NurseService);
    confirmation = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    session = TestBed.inject(SessionStorageService);
    tracking = TestBed.inject(AmritTrackingService);
  });

  it('initialises with one disabled-duration row and beneficiary', () => {
    fixture.detectChanges();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(list().length).toBe(1);
    expect(list().at(0).get('timePeriodAgo')?.disabled).toBeTrue();
    expect(component.beneficiary).toEqual({ age: '30 years - 2 months' });
    expect(component.getMedicationHistory()?.length).toBe(1);
  });

  it('getMedicationHistory returns null when control is not an array', () => {
    component.medicationHistoryForm = new FormGroup({});
    expect(component.getMedicationHistory()).toBeNull();
  });

  it('master data in edit mode does not load history', () => {
    const spy = spyOn(component, 'getGeneralHistory');
    fixture.detectChanges();
    masterData$.next({ a: 1 });
    expect(component.masterData).toEqual({ a: 1 });
    expect(spy).not.toHaveBeenCalled();
  });

  it('loads history in view mode', () => {
    component.mode = 'view';
    const spy = spyOn(component, 'getGeneralHistory');
    fixture.detectChanges();
    masterData$.next({ a: 1 });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('loads history for specialist flag 100', () => {
    session.setItem('specialistFlag', '100');
    const spy = spyOn(component, 'getGeneralHistory');
    fixture.detectChanges();
    masterData$.next({ a: 1 });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  describe('getGeneralHistory', () => {
    beforeEach(() => fixture.detectChanges());

    it('adds rows, patches values and enables durations', () => {
      component.getGeneralHistory();
      history$.next({
        statusCode: 200,
        data: {
          MedicationHistory: {
            medicationHistoryList: [
              {
                currentMedication: 'Metformin',
                timePeriodAgo: 2,
                timePeriodUnit: 'Years',
              },
              {
                currentMedication: 'Aspirin',
                timePeriodAgo: null,
                timePeriodUnit: null,
              },
            ],
          },
        },
      });
      expect(list().length).toBe(2);
      expect(list().at(0).get('timePeriodAgo')?.enabled).toBeTrue();
      expect(list().at(0).value.currentMedication).toBe('Metformin');
      expect(list().at(1).get('timePeriodAgo')?.disabled).toBeTrue();
      expect(list().dirty).toBeTrue();
      expect(list().at(1).touched).toBeTrue();
    });

    it('ignores response without MedicationHistory', () => {
      component.getGeneralHistory();
      history$.next({ statusCode: 200, data: {} });
      expect(component.medicationHistoryData).toBeUndefined();
    });
  });

  describe('removeMedicationHistory', () => {
    beforeEach(() => fixture.detectChanges());

    it('clears and disables the only row', () => {
      const row = list().at(0);
      row.get('timePeriodAgo')?.enable();
      row.patchValue({ currentMedication: 'x', timePeriodAgo: 2 });
      component.removeMedicationHistory(0, row);
      expect(confirmation.confirm).toHaveBeenCalledWith(
        'warn',
        LANGUAGE_EN.alerts.info.warn,
      );
      expect(list().length).toBe(1);
      expect(row.value.currentMedication).toBeNull();
      expect(row.get('timePeriodAgo')?.disabled).toBeTrue();
      expect(row.get('timePeriodUnit')?.disabled).toBeTrue();
    });

    it('removes a row when more than one', () => {
      component.addMedicationHistory();
      component.removeMedicationHistory(1, list().at(1));
      expect(list().length).toBe(1);
    });

    it('does nothing when cancelled', () => {
      confirmation.confirm.and.returnValue(of(false));
      component.addMedicationHistory();
      component.removeMedicationHistory(1, list().at(1));
      expect(list().length).toBe(2);
    });
  });

  it('createMedicationHistoryForm builds a single-row form', () => {
    component.createMedicationHistoryForm();
    expect(list().length).toBe(1);
    expect(Object.keys(list().at(0).getRawValue())).toEqual([
      'currentMedication',
      'timePeriodAgo',
      'timePeriodUnit',
    ]);
  });

  describe('getPreviousMedicationHistory', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.visitCategory = 'NCD care';
    });

    it('opens dialog when data exists', () => {
      const data = { data: [{ a: 1 }] };
      nurseService.getPreviousMedicationHistory.and.returnValue(
        of({ statusCode: 200, data }),
      );
      component.getPreviousMedicationHistory();
      expect(nurseService.getPreviousMedicationHistory).toHaveBeenCalledWith(
        'B1',
        'NCD care',
      );
      expect(dialog.open).toHaveBeenCalledWith(PreviousDetailsComponent, {
        data: {
          dataList: data,
          title:
            LANGUAGE_EN.historyData.Medicationhistorydetails
              .previousmedicationhistorydetails,
        },
      });
    });

    it('alerts when empty', () => {
      nurseService.getPreviousMedicationHistory.and.returnValue(
        of({ statusCode: 200, data: { data: [] } }),
      );
      component.getPreviousMedicationHistory();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.pastHistoryNot,
      );
    });

    it('alerts error on non-200', () => {
      nurseService.getPreviousMedicationHistory.and.returnValue(
        of({ statusCode: 5000, data: null }),
      );
      component.getPreviousMedicationHistory();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.errorFetchingHistory,
        'error',
      );
    });

    it('alerts error on failure', () => {
      nurseService.getPreviousMedicationHistory.and.returnValue(throwingObs());
      component.getPreviousMedicationHistory();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.errorFetchingHistory,
        'error',
      );
    });
  });

  describe('validateDuration', () => {
    let row: any;
    beforeEach(() => {
      fixture.detectChanges();
      row = list().at(0);
      row.get('timePeriodAgo').enable();
      row.get('timePeriodUnit').enable();
    });

    it('accepts duration within age', () => {
      row.patchValue({ timePeriodAgo: 2, timePeriodUnit: 'Years' });
      component.validateDuration(row);
      expect(confirmation.alert).not.toHaveBeenCalled();
      expect(row.value.timePeriodAgo).toBe(2);
      expect(row.get('timePeriodUnit').enabled).toBeTrue();
    });

    it('alerts and clears duration greater than age', () => {
      row.patchValue({ timePeriodAgo: 50, timePeriodUnit: 'Years' });
      component.validateDuration(row);
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.durationGreaterThanAge,
      );
      expect(row.get('timePeriodAgo').value).toBeNull();
      expect(row.get('timePeriodUnit').value).toBeNull();
    });

    it('enables unit when only duration given', () => {
      row.get('timePeriodUnit').disable();
      row.patchValue({ timePeriodAgo: 3 });
      component.validateDuration(row);
      expect(row.get('timePeriodUnit').enabled).toBeTrue();
      expect(row.get('timePeriodUnit').value).toBeNull();
    });

    it('disables unit when no duration', () => {
      row.patchValue({ timePeriodAgo: null, timePeriodUnit: 'Days' });
      component.validateDuration(row);
      expect(row.get('timePeriodUnit').disabled).toBeTrue();
    });
  });

  it('checkValidity is false only when all fields are set', () => {
    fixture.detectChanges();
    const row: any = list().at(0);
    expect(component.checkValidity(row)).toBeTrue();
    row.get('timePeriodAgo').enable();
    row.get('timePeriodUnit').enable();
    row.patchValue({
      currentMedication: 'x',
      timePeriodAgo: 1,
      timePeriodUnit: 'Days',
    });
    expect(component.checkValidity(row)).toBeFalse();
  });

  it('enableDuration toggles duration fields based on medication', () => {
    fixture.detectChanges();
    const row: any = list().at(0);
    row.patchValue({ currentMedication: 'x' });
    component.enableDuration(row);
    expect(row.get('timePeriodAgo').enabled).toBeTrue();
    row.patchValue({ currentMedication: null });
    component.enableDuration(row);
    expect(row.get('timePeriodAgo').disabled).toBeTrue();
    expect(row.get('timePeriodUnit').disabled).toBeTrue();
  });

  it('trackFieldInteraction delegates to tracking service', () => {
    component.trackFieldInteraction('Medication');
    expect(tracking.trackFieldInteraction).toHaveBeenCalledWith(
      'Medication',
      'Medication History',
    );
  });

  it('unsubscribes on destroy', () => {
    fixture.detectChanges();
    component.getGeneralHistory();
    const s1 = spyOn(component.nurseMasterDataSubscription, 'unsubscribe');
    const s2 = spyOn(component.generalHistorySubscription, 'unsubscribe');
    const s3 = spyOn(component.beneficiaryDetailSubscription, 'unsubscribe');
    component.ngOnDestroy();
    expect(s1).toHaveBeenCalled();
    expect(s2).toHaveBeenCalled();
    expect(s3).toHaveBeenCalled();
  });

  it('ngOnDestroy without subscriptions does not throw', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('ngDoCheck assigns language', () => {
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });
});
