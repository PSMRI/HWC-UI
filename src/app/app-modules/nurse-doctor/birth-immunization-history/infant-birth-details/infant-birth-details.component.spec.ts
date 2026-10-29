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
import { BehaviorSubject } from 'rxjs';

import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  createSessionStorageMock,
} from 'src/testing/test-utils';
import { MaterialModule } from 'src/app/app-modules/core/material.module';
import {
  BeneficiaryDetailsService,
  ConfirmationService,
} from 'src/app/app-modules/core/services';
import { DoctorService, MasterdataService } from '../../shared/services';
import { GeneralUtils } from '../../shared/utility/general-utility';
import { InfantBirthDetailsComponent } from './infant-birth-details.component';

const MASTER = {
  deliveryPlaces: [
    { deliveryPlaceID: 1, deliveryPlace: 'Home-Supervised' },
    { deliveryPlaceID: 2, deliveryPlace: 'PHC' },
    { deliveryPlaceID: 3, deliveryPlace: 'Other' },
    { deliveryPlaceID: 4, deliveryPlace: 'District Hospital' },
  ],
  deliveryTypes: [
    { deliveryTypeID: 1, deliveryType: 'Normal Delivery' },
    { deliveryTypeID: 2, deliveryType: 'Cesarean Section (LSCS)' },
    { deliveryTypeID: 3, deliveryType: 'Assisted Delivery' },
  ],
  birthComplications: [
    { complicationID: 1, complicationValue: 'None' },
    { complicationID: 2, complicationValue: 'Other' },
  ],
  gestation: [{ gestationID: 1, name: 'Term' }],
  deliveryConductedByMaster: [
    { deliveryConductedByID: 1, deliveryConductedBy: 'Doctor' },
  ],
  m_congenitalanomalies: ['Cleft lip'],
};

const INFANT = {
  id: 7,
  deliveryPlaceID: 3,
  otherDeliveryPlace: 'Car',
  birthComplicationID: 2,
  otherDeliveryComplication: 'x',
  dateOfBirth: '2024-01-01',
  dateOfUpdatingBirthDetails: '2024-01-05',
  birthWeightOfNewborn: 2800,
};

describe('InfantBirthDetailsComponent', () => {
  let component: InfantBirthDetailsComponent;
  let fixture: ComponentFixture<InfantBirthDetailsComponent>;
  let doctor: any;
  let confirm: any;
  let route: any;
  let form: FormGroup;
  let master$: BehaviorSubject<any>;
  let ben$: BehaviorSubject<any>;
  let fetch$: BehaviorSubject<boolean>;
  let prev$: BehaviorSubject<any>;

  beforeEach(async () => {
    master$ = new BehaviorSubject<any>(null);
    ben$ = new BehaviorSubject<any>(null);
    fetch$ = new BehaviorSubject<boolean>(false);
    prev$ = new BehaviorSubject<any>(null);
    doctor = autoSpy(DoctorService, {
      birthAndImmunizationDetailsFromNurse: null,
      fetchInfantDataCheck$: fetch$.asObservable(),
      infantAndImmunizationData$: prev$.asObservable(),
    });
    route = { snapshot: { params: { attendant: 'doctor' } } };
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [InfantBirthDetailsComponent],
      providers: [
        ...commonTestProviders(),
        { provide: DoctorService, useValue: doctor },
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

    fixture = TestBed.createComponent(InfantBirthDetailsComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    form = new GeneralUtils(
      new FormBuilder(),
      createSessionStorageMock() as any,
    ).createInfantBirthDetailsForm();
    component.infantBirthDetailsForm = form;
    component.visitCategory = 'Neonatal and Infant Health Care Services';
    spyOn(console, 'log');
  });

  function expectPatched() {
    expect(form.value.deliveryPlace).toBe('Other');
    expect(component.enableOtherDeliveryPlace).toBeTrue();
    expect(form.value.otherDeliveryPlace).toBe('Car');
    expect(form.value.birthComplication).toBe('Other');
    expect(component.enableOtherBirthComplication).toBeTrue();
    expect(form.value.dateOfBirth).toEqual(new Date('2024-01-01'));
  }

  describe('init', () => {
    it('should create and log missing master data', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(doctor.setInfantDataFetch).toHaveBeenCalledWith(false);
      expect(console.log).toHaveBeenCalledWith(
        'Error in fetching nurse master data details',
      );
    });

    it('loads master lists', () => {
      fixture.detectChanges();
      master$.next(MASTER);
      expect(component.deliveryPlaceList).toBe(MASTER.deliveryPlaces);
      expect(component.deliveryTypeList).toBe(MASTER.deliveryTypes);
      expect(component.placeOfDelivery).toBe(MASTER.deliveryTypes);
      expect(component.birthComplicationList).toBe(MASTER.birthComplications);
      expect(component.gestationList).toBe(MASTER.gestation);
      expect(component.deliveryConductedByList).toBe(
        MASTER.deliveryConductedByMaster,
      );
      expect(component.congenitalAnomaliesList).toEqual(['Cleft lip']);
    });

    it('patches nurse data in view mode', () => {
      component.immunizationHistoryMode = 'view';
      doctor.birthAndImmunizationDetailsFromNurse = {
        infantBirthDetails: INFANT,
      };
      fixture.detectChanges();
      master$.next(MASTER);
      expectPatched();
      expect(form.value.id).toBe(7);
    });

    it('patches previous visit data for nurses and clears id', () => {
      route.snapshot.params.attendant = 'nurse';
      prev$.next({ infantBirthDetails: INFANT });
      fixture.detectChanges();
      master$.next(MASTER);
      expectPatched();
      expect(form.value.id).toBeNull();
    });

    it('logs when previous visit data is missing', () => {
      route.snapshot.params.attendant = 'nurse';
      fixture.detectChanges();
      master$.next(MASTER);
      expect(console.log).toHaveBeenCalledWith(
        'Error in fetching previous infant birth details',
      );
    });

    it('patches nurse data when the fetch flag fires, or logs if absent', () => {
      fixture.detectChanges();
      master$.next(MASTER);
      fetch$.next(true);
      expect(console.log).toHaveBeenCalledWith(
        'Error in fetching nurse details',
      );
      doctor.birthAndImmunizationDetailsFromNurse = {
        infantBirthDetails: INFANT,
      };
      fetch$.next(true);
      expectPatched();
    });

    it('patches date of birth from beneficiary details', () => {
      fixture.detectChanges();
      ben$.next({ dOB: '2024-03-03' });
      expect(component.benBirthDetails).toEqual(new Date('2024-03-03'));
      expect(form.value.dateOfBirth).toEqual(new Date('2024-03-03'));
    });

    it('ngOnChanges only logs', () => {
      component.ngOnChanges();
      expect(console.log).toHaveBeenCalledWith('success');
    });
  });

  describe('lookup helpers', () => {
    beforeEach(() => {
      fixture.detectChanges();
      master$.next(MASTER);
    });

    it('getDeliveryType copies the delivery type name', () => {
      component.immunizationHistoryMode = 'view';
      form.patchValue({ deliveryTypeID: 3 });
      component.getDeliveryType();
      expect(form.value.deliveryType).toBe('Assisted Delivery');
      expect(doctor.BirthAndImmunizationValueChanged).toHaveBeenCalledWith(
        true,
      );
    });

    it('getGestation copies the gestation name', () => {
      form.patchValue({ gestationID: 1 });
      component.getGestation();
      expect(form.value.gestation).toBe('Term');
      expect(doctor.BirthAndImmunizationValueChanged).not.toHaveBeenCalled();
    });

    it('getDeliveryConductedBy copies the name', () => {
      component.immunizationHistoryMode = 'update';
      form.patchValue({ deliveryConductedByID: 1 });
      component.getDeliveryConductedBy();
      expect(form.value.deliveryConductedBy).toBe('Doctor');
      expect(doctor.BirthAndImmunizationValueChanged).toHaveBeenCalled();
    });

    it('otherPlaceOfDelivery limits to normal delivery for home and resets when fetching', () => {
      form.patchValue({
        deliveryPlaceID: 1,
        deliveryTypeID: 2,
        deliveryType: 'x',
        otherDeliveryPlace: 'y',
      });
      component.otherPlaceOfDelivery(true);
      expect(form.value.deliveryTypeID).toBeNull();
      expect(form.value.deliveryPlace).toBe('Home-Supervised');
      expect(component.deliveryTypeList).toEqual([MASTER.deliveryTypes[0]]);
      expect(component.enableOtherDeliveryPlace).toBeFalse();
      expect(form.value.otherDeliveryPlace).toBeNull();
    });

    it('otherPlaceOfDelivery excludes LSCS for PHC', () => {
      form.patchValue({ deliveryPlaceID: 2 });
      component.immunizationHistoryMode = 'view';
      component.otherPlaceOfDelivery(false);
      expect(component.deliveryTypeList.length).toBe(2);
      expect(doctor.BirthAndImmunizationValueChanged).toHaveBeenCalledWith(
        true,
      );
    });

    it('otherPlaceOfDelivery allows all types for hospitals', () => {
      form.patchValue({ deliveryPlaceID: 4 });
      component.otherPlaceOfDelivery(false);
      expect(component.deliveryTypeList).toBe(MASTER.deliveryTypes);
    });

    it('otherBirthComplication resets other text for non-Other values', () => {
      form.patchValue({
        birthComplicationID: 1,
        otherDeliveryComplication: 'z',
      });
      component.immunizationHistoryMode = 'update';
      component.otherBirthComplication();
      expect(form.value.birthComplication).toBe('None');
      expect(component.enableOtherBirthComplication).toBeFalse();
      expect(form.value.otherDeliveryComplication).toBeNull();
    });
  });

  describe('checkNewBornWeight', () => {
    beforeEach(() => component.assignSelectedLanguage());

    it('alerts below 500g', () => {
      form.patchValue({ birthWeightOfNewborn: 400 });
      component.immunizationHistoryMode = 'view';
      component.checkNewBornWeight();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.recheckValue,
      );
      expect(doctor.BirthAndImmunizationValueChanged).toHaveBeenCalledWith(
        true,
      );
    });

    it('does not alert for normal or missing weight', () => {
      component.checkNewBornWeight();
      form.patchValue({ birthWeightOfNewborn: 3000 });
      component.checkNewBornWeight();
      expect(confirm.alert).not.toHaveBeenCalled();
    });
  });

  it('onValueChange flags only in view/update', () => {
    component.onValueChange();
    expect(doctor.BirthAndImmunizationValueChanged).not.toHaveBeenCalled();
    component.immunizationHistoryMode = 'update';
    component.onValueChange();
    expect(doctor.BirthAndImmunizationValueChanged).toHaveBeenCalledWith(true);
  });

  it('ngOnDestroy resets the form and unsubscribes', () => {
    route.snapshot.params.attendant = 'nurse';
    fixture.detectChanges();
    master$.next(MASTER);
    const subs = [
      component.masterDataSubscription,
      component.infantAndBirthHistoryDetailsSubscription,
      component.beneficiaryDetailsSubscription,
    ];
    form.patchValue({ id: 3 });
    component.ngOnDestroy();
    expect(form.value.id).toBeNull();
    subs.forEach((s) => expect(s.closed).toBeTrue());
  });

  it('ngOnDestroy works without subscriptions', () => {
    form.patchValue({ id: 3 });
    component.ngOnDestroy();
    expect(form.value.id).toBeNull();
  });

  it('re-assigns the language set on ngDoCheck', () => {
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });
});
