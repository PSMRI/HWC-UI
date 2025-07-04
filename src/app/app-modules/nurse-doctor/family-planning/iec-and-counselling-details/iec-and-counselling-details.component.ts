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
import { ActivatedRoute } from '@angular/router';
import { SetLanguageComponent } from '../../../core/components/set-language.component';
import { HttpServiceService } from '../../../core/services/http-service.service';
import { Subscription } from 'rxjs';
import { DoctorService } from '../../shared/services/doctor.service';
import { MasterdataService } from '../../shared/services/masterdata.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-iec-and-counselling-details',
  templateUrl: './iec-and-counselling-details.component.html',
  styleUrls: ['./iec-and-counselling-details.component.css'],
})
export class IecAndCounsellingComponent
  implements OnChanges, OnInit, DoCheck, OnDestroy
{
  @Input()
  familyPlanningMode!: string;

  @Input()
  IecCounsellingForm!: FormGroup;

  current_language_set: any;
  disableNoneContraceptive = false;
  showAllContraceptive = false;
  selectCounselling: any = [];
  selectContraceptive: any = [];
  enableCounselledOnOther = false;
  enablecontraceptiveOptedForOther = false;
  disableNoneOption = false;
  disableAllOptions = false;
  benFamilyPlanningSubscription!: Subscription;
  attendant: any;

  constructor(
    public httpServiceService: HttpServiceService,
    private masterdataService: MasterdataService,
    private doctorService: DoctorService,
    private route: ActivatedRoute,
    readonly sessionstorage: SessionStorageService,
  ) {}

  ngOnInit() {
    this.doctorService.setFamilyDataFetch(false);
    this.attendant = this.route.snapshot.params['attendant'];
    this.getMastersOfCounselledOn();

    this.doctorService.fetchFamilyDataCheck$.subscribe((responsevalue) => {
      if (responsevalue === true) {
        this.getFamilyPlanningNurseFetchDetails();
      }
    });
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }

  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }

  get counselledOn() {
    return this.IecCounsellingForm.controls['counselledOn'].value;
  }
  get otherCounselledOn() {
    return this.IecCounsellingForm.controls['otherCounselledOn'].value;
  }
  get typeOfContraceptiveOpted() {
    return this.IecCounsellingForm.controls['typeOfContraceptiveOpted'].value;
  }
  get otherTypeOfContraceptiveOpted() {
    return this.IecCounsellingForm.controls['otherTypeOfContraceptiveOpted']
      .value;
  }

  resetOtherContraceptiveValues(selectedOption: any) {
    if (selectedOption !== undefined && selectedOption !== null) {
      if (selectedOption.length > 0) {
        if (selectedOption.includes('None')) {
          this.disableAllOptions = true;
          this.disableNoneOption = false;
        } else {
          this.disableAllOptions = false;
          this.disableNoneOption = true;
        }
      } else {
        this.disableNoneOption = false;
        this.disableAllOptions = false;
      }
      String(this.familyPlanningMode) === 'view'
        ? this.doctorService.familyPlanningValueChanged(true)
        : null;
    }
  }

  getMastersOfCounselledOn() {
    this.selectCounselling = [];
    this.masterdataService.nurseMasterData$.subscribe((res) => {
      if (res !== undefined && res !== null) {
        this.selectCounselling = res.m_FPCounselledOn;
        this.selectContraceptive = res.m_fpmethodfollowup;
        if (String(this.familyPlanningMode) === 'view') {
          this.getFamilyPlanningNurseFetchDetails();
        }
      } else {
        console.log('Error in fetching nurse master data details');
      }
    });
  }

  onValueChange() {
    String(this.familyPlanningMode) === 'view' ||
    String(this.familyPlanningMode) === 'update'
      ? this.doctorService.familyPlanningValueChanged(true)
      : null;
  }

  counselledOnOther() {
    if (
      this.counselledOn !== undefined &&
      this.counselledOn !== null &&
      this.counselledOn.includes('Other')
    ) {
      this.enableCounselledOnOther = true;
    } else {
      this.enableCounselledOnOther = false;
      this.IecCounsellingForm.controls['otherCounselledOn'].reset();
    }
    String(this.familyPlanningMode) === 'view' ||
    String(this.familyPlanningMode) === 'update'
      ? this.doctorService.familyPlanningValueChanged(true)
      : null;
  }

  typeOfContraceptiveOptedForOther() {
    if (
      this.typeOfContraceptiveOpted !== undefined &&
      this.typeOfContraceptiveOpted !== null &&
      this.typeOfContraceptiveOpted.includes('Other')
    ) {
      this.enablecontraceptiveOptedForOther = true;
    } else {
      this.enablecontraceptiveOptedForOther = false;
      this.IecCounsellingForm.controls['otherTypeOfContraceptiveOpted'].reset();
    }
    String(this.familyPlanningMode) === 'view' ||
    String(this.familyPlanningMode) === 'update'
      ? this.doctorService.familyPlanningValueChanged(true)
      : null;
  }

  ngOnChanges() {
    this.attendant = this.route.snapshot.params['attendant'];
    if (String(this.familyPlanningMode) === 'view') {
      this.getFamilyPlanningNurseFetchDetails();
    }
    if (
      this.sessionstorage.getItem('visitReason') !== undefined &&
      this.sessionstorage.getItem('visitReason') !== 'undefined' &&
      this.sessionstorage.getItem('visitReason') !== null &&
      this.sessionstorage.getItem('visitReason')?.toLowerCase() ===
        'follow up' &&
      this.attendant === 'nurse'
    ) {
      this.getFamilyPlanningFetchDetailsForRevisit();
    }
  }

  getFamilyPlanningNurseFetchDetails() {
    if (
      this.doctorService.familyPlanningDetailsResponseFromNurse !== null &&
      this.doctorService.familyPlanningDetailsResponseFromNurse !== undefined
    ) {
      const familyPlanningIECCounsellingData =
        this.doctorService.familyPlanningDetailsResponseFromNurse
          .iecAndCounsellingDetails;
      this.IecCounsellingForm.patchValue(familyPlanningIECCounsellingData);
      this.counselledOnOther();
      this.typeOfContraceptiveOptedForOther();
      this.resetOtherContraceptiveValues(
        familyPlanningIECCounsellingData.typeOfContraceptiveOpted,
      );
    }
  }

  getFamilyPlanningFetchDetailsForRevisit() {
    this.benFamilyPlanningSubscription =
      this.doctorService.benFamilyPlanningDetails$.subscribe((response) => {
        if (
          response !== undefined &&
          response !== null &&
          response.iecAndCounsellingDetails !== undefined &&
          response.iecAndCounsellingDetails !== null
        ) {
          const familyPlanningIECCounsellingData =
            response.iecAndCounsellingDetails;
          this.IecCounsellingForm.patchValue(familyPlanningIECCounsellingData);
          this.counselledOnOther();
          this.typeOfContraceptiveOptedForOther();
          this.resetOtherContraceptiveValues(
            familyPlanningIECCounsellingData.typeOfContraceptiveOpted,
          );
          this.IecCounsellingForm.patchValue({ id: null });
        } else {
          console.log('Revisit Err', response);
        }
      });
  }

  ngOnDestroy() {
    this.IecCounsellingForm.reset();
    if (this.benFamilyPlanningSubscription)
      this.benFamilyPlanningSubscription.unsubscribe();
  }
}
