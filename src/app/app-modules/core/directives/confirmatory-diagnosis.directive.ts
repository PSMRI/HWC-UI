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

import {
  Directive,
  HostListener,
  Input,
  ElementRef,
  OnInit,
  DoCheck,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  AbstractControl,
} from '@angular/forms';
import { SetLanguageComponent } from '../components/set-language.component';
import { HttpServiceService } from '../services/http-service.service';
import { MatDialog } from '@angular/material/dialog';
import { GeneralUtils } from '../../nurse-doctor/shared/utility';
import { DiagnosisSearchComponent } from '../components/diagnosis-search/diagnosis-search.component';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
@Directive({
  selector: '[appConfirmatoryDiagnosis]',
})
export class ConfirmatoryDiagnosisDirective implements OnInit, DoCheck {
  @Input()
  previousSelected: any;

  @Input()
  diagnosisListForm!: AbstractControl<any, any>;

  currentLanguageSet: any;

  @HostListener('keyup.enter') onKeyDown() {
    this.openDialog();
  }

  @HostListener('click') onClick() {
    if (this.el.nativeElement.nodeName !== 'INPUT') this.openDialog();
  }
  utils = new GeneralUtils(this.fb, this.sessionstorage);

  constructor(
    private fb: FormBuilder,
    private el: ElementRef,
    private dialog: MatDialog,
    private httpServiceService: HttpServiceService,
    readonly sessionstorage: SessionStorageService,
  ) {}

  ngOnInit() {
    this.fetchLanguageResponse();
  }

  openDialog(): void {
    const searchTerm =
      this.diagnosisListForm.value.viewConfirmatoryDiagnosisProvided;
    if (searchTerm.length > 2) {
      const dialogRef = this.dialog.open(DiagnosisSearchComponent, {
        width: '800px',
        data: {
          searchTerm: searchTerm,
          addedDiagnosis: this.previousSelected,
          diagonasisType: this.currentLanguageSet.confirmDiagnosis,
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
              'viewConfirmatoryDiagnosisProvided'
            ].setValue(result[j].term);
            (<FormGroup>formArray.at(i)).controls[
              'viewConfirmatoryDiagnosisProvided'
            ].disable();
            this.diagnosisListForm.markAsDirty();
            if (formArray.length < len + result.length - 1)
              formArray.push(this.utils.initConfirmatoryDiagnosisList());
          }
        }
      });
    }
  }
  ngDoCheck() {
    this.fetchLanguageResponse();
  }

  fetchLanguageResponse() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }
}
