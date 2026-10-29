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

import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  createSessionStorageMock,
  throwingObs,
} from 'src/testing/test-utils';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { AmritTrackingService } from 'Common-UI/src/tracking';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { BeneficiaryDetailsService } from '../../../../core/services/beneficiary-details.service';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../../shared/services';
import { GeneralUtils } from '../../../shared/utility/general-utility';
import { FindingsComponent } from './findings.component';

const SERVICE_LINE = JSON.stringify({ facilityID: 1, parkingPlaceID: 2 });

describe('FindingsComponent', () => {
  let component: FindingsComponent;
  let fixture: ComponentFixture<FindingsComponent>;
  let nurseMaster$: BehaviorSubject<any>;
  let caseRecord$: BehaviorSubject<any>;
  let beneficiary$: BehaviorSubject<any>;
  let doctor: any;
  let nurse: any;
  let master: any;
  let confirm: any;
  let tracking: any;
  let session: any;
  let utils: GeneralUtils;

  const complaintsMaster = () => [
    { chiefComplaint: 'Abdominal pain', chiefComplaintID: 1 },
    { chiefComplaint: 'Cough', chiefComplaintID: 2 },
    { chiefComplaint: 'Fever', chiefComplaintID: 3 },
  ];

  async function setup(sessionValues: Record<string, any> = {}) {
    nurseMaster$ = new BehaviorSubject<any>(null);
    caseRecord$ = new BehaviorSubject<any>(null);
    beneficiary$ = new BehaviorSubject<any>({ age: '30 years' });
    doctor = autoSpy(DoctorService, {
      populateCaserecordResponse$: caseRecord$.asObservable(),
    });
    nurse = autoSpy(NurseService);
    master = autoSpy(MasterdataService, {
      nurseMasterData$: nurseMaster$.asObservable(),
    });
    session = createSessionStorageMock({
      serviceLineDetails: SERVICE_LINE,
      visitCategory: 'General OPD',
      beneficiaryRegID: 'BR',
      visitID: 'V1',
      ...sessionValues,
    });
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [FindingsComponent],
      providers: [
        ...commonTestProviders(),
        { provide: SessionStorageService, useValue: session },
        { provide: DoctorService, useValue: doctor },
        { provide: NurseService, useValue: nurse },
        { provide: MasterdataService, useValue: master },
        {
          provide: BeneficiaryDetailsService,
          useValue: { beneficiaryDetails$: beneficiary$.asObservable() },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(FindingsComponent, '')
      .compileComponents();
    spyOn(console, 'log');
    spyOn(console, 'error');
    fixture = TestBed.createComponent(FindingsComponent);
    component = fixture.componentInstance;
    utils = new GeneralUtils(TestBed.inject(FormBuilder), session as any);
    component.generalFindingsForm = utils.createGeneralFindingsForm();
    confirm = TestBed.inject(ConfirmationService);
    tracking = TestBed.inject(AmritTrackingService);
  }

  afterEach(() => fixture?.destroy());

  const complaints = () =>
    component.generalFindingsForm.controls['complaints'] as FormArray;
  const observations = () =>
    component.generalFindingsForm.controls[
      'clinicalObservationsList'
    ] as FormArray;
  const findings = () =>
    component.generalFindingsForm.controls[
      'significantFindingsList'
    ] as FormArray;

  describe('init', () => {
    beforeEach(async () => setup());

    it('assigns language, category, beneficiary and clears NCD provision', () => {
      fixture.detectChanges();
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
      expect(component.visitCategory).toBe('General OPD');
      expect(component.beneficiary).toEqual({ age: '30 years' });
      expect(nurse.clearNCDScreeningProvision).toHaveBeenCalled();
    });

    it('loads chief complaint master data', () => {
      component.ngOnInit();
      nurseMaster$.next({ chiefComplaintMaster: complaintsMaster() });
      expect(component.chiefComplaintMaster.length).toBe(3);
      expect(component.chiefComplaintTemporarayList[0].length).toBe(3);
      expect(doctor.getMMUCaseRecordAndReferDetails).not.toHaveBeenCalled();
    });

    it('ngOnDestroy unsubscribes', () => {
      component.caseRecordMode = 'view';
      component.ngOnInit();
      nurseMaster$.next({ chiefComplaintMaster: complaintsMaster() });
      const subs = [
        component.doctorMasterDataSubscription,
        component.beneficiaryDetailSubscription,
        component.findingSubscription,
      ];
      component.ngOnDestroy();
      subs.forEach((s) => expect(s.closed).toBeTrue());
    });

    it('ngOnDestroy is safe without subscriptions', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('ngDoCheck and trackFieldInteraction', () => {
      component.ngDoCheck();
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
      component.trackFieldInteraction('Chief Complaint');
      expect(tracking.trackFieldInteraction).toHaveBeenCalledWith(
        'Chief Complaint',
        'Findings',
      );
    });

    it('form array accessors return controls or null', () => {
      expect(component.getComplaints()!.length).toBe(1);
      expect(component.getClinicalObservationsList()!.length).toBe(1);
      expect(component.getSignificantFindingsList()!.length).toBe(1);
      component.generalFindingsForm = new FormGroup({});
      expect(component.getComplaints()).toBeNull();
      expect(component.getClinicalObservationsList()).toBeNull();
      expect(component.getSignificantFindingsList()).toBeNull();
    });
  });

  describe('view mode', () => {
    const findingsData = () => ({
      complaints: [
        {
          chiefComplaint: 'Cough',
          duration: 2,
          unitOfDuration: 'Days',
        },
      ],
      clinicalObservationsList: [
        { term: 'Pallor', conceptID: 'C1' },
        { term: 'Icterus', conceptID: 'C2' },
      ],
      significantFindingsList: [{ term: 'Rales', conceptID: 'S1' }],
      otherSymptoms: 'none',
    });

    it('populates findings from the case record response when not referred', async () => {
      await setup({ referredVisitCode: 'undefined' });
      component.caseRecordMode = 'view';
      component.ngOnInit();
      nurseMaster$.next({ chiefComplaintMaster: complaintsMaster() });
      caseRecord$.next({ statusCode: 200, data: { findings: findingsData() } });

      expect(component.beneficiaryRegID).toBe('BR');
      expect(component.dataSource.data.length).toBe(1);
      expect(component.complaintList.length).toBe(1);
      // Cough removed from master and temp list
      expect(
        component.chiefComplaintMaster.map((c: any) => c.chiefComplaint),
      ).toEqual(['Abdominal pain', 'Fever']);
      expect(component.chiefComplaintTemporarayList[0].length).toBe(2);
      expect(observations().length).toBe(2);
      expect(observations().at(0).value.term).toBe('Pallor');
      expect(
        (observations().at(0) as FormGroup).controls[
          'clinicalObservationsProvided'
        ].disabled,
      ).toBeTrue();
      expect(findings().at(0).value.conceptID).toBe('S1');
      expect(component.enableIsHistory).toBeTrue();
      expect(component.generalFindingsForm.value.otherSymptoms).toBe('none');
    });

    it('ignores case record responses without findings', async () => {
      await setup({ referredVisitCode: null });
      component.caseRecordMode = 'view';
      component.ngOnInit();
      nurseMaster$.next({ chiefComplaintMaster: complaintsMaster() });
      caseRecord$.next({ statusCode: 200, data: {} });
      expect(component.complaintList).toEqual([]);
    });

    it('fetches MMU findings for specialist flag 3', async () => {
      await setup({
        referredVisitCode: 'RVC',
        specialist_flag: '3',
        visitCode: 'VC',
      });
      doctor.getMMUCaseRecordAndReferDetails.and.returnValue(
        of({ statusCode: 200, data: { findings: findingsData() } }),
      );
      component.caseRecordMode = 'view';
      component.ngOnInit();
      nurseMaster$.next({ chiefComplaintMaster: complaintsMaster() });
      expect(doctor.getMMUCaseRecordAndReferDetails).toHaveBeenCalledWith(
        'BR',
        'V1',
        'General OPD',
        'VC',
      );
      expect(component.complaintList.length).toBe(1);
      expect(component.generalFindingsForm.value.otherSymptoms).toBe('none');
      // Production bug: findingSubscription holds the Observable, so ngOnDestroy throws.
      expect(() => component.ngOnDestroy()).toThrowError(TypeError);
      component.findingSubscription = undefined as any;
    });

    it('fetches MMU findings for referred visit otherwise', async () => {
      await setup({ referredVisitCode: 'RVC', referredVisitID: 'RVID' });
      doctor.getMMUCaseRecordAndReferDetails.and.returnValue(
        of({ statusCode: 500 }),
      );
      component.caseRecordMode = 'view';
      component.ngOnInit();
      nurseMaster$.next({ chiefComplaintMaster: complaintsMaster() });
      expect(doctor.getMMUCaseRecordAndReferDetails).toHaveBeenCalledWith(
        'BR',
        'RVID',
        'General OPD',
        'RVC',
      );
      expect(component.complaintList).toEqual([]);
      component.findingSubscription = undefined as any;
    });

    it('getMMUFindingDetails tolerates a missing observable', async () => {
      await setup();
      doctor.getMMUCaseRecordAndReferDetails.and.returnValue(undefined);
      expect(() =>
        component.getMMUFindingDetails('a', 'b', 'c', 'd'),
      ).not.toThrow();
    });
  });

  describe('complaint editing', () => {
    beforeEach(async () => {
      await setup();
      component.ngOnInit();
      nurseMaster$.next({ chiefComplaintMaster: complaintsMaster() });
    });

    it('getSCTid loads the concept id into the complaint row', () => {
      master.getSnomedCTRecord.and.returnValue(
        of({ statusCode: 200, data: { conceptID: 'SCT1' } }),
      );
      component.getSCTid({ chiefComplaint: 'Cough' }, 0);
      expect(master.getSnomedCTRecord).toHaveBeenCalledWith('Cough');
      expect(complaints().at(0).value.conceptID).toBe('SCT1');
    });

    it('getSCTid ignores failures', () => {
      master.getSnomedCTRecord.and.returnValue(of({ statusCode: 500 }));
      component.getSCTid({ chiefComplaint: 'Cough' }, 0);
      master.getSnomedCTRecord.and.returnValue(throwingObs());
      component.getSCTid({ chiefComplaint: 'Cough' }, 0);
      expect(complaints().at(0).value.conceptID).toBeNull();
    });

    it('addChiefComplaint adds a row and a temp list of unused complaints', () => {
      const fever = component.chiefComplaintMaster[2];
      complaints().at(0).patchValue({ chiefComplaint: fever });
      component.addChiefComplaint();
      expect(complaints().length).toBe(2);
      expect(component.chiefComplaintTemporarayList.length).toBe(2);
      expect(
        component.chiefComplaintTemporarayList[1].map(
          (c: any) => c.chiefComplaint,
        ),
      ).toEqual(['Abdominal pain', 'Cough']);
      expect(nurse.setNCDTemp).toHaveBeenCalledWith(true);
      expect(nurse.setEnableLAssessment).toHaveBeenCalledWith(true);
      expect(nurse.setNCDScreeningProvision).toHaveBeenCalledWith(true);
    });

    it('filterComplaints selects complaint and removes it from other lists', () => {
      const cough = component.chiefComplaintMaster[1];
      complaints().at(0).patchValue({ chiefComplaint: cough });
      component.addChiefComplaint();
      component.chiefComplaintTemporarayList[1] =
        component.chiefComplaintMaster.slice();
      component.filterComplaints(cough, 0);
      expect(component.selectedChiefComplaintList[0]).toBe(cough);
      expect(component.chiefComplaintTemporarayList[1]).not.toContain(cough);

      // re-selecting a different complaint puts the previous one back in the other lists
      const pain = component.chiefComplaintMaster[0];
      component.filterComplaints(pain, 0);
      expect(component.chiefComplaintTemporarayList[1]).toContain(cough);
      expect(component.selectedChiefComplaintList[0]).toBe(pain);
    });

    it('suggestChiefComplaintList filters by string and object and resets when empty', () => {
      const row = complaints().at(0);
      row.patchValue({ chiefComplaint: 'cou' });
      component.suggestChiefComplaintList(row, 0);
      expect(component.suggestedChiefComplaintList[0].length).toBe(1);

      row.patchValue({ chiefComplaint: { chiefComplaint: 'Fever' } });
      component.suggestChiefComplaintList(row, 0);
      expect(component.suggestedChiefComplaintList[0][0].chiefComplaint).toBe(
        'Fever',
      );

      row.patchValue({ chiefComplaint: 'zzz', duration: 3 });
      component.suggestChiefComplaintList(row, 0);
      expect(row.value.chiefComplaint).toBeNull();
      expect(row.value.duration).toBeNull();
    });

    it('removeChiefComplaint resets the only row after confirm', () => {
      const cough = component.chiefComplaintMaster[1];
      component.chiefComplaintMaster.splice(1, 1);
      component.chiefComplaintTemporarayList.push([]);
      complaints().at(0).patchValue({ chiefComplaint: cough, duration: 2 });
      component.selectedChiefComplaintList[0] = cough;
      component.suggestedChiefComplaintList[0] = [cough];
      component.chiefComplaintMaster.push(cough);
      component.removeChiefComplaint(0, complaints().at(0));
      expect(confirm.confirm).toHaveBeenCalledWith(
        'warn',
        LANGUAGE_EN.alerts.info.warn,
      );
      expect(complaints().length).toBe(1);
      expect(complaints().at(0).value.chiefComplaint).toBeNull();
      expect(component.selectedChiefComplaintList[0]).toBeNull();
      expect(component.suggestedChiefComplaintList[0]).toBeNull();
      expect(component.chiefComplaintTemporarayList[1]).toContain(cough);
      // reset() of the only row re-computes parent pristine state, undoing markAsDirty()
      expect(component.generalFindingsForm.dirty).toBeFalse();
    });

    it('removeChiefComplaint removes a row when several exist', () => {
      complaints()
        .at(0)
        .patchValue({ chiefComplaint: component.chiefComplaintMaster[0] });
      component.addChiefComplaint();
      component.removeChiefComplaint(1, complaints().at(1));
      expect(complaints().length).toBe(1);
    });

    it('addChiefComplaint throws while an existing row is still empty (current behaviour)', () => {
      // Production bug: value.chiefComplaint is null for an untouched row.
      expect(() => component.addChiefComplaint()).toThrowError(TypeError);
      expect(complaints().length).toBe(1);
    });

    it('removeChiefComplaint does nothing when declined', () => {
      complaints()
        .at(0)
        .patchValue({ chiefComplaint: component.chiefComplaintMaster[0] });
      component.addChiefComplaint();
      confirm.confirm.and.returnValue(of(false));
      component.removeChiefComplaint(1, complaints().at(1));
      expect(complaints().length).toBe(2);
    });

    it('setTempvalidation flags respiratory keywords and plain complaints', () => {
      complaints()
        .at(0)
        .patchValue({
          chiefComplaint: { chiefComplaint: 'Breathing problems' },
        });
      component.setTempvalidation();
      expect(nurse.setNCDTemp).toHaveBeenCalledWith(true);

      nurse.setNCDTemp.calls.reset();
      complaints()
        .at(0)
        .patchValue({
          chiefComplaint: { chiefComplaint: 'Abdominal pain' },
        });
      component.setTempvalidation();
      expect(nurse.setNCDTemp).toHaveBeenCalledWith(false);
      expect(nurse.setEnableLAssessment).toHaveBeenCalledWith(false);
      expect(nurse.setNCDScreeningProvision).toHaveBeenCalledWith(true);

      complaints().at(0).patchValue({ chiefComplaint: null });
      component.setTempvalidation();
      expect(nurse.setNCDScreeningProvision).toHaveBeenCalledWith(false);
    });

    it('validateDuration alerts and clears when duration exceeds age', () => {
      const row = complaints().at(0);
      row.patchValue({ duration: 40, unitOfDuration: 'Years' });
      component.validateDuration(row);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.DurationAge,
      );
      expect(row.value.duration).toBeNull();
      expect(row.value.unitOfDuration).toBeNull();
    });

    it('validateDuration accepts a valid or incomplete duration', () => {
      const row = complaints().at(0);
      row.patchValue({ duration: 2, unitOfDuration: 'Days' });
      component.validateDuration(row);
      row.patchValue({ duration: null, unitOfDuration: null });
      component.validateDuration(row);
      expect(confirm.alert).not.toHaveBeenCalled();
    });

    it('display helpers and validity checks', () => {
      expect(component.displayChiefComplaint({ chiefComplaint: 'A' })).toBe(
        'A',
      );
      expect(component.displayChiefComplaint(null)).toBeNull();
      expect(
        component.checkComplaintFormValidity({
          value: { chiefComplaint: 'a', duration: 1, unitOfDuration: 'Days' },
        }),
      ).toBeFalse();
      expect(
        component.checkComplaintFormValidity({
          value: { chiefComplaint: 'a' },
        }),
      ).toBeTrue();
      expect(
        component.validateAddedObservations({
          value: { term: 't', conceptID: 'c' },
        }),
      ).toBeFalse();
      expect(
        component.validateAddedObservations({ value: { term: 't' } }),
      ).toBeTrue();
      expect(
        component.validateAddedFindings({
          value: { term: 't', conceptID: 'c' },
        }),
      ).toBeFalse();
      expect(component.validateAddedFindings({ value: {} })).toBeTrue();
      expect(component.displayObservation('x')).toBe('x');
      expect(component.displayObservation({ term: 'y' })).toBe('y');
      expect(component.displayObservation(null)).toBe('');
      expect(component.displayFindings('x')).toBe('x');
      expect(component.displayFindings({ term: 'y' })).toBe('y');
      expect(component.displayFindings(undefined)).toBe('');
    });

    it('sortChiefComplaintList sorts alphabetically', () => {
      const list = [
        { chiefComplaint: 'b' },
        { chiefComplaint: 'a' },
        { chiefComplaint: 'b' },
      ];
      component.sortChiefComplaintList(list);
      expect(list.map((l) => l.chiefComplaint)).toEqual(['a', 'b', 'b']);
    });
  });

  describe('observations and findings', () => {
    beforeEach(async () => {
      await setup();
      component.ngOnInit();
    });

    it('addObservations adds up to five rows then alerts', () => {
      for (let i = 0; i < 4; i++) component.addObservations();
      expect(observations().length).toBe(5);
      component.addObservations();
      expect(observations().length).toBe(5);
      expect(confirm.alert).toHaveBeenCalledWith(LANGUAGE_EN.maxObservations);
    });

    it('addFindings adds up to five rows then alerts', () => {
      for (let i = 0; i < 5; i++) component.addFindings();
      expect(findings().length).toBe(5);
      expect(confirm.alert).toHaveBeenCalledWith(LANGUAGE_EN.maxObservations);
    });

    it('removeObservationsFromList confirms for valid rows', () => {
      component.addObservations();
      component.removeObservationsFromList(1, observations().at(1));
      expect(confirm.confirm).toHaveBeenCalled();
      expect(observations().length).toBe(1);
      observations().at(0).patchValue({ term: 'a' });
      component.removeObservationsFromList(0, observations().at(0));
      expect(observations().at(0).value.term).toBeNull();
      expect(component.generalFindingsForm.dirty).toBeTrue();
    });

    it('removeObservationsFromList skips when declined', () => {
      confirm.confirm.and.returnValue(of(false));
      component.addObservations();
      component.removeObservationsFromList(1, observations().at(1));
      expect(observations().length).toBe(2);
    });

    it('removeObservationsFromList removes invalid rows without confirm', () => {
      component.addObservations();
      observations().at(1).setErrors({ bad: true });
      component.removeObservationsFromList(1, observations().at(1));
      expect(observations().length).toBe(1);
      observations().at(0).patchValue({ term: 'z' });
      observations().at(0).setErrors({ bad: true });
      component.removeObservationsFromList(0, observations().at(0));
      expect(observations().at(0).value.term).toBeNull();
      expect(confirm.confirm).not.toHaveBeenCalled();
    });

    it('removeFindingsFromList confirms valid rows and resets history flag', () => {
      component.addFindings();
      findings().at(0).patchValue({ significantFindingsProvided: 'X' });
      component.removeFindingsFromList(1, findings().at(1));
      expect(findings().length).toBe(1);
      expect(component.enableIsHistory).toBeTrue();
      component.generalFindingsForm.patchValue({ isForHistory: true });
      component.removeFindingsFromList(0, findings().at(0));
      expect(findings().at(0).value.significantFindingsProvided).toBeNull();
      expect(component.enableIsHistory).toBeFalse();
      expect(component.generalFindingsForm.value.isForHistory).toBeNull();
    });

    it('removeFindingsFromList skips when declined', () => {
      confirm.confirm.and.returnValue(of(false));
      component.addFindings();
      component.removeFindingsFromList(1, findings().at(1));
      expect(findings().length).toBe(2);
    });

    it('removeFindingsFromList removes invalid rows directly', () => {
      component.addFindings();
      findings().at(1).setErrors({ bad: true });
      component.removeFindingsFromList(1, findings().at(1));
      expect(findings().length).toBe(1);
      findings().at(0).patchValue({ term: 'q' });
      findings().at(0).setErrors({ bad: true });
      component.removeFindingsFromList(0, findings().at(0));
      expect(findings().at(0).value.term).toBeNull();
      expect(confirm.confirm).not.toHaveBeenCalled();
    });

    it('patchCaptured* skip placeholder values', () => {
      component.patchCapturedClinicalObservations([
        { term: 'null', conceptID: 'null' },
      ]);
      component.patchCapturedSignificantFindings([{ term: '', conceptID: '' }]);
      component.patchCapturedClinicalObservations(undefined);
      component.patchCapturedSignificantFindings(undefined);
      expect(observations().at(0).value.term).toBeNull();
      expect(findings().at(0).value.term).toBeNull();
    });

    it('onObservationInputKeyup searches for 3+ chars and keeps latest result', () => {
      master.searchDiagnosisBasedOnPageNo.and.returnValue(
        of({ data: { sctMaster: [{ term: 'Pallor' }] } }),
      );
      observations().at(0).patchValue({ term: 'old', conceptID: 'c' });
      component.onObservationInputKeyup(' pal ', 0);
      expect(master.searchDiagnosisBasedOnPageNo).toHaveBeenCalledWith(
        'pal',
        0,
      );
      expect(component.suggestedObservationsList[0]).toEqual([
        { term: 'Pallor' },
      ]);
      expect(observations().at(0).value.term).toBeNull();

      master.searchDiagnosisBasedOnPageNo.and.returnValue(of({}));
      component.onObservationInputKeyup('pallo', 0);
      expect(component.suggestedObservationsList[0]).toEqual([]);

      component.onObservationInputKeyup('pa', 0);
      expect(component.suggestedObservationsList[0]).toEqual([]);
      component.onObservationInputKeyup(null as any, 0);
      expect(component.suggestedObservationsList[0]).toEqual([]);
    });

    it('onObservationInputKeyup ignores stale results and logs errors', () => {
      master.searchDiagnosisBasedOnPageNo.and.returnValue(throwingObs());
      component.onObservationInputKeyup('abc', 0);
      expect(console.error).toHaveBeenCalledWith(
        'Error fetching observation data',
      );
      master.searchDiagnosisBasedOnPageNo.and.callFake(() => {
        component['latestObservationQuery'].set(0, 'newer');
        return of({ data: { sctMaster: [1] } });
      });
      component.onObservationInputKeyup('abcd', 0);
      expect(component.suggestedObservationsList[0]).toBeUndefined();
    });

    it('onObservationSelected patches the row', () => {
      component.onObservationSelected({ term: 'T', conceptID: 'C' }, 0);
      expect(observations().at(0).value).toEqual({
        conceptID: 'C',
        term: 'T',
        clinicalObservationsProvided: 'T',
      });
      component.onObservationSelected(null, 0);
      expect(observations().at(0).value.term).toBeNull();
    });

    it('onFindingsInputKeyup searches and handles errors/stale/short input', () => {
      master.searchDiagnosisBasedOnPageNo.and.returnValue(
        of({ data: { sctMaster: [{ term: 'Rales' }] } }),
      );
      component.onFindingsInputKeyup('ral', 0);
      expect(component.suggestedFindingsSearchList[0]).toEqual([
        { term: 'Rales' },
      ]);
      master.searchDiagnosisBasedOnPageNo.and.returnValue(of(null));
      component.onFindingsInputKeyup('rale', 0);
      expect(component.suggestedFindingsSearchList[0]).toEqual([]);
      master.searchDiagnosisBasedOnPageNo.and.returnValue(throwingObs());
      component.onFindingsInputKeyup('rales', 0);
      expect(console.error).toHaveBeenCalledWith(
        'Error fetching findings data',
      );
      master.searchDiagnosisBasedOnPageNo.and.callFake(() => {
        component['latestFindingsQuery'].set(0, 'other');
        return of({ data: { sctMaster: [9] } });
      });
      component.suggestedFindingsSearchList[0] = ['keep'];
      component.onFindingsInputKeyup('ralesx', 0);
      expect(component.suggestedFindingsSearchList[0]).toEqual(['keep']);
      component.onFindingsInputKeyup('', 0);
      expect(component.suggestedFindingsSearchList[0]).toEqual([]);
      component.onFindingsInputKeyup(undefined as any, 0);
      expect(component.suggestedFindingsSearchList[0]).toEqual([]);
    });

    it('onFindingsSelected patches the row and enables history', () => {
      component.onFindingsSelected({ term: 'T', conceptID: 'C' }, 0);
      expect(findings().at(0).value).toEqual({
        conceptID: 'C',
        term: 'T',
        significantFindingsProvided: 'T',
      });
      expect(component.enableIsHistory).toBeTrue();
      component.onFindingsSelected(undefined, 0);
      expect(component.enableIsHistory).toBeFalse();
    });
  });
});
