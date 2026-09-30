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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, of } from 'rxjs';

import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  createDialogRefMock,
  throwingObs,
} from 'src/testing/test-utils';
import { LabService } from 'src/app/app-modules/lab/shared/services';
import { ViewRadiologyUploadedFilesComponent } from 'src/app/app-modules/lab/view-radiology-uploaded-files/view-radiology-uploaded-files.component';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { DoctorService } from '../../../shared/services';
import { IdrsscoreService } from '../../../shared/services/idrsscore.service';
import { TestInVitalsService } from '../../../shared/services/test-in-vitals.service';
import { ViewTestReportComponent } from './view-test-report/view-test-report.component';
import { TestAndRadiologyComponent } from './test-and-radiology.component';

const lab = (name: string, extra: any = {}) => ({
  procedureName: name,
  procedureType: 'Laboratory',
  procedureID: 1,
  referredVisit: false,
  componentList: [],
  ...extra,
});
const radiology = (name: string) => ({
  procedureName: name,
  procedureType: 'Radiology',
});

describe('TestAndRadiologyComponent', () => {
  let component: TestAndRadiologyComponent;
  let fixture: ComponentFixture<TestAndRadiologyComponent>;
  let caseRecord$: BehaviorSubject<any>;
  let doctor: any;
  let labService: any;
  let idrs: any;
  let confirm: any;
  let dialog: any;
  let vitals: TestInVitalsService;

  async function setup(sessionValues: Record<string, any> = {}) {
    caseRecord$ = new BehaviorSubject<any>(null);
    doctor = autoSpy(DoctorService, {
      populateCaserecordResponse$: caseRecord$.asObservable(),
    });
    labService = autoSpy(LabService);
    idrs = autoSpy(IdrsscoreService);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [TestAndRadiologyComponent],
      providers: [
        ...commonTestProviders({
          session: {
            beneficiaryRegID: 'BR',
            visitID: 'V',
            visitCategory: 'General OPD',
            ...sessionValues,
          },
        }),
        { provide: DoctorService, useValue: doctor },
        { provide: LabService, useValue: labService },
        { provide: IdrsscoreService, useValue: idrs },
        TestInVitalsService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    spyOn(console, 'log');
    fixture = TestBed.createComponent(TestAndRadiologyComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    vitals = TestBed.inject(TestInVitalsService);
  }

  afterEach(() => fixture?.destroy());

  describe('ngOnInit', () => {
    it('sets ids, language and clears vitals RBS values', async () => {
      await setup();
      spyOn(vitals, 'clearVitalsRBSValueInReports').and.callThrough();
      spyOn(vitals, 'clearVitalsRBSValueInReportsInUpdate').and.callThrough();
      fixture.detectChanges();
      expect(component.beneficiaryRegID).toBe('BR');
      expect(component.visitID).toBe('V');
      expect(component.current_language_set).toEqual(LANGUAGE_EN);
      expect(vitals.clearVitalsRBSValueInReports).toHaveBeenCalled();
      expect(vitals.clearVitalsRBSValueInReportsInUpdate).toHaveBeenCalled();
      expect(component.testResultsSubscription).toBeUndefined();
    });

    it('fetches test results directly for neonatal visits without referral', async () => {
      await setup({
        visitCategory: 'Neonatal and Infant Health Care Services',
        referredVisitCode: 'undefined',
      });
      component.ngOnInit();
      expect(component.testResultsSubscription).toBeDefined();
    });

    it('fetches MMU results for childhood visits with referral', async () => {
      await setup({
        visitCategory: 'Childhood & Adolescent Healthcare Services',
        referredVisitCode: 'RVC',
      });
      doctor.getMMUCaseRecordAndReferDetails.and.returnValue(undefined);
      component.ngOnInit();
      expect(doctor.getMMUCaseRecordAndReferDetails).toHaveBeenCalledWith(
        'BR',
        'V',
        'Childhood & Adolescent Healthcare Services',
        null,
      );
    });

    it('builds a vitals RBS row and refreshes results on RBS change', async () => {
      await setup({ referredVisitCode: '' });
      component.ngOnInit();
      vitals.setVitalsRBSValueInReports({
        visitCode: 'VC',
        rbsTestResult: 120,
        rbsTestRemarks: 'ok',
        createdDate: 'd',
      });
      expect(component.vitalsRBSResp.componentList[0].testResultValue).toBe(
        120,
      );
      expect(component.vitalsRBSResp.referredVisit).toBeFalse();
      caseRecord$.next({
        statusCode: 200,
        data: {
          LabReport: [lab('Hb'), radiology('XRay')],
          ArchivedVisitcodeForLabResult: [{ visitCode: 1 }],
          fetosenseData: [{ f: 1 }],
        },
      });
      expect(component.labResults.map((l: any) => l.procedureName)).toEqual([
        'RBS Test',
        'Hb',
      ]);
      expect(component.radiologyResults.length).toBe(1);
      expect(component.archivedResults).toEqual([{ visitCode: 1 }]);
      expect(component.fetosenseData).toEqual([{ f: 1 }]);
      expect(component.currentLabPagedList.length).toBe(2);
    });

    it('refreshes MMU results on RBS change for referred visits', async () => {
      await setup({ referredVisitCode: 'RVC' });
      doctor.getMMUCaseRecordAndReferDetails.and.returnValue(undefined);
      component.ngOnInit();
      vitals.setVitalsRBSValueInReports({ visitCode: 'VC' });
      expect(component.vitalsRBSResp).toBeNull();
      expect(doctor.getMMUCaseRecordAndReferDetails).toHaveBeenCalled();
    });

    it('handles RBS update from vitals', async () => {
      await setup();
      component.ngOnInit();
      component.labResults = [
        lab('RBS Test', { procedureID: null }),
        lab('Hb'),
      ];
      vitals.setVitalsRBSValueInReportsInUpdate({
        rbsTestResult: 99,
        createdDate: 'd',
      });
      expect(component.labResults.length).toBe(2);
      expect(component.labResults[0].componentList[0].testResultValue).toBe(99);
      expect(component.filteredLabResults.data).toBe(component.labResults);

      vitals.setVitalsRBSValueInReportsInUpdate({ rbsTestResult: null });
      expect(component.labResults.map((l: any) => l.procedureName)).toEqual([
        'Hb',
      ]);
    });
  });

  describe('getTestResults', () => {
    beforeEach(async () => setup());

    it('suggests referral for NCD screening when RBS strips are unavailable', () => {
      component.getTestResults('NCD screening');
      caseRecord$.next({
        statusCode: 200,
        data: {
          LabReport: [
            lab('RBS Test', {
              componentList: [
                { stripsNotAvailable: true },
                { stripsNotAvailable: false },
              ],
            }),
            lab('Hb'),
          ],
          ArchivedVisitcodeForLabResult: [],
        },
      });
      expect(idrs.setReferralSuggested).toHaveBeenCalledTimes(1);
      expect(component.labResults.length).toBe(2);
    });

    it('ignores empty responses', () => {
      component.getTestResults('General OPD');
      caseRecord$.next({ statusCode: 500 });
      expect(component.labResults).toEqual([]);
    });

    it('ngOnDestroy unsubscribes', () => {
      component.getTestResults('General OPD');
      const sub = component.testResultsSubscription;
      component.ngOnDestroy();
      expect(sub.closed).toBeTrue();
    });
  });

  describe('getMMUTestResults', () => {
    beforeEach(async () =>
      setup({
        visitCode: 'VC',
        referredVisitID: 'RVID',
        referredVisitCode: 'RVC',
      }),
    );

    it('merges current and referred visit results and adds vitals RBS rows', () => {
      component.vitalsRBSResp = lab('RBS Test', { procedureID: null });
      doctor.getMMUCaseRecordAndReferDetails.and.returnValues(
        of({
          statusCode: 200,
          data: {
            LabReport: [
              lab('RBS Test', {
                componentList: [{ stripsNotAvailable: true }],
              }),
              radiology('XRay'),
            ],
            ArchivedVisitcodeForLabResult: [{ visitCode: 1 }],
          },
        }),
        of({
          statusCode: 200,
          data: {
            LabReport: [lab('Hb'), radiology('CT')],
            ArchivedVisitcodeForLabResult: [{ visitCode: 2 }],
          },
        }),
      );
      doctor.getGenericVitalsForMMULabReport.and.returnValue(
        of({
          benPhysicalVitalDetail: {
            rbsTestResult: 150,
            rbsTestRemarks: 'r',
            createdDate: 'c',
          },
        }),
      );
      component.getMMUTestResults('BR', 'V', 'NCD screening');

      expect(doctor.getMMUCaseRecordAndReferDetails).toHaveBeenCalledWith(
        'BR',
        'V',
        'NCD screening',
        'VC',
      );
      expect(doctor.getMMUCaseRecordAndReferDetails).toHaveBeenCalledWith(
        'BR',
        'RVID',
        'NCD screening',
        'RVC',
      );
      expect(idrs.setReferralSuggested).toHaveBeenCalled();
      expect(
        component.radiologyResults.map((r: any) => r.procedureName),
      ).toEqual(['XRay', 'CT']);
      expect(component.archivedResults).toEqual([
        { visitCode: 1 },
        { visitCode: 2 },
      ]);
      expect(doctor.getGenericVitalsForMMULabReport).toHaveBeenCalledWith({
        benRegID: 'BR',
        benVisitID: 'V',
      });
      expect(component.labResults.length).toBe(3);
      expect(component.labResults[0].referredVisit).toBeTrue();
      expect(component.labResults[0].componentList[0].testResultValue).toBe(
        150,
      );
    });

    it('stops when referred visit response fails', () => {
      doctor.getMMUCaseRecordAndReferDetails.and.returnValues(
        of({
          statusCode: 200,
          data: { LabReport: [lab('Hb')], ArchivedVisitcodeForLabResult: [] },
        }),
        of({ statusCode: 500 }),
      );
      component.getMMUTestResults('BR', 'V', 'General OPD');
      expect(component.filteredLabResults.data.length).toBe(1);
      expect(doctor.getGenericVitalsForMMULabReport).not.toHaveBeenCalled();
    });

    it('ignores a failed current visit response', () => {
      doctor.getMMUCaseRecordAndReferDetails.and.returnValue(of(null));
      component.getMMUTestResults('BR', 'V', 'General OPD');
      expect(doctor.getMMUCaseRecordAndReferDetails).toHaveBeenCalledTimes(1);
    });

    it('getGeneralVitalsData ignores missing RBS values', () => {
      doctor.getGenericVitalsForMMULabReport.and.returnValues(
        of({}),
        of({ benPhysicalVitalDetail: { rbsTestResult: null } }),
      );
      component.getGeneralVitalsData('BR', 'V');
      component.getGeneralVitalsData('BR', 'V');
      expect(component.labResults).toEqual([]);
    });
  });

  describe('filters and paging', () => {
    beforeEach(async () => setup());

    it('filterProcedures filters lab results by name', () => {
      component.labResults = [lab('Hb'), lab('RBS Test'), lab('HbA1c')];
      component.filterProcedures('hb');
      expect(component.filteredLabResults.data.length).toBe(2);
      expect(component.currentLabActivePage).toBe(1);
      component.filterProcedures();
      expect(component.filteredLabResults.data.length).toBe(3);
      expect(component.currentLabPagedList.length).toBe(3);
    });

    it('filterArchivedProcedures filters archived results and pages them', () => {
      component.archivedLabResults = [lab('Hb'), lab('RBS')];
      component.filterArchivedProcedures('rb');
      expect(component.filteredArchivedLabResults.length).toBe(1);
      expect(component.previousLabPagedList.length).toBe(1);
      component.filterArchivedProcedures('');
      expect(component.previousLabPagedList.length).toBe(2);
    });
  });

  describe('archived reports', () => {
    beforeEach(async () => setup());

    it('showArchivedTestResult loads archived lab and radiology results', () => {
      doctor.getArchivedReports.and.returnValue(
        of({ statusCode: 200, data: [lab('Hb'), radiology('XRay')] }),
      );
      component.showArchivedTestResult({ visitCode: 'OLD', date: 'D' });
      expect(doctor.getArchivedReports).toHaveBeenCalledWith({
        beneficiaryRegID: 'BR',
        visitCode: 'OLD',
      });
      expect(component.archivedLabResults.length).toBe(1);
      expect(component.archivedRadiologyResults.length).toBe(1);
      expect(component.enableArchiveView).toBeTrue();
      expect(component.visitedDate).toBe('D');
      expect(component.visitCode).toBe('OLD');
    });

    it('showArchivedTestResult ignores failures', () => {
      doctor.getArchivedReports.and.returnValue(of({ statusCode: 500 }));
      component.showArchivedTestResult({ visitCode: 'OLD' });
      expect(component.enableArchiveView).toBeFalse();
    });

    it('resetArchived clears archive state', () => {
      component.archivedLabResults = [1];
      component.enableArchiveView = true;
      component.visitCode = 'x';
      component.previousLabPagedList = [1];
      component.resetArchived();
      expect(component.archivedLabResults).toEqual([]);
      expect(component.filteredArchivedLabResults).toEqual([]);
      expect(component.archivedRadiologyResults).toEqual([]);
      expect(component.enableArchiveView).toBeFalse();
      expect(component.visitCode).toBeNull();
      expect(component.visitedDate).toBeNull();
      expect(component.previousLabPagedList).toEqual([]);
    });

    it('showArchivedRadiologyTestResult opens the report dialog', () => {
      component.showArchivedRadiologyTestResult({ r: 1 });
      expect(dialog.open).toHaveBeenCalledWith(ViewTestReportComponent, {
        data: { r: 1 },
        width: 0.8 * window.innerWidth + 'px',
        panelClass: 'dialog-width',
        disableClose: false,
      });
    });
  });

  describe('showTestResult', () => {
    beforeEach(async () => setup());

    it('opens the file in a new tab when a file is chosen', () => {
      dialog.open.and.returnValue(createDialogRefMock(9));
      labService.viewFileContent.and.returnValue(
        of({ data: { statusCode: 200, data: { response: 'http://file' } } }),
      );
      const open = spyOn(window, 'open');
      component.showTestResult([9]);
      expect(dialog.open).toHaveBeenCalledWith(
        ViewRadiologyUploadedFilesComponent,
        {
          width: '40%',
          data: {
            filesDetails: [9],
            panelClass: 'dialog-width',
            disableClose: false,
          },
        },
      );
      expect(labService.viewFileContent).toHaveBeenCalledWith({ fileID: 9 });
      expect(open).toHaveBeenCalledWith('http://file', '_blank');
    });

    it('does not open when content status fails, alerts on error, skips when dismissed', () => {
      const open = spyOn(window, 'open');
      dialog.open.and.returnValue(createDialogRefMock(9));
      labService.viewFileContent.and.returnValue(
        of({ data: { statusCode: 500 } }),
      );
      component.showTestResult([9]);
      labService.viewFileContent.and.returnValue(
        throwingObs({ errorMessage: 'nope' }),
      );
      component.showTestResult([9]);
      expect(confirm.alert).toHaveBeenCalledWith('nope', 'err');
      dialog.open.and.returnValue(createDialogRefMock(undefined));
      labService.viewFileContent.calls.reset();
      component.showTestResult([9]);
      expect(labService.viewFileContent).not.toHaveBeenCalled();
      expect(open).not.toHaveBeenCalled();
    });
  });

  describe('fetosense', () => {
    beforeEach(async () => setup());

    it('showFetosenseReport builds the summary view', () => {
      component.showFetosenseReport({
        testName: 'NST',
        aMRITFilePath: '/p',
        lengthOfTest: 20,
        partnerName: 'M',
        motherLMPDate: 'L',
        basalHeartRate: 140,
        testId: 'T',
        deviceId: 'D',
      });
      expect(component.enableFetosenseView).toBeTrue();
      expect(component.fetosenseTestName).toBe('NST');
      expect(component.amritFilePath).toBe('/p');
      expect(component.imgUrl).toBeUndefined();
      expect(component.fetosenseView.map((f) => f.value)).toEqual([
        20,
        'M',
        'L',
        140,
        'T',
        'D',
      ] as any);
      expect(component.getTestName(1)).toBeUndefined();
    });

    it('showFetosenseGraph converts base64 PDF to a trusted URL', () => {
      const create = spyOn(URL, 'createObjectURL').and.returnValue('blob:x');
      component.amritFilePath = '/p';
      doctor.getReportsBase64.and.returnValue(
        of({ statusCode: 200, data: { response: btoa('%PDF') } }),
      );
      component.showFetosenseGraph();
      expect(doctor.getReportsBase64).toHaveBeenCalledWith({
        aMRITFilePath: '/p',
      });
      expect(create).toHaveBeenCalled();
      expect(component.imgUrl).toBeTruthy();
    });

    it('showFetosenseGraph skips undefined content, alerts on status error and failure', () => {
      const create = spyOn(URL, 'createObjectURL');
      doctor.getReportsBase64.and.returnValue(
        of({ statusCode: 200, data: {} }),
      );
      component.showFetosenseGraph();
      expect(create).not.toHaveBeenCalled();
      doctor.getReportsBase64.and.returnValue(
        of({ statusCode: 500, errorMessage: 'bad' }),
      );
      component.showFetosenseGraph();
      expect(confirm.alert).toHaveBeenCalledWith('bad', 'error');
      doctor.getReportsBase64.and.returnValue(throwingObs('x'));
      component.showFetosenseGraph();
      expect(confirm.alert).toHaveBeenCalledWith('x', 'error');
    });
  });

  it('ngDoCheck re-assigns language', async () => {
    await setup();
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });
});
