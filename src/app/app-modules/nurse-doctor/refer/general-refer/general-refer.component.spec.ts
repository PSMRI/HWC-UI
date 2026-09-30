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
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, of } from 'rxjs';

import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';
import { ConfirmationService } from 'src/app/app-modules/core/services/confirmation.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { AmritTrackingService } from 'Common-UI/src/tracking';
import { PreviousDetailsComponent } from 'src/app/app-modules/core/components/previous-details/previous-details.component';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../shared/services';
import { IdrsscoreService } from '../../shared/services/idrsscore.service';
import { NcdScreeningService } from '../../shared/services/ncd-screening.service';
import { GeneralReferComponent } from './general-refer.component';

const ALL_REASONS = [
  'Screening positive for diabetes',
  'Screening positive for epilepsy',
  'Screening positive for asthma',
  'Screening positive for vision screening',
  'Screening positive for tuberculosis screening',
  'Screening positive for malaria screening',
  'Screening positive for hypertension',
  'Screening positive for oral cancer',
  'Screening positive for cervical cancer',
  'Screening positive for breast cancer',
  'Something unrelated',
].map((name) => ({ name }));

describe('GeneralReferComponent', () => {
  let component: GeneralReferComponent;
  let fixture: ComponentFixture<GeneralReferComponent>;
  let masterData$: BehaviorSubject<any>;
  let caseRecord$: BehaviorSubject<any>;
  let suspected$: BehaviorSubject<any>;
  let referralSuggested$: BehaviorSubject<any>;
  let enablingIdrs$: BehaviorSubject<any>;
  let doctorService: any;
  let nurseService: any;
  let idrs: any;
  let confirm: any;
  let dialog: any;
  let session: any;
  let tracking: any;
  let savedSuspect: string | null;
  let savedInst: string | null;

  function buildForm() {
    return new FormGroup({
      referredToInstituteID: new FormControl(null),
      referredToInstituteName: new FormControl(null),
      otherReferredToInstituteName: new FormControl(null),
      refrredToAdditionalServiceList: new FormControl(null),
      revisitDate: new FormControl(null),
      referralReason: new FormControl(null),
      referralReasonList: new FormControl([]),
      otherReferralReason: new FormControl(null),
    });
  }

  async function setup(sessionValues: Record<string, any> = {}) {
    masterData$ = new BehaviorSubject<any>(null);
    caseRecord$ = new BehaviorSubject<any>(null);
    suspected$ = new BehaviorSubject<any>(0);
    referralSuggested$ = new BehaviorSubject<any>(0);
    enablingIdrs$ = new BehaviorSubject<any>(false);
    doctorService = autoSpy(DoctorService, {
      populateCaserecordResponse$: caseRecord$.asObservable(),
    });
    nurseService = autoSpy(NurseService);
    idrs = autoSpy(IdrsscoreService, {
      IDRSSuspectedFlag$: suspected$.asObservable(),
      referralSuggestedFlag$: referralSuggested$.asObservable(),
    });

    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [GeneralReferComponent],
      providers: [
        ...commonTestProviders({
          session: {
            visitCategory: 'General OPD',
            beneficiaryRegID: '11',
            visitID: '22',
            designation: 'Doctor',
            ...sessionValues,
          },
        }),
        { provide: DoctorService, useValue: doctorService },
        { provide: NurseService, useValue: nurseService },
        {
          provide: MasterdataService,
          useValue: { doctorMasterData$: masterData$.asObservable() },
        },
        { provide: IdrsscoreService, useValue: idrs },
        {
          provide: NcdScreeningService,
          useValue: { enablingIdrs$: enablingIdrs$.asObservable() },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(GeneralReferComponent);
    component = fixture.componentInstance;
    component.referForm = buildForm();
    confirm = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    session = TestBed.inject(SessionStorageService);
    tracking = TestBed.inject(AmritTrackingService);
  }

  beforeEach(() => {
    savedSuspect = sessionStorage.getItem('suspectFlag');
    savedInst = sessionStorage.getItem('instFlag');
    spyOn(console, 'log');
  });

  afterEach(() => {
    fixture?.destroy();
    const restore = (k: string, v: string | null) =>
      v === null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v);
    restore('suspectFlag', savedSuspect);
    restore('instFlag', savedInst);
  });

  describe('ngOnInit', () => {
    beforeEach(async () => setup());

    it('initialises language, session values, dates and clears IDRS flags', () => {
      component.ngOnInit();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.visitCategory).toBe('General OPD');
      expect(component.referredVisitcode).toBe('undefined');
      expect(component.designation).toBe('Doctor');
      expect(idrs.clearSuspectedArrayFlag).toHaveBeenCalled();
      expect(idrs.clearReferralSuggested).toHaveBeenCalled();
      expect(component.tomorrow.getTime()).toBeGreaterThan(
        component.today.getTime(),
      );
      expect(component.maxSchedulerDate.getTime()).toBeGreaterThan(
        component.tomorrow.getTime(),
      );
      expect(sessionStorage.getItem('suspectFlag')).toBe('false');
    });

    it('sets suspectFlag true when IDRS suspected or referral suggested', () => {
      component.ngOnInit();
      suspected$.next(2);
      expect(component.showMsg).toBe(2);
      expect(sessionStorage.getItem('suspectFlag')).toBe('true');
      suspected$.next(0);
      expect(sessionStorage.getItem('suspectFlag')).toBe('false');
      referralSuggested$.next(1);
      expect(sessionStorage.getItem('suspectFlag')).toBe('true');
    });

    it('ngOnDestroy unsubscribes master data and refer subscriptions', () => {
      component.referMode = 'view';
      component.ngOnInit();
      masterData$.next({ higherHealthCare: [], referralReasonList: [] });
      const md = component.doctorMasterDataSubscription;
      const rs = component.referSubscription;
      component.ngOnDestroy();
      expect(md.closed).toBeTrue();
      expect(rs.closed).toBeTrue();
    });

    it('ngOnDestroy is safe when nothing subscribed', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  it('uses referredVisitCode from session when present', async () => {
    await setup({ referredVisitCode: 'VC1' });
    component.ngOnInit();
    expect(component.referredVisitcode).toBe('VC1');
  });

  describe('master data', () => {
    beforeEach(async () => setup());

    it('ignores empty master data', () => {
      component.ngOnInit();
      expect(component.higherHealthcareCenter).toBeUndefined();
    });

    it('marks institute flag false when there are no higher health care centres', () => {
      component.ngOnInit();
      masterData$.next({
        higherHealthCare: [],
        additionalServices: [{ serviceID: 1 }],
        revisitDate: ['1 week'],
        referralReasonList: [{ name: 'X' }],
      });
      expect(component.instituteFlag).toBeFalse();
      expect(sessionStorage.getItem('instFlag')).toBe('false');
      expect(component.additionalServices).toEqual([{ serviceID: 1 }]);
      expect(component.revisitDate).toEqual(['1 week']);
      expect(component.fpReferral).toEqual([{ name: 'X' }]);
    });

    it('marks institute flag true when centres exist', () => {
      component.ngOnInit();
      masterData$.next({ higherHealthCare: [{ institutionID: 1 }] });
      expect(component.instituteFlag).toBeTrue();
      expect(sessionStorage.getItem('instFlag')).toBe('true');
    });
  });

  describe('NCD screening referral reasons', () => {
    it('filters to IDRS reasons when IDRS form is enabled', async () => {
      await setup({ visitCategory: 'NCD screening' });
      enablingIdrs$.next(true);
      component.ngOnInit();
      masterData$.next({
        higherHealthCare: [{}],
        referralReasonList: ALL_REASONS.slice(),
      });
      expect(component.enableCBACForm).toBeFalse();
      expect(component.fpReferral.map((r: any) => r.name)).toEqual(
        ALL_REASONS.slice(0, 7).map((r) => r.name),
      );
    });

    it('handles missing reason list when IDRS form is enabled', async () => {
      await setup({ visitCategory: 'NCD screening' });
      enablingIdrs$.next(true);
      component.ngOnInit();
      masterData$.next({ higherHealthCare: [{}], referralReasonList: null });
      expect(component.fpReferral).toBeNull();
    });

    it('filters to male CBAC reasons', async () => {
      await setup({
        visitCategory: 'NCD screening',
        beneficiaryGender: 'Male',
      });
      enablingIdrs$.next(false);
      component.ngOnInit();
      masterData$.next({
        higherHealthCare: [{}],
        referralReasonList: ALL_REASONS.slice(),
      });
      expect(component.enableCBACForm).toBeTrue();
      expect(component.fpReferral.map((r: any) => r.name)).toEqual([
        'Screening positive for diabetes',
        'Screening positive for hypertension',
        'Screening positive for oral cancer',
      ]);
    });

    it('filters to female CBAC reasons', async () => {
      await setup({
        visitCategory: 'NCD screening',
        beneficiaryGender: 'Female',
      });
      component.ngOnInit();
      masterData$.next({
        higherHealthCare: [{}],
        referralReasonList: ALL_REASONS.slice(),
      });
      expect(component.fpReferral.map((r: any) => r.name).sort()).toEqual(
        [
          'Screening positive for diabetes',
          'Screening positive for hypertension',
          'Screening positive for oral cancer',
          'Screening positive for cervical cancer',
          'Screening positive for breast cancer',
        ].sort(),
      );
    });

    it('keeps null reason list for CBAC male and female', async () => {
      await setup({
        visitCategory: 'NCD screening',
        beneficiaryGender: 'Male',
      });
      component.ngOnInit();
      masterData$.next({ higherHealthCare: [{}], referralReasonList: null });
      expect(component.fpReferral).toBeNull();
      session.store.set('beneficiaryGender', 'Female');
      masterData$.next({
        higherHealthCare: [{}],
        referralReasonList: undefined,
      });
      expect(component.fpReferral).toBeUndefined();
    });
  });

  describe('view mode / getReferDetails', () => {
    const centres = [
      { institutionID: 5, institutionName: 'District Hospital' },
      { institutionID: 6, institutionName: 'Other' },
    ];

    beforeEach(async () => {
      await setup();
      component.referMode = 'view';
      component.ngOnInit();
      masterData$.next({ higherHealthCare: centres });
    });

    it('reads beneficiary/visit ids from session and subscribes to case record', () => {
      expect(component.beneficiaryRegID).toBe('11');
      expect(component.visitID).toBe('22');
      expect(component.referSubscription).toBeDefined();
    });

    it('patches the form with refer details and resolves the institute', () => {
      caseRecord$.next({
        statusCode: 200,
        data: {
          Refer: {
            referredToInstituteID: 5,
            referralReasonList: ['Other'],
            otherReferralReason: 'custom',
            revisitDate: '2024-01-05T00:00:00.000Z',
          },
        },
      });
      expect(component.referForm.value.referredToInstituteName).toEqual(
        centres[0],
      );
      expect(component.healthCareReferred).toBeTrue();
      expect(component.selectValue).toBe(1);
      expect(component.enableOthersReferralTextField).toBeTrue();
      expect(component.referForm.value.otherReferralReason).toBe('custom');
      expect(component.referForm.value.referralReasonList).toEqual(['Other']);
      expect(component.referForm.value.revisitDate).toEqual(
        new Date('2024-01-05T00:00:00.000Z'),
      );
    });

    it('enables the other-institute field when the institute is "Other"', () => {
      caseRecord$.next({
        statusCode: 200,
        data: { Refer: { referredToInstituteID: 6, revisitDate: null } },
      });
      expect(component.enableOtherHigherInstitute).toBeTrue();
    });

    it('ignores responses without refer data', () => {
      caseRecord$.next({ statusCode: 500, data: null });
      caseRecord$.next({ statusCode: 200, data: {} });
      expect(component.referForm.value.referredToInstituteName).toBeNull();
    });

    it('skips institute lookup when there is no institute id', () => {
      caseRecord$.next({
        statusCode: 200,
        data: { Refer: { referralReason: 'r', revisitDate: null } },
      });
      expect(component.referForm.value.referralReason).toBe('r');
      expect(component.healthCareReferred).toBeFalse();
    });
  });

  describe('form helpers', () => {
    beforeEach(async () => setup());

    it('exposes revisitDate and referralReason controls', () => {
      expect(component.RevisitDate).toBe(
        component.referForm.get('revisitDate'),
      );
      expect(component.ReferralReason).toBe(
        component.referForm.get('referralReason'),
      );
    });

    it('checkdate stores the local ISO date and recomputes limits', () => {
      const d = new Date(2024, 0, 10, 12, 0, 0);
      component.checkdate(d);
      const expected = new Date(
        d.getTime() - d.getTimezoneOffset() * 60000,
      ).toISOString();
      expect(component.referForm.value.revisitDate).toBe(expected);
      expect(component.tomorrow).toBeDefined();
      expect(component.maxSchedulerDate).toBeDefined();
    });

    it('canDisable returns undefined without previous services', () => {
      expect(component.canDisable({ serviceID: 1 })).toBeUndefined();
    });

    it('canDisable flags services already referred', () => {
      component.previousServiceList = [{ serviceID: 1 }];
      const s1: any = { serviceID: 1 };
      const s2: any = { serviceID: 2 };
      expect(component.canDisable(s1)).toBeTrue();
      expect(s1.disabled).toBeTrue();
      expect(component.canDisable(s2)).toBeFalse();
      expect(s2.disabled).toBeFalse();
    });

    it('additionalservices records selection count', () => {
      component.additionalservices([1, 2]);
      expect(component.selectValueService).toBe(2);
      component.additionalservices(null);
      expect(component.selectValueService).toBe(2);
    });

    it('higherhealthcarecenter handles "Other", normal, null and "select none"', () => {
      component.higherhealthcarecenter({ institutionName: 'Other' });
      expect(component.enableOtherHigherInstitute).toBeTrue();
      expect(component.healthCareReferred).toBeTrue();

      component.referForm.controls['otherReferredToInstituteName'].setValue(
        'x',
      );
      component.higherhealthcarecenter({ institutionName: 'PHC' });
      expect(component.enableOtherHigherInstitute).toBeFalse();
      expect(component.referForm.value.otherReferredToInstituteName).toBeNull();

      component.higherhealthcarecenter(null);
      expect(component.selectValue).toBe(0);
      expect(component.healthCareReferred).toBeFalse();

      component.healthCareReferred = true;
      component.higherhealthcarecenter('select none');
      expect(component.selectValue).toBe(0);
      expect(component.healthCareReferred).toBeFalse();
    });

    it('setInstituteNameValue clears institute controls', () => {
      component.referForm.patchValue({
        referredToInstituteID: 1,
        referredToInstituteName: 'a',
      });
      component.setInstituteNameValue();
      expect(component.referForm.value.referredToInstituteID).toBeNull();
      expect(component.referForm.value.referredToInstituteName).toBeNull();
    });

    it('checkForOthersOption toggles the other reason field', () => {
      component.checkForOthersOption(['Other']);
      expect(component.enableOthersReferralTextField).toBeTrue();
      component.referForm.controls['otherReferralReason'].setValue('x');
      component.checkForOthersOption(['A']);
      expect(component.enableOthersReferralTextField).toBeFalse();
      expect(component.referForm.value.otherReferralReason).toBeNull();
      component.enableOthersReferralTextField = true;
      component.referForm.controls['otherReferralReason'].setValue('y');
      component.checkForOthersOption([]);
      expect(component.enableOthersReferralTextField).toBeFalse();
      expect(component.referForm.value.otherReferralReason).toBeNull();
    });

    it('trackFieldInteraction forwards to tracking service', () => {
      component.trackFieldInteraction('revisitDate');
      expect(tracking.trackFieldInteraction).toHaveBeenCalledWith(
        'revisitDate',
        'Refer & Revisit',
      );
    });

    it('ngDoCheck re-assigns the language set', () => {
      component.currentLanguageSet = null;
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });
  });

  describe('getPreviousReferralHistory', () => {
    beforeEach(async () => {
      await setup();
      component.ngOnInit();
    });

    it('opens the previous details dialog when history exists', () => {
      const data = { data: [{ a: 1 }] };
      nurseService.getPreviousReferredHistory.and.returnValue(
        of({ statusCode: 200, data }),
      );
      component.getPreviousReferralHistory();
      expect(nurseService.getPreviousReferredHistory).toHaveBeenCalledWith(
        '11',
        'General OPD',
      );
      expect(dialog.open).toHaveBeenCalledWith(PreviousDetailsComponent, {
        data: {
          dataList: data,
          title: LANGUAGE_EN.previousReferralHistoryDetails,
        },
      });
    });

    it('alerts when no history is available', () => {
      nurseService.getPreviousReferredHistory.and.returnValue(
        of({ statusCode: 200, data: { data: [] } }),
      );
      component.getPreviousReferralHistory();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.Referdetails.previousReferralhistorynotAvailable,
      );
    });

    it('alerts error on bad status', () => {
      nurseService.getPreviousReferredHistory.and.returnValue(
        of({ statusCode: 500, data: null }),
      );
      component.getPreviousReferralHistory();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.Referdetails.errorInFetchingPreviousHistory,
        'error',
      );
    });

    it('alerts error on failure', () => {
      nurseService.getPreviousReferredHistory.and.returnValue(throwingObs());
      component.getPreviousReferralHistory();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.Referdetails.errorInFetchingPreviousHistory,
        'error',
      );
    });
  });

  describe('loadMMUReferDeatils', () => {
    it('does not call the service when referred visit is undefined', async () => {
      await setup({
        referredVisitCode: 'undefined',
        referredVisitID: 'undefined',
      });
      component.ngOnInit();
      component.loadMMUReferDeatils();
      expect(doctorService.getMMUData).not.toHaveBeenCalled();
    });

    describe('with referred visit', () => {
      beforeEach(async () => {
        await setup({ referredVisitCode: 'VC', referredVisitID: 'VID' });
        component.ngOnInit();
      });

      it('opens MMU refer dialog when services exist', () => {
        const data = { data: { refrredToAdditionalServiceList: [{}] } };
        doctorService.getMMUData.and.returnValue(of({ statusCode: 200, data }));
        component.loadMMUReferDeatils();
        expect(doctorService.getMMUData).toHaveBeenCalledWith({
          benRegID: '11',
          visitCode: 'VC',
          benVisitID: 'VID',
          fetchMMUDataFor: 'Referral',
        });
        expect(dialog.open).toHaveBeenCalledWith(PreviousDetailsComponent, {
          data: {
            dataList: data,
            title: LANGUAGE_EN.Referdetails.mMUReferralDetails,
          },
        });
      });

      it('alerts when MMU refer details are empty', () => {
        doctorService.getMMUData.and.returnValue(
          of({
            statusCode: 200,
            data: { data: { refrredToAdditionalServiceList: [] } },
          }),
        );
        component.loadMMUReferDeatils();
        expect(confirm.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.Referdetails.mMUReferraldetailsnotAvailable,
        );
      });

      it('alerts error on bad status and on failure', () => {
        doctorService.getMMUData.and.returnValue(of({ statusCode: 500 }));
        component.loadMMUReferDeatils();
        doctorService.getMMUData.and.returnValue(throwingObs());
        component.loadMMUReferDeatils();
        expect(confirm.alert).toHaveBeenCalledTimes(2);
        expect(confirm.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.Referdetails.errorInFetchingMMUReferraldetails,
          'error',
        );
      });
    });

    it('sends nulls for empty session ids', async () => {
      await setup({
        beneficiaryRegID: '',
        referredVisitCode: '',
        referredVisitID: '',
      });
      doctorService.getMMUData.and.returnValue(of({ statusCode: 500 }));
      component.ngOnInit();
      component.loadMMUReferDeatils();
      expect(doctorService.getMMUData).toHaveBeenCalledWith({
        benRegID: null,
        visitCode: null,
        benVisitID: null,
        fetchMMUDataFor: 'Referral',
      });
    });
  });
});
