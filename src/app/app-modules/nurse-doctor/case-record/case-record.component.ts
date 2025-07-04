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
import { Component, OnInit, Input, OnDestroy } from '@angular/core';

import { FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DoctorService } from '../shared/services/doctor.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-case-record',
  templateUrl: './case-record.component.html',
  styleUrls: ['./case-record.component.css'],
})
export class CaseRecordComponent implements OnInit, OnDestroy {
  @Input()
  patientCaseRecordForm!: FormGroup;

  @Input()
  provideCounselling!: FormGroup;

  @Input()
  visitCategory!: string;

  @Input()
  visitReason!: string;

  @Input()
  caseRecordMode!: string;

  @Input()
  findings: any;

  @Input()
  currentVitals: any;

  @Input()
  pregnancyStatus: any;
  attendant: any;

  showGeneralOPD = false;

  constructor(
    private route: ActivatedRoute,
    private doctorService: DoctorService,
    readonly sessionstorage: SessionStorageService,
  ) {}

  ngOnInit() {
    if (this.visitCategory) {
      this.showGeneralOPD =
        this.visitCategory === 'General OPD' ||
        this.visitCategory === 'ANC' ||
        this.visitCategory === 'NCD care' ||
        this.visitCategory === 'PNC' ||
        this.visitCategory === 'COVID-19 Screening' ||
        this.visitCategory === 'NCD screening' ||
        this.visitCategory === 'FP & Contraceptive Services' ||
        this.visitCategory.toLowerCase() ===
          'neonatal and infant health care services' ||
        this.visitCategory.toLowerCase() ===
          'childhood & adolescent healthcare services'
          ? true
          : false;
    }
    this.attendant = this.route.snapshot.params['attendant'];
    this.doctorService.setCapturedCaserecordDeatilsByDoctor(null);

    if (this.attendant !== 'nurse') this.fetchCaseRecordDetails();
  }

  ngOnDestroy() {
    this.doctorService.setCapturedCaserecordDeatilsByDoctor(null);
  }
  fetchCaseRecordDetails() {
    const visitID = this.sessionstorage.getItem('visitID');
    const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
    this.doctorService
      .getCaseRecordAndReferDetails(benRegID, visitID, this.visitCategory)
      .subscribe((caserecordResponse: any) => {
        if (
          caserecordResponse &&
          caserecordResponse.statusCode === 200 &&
          caserecordResponse.data !== undefined
        ) {
          this.doctorService.setCapturedCaserecordDeatilsByDoctor(
            caserecordResponse,
          );
        }
      });
  }
}
