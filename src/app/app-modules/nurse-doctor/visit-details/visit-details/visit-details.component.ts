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
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  MasterdataService,
  DoctorService,
  NurseService,
} from '../../shared/services';
import { BeneficiaryDetailsService } from '../../../core/services/beneficiary-details.service';
import { ActivatedRoute } from '@angular/router';
import { NcdScreeningService } from '../../shared/services/ncd-screening.service';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { environment } from 'src/environments/environment';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { AmritTrackingService } from 'Common-UI/src/tracking';

@Component({
  selector: 'app-patient-visit-details',
  templateUrl: './visit-details.component.html',
  styleUrls: ['./visit-details.component.css'],
})
export class PatientVisitDetailsComponent
  implements OnChanges, OnInit, DoCheck, OnDestroy
{
  @Input()
  patientVisitDetailsForm!: FormGroup;

  @Input()
  mode!: string;

  templateNurseMasterData: any;
  templateVisitCategories: any;
  templateVisitReasons: any;
  templateBeneficiaryDetails: any;
  templateFilterVisitCategories: any;
  templatePregnancyStatus = ['Yes', 'No', "Don't Know"];

  showPregnancyStatus = true;
  currentLanguageSet: any;
  disableVisit = false;
  cbacData: any = [];
  idrsCbac: any = [];
  showHistoryForm = false;
  hideVitalsFormForNcdScreening = false;
  enableCbac = false;
  keyType: any;

  enableOtherFpTextField = false;
  enableOtherSideEffectTextField = false;
  disableAllFpOptions = false;
  fpMethodList: any = [];
  sideEffectsList: any = [];
  beneficiaryAge = 0;
  attendant: any;
  previousConfirmedDiseasesList: any = [];
  enableConfirmedDiseases = false;
  subVisitCategory: any;
  templateSubVisitCategories: any = [];
  subVisitCategoryList: any = [];
  isRadioGroupVisible = false;
  constructor(
    private masterdataService: MasterdataService,
    private doctorService: DoctorService,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    public httpServiceService: HttpServiceService,
    private ncdScreeningService: NcdScreeningService,
    private nurseService: NurseService,
    private route: ActivatedRoute,
    readonly sessionstorage: SessionStorageService,
    private trackingService: AmritTrackingService,
  ) {}

  ngOnInit() {
    this.attendant = this.route.snapshot.params['attendant'];
    this.cbacData = this.beneficiaryDetailsService.cbacData;
    this.idrsCbac = environment.IdrsOrCbac;
    if (String(this.mode) !== undefined && String(this.mode) !== 'view') {
      this.patientVisitDetailsForm.controls['IdrsOrCbac'].setValue('CBAC');
      this.enableHistoryScreenOnIdrs('CBAC');
    }
    this.assignSelectedLanguage();
    this.getBenificiaryDetails();
    this.getVisitReasonAndCategory();
    this.loadNurseMasters();
  }
  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }
  get visitReason() {
    return this.patientVisitDetailsForm.controls['visitReason'].value;
  }

  get visitCategory() {
    return this.patientVisitDetailsForm.controls['visitCategory'].value;
  }

  get pregnancyStatus() {
    return this.patientVisitDetailsForm.controls['pregnancyStatus'].value;
  }

  get rCHID() {
    return this.patientVisitDetailsForm.controls['rCHID'].value;
  }

  get IdrsOrCbac() {
    return this.patientVisitDetailsForm.controls['IdrsOrCbac'].value;
  }

  get followUpForFpMethod() {
    return this.patientVisitDetailsForm.controls['followUpForFpMethod'].value;
  }

  get otherFollowUpForFpMethod() {
    return this.patientVisitDetailsForm.controls['otherFollowUpForFpMethod']
      .value;
  }

  get sideEffects() {
    return this.patientVisitDetailsForm.controls['sideEffects'].value;
  }

  get otherSideEffects() {
    return this.patientVisitDetailsForm.controls['otherSideEffects'].value;
  }

  ngOnChanges() {
    this.attendant = this.route.snapshot.params['attendant'];
    this.nurseService.mmuVisitData = false;
    if (String(this.mode) === 'view') {
      this.loadNurseMasters();
      const visitID = this.sessionstorage.getItem('visitID');
      const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
      this.disableVisit = true;
      this.getVisitDetails(visitID, benRegID);
    }

    const specialistFlagString = this.sessionstorage.getItem('specialistFlag');

    if (
      specialistFlagString !== null &&
      parseInt(specialistFlagString) === 100
    ) {
      this.loadNurseMasters();
      console.log('MMUSpecialist');
      const visitID = this.sessionstorage.getItem('visitID');
      const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
      this.getMMUVisitDetails(visitID, benRegID);
    }
  }

  enableCbacIdrs(visitID: any, benRegID: any) {
    const obj = {
      beneficiaryRegId: benRegID,
      visitCode: this.sessionstorage.getItem('visitCode'),
    };

    console.log('obj in enableCbacIdrs', obj);

    this.nurseService
      .getCbacDetailsFromNurse(obj)
      .subscribe((valueRes: any) => {
        if (
          valueRes !== null &&
          valueRes.statusCode === 200 &&
          (valueRes.data.diabetes !== undefined ||
            valueRes.data.oral !== undefined ||
            valueRes.data.cervical !== undefined ||
            valueRes.data.breast !== undefined ||
            valueRes.data.hypertension !== undefined)
        ) {
          this.patientVisitDetailsForm.controls['IdrsOrCbac'].setValue('CBAC');
          this.enableHistoryScreenOnIdrs('cbac');
        } else {
          this.patientVisitDetailsForm.controls['IdrsOrCbac'].setValue('IDRS');
          this.enableHistoryScreenOnIdrs('idrs');
        }
      });
  }

  ngOnDestroy() {
    this.beneficiaryAge = 0;
    if (this.visitCategorySubscription)
      this.visitCategorySubscription.unsubscribe();

    if (this.visitDetailsSubscription)
      this.visitDetailsSubscription.unsubscribe();

    if (this.visitDetSubscription) this.visitDetSubscription.unsubscribe();

    if (this.beneficiaryDetailsSubscription)
      this.beneficiaryDetailsSubscription.unsubscribe();
    this.patientVisitDetailsForm.reset();
  }

  visitCategorySubscription: any;
  getVisitReasonAndCategory() {
    this.visitCategorySubscription =
      this.masterdataService.visitDetailMasterData$.subscribe((masterData) => {
        if (masterData) {
          this.templateNurseMasterData = masterData;
          this.templateVisitReasons = this.templateNurseMasterData.visitReasons;
          this.templateVisitCategories =
            this.templateNurseMasterData.visitCategories.filter(
              (visit: any) =>
                visit.visitCategory.toLowerCase() !== 'cancer screening',
            );
          this.templateFilterVisitCategories = [];
          this.templateFilterVisitCategories = this.templateVisitCategories;
          console.log(
            'this.templateFilterVisitCategories in 247',
            this.templateFilterVisitCategories,
          );
        }
      });
  }

  visitDetSubscription: any;
  getMMUVisitDetails(visitID: any, benRegID: any) {
    const visitCategory = this.sessionstorage.getItem('visitCategory');
    this.visitDetSubscription = this.doctorService
      .getVisitComplaintDetails(benRegID, visitID)
      .subscribe((value: any) => {
        if (value !== null && value.statusCode === 200 && value.data !== null) {
          if (visitCategory === 'General OPD (QC)') {
            const visitDetails = value.data.benVisitDetails;

            this.doctorService.fileIDs = value.data.benVisitDetails.fileIDs;
            this.patientVisitDetailsForm.patchValue(visitDetails);
            this.disableVisit = true;
          }
          if (visitCategory === 'ANC') {
            const visitDetails = value.data.ANCNurseVisitDetail;
            this.doctorService.fileIDs = value.data.ANCNurseVisitDetail.fileIDs;
            this.patientVisitDetailsForm.patchValue(visitDetails);
            this.disableVisit = true;
          }
          if (visitCategory === 'General OPD') {
            const visitDetails = value.data.GOPDNurseVisitDetail;
            this.doctorService.fileIDs =
              value.data.GOPDNurseVisitDetail.fileIDs;
            this.patientVisitDetailsForm.patchValue(visitDetails);
            this.disableVisit = true;
          }
          if (visitCategory === 'NCD screening') {
            const visitDetails = value.data.NCDScreeningNurseVisitDetail;
            this.doctorService.fileIDs =
              value.data.NCDScreeningNurseVisitDetail.fileIDs;
            this.patientVisitDetailsForm.patchValue(visitDetails);
            this.disableVisit = true;
          }
          if (visitCategory === 'NCD care') {
            const visitDetails = value.data.NCDCareNurseVisitDetail;
            this.doctorService.fileIDs =
              value.data.NCDCareNurseVisitDetail.fileIDs;
            this.patientVisitDetailsForm.patchValue(visitDetails);
            this.disableVisit = true;
            this.loadConfirmedDiseasesFromNCD();
          }
          if (visitCategory === 'PNC') {
            const visitDetails = value.data.PNCNurseVisitDetail;
            this.doctorService.fileIDs = value.data.PNCNurseVisitDetail.fileIDs;
            this.patientVisitDetailsForm.patchValue(visitDetails);
            this.disableVisit = true;
          }
          if (visitCategory === 'COVID-19 Screening') {
            console.log('visitData', value.data);
            const visitDetails = value.data.covid19NurseVisitDetail;
            this.doctorService.fileIDs =
              value.data.covid19NurseVisitDetail.fileIDs;
            this.patientVisitDetailsForm.patchValue(visitDetails);
            this.disableVisit = true;
          }
          if (visitCategory === 'Neonatal and Infant Health Care Services') {
            const visitDetails = value.data.neonatalNurseVisitDetail;
            this.doctorService.fileIDs =
              value.data.neonatalNurseVisitDetail.fileIDs;
            this.patientVisitDetailsForm.patchValue(visitDetails);
            this.disableVisit = true;
          }
          if (visitCategory === 'Childhood & Adolescent Healthcare Services') {
            const visitDetails = value.data.cacNurseVisitDetail;
            this.doctorService.fileIDs = value.data.cacNurseVisitDetail.fileIDs;
            this.patientVisitDetailsForm.patchValue(visitDetails);
            this.disableVisit = true;
          }

          if (visitCategory === 'FP & Contraceptive Services') {
            const visitDetails = value.data.FP_NurseVisitDetail;

            this.doctorService.fileIDs = value.data.FP_NurseVisitDetail.fileIDs;
            this.patientVisitDetailsForm.patchValue(visitDetails);

            this.checkForOtherFpMethodOption(
              this.patientVisitDetailsForm.controls['followUpForFpMethod']
                .value,
            );
            this.checkForOtherSideEffectsOption(
              this.patientVisitDetailsForm.controls['sideEffects'].value,
            );
            this.disableVisit = true;
          }
        }
      });
  }

  visitDetailsSubscription: any;
  getVisitDetails(visitID: any, benRegID: any) {
    console.log('visitID and benRegID in 356', visitID, benRegID);
    const visitCategory = this.sessionstorage.getItem('visitCategory');
    this.visitDetailsSubscription = this.doctorService
      .getVisitComplaintDetails(benRegID, visitID)
      .subscribe((value: any) => {
        if (value !== null && value.statusCode === 200 && value.data !== null) {
          if (visitCategory === 'General OPD (QC)') {
            const visitDetails = value.data.benVisitDetails;

            this.doctorService.fileIDs = value.data.benVisitDetails.fileIDs;
            this.patientVisitDetailsForm.patchValue(visitDetails);
          }
          if (visitCategory === 'ANC') {
            const visitDetails = value.data.ANCNurseVisitDetail;

            this.doctorService.fileIDs = value.data.ANCNurseVisitDetail.fileIDs;
            this.patientVisitDetailsForm.patchValue(visitDetails);
          }
          if (visitCategory === 'General OPD') {
            const visitDetails = value.data.GOPDNurseVisitDetail;

            this.doctorService.fileIDs =
              value.data.GOPDNurseVisitDetail.fileIDs;
            this.patientVisitDetailsForm.patchValue(visitDetails);
          }
          if (visitCategory === 'NCD screening') {
            const visitDetails = value.data.NCDScreeningNurseVisitDetail;

            this.doctorService.fileIDs =
              value.data.NCDScreeningNurseVisitDetail.fileIDs;
            this.patientVisitDetailsForm.patchValue(visitDetails);
            this.enableCbacIdrs(visitID, benRegID);
          }
          if (visitCategory === 'NCD care') {
            const visitDetails = value.data.NCDCareNurseVisitDetail;
            this.doctorService.fileIDs =
              value.data.NCDCareNurseVisitDetail.fileIDs;
            this.patientVisitDetailsForm.patchValue(visitDetails);
            this.loadConfirmedDiseasesFromNCD();
          }
          if (visitCategory === 'PNC') {
            const visitDetails = value.data.PNCNurseVisitDetail;
            this.doctorService.fileIDs = value.data.PNCNurseVisitDetail.fileIDs;
            this.patientVisitDetailsForm.patchValue(visitDetails);
          }
          if (visitCategory === 'COVID-19 Screening') {
            console.log('visitData', value.data);
            const visitDetails = value.data.covid19NurseVisitDetail;
            this.doctorService.fileIDs =
              value.data.covid19NurseVisitDetail.fileIDs;
            this.patientVisitDetailsForm.patchValue(visitDetails);
          }
          if (visitCategory === 'Neonatal and Infant Health Care Services') {
            const visitDetails = value.data.neonatalNurseVisitDetail;
            this.doctorService.fileIDs =
              value.data.neonatalNurseVisitDetail.fileIDs;
            this.patientVisitDetailsForm.patchValue(visitDetails);
          }
          if (visitCategory === 'Childhood & Adolescent Healthcare Services') {
            const visitDetails = value.data.cacNurseVisitDetail;
            this.doctorService.fileIDs = value.data.cacNurseVisitDetail.fileIDs;
            this.patientVisitDetailsForm.patchValue(visitDetails);
          }

          if (visitCategory === 'FP & Contraceptive Services') {
            const visitDetails = value.data.FP_NurseVisitDetail;
            this.doctorService.fileIDs = value.data.FP_NurseVisitDetail.fileIDs;
            this.patientVisitDetailsForm.patchValue(visitDetails);

            this.checkForOtherFpMethodOption(
              this.patientVisitDetailsForm.controls['followUpForFpMethod']
                .value,
            );
            this.checkForOtherSideEffectsOption(
              this.patientVisitDetailsForm.controls['sideEffects'].value,
            );
          }
        }
      });
  }

  beneficiaryGender: any;
  beneficiary: any;
  beneficiaryDetailsSubscription: any;
  getBenificiaryDetails() {
    this.beneficiaryDetailsSubscription =
      this.beneficiaryDetailsService.beneficiaryDetails$.subscribe(
        (beneficiaryDetails) => {
          if (beneficiaryDetails) {
            this.beneficiary = beneficiaryDetails;
            this.beneficiaryGender = beneficiaryDetails.genderName;
            const calculateAgeInYears = beneficiaryDetails.age
              .split('-')[0]
              .trim();
            const calculateAgeInMonths = beneficiaryDetails.age.split('-')[1]
              ? beneficiaryDetails.age.split('-')[1].trim()
              : '';
            const age = this.getAgeValueNew(calculateAgeInYears);
            if (age !== 0 && calculateAgeInMonths !== '0 months') {
              this.beneficiaryAge = age + 1;
            } else {
              this.beneficiaryAge = age;
            }

            if (
              beneficiaryDetails &&
              beneficiaryDetails.genderName !== null &&
              beneficiaryDetails.genderName === 'Male'
            )
              this.showPregnancyStatus = false;
            else if (
              beneficiaryDetails &&
              beneficiaryDetails.ageVal !== null &&
              beneficiaryDetails.ageVal <= 11
            )
              this.showPregnancyStatus = false;
            else this.showPregnancyStatus = true;
          }
        },
      );
  }

  getAgeValueNew(age: any) {
    if (!age) return 0;
    const arr = age !== undefined && age !== null ? age.trim().split(' ') : age;
    if (arr[1]) {
      const ageUnit = arr[1];
      if (ageUnit.toLowerCase() === 'years') {
        return parseInt(arr[0]);
      }
    }
    return 0;
  }

  reasonSelected(visitReason: any) {
    this.templateFilterVisitCategories = [];
    this.patientVisitDetailsForm.controls['visitCategory'].setValue(null);
    this.sessionstorage.setItem('visitReason', visitReason);
    if (visitReason === 'Screening') {
      this.templateFilterVisitCategories = this.templateVisitCategories.filter(
        (item: any) =>
          item.visitCategory.toLowerCase().indexOf('screening') >= 0,
      );
      if (this.beneficiary.ageVal < 30)
        this.templateFilterVisitCategories =
          this.templateFilterVisitCategories.filter(
            (item: any) => item.visitCategory.toLowerCase() !== 'ncd screening',
          );
    } else if (visitReason === 'Pandemic') {
      this.templateFilterVisitCategories = this.templateVisitCategories.filter(
        (item: any) => item.visitCategory.indexOf('COVID-19') >= 0,
      );
    } else if (visitReason === 'Referral') {
      this.templateFilterVisitCategories = this.templateVisitCategories.filter(
        (item: any) => item.visitCategory.toLowerCase() !== 'synctest',
      );
      if (this.beneficiaryAge > 1) {
        this.templateFilterVisitCategories =
          this.templateFilterVisitCategories.filter(
            (item: any) =>
              item.visitCategory.toLowerCase() !==
              'neonatal and infant health care services',
          );
      }
      if (this.beneficiaryAge > 19 || this.beneficiaryAge < 1) {
        this.templateFilterVisitCategories =
          this.templateFilterVisitCategories.filter(
            (item: any) =>
              item.visitCategory.toLowerCase() !==
              'childhood & adolescent healthcare services',
          );
      }
      if (this.beneficiary.ageVal <= 12) {
        this.templateFilterVisitCategories =
          this.templateFilterVisitCategories.filter(
            (item: any) =>
              item.visitCategory.toLowerCase() !==
              'fp & contraceptive services',
          );
      }

      if (this.beneficiary.ageVal < 30) {
        this.templateFilterVisitCategories =
          this.templateFilterVisitCategories.filter(
            (item: any) => item.visitCategory.toLowerCase() !== 'ncd screening',
          );
      }

      if (
        this.beneficiary.genderName === 'Male' ||
        this.beneficiary.ageVal < 12
      ) {
        this.templateFilterVisitCategories =
          this.templateFilterVisitCategories.filter(
            (item: any) =>
              item.visitCategory.toLowerCase() !== 'anc' &&
              item.visitCategory.toLowerCase() !== 'pnc' &&
              item.visitCategory.toLowerCase() !== 'synctest',
          );
      }
    } else if (visitReason === 'Follow Up') {
      this.templateFilterVisitCategories = this.templateVisitCategories.filter(
        (item: any) =>
          item.visitCategory.toLowerCase() !== 'ncd screening' &&
          item.visitCategory.toLowerCase() !== 'covid-19 screening' &&
          item.visitCategory.toLowerCase() !== 'synctest',
      );
      if (this.beneficiary.ageVal <= 12) {
        this.templateFilterVisitCategories =
          this.templateFilterVisitCategories.filter(
            (item: any) =>
              item.visitCategory.toLowerCase() !==
              'fp & contraceptive services',
          );
      }
      if (this.beneficiaryAge > 1) {
        this.templateFilterVisitCategories =
          this.templateFilterVisitCategories.filter(
            (item: any) =>
              item.visitCategory.toLowerCase() !==
              'neonatal and infant health care services',
          );
      }
      if (this.beneficiaryAge > 19 || this.beneficiaryAge < 1) {
        this.templateFilterVisitCategories =
          this.templateFilterVisitCategories.filter(
            (item: any) =>
              item.visitCategory.toLowerCase() !==
              'childhood & adolescent healthcare services',
          );
      }
      if (
        this.beneficiary.genderName === 'Male' ||
        this.beneficiary.ageVal < 12
      ) {
        this.templateFilterVisitCategories =
          this.templateFilterVisitCategories.filter(
            (item: any) =>
              item.visitCategory.toLowerCase() !== 'anc' &&
              item.visitCategory.toLowerCase() !== 'pnc' &&
              item.visitCategory.toLowerCase() !== 'synctest',
          );
      } else
        this.templateFilterVisitCategories =
          this.templateFilterVisitCategories.slice();
    } else {
      /**
       * Filtering ANC for male and child (hardcoded)
       * TODO : need to filter based on api
       */
      this.templateFilterVisitCategories = this.templateVisitCategories.filter(
        (item: any) =>
          item.visitCategory.toLowerCase() !== 'synctest' &&
          item.visitCategory.toLowerCase() !== 'ncd care',
      );

      if (
        this.beneficiary.genderName === 'Male' ||
        this.beneficiary.ageVal < 12
      )
        this.templateFilterVisitCategories =
          this.templateFilterVisitCategories.filter(
            (item: any) =>
              item.visitCategory.toLowerCase() !== 'anc' &&
              item.visitCategory.toLowerCase() !== 'pnc' &&
              item.visitCategory.toLowerCase() !== 'synctest',
          );
      else
        this.templateFilterVisitCategories =
          this.templateFilterVisitCategories.slice();

      if (this.beneficiary.ageVal < 30)
        this.templateFilterVisitCategories =
          this.templateFilterVisitCategories.filter(
            (item: any) => item.visitCategory.toLowerCase() !== 'ncd screening',
          );

      if (this.beneficiary.ageVal <= 12) {
        this.templateFilterVisitCategories =
          this.templateFilterVisitCategories.filter(
            (item: any) =>
              item.visitCategory.toLowerCase() !==
              'fp & contraceptive services',
          );
      }

      if (this.beneficiaryAge > 1) {
        this.templateFilterVisitCategories =
          this.templateFilterVisitCategories.filter(
            (item: any) =>
              item.visitCategory.toLowerCase() !==
              'neonatal and infant health care services',
          );
      }
      if (this.beneficiaryAge > 19 || this.beneficiaryAge < 1) {
        this.templateFilterVisitCategories =
          this.templateFilterVisitCategories.filter(
            (item: any) =>
              item.visitCategory.toLowerCase() !==
              'childhood & adolescent healthcare services',
          );
      }
    }

    this.resetFPAndSideEffects();
  }

  checkCategoryDependent(visitCategory: any) {
    this.previousConfirmedDiseasesList = [];
    this.enableConfirmedDiseases = false;

    this.sessionstorage.setItem('visiCategoryANC', visitCategory);
    if (visitCategory === 'ANC') {
      this.templatePregnancyStatus = ['Yes'];
      this.patientVisitDetailsForm.patchValue({ pregnancyStatus: 'Yes' });
    } else {
      this.templatePregnancyStatus = ['Yes', 'No', "Don't Know"];
      this.patientVisitDetailsForm.patchValue({ pregnancyStatus: null });
    }

    this.patientVisitDetailsForm.patchValue({ rCHID: null });

    if (visitCategory === 'NCD screening') {
      this.patientVisitDetailsForm.controls['IdrsOrCbac'].setValue('CBAC');
      this.enableHistoryScreenOnIdrs('cbac');
    }

    if (visitCategory === 'NCD care') {
      this.loadConfirmedDiseasesFromNCD();
    }

    this.resetFPAndSideEffects();
    this.patientVisitDetailsForm.controls['subVisitCategory'].reset();
  }

  visitCategorySelected() {
    if (this.beneficiaryAge > 1) {
      this.templateSubVisitCategories = this.subVisitCategoryList.filter(
        (item: any) => item.name.toLowerCase() !== 'newborn & infant opd care',
      );
    }
    if (this.beneficiaryAge > 19 || this.beneficiaryAge < 1) {
      this.templateSubVisitCategories = this.templateSubVisitCategories.filter(
        (item: any) =>
          item.name.toLowerCase() !== 'child & adolescent opd care',
      );
    }
    if (this.beneficiary.ageVal < 12) {
      this.templateSubVisitCategories = this.templateSubVisitCategories.filter(
        (item: any) =>
          item.name.toLowerCase() !== 'reproductive health opd care',
      );
    }
    if (this.beneficiaryAge <= 60) {
      this.templateSubVisitCategories = this.templateSubVisitCategories.filter(
        (item: any) => item.name.toLowerCase() !== 'elderly opd health care',
      );
    }
    if (this.beneficiaryAge <= 19) {
      this.templateSubVisitCategories = this.templateSubVisitCategories.filter(
        (item: any) =>
          item.name.toLowerCase() !==
          'management of common communicable diseases and outpatient care for acute simple illnesses & minor ailments',
      );
    }
  }

  loadConfirmedDiseasesFromNCD() {
    this.previousConfirmedDiseasesList = [];
    this.enableConfirmedDiseases = false;
    const obj = {
      beneficiaryRegId: this.sessionstorage.getItem('beneficiaryRegID'),
    };

    this.nurseService
      .getPreviousVisitConfirmedDiseases(obj)
      .subscribe((value: any) => {
        if (value !== null && value.statusCode === 200 && value.data !== null) {
          this.previousConfirmedDiseasesList = [];

          if (
            value.data.confirmedDiseases !== undefined &&
            value.data.confirmedDiseases !== null &&
            value.data.confirmedDiseases.length > 0
          ) {
            this.previousConfirmedDiseasesList = value.data.confirmedDiseases;
            this.enableConfirmedDiseases = true;
          }
        }
      });
  }

  enableHistoryScreenOnIdrs(IdrsOrCbac: any) {
    if (IdrsOrCbac.toLowerCase() === 'idrs') {
      this.showHistoryForm = true;
      this.enableCbac = false;
    } else {
      this.showHistoryForm = false;
      this.enableCbac = true;
    }

    this.nurseService.diseaseFileUpload = false;

    this.ncdScreeningService.enableHistoryScreenOnIdrs(this.showHistoryForm);
    this.ncdScreeningService.checkIfCbac(this.enableCbac);

    if (IdrsOrCbac.toLowerCase() === 'cbac') {
      this.hideVitalsFormForNcdScreening = false;
    } else {
      this.hideVitalsFormForNcdScreening = true;
    }
    this.ncdScreeningService.disableViatlsFormOnCbac(
      this.hideVitalsFormForNcdScreening,
    );

    this.ncdScreeningService.enableDiseaseConfirmationScreen(
      IdrsOrCbac.toLowerCase(),
    );
  }

  loadNurseMasters() {
    this.fpMethodList = [];
    this.sideEffectsList = [];
    this.masterdataService.nurseMasterData$.subscribe((masterResp) => {
      if (masterResp) {
        if (
          masterResp.subVisitCategories !== undefined &&
          masterResp.subVisitCategories !== null
        ) {
          this.templateSubVisitCategories = masterResp.subVisitCategories;
          this.subVisitCategoryList = masterResp.subVisitCategories;
          this.visitCategorySelected();
        }

        if (
          masterResp.m_fpmethodfollowup !== undefined &&
          masterResp.m_fpmethodfollowup !== null &&
          masterResp.m_FPSideEffects !== undefined &&
          masterResp.m_FPSideEffects !== null
        ) {
          this.fpMethodList = masterResp.m_fpmethodfollowup;
          this.sideEffectsList = masterResp.m_FPSideEffects;
        }
      }
    });
  }

  checkForOtherFpMethodOption(selectedOption: any) {
    if (
      selectedOption !== undefined &&
      selectedOption !== null &&
      selectedOption.length > 0
    ) {
      if (selectedOption.includes('Other')) {
        this.enableOtherFpTextField = true;
      } else {
        this.enableOtherFpTextField = false;
        this.patientVisitDetailsForm.controls[
          'otherFollowUpForFpMethod'
        ].setValue(null);
      }

      if (selectedOption.includes('None')) {
        this.disableAllFpOptions = true;
      } else {
        this.disableAllFpOptions = false;
      }
    } else {
      this.enableOtherFpTextField = false;
      this.patientVisitDetailsForm.controls[
        'otherFollowUpForFpMethod'
      ].setValue(null);
      this.disableAllFpOptions = false;
    }
  }

  checkForOtherSideEffectsOption(selectedOption: any) {
    if (
      selectedOption !== undefined &&
      selectedOption !== null &&
      selectedOption.length > 0
    ) {
      if (selectedOption.includes('Other')) {
        this.enableOtherSideEffectTextField = true;
      } else {
        this.enableOtherSideEffectTextField = false;
        this.patientVisitDetailsForm.controls['otherSideEffects'].setValue(
          null,
        );
      }
    } else {
      this.enableOtherSideEffectTextField = false;
      this.patientVisitDetailsForm.controls['otherSideEffects'].setValue(null);
    }
  }

  resetFPAndSideEffects() {
    this.patientVisitDetailsForm.controls['followUpForFpMethod'].setValue(null);
    this.patientVisitDetailsForm.controls['otherFollowUpForFpMethod'].setValue(
      null,
    );
    this.patientVisitDetailsForm.controls['sideEffects'].setValue(null);
    this.patientVisitDetailsForm.controls['otherSideEffects'].setValue(null);
    this.enableOtherFpTextField = false;
    this.disableAllFpOptions = false;
    this.enableOtherSideEffectTextField = false;
  }

  trackFieldInteraction(fieldName: string) {
    this.trackingService.trackFieldInteraction(fieldName, 'Registration');
  }
}
