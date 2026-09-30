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
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { BehaviorSubject, of } from 'rxjs';

import { ChiefComplaintsComponent } from './chief-complaints.component';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../shared/services';
import { VisitDetailUtils } from '../../shared/utility/visit-detail-utility';
import { BeneficiaryDetailsService } from 'src/app/app-modules/core/services/beneficiary-details.service';
import { ConfirmationService } from 'src/app/app-modules/core/services/confirmation.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { AmritTrackingService } from 'Common-UI/src/tracking';
import { MaterialModule } from 'src/app/app-modules/core/material.module';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

describe('ChiefComplaintsComponent', () => {
  let component: ChiefComplaintsComponent;
  let fixture: ComponentFixture<ChiefComplaintsComponent>;
  let doctor: any;
  let nurse: any;
  let master: any;
  let confirm: any;
  let tracking: any;
  let masterData$: BehaviorSubject<any>;
  let ben$: BehaviorSubject<any>;

  const FEVER = { chiefComplaint: 'Fever', chiefComplaintID: 1 };
  const COUGH = { chiefComplaint: 'Cough', chiefComplaintID: 2 };
  const ABDOMEN = { chiefComplaint: 'Abdominal pain', chiefComplaintID: 3 };
  const MASTER = { chiefComplaintMaster: [FEVER, COUGH, ABDOMEN] };

  const BASE_SESSION = {
    serviceLineDetails: JSON.stringify({ vanID: 1, parkingPlaceID: 2 }),
    visitID: 'V1',
    beneficiaryRegID: 'B1',
  };

  async function setup(seed: Record<string, any> = {}, mode?: string) {
    masterData$ = new BehaviorSubject<any>(null);
    ben$ = new BehaviorSubject<any>({ age: '30 years' });
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [ChiefComplaintsComponent],
      providers: [
        ...commonTestProviders({ session: { ...BASE_SESSION, ...seed } }),
        { provide: DoctorService, useValue: autoSpy(DoctorService) },
        { provide: NurseService, useValue: autoSpy(NurseService) },
        {
          provide: MasterdataService,
          useValue: autoSpy(MasterdataService, {
            nurseMasterData$: masterData$,
          }),
        },
        {
          provide: BeneficiaryDetailsService,
          useValue: { beneficiaryDetails$: ben$ },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(ChiefComplaintsComponent);
    component = fixture.componentInstance;
    component.mode = mode as any;
    const utils = new VisitDetailUtils(
      new FormBuilder(),
      TestBed.inject(SessionStorageService),
    );
    component.patientChiefComplaintsForm =
      utils.createANCPatientChiefComplaintArrayForm(false);
    doctor = TestBed.inject(DoctorService) as any;
    nurse = TestBed.inject(NurseService) as any;
    master = TestBed.inject(MasterdataService) as any;
    confirm = TestBed.inject(ConfirmationService) as any;
    tracking = TestBed.inject(AmritTrackingService) as any;
  }

  const complaints = () =>
    component.patientChiefComplaintsForm.controls['complaints'] as FormArray;

  describe('nurse flow', () => {
    beforeEach(async () => {
      await setup();
      fixture.detectChanges();
      masterData$.next(MASTER);
      fixture.detectChanges();
    });

    it('should init language, beneficiary and master list', () => {
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.beneficiary).toEqual({ age: '30 years' });
      expect(nurse.clearNCDScreeningProvision).toHaveBeenCalled();
      expect(component.chiefComplaintMaster).toEqual(
        MASTER.chiefComplaintMaster,
      );
      expect(component.chiefComplaintTemporarayList[0].length).toBe(3);
      expect(doctor.getVisitComplaintDetails).not.toHaveBeenCalled();
    });

    it('getCheifComplaints returns controls or null', () => {
      expect(component.getCheifComplaints()?.length).toBe(1);
      component.patientChiefComplaintsForm = new FormBuilder().group({
        complaints: [null],
      });
      expect(component.getCheifComplaints()).toBeNull();
    });

    it('onInputDuration enables/disables unit', () => {
      const f = complaints().at(0);
      f.get('duration')?.enable();
      f.patchValue({ duration: 3 });
      component.onInputDuration(f);
      expect(f.get('unitOfDuration')?.enabled).toBeTrue();
      f.patchValue({ duration: null });
      component.onInputDuration(f);
      expect(f.get('unitOfDuration')?.disabled).toBeTrue();
    });

    it('filterComplaints with Fever sets NCD temperature and provisional diag', () => {
      complaints().at(0).patchValue({ chiefComplaint: FEVER });
      component.filterComplaints(FEVER, 0);
      expect(component.selectedChiefComplaintList[0]).toBe(FEVER);
      expect(component.ncdTemperature).toBeTrue();
      expect(nurse.setNCDTemp).toHaveBeenCalledWith(true);
      expect(nurse.setNCDScreeningProvision).toHaveBeenCalledWith(true);
    });

    it('filterComplaints re-adds previous selection to other lists and removes new one', () => {
      component.chiefComplaintTemporarayList[1] = [COUGH, ABDOMEN];
      component.selectedChiefComplaintList[0] = FEVER;
      component.chiefComplaintTemporarayList[1] = [COUGH, ABDOMEN];
      component.filterComplaints(COUGH, 0);
      expect(component.chiefComplaintTemporarayList[1]).toEqual([
        ABDOMEN,
        FEVER,
      ]);
      expect(component.selectedChiefComplaintList[0]).toBe(COUGH);
      expect(component.ncdTemperature).toBeFalse();
      expect(nurse.setNCDTemp).toHaveBeenCalledWith(false);
    });

    it('filterComplaints with unknown value and empty selection sets flags false', () => {
      component.selectedChiefComplaintList = [];
      component.filterComplaints({ chiefComplaint: 'zzz' }, 0);
      expect(component.enableProvisionalDiag).toBeFalse();
      expect(nurse.setNCDScreeningProvision).toHaveBeenCalledWith(false);
    });

    it('addCheifComplaint pushes a new form and filtered list', () => {
      complaints().at(0).patchValue({ chiefComplaint: FEVER });
      component.addCheifComplaint();
      expect(complaints().length).toBe(2);
      expect(component.chiefComplaintTemporarayList[1]).toEqual([
        COUGH,
        ABDOMEN,
      ]);
    });

    it('addCheifComplaint throws when an existing row has no complaint (current behaviour)', () => {
      expect(() => component.addCheifComplaint()).toThrowError(TypeError);
    });

    it('addCheifComplaint does not push list when all used', () => {
      component.chiefComplaintMaster = [FEVER];
      complaints().at(0).patchValue({ chiefComplaint: FEVER });
      component.addCheifComplaint();
      expect(component.chiefComplaintTemporarayList.length).toBe(1);
      expect(complaints().length).toBe(2);
    });

    it('removeCheifComplaint on single row resets it', () => {
      const f = complaints().at(0);
      f.patchValue({ chiefComplaint: FEVER });
      component.selectedChiefComplaintList[0] = FEVER;
      component.suggestedChiefComplaintList[0] = [FEVER];
      component.removeCheifComplaint(0, f);
      expect(confirm.confirm).toHaveBeenCalledWith(
        'warn',
        LANGUAGE_EN.alerts.info.warn,
      );
      expect(f.value.chiefComplaint).toBeNull();
      expect(component.selectedChiefComplaintList[0]).toBeNull();
      expect(component.suggestedChiefComplaintList[0]).toBeNull();
      expect(nurse.setNCDTemp).toHaveBeenCalledWith(false);
      expect(nurse.setNCDScreeningProvision).toHaveBeenCalledWith(true);
    });

    it('removeCheifComplaint on multiple rows removes the row and restores item', () => {
      complaints().at(0).patchValue({ chiefComplaint: FEVER });
      component.addCheifComplaint();
      const second = complaints().at(1);
      second.patchValue({ chiefComplaint: COUGH });
      component.selectedChiefComplaintList = [FEVER, COUGH];
      component.chiefComplaintTemporarayList[0] = [ABDOMEN];
      component.removeCheifComplaint(1, second);
      expect(complaints().length).toBe(1);
      expect(component.chiefComplaintTemporarayList[0]).toEqual([
        ABDOMEN,
        COUGH,
      ]);
      expect(component.ncdTemperature).toBeTrue();
    });

    it('removeCheifComplaint cancelled keeps rows', () => {
      confirm.confirm.and.returnValue(of(false));
      complaints().at(0).patchValue({ chiefComplaint: FEVER });
      component.addCheifComplaint();
      component.selectedChiefComplaintList = [];
      component.removeCheifComplaint(1, complaints().at(1));
      expect(complaints().length).toBe(2);
      expect(nurse.setNCDScreeningProvision).toHaveBeenCalledWith(false);
    });

    it('removeCheifComplaint for empty row with multiple rows removes it', () => {
      complaints().at(0).patchValue({ chiefComplaint: FEVER });
      component.addCheifComplaint();
      component.removeCheifComplaint(1, complaints().at(1));
      expect(complaints().length).toBe(1);
    });

    describe('validateDuration', () => {
      it('alerts and clears when duration exceeds age', () => {
        const f = complaints().at(0);
        f.enable();
        f.patchValue({ duration: 40, unitOfDuration: 'Years' });
        component.validateDuration(f);
        expect(confirm.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.alerts.info.durationGreaterThanAge,
        );
        expect(f.value.duration).toBeNull();
      });

      it('accepts valid duration', () => {
        const f = complaints().at(0);
        f.enable();
        f.patchValue({ duration: 2, unitOfDuration: 'Days' });
        component.validateDuration(f);
        expect(confirm.alert).not.toHaveBeenCalled();
        expect(f.value.duration).toBe(2);
      });

      it('skips when duration or unit missing', () => {
        const f = complaints().at(0);
        component.validateDuration(f);
        expect(confirm.alert).not.toHaveBeenCalled();
      });
    });

    it('displayChiefComplaint returns name', () => {
      expect(component.displayChiefComplaint(FEVER)).toBe('Fever');
      expect(component.displayChiefComplaint(null)).toBeNull();
    });

    describe('suggestChiefComplaintList', () => {
      it('filters by string and enables fields', () => {
        const f = complaints().at(0);
        f.patchValue({ chiefComplaint: 'co' });
        component.suggestChiefComplaintList(f, 0);
        expect(component.suggestedChiefComplaintList[0]).toEqual([COUGH]);
        expect(f.get('duration')?.enabled).toBeTrue();
        expect(f.get('description')?.enabled).toBeTrue();
      });

      it('filters by object', () => {
        const f = complaints().at(0);
        f.patchValue({ chiefComplaint: ABDOMEN });
        component.suggestChiefComplaintList(f, 0);
        expect(component.suggestedChiefComplaintList[0]).toEqual([ABDOMEN]);
      });

      it('resets form when no suggestion matches', () => {
        const f = complaints().at(0);
        f.patchValue({ chiefComplaint: 'xyz' });
        component.suggestChiefComplaintList(f, 0);
        expect(component.suggestedChiefComplaintList[0]).toEqual([]);
        expect(f.value.chiefComplaint).toBeNull();
      });

      it('disables fields when complaint is null (with prior suggestions)', () => {
        const f = complaints().at(0);
        component.suggestedChiefComplaintList[0] = [FEVER];
        f.get('duration')?.enable();
        f.patchValue({ chiefComplaint: null });
        component.suggestChiefComplaintList(f, 0);
        expect(f.get('duration')?.disabled).toBeTrue();
        expect(f.get('unitOfDuration')?.disabled).toBeTrue();
        expect(f.get('description')?.disabled).toBeTrue();
      });
    });

    it('reEnterChiefComplaint toggles fields', () => {
      const f = complaints().at(0);
      f.patchValue({ chiefComplaint: FEVER });
      component.reEnterChiefComplaint(f);
      expect(f.get('duration')?.enabled).toBeTrue();
      f.patchValue({ chiefComplaint: null });
      component.reEnterChiefComplaint(f);
      expect(f.get('duration')?.disabled).toBeTrue();
      expect(f.get('description')?.disabled).toBeTrue();
    });

    it('sortChiefComplaintList sorts alphabetically', () => {
      const list = [FEVER, COUGH, ABDOMEN, { ...COUGH }];
      component.sortChiefComplaintList(list);
      expect(list.map((x) => x.chiefComplaint)).toEqual([
        'Abdominal pain',
        'Cough',
        'Cough',
        'Fever',
      ]);
    });

    it('checkComplaintFormValidity', () => {
      expect(
        component.checkComplaintFormValidity({
          value: { chiefComplaint: FEVER, duration: 1, unitOfDuration: 'Days' },
        }),
      ).toBeFalse();
      expect(
        component.checkComplaintFormValidity({
          value: { chiefComplaint: FEVER },
        }),
      ).toBeTrue();
    });

    describe('getSCTid', () => {
      it('loads concept id on success', () => {
        master.getSnomedCTRecord.and.returnValue(
          of({ statusCode: 200, data: { conceptID: 'C1' } }),
        );
        component.getSCTid(FEVER, 0);
        expect(master.getSnomedCTRecord).toHaveBeenCalledWith('Fever');
        expect(complaints().at(0).value.conceptID).toBe('C1');
      });

      it('ignores non-200 and error', () => {
        master.getSnomedCTRecord.and.returnValues(
          of({ statusCode: 5000 }),
          throwingObs(),
        );
        component.getSCTid(FEVER, 0);
        component.getSCTid(FEVER, 0);
        expect(complaints().at(0).value.conceptID).toBeNull();
      });
    });

    it('trackFieldInteraction delegates', () => {
      component.trackFieldInteraction('Chief Complaint');
      expect(tracking.trackFieldInteraction).toHaveBeenCalledWith(
        'Chief Complaint',
        'Chief Complaints',
      );
    });

    it('ngOnDestroy unsubscribes all and clears selection', () => {
      doctor.getVisitComplaintDetails.and.returnValue(of({ statusCode: 5000 }));
      component.getChiefComplaints('B', 'V');
      component.getMMUChiefComplaints('B', 'V');
      const spies = [
        spyOn(component.nurseMasterDataSubscription, 'unsubscribe'),
        spyOn(component.getChiefComplaintDetails, 'unsubscribe'),
        spyOn(component.getMMUChiefComplaintDetails, 'unsubscribe'),
        spyOn(component.beneficiaryDetailSubscription, 'unsubscribe'),
      ];
      component.selectedChiefComplaintList = [FEVER];
      component.ngOnDestroy();
      spies.forEach((s) => expect(s).toHaveBeenCalled());
      expect(component.selectedChiefComplaintList).toEqual([]);
    });

    it('ngOnDestroy without subscriptions does not throw', () => {
      component.nurseMasterDataSubscription = null;
      component.beneficiaryDetailSubscription = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
      expect(component.selectedChiefComplaintList).toEqual([]);
    });

    describe('getChiefComplaints', () => {
      it('with fever sets NCD temperature', () => {
        doctor.getVisitComplaintDetails.and.returnValue(
          of({
            statusCode: 200,
            data: {
              BenChiefComplaints: [
                { chiefComplaint: 'Cough' },
                { chiefComplaint: 'FEVER' },
              ],
            },
          }),
        );
        component.getChiefComplaints('B', 'V');
        expect(component.benChiefComplaints.length).toBe(2);
        expect(component.dataSource.data.length).toBe(2);
        expect(component.ncdTemperature).toBeTrue();
        expect(nurse.setNCDTemp).toHaveBeenCalledWith(true);
        expect(nurse.setNCDScreeningProvision).toHaveBeenCalledWith(true);
      });

      it('with no complaints sets flags false', () => {
        doctor.getVisitComplaintDetails.and.returnValue(
          of({ statusCode: 200, data: { BenChiefComplaints: [] } }),
        );
        component.getChiefComplaints('B', 'V');
        expect(component.ncdTemperature).toBeFalse();
        expect(nurse.setNCDTemp).toHaveBeenCalledWith(false);
        expect(nurse.setNCDScreeningProvision).toHaveBeenCalledWith(false);
      });

      it('ignores non-200', () => {
        doctor.getVisitComplaintDetails.and.returnValue(
          of({ statusCode: 5000, data: null }),
        );
        component.getChiefComplaints('B', 'V');
        expect(component.benChiefComplaints).toBeUndefined();
      });
    });

    it('getMMUChiefComplaints ignores non-200', () => {
      doctor.getVisitComplaintDetails.and.returnValue(of({ statusCode: 5000 }));
      component.getMMUChiefComplaints('B', 'V');
      expect(component.visitComplaintDet).toBeUndefined();
    });

    it('handleChiefComplaintData with no data leaves form unchanged', () => {
      component.visitComplaintDet = null;
      component.handleChiefComplaintData();
      expect(complaints().length).toBe(1);
    });
  });

  describe('view mode', () => {
    beforeEach(async () => {
      await setup({}, 'view');
      fixture.detectChanges();
    });

    it('fetches complaints once master data arrives', () => {
      doctor.getVisitComplaintDetails.and.returnValue(
        of({
          statusCode: 200,
          data: { BenChiefComplaints: [{ chiefComplaint: 'Cough' }] },
        }),
      );
      masterData$.next(MASTER);
      fixture.detectChanges();
      expect(doctor.getVisitComplaintDetails).toHaveBeenCalledWith('B1', 'V1');
      expect(component.dataSource.data).toEqual([{ chiefComplaint: 'Cough' }]);
      expect(component.enableProvisionalDiag).toBeTrue();
      expect(component.ncdTemperature).toBeFalse();
    });

    it('ignores master data without chief complaints', () => {
      masterData$.next({});
      expect(component.chiefComplaintMaster).toBeUndefined();
    });
  });

  describe('specialist (MMU) flow', () => {
    beforeEach(async () => {
      await setup({ specialistFlag: '100' }, 'view');
      fixture.detectChanges();
    });

    it('loads master, view complaints and MMU complaints into form', () => {
      doctor.getVisitComplaintDetails.and.returnValue(
        of({
          statusCode: 200,
          data: {
            BenChiefComplaints: [
              { chiefComplaint: 'Fever', duration: 2, unitOfDuration: 'Days' },
              { chiefComplaint: 'Unknown' },
            ],
          },
        }),
      );
      masterData$.next(MASTER);
      expect(doctor.getVisitComplaintDetails).toHaveBeenCalledTimes(2);
      expect(component.visitComplaintDet.length).toBe(2);
      expect(complaints().length).toBe(2);
      expect(complaints().at(0).value.chiefComplaint).toEqual(FEVER);
      expect(complaints().at(0).touched).toBeTrue();
      expect(component.selectedChiefComplaintList[0]).toBe(FEVER);
      expect(complaints().at(1).getRawValue().chiefComplaint).toBe('Unknown');
    });

    it('ignores master data without chief complaints', () => {
      masterData$.next({});
      expect(component.chiefComplaintMaster).toBeUndefined();
    });
  });
});
