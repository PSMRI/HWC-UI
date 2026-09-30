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
import { ElementRef } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { of } from 'rxjs';
import { ClinicalObservationsDirective } from './clinical-observations.directive';
import { DiagnosisSearchComponent } from '../components/diagnosis-search/diagnosis-search.component';
import {
  createMatDialogMock,
  createSessionStorageMock,
} from 'src/testing/test-utils';

describe('ClinicalObservationsDirective', () => {
  let fb: FormBuilder;
  let dialog: any;
  let el: ElementRef;
  let directive: ClinicalObservationsDirective;
  let formArray: FormArray;

  const row = () =>
    fb.group({
      conceptID: null,
      term: null,
      clinicalObservationsProvided: null,
    });

  function create(nodeName = 'INPUT') {
    el = new ElementRef({ nodeName });
    directive = new ClinicalObservationsDirective(
      fb,
      el,
      dialog,
      createSessionStorageMock() as any,
    );
    formArray = fb.array([row()]);
    directive.observationsList = formArray.at(0);
    directive.previousSelected = [{ term: 'old' }];
  }

  beforeEach(() => {
    fb = new FormBuilder();
    dialog = createMatDialogMock();
    create();
  });

  it('does not open the dialog when the search term is 2 characters or less', () => {
    formArray.at(0).patchValue({ clinicalObservationsProvided: 'ab' });
    directive.openDialog();
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('opens the diagnosis search dialog with the search term and previous selection', () => {
    formArray.at(0).patchValue({ clinicalObservationsProvided: 'fever' });

    directive.openDialog();
    expect(dialog.open).toHaveBeenCalledWith(DiagnosisSearchComponent, {
      width: '800px',
      data: {
        searchTerm: 'fever',
        addedDiagnosis: [{ term: 'old' }],
        diagonasisType: 'ClinicalObservations',
      },
    });
  });

  it('fills the rows from the dialog result, disables the view control and pushes new rows', () => {
    formArray.at(0).patchValue({ clinicalObservationsProvided: 'fever' });

    dialog.open.and.returnValue({
      afterClosed: () =>
        of([
          { term: 'Fever', conceptID: 'C1' },
          { term: 'Cough', conceptID: 'C2' },
        ]),
    });
    directive.openDialog();
    expect(formArray.length).toBe(2);
    const first = formArray.at(0) as FormGroup;
    const second = formArray.at(1) as FormGroup;
    expect(first.controls['term'].value).toBe('Fever');
    expect(first.controls['conceptID'].value).toBe('C1');
    expect(first.controls['clinicalObservationsProvided'].value).toBe('Fever');
    expect(first.controls['clinicalObservationsProvided'].disabled).toBeTrue();
    expect(second.controls['term'].value).toBe('Cough');
    expect(second.controls['conceptID'].value).toBe('C2');
    expect(second.controls['clinicalObservationsProvided'].disabled).toBeTrue();
    expect(Object.keys(second.controls)).toContain(
      'clinicalObservationsProvided',
    );
    expect(formArray.at(0).dirty).toBeTrue();
  });

  it('leaves the form untouched when the dialog closes without a result', () => {
    formArray.at(0).patchValue({ clinicalObservationsProvided: 'fever' });

    dialog.open.and.returnValue({ afterClosed: () => of(undefined) });
    directive.openDialog();
    expect(formArray.length).toBe(1);
    expect(formArray.at(0).value.term).toBeNull();
    expect(formArray.at(0).dirty).toBeFalse();
  });

  it('opens on enter key', () => {
    spyOn(directive, 'openDialog');
    directive.onKeyDown();
    expect(directive.openDialog).toHaveBeenCalled();
  });

  it('does not open on click when the host is an INPUT', () => {
    spyOn(directive, 'openDialog');
    directive.onClick();
    expect(directive.openDialog).not.toHaveBeenCalled();
  });

  it('opens on click when the host is not an INPUT', () => {
    create('BUTTON');
    spyOn(directive, 'openDialog');
    directive.onClick();
    expect(directive.openDialog).toHaveBeenCalled();
  });
});
