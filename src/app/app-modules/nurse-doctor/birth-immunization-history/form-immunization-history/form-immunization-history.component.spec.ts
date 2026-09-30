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
import { MatDialog } from '@angular/material/dialog';
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
import { PreviousImmunizationServiceDetailsComponent } from 'src/app/app-modules/core/components/previous-immunization-service-details/previous-immunization-service-details.component';
import {
  BeneficiaryDetailsService,
  ConfirmationService,
} from 'src/app/app-modules/core/services';
import { NurseService } from '../../shared/services/nurse.service';
import { DoctorService, MasterdataService } from '../../shared/services';
import { GeneralUtils } from '../../shared/utility/general-utility';
import { FormImmunizationHistoryComponent } from './form-immunization-history.component';

const VACCINES = [
  {
    vaccinationTime: 'Birth',
    vaccineName: 'BCG',
    sctCode: '1',
    sctTerm: 'bcg',
  },
  {
    vaccinationTime: '6 weeks',
    vaccineName: 'OPV-1',
    sctCode: null,
    sctTerm: null,
  },
  {
    vaccinationTime: '6 weeks',
    vaccineName: 'Penta-1',
    sctCode: '2',
    sctTerm: 'p',
  },
  {
    vaccinationTime: '9 months',
    vaccineName: 'MR-1',
    sctCode: null,
    sctTerm: null,
  },
  {
    vaccinationTime: '16-24 months',
    vaccineName: 'MR-2',
    sctCode: null,
    sctTerm: null,
  },
  {
    vaccinationTime: '5 years',
    vaccineName: 'DPT',
    sctCode: null,
    sctTerm: null,
  },
];

const RECEIVED_AT = [
  { id: 1, name: 'PHC' },
  { id: 2, name: 'Private' },
];

describe('FormImmunizationHistoryComponent', () => {
  let component: FormImmunizationHistoryComponent;
  let fixture: ComponentFixture<FormImmunizationHistoryComponent>;
  let doctor: any;
  let nurse: any;
  let confirm: any;
  let dialog: any;
  let session: any;
  let route: any;
  let form: FormGroup;
  let master$: BehaviorSubject<any>;
  let ben$: BehaviorSubject<any>;
  let fetch$: BehaviorSubject<boolean>;
  let prev$: BehaviorSubject<any>;

  const list = () => form.get('immunizationList') as FormArray;

  const savedHistory = () => ({
    immunizationList: [
      {
        defaultReceivingAge: 'Birth',
        vaccinationReceivedAt: 'Private',
        vaccines: [{ vaccine: 'BCG', status: true }],
      },
      {
        defaultReceivingAge: '6 weeks',
        vaccinationReceivedAt: null,
        vaccines: [
          { vaccine: 'OPV-1', status: false },
          { vaccine: 'Penta-1', status: false },
        ],
      },
    ],
  });

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
    nurse = autoSpy(NurseService);
    route = { snapshot: { params: { attendant: 'doctor' } } };
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [FormImmunizationHistoryComponent],
      providers: [
        ...commonTestProviders({ session: { beneficiaryRegID: '44' } }),
        { provide: DoctorService, useValue: doctor },
        { provide: NurseService, useValue: nurse },
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

    fixture = TestBed.createComponent(FormImmunizationHistoryComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    session = TestBed.inject(SessionStorageService);
    form = new GeneralUtils(
      new FormBuilder(),
      createSessionStorageMock() as any,
    ).createImmunizationHistoryForm();
    component.neonatalImmunizationHistoryForm = form;
    spyOn(console, 'log');
  });

  function loadMasters(age = '0 years - 3 months') {
    ben$.next({ age });
    fixture.detectChanges();
    master$.next({
      childVaccinations: VACCINES,
      m_birthdosevaccinationreceivedat: RECEIVED_AT,
    });
  }

  describe('master data and schedule', () => {
    it('should create with the language set', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(list().length).toBe(0);
    });

    it('builds the immunization schedule up to the beneficiary age', () => {
      loadMasters();
      expect(component.beneficiaryAge).toBe('90 days');
      expect(component.vaccineReceivedList).toBe(RECEIVED_AT);
      expect(component.temp.map((t: any) => t.defaultReceivingAge)).toEqual([
        'Birth',
        '6 weeks',
      ]);
      expect(component.temp[0].vaccines).toEqual([
        { vaccine: 'BCG', sctCode: '1', sctTerm: 'bcg', status: null },
      ]);
      expect(component.temp[1].vaccines[0].sctCode).toBeNull();
      expect(list().length).toBe(2);
      expect((list().at(1).get('vaccines') as FormArray).length).toBe(2);
      expect(component.getimmunizationList().length).toBe(2);
      expect(
        Object.keys(component.getVaccines(list().at(1) as FormGroup)).length,
      ).toBe(2);
    });

    it('uses whole years when months are zero', () => {
      loadMasters('2 years - 0 months');
      expect(component.beneficiaryAge).toBe('2 years');
      expect(component.temp.map((t: any) => t.defaultReceivingAge)).toEqual([
        'Birth',
        '6 weeks',
        '16-24 months',
      ]);
    });

    it('ignores master data without child vaccinations', () => {
      fixture.detectChanges();
      master$.next({ m_birthdosevaccinationreceivedat: RECEIVED_AT });
      expect(component.masterData).toBeUndefined();
    });

    it('ignores beneficiaries without age', () => {
      fixture.detectChanges();
      component.getBeneficiaryDetails();
      ben$.next({ age: null });
      expect(component.beneficiaryAge).toBeUndefined();
    });
  });

  describe('getAgeValue', () => {
    [
      [null, 0],
      ['Birth', 0],
      ['5-6 years', 1800],
      ['2 years', 720],
      ['9-12 months', 270],
      ['16-24 months', 480],
      ['3 months', 90],
      ['6 weeks', 42],
      ['10 days', 10],
      ['3 decades', 0],
    ].forEach(([input, expected]) => {
      it(`converts "${input}" to ${expected} days`, () => {
        expect(component.getAgeValue(input)).toBe(expected as number);
      });
    });
  });

  describe('nurse / previous data', () => {
    it('patches nurse data in view mode and enables received-at', () => {
      component.immunizationHistoryMode = 'view';
      doctor.birthAndImmunizationDetailsFromNurse = {
        immunizationHistory: savedHistory(),
      };
      loadMasters();
      const first = list().at(0).value;
      expect(first.vaccinationReceivedAtID).toBe(2);
      expect(first.enableVaccinationReceivedAt).toBeTrue();
      expect(list().at(1).value.enableVaccinationReceivedAt).toBeNull();
      expect(doctor.BirthAndImmunizationValueChanged).toHaveBeenCalledWith(
        true,
      );
    });

    it('patches nurse data for specialist flag 100', () => {
      session.setItem('specialistFlag', '100');
      doctor.birthAndImmunizationDetailsFromNurse = {
        immunizationHistory: savedHistory(),
      };
      loadMasters();
      expect(list().at(0).value.vaccinationReceivedAtID).toBe(2);
    });

    it('patches nurse data when the fetch flag fires', () => {
      loadMasters();
      doctor.birthAndImmunizationDetailsFromNurse = {
        immunizationHistory: savedHistory(),
      };
      fetch$.next(true);
      expect(list().at(0).value.vaccines[0].status).toBeTrue();
    });

    it('skips nurse data without an immunization list', () => {
      loadMasters();
      doctor.birthAndImmunizationDetailsFromNurse = { immunizationHistory: {} };
      component.getNurseFetchDetails();
      expect(list().at(0).value.vaccinationReceivedAtID).toBeNull();
    });

    it('patches previous visit data for nurses', () => {
      route.snapshot.params.attendant = 'nurse';
      prev$.next({ immunizationHistory: savedHistory() });
      loadMasters();
      expect(list().at(0).value.vaccinationReceivedAtID).toBe(2);
      expect(list().at(0).value.enableVaccinationReceivedAt).toBeTrue();
    });

    it('ignores previous visit data without a list', () => {
      route.snapshot.params.attendant = 'nurse';
      prev$.next({ immunizationHistory: {} });
      loadMasters();
      expect(component.infantAndBirthHistoryDetailsSubscription).toBeDefined();
      expect(list().at(0).value.vaccinationReceivedAtID).toBeNull();
    });
  });

  describe('received-at handling', () => {
    beforeEach(() => loadMasters());

    it('setVaccineReceivedAt copies the selected place name', () => {
      component.immunizationHistoryMode = 'update';
      list().at(0).patchValue({ vaccinationReceivedAtID: 1 });
      component.setVaccineReceivedAt(0);
      expect(list().at(0).value.vaccinationReceivedAt).toBe('PHC');
      expect(doctor.BirthAndImmunizationValueChanged).toHaveBeenCalledWith(
        true,
      );
    });

    it('setVaccineReceivedAt does not flag changes in a new visit', () => {
      component.setVaccineReceivedAt(0);
      expect(doctor.BirthAndImmunizationValueChanged).not.toHaveBeenCalled();
    });

    it('enableReceivedAt enables when any vaccine is received', () => {
      (list().at(0).get('vaccines') as FormArray)
        .at(0)
        .patchValue({ status: true });
      component.enableReceivedAt(0);
      expect(list().at(0).value.enableVaccinationReceivedAt).toBeTrue();
    });

    it('enableReceivedAt nulls the enable flag (and leaves received-at) when none received', () => {
      list().at(0).patchValue({
        enableVaccinationReceivedAt: true,
        vaccinationReceivedAtID: 1,
        vaccinationReceivedAt: 'PHC',
      });
      component.enableReceivedAt(0);
      const v = list().at(0).value;
      expect(v.enableVaccinationReceivedAt).toBeNull();
      expect(v.vaccinationReceivedAtID).toBe(1);
      expect(v.vaccinationReceivedAt).toBe('PHC');
    });
  });

  describe('previous immunization services history', () => {
    beforeEach(() => component.assignSelectedLanguage());

    it('opens the dialog when data exists', () => {
      nurse.getPreviousImmunizationServicesData.and.returnValue(
        of({ statusCode: 200, data: [{ a: 1 }] }),
      );
      component.getPreviousImmunizationServicesHistory();
      expect(nurse.getPreviousImmunizationServicesData).toHaveBeenCalledWith(
        '44',
      );
      expect(dialog.open).toHaveBeenCalledWith(
        PreviousImmunizationServiceDetailsComponent,
        {
          data: {
            dataList: [{ a: 1 }],
            title: LANGUAGE_EN.previousImmunizationServicesDetails,
          },
        },
      );
    });

    it('alerts when there is no history', () => {
      nurse.getPreviousImmunizationServicesData.and.returnValue(
        of({ statusCode: 200, data: [] }),
      );
      component.getPreviousImmunizationServicesHistory();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.historyData.ancHistory.previousHistoryDetails
          .pastHistoryalert,
      );
    });

    it('alerts on null data', () => {
      nurse.getPreviousImmunizationServicesData.and.returnValue(
        of({ statusCode: 5000, data: null }),
      );
      component.getPreviousImmunizationServicesHistory();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.errorFetchingHistory,
        'error',
      );
    });

    it('alerts on error', () => {
      nurse.getPreviousImmunizationServicesData.and.returnValue(throwingObs());
      component.getPreviousImmunizationServicesHistory();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.errorFetchingHistory,
        'error',
      );
    });
  });

  it('ngOnDestroy clears the list, resets and unsubscribes', () => {
    route.snapshot.params.attendant = 'nurse';
    loadMasters();
    const subs = [
      component.nurseMasterDataSubscription,
      component.beneficiaryDetailSubscription,
      component.infantAndBirthHistoryDetailsSubscription!,
    ];
    component.ngOnDestroy();
    expect(list().length).toBe(0);
    expect(component.vaccineReceivedList).toEqual([]);
    subs.forEach((s) => expect(s.closed).toBeTrue());
  });

  it('ngOnDestroy works without subscriptions', () => {
    component.ngOnDestroy();
    expect(list().length).toBe(0);
  });

  it('ngOnChanges logs and ngDoCheck re-assigns language', () => {
    component.ngOnChanges();
    expect(console.log).toHaveBeenCalledWith('success');
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });
});
