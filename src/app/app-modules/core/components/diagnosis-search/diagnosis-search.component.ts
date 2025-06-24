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
  OnInit,
  Inject,
  ViewChild,
  DoCheck,
  OnChanges,
} from '@angular/core';
import { HttpServiceService } from '../../services/http-service.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SetLanguageComponent } from '../set-language.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MasterdataService } from 'src/app/app-modules/nurse-doctor/shared/services';

@Component({
  selector: 'app-diagnosis-search',
  templateUrl: './diagnosis-search.component.html',
  styleUrls: ['./diagnosis-search.component.css'],
})
export class DiagnosisSearchComponent implements OnInit, DoCheck, OnChanges {
  searchTerm: any;
  diagnosis$ = [];
  pageCount: any;
  selectedDiagnosisList: any = [];
  displayedColumns: any = ['term', 'empty'];
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
  diagnosis = new MatTableDataSource<any>();

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

  constructor(
    @Inject(MAT_DIALOG_DATA) public input: any,
    public dialogRef: MatDialogRef<DiagnosisSearchComponent>,
    private masterdataService: MasterdataService,
    public httpServiceService: HttpServiceService,
  ) {}

  async ngOnInit() {
    this.assignSelectedLanguage();
    await this.search(this.input.searchTerm, 0);
    if (this.input.diagonasisType) console.log(this.input, 'ADDED Diagnosis');
    this.placeHolderSearch = this.input.diagonasisType;
  }

  ngOnChanges() {
    console.log(this.input, 'ADDED Diagnosis');
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }

  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  selectDiagnosis(event: any, item: any) {
    if (event.checked) {
      item.selected = true;
      this.selectedDiagnosisList.push(item);
    } else {
      const index = this.selectedDiagnosisList.indexOf(item);
      this.selectedDiagnosisList.splice(index, 1);
      item.selected = false;
    }
  }

  selectedDiagnosis(item: any) {
    const addedDiagnosis = this.input.addedDiagnosis;
    const temp = addedDiagnosis.filter(
      (diagnosis: any) => diagnosis.conceptID === item.conceptID,
    );
    if (temp.length > 0) return true;
    else {
      const currentSelection = this.selectedDiagnosisList.filter(
        (diagnosis: any) => diagnosis.conceptID === item.conceptID,
      );
      if (currentSelection.length > 0) {
        return true;
      } else {
        return false;
      }
    }
  }

  submitDiagnosisList() {
    this.dialogRef.close(this.selectedDiagnosisList);
  }

  checkSelectedDiagnosis(item: any) {
    const addedDiagnosis = this.input.addedDiagnosis;
    if (addedDiagnosis.length > 1) {
      const temp = addedDiagnosis.filter(
        (diagnosis: any) => diagnosis.conceptID === item.conceptID,
      );
      if (temp.length > 0) {
        return true;
      } else {
        const tempCurrent = this.checkCurrentSelection(item);
        return tempCurrent;
      }
    } else {
      const tempCurrent = this.checkCurrentSelection(item);
      return tempCurrent;
    }
  }

  checkCurrentSelection(item: any) {
    if (this.selectedDiagnosisList.length > 0) {
      const currentSelection = this.selectedDiagnosisList.filter(
        (diagnosis: any) => diagnosis.conceptID === item.conceptID,
      );
      if (currentSelection.length > 0) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
  disableSelection(item: any) {
    const addedDiagnosis = this.input.addedDiagnosis;
    const temp = addedDiagnosis.filter(
      (diagnosis: any) => diagnosis.conceptID === item.conceptID,
    );
    if (temp.length > 0) {
      return true;
    } else {
      const currentSelection = this.selectedDiagnosisList.filter(
        (diagnosis: any) => diagnosis.conceptID === item.conceptID,
      );
      const selectedDiagnosislength =
        this.input.addedDiagnosis.length +
        this.selectedDiagnosisList.length -
        1;
      if (currentSelection.length > 0) {
        return false;
      } else if (selectedDiagnosislength < 30) {
        return false;
      } else {
        return true;
      }
    }
  }
  enableCurrentSelection(item: any) {
    if (this.selectedDiagnosisList.length > 0) {
      const currentSelection = this.selectedDiagnosisList.filter(
        (diagnosis: any) => diagnosis.conceptID === item.conceptID,
      );
      if (currentSelection.length > 0) {
        return false;
      } else {
        const selectionLimit = this.checkSelectionLimit();
        return selectionLimit;
      }
    } else {
      const selectionLimit = this.checkSelectionLimit();
      return selectionLimit;
    }
  }

  checkSelectionLimit() {
    const selectedDiagnosislength =
      this.input.addedDiagnosis.length + this.selectedDiagnosisList.length - 1;
    if (selectedDiagnosislength < 30) {
      return false;
    } else {
      return true;
    }
  }

  showProgressBar = false;
  search(term: string, pageNo: any): void {
    if (term.length > 2) {
      this.showProgressBar = true;
      this.masterdataService
        .searchDiagnosisBasedOnPageNo(term, pageNo)
        .subscribe(
          (res: any) => {
            if (res.statusCode === 200) {
              this.showProgressBar = false;
              if (res.data && res.data.sctMaster.length > 0) {
                this.showProgressBar = true;
                this.diagnosis.data = res.data.sctMaster;
                this.diagnosis.paginator = this.paginator;
                if (pageNo === 0) {
                  this.pageCount = res.data.pageCount;
                }
                this.showProgressBar = false;
              }
            } else {
              this.resetData();
              this.showProgressBar = false;
            }
          },
          (err: any) => {
            this.resetData();
            this.showProgressBar = false;
          },
        );
    }
  }

  resetData() {
    this.diagnosis.data = [];
    this.diagnosis.paginator = this.paginator;
  }
}
