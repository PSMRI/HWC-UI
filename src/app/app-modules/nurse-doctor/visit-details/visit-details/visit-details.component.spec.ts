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
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { PatientVisitDetailsComponent } from './visit-details.component';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../shared/services';
import { NcdScreeningService } from '../../shared/services/ncd-screening.service';
import { VisitDetailUtils } from '../../shared/utility/visit-detail-utility';
import { BeneficiaryDetailsService } from 'src/app/app-modules/core/services/beneficiary-details.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { AmritTrackingService } from 'Common-UI/src/tracking';
import { MaterialModule } from 'src/app/app-modules/core/material.module';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';

const CATS = [
  'General OPD',
  'ANC',
  'PNC',
  'NCD screening',
  'NCD care',
  'COVID-19 Screening',
  'Cancer Screening',
  'Synctest',
  'FP & Contraceptive Services',
  'Neonatal and Infant Health Care Services',
  'Childhood & Adolescent Healthcare Services',
  'General OPD (QC)',
];
const VISIT_MASTER = {
  visitReasons: [{ visitReason: 'Screening' }],
  visitCategories: CATS.map((c, i) => ({
    visitCategoryID: i,
    visitCategory: c,
  })),
};
const SUB_CATS = [
  'Newborn & Infant OPD care',
  'Child & Adolescent OPD care',
  'Reproductive Health OPD care',
  'Elderly OPD Health care',
  'Management of common communicable diseases and outpatient care for acute simple illnesses & minor ailments',
  'Other',
].map((name, id) => ({ id, name }));
const NURSE_MASTER = {
  subVisitCategories: SUB_CATS,
  m_fpmethodfollowup: ['Pills', 'Other'],
  m_FPSideEffects: ['Nausea', 'Other'],
};

const ADULT_F = {
  age: '35 years - 0 months',
  ageVal: 35,
  genderName: 'Female',
};
const SENIOR_F = {
  age: '65 years - 0 months',
  ageVal: 65,
  genderName: 'Female',
};
const CHILD_M = { age: '10 years - 3 months', ageVal: 10, genderName: 'Male' };
const INFANT_F = { age: '0 years - 5 months', ageVal: 0, genderName: 'Female' };

describe('PatientVisitDetailsComponent', () => {
  let component: PatientVisitDetailsComponent;
  let fixture: ComponentFixture<PatientVisitDetailsComponent>;
  let doctor: any;
  let nurse: any;
  let ncd: any;
  let session: any;
  let tracking: any;
  let visitMaster$: BehaviorSubject<any>;
  let nurseMaster$: BehaviorSubject<any>;
  let ben$: BehaviorSubject<any>;
  let routeParams: any;
  let form: FormGroup;

  async function setup(
    opts: {
      session?: Record<string, any>;
      beneficiary?: any;
      mode?: string;
    } = {},
  ) {
    visitMaster$ = new BehaviorSubject<any>(VISIT_MASTER);
    nurseMaster$ = new BehaviorSubject<any>(NURSE_MASTER);
    ben$ = new BehaviorSubject<any>(opts.beneficiary ?? ADULT_F);
    routeParams = { attendant: 'nurse' };
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [PatientVisitDetailsComponent],
      providers: [
        ...commonTestProviders({
          session: {
            serviceLineDetails: JSON.stringify({
              facilityID: 1,
              parkingPlaceID: 2,
            }),
            visitID: 'V1',
            beneficiaryRegID: 'B1',
            visitCode: 'VC1',
            ...(opts.session ?? {}),
          },
        }),
        { provide: DoctorService, useValue: autoSpy(DoctorService) },
        {
          provide: NurseService,
          useValue: autoSpy(NurseService, { mmuVisitData: true }),
        },
        {
          provide: NcdScreeningService,
          useValue: autoSpy(NcdScreeningService),
        },
        {
          provide: MasterdataService,
          useValue: autoSpy(MasterdataService, {
            visitDetailMasterData$: visitMaster$,
            nurseMasterData$: nurseMaster$,
          }),
        },
        {
          provide: BeneficiaryDetailsService,
          useValue: { beneficiaryDetails$: ben$, cbacData: ['c'] },
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: routeParams } },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(PatientVisitDetailsComponent);
    component = fixture.componentInstance;
    component.mode = opts.mode as any;
    session = TestBed.inject(SessionStorageService) as any;
    form = new VisitDetailUtils(
      new FormBuilder(),
      session,
    ).createPatientVisitDetails(false);
    component.patientVisitDetailsForm = form;
    doctor = TestBed.inject(DoctorService) as any;
    nurse = TestBed.inject(NurseService) as any;
    ncd = TestBed.inject(NcdScreeningService) as any;
    tracking = TestBed.inject(AmritTrackingService) as any;
  }

  const names = () =>
    component.templateFilterVisitCategories.map((c: any) => c.visitCategory);

  describe('init (non-view)', () => {
    beforeEach(async () => {
      await setup();
      fixture.detectChanges();
    });

    it('should set defaults, CBAC, language and masters', () => {
      expect(component.attendant).toBe('nurse');
      expect(component.cbacData).toEqual(['c']);
      expect(component.idrsCbac).toEqual(['IDRS', 'CBAC']);
      expect(component.IdrsOrCbac).toBe('CBAC');
      expect(component.enableCbac).toBeTrue();
      expect(component.showHistoryForm).toBeFalse();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.templateVisitReasons).toEqual(VISIT_MASTER.visitReasons);
      expect(names()).not.toContain('Cancer Screening');
      expect(names().length).toBe(CATS.length - 1);
      expect(component.fpMethodList).toEqual(['Pills', 'Other']);
      expect(component.sideEffectsList).toEqual(['Nausea', 'Other']);
      expect(component.beneficiaryAge).toBe(35);
      expect(component.showPregnancyStatus).toBeTrue();
    });

    it('getters expose form values', () => {
      form.patchValue({
        visitReason: 'r',
        visitCategory: 'c',
        pregnancyStatus: 'Yes',
        rCHID: 'R',
        followUpForFpMethod: ['x'],
        otherFollowUpForFpMethod: 'o',
        sideEffects: ['s'],
        otherSideEffects: 'os',
      });
      expect(component.visitReason).toBe('r');
      expect(component.visitCategory).toBe('c');
      expect(component.pregnancyStatus).toBe('Yes');
      expect(component.rCHID).toBe('R');
      expect(component.followUpForFpMethod).toEqual(['x']);
      expect(component.otherFollowUpForFpMethod).toBe('o');
      expect(component.sideEffects).toEqual(['s']);
      expect(component.otherSideEffects).toBe('os');
    });

    it('enableHistoryScreenOnIdrs idrs vs cbac', () => {
      component.enableHistoryScreenOnIdrs('IDRS');
      expect(component.showHistoryForm).toBeTrue();
      expect(component.enableCbac).toBeFalse();
      expect(component.hideVitalsFormForNcdScreening).toBeTrue();
      expect(nurse.diseaseFileUpload).toBeFalse();
      expect(ncd.enableHistoryScreenOnIdrs).toHaveBeenCalledWith(true);
      expect(ncd.checkIfCbac).toHaveBeenCalledWith(false);
      expect(ncd.disableViatlsFormOnCbac).toHaveBeenCalledWith(true);
      expect(ncd.enableDiseaseConfirmationScreen).toHaveBeenCalledWith('idrs');
      component.enableHistoryScreenOnIdrs('cbac');
      expect(component.hideVitalsFormForNcdScreening).toBeFalse();
      expect(ncd.enableDiseaseConfirmationScreen).toHaveBeenCalledWith('cbac');
    });

    it('ngOnChanges in non-view mode only resets mmuVisitData', () => {
      component.ngOnChanges();
      expect(nurse.mmuVisitData).toBeFalse();
      expect(doctor.getVisitComplaintDetails).not.toHaveBeenCalled();
      expect(component.disableVisit).toBeFalse();
    });

    describe('checkCategoryDependent', () => {
      it('ANC forces pregnancy Yes', () => {
        form.patchValue({ rCHID: 'x', subVisitCategory: 'y' });
        component.checkCategoryDependent('ANC');
        expect(session.setItem).toHaveBeenCalledWith('visiCategoryANC', 'ANC');
        expect(component.templatePregnancyStatus).toEqual(['Yes']);
        expect(component.pregnancyStatus).toBe('Yes');
        expect(component.rCHID).toBeNull();
        expect(form.value.subVisitCategory).toBeNull();
      });

      it('NCD screening sets CBAC', () => {
        form.controls['IdrsOrCbac'].setValue('IDRS');
        component.checkCategoryDependent('NCD screening');
        expect(component.IdrsOrCbac).toBe('CBAC');
        expect(component.pregnancyStatus).toBeNull();
        expect(component.templatePregnancyStatus).toEqual([
          'Yes',
          'No',
          "Don't Know",
        ]);
      });

      it('NCD care loads previous confirmed diseases', () => {
        nurse.getPreviousVisitConfirmedDiseases.and.returnValue(
          of({ statusCode: 200, data: { confirmedDiseases: ['Diabetes'] } }),
        );
        component.checkCategoryDependent('NCD care');
        expect(nurse.getPreviousVisitConfirmedDiseases).toHaveBeenCalledWith({
          beneficiaryRegId: 'B1',
        });
        expect(component.previousConfirmedDiseasesList).toEqual(['Diabetes']);
        expect(component.enableConfirmedDiseases).toBeTrue();
      });
    });

    it('loadConfirmedDiseasesFromNCD ignores empty or non-200', () => {
      nurse.getPreviousVisitConfirmedDiseases.and.returnValues(
        of({ statusCode: 200, data: { confirmedDiseases: [] } }),
        of({ statusCode: 5000, data: null }),
      );
      component.loadConfirmedDiseasesFromNCD();
      expect(component.enableConfirmedDiseases).toBeFalse();
      component.loadConfirmedDiseasesFromNCD();
      expect(component.previousConfirmedDiseasesList).toEqual([]);
    });

    describe('checkForOtherFpMethodOption', () => {
      it('Other enables text field, None disables options', () => {
        component.checkForOtherFpMethodOption(['Other', 'None']);
        expect(component.enableOtherFpTextField).toBeTrue();
        expect(component.disableAllFpOptions).toBeTrue();
      });
      it('non-Other clears text', () => {
        form.patchValue({ otherFollowUpForFpMethod: 'x' });
        component.checkForOtherFpMethodOption(['Pills']);
        expect(component.enableOtherFpTextField).toBeFalse();
        expect(component.disableAllFpOptions).toBeFalse();
        expect(component.otherFollowUpForFpMethod).toBeNull();
      });
      it('empty clears everything', () => {
        component.disableAllFpOptions = true;
        form.patchValue({ otherFollowUpForFpMethod: 'x' });
        component.checkForOtherFpMethodOption([]);
        expect(component.disableAllFpOptions).toBeFalse();
        expect(component.otherFollowUpForFpMethod).toBeNull();
      });
    });

    describe('checkForOtherSideEffectsOption', () => {
      it('Other enables text', () => {
        component.checkForOtherSideEffectsOption(['Other']);
        expect(component.enableOtherSideEffectTextField).toBeTrue();
      });
      it('non-Other clears text', () => {
        form.patchValue({ otherSideEffects: 'x' });
        component.checkForOtherSideEffectsOption(['Nausea']);
        expect(component.enableOtherSideEffectTextField).toBeFalse();
        expect(component.otherSideEffects).toBeNull();
      });
      it('null clears text', () => {
        form.patchValue({ otherSideEffects: 'x' });
        component.checkForOtherSideEffectsOption(null);
        expect(component.otherSideEffects).toBeNull();
      });
    });

    it('resetFPAndSideEffects clears FP fields', () => {
      form.patchValue({ followUpForFpMethod: ['a'], sideEffects: ['b'] });
      component.enableOtherFpTextField = true;
      component.resetFPAndSideEffects();
      expect(component.followUpForFpMethod).toBeNull();
      expect(component.sideEffects).toBeNull();
      expect(component.enableOtherFpTextField).toBeFalse();
    });

    it('enableCbacIdrs sets CBAC when disease data present, else IDRS', () => {
      nurse.getCbacDetailsFromNurse.and.returnValues(
        of({ statusCode: 200, data: { diabetes: {} } }),
        of({ statusCode: 200, data: {} }),
      );
      component.enableCbacIdrs('V1', 'B1');
      expect(nurse.getCbacDetailsFromNurse).toHaveBeenCalledWith({
        beneficiaryRegId: 'B1',
        visitCode: 'VC1',
      });
      expect(component.IdrsOrCbac).toBe('CBAC');
      component.enableCbacIdrs('V1', 'B1');
      expect(component.IdrsOrCbac).toBe('IDRS');
      expect(component.showHistoryForm).toBeTrue();
    });

    it('trackFieldInteraction delegates', () => {
      component.trackFieldInteraction('Visit Reason');
      expect(tracking.trackFieldInteraction).toHaveBeenCalledWith(
        'Visit Reason',
        'visit-details',
      );
    });

    it('ngOnDestroy unsubscribes and resets form', () => {
      component.getVisitDetails('V', 'B');
      component.getMMUVisitDetails('V', 'B');
      const spies = [
        spyOn(component.visitCategorySubscription, 'unsubscribe'),
        spyOn(component.visitDetailsSubscription, 'unsubscribe'),
        spyOn(component.visitDetSubscription, 'unsubscribe'),
        spyOn(component.beneficiaryDetailsSubscription, 'unsubscribe'),
      ];
      form.patchValue({ visitReason: 'x' });
      component.ngOnDestroy();
      spies.forEach((s) => expect(s).toHaveBeenCalled());
      expect(component.beneficiaryAge).toBe(0);
      expect(component.visitReason).toBeNull();
    });

    it('ngOnDestroy without subscriptions still resets', () => {
      component.visitCategorySubscription = null;
      component.beneficiaryDetailsSubscription = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
      expect(component.IdrsOrCbac).toBeNull();
    });

    it('ignores null visit master and null nurse master', () => {
      component.templateVisitReasons = undefined;
      visitMaster$.next(null);
      nurseMaster$.next(null);
      nurseMaster$.next({});
      expect(component.templateVisitReasons).toBeUndefined();
    });

    it('getAgeValueNew parses years only', () => {
      expect(component.getAgeValueNew('')).toBe(0);
      expect(component.getAgeValueNew('12 years')).toBe(12);
      expect(component.getAgeValueNew('5 months')).toBe(0);
      expect(component.getAgeValueNew('7')).toBe(0);
    });
  });

  describe('beneficiary-driven flags', () => {
    it('male hides pregnancy status', async () => {
      await setup({ beneficiary: CHILD_M });
      fixture.detectChanges();
      expect(component.showPregnancyStatus).toBeFalse();
      expect(component.beneficiaryAge).toBe(11);
      expect(component.beneficiaryGender).toBe('Male');
    });

    it('young female hides pregnancy status', async () => {
      await setup({
        beneficiary: { age: '9 years', ageVal: 9, genderName: 'Female' },
      });
      fixture.detectChanges();
      expect(component.showPregnancyStatus).toBeFalse();
      // no months part: current code still rounds up by one year
      expect(component.beneficiaryAge).toBe(10);
    });

    it('ignores null beneficiary', async () => {
      await setup({ beneficiary: null });
      ben$.next(null);
      component.getBenificiaryDetails();
      expect(component.beneficiary).toBeUndefined();
    });
  });

  describe('reasonSelected', () => {
    const table: { ben: any; reason: string; expected: string[] }[] = [
      {
        ben: ADULT_F,
        reason: 'Screening',
        expected: ['NCD screening', 'COVID-19 Screening'],
      },
      { ben: CHILD_M, reason: 'Screening', expected: ['COVID-19 Screening'] },
      { ben: ADULT_F, reason: 'Pandemic', expected: ['COVID-19 Screening'] },
      {
        ben: ADULT_F,
        reason: 'Referral',
        expected: [
          'General OPD',
          'ANC',
          'PNC',
          'NCD screening',
          'NCD care',
          'COVID-19 Screening',
          'FP & Contraceptive Services',
          'General OPD (QC)',
        ],
      },
      {
        ben: CHILD_M,
        reason: 'Referral',
        expected: [
          'General OPD',
          'NCD care',
          'COVID-19 Screening',
          'Childhood & Adolescent Healthcare Services',
          'General OPD (QC)',
        ],
      },
      {
        ben: INFANT_F,
        reason: 'Referral',
        expected: [
          'General OPD',
          'NCD care',
          'COVID-19 Screening',
          'Neonatal and Infant Health Care Services',
          'General OPD (QC)',
        ],
      },
      {
        ben: ADULT_F,
        reason: 'Follow Up',
        expected: [
          'General OPD',
          'ANC',
          'PNC',
          'NCD care',
          'FP & Contraceptive Services',
          'General OPD (QC)',
        ],
      },
      {
        ben: CHILD_M,
        reason: 'Follow Up',
        expected: [
          'General OPD',
          'NCD care',
          'Childhood & Adolescent Healthcare Services',
          'General OPD (QC)',
        ],
      },
      {
        ben: INFANT_F,
        reason: 'Follow Up',
        expected: [
          'General OPD',
          'NCD care',
          'Neonatal and Infant Health Care Services',
          'General OPD (QC)',
        ],
      },
      {
        ben: ADULT_F,
        reason: 'New Chief Complaint',
        expected: [
          'General OPD',
          'ANC',
          'PNC',
          'NCD screening',
          'COVID-19 Screening',
          'FP & Contraceptive Services',
          'General OPD (QC)',
        ],
      },
      {
        ben: CHILD_M,
        reason: 'New Chief Complaint',
        expected: [
          'General OPD',
          'COVID-19 Screening',
          'Childhood & Adolescent Healthcare Services',
          'General OPD (QC)',
        ],
      },
      {
        ben: INFANT_F,
        reason: 'New Chief Complaint',
        expected: [
          'General OPD',
          'COVID-19 Screening',
          'Neonatal and Infant Health Care Services',
          'General OPD (QC)',
        ],
      },
    ];
    table.forEach((t) => {
      it(`${t.reason} for ${t.ben.genderName} aged ${t.ben.ageVal}`, async () => {
        await setup({ beneficiary: t.ben });
        fixture.detectChanges();
        form.patchValue({ visitCategory: 'ANC', followUpForFpMethod: ['x'] });
        component.reasonSelected(t.reason);
        expect(session.setItem).toHaveBeenCalledWith('visitReason', t.reason);
        expect(component.visitCategory).toBeNull();
        expect(component.followUpForFpMethod).toBeNull();
        expect(names()).toEqual(t.expected);
      });
    });
  });

  describe('visitCategorySelected (sub categories)', () => {
    const table = [
      {
        ben: ADULT_F,
        expected: ['Reproductive Health OPD care', SUB_CATS[4].name, 'Other'],
      },
      {
        ben: SENIOR_F,
        expected: [
          'Reproductive Health OPD care',
          'Elderly OPD Health care',
          SUB_CATS[4].name,
          'Other',
        ],
      },
      { ben: CHILD_M, expected: ['Child & Adolescent OPD care', 'Other'] },
      { ben: INFANT_F, expected: ['Newborn & Infant OPD care', 'Other'] },
    ];
    table.forEach((t) => {
      it(`for age ${t.ben.ageVal}`, async () => {
        await setup({ beneficiary: t.ben });
        fixture.detectChanges();
        expect(
          component.templateSubVisitCategories.map((s: any) => s.name),
        ).toEqual(t.expected);
      });
    });
  });

  describe('visit detail fetching', () => {
    const KEYS: [string, string][] = [
      ['General OPD (QC)', 'benVisitDetails'],
      ['ANC', 'ANCNurseVisitDetail'],
      ['General OPD', 'GOPDNurseVisitDetail'],
      ['NCD screening', 'NCDScreeningNurseVisitDetail'],
      ['NCD care', 'NCDCareNurseVisitDetail'],
      ['PNC', 'PNCNurseVisitDetail'],
      ['COVID-19 Screening', 'covid19NurseVisitDetail'],
      ['Neonatal and Infant Health Care Services', 'neonatalNurseVisitDetail'],
      ['Childhood & Adolescent Healthcare Services', 'cacNurseVisitDetail'],
      ['FP & Contraceptive Services', 'FP_NurseVisitDetail'],
    ];

    function response(key: string) {
      return of({
        statusCode: 200,
        data: {
          [key]: {
            fileIDs: [key],
            visitReason: 'Follow Up',
            visitCategory: 'X',
            followUpForFpMethod: ['Other'],
            sideEffects: ['Other'],
          },
        },
      });
    }

    KEYS.forEach(([cat, key]) => {
      it(`view mode loads ${cat} from ${key}`, async () => {
        await setup({ session: { visitCategory: cat }, mode: 'view' });
        doctor.getVisitComplaintDetails.and.returnValue(response(key));
        nurse.getCbacDetailsFromNurse.and.returnValue(
          of({ statusCode: 200, data: { oral: {} } }),
        );
        fixture.detectChanges();
        component.ngOnChanges();
        expect(component.disableVisit).toBeTrue();
        expect(doctor.getVisitComplaintDetails).toHaveBeenCalledWith(
          'B1',
          'V1',
        );
        expect(doctor.fileIDs).toEqual([key]);
        expect(component.visitReason).toBe('Follow Up');
        if (cat === 'NCD screening') {
          expect(nurse.getCbacDetailsFromNurse).toHaveBeenCalled();
          expect(component.IdrsOrCbac).toBe('CBAC');
        }
        if (cat === 'NCD care') {
          expect(nurse.getPreviousVisitConfirmedDiseases).toHaveBeenCalled();
        }
        if (cat === 'FP & Contraceptive Services') {
          expect(component.enableOtherFpTextField).toBeTrue();
          expect(component.enableOtherSideEffectTextField).toBeTrue();
        }
      });

      it(`specialist loads ${cat} via MMU fetch`, async () => {
        await setup({ session: { visitCategory: cat, specialistFlag: '100' } });
        doctor.getVisitComplaintDetails.and.returnValue(response(key));
        fixture.detectChanges();
        component.ngOnChanges();
        expect(component.disableVisit).toBeTrue();
        expect(doctor.fileIDs).toEqual([key]);
        expect(component.visitReason).toBe('Follow Up');
        if (cat === 'FP & Contraceptive Services') {
          expect(component.enableOtherFpTextField).toBeTrue();
        }
        if (cat === 'NCD care') {
          expect(nurse.getPreviousVisitConfirmedDiseases).toHaveBeenCalled();
        }
      });
    });

    it('ignores non-200 responses', async () => {
      await setup({ session: { visitCategory: 'ANC' } });
      fixture.detectChanges();
      doctor.getVisitComplaintDetails.and.returnValue(of({ statusCode: 5000 }));
      component.getVisitDetails('V', 'B');
      component.getMMUVisitDetails('V', 'B');
      expect(component.disableVisit).toBeFalse();
      expect(doctor.fileIDs).toBeUndefined();
    });

    it('view mode does not preset CBAC on init', async () => {
      await setup({ mode: 'view', session: { visitCategory: 'Unknown' } });
      fixture.detectChanges();
      expect(component.IdrsOrCbac).toBeNull();
    });
  });
});
