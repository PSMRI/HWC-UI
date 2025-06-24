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
import { Component, DoCheck, OnInit, ViewChild } from '@angular/core';
import { DoctorService } from '../../shared/services';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { BeneficiaryMctsCallHistoryComponent } from '../beneficiary-mcts-call-history/beneficiary-mcts-call-history.component';
import { CaseSheetComponent } from '../../case-sheet/case-sheet.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { environment } from 'src/environments/environment';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-beneficiary-platform-history',
  templateUrl: './beneficiary-platform-history.component.html',
  styleUrls: ['./beneficiary-platform-history.component.css'],
})
export class BeneficiaryPlatformHistoryComponent implements OnInit, DoCheck {
  current_language_set: any;
  higherHealthFacility = 'Higher Health Facility';
  previousHWCHistoryRowsPerPage = 5;
  previousHWCHistoryActivePage = 1;
  filteredHWCHistory: any = [];
  hideHWCFetch = false;

  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
  dataSource = new MatTableDataSource<any>();

  @ViewChild(MatPaginator) TmPaginator: MatPaginator | null = null;
  historyOfTM = new MatTableDataSource<any>();

  @ViewChild(MatPaginator) paginator104: MatPaginator | null = null;
  historyOf104 = new MatTableDataSource<any>();

  @ViewChild(MatPaginator) MctsPaginator: MatPaginator | null = null;
  historyOfMCTS = new MatTableDataSource<any>();

  @ViewChild(MatPaginator) HWCPaginator: MatPaginator | null = null;
  historyOfHWC = new MatTableDataSource<any>();

  displayedColumns = [
    'visitnommu',
    'date',
    'visitreasonmmu',
    'visitcategorymmu',
    'visitcodemmu',
    'previewmmu',
    'printpreviewmmu',
  ];

  displayedTMColumns = [
    'visitnommu',
    'date',
    'visitreasonmmu',
    'visitcategorymmu',
    'visitcodemmu',
    'previewmmu',
    'printpreviewmmu',
  ];

  displayedMCTSColumns = [
    'calltypemcts',
    'calldatetimemcts',
    'dataupdatemcts',
    'callstatusmcts',
    'callgrouptypemcts',
    'remarks',
    'actions',
  ];

  displayed104Columns = [
    'id',
    'name104',
    'age104',
    'ChiefComplaint104',
    'symptoms',
    'provisionalSelected104',
    'recommendedaction104',
    'actionByHao',
    'actionByMo',
    'actionByCoPd',
    'date',
  ];

  displayedHWColumns = [
    'visitnommu',
    'date',
    'visitreasonmmu',
    'visitcategorymmu',
    'visitdetailsmmu',
    'medicationmmu',
    'previewmmu',
    'printpreviewmmu',
  ];

  constructor(
    private doctorService: DoctorService,
    public httpServiceService: HttpServiceService,
    private confirmationService: ConfirmationService,
    private dialog: MatDialog,
    readonly sessionstorage: SessionStorageService,
  ) {}

  ngOnInit() {
    this.getServiceOnState();
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

  serviceOnState: any = [];
  getServiceOnState() {
    this.doctorService.getServiceOnState().subscribe((res: any) => {
      console.log('resinstate', res);
      if (res.statusCode === 200) {
        this.serviceOnState = this.getStateServiceActivity(res.data);
      }
    });
  }
  getStateServiceActivity(serviceOnState: any) {
    const services: any = [];
    serviceOnState.forEach((service: any) => {
      if (service.serviceID !== 1 && service.serviceID !== 5) {
        service = Object.assign({
          serviceID: service.serviceID,
          serviceName: service.serviceName,
          serviceLoaded: false,
        });
        services.push(service);
      }
    });
    return services;
  }

  getServiceHistory(service: any) {
    if (service === 2) {
      this.getMMUHistory();
    }
    if (service === 3) {
      this.get104History();
    }
    if (service === 4) {
      this.getTMHistory();
    }
    if (service === 6) {
      this.getMCTSHistory();
    }
    if (service === 9) {
      this.getHWCHistory();
    }
  }

  previousMMUHistoryRowsPerPage = 5;
  previousMMUHistoryActivePage = 1;
  rotate = true;
  historyOfMMU: any = [];
  filteredMMUHistory: any = [];
  hideMMUFetch = false;

  getMMUHistory() {
    this.doctorService.getMMUHistory().subscribe(
      (data: any) => {
        console.log('data', data);
        if (data.statusCode === 200) {
          this.hideMMUFetch = true;
          const services = this.serviceOnState;
          this.serviceOnState = [];
          this.serviceOnState = this.checkServiceLoader(services, 2);
          console.log('dataget', JSON.stringify(data, null, 4));
          this.historyOfMMU = data.data;
          this.filteredMMUHistory = data.data;
          this.dataSource.data = data.data;
          this.dataSource.paginator = this.paginator;
          this.previousMMUHistoryPageChanged({
            page: this.previousMMUHistoryActivePage,
            itemsPerPage: this.previousMMUHistoryRowsPerPage,
          });
        } else {
          this.confirmationService.alert(
            this.current_language_set.unableToLoadData,
            'error',
          );
        }
      },
      (err) => {
        this.confirmationService.alert(
          this.current_language_set.unableToLoadData,
          'error',
        );
      },
    );
  }

  getEachVisitData() {
    this.historyOfHWC.data.forEach((item: any, i: any) => {
      if (item.visitCode) {
        const reqObj = {
          VisitCategory: item.VisitCategory,
          benFlowID: item.benFlowID,
          beneficiaryRegID: item.beneficiaryRegID,
          visitCode: item.visitCode,
        };
        this.doctorService.getTMCasesheetData(reqObj).subscribe((res: any) => {
          if (res.statusCode === 200 && res.data !== null) {
            this.historyOfHWC.data[i]['benPreviousData'] = res.data;
            this.filteredHWCHistory = res.data;
            this.previousHWCHistoryPageChanged({
              page: this.previousHWCHistoryActivePage,
              itemsPerPage: this.previousHWCHistoryRowsPerPage,
            });
          }
        });
      }
    });
    console.log('previous data', this.historyOfHWC);
  }
  checkServiceLoader(services: any, serviceID: any) {
    services.forEach((service: any) => {
      if (serviceID === service.serviceID) {
        service.serviceLoaded = true;
      } else {
        console.log('test');
      }
    });
    console.log(services, 'servicechane');

    return services;
  }
  filterMMUHistory(searchTerm?: string) {
    if (!searchTerm) {
      this.filteredMMUHistory = this.historyOfMMU;
    } else {
      this.filteredMMUHistory = [];
      this.historyOfMMU.forEach((item: any) => {
        const value: string = '' + item.VisitCategory;
        if (value.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0) {
          this.filteredMMUHistory.push(item);
        }
      });
    }

    this.previousMMUHistoryActivePage = 1;
    this.previousMMUHistoryPageChanged({
      page: 1,
      itemsPerPage: this.previousMMUHistoryRowsPerPage,
    });
  }

  previousMMUHistoryPagedList: any = [];
  previousMMUHistoryPageChanged(event: any): void {
    console.log('called', event);
    const startItem = (event.page - 1) * event.itemsPerPage;
    const endItem = event.page * event.itemsPerPage;
    this.previousMMUHistoryPagedList = this.filteredMMUHistory.slice(
      startItem,
      endItem,
    );
    console.log('list', this.previousMMUHistoryPagedList);
  }

  getVisitDetails(serviceType: any, visit: any, print: any) {
    this.confirmationService
      .confirm('info', this.current_language_set.alerts.info.viewCasesheet)
      .subscribe((res) => {
        console.log('print', print);
        if (res) {
          this.sessionstorage.setItem(
            'previousCaseSheetVisitCode',
            visit.visitCode,
          );
          this.sessionstorage.setItem(
            'previousCaseSheetBenFlowID',
            visit.benFlowID,
          );
          this.sessionstorage.setItem(
            'previousCaseSheetVisitCategory',
            visit.VisitCategory,
          );
          this.sessionstorage.setItem(
            'previousCaseSheetBeneficiaryRegID',
            visit.beneficiaryRegID,
          );
          this.sessionstorage.setItem(
            'previousCaseSheetVisitID',
            visit.visitCode,
          );
          this.sessionstorage.setItem(
            'currentLanguageSet',
            this.current_language_set,
          );
          if (print) {
            const url = environment.newTaburl;
            // window.location.href = url + '#/nurse-doctor/print/' + serviceType + '/' + 'previous';
            window.open(
              url + '#/nurse-doctor/print/' + serviceType + '/' + 'previous',
            );
          } else {
            this.dialog.open(CaseSheetComponent, {
              disableClose: true,
              width: '95%',
              panelClass: 'preview-casesheet',
              data: {
                previous: true,
                serviceType: serviceType,
              },
            });
          }
        }
      });
  }

  hideMCTSFetch = false;
  previousMCTSHistoryRowsPerPage = 5;
  previousMCTSHistoryActivePage = 1;
  filteredMCTSHistory: any = [];
  getMCTSHistory() {
    this.doctorService.getMCTSHistory().subscribe(
      (data: any) => {
        console.log('data', data);

        if (data.statusCode === 200) {
          this.hideMCTSFetch = true;
          console.log('dataget', data);
          const services = this.serviceOnState;
          this.serviceOnState = [];
          this.serviceOnState = this.checkServiceLoader(services, 6);
          this.filteredMCTSHistory = data.data;
          this.historyOfMCTS.data = data.data;
          this.historyOfMCTS.paginator = this.paginator;
          this.previousMCTSHistoryPageChanged({
            page: this.previousMCTSHistoryActivePage,
            itemsPerPage: this.previousMCTSHistoryRowsPerPage,
          });
        } else {
          this.confirmationService.alert(
            this.current_language_set.unableToLoadData,
            'error',
          );
        }
      },
      (err) => {
        this.confirmationService.alert(
          this.current_language_set.unableToLoadData,
          'error',
        );
      },
    );
  }

  filterMCTSHistory(searchTerm?: string) {
    if (!searchTerm) {
      this.filteredMCTSHistory = this.historyOfMCTS;
    } else {
      this.filteredMCTSHistory = [];
      this.historyOfMCTS.data.forEach((item: any) => {
        const value: string = '' + item.mctsOutboundCall.displayOBCallType;
        if (value.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0) {
          this.filteredMCTSHistory.push(item);
        }
      });
    }

    this.previousMCTSHistoryActivePage = 1;
    this.previousMCTSHistoryPageChanged({
      page: 1,
      itemsPerPage: this.previousMCTSHistoryRowsPerPage,
    });
  }

  previousMCTSHistoryPagedList: any = [];
  previousMCTSHistoryPageChanged(event: any): void {
    console.log('called', event);
    const startItem = (event.page - 1) * event.itemsPerPage;
    const endItem = event.page * event.itemsPerPage;
    this.previousMCTSHistoryPagedList = this.filteredMCTSHistory.slice(
      startItem,
      endItem,
    );
    console.log('list', this.previousMCTSHistoryPagedList);
  }

  hide104Fetch = false;
  previous104HistoryRowsPerPage = 5;
  previous104HistoryActivePage = 1;
  filtered104History: any = [];
  get104History() {
    this.doctorService.get104History().subscribe(
      (data: any) => {
        console.log('data', data);

        if (data.statusCode === 200) {
          this.hide104Fetch = true;
          const services = this.serviceOnState;
          this.serviceOnState = [];
          this.serviceOnState = this.checkServiceLoader(services, 3);
          console.log('dataget', data);
          this.filtered104History = data.data;
          this.historyOf104.data = data.data;
          this.historyOf104.paginator = this.paginator;
          this.previous104HistoryPageChanged({
            page: this.previous104HistoryActivePage,
            itemsPerPage: this.previous104HistoryRowsPerPage,
          });
        } else {
          this.confirmationService.alert(
            this.current_language_set.unableToLoadData,
            'error',
          );
        }
      },
      (err) => {
        this.confirmationService.alert(
          this.current_language_set.unableToLoadData,
          'error',
        );
      },
    );
  }

  filter104History(searchTerm?: string) {
    if (!searchTerm) {
      this.filtered104History = this.historyOf104;
    } else {
      this.filtered104History = [];
      this.historyOf104.data.forEach((item: any) => {
        const value: string = '' + item.diseaseSummary;
        if (value.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0) {
          this.filtered104History.push(item);
        }
      });
    }

    this.previous104HistoryActivePage = 1;
    this.previous104HistoryPageChanged({
      page: 1,
      itemsPerPage: this.previous104HistoryRowsPerPage,
    });
  }

  previous104HistoryPagedList: any = [];
  previous104HistoryPageChanged(event: any): void {
    console.log('called', event);
    const startItem = (event.page - 1) * event.itemsPerPage;
    const endItem = event.page * event.itemsPerPage;
    this.previous104HistoryPagedList = this.filtered104History.slice(
      startItem,
      endItem,
    );
    console.log('list', this.previous104HistoryPagedList);
  }

  callData: any;
  getPatientMCTSCallHistory(call: any) {
    const callDetailID = { callDetailID: call.callDetailID };
    this.doctorService
      .getPatientMCTSCallHistory(callDetailID)
      .subscribe((data: any) => {
        console.log('data', data);
        if (data.statusCode === 200) {
          this.showCallDetails(data.data);
        }
      });
  }

  showCallDetails(CallDetails: any) {
    const matDialogRef: MatDialogRef<BeneficiaryMctsCallHistoryComponent> =
      this.dialog.open(BeneficiaryMctsCallHistoryComponent, {
        width: '70%',
        panelClass: 'preview-casesheet',
        data: CallDetails,
      });

    matDialogRef.afterClosed().subscribe((result) => {
      if (result) {
        //resul will be displayed in future
      }
    });
  }
  previousTMHistoryRowsPerPage = 5;
  previousTMHistoryActivePage = 1;
  filteredTMHistory: any = [];
  hideTMFetch = false;

  getTMHistory() {
    this.doctorService.getTMHistory().subscribe(
      (data: any) => {
        console.log('data', data);

        if (data.statusCode === 200) {
          this.hideTMFetch = true;
          const services = this.serviceOnState;
          this.serviceOnState = [];
          this.serviceOnState = this.checkServiceLoader(services, 4);
          console.log('dataget', JSON.stringify(data, null, 4));
          this.filteredTMHistory = data.data;
          this.historyOfTM.data = data.data;
          this.historyOfTM.paginator = this.paginator;
          this.previousTMHistoryPageChanged({
            page: this.previousTMHistoryActivePage,
            itemsPerPage: this.previousTMHistoryRowsPerPage,
          });
        } else {
          this.confirmationService.alert(
            this.current_language_set.unableToLoadData,
            'error',
          );
        }
      },
      (err) => {
        this.confirmationService.alert(
          this.current_language_set.unableToLoadData,
          'error',
        );
      },
    );
  }

  filterTMHistory(searchTerm?: string) {
    if (!searchTerm) {
      this.filteredTMHistory = this.historyOfTM.data;
    } else {
      this.filteredTMHistory = [];
      this.historyOfTM.data.forEach((item: any) => {
        const value: string = '' + item.VisitCategory;
        if (value.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0) {
          this.filteredTMHistory.push(item);
          this.historyOfTM.data.push(item);
          this.historyOfTM.paginator = this.TmPaginator;
        }
      });
    }

    this.previousTMHistoryActivePage = 1;
    this.previousTMHistoryPageChanged({
      page: 1,
      itemsPerPage: this.previousTMHistoryRowsPerPage,
    });
  }

  filterHWCHistory(searchTerm?: string) {
    if (!searchTerm) {
      this.filteredHWCHistory = this.historyOfHWC.data;
    } else {
      this.filteredHWCHistory = [];
      this.historyOfHWC.data.forEach((item: any) => {
        const value: string = '' + item.VisitCategory;
        if (value.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0) {
          this.filteredHWCHistory.push(item);
          this.historyOfHWC.data.push(item);
          this.historyOfHWC.paginator = this.TmPaginator;
        }
      });
    }

    this.previousHWCHistoryActivePage = 1;
    this.previousHWCHistoryPageChanged({
      page: 1,
      itemsPerPage: this.previousHWCHistoryRowsPerPage,
    });
  }

  previousTMHistoryPagedList: any = [];
  previousTMHistoryPageChanged(event: any): void {
    console.log('called', event);
    const startItem = (event.page - 1) * event.itemsPerPage;
    const endItem = event.page * event.itemsPerPage;
    this.previousTMHistoryPagedList = this.filteredTMHistory.slice(
      startItem,
      endItem,
    );
    console.log('list', this.previousTMHistoryPagedList);
  }

  getHWCHistory() {
    this.doctorService.getTMHistory().subscribe(
      (data: any) => {
        console.log('data', data);

        if (data.statusCode === 200) {
          this.hideHWCFetch = true;
          const services = this.serviceOnState;
          this.serviceOnState = [];
          this.serviceOnState = this.checkServiceLoader(services, 9);
          console.log('dataget', JSON.stringify(data, null, 4));
          this.historyOfHWC.data = data.data;
          this.historyOfHWC.paginator = this.paginator;
          this.getEachVisitData();
        } else {
          this.confirmationService.alert(
            this.current_language_set.unableToLoadData,
            'error',
          );
        }
      },
      (err) => {
        this.confirmationService.alert(
          this.current_language_set.unableToLoadData,
          'error',
        );
      },
    );
  }
  previousHWCHistoryPagedList: any = [];
  previousHWCHistoryPageChanged(event: any): void {
    console.log('called', event);
    const startItem = (event.page - 1) * event.itemsPerPage;
    const endItem = event.page * event.itemsPerPage;
    this.previousHWCHistoryPagedList = this.historyOfHWC.data.slice(
      startItem,
      endItem,
    );
    console.log('list', this.previousHWCHistoryPagedList);
  }
}
