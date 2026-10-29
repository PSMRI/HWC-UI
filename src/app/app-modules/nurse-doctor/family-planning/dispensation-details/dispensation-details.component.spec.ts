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
import { DoctorService, MasterdataService } from '../../shared/services';
import { FamilyPlanningUtils } from '../../shared/utility/family-planning-utlity';
import { DispensationDetailsComponent } from './dispensation-details.component';

describe('DispensationDetailsComponent', () => {
  let component: DispensationDetailsComponent;
  let fixture: ComponentFixture<DispensationDetailsComponent>;
  let doctor: any;
  let session: any;
  let route: any;
  let form: FormGroup;
  let master$: BehaviorSubject<any>;
  let fetch$: BehaviorSubject<boolean>;
  let revisit$: BehaviorSubject<any>;

  const DISP = {
    id: 5,
    typeOfContraceptivePrescribed: [
      'IUCD 380A',
      'Injectable MPA Contraceptive (Antara)',
      'Other',
    ],
    otherTypeOfContraceptivePrescribed: 'Gel',
    dosesTaken: 2,
    dateOfLastDoseTaken: '2024-01-01',
    qtyPrescribed: 3,
    nextVisitForRefill: '2024-02-01',
    typeOfIUCDInserted: 'Copper',
    dateOfIUCDInsertion: '2024-01-10',
    iucdInsertionDoneBy: 'Doctor',
  };

  beforeEach(async () => {
    master$ = new BehaviorSubject<any>(null);
    fetch$ = new BehaviorSubject<boolean>(false);
    revisit$ = new BehaviorSubject<any>(null);
    doctor = autoSpy(DoctorService, {
      familyPlanningDetailsResponseFromNurse: null,
      enableDispenseFlag: false,
      fetchFamilyDataCheck$: fetch$.asObservable(),
      benFamilyPlanningDetails$: revisit$.asObservable(),
    });
    route = { snapshot: { params: { attendant: 'doctor' } } };
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [DispensationDetailsComponent],
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

    fixture = TestBed.createComponent(DispensationDetailsComponent);
    component = fixture.componentInstance;
    session = TestBed.inject(SessionStorageService);
    form = new FamilyPlanningUtils(
      new FormBuilder(),
    ).createDipensationDetailsForm();
    component.dispensationDetailsForm = form;
    spyOn(console, 'log');
  });

  function expectPatched() {
    expect(form.value.dosesTaken).toBe(2);
    expect(form.value.nextVisitForRefill).toEqual(new Date('2024-02-01'));
    expect(form.value.dateOfIUCDInsertion).toEqual(new Date('2024-01-10'));
    expect(component.enableIucdFields).toBeTrue();
    expect(component.enableDoseFields).toBeTrue();
    expect(component.enableOtherContraceptiveTypeField).toBeTrue();
    expect(component.disableNoneOption).toBeTrue();
    expect(form.controls['qtyPrescribed'].enabled).toBeTrue();
  }

  describe('init', () => {
    it('should create and set date limits', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
      expect(doctor.setFamilyDataFetch).toHaveBeenCalledWith(false);
      expect(component.futureDate.getTime()).toBeGreaterThan(
        component.today.getTime(),
      );
      expect(console.log).toHaveBeenCalledWith(
        'Error in fetching nurse master data details',
      );
    });

    it('loads masters and patches nurse data in view mode', () => {
      component.familyPlanningMode = 'view';
      fixture.detectChanges();
      doctor.familyPlanningDetailsResponseFromNurse = {
        dispensationDetails: DISP,
      };
      doctor.enableDispenseFlag = false;
      master$.next({
        m_fpmethodfollowup: ['a'],
        m_TypeofIUCDinserted: [{ id: 1, name: 'Copper' }],
        m_IUCDinsertiondoneby: ['Doctor'],
      });
      expect(component.typeOfContraceptivesList).toEqual(['a']);
      expect(component.typeOfIucdInsertedList).toEqual([
        { id: 1, name: 'Copper' },
      ]);
      expect(component.iucdInsertionByList).toEqual(['Doctor']);
      expectPatched();
      expect(doctor.enableDispenseFlag).toBeFalse();
    });

    it('does not patch from masters when dispense flag is set', () => {
      component.familyPlanningMode = 'view';
      fixture.detectChanges();
      doctor.familyPlanningDetailsResponseFromNurse = {
        dispensationDetails: DISP,
      };
      doctor.enableDispenseFlag = true;
      master$.next({ m_fpmethodfollowup: [] });
      expect(form.value.dosesTaken).toBeNull();
      expect(doctor.enableDispenseFlag).toBeFalse();
    });

    it('patches nurse data when the fetch flag fires', () => {
      fixture.detectChanges();
      doctor.familyPlanningDetailsResponseFromNurse = {
        dispensationDetails: DISP,
      };
      fetch$.next(true);
      expectPatched();
    });
  });

  describe('ngOnChanges', () => {
    it('patches nurse data in view mode', () => {
      component.familyPlanningMode = 'view';
      doctor.familyPlanningDetailsResponseFromNurse = {
        dispensationDetails: DISP,
      };
      component.ngOnChanges();
      expect(form.value.id).toBe(5);
    });

    it('patches revisit data for nurse follow-up and clears id', () => {
      route.snapshot.params.attendant = 'nurse';
      session.setItem('visitReason', 'Follow Up');
      revisit$.next({ dispensationDetails: DISP });
      component.ngOnChanges();
      expectPatched();
      expect(form.value.id).toBeNull();
    });

    it('ignores empty revisit data', () => {
      route.snapshot.params.attendant = 'nurse';
      session.setItem('visitReason', 'follow up');
      revisit$.next({ dispensationDetails: null });
      component.ngOnChanges();
      expect(form.value.dosesTaken).toBeNull();
      expect(component.benFamilyPlanningSubscription).toBeDefined();
    });

    it('skips revisit for doctors', () => {
      session.setItem('visitReason', 'Follow Up');
      component.ngOnChanges();
      expect(component.benFamilyPlanningSubscription).toBeUndefined();
    });
  });

  describe('field helpers', () => {
    it('otherContrasepiveType resets the other field when Other is absent', () => {
      form.patchValue({
        typeOfContraceptivePrescribed: ['Condom'],
        otherTypeOfContraceptivePrescribed: 'x',
      });
      component.familyPlanningMode = 'update';
      component.otherContrasepiveType();
      expect(component.enableOtherContraceptiveTypeField).toBeFalse();
      expect(form.value.otherTypeOfContraceptivePrescribed).toBeNull();
      expect(doctor.familyPlanningValueChanged).toHaveBeenCalledWith(true);
    });

    it('typeOfIucdInserteredID sets the matching id', () => {
      component.typeOfIucdInsertedList = [
        { id: 1, name: 'Copper' },
        { id: 2, name: 'Hormonal' },
      ];
      form.patchValue({ typeOfIUCDInserted: 'Hormonal' });
      component.typeOfIucdInserteredID();
      expect(form.value.typeOfIUCDInsertedId).toBe(2);
    });

    describe('populateIucdFields', () => {
      beforeEach(() =>
        form.patchValue({
          typeOfIUCDInserted: 'Copper',
          dateOfIUCDInsertion: new Date(),
          iucdInsertionDoneBy: 'Doctor',
        }),
      );

      it('enables and resets IUCD fields when an IUCD option is chosen', () => {
        form.patchValue({ typeOfContraceptivePrescribed: ['IUCD 375'] });
        component.populateIucdFields('IUCD 375');
        expect(component.enableIucdFields).toBeTrue();
        expect(form.value.typeOfIUCDInserted).toBeNull();
      });

      it('keeps IUCD fields when another option is toggled', () => {
        form.patchValue({
          typeOfContraceptivePrescribed: ['IUCD 380A', 'Condom'],
        });
        component.populateIucdFields('Condom');
        expect(component.enableIucdFields).toBeTrue();
        expect(form.value.typeOfIUCDInserted).toBe('Copper');
      });

      it('disables and resets IUCD fields without IUCD', () => {
        component.enableIucdFields = true;
        form.patchValue({ typeOfContraceptivePrescribed: ['Condom'] });
        component.familyPlanningMode = 'view';
        component.populateIucdFields('Condom');
        expect(component.enableIucdFields).toBeFalse();
        expect(form.value.iucdInsertionDoneBy).toBeNull();
        expect(doctor.familyPlanningValueChanged).toHaveBeenCalledWith(true);
      });
    });

    it('populateDoseFieldForAntara resets doses without Antara', () => {
      form.patchValue({
        typeOfContraceptivePrescribed: ['Condom'],
        dosesTaken: 3,
        dateOfLastDoseTaken: new Date(),
      });
      component.populateDoseFieldForAntara();
      expect(component.enableDoseFields).toBeFalse();
      expect(form.value.dosesTaken).toBeNull();
      expect(form.value.dateOfLastDoseTaken).toBeNull();
    });

    describe('disableQuantityPrescribed', () => {
      it('disables quantity when only sterilization/IUCD options are chosen', () => {
        form.patchValue({
          typeOfContraceptivePrescribed: [
            'IUCD 375',
            'Tubectomy (Female Sterilization)',
          ],
          qtyPrescribed: 4,
        });
        component.disableQuantityPrescribed();
        expect(form.controls['qtyPrescribed'].disabled).toBeTrue();
        expect(form.controls['qtyPrescribed'].value).toBeNull();
      });

      it('enables quantity when a consumable is included', () => {
        form.controls['qtyPrescribed'].disable();
        form.patchValue({
          typeOfContraceptivePrescribed: ['IUCD 375', 'Condom'],
        });
        component.disableQuantityPrescribed();
        expect(form.controls['qtyPrescribed'].enabled).toBeTrue();
      });

      it('enables quantity for an empty selection', () => {
        form.controls['qtyPrescribed'].disable();
        form.patchValue({ typeOfContraceptivePrescribed: [] });
        component.disableQuantityPrescribed();
        expect(form.controls['qtyPrescribed'].enabled).toBeTrue();
      });

      it('throws when nothing is selected (current behaviour)', () => {
        expect(() => component.disableQuantityPrescribed()).toThrowError(
          TypeError,
        );
      });
    });

    describe('resettypeOfContraceptivePrescribed', () => {
      it('disables other options for None', () => {
        component.resettypeOfContraceptivePrescribed(['None']);
        expect(component.disableAllOptions).toBeTrue();
        expect(component.disableNoneOption).toBeFalse();
      });

      it('clears both flags for empty selection', () => {
        component.disableNoneOption = true;
        component.resettypeOfContraceptivePrescribed(null);
        expect(component.disableNoneOption).toBeFalse();
        expect(component.disableAllOptions).toBeFalse();
      });
    });

    it('onValueChange flags changes only in view/update', () => {
      component.familyPlanningMode = 'new';
      component.onValueChange();
      expect(doctor.familyPlanningValueChanged).not.toHaveBeenCalled();
      component.familyPlanningMode = 'update';
      component.onValueChange();
      expect(doctor.familyPlanningValueChanged).toHaveBeenCalledWith(true);
    });
  });

  describe('ngOnDestroy', () => {
    it('resets only dispensation fields in view/update and keeps id', () => {
      form.patchValue({ ...DISP, typeOfContraceptivePrescribed: ['Condom'] });
      component.enableIucdFields = true;
      component.enableDoseFields = true;
      component.disableAllOptions = true;
      component.familyPlanningMode = 'update';
      component.ngOnDestroy();
      expect(form.value.id).toBe(5);
      expect(form.value.typeOfContraceptivePrescribed).toBeNull();
      expect(form.value.nextVisitForRefill).toBeNull();
      expect(component.enableIucdFields).toBeFalse();
      expect(component.enableDoseFields).toBeFalse();
      expect(component.disableAllOptions).toBeFalse();
    });

    it('resets the whole form otherwise and unsubscribes', () => {
      route.snapshot.params.attendant = 'nurse';
      session.setItem('visitReason', 'Follow Up');
      component.ngOnChanges();
      const sub = component.benFamilyPlanningSubscription;
      const other = new BehaviorSubject(1).subscribe();
      component.enablingDispenseSubscriptionValue = other;
      form.patchValue({ id: 5 });
      component.ngOnDestroy();
      expect(form.value.id).toBeNull();
      expect(sub.closed).toBeTrue();
      expect(other.closed).toBeTrue();
    });
  });

  it('re-assigns the language set on ngDoCheck', () => {
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });
});
