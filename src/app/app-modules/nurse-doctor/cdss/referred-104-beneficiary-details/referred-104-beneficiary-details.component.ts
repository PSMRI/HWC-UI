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
import { Component, DoCheck, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import * as moment from 'moment';
import {
  BeneficiaryDetailsService,
  ConfirmationService,
} from 'src/app/app-modules/core/services';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { RegistrarService } from 'src/app/app-modules/registrar/shared/services/registrar.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-referred-104-beneficiary-details',
  templateUrl: './referred-104-beneficiary-details.component.html',
  styleUrls: ['./referred-104-beneficiary-details.component.css'],
})
export class Referred104BeneficiaryDetailsComponent implements OnInit, DoCheck {
  beneficiary: any;
  today: any;
  beneficiaryDetailsSubscription!: Subscription;
  familyIdStatusStatusSubscription!: Subscription;
  current_language_set: any;
  benDetails: any;
  healthIDArray: any = [];
  healthIDValue = '';
  beneficiaryId: any;
  benFlowStatus!: boolean;
  getBenFamilyData!: boolean;
  benFamilySubscription!: Subscription;
  benFamilyId: any;
  beneficiaryName: any;
  firstName: any;
  lastName: any;
  regDate!: string;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    public httpServiceService: HttpServiceService,
    private registrarService: RegistrarService,
    private confirmationService: ConfirmationService,
    readonly sessionstorage: SessionStorageService,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.today = new Date();
    this.getBeneficiaryDetails();
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }

  getBeneficiaryDetails() {
    const reqObj = {
      beneficiaryRegID: null,
      beneficiaryName: null,
      beneficiaryID: this.sessionstorage.getItem('beneficiaryID'),
      phoneNo: null,
      HealthID: null,
      HealthIDNumber: null,
      familyId: null,
      identity: null,
    };
    this.registrarService.identityQuickSearch(reqObj).subscribe((res: any) => {
      if (res) {
        this.beneficiary = res[0];
        console.log(this.beneficiary);
        console.log(this.beneficiary.firstName);
        this.beneficiaryName =
          this.beneficiary.firstName +
          (this.beneficiary.lastName !== undefined
            ? ' ' + this.beneficiary.lastName
            : '');
        this.regDate = moment
          .utc(this.beneficiary.createdDate)
          .format('DD-MM-YYYY hh:mm A');
        console.log(this.beneficiaryName);
        console.log(this.regDate);
      }
    });
    const benFlowID: any = this.sessionstorage.getItem('beneficiaryRegID');

    this.beneficiaryDetailsService
      .getBeneficiaryImage(benFlowID)
      .subscribe((data: any) => {
        if (data && data.benImage) {
          this.beneficiary.benImage = data.benImage;
        }
      });
  }
}
