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
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
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
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { AmritTrackingService } from 'Common-UI/src/tracking';
import { PreviousDetailsComponent } from 'src/app/app-modules/core/components/previous-details/previous-details.component';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { DoctorService, MasterdataService } from '../../../shared/services';
import { GeneralUtils } from '../../../shared/utility/general-utility';
import { PrescriptionComponent } from './prescription.component';

const SERVICE_LINE = JSON.stringify({ facilityID: 1, parkingPlaceID: 2 });

const PARACETAMOL = {
  id: 11,
  itemID: 101,
  itemName: 'Paracetamol',
  itemFormID: 3,
  quantityInHand: 50,
  sctCode: 'S1',
  sctTerm: 'para',
  strength: '500',
  unitOfMeasurement: 'mg',
  isEDL: true,
  routeID: 1,
};
const IBUPROFEN = {
  id: 12,
  itemID: 102,
  itemName: 'Ibuprofen',
  itemFormID: 3,
  quantityInHand: 0,
  strength: '200',
  unitOfMeasurement: 'mg',
  isEDL: false,
  routeID: 2,
};
const SYRUP = { itemID: 103, itemName: 'Syrup', itemFormID: 1, routeID: 1 };

function masterData() {
  return {
    drugFormMaster: [
      { itemFormID: 1, itemFormName: 'Syrup' },
      { itemFormID: 3, itemFormName: 'Tablet' },
    ],
    itemMaster: [{ ...PARACETAMOL }, { ...IBUPROFEN }, { ...SYRUP }],
    drugDoseMaster: [
      { itemFormID: 3, dose: '1 tab' },
      { itemFormID: 1, dose: '5 ml' },
    ],
    drugFrequencyMaster: ['OD', 'SOS'],
    drugDurationUnitMaster: ['Days'],
    routeOfAdmin: [
      { routeID: 1, routeName: 'Oral' },
      { routeID: 2, routeName: 'IV' },
    ],
    NonEdlMaster: [{ itemID: 201, itemName: 'NonEdl', itemFormID: 3 }],
    counsellingProvided: ['Diet', 'None'],
  };
}

describe('PrescriptionComponent', () => {
  let component: PrescriptionComponent;
  let fixture: ComponentFixture<PrescriptionComponent>;
  let doctorMaster$: BehaviorSubject<any>;
  let caseRecord$: BehaviorSubject<any>;
  let doctor: any;
  let confirm: any;
  let dialog: any;
  let tracking: any;
  let session: any;
  let markAsUntouched: jasmine.Spy;

  async function setup(sessionValues: Record<string, any> = {}) {
    doctorMaster$ = new BehaviorSubject<any>(null);
    caseRecord$ = new BehaviorSubject<any>(null);
    doctor = autoSpy(DoctorService, {
      populateCaserecordResponse$: caseRecord$.asObservable(),
    });
    session = createSessionStorageMock({
      serviceLineDetails: SERVICE_LINE,
      visitCategory: 'General OPD',
      userName: 'doc',
      beneficiaryRegID: 'BR',
      visitID: 'V',
      ...sessionValues,
    });
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [PrescriptionComponent],
      providers: [
        ...commonTestProviders(),
        { provide: SessionStorageService, useValue: session },
        { provide: DoctorService, useValue: doctor },
        {
          provide: MasterdataService,
          useValue: { doctorMasterData$: doctorMaster$.asObservable() },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(PrescriptionComponent, '')
      .compileComponents();
    spyOn(console, 'log');
    fixture = TestBed.createComponent(PrescriptionComponent);
    component = fixture.componentInstance;
    const utils = new GeneralUtils(TestBed.inject(FormBuilder), session);
    component.drugPrescriptionForm = utils.createDrugPrescriptionForm();
    component.prescriptionCounsellingForm = new FormGroup({
      counsellingProvidedList: new FormControl(null),
    });
    markAsUntouched = jasmine.createSpy('markAsUntouched');
    component.prescriptionForm = { form: { markAsUntouched } } as any;
    confirm = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    tracking = TestBed.inject(AmritTrackingService);
  }

  afterEach(() => fixture?.destroy());

  const drugs = () =>
    component.drugPrescriptionForm.controls['prescribedDrugs'] as FormArray;

  describe('init', () => {
    beforeEach(async () => setup());

    it('sets language, session info, page limits and duration master', () => {
      component.ngOnInit();
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
      expect(component.visitCategory).toBe('General OPD');
      expect(component.createdBy).toBe('doc');
      expect(component.referredVisitCode).toBe('undefined');
      expect(component.pageLimits).toEqual([0, 5]);
      expect(component.drugDurationMaster.length).toBe(29);
      expect(component.drugDurationMaster[28]).toBe(29);
    });

    it('stores master data (non-view mode does not subscribe to case record)', () => {
      component.ngOnInit();
      doctorMaster$.next(masterData());
      expect(component.drugFormMaster.length).toBe(2);
      expect(component.drugMaster.length).toBe(3);
      expect(component.drugRouteMaster.length).toBe(2);
      expect(component.edlMaster.length).toBe(1);
      expect(component.counsellingProvidedList).toEqual(['Diet', 'None']);
      expect(component.prescriptionSubscription).toBeUndefined();
    });

    it('setLimits computes slice indices for a page', () => {
      component.setLimits(2);
      expect(component.pageLimits).toEqual([10, 15]);
    });

    it('ngDoCheck, trackFieldInteraction and accessors', () => {
      component.ngDoCheck();
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
      component.trackFieldInteraction('Dose');
      expect(tracking.trackFieldInteraction).toHaveBeenCalledWith(
        'Dose',
        'Prescription',
      );
      expect(component.getPrescribedDrugs()).toEqual([]);
      component.prescriptionCounsellingForm.patchValue({
        counsellingProvidedList: ['Diet'],
      });
      expect(component.prescriptionAndCounselling).toEqual(['Diet']);
      component.drugPrescriptionForm = new FormGroup({});
      expect(component.getPrescribedDrugs()).toBeNull();
    });

    it('ngOnDestroy tolerates missing subscriptions', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  it('uses the referred visit code from session', async () => {
    await setup({ referredVisitCode: 'RVC' });
    component.ngOnInit();
    expect(component.referredVisitCode).toBe('RVC');
  });

  describe('view mode', () => {
    beforeEach(async () => {
      await setup();
      component.caseRecordMode = 'view';
      component.ngOnInit();
      doctorMaster$.next(masterData());
    });

    it('patches saved prescriptions and counselling', () => {
      caseRecord$.next({
        statusCode: 200,
        data: {
          prescription: [
            {
              id: 1,
              drugID: 101,
              drugName: 'Paracetamol',
              drugStrength: '500',
              drugUnit: 'mg',
            },
            { id: 2, drugID: 102, drugName: 'Ibuprofen', drugStrength: '200' },
          ],
          counsellingProvidedList: ['None'],
        },
      });
      expect(component.beneficiaryRegID).toBe('BR');
      expect(drugs().length).toBe(2);
      expect(drugs().at(0).value.id).toBe(2);
      expect(drugs().at(1).value.drugStrength).toBe('500mg');
      expect(
        component.prescriptionCounsellingForm.value.counsellingProvidedList,
      ).toEqual(['None']);
      expect(component.disableNoneOption).toBeTrue();
    });

    it('ignores responses without data', () => {
      caseRecord$.next({ statusCode: 500 });
      expect(drugs().length).toBe(0);
    });

    it('ngOnDestroy unsubscribes', () => {
      const a = component.doctorMasterDataSubscription;
      const b = component.prescriptionSubscription;
      component.ngOnDestroy();
      expect(a.closed).toBeTrue();
      expect(b.closed).toBeTrue();
    });
  });

  describe('counselling', () => {
    beforeEach(async () => setup());

    it('counsellingProvidedoneOptionValidation toggles the None option', () => {
      component.counsellingProvidedoneOptionValidation(['None']);
      expect(component.disableNoneOption).toBeTrue();
      component.counsellingProvidedoneOptionValidation(['Diet']);
      expect(component.disableNoneOption).toBeFalse();
      component.disableNoneOption = true;
      component.counsellingProvidedoneOptionValidation([]);
      expect(component.disableNoneOption).toBeFalse();
    });

    it('patchCounsellingProvided skips null lists', () => {
      component.patchCounsellingProvided(null);
      expect(
        component.prescriptionCounsellingForm.value.counsellingProvidedList,
      ).toBeNull();
      expect(component.disableNoneOption).toBeFalse();
    });
  });

  describe('drug selection', () => {
    beforeEach(async () => {
      await setup();
      component.ngOnInit();
      doctorMaster$.next(masterData());
    });

    it('displayFn formats the drug option', () => {
      expect(component.displayFn(PARACETAMOL)).toBe('Paracetamol 500mg(50)');
      expect(component.displayFn({ itemName: 'X', strength: '1' })).toBe('X 1');
      expect(component.displayFn(null)).toBe('');
    });

    it('getFormValueChanged resolves the form id and filters drug and dose masters', () => {
      component.currentPrescription.formName = 'Tablet';
      component.currentPrescription.dose = '1';
      component.getFormValueChanged();
      expect(component.currentPrescription.dose).toBeNull();
      expect(markAsUntouched).toHaveBeenCalled();
      expect(component.currentPrescription.formID).toBe(3);
      expect(component.filteredDrugMaster.map((d: any) => d.itemName)).toEqual([
        'Paracetamol',
        'Ibuprofen',
        'NonEdl',
      ]);
      expect(component.filteredDrugMaster[2].quantityInHand).toBe(0);
      expect(component.filteredDrugDoseMaster).toEqual([
        { itemFormID: 3, dose: '1 tab' },
      ]);
    });

    it('filterMedicine narrows by prefix', () => {
      component.currentPrescription.formName = 'Tablet';
      component.getFormDetails();
      component.filterMedicine('ibu');
      expect(component.subFilteredDrugMaster.length).toBe(1);
      component.filterMedicine('');
      expect(component.subFilteredDrugMaster.length).toBe(3);
    });

    it('selectMedicineObject with stock sets primary and route', () => {
      component.selectMedicineObject({
        source: { value: PARACETAMOL },
        isUserInput: true,
      });
      expect(component.currentPrescription.drugName).toBe('Paracetamol');
      expect(component.currentPrescription.drugID).toBe(101);
      expect(component.currentPrescription.route).toBe('Oral');
      expect(component.isStockAvalable).toBe('primary');
    });

    it('selectMedicineObject without stock asks and warns when accepted', () => {
      component.selectMedicineObject({
        source: { value: IBUPROFEN },
        isUserInput: true,
      });
      expect(confirm.confirm).toHaveBeenCalledWith(
        'info ' + LANGUAGE_EN.nonEDLMedicine,
        LANGUAGE_EN.stockNotAvailableWouldYouPrescribe + ' Ibuprofen 200mg',
      );
      expect(component.isStockAvalable).toBe('warn');
      expect(component.currentPrescription.route).toBe('IV');
    });

    it('selectMedicineObject without stock clears the drug when declined', () => {
      confirm.confirm.and.returnValue(of(false));
      component.tempDrugName = 'x';
      component.selectMedicineObject({
        source: {
          value: {
            ...IBUPROFEN,
            isEDL: true,
            strength: null,
            unitOfMeasurement: null,
          },
        },
        isUserInput: true,
      });
      expect(confirm.confirm.calls.mostRecent().args[0]).toBe('info ');
      expect(component.tempDrugName).toBeNull();
      expect(component.currentPrescription.drugName).toBe('');
      expect(component.isStockAvalable).toBe('');
    });

    it('selectMedicineObject ignores non-user input', () => {
      component.selectMedicineObject({
        source: { value: PARACETAMOL },
        isUserInput: false,
      });
      expect(component.currentPrescription.drugName).toBeNull();
    });

    it('selectMedicineObject alerts when the drug is already prescribed', () => {
      drugs().push(new FormGroup({ drugID: new FormControl(101) }));
      component.selectMedicineObject({
        source: { value: PARACETAMOL },
        isUserInput: true,
      });
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.medicinePrescribe,
        'info',
      );
      expect(component.currentPrescription.drugName).toBeNull();
    });

    it('reEnterMedicine restores, clears or resets the drug', () => {
      component.tempDrugName = 'typed';
      component.currentPrescription.drugID = 101;
      component.currentPrescription.drugName = 'Paracetamol';
      component.reEnterMedicine();
      expect(component.tempDrugName.itemName).toBe('Paracetamol');

      component.currentPrescription.drugID = null;
      component.reEnterMedicine();
      expect(component.tempDrugName).toBeNull();

      component.currentPrescription.formName = 'Syrup';
      component.reEnterMedicine();
      expect(component.currentPrescription.formID).toBe(1);
      expect(component.filteredDrugMaster.map((d: any) => d.itemName)).toEqual([
        'Syrup',
      ]);
    });
  });

  describe('submit / validation', () => {
    beforeEach(async () => {
      await setup();
      component.ngOnInit();
      doctorMaster$.next(masterData());
    });

    it('lists missing required fields', () => {
      component.currentPrescription.frequency = 'OD';
      component.currentPrescription.formID = 3;
      expect(component.validateCurrentPrescription()).toEqual([
        'Medicine Form',
        'Medicine Name',
        'Dosage',
        'Duration',
        'Unit',
        'Quantity',
      ]);
      component.currentPrescription.frequency = null;
      component.currentPrescription.formID = 1;
      expect(component.validateCurrentPrescription()).toContain('Frequency');
    });

    it('submitForUpload alerts with numbered errors', () => {
      component.submitForUpload();
      expect(confirm.alert).toHaveBeenCalledWith(
        'Please fill the following required fields:\n1. Medicine Form\n2. Medicine Name\n3. Dosage\n4. Frequency',
        'error',
      );
      expect(drugs().length).toBe(0);
    });

    it('submitForUpload adds a valid medicine and clears the entry', () => {
      Object.assign(component.currentPrescription, {
        formName: 'Tablet',
        formID: 3,
        drugName: 'Paracetamol',
        drugID: 101,
        drugStrength: '500',
        drugUnit: 'mg',
        dose: '1 tab',
        frequency: 'SOS',
        qtyPrescribed: 10,
      });
      component.tempDrugName = PARACETAMOL;
      component.submitForUpload();
      expect(confirm.alert).not.toHaveBeenCalled();
      expect(drugs().length).toBe(1);
      expect(drugs().at(0).value.drugStrength).toBe('500mg');
      expect(drugs().at(0).value.createdBy).toBe('doc');
      expect(component.currentPrescription.formName).toBeNull();
      expect(component.tempDrugName).toBeNull();
    });
  });

  describe('edit / delete', () => {
    beforeEach(async () => {
      await setup();
      component.ngOnInit();
      doctorMaster$.next(masterData());
      component.patchPrescriptionDetails([
        {
          drugID: 101,
          drugName: 'Paracetamol',
          formName: 'Tablet',
          drugStrength: '500',
          dose: '1 tab',
          frequency: 'OD',
          duration: 3,
          unit: 'Days',
          qtyPrescribed: 9,
          route: 'Oral',
          instructions: 'after food',
        },
      ]);
    });

    it('editMedicine loads the row back and removes it (UI only)', () => {
      drugs().at(0).patchValue({ id: null });
      component.editMedicine(0, null);
      expect(component.currentPrescription.formID).toBe(3);
      expect(component.currentPrescription.dose).toBe('1 tab');
      expect(component.currentPrescription.duration).toBe(3);
      expect(component.currentPrescription.instructions).toBe('after food');
      expect(component.tempDrugName.itemName).toBe('Paracetamol');
      expect(component.currentPrescription.drugStrength).toBe('500');
      expect(component.isStockAvalable).toBe('primary');
      expect(drugs().length).toBe(0);
    });

    it('editMedicine deletes via backend for saved rows', () => {
      doctor.deleteMedicine.and.returnValue(of({ statusCode: 200 }));
      component.editMedicine(0, 77);
      expect(doctor.deleteMedicine).toHaveBeenCalledWith(77);
      expect(drugs().length).toBe(0);
    });

    it('setMedicineObject flags zero stock', () => {
      component.setMedicineObject({ quantityInHand: 0, isEDL: false });
      expect(component.isStockAvalable).toBe('warn');
    });

    it('deleteMedicine removes locally after confirm', () => {
      component.deleteMedicine(0);
      expect(confirm.confirm).toHaveBeenCalledWith(
        'warn',
        LANGUAGE_EN.alerts.info.confirmDelete,
      );
      expect(drugs().length).toBe(0);
    });

    it('deleteMedicine calls backend for saved medicine and keeps row on failure', () => {
      doctor.deleteMedicine.and.returnValue(of({ statusCode: 500 }));
      component.deleteMedicine(0, 5 as any);
      expect(doctor.deleteMedicine).toHaveBeenCalledWith(5);
      expect(drugs().length).toBe(1);
    });

    it('deleteMedicine does nothing when declined', () => {
      confirm.confirm.and.returnValue(of(false));
      component.deleteMedicine(0);
      expect(drugs().length).toBe(1);
    });
  });

  describe('loadMMUPrescription', () => {
    it('skips when there is no referred visit', async () => {
      await setup({
        referredVisitCode: 'undefined',
        referredVisitID: 'undefined',
      });
      component.ngOnInit();
      component.loadMMUPrescription();
      expect(doctor.getMMUData).not.toHaveBeenCalled();
    });

    describe('with referred visit', () => {
      beforeEach(async () => {
        await setup({ referredVisitCode: 'RVC', referredVisitID: 'RVID' });
        component.ngOnInit();
      });

      it('opens the MMU prescription dialog', () => {
        const data = { data: [{ drug: 1 }] };
        doctor.getMMUData.and.returnValue(of({ statusCode: 200, data }));
        component.loadMMUPrescription();
        expect(doctor.getMMUData).toHaveBeenCalledWith({
          benRegID: 'BR',
          visitCode: 'RVC',
          benVisitID: 'RVID',
          fetchMMUDataFor: 'Prescription',
        });
        expect(dialog.open).toHaveBeenCalledWith(PreviousDetailsComponent, {
          data: { dataList: data, title: LANGUAGE_EN.mmuPrescriptionDetails },
        });
      });

      it('alerts when no MMU prescription exists', () => {
        doctor.getMMUData.and.returnValue(
          of({ statusCode: 200, data: { data: [] } }),
        );
        component.loadMMUPrescription();
        expect(confirm.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.mmuPrescriptionDetailsNotAvailable,
        );
      });

      it('logs errors on bad status or failure', () => {
        doctor.getMMUData.and.returnValue(of({ statusCode: 500 }));
        component.loadMMUPrescription();
        doctor.getMMUData.and.returnValue(
          throwingObs({ errorMessage: 'boom' }),
        );
        component.loadMMUPrescription();
        expect(console.log).toHaveBeenCalledWith(
          'Error in fetching MMU Prescription details',
        );
        expect(console.log).toHaveBeenCalledWith('boom');
        expect(dialog.open).not.toHaveBeenCalled();
      });
    });

    it('sends nulls for blank session values', async () => {
      await setup({
        beneficiaryRegID: '',
        referredVisitCode: '',
        referredVisitID: '',
      });
      doctor.getMMUData.and.returnValue(of({ statusCode: 500 }));
      component.loadMMUPrescription();
      expect(doctor.getMMUData).toHaveBeenCalledWith({
        benRegID: null,
        visitCode: null,
        benVisitID: null,
        fetchMMUDataFor: 'Prescription',
      });
    });
  });
});
