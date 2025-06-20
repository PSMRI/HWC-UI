import { Component, DoCheck, Input, OnChanges, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Observable, map, startWith } from 'rxjs';
import { CDSSService } from '../../shared/services/cdss-service';
import { MatDialog } from '@angular/material/dialog';
import { DoctorService, MasterdataService } from '../../shared/services';
import { ViewDiseaseSummaryDetailsComponent } from '../viewDiseaseSummaryDetails/viewDiseaseSummaryDet.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-disease-summary-form',
  templateUrl: './diseaseSummary.component.html',
  styleUrls: ['./diseaseSummary.component.css'],
})
export class DiseaseFormComponent implements OnChanges, OnInit, DoCheck {
  currentLanguageSet: any;
  chiefComplaints: any = [];
  filteredOptions!: Observable<string[]>;
  @Input()
  DiseaseSummaryForm!: FormGroup;
  @Input()
  mode!: string;
  result: any;
  psd!: string;
  recommendedAction!: string;
  diseasesummaryID: any;
  selectedSymptoms!: string;
  actions: any = [];
  sctID_psd!: string;
  sctID_psd_toSave: any;
  actionId: any;
  sctID_pcc!: string;
  sctID_pcc_toSave: any;
  isCdssTrue = false;
  summaryObj!: null;
  summaryDetails: any = [];
  diseaseNames: any = [];
  informationGiven: any;
  diseaseSummaryView: any;
  diseasesNames: any = [];
  disableVisit = false;
  viewMode = false;
  constructor(
    private httpServiceService: HttpServiceService,
    private cdssService: CDSSService,
    private confirmationService: ConfirmationService,
    private dialog: MatDialog,
    private masterdataService: MasterdataService,
    private doctorService: DoctorService,
    readonly sessionstorage: SessionStorageService,
  ) {}

  ngOnInit() {
    this.getChiefComplaintSymptoms();
    this.getDiseaseNames();
    this.filteredOptions = this.DiseaseSummaryForm.controls[
      'diseaseSummary'
    ].valueChanges.pipe(
      startWith(''),
      map((val: any) => this._filter(val || '')),
    );
  }

  _filter(val: string): string[] {
    return this.diseaseNames.filter((option: string) =>
      option.toLowerCase().includes(val.toLowerCase()),
    );
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }

  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  getChiefComplaintSymptoms() {
    const reqObj = {
      age: this.sessionstorage.getItem('patientAge'),
      gender:
        this.sessionstorage.getItem('beneficiaryGender') === 'Male' ? 'M' : 'F',
    };

    this.cdssService.getcheifComplaintSymptoms(reqObj).subscribe((res: any) => {
      if (res.statusCode === 200 && res.data) {
        this.chiefComplaints = res.data;
      } else {
        this.confirmationService.alert(res.errorMessage, 'error');
      }
    });
    (err: any) => {
      this.confirmationService.alert(err, 'error');
    };
  }

  resetForm() {
    this.DiseaseSummaryForm.reset();
  }

  getSnomedCTRecord(term: any, field: any) {
    this.masterdataService.getSnomedCTRecord(term).subscribe(
      (response: any) => {
        console.log('Snomed response: ' + JSON.stringify(response));

        if (response.data.conceptID) {
          if (field === 'pcc') {
            this.sctID_pcc = 'SCTID: ' + response.data.conceptID;
            this.sctID_pcc_toSave = response.data.conceptID;
          } else {
            this.sctID_psd +=
              term + ('(SCTID): ' + response.data.conceptID + '\n');
            if (this.sctID_psd_toSave === '') {
              this.sctID_psd_toSave = response.data.conceptID;
            } else this.sctID_psd_toSave += ',' + response.data.conceptID;
          }
        } else {
          if (field === 'pcc') {
            this.sctID_pcc_toSave = 'NA';
          } else {
            if (this.sctID_psd_toSave === '') this.sctID_psd_toSave = 'NA';
            else this.sctID_psd_toSave += ',NA';
          }
        }
      },
      (err) => {
        console.log('getSnomedCTRecord Error');
      },
    );
  }

  ngOnChanges() {
    if (String(this.mode) === 'view') {
      const visitID = this.sessionstorage.getItem('visitID');
      const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
      this.disableVisit = true;
      this.getDiseaseSummaryDet(benRegID, visitID);
    }
    const specialistFlagString = this.sessionstorage.getItem('specialistFlag');
    if (
      specialistFlagString !== null &&
      parseInt(specialistFlagString) === 100
    ) {
      const visitID = this.sessionstorage.getItem('visitID');
      const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
      this.getDiseaseSummaryDet(benRegID, visitID);
    }
  }
  getDiseaseSummaryDet(beneficiaryRegID: any, visitID: any) {
    const visitCategory = this.sessionstorage.getItem('visitCategory');
    if (visitCategory === 'General OPD (QC)') {
      this.disableVisit = true;
      this.viewMode = true;
      this.doctorService
        .getVisitComplaintDetails(beneficiaryRegID, visitID)
        .subscribe((value: any) => {
          if (
            value !== null &&
            value !== undefined &&
            value.statusCode === 200 &&
            value.data !== null &&
            value.data !== undefined &&
            value.data.cdss !== null &&
            value.data.cdss !== undefined
          )
            this.disableVisit = true;
          this.viewMode = true;
          this.DiseaseSummaryForm.patchValue(value.data.cdss);
          this.DiseaseSummaryForm.controls['diseaseSummaryView'].patchValue(
            value.data.cdss.diseaseSummary,
          );
        });
    } else {
      this.viewMode = true;
      this.doctorService
        .getVisitComplaintDetails(beneficiaryRegID, visitID)
        .subscribe((value: any) => {
          if (
            value !== null &&
            value !== undefined &&
            value.statusCode === 200 &&
            value.data !== null &&
            value.data !== undefined &&
            value.data.Cdss.diseaseSummary !== null &&
            value.data.Cdss.diseaseSummary !== undefined
          )
            this.DiseaseSummaryForm.patchValue(value.data.Cdss.diseaseSummary);
          this.DiseaseSummaryForm.controls['diseaseSummaryView'].patchValue(
            value.data.Cdss.diseaseSummary.diseaseSummary,
          );
          this.disableVisit = true;
        });
    }
  }
  getDiseaseNames() {
    this.cdssService.getDiseaseName().subscribe((res: any) => {
      if (res.statusCode === 200 && res.data) {
        this.summaryDetails = res.data;
        const diseaseName = res.data;
        diseaseName.forEach((names: any) => {
          this.diseaseNames.push(names.diseaseName);
        });
      } else {
        this.confirmationService.alert(res.errorMessage, 'error');
      }
    });
    (err: any) => {
      this.confirmationService.alert(err, 'error');
    };
  }
  showDiseaseSummary(
    diseaseData: string | null | undefined,
    autocompleteField: any,
    elementInput: any,
  ) {
    this.summaryObj = null;
    this.summaryDetails.forEach((filterDiseaseObj: any) => {
      if (filterDiseaseObj.diseaseName === diseaseData) {
        this.summaryObj = filterDiseaseObj;
      }
    });
    if (
      diseaseData !== undefined &&
      diseaseData !== null &&
      diseaseData !== ''
    ) {
      this.cdssService.getDiseaseData(this.summaryObj).subscribe((data) => {
        if (data) {
          autocompleteField._elementRef.nativeElement.classList.remove(
            'mat-focused',
          );
          elementInput.blur();
          const dialogRef = this.dialog.open(
            ViewDiseaseSummaryDetailsComponent,
            {
              height: '500px',
              width: '1000px',
              panelClass: 'custom-dialog-content',
              data: {
                summaryDetails: data,
              },
            },
          );

          dialogRef.afterClosed().subscribe((result) => {
            if (result) {
              this.DiseaseSummaryForm.controls['informationGiven'].patchValue(
                result.data.diseaseName,
              );
              this.DiseaseSummaryForm.controls['recommendedAction'].patchValue(
                result.data.self_care,
              );
              const recommendedActionValue =
                this.DiseaseSummaryForm.controls['recommendedAction'].value;
              const updatedValue = recommendedActionValue
                .substring(1)
                .replace(/\$/g, ',');
              this.DiseaseSummaryForm.controls['recommendedAction'].patchValue(
                updatedValue,
              );
              this.DiseaseSummaryForm.controls['diseasesummaryID'].patchValue(
                result.data.diseasesummaryID,
              );
            }
            if (sessionStorage.getItem('diseaseClose') === 'False') {
              this.DiseaseSummaryForm.reset();
            }
          });
        }
      });
    } else {
      this.DiseaseSummaryForm.controls['informationGiven'].patchValue(null);
      this.DiseaseSummaryForm.controls['recommendedAction'].patchValue(null);
    }
  }
}
