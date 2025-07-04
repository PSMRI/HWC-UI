/*
 * AMRIT � Accessible Medical Records via Integrated Technology
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

import { Directive, HostListener, Input, ElementRef } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
} from '@angular/forms';
import { DiagnosisSearchComponent } from '../components/diagnosis-search/diagnosis-search.component';
import { MatDialog } from '@angular/material/dialog';
import { QuickConsultUtils } from '../../nurse-doctor/shared/utility';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Directive({
  selector: '[appDiagnosisSearch]',
})
export class DiagnosisSearchDirective {
  @Input()
  previousSelected: any;

  @Input()
  diagnosisListForm!: AbstractControl<any, any>;

  @HostListener('keyup.enter') onKeyDown() {
    this.openDialog();
  }

  @HostListener('click') onClick() {
    if (this.el.nativeElement.nodeName !== 'INPUT') this.openDialog();
  }
  utils = new QuickConsultUtils(this.fb, this.sessionstorage);

  constructor(
    private fb: FormBuilder,
    private el: ElementRef,
    private dialog: MatDialog,
    readonly sessionstorage: SessionStorageService,
  ) {}

  openDialog(): void {
    const searchTerm =
      this.diagnosisListForm.value.viewProvisionalDiagnosisProvided;
    if (searchTerm.length > 2) {
      const dialogRef = this.dialog.open(DiagnosisSearchComponent, {
        width: '800px',
        data: {
          searchTerm: searchTerm,
          addedDiagnosis: this.previousSelected,
          diagonasisType: 'Provisional Diagnosis',
        },
      });

      dialogRef.afterClosed().subscribe((result) => {
        console.log('result', result);
        if (result) {
          const formArray = this.diagnosisListForm.parent as FormArray;
          const len = formArray.length;
          for (let i = len - 1, j = 0; i < len + result.length - 1; i++, j++) {
            (<FormGroup>formArray.at(i)).controls['term'].setValue(
              result[j].term,
            );
            (<FormGroup>formArray.at(i)).controls['conceptID'].setValue(
              result[j].conceptID,
            );
            (<FormGroup>formArray.at(i)).controls[
              'viewProvisionalDiagnosisProvided'
            ].setValue(result[j].term);
            (<FormGroup>formArray.at(i)).controls[
              'viewProvisionalDiagnosisProvided'
            ].disable();
            this.diagnosisListForm.markAsDirty();
            if (formArray.length < len + result.length - 1)
              formArray.push(this.utils.initProvisionalDiagnosisList());
          }
        }
      });
    }
  }
}
