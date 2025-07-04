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
import { Component, OnInit, AfterViewInit, DoCheck } from '@angular/core';
import { ConfirmationService } from './../../core/services/confirmation.service';
import { Router } from '@angular/router';
import { SetLanguageComponent } from '../../core/components/set-language.component';
import { HttpServiceService } from '../../core/services/http-service.service';

@Component({
  selector: 'app-redir-fallback',
  templateUrl: './redir-fallback.component.html',
  styleUrls: ['./redir-fallback.component.css'],
})
export class RedirFallbackComponent implements OnInit, AfterViewInit, DoCheck {
  current_language_set: any;

  constructor(
    private confirmationService: ConfirmationService,
    private router: Router,
    public httpServiceService: HttpServiceService,
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
  ngAfterViewInit() {
    Promise.resolve(null).then(() => {
      this.confirmationService.alert(
        this.current_language_set !== undefined
          ? this.current_language_set.alerts.info.IssuesinConnectingtoInventory
          : this.current_language_set.alerts.info.IssuesinConnectingtoInventory,
        'error',
      );
      this.router.navigate(['/pharmacist/pharmacist-worklist']);
    });
  }
}
