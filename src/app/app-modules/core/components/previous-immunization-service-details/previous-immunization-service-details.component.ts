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
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { HttpServiceService } from '../../services/http-service.service';
import { SetLanguageComponent } from '../set-language.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'app-previous-immunization-service-details',
  templateUrl: './previous-immunization-service-details.component.html',
  styleUrls: ['./previous-immunization-service-details.component.css'],
})
export class PreviousImmunizationServiceDetailsComponent implements OnInit {
  currentLanguageSet: any;
  familyDetails = [];
  dataList = [];
  filteredDataList = [];

  displayedColumns: string[] = [
    'sno',
    'dateOfVisit',
    'typeOfImmunizationServices',
    'pastImmunizationService',
    'vaccineName',
    'vaccineDose',
    'route',
    'batchNo',
    'siteOfInjection',
  ];
  dataSource = new MatTableDataSource<any>([]);
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;

  constructor(
    public dialogRef: MatDialogRef<PreviousImmunizationServiceDetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public input: any,
    public httpServiceService: HttpServiceService,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.dataList = this.input.dataList;
    this.filteredDataList = this.dataList.slice();
  }

  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  filterPreviousData(searchTerm: any) {
    console.log('searchTerm', searchTerm);
    if (!searchTerm) this.filteredDataList = this.dataList;
    else {
      this.filteredDataList = [];
      this.dataList.forEach((item) => {
        for (const key in item) {
          const value: string = '' + item[key];
          if (value.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0) {
            this.filteredDataList.push(item);
            break;
          }
        }
      });
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
