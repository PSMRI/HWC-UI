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
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { BehaviorSubject, of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import { FamilyHistoryComponent } from './family-history.component';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../../shared/services';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { AmritTrackingService } from 'Common-UI/src/tracking';
import { PreviousDetailsComponent } from 'src/app/app-modules/core/components/previous-details/previous-details.component';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

const makeDiseases = () => [
  { diseaseType: 'Diabetes', snomedCode: 'd1', snomedTerm: 'dt' },
  { diseaseType: 'Asthma', snomedCode: 'a1', snomedTerm: 'at' },
  { diseaseType: 'None', snomedCode: null, snomedTerm: null },
  { diseaseType: 'Other', snomedCode: null, snomedTerm: null },
  { diseaseType: 'Nil', snomedCode: null, snomedTerm: null },
];
const makeMembers = () => [
  { benRelationshipID: 1, benRelationshipType: 'Brother' },
  { benRelationshipID: 2, benRelationshipType: 'Daughter' },
  { benRelationshipID: 3, benRelationshipType: 'Father' },
  { benRelationshipID: 4, benRelationshipType: 'Mother' },
  { benRelationshipID: 5, benRelationshipType: 'Sister' },
  { benRelationshipID: 6, benRelationshipType: 'Son' },
  { benRelationshipID: 7, benRelationshipType: 'Spouse' },
];

describe('FamilyHistoryComponent', () => {
  let component: FamilyHistoryComponent;
  let fixture: ComponentFixture<FamilyHistoryComponent>;
  let masterData$: BehaviorSubject<any>;
  let history$: BehaviorSubject<any>;
  let nurseService: any;
  let confirmation: any;
  let dialog: any;
  let session: any;
  let tracking: any;
  let D: any[];

  const list = () =>
    component.familyHistoryForm.controls['familyDiseaseList'] as FormArray;

  beforeEach(async () => {
    D = makeDiseases();
    masterData$ = new BehaviorSubject<any>(null);
    history$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [FamilyHistoryComponent],
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
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(FamilyHistoryComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(FamilyHistoryComponent);
    component = fixture.componentInstance;
    component.familyHistoryForm = new FormGroup({
      familyDiseaseList: new FormArray<any>([]),
      isGeneticDisorder: new FormControl(null),
      geneticDisorder: new FormControl(null),
      isConsanguineousMarrige: new FormControl(null),
    });
    nurseService = TestBed.inject(NurseService);
    confirmation = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    session = TestBed.inject(SessionStorageService);
    tracking = TestBed.inject(AmritTrackingService);
  });

  it('initialises language and waits for master data', () => {
    fixture.detectChanges();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.masterData).toBeUndefined();
    expect(list().length).toBe(0);
  });

  it('filters family members and adds first disease row', () => {
    const spy = spyOn(component, 'getGeneralHistory');
    fixture.detectChanges();
    const members = makeMembers();
    masterData$.next({ DiseaseTypes: D, familyMemberTypes: members });
    expect(component.diseaseMasterData).toBe(D);
    expect(
      component.familyMemeberMasterData.map((m: any) => m.benRelationshipID),
    ).toEqual([1, 2, 3, 4, 5, 6]);
    // current behaviour: matched members are also appended to master list
    expect(component.masterData.familyMemberTypes.length).toBe(13);
    expect(list().length).toBe(1);
    expect(component.diseaseSelectList[0].length).toBe(5);
    expect(spy).not.toHaveBeenCalled();
    expect(component.getFamilyDiseases()?.length).toBe(1);
  });

  it('loads history in view mode', () => {
    component.mode = 'view';
    const spy = spyOn(component, 'getGeneralHistory');
    fixture.detectChanges();
    masterData$.next({ DiseaseTypes: D, familyMemberTypes: [] });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('loads history for specialist flag 100', () => {
    session.setItem('specialistFlag', '100');
    const spy = spyOn(component, 'getGeneralHistory');
    fixture.detectChanges();
    masterData$.next({ DiseaseTypes: D, familyMemberTypes: [] });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('getFamilyDiseases returns null without FormArray', () => {
    component.familyHistoryForm = new FormGroup({});
    expect(component.getFamilyDiseases()).toBeNull();
  });

  describe('addFamilyDisease', () => {
    beforeEach(() => (component.diseaseMasterData = D));

    it('excludes None and already selected diseases for later rows', () => {
      component.addFamilyDisease();
      list().at(0).patchValue({ diseaseType: D[0] });
      component.addFamilyDisease();
      expect(
        component.diseaseSelectList[1].map((d: any) => d.diseaseType),
      ).toEqual(['Asthma', 'Other', 'Nil']);
    });

    it('keeps Other available', () => {
      component.addFamilyDisease();
      list().at(0).patchValue({ diseaseType: D[3] });
      component.addFamilyDisease();
      expect(
        component.diseaseSelectList[1].map((d: any) => d.diseaseType),
      ).toContain('Other');
    });

    it('does not add options without disease master', () => {
      component.diseaseMasterData = null;
      component.addFamilyDisease();
      expect(component.diseaseSelectList.length).toBe(0);
      expect(list().length).toBe(1);
    });
  });

  describe('getGeneralHistory', () => {
    beforeEach(() => {
      component.diseaseMasterData = D;
      component.addFamilyDisease();
    });

    it('patches rows, maps diseases and enables family members', () => {
      component.getGeneralHistory();
      history$.next({
        statusCode: 200,
        data: {
          FamilyHistory: {
            isGeneticDisorder: 'Yes',
            familyDiseaseList: [
              { diseaseType: 'Diabetes', familyMembers: ['Father'] },
              { diseaseType: null },
            ],
          },
        },
      });
      expect(component.familyHistoryForm.value.isGeneticDisorder).toBe('Yes');
      expect(list().length).toBe(2);
      expect(list().at(0).value.diseaseType).toEqual(D[0]);
      expect(list().at(0).get('familyMembers')?.enabled).toBeTrue();
      expect(list().at(0).dirty).toBeTrue();
      expect(component.previousSelectedDiseaseList[0]).toBe(D[0]);
      expect(component.isGeneticDisorder).toBe('Yes');
    });

    it('ignores response without FamilyHistory', () => {
      component.getGeneralHistory();
      history$.next({ statusCode: 200, data: {} });
      expect(component.familyHistoryData).toBeUndefined();
    });
  });

  describe('filterFamilyDiseaseList', () => {
    beforeEach(() => {
      component.diseaseMasterData = D;
      component.addFamilyDisease();
      component.addFamilyDisease();
    });

    it('sets snomed codes, enables members and removes option from other rows', () => {
      const row = list().at(0);
      row.patchValue({ otherDiseaseType: 'x' });
      component.filterFamilyDiseaseList(D[0], 0, row);
      expect(row.value.snomedCode).toBe('d1');
      expect(row.value.otherDiseaseType).toBeNull();
      expect(row.get('familyMembers')?.enabled).toBeTrue();
      expect(component.diseaseSelectList[1]).not.toContain(D[0]);
    });

    it('clears snomed for Other and returns previous value to other rows', () => {
      const row = list().at(0);
      component.filterFamilyDiseaseList(D[0], 0, row);
      component.filterFamilyDiseaseList(D[3], 0, row);
      expect(row.value.snomedCode).toBeNull();
      expect(component.diseaseSelectList[1]).toContain(D[0]);
      expect(component.diseaseSelectList[1]).toContain(D[3]);
    });

    it('selecting None removes other rows and disables members', () => {
      component.addFamilyDisease();
      component.filterFamilyDiseaseList(D[1], 2, list().at(2));
      const row = list().at(0);
      component.filterFamilyDiseaseList(D[2], 0, row);
      expect(list().length).toBe(1);
      expect(component.diseaseSelectList.length).toBe(1);
      expect(component.diseaseSelectList[0]).toContain(D[1]);
      expect(row.get('familyMembers')?.disabled).toBeTrue();
    });

    it('Nil disables family members; works without a form', () => {
      const row = list().at(0);
      row.get('familyMembers')?.enable();
      component.filterFamilyDiseaseList(D[4], 0, row);
      expect(row.get('familyMembers')?.disabled).toBeTrue();
      component.filterFamilyDiseaseList(D[1], 1, null as any);
      expect(component.previousSelectedDiseaseList[1]).toBe(D[1]);
    });
  });

  describe('removeFamilyDisease', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.diseaseMasterData = D;
      component.addFamilyDisease();
    });

    it('resets the only row', () => {
      const row = list().at(0);
      row.patchValue({ diseaseType: D[0] });
      component.removeFamilyDisease(0, row);
      expect(confirmation.confirm).toHaveBeenCalledWith(
        'warn',
        LANGUAGE_EN.alerts.info.warn,
      );
      expect(list().length).toBe(1);
      expect(row.value.diseaseType).toBeNull();
    });

    it('removes a row and returns its disease to other lists', () => {
      component.addFamilyDisease();
      component.filterFamilyDiseaseList(D[1], 1, list().at(1));
      expect(component.diseaseSelectList[0]).not.toContain(D[1]);
      component.removeFamilyDisease(1, list().at(1));
      expect(list().length).toBe(1);
      expect(component.diseaseSelectList[0]).toContain(D[1]);
    });

    it('does nothing when cancelled', () => {
      confirmation.confirm.and.returnValue(of(false));
      component.addFamilyDisease();
      component.removeFamilyDisease(1, list().at(1));
      expect(list().length).toBe(2);
    });
  });

  describe('getPreviousFamilyHistory', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.visitCategory = 'General OPD';
    });

    it('opens dialog when data exists', () => {
      const data = { data: [{ a: 1 }] };
      nurseService.getPreviousFamilyHistory.and.returnValue(
        of({ statusCode: 200, data }),
      );
      component.getPreviousFamilyHistory();
      expect(nurseService.getPreviousFamilyHistory).toHaveBeenCalledWith(
        'B1',
        'General OPD',
      );
      expect(dialog.open).toHaveBeenCalledWith(PreviousDetailsComponent, {
        data: {
          dataList: data,
          title:
            LANGUAGE_EN.historyData.ancHistory.familyHistoryDataANC_OPD_NCD_PNC
              .previousFamilyHistory,
        },
      });
    });

    it('alerts when empty', () => {
      nurseService.getPreviousFamilyHistory.and.returnValue(
        of({ statusCode: 200, data: { data: [] } }),
      );
      component.getPreviousFamilyHistory();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.historyData.ancHistory.previousHistoryDetails
          .pastHistoryalert,
      );
    });

    it('alerts error on non-200', () => {
      nurseService.getPreviousFamilyHistory.and.returnValue(
        of({ statusCode: 5000, data: null }),
      );
      component.getPreviousFamilyHistory();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.errorFetchingHistory,
        'error',
      );
    });

    it('alerts error on failure', () => {
      nurseService.getPreviousFamilyHistory.and.returnValue(throwingObs());
      component.getPreviousFamilyHistory();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.errorFetchingHistory,
        'error',
      );
    });
  });

  it('resetOtherGeneticOrder clears genetic disorder', () => {
    component.familyHistoryForm.patchValue({ geneticDisorder: 'x' });
    component.resetOtherGeneticOrder();
    expect(component.familyHistoryForm.value.geneticDisorder).toBeNull();
  });

  it('sortDiseaseList sorts by disease type', () => {
    const l = [
      { diseaseType: 'b' },
      { diseaseType: 'a' },
      { diseaseType: 'a' },
    ];
    component.sortDiseaseList(l);
    expect(l.map((x) => x.diseaseType)).toEqual(['a', 'a', 'b']);
  });

  it('checkValidity is false only with disease and members', () => {
    expect(component.checkValidity({ value: { diseaseType: 'x' } })).toBeTrue();
    expect(
      component.checkValidity({
        value: { diseaseType: 'x', familyMembers: ['Father'] },
      }),
    ).toBeFalse();
  });

  it('trackFieldInteraction delegates to tracking service', () => {
    component.trackFieldInteraction('Disease');
    expect(tracking.trackFieldInteraction).toHaveBeenCalledWith(
      'Disease',
      'Family History',
    );
  });

  it('unsubscribes on destroy', () => {
    fixture.detectChanges();
    component.getGeneralHistory();
    const s1 = spyOn(component.nurseMasterDataSubscription, 'unsubscribe');
    const s2 = spyOn(component.generalHistorySubscription, 'unsubscribe');
    component.ngOnDestroy();
    expect(s1).toHaveBeenCalled();
    expect(s2).toHaveBeenCalled();
  });

  it('ngOnDestroy without subscriptions does not throw', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('ngDoCheck assigns language', () => {
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });
});
