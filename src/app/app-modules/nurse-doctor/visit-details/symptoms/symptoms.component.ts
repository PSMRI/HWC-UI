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
  EventEmitter,
  Output,
  DoCheck,
  OnDestroy,
  OnChanges,
} from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import {
  MasterdataService,
  NurseService,
  DoctorService,
} from '../../shared/services';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-symptoms',
  templateUrl: './symptoms.component.html',
  styleUrls: ['./symptoms.component.css'],
})
export class SymptomsComponent
  implements OnChanges, OnInit, DoCheck, OnDestroy
{
  @Input()
  patientCovidForm!: FormGroup;
  symptomsList: any = [];

  @Input()
  mode!: string;

  @Output() filter: EventEmitter<any> = new EventEmitter<any>();
  symptomsArray: any = [];
  symptoms: any;
  answer1: any;
  symptomsarray!: [];
  currentLanguageSet: any;

  constructor(
    private fb: FormBuilder,
    private nurseService: NurseService,
    private doctorService: DoctorService,
    private masterdataService: MasterdataService,
    private httpServiceService: HttpServiceService,
    readonly sessionstorage: SessionStorageService,
  ) {}

  disable: any = ['false', 'false', 'false', 'false'];
  checked: boolean[] = [false, false, false, false];

  ngOnInit() {
    this.assignSelectedLanguage();
    this.sessionstorage.setItem('symptom', 'null');

    this.disable = ['false', 'false', 'false', 'false'];
    this.checked = [false, false, false, false];
    this.getMasterData();
  }
  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }
  ngOnChanges() {
    if (String(this.mode) === 'view') {
      const visitID = this.sessionstorage.getItem('visitID');
      const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
      this.getHistoryDetails(benRegID, visitID);
    }
  }
  ngOnDestroy() {
    if (this.nurseMasterDataSubscription)
      this.nurseMasterDataSubscription.unsubscribe();

    if (this.coividSymptomsHistory) this.coividSymptomsHistory.unsubscribe();
  }

  covidSymptoms: any;
  coividSymptomsHistory: any;
  getHistoryDetails(beneficiaryRegID: any, visitID: any) {
    this.coividSymptomsHistory = this.doctorService
      .getVisitComplaintDetails(beneficiaryRegID, visitID)
      .subscribe((value: any) => {
        if (
          value !== null &&
          value.statusCode === 200 &&
          value.data !== null &&
          value.data.covidDetails !== null
        ) {
          console.log('coviddata', value.data.covidDetails.symptom);
          this.covidSymptoms = value.data.covidDetails.symptom;
          this.patientCovidForm.patchValue({ symptom: this.covidSymptoms });
        }
      });
  }

  getMMUHistoryDetails(beneficiaryRegID: any, visitID: any) {
    this.coividSymptomsHistory = this.doctorService
      .getVisitComplaintDetails(beneficiaryRegID, visitID)
      .subscribe((value: any) => {
        if (
          value !== null &&
          value.statusCode === 200 &&
          value.data !== null &&
          value.data.covidDetails !== null
        ) {
          console.log('coviddata', value.data.covidDetails.symptom);
          this.covidSymptoms = value.data.covidDetails.symptom;
          this.patientCovidForm.patchValue({ symptom: this.covidSymptoms });
          this.symptomSelected();
        }
      });
  }

  symptomSelected() {
    console.log('SymptomLength' + this.symptom.length);
    if (this.symptom.length !== 0) {
      if (this.symptom.indexOf('No Symptoms') > -1) {
        this.sessionstorage.setItem('symptom', 'false');

        this.symptomsList = this.symptomsList.filter((item: any) => {
          return item === 'No Symptoms';
        });
      } else {
        this.sessionstorage.setItem('symptom', 'true'); //change

        this.symptomsList = this.symptomsList.filter((item: any) => {
          return item !== 'No Symptoms';
        });
        if (this.symptom.length === 3) {
          this.sessionstorage.setItem('allSymptom', 'true');
        } else {
          this.sessionstorage.setItem('allSymptom', 'false');
        }
      }
      this.answer1 = this.sessionstorage.getItem('symptom');
      this.masterdataService.filter(this.answer1);
    } else {
      this.symptomsList = this.symptomsArray;
      this.sessionstorage.setItem('symptom', 'null');
      this.sessionstorage.setItem('allSymptom', 'null');
      this.answer1 = this.sessionstorage.getItem('symptom');
      this.masterdataService.filter(this.answer1);
    }
  }

  masterData: any;
  nurseMasterDataSubscription: any;
  getMasterData() {
    this.nurseMasterDataSubscription =
      this.masterdataService.nurseMasterData$.subscribe((masterData) => {
        console.log(masterData);
        if (masterData && masterData.covidSymptomsMaster) {
          this.masterData = masterData;
          this.symptomsarray = this.masterData.covidSymptomsMaster;
          for (let i = 0; i < this.symptomsarray.length; i++) {
            console.log(this.symptomsarray[i]['symptoms']);
            this.symptomsList.push(this.symptomsarray[i]['symptoms']);
          }
          this.symptomsArray = this.symptomsList;

          const specialistFlagString =
            this.sessionstorage.getItem('specialistFlag');

          if (
            specialistFlagString !== null &&
            parseInt(specialistFlagString) === 100
          ) {
            const visitID = this.sessionstorage.getItem('visitID');
            const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
            this.getMMUHistoryDetails(benRegID, visitID);
          }
        }
      });
  }

  get symptom() {
    return this.patientCovidForm.controls['symptom'].value;
  }
}
