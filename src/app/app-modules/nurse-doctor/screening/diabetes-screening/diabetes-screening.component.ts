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
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../shared/services';
import { NcdScreeningService } from '../../shared/services/ncd-screening.service';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { MatDialog } from '@angular/material/dialog';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { IotcomponentComponent } from 'src/app/app-modules/core/components/iotcomponent/iotcomponent.component';

@Component({
  selector: 'app-diabetes-screening',
  templateUrl: './diabetes-screening.component.html',
  styleUrls: ['./diabetes-screening.component.css'],
})
export class DiabetesScreeningComponent
  implements OnChanges, OnInit, DoCheck, OnDestroy
{
  @Input()
  diabetesScreeningForm!: FormGroup;

  @Input()
  mode!: string;

  @Input()
  confirmDiseasesList: any;

  interpretation: any;
  isDiabetesSuspected = false; // This value is to mark the diabetes as suspected or not susoected case
  hideForm = false;

  bloodGlucoseSampleTypes: any = [];
  currentLanguageSet: any;
  nurseMasterDataSubscription!: Subscription;
  startRBSTest = environment.startRBSurl;
  confirmDiseaseArray: any = [];
  disableFindStatuButton = true;
  hideStatusButton = false;

  @Output() diabetesFormStatus = new EventEmitter<boolean>();
  confirmedDiseasesListSubscription!: Subscription;
  hideRemoveFunctionalityInDoctorIfSuspected = false;
  disableCheckbox = false;
  attendant!: string;

  constructor(
    private httpServiceService: HttpServiceService,
    private masterdataService: MasterdataService,
    private confirmationService: ConfirmationService,
    private ncdScreeningService: NcdScreeningService,
    private nurseService: NurseService,
    private dialog: MatDialog,
    private doctorService: DoctorService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.ncdScreeningService.setScreeningDataFetch(false);
    this.getNurseMasterData();
    this.attendant = this.route.snapshot.params['attendant'];
    this.disableFindStatuButton = true;
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

  ngOnChanges() {
    if (String(this.mode) === 'view') {
      this.getNcdScreeningDataForCbac();
      this.disableFindStatuButton = true;
    }
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  checkingDiabeticStatus() {
    if (
      this.bloodGlucose !== undefined &&
      this.bloodGlucose !== null &&
      this.bloodGlucose < 10
    ) {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.recheckValue,
        'info',
      );
      this.diabetesScreeningForm.get('bloodGlucose')?.reset();
      this.disableFindStatuButton = true;
    } else {
      if (
        this.bloodGlucoseSampleTypes !== undefined &&
        this.bloodGlucoseSampleTypes !== null &&
        this.bloodGlucose !== undefined &&
        this.bloodGlucose !== null
      ) {
        this.bloodGlucose >= 10 && this.bloodGlucose <= 600
          ? (this.disableFindStatuButton = false)
          : (this.disableFindStatuButton = true);
      } else {
        this.disableFindStatuButton = true;
        this.interpretation = null;
        this.isDiabetesSuspected = false;
        this.ncdScreeningService.diabetesSuspectStatus(false);
      }
      this.ncdScreeningService.screeningValueChanged(true); // observable used to enable the update button.
    }
  }

  setConfirmedDiseasesForScreening() {
    if (this.confirmDiseaseArray.length > 0) {
      if (this.confirmDiseaseArray.includes(environment.diabetes)) {
        this.diabetesScreeningForm.disable();
        this.hideStatusButton = true;
        this.diabetesScreeningForm.patchValue({
          suspected: null,
          formDisable: true,
        });
        this.disableCheckbox = true;
      } else {
        this.ncdScreeningService.isDiabetesConfirmed = false;
        this.resetDiabetesForm();
        this.disableCheckbox = false;
      }
    } else {
      this.resetDiabetesForm();
      // On nurse initial load, checkbox should be disabled and enable the checkbox if the diabetes is suspected.
      (this.attendant === 'nurse' || this.attendant === 'doctor') &&
      this.isDiabetesSuspected === true
        ? (this.disableCheckbox = false)
        : (this.disableCheckbox = true);
    }
    // on selection of "No" on final diagnosis, If diabetes already suspected, enable the badge
    if (this.isDiabetesSuspected === true) {
      this.ncdScreeningService.diabetesSuspectStatus(this.isDiabetesSuspected);
    }
  }
  resetDiabetesForm() {
    this.diabetesScreeningForm.enable();
    this.diabetesScreeningForm.patchValue({ formDisable: null });
    this.hideStatusButton = false;
    this.attendant === 'nurse' ? (this.disableCheckbox = true) : null;
  }
  getNurseMasterData() {
    this.nurseMasterDataSubscription =
      this.masterdataService.nurseMasterData$.subscribe((data: any) => {
        if (data) {
          if (
            data.bloodGlucoseType !== undefined &&
            data.bloodGlucoseType !== null
          ) {
            this.bloodGlucoseSampleTypes = data.bloodGlucoseType;
            //making random value as a default
            data.bloodGlucoseType.filter((item: any) => {
              if (
                item.name !== undefined &&
                item.name !== null &&
                item.name.toLowerCase() === 'random'
              ) {
                this.diabetesScreeningForm.patchValue({
                  bloodGlucoseTypeID: item.id,
                });
              }
            });
            if (String(this.mode) === 'view') {
              this.getNcdScreeningDataForCbac();
              this.markAsUnSuspectedOnLoad(this.isDiabetesSuspected);
              this.disableFindStatuButton = true;
            }
          }
        } else {
          console.log('Issue in fetching blood glucose masters');
        }
      });
  }
  get bloodGlucoseTypeID() {
    return this.diabetesScreeningForm.controls['bloodGlucoseTypeID'].value;
  }
  get bloodGlucose() {
    return this.diabetesScreeningForm.controls['bloodGlucose'].value;
  }
  getDiabetes() {
    if (
      this.bloodGlucoseTypeID !== undefined &&
      this.bloodGlucoseTypeID !== null &&
      this.bloodGlucose !== undefined &&
      this.bloodGlucose !== null &&
      this.bloodGlucose !== ''
    ) {
      this.bloodGlucoseSampleTypes.filter((sampleType: any) => {
        if (sampleType.id === this.bloodGlucoseTypeID) {
          this.diabetesScreeningForm.controls['bloodGlucoseType'].patchValue(
            sampleType.name,
          );
        }
      });
      const diabaticStatus = {
        bloodGlucoseTypeID: this.bloodGlucoseTypeID,
        bloodGlucoseType: this.diabetesScreeningForm.controls[
          'bloodGlucoseType'
        ].value
          ? this.diabetesScreeningForm.controls['bloodGlucoseType'].value
          : null,
        bloodGlucose: this.bloodGlucose,
      };

      this.nurseService
        .getDiabetesStatus(diabaticStatus)
        .subscribe((res: any) => {
          if (res && res.statusCode === 200) {
            this.interpretation = res.data.status;
            if (
              this.interpretation !== undefined &&
              this.interpretation !== null &&
              this.interpretation.toLowerCase() !== 'non-diabetic range' &&
              this.interpretation.toLowerCase() !==
                'normal/non-diabetic range' &&
              this.interpretation.toLowerCase() !== 'pre-diabetic range'
            ) {
              this.ncdScreeningService.isDiabetesConfirmed !== true
                ? (this.isDiabetesSuspected = true)
                : (this.isDiabetesSuspected = false);
              this.attendant === 'nurse' || this.attendant === 'doctor'
                ? (this.disableCheckbox = false)
                : null;
              this.ncdScreeningService.diabetesSuspectStatus(
                this.isDiabetesSuspected,
              );
              this.diabetesScreeningForm.patchValue({
                suspected: this.isDiabetesSuspected,
              });
            } else {
              this.isDiabetesSuspected = false;
              this.ncdScreeningService.diabetesSuspectStatus(
                this.isDiabetesSuspected,
              );
              this.diabetesScreeningForm.patchValue({
                suspected: this.isDiabetesSuspected === false ? false : true,
              });
              this.disableFindStatuButton = true;
            }
          } else {
            this.confirmationService.alert(
              this.currentLanguageSet.issueFetchingDiabetesStatus,
              'error',
            );
          }
        });
    }
  }

  screeningDataSubscription: any;
  getNcdScreeningDataForCbac() {
    if (
      this.doctorService.screeningDetailsResponseFromNurse !== null &&
      this.doctorService.screeningDetailsResponseFromNurse !== undefined &&
      this.doctorService.screeningDetailsResponseFromNurse.diabetes !== null &&
      this.doctorService.screeningDetailsResponseFromNurse.diabetes !==
        undefined
    ) {
      this.hideRemoveFunctionalityInDoctorIfSuspected = true;
      const ncdDiabetesData = Object.assign(
        this.doctorService.screeningDetailsResponseFromNurse.diabetes,
      );
      if (ncdDiabetesData !== null && ncdDiabetesData !== undefined) {
        ncdDiabetesData.suspected === true
          ? (this.isDiabetesSuspected = true)
          : (this.isDiabetesSuspected = false);
        this.ncdScreeningService.diabetesSuspectStatus(
          this.isDiabetesSuspected,
        );
        this.diabetesScreeningForm.patchValue(ncdDiabetesData);
      }
    }
  }

  openIOTRBSModel() {
    const dialogRef = this.dialog.open(IotcomponentComponent, {
      width: '600px',
      height: '180px',
      disableClose: true,
      data: { startAPI: this.startRBSTest },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result !== null) {
        this.diabetesScreeningForm.patchValue({
          testValue: result['result'],
        });
      }
    });
  }

  hideDiabetesForm() {
    this.confirmationService
      .confirm(`warn`, this.currentLanguageSet.alerts.info.warn)
      .subscribe((result) => {
        if (result) {
          this.hideForm = true;
          this.diabetesFormStatus.emit(false);
          this.diabetesScreeningForm.reset();
          this.ncdScreeningService.diabetesSuspectStatus(false);
          if (String(this.mode) === 'view' || String(this.mode) === 'update')
            this.ncdScreeningService.screeningValueChanged(true);
        } else {
          this.hideForm = false;
        }
      });
  }
  resetDiabeticValues() {
    this.diabetesScreeningForm.controls['bloodGlucose'].patchValue(null);
    this.isDiabetesSuspected = false;
    this.ncdScreeningService.diabetesSuspectStatus(this.isDiabetesSuspected);
    this.interpretation = null;
    this.disableFindStatuButton = true;
  }
  markAsUnsuspected(checkedValue: any) {
    if (!checkedValue) {
      this.diabetesScreeningForm.patchValue({ suspected: false });
      this.isDiabetesSuspected = false;
      this.diabetesScreeningForm.markAsDirty();
      this.ncdScreeningService.diabetesSuspectStatus(false); // remove badge
      this.ncdScreeningService.screeningValueChanged(true); // observable used to enable the update button.
    } else {
      this.diabetesScreeningForm.patchValue({ suspected: true });
      this.isDiabetesSuspected = true;
      this.diabetesScreeningForm.markAsDirty();
      this.ncdScreeningService.diabetesSuspectStatus(true); // enable badge
      this.ncdScreeningService.screeningValueChanged(true);
    }
  }

  markAsUnSuspectedOnLoad(checkedValue: any) {
    if (!checkedValue) {
      this.diabetesScreeningForm.patchValue({ suspected: false });
      this.isDiabetesSuspected = false;
      this.ncdScreeningService.diabetesSuspectStatus(false); // remove badge
      this.ncdScreeningService.screeningValueChanged(true); // observable used to enable the update button.
    } else {
      this.diabetesScreeningForm.patchValue({ suspected: true });
      this.isDiabetesSuspected = true;
      this.ncdScreeningService.diabetesSuspectStatus(true); // enable badge
      this.ncdScreeningService.screeningValueChanged(true);
    }
  }
  ngOnDestroy() {
    if (this.nurseMasterDataSubscription) {
      this.nurseMasterDataSubscription.unsubscribe();
    }
    if (this.screeningDataSubscription) {
      this.screeningDataSubscription.unsubscribe();
    }
    if (this.confirmedDiseasesListSubscription)
      this.confirmedDiseasesListSubscription.unsubscribe();
    this.diabetesScreeningForm.reset();
  }
}
