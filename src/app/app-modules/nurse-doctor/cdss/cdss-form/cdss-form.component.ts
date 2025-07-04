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
  Component,
  DoCheck,
  Input,
  OnChanges,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

import { Observable } from 'rxjs';
import { startWith, map } from 'rxjs/operators';
import { CDSSService } from '../../shared/services/cdss-service';
import { MasterdataService } from '../../shared/services/masterdata.service';
import { CdssFormResultPopupComponent } from '../cdss-form-result-popup/cdss-form-result-popup.component';
import { DoctorService } from '../../shared/services';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { VisitDetailUtils } from '../../shared/utility';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-cdss-form',
  templateUrl: './cdss-form.component.html',
  styleUrls: ['./cdss-form.component.css'],
})
export class CdssFormComponent implements OnChanges, OnInit, DoCheck {
  currentLanguageSet: any;
  chiefComplaints: any = [];
  filteredOptions!: Observable<string[]>;
  @Input()
  cdssForm!: FormGroup;
  @Input()
  mode!: string;
  result: any;
  psd!: string;
  recommendedActionPc!: string;
  selectedSymptoms!: string;
  actions: any = [];
  sctID_psd!: string;
  sctID_psd_toSave: any;
  actionId: any;
  sctID_pcc!: string;
  sctID_pcc_toSave: any;
  isCdssTrue = false;
  showCdssForm = false;
  viewMode = false;
  selectedProvisionalDiagnosisID: any;
  disableVisit = false;
  presentChiefComplaintID: any;
  presentChiefComplaintView: any;
  formUtility: any;
  disablePopUP = false;

  constructor(
    private httpServiceService: HttpServiceService,
    private fb: FormBuilder,
    private cdssService: CDSSService,
    private confirmationService: ConfirmationService,
    private dialog: MatDialog,
    private masterdataService: MasterdataService,
    private router: Router,
    private doctorService: DoctorService,
    readonly sessionstorage: SessionStorageService,
  ) {
    this.formUtility = new VisitDetailUtils(this.fb, this.sessionstorage);
    this.formUtility.createCdssForm();
  }

  ngOnInit() {
    this.showingCdssForm();
    this.getChiefComplaintSymptoms();
    this.filteredOptions = this.cdssForm.controls[
      'presentChiefComplaint'
    ].valueChanges.pipe(
      startWith(''),
      map((val: any) => this._filter(val || '')),
    );
  }

  _filter(val: string): string[] {
    return this.chiefComplaints.filter((option: any) =>
      option.toLowerCase().includes(val.toLowerCase()),
    );
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }

  showingCdssForm() {
    if (
      this.sessionstorage.getItem('currentRole') === 'Nurse' ||
      this.sessionstorage.getItem('currentRole') === 'Doctor'
    ) {
      this.showCdssForm = true;
    } else {
      this.showCdssForm = false;
    }
  }
  ngOnChanges() {
    if (String(this.mode) === 'view') {
      2;
      this.getChiefComplaintSymptoms();
      const visitID = this.sessionstorage.getItem('visitID');
      const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
      this.getCdssDetails(benRegID, visitID);
    }

    const specialistFlagString = this.sessionstorage.getItem('specialistFlag');
    if (
      specialistFlagString !== null &&
      parseInt(specialistFlagString) === 100
    ) {
      const visitID = this.sessionstorage.getItem('visitID');
      const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
      this.getCdssDetails(benRegID, visitID);
    }
  }
  getCdssDetails(beneficiaryRegID: any, visitID: any) {
    const visitCategory = this.sessionstorage.getItem('visitCategory');
    if (visitCategory === 'General OPD (QC)') {
      this.disableVisit = true;
      this.viewMode = true;
      this.doctorService
        .getVisitComplaintDetails(beneficiaryRegID, visitID)
        .subscribe((value: any) => {
          if (
            value !== null &&
            value !== undefined &&
            value.statusCode === 200 &&
            value.data !== null &&
            value.data !== undefined &&
            value.data.cdss !== null &&
            value.data.cdss !== undefined
          )
            this.disableVisit = true;
          this.viewMode = true;
          this.cdssForm.patchValue(value.data.cdss);
          this.cdssForm.controls['presentChiefComplaintView'].patchValue(
            value.data.cdss.presentChiefComplaint,
          );
        });
    } else {
      this.disableVisit = true;
      this.viewMode = true;
      this.doctorService
        .getVisitComplaintDetails(beneficiaryRegID, visitID)
        .subscribe((value: any) => {
          if (
            value !== null &&
            value !== undefined &&
            value.statusCode === 200 &&
            value.data !== null &&
            value.data !== undefined &&
            value.data.Cdss !== null &&
            value.data.Cdss !== undefined &&
            value.data.Cdss.presentChiefComplaint !== null &&
            value.data.Cdss.presentChiefComplaint !== undefined
          )
            this.disableVisit = true;
          this.viewMode = true;
          this.cdssForm.patchValue(value.data.Cdss.presentChiefComplaint);
          this.cdssForm.controls['presentChiefComplaintView'].patchValue(
            value.data.Cdss.presentChiefComplaint.presentChiefComplaint,
          );
        });
    }
  }

  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
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

  displayChiefComplaint(complaint: any) {
    return complaint && complaint.chiefComplaint;
  }

  getQuestions(searchSymptom: any, autocompleteField: any, elementInput: any) {
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
      console.log('reqObj in getQuestions', reqObj);
      this.cdssService.getCdssQuestions(reqObj).subscribe((res: any) => {
        if (
          res.statusCode === 200 &&
          res.data !== null &&
          res.data?.Questions.length
        ) {
          this.cdssForm.controls['presentChiefComplaint'].markAsUntouched();
          autocompleteField._elementRef.nativeElement.classList.remove(
            'mat-focused',
          );
          elementInput.blur();
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
      this.cdssForm.controls['selectedDiagnosis'].patchValue(null);
      this.cdssForm.controls['recommendedActionPc'].patchValue(null);
    }
  }

  resetForm() {
    this.cdssForm.reset();
  }

  openDialog(searchSymptom: any) {
    const dialogRef = this.dialog.open(CdssFormResultPopupComponent, {
      width: 0.8 * window.innerWidth + 'px',
      height: '500px',
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
      this.recommendedActionPc = '';
      this.selectedSymptoms = '';
      this.sctID_psd = '';
      this.sctID_psd_toSave = '';
      if (result !== undefined && result !== null) {
        const diseaseArr = [];
        const recomdAction = [];
        for (let a = 0; a < result.length; a++) {
          diseaseArr.push(result[a].diseases);

          this.getSnomedCTRecord(result[a].diseases, 'psd');
          if (!this.recommendedActionPc.includes(result[a].action)) {
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
        this.recommendedActionPc =
          recomdAction !== undefined && recomdAction.length > 0
            ? recomdAction.join(',')
            : '';

        this.recommendedActionPc = this.recommendedActionPc
          .trim()
          .slice(0, 300);
        this.psd = this.psd.trim().slice(0, 100);
        this.selectedSymptoms = this.selectedSymptoms.trim().slice(0, 300);
        console.log(
          'lengths',
          this.selectedSymptoms.length,
          '/300',
          this.recommendedActionPc.length,
          '/100',
          this.psd.length,
          '/100',
        );
        this.cdssForm?.controls['selectedDiagnosis'].patchValue(this.psd);
        this.cdssForm?.controls['recommendedActionPc'].patchValue(
          this.recommendedActionPc,
        );

        this.cdssForm?.controls['presentChiefComplaintID'].patchValue(
          this.presentChiefComplaintID,
        );
        this.cdssForm?.controls['selectedProvisionalDiagnosisID'].patchValue(
          this.selectedProvisionalDiagnosisID,
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
      selecteDiagnosis: this.cdssForm.controls['selectedDiagnosis'].value,
      presentChiefComplaintID: this.sctID_pcc_toSave,
      presentChiefComplaint:
        this.cdssForm.controls['presentChiefComplaint'].value,
      recommendedActionPc: this.cdssForm.controls['recommendedActionPc'].value,
      remarksPc: this.cdssForm.controls['remarksPc'].value,
      algorithm: this.selectedSymptoms,
      actionId: this.cdssForm.controls['actionId'].value,
      action: this.cdssForm.controls['action'].value,
    };
    console.log('formvalue', reqObj);
    this.cdssService.saveCheifComplaints(reqObj).subscribe((res: any) => {
      if (res && res.statusCode === 200) {
        if (this.isCdssTrue === true) {
          this.router.navigate(['/common/nurse-worklist']);
          this.confirmationService.alert(
            this.currentLanguageSet.savedBeneficiaryDetailsSuccessfully,
            'Success',
          );
        } else {
          this.confirmationService.alert(
            this.currentLanguageSet.savedBeneficiaryDetailsSuccessfully,
            'Success',
          );
        }
      } else {
        this.confirmationService.alert(res.errorMessage, 'error');
      }
    });
    (err: any) => {
      this.confirmationService.alert(err, 'error');
    };
  }
}
