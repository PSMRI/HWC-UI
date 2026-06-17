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
import { Component, OnInit, Input, DoCheck } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { AmritTrackingService } from 'Common-UI/src/tracking';

@Component({
  selector: 'app-nurse-genito-urinary-system',
  templateUrl: './genito-urinary-system.component.html',
  styleUrls: ['./genito-urinary-system.component.css'],
})
export class GenitoUrinarySystemComponent implements OnInit, DoCheck {
  @Input()
  genitoUrinarySystemForm!: FormGroup;
  current_language_set: any;

  constructor(
    public httpServiceService: HttpServiceService,
    private trackingService: AmritTrackingService,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }

  trackFieldInteraction(fieldName: string) {
    this.trackingService.trackFieldInteraction(
      fieldName,
      'Genitourinary System',
    );
  }
}
