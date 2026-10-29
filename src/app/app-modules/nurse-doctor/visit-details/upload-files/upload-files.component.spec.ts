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
import { FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

import { UploadFilesComponent } from './upload-files.component';
import { DoctorService, NurseService } from '../../shared/services';
import { BeneficiaryDetailsService } from 'src/app/app-modules/core/services/beneficiary-details.service';
import { ConfirmationService } from 'src/app/app-modules/core/services/confirmation.service';
import { LabService } from 'src/app/app-modules/lab/shared/services';
import { ViewRadiologyUploadedFilesComponent } from 'src/app/app-modules/lab/view-radiology-uploaded-files/view-radiology-uploaded-files.component';
import { AmritTrackingService } from 'Common-UI/src/tracking';
import { MaterialModule } from 'src/app/app-modules/core/material.module';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  createDialogRefMock,
  throwingObs,
} from 'src/testing/test-utils';

describe('UploadFilesComponent', () => {
  let component: UploadFilesComponent;
  let fixture: ComponentFixture<UploadFilesComponent>;
  let doctor: any;
  let nurse: any;
  let lab: any;
  let confirm: any;
  let dialog: any;
  let tracking: any;

  const SESSION = {
    serviceLineDetails: JSON.stringify({ vanID: 61, parkingPlaceID: 7 }),
    providerServiceID: 'PSM1',
    userID: 'U1',
    userName: 'nurse1',
  };

  async function setup(seed: Record<string, any> = SESSION) {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [UploadFilesComponent],
      providers: [
        ...commonTestProviders({ session: seed }),
        {
          provide: DoctorService,
          useValue: autoSpy(DoctorService, { fileIDs: null }),
        },
        { provide: NurseService, useValue: autoSpy(NurseService) },
        { provide: LabService, useValue: autoSpy(LabService) },
        { provide: BeneficiaryDetailsService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(UploadFilesComponent);
    component = fixture.componentInstance;
    component.patientFileUploadDetailsForm = new FormBuilder().group({
      fileIDs: [null],
    });
    doctor = TestBed.inject(DoctorService) as any;
    nurse = TestBed.inject(NurseService) as any;
    lab = TestBed.inject(LabService) as any;
    confirm = TestBed.inject(ConfirmationService) as any;
    dialog = TestBed.inject(MatDialog) as any;
    tracking = TestBed.inject(AmritTrackingService) as any;
  }

  function fileEvent(name: string, size = 1000) {
    return { target: { files: [{ name, size }] } };
  }

  describe('general', () => {
    beforeEach(async () => {
      await setup();
      fixture.detectChanges();
    });

    it('should create with language', () => {
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(component.maxFileSize).toBe(5);
    });

    describe('ngOnChanges', () => {
      it('view mode without file selection disables selection and view', () => {
        component.mode = 'view';
        component.ngOnChanges();
        expect(component.disableFileSelection).toBeTrue();
        expect(component.disableViewFiles).toBeTrue();
      });

      it('view mode with file selection enables NCD screening and view files', () => {
        component.mode = 'view';
        component.enableFileSelection = true;
        doctor.fileIDs = [1, 2];
        component.ngOnChanges();
        expect(component.enableForNCDScreening).toBeTrue();
        expect(component.disableViewFiles).toBeFalse();
      });

      it('non-view mode keeps file selection enabled', () => {
        component.disableFileSelection = true;
        component.ngOnChanges();
        expect(component.disableFileSelection).toBeFalse();
        expect(component.enableForNCDScreening).toBeFalse();
      });
    });

    describe('checkExtension', () => {
      [
        { file: { name: 'a.pdf' }, ok: true },
        { file: { name: 'a.PNG' }, ok: true },
        { file: { name: 'a.exe' }, ok: false },
        { file: { name: 'a.b.pdf' }, ok: false },
        { file: null, ok: true },
      ].forEach((c) => {
        it(`${JSON.stringify(c.file)} -> ${c.ok}`, () => {
          expect(component.checkExtension(c.file)).toBe(c.ok);
        });
      });
    });

    describe('uploadFile', () => {
      it('does nothing for empty file list', () => {
        component.uploadFile({ target: { files: [] } });
        expect(component.file).toBeUndefined();
        expect(confirm.alert).not.toHaveBeenCalled();
      });

      it('alerts invalid file name', () => {
        component.uploadFile(fileEvent('.pdf'));
        expect(confirm.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.invalidFileName,
          'error',
        );
      });

      it('alerts invalid extension', () => {
        component.uploadFile(fileEvent('a.exe'));
        expect(confirm.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.invalidFileExtensionSupportedFileFormats,
          'error',
        );
      });

      it('alerts file too big', () => {
        component.uploadFile(fileEvent('a.pdf', 6 * 1000 * 1000));
        expect(confirm.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.fileSizeShouldNotExceed + ' 5 ' + LANGUAGE_EN.mb,
          'error',
        );
      });

      it('reads a valid file and stores file object on load', () => {
        const reader: any = {
          readAsDataURL: jasmine.createSpy('readAsDataURL'),
        };
        spyOn(window as any, 'FileReader').and.returnValue(reader);
        const ev = fileEvent('report.pdf');
        component.uploadFile(ev);
        expect(reader.readAsDataURL).toHaveBeenCalledWith(ev.target.files[0]);
        reader.onloadend({
          currentTarget: { result: 'data:application/pdf;base64,QUJD' },
        });
        expect(component.fileObj.length).toBe(1);
        expect(component.fileObj[0]).toEqual({
          fileName: 'report.pdf',
          fileExtension: '.pdf',
          providerServiceMapID: 'PSM1',
          userID: 'U1',
          fileContent: 'QUJD',
          createdBy: 'nurse1',
          vanID: 61,
          isUploaded: false,
        });
        expect(nurse.fileData).toBe(component.fileObj);
      });
    });

    it('assignFileObject handles missing file and content', () => {
      component.file = undefined;
      component.assignFileObject(undefined);
      expect(component.fileObj[0].fileName).toBe('');
      expect(component.fileObj[0].fileExtension).toBe('');
      expect(component.fileObj[0].fileContent).toBe('');
    });

    it('remove removes existing file and clears nurse fileData', () => {
      const f = { fileName: 'x' };
      component.fileObj = [f];
      nurse.fileData = [f];
      component.remove({ fileName: 'other' });
      expect(component.fileObj.length).toBe(1);
      component.remove(f);
      expect(component.fileObj.length).toBe(0);
      expect(nurse.fileData).toBeNull();
    });

    describe('saveUploadDetails', () => {
      it('success stores ids and marks uploaded', () => {
        lab.saveFile.and.returnValue(
          of({
            statusCode: 200,
            data: [{ kmFileManagerID: 5 }, { kmFileManagerID: 6 }],
          }),
        );
        component.fileObj = [{ isUploaded: false }];
        component.saveUploadDetails(component.fileObj);
        expect(lab.saveFile).toHaveBeenCalledWith(component.fileObj);
        expect(component.fileIDs).toEqual([5, 6]);
        expect(component.uploadFiles).toEqual([5, 6]);
        expect(component.fileObj[0].isUploaded).toBeTrue();
        expect(
          component.savedFileData.every((f: any) => f.isUploaded),
        ).toBeTrue();
        expect(component.disableViewFiles).toBeFalse();
        expect(confirm.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.fileUploadedSuccessfully,
          'success',
        );
        expect(nurse.fileData).toBeNull();
      });

      it('non-200 warns', () => {
        lab.saveFile.and.returnValue(of({ statusCode: 5000 }));
        component.saveUploadDetails([]);
        expect(confirm.alert).toHaveBeenCalledWith(
          'File Upload failed, Please try again',
          'warn',
        );
      });

      it('error alerts', () => {
        lab.saveFile.and.returnValue(throwingObs({ errorMessage: 'boom' }));
        component.saveUploadDetails([]);
        expect(confirm.alert).toHaveBeenCalledWith('boom', 'err');
      });
    });

    describe('checkForDuplicateUpload', () => {
      beforeEach(() => spyOn(component, 'saveUploadDetails'));

      it('uploads new files not yet saved', () => {
        component.fileObj = [{ isUploaded: true }, { isUploaded: false }];
        component.savedFileData = [{ isUploaded: true }];
        component.checkForDuplicateUpload();
        expect(component.saveUploadDetails).toHaveBeenCalledWith([
          { isUploaded: false },
        ]);
      });

      it('info alert when all already uploaded', () => {
        component.fileObj = [{ isUploaded: true }, { isUploaded: true }];
        component.savedFileData = [{ isUploaded: true }];
        component.checkForDuplicateUpload();
        expect(component.saveUploadDetails).not.toHaveBeenCalled();
        expect(confirm.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.alerts.info.selectNewFile,
          'info',
        );
      });

      it('info alert when no more files than saved', () => {
        component.fileObj = [{ isUploaded: true }];
        component.savedFileData = [{ isUploaded: true }];
        component.checkForDuplicateUpload();
        expect(confirm.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.alerts.info.selectNewFile,
          'info',
        );
      });

      it('uploads everything when nothing saved yet (undefined)', () => {
        component.fileObj = [{ a: 1 }];
        component.savedFileData = undefined;
        component.checkForDuplicateUpload();
        expect(component.saveUploadDetails).toHaveBeenCalledWith([{ a: 1 }]);
      });

      it('info alert when fileObj undefined', () => {
        component.fileObj = undefined;
        component.checkForDuplicateUpload();
        expect(confirm.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.alerts.info.selectNewFile,
          'info',
        );
      });
    });

    describe('viewNurseSelectedFiles', () => {
      it('opens dialog and file content in new window', () => {
        doctor.fileIDs = [1];
        const ref = createDialogRefMock(9);
        dialog.open.and.returnValue(ref);
        lab.viewFileContent.and.returnValue(
          of({ data: { statusCode: 200, data: { response: 'http://f' } } }),
        );
        const openSpy = spyOn(window, 'open');
        component.viewNurseSelectedFiles();
        expect(dialog.open).toHaveBeenCalledWith(
          ViewRadiologyUploadedFilesComponent,
          jasmine.objectContaining({
            width: '40%',
            data: jasmine.objectContaining({ filesDetails: [1] }),
          }),
        );
        expect(lab.viewFileContent).toHaveBeenCalledWith({ fileID: 9 });
        expect(openSpy).toHaveBeenCalledWith('http://f', '_blank');
      });

      it('does not open window on non-200 content', () => {
        dialog.open.and.returnValue(createDialogRefMock(9));
        lab.viewFileContent.and.returnValue(of({ data: { statusCode: 5000 } }));
        const openSpy = spyOn(window, 'open');
        component.viewNurseSelectedFiles();
        expect(openSpy).not.toHaveBeenCalled();
      });

      it('alerts on content error', () => {
        dialog.open.and.returnValue(createDialogRefMock(9));
        lab.viewFileContent.and.returnValue(throwingObs({ errorMessage: 'e' }));
        component.viewNurseSelectedFiles();
        expect(confirm.alert).toHaveBeenCalledWith('e', 'err');
      });

      it('does nothing when dialog closes without result', () => {
        dialog.open.and.returnValue(createDialogRefMock(undefined));
        component.viewNurseSelectedFiles();
        expect(lab.viewFileContent).not.toHaveBeenCalled();
      });
    });

    it('triggerLog clicks the hidden file input only for real clicks', () => {
      const input = document.getElementById('fileUpload') as HTMLElement;
      expect(input).toBeTruthy();
      const clickSpy = spyOn(input, 'click');
      component.triggerLog({ clientX: 0 });
      expect(clickSpy).not.toHaveBeenCalled();
      component.triggerLog({ clientX: 10 });
      expect(clickSpy).toHaveBeenCalled();
    });

    it('trackFieldInteraction delegates to tracking', () => {
      component.trackFieldInteraction('Select Files');
      expect(tracking.trackFieldInteraction).toHaveBeenCalledWith(
        'Select Files',
        'Upload Files',
      );
    });
  });

  describe('specialist', () => {
    beforeEach(async () => {
      await setup({ ...SESSION, specialistFlag: '100' });
    });

    it('enables NCD screening view for specialists', () => {
      component.ngOnChanges();
      expect(component.enableForNCDScreening).toBeTrue();
      expect(component.disableFileSelection).toBeFalse();
    });
  });
});
