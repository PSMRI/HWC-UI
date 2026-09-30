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
import { BehaviorSubject, Subject, of } from 'rxjs';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  createDialogRefMock,
  createSessionStorageMock,
  throwingObs,
} from 'src/testing/test-utils';
import { environment } from 'src/environments/environment';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { IotcomponentComponent } from '../../core/components/iotcomponent/iotcomponent.component';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../shared/services';
import { TestInVitalsService } from '../shared/services/test-in-vitals.service';
import { QuickConsultUtils } from '../shared/utility';
import { QuickConsultComponent } from './quick-consult.component';

const SESSION = {
  serviceLineDetails: JSON.stringify({ facilityID: 1, parkingPlaceID: 2 }),
  userName: 'doc',
  beneficiaryRegID: '11',
  visitID: '22',
  visitCategory: 'General OPD (QC)',
  visitCode: '33',
};

const CC = (name: string, id = 0) => ({
  chiefComplaint: name,
  chiefComplaintID: id,
});

function masterData() {
  return {
    chiefComplaintMaster: [CC('Fever', 1), CC('Cough', 2), CC('Headache', 3)],
    procedures: [
      {
        procedureID: 1,
        procedureName: 'RBS Test',
        procedureType: 'Laboratory',
      },
      { procedureID: 2, procedureName: 'CBC', procedureType: 'Laboratory' },
      { procedureID: 3, procedureName: 'X-Ray', procedureType: 'Radiology' },
    ],
    drugFormMaster: [{ itemFormID: 1, itemFormName: 'Tablet' }],
    itemMaster: [
      { itemID: 10, itemName: 'Paracetamol', itemFormID: 1, quantityInHand: 5 },
      { itemID: 11, itemName: 'Syrup X', itemFormID: 2, quantityInHand: 1 },
    ],
    drugDoseMaster: [
      { id: 1, itemFormID: 1, dose: '1 tab' },
      { id: 2, itemFormID: 2, dose: '5 ml' },
    ],
    drugFrequencyMaster: ['OD'],
    drugDurationUnitMaster: ['Days'],
    routeOfAdmin: ['Oral'],
    NonEdlMaster: [{ itemID: 20, itemName: 'Pantoprazole', itemFormID: 1 }],
  };
}

describe('QuickConsultComponent', () => {
  let component: QuickConsultComponent;
  let fixture: ComponentFixture<QuickConsultComponent>;
  let doctor: any;
  let nurse: any;
  let master: any;
  let testInVitals: any;
  let confirm: any;
  let dialog: any;
  let session: any;
  let form: FormGroup;
  let doctorMaster$: BehaviorSubject<any>;
  let rbsSelected$: BehaviorSubject<any>;
  let rbsCurrent$: BehaviorSubject<any>;

  const vitalsResponse = (rbs: any = 120) =>
    of({
      statusCode: 200,
      data: {
        benAnthropometryDetail: { height_cm: 160, weight_Kg: 60, bMI: 23.4 },
        benPhysicalVitalDetail: {
          temperature: 98,
          systolicBP_1stReading: 120,
          diastolicBP_1stReading: 80,
          pulseRate: 72,
          respiratoryRate: 16,
          bloodGlucose_Fasting: 90,
          bloodGlucose_Random: 110,
          bloodGlucose_2hr_PP: 130,
          sPO2: 98,
          rbsTestResult: rbs,
          rbsTestRemarks: 'ok',
        },
      },
    });

  beforeEach(async () => {
    doctorMaster$ = new BehaviorSubject<any>(null);
    rbsSelected$ = new BehaviorSubject<any>(undefined);
    rbsCurrent$ = new BehaviorSubject<any>(null);
    doctor = autoSpy(DoctorService);
    nurse = autoSpy(NurseService, {
      rbsSelectedInInvestigation$: rbsSelected$.asObservable(),
      rbsTestResultCurrent$: rbsCurrent$.asObservable(),
      rbsTestResultFromDoctorFetch: null,
      mmuVisitData: false,
    });
    master = autoSpy(MasterdataService, {
      doctorMasterData$: doctorMaster$.asObservable(),
    });
    testInVitals = autoSpy(TestInVitalsService);
    doctor.getGenericVitals.and.returnValue(vitalsResponse(null));

    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [QuickConsultComponent],
      providers: [
        ...commonTestProviders({ session: SESSION }),
        { provide: DoctorService, useValue: doctor },
        { provide: NurseService, useValue: nurse },
        { provide: MasterdataService, useValue: master },
        { provide: TestInVitalsService, useValue: testInVitals },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(
        QuickConsultComponent,
        '<form #prescriptionForm="ngForm"></form>',
      )
      .compileComponents();

    fixture = TestBed.createComponent(QuickConsultComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    session = TestBed.inject(SessionStorageService);
    form = new QuickConsultUtils(
      new FormBuilder(),
      createSessionStorageMock(SESSION) as any,
    ).createQuickConsultForm();
    component.patientQuickConsultForm = form;
  });

  const drugs = () => form.get('prescription.prescribedDrugs') as FormArray;
  const complaints = () => form.get('chiefComplaintList') as FormArray;
  const diagnoses = () => form.get('provisionalDiagnosisList') as FormArray;

  function init(mode?: string) {
    if (mode) component.quickConsultMode = mode;
    fixture.detectChanges();
    doctorMaster$.next(masterData());
  }

  describe('ngOnInit', () => {
    it('initialises state for a non-specialist', () => {
      fixture.detectChanges();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(doctor.setCapturedCaserecordDeatilsByDoctor).toHaveBeenCalledWith(
        null,
      );
      expect(nurse.clearRbsSelectedInInvestigation).toHaveBeenCalled();
      expect(nurse.clearRbsInVitals).toHaveBeenCalled();
      expect(component.specialist).toBeFalse();
      expect(form.controls['instruction'].disabled).toBeTrue();
      expect(component.createdBy).toBe('doc');
      expect(component.drugPrescriptionForm).toBe(
        form.get('prescription') as FormGroup,
      );
      expect(component.pageLimits).toEqual([0, 5]);
      expect(component.drugDurationMaster.length).toBe(29);
      expect(component.rbsSelectedInInvestigation).toBeFalse();
      expect(component.rbsTestResultCurrent).toBeNull();
    });

    it('enables instruction for a TC specialist', () => {
      session.setItem('designation', 'TC Specialist');
      fixture.detectChanges();
      expect(component.specialist).toBeTrue();
      expect(form.controls['instruction'].enabled).toBeTrue();
    });

    it('tracks RBS subjects', () => {
      fixture.detectChanges();
      rbsSelected$.next(true);
      rbsCurrent$.next(150);
      expect(component.rbsSelectedInInvestigation).toBeTrue();
      expect(component.rbsTestResultCurrent).toBe(150);
    });
  });

  describe('master data', () => {
    it('loads masters and vitals', () => {
      init();
      expect(component.chiefComplaintMaster.length).toBe(3);
      expect(component.chiefComplaintTemporarayList[0].length).toBe(3);
      expect(component.nonRadiologyMaster.length).toBe(2);
      expect(component.radiologyMaster.length).toBe(1);
      expect(component.edlMaster.length).toBe(1);
      expect(doctor.getGenericVitals).toHaveBeenCalledWith({
        benRegID: '11',
        benVisitID: '22',
      });
      expect(form.controls['height_cm'].value).toBe(160);
      expect(form.controls['sPO2'].value).toBe(98);
      expect(testInVitals.setVitalsRBSValueInReports).toHaveBeenCalled();
      expect(doctor.getCaseRecordAndReferDetails).not.toHaveBeenCalled();
    });

    it('marks RBS fetched from nurse and disables RBS fields', () => {
      doctor.getGenericVitals.and.returnValue(vitalsResponse(130));
      init();
      expect(nurse.rbsTestResultFromDoctorFetch).toBe(130);
      expect(nurse.setRbsInCurrentVitals).toHaveBeenCalledWith(130);
      expect(form.controls['rbsTestResult'].disabled).toBeTrue();
      expect(component.checkDiasableRBS()).toBeTrue();
    });

    it('does not keep nurse RBS for MMU visits', () => {
      nurse.mmuVisitData = true;
      doctor.getGenericVitals.and.returnValue(vitalsResponse(130));
      init();
      expect(nurse.rbsTestResultFromDoctorFetch).toBeNull();
    });

    it('skips vitals patching when details are missing', () => {
      doctor.getGenericVitals.and.returnValue(
        of({
          data: { benAnthropometryDetail: null, benPhysicalVitalDetail: null },
        }),
      );
      init();
      expect(form.controls['height_cm'].value).toBeNull();
      expect(testInVitals.setVitalsRBSValueInReports).not.toHaveBeenCalled();
    });

    it('fetches case record in view mode without a referral', () => {
      doctor.getCaseRecordAndReferDetails.and.returnValue(
        of({
          statusCode: 200,
          data: { findings: {}, diagnosis: {}, prescription: [] },
        }),
      );
      init('view');
      expect(doctor.getCaseRecordAndReferDetails).toHaveBeenCalledWith(
        '11',
        '22',
        'General OPD (QC)',
      );
      expect(doctor.setCapturedCaserecordDeatilsByDoctor).toHaveBeenCalledWith(
        jasmine.objectContaining({ statusCode: 200 }),
      );
    });

    it('ignores failed case record responses', () => {
      doctor.getCaseRecordAndReferDetails.and.returnValue(
        of({ statusCode: 5000 }),
      );
      spyOn(component, 'patchDiagnosisDetails');
      init('view');
      expect(component.patchDiagnosisDetails).not.toHaveBeenCalled();
    });

    it('fetches MMU case record for specialist flag 3', () => {
      session.setItem('referredVisitCode', '99');
      session.setItem('specialist_flag', '3');
      doctor.getMMUCaseRecordAndReferDetails.and.returnValue(
        of({
          statusCode: 200,
          data: { findings: {}, diagnosis: {}, prescription: [] },
        }),
      );
      init('view');
      expect(doctor.getMMUCaseRecordAndReferDetails).toHaveBeenCalledWith(
        '11',
        '22',
        'General OPD (QC)',
        '33',
      );
    });

    it('fetches referred MMU case record otherwise', () => {
      session.setItem('referredVisitCode', '99');
      session.setItem('referredVisitID', '88');
      doctor.getMMUCaseRecordAndReferDetails.and.returnValue(undefined);
      init('view');
      expect(doctor.getMMUCaseRecordAndReferDetails).toHaveBeenCalledWith(
        '11',
        '88',
        'General OPD (QC)',
        '99',
      );
    });

    it('does not patch failed MMU responses', () => {
      doctor.getMMUCaseRecordAndReferDetails.and.returnValue(
        of({ statusCode: 5000 }),
      );
      spyOn(component, 'patchDiagnosisDetails');
      component.getMMUDiagnosisDetails('1', '2', 'x', '3');
      expect(component.patchDiagnosisDetails).not.toHaveBeenCalled();
    });
  });

  describe('RBS helpers', () => {
    beforeEach(() => fixture.detectChanges());

    it('openIOTRBSModel patches the result and reports it', () => {
      dialog.open.and.returnValue(createDialogRefMock({ result: 140 }));
      component.openIOTRBSModel();
      expect(dialog.open).toHaveBeenCalledWith(IotcomponentComponent, {
        width: '600px',
        height: '180px',
        disableClose: true,
        data: { startAPI: environment.startRBSurl },
      });
      expect(component.rbsPopup).toBeFalse();
      expect(form.controls['rbsTestResult'].value).toBe(140);
      expect(form.controls['rbsTestResult'].dirty).toBeTrue();
      expect(nurse.setRbsInCurrentVitals).toHaveBeenCalledWith(140);
      expect(
        testInVitals.setVitalsRBSValueInReportsInUpdate,
      ).toHaveBeenCalledWith(jasmine.objectContaining({ rbsTestResult: 140 }));
    });

    it('openIOTRBSModel does not set vitals for an empty result', () => {
      dialog.open.and.returnValue(createDialogRefMock({ result: null }));
      component.openIOTRBSModel();
      expect(nurse.setRbsInCurrentVitals).not.toHaveBeenCalled();
      expect(
        testInVitals.setVitalsRBSValueInReportsInUpdate,
      ).toHaveBeenCalled();
    });

    it('openIOTRBSModel ignores a cancelled dialog', () => {
      dialog.open.and.returnValue(createDialogRefMock(null));
      component.openIOTRBSModel();
      expect(
        testInVitals.setVitalsRBSValueInReportsInUpdate,
      ).not.toHaveBeenCalled();
    });

    it('checkDiasableRBS is false by default', () => {
      expect(component.checkDiasableRBS()).toBeFalse();
    });

    it('checkForRange alerts for out-of-range values only', () => {
      form.patchValue({ rbsTestResult: -1 });
      component.checkForRange();
      form.patchValue({ rbsTestResult: 1001 });
      component.checkForRange();
      form.patchValue({ rbsTestResult: 200 });
      component.checkForRange();
      expect(confirm.alert).toHaveBeenCalledTimes(2);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.recheckValue,
      );
    });

    it('rbsResultChange enables fields and clears vitals when no RBS', () => {
      form.controls['rbsTestResult'].disable();
      expect(component.rbsResultChange()).toBeFalse();
      expect(nurse.setRbsInCurrentVitals).toHaveBeenCalledWith(null);
      expect(form.controls['rbsTestResult'].enabled).toBeTrue();
      expect(form.controls['rbsTestRemarks'].enabled).toBeTrue();
    });

    it('rbsResultChange disables fields when RBS is in investigation', () => {
      component.rbsSelectedInInvestigation = true;
      form.patchValue({ rbsTestResult: 99 });
      expect(component.rbsResultChange()).toBeTrue();
      expect(form.controls['rbsTestRemarks'].disabled).toBeTrue();
    });

    it('ngOnChanges clears the doctor-fetched RBS', () => {
      nurse.rbsTestResultFromDoctorFetch = 1;
      component.ngOnChanges();
      expect(nurse.rbsTestResultFromDoctorFetch).toBeNull();
    });
  });

  describe('prescription', () => {
    beforeEach(() => init());

    it('displayFn formats drug options', () => {
      expect(
        component.displayFn({
          itemName: 'Para',
          strength: '500',
          unitOfMeasurement: 'mg',
          quantityInHand: 3,
        }),
      ).toBe('Para 500mg(3)');
      expect(component.displayFn({ itemName: 'Para', strength: '500' })).toBe(
        'Para 500',
      );
      expect(component.displayFn(null)).toBe('');
    });

    it('getFormValueChanged filters drugs (incl. EDL) and doses by form', () => {
      component.tempform = { itemFormID: 1, itemFormName: 'Tablet' };
      component.getFormValueChanged();
      expect(component.currentPrescription.formName).toBe('Tablet');
      expect(component.filteredDrugMaster.map((d: any) => d.itemID)).toEqual([
        10, 20,
      ]);
      expect(component.filteredDrugMaster[1].quantityInHand).toBe(0);
      expect(component.subFilteredDrugMaster).toBe(
        component.filteredDrugMaster,
      );
      expect(component.filteredDrugDoseMaster).toEqual([
        { id: 1, itemFormID: 1, dose: '1 tab' },
      ]);
    });

    it('filterMedicine narrows by prefix and resets when empty', () => {
      component.filteredDrugMaster = [
        { itemName: 'Paracetamol' },
        { itemName: 'Pantoprazole' },
      ];
      component.filterMedicine('parac');
      expect(component.subFilteredDrugMaster).toEqual([
        { itemName: 'Paracetamol' },
      ]);
      component.filterMedicine('');
      expect(component.subFilteredDrugMaster).toBe(
        component.filteredDrugMaster,
      );
    });

    describe('reEnterMedicine', () => {
      it('restores the selected drug object', () => {
        component.tempDrugName = 'typed';
        Object.assign(component.currentPrescription, {
          id: 1,
          drugID: 10,
          drugName: 'Paracetamol',
          quantity: 5,
          drugStrength: '500',
          drugUnit: 'mg',
        });
        component.reEnterMedicine();
        expect(component.tempDrugName).toEqual(
          jasmine.objectContaining({
            itemID: 10,
            itemName: 'Paracetamol',
            quantityInHand: 5,
          }),
        );
      });

      it('clears the typed drug when nothing was selected', () => {
        component.tempDrugName = 'typed';
        component.reEnterMedicine();
        expect(component.tempDrugName).toBeNull();
      });

      it('resets details and reloads form lists when no drug typed', () => {
        component.tempform = { itemFormID: 1, itemFormName: 'Tablet' };
        component.reEnterMedicine();
        expect(component.currentPrescription.formID).toBe(1);
        expect(component.isStockAvalable).toBe('');
      });
    });

    describe('selectMedicineObject', () => {
      const option = (extra: any = {}) => ({
        id: 1,
        itemID: 10,
        itemName: 'Paracetamol',
        quantityInHand: 5,
        strength: '500',
        unitOfMeasurement: 'mg',
        sctCode: 'S',
        sctTerm: 'T',
        isEDL: true,
        ...extra,
      });

      beforeEach(
        () =>
          (component.drugPrescriptionForm = form.get(
            'prescription',
          ) as FormGroup),
      );

      it('selects an in-stock drug', () => {
        component.selectMedicineObject({
          isUserInput: true,
          source: { value: option() },
        });
        expect(component.currentPrescription.drugID).toBe(10);
        expect(component.currentPrescription.sctTerm).toBe('T');
        expect(component.isStockAvalable).toBe('primary');
      });

      it('ignores programmatic selection', () => {
        component.selectMedicineObject({
          isUserInput: false,
          source: { value: option() },
        });
        expect(component.currentPrescription.drugID).toBeNull();
      });

      it('warns and keeps an out-of-stock drug when confirmed', () => {
        component.selectMedicineObject({
          isUserInput: true,
          source: {
            value: option({
              quantityInHand: 0,
              isEDL: false,
              strength: null,
              unitOfMeasurement: null,
            }),
          },
        });
        expect(confirm.confirm).toHaveBeenCalledWith(
          'info ' + LANGUAGE_EN.nonEDLMedicine,
          LANGUAGE_EN.stockNotAvailableWouldYouPrescribe + ' Paracetamol ',
        );
        expect(component.isStockAvalable).toBe('warn');
      });

      it('clears an out-of-stock drug when declined', () => {
        confirm.confirm.and.returnValue(of(false));
        component.selectMedicineObject({
          isUserInput: true,
          source: { value: option({ quantityInHand: 0 }) },
        });
        expect(component.currentPrescription.drugID).toBe('');
        expect(component.tempDrugName).toBeNull();
        expect(component.isStockAvalable).toBe('');
      });

      it('rejects an already prescribed drug', () => {
        drugs().push(new FormBuilder().group({ drugID: 10 }));
        component.tempform = { itemFormID: 1, itemFormName: 'Tablet' };
        component.selectMedicineObject({
          isUserInput: true,
          source: { value: option() },
        });
        expect(confirm.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.alerts.info.medicinePrescribe,
          'info',
        );
        expect(component.currentPrescription.drugID).toBeNull();
      });
    });

    it('submitForUpload inserts the medicine and clears details', () => {
      Object.assign(component.currentPrescription, {
        drugID: 10,
        drugName: 'Paracetamol',
        drugStrength: '500',
        drugUnit: 'mg',
        duration: 3,
        unit: 'Days',
      });
      component.submitForUpload();
      expect(drugs().length).toBe(1);
      expect(drugs().at(0).value).toEqual(
        jasmine.objectContaining({
          drugID: 10,
          drugStrength: '500mg',
          durationView: '3 Days',
          createdBy: 'doc',
        }),
      );
      expect(component.tempform).toBeNull();
      expect(component.currentPrescription.drugID).toBeNull();
      expect(component.getPrescribedDrugs()!.length).toBe(1);
    });

    it('setLimits computes the page window', () => {
      component.setLimits(2);
      expect(component.pageLimits).toEqual([10, 15]);
    });

    describe('deleteMedicine', () => {
      beforeEach(() => {
        drugs().push(new FormBuilder().group({ drugID: 1 }));
        drugs().push(new FormBuilder().group({ drugID: 2 }));
      });

      it('removes unsaved rows locally', () => {
        component.deleteMedicine(0);
        expect(drugs().length).toBe(1);
        expect(doctor.deleteMedicine).not.toHaveBeenCalled();
      });

      it('deletes saved rows via backend', () => {
        component.deleteMedicine(1, 55 as any);
        expect(doctor.deleteMedicine).toHaveBeenCalledWith(55);
        expect(drugs().length).toBe(1);
      });

      it('keeps rows when backend fails', () => {
        doctor.deleteMedicine.and.returnValue(of({ statusCode: 5000 }));
        component.deleteMedicine(1, 55 as any);
        expect(drugs().length).toBe(2);
      });

      it('keeps rows when not confirmed', () => {
        confirm.confirm.and.returnValue(of(false));
        component.deleteMedicine(0);
        expect(drugs().length).toBe(2);
      });
    });

    it('validateDrug clears typed strings only', () => {
      const med = new FormBuilder().group({ drug: 'x' });
      component.validateDrug({ id: 1 }, med);
      expect(med.value.drug).toBe('x');
      component.validateDrug('typed', med);
      expect(med.value.drug).toBeNull();
    });

    it('checkDrugFormValidity requires all fields', () => {
      const full = {
        drug: 1,
        drugForm: 1,
        dose: 1,
        frequency: 1,
        drugDuration: 1,
        drugDurationUnit: 1,
        specialInstruction: 'x',
      };
      expect(component.checkDrugFormValidity({ value: full })).toBeFalse();
      expect(
        component.checkDrugFormValidity({ value: { ...full, dose: null } }),
      ).toBeTrue();
    });

    it('displayDrugName returns the display name', () => {
      expect(component.displayDrugName({ drugDisplayName: 'Para' })).toBe(
        'Para',
      );
      expect(component.displayDrugName(null)).toBeNull();
    });
  });

  describe('patchDiagnosisDetails', () => {
    beforeEach(() => init());

    const response = () => ({
      findings: {
        complaints: [CC('Fever', 1)],
        clinicalObservation: 'obs',
      },
      investigation: {
        laboratoryList: [
          { procedureID: 1, procedureName: 'RBS Test' },
          { procedureID: 3, procedureName: 'X-Ray' },
          { procedureID: 9, procedureName: 'Unknown' },
        ],
      },
      diagnosis: {
        externalInvestigation: 'ext',
        instruction: 'rest',
        prescriptionID: 77,
        counsellingProvided: ['Diet'],
        provisionalDiagnosisList: [
          { term: 'Viral fever', conceptID: 'C1' },
          { term: 'URTI', conceptID: 'C2' },
        ],
      },
      prescription: [{ id: 5, drugID: 10, drugStrength: '500' }],
    });

    it('patches complaints, tests, diagnosis and prescription', () => {
      component.patchDiagnosisDetails(response());
      expect(component.dataSource.data.length).toBe(1);
      expect(
        component.chiefComplaintMaster.map((c: any) => c.chiefComplaint),
      ).toEqual(['Cough', 'Headache']);
      expect(component.chiefComplaintTemporarayList[0].length).toBe(2);
      expect(component.rbsSelectedInInvestigation).toBeTrue();
      expect(nurse.setRbsSelectedInInvestigation).toHaveBeenCalledWith(true);
      expect(form.value.test.map((t: any) => t.procedureID)).toEqual([1]);
      expect(form.value.radiology.map((t: any) => t.procedureID)).toEqual([3]);
      expect(form.value.clinicalObservation).toBe('obs');
      expect(form.value.externalInvestigation).toBe('ext');
      expect(form.controls['instruction'].value).toBe('rest');
      expect(form.value.prescriptionID).toBe(77);
      expect(form.value.counsellingProvided).toEqual(['Diet']);
      expect(diagnoses().length).toBe(3);
      expect(
        diagnoses().at(1).get('viewProvisionalDiagnosisProvided')!.disabled,
      ).toBeTrue();
      expect(diagnoses().at(1).value.term).toBe('URTI');
      expect(drugs().length).toBe(1);
      expect(drugs().at(0).value.id).toBe(5);
    });

    it('handles a sparse response', () => {
      component.patchDiagnosisDetails({
        findings: null,
        investigation: null,
        diagnosis: {},
        prescription: [],
      });
      expect(form.value.clinicalObservation).toBeNull();
      expect(drugs().length).toBe(0);
    });

    it('does nothing for a null response', () => {
      component.patchDiagnosisDetails(null);
      expect(component.dataSource.data.length).toBe(0);
    });

    it('patchMMUDiagnosisDetails merges MMU and current responses', () => {
      component.diagnosisResponse = {
        findings: { complaints: [CC('Cough', 2)] },
        diagnosis: {
          provisionalDiagnosisList: [{ term: 'Asthma', conceptID: 'C3' }],
        },
      };
      const r: any = response();
      r.diagnosis.provisionalDiagnosisList = [
        { term: 'Viral fever', conceptID: 'C1' },
      ];
      component.patchMMUDiagnosisDetails(r);
      expect(
        component.benChiefComplaints.map((c: any) => c.chiefComplaint),
      ).toEqual(['Fever', 'Cough']);
      expect(
        component.chiefComplaintMaster.map((c: any) => c.chiefComplaint),
      ).toEqual(['Headache']);
      expect(form.value.radiology.length).toBe(1);
      expect(form.value.prescriptionID).toBe(77);
      expect(diagnoses().length).toBe(2);
      expect(diagnoses().at(1).value.term).toBe('Asthma');
      expect(drugs().length).toBe(1);
    });

    it('patchMMUDiagnosisDetails handles sparse and null responses', () => {
      component.patchMMUDiagnosisDetails(null);
      component.patchMMUDiagnosisDetails({
        findings: null,
        investigation: null,
        diagnosis: {},
        prescription: [],
      });
      expect(form.value.clinicalObservation).toBeNull();
    });
  });

  describe('chief complaints', () => {
    beforeEach(() => init());

    it('getSnomedCTRecord patches the concept id', () => {
      master.getSnomedCTRecord.and.returnValue(
        of({ data: { conceptID: 'X1' } }),
      );
      component.getSnomedCTRecord('Fever', 0);
      expect(complaints().at(0).value.conceptID).toBe('X1');
    });

    it('getSnomedCTRecord ignores empty responses', () => {
      master.getSnomedCTRecord.and.returnValue(of({ data: {} }));
      component.getSnomedCTRecord('Fever', 0);
      expect(complaints().at(0).value.conceptID).toBeNull();
    });

    it('addChiefComplaint adds a row and a temp list excluding chosen complaints', () => {
      complaints()
        .at(0)
        .patchValue({ chiefComplaint: CC('Fever', 1) });
      component.addChiefComplaint();
      expect(complaints().length).toBe(2);
      expect(
        component.chiefComplaintTemporarayList[1].map(
          (c: any) => c.chiefComplaint,
        ),
      ).toEqual(['Cough', 'Headache']);
    });

    it('addChiefComplaint throws while an existing row is still empty (current behaviour)', () => {
      expect(() => component.addChiefComplaint()).toThrowError(TypeError);
    });

    it('addChiefComplaint skips the temp list when all complaints are used', () => {
      component.chiefComplaintMaster = [];
      complaints()
        .at(0)
        .patchValue({ chiefComplaint: CC('Fever', 1) });
      component.addChiefComplaint();
      expect(component.chiefComplaintTemporarayList.length).toBe(1);
      expect(complaints().length).toBe(2);
    });

    it('filterComplaints selects the complaint and removes it from other lists', () => {
      master.getSnomedCTRecord.and.returnValue(of({ data: {} }));
      const fever = component.chiefComplaintMaster[0];
      component.chiefComplaintTemporarayList[1] =
        component.chiefComplaintMaster.slice();
      component.selectedChiefComplaintList[0] = CC('Old', 9);
      component.filterComplaints(fever, 0);
      expect(component.selectedChiefComplaintList[0]).toBe(fever);
      expect(component.chiefComplaintTemporarayList[1]).not.toContain(fever);
      expect(
        component.chiefComplaintTemporarayList[1].map(
          (c: any) => c.chiefComplaint,
        ),
      ).toContain('Old');
      expect(component.suggestedChiefComplaintList[0]).toEqual([fever]);
    });

    describe('suggestChiefComplaintList', () => {
      it('filters by typed string', () => {
        const fg = new FormBuilder().group({ chiefComplaint: 'cou' });
        component.suggestChiefComplaintList(fg, 0);
        expect(
          component.suggestedChiefComplaintList[0].map(
            (c: any) => c.chiefComplaint,
          ),
        ).toEqual(['Cough']);
      });

      it('resets the control when nothing matches', () => {
        const fg = new FormBuilder().group({ chiefComplaint: 'zzz' });
        component.suggestChiefComplaintList(fg, 0);
        expect(fg.value.chiefComplaint).toBeNull();
      });

      it('clears concept and description for empty input', () => {
        complaints().at(0).patchValue({ conceptID: 'C', description: 'd' });
        component.suggestChiefComplaintList(
          new FormBuilder().group({ chiefComplaint: '' }),
          0,
        );
        expect(complaints().at(0).value.conceptID).toBeNull();
        expect(complaints().at(0).value.description).toBeNull();
      });

      it('ignores objects without a complaint name but still checks length', () => {
        component.suggestedChiefComplaintList[0] = [CC('Fever')];
        const fg = new FormBuilder().group({ chiefComplaint: 5 as any });
        component.suggestChiefComplaintList(fg, 0);
        expect(fg.value.chiefComplaint).toBe(5);
      });
    });

    describe('deleting complaints', () => {
      beforeEach(() => {
        complaints()
          .at(0)
          .patchValue({ chiefComplaint: component.chiefComplaintMaster[0] });
        component.addChiefComplaint();
        component.selectedChiefComplaintList[0] = CC('Fever', 1);
        component.suggestedChiefComplaintList[0] = [CC('Fever', 1)];
      });

      it('deleteChiefComplaint returns the complaint to other lists and removes the row', () => {
        const before = component.chiefComplaintTemporarayList[1].length;
        component.deleteChiefComplaint(0, complaints().at(0));
        expect(complaints().length).toBe(1);
        expect(component.chiefComplaintTemporarayList[1].length).toBe(
          before + 1,
        );
        expect(component.selectedChiefComplaintList[0]).toBeNull();
        expect(component.suggestedChiefComplaintList[0]).toBeNull();
        expect(form.dirty).toBeTrue();
      });

      it('deleteChiefComplaint resets the last remaining row', () => {
        complaints().removeAt(1);
        component.deleteChiefComplaint(0, complaints().at(0));
        expect(complaints().length).toBe(1);
        expect(complaints().at(0).value.chiefComplaint).toBeNull();
      });

      it('deleteChiefComplaint does nothing when not confirmed', () => {
        confirm.confirm.and.returnValue(of(false));
        component.deleteChiefComplaint(0, complaints().at(0));
        expect(complaints().length).toBe(2);
      });

      it('deleteChiefComplaintRow removes without confirmation', () => {
        component.deleteChiefComplaintRow(0, complaints().at(0) as FormGroup);
        expect(complaints().length).toBe(1);
        expect(confirm.confirm).not.toHaveBeenCalled();
      });

      it('deleteChiefComplaintRow resets an empty last row', () => {
        complaints().removeAt(1);
        complaints().at(0).reset();
        component.deleteChiefComplaintRow(0, complaints().at(0) as FormGroup);
        expect(complaints().length).toBe(1);
      });

      it('deleteChiefComplaint handles an empty row', () => {
        complaints().at(1).reset();
        component.deleteChiefComplaint(1, complaints().at(1));
        expect(complaints().length).toBe(1);
      });
    });

    it('sortChiefComplaintList sorts alphabetically', () => {
      const list = [CC('b'), CC('a'), CC('b')];
      component.sortChiefComplaintList(list);
      expect(list.map((c) => c.chiefComplaint)).toEqual(['a', 'b', 'b']);
    });

    it('displayChiefComplaint and checkComplaintFormValidity', () => {
      expect(component.displayChiefComplaint(CC('Fever'))).toBe('Fever');
      expect(
        component.checkComplaintFormValidity({
          value: { chiefComplaint: 'x', conceptID: 'c' },
        }),
      ).toBeFalse();
      expect(
        component.checkComplaintFormValidity({
          value: { chiefComplaint: 'x' },
        }),
      ).toBeTrue();
    });

    it('canDisableComplaints marks previously recorded complaints', () => {
      expect(component.canDisableComplaints(CC('x', 1))).toBeUndefined();
      component.previousChiefComplaints = [CC('Fever', 1)];
      const c1: any = CC('Fever', 1);
      const c2: any = CC('Cough', 2);
      expect(component.canDisableComplaints(c1)).toBeTrue();
      expect(c1.disabled).toBeTrue();
      expect(component.canDisableComplaints(c2)).toBeFalse();
      expect(c2.disabled).toBeFalse();
    });
  });

  describe('tests', () => {
    beforeEach(() => fixture.detectChanges());

    it('canDisableTest disables RBS when a result exists', () => {
      component.rbsTestResultCurrent = 100;
      expect(
        component.canDisableTest({ procedureName: environment.RBSTest }),
      ).toBeTrue();
    });

    it('canDisableTest marks previously ordered tests', () => {
      component.previousLabTestList = [{ procedureID: 2 }];
      const t1: any = { procedureID: 2, procedureName: 'CBC' };
      const t2: any = { procedureID: 3, procedureName: 'X' };
      expect(component.canDisableTest(t1)).toBeTrue();
      expect(t1.disabled).toBeTrue();
      expect(component.canDisableTest(t2)).toBeFalse();
    });

    it('canDisableTest returns undefined without history', () => {
      expect(
        component.canDisableTest({ procedureName: 'CBC' }),
      ).toBeUndefined();
    });

    it('checkTestName flags RBS selection', () => {
      component.checkTestName({
        value: [{ procedureName: 'cbc' }, { procedureName: 'rbs test' }],
      });
      expect(nurse.setRbsSelectedInInvestigation.calls.allArgs()).toEqual([
        [false],
        [true],
      ]);
    });
  });

  describe('provisional diagnosis', () => {
    beforeEach(() => fixture.detectChanges());

    it('addDiagnosis adds up to 30 rows then alerts', () => {
      for (let i = 0; i < 30; i++) component.addDiagnosis();
      expect(diagnoses().length).toBe(30);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.maxDiagnosis,
      );
      expect(component.getProvisionalDiagnosisList()!.length).toBe(30);
    });

    it('removeDiagnosisFromList confirms before removing a valid row', () => {
      component.addDiagnosis();
      diagnoses().at(0).patchValue({
        conceptID: 'C',
        term: 'T',
        viewProvisionalDiagnosisProvided: 'T',
      });
      component.removeDiagnosisFromList(0, diagnoses().at(0));
      expect(confirm.confirm).toHaveBeenCalled();
      expect(diagnoses().length).toBe(1);
      expect(form.dirty).toBeTrue();
    });

    it('removeDiagnosisFromList resets the last valid row', () => {
      const row = diagnoses().at(0) as FormGroup;
      row.patchValue({
        conceptID: 'C',
        term: 'T',
        viewProvisionalDiagnosisProvided: 'T',
      });
      row.controls['viewProvisionalDiagnosisProvided'].disable();
      component.removeDiagnosisFromList(0, row);
      expect(diagnoses().length).toBe(1);
      expect(row.value.term).toBeNull();
      expect(
        row.controls['viewProvisionalDiagnosisProvided'].enabled,
      ).toBeTrue();
    });

    it('removeDiagnosisFromList keeps a valid row when not confirmed', () => {
      confirm.confirm.and.returnValue(of(false));
      diagnoses().at(0).patchValue({
        conceptID: 'C',
        term: 'T',
        viewProvisionalDiagnosisProvided: 'T',
      });
      component.removeDiagnosisFromList(0, diagnoses().at(0));
      expect(diagnoses().at(0).value.term).toBe('T');
    });

    it('removeDiagnosisFromList removes/reset invalid rows without confirmation', () => {
      component.addDiagnosis();
      component.removeDiagnosisFromList(1, diagnoses().at(1));
      expect(diagnoses().length).toBe(1);
      component.removeDiagnosisFromList(0, diagnoses().at(0));
      expect(diagnoses().length).toBe(1);
      expect(confirm.confirm).not.toHaveBeenCalled();
    });

    it('checkProvisionalDiagnosisValidity', () => {
      const v = (val: any) => ({
        value: { viewProvisionalDiagnosisProvided: val },
      });
      expect(component.checkProvisionalDiagnosisValidity(null)).toBeTrue();
      expect(component.checkProvisionalDiagnosisValidity(v('ab'))).toBeTrue();
      expect(component.checkProvisionalDiagnosisValidity(v('abc'))).toBeFalse();
      expect(
        component.checkProvisionalDiagnosisValidity(
          v({ term: 't', conceptID: 'c' }),
        ),
      ).toBeFalse();
      expect(
        component.checkProvisionalDiagnosisValidity(v({ term: 't' })),
      ).toBeTrue();
    });

    it('displayDiagnosis handles strings and objects', () => {
      expect(component.displayDiagnosis('abc')).toBe('abc');
      expect(component.displayDiagnosis({ term: 'T' })).toBe('T');
      expect(component.displayDiagnosis(null)).toBe('');
    });

    it('onDiagnosisSelected patches the row', () => {
      component.onDiagnosisSelected({ term: 'T', conceptID: 'C' }, 0);
      expect(diagnoses().at(0).value).toEqual({
        conceptID: 'C',
        term: 'T',
        viewProvisionalDiagnosisProvided: { term: 'T', conceptID: 'C' },
      });
      component.onDiagnosisSelected(null, 0);
      expect(diagnoses().at(0).value.term).toBeNull();
    });

    describe('diagnosis search paging', () => {
      it('fetches the first page for 3+ characters', () => {
        master.searchDiagnosisBasedOnPageNo.and.returnValue(
          of({ data: { sctMaster: [{ id: 1, term: 'Fever' }] } }),
        );
        component.onDiagnosisInputKeyup(' fev ', 0);
        expect(master.searchDiagnosisBasedOnPageNo).toHaveBeenCalledWith(
          'fev',
          0,
        );
        expect(component.suggestedDiagnosisList[0]).toEqual([
          { id: 1, term: 'Fever' },
        ]);
        expect(component.pageByIndex[0]).toBe(0);
        expect(component.loadingMore[0]).toBeFalse();
      });

      it('clears state for short input', () => {
        component.suggestedDiagnosisList[0] = [{ id: 1 }];
        component.onDiagnosisInputKeyup('fe', 0);
        expect(component.suggestedDiagnosisList[0]).toEqual([]);
        expect(component.lastQueryByIndex[0]).toBe('');
        component.onDiagnosisInputKeyup(null as any, 0);
        expect(master.searchDiagnosisBasedOnPageNo).not.toHaveBeenCalled();
      });

      it('appends de-duplicated results on near-end and marks no more on empty page', () => {
        master.searchDiagnosisBasedOnPageNo.and.returnValues(
          of({ data: { sctMaster: [{ id: 1, term: 'A' }] } }),
          of({
            data: {
              sctMaster: [
                { id: 1, term: 'A' },
                { code: 'x', term: 'B' },
                { term: 'C' },
              ],
            },
          }),
          of({ data: { sctMaster: [] } }),
        );
        component.onDiagnosisInputKeyup('abc', 0);
        component.onAutoNearEnd(0);
        expect(master.searchDiagnosisBasedOnPageNo).toHaveBeenCalledWith(
          'abc',
          1,
        );
        expect(
          component.suggestedDiagnosisList[0].map((d: any) => d.term),
        ).toEqual(['A', 'B', 'C']);
        component.onAutoNearEnd(0);
        expect(component.noMore[0]).toBeTrue();
        component.onAutoNearEnd(0);
        expect(master.searchDiagnosisBasedOnPageNo).toHaveBeenCalledTimes(3);
      });

      it('queues a follow-up page while loading and chains it on complete', () => {
        const first = new Subject<any>();
        master.searchDiagnosisBasedOnPageNo.and.returnValues(
          first.asObservable(),
          of({ data: { sctMaster: [{ id: 2, term: 'B' }] } }),
        );
        component.onDiagnosisInputKeyup('abc', 0);
        component.onAutoNearEnd(0);
        expect(component.wantMore[0]).toBeTrue();
        component.onDiagnosisInputKeyup('abc', 0);
        expect(master.searchDiagnosisBasedOnPageNo).toHaveBeenCalledTimes(1);
        first.next({ data: { sctMaster: [{ id: 1, term: 'A' }] } });
        first.complete();
        expect(master.searchDiagnosisBasedOnPageNo).toHaveBeenCalledTimes(2);
        expect(
          component.suggestedDiagnosisList[0].map((d: any) => d.term),
        ).toEqual(['A', 'B']);
      });

      it('drops stale responses when the query changed', () => {
        const first = new Subject<any>();
        master.searchDiagnosisBasedOnPageNo.and.returnValue(
          first.asObservable(),
        );
        component.onDiagnosisInputKeyup('abc', 0);
        component.lastQueryByIndex[0] = 'xyz';
        first.next({ data: { sctMaster: [{ id: 1 }] } });
        expect(component.suggestedDiagnosisList[0]).toEqual([]);
      });

      it('handles missing data and errors', () => {
        spyOn(console, 'error');
        master.searchDiagnosisBasedOnPageNo.and.returnValues(
          of(null),
          throwingObs(),
        );
        component.onDiagnosisInputKeyup('abc', 0);
        expect(component.suggestedDiagnosisList[0]).toEqual([]);
        expect(component.noMore[0]).toBeTrue();
        component.onDiagnosisInputKeyup('abcd', 0);
        expect(console.error).toHaveBeenCalledWith(
          'Error fetching diagnosis data',
        );
      });

      it('onAutoNearEnd does nothing without a query', () => {
        component.onAutoNearEnd(3);
        expect(master.searchDiagnosisBasedOnPageNo).not.toHaveBeenCalled();
      });
    });
  });

  it('getters read vitals values', () => {
    fixture.detectChanges();
    form.patchValue({
      bMI: 1,
      systolicBP_1stReading: 2,
      diastolicBP_1stReading: 3,
      pulseRate: 4,
      respiratoryRate: 5,
      sPO2: 6,
      bloodGlucose_Fasting: 7,
      bloodGlucose_Random: 8,
      bloodGlucose_2hr_PP: 9,
      rbsTestRemarks: 'r',
      temperature: 10,
    });
    form.controls['bMI'].setValue(1);
    form.controls['systolicBP_1stReading'].setValue(2);
    form.controls['diastolicBP_1stReading'].setValue(3);
    form.controls['pulseRate'].setValue(4);
    form.controls['respiratoryRate'].setValue(5);
    form.controls['sPO2'].setValue(6);
    form.controls['bloodGlucose_Fasting'].setValue(7);
    form.controls['bloodGlucose_Random'].setValue(8);
    form.controls['bloodGlucose_2hr_PP'].setValue(9);
    form.controls['temperature'].setValue(10);
    expect([
      component.bMI,
      component.systolicBP_1stReading,
      component.diastolicBP_1stReading,
      component.pulseRate,
      component.respiratoryRate,
      component.sPO2,
      component.bloodGlucose_Fasting,
      component.bloodGlucose_Random,
      component.bloodGlucose_2hr_PP,
      component.temperature,
    ]).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(component.rbsTestRemarks).toBe('r');
    expect(component.getChiefComplaintList()!.length).toBe(1);
  });

  it('list getters return null for missing arrays', () => {
    component.patientQuickConsultForm = new FormGroup({});
    component.drugPrescriptionForm = new FormGroup({});
    expect(component.getChiefComplaintList()).toBeNull();
    expect(component.getPrescribedDrugs()).toBeNull();
    expect(component.getProvisionalDiagnosisList()).toBeNull();
  });

  it('ngOnDestroy unsubscribes and clears state', () => {
    init();
    const subs = [
      component.masterDataSubscription,
      component.getQuickConsultSubscription,
      component.rbsTestResultSubscription,
      component.rbsSelectedInInvestigationSubscription,
    ];
    nurse.rbsTestResultFromDoctorFetch = 5;
    component.ngOnDestroy();
    subs.forEach((s) => expect(s.closed).toBeTrue());
    expect(nurse.rbsTestResultFromDoctorFetch).toBeNull();
    expect(doctor.setCapturedCaserecordDeatilsByDoctor).toHaveBeenCalledWith(
      null,
    );
  });

  it('ngOnDestroy works without subscriptions', () => {
    component.ngOnDestroy();
    expect(doctor.setCapturedCaserecordDeatilsByDoctor).toHaveBeenCalledWith(
      null,
    );
  });

  it('re-assigns the language set on ngDoCheck', () => {
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });
});
