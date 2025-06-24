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
  OnDestroy,
  ViewChild,
  DoCheck,
} from '@angular/core';
import { Router } from '@angular/router';
import { BeneficiaryDetailsService } from '../../core/services/beneficiary-details.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { LabService } from '../shared/services';
import { CameraService } from '../../core/services/camera.service';
import * as moment from 'moment';
import { SetLanguageComponent } from '../../core/components/set-language.component';
import { HttpServiceService } from '../../core/services/http-service.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-worklist',
  templateUrl: './worklist.component.html',
  styleUrls: ['./worklist.component.css'],
})
export class WorklistComponent implements OnInit, OnDestroy, DoCheck {
  rowsPerPage = 5;
  activePage = 1;
  pagedList = [];
  rotate = true;
  beneficiaryList: any;
  filteredBeneficiaryList: any = [];
  blankTable = [1, 2, 3, 4, 5];
  filterTerm: any;
  current_language_set: any;
  currentPage!: number;
  displayedColumns: any = [
    'sno',
    'beneficiaryID',
    'beneficiaryName',
    'gender',
    'age',
    'visitCategory',
    'district',
    'phoneNo',
    'visitDate',
    'image',
  ];
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
  dataSource = new MatTableDataSource<any>();

  constructor(
    private cameraService: CameraService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    public httpServiceService: HttpServiceService,
    private labService: LabService,
    readonly sessionstorage: SessionStorageService,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.sessionstorage.setItem('currentRole', 'Lab Technician');
    this.loadWorklist();
    this.beneficiaryDetailsService.reset();
    this.removeBeneficiaryDataForVisit();
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }

  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }

  removeBeneficiaryDataForVisit() {
    this.sessionstorage.removeItem('visitCode');
    this.sessionstorage.removeItem('beneficiaryGender');
    this.sessionstorage.removeItem('benFlowID');
    this.sessionstorage.removeItem('visitCategory');
    this.sessionstorage.removeItem('visitReason');
    this.sessionstorage.removeItem('beneficiaryRegID');
    this.sessionstorage.removeItem('visitID');
    this.sessionstorage.removeItem('beneficiaryID');
    this.sessionstorage.removeItem('doctorFlag');
    this.sessionstorage.removeItem('nurseFlag');
    this.sessionstorage.removeItem('pharmacist_flag');
    this.sessionstorage.removeItem('specialistFlag');
  }

  ngOnDestroy() {
    this.sessionstorage.removeItem('currentRole');
  }

  loadWorklist() {
    this.labService.getLabWorklist().subscribe(
      (data: any) => {
        if (data && data.statusCode === 200 && data.data) {
          console.log('lab worklist', data.data);

          const benlist = this.loadDataToBenList(data.data);
          this.beneficiaryList = benlist;
          this.filteredBeneficiaryList = benlist;
          this.dataSource.data = [];
          this.dataSource.data = benlist;
          this.dataSource.paginator = this.paginator;
          this.dataSource.data.forEach((sectionCount: any, index: number) => {
            sectionCount.sno = index + 1;
          });
          this.filterTerm = null;
        } else {
          this.confirmationService.alert(data.errorMessage, 'error');
          this.dataSource.data = [];
          this.dataSource.paginator = this.paginator;
        }
      },
      (err) => {
        this.confirmationService.alert(err, 'error');
      },
    );
  }

  pageChanged(event: any): void {
    console.log('called', event);
    const startItem = (event.page - 1) * event.itemsPerPage;
    const endItem = event.page * event.itemsPerPage;
    this.pagedList = this.filteredBeneficiaryList.slice(startItem, endItem);
    console.log('list', this.pagedList);
  }

  loadDataToBenList(data: any) {
    const benDataList: any = [];
    data.forEach((element: any) => {
      benDataList.push({
        beneficiaryID: element.beneficiaryID,
        beneficiaryRegID: element.beneficiaryRegID,
        benName: element.benName,
        genderName: element.genderName || 'Not Available',
        age: element.age || 'Not Available',
        VisitCategory: element.VisitCategory || 'Not Available',
        benVisitNo: element.benVisitNo || 'Not Available',
        districtName: element.districtName || 'Not Available',
        villageName: element.villageName || 'Not Available',
        preferredPhoneNum: element.preferredPhoneNum || 'Not Available',
        benFlowID: element.benFlowID,
        benVisitID: element.benVisitID,
        visitDate:
          moment(element.visitDate).format('DD-MM-YYYY HH:mm A ') ||
          'Not Available',
        benVisitDate:
          moment(element.benVisitDate).format('DD-MM-YYYY HH:mm A ') ||
          'Not Available',
        labObject: element,
      });
    });
    return benDataList;
  }

  filterBeneficiaryList(searchTerm: string) {
    if (!searchTerm) this.filteredBeneficiaryList = this.beneficiaryList;
    else {
      this.filteredBeneficiaryList = [];
      this.dataSource.data = [];
      this.dataSource.paginator = this.paginator;
      this.beneficiaryList.forEach((item: any) => {
        for (const key in item) {
          if (
            key === 'beneficiaryID' ||
            key === 'benName' ||
            key === 'genderName' ||
            key === 'age' ||
            key === 'VisitCategory' ||
            key === 'benVisitNo' ||
            key === 'districtName' ||
            key === 'preferredPhoneNum' ||
            key === 'villageName' ||
            key === 'beneficiaryRegID' ||
            key === 'visitDate'
          ) {
            const value: string = '' + item[key];
            if (value.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0) {
              this.filteredBeneficiaryList.push(item);
              this.dataSource.data.push(item);
              this.dataSource.paginator = this.paginator;
              this.dataSource.data.forEach(
                (sectionCount: any, index: number) => {
                  sectionCount.sno = index + 1;
                },
              );
              break;
            }
          }
        }
      });
    }
    this.activePage = 1;
    this.pageChanged({
      page: 1,
      itemsPerPage: this.rowsPerPage,
    });
    this.currentPage = 1;
  }

  patientImageView(benregID: any) {
    if (
      benregID &&
      benregID !== null &&
      benregID !== '' &&
      benregID !== undefined
    ) {
      this.beneficiaryDetailsService
        .getBeneficiaryImage(benregID)
        .subscribe((data: any) => {
          if (data && data.benImage)
            this.cameraService.viewImage(data.benImage);
          else
            this.confirmationService.alert(
              this.current_language_set.alerts.info.imageNotFound,
            );
        });
    }
  }

  loadLabExaminationPage(beneficiary: any) {
    console.log('beneficiary', JSON.stringify(beneficiary, null, 4));

    this.confirmationService
      .confirm(
        `info`,
        this.current_language_set.alerts.info.confirmtoProceedFurther,
      )
      .subscribe((result) => {
        if (result) {
          this.sessionstorage.setItem(
            'doctorFlag',
            beneficiary.labObject.doctorFlag,
          );
          this.sessionstorage.setItem(
            'nurseFlag',
            beneficiary.labObject.nurseFlag,
          );
          this.sessionstorage.setItem('visitID', beneficiary.benVisitID);
          this.sessionstorage.setItem(
            'beneficiaryRegID',
            beneficiary.beneficiaryRegID,
          );
          this.sessionstorage.setItem(
            'beneficiaryID',
            beneficiary.beneficiaryID,
          );
          this.sessionstorage.setItem(
            'visitCategory',
            beneficiary.VisitCategory,
          );
          this.sessionstorage.setItem('benFlowID', beneficiary.benFlowID);
          this.sessionstorage.setItem(
            'visitCode',
            beneficiary.labObject.visitCode,
          );
          if (
            beneficiary.labObject.specialist_flag &&
            beneficiary.labObject.specialist_flag >= 0
          ) {
            this.sessionstorage.setItem(
              'specialist_flag',
              beneficiary.labObject.specialist_flag,
            );
          } else {
            this.sessionstorage.setItem('specialist_flag', 'null');
          }
          console.log(
            this.sessionstorage.getItem('visitCode'),
            'visitCodebeforedave',
          );
          this.router.navigate(['/lab/patient/', beneficiary.beneficiaryRegID]);
        }
      });
  }
}
