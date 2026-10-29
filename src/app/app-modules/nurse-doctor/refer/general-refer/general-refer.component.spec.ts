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
import { GeneralReferComponent } from './general-refer.component';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../shared/services';
import { IdrsscoreService } from '../../shared/services/idrsscore.service';
import { NcdScreeningService } from '../../shared/services/ncd-screening.service';
import { ConfirmationService } from 'src/app/app-modules/core/services/confirmation.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { AmritTrackingService } from 'Common-UI/src/tracking';
import { PreviousDetailsComponent } from 'src/app/app-modules/core/components/previous-details/previous-details.component';

describe('GeneralReferComponent', () => {
  let component: GeneralReferComponent;
  let fixture: ComponentFixture<GeneralReferComponent>;
  let master$: BehaviorSubject<any>;
  let caseRecord$: BehaviorSubject<any>;
  let idrsFlag$: BehaviorSubject<any>;
  let referralFlag$: BehaviorSubject<any>;
  let enablingIdrs$: BehaviorSubject<any>;
  let doctorService: any;
  let nurseService: any;
  let idrs: any;
  let confirm: any;
  let dialog: any;
  let session: any;
  let tracking: any;
  const R = LANGUAGE_EN.Referdetails;

  // Fresh list per use: the component pushes into the master list while filtering.
  const makeReasons = () =>
    [
      'Screening positive for Diabetes',
      'Screening positive for Epilepsy',
      'Screening positive for Asthma',
      'Screening positive for Vision screening',
      'Screening positive for Tuberculosis screening',
      'Screening positive for Malaria screening',
      'Screening positive for Hypertension',
      'Screening positive for Oral cancer',
      'Screening positive for Cervical cancer',
      'Screening positive for Breast cancer',
      'Something else',
    ].map((name, i) => ({ id: i, name }));
  const reasons = makeReasons();
  const namesOf = (l: any[]) => l.map((x) => x.name);

  const makeForm = () =>
    new FormGroup({
      referredToInstituteID: new FormControl(null),
      referredToInstituteName: new FormControl(null),
      otherReferredToInstituteName: new FormControl(null),
      referralReason: new FormControl(null),
      referralReasonList: new FormControl(null),
      otherReferralReason: new FormControl(null),
      refrredToAdditionalServiceList: new FormControl(null),
      revisitDate: new FormControl(null),
    });

  const create = async (session0: Record<string, any>) => {
    master$ = new BehaviorSubject<any>(null);
    caseRecord$ = new BehaviorSubject<any>(null);
    idrsFlag$ = new BehaviorSubject<any>(0);
    referralFlag$ = new BehaviorSubject<any>(0);
    enablingIdrs$ = new BehaviorSubject<any>(true);
    TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [GeneralReferComponent],
      providers: [
        ...commonTestProviders({ session: session0 }),
        {
          provide: DoctorService,
          useValue: autoSpy(DoctorService, {
            populateCaserecordResponse$: caseRecord$,
          }),
        },
        {
          provide: MasterdataService,
          useValue: autoSpy(MasterdataService, { doctorMasterData$: master$ }),
        },
        { provide: NurseService, useValue: autoSpy(NurseService) },
        {
          provide: IdrsscoreService,
          useValue: autoSpy(
            IdrsscoreService,
            {
              IDRSSuspectedFlag$: idrsFlag$,
              referralSuggestedFlag$: referralFlag$,
            },
            undefined,
          ),
        },
        {
          provide: NcdScreeningService,
          useValue: autoSpy(NcdScreeningService, { enablingIdrs$ }),
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    // Template binds formControlName to Material selects/datepicker, which
    // have no value accessor under NO_ERRORS_SCHEMA; test class logic only.
    TestBed.overrideTemplate(GeneralReferComponent, '');
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(GeneralReferComponent);
    component = fixture.componentInstance;
    component.referForm = makeForm();
    doctorService = TestBed.inject(DoctorService);
    nurseService = TestBed.inject(NurseService);
    idrs = TestBed.inject(IdrsscoreService);
    confirm = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    session = TestBed.inject(SessionStorageService);
    tracking = TestBed.inject(AmritTrackingService);
  };

  afterEach(() => {
    sessionStorage.removeItem('suspectFlag');
    sessionStorage.removeItem('instFlag');
  });

  describe('init (General OPD)', () => {
    beforeEach(async () => {
      await create({
        visitCategory: 'General OPD',
        designation: 'Doctor',
        beneficiaryRegID: '101',
        visitID: '201',
      });
    });

    it('initialises dates, flags and IDRS subscriptions', () => {
      fixture.detectChanges();
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

    it('sets suspectFlag true when IDRS or referral flag is positive', () => {
      fixture.detectChanges();
      idrsFlag$.next(2);
      expect(component.showMsg).toBe(2);
      expect(sessionStorage.getItem('suspectFlag')).toBe('true');
      referralFlag$.next(0);
      expect(sessionStorage.getItem('suspectFlag')).toBe('false');
      referralFlag$.next(1);
      expect(sessionStorage.getItem('suspectFlag')).toBe('true');
    });

    it('loads master data with institutes', () => {
      fixture.detectChanges();
      master$.next({
        higherHealthCare: [{ institutionID: 1 }],
        additionalServices: ['s'],
        revisitDate: ['d'],
        referralReasonList: reasons,
      });
      expect(component.instituteFlag).toBeTrue();
      expect(sessionStorage.getItem('instFlag')).toBe('true');
      expect(component.additionalServices).toEqual(['s']);
      expect(component.revisitDate).toEqual(['d']);
      expect(component.fpReferral).toBe(reasons);
    });

    it('flags no institutes when list is empty', () => {
      fixture.detectChanges();
      master$.next({ higherHealthCare: [], referralReasonList: [] });
      expect(component.instituteFlag).toBeFalse();
      expect(sessionStorage.getItem('instFlag')).toBe('false');
    });

    it('unsubscribes on destroy', () => {
      component.referMode = 'view';
      fixture.detectChanges();
      master$.next({ higherHealthCare: [], referralReasonList: [] });
      fixture.destroy();
      expect(master$.observers.length).toBe(0);
      expect(caseRecord$.observers.length).toBe(0);
    });

    it('ngOnDestroy tolerates missing subscriptions', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('referredVisitCode present', () => {
    beforeEach(async () => {
      await create({ visitCategory: 'General OPD', referredVisitCode: 'RV1' });
    });
    it('stores the referred visit code', () => {
      fixture.detectChanges();
      expect(component.referredVisitcode).toBe('RV1');
    });
  });

  describe('NCD screening referral reasons', () => {
    it('IDRS enabled: keeps IDRS-related reasons', async () => {
      await create({ visitCategory: 'NCD screening' });
      fixture.detectChanges();
      const list = makeReasons();
      master$.next({ higherHealthCare: [], referralReasonList: list });
      expect(component.enableCBACForm).toBeFalse();
      // Current behaviour: matched items are also pushed onto the master list.
      expect(list.length).toBe(11 + 7);
      expect(namesOf(component.fpReferral)).toEqual(
        reasons.slice(0, 7).map((r) => r.name),
      );
    });

    it('IDRS enabled with no reason list', async () => {
      await create({ visitCategory: 'NCD screening' });
      enablingIdrs$.next(true);
      fixture.detectChanges();
      master$.next({ higherHealthCare: [], referralReasonList: null });
      expect(component.fpReferral).toBeNull();
    });

    it('CBAC for male: keeps hypertension, diabetes, oral cancer', async () => {
      await create({
        visitCategory: 'NCD screening',
        beneficiaryGender: 'Male',
      });
      enablingIdrs$.next(false);
      fixture.detectChanges();
      master$.next({ higherHealthCare: [], referralReasonList: makeReasons() });
      expect(component.enableCBACForm).toBeTrue();
      expect(namesOf(component.fpReferral)).toEqual([
        'Screening positive for Diabetes',
        'Screening positive for Hypertension',
        'Screening positive for Oral cancer',
      ]);
    });

    it('CBAC for male with no reason list', async () => {
      await create({
        visitCategory: 'NCD screening',
        beneficiaryGender: 'Male',
      });
      enablingIdrs$.next(false);
      fixture.detectChanges();
      master$.next({ higherHealthCare: [], referralReasonList: undefined });
      expect(component.fpReferral).toBeUndefined();
    });

    it('CBAC for female: also keeps cervical and breast cancer', async () => {
      await create({
        visitCategory: 'NCD screening',
        beneficiaryGender: 'Female',
      });
      enablingIdrs$.next(false);
      fixture.detectChanges();
      master$.next({ higherHealthCare: [], referralReasonList: makeReasons() });
      expect(namesOf(component.fpReferral)).toEqual([
        'Screening positive for Diabetes',
        'Screening positive for Hypertension',
        'Screening positive for Oral cancer',
        'Screening positive for Cervical cancer',
        'Screening positive for Breast cancer',
      ]);
    });

    it('CBAC for female with no reason list', async () => {
      await create({
        visitCategory: 'NCD screening',
        beneficiaryGender: 'Female',
      });
      enablingIdrs$.next(false);
      fixture.detectChanges();
      master$.next({ higherHealthCare: [], referralReasonList: null });
      expect(component.fpReferral).toBeNull();
    });
  });

  describe('view mode', () => {
    const institutes = [
      { institutionID: 5, institutionName: 'District Hospital' },
      { institutionID: 6, institutionName: 'Other' },
    ];
    beforeEach(async () => {
      await create({
        visitCategory: 'General OPD',
        beneficiaryRegID: '101',
        visitID: '201',
      });
      component.referMode = 'view';
      fixture.detectChanges();
      master$.next({ higherHealthCare: institutes, referralReasonList: [] });
    });

    it('reads identifiers from session', () => {
      expect(component.beneficiaryRegID).toBe('101');
      expect(component.visitID).toBe('201');
    });

    it('patches the form from the case record', () => {
      caseRecord$.next({
        statusCode: 200,
        data: {
          Refer: {
            referredToInstituteID: 5,
            referralReasonList: ['Other'],
            otherReferralReason: 'custom',
            revisitDate: '2024-07-01',
          },
        },
      });
      expect(component.healthCareReferred).toBeTrue();
      expect(component.selectValue).toBe(1);
      expect(component.enableOthersReferralTextField).toBeTrue();
      expect(component.referForm.value.referredToInstituteName).toEqual(
        institutes[0],
      );
      expect(component.referForm.value.otherReferralReason).toBe('custom');
      expect(component.RevisitDate?.value).toEqual(new Date('2024-07-01'));
    });

    it('patches without institute or reasons', () => {
      caseRecord$.next({
        statusCode: 200,
        data: { Refer: { referralReason: 'r', revisitDate: '2024-07-02' } },
      });
      expect(component.ReferralReason?.value).toBe('r');
      expect(component.healthCareReferred).toBeFalse();
    });

    it('ignores case records without refer data', () => {
      caseRecord$.next({ statusCode: 200, data: {} });
      expect(component.referForm.value.revisitDate).toBeNull();
    });
  });

  describe('helpers', () => {
    beforeEach(async () => {
      await create({
        visitCategory: 'General OPD',
        beneficiaryRegID: '101',
        referredVisitCode: 'RV',
        referredVisitID: 'RID',
      });
      component.currentLanguageSet = LANGUAGE_EN;
      component.visitCategory = 'General OPD';
    });

    it('checkdate stores local ISO date and resets limits', () => {
      const d = new Date(2024, 0, 15, 0, 0, 0);
      component.checkdate(d);
      const expected = new Date(
        d.getTime() - d.getTimezoneOffset() * 60000,
      ).toISOString();
      expect(component.referForm.value.revisitDate).toBe(expected);
      expect(component.tomorrow).toBeDefined();
      expect(component.maxSchedulerDate).toBeDefined();
    });

    it('canDisable marks previously used services', () => {
      expect(component.canDisable({ serviceID: 1 })).toBeUndefined();
      component.previousServiceList = [{ serviceID: 1 }];
      const a: any = { serviceID: 1 };
      const b: any = { serviceID: 2 };
      expect(component.canDisable(a)).toBeTrue();
      expect(a.disabled).toBeTrue();
      expect(component.canDisable(b)).toBeFalse();
      expect(b.disabled).toBeFalse();
    });

    it('additionalservices stores the selection count', () => {
      component.additionalservices(['a', 'b']);
      expect(component.selectValueService).toBe(2);
      component.additionalservices(null);
      expect(component.selectValueService).toBe(2);
    });

    describe('higherhealthcarecenter', () => {
      it('enables other-institute field for "Other"', () => {
        component.higherhealthcarecenter({ institutionName: 'OTHER' });
        expect(component.enableOtherHigherInstitute).toBeTrue();
        expect(component.healthCareReferred).toBeTrue();
      });
      it('clears everything for null', () => {
        component.referForm.patchValue({ otherReferredToInstituteName: 'x' });
        component.healthCareReferred = true;
        component.higherhealthcarecenter(null);
        expect(component.selectValue).toBe(0);
        expect(component.healthCareReferred).toBeFalse();
        expect(
          component.referForm.value.otherReferredToInstituteName,
        ).toBeNull();
      });
      it('clears everything for "select none"', () => {
        component.higherhealthcarecenter('select none');
        expect(component.selectValue).toBe(0);
        expect(component.enableOtherHigherInstitute).toBeFalse();
      });
      it('regular institute disables other field', () => {
        component.referForm.patchValue({ otherReferredToInstituteName: 'x' });
        component.higherhealthcarecenter({ institutionName: 'PHC' });
        expect(component.selectValue).toBe(1);
        expect(component.enableOtherHigherInstitute).toBeFalse();
        expect(
          component.referForm.value.otherReferredToInstituteName,
        ).toBeNull();
      });
      it('object without a name only clears the other field', () => {
        component.higherhealthcarecenter({});
        expect(component.healthCareReferred).toBeFalse();
        expect(component.enableOtherHigherInstitute).toBeFalse();
      });
    });

    it('setInstituteNameValue clears institute controls', () => {
      component.referForm.patchValue({
        referredToInstituteID: 1,
        referredToInstituteName: 'x',
      });
      component.setInstituteNameValue();
      expect(component.referForm.value.referredToInstituteID).toBeNull();
      expect(component.referForm.value.referredToInstituteName).toBeNull();
    });

    describe('getPreviousReferralHistory', () => {
      it('opens dialog when history exists', () => {
        const data = { data: [{ a: 1 }] };
        nurseService.getPreviousReferredHistory.and.returnValue(
          of({ statusCode: 200, data }),
        );
        component.getPreviousReferralHistory();
        expect(nurseService.getPreviousReferredHistory).toHaveBeenCalledWith(
          '101',
          'General OPD',
        );
        expect(dialog.open).toHaveBeenCalledWith(PreviousDetailsComponent, {
          data: {
            dataList: data,
            title: LANGUAGE_EN.previousReferralHistoryDetails,
          },
        });
      });
      it('alerts when history is empty', () => {
        nurseService.getPreviousReferredHistory.and.returnValue(
          of({ statusCode: 200, data: { data: [] } }),
        );
        component.getPreviousReferralHistory();
        expect(confirm.alert).toHaveBeenCalledWith(
          R.previousReferralhistorynotAvailable,
        );
      });
      it('alerts on non-200', () => {
        nurseService.getPreviousReferredHistory.and.returnValue(
          of({ statusCode: 5000, data: null }),
        );
        component.getPreviousReferralHistory();
        expect(confirm.alert).toHaveBeenCalledWith(
          R.errorInFetchingPreviousHistory,
          'error',
        );
      });
      it('alerts on error', () => {
        nurseService.getPreviousReferredHistory.and.returnValue(throwingObs());
        component.getPreviousReferralHistory();
        expect(confirm.alert).toHaveBeenCalledWith(
          R.errorInFetchingPreviousHistory,
          'error',
        );
      });
    });

    describe('loadMMUReferDeatils', () => {
      it('requests MMU data and opens dialog', () => {
        const data = { data: { refrredToAdditionalServiceList: [1] } };
        doctorService.getMMUData.and.returnValue(of({ statusCode: 200, data }));
        component.loadMMUReferDeatils();
        expect(doctorService.getMMUData).toHaveBeenCalledWith({
          benRegID: '101',
          visitCode: 'RV',
          benVisitID: 'RID',
          fetchMMUDataFor: 'Referral',
        });
        expect(dialog.open).toHaveBeenCalledWith(PreviousDetailsComponent, {
          data: { dataList: data, title: R.mMUReferralDetails },
        });
      });
      it('alerts when no MMU referral', () => {
        doctorService.getMMUData.and.returnValue(
          of({
            statusCode: 200,
            data: { data: { refrredToAdditionalServiceList: [] } },
          }),
        );
        component.loadMMUReferDeatils();
        expect(confirm.alert).toHaveBeenCalledWith(
          R.mMUReferraldetailsnotAvailable,
        );
      });
      it('alerts on non-200', () => {
        doctorService.getMMUData.and.returnValue(
          of({ statusCode: 5000, data: null }),
        );
        component.loadMMUReferDeatils();
        expect(confirm.alert).toHaveBeenCalledWith(
          R.errorInFetchingMMUReferraldetails,
          'error',
        );
      });
      it('alerts on error', () => {
        doctorService.getMMUData.and.returnValue(throwingObs());
        component.loadMMUReferDeatils();
        expect(confirm.alert).toHaveBeenCalledWith(
          R.errorInFetchingMMUReferraldetails,
          'error',
        );
      });
      it('sends nulls for empty identifiers', () => {
        session.store.set('beneficiaryRegID', '');
        session.store.set('referredVisitCode', '');
        session.store.set('referredVisitID', '');
        doctorService.getMMUData.and.returnValue(
          of({ statusCode: 5000, data: null }),
        );
        component.loadMMUReferDeatils();
        expect(doctorService.getMMUData).toHaveBeenCalledWith({
          benRegID: null,
          visitCode: null,
          benVisitID: null,
          fetchMMUDataFor: 'Referral',
        });
      });
      it('skips when referred visit is the "undefined" string', () => {
        session.store.set('referredVisitCode', 'undefined');
        component.loadMMUReferDeatils();
        expect(doctorService.getMMUData).not.toHaveBeenCalled();
      });
    });

    describe('checkForOthersOption', () => {
      it('enables text field when Other chosen', () => {
        component.checkForOthersOption(['Other']);
        expect(component.enableOthersReferralTextField).toBeTrue();
      });
      it('clears text when Other not chosen', () => {
        component.referForm.patchValue({ otherReferralReason: 'x' });
        component.checkForOthersOption(['A']);
        expect(component.enableOthersReferralTextField).toBeFalse();
        expect(component.referForm.value.otherReferralReason).toBeNull();
      });
      it('clears text when nothing chosen', () => {
        component.enableOthersReferralTextField = true;
        component.referForm.patchValue({ otherReferralReason: 'x' });
        component.checkForOthersOption([]);
        expect(component.enableOthersReferralTextField).toBeFalse();
        expect(component.referForm.value.otherReferralReason).toBeNull();
      });
    });

    it('trackFieldInteraction forwards to tracking service', () => {
      component.trackFieldInteraction('Revisit Date');
      expect(tracking.trackFieldInteraction).toHaveBeenCalledWith(
        'Revisit Date',
        'Refer & Revisit',
      );
    });

    it('ngDoCheck refreshes language', () => {
      component.currentLanguageSet = null;
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    });
  });
});
