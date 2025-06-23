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
import { SetLanguageComponent } from '../../core/components/set-language.component';
import { HttpServiceService } from '../../core/services/http-service.service';
import { ConfirmationService } from '../../core/services/confirmation.service';

@Component({
  selector: 'app-doctor-tm-worklist-wrapper',
  templateUrl: './doctor-tm-worklist-wrapper.component.html',
  styleUrls: ['./doctor-tm-worklist-wrapper.component.css'],
})
export class DoctorTmWorklistWrapperComponent implements OnInit, DoCheck {
  app: any;
  current_language_set: any;
  teleConsultationFlag: any;

  constructor(
    public httpServiceService: HttpServiceService,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.teleConsultationFlag =
      this.confirmationService.eSanjeevaniDoctorFlagArry;
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }
}
