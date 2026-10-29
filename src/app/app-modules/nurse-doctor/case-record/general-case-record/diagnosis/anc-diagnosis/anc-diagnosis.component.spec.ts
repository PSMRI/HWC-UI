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
import { BehaviorSubject, of } from 'rxjs';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

import { AncDiagnosisComponent } from './anc-diagnosis.component';
import { DoctorService, MasterdataService } from '../../../../shared/services';
import { BeneficiaryDetailsService } from 'src/app/app-modules/core/services';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('AncDiagnosisComponent', () => {
  let component: AncDiagnosisComponent;
  let fixture: ComponentFixture<AncDiagnosisComponent>;
  let caseRecord$: BehaviorSubject<any>;
  let nurseMaster$: BehaviorSubject<any>;
  let hrp$: BehaviorSubject<any>;
  let doctorService: any;
  let benService: any;
  let session: any;

  const masterData = {
    pregComplicationTypes: [
      { pregComplicationType: 'None' },
      { pregComplicationType: 'Other' },
      { pregComplicationType: 'Hypothyroidism' },
      { pregComplicationType: 'Anemia' },
    ],
  };

  function buildForm() {
    return new FormGroup({
      specialistDiagnosis: new FormControl(null),
      highRiskStatus: new FormControl(null),
      highRiskCondition: new FormControl(null),
      complicationOfCurrentPregnancyList: new FormControl([]),
      otherCurrPregComplication: new FormControl(null),
      placeOfDeath: new FormControl('x'),
      dateOfDeath: new FormControl('y'),
      causeOfDeath: new FormControl('z'),
    });
  }

  beforeEach(async () => {
    caseRecord$ = new BehaviorSubject<any>(null);
    nurseMaster$ = new BehaviorSubject<any>(null);
    hrp$ = new BehaviorSubject<any>(0);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [AncDiagnosisComponent],
      providers: [
        ...commonTestProviders({
          session: {
            beneficiaryRegID: 'B1',
            visitCode: 'VC1',
            visitID: 'V1',
            visitCategory: 'ANC',
          },
        }),
        {
          provide: DoctorService,
          useValue: autoSpy(DoctorService, {
            populateCaserecordResponse$: caseRecord$.asObservable(),
          }),
        },
        {
          provide: MasterdataService,
          useValue: autoSpy(MasterdataService, {
            nurseMasterData$: nurseMaster$.asObservable(),
          }),
        },
        {
          provide: BeneficiaryDetailsService,
          useValue: autoSpy(BeneficiaryDetailsService, {
            HRPPositiveFlag$: hrp$.asObservable(),
          }),
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(AncDiagnosisComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(AncDiagnosisComponent);
    component = fixture.componentInstance;
    doctorService = TestBed.inject(DoctorService) as any;
    benService = TestBed.inject(BeneficiaryDetailsService) as any;
    session = TestBed.inject(SessionStorageService) as any;
    component.generalDiagnosisForm = buildForm();
  });

  describe('ngOnInit', () => {
    it('initialises for a doctor', () => {
      doctorService.getHRPDetails.and.returnValue(
        of({ statusCode: 200, data: { isHRP: false } }),
      );
      fixture.detectChanges();
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
      expect(benService.resetHRPPositive).toHaveBeenCalled();
      expect(doctorService.getHRPDetails).toHaveBeenCalledWith('B1', 'VC1');
      expect(component.specialist).toBeFalse();
      expect(component.specialistDaignosis?.disabled).toBeTrue();
      expect(component.showHRP).toBe('false');
      expect(component.minimumDeathDate.getTime()).toBeLessThan(
        component.today.getTime(),
      );
    });

    it('enables specialist diagnosis for TC Specialist', () => {
      session.setItem('designation', 'TC Specialist');
      fixture.detectChanges();
      expect(component.specialist).toBeTrue();
      expect(component.specialistDaignosis?.enabled).toBeTrue();
    });

    it('sets showHRP from HRP positive flag', () => {
      fixture.detectChanges();
      hrp$.next(2);
      expect(component.showHRP).toBe('true');
      hrp$.next(0);
      expect(component.showHRP).toBe('false');
    });
  });

  describe('fetchHRPPositive', () => {
    it('sets true when isHRP', () => {
      doctorService.getHRPDetails.and.returnValue(
        of({ statusCode: 200, data: { isHRP: true } }),
      );
      component.fetchHRPPositive();
      expect(component.showHRP).toBe('true');
    });

    it('sets false when not HRP', () => {
      doctorService.getHRPDetails.and.returnValue(
        of({ statusCode: 200, data: { isHRP: false } }),
      );
      component.fetchHRPPositive();
      expect(component.showHRP).toBe('false');
    });

    it('leaves showHRP untouched on failure', () => {
      doctorService.getHRPDetails.and.returnValue(of({ statusCode: 5000 }));
      component.fetchHRPPositive();
      expect(component.showHRP).toBeUndefined();
    });
  });

  describe('getMasterData', () => {
    it('stores master data without fetching diagnosis when not in view', () => {
      component.caseRecordMode = 'edit';
      component.getMasterData();
      nurseMaster$.next(masterData);
      expect(component.masterData).toBe(masterData);
      expect(component.diagnosisSubscription).toBeUndefined();
    });

    it('fetches diagnosis in view mode and patches it', () => {
      component.caseRecordMode = 'view';
      nurseMaster$.next(masterData);
      component.getMasterData();
      expect(component.beneficiaryRegID).toBe('B1');
      expect(component.visitID).toBe('V1');
      expect(component.visitCategory).toBe('ANC');
      caseRecord$.next({
        statusCode: 200,
        data: {
          diagnosis: {
            dateOfDeath: '2024-01-01',
            highRiskStatus: 'Yes',
            complicationOfCurrentPregnancyList: [
              { pregComplicationType: 'Other' },
              { pregComplicationType: 'Unknown' },
            ],
            otherCurrPregComplication: 'foo',
          },
        },
      });
      const f = component.generalDiagnosisForm;
      expect(f.value.dateOfDeath instanceof Date).toBeTrue();
      expect(component.highRiskStatus?.value).toBe('Yes');
      expect(component.complicationOfCurrentPregnancyList).toEqual([
        masterData.pregComplicationTypes[1],
      ]);
      expect(component.showOtherPregnancyComplication).toBeTrue();
      expect(f.value.otherCurrPregComplication).toBe('foo');
    });

    it('ignores case record responses without diagnosis', () => {
      component.caseRecordMode = 'view';
      component.getMasterData();
      caseRecord$.next({ statusCode: 200, data: {} });
      expect(component.highRiskStatus?.value).toBeNull();
    });
  });

  describe('patchComplicationOfCurrentPregnancyList', () => {
    it('produces empty list when list undefined', () => {
      const diag: any = {};
      component.patchComplicationOfCurrentPregnancyList(diag);
      expect(diag.complicationOfCurrentPregnancyList).toEqual([]);
      expect(component.showAllPregComplication).toBeTrue();
    });

    it('produces empty list when master data missing', () => {
      component.masterData = undefined;
      const diag: any = {
        complicationOfCurrentPregnancyList: [{ pregComplicationType: 'None' }],
      };
      component.patchComplicationOfCurrentPregnancyList(diag);
      expect(diag.complicationOfCurrentPregnancyList).toEqual([]);
    });
  });

  describe('resetOtherPregnancyComplication', () => {
    it('multiple selections disable None', () => {
      component.resetOtherPregnancyComplication(
        [{ pregComplicationType: 'Anemia' }, { pregComplicationType: 'X' }],
        0,
      );
      expect(component.disableNonePregnancyComplication).toBeTrue();
      expect(component.showAllPregComplication).toBeFalse();
      expect(component.showOtherPregnancyComplication).toBeFalse();
    });

    it('single None keeps None enabled', () => {
      component.resetOtherPregnancyComplication(
        [{ pregComplicationType: 'None' }],
        0,
      );
      expect(component.disableNonePregnancyComplication).toBeFalse();
      expect(component.showAllPregComplication).toBeFalse();
    });

    it('single non-None disables None', () => {
      component.resetOtherPregnancyComplication(
        [{ pregComplicationType: 'Anemia' }],
        0,
      );
      expect(component.disableNonePregnancyComplication).toBeTrue();
    });

    it('clears other complication when checkNull is 0 and no Other', () => {
      component.generalDiagnosisForm.patchValue({
        otherCurrPregComplication: 'abc',
      });
      component.resetOtherPregnancyComplication([], 0);
      expect(
        component.generalDiagnosisForm.value.otherCurrPregComplication,
      ).toBeNull();
      expect(component.showAllPregComplication).toBeTrue();
    });

    it('keeps other complication when checkNull is 0 and Other selected', () => {
      component.generalDiagnosisForm.patchValue({
        otherCurrPregComplication: 'abc',
      });
      component.resetOtherPregnancyComplication(
        [{ pregComplicationType: 'Other' }],
        0,
      );
      expect(component.showOtherPregnancyComplication).toBeTrue();
      expect(
        component.generalDiagnosisForm.value.otherCurrPregComplication,
      ).toBe('abc');
    });

    it('does not patch other when checkNull is object and no Other', () => {
      component.generalDiagnosisForm.patchValue({
        otherCurrPregComplication: 'keep',
      });
      component.resetOtherPregnancyComplication(
        [{ pregComplicationType: 'None' }],
        { otherCurrPregComplication: 'new' },
      );
      expect(
        component.generalDiagnosisForm.value.otherCurrPregComplication,
      ).toBe('keep');
    });
  });

  it('checkWithDeathDetails clears death details', () => {
    component.checkWithDeathDetails();
    const v = component.generalDiagnosisForm.value;
    expect(v.placeOfDeath).toBeNull();
    expect(v.dateOfDeath).toBeNull();
    expect(v.causeOfDeath).toBeNull();
  });

  it('highRiskCondition getter returns control', () => {
    expect(component.highRiskCondition).toBe(
      component.generalDiagnosisForm.get('highRiskCondition'),
    );
  });

  it('displayPositive flags hypothyroidism', () => {
    component.displayPositive([{ pregComplicationType: 'Hypothyroidism' }]);
    expect(component.complicationPregHRP).toBe('true');
    component.displayPositive([{ pregComplicationType: 'Anemia' }]);
    expect(component.complicationPregHRP).toBe('false');
  });

  it('refreshes language on ngDoCheck', () => {
    component.current_language_set = null;
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  it('unsubscribes on destroy', () => {
    component.caseRecordMode = 'view';
    component.getMasterData();
    const s1 = component.nurseMasterDataSubscription;
    const s2 = component.diagnosisSubscription;
    component.ngOnDestroy();
    expect(s1.closed).toBeTrue();
    expect(s2.closed).toBeTrue();
  });

  it('destroy without subscriptions does not throw', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});
