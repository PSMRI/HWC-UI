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
import { Component, OnInit, Input, Inject, DoCheck } from '@angular/core';
import { FormGroup, FormBuilder, FormArray } from '@angular/forms';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { DoctorService } from '../shared/services/doctor.service';
import { NurseService } from '../shared/services';
import { HttpServiceService } from '../../core/services/http-service.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SetLanguageComponent } from '../../core/components/set-language.component';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from '@angular/material/core';
import {
  MomentDateAdapter,
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
} from '@angular/material-moment-adapter';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-scheduler',
  templateUrl: './scheduler.component.html',
  styleUrls: ['./scheduler.component.css'],
  providers: [
    {
      provide: MAT_DATE_LOCALE,
      useValue: 'en-US', // Set the desired locale (e.g., 'en-GB' for dd/MM/yyyy)
    },
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },
    {
      provide: MAT_DATE_FORMATS,
      useValue: {
        parse: {
          dateInput: 'LL',
        },
        display: {
          dateInput: 'DD/MM/YYYY', // Set the desired display format
          monthYearLabel: 'MMM YYYY',
          dateA11yLabel: 'LL',
          monthYearA11yLabel: 'MMMM YYYY',
        },
      },
    },
  ],
})
export class SchedulerComponent implements OnInit, DoCheck {
  schedulerForm!: FormGroup;
  currentLanguageSet: any;
  ansComorbid: any;
  constructor(
    private doctorService: DoctorService,
    private nurseService: NurseService,
    public httpServiceService: HttpServiceService,
    private confirmationService: ConfirmationService,
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
    private fb: FormBuilder,
    public mdDialogRef: MatDialogRef<SchedulerComponent>,
    readonly sessionstorage: SessionStorageService,
  ) {}
  today!: Date;
  schedulerDate!: Date;
  scheduledData: any = null;
  ngOnInit() {
    this.assignSelectedLanguage();
    if (this.dialogData) {
      this.scheduledData = this.dialogData;
      console.log('this.dialogData', this.dialogData);
    } else {
      this.today = new Date();
      this.schedulerDate = new Date();
      this.schedulerForm = this.createSchedulerForm();
    }
  }
  clearScheduledSlot() {
    const modalClear = {
      clear: true,
    };

    this.sessionstorage.setItem('setComorbid', 'false');
    this.ansComorbid = this.sessionstorage.getItem('setComorbid');
    this.nurseService.filter(this.ansComorbid);
    this.mdDialogRef.close(modalClear);
  }

  closeModal() {
    this.mdDialogRef.close(false);
  }

  createSchedulerForm() {
    return this.fb.group({
      allocation: null,
      allocationDate: null,
      specialization: null,
      specialistDetails: null,
    });
  }

  checkAllocation(allocation: any) {
    this.availableSlotList = null;
    this.masterSpecialization = [];
    this.masterSpecialistDetails = [];
    const today = new Date();
    const checkdate = new Date();
    if (allocation === true) {
      this.schedulerForm.patchValue({
        allocationDate: today,
        specialization: null,
        specialistDetails: null,
      });
      this.schedulerDate = today;
      this.today = today;
      this.getMasterSpecialization();
    }
    if (allocation === false) {
      this.masterSpecialization = [];
      checkdate.setMonth(today.getMonth() + 2);
      today.setDate(today.getDate() + 1);
      this.schedulerForm.patchValue({
        allocationDate: null,
        specialization: null,
        specialistDetails: null,
      });
      this.schedulerDate = checkdate;
      this.today = today;
      this.getMasterSpecializationSchedule();
    }
  }

  get allocation() {
    return this.schedulerForm.controls['allocation'].value;
  }

  get allocationDate() {
    return this.schedulerForm.controls['allocationDate'].value;
  }

  get specialistDetails() {
    return this.schedulerForm.controls['specialistDetails'].value;
  }

  get specialization() {
    return this.schedulerForm.controls['specialization'].value;
  }

  masterSpecialization: any = [];
  getMasterSpecialization() {
    this.availableSlotList = null;
    this.masterSpecialization = [];
    this.masterSpecialistDetails = [];
    const today = new Date();
    this.allocationDate.setMinutes(today.getMinutes() + 330);
    this.schedulerForm.patchValue({
      specialization: null,
      specialistDetails: null,
    });
    this.doctorService.getMasterSpecialization().subscribe(
      (response: any) => {
        if (response && response.statusCode === 200) {
          this.masterSpecialization = response.data;
        } else {
          this.confirmationService.alert(response.errorMessage, 'error');
        }
      },
      (err) => {
        this.confirmationService.alert(err, 'error');
      },
    );
  }

  getMasterSpecializationSchedule() {
    this.availableSlotList = null;
    this.masterSpecialization = [];
    this.masterSpecialistDetails = [];
    this.schedulerForm.patchValue({
      specialization: null,
      specialistDetails: null,
    });
    this.doctorService.getMasterSpecialization().subscribe(
      (response: any) => {
        if (response && response.statusCode === 200) {
          this.masterSpecialization = response.data;
        } else {
          this.confirmationService.alert(response.errorMessage, 'error');
        }
      },
      (err) => {
        this.confirmationService.alert(err, 'error');
      },
    );
  }

  masterSpecialistDetails: any = [];
  getSpecialist() {
    this.availableSlotList = null;
    this.masterSpecialistDetails = [];
    this.schedulerForm.patchValue({
      specialistDetails: null,
    });
    const specialistReqObj = {
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      specializationID: this.specialization.specializationID,
      userID: this.sessionstorage.getItem('userID'),
    };

    this.doctorService.getSpecialist(specialistReqObj).subscribe(
      (response: any) => {
        if (response && response.statusCode === 200) {
          this.masterSpecialistDetails = response.data;
        } else {
          this.confirmationService.alert(response.errorMessage, 'error');
        }
      },
      (err) => {
        this.confirmationService.alert(err, 'error');
      },
    );
  }

  availableSlotList: any;
  getAvailableSlot(specialistDetails: any) {
    this.availableSlotList = null;
    let slotDate = new Date();
    const today = new Date();
    slotDate = this.allocationDate;

    const availableSlotReqObj = {
      userID: this.specialistDetails.userID,
      date: slotDate,
    };

    this.doctorService.getAvailableSlot(availableSlotReqObj).subscribe(
      (response: any) => {
        if (response && response.statusCode === 200) {
          this.availableSlotList = response.data.slots;
        } else {
          this.confirmationService.alert(response.errorMessage, 'error');
        }
      },
      (err) => {
        this.confirmationService.alert(err, 'error');
      },
    );
  }

  selectedSlot: any;
  selectAvailableSlot(slot: any) {
    if (slot.status.toLowerCase() === 'available') this.selectedSlot = slot;
  }

  saveScheduledSlot() {
    if (this.selectedSlot && this.specialistDetails) {
      const tmSlot = {
        walkIn: this.allocation,
        specializationID: this.specialization.specializationID,
        allocationDate: this.allocationDate,
        userID: this.specialistDetails.userID,
        fromTime: this.selectedSlot.fromTime,
        toTime: this.selectedSlot.toTime,
      };
      const modalData = Object.assign({
        schedulerForm: this.schedulerForm.value,
        tmSlot: tmSlot,
      });
      console.log('modalData', modalData);

      this.sessionstorage.setItem('setComorbid', 'true');
      this.ansComorbid = this.sessionstorage.getItem('setComorbid');
      this.nurseService.filter(this.ansComorbid);

      this.mdDialogRef.close(modalData);
    } else {
      this.mdDialogRef.close(null);
    }
  }
  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }
}
