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
import { BehaviorSubject, of } from 'rxjs';

import { BreastCancerScreeningComponent } from './breast-cancer-screening.component';
import { DoctorService } from '../../shared/services/doctor.service';
import { MasterdataService } from '../../shared/services/masterdata.service';
import { NcdScreeningService } from '../../shared/services/ncd-screening.service';
import { NCDScreeningUtils } from '../../shared/utility/ncd-screening-utility';
import { ConfirmationService } from 'src/app/app-modules/core/services/confirmation.service';
import { environment } from 'src/environments/environment';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';

const opts = () => [
  { id: 1, name: 'Normal' },
  { id: 2, name: 'Abnormal' },
];
const MASTER = {
  breastCancer: {
    inspectionOfBreasts: opts(),
    palpationOfBreasts: opts(),
    palpationLymphNodes: opts(),
  },
};

describe('BreastCancerScreeningComponent', () => {
  let component: BreastCancerScreeningComponent;
  let fixture: ComponentFixture<BreastCancerScreeningComponent>;
  let ncd: NcdScreeningService;
  let doctor: any;
  let confirm: any;
  let params: any;
  let master$: BehaviorSubject<any>;
  let form: FormGroup;

  beforeEach(async () => {
    params = { attendant: 'nurse' };
    master$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MatSelectModule],
      declarations: [BreastCancerScreeningComponent],
      providers: [
        ...commonTestProviders(),
        NcdScreeningService,
        { provide: DoctorService, useValue: {} },
        { provide: MasterdataService, useValue: { nurseMasterData$: master$ } },
        { provide: ActivatedRoute, useValue: { snapshot: { params } } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    ncd = TestBed.inject(NcdScreeningService);
    doctor = TestBed.inject(DoctorService);
    confirm = TestBed.inject(ConfirmationService);
    form = new NCDScreeningUtils(
      new FormBuilder(),
      {} as any,
    ).createBreastCancerForm();
    fixture = TestBed.createComponent(BreastCancerScreeningComponent);
    component = fixture.componentInstance;
    component.breastCancerScreeningForm = form;
    component.confirmDiseasesList = [];
    spyOn(console, 'log');
  });

  it('logs when master data is missing', () => {
    fixture.detectChanges();
    expect(console.log).toHaveBeenCalledWith(
      'Issue in fetching breast cancer masters',
    );
    expect(component.inspectionOfBreasts).toEqual([]);
  });

  describe('nurse mode', () => {
    beforeEach(() => {
      master$.next(MASTER);
      fixture.detectChanges();
    });

    it('loads master data, language and attendant', () => {
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.attendant).toBe('nurse');
      expect(component.inspectionOfBreasts.length).toBe(2);
      expect(component.palpationOfBreasts.length).toBe(2);
      expect(component.palpationOfLymphNodes.length).toBe(2);
      expect(component.breastCancerSuspected).toBeFalse();
      expect(form.value.suspected).toBeFalse();
      expect(
        fixture.nativeElement.querySelector('[formcontrolname]'),
      ).not.toBeNull();
    });

    it('ignores master data without breast cancer', () => {
      component.inspectionOfBreasts = [];
      master$.next({ breastCancer: null });
      expect(component.inspectionOfBreasts).toEqual([]);
    });

    it('all normal findings are not suspected and set names', () => {
      form.patchValue({
        inspectionBreastsId: 1,
        palpationBreastsId: 1,
        palpationLymphNodesId: 1,
      });
      component.setNameBasedOnSelectedID();
      expect(form.value.inspectionBreasts).toBe('Normal');
      expect(form.value.palpationBreasts).toBe('Normal');
      expect(form.value.palpationLymphNodes).toBe('Normal');
      expect(component.breastCancerSuspected).toBeFalse();
      expect(form.value.suspected).toBeFalse();
      expect(ncd.valueChangedForNCD.value).toBeTrue();
      expect(ncd.breastScreeningStatus.value).toBeFalse();
    });

    [
      'inspectionBreastsId',
      'palpationBreastsId',
      'palpationLymphNodesId',
    ].forEach((ctrl) => {
      it(`abnormal ${ctrl} marks breast cancer suspected`, () => {
        component.disableCheckbox = true;
        form.patchValue({
          inspectionBreastsId: 1,
          palpationBreastsId: 1,
          palpationLymphNodesId: 1,
        });
        form.patchValue({ [ctrl]: 2 });
        component.setNameBasedOnSelectedID();
        expect(component.breastCancerSuspected).toBeTrue();
        expect(component.checkIsBreastCancerSuspected).toBeTrue();
        expect(component.disableCheckbox).toBeFalse();
        expect(form.value.suspected).toBeTrue();
        expect(ncd.breastScreeningStatus.value).toBeTrue();
      });
    });

    it('does not suspect if already confirmed; other attendant keeps checkbox', () => {
      ncd.isBreastConfirmed = true;
      component.attendant = 'lab';
      component.disableCheckbox = true;
      form.patchValue({ inspectionBreastsId: 2 });
      component.setNameBasedOnSelectedID();
      expect(component.breastCancerSuspected).toBeFalse();
      expect(component.disableCheckbox).toBeTrue();
      expect(form.value.suspected).toBeFalse();
    });

    it('disables form when breast confirmed (not suspected path)', () => {
      ncd.setConfirmedDiseasesForScreening([environment.breast]);
      expect(form.disabled).toBeTrue();
      expect(component.disableCheckbox).toBeTrue();
      expect(form.getRawValue().formDisable).toBeTrue();
      expect(form.getRawValue().suspected).toBeNull();
    });

    it('re-enables form on mark when other disease confirmed', () => {
      ncd.isBreastConfirmed = true;
      form.disable();
      ncd.setConfirmedDiseasesForScreening(['Other']);
      expect(form.enabled).toBeTrue();
      expect(ncd.isBreastConfirmed).toBeFalse();
      expect(component.disableCheckbox).toBeFalse();
      form.disable();
      ncd.setConfirmedDiseasesForScreening([]);
      expect(form.enabled).toBeTrue();
      expect(form.value.formDisable).toBeNull();
    });

    it('uses full reset path when breast is suspected', () => {
      component.checkIsBreastCancerSuspected = true;
      form.patchValue({ palpationBreastsId: 2 });
      ncd.isBreastConfirmed = true;
      ncd.setConfirmedDiseasesForScreening(['Other']);
      expect(ncd.isBreastConfirmed).toBeFalse();
      expect(form.value.palpationBreasts).toBe('Abnormal');
      expect(component.breastCancerSuspected).toBeTrue();
      ncd.setConfirmedDiseasesForScreening([environment.breast]);
      expect(form.disabled).toBeTrue();
      expect(component.disableCheckbox).toBeTrue();
      ncd.setConfirmedDiseasesForScreening([]);
      expect(form.enabled).toBeTrue();
    });

    it('ignores null confirmed-disease emissions', () => {
      form.disable();
      ncd.confirmedDiseasesListCheck.next(null as any);
      expect(form.disabled).toBeTrue();
    });

    it('fetches nurse data when fetch flag is set', () => {
      doctor.screeningDetailsResponseFromNurse = {
        breast: { suspected: true, inspectionBreastsId: 2 },
      };
      ncd.setScreeningDataFetch(true);
      expect(component.hideRemoveFunctionalityInDoctorIfSuspected).toBeTrue();
      expect(component.breastCancerSuspected).toBeTrue();
      expect(form.value.inspectionBreastsId).toBe(2);
      expect(ncd.breastScreeningStatus.value).toBeTrue();
    });

    it('nurse data with suspected false and missing data', () => {
      doctor.screeningDetailsResponseFromNurse = {
        breast: { suspected: false },
      };
      component.getNcdScreeningDataForCbac();
      expect(component.breastCancerSuspected).toBeFalse();
      component.hideRemoveFunctionalityInDoctorIfSuspected = false;
      doctor.screeningDetailsResponseFromNurse = { breast: null };
      component.getNcdScreeningDataForCbac();
      doctor.screeningDetailsResponseFromNurse = null;
      component.getNcdScreeningDataForCbac();
      expect(component.hideRemoveFunctionalityInDoctorIfSuspected).toBeFalse();
    });

    it('hideBreastScreeningForm confirm removes form', () => {
      const emitted: boolean[] = [];
      component.breastFormStatus.subscribe((v) => emitted.push(v));
      form.patchValue({ inspectionBreastsId: 1 });
      ncd.breastSuspectStatus(true);
      component.hideBreastScreeningForm();
      expect(confirm.confirm).toHaveBeenCalledWith(
        'warn',
        LANGUAGE_EN.alerts.info.warn,
      );
      expect(component.hideBreastForm).toBeTrue();
      expect(emitted).toEqual([false]);
      expect(form.value.inspectionBreastsId).toBeNull();
      expect(ncd.breastScreeningStatus.value).toBeFalse();
    });

    it('hideBreastScreeningForm cancel keeps form', () => {
      confirm.confirm.and.returnValue(of(false));
      component.hideBreastForm = true;
      component.hideBreastScreeningForm();
      expect(component.hideBreastForm).toBeFalse();
    });

    [true, false].forEach((v) => {
      it(`markAsUnsuspected(${v})`, () => {
        spyOn(ncd, 'screeningValueChanged').and.callThrough();
        component.markAsUnsuspected(v);
        expect(form.value.suspected).toBe(v);
        expect(component.breastCancerSuspected).toBe(v);
        expect(component.checkIsBreastCancerSuspected).toBe(v);
        expect(form.dirty).toBeTrue();
        expect(ncd.breastScreeningStatus.value).toBe(v);
        expect(ncd.screeningValueChanged).toHaveBeenCalledWith(true);
      });
      it(`markAsUnSuspectedOnLoad(${v})`, () => {
        component.markAsUnSuspectedOnLoad(v);
        expect(form.value.suspected).toBe(v);
        expect(component.breastCancerSuspected).toBe(v);
        expect(component.checkIsBreastCancerSuspected).toBe(v);
        expect(form.dirty).toBeFalse();
        expect(ncd.breastScreeningStatus.value).toBe(v);
      });
    });

    it('ngOnChanges in view mode is a no-op', () => {
      component.mode = 'view';
      component.ngOnChanges();
      expect(form.value.suspected).toBeFalse();
    });

    it('ngOnDestroy unsubscribes and resets', () => {
      const s1 = component.nurseMasterDataSubscription;
      const s2 = component.confirmedDiseasesListSubscription;
      form.patchValue({ inspectionBreastsId: 1 });
      fixture.destroy();
      expect(s1.closed).toBeTrue();
      expect(s2.closed).toBeTrue();
      expect(form.value.inspectionBreastsId).toBeNull();
    });
  });

  it('view mode loads nurse data after master data', () => {
    doctor.screeningDetailsResponseFromNurse = {
      breast: { suspected: true, palpationBreastsId: 2 },
    };
    component.mode = 'view';
    master$.next(MASTER);
    fixture.detectChanges();
    expect(component.hideRemoveFunctionalityInDoctorIfSuspected).toBeTrue();
    expect(ncd.breastScreeningStatus.value).toBeDefined();
    expect(form.value.palpationBreastsId).toBe(2);
  });

  it('ngOnDestroy tolerates missing subscriptions', () => {
    form.patchValue({ inspectionBreastsId: 1 });
    component.ngOnDestroy();
    expect(form.value.inspectionBreastsId).toBeNull();
  });
});
