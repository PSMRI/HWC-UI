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

import { CervicalCancerScreeningComponent } from './cervical-cancer-screening.component';
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

const MASTER = {
  cervicalCancer: {
    visualExamination: [
      { id: 1, name: 'Negative' },
      { id: 2, name: 'Positive' },
    ],
  },
};

describe('CervicalCancerScreeningComponent', () => {
  let component: CervicalCancerScreeningComponent;
  let fixture: ComponentFixture<CervicalCancerScreeningComponent>;
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
      declarations: [CervicalCancerScreeningComponent],
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
    ).createCervicalCancerForm();
    fixture = TestBed.createComponent(CervicalCancerScreeningComponent);
    component = fixture.componentInstance;
    component.cervicalScreeningForm = form;
    component.confirmDiseasesList = [];
  });

  it('ignores master data without cervical cancer', () => {
    master$.next({ cervicalCancer: null });
    fixture.detectChanges();
    expect(component.visualExaminations).toEqual([]);
  });

  describe('nurse mode', () => {
    beforeEach(() => {
      master$.next(MASTER);
      fixture.detectChanges();
    });

    it('loads master data, language and attendant', () => {
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.attendant).toBe('nurse');
      expect(component.visualExaminations.length).toBe(2);
      expect(form.value.suspected).toBeFalse();
      expect(
        fixture.nativeElement.querySelector('[formcontrolname]'),
      ).not.toBeNull();
    });

    it('positive VIA marks suspected', () => {
      component.disableCheckbox = true;
      form.patchValue({ visualExaminationId: 2 });
      component.checkCervicalCancerSuspect();
      expect(form.value.visualExaminationVIA).toBe('Positive');
      expect(component.visualExaminationSuspected).toBeTrue();
      expect(component.checkIsCervicalSuspected).toBeTrue();
      expect(component.disableCheckbox).toBeFalse();
      expect(form.value.suspected).toBeTrue();
      expect(ncd.cervicalScreeningStatus.value).toBeTrue();
    });

    it('negative VIA is not suspected', () => {
      component.visualExaminationSuspected = true;
      form.patchValue({ visualExaminationId: 1 });
      component.checkCervicalCancerSuspect();
      expect(component.visualExaminationSuspected).toBeFalse();
      expect(form.value.suspected).toBeFalse();
    });

    it('already confirmed with other attendant is not suspected', () => {
      ncd.isCervicalConfirmed = true;
      component.attendant = 'lab';
      component.disableCheckbox = true;
      form.patchValue({ visualExaminationId: 2 });
      component.checkCervicalCancerSuspect();
      expect(component.visualExaminationSuspected).toBeFalse();
      expect(component.disableCheckbox).toBeTrue();
    });

    it('unknown id leaves VIA null', () => {
      form.patchValue({ visualExaminationId: 9 });
      component.checkCervicalCancerSuspect();
      expect(component.visualExaminationSuspected).toBeFalse();
    });

    it('disables form when cervical confirmed', () => {
      ncd.setConfirmedDiseasesForScreening([environment.cervical]);
      expect(form.disabled).toBeTrue();
      expect(component.disableCheckbox).toBeTrue();
      expect(form.getRawValue().formDisable).toBeTrue();
    });

    it('re-enables on mark for other confirmed / empty lists', () => {
      ncd.isCervicalConfirmed = true;
      form.disable();
      ncd.setConfirmedDiseasesForScreening(['Other']);
      expect(form.enabled).toBeTrue();
      expect(ncd.isCervicalConfirmed).toBeFalse();
      expect(component.disableCheckbox).toBeFalse();
      form.disable();
      ncd.setConfirmedDiseasesForScreening([]);
      expect(form.enabled).toBeTrue();
    });

    it('uses full path when cervical suspected', () => {
      component.checkIsCervicalSuspected = true;
      form.patchValue({ visualExaminationId: 2 });
      ncd.setConfirmedDiseasesForScreening(['Other']);
      expect(form.value.visualExaminationVIA).toBe('Positive');
      expect(component.disableCheckbox).toBeFalse();
      ncd.setConfirmedDiseasesForScreening([environment.cervical]);
      expect(form.disabled).toBeTrue();
      ncd.setConfirmedDiseasesForScreening([]);
      expect(form.enabled).toBeTrue();
    });

    it('fetches nurse data when fetch flag set', () => {
      doctor.screeningDetailsResponseFromNurse = {
        cervical: { suspected: true, visualExaminationId: 2 },
      };
      ncd.setScreeningDataFetch(true);
      expect(component.hideRemoveFunctionalityInDoctorIfSuspected).toBeTrue();
      expect(component.visualExaminationSuspected).toBeTrue();
      expect(form.value.visualExaminationId).toBe(2);
    });

    it('nurse data unsuspected / missing', () => {
      doctor.screeningDetailsResponseFromNurse = {
        cervical: { suspected: false },
      };
      component.getNcdScreeningDataForCbac();
      expect(component.visualExaminationSuspected).toBeFalse();
      doctor.screeningDetailsResponseFromNurse = undefined;
      component.hideRemoveFunctionalityInDoctorIfSuspected = false;
      component.getNcdScreeningDataForCbac();
      expect(component.hideRemoveFunctionalityInDoctorIfSuspected).toBeFalse();
    });

    it('hideCervicalScreeningForm confirm removes form (update mode flags change)', () => {
      const emitted: boolean[] = [];
      component.cervicalFormStatus.subscribe((v) => emitted.push(v));
      component.mode = 'update';
      form.patchValue({ visualExaminationId: 1 });
      spyOn(ncd, 'screeningValueChanged').and.callThrough();
      component.hideCervicalScreeningForm();
      expect(confirm.confirm).toHaveBeenCalledWith(
        'warn',
        LANGUAGE_EN.alerts.info.warn,
      );
      expect(component.hideCervicalForm).toBeTrue();
      expect(emitted).toEqual([false]);
      expect(form.value.visualExaminationId).toBeNull();
      expect(ncd.screeningValueChanged).toHaveBeenCalledWith(true);
    });

    it('hideCervicalScreeningForm in nurse mode does not flag change', () => {
      spyOn(ncd, 'screeningValueChanged');
      component.hideCervicalScreeningForm();
      expect(ncd.screeningValueChanged).not.toHaveBeenCalled();
    });

    it('hideCervicalScreeningForm cancel keeps form', () => {
      confirm.confirm.and.returnValue(of(false));
      component.hideCervicalForm = true;
      component.hideCervicalScreeningForm();
      expect(component.hideCervicalForm).toBeFalse();
    });

    [true, false].forEach((v) => {
      it(`markAsUnsuspected(${v})`, () => {
        component.markAsUnsuspected(v);
        expect(form.value.suspected).toBe(v);
        expect(component.visualExaminationSuspected).toBe(v);
        expect(component.checkIsCervicalSuspected).toBe(v);
        expect(form.dirty).toBeTrue();
      });
      it(`markAsUnSuspectedOnLoad(${v})`, () => {
        component.markAsUnSuspectedOnLoad(v);
        expect(form.value.suspected).toBe(v);
        expect(form.dirty).toBeFalse();
        expect(ncd.cervicalScreeningStatus.value).toBe(v);
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
      form.patchValue({ visualExaminationId: 1 });
      fixture.destroy();
      expect(s1.closed).toBeTrue();
      expect(s2.closed).toBeTrue();
      expect(form.value.visualExaminationId).toBeNull();
    });
  });

  it('view mode loads nurse data after master data', () => {
    doctor.screeningDetailsResponseFromNurse = {
      cervical: { suspected: true },
    };
    component.mode = 'view';
    master$.next(MASTER);
    fixture.detectChanges();
    expect(component.visualExaminationSuspected).toBeTrue();
    expect(form.value.suspected).toBeTrue();
  });
});
