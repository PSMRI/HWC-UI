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
import { Component, DoCheck, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { startWith, map } from 'rxjs/operators';
import { CDSSService } from '../../shared/services/cdss-service';
import { MasterdataService } from '../../shared/services/masterdata.service';
import { CdssFormResultPopupComponent } from '../cdss-form-result-popup/cdss-form-result-popup.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-cdss-104-form',
  templateUrl: './cdss-form.component.html',
  styleUrls: ['./cdss-form.component.css'],
})
export class Cdss104FormComponent implements OnInit, DoCheck {
  currentLanguageSet: any;
  chiefComplaints: any = [];
  filteredOptions!: Observable<string[]>;

  cdssForm = this.fb.group({
    presentChiefComplaint: null,
    selectedProvisionalDiagnosis: null,
    recommendedAction: null,
    remarks: null,
    action: null,
    actionId: null,
  });
  result: any;
  psd: any;
  recommendedAction: any;
  selectedSymptoms!: string;
  actions: any = [];
  sctID_psd!: string;
  sctID_psd_toSave: any;
  actionId: any;
  sctID_pcc!: string;
  sctID_pcc_toSave: any;
  constructor(
    private httpServiceService: HttpServiceService,
    private fb: FormBuilder,
    private cdssService: CDSSService,
    private confirmationService: ConfirmationService,
    private dialog: MatDialog,
    private masterdataService: MasterdataService,
    readonly sessionstorage: SessionStorageService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.getChiefComplaintSymptoms();
    this.getActionsMaster();
    this.filteredOptions =
      this.cdssForm.controls.presentChiefComplaint.valueChanges.pipe(
        startWith(null),
        map((val: any) =>
          val ? this.filter(val) : this.chiefComplaints.slice(),
        ),
      );
  }

  filter(val: string): string[] {
    return this.chiefComplaints.filter(
      (option: any) => option.toLowerCase().indexOf(val.toLowerCase()) === 0,
    );
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }

  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  getActionsMaster() {
    this.cdssService.getActionMaster().subscribe((res: any) => {
      if (res.statusCode === 200 && res.data) {
        this.actions = res.data;
      } else {
        this.confirmationService.alert(res.errorMessage, 'error');
      }
    });
    (err: any) => {
      this.confirmationService.alert(err, 'error');
    };
  }

  getActionId() {
    const action = this.cdssForm.controls.action.value;
    this.actions.filter((item: any) => {
      if (action === item.name) {
        this.cdssForm.controls.actionId.patchValue(item.id);
      }
    });
  }

  getChiefComplaintSymptoms() {
    const reqObj = {
      age: this.sessionstorage.getItem('patientAge'),
      gender:
        this.sessionstorage.getItem('beneficiaryGender') === 'Male' ? 'M' : 'F',
    };

    this.cdssService.getcheifComplaintSymptoms(reqObj).subscribe((res: any) => {
      if (res.statusCode === 200 && res.data) {
        this.chiefComplaints = res.data;
      } else {
        this.confirmationService.alert(res.errorMessage, 'error');
      }
    });
    (err: any) => {
      this.confirmationService.alert(err, 'error');
    };
  }

  getQuestions(searchSymptom: any) {
    if (
      searchSymptom !== null &&
      searchSymptom !== undefined &&
      searchSymptom !== ''
    ) {
      const reqObj = {
        age: this.sessionstorage.getItem('patientAge'),
        gender:
          this.sessionstorage.getItem('beneficiaryGender') === 'Male'
            ? 'M'
            : 'F',
        symptom: searchSymptom,
      };
      this.cdssService.getCdssQuestions(reqObj).subscribe((res: any) => {
        if (
          res.statusCode === 200 &&
          res.data !== null &&
          res.data.Msg !== 'No Question Found' &&
          res.data !== 'No Question Found'
        ) {
          this.openDialog(searchSymptom);
        } else {
          this.confirmationService.alert(
            this.currentLanguageSet.noQuestionsFoundForCorrespondingInput,
          );
        }
      });
      (err: any) => {
        this.confirmationService.alert(err, 'error');
      };
      this.getSnomedCTRecord(searchSymptom, 'pcc');
    } else {
      this.cdssForm.controls.selectedProvisionalDiagnosis.patchValue(null);
      this.cdssForm.controls.recommendedAction.patchValue(null);
    }
  }

  resetForm() {
    this.cdssForm.reset();
  }

  openDialog(searchSymptom: any) {
    const dialogRef = this.dialog.open(CdssFormResultPopupComponent, {
      width: 0.8 * window.innerWidth + 'px',
      panelClass: 'dialog-width',
      disableClose: true,
      data: {
        patientData: {
          age: this.sessionstorage.getItem('patientAge'),
          gender:
            this.sessionstorage.getItem('beneficiaryGender') === 'Male'
              ? 'M'
              : 'F',
          symptom: searchSymptom,
        },
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('result', result);
      this.result = result;

      this.psd = '';
      this.recommendedAction = '';
      this.selectedSymptoms = '';
      this.sctID_psd = '';
      this.sctID_psd_toSave = '';
      if (result !== undefined && result !== null) {
        const diseaseArr = [];
        const recomdAction = [];
        for (let a = 0; a < result.length; a++) {
          diseaseArr.push(result[a].diseases);

          this.getSnomedCTRecord(result[a].diseases, 'psd');
          if (!this.recommendedAction.includes(result[a].action)) {
            recomdAction.push(result[a].action);
          }
          for (let k = 0; k < result[a].symptoms.length; k++) {
            this.selectedSymptoms += result[a].symptoms[k] + ' ';
          }
        }
        this.psd =
          diseaseArr !== undefined && diseaseArr.length > 0
            ? diseaseArr.join(',')
            : '';
        this.recommendedAction =
          recomdAction !== undefined && recomdAction.length > 0
            ? recomdAction.join(',')
            : '';

        this.recommendedAction = this.recommendedAction.trim().slice(0, 300);
        this.psd = this.psd.trim().slice(0, 100);
        this.selectedSymptoms = this.selectedSymptoms.trim().slice(0, 300);
        console.log(
          'lengths',
          this.selectedSymptoms.length,
          '/300',
          this.recommendedAction.length,
          '/100',
          this.psd.length,
          '/100',
        );
        this.cdssForm.controls.selectedProvisionalDiagnosis.patchValue(
          this.psd,
        );
        this.cdssForm.controls.recommendedAction.patchValue(
          this.recommendedAction,
        );
      } else {
        this.cdssForm.reset();
      }
    });
  }

  getSnomedCTRecord(term: any, field: any) {
    this.masterdataService.getSnomedCTRecord(term).subscribe(
      (response: any) => {
        console.log('Snomed response: ' + JSON.stringify(response));

        if (response.data.conceptID) {
          if (field === 'pcc') {
            this.sctID_pcc = 'SCTID: ' + response.data.conceptID;
            this.sctID_pcc_toSave = response.data.conceptID;
          } else {
            this.sctID_psd +=
              term + ('(SCTID): ' + response.data.conceptID + '\n');
            if (this.sctID_psd_toSave === '') {
              this.sctID_psd_toSave = response.data.conceptID;
            } else this.sctID_psd_toSave += ',' + response.data.conceptID;
          }
        } else {
          if (field === 'pcc') {
            this.sctID_pcc_toSave = 'NA';
          } else {
            if (this.sctID_psd_toSave === '') this.sctID_psd_toSave = 'NA';
            else this.sctID_psd_toSave += ',NA';
          }
        }
      },
      (err) => {
        console.log('getSnomedCTRecord Error');
      },
    );
  }

  saveData() {
    const patientAge: any = this.sessionstorage.getItem('patientAge');
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const reqObj = {
      beneficiaryRegID: this.sessionstorage.getItem('beneficiaryRegID'),
      beneficiaryID: this.sessionstorage.getItem('beneficiaryID'),
      patientName: this.sessionstorage.getItem('patientName'),
      patientAge: patientAge,
      patientGenderID:
        this.sessionstorage.getItem('beneficiaryGender') === 'Male' ? 1 : 2,
      sessionID: this.sessionstorage.getItem('sessionID'),
      serviceID: this.sessionstorage.getItem('serviceID'),
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      createdBy: this.sessionstorage.getItem('userName'),
      vanID: JSON.parse(serviceLineDetails).vanID,
      benCallID: this.sessionstorage.getItem('benCallID'),
      parkingPlaceID: JSON.parse(serviceLineDetails).parkingPlaceID,
      selecteDiagnosisID: this.sctID_psd_toSave,
      selecteDiagnosis:
        this.cdssForm.controls.selectedProvisionalDiagnosis.value,
      presentChiefComplaintID: this.sctID_pcc_toSave,
      presentChiefComplaint: this.cdssForm.controls.presentChiefComplaint.value,
      recommendedAction: this.cdssForm.controls.recommendedAction.value,
      remarks: this.cdssForm.controls.remarks.value,
      algorithm: this.selectedSymptoms,
      actionId: this.cdssForm.controls.actionId.value,
      action: this.cdssForm.controls.action.value,
    };
    console.log('formvalue', reqObj);
    this.cdssService.saveCheifComplaints(reqObj).subscribe((res: any) => {
      if (res && res.statusCode === 200) {
        this.confirmationService.alert(
          this.currentLanguageSet.savedBeneficiaryDetailsSuccessfully,
          'Success',
        );
        this.router.navigate(['/common/nurse-worklist']);
      } else {
        this.confirmationService.alert(res.errorMessage, 'error');
      }
    });
    (err: any) => {
      this.confirmationService.alert(err, 'error');
    };
  }
}
