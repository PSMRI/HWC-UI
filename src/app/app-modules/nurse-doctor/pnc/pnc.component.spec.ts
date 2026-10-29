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
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  createSessionStorageMock,
  throwingObs,
} from 'src/testing/test-utils';
import { MaterialModule } from 'src/app/app-modules/core/material.module';
import { BeneficiaryDetailsService } from '../../core/services/beneficiary-details.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../shared/services';
import { GeneralUtils } from '../shared/utility/general-utility';
import { PncComponent } from './pnc.component';

const SESSION = {
  serviceLineDetails: JSON.stringify({ facilityID: 1, parkingPlaceID: 2 }),
  visitID: '10',
  beneficiaryRegID: '20',
  providerServiceID: '3',
  userName: 'nurse',
  visitCode: '70',
};

const MASTER = {
  deliveryTypes: [
    { deliveryType: 'Normal Delivery' },
    { deliveryType: 'Cesarean Section (LSCS)' },
    { deliveryType: 'Assisted Delivery' },
  ],
  deliveryPlaces: [
    { deliveryPlace: 'PHC' },
    { deliveryPlace: 'Home-Supervised' },
  ],
  deliveryConductedByMaster: [{ deliveryConductedBy: 'Doctor' }],
  deliveryComplicationTypes: [{ deliveryComplicationType: 'PPH' }],
  pregOutcomes: [{ pregOutcome: 'Live Birth' }],
  postNatalComplications: [{ complicationValue: 'Fever' }],
  gestation: [{ name: 'Term' }],
  newbornHealthStatuses: [{ newBornHealthStatus: 'Healthy' }],
};

const PNC_DETAIL = {
  deliveryType: 'Normal Delivery',
  deliveryPlace: 'PHC',
  deliveryConductedBy: 'Doctor',
  deliveryComplication: 'PPH',
  pregOutcome: 'Live Birth',
  postNatalComplication: 'Fever',
  gestationName: 'Term',
  newBornHealthStatus: 'Healthy',
  dateOfDelivery: '2024-05-01',
  birthWeightOfNewborn: 3000,
};

describe('PncComponent', () => {
  let component: PncComponent;
  let fixture: ComponentFixture<PncComponent>;
  let form: FormGroup;
  let doctor: any;
  let confirm: any;
  let session: any;
  let master$: BehaviorSubject<any>;
  let ben$: BehaviorSubject<any>;
  let route: any;

  beforeEach(async () => {
    master$ = new BehaviorSubject<any>(null);
    ben$ = new BehaviorSubject<any>(null);
    doctor = autoSpy(DoctorService);
    route = { snapshot: { params: { attendant: 'doctor' } } };
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [PncComponent],
      providers: [
        ...commonTestProviders({ session: SESSION }),
        { provide: DoctorService, useValue: doctor },
        { provide: NurseService, useValue: autoSpy(NurseService) },
        { provide: ActivatedRoute, useValue: route },
        {
          provide: MasterdataService,
          useValue: { nurseMasterData$: master$.asObservable() },
        },
        {
          provide: BeneficiaryDetailsService,
          useValue: { beneficiaryDetails$: ben$.asObservable() },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PncComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    session = TestBed.inject(SessionStorageService);
    form = new GeneralUtils(
      new FormBuilder(),
      createSessionStorageMock(SESSION) as any,
    ).createPatientPNCForm();
    component.patientPNCForm = form;
    spyOn(console, 'log');
  });

  const pncResponse = (detail: any = PNC_DETAIL) =>
    of({ statusCode: 200, data: { PNCCareDetail: { ...detail } } });

  function expectPatched() {
    const v = form.value;
    expect(v.deliveryType).toEqual({ deliveryType: 'Normal Delivery' });
    expect(v.deliveryPlace).toEqual({ deliveryPlace: 'PHC' });
    expect(v.deliveryConductedBy).toEqual({ deliveryConductedBy: 'Doctor' });
    expect(v.deliveryComplication).toEqual({ deliveryComplicationType: 'PPH' });
    expect(v.pregOutcome).toEqual({ pregOutcome: 'Live Birth' });
    expect(v.postNatalComplication).toEqual({ complicationValue: 'Fever' });
    expect(v.gestationName).toEqual({ name: 'Term' });
    expect(v.newBornHealthStatus).toEqual({ newBornHealthStatus: 'Healthy' });
    expect(v.dDate).toEqual(new Date('2024-05-01'));
    expect(v.birthWeightOfNewborn).toBe(3000);
  }

  describe('initialisation', () => {
    it('should create, set dates and language', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.attendant).toBe('doctor');
      const diff =
        component.today.getTime() - component.minimumDeliveryDate.getTime();
      expect(diff).toBe(365 * 24 * 60 * 60 * 1000);
    });

    it('stores master data without fetching for a fresh visit', () => {
      fixture.detectChanges();
      master$.next(MASTER);
      expect(component.masterData).toBe(MASTER);
      expect(component.selectDeliveryTypes).toBe(MASTER.deliveryTypes);
      expect(doctor.getPNCDetails).not.toHaveBeenCalled();
      expect(doctor.getPreviousPNCDetails).not.toHaveBeenCalled();
    });

    it('ignores master data without delivery types', () => {
      fixture.detectChanges();
      master$.next({ gestation: [] });
      expect(component.masterData).toBeUndefined();
    });

    it('loads previous PNC details for a nurse follow-up', () => {
      route.snapshot.params.attendant = 'nurse';
      session.setItem('visitReason', 'Follow Up');
      doctor.getPreviousPNCDetails.and.returnValue(pncResponse());
      fixture.detectChanges();
      master$.next(MASTER);
      expect(doctor.getPreviousPNCDetails).toHaveBeenCalledWith('20');
      expectPatched();
    });

    it('patches PNC details when a mode is set', () => {
      component.mode = 'view';
      doctor.getPNCDetails.and.returnValue(pncResponse());
      fixture.detectChanges();
      master$.next(MASTER);
      expect(doctor.getPNCDetails).toHaveBeenCalledWith('20', '10');
      expectPatched();
    });

    it('patches PNC details for specialist flag 100', () => {
      session.setItem('specialistFlag', '100');
      doctor.getPNCDetails.and.returnValue(pncResponse());
      fixture.detectChanges();
      master$.next(MASTER);
      expect(doctor.getPNCDetails).toHaveBeenCalledTimes(1);
    });

    it('computes dob from beneficiary age when not in a mode', () => {
      fixture.detectChanges();
      ben$.next({ ageVal: 28 });
      expect(component.beneficiaryAge).toBe(28);
      expect(component.dob.getFullYear()).toBe(
        component.today.getFullYear() - 28,
      );
    });

    it('does not compute dob in a mode', () => {
      component.mode = 'view';
      fixture.detectChanges();
      ben$.next({ ageVal: 28 });
      expect(component.beneficiaryAge).toBe(28);
      expect(component.dob).toBeUndefined();
    });

    it('unsubscribes on destroy', () => {
      fixture.detectChanges();
      const a = component.beneficiaryDetailsSubscription;
      const b = component.nurseMasterDataSubscription;
      fixture.destroy();
      expect(a.closed).toBeTrue();
      expect(b.closed).toBeTrue();
    });

    it('ngOnDestroy tolerates missing subscriptions', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
      expect(component.nurseMasterDataSubscription).toBeUndefined();
    });
  });

  describe('patch methods with sparse master data', () => {
    beforeEach(() => {
      component.masterData = { deliveryTypes: MASTER.deliveryTypes };
    });

    it('patchDataToFields keeps raw values for missing masters', () => {
      doctor.getPNCDetails.and.returnValue(pncResponse());
      component.patchDataToFields('20', '10');
      expect(form.value.deliveryPlace).toBe('PHC');
      expect(form.value.gestationName).toBe('Term');
      expect(form.value.deliveryType).toEqual({
        deliveryType: 'Normal Delivery',
      });
    });

    it('getPreviousVisitPNCDetails keeps raw values for missing masters', () => {
      doctor.getPreviousPNCDetails.and.returnValue(pncResponse());
      component.getPreviousVisitPNCDetails();
      expect(form.value.pregOutcome).toBe('Live Birth');
    });

    it('getPreviousVisitPNCDetails ignores non-200 responses', () => {
      doctor.getPreviousPNCDetails.and.returnValue(
        of({ statusCode: 5000, data: null }),
      );
      component.getPreviousVisitPNCDetails();
      expect(form.value.deliveryType).toBeNull();
    });
  });

  describe('ngOnChanges / update', () => {
    beforeEach(() => component.assignSelectedLanguage());

    it('does not update in view mode', () => {
      component.mode = 'view';
      component.ngOnChanges();
      expect(doctor.updatePNCDetails).not.toHaveBeenCalled();
    });

    it('updates in update mode and marks pristine on success', () => {
      doctor.updatePNCDetails.and.returnValue(
        of({ statusCode: 200, data: { response: 'Saved' } }),
      );
      form.markAsDirty();
      component.mode = 'update';
      component.ngOnChanges();
      expect(doctor.updatePNCDetails).toHaveBeenCalledWith(form, {
        beneficiaryRegID: '20',
        benVisitID: '10',
        providerServiceMapID: '3',
        modifiedBy: 'nurse',
        visitCode: '70',
      });
      expect(confirm.alert).toHaveBeenCalledWith('Saved', 'success');
      expect(form.pristine).toBeTrue();
    });

    it('alerts on non-200 update', () => {
      doctor.updatePNCDetails.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'bad', data: null }),
      );
      component.updatePatientPNC(form);
      expect(confirm.alert).toHaveBeenCalledWith('bad', 'error');
    });

    it('alerts on update error', () => {
      doctor.updatePNCDetails.and.returnValue(throwingObs('e'));
      component.updatePatientPNC(form);
      expect(confirm.alert).toHaveBeenCalledWith('e', 'error');
    });
  });

  describe('checkWeight', () => {
    beforeEach(() => component.assignSelectedLanguage());

    [400, 7000].forEach((w) => {
      it(`alerts for out-of-range weight ${w}`, () => {
        form.patchValue({ birthWeightOfNewborn: w });
        component.checkWeight();
        expect(confirm.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.alerts.info.recheckValue,
        );
      });
    });

    it('does not alert for normal weight', () => {
      form.patchValue({ birthWeightOfNewborn: 3000 });
      component.checkWeight();
      expect(confirm.alert).not.toHaveBeenCalled();
    });
  });

  describe('resetOtherPlaceOfDelivery', () => {
    beforeEach(() => {
      component.masterData = MASTER;
      form.patchValue({ otherDeliveryPlace: 'x', deliveryType: 'y' });
    });

    ['Home-Supervised', 'Home-Unsupervised'].forEach((place) => {
      it(`limits to normal delivery for ${place}`, () => {
        form.patchValue({ deliveryPlace: { deliveryPlace: place } });
        component.resetOtherPlaceOfDelivery();
        expect(component.selectDeliveryTypes).toEqual([
          { deliveryType: 'Normal Delivery' },
        ]);
        expect(form.value.otherDeliveryPlace).toBeNull();
        expect(form.value.deliveryType).toBeNull();
      });
    });

    ['Subcentre', 'PHC'].forEach((place) => {
      it(`excludes LSCS for ${place}`, () => {
        form.patchValue({ deliveryPlace: { deliveryPlace: place } });
        component.resetOtherPlaceOfDelivery();
        expect(component.selectDeliveryTypes.length).toBe(2);
        expect(
          component.selectDeliveryTypes.map((d: any) => d.deliveryType),
        ).not.toContain('Cesarean Section (LSCS)');
      });
    });

    it('allows all types for other places', () => {
      form.patchValue({
        deliveryPlace: { deliveryPlace: 'District Hospital' },
      });
      component.resetOtherPlaceOfDelivery();
      expect(component.selectDeliveryTypes).toBe(MASTER.deliveryTypes);
    });
  });

  it('reset helpers clear "other" complication fields and getters read values', () => {
    form.patchValue({
      deliveryComplication: 'Other',
      otherDeliveryComplication: 'abc',
      postNatalComplication: 'Other',
      otherPostNatalComplication: 'def',
    });
    expect(component.deliveryComplication).toBe('Other');
    expect(component.otherDeliveryComplication).toBe('abc');
    expect(component.postNatalComplication).toBe('Other');
    expect(component.otherPostNatalComplication).toBe('def');
    component.resetOtherDeliveryComplication();
    component.resetOtherPostNatalComplication();
    expect(component.otherDeliveryComplication).toBeNull();
    expect(component.otherPostNatalComplication).toBeNull();
  });

  it('re-assigns the language set on ngDoCheck', () => {
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });
});
