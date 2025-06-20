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
import { SetLanguageComponent } from '../../core/components/set-language.component';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { HttpServiceService } from '../../core/services/http-service.service';
import { RegistrarService } from '../../registrar/shared/services/registrar.service';
import { Subscription } from 'rxjs';
import { DoctorService } from '../shared/services/doctor.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-family-planning',
  templateUrl: './family-planning.component.html',
  styleUrls: ['./family-planning.component.css'],
})
export class FamilyPlanningComponent
  implements OnChanges, OnInit, DoCheck, OnDestroy
{
  @Input()
  patientMedicalForm!: FormGroup;

  @Input()
  familyPlanningMode!: string;

  familyPlanningAndReprodForm!: FormGroup;
  IecCounsellingForm!: FormGroup;
  dispensationDetailsForm!: FormGroup;

  current_language_set: any;
  familyPlanningData: any = [];
  enableDispensationDetails = false;
  enablingDispenseSubscription!: Subscription;
  enableDispenseForm = false;
  visitReason: any;
  attendant: any;

  constructor(
    public httpServiceService: HttpServiceService,
    private doctorService: DoctorService,
    private registrarService: RegistrarService,
    private confirmationService: ConfirmationService,
    private route: ActivatedRoute,
    readonly sessionstorage: SessionStorageService,
  ) {}

  ngOnInit() {
    const familyPlaningForm = this.patientMedicalForm.get(
      'familyPlanningForm',
    ) as FormGroup;
    this.familyPlanningAndReprodForm = familyPlaningForm.get(
      'familyPlanningAndReproductiveForm',
    ) as FormGroup;
    this.IecCounsellingForm = familyPlaningForm.get(
      'IecCounsellingForm',
    ) as FormGroup;
    this.dispensationDetailsForm = familyPlaningForm.get(
      'dispensationDetailsForm',
    ) as FormGroup;
    this.assignSelectedLanguage();
    this.attendant = this.route.snapshot.params['attendant'];
    this.visitReason = this.sessionstorage.getItem('visitReason');
    this.doctorService.getBenFamilyDetailsRevisit(null);
    if (
      this.sessionstorage.getItem('visitReason') !== undefined &&
      this.sessionstorage.getItem('visitReason') !== 'undefined' &&
      this.sessionstorage.getItem('visitReason') !== null &&
      this.sessionstorage.getItem('visitReason')?.trim().toLowerCase() ===
        'follow up' &&
      this.attendant === 'nurse'
    ) {
      this.getFamilyPlanningDetailsRevisit();
    } else {
      this.getFamilyPlanningNurseFetchDetails();
    }
    this.registrarService.enableDispenseOnFertility(false);
    this.enableDispensationData();
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }

  ngOnChanges() {
    if (String(this.familyPlanningMode) === 'update') {
      const visitCategory = this.sessionstorage.getItem('visitCategory');
      this.updateFamilyPlanningFromDoctor(
        this.patientMedicalForm,
        visitCategory,
      );
    }
  }

  ngOnDestroy() {
    if (this.enablingDispenseSubscription)
      this.enablingDispenseSubscription.unsubscribe();
  }

  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }

  updateFamilyPlanningFromDoctor(medicalForm: any, visitCategory: any) {
    this.doctorService
      .updateFamilyPlanning(medicalForm, visitCategory)
      .subscribe(
        (response: any) => {
          if (response.statusCode === 200 && response.data !== null) {
            this.confirmationService.alert(response.data.response, 'success');
            this.doctorService.familyPlanningValueChanged(false);
            this.getFamilyPlanningNurseFetchDetails();
            medicalForm.markAsPristine();
          } else {
            this.confirmationService.alert(response.errorMessage, 'error');
          }
        },
        (err) => {
          this.confirmationService.alert(err, 'error');
        },
      );
  }
  getFamilyPlanningNurseFetchDetails() {
    this.doctorService.familyPlanningDetailsResponseFromNurse = null;
    if (
      String(this.familyPlanningMode) === 'view' ||
      String(this.familyPlanningMode) === 'update'
    ) {
      this.doctorService
        .getFamilyPlanningFetchDetails()
        .subscribe((res: any) => {
          if (
            res.statusCode === 200 &&
            res.data !== null &&
            res.data !== undefined
          ) {
            this.doctorService.familyPlanningDetailsResponseFromNurse =
              res.data;
            this.doctorService.setFamilyDataFetch(true);
          }
        });
    }
  }

  getFamilyPlanningDetailsRevisit() {
    this.doctorService
      .getFamilyPlanningFetchDetailsOnRevisit()
      .subscribe((res: any) => {
        if (
          res.statusCode === 200 &&
          res.data !== null &&
          res.data !== undefined
        ) {
          this.doctorService.getBenFamilyDetailsRevisit(res.data);
        }
      });
  }

  enableDispensationData() {
    this.enablingDispenseSubscription =
      this.registrarService.enablingDispense$.subscribe((response) => {
        if (response === true) {
          this.enableDispenseForm = true;
        } else {
          this.enableDispenseForm = false;
        }
      });
  }
}
