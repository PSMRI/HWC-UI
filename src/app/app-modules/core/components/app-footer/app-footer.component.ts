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
import { Component, OnInit, DoCheck, Inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { SpecialistLoginComponent } from './../specialist-login/specialist-login.component';
import { SetLanguageComponent } from '../set-language.component';
import { HttpServiceService } from '../../services/http-service.service';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
@Component({
  selector: 'app-footer',
  templateUrl: './app-footer.component.html',
  styleUrls: ['./app-footer.component.css'],
})
export class AppFooterComponent implements OnInit, DoCheck {
  status = false;
  isSpecialist = false;
  currentLanguageSet: any;
  constructor(
    private activatedRoute: ActivatedRoute,
    private snackBar: MatSnackBar,
    public httpServiceService: HttpServiceService,
  ) {}

  year: any;
  today: any;
  ngOnInit() {
    this.assignSelectedLanguage();
    this.today = new Date();
    this.year = this.today.getFullYear();
    console.log('inside footer', this.year);
    setInterval(() => {
      this.status = navigator.onLine;
    }, 1000);
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  openSnackBar() {
    const snackBarRef: MatSnackBarRef<SpecialistLoginComponent> =
      this.snackBar.openFromComponent(SpecialistLoginComponent, {
        horizontalPosition: 'right',
        data: {
          message: 'string',
          action: 'Save',
        },
      });
    snackBarRef.afterDismissed().subscribe(() => {
      //console.log('locsl', JSON.parse(localStorage.getItem('swymedLogin')));
    });
  }
}
