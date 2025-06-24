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
  DoCheck,
  OnChanges,
  OnDestroy,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { DoctorService, NurseService } from '../../shared/services';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-nurse-general-opd-examination',
  templateUrl: './general-opd-examination.component.html',
  styleUrls: ['./general-opd-examination.component.css'],
})
export class GeneralOpdExaminationComponent
  implements OnInit, DoCheck, OnChanges, OnDestroy
{
  @Input()
  visitCategory!: string;

  @Input()
  patientExaminationForm!: FormGroup;

  @Input()
  mode!: string;
  current_language_set: any;
  generalExaminationForm!: FormGroup;
  headToToeExaminationForm!: FormGroup;
  systemicExaminationForm!: FormGroup;

  constructor(
    private doctorService: DoctorService,
    private confirmationService: ConfirmationService,
    public httpServiceService: HttpServiceService,
    private nurseService: NurseService,
    readonly sessionstorage: SessionStorageService,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.loadFormData();
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }

  ngOnDestroy() {
    if (this.ancExaminationDataSubscription)
      this.ancExaminationDataSubscription.unsubscribe();
  }

  loadFormData() {
    this.generalExaminationForm = this.patientExaminationForm.get(
      'generalExaminationForm',
    ) as FormGroup;
    this.headToToeExaminationForm = this.patientExaminationForm.get(
      'headToToeExaminationForm',
    ) as FormGroup;
    this.systemicExaminationForm = this.patientExaminationForm.get(
      'systemicExaminationForm',
    ) as FormGroup;
  }

  ngOnChanges() {
    this.loadFormData();
    if (String(this.mode) === 'view') {
      const visitID = this.sessionstorage.getItem('visitID');
      const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
      this.getAncExaminationData(benRegID, visitID);
    }
    const specialistFlagString = this.sessionstorage.getItem('specialistFlag');
    if (
      specialistFlagString !== null &&
      parseInt(specialistFlagString) === 100
    ) {
      const visitID = this.sessionstorage.getItem('visitID');
      const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
      this.getAncExaminationData(benRegID, visitID);
    }
    if (String(this.mode) === 'update') {
      this.updatePatientExamination(this.patientExaminationForm);
    }
  }

  checkRequired(patientExaminationForm: any) {
    const required = [];
    const generalExaminationForm = <FormGroup>(
      patientExaminationForm.controls['generalExaminationForm']
    );
    if (generalExaminationForm.controls['typeOfDangerSigns'].errors) {
      required.push(
        this.current_language_set.ExaminationData.ANC_OPD_PNCExamination
          .genExamination.dangersigns,
      );
    }
    if (generalExaminationForm.controls['lymphnodesInvolved'].errors) {
      required.push(
        this.current_language_set.ExaminationData.ANC_OPD_PNCExamination
          .genExamination.lymph,
      );
    }
    if (generalExaminationForm.controls['typeOfLymphadenopathy'].errors) {
      required.push(
        this.current_language_set.ExaminationData.ANC_OPD_PNCExamination
          .genExamination.typeofLymphadenopathy,
      );
    }
    if (generalExaminationForm.controls['extentOfEdema'].errors) {
      required.push(
        this.current_language_set.ExaminationData.ANC_OPD_PNCExamination
          .genExamination.extentofEdema,
      );
    }
    if (generalExaminationForm.controls['edemaType'].errors) {
      required.push(
        this.current_language_set.ExaminationData.ANC_OPD_PNCExamination
          .genExamination.typeofEdema,
      );
    }
    if (required.length) {
      this.confirmationService.notify(
        this.current_language_set.alerts.info.mandatoryFields,
        required,
      );
      return false;
    } else {
      return true;
    }
  }
  updatePatientExamination(patientExaminationForm: any) {
    if (this.checkRequired(patientExaminationForm)) {
      const serviceLineDetails: any =
        this.sessionstorage.getItem('serviceLineDetails');
      const vanID = JSON.parse(serviceLineDetails).vanID;
      const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;
      const updateDetails = {
        beneficiaryRegID: this.sessionstorage.getItem('beneficiaryRegID'),
        benVisitID: this.sessionstorage.getItem('visitID'),
        providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
        modifiedBy: this.sessionstorage.getItem('userName'),
        beneficiaryID: this.sessionstorage.getItem('beneficiaryID'),
        sessionID: this.sessionstorage.getItem('sessionID'),
        parkingPlaceID: parkingPlaceID,
        vanID: vanID,
        benFlowID: this.sessionstorage.getItem('benFlowID'),
        visitCode: this.sessionstorage.getItem('visitCode'),
      };

      this.doctorService
        .updatePatientExamination(
          patientExaminationForm.value,
          this.visitCategory,
          updateDetails,
        )
        .subscribe(
          (res: any) => {
            if (res.statusCode === 200 && res.data !== null) {
              this.confirmationService.alert(
                this.current_language_set.alerts.info.examUpdated,
                'success',
              );
              this.patientExaminationForm.markAsPristine();
              this.nurseService.setUpdateForHrpStatus(false);
            } else {
              this.confirmationService.alert(
                this.current_language_set.alerts.info.errorInExamUpdated,
                'error',
              );
            }
          },
          (err) => {
            this.confirmationService.alert(
              this.current_language_set.alerts.info.errorInExamUpdated,
              'error',
            );
          },
        );
    }
  }

  ancExaminationDataSubscription: any;
  getAncExaminationData(benRegID: any, visitID: any) {
    this.ancExaminationDataSubscription = this.doctorService
      .getGeneralExamintionData(benRegID, visitID)
      .subscribe((examinationData: any) => {
        if (examinationData.statusCode === 200 && examinationData.data) {
          console.log(
            'examinationData.data',
            JSON.stringify(examinationData.data, null, 4),
          );
          const temp = examinationData.data;

          if (this.visitCategory === 'ANC') {
            this.checkObstetricExamination(temp);
            const ancFormData = Object.assign({
              generalExaminationForm: temp.generalExamination,
              headToToeExaminationForm: temp.headToToeExamination,
              systemicExaminationForm: Object.assign({
                cardioVascularSystemForm: temp.cardiovascularExamination,
                respiratorySystemForm: temp.respiratoryExamination,
                centralNervousSystemForm: temp.centralNervousExamination,
                musculoSkeletalSystemForm: temp.musculoskeletalExamination,
                genitoUrinarySystemForm: temp.genitourinaryExamination,
                obstetricExaminationForANCForm: temp.obstetricExamination,
              }),
            });
            this.patientExaminationForm.patchValue(ancFormData);

            if (
              temp.obstetricExamination.isHRP !== undefined &&
              temp.obstetricExamination.isHRP !== null &&
              temp.obstetricExamination.reasonsForHRP !== undefined &&
              temp.obstetricExamination.reasonsForHRP !== null
            ) {
              this.doctorService.isHrpFromNurse =
                temp.obstetricExamination.isHRP;
              this.doctorService.reasonHrpFromNurse =
                temp.obstetricExamination.reasonsForHRP;

              this.doctorService.enableHrpReasonsStatus(true);
            }
          }

          if (this.visitCategory === 'PNC') {
            const ancFormData = Object.assign({
              generalExaminationForm: temp.generalExamination,
              headToToeExaminationForm: temp.headToToeExamination,
              systemicExaminationForm: Object.assign({
                gastroIntestinalSystemForm: temp.gastrointestinalExamination,
                cardioVascularSystemForm: temp.cardiovascularExamination,
                respiratorySystemForm: temp.respiratoryExamination,
                centralNervousSystemForm: temp.centralNervousExamination,
                musculoSkeletalSystemForm: temp.musculoskeletalExamination,
                genitoUrinarySystemForm: temp.genitourinaryExamination,
              }),
            });
            this.patientExaminationForm.patchValue(ancFormData);
          }

          if (this.visitCategory === 'General OPD') {
            const ancFormData = Object.assign({
              generalExaminationForm: temp.generalExamination,
              headToToeExaminationForm: temp.headToToeExamination,
              systemicExaminationForm: Object.assign({
                gastroIntestinalSystemForm: temp.gastrointestinalExamination,
                cardioVascularSystemForm: temp.cardiovascularExamination,
                respiratorySystemForm: temp.respiratoryExamination,
                centralNervousSystemForm: temp.centralNervousExamination,
                musculoSkeletalSystemForm: temp.musculoskeletalExamination,
                genitoUrinarySystemForm: temp.genitourinaryExamination,
                obstetricExaminationForANCForm: temp.obstetricExamination,
              }),
            });
            this.patientExaminationForm.patchValue(ancFormData);
          }
        }
      });
  }

  checkObstetricExamination(temp: any) {
    if (
      temp.obstetricExamination !== undefined &&
      temp.obstetricExamination !== null
    ) {
      if (
        temp.obstetricExamination.malPresentation !== undefined &&
        temp.obstetricExamination.malPresentation !== null
      ) {
        temp.obstetricExamination.malPresentation =
          temp.obstetricExamination.malPresentation.toString();
      }

      if (
        temp.obstetricExamination.lowLyingPlacenta !== undefined &&
        temp.obstetricExamination.lowLyingPlacenta !== null
      ) {
        temp.obstetricExamination.lowLyingPlacenta =
          temp.obstetricExamination.lowLyingPlacenta.toString();
      }

      if (
        temp.obstetricExamination.vertebralDeformity !== undefined &&
        temp.obstetricExamination.vertebralDeformity !== null
      ) {
        temp.obstetricExamination.vertebralDeformity =
          temp.obstetricExamination.vertebralDeformity.toString();
      }
    }
  }

  patchOralExamination(examinationDetails: any) {
    if (
      examinationDetails.oralDetails !== undefined &&
      examinationDetails.oralDetails !== null
    ) {
      const arr = [
        'Leukoplakia',
        'Sub muscus fibrosis',
        'Melanoplakia',
        'Erythroplakia',
        'Non healing mouth ulcer(>2 weeks)',
        'Any other lesion',
      ];
      const temp = examinationDetails.oralDetails.preMalignantLesionTypeList;

      if (temp !== undefined && temp !== null) {
        const other = temp.filter((item: any) => {
          return arr.indexOf(item) === -1;
        });

        if (other.length > 0) {
          examinationDetails.oralDetails.otherLesionType = other[0];
          temp.push('Any other lesion');
        }
      }

      examinationDetails.oralDetails.preMalignantLesionTypeList = temp;

      const oralExaminationFormDetails = Object.assign(
        {},
        examinationDetails.oralDetails,
      );

      this.patientExaminationForm.controls['oralExaminationForm'].patchValue(
        oralExaminationFormDetails,
      );
    }
  }
}
