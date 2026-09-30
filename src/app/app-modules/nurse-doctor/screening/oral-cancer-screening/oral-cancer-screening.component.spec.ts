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

import { OralCancerScreeningComponent } from './oral-cancer-screening.component';
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
  oralCancer: {
    oralCavity: opts(),
    mouthOpening: opts(),
    palpationOralCavity: opts(),
    temporomandibularJoin: opts(),
    cervicalLymphNode: opts(),
  },
};

describe('OralCancerScreeningComponent', () => {
  let component: OralCancerScreeningComponent;
  let fixture: ComponentFixture<OralCancerScreeningComponent>;
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
      declarations: [OralCancerScreeningComponent],
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
    ).createOralCancerForm();
    fixture = TestBed.createComponent(OralCancerScreeningComponent);
    component = fixture.componentInstance;
    component.oralCancerForm = form;
    component.confirmDiseasesList = [];
  });

  describe('nurse mode', () => {
    beforeEach(() => {
      master$.next(MASTER);
      fixture.detectChanges();
    });

    it('loads master data, language and attendant', () => {
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.attendant).toBe('nurse');
      expect(component.oralCavityFindings.length).toBe(2);
      expect(component.cervicalLymphNodesFindings.length).toBe(2);
      expect(
        fixture.nativeElement.querySelector('[formcontrolname]'),
      ).not.toBeNull();
    });

    it('ignores master data without oral cancer', () => {
      component.oralCavityFindings = [];
      master$.next({ oralCancer: null });
      expect(component.oralCavityFindings).toEqual([]);
    });

    it('all normal findings are not suspected', () => {
      form.patchValue({
        oralCavityFindingId: 1,
        mouthOpeningId: 1,
        palpationofOralCavityId: 1,
        temporomandibularJointRightId: 1,
        temporomandibularJointLeftId: 1,
        cervicalLymphnodesId: 1,
      });
      component.setNameBasedOnSelectedID();
      expect(form.value.oralCavityFinding).toBe('Normal');
      expect(form.value.temporomandibularJointLeft).toBe('Normal');
      expect(component.suspectOralCavity).toBeFalse();
      expect(form.value.suspected).toBeFalse();
      expect(ncd.valueChangedForNCD.value).toBeTrue();
    });

    [
      'oralCavityFindingId',
      'mouthOpeningId',
      'palpationofOralCavityId',
      'temporomandibularJointRightId',
      'temporomandibularJointLeftId',
      'cervicalLymphnodesId',
    ].forEach((ctrl) => {
      it(`abnormal ${ctrl} marks oral cancer suspected`, () => {
        component.disableCheckbox = true;
        form.patchValue({ [ctrl]: 2 });
        component.setNameBasedOnSelectedID();
        expect(component.suspectOralCavity).toBeTrue();
        expect(component.checkIsOralCancerSuspected).toBeTrue();
        expect(component.disableCheckbox).toBeFalse();
        expect(form.value.suspected).toBeTrue();
        expect(ncd.oralScreeningStatus.value).toBeTrue();
      });
    });

    it('does not suspect if already confirmed; other attendant keeps checkbox', () => {
      ncd.isOralConfirmed = true;
      component.attendant = 'lab';
      component.disableCheckbox = true;
      form.patchValue({ oralCavityFindingId: 2 });
      component.setNameBasedOnSelectedID();
      expect(component.suspectOralCavity).toBeFalse();
      expect(component.disableCheckbox).toBeTrue();
    });

    it('disables form when oral confirmed (not suspected path)', () => {
      ncd.setConfirmedDiseasesForScreening([environment.oral]);
      expect(form.disabled).toBeTrue();
      expect(component.disableCheckbox).toBeTrue();
      expect(form.getRawValue().formDisable).toBeTrue();
    });

    it('re-enables form on mark when other disease confirmed', () => {
      ncd.isOralConfirmed = true;
      form.disable();
      ncd.setConfirmedDiseasesForScreening(['Other']);
      expect(form.enabled).toBeTrue();
      expect(ncd.isOralConfirmed).toBeFalse();
      expect(component.disableCheckbox).toBeFalse();
      ncd.setConfirmedDiseasesForScreening([]);
      expect(form.value.formDisable).toBeNull();
    });

    it('uses full reset path when oral is suspected', () => {
      component.checkIsOralCancerSuspected = true;
      form.patchValue({ oralCavityFindingId: 2 });
      ncd.setConfirmedDiseasesForScreening(['Other']);
      expect(form.value.oralCavityFinding).toBe('Abnormal');
      ncd.setConfirmedDiseasesForScreening([environment.oral]);
      expect(form.disabled).toBeTrue();
      ncd.setConfirmedDiseasesForScreening([]);
      expect(form.enabled).toBeTrue();
    });

    it('fetches nurse data when fetch flag is set', () => {
      doctor.screeningDetailsResponseFromNurse = {
        oral: { suspected: true, oralCavityFindingId: 2 },
      };
      ncd.setScreeningDataFetch(true);
      expect(component.hideRemoveFunctionalityInDoctorIfSuspected).toBeTrue();
      expect(component.suspectOralCavity).toBeTrue();
      expect(form.value.oralCavityFindingId).toBe(2);
    });

    it('nurse data with suspected false and missing data', () => {
      doctor.screeningDetailsResponseFromNurse = { oral: { suspected: false } };
      component.getNcdScreeningDataForCbac();
      expect(component.suspectOralCavity).toBeFalse();
      doctor.screeningDetailsResponseFromNurse = null;
      component.hideRemoveFunctionalityInDoctorIfSuspected = false;
      component.getNcdScreeningDataForCbac();
      expect(component.hideRemoveFunctionalityInDoctorIfSuspected).toBeFalse();
    });

    it('hideOralScreeningForm confirm removes form', () => {
      const emitted: boolean[] = [];
      component.oralFormStatus.subscribe((v) => emitted.push(v));
      form.patchValue({ oralCavityFindingId: 1 });
      component.mode = 'update';
      spyOn(ncd, 'screeningValueChanged').and.callThrough();
      component.hideOralScreeningForm();
      expect(confirm.confirm).toHaveBeenCalledWith(
        'warn',
        LANGUAGE_EN.alerts.info.warn,
      );
      expect(component.hideOralForm).toBeTrue();
      expect(emitted).toEqual([false]);
      expect(form.value.oralCavityFindingId).toBeNull();
      expect(ncd.screeningValueChanged).toHaveBeenCalledWith(true);
    });

    it('hideOralScreeningForm in nurse mode does not flag change', () => {
      spyOn(ncd, 'screeningValueChanged');
      component.hideOralScreeningForm();
      expect(component.hideOralForm).toBeTrue();
      expect(ncd.screeningValueChanged).not.toHaveBeenCalled();
    });

    it('hideOralScreeningForm cancel keeps form', () => {
      confirm.confirm.and.returnValue(of(false));
      component.hideOralForm = true;
      component.hideOralScreeningForm();
      expect(component.hideOralForm).toBeFalse();
    });

    [true, false].forEach((v) => {
      it(`markAsUnsuspected(${v})`, () => {
        component.markAsUnsuspected(v);
        expect(form.value.suspected).toBe(v);
        expect(component.suspectOralCavity).toBe(v);
        expect(component.checkIsOralCancerSuspected).toBe(v);
        expect(form.dirty).toBeTrue();
        expect(ncd.oralScreeningStatus.value).toBe(v);
      });
      it(`markAsUnSuspectedOnLoad(${v})`, () => {
        component.markAsUnSuspectedOnLoad(v);
        expect(form.value.suspected).toBe(v);
        expect(form.dirty).toBeFalse();
        expect(ncd.oralScreeningStatus.value).toBe(v);
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
      form.patchValue({ oralCavityFindingId: 1 });
      fixture.destroy();
      expect(s1.closed).toBeTrue();
      expect(s2.closed).toBeTrue();
      expect(form.value.oralCavityFindingId).toBeNull();
    });
  });

  it('view mode loads nurse data after master data', () => {
    doctor.screeningDetailsResponseFromNurse = {
      oral: { suspected: true, mouthOpeningId: 2 },
    };
    component.mode = 'view';
    master$.next(MASTER);
    fixture.detectChanges();
    expect(component.suspectOralCavity).toBeTrue();
    expect(form.value.suspected).toBeTrue();
    expect(ncd.oralScreeningStatus.value).toBeTrue();
  });
});
