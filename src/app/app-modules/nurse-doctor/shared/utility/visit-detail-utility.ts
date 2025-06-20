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
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

export class VisitDetailUtils {
  constructor(
    private fb: FormBuilder,
    readonly sessionstorage: SessionStorageService,
  ) {}

  createPatientVisitForm(diasableFlag = false) {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');

    return this.fb.group({
      patientVisitDetailsForm: this.createPatientVisitDetails(diasableFlag),
      patientChiefComplaintsForm:
        this.createANCPatientChiefComplaintArrayForm(diasableFlag),
      patientAdherenceForm: this.createPatientAdherenceForm(diasableFlag),
      patientInvestigationsForm:
        this.createPatientInvestigationsForm(diasableFlag),
      cdssForm: this.createCdssForm(),
      patientCovidForm: this.createPatientCovidForm(diasableFlag),
      patientFileUploadDetailsForm:
        this.createPatientFileUploadDetailsForm(diasableFlag),
      patientDiseaseForm: this.createPatientDiseaseForm(diasableFlag),
      covidVaccineStatusForm: this.createCovidVaccineStatusForm(diasableFlag),
      cbacScreeningForm: this.createCBACForm(diasableFlag),
      vanID: JSON.parse(serviceLineDetails).vanID,
      parkingPlaceID: JSON.parse(serviceLineDetails).parkingPlaceID,
      createdBy: this.sessionstorage.getItem('userName'),
    });
  }

  createPatientAdherenceForm(disableFlag = false) {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');

    return this.fb.group({
      beneficiaryRegID: null,
      benVisitID: null,
      providerServiceMapID: null,
      createdBy: null,
      toDrugs: { value: null, disabled: disableFlag },
      drugReason: { value: null, disabled: disableFlag },
      toReferral: { value: null, disabled: disableFlag },
      referralReason: { value: null, disabled: disableFlag },
      progress: { value: null, disabled: disableFlag },
      vanID: JSON.parse(serviceLineDetails).vanID,
      parkingPlaceID: JSON.parse(serviceLineDetails).parkingPlaceID,
    });
  }

  createPatientInvestigationsForm(disableFlag = false) {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');

    return this.fb.group({
      beneficiaryRegID: null,
      benVisitID: null,
      providerServiceMapID: null,
      createdBy: null,
      laboratoryList: { value: [], disabled: disableFlag },
      vanID: JSON.parse(serviceLineDetails).vanID,
      parkingPlaceID: JSON.parse(serviceLineDetails).parkingPlaceID,
    });
  }

  createANCPatientChiefComplaintArrayForm(disableFlag = false) {
    return this.fb.group({
      complaints: this.fb.array([
        this.createPatientChiefComplaintsForm(disableFlag),
      ]),
    });
  }

  createPatientChiefComplaintsForm(disableFlag: any): FormGroup {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');

    return this.fb.group({
      beneficiaryRegID: null,
      benVisitID: null,
      providerServiceMapID: null,
      conceptID: null,
      chiefComplaint: { value: null, disabled: disableFlag },
      chiefComplaintID: { value: null, disabled: disableFlag },
      duration: { value: null, disabled: true },
      unitOfDuration: { value: null, disabled: true },
      description: { value: null, disabled: true },
      createdBy: null,
      vanID: JSON.parse(serviceLineDetails).vanID,
      parkingPlaceID: JSON.parse(serviceLineDetails).parkingPlaceID,
    });
  }

  createPatientVisitDetails(disableFlag = false) {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');

    return this.fb.group({
      beneficiaryRegID: null,
      providerServiceMapID: null,
      visitNo: null,
      visitCode: { value: null, disabled: true },
      visitReason: { value: null, disabled: disableFlag },
      subVisitCategory: { value: null, disabled: false },
      visitCategory: { value: null, disabled: disableFlag },
      pregnancyStatus: { value: null, disabled: disableFlag },
      followUpForFpMethod: { value: null, disabled: disableFlag },
      otherFollowUpForFpMethod: { value: null, disabled: disableFlag },
      sideEffects: { value: null, disabled: disableFlag },
      otherSideEffects: { value: null, disabled: disableFlag },
      IdrsOrCbac: { value: null, disabled: disableFlag },
      rCHID: { value: null, disabled: disableFlag },
      healthFacilityType: null,
      healthFacilityLocation: null,
      reportFilePath: null,
      createdBy: null,
      vanID: JSON.parse(serviceLineDetails).vanID,
      parkingPlaceID: JSON.parse(serviceLineDetails).parkingPlaceID,
    });
  }

  createPatientFileUploadDetailsForm(disableFlag = false) {
    return this.fb.group({
      fileIDs: null,
    });
  }

  createPatientDiseaseForm(disableFlag = false) {
    return this.fb.group({
      diseaseFormsArray: this.fb.array([]),
    });
  }

  createPatientDiseaseArrayForm(data: any) {
    if (!data) {
      data = {
        diseaseName: null,
        flag: null,
        selected: null,
      };
    }
    return this.fb.group({
      diseaseName: data.disease,
      flag: data.flag,
      selected: data.selected,
    });
  }

  createPatientSymptomsForm(disableFlag = false) {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');

    return this.fb.group({
      beneficiaryRegID: null,
      benVisitID: null,
      providerServiceMapID: null,
      conceptID: null,
      symptoms: { value: null, disabled: disableFlag },
      createdBy: null,
      vanID: JSON.parse(serviceLineDetails).vanID,
      parkingPlaceID: JSON.parse(serviceLineDetails).parkingPlaceID,
    });
  }
  createPatientCovidForm(disableFlag = false) {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');

    return this.fb.group({
      beneficiaryRegID: null,
      benVisitID: null,
      providerServiceMapID: null,
      conceptID: null,
      symptom: { value: null, disabled: disableFlag },
      contactStatus: { value: null, disabled: disableFlag },
      travelStatus: { value: null, disabled: disableFlag },
      travelList: this.fb.array([]),
      modeOfTravelDomestic: { value: null, disabled: disableFlag },
      fromStateDom: { value: null, disabled: disableFlag },
      fromDistrictDom: { value: null, disabled: disableFlag },
      fromSubDistrictDom: { value: null, disabled: disableFlag },
      toStateDom: { value: null, disabled: disableFlag },
      toDistrictDom: { value: null, disabled: disableFlag },
      toSubDistrictDom: { value: null, disabled: disableFlag },
      modeOfTravelInter: { value: null, disabled: disableFlag },
      fromCountryInter: { value: null, disabled: disableFlag },
      fromCityInter: { value: null, disabled: disableFlag },
      toCountryInter: { value: null, disabled: disableFlag },
      toCityInter: { value: null, disabled: disableFlag },
      suspectedStatusUI: { value: null, disabled: disableFlag },
      recommendation: this.fb.array([]),
      createdBy: null,
      vanID: JSON.parse(serviceLineDetails).vanID,
      parkingPlaceID: JSON.parse(serviceLineDetails).parkingPlaceID,
    });
  }

  createCovidVaccineStatusForm(disableFlag: any): FormGroup {
    return this.fb.group({
      covidVSID: null,
      ageGroup: null,
      isApplicableForVaccine: null,
      vaccineStatus: null,
      vaccineTypes: null,
      doseTaken: null,
      doseOneDate: null,
      doseTwoDate: null,
      boosterDoseDate: null,
    });
  }

  createCBACForm(disableFlag = false) {
    return this.fb.group({
      cbacAge: { value: null, disabled: disableFlag },
      cbacAgeScore: { value: null, disabled: disableFlag },
      cbacConsumeGutka: { value: null, disabled: disableFlag },
      cbacConsumeGutkaScore: { value: null, disabled: disableFlag },
      cbacAlcohol: { value: null, disabled: disableFlag },
      cbacAlcoholScore: { value: null, disabled: disableFlag },
      cbacWaistMale: { value: null, disabled: disableFlag },
      cbacWaistMaleScore: { value: null, disabled: disableFlag },
      cbacWaistFemale: { value: null, disabled: disableFlag },
      cbacWaistFemaleScore: { value: null, disabled: disableFlag },
      cbacPhysicalActivity: { value: null, disabled: disableFlag },
      cbacPhysicalActivityScore: { value: null, disabled: disableFlag },
      cbacFamilyHistoryBpdiabetes: { value: null, disabled: disableFlag },
      cbacFamilyHistoryBpdiabetesScore: { value: null, disabled: disableFlag },
      cbacShortnessBreath: { value: null, disabled: disableFlag },
      cbacCough2weeks: { value: null, disabled: disableFlag },
      cbacBloodsputum: { value: null, disabled: disableFlag },
      cbacFever2weeks: { value: null, disabled: disableFlag },
      cbacWeightLoss: { value: null, disabled: disableFlag },
      cbacNightSweats: { value: null, disabled: disableFlag },
      cbacAntiTBDrugs: { value: null, disabled: disableFlag },
      cbacTb: { value: null, disabled: disableFlag },
      cbacTBHistory: { value: null, disabled: disableFlag },
      cbacUlceration: { value: null, disabled: disableFlag },
      cbacRecurrentTingling: { value: null, disabled: disableFlag },
      cbacFitsHistory: { value: null, disabled: disableFlag },
      cbacMouthopeningDifficulty: { value: null, disabled: disableFlag },
      cbacMouthUlcers: { value: null, disabled: disableFlag },
      cbacMouthUlcersGrowth: { value: null, disabled: disableFlag },
      cbacMouthredpatch: { value: null, disabled: disableFlag },
      cbacPainchewing: { value: null, disabled: disableFlag },
      cbacTonechange: { value: null, disabled: disableFlag },
      cbacHypopigmentedpatches: { value: null, disabled: disableFlag },
      cbacThickenedskin: { value: null, disabled: disableFlag },
      cbacNodulesonskin: { value: null, disabled: disableFlag },
      cbacRecurrentNumbness: { value: null, disabled: disableFlag },
      cbacBlurredVision: { value: null, disabled: disableFlag },
      cbacDifficultyreading: { value: null, disabled: disableFlag },
      cbacPainineyes: { value: null, disabled: disableFlag },
      cbacRednessPain: { value: null, disabled: disableFlag },
      cbacDifficultyHearing: { value: null, disabled: disableFlag },
      cbacClawingfingers: { value: null, disabled: disableFlag },
      cbacHandTingling: { value: null, disabled: disableFlag },
      cbacInabilityCloseeyelid: { value: null, disabled: disableFlag },
      cbacDifficultHoldingObjects: { value: null, disabled: disableFlag },
      cbacFeetweakness: { value: null, disabled: disableFlag },
      cbacLumpBreast: { value: null, disabled: disableFlag },
      cbacBloodnippleDischarge: { value: null, disabled: disableFlag },
      cbacBreastsizechange: { value: null, disabled: disableFlag },
      cbacBleedingPeriods: { value: null, disabled: disableFlag },
      cbacBleedingMenopause: { value: null, disabled: disableFlag },
      cbacBleedingIntercourse: { value: null, disabled: disableFlag },
      cbacVaginalDischarge: { value: null, disabled: disableFlag },
      cbacFeelingUnsteady: { value: null, disabled: disableFlag },
      cbacPhysicalDisabilitySuffering: { value: null, disabled: disableFlag },
      cbacNeedhelpEverydayActivities: { value: null, disabled: disableFlag },
      cbacForgetnearones: { value: null, disabled: disableFlag },
      totalScore: 0,
    });
  }
  createCdssForm(disableFlag = false) {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');

    return this.fb.group({
      presentChiefComplaintDb: this.createPresentCheifComplaint(),
      diseaseSummaryDb: this.createDiseaseSummary(),
      providerServiceMapID: null,
      vanID: JSON.parse(serviceLineDetails).vanID,
      parkingPlaceID: JSON.parse(serviceLineDetails).parkingPlaceID,
    });
  }

  createPresentCheifComplaint(): FormGroup {
    return this.fb.group({
      presentChiefComplaint: null,
      presentChiefComplaintID: null,
      selectedDiagnosis: null,
      selectedProvisionalDiagnosisID: null,
      recommendedActionPc: null,
      remarksPc: null,
      presentChiefComplaintView: null,
    });
  }
  createDiseaseSummary(): FormGroup {
    return this.fb.group({
      diseaseSummary: null,
      diseasesummaryID: null,
      recommendedAction: null,
      remarks: null,
      informationGiven: null,
      diseaseSummaryView: null,
    });
  }
}
