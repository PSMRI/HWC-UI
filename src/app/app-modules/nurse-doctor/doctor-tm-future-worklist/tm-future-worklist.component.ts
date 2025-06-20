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
import { BeneficiaryDetailsService } from '../../core/services/beneficiary-details.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { DoctorService } from '../shared/services';
import { CameraService } from '../../core/services/camera.service';
import * as moment from 'moment';
import { SchedulerComponent } from './../scheduler/scheduler.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { SetLanguageComponent } from '../../core/components/set-language.component';
import { HttpServiceService } from '../../core/services/http-service.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-tm-future-worklist',
  templateUrl: './tm-future-worklist.component.html',
  styleUrls: ['./tm-future-worklist.component.css'],
})
export class TmFutureWorklistComponent implements OnInit, DoCheck, OnDestroy {
  rowsPerPage = 5;
  activePage = 1;
  pagedList: any = [];
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
    'tcDate',
    'image',
  ];
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
  dataSource = new MatTableDataSource<any>();

  constructor(
    private dialog: MatDialog,
    private cameraService: CameraService,
    private confirmationService: ConfirmationService,
    public httpServiceService: HttpServiceService,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    private doctorService: DoctorService,
    readonly sessionstorage: SessionStorageService,
  ) {}

  ngOnInit() {
    this.sessionstorage.setItem('currentRole', 'Doctor');
    this.loadWorklist();
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

  ngOnDestroy() {
    this.sessionstorage.removeItem('currentRole');
  }

  pageChanged(event: any): void {
    console.log('called', event);
    const startItem = (event.page - 1) * event.itemsPerPage;
    const endItem = event.page * event.itemsPerPage;
    this.pagedList = this.filteredBeneficiaryList.slice(startItem, endItem);
    console.log('list', this.pagedList);
  }
  loadWorklist() {
    this.filterTerm = null;
    this.doctorService.getDoctorFutureWorklist().subscribe(
      (data: any) => {
        if (data && data.statusCode === 200 && data.data) {
          console.log(
            'doctor future worklist',
            JSON.stringify(data.data, null, 4),
          );
          data.data.map((item: any) => {
            const temp = this.getVisitStatus(item);
            item.statusMessage = temp.statusMessage;
            item.statusCode = temp.statusCode;
          });
          const benlist = this.loadDataToBenList(data.data);
          this.beneficiaryList = benlist;
          this.filteredBeneficiaryList = benlist;
          this.dataSource.data = benlist;
          this.dataSource.paginator = this.paginator;
          this.dataSource.data.forEach((sectionCount: any, index: number) => {
            sectionCount.sno = index + 1;
          });
          this.filterTerm = null;
        } else this.confirmationService.alert(data.errorMessage, 'error');
      },
      (err) => {
        this.confirmationService.alert(err, 'error');
      },
    );
  }

  loadDataToBenList(data: any) {
    data.forEach((element: any) => {
      element.genderName = element.genderName || 'Not Available';
      element.age = element.age || 'Not Available';
      element.statusMessage = element.statusMessage || 'Not Available';
      element.VisitCategory = element.VisitCategory || 'Not Available';
      element.benVisitNo = element.benVisitNo || 'Not Available';
      element.districtName = element.districtName || 'Not Available';
      element.villageName = element.villageName || 'Not Available';
      element.arrival = false;
      element.preferredPhoneNum = element.preferredPhoneNum || 'Not Available';
      (element.visitDate =
        moment(element.visitDate).format('DD-MM-YYYY HH:mm A') ||
        'Not Available'),
        (element.benVisitDate =
          moment(element.benVisitDate).format('DD-MM-YYYY HH:mm A ') ||
          'Not Available'),
        (element.tCRequestDate =
          moment(element.tCRequestDate).format('DD-MM-YYYY HH:mm A ') ||
          'Not Available');
    });
    return data;
  }

  filterBeneficiaryList(searchTerm: string) {
    if (!searchTerm) this.filteredBeneficiaryList = this.beneficiaryList;
    else {
      this.filteredBeneficiaryList = [];
      this.dataSource.data = [];
      this.dataSource.paginator = this.paginator;
      this.beneficiaryList.forEach((item: any) => {
        console.log('item', JSON.stringify(item, null, 4));
        for (const key in item) {
          if (
            key === 'beneficiaryID' ||
            key === 'benName' ||
            key === 'genderName' ||
            key === 'age' ||
            key === 'statusMessage' ||
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
  }

  patientImageView(benregID: any) {
    this.beneficiaryDetailsService
      .getBeneficiaryImage(benregID)
      .subscribe((data: any) => {
        if (data && data.benImage) this.cameraService.viewImage(data.benImage);
        else
          this.confirmationService.alert(
            this.current_language_set.alerts.info.imageNotFound,
          );
      });
  }

  getBeneficiryStatus(beneficiary: any) {
    this.confirmationService.alert(beneficiary.statusMessage);
  }

  getVisitStatus(beneficiaryVisitDetials: any) {
    const status = {
      statusCode: 0,
      statusMessage: '',
    };
    status.statusMessage = this.current_language_set.alerts.info.scheduledTC;
    status.statusCode = 1;
    return status;
  }
  cancelTCRequest(beneficiary: any) {
    this.confirmationService
      .confirm(
        'info',
        this.current_language_set.alerts.info.cancelReq,
        'Yes',
        'No',
      )
      .subscribe((res) => {
        if (res) {
          this.doctorService
            .cancelBeneficiaryTCRequest({
              benflowID: beneficiary.benFlowID,
              benRegID: beneficiary.beneficiaryRegID,
              visitCode: beneficiary.visitCode,
              userID: beneficiary.tCSpecialistUserID,
              modifiedBy: this.sessionstorage.getItem('userName'),
            })
            .subscribe(
              (res: any) => {
                if (res && res.statusCode && res.data) {
                  this.confirmationService.alert(res.data.response, 'success');
                  this.loadWorklist();
                } else {
                  this.confirmationService.alert(res.errorMessage, 'error');
                }
              },
              (error) => {
                this.confirmationService.alert(error, 'error');
              },
            );
        }
      });
  }
  reSchedule(beneficiary: any) {
    this.openScheduler(beneficiary);
  }
  openScheduler(beneficiary: any) {
    const mdDialogRef: MatDialogRef<SchedulerComponent> = this.dialog.open(
      SchedulerComponent,
      {},
    );
    mdDialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.scheduleTC(beneficiary, result.tmSlot);
      }
      console.log(JSON.stringify(result, null, 4));
    });
  }
  scheduleTC(beneficiary: any, tcRequest: any) {
    const scedulerRequest = {
      benFlowID: beneficiary.benFlowID,
      beneficiaryRegID: beneficiary.beneficiaryRegID,
      benVisitID: beneficiary.benVisitID,
      visitCode: beneficiary.visitCode,
      vanID: beneficiary.vanID,
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      createdBy: this.sessionstorage.getItem('userName'),
      tcRequest: tcRequest,
    };
    this.doctorService.scheduleTC(scedulerRequest).subscribe(
      (res: any) => {
        if (res.statusCode === 200) {
          this.confirmationService.alert(
            this.current_language_set.alerts.info.beneficiaryDetails,
            'success',
          );
          this.loadWorklist();
        } else {
          this.confirmationService.alert(res.errorMessage, 'error');
        }
      },
      (error) => {
        this.confirmationService.alert(error, 'error');
      },
    );
  }
}
