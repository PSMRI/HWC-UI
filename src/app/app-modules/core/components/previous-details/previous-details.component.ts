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
import { Component, OnInit, Inject, ViewChild, DoCheck } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import * as moment from 'moment';
import { HttpServiceService } from '../../services/http-service.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { SetLanguageComponent } from '../set-language.component';

@Component({
  selector: 'app-previous-details',
  templateUrl: './previous-details.component.html',
  styleUrls: ['./previous-details.component.css'],
})
export class PreviousDetailsComponent implements OnInit, DoCheck {
  dataList: any = [];
  columnList: any = [];
  current_language_set: any;
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
  filteredDataList = new MatTableDataSource<any>();
  displayedColumns: any = ['sno'];

  constructor(
    public dialogRef: MatDialogRef<PreviousDetailsComponent>,
    public httpServiceService: HttpServiceService,
    @Inject(MAT_DIALOG_DATA) public input: any,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    if (
      this.input.dataList.data !== null &&
      this.input.dataList.data !== undefined &&
      this.input.dataList.data instanceof Array
    ) {
      this.dataList = this.input.dataList.data;
      this.filteredDataList.data = this.dataList.slice();
    }
    if (
      this.input.dataList.columns !== null &&
      this.input.dataList.columns !== undefined &&
      this.input.dataList.columns instanceof Array
    )
      this.columnList = this.input.dataList.columns;
    this.input.dataList.columns.filter((item: any) => {
      if (item.keyName) {
        this.displayedColumns.push(item.keyName);
      }
    });

    if (this.input.title === 'MMU Referral Details') {
      const newArray = [];
      let additionalArray;
      if (this.input.dataList.data.refrredToAdditionalServiceList) {
        additionalArray =
          this.input.dataList.data.refrredToAdditionalServiceList;
      } else {
        additionalArray = [];
      }

      for (let i = 0; i < additionalArray.length; i++) {
        newArray[i] = additionalArray[i].serviceName;
      }
      const serviceData = newArray.join(',');

      const dataResp: any = {
        referralReason: this.input.dataList.data.referralReason,
        referredToInstituteName:
          this.input.dataList.data.referredToInstituteName,
        refrredToAdditionalServiceList: serviceData,
        revisitDate: moment(this.input.dataList.data.revisitDate).format(
          'DD-MM-YYYY HH:mm A ',
        ),
        createdDate: moment(this.input.dataList.data.createdDate).format(
          'DD-MM-YYYY HH:mm A ',
        ),
      };

      this.dataList = [];
      this.columnList = [];
      this.dataList[0] = dataResp;
      this.filteredDataList = this.dataList.slice();
    }

    if (this.input.title === 'MMU Investigation Details') {
      let laboratoryArray;
      if (this.input.dataList.data.laboratoryList) {
        laboratoryArray = this.input.dataList.data.laboratoryList;
      } else {
        laboratoryArray = [];
      }
      this.dataList = [];
      for (let i = 0; i < laboratoryArray.length; i++) {
        this.dataList[i] = laboratoryArray[i];
      }

      this.filteredDataList = this.dataList.slice();
    }

    if (this.input.title === 'MMU Prescription Details') {
      this.dataList = [];
      this.columnList = [];
      this.dataList = this.loadDataPrescriptionList(this.input.dataList.data);
      this.filteredDataList = this.dataList.slice();
    }
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }

  loadDataPrescriptionList(data: any) {
    data.forEach((element: any) => {
      element.createdDate = moment(element.createdDate).format(
        'DD-MM-YYYY HH:mm A ',
      );
    });
    return data;
  }

  filterPreviousData(searchTerm: any) {
    console.log('searchTerm', searchTerm);
    if (!searchTerm) {
      this.filteredDataList.data = this.dataList;
      this.filteredDataList.paginator = this.paginator;
    } else {
      this.filteredDataList.data = [];
      this.dataList.forEach((item: any) => {
        for (const key in item) {
          const value: string = '' + item[key];
          if (value.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0) {
            this.filteredDataList.data.push(item);
            this.filteredDataList.paginator = this.paginator;
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
