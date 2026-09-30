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
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { FormArray, FormGroup } from '@angular/forms';
import { of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { LabService, MasterDataService } from '../shared/services';
import { ViewRadiologyUploadedFilesComponent } from '../view-radiology-uploaded-files/view-radiology-uploaded-files.component';
import { ViewFileComponent } from '../view-file/view-file.component';
import { IotcomponentComponent } from '../../core/components/iotcomponent/iotcomponent.component';
import { WorkareaComponent } from './workarea.component';

describe('Lab WorkareaComponent', () => {
  let component: WorkareaComponent;
  let fixture: ComponentFixture<WorkareaComponent>;
  let lab: any;
  let master: any;
  let confirm: any;
  let session: any;
  let dialog: any;
  let router: Router;

  const LANG = LANGUAGE_EN;

  const testData = () => ({
    laboratoryList: [
      {
        procedureType: 'Laboratory',
        procedureName: 'RBS Test',
        procedureID: 1,
        prescriptionID: 100,
        procedureStartAPI: 'start',
        compListDetails: [
          {
            inputType: 'TextBox',
            testComponentID: 11,
            measurementUnit: 'mg/dl',
            range_min: 10,
            range_max: 500,
            range_normal_min: 70,
            range_normal_max: 140,
            isDecimal: true,
            componentCode: 'C1',
          },
          {
            inputType: 'RadioButton',
            testComponentID: 12,
            componentCode: 'C2',
            compOpt: [{ name: 'Pos' }, { name: 'Neg' }],
          },
        ],
      },
      {
        procedureType: 'Laboratory',
        procedureName: 'HB',
        procedureID: 2,
        prescriptionID: 101,
        compListDetails: [
          {
            inputType: 'TextBox',
            testComponentID: 21,
            range_min: 1,
            range_max: 20,
            isDecimal: false,
          },
        ],
      },
    ],
    radiologyList: [
      {
        procedureType: 'Radiology',
        procedureName: 'X-Ray',
        procedureID: 3,
        prescriptionID: 102,
        gender: 'unisex',
        compDetails: {
          inputType: 'File',
          compOpt: 'x',
          testComponentID: 31,
          remarks: 'r',
        },
      },
      {
        procedureType: 'Radiology',
        procedureName: 'USG',
        procedureID: 4,
        prescriptionID: 103,
        compDetails: { testComponentID: 41 },
      },
    ],
    externalTests: { tests: 'ext' },
    archive: [
      { procedureType: 'Radiology', procedureName: 'Old X-Ray' },
      { procedureType: 'Laboratory', procedureName: 'Old CBC' },
      { procedureType: 'Laboratory', procedureName: 'Old HB' },
    ],
  });

  const sessionSeed = {
    visitID: 5,
    visitCode: 6,
    beneficiaryRegID: 7,
    beneficiaryID: 8,
    benFlowID: 9,
    userName: 'tech',
    userID: 1,
    providerServiceID: 2,
    doctorFlag: 1,
    nurseFlag: 2,
    specialist_flag: 'null',
    serviceLineDetails: JSON.stringify({
      facilityID: 3,
      parkingPlaceID: 4,
      vanID: 10,
    }),
  };

  async function setup(seed: any = sessionSeed, data: any = testData()) {
    lab = autoSpy(LabService);
    master = autoSpy(MasterDataService);
    master.getLabRequirements.and.returnValue(of({ statusCode: 200, data }));
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [WorkareaComponent],
      providers: [
        ...commonTestProviders({ session: seed }),
        { provide: LabService, useValue: lab },
        { provide: MasterDataService, useValue: master },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(WorkareaComponent, '')
      .compileComponents();
    fixture = TestBed.createComponent(WorkareaComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService) as any;
    session = TestBed.inject(SessionStorageService) as any;
    dialog = TestBed.inject(MatDialog) as any;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();
  }

  const dialogReturning = (result: any) =>
    dialog.open.and.returnValue({ afterClosed: () => of(result) });

  describe('initialisation', () => {
    beforeEach(async () => setup());

    it('reads session, loads tests and merges forms', () => {
      expect(component.currentLanguageSet).toEqual(LANG);
      expect(component.visitID).toBe(5);
      expect(component.testName).toBe('RBS Test');
      expect(component.stepExpand).toBe(0);
      expect(master.getLabRequirements).toHaveBeenCalledWith(7, 5, 6);
      expect(component.labTechnicianData().length).toBe(2);
      expect(component.technicianForm.get('radiologyForm')).toBe(
        component.radiologyForm,
      );
      expect(component.externalForm.value).toEqual({ tests: 'ext' });
    });

    it('patches text box and select components', () => {
      const comps = (component.labForm.at(0) as FormGroup).get(
        'compListDetails',
      ) as FormArray;
      expect(comps.length).toBe(2);
      expect(comps.at(0).value.allowText).toBe('decimal');
      expect(comps.at(0).value.measurementUnit).toBe('mg/dl');
      expect((comps.at(1).get('compOpt') as FormArray).value).toEqual([
        { name: 'Pos' },
        { name: 'Neg' },
      ]);
      const c2 = (
        (component.labForm.at(1) as FormGroup).get(
          'compListDetails',
        ) as FormArray
      ).at(0);
      expect(c2.value.allowText).toBe('number');
    });

    it('patches radiology procedures', () => {
      expect(component.radiologyForm.length).toBe(2);
      expect(component.radiologyForm.at(0).value.gender).toBe('unisex');
      expect(component.radiologyForm.at(0).value.compDetails.inputValue).toBe(
        'x',
      );
    });

    it('splits archive into radiology and laboratory lists', () => {
      expect(component.archiveList.length).toBe(3);
      expect(component.radiologyFile.length).toBe(1);
      expect(component.laboratoryData.length).toBe(2);
    });

    it('ngDoCheck re-assigns language', () => {
      component.currentLanguageSet = null;
      component.ngDoCheck();
      expect(component.currentLanguageSet).toEqual(LANG);
    });
  });

  describe('loading errors', () => {
    it('errors and redirects when session ids missing', async () => {
      await setup({});
      expect(master.getLabRequirements).not.toHaveBeenCalled();
      expect(confirm.alert).toHaveBeenCalledWith(component.loadingErrorMessage);
      expect(router.navigate).toHaveBeenCalledWith(['/lab/worklist']);
    });

    it('errors on http failure', async () => {
      await setup();
      master.getLabRequirements.and.returnValue(throwingObs());
      component.getTestRequirements();
      expect(router.navigate).toHaveBeenCalledWith(['/lab/worklist']);
    });

    it('silently ignores non-200', async () => {
      await setup();
      master.getLabRequirements.and.returnValue(of({ statusCode: 5000 }));
      component.getTestRequirements();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('errors when lists missing in response', async () => {
      await setup();
      component.loadTests({ laboratoryList: [] });
      expect(router.navigate).toHaveBeenCalledWith(['/lab/worklist']);
    });

    it('handles empty lists and missing external/archive', async () => {
      await setup(sessionSeed, {
        laboratoryList: [],
        radiologyList: [],
      });
      expect(component.labForm).toBeUndefined();
      expect(component.radiologyForm).toBeUndefined();
      expect(component.externalForm).toBeUndefined();
      expect(component.archiveList).toEqual([]);
    });
  });

  describe('range checks', () => {
    beforeEach(async () => setup());
    const comp = (p: number, c: number) =>
      (
        (component.labForm.at(p) as FormGroup).get(
          'compListDetails',
        ) as FormArray
      ).at(c);

    it('checkNormalRange flags abnormal values', () => {
      comp(0, 0).patchValue({ inputValue: 200 });
      component.checkNormalRange(0, 0);
      expect(comp(0, 0).value.abnormal).toBeTrue();
      comp(0, 0).patchValue({ inputValue: 50 });
      component.checkNormalRange(0, 0);
      expect(comp(0, 0).value.abnormal).toBeTrue();
    });

    it('checkNormalRange clears abnormal for normal values', () => {
      comp(0, 0).patchValue({ inputValue: 100 });
      component.checkNormalRange(0, 0);
      expect(comp(0, 0).value.abnormal).toBeFalse();
    });

    it('checkNormalRange ignores empty values', () => {
      component.checkNormalRange(0, 0);
      expect(comp(0, 0).value.abnormal).toBeNull();
    });

    it('checkRange clears non numeric input (decimal)', () => {
      comp(0, 0).patchValue({ inputValue: 'abc' });
      component.checkRange(0, 0);
      expect(comp(0, 0).value.inputValue).toBe('');
    });

    it('checkRange clears decimal for integer-only component', () => {
      comp(1, 0).patchValue({ inputValue: '1.5' });
      component.checkRange(1, 0);
      expect(comp(1, 0).value.inputValue).toBe('');
    });

    it('checkRange clears and alerts out of range values', () => {
      comp(1, 0).patchValue({ inputValue: '50' });
      component.checkRange(1, 0);
      expect(comp(1, 0).value.inputValue).toBe('');
      expect(confirm.alert).toHaveBeenCalledWith(
        LANG.alerts.info.valueDetails + ' 1 to 20',
      );
    });

    it('checkRange keeps valid in-range value', () => {
      comp(0, 0).patchValue({ inputValue: '12.5' });
      component.checkRange(0, 0);
      expect(comp(0, 0).value.inputValue).toBe('12.5');
      expect(confirm.alert).not.toHaveBeenCalled();
    });

    it('onStripsCheckBox toggles stripSelected and clears value', () => {
      comp(0, 0).patchValue({ inputValue: '12' });
      component.onStripsCheckBox({ checked: true }, 0, 0);
      expect(component.stripSelected).toBeFalse();
      expect(comp(0, 0).value.inputValue).toBe('');
      const arr = (component.labForm.at(0) as FormGroup).get(
        'compListDetails',
      ) as FormArray;
      expect(arr.hasValidator).toBeDefined();
      component.onStripsCheckBox({ checked: false }, 0, 0);
      expect(component.stripSelected).toBeTrue();
    });
  });

  describe('file upload', () => {
    beforeEach(async () => setup());

    const ev = (files: any[]) => ({ target: { files } });

    it('ignores empty file list', () => {
      component.uploadFile(ev([]), 3);
      expect(component.fileIndex).toBe(3);
      expect(confirm.alert).not.toHaveBeenCalled();
    });

    it('rejects invalid file name', () => {
      component.uploadFile(ev([{ name: '.pdf', size: 1 }]), 3);
      expect(confirm.alert).toHaveBeenCalledWith(LANG.invalidFileName, 'error');
    });

    it('rejects invalid extension', () => {
      component.uploadFile(ev([{ name: 'a.exe', size: 1 }]), 3);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANG.invalidFileExtensionSupportedFileFormats,
        'error',
      );
    });

    it('rejects oversize file', () => {
      component.uploadFile(ev([{ name: 'a.pdf', size: 6 * 1000 * 1000 }]), 3);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANG.fileSizeShouldNotExceed + ' 5 ' + LANG.mb,
        'error',
      );
    });

    it('reads a valid file and assigns file object', (done) => {
      const file = new File(['hello'], 'report.pdf', {
        type: 'application/pdf',
      });
      spyOn(component, 'assignFileObject').and.callFake(
        (idx: any, content: any): any => {
          expect(idx).toBe(3);
          expect(content).toContain('base64,');
          done();
          return undefined;
        },
      );
      component.uploadFile(ev([file]), 3);
    });

    it('checkExtension handles edge cases', () => {
      expect(component.checkExtension(null)).toBeTrue();
      expect(component.checkExtension({ name: 'a.b.pdf' })).toBeFalse();
      expect(component.checkExtension({ name: 'a.PNG' })).toBeTrue();
      expect(component.checkExtension({ name: 'a.zip' })).toBeFalse();
    });

    it('onLoadFileCallback forwards content', () => {
      const spy = spyOn(component, 'assignFileObject');
      component.fileIndex = 4;
      component.onLoadFileCallback({ currentTarget: { result: 'data:x,abc' } });
      expect(spy).toHaveBeenCalledWith(4, 'data:x,abc');
    });

    it('assignFileObject builds the upload payload', () => {
      component.file = { name: 'a.pdf' };
      component.assignFileObject(3, 'data:x,QUJD');
      expect(component.fileObj[3]).toEqual([
        {
          fileName: 'a.pdf',
          fileExtension: '.pdf',
          providerServiceMapID: 2,
          userID: 1,
          fileContent: 'QUJD',
          createdBy: 'tech',
          vanID: 10,
          isUploaded: false,
        },
      ]);
      component.file = { name: 'b.pdf' };
      component.assignFileObject(3, 'data:x,Qg==');
      expect(component.fileObj[3].length).toBe(2);
      component.assignFileObject(4, undefined);
      expect(component.fileObj[4][0].fileContent).toBe('');
    });

    it('assignFileObject defaults when no file and no service line', () => {
      session.store.delete('serviceLineDetails');
      component.file = undefined;
      component.assignFileObject(1, 'a,b');
      expect(component.fileObj[1][0].fileName).toBe('');
      expect(component.fileObj[1][0].fileExtension).toBe('');
      expect(component.fileObj[1][0].vanID).toBeUndefined();
    });

    it('assignFileObject returns true when entry fileName matches', () => {
      component.file = { name: 'a.pdf' };
      component.fileObj = { 3: Object.assign([], { fileName: 'a.pdf' }) };
      expect(component.assignFileObject(3, 'x,y')).toBeTrue();
      expect(component.fileObj[3].length).toBe(0);
    });
  });

  describe('saveUploadDetails / saveFileData', () => {
    beforeEach(async () => setup());

    it('alerts when nothing selected', () => {
      component.saveUploadDetails('3');
      expect(confirm.alert).toHaveBeenCalledWith(
        LANG.alerts.info.selectNewFile,
        'info',
      );
    });

    it('alerts when fileObj has no entries for procedure', () => {
      component.fileObj = { '3': [] };
      component.saveUploadDetails('3');
      expect(confirm.alert).toHaveBeenCalledWith(
        LANG.alerts.info.selectNewFile,
        'info',
      );
      expect(lab.saveFile).not.toHaveBeenCalled();
    });

    it('uploads first files and marks them uploaded', () => {
      component.fileObj = { '3': [{ fileName: 'a', isUploaded: false }] };
      lab.saveFile.and.returnValue(
        of({ statusCode: 200, data: [{ kmFileManagerID: 55 }] }),
      );
      component.saveUploadDetails('3');
      expect(lab.saveFile).toHaveBeenCalledWith(component.fileObj['3']);
      expect(component.savedFileData['3']).toEqual([
        { kmFileManagerID: 55, isUploaded: true },
      ]);
      expect(component.fileObj['3'][0].isUploaded).toBeTrue();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANG.alerts.info.successMsg,
        'success',
      );
    });

    it('uploads only new (not yet uploaded) files', () => {
      component.fileObj = {
        '3': [
          { fileName: 'a', isUploaded: true },
          { fileName: 'b', isUploaded: false },
        ],
      };
      component.savedFileData = { '3': [{ isUploaded: true }] };
      // saveFileData marks files as uploaded after the call, so snapshot the request.
      let sent: any;
      lab.saveFile.and.callFake((req: any) => {
        sent = JSON.parse(JSON.stringify(req));
        return of({ statusCode: 200, data: [{ kmFileManagerID: 56 }] });
      });
      component.saveUploadDetails('3');
      expect(lab.saveFile).toHaveBeenCalledTimes(1);
      expect(sent).toEqual([{ fileName: 'b', isUploaded: false }]);
      expect(component.savedFileData['3'].length).toBe(2);
      expect(component.fileObj['3'].every((f: any) => f.isUploaded)).toBeTrue();
    });

    it('alerts when no new files to upload', () => {
      component.fileObj = {
        '3': [
          { fileName: 'a', isUploaded: true },
          { fileName: 'b', isUploaded: true },
        ],
      };
      component.savedFileData = { '3': [{ isUploaded: true }] };
      component.saveUploadDetails('3');
      expect(lab.saveFile).not.toHaveBeenCalled();
      expect(confirm.alert).toHaveBeenCalledWith(
        LANG.alerts.info.selectNewFile,
        'info',
      );
    });

    it('alerts when fileObj not larger than saved', () => {
      component.fileObj = { '3': [{ isUploaded: true }] };
      component.savedFileData = { '3': [{ isUploaded: true }] };
      component.saveUploadDetails('3');
      expect(confirm.alert).toHaveBeenCalledWith(
        LANG.alerts.info.selectNewFile,
        'info',
      );
    });

    it('saveFileData adds a new procedure key to existing saved data', () => {
      component.savedFileData = { '1': [] };
      component.fileObj = { '4': [{}] };
      lab.saveFile.and.returnValue(of({ statusCode: 200, data: [{ id: 1 }] }));
      component.saveFileData('4', []);
      expect(component.savedFileData['4'].length).toBe(1);
    });

    it('saveFileData ignores non-200', () => {
      lab.saveFile.and.returnValue(of({ statusCode: 5000 }));
      component.saveFileData('4', []);
      expect(component.savedFileData).toBeUndefined();
      expect(confirm.alert).not.toHaveBeenCalled();
    });

    it('saveFileData alerts on error', () => {
      lab.saveFile.and.returnValue(throwingObs({ errorMessage: 'up' }));
      component.saveFileData('4', []);
      expect(confirm.alert).toHaveBeenCalledWith('up', 'err');
    });
  });

  describe('validateSubmit', () => {
    let submit: jasmine.Spy;
    beforeEach(async () => {
      await setup();
      submit = spyOn(component, 'submitDetails');
    });

    it('submits without files', () => {
      component.validateSubmit(true);
      expect(submit).toHaveBeenCalledWith(true);
    });

    it('submits with empty fileObj', () => {
      component.fileObj = {};
      component.validateSubmit(false);
      expect(submit).toHaveBeenCalledWith(false);
    });

    it('alerts when files not uploaded', () => {
      component.fileObj = { a: [1] };
      component.validateSubmit(true);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANG.alerts.info.uploadSelectedFile,
      );
      expect(submit).not.toHaveBeenCalled();
    });

    it('alerts when key counts differ', () => {
      component.fileObj = { a: [1], b: [1] };
      component.savedFileData = { a: [1] };
      component.validateSubmit(true);
      expect(confirm.alert).toHaveBeenCalledTimes(1);
      expect(submit).not.toHaveBeenCalled();
    });

    it('alerts when saved key missing', () => {
      component.fileObj = { a: [1] };
      component.savedFileData = { b: [1] };
      component.validateSubmit(true);
      expect(confirm.alert).toHaveBeenCalledTimes(1);
    });

    it('alerts when saved length differs', () => {
      component.fileObj = { a: [1, 2] };
      component.savedFileData = { a: [1] };
      component.validateSubmit(true);
      expect(confirm.alert).toHaveBeenCalledTimes(1);
    });

    it('submits when all uploaded', () => {
      component.fileObj = { a: [1], b: [2] };
      component.savedFileData = { a: [1], b: [2] };
      component.validateSubmit(true);
      expect(submit).toHaveBeenCalledOnceWith(true);
    });
  });

  describe('dialogs', () => {
    beforeEach(async () => setup());

    it('viewFileContent opens preview window with file content', () => {
      dialogReturning(55);
      const write = jasmine.createSpy('write');
      spyOn(window, 'open').and.returnValue({ document: { write } } as any);
      lab.viewFileContent.and.returnValue(
        of({ data: { statusCode: 200, data: { response: 'data:abc' } } }),
      );
      component.viewFileContent([{ fileID: 55 }]);
      expect(dialog.open).toHaveBeenCalledWith(
        ViewRadiologyUploadedFilesComponent,
        { width: '40%', data: { filesDetails: [{ fileID: 55 }] } },
      );
      expect(lab.viewFileContent).toHaveBeenCalledWith({ fileID: 55 });
      expect(window.open).toHaveBeenCalledWith('', '_blank');
      expect(write.calls.mostRecent().args[0]).toContain(
        '<iframe src="data:abc">',
      );
    });

    it('viewFileContent alerts when popup blocked', () => {
      dialogReturning(55);
      spyOn(window, 'open').and.returnValue(null);
      lab.viewFileContent.and.returnValue(
        of({ data: { statusCode: 200, data: { response: 'x' } } }),
      );
      component.viewFileContent([]);
      expect(confirm.alert).toHaveBeenCalledWith(
        'Popup blocked. Please allow popups.',
        'err',
      );
    });

    it('viewFileContent ignores non-200', () => {
      dialogReturning(55);
      const open = spyOn(window, 'open');
      lab.viewFileContent.and.returnValue(of({ data: { statusCode: 5000 } }));
      component.viewFileContent([]);
      expect(open).not.toHaveBeenCalled();
    });

    it('viewFileContent alerts on error', () => {
      dialogReturning(55);
      lab.viewFileContent.and.returnValue(throwingObs({ errorMessage: 'v' }));
      component.viewFileContent([]);
      expect(confirm.alert).toHaveBeenCalledWith('v', 'err');
    });

    it('viewFileContent does nothing when dialog dismissed', () => {
      dialogReturning(undefined);
      component.viewFileContent([]);
      expect(lab.viewFileContent).not.toHaveBeenCalled();
    });

    it('openToViewFile deletes emptied procedure entries', () => {
      component.fileObj = { 3: [{}] };
      dialogReturning({ 3: [], 4: [{}] });
      component.openToViewFile(3);
      expect(dialog.open).toHaveBeenCalledWith(ViewFileComponent, {
        width: '50%',
        data: { viewFileObj: { 3: [{}] }, procedureID: 3 },
      });
      expect(component.fileObj).toEqual({ 4: [{}] });
    });

    it('openToViewFile keeps non-empty entries', () => {
      dialogReturning({ 3: [{ a: 1 }] });
      component.openToViewFile(3);
      expect(component.fileObj).toEqual({ 3: [{ a: 1 }] });
    });

    it('openIOTModal patches text and select results', () => {
      const api = component.labForm.at(0) as FormGroup;
      dialogReturning(['123', 'Pos']);
      component.openIOTModal(api, 1);
      expect(component.stepExpand).toBe(1);
      const args = dialog.open.calls.mostRecent().args;
      expect(args[0]).toBe(IotcomponentComponent);
      expect(args[1].data.startAPI).toBe('start');
      expect(args[1].data.output).toEqual(['C1', 'C2']);
      const arr = api.get('compListDetails') as FormArray;
      expect(arr.at(0).value.inputValue).toBe('123');
      expect(arr.at(1).value.compOptSelected).toBe('Pos');
    });

    it('openIOTModal skips undefined entries and other input types', () => {
      const api = component.labForm.at(0) as FormGroup;
      const arr = api.get('compListDetails') as FormArray;
      arr.at(1).patchValue({ inputType: 'Other' });
      dialogReturning([undefined, 'x']);
      component.openIOTModal(api, 0);
      expect(arr.at(0).value.inputValue).toBeNull();
      expect(arr.at(1).value.compOptSelected).toBeNull();
    });

    it('openIOTModal patches dropdown and ignores null result', () => {
      const api = component.labForm.at(0) as FormGroup;
      const arr = api.get('compListDetails') as FormArray;
      arr.at(1).patchValue({ inputType: 'DropDown' });
      dialogReturning([undefined, 'Neg']);
      component.openIOTModal(api, 0);
      expect(arr.at(1).value.compOptSelected).toBe('Neg');
      dialogReturning(Object.assign([], { result: null }));
      arr.at(1).patchValue({ compOptSelected: 'keep' });
      component.openIOTModal(api, 0);
      expect(arr.at(1).value.compOptSelected).toBe('keep');
    });
  });

  describe('archive filters', () => {
    beforeEach(async () => setup());

    it('filterProceduresLab filters and resets', () => {
      component.filterProceduresLab('cbc');
      expect(component.laboratoryData.map((x: any) => x.procedureName)).toEqual(
        ['Old CBC'],
      );
      component.filterProceduresLab('');
      expect(component.laboratoryData.length).toBe(2);
    });

    it('filterProceduresRadiology filters and resets', () => {
      component.filterProceduresRadiology('zzz');
      expect(component.radiologyFile).toEqual([]);
      component.filterProceduresRadiology('x-ray');
      expect(component.radiologyFile.length).toBe(1);
      component.filterProceduresRadiology();
      expect(component.radiologyFile.length).toBe(1);
    });
  });

  describe('reset / deactivate / sidenav', () => {
    beforeEach(async () => setup());

    it('confirmFormReset does nothing on pristine form', () => {
      component.confirmFormReset();
      expect(confirm.confirm).not.toHaveBeenCalled();
    });

    it('confirmFormReset reloads when confirmed', () => {
      component.technicianForm.markAsDirty();
      const spy = spyOn(component, 'formReCall');
      component.confirmFormReset();
      expect(confirm.confirm).toHaveBeenCalledWith(
        'info',
        LANG.alerts.info.resetDetails,
      );
      expect(spy).toHaveBeenCalled();
    });

    it('confirmFormReset keeps form when declined', () => {
      component.technicianForm.markAsDirty();
      confirm.confirm.and.returnValue(of(false));
      const spy = spyOn(component, 'formReCall');
      component.confirmFormReset();
      expect(spy).not.toHaveBeenCalled();
    });

    it('formReCall resets and refetches', () => {
      component.stripSelected = false;
      master.getLabRequirements.calls.reset();
      component.formReCall();
      expect(component.stripSelected).toBeTrue();
      expect(master.getLabRequirements).toHaveBeenCalled();
      expect(component.technicianForm.pristine).toBeTrue();
    });

    it('canDeactivate returns of(true) when pristine', () => {
      let v: any;
      component.canDeactivate().subscribe((r) => (v = r));
      expect(v).toBeTrue();
    });

    it('canDeactivate confirms when dirty', () => {
      component.technicianForm.markAsDirty();
      confirm.confirm.and.returnValue(of(false));
      let v: any;
      component.canDeactivate().subscribe((r) => (v = r));
      expect(v).toBeFalse();
      expect(confirm.confirm).toHaveBeenCalledWith(
        'info',
        LANG.alerts.info.navigateFurtherAlert,
        'Yes',
        'No',
      );
    });

    it('sideNavModeChange uses side mode on wide screens', () => {
      spyOnProperty(window.screen, 'width').and.returnValue(1200);
      const nav = { mode: '', toggle: jasmine.createSpy('toggle') };
      component.sideNavModeChange(nav);
      expect(nav.mode).toBe('side');
      expect(nav.toggle).toHaveBeenCalled();
    });

    it('sideNavModeChange uses over mode on small screens', () => {
      spyOnProperty(window.screen, 'width').and.returnValue(500);
      const nav = { mode: '', toggle: jasmine.createSpy('toggle') };
      component.sideNavModeChange(nav);
      expect(nav.mode).toBe('over');
    });
  });

  describe('submitDetails', () => {
    beforeEach(async () => setup());

    const fillLab = () => {
      const arr = (component.labForm.at(0) as FormGroup).get(
        'compListDetails',
      ) as FormArray;
      arr.at(0).patchValue({ inputValue: '100' });
    };

    it('does nothing when not confirmed', () => {
      confirm.confirm.and.returnValue(of(false));
      component.submitDetails(true);
      expect(lab.saveLabWork).not.toHaveBeenCalled();
    });

    it('saves lab work with restructured payload and navigates', () => {
      fillLab();
      component.savedFileData = {
        '3': [{ kmFileManagerID: 1 }, { kmFileManagerID: 2 }],
      };
      component.radiologyForm.at(0).patchValue({ procedureID: '3' });
      component.submitDetails(true);
      expect(confirm.confirm).toHaveBeenCalledWith(
        'info',
        LANG.alerts.info.confirmSubmit +
          ' ' +
          LANG.common.submit +
          ' ' +
          LANG.alerts.info.labObservation,
      );
      const payload = lab.saveLabWork.calls.mostRecent().args[0];
      expect(payload.labCompleted).toBeTrue();
      expect(payload.createdBy).toBe('tech');
      expect(payload.specialist_flag).toBeNull();
      expect(payload.facilityID).toBe(3);
      expect(payload.parkingPlaceID).toBe(4);
      expect(payload.labTestResults.length).toBe(1);
      expect(payload.labTestResults[0].compList[0].testResultValue).toBe('100');
      expect(payload.radiologyTestResults).toEqual([
        {
          procedureID: '3',
          prescriptionID: 102,
          testComponentID: 31,
          remarks: 'r',
          fileIDs: [1, 2],
        },
      ]);
      expect(confirm.alert).toHaveBeenCalledWith(
        LANG.alerts.info.datafillSuccessfully,
        'success',
      );
      expect(session.removeItem).toHaveBeenCalledWith('specialist_flag');
      expect(router.navigate).toHaveBeenCalledWith(['/lab/worklist']);
    });

    it('uses "save" option, keeps specialist flag and defaults empty lab results', () => {
      session.store.set('specialist_flag', '4');
      component.submitDetails(false);
      const msg = confirm.confirm.calls.mostRecent().args[1];
      expect(msg).toContain(' save ');
      const payload = lab.saveLabWork.calls.mostRecent().args[0];
      expect(payload.labCompleted).toBeFalse();
      expect(payload.specialist_flag).toBe('4');
      expect(payload.labTestResults).toEqual([]);
      expect(payload.radiologyTestResults).toEqual([]);
    });

    it('treats empty specialist flag as null and alerts save error', () => {
      session.store.set('specialist_flag', '');
      lab.saveLabWork.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'bad' }),
      );
      component.technicianForm.setControl('labForm', new FormArray<any>([]));
      component.submitDetails(true);
      const payload = lab.saveLabWork.calls.mostRecent().args[0];
      expect(payload.specialist_flag).toBeNull();
      expect(payload.labTestResults).toEqual([]);
      expect(confirm.alert).toHaveBeenCalledWith('bad', 'error');
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('swallows confirm errors', () => {
      confirm.confirm.and.returnValue(throwingObs());
      component.submitDetails(true);
      expect(lab.saveLabWork).not.toHaveBeenCalled();
    });
  });
});
