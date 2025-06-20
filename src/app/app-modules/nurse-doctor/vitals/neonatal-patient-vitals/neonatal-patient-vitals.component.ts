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
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { DoctorService, NurseService } from '../../shared/services';
import { environment } from 'src/environments/environment';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import {
  BeneficiaryDetailsService,
  ConfirmationService,
} from 'src/app/app-modules/core/services';
import { MatDialog } from '@angular/material/dialog';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { IotcomponentComponent } from 'src/app/app-modules/core/components/iotcomponent/iotcomponent.component';
import { ActivatedRoute } from '@angular/router';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-nurse-neonatal-patient-vitals',
  templateUrl: './neonatal-patient-vitals.component.html',
  styleUrls: ['./neonatal-patient-vitals.component.css'],
})
export class NeonatalPatientVitalsComponent
  implements OnChanges, OnInit, DoCheck, OnDestroy
{
  @Input()
  neonatalVitalsForm!: FormGroup;

  @Input()
  mode!: string;

  @Input()
  visitCategory!: string;

  currentLanguageSet: any;
  male = false;
  totalMonths!: number;
  benAge: any;
  female = false;
  startWeightTest = environment.startWeighturl;
  startTempTest = environment.startTempurl;
  doctorScreen = false;
  benGenderType: any;
  attendant: any;

  constructor(
    private dialog: MatDialog,
    private confirmationService: ConfirmationService,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    public httpServiceService: HttpServiceService,
    private doctorService: DoctorService,
    private nurseService: NurseService,
    private route: ActivatedRoute,
    readonly sessionstorage: SessionStorageService,
  ) {}

  ngOnInit() {
    this.getBeneficiaryDetails();
    this.nurseService.clearEnableLAssessment();
    this.getGender();
  }

  ngOnChanges() {
    if (String(this.mode) === 'view') {
      const visitID = this.sessionstorage.getItem('visitID');
      const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
      this.getGeneralVitalsData();
      this.doctorScreen = true;
    }

    const specialistFlagString = this.sessionstorage.getItem('specialistFlag');

    if (
      specialistFlagString !== null &&
      parseInt(specialistFlagString) === 100
    ) {
      const visitID = this.sessionstorage.getItem('visitID');
      const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
      this.getGeneralVitalsData();
    }

    if (String(this.mode) === 'update') {
      this.doctorScreen = true;
      this.updateGeneralVitals(this.neonatalVitalsForm);
    }

    this.attendant = this.route.snapshot.params['attendant'];
    if (this.attendant === 'nurse') {
      this.getPreviousVisitAnthropometry();
    }
  }

  ngOnDestroy() {
    if (this.beneficiaryDetailSubscription)
      this.beneficiaryDetailSubscription.unsubscribe();
    if (this.generalVitalsDataSubscription)
      this.generalVitalsDataSubscription.unsubscribe();
    this.nurseService.isAssessmentDone = false;
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  getPreviousVisitAnthropometry() {
    this.generalVitalsDataSubscription = this.doctorService
      .getPreviousVisitAnthropometry({
        benRegID: this.sessionstorage.getItem('beneficiaryRegID'),
      })
      .subscribe((anthropometryData: any) => {
        if (
          anthropometryData &&
          anthropometryData.data &&
          anthropometryData.data.response &&
          anthropometryData.data.response !== 'Visit code is not found' &&
          anthropometryData.data.response !== 'No data found'
        ) {
          const heightStr = anthropometryData.data.response.toString();
          this.neonatalVitalsForm.controls['height_cm'].patchValue(
            heightStr.endsWith('.0')
              ? Math.round(anthropometryData.data.response)
              : anthropometryData.data.response,
          );
        }
      });
  }

  benGenderAndAge: any;
  beneficiaryDetailSubscription: any;
  getBeneficiaryDetails() {
    this.beneficiaryDetailSubscription =
      this.beneficiaryDetailsService.beneficiaryDetails$.subscribe(
        (beneficiary) => {
          if (beneficiary) {
            if (beneficiary && beneficiary.ageVal) {
              this.benGenderAndAge = beneficiary;
              this.benAge = beneficiary.ageVal;
              this.benGenderAndAge = beneficiary;
              const ageMonth = this.benGenderAndAge.age;
              const ar = ageMonth.split(' ');
              this.totalMonths = Number(ar[0] * 12) + Number(ar[3]);
            }
            if (
              beneficiary !== undefined &&
              beneficiary.genderName !== undefined &&
              beneficiary.genderName !== null &&
              beneficiary.genderName &&
              beneficiary.genderName.toLowerCase() === 'female'
            ) {
              this.female = true;
            }
            if (
              beneficiary !== undefined &&
              beneficiary.genderName !== undefined &&
              beneficiary.genderName !== null &&
              beneficiary.genderName &&
              beneficiary.genderName.toLowerCase() === 'male'
            ) {
              this.male = true;
            }
          }
        },
      );
  }

  openIOTWeightModel() {
    const dialogRef = this.dialog.open(IotcomponentComponent, {
      width: '600px',
      height: '180px',
      disableClose: true,
      data: { startAPI: this.startWeightTest },
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log('he;;p', result, result['result']);
      if (result !== null) {
        this.neonatalVitalsForm.patchValue({
          weight_Kg: result['result'],
        });
        this.doctorService.setValueToEnableVitalsUpdateButton(true);
      }
    });
  }

  updateGeneralVitals(neonatalVitalsForm: any) {
    this.doctorService
      .updateNeonatalVitals(neonatalVitalsForm, this.visitCategory)
      .subscribe(
        (res: any) => {
          if (res.statusCode === 200 && res.data !== null) {
            this.confirmationService.alert(res.data.response, 'success');
            this.doctorService.setValueToEnableVitalsUpdateButton(false);
            this.neonatalVitalsForm.markAsPristine();
          } else {
            this.confirmationService.alert(res.errorMessage, 'error');
          }
        },
        (err) => {
          this.confirmationService.alert(err, 'error');
        },
      );
  }

  generalVitalsDataSubscription: any;
  getGeneralVitalsData() {
    this.generalVitalsDataSubscription = this.doctorService
      .getGenericVitals({
        benRegID: this.sessionstorage.getItem('beneficiaryRegID'),
        benVisitID: this.sessionstorage.getItem('visitID'),
      })
      .subscribe((vitalsData) => {
        if (vitalsData) {
          const temp = Object.assign(
            {},
            vitalsData.data.benAnthropometryDetail,
            vitalsData.data.benPhysicalVitalDetail,
          );
          this.neonatalVitalsForm.patchValue(temp);
        }
      });
  }

  openIOTTempModel() {
    const dialogRef = this.dialog.open(IotcomponentComponent, {
      width: '600px',
      height: '180px',
      disableClose: true,
      data: { startAPI: this.startTempTest },
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log('temperature', result, result['temperature']);
      if (result !== null) {
        this.neonatalVitalsForm.patchValue({
          temperature: result['temperature'],
        });
        this.doctorService.setValueToEnableVitalsUpdateButton(true);
      }
    });
  }

  checkHeight(height_cm: any) {
    if (
      this.visitCategory.toLowerCase() ===
      'neonatal and infant health care services'
    ) {
      if (height_cm < 35 || height_cm > 85) {
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.recheckValue,
        );
      }
    }
    if (
      this.visitCategory.toLowerCase() ===
      'childhood & adolescent healthcare services'
    ) {
      if (height_cm < 60 || height_cm > 190) {
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.recheckValue,
        );
      }
    }
  }

  checkWeight(weight_Kg: any) {
    if (
      this.visitCategory.toLowerCase() ===
      'neonatal and infant health care services'
    ) {
      if (weight_Kg < 1 || weight_Kg > 15) {
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.recheckValue,
        );
      }
    }
    if (
      this.visitCategory.toLowerCase() ===
      'childhood & adolescent healthcare services'
    ) {
      if (weight_Kg < 6 || weight_Kg > 99) {
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.recheckValue,
        );
      }
    }
  }

  checkHeadCircumference(headCircumference_cm: any) {
    if (headCircumference_cm <= 29 || headCircumference_cm >= 61) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue,
      );
    }
  }

  checkTemperature(temperature: any) {
    if (temperature <= 94 || temperature >= 107) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue,
      );
    }
  }

  get height_cm() {
    return this.neonatalVitalsForm.controls['height_cm'].value;
  }

  get weight_Kg() {
    return this.neonatalVitalsForm.controls['weight_Kg'].value;
  }

  get temperature() {
    return this.neonatalVitalsForm.controls['temperature'].value;
  }

  get headCircumference_cm() {
    return this.neonatalVitalsForm.controls['headCircumference_cm'].value;
  }

  getGender() {
    const gender = this.sessionstorage.getItem('beneficiaryGender');
    if (gender === 'Female') this.benGenderType = 1;
    else if (gender === 'Male') this.benGenderType = 0;
    else if (gender === 'Transgender') this.benGenderType = 2;
  }
}
