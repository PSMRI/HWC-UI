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
import { Component, OnInit, Inject, DoCheck } from '@angular/core';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SetLanguageComponent } from '../../core/components/set-language.component';
import { HttpServiceService } from '../../core/services/http-service.service';

@Component({
  selector: 'app-view-file',
  templateUrl: './view-file.component.html',
  styleUrls: ['./view-file.component.css'],
})
export class ViewFileComponent implements OnInit, DoCheck {
  fileObj: any;
  currentLanguageSet: any;
  constructor(
    @Inject(MAT_DIALOG_DATA) public input: any,
    private dialogRef: MatDialogRef<ViewFileComponent>,
    private confirmationService: ConfirmationService,
    private httpServiceService: HttpServiceService,
  ) {
    dialogRef.disableClose = true;
  }

  ngOnInit() {
    this.assignSelectedLanguage();
    console.log('this.input', this.input.viewFileObj);
    const inputFileObj = this.input.viewFileObj;
    const procedureID = this.input.procedureID;
    this.assignObject(inputFileObj, procedureID);
  }
  ngDoCheck() {
    this.assignSelectedLanguage();
  }

  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  assignObject(inputFileObj: any, procedureID: any) {
    this.fileObj = inputFileObj[procedureID];
  }
  remove(file: any) {
    this.confirmationService
      .confirm('info', this.currentLanguageSet.alerts.info.wantToRemoveFile)
      .subscribe((res) => {
        if (res) {
          const index =
            this.input.viewFileObj[this.input.procedureID].indexOf(file);
          if (index >= 0) {
            this.input.viewFileObj[this.input.procedureID].splice(index, 1);
          }
          if (this.input.viewFileObj[this.input.procedureID].length === 0) {
            this.closeDialog();
          }
        }
      });
  }
  closeDialog() {
    const returnObj = this.input.viewFileObj;
    this.dialogRef.close(returnObj);
  }
}
