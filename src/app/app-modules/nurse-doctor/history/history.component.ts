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
import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DoctorService } from '../shared/services/doctor.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-nurse-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css'],
})
export class HistoryComponent implements OnChanges, OnInit {
  @Input()
  patientHistoryForm!: FormGroup;

  @Input()
  visitCategory!: string;

  @Input()
  mode!: string;

  @Input()
  pregnancyStatus!: string;

  @Input()
  primeGravidaStatus: any;

  showGeneralOPD = false;
  attendant: any;

  constructor(
    private doctorService: DoctorService,
    private route: ActivatedRoute,
    readonly sessionstorage: SessionStorageService,
  ) {}

  ngOnInit() {
    this.attendant = this.route.snapshot.params['attendant'];
    this.doctorService.setCapturedHistoryByNurse(null);

    if (this.attendant !== 'nurse') this.generalHistory();
  }

  ngOnChanges() {
    if (this.visitCategory) {
      this.showGeneralOPD =
        this.visitCategory === 'General OPD' ||
        this.visitCategory === 'ANC' ||
        this.visitCategory === 'NCD care' ||
        this.visitCategory === 'PNC' ||
        this.visitCategory === 'COVID-19 Screening' ||
        this.visitCategory === 'NCD screening'
          ? true
          : false;
    }
  }
  generalHistory() {
    const visitID = this.sessionstorage.getItem('visitID');
    const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
    this.doctorService
      .getGeneralHistoryDetails(benRegID, visitID)
      .subscribe((historyresponse: any) => {
        if (
          historyresponse.statusCode === 200 &&
          historyresponse !== undefined
        ) {
          this.doctorService.setCapturedHistoryByNurse(historyresponse);
        }
      });
  }
}
