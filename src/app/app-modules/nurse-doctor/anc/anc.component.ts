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
  OnInit,
  Input,
  OnChanges,
  DoCheck,
  OnDestroy,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { DoctorService } from '../shared/services';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { ActivatedRoute } from '@angular/router';
import { HttpServiceService } from '../../core/services/http-service.service';
import { BeneficiaryDetailsService } from '../../core/services';
import { SetLanguageComponent } from '../../core/components/set-language.component';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-nurse-anc',
  templateUrl: './anc.component.html',
  styleUrls: ['./anc.component.css'],
})
export class AncComponent implements OnChanges, OnInit, DoCheck, OnDestroy {
  @Input()
  patientANCForm!: FormGroup;

  @Input()
  mode!: string;

  gravidaStatus!: boolean;
  current_language_set: any;
  visitReason: any;
  attendant: any;
  patientANCDetailsForm!: FormGroup;
  obstetricFormulaForm!: FormGroup;
  patientANCImmunizationForm!: FormGroup;

  constructor(
    private doctorService: DoctorService,
    private confirmationService: ConfirmationService,
    public httpServiceService: HttpServiceService,
    public beneficiaryDetailsService: BeneficiaryDetailsService,
    private route: ActivatedRoute,
    readonly sessionstorage: SessionStorageService,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.attendant = this.route.snapshot.params['attendant'];
    (<FormGroup>this.patientANCForm.controls['patientANCDetailsForm']).controls[
      'primiGravida'
    ].valueChanges.subscribe((gravidaData) => {
      this.gravidaStatus = gravidaData;
    });
    this.patientANCDetailsForm = this.patientANCForm.get(
      'patientANCDetailsForm',
    ) as FormGroup;
    this.obstetricFormulaForm = this.patientANCForm.get(
      'obstetricFormulaForm',
    ) as FormGroup;
    this.patientANCImmunizationForm = this.patientANCForm.get(
      'patientANCImmunizationForm',
    ) as FormGroup;
    this.visitReason = this.sessionstorage.getItem('visitReason');
    if (
      this.sessionstorage.getItem('visitReason') !== undefined &&
      this.sessionstorage.getItem('visitReason') !== 'undefined' &&
      this.sessionstorage.getItem('visitReason') !== null &&
      this.sessionstorage.getItem('visitReason') === 'Follow Up' &&
      this.attendant === 'nurse'
    )
      this.patchDataToFieldsRevisit(
        this.sessionstorage.getItem('beneficiaryRegID'),
      );
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }

  ngOnChanges() {
    if (String(this.mode) === 'view') {
      const visitID = this.sessionstorage.getItem('visitID');
      const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
      this.patchDataToFields(benRegID, visitID);
    }
    const specialistFlagString = this.sessionstorage.getItem('specialistFlag');
    if (
      specialistFlagString !== null &&
      parseInt(specialistFlagString) === 100
    ) {
      const visitID = this.sessionstorage.getItem('visitID');
      const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
      this.patchDataToFields(benRegID, visitID);
    }
    if (String(this.mode) === 'update') {
      this.updatePatientANC(this.patientANCForm);
    }
  }

  ngOnDestroy() {
    if (this.ancCareDetails) this.ancCareDetails.unsubscribe();
    if (this.updateANCDetailsSubs) this.updateANCDetailsSubs.unsubscribe();
  }

  updateANCDetailsSubs: any;
  updatePatientANC(patientANCForm: any) {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;

    const temp = {
      beneficiaryRegID: this.sessionstorage.getItem('beneficiaryRegID'),
      benVisitID: this.sessionstorage.getItem('visitID'),
      beneficiaryID: this.sessionstorage.getItem('beneficiaryID'),
      sessionID: this.sessionstorage.getItem('sessionID'),
      modifiedBy: this.sessionstorage.getItem('userName'),
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      parkingPlaceID: parkingPlaceID,
      vanID: vanID,
      benFlowID: this.sessionstorage.getItem('benFlowID'),
      visitCode: this.sessionstorage.getItem('visitCode'),
    };

    this.updateANCDetailsSubs = this.doctorService
      .updateANCDetails(patientANCForm, temp)
      .subscribe(
        (res: any) => {
          if (res.statusCode === 200 && res.data !== null) {
            this.getHRPDetails();
            this.confirmationService.alert(res.data.response, 'success');
            this.patientANCForm.markAsPristine();
          } else {
            this.confirmationService.alert(res.errorMessage, 'error');
          }
        },
        (err) => {
          this.confirmationService.alert(err, 'error');
        },
      );
  }

  getHRPDetails() {
    const beneficiaryRegID = this.sessionstorage.getItem('beneficiaryRegID');
    const visitCode = this.sessionstorage.getItem('visitCode');
    this.doctorService
      .getHRPDetails(beneficiaryRegID, visitCode)
      .subscribe((res: any) => {
        if (res && res.statusCode === 200 && res.data) {
          if (res.data.isHRP === true) {
            this.beneficiaryDetailsService.setHRPPositive();
          } else {
            this.beneficiaryDetailsService.resetHRPPositive();
          }
        }
      });
  }

  ancCareDetails: any;
  patchDataToFields(benRegID: any, visitID: any) {
    this.ancCareDetails = this.doctorService
      .getAncCareDetails(benRegID, visitID)
      .subscribe(
        (ancCareData: any) => {
          if (
            ancCareData !== null &&
            ancCareData !== undefined &&
            ancCareData.statusCode === 200 &&
            ancCareData.data !== null
          ) {
            const temp = ancCareData.data.ANCCareDetail;
            if (temp) {
              const ancDetails = Object.assign({}, temp, {
                expDelDt: new Date(temp.expDelDt),
                lmpDate: new Date(temp.lmpDate),
              });
              (<FormGroup>(
                this.patientANCForm.controls['patientANCDetailsForm']
              )).patchValue(ancDetails);
              this.gravidaStatus = ancDetails.primiGravida;
              (<FormGroup>(
                this.patientANCForm.controls['obstetricFormulaForm']
              )).patchValue(ancDetails);

              if (temp.bloodGroup && temp.bloodGroup !== "Don't Know")
                (<FormGroup>(
                  this.patientANCForm.controls['obstetricFormulaForm']
                )).controls['bloodGroup'].disable();
            }
            const specialistFlagString =
              this.sessionstorage.getItem('specialistFlag');
            if (
              specialistFlagString !== null &&
              parseInt(specialistFlagString) === 100
            ) {
              (<FormGroup>(
                this.patientANCForm.controls['obstetricFormulaForm']
              )).controls['bloodGroup'].enable();
            }

            const temp2 = ancCareData.data.ANCWomenVaccineDetails;
            if (temp2) {
              const ancImmunizationDetails = Object.assign({}, temp2, {
                dateReceivedForTT_1: new Date(temp2.dateReceivedForTT_1),
                dateReceivedForTT_2: new Date(temp2.dateReceivedForTT_2),
                dateReceivedForTT_3: new Date(temp2.dateReceivedForTT_3),
              });
              (<FormGroup>(
                this.patientANCForm.controls['patientANCImmunizationForm']
              )).patchValue(ancImmunizationDetails);
            }
          } else {
            this.confirmationService.alert(ancCareData.errorMessage, 'error');
          }
        },
        (err) => {
          this.confirmationService.alert(err, 'error');
        },
      );
  }
  patchDataToFieldsRevisit(benRegID: any) {
    this.ancCareDetails = this.doctorService
      .getAncCareDetailsRevisit(benRegID)
      .subscribe(
        (ancCareData: any) => {
          if (
            ancCareData !== null &&
            ancCareData !== undefined &&
            ancCareData.statusCode === 200 &&
            ancCareData.data !== null
          ) {
            const temp = ancCareData.data.ANCCareDetail;
            if (temp) {
              const ancDetails = Object.assign({}, temp, {
                expDelDt: new Date(temp.expDelDt),
                lmpDate: new Date(temp.lmpDate),
              });
              (<FormGroup>(
                this.patientANCForm.controls['patientANCDetailsForm']
              )).patchValue(ancDetails);
              this.gravidaStatus = ancDetails.primiGravida;
              (<FormGroup>(
                this.patientANCForm.controls['obstetricFormulaForm']
              )).patchValue(ancDetails);

              if (temp.bloodGroup && temp.bloodGroup !== "Don't Know")
                (<FormGroup>(
                  this.patientANCForm.controls['obstetricFormulaForm']
                )).controls['bloodGroup'].disable();
            }
            const specialistFlagString =
              this.sessionstorage.getItem('specialistFlag');
            if (
              specialistFlagString !== null &&
              parseInt(specialistFlagString) === 100
            ) {
              (<FormGroup>(
                this.patientANCForm.controls['obstetricFormulaForm']
              )).controls['bloodGroup'].enable();
            }

            const temp2 = ancCareData.data.ANCWomenVaccineDetails;
            if (temp2) {
              const ancImmunizationDetails = Object.assign({}, temp2, {
                dateReceivedForTT_1: new Date(temp2.dateReceivedForTT_1),
                dateReceivedForTT_2: new Date(temp2.dateReceivedForTT_2),
                dateReceivedForTT_3: new Date(temp2.dateReceivedForTT_3),
              });
              (<FormGroup>(
                this.patientANCForm.controls['patientANCImmunizationForm']
              )).patchValue(ancImmunizationDetails);
            }
          } else {
            this.confirmationService.alert(ancCareData.errorMessage, 'error');
          }
        },
        (err) => {
          this.confirmationService.alert(err, 'error');
        },
      );
  }
}
