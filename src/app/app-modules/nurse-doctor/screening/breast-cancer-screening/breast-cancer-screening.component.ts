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
import { Subscription } from 'rxjs';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { environment } from 'src/environments/environment';
import { NcdScreeningService } from '../../shared/services/ncd-screening.service';

@Component({
  selector: 'app-breast-cancer-screening',
  templateUrl: './breast-cancer-screening.component.html',
  styleUrls: ['./breast-cancer-screening.component.css'],
})
export class BreastCancerScreeningComponent
  implements OnChanges, OnInit, DoCheck, OnDestroy
{
  @Input()
  breastCancerScreeningForm!: FormGroup;

  @Input()
  confirmDiseasesList: any;

  @Input()
  mode!: string;

  currentLanguageSet: any;

  breastCancerSuspected = false;

  inspectionOfBreasts: any = [];
  palpationOfBreasts: any = [];
  palpationOfLymphNodes: any = [];
  hideBreastForm = false;
  disableCheckbox = false;
  checkIsBreastCancerSuspected = false;

  @Output() breastFormStatus = new EventEmitter<boolean>();
  nurseMasterDataSubscription!: Subscription;
  nurseMasterData: any = [];
  confirmDiseaseArray: any = [];
  confirmedDiseasesListSubscription!: Subscription;
  hideRemoveFunctionalityInDoctorIfSuspected = false;
  attendant!: string;
  constructor(
    private confirmationService: ConfirmationService,
    public httpServiceService: HttpServiceService,
    private ncdScreeningService: NcdScreeningService,
    private masterdataService: MasterdataService,
    private doctorService: DoctorService,
    private route: ActivatedRoute,
  ) {}
  /**
   * Modified by JA354063
   */
  ngOnInit() {
    this.ncdScreeningService.setScreeningDataFetch(false);
    this.assignSelectedLanguage();
    this.getNurseMasterData();
    this.attendant = this.route.snapshot.params['attendant'];
    this.breastCancerSuspected = false;
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
            if (this.checkIsBreastCancerSuspected !== false)
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

  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  get inspectionBreastsId() {
    return this.breastCancerScreeningForm.controls['inspectionBreastsId'].value;
  }

  get palpationBreastsId() {
    return this.breastCancerScreeningForm.controls['palpationBreastsId'].value;
  }

  get palpationLymphNodesId() {
    return this.breastCancerScreeningForm.controls['palpationLymphNodesId']
      .value;
  }
  setConfirmedDiseasesForScreening() {
    if (this.confirmDiseaseArray.length > 0) {
      if (this.confirmDiseaseArray.includes(environment.breast)) {
        this.breastCancerScreeningForm.disable();
        this.breastCancerScreeningForm.patchValue({
          suspected: null,
          formDisable: true,
        });
        this.disableCheckbox = true;
      } else {
        this.ncdScreeningService.isBreastConfirmed = false;
        this.resetBreastForm();
        this.disableCheckbox = false;
      }
    } else {
      this.resetBreastForm();
      // On nurse initial load, checkbox should be disabled and enable the checkbox if the breast cancer is suspected.
      //  ((this.attendant === "nurse" || this.attendant === "doctor") && this.breastCancerSuspected === true) ? (this.disableCheckbox = false) : this.disableCheckbox = true;
    }
  }
  resetBreastForm() {
    this.breastCancerScreeningForm.enable();
    this.breastCancerScreeningForm.patchValue({ formDisable: null });
    this.setNameBasedOnSelectedID();
  }

  setConfirmedDiseasesForScreeningOnMark() {
    if (this.confirmDiseaseArray.length > 0) {
      if (this.confirmDiseaseArray.includes(environment.breast)) {
        this.breastCancerScreeningForm.disable();
        this.breastCancerScreeningForm.patchValue({
          suspected: null,
          formDisable: true,
        });
        this.disableCheckbox = true;
      } else {
        this.ncdScreeningService.isBreastConfirmed = false;
        this.resetBreastFormOnMark();
        this.disableCheckbox = false;
      }
    } else {
      this.resetBreastFormOnMark();
      // On nurse initial load, checkbox should be disabled and enable the checkbox if the breast cancer is suspected.
      //  ((this.attendant === "nurse" || this.attendant === "doctor") && this.breastCancerSuspected === true) ? (this.disableCheckbox = false) : this.disableCheckbox = true;
    }
  }

  resetBreastFormOnMark() {
    this.breastCancerScreeningForm.enable();
    this.breastCancerScreeningForm.patchValue({ formDisable: null });
  }

  getNurseMasterData() {
    this.nurseMasterDataSubscription =
      this.masterdataService.nurseMasterData$.subscribe((data) => {
        if (data) {
          if (data.breastCancer !== undefined && data.breastCancer !== null) {
            this.nurseMasterData = data.breastCancer;
            this.inspectionOfBreasts = this.nurseMasterData.inspectionOfBreasts;
            this.palpationOfBreasts = this.nurseMasterData.palpationOfBreasts;
            this.palpationOfLymphNodes =
              this.nurseMasterData.palpationLymphNodes;
            if (String(this.mode) === 'view') {
              this.getNcdScreeningDataForCbac();
              this.markAsUnSuspectedOnLoad(this.breastCancerSuspected);
            }
          }
        } else {
          console.log('Issue in fetching breast cancer masters');
        }
      });
  }

  getNcdScreeningDataForCbac() {
    if (
      this.doctorService.screeningDetailsResponseFromNurse !== null &&
      this.doctorService.screeningDetailsResponseFromNurse !== undefined &&
      this.doctorService.screeningDetailsResponseFromNurse.breast !== null &&
      this.doctorService.screeningDetailsResponseFromNurse.breast !== undefined
    ) {
      this.hideRemoveFunctionalityInDoctorIfSuspected = true;
      const ncdBreastData = Object.assign(
        this.doctorService.screeningDetailsResponseFromNurse.breast,
      );
      ncdBreastData.suspected === true
        ? (this.breastCancerSuspected = true)
        : (this.breastCancerSuspected = false);
      this.ncdScreeningService.breastSuspectStatus(this.breastCancerSuspected);
      this.breastCancerScreeningForm.patchValue(ncdBreastData);
      console.log(this.breastCancerScreeningForm.dirty);
    }
  }

  setNameBasedOnSelectedID() {
    if (
      this.inspectionBreastsId !== undefined &&
      this.inspectionBreastsId !== null
    ) {
      this.inspectionOfBreasts.filter((inspection: any) => {
        if (inspection.id === this.inspectionBreastsId) {
          this.breastCancerScreeningForm.controls[
            'inspectionBreasts'
          ].patchValue(inspection.name);
        }
      });
    }
    if (
      this.palpationBreastsId !== undefined &&
      this.palpationBreastsId !== null
    ) {
      this.palpationOfBreasts.filter((palpation: any) => {
        if (palpation.id === this.palpationBreastsId) {
          this.breastCancerScreeningForm.controls[
            'palpationBreasts'
          ].patchValue(palpation.name);
        }
      });
    }

    if (
      this.palpationLymphNodesId !== undefined &&
      this.palpationLymphNodesId !== null
    ) {
      this.palpationOfLymphNodes.filter((palpationLymph: any) => {
        if (palpationLymph.id === this.palpationLymphNodesId) {
          this.breastCancerScreeningForm.controls[
            'palpationLymphNodes'
          ].patchValue(palpationLymph.name);
        }
      });
    }
    this.ncdScreeningService.screeningValueChanged(true); // observable used to enable the update button.
    this.checkBreastCancerSuspect();
  }
  checkBreastCancerSuspect() {
    if (
      this.breastCancerScreeningForm.controls['inspectionBreasts'].value !==
        undefined &&
      this.breastCancerScreeningForm.controls['inspectionBreasts'].value !==
        null &&
      this.breastCancerScreeningForm.controls[
        'inspectionBreasts'
      ].value.toLowerCase() !== 'normal'
    ) {
      this.markAsSuspected();
    } else if (
      this.breastCancerScreeningForm.controls['palpationBreasts'].value !==
        undefined &&
      this.breastCancerScreeningForm.controls['palpationBreasts'].value !==
        null &&
      this.breastCancerScreeningForm.controls[
        'palpationBreasts'
      ].value.toLowerCase() !== 'normal'
    ) {
      this.markAsSuspected();
    } else if (
      this.breastCancerScreeningForm.controls['palpationLymphNodes'].value !==
        undefined &&
      this.breastCancerScreeningForm.controls['palpationLymphNodes'].value !==
        null &&
      this.breastCancerScreeningForm.controls[
        'palpationLymphNodes'
      ].value.toLowerCase() !== 'normal'
    ) {
      this.markAsSuspected();
    } else {
      this.breastCancerSuspected = false;
    }
    this.ncdScreeningService.breastSuspectStatus(this.breastCancerSuspected);
    this.breastCancerScreeningForm.patchValue({
      suspected: this.breastCancerSuspected === false ? false : true,
    });
  }
  markAsSuspected() {
    this.ncdScreeningService.isBreastConfirmed !== true
      ? (this.breastCancerSuspected = true)
      : (this.breastCancerSuspected = false);
    this.attendant === 'nurse' || this.attendant === 'doctor'
      ? (this.disableCheckbox = false)
      : null;
    this.checkIsBreastCancerSuspected = this.breastCancerSuspected;
  }
  hideBreastScreeningForm() {
    this.confirmationService
      .confirm(`warn`, this.currentLanguageSet.alerts.info.warn)
      .subscribe((result) => {
        if (result) {
          this.hideBreastForm = true;
          this.breastFormStatus.emit(false);
          this.breastCancerScreeningForm.reset();
          this.ncdScreeningService.breastSuspectStatus(false);
        } else {
          this.hideBreastForm = false;
        }
      });
  }
  markAsUnsuspected(checkedValue: any) {
    if (!checkedValue) {
      this.breastCancerScreeningForm.patchValue({ suspected: false });
      this.breastCancerSuspected = false;
      this.breastCancerScreeningForm.markAsDirty();
      this.ncdScreeningService.breastSuspectStatus(false); //remove badge
      this.ncdScreeningService.screeningValueChanged(true);
    } else {
      this.breastCancerScreeningForm.patchValue({ suspected: true });
      this.breastCancerSuspected = true;
      this.breastCancerScreeningForm.markAsDirty();
      this.ncdScreeningService.breastSuspectStatus(true); //enable badge
      this.ncdScreeningService.screeningValueChanged(true);
    }
    this.checkIsBreastCancerSuspected = checkedValue;
    console.log(this.breastCancerScreeningForm.dirty);
  }

  markAsUnSuspectedOnLoad(checkedValue: any) {
    if (!checkedValue) {
      this.breastCancerScreeningForm.patchValue({ suspected: false });
      this.breastCancerSuspected = false;
      this.ncdScreeningService.breastSuspectStatus(false); //remove badge
      this.ncdScreeningService.screeningValueChanged(true);
    } else {
      this.breastCancerScreeningForm.patchValue({ suspected: true });
      this.breastCancerSuspected = true;
      this.ncdScreeningService.breastSuspectStatus(true); //enable badge
      this.ncdScreeningService.screeningValueChanged(true);
    }
    this.checkIsBreastCancerSuspected = checkedValue;
  }

  ngOnDestroy() {
    if (this.nurseMasterDataSubscription) {
      this.nurseMasterDataSubscription.unsubscribe();
    }
    if (this.confirmedDiseasesListSubscription)
      this.confirmedDiseasesListSubscription.unsubscribe();
    this.breastCancerScreeningForm.reset();
  }
}
