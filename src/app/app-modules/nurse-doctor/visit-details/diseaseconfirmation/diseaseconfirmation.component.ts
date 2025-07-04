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
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../shared/services';
import { IdrsscoreService } from '../../shared/services/idrsscore.service';
import { NcdScreeningService } from '../../shared/services/ncd-screening.service';
import { VisitDetailUtils } from '../../shared/utility/visit-detail-utility';
import { BeneficiaryDetailsService } from 'src/app/app-modules/core/services';
import { environment } from 'src/environments/environment';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-diseaseconfirmation',
  templateUrl: './diseaseconfirmation.component.html',
  styleUrls: ['./diseaseconfirmation.component.css'],
})
export class DiseaseconfirmationComponent
  implements OnChanges, OnInit, OnDestroy
{
  @Input()
  mode!: string;

  @Input()
  diseaseFormsGroup!: FormGroup;

  @Input()
  idrsOrCbac!: string;

  diseaseFormsArray!: FormArray;
  questions: any = [];
  diseasearray: any = [];
  diseases: any = [];
  suspect: any = []; // this suspect variable is used to store confirm Disease
  revisit: any;
  diseaseArray: any = [];
  attendantType: any;
  isDoctor: any;
  diseasesList: any = [];
  confirmedDisease: any = [];
  beneficiaryGender: any;
  previousConfirmedDiseases: any = [];
  confirmDiseasesSubscription: any;
  confirmedDiseasesOnPreviousVisit: any;

  constructor(
    private fb: FormBuilder,
    private masterdataService: MasterdataService,
    private idrsScoreService: IdrsscoreService,
    private doctorService: DoctorService,
    private nurseService: NurseService,
    private route: ActivatedRoute,
    private ncdScreeningService: NcdScreeningService,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    readonly sessionstorage: SessionStorageService,
  ) {}

  ngOnInit() {
    this.getBenificiaryDetails();
    this.ncdScreeningService.clearDiseaseConfirmationScreenFlag();
    // API call to fetch the confirmed diseases for CBAC
    this.fetchPreviousVisitConfirmedDiseases();
    this.confirmDiseasesSubscription =
      this.ncdScreeningService.enableDiseaseConfirmForm$.subscribe(
        (response: any) => {
          if (response === 'idrs') {
            this.idrsOrCbac = response;
            this.diseaseFormsArray = this.getData();
            while (this.getData().length) {
              this.diseaseFormsArray.removeAt(0);
            }
            this.getPatientRevisitSuspectedDieseaData();
          } else if (response === 'cbac') {
            this.idrsOrCbac = response;
            this.diseaseFormsArray = this.getData();
            while (this.getData().length) {
              this.diseaseFormsArray.removeAt(0);
            }
            this.getpatientDiseasesata();
          }
        },
      );
    this.diseaseFormsArray = this.getData();
    while (this.getData().length) {
      this.diseaseFormsArray.removeAt(0);
    }

    if (String(this.mode) !== 'view') {
      if (this.idrsOrCbac === 'cbac') this.getpatientDiseasesata();
      else if (this.idrsOrCbac === 'idrs')
        this.getPatientRevisitSuspectedDieseaData();
    }

    this.attendantType = this.route.snapshot.params['attendant'];
    if (
      this.attendantType === 'doctor' ||
      this.attendantType === 'tcspecialist'
    ) {
      this.isDoctor = true;
    }
  }

  getDiseaseFormArray(): any {
    return (this.diseaseFormsGroup.get('diseaseFormsArray') as FormArray)
      .controls;
  }

  ngOnChanges() {
    if (String(this.mode) === 'view') {
      const visitID = this.sessionstorage.getItem('visitID');
      const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
      if (visitID !== null && benRegID !== null) {
        if (this.idrsOrCbac === 'idrs')
          this.getIDRSDetailsFrmNurse(visitID, benRegID);
        else if (this.idrsOrCbac === 'cbac')
          this.getCbacDiseaseDetailsFromNurse(visitID, benRegID);
      }
    }
  }

  ngOnDestroy() {
    if (this.beneficiaryDetailsSubscription)
      this.beneficiaryDetailsSubscription.unsubscribe();

    if (this.cbacDiseaseDetailsSubscription)
      this.cbacDiseaseDetailsSubscription.unsubscribe();

    if (this.patientDiseasesDataSub) this.patientDiseasesDataSub.unsubscribe();

    if (this.patientDiseasesata) this.patientDiseasesata.unsubscribe();

    if (this.IDRSDetailsSubscription)
      this.IDRSDetailsSubscription.unsubscribe();

    if (this.confirmDiseasesSubscription)
      this.confirmDiseasesSubscription.unsubscribe();
  }
  getData() {
    return this.diseaseFormsGroup.get('diseaseFormsArray') as FormArray;
  }

  addMoreDiseases(data: any) {
    this.getData().push(
      new VisitDetailUtils(
        this.fb,
        this.sessionstorage,
      ).createPatientDiseaseArrayForm(data),
    );
  }
  fetchPreviousVisitConfirmedDiseases() {
    const obj = {
      beneficiaryRegId: this.sessionstorage.getItem('beneficiaryRegID'),
    };
    this.nurseService.getPreviousVisitConfirmedDiseases(obj).subscribe(
      (value: any) => {
        if (
          value !== undefined &&
          value.statusCode === 200 &&
          value.data !== null &&
          value.data !== undefined &&
          value.data.confirmedDiseases !== undefined &&
          value.data.confirmedDiseases !== null
        ) {
          this.confirmedDiseasesOnPreviousVisit = value.data.confirmedDiseases;
          this.doctorService.setPreviousVisitConfirmedDiseases(
            value.data.confirmedDiseases,
          );
        }
      },
      (err) => {
        console.log(err.errorMessage());
      },
    );
  }

  getPreviousVisitConfirmedDiseases() {
    this.previousConfirmedDiseases = [];

    if (
      this.confirmedDiseasesOnPreviousVisit !== undefined &&
      this.confirmedDiseasesOnPreviousVisit !== null
    ) {
      this.previousConfirmedDiseases = this.confirmedDiseasesOnPreviousVisit;
      if (this.previousConfirmedDiseases.length > 0) {
        this.previousConfirmedDiseases.forEach((elementValue: any) => {
          this.diseaseArray.forEach((confirmedValue: any) => {
            if (
              confirmedValue.disease.trim().toLowerCase() ===
              elementValue.trim().toLowerCase()
            )
              confirmedValue.selected = true;
          });
        });
      }
    }

    while (this.getData().length) {
      this.diseaseFormsArray.removeAt(0);
    }

    this.diseaseArray.filter((form: any) => {
      if (
        this.beneficiaryGender !== undefined &&
        this.beneficiaryGender !== null &&
        this.beneficiaryGender.toLowerCase() === 'male'
      ) {
        if (
          form.disease.toLowerCase() === environment.diabetes.toLowerCase() ||
          form.disease.toLowerCase() ===
            environment.hypertension.toLowerCase() ||
          form.disease.toLowerCase() === environment.oral.toLowerCase()
        )
          this.addMoreDiseases(form);
      } else {
        if (
          form.disease.toLowerCase() === environment.diabetes.toLowerCase() ||
          form.disease.toLowerCase() ===
            environment.hypertension.toLowerCase() ||
          form.disease.toLowerCase() === environment.oral.toLowerCase() ||
          form.disease.toLowerCase() === environment.cervical.toLowerCase() ||
          form.disease.toLowerCase() === environment.breast.toLowerCase()
        )
          this.addMoreDiseases(form);
      }
    });

    this.checkedCbacDiseases();

    this.diseaseArray.forEach((res: any, index: any) => {
      if (res.selected === true) {
        const diseaseformArraygroup = (<FormGroup>(
          this.diseaseFormsGroup.controls['diseaseFormsArray']
        )).controls[index];
        (<FormGroup>diseaseformArraygroup).controls['selected'].disable();
      }
    });
  }

  cbacDiseaseDetailsSubscription: any;
  patientDiseasesDataSub: any;
  getCbacDiseaseDetailsFromNurse(visitID: any, benRegID: any) {
    this.patientDiseasesDataSub =
      this.masterdataService.nurseMasterData$.subscribe((data) => {
        if (data) {
          if (this.patientDiseasesata) this.patientDiseasesata.unsubscribe();
          this.confirmedDisease = data.screeningCondition;

          if (this.confirmedDisease && this.confirmedDisease.length > 0) {
            const obj = {
              beneficiaryRegId: benRegID,
              visitCode: this.sessionstorage.getItem('visitCode'),
            };

            this.cbacDiseaseDetailsSubscription = this.nurseService
              .getCbacDetailsFromNurse(obj)
              .subscribe((value: any) => {
                if (
                  value !== null &&
                  value.statusCode === 200 &&
                  value.data !== null &&
                  value.data !== undefined
                ) {
                  this.diseases = [];
                  this.diseaseArray = [];
                  for (let i = 0; i < this.confirmedDisease.length; i++) {
                    if (
                      this.confirmedDisease[i].name === environment.diabetes
                    ) {
                      this.diseases.push({
                        disease: this.confirmedDisease[i].name,
                        flag: null,
                        selected:
                          value.data.diabetes !== undefined &&
                          value.data.diabetes !== null
                            ? value.data.diabetes.confirmed !== null
                              ? value.data.diabetes.confirmed
                              : false
                            : false,
                      });
                    }
                    if (
                      this.confirmedDisease[i].name === environment.hypertension
                    ) {
                      this.diseases.push({
                        disease: this.confirmedDisease[i].name,
                        flag: null,
                        selected:
                          value.data.hypertension !== undefined &&
                          value.data.hypertension !== null
                            ? value.data.hypertension.confirmed !== null
                              ? value.data.hypertension.confirmed
                              : false
                            : false,
                      });
                    }
                    if (this.confirmedDisease[i].name === environment.breast) {
                      this.diseases.push({
                        disease: this.confirmedDisease[i].name,
                        flag: null,
                        selected:
                          value.data.breast !== undefined &&
                          value.data.breast !== null
                            ? value.data.breast.confirmed !== null
                              ? value.data.breast.confirmed
                              : false
                            : false,
                      });
                    }
                    if (
                      this.confirmedDisease[i].name === environment.cervical
                    ) {
                      this.diseases.push({
                        disease: this.confirmedDisease[i].name,
                        flag: null,
                        selected:
                          value.data.cervical !== undefined &&
                          value.data.cervical !== null
                            ? value.data.cervical.confirmed !== null
                              ? value.data.cervical.confirmed
                              : false
                            : false,
                      });
                    }
                    if (this.confirmedDisease[i].name === environment.oral) {
                      this.diseases.push({
                        disease: this.confirmedDisease[i].name,
                        flag: null,
                        selected:
                          value.data.oral !== undefined &&
                          value.data.oral !== null
                            ? value.data.oral.confirmed !== null
                              ? value.data.oral.confirmed
                              : false
                            : false,
                      });
                    }
                  }
                  this.diseaseFormsArray = this.getData();
                  while (this.getData().length) {
                    this.diseaseFormsArray.removeAt(0);
                  }

                  this.diseaseArray = this.diseases;
                  this.diseaseArray.forEach((form: any, index: any) => {
                    if (
                      this.beneficiaryGender !== undefined &&
                      this.beneficiaryGender !== null &&
                      this.beneficiaryGender.toLowerCase() === 'male'
                    ) {
                      if (
                        form.disease.toLowerCase() ===
                          environment.diabetes.toLowerCase() ||
                        form.disease.toLowerCase() ===
                          environment.hypertension.toLowerCase() ||
                        form.disease.toLowerCase() ===
                          environment.oral.toLowerCase()
                      )
                        this.addMoreDiseases(form);
                    } else {
                      if (
                        form.disease.toLowerCase() ===
                          environment.diabetes.toLowerCase() ||
                        form.disease.toLowerCase() ===
                          environment.hypertension.toLowerCase() ||
                        form.disease.toLowerCase() ===
                          environment.oral.toLowerCase() ||
                        form.disease.toLowerCase() ===
                          environment.cervical.toLowerCase() ||
                        form.disease.toLowerCase() ===
                          environment.breast.toLowerCase()
                      )
                        this.addMoreDiseases(form);
                    }
                  });

                  this.checkedCbacDiseases();
                }
              });
          }
        }
      });
  }

  checkedCbacDiseases() {
    if (this.diseaseFormsGroup.value) {
      this.diseasearray = [];

      const diseaseFormsArrayControl =
        this.diseaseFormsGroup.get('diseaseFormsArray');
      if (diseaseFormsArrayControl) {
        this.diseasearray = diseaseFormsArrayControl.value;
      } else {
        // Handle the case when diseaseFormsArrayControl is null
      }

      const arrayDiseases: any = [];
      this.diseasearray.forEach((value: any) => {
        if (value.selected !== false) arrayDiseases.push(value.diseaseName);
      });

      this.ncdScreeningService.setConfirmedDiseasesForScreening(arrayDiseases);

      if (
        arrayDiseases.length > 0 &&
        this.previousConfirmedDiseases.length <= 0
      ) {
        this.nurseService.diseaseFileUpload = true;
      } else if (arrayDiseases.length > this.previousConfirmedDiseases.length) {
        this.nurseService.diseaseFileUpload = true;
      } else {
        this.nurseService.diseaseFileUpload = false;
      }
    }
  }

  checked(event: any, item: any) {
    console.log(event.checked);
    console.log(this.diseaseFormsGroup.value);
    if (this.diseaseFormsGroup.value) {
      const diseaseFormsArrayControl =
        this.diseaseFormsGroup.get('diseaseFormsArray');
      if (diseaseFormsArrayControl) {
        this.diseasearray = diseaseFormsArrayControl.value;
      } else {
        // Handle the case when diseaseFormsArrayControl is null
      }

      const ar: any = [];
      this.diseasearray.forEach((value: any) => {
        if (value.selected !== false) ar.push(value.diseaseName);
      });
      console.log('diseasearray', ar);
      if (!event.checked) {
        if (item.value.diseaseName === 'Hypertension') {
          this.idrsScoreService.clearHypertensionSelected();
        }
        if (item.value.diseaseName === 'Diabetes') {
          // this.idrsScoreService.clearConfirmedDiabeticSelected();
        }
        this.idrsScoreService.setUnchecked(item.value.diseaseName);
      } else {
        if (item.value.diseaseName === 'Hypertension') {
          this.idrsScoreService.setHypertensionSelected();
        }
        if (item.value.diseaseName === 'Diabetes') {
          // this.idrsScoreService.setConfirmedDiabeticSelected();
        }

        this.idrsScoreService.setDiseasesSelected(ar);
      }
    }
  }
  nurseMasterDataSubscription: any;
  IDRSDetailsSubscription: any;
  questionArray = [];
  getIDRSDetailsFrmNurse(visitID: any, benRegID: any) {
    this.nurseMasterDataSubscription =
      this.masterdataService.nurseMasterData$.subscribe((data) => {
        if (data) {
          if (this.nurseMasterDataSubscription)
            this.nurseMasterDataSubscription.unsubscribe();
          this.questions = data.IDRSQuestions;
          this.diseases = [];
          this.diseaseArray = [];
          if (this.questions && this.questions.length > 0) {
            for (let i = 0; i < this.questions.length; i++) {
              if (i !== 0) {
                console.log(
                  this.questions.DiseaseQuestionType !==
                    this.questions[i - 1].DiseaseQuestionType,
                );
                if (
                  this.questions[i].DiseaseQuestionType !==
                  this.questions[i - 1].DiseaseQuestionType
                )
                  this.diseases.push({
                    disease: this.questions[i].DiseaseQuestionType,
                    flag: null,
                    selected: false,
                    current: false,
                  });
              } else
                this.diseases.push({
                  disease: this.questions[i].DiseaseQuestionType,
                  flag: null,
                  selected: false,
                  current: false,
                });
            }

            this.diseaseArray = this.diseases;
          }
          const obj = {
            benRegID: this.sessionstorage.getItem('beneficiaryRegID'),
          };
          this.nurseService.getPreviousVisitData(obj).subscribe((res: any) => {
            if (res.statusCode === 200 && res.data !== null) {
              this.suspect = [];
              if (
                res.data.confirmedDisease !== undefined &&
                res.data.confirmedDisease !== null
              )
                this.suspect = res.data.confirmedDisease.split(',');
              if (res.data.isDiabetic) this.addToSuspected('Diabetes');
              if (res.data.isDefectiveVision)
                this.addToSuspected('Vision Screening');
              if (res.data.isEpilepsy) this.addToSuspected('Epilepsy');
              if (res.data.isHypertension) this.addToSuspected('Hypertension');

              this.suspect.forEach((element: any) => {
                this.diseaseArray.forEach((value: any) => {
                  if (value.disease === element) value.selected = true;
                  if (element === 'Hypertension') {
                    this.idrsScoreService.setHypertensionSelected();
                  }
                  if (element === 'Diabetes') {
                    // this.idrsScoreService.setConfirmedDiabeticSelected();
                  }
                });
              });
              this.IDRSDetailsSubscription = this.doctorService
                .getIDRSDetails(benRegID, visitID)
                .subscribe((value: any) => {
                  if (
                    value !== null &&
                    value !== undefined &&
                    value.statusCode === 200 &&
                    value.data !== null &&
                    value.data !== undefined
                  ) {
                    this.questionArray = [];
                    let suspect1 = [];
                    if (
                      value.data.IDRSDetail !== undefined &&
                      value.data.IDRSDetail !== null &&
                      value.data.IDRSDetail.confirmedDisease !== null &&
                      value.data.IDRSDetail.confirmedDisease !== undefined
                    )
                      suspect1 =
                        value.data.IDRSDetail.confirmedDisease.split(',');
                    if (
                      suspect1 !== undefined &&
                      suspect1 !== null &&
                      suspect1.length > 0
                    ) {
                      if (this.suspect !== null && this.suspect.length === 0) {
                        this.suspect = suspect1;
                        this.suspect.forEach((value: any) => {
                          this.diseaseArray.forEach((val: any) => {
                            if (val.disease === value) val.current = true;
                          });
                        });
                      } else {
                        let check = false;
                        suspect1.forEach((element: any) => {
                          check = false;
                          this.suspect.forEach((value: any) => {
                            if (value === element) {
                              check = true;
                            }
                          });
                          if (!check) {
                            this.addToSuspected(element);
                            this.diseaseArray.forEach((val: any) => {
                              if (val.disease === element) val.current = true;
                            });
                          }
                        });
                      }
                    }

                    this.suspect.forEach((element: any) => {
                      this.diseaseArray.forEach((value: any) => {
                        if (value.disease === element) value.selected = true;
                        if (element === 'Hypertension') {
                          this.idrsScoreService.setHypertensionSelected();
                        }
                        if (element === 'Diabetes') {
                          // this.idrsScoreService.setConfirmedDiabeticSelected();
                        }
                      });
                    });
                    this.diseaseFormsArray = this.getData();
                    while (this.getData().length) {
                      this.diseaseFormsArray.removeAt(0);
                    }

                    for (const d of this.diseaseArray) {
                      this.addMoreDiseases(d);
                    }
                  }
                  this.diseaseArray.forEach((res: any, index: any) => {
                    if (res.selected === true && res.current === false) {
                      const diseaseformArraygroup = (<FormGroup>(
                        this.diseaseFormsGroup.controls['diseaseFormsArray']
                      )).controls[index];
                      (<FormGroup>diseaseformArraygroup).controls[
                        'selected'
                      ].disable();
                    }
                  });
                  const ar: any = [];
                  this.diseaseArray.forEach((value: any) => {
                    if (value.selected) ar.push(value.disease);
                  });
                  console.log('diseasearray', ar);
                  this.idrsScoreService.setDiseasesSelected(ar);
                });
            }
          });
        }
      });
  }
  diseasesMasterData: any;
  getDiseasesMasterData() {
    this.diseasesMasterData = this.masterdataService.nurseMasterData$.subscribe(
      (data) => {
        if (data) {
          if (this.diseasesMasterData) this.diseasesMasterData.unsubscribe();
          this.questions = data.IDRSQuestions;
          this.diseases = [];
          this.diseaseArray = [];
          if (this.questions && this.questions.length > 0) {
            for (let i = 0; i < this.questions.length; i++) {
              if (i !== 0) {
                console.log(
                  this.questions.DiseaseQuestionType !==
                    this.questions[i - 1].DiseaseQuestionType,
                );
                if (
                  this.questions[i].DiseaseQuestionType !==
                  this.questions[i - 1].DiseaseQuestionType
                )
                  this.diseases.push({
                    disease: this.questions[i].DiseaseQuestionType,
                    flag: null,
                    selected: false,
                    current: false,
                  });
              } else
                this.diseases.push({
                  disease: this.questions[i].DiseaseQuestionType,
                  flag: null,
                  selected: false,
                  current: false,
                });
            }
            this.diseaseArray = this.diseases;
            for (const d of this.diseaseArray) {
              this.addMoreDiseases(d);
            }
            this.diseaseArray.forEach((res: any, index: any) => {
              if (res.selected === true) {
                const diseaseformArraygroup = (<FormGroup>(
                  this.diseaseFormsGroup.controls['diseaseFormsArray']
                )).controls[index];
                (<FormGroup>diseaseformArraygroup).controls[
                  'selected'
                ].disable();
              }
            });
          }
        }
      },
    );
  }
  addToSuspected(val: any) {
    let flag = false;
    for (let i = 0; i < this.suspect.length; i++) {
      if (this.suspect[i] === val) flag = true;
    }
    if (!flag) {
      this.suspect.push(val);
    }
  }

  beneficiaryDetailsSubscription: any;
  getBenificiaryDetails() {
    this.beneficiaryDetailsSubscription =
      this.beneficiaryDetailsService.beneficiaryDetails$.subscribe(
        (beneficiaryDetails) => {
          if (beneficiaryDetails) {
            this.beneficiaryGender = beneficiaryDetails.genderName;
          }
        },
      );
  }
  patientDiseasesata: any;
  getpatientDiseasesata() {
    this.patientDiseasesata = this.masterdataService.nurseMasterData$.subscribe(
      (data) => {
        if (data) {
          if (this.patientDiseasesata) this.patientDiseasesata.unsubscribe();
          this.confirmedDisease = data.screeningCondition;
          this.diseases = [];
          this.diseaseArray = [];
          if (this.confirmedDisease && this.confirmedDisease.length > 0) {
            for (let i = 0; i < this.confirmedDisease.length; i++) {
              this.diseases.push({
                disease: this.confirmedDisease[i].name,
                flag: null,
                selected: false,
              });
            }
            this.diseaseArray = this.diseases;

            this.getPreviousVisitConfirmedDiseases();
          }
        }
      },
    );
  }
  patientRevisitSuspectedDieseaData: any;
  getPatientRevisitSuspectedDieseaData() {
    this.patientRevisitSuspectedDieseaData =
      this.masterdataService.nurseMasterData$.subscribe((data) => {
        if (data) {
          if (this.patientRevisitSuspectedDieseaData)
            this.patientRevisitSuspectedDieseaData.unsubscribe();
          this.questions = data.IDRSQuestions;
          this.diseases = [];
          this.diseaseArray = [];
          if (this.questions && this.questions.length > 0) {
            for (let i = 0; i < this.questions.length; i++) {
              if (i !== 0) {
                if (
                  this.questions[i].DiseaseQuestionType !==
                  this.questions[i - 1].DiseaseQuestionType
                )
                  this.diseases.push({
                    disease: this.questions[i].DiseaseQuestionType,
                    flag: null,
                    selected: false,
                  });
              } else
                this.diseases.push({
                  disease: this.questions[i].DiseaseQuestionType,
                  flag: null,
                  selected: false,
                });
            }
            this.diseaseArray = this.diseases;

            const obj = {
              benRegID: this.sessionstorage.getItem('beneficiaryRegID'),
            };
            this.nurseService
              .getPreviousVisitData(obj)
              .subscribe((res: any) => {
                if (res.statusCode === 200 && res.data !== null) {
                  this.suspect = [];
                  if (
                    res.data.confirmedDisease !== undefined &&
                    res.data.confirmedDisease !== null
                  )
                    this.suspect = res.data.confirmedDisease.split(',');
                  if (res.data.isDiabetic) this.addToSuspected('Diabetes');
                  if (res.data.isDefectiveVision)
                    this.addToSuspected('Vision Screening');
                  if (res.data.isEpilepsy) this.addToSuspected('Epilepsy');
                  if (res.data.isHypertension)
                    this.addToSuspected('Hypertension');

                  this.suspect.forEach((element: any) => {
                    this.diseaseArray.forEach((value: any) => {
                      if (value.disease === element) value.selected = true;
                      if (element === 'Hypertension') {
                        this.idrsScoreService.setHypertensionSelected();
                      }
                    });
                  });
                  while (this.getData().length) {
                    this.diseaseFormsArray.removeAt(0);
                  }

                  this.diseaseArray.forEach((form: any, index: any) => {
                    if (
                      form.disease.toLowerCase() === 'diabetes' ||
                      form.disease.toLowerCase() === 'epilepsy' ||
                      form.disease.toLowerCase() === 'asthma' ||
                      form.disease.toLowerCase() === 'vision screening' ||
                      form.disease.toLowerCase() === 'tuberculosis screening' ||
                      form.disease.toLowerCase() === 'malaria screening' ||
                      form.disease.toLowerCase() === 'hypertension'
                    )
                      this.addMoreDiseases(form);
                  });
                  this.diseaseArray.forEach((res: any, index: any) => {
                    if (res.selected === true) {
                      const diseaseformArraygroup = (<FormGroup>(
                        this.diseaseFormsGroup.controls['diseaseFormsArray']
                      )).controls[index];
                      (<FormGroup>diseaseformArraygroup).controls[
                        'selected'
                      ].disable();
                    }
                  });
                }
                const ar: any = [];
                this.diseaseArray.forEach((value: any) => {
                  if (value.selected) ar.push(value.disease);
                });
                console.log('diseasearray', ar);
                this.idrsScoreService.setDiseasesSelected(ar);
              });
          }
        }
      });
  }
  addToChronicDiseases(res: any) {
    const tempdiseaseformArray = (<FormGroup>(
      this.diseaseFormsGroup.controls['diseaseFormsArray']
    )).value;
    tempdiseaseformArray.forEach((element: any, i: any) => {
      if (
        res.data.isDefectiveVision === true &&
        element.diseaseName === 'Vision Screening'
      ) {
        const diseaseformArraygroup = (<FormGroup>(
          this.diseaseFormsGroup.controls['diseaseFormsArray']
        )).controls[i];
        diseaseformArraygroup.patchValue({
          disease: element.diseaseName,
          flag: null,
          selected: true,
        });
        (<FormGroup>diseaseformArraygroup).controls['selected'].disable();
      } else if (
        res.data.isDiabetic === true &&
        element.diseaseName === 'Diabetes'
      ) {
        const diseaseformArraygroup = (<FormGroup>(
          this.diseaseFormsGroup.controls['diseaseFormsArray']
        )).controls[i];
        diseaseformArraygroup.patchValue({
          disease: element.diseaseName,
          flag: null,
          selected: true,
        });
        (<FormGroup>diseaseformArraygroup).controls['selected'].disable();
      } else if (
        res.data.isEpilepsy === true &&
        element.diseaseName === 'Epilepsy'
      ) {
        const diseaseformArraygroup = (<FormGroup>(
          this.diseaseFormsGroup.controls['diseaseFormsArray']
        )).controls[i];
        diseaseformArraygroup.patchValue({
          disease: element.diseaseName,
          flag: null,
          selected: true,
        });
        (<FormGroup>diseaseformArraygroup).controls['selected'].disable();
      } else if (
        res.data.isHypertension === true &&
        element.diseaseName === 'Hypertension'
      ) {
        const diseaseformArraygroup = (<FormGroup>(
          this.diseaseFormsGroup.controls['diseaseFormsArray']
        )).controls[i];
        diseaseformArraygroup.patchValue({
          disease: element.diseaseName,
          flag: null,
          selected: true,
        });
        (<FormGroup>diseaseformArraygroup).controls['selected'].disable();
      }
    });
  }
}
