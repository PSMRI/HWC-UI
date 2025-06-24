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
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-oral-cancer-screening',
  templateUrl: './oral-cancer-screening.component.html',
  styleUrls: ['./oral-cancer-screening.component.css'],
})
export class OralCancerScreeningComponent
  implements OnChanges, OnInit, DoCheck, OnDestroy
{
  @Input()
  oralCancerForm!: FormGroup;

  @Input()
  confirmDiseasesList: any;

  @Input()
  mode!: string;

  currentLanguageSet: any;

  oralCavityFindings: any = [];
  mouthOpeningFindings: any = [];
  palpationOralCavityFindings: any = [];
  temporomandibularRtLt: any = [];
  cervicalLymphNodesFindings: any = [];
  nurseMasterData: any = [];

  suspectOralCavity = false;
  hideScreeningForm = false;
  hideOralForm = false;

  nurseMasterDataSubscription!: Subscription;

  @Output() oralFormStatus = new EventEmitter<boolean>();

  selectedOralcavity!: string;
  selectedMouthOpening!: string;
  selectedPalpation!: string;
  selectedTempRt!: string;
  selectedtempLt!: string;
  selectedcervicalLymp!: string;
  confirmDiseaseArray: any = [];
  hideRemoveFunctionalityInDoctorIfSuspected = false;
  confirmedDiseasesListSubscription!: Subscription;
  disableCheckbox = false;
  attendant!: string;
  checkIsOralCancerSuspected = false;
  constructor(
    private masterdataService: MasterdataService,
    public httpServiceService: HttpServiceService,
    private confirmationService: ConfirmationService,
    private ncdScreeningService: NcdScreeningService,
    private doctorService: DoctorService,
    private route: ActivatedRoute,
  ) {}
  /**
   * Created by JA354063
   */
  ngOnInit() {
    this.ncdScreeningService.setScreeningDataFetch(false);
    this.assignSelectedLanguage();
    this.getNurseMasterData();
    this.attendant = this.route.snapshot.params['attendant'];
    this.confirmDiseaseArray = this.confirmDiseasesList;
    this.setConfirmedDiseasesForScreening();
    this.ncdScreeningService.clearConfirmedDiseasesForScreening();
    // fetch Confirmed diseases array
    this.confirmedDiseasesListSubscription =
      this.ncdScreeningService.confirmedDiseasesListCheck$.subscribe(
        (response: any) => {
          if (
            response !== undefined &&
            response !== null &&
            response.length >= 0
          ) {
            this.confirmDiseaseArray = response;
            if (this.checkIsOralCancerSuspected !== false)
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
  get oralCavityFindingId() {
    return this.oralCancerForm.controls['oralCavityFindingId'].value;
  }
  get mouthOpeningId() {
    return this.oralCancerForm.controls['mouthOpeningId'].value;
  }
  get palpationofOralCavityId() {
    return this.oralCancerForm.controls['palpationofOralCavityId'].value;
  }
  get temporomandibularJointRightId() {
    return this.oralCancerForm.controls['temporomandibularJointRightId'].value;
  }
  get temporomandibularJointLeftId() {
    return this.oralCancerForm.controls['temporomandibularJointLeftId'].value;
  }
  get cervicalLymphnodesId() {
    return this.oralCancerForm.controls['cervicalLymphnodesId'].value;
  }
  setConfirmedDiseasesForScreening() {
    if (this.confirmDiseaseArray.length > 0) {
      if (this.confirmDiseaseArray.includes(environment.oral)) {
        this.oralCancerForm.disable();
        this.oralCancerForm.patchValue({ suspected: null, formDisable: true });
        this.disableCheckbox = true;
      } else {
        this.ncdScreeningService.isOralConfirmed = false;
        this.resetOralForm();
        this.disableCheckbox = false;
      }
    } else {
      this.resetOralForm();
    }
  }

  setConfirmedDiseasesForScreeningOnMark() {
    if (this.confirmDiseaseArray.length > 0) {
      if (this.confirmDiseaseArray.includes(environment.oral)) {
        this.oralCancerForm.disable();
        this.oralCancerForm.patchValue({ suspected: null, formDisable: true });
        this.disableCheckbox = true;
      } else {
        this.ncdScreeningService.isOralConfirmed = false;
        this.resetOralFormOnMark();
        this.disableCheckbox = false;
      }
    } else {
      this.resetOralFormOnMark();
    }
  }

  resetOralFormOnMark() {
    this.oralCancerForm.enable();
    this.oralCancerForm.patchValue({ formDisable: null });
  }

  resetOralForm() {
    this.oralCancerForm.enable();
    this.setNameBasedOnSelectedID();
    this.oralCancerForm.patchValue({ formDisable: null });
  }
  getNurseMasterData() {
    this.nurseMasterDataSubscription =
      this.masterdataService.nurseMasterData$.subscribe((data) => {
        if (data) {
          if (data.oralCancer !== undefined && data.oralCancer !== null) {
            this.nurseMasterData = data.oralCancer;
            this.oralCavityFindings = this.nurseMasterData.oralCavity;
            this.mouthOpeningFindings = this.nurseMasterData.mouthOpening;
            this.palpationOralCavityFindings =
              this.nurseMasterData.palpationOralCavity;
            this.temporomandibularRtLt =
              this.nurseMasterData.temporomandibularJoin;
            this.cervicalLymphNodesFindings =
              this.nurseMasterData.cervicalLymphNode;
            if (String(this.mode) === 'view') {
              this.getNcdScreeningDataForCbac();
              this.markAsUnSuspectedOnLoad(this.suspectOralCavity);
            }
          } else {
            console.log('Issue in fetching screening condition');
          }
        }
      });
  }

  getNcdScreeningDataForCbac() {
    if (
      this.doctorService.screeningDetailsResponseFromNurse !== null &&
      this.doctorService.screeningDetailsResponseFromNurse !== undefined &&
      this.doctorService.screeningDetailsResponseFromNurse.oral !== null &&
      this.doctorService.screeningDetailsResponseFromNurse.oral !== undefined
    ) {
      this.hideRemoveFunctionalityInDoctorIfSuspected = true;
      const ncdOralData = Object.assign(
        this.doctorService.screeningDetailsResponseFromNurse.oral,
      );
      if (ncdOralData !== undefined && ncdOralData !== null) {
        ncdOralData.suspected === true
          ? (this.suspectOralCavity = true)
          : (this.suspectOralCavity = false);
        this.ncdScreeningService.oralSuspectStatus(this.suspectOralCavity);
        this.oralCancerForm.patchValue(ncdOralData);
      }
    }
  }

  setNameBasedOnSelectedID() {
    if (
      this.oralCavityFindingId !== undefined &&
      this.oralCavityFindingId !== null
    ) {
      this.oralCavityFindings.filter((oralcavity: any) => {
        if (oralcavity.id === this.oralCavityFindingId) {
          this.oralCancerForm.controls['oralCavityFinding'].patchValue(
            oralcavity.name,
          );
        }
      });
    }
    if (this.mouthOpeningId !== undefined && this.mouthOpeningId !== null) {
      this.mouthOpeningFindings.filter((openMouth: any) => {
        if (openMouth.id === this.mouthOpeningId) {
          this.oralCancerForm.controls['mouthOpening'].patchValue(
            openMouth.name,
          );
        }
      });
    }
    if (
      this.palpationofOralCavityId !== undefined &&
      this.palpationofOralCavityId !== null
    ) {
      this.palpationOralCavityFindings.filter((palpationOralcavity: any) => {
        if (palpationOralcavity.id === this.palpationofOralCavityId) {
          this.oralCancerForm.controls['palpationofOralCavity'].patchValue(
            palpationOralcavity.name,
          );
        }
      });
    }
    if (
      this.temporomandibularJointRightId !== undefined &&
      this.temporomandibularJointRightId !== null
    ) {
      this.temporomandibularRtLt.filter((tempRt: any) => {
        if (tempRt.id === this.temporomandibularJointRightId) {
          this.oralCancerForm.controls[
            'temporomandibularJointRight'
          ].patchValue(tempRt.name);
        }
      });
    }
    if (
      this.temporomandibularJointLeftId !== undefined &&
      this.temporomandibularJointLeftId !== null
    ) {
      this.temporomandibularRtLt.filter((tempLt: any) => {
        if (tempLt.id === this.temporomandibularJointLeftId) {
          this.oralCancerForm.controls['temporomandibularJointLeft'].patchValue(
            tempLt.name,
          );
        }
      });
    }
    if (
      this.cervicalLymphnodesId !== undefined &&
      this.cervicalLymphnodesId !== null
    ) {
      this.cervicalLymphNodesFindings.filter((cervicalLymph: any) => {
        if (cervicalLymph.id === this.cervicalLymphnodesId) {
          this.oralCancerForm.controls['cervicalLymphnodes'].patchValue(
            cervicalLymph.name,
          );
        }
      });
    }
    this.setSelectedNames();
    this.checkForOralSuspect();
  }

  //set selected field names to validate whether oral is suspect or not
  setSelectedNames() {
    this.selectedOralcavity =
      this.oralCancerForm.controls['oralCavityFinding'].value;
    this.selectedMouthOpening =
      this.oralCancerForm.controls['mouthOpening'].value;
    this.selectedPalpation =
      this.oralCancerForm.controls['palpationofOralCavity'].value;
    this.selectedTempRt =
      this.oralCancerForm.controls['temporomandibularJointRight'].value;
    this.selectedtempLt =
      this.oralCancerForm.controls['temporomandibularJointLeft'].value;
    this.selectedcervicalLymp =
      this.oralCancerForm.controls['cervicalLymphnodes'].value;
    this.ncdScreeningService.screeningValueChanged(true); // observable used to enable the update button.
  }
  checkForOralSuspect() {
    if (
      this.selectedOralcavity !== undefined &&
      this.selectedOralcavity !== null &&
      this.selectedOralcavity.toLowerCase() !== 'normal'
    ) {
      this.makeOralCancerAsSuspected();
    } else if (
      this.selectedMouthOpening !== undefined &&
      this.selectedMouthOpening !== null &&
      this.selectedMouthOpening.toLowerCase() !== 'normal'
    ) {
      this.makeOralCancerAsSuspected();
    } else if (
      this.selectedPalpation !== undefined &&
      this.selectedPalpation !== null &&
      this.selectedPalpation.toLowerCase() !== 'normal'
    ) {
      this.makeOralCancerAsSuspected();
    } else if (
      this.selectedTempRt !== undefined &&
      this.selectedTempRt !== null &&
      this.selectedTempRt.toLowerCase() !== 'normal'
    ) {
      this.makeOralCancerAsSuspected();
    } else if (
      this.selectedtempLt !== undefined &&
      this.selectedtempLt !== null &&
      this.selectedtempLt.toLowerCase() !== 'normal'
    ) {
      this.makeOralCancerAsSuspected();
    } else if (
      this.selectedcervicalLymp !== undefined &&
      this.selectedcervicalLymp !== null &&
      this.selectedcervicalLymp.toLowerCase() !== 'normal'
    ) {
      this.makeOralCancerAsSuspected();
    } else {
      this.suspectOralCavity = false;
    }
    this.ncdScreeningService.oralSuspectStatus(this.suspectOralCavity);
    this.oralCancerForm.patchValue({
      suspected: this.suspectOralCavity === false ? false : true,
    });
  }
  makeOralCancerAsSuspected() {
    this.ncdScreeningService.isOralConfirmed !== true
      ? (this.suspectOralCavity = true)
      : (this.suspectOralCavity = false);
    this.attendant === 'nurse' || this.attendant === 'doctor'
      ? (this.disableCheckbox = false)
      : null;
    this.checkIsOralCancerSuspected = this.suspectOralCavity;
  }
  hideOralScreeningForm() {
    this.confirmationService
      .confirm(`warn`, this.currentLanguageSet.alerts.info.warn)
      .subscribe((result) => {
        if (result) {
          this.hideOralForm = true;
          this.oralFormStatus.emit(false);
          this.oralCancerForm.reset();
          this.ncdScreeningService.oralSuspectStatus(false);
          if (String(this.mode) === 'view' || String(this.mode) === 'update')
            this.ncdScreeningService.screeningValueChanged(true);
        } else {
          this.hideOralForm = false;
        }
      });
  }
  markAsUnsuspected(checkedValue: any) {
    if (!checkedValue) {
      this.oralCancerForm.patchValue({ suspected: false });
      this.suspectOralCavity = false;
      this.oralCancerForm.markAsDirty();
      this.ncdScreeningService.oralSuspectStatus(false); //remove badge
      this.ncdScreeningService.screeningValueChanged(true); // observable used to enable the update button.
    } else {
      this.oralCancerForm.patchValue({ suspected: true });
      this.suspectOralCavity = true;
      this.oralCancerForm.markAsDirty();
      this.ncdScreeningService.oralSuspectStatus(true); //enable badge
      this.ncdScreeningService.screeningValueChanged(true);
    }
    this.checkIsOralCancerSuspected = checkedValue;
  }

  markAsUnSuspectedOnLoad(checkedValue: any) {
    if (!checkedValue) {
      this.oralCancerForm.patchValue({ suspected: false });
      this.suspectOralCavity = false;
      this.ncdScreeningService.oralSuspectStatus(false); //remove badge
      this.ncdScreeningService.screeningValueChanged(true); // observable used to enable the update button.
    } else {
      this.oralCancerForm.patchValue({ suspected: true });
      this.suspectOralCavity = true;
      this.ncdScreeningService.oralSuspectStatus(true); //enable badge
      this.ncdScreeningService.screeningValueChanged(true);
    }
    this.checkIsOralCancerSuspected = checkedValue;
  }

  ngOnDestroy() {
    if (this.nurseMasterDataSubscription) {
      this.nurseMasterDataSubscription.unsubscribe();
    }
    if (this.confirmedDiseasesListSubscription)
      this.confirmedDiseasesListSubscription.unsubscribe();
    this.oralCancerForm.reset();
  }
}
