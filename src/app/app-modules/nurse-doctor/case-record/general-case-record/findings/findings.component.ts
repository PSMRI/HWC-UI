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
  Input,
  DoCheck,
  OnChanges,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  FormArray,
  AbstractControl,
} from '@angular/forms';

import {
  MasterdataService,
  DoctorService,
  NurseService,
} from '../../../shared/services';
import { BeneficiaryDetailsService } from '../../../../core/services/beneficiary-details.service';
import { ValidationUtils } from '../../../shared/utility/validation-utility';
import { ConfirmationService } from '../../../../core/services/confirmation.service';

import { GeneralUtils } from '../../../shared/utility/general-utility';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { Subscription } from 'rxjs';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { AmritTrackingService } from 'Common-UI/src/tracking';

@Component({
  selector: 'app-findings',
  templateUrl: './findings.component.html',
  styleUrls: ['./findings.component.css'],
})
export class FindingsComponent implements OnInit, DoCheck, OnDestroy {
  @Input()
  generalFindingsForm!: FormGroup;

  @Input()
  caseRecordMode!: string;

  beneficiaryRegID: any;
  visitID: any;
  visitCategory: any;
  formUtils: GeneralUtils;

  complaintDuration = ['Hours', 'Weeks', 'Days', 'Months', 'Years'];

  chiefComplaintMaster: any;
  chiefComplaintTemporarayList: any = [];
  selectedChiefComplaintList: any = [];
  suggestedChiefComplaintList: any = [];

  beneficiary: any;
  complaintList: any = [];
  current_language_set: any;
  enableIsHistory = false;
  enableProvisionalDiag = false;
  displayedColumns: any = [
    'chiefComplaintsDetails',
    'duration',
    'unitOfDuration',
    'description',
  ];

  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
  dataSource = new MatTableDataSource<any>();

  constructor(
    private fb: FormBuilder,
    private masterdataService: MasterdataService,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    private doctorService: DoctorService,
    private confirmationService: ConfirmationService,
    public httpServiceService: HttpServiceService,
    private nurseService: NurseService,
    readonly sessionstorage: SessionStorageService,
    private trackingService: AmritTrackingService,
  ) {
    this.formUtils = new GeneralUtils(this.fb, this.sessionstorage);
  }

  ngOnInit() {
    this.assignSelectedLanguage();
    this.visitCategory = this.sessionstorage.getItem('visitCategory');
    this.getDoctorMasterData();
    this.getBeneficiaryDetails();
    this.nurseService.clearNCDScreeningProvision();
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }

  trackFieldInteraction(fieldName: string) {
    try {
      this.trackingService.trackFieldInteraction(fieldName, 'Findings');
    } catch (error) {
      console.error(`❌ Error tracking findings ${fieldName}:`, error);
    }
  }

  getComplaints(): AbstractControl[] | null {
    const complaintsControl = this.generalFindingsForm.get('complaints');
    return complaintsControl instanceof FormArray
      ? complaintsControl.controls
      : null;
  }

  getClinicalObservationsList(): AbstractControl[] | null {
    const clinicalObservationsData = this.generalFindingsForm.get(
      'clinicalObservationsList',
    );
    return clinicalObservationsData instanceof FormArray
      ? clinicalObservationsData.controls
      : null;
  }

  getSignificantFindingsList(): AbstractControl[] | null {
    const significantFindingsData = this.generalFindingsForm.get(
      'significantFindingsList',
    );
    return significantFindingsData instanceof FormArray
      ? significantFindingsData.controls
      : null;
  }

  findingSubscription!: Subscription;
  getFindingDetails() {
    this.findingSubscription =
      this.doctorService.populateCaserecordResponse$.subscribe((res) => {
        if (res && res.statusCode === 200 && res.data && res.data.findings) {
          const findings = res.data.findings;
          this.dataSource.data = [];
          this.dataSource.data = findings.complaints.slice();
          this.dataSource.paginator = this.paginator;
          this.patchCapturedClinicalObservations(
            res.data.findings.clinicalObservationsList,
          );
          this.patchCapturedSignificantFindings(
            res.data.findings.significantFindingsList,
          );
          this.complaintList = findings.complaints.slice();
          this.complaintList.forEach((element: any, i: any) => {
            this.filterInitialComplaints(element);
          });
          findings.complaints = [];
          this.generalFindingsForm.patchValue(res.data.findings);
        }
      });
  }

  testMMUFindingsSubscription: any;
  getMMUFindingDetails(
    beneficiaryRegID: any,
    visitID: any,
    visitCategory: any,
    visitCode: any,
  ) {
    const caseRecordData = (this.findingSubscription =
      this.doctorService.getMMUCaseRecordAndReferDetails(
        beneficiaryRegID,
        visitID,
        visitCategory,
        visitCode,
      ));
    if (caseRecordData) {
      caseRecordData.subscribe((res: any) => {
        if (res && res.statusCode === 200 && res.data && res.data.findings) {
          const findings = res.data.findings;
          this.complaintList = findings.complaints.slice();
          this.complaintList.forEach((element: any, i: any) => {
            this.filterInitialComplaints(element);
          });
          findings.complaints = [];
          this.generalFindingsForm.patchValue(res.data.findings);
        }
      });
    }
  }

  filterInitialComplaints(element: any) {
    const arr = this.chiefComplaintMaster.filter((item: any) => {
      return item.chiefComplaint === element.chiefComplaint;
    });

    if (arr.length > 0) {
      const index = this.chiefComplaintTemporarayList[0].indexOf(arr[0]);
      const index2 = this.chiefComplaintMaster.indexOf(arr[0]);

      if (index >= 0) this.chiefComplaintTemporarayList[0].splice(index, 1);

      if (index2 >= 0) this.chiefComplaintMaster.splice(index2, 1);
    }
  }

  beneficiaryDetailSubscription: any;
  getBeneficiaryDetails() {
    this.beneficiaryDetailSubscription =
      this.beneficiaryDetailsService.beneficiaryDetails$.subscribe(
        (beneficiary) => {
          this.beneficiary = beneficiary;
        },
      );
  }

  doctorMasterDataSubscription: any;
  getDoctorMasterData() {
    this.doctorMasterDataSubscription =
      this.masterdataService.nurseMasterData$.subscribe((masterData) => {
        if (masterData) {
          this.chiefComplaintMaster = masterData.chiefComplaintMaster.slice();
          this.chiefComplaintTemporarayList[0] =
            this.chiefComplaintMaster.slice();

          if (String(this.caseRecordMode) === 'view') {
            this.beneficiaryRegID =
              this.sessionstorage.getItem('beneficiaryRegID');
            this.visitID = this.sessionstorage.getItem('visitID');
            this.visitCategory = this.sessionstorage.getItem('visitCategory');
            const specialistFlagString =
              this.sessionstorage.getItem('specialist_flag');
            if (
              this.sessionstorage.getItem('referredVisitCode') ===
                'undefined' ||
              this.sessionstorage.getItem('referredVisitCode') === null ||
              this.sessionstorage.getItem('referredVisitCode') === ''
            ) {
              this.getFindingDetails();
            } else if (
              specialistFlagString !== null &&
              parseInt(specialistFlagString) === 3
            ) {
              this.getMMUFindingDetails(
                this.beneficiaryRegID,
                this.visitID,
                this.visitCategory,
                this.sessionstorage.getItem('visitCode'),
              );
            } else {
              this.getMMUFindingDetails(
                this.beneficiaryRegID,
                this.sessionstorage.getItem('referredVisitID'),
                this.visitCategory,
                this.sessionstorage.getItem('referredVisitCode'),
              );
            }
          }
        }
      });
  }
  getSCTid(event: any, index: any) {
    console.log('called', index, event);
    this.masterdataService.getSnomedCTRecord(event.chiefComplaint).subscribe(
      (res: any) => {
        if (res && res.statusCode === 200) {
          this.loadConceptID(res.data, index);
        }
      },
      (error) => {},
    );
  }

  loadConceptID(data: any, index: any) {
    console.log(this.generalFindingsForm.value, data);
    const id = <FormArray>this.generalFindingsForm.controls['complaints'];
    id.at(index).patchValue({
      conceptID: data.conceptID,
    });
  }

  filterComplaints(chiefComplaintValue: any, i: any) {
    this.suggestChiefComplaintList(
      this.fb.group({ chiefComplaint: chiefComplaintValue }),
      i,
    );
    this.setTempvalidation();
    const arr = this.chiefComplaintMaster.filter((item: any) => {
      return item.chiefComplaint === chiefComplaintValue.chiefComplaint;
    });

    if (this.selectedChiefComplaintList && this.selectedChiefComplaintList[i]) {
      this.chiefComplaintTemporarayList.map((item: any, t: any) => {
        if (t !== i) {
          item.push(this.selectedChiefComplaintList[i]);
          this.sortChiefComplaintList(item);
        }
      });
    }

    if (arr.length > 0) {
      this.chiefComplaintTemporarayList.map((item: any, t: any) => {
        const index = item.indexOf(arr[0]);
        if (index !== -1 && t !== i) item = item.splice(index, 1);
      });
      this.selectedChiefComplaintList[i] = arr[0];
    }
  }

  addChiefComplaint() {
    const complaintFormArray = <FormArray>(
      this.generalFindingsForm.controls['complaints']
    );
    this.setTempvalidation();
    const complaintFormArrayValue = complaintFormArray.value;
    const temp = this.chiefComplaintMaster.filter((item: any) => {
      const arr = complaintFormArrayValue.filter((value: any) => {
        return value.chiefComplaint.chiefComplaint === item.chiefComplaint;
      });
      const flag = arr.length === 0 ? true : false;
      return flag;
    });
    if (temp.length > 0) {
      this.chiefComplaintTemporarayList.push(temp);
    }
    complaintFormArray.push(this.formUtils.initChiefComplaints());
  }

  removeChiefComplaint(i: number, complaintForm: AbstractControl<any, any>) {
    this.confirmationService
      .confirm(`warn`, this.current_language_set.alerts.info.warn)
      .subscribe((result) => {
        if (result) {
          const complaintFormArray = <FormArray>(
            this.generalFindingsForm.controls['complaints']
          );
          this.generalFindingsForm.markAsDirty();

          let arr: any = [];
          if (complaintForm.value.chiefComplaint) {
            arr = this.chiefComplaintMaster.filter((item: any) => {
              return (
                item.chiefComplaint ===
                complaintForm.value.chiefComplaint.chiefComplaint
              );
            });
          }
          if (arr.length > 0) {
            this.chiefComplaintTemporarayList.forEach(
              (element: any, t: any) => {
                if (t !== i) element.push(arr[0]);
                this.sortChiefComplaintList(element);
              },
            );
          }
          if (this.selectedChiefComplaintList[i])
            this.selectedChiefComplaintList[i] = null;

          if (this.suggestedChiefComplaintList[i])
            this.suggestedChiefComplaintList[i] = null;

          if (complaintFormArray.length === 1 && complaintForm)
            complaintForm.reset();
          else complaintFormArray.removeAt(i);
          this.setTempvalidation();
        }
      });
  }

  setTempvalidation() {
    const chiefComplaintForm = <FormGroup>(
      this.generalFindingsForm.controls['complaints']
    );
    let flag = false;
    this.enableProvisionalDiag = false;
    if (
      chiefComplaintForm !== undefined &&
      chiefComplaintForm.value.length > 0
    ) {
      for (let i = 0; i < chiefComplaintForm.value.length; i++) {
        if (chiefComplaintForm.value[i].chiefComplaint !== null) {
          this.enableProvisionalDiag = true;
          if (
            chiefComplaintForm.value[i].chiefComplaint.chiefComplaint ===
            'Fever'
          ) {
            flag = true;
            break;
          }
          if (
            chiefComplaintForm.value[i].chiefComplaint.chiefComplaint
              .toLowerCase()
              .includes('fever') ||
            chiefComplaintForm.value[i].chiefComplaint.chiefComplaint
              .toLowerCase()
              .includes('cough') ||
            chiefComplaintForm.value[i].chiefComplaint.chiefComplaint
              .toLowerCase()
              .includes('congestion') ||
            chiefComplaintForm.value[i].chiefComplaint.chiefComplaint
              .toLowerCase()
              .includes('asthma') ||
            chiefComplaintForm.value[i].chiefComplaint.chiefComplaint
              .toLowerCase()
              .includes('copd') ||
            chiefComplaintForm.value[i].chiefComplaint.chiefComplaint
              .toLowerCase()
              .includes('influenza') ||
            chiefComplaintForm.value[i].chiefComplaint.chiefComplaint
              .toLowerCase()
              .includes('pneumonia') ||
            chiefComplaintForm.value[i].chiefComplaint.chiefComplaint
              .toLowerCase()
              .includes('tuberculosis') ||
            chiefComplaintForm.value[i].chiefComplaint.chiefComplaint
              .toLowerCase()
              .includes('lung cancer') ||
            chiefComplaintForm.value[i].chiefComplaint.chiefComplaint
              .toLowerCase()
              .includes('breathing problems')
          ) {
            flag = true;
            break;
          }
        }
      }
    }
    if (flag) this.nurseService.setNCDTemp(true);
    else this.nurseService.setNCDTemp(false);
    if (flag) this.nurseService.setEnableLAssessment(true);
    else this.nurseService.setEnableLAssessment(false);
    if (this.enableProvisionalDiag)
      this.nurseService.setNCDScreeningProvision(true);
    else this.nurseService.setNCDScreeningProvision(false);
  }
  validateDuration(formGroup: AbstractControl<any, any>, event?: Event) {
    let duration = null;
    let durationUnit = null;
    let flag = true;

    if (formGroup.value.duration) duration = formGroup.value.duration;

    if (formGroup.value.unitOfDuration)
      durationUnit = formGroup.value.unitOfDuration;

    if (duration !== null && durationUnit !== null)
      flag = new ValidationUtils().validateDuration(
        duration,
        durationUnit,
        this.beneficiary.age,
      );

    if (!flag) {
      this.confirmationService.alert(
        this.current_language_set.alerts.info.DurationAge,
      );
      formGroup.patchValue({ duration: null, unitOfDuration: null });
    }
  }

  displayChiefComplaint(complaint: any) {
    return complaint && complaint.chiefComplaint;
  }

  suggestChiefComplaintList(complaintForm: AbstractControl<any, any>, i: any) {
    const complaint = complaintForm.value.chiefComplaint;
    if (typeof complaint === 'string') {
      if (
        this.chiefComplaintTemporarayList !== undefined &&
        this.chiefComplaintTemporarayList !== null
      ) {
        this.suggestedChiefComplaintList[i] = this.chiefComplaintTemporarayList[
          i
        ].filter(
          (compl: any) =>
            compl.chiefComplaint
              .toLowerCase()
              .indexOf(complaint.toLowerCase().trim()) >= 0,
        );
      }
    } else if (typeof complaint === 'object' && complaint) {
      if (
        this.chiefComplaintTemporarayList !== undefined &&
        this.chiefComplaintTemporarayList !== null
      ) {
        this.suggestedChiefComplaintList[i] = this.chiefComplaintTemporarayList[
          i
        ].filter(
          (compl: any) =>
            compl.chiefComplaint
              .toLowerCase()
              .indexOf(complaint.chiefComplaint.toLowerCase().trim()) >= 0,
        );
      }
    }

    if (this.suggestedChiefComplaintList[i].length === 0) complaintForm.reset();
  }

  sortChiefComplaintList(complaintList: any) {
    complaintList.sort((a: any, b: any) => {
      if (a.chiefComplaint === b.chiefComplaint) return 0;
      if (a.chiefComplaint < b.chiefComplaint) return -1;
      else return 1;
    });
  }

  checkComplaintFormValidity(complaintForm: any) {
    const temp = complaintForm.value;
    if (temp.chiefComplaint && temp.duration && temp.unitOfDuration) {
      return false;
    } else {
      return true;
    }
  }
  validateAddedObservations(observations: any) {
    const temp = observations.value;
    if (temp.term && temp.conceptID) {
      return false;
    } else {
      return true;
    }
  }
  addObservations() {
    const clinicalObsList = this.generalFindingsForm.controls[
      'clinicalObservationsList'
    ] as FormArray;
    if (clinicalObsList.length <= 4) {
      clinicalObsList.push(this.formUtils.initClinicalObservationsList());
    } else {
      this.confirmationService.alert(this.current_language_set.maxObservations);
    }
  }

  removeObservationsFromList(
    index: any,
    observationsListForm: AbstractControl<any, any>,
  ) {
    const observationsArray = this.generalFindingsForm.controls[
      'clinicalObservationsList'
    ] as FormArray;
    if (observationsArray.at(index).valid) {
      this.confirmationService
        .confirm(`warn`, this.current_language_set.alerts.info.warn)
        .subscribe((result) => {
          if (result) {
            const observationsArray = this.generalFindingsForm.controls[
              'clinicalObservationsList'
            ] as FormArray;
            if (observationsArray.length > 1) {
              observationsArray.removeAt(index);
            } else {
              observationsListForm.reset();
            }
            this.generalFindingsForm.markAsDirty();
          }
        });
    } else {
      if (observationsArray.length > 1) {
        observationsArray.removeAt(index);
      } else {
        observationsListForm.reset();
      }
    }
  }

  validateAddedFindings(findings: any) {
    const temp = findings.value;
    if (temp.term && temp.conceptID) {
      return false;
    } else {
      return true;
    }
  }
  addFindings() {
    const findingsList = this.generalFindingsForm.controls[
      'significantFindingsList'
    ] as FormArray;
    if (findingsList.length <= 4) {
      findingsList.push(this.formUtils.initSignificantFindingsList());
    } else {
      this.confirmationService.alert(this.current_language_set.maxObservations);
    }
  }
  removeFindingsFromList(index: any, findingsList: AbstractControl<any, any>) {
    const findingsArray = this.generalFindingsForm.controls[
      'significantFindingsList'
    ] as FormArray;
    if (findingsArray.at(index).valid) {
      this.confirmationService
        .confirm(`warn`, this.current_language_set.alerts.info.warn)
        .subscribe((result) => {
          if (result) {
            const findingsArray = this.generalFindingsForm.controls[
              'significantFindingsList'
            ] as FormArray;
            if (findingsArray.length > 1) {
              findingsArray.removeAt(index);
            } else {
              findingsList.reset();
            }
            this.generalFindingsForm.markAsDirty();
            this.resetFindingsCheckbox(
              this.generalFindingsForm.controls[
                'significantFindingsList'
              ].value.at(0).term,
            );
          }
        });
    } else {
      if (findingsArray.length > 1) {
        findingsArray.removeAt(index);
      } else {
        findingsList.reset();
      }
      this.resetFindingsCheckbox(
        this.generalFindingsForm.controls['significantFindingsList'].value.at(0)
          .term,
      );
    }
  }
  patchCapturedClinicalObservations(clinicalObservations: any) {
    const savedObservations = clinicalObservations;
    const observationsList = this.generalFindingsForm.controls[
      'clinicalObservationsList'
    ] as FormArray;
    if (
      clinicalObservations !== undefined &&
      clinicalObservations[0].term !== 'null' &&
      clinicalObservations[0].term !== '' &&
      clinicalObservations[0].conceptID !== '' &&
      clinicalObservations[0].conceptID !== 'null'
    ) {
      for (let i = 0; i < savedObservations.length; i++) {
        observationsList.at(i).patchValue({
          clinicalObservationsProvided: savedObservations[i].term,
          term: savedObservations[i].term,
          conceptID: savedObservations[i].conceptID,
        });
        (<FormGroup>observationsList.at(i)).controls[
          'clinicalObservationsProvided'
        ].disable();
        if (observationsList.length < savedObservations.length)
          this.addObservations();
      }
    }
  }
  patchCapturedSignificantFindings(significantFindings: any) {
    const savedFindings = significantFindings;
    const findingsList = this.generalFindingsForm.controls[
      'significantFindingsList'
    ] as FormArray;
    if (
      significantFindings !== undefined &&
      significantFindings[0].term !== '' &&
      significantFindings[0].term !== 'null' &&
      significantFindings[0].conceptID !== '' &&
      significantFindings[0].conceptID !== 'null'
    ) {
      for (let i = 0; i < savedFindings.length; i++) {
        findingsList.at(i).patchValue({
          significantFindingsProvided: savedFindings[i].term,
          term: savedFindings[i].term,
          conceptID: savedFindings[i].conceptID,
        });
        (<FormGroup>findingsList.at(i)).controls[
          'significantFindingsProvided'
        ].disable();
        if (findingsList.length < savedFindings.length) this.addFindings();
      }
      this.resetFindingsCheckbox(
        this.generalFindingsForm.controls['significantFindingsList'].value.at(0)
          .term,
      );
    }
  }
  ngOnDestroy() {
    if (this.doctorMasterDataSubscription)
      this.doctorMasterDataSubscription.unsubscribe();
    if (this.beneficiaryDetailSubscription)
      this.beneficiaryDetailSubscription.unsubscribe();
    if (this.findingSubscription) {
      this.findingSubscription.unsubscribe();
    }
  }

  resetFindingsCheckbox(significantFindingsProvidedValue: any) {
    if (
      this.generalFindingsForm.controls['significantFindingsList'].value
        .length === 1 &&
      (significantFindingsProvidedValue === undefined ||
        significantFindingsProvidedValue === null ||
        significantFindingsProvidedValue === '')
    ) {
      this.generalFindingsForm.controls['isForHistory'].patchValue(null);
      this.enableIsHistory = false;
    }

    if (
      this.generalFindingsForm.controls['significantFindingsList'].value
        .length > 0 &&
      significantFindingsProvidedValue !== null &&
      significantFindingsProvidedValue !== ''
    ) {
      this.enableIsHistory = true;
    } else {
      this.enableIsHistory = false;
    }
  }
}
