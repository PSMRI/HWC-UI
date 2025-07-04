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
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { DoctorService, NurseService } from '../../shared/services';
import { NcdScreeningService } from '../../shared/services/ncd-screening.service';
import { environment } from 'src/environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { IotcomponentComponent } from 'src/app/app-modules/core/components/iotcomponent/iotcomponent.component';

@Component({
  selector: 'app-hypertension-screening',
  templateUrl: './hypertension-screening.component.html',
  styleUrls: ['./hypertension-screening.component.css'],
})
export class HypertensionScreeningComponent
  implements OnInit, DoCheck, OnDestroy
{
  @Input()
  hypertensionScreeningForm!: FormGroup;

  @Input()
  mode!: string;

  @Input()
  confirmDiseasesList: any;

  currentLanguageSet: any;
  startBPTest = environment.startBPurl;

  averageSystolicBP_Reading: any;
  bpStatus: any;
  isHypertensionSuspected = false;
  hideBpForm = false;
  disableStatusButton = true;
  hideRemoveFunctionalityInDoctorIfSuspected = false;

  @Output() hypertensionFormStatus = new EventEmitter<boolean>();
  confirmDiseaseArray: any = [];
  hideStatusButton = false;
  confirmedDiseasesListSubscription!: Subscription;
  disableCheckbox = false;
  attendant!: string;
  constructor(
    private dialog: MatDialog,
    private confirmationService: ConfirmationService,
    public httpServiceService: HttpServiceService,
    private nurseService: NurseService,
    private ncdScreeningService: NcdScreeningService,
    private doctorService: DoctorService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.ncdScreeningService.setScreeningDataFetch(false);
    this.assignSelectedLanguage();
    if (String(this.mode) === 'view') {
      this.getNcdScreeningDataForCbac();
      this.markAsUnSuspectedOnLoad(this.isHypertensionSuspected);
      this.disableStatusButton = true;
    }
    this.attendant = this.route.snapshot.params['attendant'];
    this.confirmDiseaseArray = this.confirmDiseasesList;
    this.setConfirmedDiseasesForScreening();
    this.ncdScreeningService.clearConfirmedDiseasesForScreening();
    this.confirmedDiseasesListSubscription =
      this.ncdScreeningService.confirmedDiseasesListCheck$.subscribe(
        (response: any) => {
          if (
            response !== undefined &&
            response !== null &&
            response.length >= 0
          ) {
            this.confirmDiseaseArray = response;
            this.setConfirmedDiseasesForScreening();
          }
        },
      );

    this.ncdScreeningService.fetchScreeningDataCheck$.subscribe(
      (responsevalue) => {
        if (responsevalue === true) {
          this.getNcdScreeningDataForCbac();
        }
      },
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

  ngOnDestroy() {
    if (this.screeningDataSubscription) {
      this.screeningDataSubscription.unsubscribe();
    }
    if (this.confirmedDiseasesListSubscription)
      this.confirmedDiseasesListSubscription.unsubscribe();
    this.hypertensionScreeningForm.reset();
  }

  setConfirmedDiseasesForScreening() {
    if (this.confirmDiseaseArray.length > 0) {
      if (this.confirmDiseaseArray.includes(environment.hypertension)) {
        this.hypertensionScreeningForm.disable();
        this.hideStatusButton = true;
        this.hypertensionScreeningForm.patchValue({
          suspected: null,
          formDisable: true,
        });
        this.disableCheckbox = true;
      } else {
        this.ncdScreeningService.isHypertensionConfirmed = false;
        this.resetHypertensionForm();
        this.disableCheckbox = false;
      }
    } else {
      this.resetHypertensionForm();

      // On nurse initial load, checkbox should be disabled and enable the checkbox if the hypertension is suspected.
      (this.attendant === 'nurse' || this.attendant === 'doctor') &&
      this.isHypertensionSuspected === true
        ? (this.disableCheckbox = false)
        : (this.disableCheckbox = true);
    }
    // on selection of "No" on final diagnosis, If hypertension already suspected, enable the badge
    if (this.isHypertensionSuspected === true) {
      this.ncdScreeningService.hypertensionSuspectStatus(
        this.isHypertensionSuspected,
      );
    }
  }
  resetHypertensionForm() {
    this.hypertensionScreeningForm.enable();
    this.hideStatusButton = false;
    this.hypertensionScreeningForm.patchValue({ formDisable: null });
  }

  screeningDataSubscription: any;
  getNcdScreeningDataForCbac() {
    if (
      this.doctorService.screeningDetailsResponseFromNurse !== null &&
      this.doctorService.screeningDetailsResponseFromNurse !== undefined &&
      this.doctorService.screeningDetailsResponseFromNurse.hypertension !==
        null &&
      this.doctorService.screeningDetailsResponseFromNurse.hypertension !==
        undefined
    ) {
      this.hideRemoveFunctionalityInDoctorIfSuspected = true;
      const ncdHypertensionData = Object.assign(
        this.doctorService.screeningDetailsResponseFromNurse.hypertension,
      );
      ncdHypertensionData.suspected === true
        ? (this.isHypertensionSuspected = true)
        : (this.isHypertensionSuspected = false);
      this.ncdScreeningService.hypertensionSuspectStatus(
        this.isHypertensionSuspected,
      );
      this.hypertensionScreeningForm.patchValue(ncdHypertensionData);
    }
  }

  checkSystolicBP(systolicBpReading: any) {
    if (systolicBpReading < 40 || systolicBpReading > 320) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue,
      );
    }
    this.resetBpStatus();
  }

  checkDiastolicBP(diastolicBpReading: any) {
    if (diastolicBpReading < 10 || diastolicBpReading > 180) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue,
      );
    }
    this.resetBpStatus();
  }

  resetBpStatus() {
    this.bpStatus = null;
    this.isHypertensionSuspected = false;
  }
  calculateAverageSystolicBP() {
    const systolicBPReadings = [];
    const systolicBP1 =
      this.systolicBP_1stReading !== null &&
      this.systolicBP_1stReading !== undefined &&
      this.systolicBP_1stReading !== ''
        ? parseInt(this.systolicBP_1stReading)
        : 0;
    systolicBP1 !== 0 ? systolicBPReadings.push(systolicBP1) : null;
    const systolicBP2 =
      this.systolicBP_2ndReading !== null &&
      this.systolicBP_2ndReading !== undefined &&
      this.systolicBP_2ndReading !== ''
        ? parseInt(this.systolicBP_2ndReading)
        : 0;
    systolicBP2 !== 0 ? systolicBPReadings.push(systolicBP2) : null;
    const systolicBP3 =
      this.systolicBP_3rdReading !== null &&
      this.systolicBP_3rdReading !== undefined &&
      this.systolicBP_3rdReading !== ''
        ? parseInt(this.systolicBP_3rdReading)
        : 0;
    systolicBP3 !== 0 ? systolicBPReadings.push(systolicBP3) : null;

    const averageSystolicBP_Reading =
      systolicBPReadings.length > 0
        ? systolicBPReadings.reduce(
            (cumulativeSystolicValue, currentBpValue) =>
              cumulativeSystolicValue + currentBpValue,
            0,
          ) / systolicBPReadings.length
        : 0;
    console.log(
      'averageSystolicBP_Reading',
      averageSystolicBP_Reading.toFixed(0),
    );
    this.hypertensionScreeningForm.patchValue({
      averageSystolicBP:
        averageSystolicBP_Reading > 0
          ? averageSystolicBP_Reading.toFixed(0)
          : null,
    });
    this.ncdScreeningService.screeningValueChanged(true); // observable used to enable the update button.
    if (
      this.averageDiastolicBP !== null &&
      this.averageDiastolicBP !== undefined
    ) {
      this.disableStatusButton = false;
    } else {
      this.disableStatusButton = true;
    }
  }

  calculateAverageDiastolicBP() {
    const diastolicBPReadings = [];
    const diastolicBP1 =
      this.diastolicBP_1stReading !== null &&
      this.diastolicBP_1stReading !== undefined &&
      this.diastolicBP_1stReading !== ''
        ? parseInt(this.diastolicBP_1stReading)
        : 0;
    diastolicBP1 !== 0 ? diastolicBPReadings.push(diastolicBP1) : null;
    const diastolicBP2 =
      this.diastolicBP_2ndReading !== null &&
      this.diastolicBP_2ndReading !== undefined &&
      this.diastolicBP_2ndReading !== ''
        ? parseInt(this.diastolicBP_2ndReading)
        : 0;
    diastolicBP2 !== 0 ? diastolicBPReadings.push(diastolicBP2) : null;
    const diastolicBP3 =
      this.diastolicBP_3rdReading !== null &&
      this.diastolicBP_3rdReading !== undefined &&
      this.diastolicBP_3rdReading !== ''
        ? parseInt(this.diastolicBP_3rdReading)
        : 0;
    diastolicBP3 !== 0 ? diastolicBPReadings.push(diastolicBP3) : null;

    const averageDiastolicBP_Reading =
      diastolicBPReadings.length > 0
        ? diastolicBPReadings.reduce(
            (cumulativeDiastolicValue, currentBpValue) =>
              cumulativeDiastolicValue + currentBpValue,
            0,
          ) / diastolicBPReadings.length
        : 0;
    console.log(
      'averageSystolicBP_Reading',
      averageDiastolicBP_Reading.toFixed(0),
    );
    this.hypertensionScreeningForm.patchValue({
      averageDiastolicBP:
        averageDiastolicBP_Reading > 0
          ? averageDiastolicBP_Reading.toFixed(0)
          : null,
    });
    this.ncdScreeningService.screeningValueChanged(true); // observable used to enable the update button.
    if (
      this.averageSystolicBP !== null &&
      this.averageSystolicBP !== undefined
    ) {
      this.disableStatusButton = false;
    } else {
      this.disableStatusButton = true;
    }
  }

  checkSystolicGreater1(systolic1: any, diastolic1: any) {
    console.log(systolic1, diastolic1);
    if (systolic1 && diastolic1) {
      if (parseInt(systolic1) <= parseInt(diastolic1)) {
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.sysBp,
        );
        this.hypertensionScreeningForm.patchValue({
          systolicBP_1stReading: null,
        });
      }
    }
    this.calculateAverageSystolicBP();
  }

  checkSystolicGreater2(systolic2: any, diastolic2: any) {
    console.log(systolic2, diastolic2);
    if (systolic2 && diastolic2) {
      if (parseInt(systolic2) <= parseInt(diastolic2)) {
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.sysBp,
        );
        this.hypertensionScreeningForm.patchValue({
          systolicBP_2ndReading: null,
        });
      }
    }
    this.calculateAverageSystolicBP();
  }

  checkSystolicGreater3(systolic3: any, diastolic3: any) {
    console.log(systolic3, diastolic3);
    if (systolic3 && diastolic3) {
      if (parseInt(systolic3) <= parseInt(diastolic3)) {
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.sysBp,
        );
        this.hypertensionScreeningForm.patchValue({
          systolicBP_3rdReading: null,
        });
      }
    }
    this.calculateAverageSystolicBP();
  }

  checkDiastolicLesser1(systolic1: any, diastolic1: any) {
    console.log(systolic1, diastolic1);
    if (systolic1 && diastolic1) {
      if (parseInt(systolic1) <= parseInt(diastolic1)) {
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.DiaBp,
        );
        this.hypertensionScreeningForm.patchValue({
          diastolicBP_1stReading: null,
        });
      }
    }
    this.calculateAverageDiastolicBP();
  }

  checkDiastolicLesser2(systolic2: any, diastolic2: any) {
    console.log(systolic2, diastolic2);
    if (systolic2 && diastolic2) {
      if (parseInt(systolic2) <= parseInt(diastolic2)) {
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.DiaBp,
        );
        this.hypertensionScreeningForm.patchValue({
          diastolicBP_2ndReading: null,
        });
      }
    }
    this.calculateAverageDiastolicBP();
  }

  checkDiastolicLesser3(systolic3: any, diastolic3: any) {
    console.log(systolic3, diastolic3);
    if (systolic3 && diastolic3) {
      if (parseInt(systolic3) <= parseInt(diastolic3)) {
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.DiaBp,
        );
        this.hypertensionScreeningForm.patchValue({
          diastolicBP_3rdReading: null,
        });
      }
    }
    this.calculateAverageDiastolicBP();
  }

  checkBloodPressureStatus() {
    if (
      this.averageSystolicBP !== null &&
      this.averageSystolicBP !== undefined &&
      this.averageSystolicBP !== '' &&
      this.averageDiastolicBP !== null &&
      this.averageDiastolicBP !== undefined &&
      this.averageDiastolicBP !== ''
    ) {
      const findBPStatus = {
        averageSystolic: this.averageSystolicBP,
        averageDiastolic: this.averageDiastolicBP,
      };
      this.nurseService
        .getBloodPressureStatus(findBPStatus)
        .subscribe((res: any) => {
          if (res && res.statusCode === 200) {
            this.bpStatus = res.data.status;
            if (
              this.bpStatus.toLowerCase() !== 'normal bp' &&
              this.bpStatus.toLowerCase() !== 'pre-hypertension'
            ) {
              this.ncdScreeningService.isHypertensionConfirmed !== true
                ? (this.isHypertensionSuspected = true)
                : (this.isHypertensionSuspected = false);
              this.attendant === 'nurse' || this.attendant === 'doctor'
                ? (this.disableCheckbox = false)
                : null;
              this.ncdScreeningService.hypertensionSuspectStatus(
                this.isHypertensionSuspected,
              );
              this.hypertensionScreeningForm.patchValue({
                suspected: this.isHypertensionSuspected,
              });
            } else {
              this.isHypertensionSuspected = false;
              this.ncdScreeningService.hypertensionSuspectStatus(
                this.isHypertensionSuspected,
              );
              this.hypertensionScreeningForm.patchValue({
                suspected:
                  this.isHypertensionSuspected === false ? false : true,
              });
            }
          } else {
            this.confirmationService.alert(
              this.currentLanguageSet.issueFetchingBPStatus,
              'error',
            );
          }
        });
    }
  }

  get systolicBP_1stReading() {
    return this.hypertensionScreeningForm.controls['systolicBP_1stReading']
      .value;
  }

  get diastolicBP_1stReading() {
    return this.hypertensionScreeningForm.controls['diastolicBP_1stReading']
      .value;
  }

  get systolicBP_2ndReading() {
    return this.hypertensionScreeningForm.controls['systolicBP_2ndReading']
      .value;
  }

  get diastolicBP_2ndReading() {
    return this.hypertensionScreeningForm.controls['diastolicBP_2ndReading']
      .value;
  }

  get systolicBP_3rdReading() {
    return this.hypertensionScreeningForm.controls['systolicBP_3rdReading']
      .value;
  }

  get diastolicBP_3rdReading() {
    return this.hypertensionScreeningForm.controls['diastolicBP_3rdReading']
      .value;
  }

  get averageDiastolicBP() {
    return this.hypertensionScreeningForm.controls['averageDiastolicBP'].value;
  }

  get averageSystolicBP() {
    return this.hypertensionScreeningForm.controls['averageSystolicBP'].value;
  }

  openIOTBP1Model() {
    const dialogRef = this.dialog.open(IotcomponentComponent, {
      width: '600px',
      height: '180px',
      disableClose: true,
      data: { startAPI: this.startBPTest },
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log('blood_pressure', result['sys'], result['dia']);
      if (result !== null) {
        this.hypertensionScreeningForm.patchValue({
          systolicBP_1stReading: result['sys'],
          diastolicBP_1stReading: result['dia'],
        });
      }
    });
  }
  openIOTBP2Model() {
    const dialogRef = this.dialog.open(IotcomponentComponent, {
      width: '600px',
      height: '180px',
      disableClose: true,
      data: { startAPI: this.startBPTest },
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log('blood_pressure', result['sys'], result['dia']);
      if (result !== null) {
        this.hypertensionScreeningForm.patchValue({
          systolicBP_2ndReading: result['sys'],
          diastolicBP_2ndReading: result['dia'],
        });
      }
    });
  }
  openIOTBP3Model() {
    const dialogRef = this.dialog.open(IotcomponentComponent, {
      width: '600px',
      height: '180px',
      disableClose: true,
      data: { startAPI: this.startBPTest },
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log('blood_pressure', result['sys'], result['dia']);
      if (result !== null) {
        this.hypertensionScreeningForm.patchValue({
          systolicBP_3rdReading: result['sys'],
          diastolicBP_3rdReading: result['dia'],
        });
      }
    });
  }
  hideHypertensionForm() {
    this.confirmationService
      .confirm(`warn`, this.currentLanguageSet.alerts.info.warn)
      .subscribe((result) => {
        if (result) {
          this.hideBpForm = true;
          this.hypertensionFormStatus.emit(false);
          this.hypertensionScreeningForm.reset();
          this.ncdScreeningService.hypertensionSuspectStatus(false);
          if (String(this.mode) === 'view' || String(this.mode) === 'update')
            this.ncdScreeningService.screeningValueChanged(true);
        } else {
          this.hideBpForm = false;
        }
      });
  }
  markAsUnsuspected(checkedValue: any) {
    if (!checkedValue) {
      this.hypertensionScreeningForm.patchValue({ suspected: false });
      this.isHypertensionSuspected = false;
      this.hypertensionScreeningForm.markAsDirty();
      this.ncdScreeningService.hypertensionSuspectStatus(false); // remove badge
      this.ncdScreeningService.screeningValueChanged(true);
    } else {
      this.hypertensionScreeningForm.patchValue({ suspected: true });
      this.isHypertensionSuspected = true;
      this.hypertensionScreeningForm.markAsDirty();
      this.ncdScreeningService.hypertensionSuspectStatus(true); // enable badge
      this.ncdScreeningService.screeningValueChanged(true);
    }
  }

  markAsUnSuspectedOnLoad(checkedValue: any) {
    if (!checkedValue) {
      this.hypertensionScreeningForm.patchValue({ suspected: false });
      this.isHypertensionSuspected = false;
      this.ncdScreeningService.hypertensionSuspectStatus(false); // remove badge
      this.ncdScreeningService.screeningValueChanged(true);
    } else {
      this.hypertensionScreeningForm.patchValue({ suspected: true });
      this.isHypertensionSuspected = true;
      this.ncdScreeningService.hypertensionSuspectStatus(true); // enable badge
      this.ncdScreeningService.screeningValueChanged(true);
    }
  }
}
