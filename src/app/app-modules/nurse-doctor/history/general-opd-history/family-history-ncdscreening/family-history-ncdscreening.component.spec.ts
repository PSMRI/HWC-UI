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
import { FormArray, FormBuilder, FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, of } from 'rxjs';

import { FamilyHistoryNcdscreeningComponent } from './family-history-ncdscreening.component';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../../shared/services';
import { IdrsscoreService } from '../../../shared/services/idrsscore.service';
import { BeneficiaryDetailsService } from 'src/app/app-modules/core/services/beneficiary-details.service';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { PreviousDetailsComponent } from 'src/app/app-modules/core/components/previous-details/previous-details.component';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

const diseases = () => [
  { diseaseType: 'Asthma', snomedCode: '1', snomedTerm: 'asthma' },
  { diseaseType: 'Diabetes Mellitus', snomedCode: '2', snomedTerm: 'dm' },
  { diseaseType: 'None', snomedCode: null },
  { diseaseType: 'Other', snomedCode: null },
];

describe('FamilyHistoryNcdscreeningComponent', () => {
  let component: FamilyHistoryNcdscreeningComponent;
  let fixture: ComponentFixture<FamilyHistoryNcdscreeningComponent>;
  let masterData$: BehaviorSubject<any>;
  let history$: BehaviorSubject<any>;
  let ben$: BehaviorSubject<any>;
  let nurse: any;
  let idrs: any;
  let confirm: any;
  let dialog: any;
  let session: any;
  let master: any;

  const list = () =>
    component.familyHistoryForm.get('familyDiseaseList') as FormArray;

  beforeEach(async () => {
    masterData$ = new BehaviorSubject<any>(null);
    history$ = new BehaviorSubject<any>(null);
    ben$ = new BehaviorSubject<any>({ ageVal: 40 });
    idrs = autoSpy(IdrsscoreService, { IDRSFamilyScore$: of(10) });
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [FamilyHistoryNcdscreeningComponent],
      providers: [
        ...commonTestProviders({ session: { beneficiaryRegID: 'B1' } }),
        {
          provide: MasterdataService,
          useValue: autoSpy(MasterdataService, {
            nurseMasterData$: masterData$.asObservable(),
          }),
        },
        { provide: NurseService, useValue: autoSpy(NurseService) },
        {
          provide: DoctorService,
          useValue: autoSpy(DoctorService, {
            populateHistoryResponse$: history$.asObservable(),
          }),
        },
        { provide: IdrsscoreService, useValue: idrs },
        {
          provide: BeneficiaryDetailsService,
          useValue: autoSpy(BeneficiaryDetailsService, {
            beneficiaryDetails$: ben$.asObservable(),
          }),
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(FamilyHistoryNcdscreeningComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(FamilyHistoryNcdscreeningComponent);
    component = fixture.componentInstance;
    component.familyHistoryForm = TestBed.inject(FormBuilder).group({
      familyDiseaseList: new FormArray([]),
      isGeneticDisorder: null,
      geneticDisorder: null,
      isConsanguineousMarrige: null,
    });
    component.visitCategory = 'NCD screening';
    nurse = TestBed.inject(NurseService);
    confirm = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    session = TestBed.inject(SessionStorageService);
    master = { DiseaseTypes: diseases(), familyMemberTypes: ['Father'] };
  });

  const load = () => {
    fixture.detectChanges();
    masterData$.next(master);
  };

  describe('init', () => {
    it('clears idrs, tracks family score, age and seeds one row', () => {
      load();
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(idrs.clearMessage).toHaveBeenCalled();
      expect(component.idrsscoredummy).toBe(10);
      expect(component.age).toBe(40);
      expect(list().length).toBe(1);
      expect(component.diseaseSelectList[0].length).toBe(4);
      expect(component.familyMemeberMasterData).toEqual(['Father']);
      expect(component.getFamilyDiseases()?.length).toBe(1);
    });

    it('defaults age to 0 when missing and ignores null beneficiary', () => {
      ben$.next({});
      fixture.detectChanges();
      expect(component.age).toBe(0);
      ben$.next(null);
      expect(component.age).toBe(0);
    });

    it('loads history in view mode and for specialist 100', () => {
      const spy = spyOn(component, 'getGeneralHistory');
      component.mode = 'view';
      session.setItem('specialistFlag', '100');
      load();
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('ngOnDestroy unsubscribes', () => {
      load();
      component.getGeneralHistory();
      const a = spyOn(component.nurseMasterDataSubscription, 'unsubscribe');
      const b = spyOn(component.generalHistorySubscription, 'unsubscribe');
      component.ngOnDestroy();
      expect(a).toHaveBeenCalled();
      expect(b).toHaveBeenCalled();
    });

    it('getFamilyDiseases returns null for non array', () => {
      component.familyHistoryForm = new FormBuilder().group({
        familyDiseaseList: null,
      });
      expect(component.getFamilyDiseases()).toBeNull();
    });

    it('isGeneticDisorder getter and resetOtherGeneticOrder', () => {
      component.familyHistoryForm.patchValue({
        isGeneticDisorder: 'Yes',
        geneticDisorder: 'x',
      });
      expect(component.isGeneticDisorder).toBe('Yes');
      component.resetOtherGeneticOrder();
      expect(component.familyHistoryForm.value.geneticDisorder).toBeNull();
    });
  });

  it('populates rows from history and patches diabetes idrs score', () => {
    component.mode = 'view';
    load();
    history$.next({
      statusCode: 200,
      data: {
        FamilyHistory: {
          isGeneticDisorder: 'No',
          familyDiseaseList: [
            { diseaseType: 'Asthma', familyMembers: ['Mother'] },
            {
              diseaseType: 'Diabetes Mellitus',
              familyMembers: ['Father', 'Mother'],
            },
          ],
        },
      },
    });
    expect(component.familyHistoryForm.value.isGeneticDisorder).toBe('No');
    expect(list().length).toBe(2);
    expect(list().at(1).value.diseaseType.diseaseType).toBe(
      'Diabetes Mellitus',
    );
    expect(idrs.setIDRSFamilyScore).toHaveBeenCalledWith(20);
  });

  it('ignores history without family history', () => {
    load();
    component.getGeneralHistory();
    history$.next({ statusCode: 200, data: {} });
    expect(component.familyHistoryData).toBeUndefined();
  });

  describe('rows', () => {
    beforeEach(load);

    it('addFamilyDisease excludes used types and None', () => {
      list().at(0).patchValue({ diseaseType: diseases()[0] });
      component.addFamilyDisease();
      const types = component.diseaseSelectList[1].map(
        (d: any) => d.diseaseType,
      );
      expect(types).toEqual(['Diabetes Mellitus', 'Other']);
    });

    it('addFamilyDisease keeps Other and works without master', () => {
      list()
        .at(0)
        .patchValue({ diseaseType: { diseaseType: 'Other' } });
      component.addFamilyDisease();
      expect(
        component.diseaseSelectList[1].map((d: any) => d.diseaseType),
      ).toContain('Other');
      component.diseaseMasterData = null;
      component.addFamilyDisease();
      expect(list().length).toBe(3);
      expect(component.diseaseSelectList.length).toBe(2);
    });

    it('addFamilyDiseaseTest restores deleted types that are not re-used', () => {
      list().at(0).patchValue({
        diseaseType: diseases()[0],
        deleted: true,
      });
      component.addFamilyDiseaseTest(0);
      expect(list().length).toBe(2);
      expect(
        component.diseaseSelectList[1].map((d: any) => d.diseaseType),
      ).toContain('Asthma');
    });

    it('addFamilyDiseaseTest does not restore a deleted type still in use', () => {
      list().at(0).patchValue({ diseaseType: diseases()[0], deleted: true });
      component.addFamilyDisease();
      list().at(1).patchValue({ diseaseType: diseases()[0], deleted: false });
      component.addFamilyDiseaseTest(1);
      expect(
        component.diseaseSelectList[2].map((d: any) => d.diseaseType),
      ).not.toContain('Asthma');
    });

    it('addFamilyDiseaseTest without master only adds a row', () => {
      component.diseaseMasterData = null;
      component.addFamilyDiseaseTest(0);
      expect(list().length).toBe(2);
    });

    it('filterFamilyDiseaseList copies snomed codes and resets idrs without diabetes', () => {
      const row = list().at(0);
      const asthma = component.diseaseSelectList[0][0];
      row.patchValue({ diseaseType: asthma, familyMembers: ['Father'] });
      component.addFamilyDisease();
      list().at(1).patchValue({ diseaseType: diseases()[3] });
      component.filterFamilyDiseaseList(asthma, 0, row);
      expect(row.value.snomedCode).toBe('1');
      expect(row.value.snomedTerm).toBe('asthma');
      expect(row.value.familyMembers).toBeNull();
      expect(idrs.setIDRSFamilyScore).toHaveBeenCalledWith(0);
      expect(component.previousSelectedDiseaseList[0]).toBe(asthma);
    });

    it('filterFamilyDiseaseList clears snomed for Other and codeless types', () => {
      const row = list().at(0);
      row.patchValue({
        diseaseType: { diseaseType: 'Diabetes Mellitus' },
        snomedCode: 'x',
      });
      component.filterFamilyDiseaseList({ diseaseType: 'Other' }, 0, row);
      expect(row.value.snomedCode).toBeNull();
      expect(idrs.setIDRSFamilyScore).not.toHaveBeenCalled();
      row.patchValue({ snomedCode: 'x' });
      component.filterFamilyDiseaseList(
        { diseaseType: 'Foo', snomedCode: null },
        0,
        row,
      );
      expect(row.value.snomedCode).toBeNull();
    });

    it('filterFamilyDiseaseList moves previous value back to other lists', () => {
      component.addFamilyDisease();
      list().at(0).patchValue({ diseaseType: diseases()[0] });
      list().at(1).patchValue({ diseaseType: diseases()[3] });
      const asthma = component.diseaseSelectList[1][0];
      component.filterFamilyDiseaseList(asthma, 0);
      expect(component.diseaseSelectList[1]).not.toContain(asthma);
      const dm = component.diseaseSelectList[1][0];
      component.filterFamilyDiseaseList(dm, 0);
      expect(component.diseaseSelectList[1]).toContain(asthma);
    });

    it('filterFamilyDiseaseList with None removes other rows', () => {
      component.addFamilyDisease();
      component.addFamilyDisease();
      component.previousSelectedDiseaseList[2] = diseases()[1];
      list().controls.forEach((c) =>
        c.patchValue({ diseaseType: diseases()[2] }),
      );
      component.filterFamilyDiseaseList(diseases()[2], 0);
      expect(list().length).toBe(1);
      expect(component.diseaseSelectList.length).toBe(1);
    });

    it('checkValidity requires type and members', () => {
      const row = list().at(0);
      expect(component.checkValidity(row)).toBeTrue();
      row.patchValue({ diseaseType: diseases()[0], familyMembers: ['Father'] });
      expect(component.checkValidity(row)).toBeFalse();
    });

    it('sortDiseaseList', () => {
      const l = [
        { diseaseType: 'b' },
        { diseaseType: 'a' },
        { diseaseType: 'b' },
      ];
      component.sortDiseaseList(l);
      expect(l.map((x) => x.diseaseType)).toEqual(['a', 'b', 'b']);
    });
  });

  describe('removeFamilyDisease', () => {
    beforeEach(load);

    it('marks a saved single row deleted and adds a fresh row', () => {
      const row = list().at(0);
      row.patchValue({ ID: 5, diseaseType: diseases()[1] });
      component.previousSelectedDiseaseList[0] = {
        diseaseType: 'Diabetes Mellitus',
      };
      component.removeFamilyDisease(0, row);
      expect(confirm.confirm).toHaveBeenCalledWith(
        'warn',
        LANGUAGE_EN.alerts.info.warn,
      );
      expect(list().length).toBe(2);
      expect(idrs.setIDRSFamilyScore).toHaveBeenCalledWith(0);
      expect(component.diseaseSelectList.length).toBe(2);
    });

    it('resets an unsaved single row', () => {
      const row = list().at(0);
      row.patchValue({ diseaseType: diseases()[1] });
      component.previousSelectedDiseaseList[0] = {
        diseaseType: 'Diabetes Mellitus',
      };
      component.removeFamilyDisease(0, row);
      expect(list().length).toBe(1);
      expect(row.value.diseaseType).toBeNull();
      expect(row.value.deleted).toBeFalse();
      expect(idrs.setIDRSFamilyScore).toHaveBeenCalledWith(0);
    });

    it('resets an unsaved single non-diabetes row without touching idrs', () => {
      const row = list().at(0);
      component.previousSelectedDiseaseList[0] = { diseaseType: 'Asthma' };
      component.removeFamilyDisease(0, row);
      expect(idrs.setIDRSFamilyScore).not.toHaveBeenCalled();
    });

    it('marks single saved non-diabetes row deleted without idrs reset', () => {
      const row = list().at(0);
      row.patchValue({ ID: 3 });
      component.previousSelectedDiseaseList[0] = { diseaseType: 'Asthma' };
      component.removeFamilyDisease(0, row);
      expect(list().length).toBe(2);
      expect(idrs.setIDRSFamilyScore).not.toHaveBeenCalled();
    });

    it('removes an unsaved row among many and restores its type', () => {
      component.addFamilyDisease();
      const dm = { diseaseType: 'Diabetes Mellitus' };
      component.previousSelectedDiseaseList[1] = dm;
      component.removeFamilyDisease(1, list().at(1));
      expect(list().length).toBe(1);
      expect(component.diseaseSelectList[0]).toContain(dm);
      expect(idrs.setIDRSFamilyScore).toHaveBeenCalledWith(0);
    });

    it('flags a saved row among many as deleted', () => {
      component.addFamilyDisease();
      list().at(1).patchValue({ ID: 9 });
      component.previousSelectedDiseaseList[1] = { diseaseType: 'Other' };
      component.removeFamilyDisease(1);
      expect(list().length).toBe(2);
      expect(component.diseaseSelectList[1]).toEqual([]);
    });

    it('adds a fresh row when all rows are deleted', () => {
      component.addFamilyDisease();
      list().at(0).patchValue({ ID: 1, deleted: true });
      component.previousSelectedDiseaseList[1] = null;
      component.removeFamilyDisease(1);
      // unsaved row removed, only a deleted row remains -> a fresh row is added
      expect(list().length).toBe(2);
      expect(list().at(1).value.ID).toBeNull();
      expect(component.diseaseSelectList.length).toBe(2);
    });

    it('does nothing when cancelled', () => {
      confirm.confirm.and.returnValue(of(false));
      component.removeFamilyDisease(0, list().at(0));
      expect(component.familyHistoryForm.dirty).toBeFalse();
    });
  });

  describe('idrs scoring', () => {
    beforeEach(load);

    const group = (type: string) =>
      new FormBuilder().group({ diseaseType: { diseaseType: type } });

    it('scores 10 for one parent, 20 for both, 0 otherwise', () => {
      component.filterFamilyMembers(
        new FormControl(['Father']),
        group('Diabetes Mellitus'),
      );
      expect(idrs.setIDRSFamilyScore).toHaveBeenCalledWith(10);
      expect(session.setItem).toHaveBeenCalledWith(
        'IdRSScoreFamilyHistory',
        '10',
      );
      component.filterFamilyMembers(
        new FormControl(['Mother', 'Father']),
        group('Diabetes Mellitus'),
      );
      expect(idrs.setIDRSFamilyScore).toHaveBeenCalledWith(20);
      component.filterFamilyMembers(
        new FormControl(['Father', 'Mother']),
        group('Diabetes Mellitus'),
      );
      component.filterFamilyMembers(
        new FormControl([]),
        group('Diabetes Mellitus'),
      );
      expect(idrs.setIDRSFamilyScore).toHaveBeenCalledWith(0);
      expect(idrs.setIDRSScoreFlag).toHaveBeenCalledTimes(4);
    });

    it('does not score other diseases', () => {
      component.filterFamilyMembers(
        new FormControl(['Father']),
        group('Asthma'),
      );
      expect(idrs.setIDRSFamilyScore).not.toHaveBeenCalled();
    });

    it('patchFamilyMembersIDRSScore computes the same scores', () => {
      component.patchFamilyMembersIDRSScore(['Mother']);
      expect(idrs.setIDRSFamilyScore).toHaveBeenCalledWith(10);
      component.patchFamilyMembersIDRSScore(['Mother', 'Father']);
      expect(idrs.setIDRSFamilyScore).toHaveBeenCalledWith(20);
      component.patchFamilyMembersIDRSScore(['Father', 'Mother']);
      component.patchFamilyMembersIDRSScore([]);
      expect(idrs.setIDRSFamilyScore).toHaveBeenCalledWith(0);
    });
  });

  describe('getPreviousFamilyHistory', () => {
    beforeEach(() => fixture.detectChanges());

    it('opens dialog when data exists', () => {
      const data = { data: [{}] };
      nurse.getPreviousFamilyHistory.and.returnValue(
        of({ statusCode: 200, data }),
      );
      component.getPreviousFamilyHistory();
      expect(nurse.getPreviousFamilyHistory).toHaveBeenCalledWith(
        'B1',
        'NCD screening',
      );
      expect(dialog.open).toHaveBeenCalledWith(PreviousDetailsComponent, {
        data: {
          dataList: data,
          title: LANGUAGE_EN.historyData.familyhistory.previousfamilyhistory,
        },
      });
    });

    it('alerts on empty, error status and failure', () => {
      nurse.getPreviousFamilyHistory.and.returnValue(
        of({ statusCode: 200, data: { data: [] } }),
      );
      component.getPreviousFamilyHistory();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.pastHistoryNot,
      );
      nurse.getPreviousFamilyHistory.and.returnValue(of({ statusCode: 500 }));
      component.getPreviousFamilyHistory();
      nurse.getPreviousFamilyHistory.and.returnValue(throwingObs());
      component.getPreviousFamilyHistory();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.errorFetchingHistory,
        'error',
      );
      expect(confirm.alert).toHaveBeenCalledTimes(3);
    });
  });

  it('ngDoCheck refreshes language', () => {
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });
});
