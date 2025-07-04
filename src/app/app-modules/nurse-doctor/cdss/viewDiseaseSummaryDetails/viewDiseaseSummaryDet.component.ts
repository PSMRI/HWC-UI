import { Component, DoCheck, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';

@Component({
  selector: 'app-view-disease-summary-form',
  templateUrl: './viewDiseaseSummaryDet.component.html',
  styleUrls: ['./viewDiseaseSummaryDet.component.css'],
})
export class ViewDiseaseSummaryDetailsComponent implements OnInit, DoCheck {
  diseaseName: any;
  summary: any;
  couldbedangerous: any;
  causes: any;
  dos_donts: any;
  symptoms_Signs: any;
  medicaladvice: any;
  riskfactors: any;
  treatment: any;
  self_care: any;
  investigations: any;
  currentLanguageSet: any;
  constructor(
    @Inject(MAT_DIALOG_DATA) public input: any,
    private dialogRef: MatDialogRef<ViewDiseaseSummaryDetailsComponent>,
    public HttpServices: HttpServiceService,
  ) {
    dialogRef.disableClose = true;
  }
  ngOnInit() {
    this.assignSelectedLanguage();
    console.log(this.input.summaryDetails, 'this.input');
    this.setSummaryDetails(this.input.summaryDetails);
  }
  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.HttpServices);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  setSummaryDetails(summaryDetails: any) {
    console.log(summaryDetails);
    this.diseaseName = summaryDetails.data.diseaseName;
    this.summary = summaryDetails.data.summary.substring(1).replace(/\$/g, ',');
    this.couldbedangerous = summaryDetails.data.couldbedangerous.replace(
      /\$/g,
      '\n',
    );
    this.causes = summaryDetails.data.causes.substring(1).replace(/\$/g, '\n');
    this.dos_donts = summaryDetails.data.dos_donts
      .substring(1)
      .replace(/\$/g, '\n');
    this.symptoms_Signs = summaryDetails.data.symptoms_Signs
      .substring(1)
      .replace(/\$/g, '\n');
    this.medicaladvice = summaryDetails.data.medicaladvice
      .substring(1)
      .replace(/\$/g, '\n');
    this.riskfactors = summaryDetails.data.riskfactors
      .substring(1)
      .replace(/\$/g, '\n');
    this.treatment = summaryDetails.data.treatment
      .substring(1)
      .replace(/\$/g, '\n');
    this.self_care = summaryDetails.data.self_care
      .substring(1)
      .replace(/\$/g, '\n');
    this.investigations = summaryDetails.data.investigations
      .substring(1)
      .replace(/\$/g, '\n');
    console.log(this.medicaladvice, 'this.input');
  }
  closeDialog() {
    this.dialogRef.close(this.input.summaryDetails);
    sessionStorage.setItem('diseaseClose', 'True');
  }
  closeCancelDialog() {
    sessionStorage.setItem('diseaseClose', 'False');
    this.dialogRef.close();
  }
}
