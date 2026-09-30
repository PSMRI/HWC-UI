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
import { MaterialModule } from 'src/app/app-modules/core/material.module';
import { BeneficiaryDetailsService } from '../../../core/services/beneficiary-details.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { DoctorService, MasterdataService } from '../../shared/services';
import { GeneralUtils } from '../../shared/utility';
import { NeonatalImmunizationServiceComponent } from './neonatal-immunization-service.component';

const NEONATAL = 'Neonatal and Infant Health Care Services';
const CHILD = 'Childhood & Adolescent Healthcare Services';
const SESSION = {
  serviceLineDetails: JSON.stringify({ facilityID: 1, parkingPlaceID: 2 }),
};

const SERVICES = [
  { id: 1, name: 'Birth' },
  { id: 2, name: '6 weeks' },
  { id: 3, name: '14 weeks' },
  { id: 6, name: 'Missed vaccine' },
];
const TYPES = [
  { id: 1, name: 'Regular' },
  { id: 2, name: 'Catch up' },
];
const VACCINE_LIST = [
  {
    vaccine: 'BCG',
    dose: [{ dose: '0.05 ml' }],
    route: [{ route: 'Intradermal' }],
    siteOfInjection: [{ siteofinjection: 'Left arm' }],
  },
  {
    vaccine: 'OPV-0',
    dose: [{ dose: '2 drops' }, { dose: '4 drops' }],
    route: [],
    siteOfInjection: [],
  },
];
const CAPTURED = {
  currentImmunizationServiceID: 1,
  currentImmunizationService: 'Birth',
  immunizationServicesTypeID: 1,
  immunizationServicesType: 'Regular',
  dateOfVisit: '2024-06-01',
  processed: 'N',
  deleted: false,
  beneficiaryRegID: 5,
  providerServiceMapID: 7,
  createdBy: 'nurse',
  vanID: 8,
  parkingPlaceID: 2,
  vaccines: [{ vaccineName: ' bcg ', batchNo: 'B1' }],
};

describe('NeonatalImmunizationServiceComponent', () => {
  let component: NeonatalImmunizationServiceComponent;
  let fixture: ComponentFixture<NeonatalImmunizationServiceComponent>;
  let doctor: any;
  let master: any;
  let confirm: any;
  let master$: BehaviorSubject<any>;
  let ben$: BehaviorSubject<any>;
  let form: FormGroup;

  const vaccines = () => form.get('vaccines') as FormArray;

  beforeEach(async () => {
    master$ = new BehaviorSubject<any>(null);
    ben$ = new BehaviorSubject<any>(null);
    doctor = autoSpy(DoctorService, { immunizationServiceFetchDetails: null });
    master = autoSpy(MasterdataService, {
      nurseMasterData$: master$.asObservable(),
    });
    master.getVaccineList.and.returnValue(
      of({ statusCode: 200, data: { vaccineList: VACCINE_LIST } }),
    );
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [NeonatalImmunizationServiceComponent],
      providers: [
        ...commonTestProviders({ session: SESSION }),
        { provide: DoctorService, useValue: doctor },
        { provide: MasterdataService, useValue: master },
        {
          provide: BeneficiaryDetailsService,
          useValue: { beneficiaryDetails$: ben$.asObservable() },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(NeonatalImmunizationServiceComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    form = new GeneralUtils(
      new FormBuilder(),
      createSessionStorageMock(SESSION) as any,
    ).createNeonatalImmunizationServiceForm();
    component.immunizationServicesForm = form;
    component.visitCategory = NEONATAL;
    spyOn(console, 'log');
  });

  function init(age = '0 years - 3 months') {
    ben$.next({ age });
    fixture.detectChanges();
    master$.next({
      m_currentimmunizationservice: SERVICES,
      m_immunizationservicestype: TYPES,
    });
  }

  describe('init', () => {
    it('should create and default visit date to today', () => {
      fixture.detectChanges();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(form.value.dateOfVisit).toBe(component.todayDate);
      expect(component.utils).toBeTruthy();
    });

    it('filters current immunization services by beneficiary age', () => {
      init();
      expect(component.beneficiaryAge).toBe('90 days');
      expect(component.typeOfImmunizationServiceList).toBe(TYPES);
      expect(
        component.currentImmunizationServiceList.map((s: any) => s.id),
      ).toEqual([1, 2, 6]);
    });

    it('uses whole years when months are zero', () => {
      init('1 years - 0 months');
      expect(component.beneficiaryAge).toBe('1 years');
      expect(component.currentImmunizationServiceList.length).toBe(4);
    });

    it('ignores incomplete master data', () => {
      fixture.detectChanges();
      master$.next({ m_currentimmunizationservice: SERVICES });
      expect(component.currentImmunizationServiceList).toEqual([]);
    });
  });

  describe('getAgeValue', () => {
    [
      [null, 0],
      ['5-6 years', 1800],
      ['1 years', 360],
      ['9-12 months', 270],
      ['16-24 months', 480],
      ['2 months', 60],
      ['6 weeks', 42],
      ['4 days', 4],
      ['x', 0],
      ['3 hours', 0],
    ].forEach(([input, expected]) => {
      it(`converts "${input}" to ${expected}`, () => {
        expect(component.getAgeValue(input)).toBe(expected as number);
      });
    });
  });

  describe('service type selection', () => {
    beforeEach(() => init());

    it('catch-up type shows only missed-vaccine services', () => {
      form.patchValue({
        currentImmunizationServiceID: 1,
        currentImmunizationService: 'Birth',
      });
      component.enableVaccineDetails = true;
      component.setImmunizationServiceType(2);
      expect(form.value.immunizationServicesType).toBe('Catch up');
      expect(form.value.currentImmunizationServiceID).toBeNull();
      expect(component.enableVaccineDetails).toBeFalse();
      expect(component.vaccineList).toEqual([]);
      expect(
        component.filteredImmunizationServiceList.map((s: any) => s.id),
      ).toEqual([6]);
    });

    it('regular type excludes the missed-vaccine service', () => {
      component.setImmunizationServiceType(1);
      expect(form.value.immunizationServicesType).toBe('Regular');
      expect(
        component.filteredImmunizationServiceList.map((s: any) => s.id),
      ).toEqual([1, 2]);
    });

    it('alerts when no regular vaccination is available', () => {
      component.currentImmunizationServiceList = [{ id: 1, name: 'Birth' }];
      component.filterCurrentImmunizationServiceType(2, false);
      expect(confirm.alert).toHaveBeenCalledWith(
        'No regular vaccination available for this age group',
      );
    });

    it('does not alert on fetch even when empty', () => {
      component.currentImmunizationServiceList = [];
      component.filterCurrentImmunizationServiceType(2, true);
      expect(confirm.alert).not.toHaveBeenCalled();
    });

    it('drops the last service for regular type when there is no missed-vaccine entry (current behaviour)', () => {
      component.currentImmunizationServiceList = [
        { id: 1, name: 'Birth' },
        { id: 2, name: '6 weeks' },
      ];
      component.filterCurrentImmunizationServiceType(1, false);
      expect(
        component.filteredImmunizationServiceList.map((s: any) => s.id),
      ).toEqual([1]);
    });

    it('setCurrentImmunizationService copies the name', () => {
      component.setCurrentImmunizationService(2);
      expect(form.value.currentImmunizationService).toBe('6 weeks');
    });
  });

  describe('getVaccineListOnSelectedService', () => {
    beforeEach(() => init());

    it('builds a vaccine row per vaccine', () => {
      component.getVaccineListOnSelectedService(1, 'Birth');
      expect(master.getVaccineList).toHaveBeenCalledWith(1);
      expect(component.enableVaccineDetails).toBeTrue();
      expect(component.vaccineList).toBe(VACCINE_LIST);
      expect(vaccines().length).toBe(2);
      expect(component.getVaccines().length).toBe(2);
    });

    it('ignores responses without a vaccine list', () => {
      master.getVaccineList.and.returnValue(of({ data: {} }));
      component.getVaccineListOnSelectedService(1, 'Birth');
      expect(component.enableVaccineDetails).toBeFalse();
    });

    it('alerts on error', () => {
      master.getVaccineList.and.returnValue(
        throwingObs({ errorMessage: 'down' }),
      );
      component.getVaccineListOnSelectedService(1, 'Birth');
      expect(confirm.alert).toHaveBeenCalledWith('down', 'err');
    });

    it('onValueChange never flags changes (compares function to string)', () => {
      component.visitCategory = CHILD;
      component.mode = 'view';
      component.onValueChange();
      expect(
        doctor.immunizationServiceChildhoodValueChanged,
      ).not.toHaveBeenCalled();
    });
  });

  describe('setVaccineName', () => {
    beforeEach(() => {
      init();
      component.getVaccineListOnSelectedService(1, 'Birth');
    });

    it('fills name and single-option defaults when given', () => {
      const v = vaccines().at(0);
      component.setVaccineName('Given', 0, v);
      expect(v.value).toEqual(
        jasmine.objectContaining({
          vaccineName: 'BCG',
          vaccineDose: '0.05 ml',
          route: 'Intradermal',
          siteOfInjection: 'Left arm',
        }),
      );
    });

    it('leaves multi-option fields empty', () => {
      const v = vaccines().at(1);
      component.setVaccineName('Given', 1, v);
      expect(v.value.vaccineName).toBe('OPV-0');
      expect(v.value.vaccineDose).toBeNull();
      expect(v.value.route).toBeNull();
    });

    it('resets details when not given', () => {
      const v = vaccines().at(0);
      component.setVaccineName('Given', 0, v);
      v.patchValue({ batchNo: 'X' });
      component.setVaccineName('Not Given', 0, v);
      expect(v.value).toEqual(
        jasmine.objectContaining({
          vaccineName: null,
          batchNo: null,
          vaccineDose: null,
          route: null,
          siteOfInjection: null,
        }),
      );
    });
  });

  describe('view mode fetch', () => {
    it('fetches neonatal data and patches vaccines and fields', () => {
      doctor.fetchImmunizationServiceDeatilsFromNurse.and.returnValue(
        of({ statusCode: 200, data: { immunizationServices: CAPTURED } }),
      );
      component.mode = 'view';
      init();
      expect(
        doctor.fetchImmunizationServiceDeatilsFromNurse,
      ).toHaveBeenCalled();
      expect(vaccines().at(0).value).toEqual(
        jasmine.objectContaining({
          vaccineName: ' bcg ',
          batchNo: 'B1',
          status: 'Given',
        }),
      );
      expect(form.value.currentImmunizationServiceID).toBe(1);
      expect(form.value.immunizationServicesType).toBe('Regular');
      expect(form.value.dateOfVisit).toEqual(new Date('2024-06-01'));
      expect(component.patchVaccineDetailsOnView).toBeFalse();
      expect(component.enableVaccineDetails).toBeTrue();
    });

    it('ignores neonatal fetch without services', () => {
      doctor.fetchImmunizationServiceDeatilsFromNurse.and.returnValue(
        of({ data: {} }),
      );
      component.mode = 'view';
      component.ngOnChanges();
      expect(master.getVaccineList).not.toHaveBeenCalled();
    });

    it('alerts on neonatal fetch error', () => {
      doctor.fetchImmunizationServiceDeatilsFromNurse.and.returnValue(
        throwingObs('e'),
      );
      component.mode = 'view';
      component.ngOnChanges();
      expect(confirm.alert).toHaveBeenCalledWith('e', 'error');
    });

    it('uses stored childhood data for child visits', () => {
      component.visitCategory = CHILD;
      component.mode = 'view';
      doctor.immunizationServiceFetchDetails = {
        immunizationServices: CAPTURED,
      };
      component.ngOnChanges();
      expect(
        doctor.fetchImmunizationServiceDeatilsFromNurse,
      ).not.toHaveBeenCalled();
      expect(master.getVaccineList).toHaveBeenCalledWith(1);
      expect(form.value.createdBy).toBe('nurse');
    });

    it('skips childhood patch when no stored data', () => {
      component.visitCategory = CHILD;
      component.mode = 'view';
      component.ngOnChanges();
      expect(master.getVaccineList).not.toHaveBeenCalled();
    });

    it('viewImmunizationServices patches fields even with an empty vaccine list', () => {
      component.capturedImmunizationService = CAPTURED;
      component.vaccineList = [];
      component.viewImmunizationServices();
      expect(form.value.vanID).toBeUndefined();
      expect(form.value.beneficiaryRegID).toBe(5);
    });

    it('viewImmunizationServices patches a vaccine row whose name matches', () => {
      component.capturedImmunizationService = CAPTURED;
      component.vaccineList = [{ vaccine: 'undefined' }];
      component.currentVaccineTaken = [
        { vaccineName: 'undefined', batchNo: 'Z' },
      ];
      component.viewImmunizationServices();
      expect(vaccines().at(0).value.batchNo).toBe('Z');
    });
  });

  describe('update mode', () => {
    it('updates neonatal services and marks pristine', () => {
      doctor.updateImmunizationServices.and.returnValue(
        of({ statusCode: 200, data: { response: 'ok' } }),
      );
      form.markAsDirty();
      component.mode = 'update';
      component.ngOnChanges();
      expect(doctor.updateImmunizationServices).toHaveBeenCalledWith(form);
      expect(confirm.alert).toHaveBeenCalledWith('ok', 'success');
      expect(form.pristine).toBeTrue();
    });

    it('alerts on non-200', () => {
      doctor.updateImmunizationServices.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'bad', data: null }),
      );
      component.updateImmunizationServiceFromDoctor(form);
      expect(confirm.alert).toHaveBeenCalledWith('bad', 'error');
    });

    it('alerts on error', () => {
      doctor.updateImmunizationServices.and.returnValue(throwingObs('e'));
      component.updateImmunizationServiceFromDoctor(form);
      expect(confirm.alert).toHaveBeenCalledWith('e', 'error');
    });

    it('does not update child visits', () => {
      component.visitCategory = CHILD;
      component.updateImmunizationServiceFromDoctor(form);
      expect(doctor.updateImmunizationServices).not.toHaveBeenCalled();
    });
  });

  it('ngOnDestroy empties vaccines, resets and unsubscribes', () => {
    init();
    const subs = [
      component.nurseMasterDataSubscription,
      component.beneficiaryDetailsSubscription,
    ];
    component.ngOnDestroy();
    expect(vaccines().length).toBe(0);
    expect(form.value.dateOfVisit).toBeNull();
    subs.forEach((s) => expect(s.closed).toBeTrue());
  });

  it('ngOnDestroy works without subscriptions', () => {
    component.ngOnDestroy();
    expect(vaccines().length).toBe(0);
  });

  it('re-assigns the language set on ngDoCheck', () => {
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });
});
