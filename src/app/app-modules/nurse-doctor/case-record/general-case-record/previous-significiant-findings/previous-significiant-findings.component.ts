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
import {
  Component,
  DoCheck,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { DoctorService } from '../../../shared/services';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-previous-significiant-findings',
  templateUrl: './previous-significiant-findings.component.html',
  styleUrls: ['./previous-significiant-findings.component.css'],
})
export class PreviousSignificiantFindingsComponent
  implements OnInit, DoCheck, OnDestroy
{
  constructor(
    private doctorService: DoctorService,
    public httpServiceService: HttpServiceService,
    readonly sessionstorage: SessionStorageService,
  ) {}
  rowsPerPage = 5;
  activePage = 1;
  pagedList: any = [];
  rotate = true;
  current_language_set: any;
  displayedColumns: any = ['sno', 'significantfindings', 'captureddate'];

  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
  dataSource = new MatTableDataSource<any>();
  ngOnInit() {
    this.assignSelectedLanguage();
    this.getPreviousSignificiantFindings();
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }

  ngOnDestroy() {
    if (this.previousSignificantFindingsSubs)
      this.previousSignificantFindingsSubs.unsubscribe();
  }

  pageChanged(event: any): void {
    console.log('called', event);
    const startItem = (event.page - 1) * event.itemsPerPage;
    const endItem = event.page * event.itemsPerPage;
    this.pagedList = this.filteredPreviousSignificiantFindingsList.slice(
      startItem,
      endItem,
    );
    console.log('list', this.pagedList);
  }

  previousSignificiantFindingsList: any = [];
  filteredPreviousSignificiantFindingsList: any = [];
  previousSignificantFindingsSubs: any;
  getPreviousSignificiantFindings() {
    const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
    this.previousSignificantFindingsSubs = this.doctorService
      .getPreviousSignificiantFindings({ beneficiaryRegID: benRegID })
      .subscribe((data: any) => {
        console.log('previousSignificantFindingsSubs', data);
        if (data.statusCode === 200) {
          if (
            data.data !== null &&
            data.data !== undefined &&
            data.data.findings
          ) {
            this.previousSignificiantFindingsList = data.data.findings;
            this.filteredPreviousSignificiantFindingsList =
              this.previousSignificiantFindingsList;
            this.dataSource.data = [];
            this.dataSource.data = this.previousSignificiantFindingsList;
            this.dataSource.paginator = this.paginator;
            this.dataSource.data.forEach((item: any, i: number) => {
              item.sno = i + 1;
            });
          }
        }
      });
  }

  filterPreviousSignificiantFindingsList(searchTerm?: string) {
    if (!searchTerm) {
      this.filteredPreviousSignificiantFindingsList =
        this.previousSignificiantFindingsList;
      this.dataSource.data = this.previousSignificiantFindingsList;
      this.dataSource.paginator = this.paginator;
    } else {
      this.filteredPreviousSignificiantFindingsList = [];
      this.dataSource.data = [];
      this.dataSource.paginator = this.paginator;
      this.previousSignificiantFindingsList.forEach((item: any) => {
        for (const key in item) {
          const value: string = '' + item[key];
          if (value.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0) {
            this.filteredPreviousSignificiantFindingsList.push(item);
            this.dataSource.data.push(item);
            this.dataSource.paginator = this.paginator;
            break;
          }
        }
      });
    }
  }
}
