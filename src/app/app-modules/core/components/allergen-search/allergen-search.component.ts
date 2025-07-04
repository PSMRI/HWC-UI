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
import { Component, DoCheck, Inject, OnInit, ViewChild } from '@angular/core';
import { HttpServiceService } from '../../services/http-service.service';
import { SetLanguageComponent } from '../set-language.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MasterdataService } from 'src/app/app-modules/nurse-doctor/shared/services';

@Component({
  selector: 'app-allergen-search',
  templateUrl: './allergen-search.component.html',
  styleUrls: ['./allergen-search.component.css'],
})
export class AllergenSearchComponent implements OnInit, DoCheck {
  searchTerm: any;

  components = [];
  pageCount: any;
  selectedComponentsList = [];
  currentPage = 1;
  pager: any = {
    totalItems: 0,
    currentPage: 0,
    totalPages: 0,
    startPage: 0,
    endPage: 0,
    pages: 0,
  };
  pagedItems = [];
  placeHolderSearch: any;
  currentLanguageSet: any;

  selectedComponent: any = null;
  selectedComponentNo: any;
  message = '';
  selectedItem: any;

  displayedColumns: string[] = ['ConceptID', 'term', 'action'];
  dataSource = new MatTableDataSource<any>([]);
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public input: any,
    private masterdataService: MasterdataService,
    public httpServiceService: HttpServiceService,
    public dialogRef: MatDialogRef<AllergenSearchComponent>,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.search(this.input.searchTerm, 0);
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }

  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  selectComponentName(item: any, component: any) {
    this.selectedComponent = null;
    this.selectedComponentNo = item;
    this.selectedComponent = component;
    console.log('selectedComponent', this.selectedComponent);
    this.selectedItem = component;
  }

  submitComponentList() {
    const reqObj = {
      componentNo: this.selectedComponentNo,
      component: this.selectedComponent,
    };
    this.dialogRef.close(reqObj);
  }

  showProgressBar = false;

  search(term: string, pageNo: any): void {
    if (term.length > 2) {
      this.showProgressBar = true;
      this.masterdataService
        .searchDiagnosisBasedOnPageNo1(term, pageNo)
        .subscribe(
          (res: any) => {
            if (res.statusCode === 200) {
              this.showProgressBar = false;
              if (res.data && res.data.sctMaster.length > 0) {
                this.showProgressBar = true;
                this.components = res.data.sctMaster;

                this.dataSource.data = res.data.sctMaster;
                this.dataSource.paginator = this.paginator;
                this.dataSource.data.forEach((item: any, i: number) => {
                  item.ConceptID = i + 1;
                });
                if (pageNo === 0) {
                  this.pageCount = res.data.pageCount;
                }
                this.pager = this.getPager(pageNo);
                this.showProgressBar = false;
              } else {
                this.message = this.currentLanguageSet.common.noRecordFound;
              }
            } else {
              this.resetData();
              this.showProgressBar = false;
            }
          },
          (err) => {
            this.resetData();
            this.showProgressBar = false;
          },
        );
    }
  }

  checkPager(pager: any, page: any) {
    if (page === 0 && pager.currentPage !== 0) {
      this.setPage(page);
    } else if (pager.currentPage < page) {
      this.setPage(page);
    }
  }

  setPage(page: number) {
    if (page <= this.pageCount - 1 && page >= 0) {
      this.search(this.input.searchTerm, page);
      this.pager = this.getPager(page);
    }
  }

  getPager(page: any) {
    const totalPages = this.pageCount;
    if (page > totalPages) {
      page = totalPages - 1;
    }
    let startPage: number, endPage: number;
    if (totalPages <= 5) {
      startPage = 0;
      endPage = totalPages - 1;
    } else {
      if (page <= 2) {
        startPage = 0;
        endPage = 4;
      } else if (page + 2 >= totalPages) {
        startPage = totalPages - 5;
        endPage = totalPages - 1;
      } else {
        startPage = page - 2;
        endPage = page + 2;
      }
    }
    const pages = Array.from(Array(endPage + 1 - startPage).keys()).map(
      (i) => startPage + i,
    );
    return {
      currentPage: page,
      totalPages: totalPages,
      startPage: startPage,
      endPage: endPage,
      pages: pages,
    };
  }

  resetData() {
    this.components = [];
    this.pageCount = null;
    this.pager = {
      totalItems: 0,
      currentPage: 0,
      totalPages: 0,
      startPage: 0,
      endPage: 0,
      pages: 0,
    };
  }
}
