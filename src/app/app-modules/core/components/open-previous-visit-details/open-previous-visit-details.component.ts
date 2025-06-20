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
import { Component, OnInit, ViewChild } from '@angular/core';
import { ConfirmationService } from '../../services/confirmation.service';
import { HttpServiceService } from '../../services/http-service.service';
import { SetLanguageComponent } from '../set-language.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { DoctorService } from 'src/app/app-modules/nurse-doctor/shared/services';

@Component({
  selector: 'app-open-previous-visit-details',
  templateUrl: './open-previous-visit-details.component.html',
  styleUrls: ['./open-previous-visit-details.component.css'],
})
export class OpenPreviousVisitDetailsComponent implements OnInit {
  currentLanguageSet: any;
  previousVisitData: any = [];
  previousHistoryRowsPerPage = 2;
  previousHistoryActivePage = 1;
  filteredHistory: any = [];

  constructor(
    public httpServiceService: HttpServiceService,
    private doctorService: DoctorService,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.loadPreviousVisitDetails();
  }

  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  loadPreviousVisitDetails() {
    this.doctorService.getTMHistory().subscribe(
      (data: any) => {
        console.log('data', data);
        if (data.statusCode === 200) {
          this.previousVisitData = data.data;
          this.getEachVisitData();
        } else {
          this.confirmationService.alert(
            this.currentLanguageSet.unableToLoadData,
            'error',
          );
        }
      },
      (err: any) => {
        this.confirmationService.alert(
          this.currentLanguageSet.unableToLoadData,
          'error',
        );
      },
    );
  }

  getEachVisitData() {
    this.previousVisitData.forEach((item: any, i: any) => {
      if (item.visitCode) {
        const reqObj = {
          VisitCategory: item.VisitCategory,
          benFlowID: item.benFlowID,
          beneficiaryRegID: item.beneficiaryRegID,
          visitCode: item.visitCode,
        };
        this.doctorService.getTMCasesheetData(reqObj).subscribe((res: any) => {
          if (res.statusCode === 200 && res.data !== null) {
            this.previousVisitData[i]['benPreviousData'] = res.data;
            this.filteredHistory = res.data;
          }
        });
      }
    });
    this.previousHistoryPageChanged({
      page: this.previousHistoryActivePage,
      itemsPerPage: this.previousHistoryRowsPerPage,
    });
    console.log('previous data', this.previousVisitData);
  }

  previousHistoryPagedList: any = [];
  previousHistoryPageChanged(event: any): void {
    console.log('called', event);
    const startItem = (event.page - 1) * event.itemsPerPage;
    const endItem = event.page * event.itemsPerPage;
    for (let i = 0; i < 5 && i < this.previousVisitData.length; i++) {
      this.previousHistoryPagedList.push(this.previousVisitData[i]);
    }

    console.log('list', this.previousHistoryPagedList);
  }

  filterHistory(searchTerm?: string) {
    if (!searchTerm) {
      this.filteredHistory = this.previousVisitData;
    } else {
      this.filteredHistory = [];
      this.previousVisitData.forEach((item: any) => {
        const value: string = '' + item.VisitCategory;
        if (value.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0) {
          this.filteredHistory.push(item);
        }
      });
    }
    this.previousHistoryActivePage = 1;
    this.previousHistoryPageChanged({
      page: 1,
      itemsPerPage: this.previousHistoryRowsPerPage,
    });
  }
}
