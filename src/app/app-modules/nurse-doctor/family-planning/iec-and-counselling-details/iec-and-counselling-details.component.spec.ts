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
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';
import { MaterialModule } from 'src/app/app-modules/core/material.module';
import { DoctorService } from '../../shared/services/doctor.service';
import { MasterdataService } from '../../shared/services/masterdata.service';
import { FamilyPlanningUtils } from '../../shared/utility/family-planning-utlity';
import { IecAndCounsellingComponent } from './iec-and-counselling-details.component';

describe('IecAndCounsellingComponent', () => {
  let component: IecAndCounsellingComponent;
  let fixture: ComponentFixture<IecAndCounsellingComponent>;
  let doctor: any;
  let session: any;
  let route: any;
  let form: FormGroup;
  let master$: BehaviorSubject<any>;
  let fetch$: BehaviorSubject<boolean>;
  let revisit$: BehaviorSubject<any>;

  const IEC = {
    counselledOn: ['Other'],
    otherCounselledOn: 'Diet',
    typeOfContraceptiveOpted: ['Other'],
    otherTypeOfContraceptiveOpted: 'Herbal',
    id: 9,
  };

  beforeEach(async () => {
    master$ = new BehaviorSubject<any>(null);
    fetch$ = new BehaviorSubject<boolean>(false);
    revisit$ = new BehaviorSubject<any>(null);
    doctor = autoSpy(DoctorService, {
      familyPlanningDetailsResponseFromNurse: null,
      fetchFamilyDataCheck$: fetch$.asObservable(),
      benFamilyPlanningDetails$: revisit$.asObservable(),
    });
    route = { snapshot: { params: { attendant: 'doctor' } } };
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [IecAndCounsellingComponent],
      providers: [
        ...commonTestProviders(),
        { provide: DoctorService, useValue: doctor },
        { provide: ActivatedRoute, useValue: route },
        {
          provide: MasterdataService,
          useValue: { nurseMasterData$: master$.asObservable() },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(IecAndCounsellingComponent);
    component = fixture.componentInstance;
    session = TestBed.inject(SessionStorageService);
    form = new FamilyPlanningUtils(
      new FormBuilder(),
    ).createIecCounsellingDetails();
    component.IecCounsellingForm = form;
    spyOn(console, 'log');
  });

  describe('init', () => {
    it('should create and reset the family data flag', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
      expect(doctor.setFamilyDataFetch).toHaveBeenCalledWith(false);
      expect(component.attendant).toBe('doctor');
      expect(console.log).toHaveBeenCalledWith(
        'Error in fetching nurse master data details',
      );
    });

    it('loads masters and patches nurse data in view mode', () => {
      component.familyPlanningMode = 'view';
      fixture.detectChanges();
      doctor.familyPlanningDetailsResponseFromNurse = {
        iecAndCounsellingDetails: IEC,
      };
      master$.next({ m_FPCounselledOn: ['a'], m_fpmethodfollowup: ['b'] });
      expect(component.selectCounselling).toEqual(['a']);
      expect(component.selectContraceptive).toEqual(['b']);
      expect(form.value.otherCounselledOn).toBe('Diet');
      expect(component.enableCounselledOnOther).toBeTrue();
      expect(component.enablecontraceptiveOptedForOther).toBeTrue();
      expect(component.disableNoneOption).toBeTrue();
    });

    it('loads masters without patching outside view mode', () => {
      fixture.detectChanges();
      doctor.familyPlanningDetailsResponseFromNurse = {
        iecAndCounsellingDetails: IEC,
      };
      master$.next({ m_FPCounselledOn: ['a'], m_fpmethodfollowup: [] });
      expect(form.value.counselledOn).toBeNull();
    });

    it('patches nurse data when the fetch flag fires', () => {
      fixture.detectChanges();
      doctor.familyPlanningDetailsResponseFromNurse = {
        iecAndCounsellingDetails: { ...IEC, counselledOn: ['Spacing'] },
      };
      fetch$.next(true);
      expect(form.value.counselledOn).toEqual(['Spacing']);
      expect(component.enableCounselledOnOther).toBeFalse();
      expect(form.value.otherCounselledOn).toBeNull();
    });
  });

  it('getters read form values', () => {
    form.patchValue(IEC);
    expect(component.counselledOn).toEqual(['Other']);
    expect(component.otherCounselledOn).toBe('Diet');
    expect(component.typeOfContraceptiveOpted).toEqual(['Other']);
    expect(component.otherTypeOfContraceptiveOpted).toBe('Herbal');
  });

  describe('resetOtherContraceptiveValues', () => {
    it('disables other options when None is selected (view mode marks change)', () => {
      component.familyPlanningMode = 'view';
      component.resetOtherContraceptiveValues(['None']);
      expect(component.disableAllOptions).toBeTrue();
      expect(component.disableNoneOption).toBeFalse();
      expect(doctor.familyPlanningValueChanged).toHaveBeenCalledWith(true);
    });

    it('disables None when other options are selected', () => {
      component.resetOtherContraceptiveValues(['Condom']);
      expect(component.disableNoneOption).toBeTrue();
      expect(component.disableAllOptions).toBeFalse();
      expect(doctor.familyPlanningValueChanged).not.toHaveBeenCalled();
    });

    it('enables everything for an empty selection', () => {
      component.disableAllOptions = true;
      component.resetOtherContraceptiveValues([]);
      expect(component.disableAllOptions).toBeFalse();
      expect(component.disableNoneOption).toBeFalse();
    });

    it('ignores null selection', () => {
      component.disableAllOptions = true;
      component.resetOtherContraceptiveValues(null);
      expect(component.disableAllOptions).toBeTrue();
    });
  });

  describe('value change helpers', () => {
    ['view', 'update'].forEach((mode) => {
      it(`flag family planning changes in ${mode} mode`, () => {
        component.familyPlanningMode = mode;
        component.onValueChange();
        component.counselledOnOther();
        component.typeOfContraceptiveOptedForOther();
        expect(doctor.familyPlanningValueChanged).toHaveBeenCalledTimes(3);
      });
    });

    it('do not flag changes in a new visit', () => {
      component.familyPlanningMode = 'new';
      component.onValueChange();
      component.counselledOnOther();
      component.typeOfContraceptiveOptedForOther();
      expect(doctor.familyPlanningValueChanged).not.toHaveBeenCalled();
    });

    it('typeOfContraceptiveOptedForOther resets other value when not Other', () => {
      form.patchValue({
        typeOfContraceptiveOpted: ['Condom'],
        otherTypeOfContraceptiveOpted: 'x',
      });
      component.typeOfContraceptiveOptedForOther();
      expect(component.enablecontraceptiveOptedForOther).toBeFalse();
      expect(form.value.otherTypeOfContraceptiveOpted).toBeNull();
    });
  });

  describe('ngOnChanges', () => {
    it('patches nurse data in view mode', () => {
      component.familyPlanningMode = 'view';
      doctor.familyPlanningDetailsResponseFromNurse = {
        iecAndCounsellingDetails: IEC,
      };
      component.ngOnChanges();
      expect(form.value.id).toBe(9);
    });

    it('patches revisit data for a nurse follow-up and clears id', () => {
      route.snapshot.params.attendant = 'nurse';
      session.setItem('visitReason', 'Follow Up');
      revisit$.next({ iecAndCounsellingDetails: IEC });
      component.ngOnChanges();
      expect(form.value.otherCounselledOn).toBe('Diet');
      expect(form.value.id).toBeNull();
      expect(component.benFamilyPlanningSubscription).toBeDefined();
    });

    it('logs when revisit data is missing', () => {
      route.snapshot.params.attendant = 'nurse';
      session.setItem('visitReason', 'follow up');
      component.ngOnChanges();
      expect(console.log).toHaveBeenCalledWith('Revisit Err', null);
    });

    it('skips revisit for doctors', () => {
      session.setItem('visitReason', 'Follow Up');
      component.ngOnChanges();
      expect(component.benFamilyPlanningSubscription).toBeUndefined();
    });
  });

  it('ngOnDestroy resets the form and unsubscribes', () => {
    route.snapshot.params.attendant = 'nurse';
    session.setItem('visitReason', 'Follow Up');
    component.ngOnChanges();
    const sub = component.benFamilyPlanningSubscription;
    form.patchValue(IEC);
    component.ngOnDestroy();
    expect(form.value.counselledOn).toBeNull();
    expect(sub.closed).toBeTrue();
  });

  it('ngOnDestroy works without a subscription', () => {
    form.patchValue(IEC);
    component.ngOnDestroy();
    expect(form.value.id).toBeNull();
  });

  it('re-assigns the language set on ngDoCheck', () => {
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });
});
