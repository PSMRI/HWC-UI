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
import { Component, DoCheck, Inject, OnInit } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { CDSSService } from '../../shared/services/cdss-service';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { ConfirmationService } from 'src/app/app-modules/core/services';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { LocalDataSource } from 'angular2-smart-table';

@Component({
  selector: 'app-cdss-form-result-popup',
  templateUrl: './cdss-form-result-popup.component.html',
  styleUrls: ['./cdss-form-result-popup.component.css'],
})
export class CdssFormResultPopupComponent implements OnInit, DoCheck {
  currentLanguageSet: any;
  searchSymptom: any;
  displayedColumns: string[] = [
    'save',
    'disease',
    'count',
    'information',
    'dosDont',
    'selfcare',
    'action',
  ];
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private cdssService: CDSSService,
    public dialog: MatDialog,
    public HttpServices: HttpServiceService,
    private alertMessage: ConfirmationService,
    public dialogRef: MatDialogRef<CdssFormResultPopupComponent>,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    console.log('under ngOninit', this.data);
    this.getQuestions();
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }

  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.HttpServices);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  emergency_transferToMo: any;
  page1 = true;
  page2 = false;
  page3 = true;
  settings = {
    hideSubHeader: true,
    actions: false,
    columns: {
      Disease: {
        title: 'Disease',
      },
      selected: {
        title: 'UserInput',
      },
      percentage: {
        title: 'Count',
      },
      Information: {
        title: 'Information',
      },
      DoDonts: {
        title: 'Dos & Donts',
      },
      SelfCare: {
        title: 'SelfCare',
      },
      Action: {
        title: 'Action',
      },
    },
  };

  showQuestions = true;

  questionid: any = [];
  questions: any;
  sizeQuestion: any = [];
  answers: any;

  result: any;
  formattedResult: any;
  formattedResult1!: any[];

  getQuestions() {
    this.questionid = [];
    console.log(this.data.patientData, 'data.patientData');
    this.cdssService
      .getCdssQuestions(this.data.patientData)
      .subscribe((any) => this.successHandeler(any));
  }

  getNextSet(value: any, id: any) {
    const questionSelected: any = {};
    questionSelected['complaintId'] = this.questions.id;
    questionSelected['selected'] = id;
    this.cdssService.getCdssAnswers(questionSelected).subscribe((any) => {
      this.assignresult(any);
    });
  }

  assignresult(val: any) {
    this.result = val.data;
    if (val.length !== 0) {
      this.page1 = false;
      this.page2 = true;
    }
    console.log('Data for inbetween model ', val);
  }

  getAnswers() {
    console.log('this.questions*******************', this.questions);
    this.sizeQuestion = [];
    this.questions.Questions.forEach((element: any) => {
      console.log(element);

      this.getKeys(element).forEach((element1) => {
        console.log(Object.keys(element[element1]).length);
        this.sizeQuestion.push(Object.keys(element[element1]).length);
      });
    });

    const code = [];
    for (let index = 0; index < this.sizeQuestion.length; index++) {
      code[index] = 0;
      for (let indexj = 0; indexj <= index; indexj++) {
        code[index] += this.sizeQuestion[indexj];
      }
    }
    console.log(code);
    const answer = [];
    for (let index = 0; index < this.questionid.length; index++) {
      const element = this.questionid[index].split('.');
      console.log(element + ':' + index);
      if (Number(element[0]) > 1) {
        answer[index] = code[Number(element[0]) - 2] + Number(element[1]);
      } else {
        answer[index] = Number(element[1]);
      }
    }

    const response: any = {};
    console.log(this.questions);
    response['SymptomId'] = this.questions['id'];
    response['response'] = answer;
    console.log(response);

    this.cdssService
      .getCdssAnswers(response)
      .subscribe((any) => this.resultFunction(any));
  }

  toggle(element: any, value: any) {
    console.log(value);
    if (element.selected === undefined) {
      element.selected = [];
    }
    const index = element.selected.indexOf(value);
    if (index < 0) {
      element.selected.push(value);
    } else {
      element.selected.splice(index, 1);
    }
  }

  getresult() {
    this.formattedResult = new LocalDataSource(
      JSON.parse(JSON.stringify(this.result)),
    );
    for (let index = 0; index < this.formattedResult.data.length; index++) {
      const selected = this.formattedResult.data[index].selected;
      let per = '';
      if (selected !== undefined && selected.length !== 0) {
        per =
          this.formattedResult.data[index].selected.length +
          '/' +
          this.formattedResult.data[index].Symptoms.length;
      }
      this.formattedResult.data[index].percentage = per;
    }
    this.formattedResult1 = JSON.parse(
      JSON.stringify(this.formattedResult.data),
    );
    console.log('formateed result 1', this.formattedResult1);
    this.formattedResult.load(this.formattedResult.data);
    if (this.formattedResult1.length !== 0) {
      this.page2 = false;
      this.page3 = true;
    }
  }

  resetCount() {
    if (this.result.constructor === Array) {
      for (let i = 0; i < this.result.length; i++) {
        this.result[i].selected = undefined;
      }
    }
  }

  sortn(a: any, b: any) {
    return a - b;
  }

  getKeys(obj: any) {
    return Object.keys(obj);
  }

  getValue(obj: any, key: any): any {
    return obj[key];
  }

  resultFunction(data: any) {
    this.showQuestions = false;
    this.result = data;
    console.log(this.result);
    const diseases = Object.keys(this.result);
    this.formattedResult = [];
    for (let index = 0; index < diseases.length; index++) {
      const format: any = new ResultFormat();
      format['disease'] = diseases[index];
      format['input'] = this.result[diseases[index]]['input'];
      format['actual'] = this.result[diseases[index]]['acutal'];

      format['do'] = this.result[diseases[index]]['recommendation']['Dos'];
      format['dont'] = this.result[diseases[index]]['recommendation']['Donts'];

      this.formattedResult.push(format);
    }

    console.log(this.formattedResult);
  }
  diseasess: Array<any> = [];
  action: Array<any> = [];
  indexArray: Array<any> = [];
  getDiseaseName(
    val: any,
    i: any,
    action: any,
    symptoms: any,
    selectedIndexArray: any,
  ) {
    console.log(this.diseasess);

    let obj = {
      diseases: [],
      action: [],
      symptoms: [],
    };
    //filtering symptoms to selected symptoms array
    const tempArr: any = [];
    if (selectedIndexArray && selectedIndexArray.length > 0) {
      for (let j = 0; j < selectedIndexArray.length; j++) {
        tempArr.push(symptoms[selectedIndexArray[j] - 1]);
      }
    }

    if (this.diseasess.length === 0 && this.indexArray.length === 0) {
      obj = {
        diseases: val,
        action: action,
        symptoms: tempArr,
      };
      this.diseasess.push(obj);
      this.indexArray.push(i);
    } else {
      if (this.indexArray.includes(i)) {
        const a = this.indexArray.indexOf(i);
        this.diseasess.splice(a, 1);
        this.indexArray.splice(a, 1);
      } else {
        obj = {
          diseases: val,
          action: action,
          symptoms: tempArr,
        };
        this.diseasess.push(obj);
        this.indexArray.push(i);
      }
    }
    console.log(this.diseasess);
  }

  successHandeler(questions: any) {
    this.questions = questions.data;
  }
  handleAnswers(answers: any) {
    this.answers = answers;
  }
  changePage(val: any) {
    this.diseasess = [];
    this.indexArray = [];
    if (val === '2') {
      this.page3 = false;
      this.page2 = true;
    }
    if (val === '1') {
      this.page2 = false;
      this.page1 = true;
    }
  }
  close() {
    this.alertMessage
      .confirm('info', this.currentLanguageSet.areYouSureWantToClose)
      .subscribe((response) => {
        if (response) {
          this.dialogRef.close();
        }
      });
  }

  saveData(diseasess: any) {
    this.dialogRef.close(diseasess);
  }
}

export class ResultFormat {
  Disease!: string;
  Symptoms!: any[];
  Information!: string[];
  DoDonts!: string[];
  SelfCare!: string[];
  Action!: string[];
  selected!: number[];
  percentage!: number;
}
