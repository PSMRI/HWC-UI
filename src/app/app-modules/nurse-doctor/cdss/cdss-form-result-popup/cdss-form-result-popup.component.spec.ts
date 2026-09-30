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
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { CDSSService } from '../../shared/services/cdss-service';
import {
  CdssFormResultPopupComponent,
  ResultFormat,
} from './cdss-form-result-popup.component';

describe('CdssFormResultPopupComponent', () => {
  let component: CdssFormResultPopupComponent;
  let fixture: ComponentFixture<CdssFormResultPopupComponent>;
  let cdss: any;
  let confirm: any;
  let dialogRef: any;
  const patientData = { age: 30, gender: 'M', symptom: 'Fever' };
  const questions = {
    id: 99,
    Questions: [{ q1: { a: 1, b: 2 } }, { q2: { a: 1, b: 2, c: 3 } }],
  };

  beforeEach(async () => {
    cdss = autoSpy(CDSSService);
    cdss.getCdssQuestions.and.returnValue(
      of({ statusCode: 200, data: questions }),
    );
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [CdssFormResultPopupComponent],
      providers: [
        ...commonTestProviders(),
        { provide: MAT_DIALOG_DATA, useValue: { patientData } },
        { provide: CDSSService, useValue: cdss },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(CdssFormResultPopupComponent, '')
      .compileComponents();
    fixture = TestBed.createComponent(CdssFormResultPopupComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService) as any;
    dialogRef = TestBed.inject(MatDialogRef) as any;
    fixture.detectChanges();
  });

  it('loads questions for the patient on init', () => {
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(cdss.getCdssQuestions).toHaveBeenCalledWith(patientData);
    expect(component.questions).toEqual(questions);
    expect(component.questionid).toEqual([]);
  });

  it('getNextSet posts selection and moves to page 2', () => {
    cdss.getCdssAnswers.and.returnValue(of({ data: [{ Disease: 'X' }] }));
    component.getNextSet(null, [1, 2]);
    expect(cdss.getCdssAnswers).toHaveBeenCalledWith({
      complaintId: 99,
      selected: [1, 2],
    });
    expect(component.result).toEqual([{ Disease: 'X' }]);
    expect(component.page1).toBeFalse();
    expect(component.page2).toBeTrue();
  });

  it('assignresult keeps pages when response is empty array', () => {
    component.assignresult([]);
    expect(component.page1).toBeTrue();
    expect(component.page2).toBeFalse();
  });

  it('getAnswers computes answer codes and formats result', () => {
    component.questionid = ['1.2', '2.3'];
    cdss.getCdssAnswers.and.returnValue(
      of({
        Malaria: {
          input: 2,
          acutal: 3,
          recommendation: { Dos: 'rest', Donts: 'run' },
        },
      }),
    );
    component.getAnswers();
    expect(component.sizeQuestion).toEqual([2, 3]);
    expect(cdss.getCdssAnswers).toHaveBeenCalledWith({
      SymptomId: 99,
      response: [2, 5],
    });
    expect(component.showQuestions).toBeFalse();
    expect(component.formattedResult.length).toBe(1);
    expect(component.formattedResult[0].disease).toBe('Malaria');
    expect(component.formattedResult[0].actual).toBe(3);
    expect(component.formattedResult[0].do).toBe('rest');
    expect(component.formattedResult[0].dont).toBe('run');
    expect(component.formattedResult[0] instanceof ResultFormat).toBeTrue();
  });

  it('toggle adds and removes values', () => {
    const el: any = {};
    component.toggle(el, 1);
    component.toggle(el, 2);
    expect(el.selected).toEqual([1, 2]);
    component.toggle(el, 1);
    expect(el.selected).toEqual([2]);
  });

  it('getresult computes percentages and moves to page 3', () => {
    component.page2 = true;
    component.page3 = false;
    component.result = [
      { Disease: 'A', Symptoms: [1, 2, 3], selected: [1] },
      { Disease: 'B', Symptoms: [1], selected: [] },
      { Disease: 'C', Symptoms: [1] },
    ];
    component.getresult();
    expect(component.formattedResult1.map((r: any) => r.percentage)).toEqual([
      '1/3',
      '',
      '',
    ]);
    expect(component.page2).toBeFalse();
    expect(component.page3).toBeTrue();
  });

  it('getresult with empty result keeps pages', () => {
    component.page2 = true;
    component.page3 = false;
    component.result = [];
    component.getresult();
    expect(component.page2).toBeTrue();
    expect(component.page3).toBeFalse();
  });

  it('resetCount clears selections only for arrays', () => {
    component.result = [{ selected: [1] }, { selected: [2] }];
    component.resetCount();
    expect(
      component.result.every((r: any) => r.selected === undefined),
    ).toBeTrue();
    component.result = { selected: [1] };
    component.resetCount();
    expect(component.result.selected).toEqual([1]);
  });

  it('helpers', () => {
    expect([3, 1, 2].sort(component.sortn)).toEqual([1, 2, 3]);
    expect(component.getKeys({ a: 1, b: 2 })).toEqual(['a', 'b']);
    expect(component.getValue({ a: 5 }, 'a')).toBe(5);
    component.handleAnswers('x');
    expect(component.answers).toBe('x');
  });

  describe('getDiseaseName', () => {
    it('adds first disease with selected symptoms', () => {
      component.getDiseaseName(
        'Malaria',
        0,
        'Refer',
        ['s1', 's2', 's3'],
        [1, 3],
      );
      expect(component.diseasess).toEqual([
        { diseases: 'Malaria', action: 'Refer', symptoms: ['s1', 's3'] },
      ]);
      expect(component.indexArray).toEqual([0]);
    });

    it('adds another and toggles off existing', () => {
      component.getDiseaseName('Malaria', 0, 'Refer', [], null);
      component.getDiseaseName('Dengue', 1, 'Rest', [], []);
      expect(component.indexArray).toEqual([0, 1]);
      component.getDiseaseName('Malaria', 0, 'Refer', [], []);
      expect(component.indexArray).toEqual([1]);
      expect(component.diseasess[0].diseases).toBe('Dengue');
    });
  });

  it('changePage resets selections and switches pages', () => {
    component.diseasess = [1];
    component.indexArray = [1];
    component.changePage('2');
    expect(component.diseasess).toEqual([]);
    expect(component.page2).toBeTrue();
    expect(component.page3).toBeFalse();
    component.changePage('1');
    expect(component.page1).toBeTrue();
    expect(component.page2).toBeFalse();
    component.changePage('3');
    expect(component.page1).toBeTrue();
  });

  it('close confirms and closes', () => {
    component.close();
    expect(confirm.confirm).toHaveBeenCalledWith(
      'info',
      LANGUAGE_EN.areYouSureWantToClose,
    );
    expect(dialogRef.close).toHaveBeenCalledWith();
  });

  it('close keeps dialog open when declined', () => {
    confirm.confirm.and.returnValue(of(false));
    component.close();
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('saveData closes with selected diseases', () => {
    component.saveData([{ diseases: 'X' }]);
    expect(dialogRef.close).toHaveBeenCalledWith([{ diseases: 'X' }]);
  });

  it('ngDoCheck re-assigns language', () => {
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });
});
