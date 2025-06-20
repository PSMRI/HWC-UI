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

export class CancerUtils {
  constructor(
    private fb: FormBuilder,
    readonly sessionstorage: SessionStorageService,
  ) {}

  ngOnInIt() {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
  }

  createCancerPatientFamilyMedicalHistoryForm() {
    return this.fb.group({
      diseases: this.fb.array([this.initDiseases()]),
    });
  }

  initDiseases(): FormGroup {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    return this.fb.group({
      beneficiaryRegID: null,
      benVisitID: null,
      providerServiceMapID: null,
      cancerDiseaseType: null,
      otherDiseaseType: null,
      snomedCode: null,
      snomedTerm: null,
      familyMemberList: null,
      vanID: JSON.parse(serviceLineDetails).vanID,
      parkingPlaceID: JSON.parse(serviceLineDetails).parkingPlaceID,
    });
  }

  createCancerPatientPerosnalHistoryForm() {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');
    return this.fb.group({
      beneficiaryRegID: null,
      benVisitID: null,
      providerServiceMapID: null,
      tobaccoUse: null,
      startAge_year: null,
      endAge_year: null,
      typeOfTobaccoProductList: null,
      quantityPerDay: null,
      isFilteredCigaerette: null,
      isCigaretteExposure: null,
      isBetelNutChewing: null,
      durationOfBetelQuid: null,
      alcoholUse: null,
      ssAlcoholUsed: null,
      frequencyOfAlcoholUsed: null,
      dietType: null,
      otherDiet: null,
      intakeOfOutsidePreparedMeal: null,
      fruitConsumptionDays: null,
      fruitQuantityPerDay: null,
      vegetableConsumptionDays: null,
      vegetableQuantityPerDay: null,
      typeOfOilConsumedList: null,
      otherOilType: null,
      physicalActivityType: null,
      ssRadiationExposure: null,
      isThyroidDisorder: null,
      createdBy: null,
      vanID: JSON.parse(serviceLineDetails).vanID,
      parkingPlaceID: JSON.parse(serviceLineDetails).parkingPlaceID,
    });
  }

  createCancerPatientObstetricHistoryForm() {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');

    return this.fb.group({
      beneficiaryRegID: null,
      benVisitID: null,
      providerServiceMapID: null,
      pregnancyStatus: null,
      isUrinePregTest: null,
      pregnant_No: null,
      noOfLivingChild: null,
      isAbortion: null,
      isOralContraceptiveUsed: null,
      isHormoneReplacementTherapy: null,
      menarche_Age: null,
      isMenstrualCycleRegular: null,
      menstrualCycleLength: null,
      menstrualFlowDuration: null,
      menstrualFlowType: null,
      isDysmenorrhea: null,
      isInterMenstrualBleeding: null,
      menopauseAge: null,
      isPostMenopauseBleeding: null,
      createdBy: null,
      vanID: JSON.parse(serviceLineDetails).vanID,
      parkingPlaceID: JSON.parse(serviceLineDetails).parkingPlaceID,
    });
  }

  createNurseCancerHistoryForm() {
    return this.fb.group({
      cancerPatientFamilyMedicalHistoryForm:
        this.createCancerPatientFamilyMedicalHistoryForm(),
      cancerPatientPerosnalHistoryForm:
        this.createCancerPatientPerosnalHistoryForm(),
      cancerPatientObstetricHistoryForm:
        this.createCancerPatientObstetricHistoryForm(),
    });
  }

  createNurseCancerPatientVitalsForm() {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');

    return this.fb.group({
      beneficiaryRegID: null,
      benVisitID: null,
      providerServiceMapID: null,
      weight_Kg: null,
      height_cm: null,
      waistCircumference_cm: null,
      systolicBP_1stReading: null,
      diastolicBP_1stReading: null,
      systolicBP_2ndReading: null,
      diastolicBP_2ndReading: null,
      systolicBP_3rdReading: null,
      diastolicBP_3rdReading: null,
      hbA1C: null,
      hemoglobin: null,
      sPO2: null,
      bloodGlucose_Fasting: null,
      bloodGlucose_Random: null,
      bloodGlucose_2HrPostPrandial: null,
      rbsTestResult: null,
      rbsTestRemarks: null,
      createdBy: null,
      vanID: JSON.parse(serviceLineDetails).vanID,
      parkingPlaceID: JSON.parse(serviceLineDetails).parkingPlaceID,
    });
  }

  createCancerExaminationForm() {
    return this.fb.group({
      signsForm: this.createSignsForm(),
      oralExaminationForm: this.createOralExaminationForm(),
      breastExaminationForm: this.createBreastExaminationForm(),
      abdominalExaminationForm: this.createAbdominalExaminationForm(),
      gynecologicalExaminationForm: this.createGynecologicalExaminationForm(),
    });
  }

  createAbdominalExaminationForm() {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');

    return this.fb.group({
      abdominalInspection_Normal: null,
      liver: null,
      ascites_Present: null,
      anyOtherMass_Present: null,
      lymphNodes_Enlarged: null,
      lymphNode_Inguinal_Left: null,
      lymphNode_Inguinal_Right: null,
      lymphNode_ExternalIliac_Left: null,
      lymphNode_ExternalIliac_Right: null,
      lymphNode_ParaAortic_Left: null,
      lymphNode_ParaAortic_Right: null,
      observation: null,
      image: null,
      vanID: JSON.parse(serviceLineDetails).vanID,
      parkingPlaceID: JSON.parse(serviceLineDetails).parkingPlaceID,
    });
  }

  createBreastExaminationForm() {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');

    return this.fb.group({
      everBreastFed: null,
      breastFeedingDurationGTE6months: null,
      breastsAppear_Normal: null,
      rashOnBreast: null,
      dimplingSkinOnBreast: null,
      dischargeFromNipple: null,
      peaudOrange: null,
      lumpInBreast: null,
      lumpSize: null,
      lumpShape: null,
      lumpTexture: null,
      referredToMammogram: null,
      image: null,
      vanID: JSON.parse(serviceLineDetails).vanID,
      parkingPlaceID: JSON.parse(serviceLineDetails).parkingPlaceID,
    });
  }

  createGynecologicalExaminationForm() {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');

    return this.fb.group({
      appearanceOfCervix: null,
      typeOfLesionList: null,
      vulvalInvolvement: null,
      vaginalInvolvement: null,
      uterus_Normal: null,
      sufferedFromRTIOrSTI: null,
      rTIOrSTIDetail: null,
      image: null,
      filePath: null,
      experiencedPostCoitalBleeding: null,
      observation: null,
      vanID: JSON.parse(serviceLineDetails).vanID,
      parkingPlaceID: JSON.parse(serviceLineDetails).parkingPlaceID,
    });
  }

  createOralExaminationForm() {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');

    return this.fb.group({
      limitedMouthOpening: null,
      premalignantLesions: null,
      preMalignantLesionTypeList: null,
      otherLesionType: null,
      prolongedIrritation: null,
      chronicBurningSensation: null,
      observation: null,
      image: null,
      vanID: JSON.parse(serviceLineDetails).vanID,
      parkingPlaceID: JSON.parse(serviceLineDetails).parkingPlaceID,
    });
  }

  lymphNodesArray = [
    {
      lymphNodeName: ' Sub Mental',
      size_Left: null,
      mobility_Left: null,
      size_Right: null,
      mobility_Right: null,
    },
    {
      lymphNodeName: ' Sub Mandibular',
      size_Left: null,
      mobility_Left: null,
      size_Right: null,
      mobility_Right: null,
    },
    {
      lymphNodeName: ' Sub deep cervical',
      size_Left: null,
      mobility_Left: null,
      size_Right: null,
      mobility_Right: null,
    },
    {
      lymphNodeName: ' Jugulo-digastric',
      size_Left: null,
      mobility_Left: null,
      size_Right: null,
      mobility_Right: null,
    },
    {
      lymphNodeName: ' Mid cervical',
      size_Left: null,
      mobility_Left: null,
      size_Right: null,
      mobility_Right: null,
    },
    {
      lymphNodeName: ' Interior cervical',
      size_Left: null,
      mobility_Left: null,
      size_Right: null,
      mobility_Right: null,
    },
    {
      lymphNodeName: ' Supra clavicular',
      size_Left: null,
      mobility_Left: null,
      size_Right: null,
      mobility_Right: null,
    },
    {
      lymphNodeName: ' Posterior Triangle',
      size_Left: null,
      mobility_Left: null,
      size_Right: null,
      mobility_Right: null,
    },
    {
      lymphNodeName: ' Axillary Lymph Nodes',
      size_Left: null,
      mobility_Left: null,
      size_Right: null,
      mobility_Right: null,
    },
  ];

  createSignsForm() {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');

    return this.fb.group({
      shortnessOfBreath: null,
      coughgt2Weeks: null,
      bloodInSputum: null,
      difficultyInOpeningMouth: null,
      nonHealingUlcerOrPatchOrGrowth: null,
      changeInTheToneOfVoice: null,
      lumpInTheBreast: null,
      bloodStainedDischargeFromNipple: null,
      changeInShapeAndSizeOfBreasts: null,
      vaginalBleedingBetweenPeriods: null,
      vaginalBleedingAfterMenopause: null,
      vaginalBleedingAfterIntercourse: null,
      foulSmellingVaginalDischarge: null,
      lymphNode_Enlarged: null,
      breastEnlargement: null,
      observation: null,
      vanID: JSON.parse(serviceLineDetails).vanID,
      parkingPlaceID: JSON.parse(serviceLineDetails).parkingPlaceID,
      lymphNodes: this.fb.array(
        this.lymphNodesArray.map((item) => ({
          ...item,
          vanID: JSON.parse(serviceLineDetails).vanID,
          parkingPlaceID: JSON.parse(serviceLineDetails).parkingPlaceID,
        })),
      ),
    });
  }

  createCancerReferForm() {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');

    return this.fb.group({
      referredToInstituteID: null,
      refrredToAdditionalServiceList: null,
      referredToInstituteName: null,
      otherReferredToInstituteName: null,
      referralReason: null,
      referralReasonList: null,
      otherReferralReason: null,
      revisitDate: null,
      vanID: JSON.parse(serviceLineDetails).vanID,
      parkingPlaceID: JSON.parse(serviceLineDetails).parkingPlaceID,
    });
  }

  createCancerDiagnosisForm() {
    const serviceLineDetails: any =
      this.sessionstorage.getItem('serviceLineDetails');

    return this.fb.group({
      provisionalDiagnosisPrimaryDoctor: null,
      provisionalDiagnosisOncologist: { value: null, disabled: true },
      remarks: null,
      vanID: JSON.parse(serviceLineDetails).vanID,
      parkingPlaceID: JSON.parse(serviceLineDetails).parkingPlaceID,
    });
  }
}
