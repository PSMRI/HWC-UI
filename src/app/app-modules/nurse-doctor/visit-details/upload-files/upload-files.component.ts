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
  EventEmitter,
  Input,
  OnChanges,
  Output,
  DoCheck,
} from '@angular/core';
import { FormBuilder, FormGroup, FormControl, FormArray } from '@angular/forms';
import { NurseService } from '../../shared/services/nurse.service';
import { BeneficiaryDetailsService } from '../../../core/services/beneficiary-details.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { DoctorService } from '../../shared/services';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { MatDialog } from '@angular/material/dialog';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { LabService } from 'src/app/app-modules/lab/shared/services';
import { ViewRadiologyUploadedFilesComponent } from 'src/app/app-modules/lab/view-radiology-uploaded-files/view-radiology-uploaded-files.component';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-patient-upload-files',
  templateUrl: './upload-files.component.html',
  styleUrls: ['./upload-files.component.css'],
})
export class UploadFilesComponent implements OnChanges, OnInit, DoCheck {
  fileList!: FileList;
  file: any;
  fileContent: any;
  valid_file_extensions = [
    'msg',
    'pdf',
    'png',
    'jpeg',
    'jpg',
    'doc',
    'docx',
    'xlsx',
    'xls',
    'csv',
    'txt',
  ];
  disableFileSelection = false;
  enableForNCDScreening = false;
  maxFileSize = 5;
  disableViewFiles = false;

  @Input()
  patientFileUploadDetailsForm!: FormGroup;

  @Input()
  mode!: string;

  @Input()
  enableFileSelection = false;
  currentLanguageSet: any;

  constructor(
    private nurseService: NurseService,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    private labService: LabService,
    private fb: FormBuilder,
    private confirmationService: ConfirmationService,
    private dialog: MatDialog,
    public httpServiceService: HttpServiceService,
    private doctorService: DoctorService,
    readonly sessionstorage: SessionStorageService,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
  }
  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }
  ngOnChanges() {
    const specialistFlagString = this.sessionstorage.getItem('specialistFlag');

    if (String(this.mode) === 'view' && !this.enableFileSelection) {
      this.disableFileSelection = true;
    } else if (String(this.mode) === 'view' && this.enableFileSelection) {
      this.enableForNCDScreening = true;
    } else if (
      specialistFlagString !== null &&
      parseInt(specialistFlagString) === 100
    ) {
      this.enableForNCDScreening = true;
    } else {
      this.disableFileSelection = false;
    }

    if (
      String(this.mode) === 'view' &&
      this.doctorService.fileIDs !== null &&
      this.doctorService.fileIDs !== undefined &&
      this.doctorService.fileIDs.length > 0 &&
      this.doctorService.fileIDs.length[0] !== null
    ) {
      this.disableViewFiles = false;
    } else {
      this.disableViewFiles = true;
    }
  }
  uploadFile(event: any) {
    this.fileList = event.target.files;
    if (this.fileList.length > 0) {
      this.file = event.target.files[0];

      const fileNameExtension = this.file.name.split('.');
      const fileName = fileNameExtension[0];

      if (fileName !== undefined && fileName !== null && fileName !== '') {
        const validFormat = this.checkExtension(this.file);
        if (!validFormat) {
          this.confirmationService.alert(
            this.currentLanguageSet.invalidFileExtensionSupportedFileFormats,
            'error',
          );
        } else {
          if (this.fileList[0].size / 1000 / 1000 > this.maxFileSize) {
            console.log('File Size' + this.fileList[0].size / 1000 / 1000);
            this.confirmationService.alert(
              this.currentLanguageSet.fileSizeShouldNotExceed +
                ' ' +
                this.maxFileSize +
                ' ' +
                this.currentLanguageSet.mb,
              'error',
            );
          } else if (this.file) {
            console.log('File Size' + this.fileList[0].size / 1000 / 1000);
            const myReader: FileReader = new FileReader();
            myReader.onloadend = this.onLoadFileCallback.bind(this);
            myReader.readAsDataURL(this.file);
          }
        }
      } else
        this.confirmationService.alert(
          this.currentLanguageSet.invalidFileName,
          'error',
        );
    }
  }
  onLoadFileCallback = (event: any) => {
    console.log(event, 'myReaderevent');

    const fileContent = event.currentTarget.result;
    this.assignFileObject(fileContent);
  };
  /*
   *  check for valid file extensions
   */
  checkExtension(file: any) {
    let count = 0;
    console.log('FILE DETAILS', file);
    if (file) {
      const array_after_split = file.name.split('.');
      if (array_after_split.length === 2) {
        const file_extension = array_after_split[array_after_split.length - 1];
        for (let i = 0; i < this.valid_file_extensions.length; i++) {
          if (
            file_extension.toUpperCase() ===
            this.valid_file_extensions[i].toUpperCase()
          ) {
            count = count + 1;
          }
        }

        if (count > 0) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    } else {
      return true;
    }
  }
  fileObj: any = [];
  assignFileObject(fileContent: any) {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    const vanID = JSON.parse(serviceLineDetails).vanID;
    const parkingPlaceID = JSON.parse(serviceLineDetails).parkingPlaceID;

    const kmFileManager = {
      fileName: this.file !== undefined ? this.file.name : '',
      fileExtension:
        this.file !== undefined ? '.' + this.file.name.split('.')[1] : '',
      providerServiceMapID: this.sessionstorage.getItem('providerServiceID'),
      userID: this.sessionstorage.getItem('userID'),
      fileContent: fileContent !== undefined ? fileContent.split(',')[1] : '',
      createdBy: this.sessionstorage.getItem('userName'),
      vanID: vanID,
      isUploaded: false,
    };
    this.fileObj.push(kmFileManager);
    this.nurseService.fileData = this.fileObj;
    console.log('kmFileManager', this.fileObj);
  }
  /*
   *  Remove file
   */
  remove(file: any) {
    const index = this.fileObj.indexOf(file);

    if (index >= 0) {
      this.fileObj.splice(index, 1);
    }
    console.log(this.fileObj);
    this.nurseService.fileData = null;
  }
  savedFileData: any = [];
  fileIDs: any = [];
  get uploadFiles() {
    return this.patientFileUploadDetailsForm.controls['fileIDs'].value;
  }
  saveUploadDetails(fileObj: any) {
    this.labService.saveFile(fileObj).subscribe(
      (res: any) => {
        if (res.statusCode === 200) {
          this.disableViewFiles = false;
          res.data.forEach((file: any) => {
            this.savedFileData.push(file);
            this.fileIDs.push(file.kmFileManagerID);
          });
          this.confirmationService.alert(
            this.currentLanguageSet.fileUploadedSuccessfully,
            'success',
          );
          this.fileObj.map((file: any) => {
            file.isUploaded = true;
          });
          this.savedFileData.map((file: any) => {
            file.isUploaded = true;
          });
        } else {
          this.confirmationService.alert(
            'File Upload failed, Please try again',
            'warn',
          );
        }
      },
      (err: any) => {
        this.confirmationService.alert(err.errorMessage, 'err');
      },
    );
    console.log('fileIDs', this.fileIDs);
    this.patientFileUploadDetailsForm.patchValue({
      fileIDs: this.fileIDs,
    });
    this.nurseService.fileData = null;
  }
  checkForDuplicateUpload() {
    if (this.fileObj !== undefined) {
      if (this.savedFileData !== undefined) {
        if (this.fileObj.length > this.savedFileData.length) {
          const result = this.fileObj.filter((uniqueFileName: any) => {
            const arrNames = this.savedFileData.filter((savedFileName: any) => {
              if (uniqueFileName.isUploaded === savedFileName.isUploaded) {
                return true;
              } else {
                return false;
              }
            });
            if (arrNames.length === 0) {
              return true;
            } else {
              return false;
            }
          });
          console.log('result', result);
          if (result && result.length > 0) {
            this.saveUploadDetails(result);
          } else {
            this.confirmationService.alert(
              this.currentLanguageSet.alerts.info.selectNewFile,
              'info',
            );
          }
        } else {
          this.confirmationService.alert(
            this.currentLanguageSet.alerts.info.selectNewFile,
            'info',
          );
        }
      } else {
        this.saveUploadDetails(this.fileObj);
      }
    } else {
      this.confirmationService.alert(
        this.currentLanguageSet.alerts.info.selectNewFile,
        'info',
      );
    }
  }
  viewNurseSelectedFiles() {
    console.log('this.doc', this.doctorService.fileIDs);
    const file_Ids = this.doctorService.fileIDs;
    const ViewTestReport = this.dialog.open(
      ViewRadiologyUploadedFilesComponent,
      {
        width: '40%',
        data: {
          filesDetails: file_Ids,
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
              // location.href = fileContent;
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
  triggerLog(event: any) {
    console.log(event.clientX);
    if (event.clientX !== 0) {
      const x: any = document.getElementById('fileUpload');
      x.click();
    }
  }
}
