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
import { ConfirmationService } from './../../core/services/confirmation.service';
import { HttpServiceService } from '../../core/services/http-service.service';
import { SetLanguageComponent } from '../../core/components/set-language.component';

@Component({
  selector: 'app-redir-in',
  templateUrl: './redir-in.component.html',
  styleUrls: ['./redir-in.component.css'],
})
export class RedirInComponent implements OnInit, DoCheck {
  current_language_set: any;
  lang: any;
  language_file_path: any = './assets/';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private confirmationService: ConfirmationService,
    private httpServiceService: HttpServiceService,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.getresponse();
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }

  getresponse() {
    let resolve: any;
    let language: any;
    this.route.queryParams.subscribe((params) => {
      resolve =
        params['resolve'] === 'undefined' ? undefined : params['resolve'];
      language =
        params['currentLanguage'] === 'undefined'
          ? 'English'
          : params['currentLanguage'];
    });
    sessionStorage.setItem('setLanguage', language);
    this.lang = sessionStorage.getItem('setLanguage');

    if (this.lang !== undefined) {
      this.httpServiceService

        .getLanguage(this.language_file_path + this.lang + '.json')

        .subscribe(
          (response: any) => {
            if (response) {
              this.current_language_set = response[this.lang];
              console.log('resolve', resolve);

              if (resolve) {
                this.confirmationService.alert(
                  this.current_language_set.itemDispensed,
                  'info',
                );
              }
              this.router.navigate(['/pharmacist/pharmacist-worklist']);
            } else {
              console.log(
                this.current_language_set.alerts.info.comingUpWithThisLang +
                  ' ' +
                  this.lang,
              );
            }
          },
          (error) => {
            console.log(
              this.current_language_set.alerts.info.comingUpWithThisLang +
                ' ' +
                this.lang,
            );
          },
        );
    } else {
      this.httpServiceService.currentLangugae$.subscribe((response) => {
        this.current_language_set = response;
        console.log('resolve', resolve);
        if (resolve) {
          this.confirmationService.alert(
            this.current_language_set.itemDispensed,
            'info',
          );
        }
        this.router.navigate(['/pharmacist/pharmacist-worklist']);
      });
    }
  }
  routeToDesignation(designation: any) {
    switch (designation) {
      case 'Registrar':
        this.router.navigate(['/registrar/registration']);
        break;
      case 'Nurse':
        this.router.navigate(['/nurse-doctor/nurse-worklist']);
        break;
      case 'Doctor':
        this.router.navigate(['/nurse-doctor/doctor-worklist']);
        break;
      case 'Lab Technician':
        this.router.navigate(['/lab']);
        break;
      case 'Pharmacist':
        this.router.navigate(['/pharmacist']);
        break;
      case 'Radiologist':
        this.router.navigate(['/nurse-doctor/radiologist-worklist']);
        break;
      case 'Oncologist':
        this.router.navigate(['/nurse-doctor/oncologist-worklist']);
        break;
      default:
    }
  }
}
