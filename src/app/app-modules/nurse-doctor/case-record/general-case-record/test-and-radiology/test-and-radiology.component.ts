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
import { ViewTestReportComponent } from './view-test-report/view-test-report.component';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { DoctorService } from '../../../shared/services';
import { DomSanitizer } from '@angular/platform-browser';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { MatDialog } from '@angular/material/dialog';
import { IdrsscoreService } from '../../../shared/services/idrsscore.service';
import { TestInVitalsService } from '../../../shared/services/test-in-vitals.service';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { LabService } from 'src/app/app-modules/lab/shared/services';
import { ViewRadiologyUploadedFilesComponent } from 'src/app/app-modules/lab/view-radiology-uploaded-files/view-radiology-uploaded-files.component';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-test-and-radiology',
  templateUrl: './test-and-radiology.component.html',
  styleUrls: ['./test-and-radiology.component.css'],
})
export class TestAndRadiologyComponent implements OnInit, DoCheck, OnDestroy {
  current_language_set: any;
  stripsNotAvailable: any;
  testMMUResultsSubscription: any;
  enableFetosenseView = false;
  fetosenseDataToView: any;
  fetosenseTestName: any;
  imgUrl: any;
  amritFilePath: any;
  vitalsRBSResp: any = null;

  displayedColumns: any = [
    'date',
    'testName',
    'componentName',
    'result',
    'measurementUnit',
    'remarks',
  ];
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
  filteredLabResults = new MatTableDataSource<any>();
  constructor(
    private doctorService: DoctorService,
    public httpServiceService: HttpServiceService,
    private dialog: MatDialog,
    private labService: LabService,
    private confirmationService: ConfirmationService,
    private idrsScoreService: IdrsscoreService,
    public sanitizer: DomSanitizer,
    private testInVitalsService: TestInVitalsService,
    readonly sessionstorage: SessionStorageService,
  ) {}

  currentLabRowsPerPage = 5;
  currentLabActivePage = 1;
  previousLabRowsPerPage = 5;
  previousLabActivePage = 1;
  rotate = true;
  beneficiaryRegID: any;
  visitID: any;
  visitCategory: any;
  ngOnInit() {
    this.beneficiaryRegID = this.sessionstorage.getItem('beneficiaryRegID');
    this.visitID = this.sessionstorage.getItem('visitID');
    this.assignSelectedLanguage();
    this.testInVitalsService.clearVitalsRBSValueInReports();
    this.testInVitalsService.clearVitalsRBSValueInReportsInUpdate();
    this.visitCategory = this.sessionstorage.getItem('visitCategory');
    if (
      this.visitCategory.toLowerCase() ===
        'neonatal and infant health care services' ||
      this.visitCategory.toLowerCase() ===
        'childhood & adolescent healthcare services'
    ) {
      if (
        this.sessionstorage.getItem('referredVisitCode') === 'undefined' ||
        this.sessionstorage.getItem('referredVisitCode') === null ||
        this.sessionstorage.getItem('referredVisitCode') === ''
      ) {
        this.getTestResults(this.visitCategory);
      } else {
        this.getMMUTestResults(
          this.beneficiaryRegID,
          this.visitID,
          this.visitCategory,
        );
      }
    }

    this.testInVitalsService.vitalRBSTestResult$.subscribe((response) => {
      if (response.visitCode) {
        if (response.rbsTestResult) {
          this.vitalsRBSResp = null;
          this.vitalsRBSResp = {
            prescriptionID: null,
            procedureID: null,
            createdDate: response.createdDate,
            procedureName: 'RBS Test',
            procedureType: 'Laboratory',
            referredVisit: false,
            componentList: [
              {
                testResultValue: response.rbsTestResult,
                remarks: response.rbsTestRemarks,
                fileIDs: [null],
                testResultUnit: 'mg/dl',
                testComponentID: null,
                componentName: null,
              },
            ],
          };
        }

        if (
          this.sessionstorage.getItem('referredVisitCode') === 'undefined' ||
          this.sessionstorage.getItem('referredVisitCode') === null ||
          this.sessionstorage.getItem('referredVisitCode') === ''
        ) {
          this.getTestResults(this.visitCategory);
        } else {
          this.getMMUTestResults(
            this.beneficiaryRegID,
            this.visitID,
            this.visitCategory,
          );
        }
      }
    });

    this.testInVitalsService.vitalRBSTestResultInUpdate$.subscribe(
      (vitalsresp) => {
        this.checkRBSResultInVitalsUpdate(vitalsresp);
      },
    );
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
    if (this.testResultsSubscription)
      this.testResultsSubscription.unsubscribe();
  }

  checkRBSResultInVitalsUpdate(vitalsresp: any) {
    if (vitalsresp.rbsTestResult) {
      let vitalsRBSResponse = null;
      vitalsRBSResponse = {
        prescriptionID: null,
        procedureID: null,
        createdDate: vitalsresp.createdDate,
        procedureName: 'RBS Test',
        procedureType: 'Laboratory',
        referredVisit: false,
        componentList: [
          {
            testResultValue: vitalsresp.rbsTestResult,
            remarks: vitalsresp.rbsTestRemarks,
            fileIDs: [null],
            testResultUnit: 'mg/dl',
            testComponentID: null,
            componentName: null,
          },
        ],
      };

      this.labResults.forEach((element: any, index: any) => {
        if (
          element.procedureName === 'RBS Test' &&
          element.procedureID === null &&
          element.referredVisit === false
        )
          this.labResults.splice(index, 1);
      });
      this.labResults = [vitalsRBSResponse].concat(this.labResults);

      this.filteredLabResults.data = this.labResults;
      this.filteredLabResults.paginator = this.paginator;

      this.currentLabPageChanged({
        page: this.currentLabActivePage,
        itemsPerPage: this.currentLabRowsPerPage,
      });
    } else {
      this.labResults.forEach((element: any, index: any) => {
        if (
          element.procedureName === 'RBS Test' &&
          element.procedureID === null &&
          element.referredVisit === false
        )
          this.labResults.splice(index, 1);
      });

      this.filteredLabResults.data = this.labResults;
      this.filteredLabResults.paginator = this.paginator;

      this.currentLabPageChanged({
        page: this.currentLabActivePage,
        itemsPerPage: this.currentLabRowsPerPage,
      });
    }
  }

  labResults: any = [];
  radiologyResults: any = [];
  archivedResults: any = [];
  fetosenseData: any = [];
  testResultsSubscription!: Subscription;
  getTestResults(visitCategory: any) {
    this.testResultsSubscription =
      this.doctorService.populateCaserecordResponse$.subscribe((res) => {
        console.log('response archive', res);
        if (res && res.statusCode === 200 && res.data) {
          console.log('labresult', res.data.LabReport);
          this.labResults = res.data.LabReport.filter((lab: any) => {
            return lab.procedureType === 'Laboratory';
          });
          this.filteredLabResults.data = this.labResults;
          this.filteredLabResults.paginator = this.paginator;

          if (visitCategory === 'NCD screening') {
            this.filteredLabResults.paginator = this.paginator;
            this.filteredLabResults.data.forEach((element: any) => {
              if (element.procedureName === environment.RBSTest) {
                return element.componentList.forEach((element1: any) => {
                  if (element1.stripsNotAvailable === true) {
                    this.idrsScoreService.setReferralSuggested();
                  }
                });
              }
            });
          }
          console.log('stripsNotAvailable', this.filteredLabResults);

          if (this.vitalsRBSResp) {
            this.labResults = [this.vitalsRBSResp].concat(this.labResults);
          }

          this.filteredLabResults.data = this.labResults;
          this.filteredLabResults.paginator = this.paginator;

          this.radiologyResults = res.data.LabReport.filter(
            (radiology: any) => {
              return radiology.procedureType === 'Radiology';
            },
          );
          this.archivedResults = res.data.ArchivedVisitcodeForLabResult;
          this.currentLabPageChanged({
            page: this.currentLabActivePage,
            itemsPerPage: this.currentLabRowsPerPage,
          });

          this.fetosenseData = res.data.fetosenseData;
        }
      });
  }

  getMMUTestResults(beneficiaryRegID: any, visitID: any, visitCategory: any) {
    let labTestArray = [];
    let mmulabResults = [];
    let mmulabResultsRef = [];
    let respObj;
    //Calling TM Reports
    const doctorCasesheetData =
      this.doctorService.getMMUCaseRecordAndReferDetails(
        beneficiaryRegID,
        visitID,
        visitCategory,
        this.sessionstorage.getItem('visitCode'),
      );
    if (doctorCasesheetData) {
      doctorCasesheetData.subscribe((res: any) => {
        console.log('response archive', res);
        if (
          res !== undefined &&
          res !== null &&
          res.statusCode === 200 &&
          res.data
        ) {
          console.log('labresult', res.data.LabReport);
          mmulabResults = res.data.LabReport.filter((lab: any) => {
            return lab.procedureType === 'Laboratory';
          });
          this.filteredLabResults.data = mmulabResults;
          this.filteredLabResults.paginator = this.paginator;

          //Calling MMU Reports
          this.testMMUResultsSubscription = this.doctorService
            .getMMUCaseRecordAndReferDetails(
              beneficiaryRegID,
              this.sessionstorage.getItem('referredVisitID'),
              visitCategory,
              this.sessionstorage.getItem('referredVisitCode'),
            )
            .subscribe((response: any) => {
              if (response && response.statusCode === 200 && response.data) {
                mmulabResultsRef = response.data.LabReport.filter(
                  (lab: any) => {
                    return lab.procedureType === 'Laboratory';
                  },
                );
                labTestArray = mmulabResultsRef;

                // for (
                //   let i = 0, j = this.filteredLabResults.data.length;
                //   i < labTestArray.length;
                //   i++, j++
                // ) {
                //   this.filteredLabResults.data[j] = labTestArray[i];
                // }
                // console.log('labTestArray', labTestArray);

                this.labResults = this.filteredLabResults.data;

                if (visitCategory === 'NCD screening') {
                  this.filteredLabResults.paginator = this.paginator;
                  this.filteredLabResults.data.forEach((element: any) => {
                    if (element.procedureName === environment.RBSTest) {
                      return element.componentList.forEach((element1: any) => {
                        if (element1.stripsNotAvailable === true) {
                          this.idrsScoreService.setReferralSuggested();
                        }
                      });
                    }
                  });
                }
                console.log('stripsNotAvailable', this.filteredLabResults);

                if (this.vitalsRBSResp) {
                  // this.labResults.push(this.vitalsRBSResp);
                  this.labResults = [this.vitalsRBSResp].concat(
                    this.labResults,
                  );
                }

                this.filteredLabResults.data = this.labResults;
                this.filteredLabResults.paginator = this.paginator;

                this.radiologyResults = res.data.LabReport.filter(
                  (radiology: any) => {
                    return radiology.procedureType === 'Radiology';
                  },
                );

                const radiologyResponse = response.data.LabReport.filter(
                  (radiology: any) => {
                    return radiology.procedureType === 'Radiology';
                  },
                );

                for (
                  let i = 0, j = this.radiologyResults.length;
                  i < radiologyResponse.length;
                  i++, j++
                ) {
                  this.radiologyResults[j] = radiologyResponse[i];
                }

                this.archivedResults = res.data.ArchivedVisitcodeForLabResult;
                const archivedResponse =
                  response.data.ArchivedVisitcodeForLabResult;

                for (
                  let i = 0, j = this.archivedResults.length;
                  i < archivedResponse.length;
                  i++, j++
                ) {
                  this.archivedResults[j] = archivedResponse[i];
                }

                this.currentLabPageChanged({
                  page: this.currentLabActivePage,
                  itemsPerPage: this.currentLabRowsPerPage,
                });

                this.getGeneralVitalsData(beneficiaryRegID, visitID);
              }
            });
        }
      });
    }
  }

  getGeneralVitalsData(beneficiaryRegID: any, visitID: any) {
    this.doctorService
      .getGenericVitalsForMMULabReport({
        benRegID: beneficiaryRegID,
        benVisitID: visitID,
      })
      .subscribe((vitalsData: any) => {
        if (vitalsData.benPhysicalVitalDetail) {
          if (vitalsData.benPhysicalVitalDetail.rbsTestResult) {
            let vitalsRBSResponse = null;
            vitalsRBSResponse = {
              prescriptionID: null,
              procedureID: null,
              createdDate: vitalsData.benPhysicalVitalDetail.createdDate,
              procedureName: 'RBS Test',
              procedureType: 'Laboratory',
              referredVisit: true,
              componentList: [
                {
                  testResultValue:
                    vitalsData.benPhysicalVitalDetail.rbsTestResult,
                  remarks: vitalsData.benPhysicalVitalDetail.rbsTestRemarks,
                  fileIDs: [null],
                  testResultUnit: 'mg/dl',
                  testComponentID: null,
                  componentName: null,
                },
              ],
            };

            this.labResults = [vitalsRBSResponse].concat(this.labResults);
            this.filteredLabResults.data = this.labResults;
            this.filteredLabResults.paginator = this.paginator;

            this.currentLabPageChanged({
              page: this.currentLabActivePage,
              itemsPerPage: this.currentLabRowsPerPage,
            });
          }
        }
      });
  }

  // filteredLabResults: any = [];
  filterProcedures(searchTerm?: string) {
    if (!searchTerm) {
      this.filteredLabResults.data = this.labResults;
      this.filteredLabResults.paginator = this.paginator;
    } else {
      this.filteredLabResults.data = [];
      this.filteredLabResults.paginator = this.paginator;
      this.labResults.forEach((item: any) => {
        const value: string = '' + item.procedureName;
        if (value.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0) {
          this.filteredLabResults.data.push(item);
        }
      });
    }

    this.currentLabActivePage = 1;
    this.currentLabPageChanged({
      page: 1,
      itemsPerPage: this.currentLabRowsPerPage,
    });
  }
  currentLabPagedList: any = [];
  currentLabPageChanged(event: any): void {
    console.log('called', event);
    const startItem = (event.page - 1) * event.itemsPerPage;
    const endItem = event.page * event.itemsPerPage;
    this.currentLabPagedList = this.filteredLabResults.data.slice(
      startItem,
      endItem,
    );
    console.log('list', this.currentLabPagedList);
  }

  showTestResult(fileIDs: any) {
    const ViewTestReport = this.dialog.open(
      ViewRadiologyUploadedFilesComponent,
      {
        width: '40%',
        data: {
          filesDetails: fileIDs,
          panelClass: 'dialog-width',
          disableClose: false,
        },
      },
    );
    ViewTestReport.afterClosed().subscribe((result) => {
      if (result) {
        const fileID = {
          fileID: result,
        };
        this.labService.viewFileContent(fileID).subscribe(
          (res: any) => {
            if (res.data.statusCode === 200) {
              const fileContent = res.data.data.response;
              window.open(fileContent, '_blank');
            }
          },
          (err: any) => {
            this.confirmationService.alert(err.errorMessage, 'err');
          },
        );
      }
    });
  }
  enableArchiveView = false;
  archivedLabResults: any = [];
  filteredArchivedLabResults: any = [];
  archivedRadiologyResults: any = [];
  visitedDate: any;
  visitCode: any;
  showArchivedTestResult(visitCode: any) {
    const archivedReport = {
      beneficiaryRegID: this.sessionstorage.getItem('beneficiaryRegID'),
      visitCode: visitCode.visitCode,
    };
    this.doctorService
      .getArchivedReports(archivedReport)
      .subscribe((response: any) => {
        if (response.statusCode === 200) {
          this.archivedLabResults = response.data.filter((lab: any) => {
            return lab.procedureType === 'Laboratory';
          });
          this.filteredArchivedLabResults = this.archivedLabResults;
          this.previousLabPageChanged({
            page: this.previousLabActivePage,
            itemsPerPage: this.previousLabRowsPerPage,
          });
          this.archivedRadiologyResults = response.data.filter(
            (radiology: any) => {
              return radiology.procedureType === 'Radiology';
            },
          );
          this.enableArchiveView = true;
          this.visitedDate = visitCode.date;
          this.visitCode = visitCode.visitCode;
        }
      });
  }

  filterArchivedProcedures(searchTerm?: string) {
    if (!searchTerm) {
      this.filteredArchivedLabResults = this.archivedLabResults;
    } else {
      this.filteredArchivedLabResults = [];
      this.archivedLabResults.forEach((item: any) => {
        const value: string = '' + item.procedureName;
        if (value.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0) {
          this.filteredArchivedLabResults.push(item);
        }
      });
    }

    this.previousLabActivePage = 1;
    this.previousLabPageChanged({
      page: 1,
      itemsPerPage: this.previousLabRowsPerPage,
    });
  }

  previousLabPagedList: any = [];
  previousLabPageChanged(event: any): void {
    console.log('called', event);
    const startItem = (event.page - 1) * event.itemsPerPage;
    const endItem = event.page * event.itemsPerPage;
    this.previousLabPagedList = this.filteredArchivedLabResults.slice(
      startItem,
      endItem,
    );
    console.log('list', this.previousLabPagedList);
  }

  showArchivedRadiologyTestResult(radiologyReport: any) {
    console.log('reports', radiologyReport);
    const ViewTestReport = this.dialog.open(ViewTestReportComponent, {
      data: radiologyReport,
      width: 0.8 * window.innerWidth + 'px',
      panelClass: 'dialog-width',
      disableClose: false,
    });
  }

  resetArchived() {
    console.log('hwere');

    this.archivedLabResults = [];
    this.filteredArchivedLabResults = [];
    this.archivedRadiologyResults = [];
    this.visitCode = null;
    this.visitedDate = null;
    this.enableArchiveView = false;
    this.previousLabPagedList = [];
  }
  fetosenseView: Array<{ name: string; value: number }> = [];
  showFetosenseReport(fetosenseDataToshow: any) {
    this.fetosenseView = [];
    this.enableFetosenseView = true;
    this.fetosenseDataToView = fetosenseDataToshow;

    this.fetosenseTestName = fetosenseDataToshow.testName;

    this.amritFilePath = fetosenseDataToshow.aMRITFilePath;

    this.imgUrl = undefined;

    this.fetosenseView.push({
      name: 'Duration',
      value: fetosenseDataToshow.lengthOfTest,
    });
    this.fetosenseView.push({
      name: 'Mother Name',
      value: fetosenseDataToshow.partnerName,
    });
    this.fetosenseView.push({
      name: 'Mother LMP Date',
      value: fetosenseDataToshow.motherLMPDate,
    });
    this.fetosenseView.push({
      name: 'Basel Heart Rate ',
      value: fetosenseDataToshow.basalHeartRate,
    });
    this.fetosenseView.push({
      name: 'Test ID',
      value: fetosenseDataToshow.testId,
    });
    this.fetosenseView.push({
      name: 'Device ID',
      value: fetosenseDataToshow.deviceId,
    });
  }
  getTestName(foetalMonitorTestId: any) {}
  showFetosenseGraph() {
    let content = undefined;
    const reportPath = this.amritFilePath;
    const obj = {
      aMRITFilePath: reportPath,
    };
    this.doctorService.getReportsBase64(obj).subscribe(
      (response: any) => {
        if (response.statusCode === 200) {
          content = response.data.response;
          if (content !== undefined) {
            const byteCharacters = atob(content);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob1 = new Blob([byteArray], {
              type: 'application/pdf;base64',
            });
            const fileURL = URL.createObjectURL(blob1);
            this.imgUrl =
              this.sanitizer.bypassSecurityTrustResourceUrl(fileURL);
          }
        } else this.confirmationService.alert(response.errorMessage, 'error');
      },
      (err) => {
        this.confirmationService.alert(err, 'error');
      },
    );
  }
}
