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
import { DoctorService, MasterdataService } from '../../shared/services';
import { NcdScreeningService } from '../../shared/services/ncd-screening.service';
import { Subscription } from 'rxjs';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { environment } from 'src/environments/environment';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';

@Component({
  selector: 'app-cervical-cancer-screening',
  templateUrl: './cervical-cancer-screening.component.html',
  styleUrls: ['./cervical-cancer-screening.component.css'],
})
export class CervicalCancerScreeningComponent
  implements OnChanges, OnInit, DoCheck, OnDestroy
{
  @Input()
  cervicalScreeningForm!: FormGroup;

  @Input()
  confirmDiseasesList: any;

  @Input()
  mode!: string;

  currentLanguageSet: any;

  visualExaminationSuspected = false;

  visualExaminations: any = [];
  hideCervicalForm = false;
  nurseMasterDataSubscription!: Subscription;
  nurseMasterData: any = [];

  @Output() cervicalFormStatus = new EventEmitter<boolean>();
  confirmDiseaseArray: any = [];
  confirmedDiseasesListSubscription!: Subscription;
  hideRemoveFunctionalityInDoctorIfSuspected = false;
  disableCheckbox = false;
  attendant!: string;
  checkIsCervicalSuspected = false;
  /**
   * Modified by JA354063
   */
  constructor(
    private confirmationService: ConfirmationService,
    public httpServiceService: HttpServiceService,
    private ncdScreeningService: NcdScreeningService,
    private masterdataService: MasterdataService,
    private doctorService: DoctorService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.ncdScreeningService.setScreeningDataFetch(false);
    this.assignSelectedLanguage();
    this.getNurseMasterData();
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
            if (this.checkIsCervicalSuspected !== false)
              this.setConfirmedDiseasesForScreening();
            else {
              this.setConfirmedDiseasesForScreeningOnMark();
            }
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
      // this.getNcdScreeningDataForCbac();
    }
  }

  setConfirmedDiseasesForScreening() {
    if (this.confirmDiseaseArray.length > 0) {
      if (this.confirmDiseaseArray.includes(environment.cervical)) {
        this.cervicalScreeningForm.disable();
        this.cervicalScreeningForm.patchValue({
          suspected: null,
          formDisable: true,
        });
        this.disableCheckbox = true;
      } else {
        this.ncdScreeningService.isCervicalConfirmed = false;
        this.resetCervicalForm();
        this.disableCheckbox = false;
      }
    } else {
      this.resetCervicalForm();
    }
  }
  resetCervicalForm() {
    this.cervicalScreeningForm.enable();
    this.cervicalScreeningForm.patchValue({ formDisable: null });
    this.checkCervicalCancerSuspect();
  }

  setConfirmedDiseasesForScreeningOnMark() {
    if (this.confirmDiseaseArray.length > 0) {
      if (this.confirmDiseaseArray.includes(environment.cervical)) {
        this.cervicalScreeningForm.disable();
        this.cervicalScreeningForm.patchValue({
          suspected: null,
          formDisable: true,
        });
        this.disableCheckbox = true;
      } else {
        this.ncdScreeningService.isCervicalConfirmed = false;
        this.resetCervicalFormOnMark();
        this.disableCheckbox = false;
      }
    } else {
      this.resetCervicalFormOnMark();
    }
  }
  resetCervicalFormOnMark() {
    this.cervicalScreeningForm.enable();
    this.cervicalScreeningForm.patchValue({ formDisable: null });
  }

  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }
  get visualExaminationId() {
    return this.cervicalScreeningForm.controls['visualExaminationId'].value;
  }
  getNurseMasterData() {
    this.nurseMasterDataSubscription =
      this.masterdataService.nurseMasterData$.subscribe((data) => {
        if (data) {
          if (
            data.cervicalCancer !== undefined &&
            data.cervicalCancer !== null
          ) {
            this.nurseMasterData = data.cervicalCancer;
            this.visualExaminations = this.nurseMasterData.visualExamination;
            if (String(this.mode) === 'view') {
              this.getNcdScreeningDataForCbac();
              this.markAsUnSuspectedOnLoad(this.visualExaminationSuspected);
            }
          } else {
            console.log('Issue in fetching cervical cancer masters');
          }
        }
      });
  }
  getNcdScreeningDataForCbac() {
    if (
      this.doctorService.screeningDetailsResponseFromNurse !== null &&
      this.doctorService.screeningDetailsResponseFromNurse !== undefined &&
      this.doctorService.screeningDetailsResponseFromNurse.cervical !== null &&
      this.doctorService.screeningDetailsResponseFromNurse.cervical !==
        undefined
    ) {
      this.hideRemoveFunctionalityInDoctorIfSuspected = true;
      const ncdCervicalData = Object.assign(
        this.doctorService.screeningDetailsResponseFromNurse.cervical,
      );
      ncdCervicalData.suspected === true
        ? (this.visualExaminationSuspected = true)
        : (this.visualExaminationSuspected = false);
      this.ncdScreeningService.cervicalSuspectStatus(
        this.visualExaminationSuspected,
      );
      this.cervicalScreeningForm.patchValue(ncdCervicalData);
    }
  }
  checkCervicalCancerSuspect() {
    if (
      this.visualExaminationId !== undefined &&
      this.visualExaminationId !== null
    ) {
      this.visualExaminations.filter((cervical: any) => {
        if (cervical.id === this.visualExaminationId) {
          this.cervicalScreeningForm.controls[
            'visualExaminationVIA'
          ].patchValue(cervical.name);
        }
      });
      this.ncdScreeningService.screeningValueChanged(true); // observable used to enable the update button.
      if (
        this.cervicalScreeningForm.controls['visualExaminationVIA'].value !==
          undefined &&
        this.cervicalScreeningForm.controls['visualExaminationVIA'].value !==
          null &&
        this.cervicalScreeningForm.controls[
          'visualExaminationVIA'
        ].value.toLowerCase() !== 'negative'
      ) {
        this.ncdScreeningService.isCervicalConfirmed !== true
          ? (this.visualExaminationSuspected = true)
          : (this.visualExaminationSuspected = false);
        this.attendant === 'nurse' || this.attendant === 'doctor'
          ? (this.disableCheckbox = false)
          : null;
        this.checkIsCervicalSuspected = this.visualExaminationSuspected;
      } else {
        this.visualExaminationSuspected = false;
      }
    }
    this.ncdScreeningService.cervicalSuspectStatus(
      this.visualExaminationSuspected,
    );
    this.cervicalScreeningForm.patchValue({
      suspected: this.visualExaminationSuspected === false ? false : true,
    });
  }

  hideCervicalScreeningForm() {
    this.confirmationService
      .confirm(`warn`, this.currentLanguageSet.alerts.info.warn)
      .subscribe((result) => {
        if (result) {
          this.hideCervicalForm = true;
          this.cervicalFormStatus.emit(false);
          this.cervicalScreeningForm.reset();
          this.ncdScreeningService.cervicalSuspectStatus(false);
          if (String(this.mode) === 'view' || String(this.mode) === 'update')
            this.ncdScreeningService.screeningValueChanged(true);
        } else {
          this.hideCervicalForm = false;
        }
      });
  }
  markAsUnsuspected(checkedValue: any) {
    if (!checkedValue) {
      this.cervicalScreeningForm.patchValue({ suspected: false });
      this.visualExaminationSuspected = false;
      this.cervicalScreeningForm.markAsDirty();
      this.ncdScreeningService.cervicalSuspectStatus(false); // remove badge
      this.ncdScreeningService.screeningValueChanged(true);
    } else {
      this.cervicalScreeningForm.patchValue({ suspected: true });
      this.visualExaminationSuspected = true;
      this.cervicalScreeningForm.markAsDirty();
      this.ncdScreeningService.cervicalSuspectStatus(true); // enable badge
      this.ncdScreeningService.screeningValueChanged(true);
    }
    this.checkIsCervicalSuspected = checkedValue;
  }

  markAsUnSuspectedOnLoad(checkedValue: any) {
    if (!checkedValue) {
      this.cervicalScreeningForm.patchValue({ suspected: false });
      this.visualExaminationSuspected = false;
      this.ncdScreeningService.cervicalSuspectStatus(false); // remove badge
      this.ncdScreeningService.screeningValueChanged(true);
    } else {
      this.cervicalScreeningForm.patchValue({ suspected: true });
      this.visualExaminationSuspected = true;
      this.ncdScreeningService.cervicalSuspectStatus(true); // enable badge
      this.ncdScreeningService.screeningValueChanged(true);
    }
    this.checkIsCervicalSuspected = checkedValue;
  }

  ngOnDestroy() {
    if (this.nurseMasterDataSubscription) {
      this.nurseMasterDataSubscription.unsubscribe();
    }
    if (this.confirmedDiseasesListSubscription)
      this.confirmedDiseasesListSubscription.unsubscribe();
    this.cervicalScreeningForm.reset();
  }
}
