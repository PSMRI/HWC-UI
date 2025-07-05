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
import { Component, OnInit, Input, DoCheck, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import {
  BeneficiaryDetailsService,
  ConfirmationService,
} from 'src/app/app-modules/core/services';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import {
  NurseService,
  MasterdataService,
  DoctorService,
} from 'src/app/app-modules/nurse-doctor/shared/services';
import { HrpService } from 'src/app/app-modules/nurse-doctor/shared/services/hrp.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { AmritTrackingService } from 'Common-UI/src/tracking';
@Component({
  selector: 'app-nurse-anc-obstetric-examination',
  templateUrl: './obstetric-examination.component.html',
  styleUrls: ['./obstetric-examination.component.css'],
  providers: [DatePipe],
})
export class ObstetricExaminationComponent
  implements OnInit, DoCheck, OnDestroy
{
  @Input()
  obstetricExaminationForANCForm!: FormGroup;

  @Input()
  comorbidityConcurrentConditionsForm!: FormGroup;

  current_language_set: any;

  selectFundalHeight = [
    {
      name: 'Not Palpable',
      id: 1,
    },
    {
      name: '12th Week',
      id: 2,
    },
    {
      name: '16th Week',
      id: 3,
    },
    {
      name: '20th Week',
      id: 4,
    },
    {
      name: '24th Week',
      id: 5,
    },
    {
      name: '28th Week',
      id: 6,
    },
    {
      name: '32th Week',
      id: 7,
    },
    {
      name: '36th Week',
      id: 8,
    },
    {
      name: '40th Week',
      id: 9,
    },
  ];

  selectFHPOAStatus = [
    {
      name: 'FH=POA',
      id: 1,
    },
    {
      name: 'FH>POA',
      id: 2,
    },
    {
      name: 'FH<POA',
      id: 3,
    },
  ];

  selectInterpretationFHAndPOA = [
    {
      name: 'Corresponding',
      id: 1,
    },
    {
      name: 'Not Corresponding',
      id: 2,
    },
  ];

  selectFetalHeartRate = [
    {
      name: '<120',
      id: 1,
    },
    {
      name: '120-160',
      id: 2,
    },
    {
      name: '>160',
      id: 3,
    },
  ];

  selectFetalPositionOrLie = [
    {
      name: 'Longitudinal',
      id: 1,
    },
    {
      name: 'Oblique',
      id: 2,
    },
    {
      name: 'Transverse',
      id: 3,
    },
  ];

  selectFetalPresentation = [
    {
      name: 'Cepahlic',
      id: 1,
    },
    {
      name: 'Breech',
      id: 2,
    },
    {
      name: 'Face',
      id: 3,
    },
    {
      name: 'Shoulder',
      id: 4,
    },
  ];

  selectAbdominalScars = [
    {
      name: 'Absent',
      id: 1,
    },
    {
      name: 'LSCS Scar',
      id: 2,
    },
    {
      name: 'Other Surgical Scars',
      id: 3,
    },
  ];

  fetosenseTestMaster: any[] = [];

  beneficiaryDetailsSubscription: any;
  beneficiary: any;
  lmpDate: any = null;
  testStaus: any;
  nurseMasterDataSubscription: any;
  prescribedTestArray: any = [];
  today!: Date;
  enableHrpReasons = false;
  enableSuspectedHrp = false;
  HRPData: any;
  comorbidityDetails: any = [];
  hrpServiceSubscription: any;
  malPresentation: any;
  beneficiaryHeight: any;
  bloodGroupType: any;
  congenitalAnomalies: any;
  durationType: any;
  typeOfDelivery: any;
  preganancyComplication: any;
  reasonsForHrp: any = [];
  lowLyingPlacenta: any;
  vertebralDeformity: any;
  benVisitNo: any;
  visitReason: any;
  constructor(
    public httpServiceService: HttpServiceService,
    private nurseService: NurseService,
    private hrpService: HrpService,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    private confirmationService: ConfirmationService,
    private masterdataService: MasterdataService,
    private datePipe: DatePipe,
    readonly sessionstorage: SessionStorageService,
    private doctorService: DoctorService,
    private trackingService: AmritTrackingService,
  ) {}

  ngOnDestroy() {
    if (this.beneficiaryDetailsSubscription)
      this.beneficiaryDetailsSubscription.unsubscribe();
    if (this.nurseMasterDataSubscription)
      this.nurseMasterDataSubscription.unsubscribe();
  }

  ngOnInit() {
    this.doctorService.clearHrpReasonsStatus();
    this.getNurseMasterData();
    this.nurseService.clearLMPForFetosenseTest();
    this.assignSelectedLanguage();
    this.benVisitNo = this.sessionstorage.getItem('benVisitNo');
    this.visitReason = this.sessionstorage.getItem('visitReason');
    this.getHrpDetailsForFollowUp();

    this.beneficiaryDetailsSubscription =
      this.beneficiaryDetailsService.beneficiaryDetails$.subscribe((res) => {
        if (res !== null) {
          this.beneficiary = res;
          this.getPrescribedTestDetails();
        }
      });
    this.nurseService.lmpFetosenseTestValue$.subscribe((response) => {
      this.lmpDate = response;
    });

    this.doctorService.enableHRPStatusAndReasons$.subscribe((response) => {
      if (response === true) {
        if (
          this.doctorService.isHrpFromNurse !== undefined &&
          this.doctorService.isHrpFromNurse !== null &&
          this.doctorService.reasonHrpFromNurse !== undefined &&
          this.doctorService.reasonHrpFromNurse !== null
        ) {
          this.enableSuspectedHrp = this.doctorService.isHrpFromNurse;
          this.reasonsForHrp = this.doctorService.reasonHrpFromNurse;
          this.hrpService.checkHrpStatus = false;
        }
      }
    });
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }

  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }

  getNurseMasterData() {
    this.nurseMasterDataSubscription =
      this.masterdataService.nurseMasterData$.subscribe((masterData) => {
        if (masterData && masterData !== null && masterData !== undefined) {
          this.fetosenseTestMaster = masterData.fetosenseTestMaster;
        }
      });
  }

  getHrpDetailsForFollowUp() {
    if (
      this.visitReason !== undefined &&
      this.visitReason !== null &&
      this.visitReason.toLowerCase() === 'follow up'
    ) {
      if (
        this.benVisitNo !== undefined &&
        this.benVisitNo !== null &&
        this.benVisitNo !== 1
      ) {
        const reqObj = {
          beneficiaryRegId: this.sessionstorage.getItem('beneficiaryRegID'),
        };
        this.hrpService.getHrpForFollowUP(reqObj).subscribe((res: any) => {
          if (res.statusCode === 200 && res.data !== null) {
            this.enableSuspectedHrp = res.data.isHRP;
            this.reasonsForHrp = res.data.reasonsForHRP;
          } else {
            console.log('hrp status fetch issue', res.errorMessage);
          }
        });
      }
    }
  }

  checkForHRP() {
    (this.malPresentation =
      this.obstetricExaminationForANCForm.controls['malPresentation'].value),
      (this.lowLyingPlacenta =
        this.obstetricExaminationForANCForm.controls['lowLyingPlacenta'].value),
      (this.vertebralDeformity =
        this.obstetricExaminationForANCForm.controls[
          'vertebralDeformity'
        ].value),
      (this.hrpService.checkHrpStatus = true);
  }

  getHRPStatus() {
    const reqObj = {
      beneficiaryRegID: this.beneficiary.beneficiaryRegID,
      benificiaryAge: this.beneficiary.ageVal,
      beneficiaryHeight:
        this.hrpService.heightValue !== null &&
        this.hrpService.heightValue !== undefined
          ? this.hrpService.heightValue
          : null,
      comorbidConditions:
        this.hrpService.comorbidityConcurrentCondition !== null &&
        this.hrpService.comorbidityConcurrentCondition !== undefined
          ? this.hrpService.comorbidityConcurrentCondition
          : null,
      malPresentation:
        this.obstetricExaminationForANCForm.controls['malPresentation'].value,
      lowLyingPlacenta:
        this.obstetricExaminationForANCForm.controls['lowLyingPlacenta'].value,
      vertebralDeformity:
        this.obstetricExaminationForANCForm.controls['vertebralDeformity']
          .value,
      hemoglobin:
        this.hrpService.hemoglobin !== null &&
        this.hrpService.hemoglobin !== undefined
          ? this.hrpService.hemoglobin
          : null,
      bloodGroupType:
        this.hrpService.bloodGroup !== null &&
        this.hrpService.bloodGroup !== undefined
          ? this.hrpService.bloodGroup
          : null,
      pastIllness:
        this.hrpService.pastIllness !== null &&
        this.hrpService.pastIllness !== undefined
          ? this.hrpService.pastIllness
          : null,
      pastObstetric:
        this.hrpService.pastObstetric !== null &&
        this.hrpService.pastObstetric !== undefined
          ? this.hrpService.pastObstetric
          : null,
    };
    this.hrpService.getHRPStatus(reqObj).subscribe(
      (res: any) => {
        if (res.statusCode === 200 && res.data !== null) {
          this.enableSuspectedHrp = res.data.isHRP;
          this.reasonsForHrp = res.data.reasonForHrp;
          this.hrpService.checkHrpStatus = false;
          this.obstetricExaminationForANCForm.patchValue({
            isHRP: this.enableSuspectedHrp,
            reasonsForHRP: this.reasonsForHrp,
          });

          this.nurseService.setUpdateForHrpStatus(true);

          console.log('HRP Data', res.data);
        } else {
          this.confirmationService.alert(res.errorMessage, 'error');
          this.nurseService.setUpdateForHrpStatus(false);
        }
      },
      (err) => {
        this.confirmationService.alert(err, 'error');
      },
    );
  }

  enableHRPStatus() {
    if (this.HRPData !== null && this.HRPData !== undefined) {
      this.enableSuspectedHrp = true;
      this.reasonsForHrp = this.HRPData;
    } else {
      this.enableSuspectedHrp = false;
    }
  }

  resetFetalHeartRate(event: any) {
    if (event.value === 'Not Audible')
      this.obstetricExaminationForANCForm.patchValue({
        fetalHeartRate_BeatsPerMinute: null,
      });
  }

  get fetalHeartSounds() {
    return this.obstetricExaminationForANCForm.controls['fetalHeartSounds']
      .value;
  }

  get SFH() {
    console.log('sfh');
    return this.obstetricExaminationForANCForm.controls['sfh'].value;
  }

  /**
   * (C)
   * DE40034072
   *25-06-21
   */

  /*Visit Category - ANC
     Gender - Female
     Fetosense Test
    */

  sendTestDetails(testId: any, testName: any) {
    if (
      this.lmpDate !== null &&
      this.lmpDate !== undefined &&
      !isNaN(this.lmpDate.getTime())
    ) {
      const newLmpDate = this.datePipe.transform(this.lmpDate, 'yyyy-MM-dd');
      this.today = new Date();
      const todayDate = new Date(this.today + 'UTC');
      todayDate.toString();

      const serviceLineDetails: any =
        this.sessionstorage.getItem('serviceLineDetails');
      const providerServiceID: any =
        this.sessionstorage.getItem('providerServiceID');
      const reqObj = {
        beneficiaryRegID: this.beneficiary.beneficiaryRegID,
        benFlowID: this.beneficiary.benFlowID,
        testTime: todayDate,
        motherLMPDate: newLmpDate,
        motherName: this.beneficiary.beneficiaryName,
        foetalMonitorTestId: testId,
        testName: testName,
        vanID: JSON.parse(serviceLineDetails).vanID,
        ProviderServiceMapID: JSON.parse(providerServiceID),
        createdBy: this.sessionstorage.getItem('userName'),
      };

      this.nurseService.sendTestDetailsToFetosense(reqObj).subscribe(
        (res: any) => {
          if (res && res.statusCode === 200 && res.data) {
            this.testStaus = res.data.response;
            this.getPrescribedTestDetails();
            this.confirmationService.alertFetsenseMessage(
              this.testStaus,
              'Fetosense Device',
            );
          } else {
            this.confirmationService.alert(res.errorMessage, 'error');
          }
        },
        (err) => {
          this.confirmationService.alert(err.errorMessage, 'error');
        },
      );
    } else {
      this.confirmationService.alert(
        this.current_language_set.pleaseSelectLastMenstrualPeriod,
        'info',
      );
    }
  }

  getPrescribedTestDetails() {
    this.nurseService
      .fetchPrescribedFetosenseTests(this.beneficiary.benFlowID)
      .subscribe(
        (response: any) => {
          if (response && response.statusCode === 200 && response.data) {
            this.prescribedTestArray = response.data.benFetosenseData;
          } else {
            this.confirmationService.alert(response.errorMessage, 'error');
          }
        },
        (err) => {
          this.confirmationService.alert(err, 'error');
        },
      );
  }

  /* Disabling the Test if it is already prescribed*/

  checkTestPrescribed(testValue: any) {
    return this.prescribedTestArray.some(
      (item: any) => item.foetalMonitorTestId === testValue,
    );
  }

  /*END*/

  trackFieldInteraction(fieldName: string) {
    try {
      this.trackingService.trackFieldInteraction(
        fieldName,
        'Obstetric Examination',
      );
    } catch (error) {
      console.error(
        `❌ Error tracking obstetric examination ${fieldName}:`,
        error,
      );
    }
  }
}
