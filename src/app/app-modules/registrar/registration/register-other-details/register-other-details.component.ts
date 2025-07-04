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
  OnDestroy,
  Inject,
  Output,
  EventEmitter,
  DoCheck,
  OnChanges,
} from '@angular/core';
import { RegistrarService } from '../../shared/services/registrar.service';
import { RegistrationUtils } from '../../shared/utility/registration-utility';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import {
  FormGroup,
  FormControl,
  FormArray,
  FormBuilder,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';

import { ViewHealthIdCardComponent } from './view-health-id-card/view-health-id-card.component';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HealthIdOtpSuccessComponent } from '../../health-id-otp-generation/health-id-otp-generation.component';
import { environment } from 'src/environments/environment';
import { ConsentFormComponent } from '../../consent-form/consent-form.component';
import { BiometricAuthenticationComponent } from '../../biometric-authentication/biometric-authentication.component';
@Component({
  selector: 'app-register-other-details',
  templateUrl: './register-other-details.component.html',
  styleUrls: ['./register-other-details.component.css'],
})
export class RegisterOtherDetailsComponent
  implements OnInit, DoCheck, OnDestroy
{
  utils = new RegistrationUtils(this.fb);

  masterData: any;
  masterDataSubscription: any;

  revisitData: any;
  revisitDataSubscription: any;
  currentLanguageSet: any;

  govIDMaster: any[] = [];
  previousGovID: any[] = [];
  otherGovIDMaster: any[] = [];
  previousOtherGovID: any[] = [];
  removedGovIDs: any[] = []; // edit ben
  removedOtherGovIDs: any = []; //edit ben
  govLength!: any;
  otherGovLength!: any;
  GenerateOTP: any;
  abhaSuffix = environment.abhaExtension;
  @Input()
  otherDetailsForm!: FormGroup;

  @Input()
  patientRevisit!: boolean;

  @Input()
  disableGenerateOTP!: boolean;
  patterns: any;

  @Output() disableGenerateHealthID = new EventEmitter<any>();
  consentGranted: any;
  constructor(
    private registrarService: RegistrarService,
    private confirmationService: ConfirmationService,
    public httpServiceService: HttpServiceService,
    private fb: FormBuilder,
    private dialog: MatDialog,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.setErrorMessageForID();
    this.setcheckBoxEnabledByDefault();
    this.loadMasterDataObservable();

    this.registrarService.abhaDetailDetails$.subscribe((result) => {
      if (result === true) {
        this.patchDetails();
      } else if (!result) {
        this.otherDetailsForm.reset();
      }
    });
    console.log('currentLanguageSet in ngOnInit', this.currentLanguageSet);
  }

  getGovIDControls(): AbstractControl[] | null {
    const govIDControl = this.otherDetailsForm.get('govID');
    return govIDControl instanceof FormArray ? govIDControl.controls : null;
  }

  getOtherGovIDControls(): AbstractControl[] | null {
    const govIDControl = this.otherDetailsForm.get('otherGovID');
    return govIDControl instanceof FormArray ? govIDControl.controls : null;
  }

  patchDetails() {
    const id = <FormArray>this.otherDetailsForm.controls['govID'];
    const govIdValue = this.govIDMaster[0].govIdEntityMaster;
    let aadharId: any;
    console.log(govIdValue);
    if (govIdValue !== undefined && govIdValue !== null) {
      for (let i = 0; i < govIdValue.length; i++) {
        if (govIdValue[i].identityType === 'Aadhar') {
          aadharId = govIdValue[i].govtIdentityTypeID;
          break;
        }
      }
    }

    const formGroupIndexed = <FormGroup>id.at(0);
    this.filtergovIDs(aadharId, 0);
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
    this.setErrorMessageForID();
    const id = this.otherDetailsForm.controls['govID'].value;
    id.forEach((resp: any, index: any) =>
      this.addPatternforGovID(resp.type, index),
    );
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  ngOnDestroy() {
    if (this.masterDataSubscription) {
      this.masterDataSubscription.unsubscribe();
    }
    if (this.patientRevisit && this.revisitDataSubscription) {
      this.revisitDataSubscription.unsubscribe();
    }
    this.registrarService.abhaGenerateData = null;
    this.registrarService.aadharNumberNew = null;
    this.registrarService.getabhaDetail(false);
  }
  alerting(control: any) {
    console.log(control, 'a');
  }

  setErrorMessageForID() {
    this.patterns = [
      {
        govtIdentityTypeID: 2,
        allow: 'alphanumeric',
        error: this.currentLanguageSet.common.enterCharacterVoterID,
        maxLength: 10,
        pattern: /^([A-Za-z]+[0-9]|[0-9]+[A-Za-z])[A-Za-z0-9]*$/,
        identityType: 'Voter ID',
      },
      {
        govtIdentityTypeID: 3,
        error: this.currentLanguageSet.common.enterCharacterDrivingLicenseID,
        minLength: 8,
        maxLength: 20,
        identityType: 'Driving License',
      },
      {
        govtIdentityTypeID: 4,
        allow: 'alphanumeric',
        error: this.currentLanguageSet.common.EnterCharacterPanID,
        maxLength: 10,
        pattern: /^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9]+)$/,
        identityType: 'PAN',
      },
      {
        govtIdentityTypeID: 5,
        allow: 'alphanumeric',
        error: this.currentLanguageSet.common.EnterCharacterPassport,
        maxLength: 15,
        pattern: /^([A-Za-z]+[0-9]|[0-9]+[A-Za-z])[A-Za-z0-9]*$/,
        identityType: 'Passport',
      },
      {
        govtIdentityTypeID: 6,
        allow: 'alphanumeric',
        error: this.currentLanguageSet.common.EnterCharacterRationcardID,
        maxLength: 15,
        pattern: /^([A-Za-z]+[0-9]|[0-9]+[A-Za-z])[A-Za-z0-9]*$/,
        identityType: 'Ration Card',
      },
    ];
  }

  /**
   *
   * Reset FormArrays
   *
   */
  resetForm() {
    this.govIDMaster = [];
    this.previousGovID = [];
    this.otherGovIDMaster = [];
    this.previousOtherGovID = [];
    this.govLength = null;
    this.otherGovLength = null;
    this.loadMasterDataObservable();
  }

  openConsent() {
    if (this.patientRevisit === false) {
      const matDialogRef: MatDialogRef<ConsentFormComponent> = this.dialog.open(
        ConsentFormComponent,
        {
          width: '650px',
          height: '700px',
          disableClose: true,
        },
      );
      matDialogRef.afterClosed().subscribe((consentProvided) => {
        this.consentGranted = consentProvided;
        this.registrarService.sendConsentStatus(consentProvided);
      });
    }
  }

  checkIDPattern(index: number) {
    const values = this.otherDetailsForm.value.govID[index];
    const id = (<FormArray>this.otherDetailsForm.controls['govID']).at(index);
    if (values.idValue.length === values.maxLength) {
      console.log('ok');
    }
  }
  /**
   *
   * Load Basic Master Data Observable
   */
  loadMasterDataObservable() {
    this.masterDataSubscription =
      this.registrarService.registrationMasterDetails$.subscribe((res) => {
        if (res !== null) {
          this.masterData = Object.assign({}, res);
          this.govIDMaster[0] = Object.assign({}, res);
          console.log('PK', this.govIDMaster[0]);
          this.govLength = this.masterData.govIdEntityMaster.length;
          this.otherGovLength = this.masterData.otherGovIdEntityMaster.length;
          this.otherGovIDMaster[0] = Object.assign({}, res);
          if (this.patientRevisit) {
            this.configMasterForOthers();
          }
        }
      });
  }

  /**
   * Load Master and Current Others Details for an Old Beneficiary
   * FOR BENEFICIARY EDIT FROM BENEFICIARY DATA
   */
  configMasterForOthers() {
    this.revisitDataSubscription =
      this.registrarService.beneficiaryEditDetails$.subscribe((res) => {
        if (res && res.beneficiaryID) {
          this.revisitData = Object.assign({}, res);
          if (this.patientRevisit) {
            this.loadBenEditDetails();
          }
        }
      });
  }

  loadBenEditDetails() {
    this.otherDetailsForm.patchValue({
      fatherName: this.revisitData.fatherName || null,
      motherName: this.revisitData.motherName || null,
      emailID: this.revisitData.email || null,
      community:
        (this.revisitData.i_bendemographics &&
          this.revisitData.i_bendemographics.communityID) ||
        null,
      communityName:
        (this.revisitData.i_bendemographics &&
          this.revisitData.i_bendemographics.communityName) ||
        null,
      bankName: this.revisitData.bankName || null,
      branchName: this.revisitData.branchName || null,
      ifscCode: this.revisitData.ifscCode || null,
      accountNo: this.revisitData.accountNo || null,
      religion: this.revisitData.religionId || null,
      religionOther: this.revisitData.religion || null,
      checked: false,
      checked1: true,
      checked2: true,
    });
    this.loadPreviousBenIdData();
  }

  loadPreviousBenIdData() {
    if (
      this.revisitData.beneficiaryIdentities &&
      this.revisitData.beneficiaryIdentities.length
    ) {
      const unFilteredIdentityData = Object.assign(
        [],
        this.revisitData.beneficiaryIdentities,
      );
      const identityData: any[] = [];
      unFilteredIdentityData.forEach((element: any) => {
        if (!element.deleted || element.deleted === false) {
          identityData.push(element);
        }
      });
      console.log(identityData, 'identityData');
      const govIDs: any[] = [];
      const otherGovIDs: any[] = [];
      identityData.forEach((item) => {
        if (item.govtIdentityType.isGovtID === true) {
          govIDs.push(item);
        }
      });
      identityData.forEach((item) => {
        if (item.govtIdentityType.isGovtID === false) {
          otherGovIDs.push(item);
        }
      });
      console.log(govIDs, otherGovIDs, 'gov n others  ');
      this.loadGovIDs(Object.assign([], govIDs));
      this.loadOtherGovIDs(Object.assign([], otherGovIDs));
      this.workAround();
    }
  }

  setcheckBoxEnabledByDefault() {
    this.isMandatory = true;
    this.isFatherRequired = true;
    this.isCommunityRequired = true;
    this.isGidRequired = true;
    this.otherDetailsForm.patchValue({
      checked: false,
      checked1: true,
      checked2: true,
    });
  }

  workAround() {
    const id = <FormArray>this.otherDetailsForm.controls['govID'];
    const idValue = id.value;
    const idToRemove: any[] = [];
    idValue.forEach((element: any, i: any) => {
      if (
        !element.type ||
        element.type === null ||
        element.type === undefined
      ) {
        idToRemove.push(i);
      }
    });
    const otherId = <FormArray>this.otherDetailsForm.controls['otherGovID'];
    const otherIdValue = otherId.value;
    const idOtherToRemove: any[] = [];

    otherIdValue.forEach((element: any, i: any) => {
      if (
        !element.type ||
        element.type === null ||
        element.type === undefined
      ) {
        idOtherToRemove.push(i);
      }
    });

    const reversedidToRemove = idToRemove.reverse();
    const reversedidOtherToRemove = idOtherToRemove.reverse();

    reversedidToRemove.forEach((elementA) => {
      if (elementA) id.removeAt(elementA);
    });
    reversedidOtherToRemove.forEach((elementB) => {
      if (elementB) otherId.removeAt(elementB);
    });

    console.log(idValue, otherIdValue, 'laoji');
  }

  loadGovIDs(govtids: any) {
    console.log(govtids, 'here');
    const id = <FormArray>this.otherDetailsForm.controls['govID'];
    console.log(id, 'formGovID');
    govtids.forEach((val: any, i: any) => {
      console.log(i, 'is i');
      console.log('data', val, 'clear', val.govIdentityTypeID);
      const formGroupIndexed = <FormGroup>id.at(i);
      console.log(formGroupIndexed, 'formgroupIndexed');
      this.filtergovIDs(val.govtIdentityTypeID, i);
      formGroupIndexed.patchValue({
        type: val.govtIdentityTypeID,
        idValue: val.govtIdentityNo,
        allow: this.getAllowedGovChars(val.govtIdentityTypeID),
        benIdentityId: val.benIdentityId,
        deleted: val.deleted,
        createdBy: val.createdBy,
      });
      this.addID(1, i);
      console.log(formGroupIndexed.value, 'formGroupValue');
      console.log(val, 'value to be added', i, 'and index');
      console.log(id, 'formGovID again');
    });
  }

  getAllowedGovChars(govtTypeID: any) {
    let allowedText = null;
    this.patterns.forEach((element: any) => {
      if (element.govtIdentityTypeID === govtTypeID) {
        allowedText = element.allow;
      }
    });

    return allowedText;
  }
  loadOtherGovIDs(otherGovtIDs: any) {
    console.log(otherGovtIDs, 'here');
    const id = <FormArray>this.otherDetailsForm.controls['otherGovID'];
    console.log(id, 'formGovID');
    otherGovtIDs.forEach((val: any, i: any) => {
      console.log(i, 'is i');
      console.log('data', val, 'clear', val.govIdentityTypeID);
      const formGroupIndexed = <FormGroup>id.at(i);
      console.log(formGroupIndexed, 'formgroupIndexed');
      this.filterOtherGovIDs(val.govtIdentityTypeID, i);
      formGroupIndexed.patchValue({
        type: val.govtIdentityTypeID,
        idValue: val.govtIdentityNo,
        benIdentityId: val.benIdentityId,
        deleted: val.deleted,
        createdBy: val.createdBy,
      });
      this.addID(0, i);
      console.log(formGroupIndexed.value, 'formGroupValue');
      console.log(val, 'value to be added', i, 'and index');
      console.log(id, 'formGovID again');
    });
  }

  /**
   *
   * Filter GovIDs for List
   */
  filtergovIDs(selectedID: any, index: number) {
    const nextIndex = index + 1;

    if (this.previousGovID[index] === undefined) {
      this.previousGovID[index] = selectedID;

      const govIDs = this.otherDetailsForm.value.govID;

      this.govIDMaster[nextIndex] = JSON.parse(JSON.stringify(this.masterData));

      this.previousGovID.forEach((value) => {
        this.govIDMaster[nextIndex].govIdEntityMaster = this.govIDMaster[
          nextIndex
        ].govIdEntityMaster.filter((item: any) => {
          return item.govtIdentityTypeID !== value;
        });
      });

      for (let i = 0; i < this.govIDMaster.length; i++) {
        let indexToRemove;
        let newDataforOtherLists;
        if (i !== index) {
          const temp = JSON.parse(
            JSON.stringify(this.govIDMaster[i].govIdEntityMaster),
          );
          temp.forEach((removing: any, j: any) => {
            if (removing.govtIdentityTypeID === selectedID) {
              indexToRemove = j;
            }
          });

          if (indexToRemove !== undefined) {
            temp.splice(indexToRemove, 1);
            this.govIDMaster[i].govIdEntityMaster = temp;
          }
        }
        indexToRemove = undefined;
      }
    } else {
      const id = <FormArray>this.otherDetailsForm.controls['govID'];
      const formGroupIndexed = <FormGroup>id.at(index);
      console.log(formGroupIndexed, 'formgroupIndexed');
      formGroupIndexed.controls['idValue'].reset();

      const toBePushed = this.masterData.govIdEntityMaster.filter(
        (item: any) => {
          return item.govtIdentityTypeID === this.previousGovID[index];
        },
      );
      let indexToRemove;
      let newDataforOtherLists;

      for (let i = 0; i < this.govIDMaster.length; i++) {
        let indexToRemove;
        let newDataforOtherLists;
        if (i !== index) {
          if (toBePushed[0] !== undefined) {
            this.govIDMaster[i].govIdEntityMaster.push(toBePushed[0]);
          }
          const temp = JSON.parse(
            JSON.stringify(this.govIDMaster[i].govIdEntityMaster),
          );
          temp.forEach((removing: any, j: any) => {
            if (removing.govtIdentityTypeID === selectedID) {
              indexToRemove = j;
            }
          });
          if (indexToRemove !== undefined) {
            temp.splice(indexToRemove, 1);
            this.govIDMaster[i].govIdEntityMaster = temp;
          }
        }
        indexToRemove = undefined;
      }
      this.previousGovID[index] = selectedID;
    }
    this.addPatternforGovID(selectedID, index);
  }

  addPatternforGovID(type: any, index: any) {
    const id = <FormArray>this.otherDetailsForm.controls['govID'];

    this.patterns.forEach((element: any, i: any) => {
      if (type === element.govtIdentityTypeID) {
        id.at(index).patchValue({
          pattern: element.pattern,
          error: element.error,
          allow: element.allow,
          minLength: element.minLength,
          maxLength: element.maxLength,
          type: type,
        });
      }
    });
  }

  /**
   *
   * Filter Other GovIDs for List
   */
  filterOtherGovIDs(selectedID: any, index: number) {
    const nextIndex = index + 1;
    if (this.previousOtherGovID[index] === undefined) {
      this.previousOtherGovID[index] = selectedID;

      const govIDs = this.otherDetailsForm.value.otherGovID;

      this.otherGovIDMaster[nextIndex] = JSON.parse(
        JSON.stringify(this.masterData),
      );

      this.previousOtherGovID.forEach((value) => {
        this.otherGovIDMaster[nextIndex].otherGovIdEntityMaster =
          this.otherGovIDMaster[nextIndex].otherGovIdEntityMaster.filter(
            (item: any) => {
              return item.govtIdentityTypeID !== value;
            },
          );
      });

      for (let i = 0; i < this.otherGovIDMaster.length; i++) {
        let indexToRemove;
        let newDataforOtherLists;
        if (i !== index) {
          const temp = JSON.parse(
            JSON.stringify(this.otherGovIDMaster[i].otherGovIdEntityMaster),
          );
          temp.forEach((removing: any, j: any) => {
            if (removing.govtIdentityTypeID === selectedID) {
              indexToRemove = j;
            }
          });

          if (indexToRemove !== undefined) {
            temp.splice(indexToRemove, 1);
            this.otherGovIDMaster[i].otherGovIdEntityMaster = temp;
          }
        }
        indexToRemove = undefined;
      }
    } else {
      const id = <FormArray>this.otherDetailsForm.controls['otherGovID'];
      const formGroupIndexed = <FormGroup>id.at(index);
      console.log(formGroupIndexed, 'formgroupIndexed');
      formGroupIndexed.patchValue({
        idValue: null,
      });
      const toBePushed = this.masterData.otherGovIdEntityMaster.filter(
        (item: any) => {
          return item.govtIdentityTypeID === this.previousOtherGovID[index];
        },
      );
      let indexToRemove;
      let newDataforOtherLists;

      for (let i = 0; i < this.otherGovIDMaster.length; i++) {
        let indexToRemove;
        let newDataforOtherLists;
        if (i !== index) {
          if (toBePushed[0] !== undefined) {
            this.otherGovIDMaster[i].otherGovIdEntityMaster.push(toBePushed[0]);
          }
          const temp = JSON.parse(
            JSON.stringify(this.otherGovIDMaster[i].otherGovIdEntityMaster),
          );
          temp.forEach((removing: any, j: any) => {
            if (removing.govtIdentityTypeID === selectedID) {
              indexToRemove = j;
            }
          });

          if (indexToRemove !== undefined) {
            temp.splice(indexToRemove, 1);
            this.otherGovIDMaster[i].otherGovIdEntityMaster = temp;
          }
        }
        indexToRemove = undefined;
      }
      this.previousOtherGovID[index] = selectedID;
    }
  }

  getRemovedIDs() {
    return {
      removedGovIDs: this.removedGovIDs,
      removedOtherGovIDs: this.removedOtherGovIDs,
    };
  }

  /**
   * Remove ID from New IDs
   *
   */
  removeID(idtype: any, index: any) {
    let length = 0;
    length = this.otherDetailsForm.get('govID')?.value.length;
    if (idtype === 1) {
      if (this.otherDetailsForm.value.govID[index].type !== null) {
        if (
          this.patientRevisit &&
          this.otherDetailsForm.value.govID[index].createdBy
        ) {
          this.removedGovIDs.push(this.otherDetailsForm.value.govID[index]);
        }
        this.previousGovID.splice(index, 1);
        const values = this.govIDMaster[index].govIdEntityMaster.filter(
          (item: any) => {
            return (
              item.govtIdentityTypeID ===
              this.otherDetailsForm.value.govID[index].type
            );
          },
        );
        this.govIDMaster.splice(index, 1);
        this.govIDMaster.forEach((item) => {
          item.govIdEntityMaster.push(values[0]);
        });
      }
      const id = <FormArray>this.otherDetailsForm.controls['govID'];
      if (index === 0 && length - 1 === index) {
        id.at(index).patchValue({
          type: null,
          idValue: null,
          pattern: null,
          error: null,
          allow: null,
          minLength: null,
          maxLength: null,
          benIdentityId: null,
        });
      } else {
        id.removeAt(index);
      }
    } else if (idtype === 0) {
      if (this.otherDetailsForm.value.otherGovID[index].type !== null) {
        if (
          this.patientRevisit &&
          this.otherDetailsForm.value.otherGovID[index].createdBy
        ) {
          this.removedOtherGovIDs.push(
            this.otherDetailsForm.value.otherGovID[index],
          );
        }
        this.previousOtherGovID.splice(index, 1);

        const values = this.otherGovIDMaster[
          index
        ].otherGovIdEntityMaster.filter((item: any) => {
          return (
            item.govtIdentityTypeID ===
            this.otherDetailsForm.value.otherGovID[index].type
          );
        });
        this.otherGovIDMaster.splice(index, 1);
        this.otherGovIDMaster.forEach((item) => {
          item.otherGovIdEntityMaster.push(values[0]);
        });
      }

      const id = <FormArray>this.otherDetailsForm.controls['otherGovID'];
      if (index === 0 && length - 1 === index) {
        id.at(index).patchValue({
          type: null,
          idValue: null,
          pattern: null,
          error: null,
          maxLength: null,
          minLength: null,
          benIdentityId: null,
        });
      } else {
        id.removeAt(index);
      }
    }
  }

  /**
   * Add ID to New IDs
   *
   */
  addID(idtype: any, index: any) {
    if (idtype === 1) {
      if (
        this.otherDetailsForm.value.govID[index] &&
        this.otherDetailsForm.value.govID[index].type &&
        this.otherDetailsForm.value.govID[index].idValue
      ) {
        const id = <FormArray>this.otherDetailsForm.controls['govID'];
        id.push(this.utils.initGovID());
      } else {
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.PleaseInputFieldFirst,
          'warn',
        );
      }
    } else if (idtype === 0) {
      if (
        this.otherDetailsForm.value.otherGovID[index] &&
        this.otherDetailsForm.value.otherGovID[index].type &&
        this.otherDetailsForm.value.otherGovID[index].idValue
      ) {
        const id = <FormArray>this.otherDetailsForm.controls['otherGovID'];
        id.push(this.utils.initGovID());
      } else {
        this.confirmationService.alert(
          this.currentLanguageSet.alerts.info.PleaseInputFieldFirst,
          'warn',
        );
      }
    }
  }

  /**
   * Get ReligionName as per ID
   */

  getReligionName() {
    this.masterData.religionMaster.forEach((religion: any) => {
      if (
        this.otherDetailsForm.value.religion !== 7 &&
        this.otherDetailsForm.value.religion === religion.religionID
      ) {
        this.otherDetailsForm.patchValue({
          religionOther: religion.religionType,
        });
      }
    });

    if (this.otherDetailsForm.value.religion === 7) {
      this.otherDetailsForm.patchValue({
        religionOther: null,
      });
    }
  }

  /**
   * get Community Name on getting ID
   */
  onCommunityChanged() {
    const communityMaster = this.masterData.communityMaster;
    communityMaster.forEach((element: any, i: any) => {
      if (element.communityID === this.otherDetailsForm.value.community) {
        this.otherDetailsForm.patchValue({
          communityName: element.communityType,
        });
      }
    });
  }

  checkPattern(index: any, id: any) {
    console.log(index, id, 'knocker');
    if (id.idValue) {
      if (
        !id.pattern.test(id.idValue) ||
        (id.type === 3 && id.idValue.length < id.minLength) ||
        (id.type !== 3 && id.idValue.length !== id.maxLength)
      ) {
        this.confirmationService.alert(id.error);
        const ids = <FormArray>this.otherDetailsForm.controls['govID'];
        const formGroupIndexed = <FormGroup>ids.at(index);
        console.log(formGroupIndexed, 'formgroupIndexed');
        formGroupIndexed.controls['idValue'].reset();
      }
    }
  }

  isMandatory = true;
  checkMandatoryIsRequired(val: any) {
    if (val.checked === false) {
      this.isMandatory = true;
      this.isFatherRequired = true;
      this.isCommunityRequired = true;
      this.isGidRequired = true;
    } else {
      this.isMandatory = false;
      this.isFatherRequired = false;
      this.isCommunityRequired = false;
      this.isGidRequired = false;
    }
  }
  isFatherRequired = true;
  checkFatherIsRequired(val: any) {
    if (val.checked === false) {
      this.isFatherRequired = true;
    } else {
      this.isFatherRequired = false;
    }
  }

  isCommunityRequired = true;
  checkCommunityIsRequired(val: any) {
    if (val.checked === false) {
      this.isCommunityRequired = true;
    } else {
      this.isCommunityRequired = false;
    }
  }

  isGidRequired = true;
  checkGidIsRequired(val: any) {
    if (val.checked === true) {
      this.isGidRequired = true;
    } else {
      this.isGidRequired = false;
    }
  }
  isLetter(str: string) {
    return str.length === 1 && str.match(/[a-z]/i);
  }
  is_numeric(str: string) {
    return /^\d+$/.test(str);
  }
  checkValidHealthID() {
    const healthidval = this.otherDetailsForm.controls['healthId'].value;
    let c = 0;
    let cflag = false;
    if (
      healthidval !== '' &&
      healthidval !== undefined &&
      healthidval !== null
    ) {
      const hid = healthidval;
      if (hid.length >= 4 && hid.length <= 32) {
        for (let i = 0; i < hid.length; i++) {
          if (!this.is_numeric(hid.charAt(i))) {
            if (!this.isLetter(hid.charAt(i))) {
              if (hid.charAt(i) === '.') {
                c++;
                if (i <= 3) {
                  cflag = true;
                  break;
                }
              } else {
                cflag = true;
                break;
              }
            }
          }
        }
        if (c > 1 || c === 0 || cflag) return false;
      } else return false;
    } else return false;
    return true;
  }
  validateHealthId() {
    const healthidval = this.otherDetailsForm.controls['healthId'].value;
    let c = 0;
    let cflag = false;
    if (
      healthidval !== '' &&
      healthidval !== undefined &&
      healthidval !== null
    ) {
      const hid = healthidval;
      for (let i = 0; i < hid.length; i++) {
        if (!this.is_numeric(hid.charAt(i))) {
          if (!this.isLetter(hid.charAt(i))) {
            if (hid.charAt(i) === '.') {
              c++;
              if (i <= 3) {
                cflag = true;
                break;
              }
            } else {
              cflag = true;
              break;
            }
          }
        }
      }
      if (c > 1 || c === 0 || cflag) console.log('Print Data');
    }
    if (healthidval && c === 1 && !cflag) {
      this.openDialogForValidate();
    }
  }

  openHealthIDValidateDialog(txnId: any) {
    const dialogRef = this.dialog.open(HealthIdValidateComponent, {
      height: '300px',
      width: '450px',
      disableClose: true,
      data: {
        healthId:
          this.otherDetailsForm.controls['healthId'].value !== undefined &&
          this.otherDetailsForm.controls['healthId'].value !== null
            ? this.otherDetailsForm.controls['healthId'].value.trim()
            : this.otherDetailsForm.controls['healthId'].value,
        authenticationMode:
          this.otherDetailsForm.controls['healthIdMode'].value,
        healthIDDetailsTxnID: txnId,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log('result', result);
      if (result) {
        if (result.clearHealthID === true) {
          (<FormGroup>this.otherDetailsForm.controls['healthId']).patchValue(
            null as any,
          );
          (<FormGroup>(
            this.otherDetailsForm.controls['healthIdMode']
          )).patchValue(null as any);
        } else {
          (<FormGroup>this.otherDetailsForm.controls['healthId']).patchValue(
            result.healthIdNumber,
          );
          (<FormGroup>(
            this.otherDetailsForm.controls['healthIdMode']
          )).patchValue(result.healthIdMode);
          (<FormGroup>this.otherDetailsForm.controls['healthId']).disable();
          (<FormGroup>this.otherDetailsForm.controls['healthId']).markAsDirty();
          this.registrarService.changePersonalDetailsData(result);
          this.disableGenerateHealthID.emit(true);
        }
      }
    });
  }

  openDialogForValidate() {
    const reqObj = {
      healthID:
        this.otherDetailsForm.controls['healthId'].value !== undefined &&
        this.otherDetailsForm.controls['healthId'].value !== null
          ? this.otherDetailsForm.controls['healthId'].value.trim()
          : this.otherDetailsForm.controls['healthId'].value,
      isValidate: true,
      authenticationMode: this.otherDetailsForm.controls['healthIdMode'].value,
    };
    this.registrarService.generateOTPValidateHealthID(reqObj).subscribe(
      (res: any) => {
        if (res.statusCode === 200) {
          if (res.data && res.data.txnId) {
            if (
              this.otherDetailsForm.controls['healthIdMode'].value === 'MOBILE'
            ) {
              this.confirmationService
                .confirmHealthId(
                  'success',
                  this.currentLanguageSet.OTPSentToRegMobNo,
                )
                .subscribe((result) => {
                  if (result) {
                    this.openHealthIDValidateDialog(res.data.txnId);
                  }
                });
            } else if (
              this.otherDetailsForm.controls['healthIdMode'].value === 'AADHAR'
            ) {
              this.confirmationService
                .confirmHealthId(
                  'success',
                  this.currentLanguageSet.OTPSentToRegMobNo,
                )
                .subscribe((result) => {
                  if (result) {
                    this.openHealthIDValidateDialog(res.data.txnId);
                  }
                });
            }
          } else {
            this.confirmationService.alert(
              this.currentLanguageSet.errorInABHAValidation,
              'error',
            );
          }
        } else {
          (<FormGroup>this.otherDetailsForm.controls['healthId']).patchValue(
            null as any,
          );
          (<FormGroup>(
            this.otherDetailsForm.controls['healthIdMode']
          )).patchValue(null as any);
          this.confirmationService.alert(res.status, 'error');
        }
      },
      (err) => {
        this.confirmationService.alert(
          this.currentLanguageSet.issueInGettingBeneficiaryABHADetails,
          'error',
        );
      },
    );
  }
}
@Component({
  selector: 'app-health-id-validatepopup',
  templateUrl: './health-id-validatepopup.html',
  styleUrls: ['./register-other-details.component.css'],
})
export class HealthIdValidateComponent implements OnInit, DoCheck {
  healthIdValidateForm!: FormGroup;
  healthIdSearchForm!: FormGroup;
  RequestId: any;
  gender: any;
  firstName: any;
  lastName: any;
  userHealthId: any;
  enablehealthIdOTP = 'form';
  searchHealthid: any;
  //Health ID Card
  healthIDCard: any;
  idErrorText!: string;
  patternID!: RegExp;
  address: any;
  abhaSuffix = environment.abhaExtension;
  constructor(
    public dialogRef: MatDialogRef<HealthIdValidateComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: MatDialog,
    private fb: FormBuilder,
    public httpServiceService: HttpServiceService,
    private registrarService: RegistrarService,
    private confirmationValService: ConfirmationService,
  ) {
    console.log('popupdata');
  }
  valhealthId: any = this.data.healthId;
  healthIdMode: any = this.data.authenticationMode;
  enableHealthIDCard: any = false;
  currentLanguageSet: any;
  showProgressBar = false;
  transactionId: any;
  ngOnInit() {
    if (this.data.generateHealthIDCard !== undefined) {
      this.enableHealthIDCard = this.data.generateHealthIDCard;
    } else {
      this.enableHealthIDCard = false;
    }
    this.healthIdValidateForm = this.createOtpValidationForm();
    this.healthIdSearchForm = this.createSearchHealthIDForm();
    console.log('popupdata', this.valhealthId);
    if (this.valhealthId === 'NO') {
      this.enablehealthIdOTP = 'form';
    } else {
      this.enablehealthIdOTP = 'OTP';

      if (
        this.data.healthIDDetailsTxnID !== undefined ||
        this.data.healthIDDetailsTxnID
      ) {
        this.resetValidateForm();
      } else {
        this.getHealthIdOtp();
      }
    }
  }

  resetValidateForm() {
    this.healthIdValidateForm.patchValue({
      validateotp: null,
    });
    this.healthIdSearchForm.patchValue({
      searchHealth: null,
    });
    this.healthIdSearchForm.patchValue({
      modeofhealthID: null,
    });

    this.transactionId = this.data.healthIDDetailsTxnID;
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }
  numberOnly(event: any): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }
  createOtpValidationForm() {
    return this.fb.group({
      validateotp: null,
    });
  }
  createSearchHealthIDForm() {
    return this.fb.group({
      searchHealth: null,
      modeofhealthID: null,
    });
  }
  closeDialog() {
    this.dialogRef.close();
  }

  getHealthIDDetails() {
    const required = [];
    this.searchHealthid =
      this.healthIdSearchForm.controls['searchHealth'].value;
    this.healthIdMode =
      this.healthIdSearchForm.controls['modeofhealthID'].value;
    if (!this.searchHealthid) required.push(this.currentLanguageSet.enterABHA);
    if (!this.healthIdMode)
      required.push(this.currentLanguageSet.aBHAGenerationMode);
    if (required.length) {
      this.confirmationValService.alert(required.toString(), 'info');
    }
    if (this.searchHealthid && this.healthIdMode && this.checkValidHealthID()) {
      this.valhealthId = this.searchHealthid;
      this.getHealthIdOtpForInitial();
    }
  }

  getHealthIdOtpForInitial() {
    this.healthIdValidateForm.patchValue({
      validateotp: null,
    });
    this.healthIdSearchForm.patchValue({
      searchHealth: null,
    });
    this.healthIdSearchForm.patchValue({
      modeofhealthID: null,
    });

    if (this.data.generateHealthIDCard) {
      if (
        this.healthIdMode !== undefined &&
        this.healthIdMode !== null &&
        this.healthIdMode === 'AADHAR'
      ) {
        this.healthIdMode = 'AADHAAR';
        this.showProgressBar = true;
        const reqObj = {
          authMethod: this.healthIdMode + '_OTP',
          healthid: this.valhealthId,
        };
        this.registrarService.generateHealthIDCard(reqObj).subscribe(
          (res: any) => {
            if (res.statusCode === 200 && Object.keys(res.data).length > 0) {
              this.showProgressBar = false;
              this.transactionId = res.data.txnId;
              this.enablehealthIdOTP = 'OTP';
              if (this.healthIdMode === 'MOBILE')
                this.confirmationValService.alert(
                  this.currentLanguageSet.OTPSentToRegMobNo,
                  'success',
                );
              else if (this.healthIdMode === 'AADHAAR')
                this.confirmationValService.alert(
                  this.currentLanguageSet.OTPSentToAadharLinkedNo,
                  'success',
                );
            } else {
              this.showProgressBar = false;
              this.confirmationValService.alert(
                this.currentLanguageSet.issueInGettingBeneficiaryABHADetails,
                'error',
              );
            }
          },
          (err) => {
            this.showProgressBar = false;
            this.confirmationValService.alert(
              this.currentLanguageSet.issueInGettingBeneficiaryABHADetails,
              'error',
            );
          },
        );
      } else if (
        this.healthIdMode !== undefined &&
        this.healthIdMode !== null &&
        this.healthIdMode === 'BIOMETRIC'
      ) {
        const matDialogRef: MatDialogRef<BiometricAuthenticationComponent> =
          this.dialog.open(BiometricAuthenticationComponent, {
            width: '500px',
            height: '320px',
            disableClose: true,
          });
        matDialogRef.afterClosed().subscribe((res: any) => {});
      }
    } else {
      this.showProgressBar = true;
      const reqObj = {
        healthID: this.valhealthId,
        isValidate: true,
        authenticationMode: this.healthIdMode,
      };
      this.registrarService.generateOTPValidateHealthID(reqObj).subscribe(
        (res: any) => {
          if (res.statusCode === 200) {
            this.showProgressBar = false;
            this.enablehealthIdOTP = 'OTP';
            if (this.healthIdMode === 'MOBILE')
              this.confirmationValService.alert(
                this.currentLanguageSet.OTPSentToRegMobNo,
                'success',
              );
            else if (this.healthIdMode === 'AADHAR')
              this.confirmationValService.alert(
                this.currentLanguageSet.OTPSentToAadharLinkedNo,
                'success',
              );

            this.transactionId = res.data.txnId;
          } else {
            this.showProgressBar = false;
            const dat = {
              clearHealthID: true,
            };
            this.dialogRef.close(dat);
            this.confirmationValService.alert(
              this.currentLanguageSet.issueInGettingBeneficiaryABHADetails,
              'error',
            );
          }
        },
        (err) => {
          this.showProgressBar = false;
          this.confirmationValService.alert(
            this.currentLanguageSet.issueInGettingBeneficiaryABHADetails,
            'error',
          );
        },
      );
    }
  }

  isLetter(str: string) {
    return str.length === 1 && str.match(/[a-z]/i);
  }
  is_numeric(str: string) {
    return /^\d+$/.test(str);
  }
  getHealthIdOtp() {
    this.healthIdValidateForm.patchValue({
      validateotp: null,
    });
    this.healthIdSearchForm.patchValue({
      searchHealth: null,
    });
    this.healthIdSearchForm.patchValue({
      modeofhealthID: null,
    });

    if (this.data.generateHealthIDCard) {
      if (
        this.healthIdMode !== undefined &&
        this.healthIdMode !== null &&
        this.healthIdMode === 'AADHAR'
      )
        this.healthIdMode = 'AADHAAR';
      this.showProgressBar = true;
      const reqObj = {
        authMethod: this.healthIdMode + '_OTP',
        healthid: this.valhealthId,
      };
      this.registrarService.generateHealthIDCard(reqObj).subscribe(
        (res: any) => {
          if (res.statusCode === 200 && Object.keys(res.data).length > 0) {
            this.showProgressBar = false;
            this.transactionId = res.data.txnId;

            if (this.healthIdMode === 'MOBILE')
              this.confirmationValService.alert(
                this.currentLanguageSet.OTPSentToRegMobNo,
                'success',
              );
            else if (this.healthIdMode === 'AADHAAR')
              this.confirmationValService.alert(
                this.currentLanguageSet.OTPSentToAadharLinkedNo,
                'success',
              );
          } else {
            this.showProgressBar = false;
            this.confirmationValService.alert(res.status, 'error');
          }
        },
        (err) => {
          this.showProgressBar = false;
          this.confirmationValService.alert(
            this.currentLanguageSet.issueInGettingBeneficiaryABHADetails,
            'error',
          );
        },
      );
    } else {
      this.showProgressBar = true;
      const reqObj = {
        healthID: this.valhealthId,
        isValidate: true,
        authenticationMode: this.healthIdMode,
      };
      this.registrarService.generateOTPValidateHealthID(reqObj).subscribe(
        (res: any) => {
          if (res.statusCode === 200) {
            this.showProgressBar = false;

            if (this.healthIdMode === 'MOBILE')
              this.confirmationValService.alert(
                this.currentLanguageSet.OTPSentToRegMobNo,
                'success',
              );
            else if (this.healthIdMode === 'AADHAR')
              this.confirmationValService.alert(
                this.currentLanguageSet.OTPSentToAadharLinkedNo,
                'success',
              );

            this.transactionId = res.data.txnId;
          } else {
            this.showProgressBar = false;
            const dat = {
              clearHealthID: true,
            };
            this.dialogRef.close(dat);
            this.confirmationValService.alert(res.status, 'error');
          }
        },
        (err) => {
          this.showProgressBar = false;
          this.confirmationValService.alert(
            this.currentLanguageSet.issueInGettingBeneficiaryABHADetails,
            'error',
          );
        },
      );
    }
  }

  checkValidHealthID() {
    const healthidval = this.healthIdSearchForm.controls['searchHealth'].value;
    if (healthidval.length >= 8 && healthidval.length <= 32) {
      if (healthidval.length === 14) {
        const healthIDNumberPatternWithoutHypen = /\d{14}$/;
        return this.validateHealthIDNumberPattern(
          healthIDNumberPatternWithoutHypen,
          healthidval,
        );
      } else if (healthidval.length === 17) {
        const healthIDNumberPatternWithHypen =
          /^(\d{2})-(\d{4})-(\d{4})-(\d{4})*$/;
        return this.validateHealthIDNumberPattern(
          healthIDNumberPatternWithHypen,
          healthidval,
        );
      } else {
        return this.validateHealthIDPattern(healthidval);
      }
    } else {
      this.idErrorText = 'Please Valid Health ID / HealthID Number';
    }
  }
  validateHealthIDNumberPattern(pattern: any, healthidval: any) {
    const checkPattern = pattern.test(healthidval);
    if (checkPattern) {
      return true;
    } else {
      return this.validateHealthIDPattern(healthidval);
    }
  }
  validateHealthIDPattern(healthidval: any) {
    let healthIDPattern;
    if (environment.abhaExtension === '@abdm') {
      healthIDPattern = /^([a-zA-Z0-9])+(\.[a-zA-Z0-9]+)?@([a-zA-Z]{4})$/;
    } else {
      healthIDPattern = /^([a-zA-Z0-9])+(\.[a-zA-Z0-9]+)?@([a-zA-Z]{3})$/;
    }
    const checkPattern = healthIDPattern.test(healthidval);
    if (checkPattern) {
      return true;
    }
  }
  posthealthIDValidationCall() {
    this.showProgressBar = true;
    const reqObjOTP = {
      otp: this.healthIdValidateForm.controls['validateotp'].value,
      txnId: this.transactionId,
      healthId: this.valhealthId,
    };
    this.registrarService.verifyOTPForHealthIDValidation(reqObjOTP).subscribe(
      (res: any) => {
        if (res.statusCode === 200) {
          this.showProgressBar = false;
          this.RequestId = res.data.RequestId;
          if (this.RequestId) {
            this.gender =
              res.data.Auth.Patient.Gender === '0'
                ? 1
                : res.data.Auth.Patient.Gender === '1'
                  ? 2
                  : res.data.Auth.Patient.Gender === '2'
                    ? 3
                    : 3;

            this.firstName =
              res.data.Auth.Patient.Name.split(' ')[0] === undefined
                ? ''
                : res.data.Auth.Patient.Name.split(' ')[0];
            this.lastName =
              res.data.Auth.Patient.Name.split(' ')[1] === undefined
                ? ''
                : res.data.Auth.Patient.Name.split(' ')[1];
            this.userHealthId = res.data.Auth.Patient.Id;
            this.address = res.data.Auth.Patient.Address;
            const dat = {
              healthIdNumber: this.userHealthId,
              RequestId: this.RequestId,
              gender: this.gender,
              firstName: this.firstName,
              lastName: this.lastName,
              healthIdMode: this.healthIdMode,
              address: this.address,
            };
            const dialogRef = this.dialog.open(HealthIdOtpSuccessComponent, {
              height: '460px',
              width: '520px',
              disableClose: true,
              data: res,
            });
            this.dialogRef.close(dat);
          } else {
            this.showProgressBar = false;
            const dat = {
              clearHealthID: true,
            };
            this.dialogRef.close(dat);
            this.confirmationValService.alert(res.data.response, 'error');
          }
        } else {
          this.showProgressBar = false;
          this.confirmationValService.alert(res.status, 'error');
        }
      },
      (err) => {
        this.showProgressBar = false;
        this.confirmationValService.alert(
          this.currentLanguageSet.issueInGettingBeneficiaryABHADetails,
          'error',
        );
      },
    );
  }
  postHealthIDCardCall() {
    this.showProgressBar = true;
    if (this.healthIdMode === 'AADHAR') {
      this.healthIdMode = 'AADHAAR';
    }
    const reqObjOTP = {
      authMethod: this.healthIdMode + '_OTP',
      otp: this.healthIdValidateForm.controls['validateotp'].value,
      txnId: this.transactionId,
    };
    this.registrarService.verifyOTPForHealthIDCard(reqObjOTP).subscribe(
      (res: any) => {
        if (res.statusCode === 200) {
          this.showProgressBar = false;
          this.healthIDCard = res.data.data;
          if (this.healthIDCard !== undefined && this.healthIDCard !== null) {
            this.dialog.open(ViewHealthIdCardComponent, {
              height: '530px',
              width: '800px',
              data: {
                imgBase64: this.healthIDCard,
              },
            });

            this.dialogRef.close();
          } else {
            this.showProgressBar = false;
            this.confirmationValService.alert(
              this.currentLanguageSet.aBHACardNotAvailable,
              'error',
            );
          }
        } else {
          this.showProgressBar = false;
          this.confirmationValService.alert(res.status, 'error');
        }
      },
      (err) => {
        this.showProgressBar = false;
        this.confirmationValService.alert(
          this.currentLanguageSet.issueInGettingBeneficiaryABHADetails,
          'error',
        );
      },
    );
  }
  checkOTP() {
    const otp = this.healthIdValidateForm.controls['validateotp'].value;
    let cflag = false;
    if (otp !== '' && otp !== undefined && otp !== null) {
      const hid = otp;
      if (hid.length >= 4 && hid.length <= 32) {
        for (let i = 0; i < hid.length; i++) {
          if (!this.is_numeric(hid.charAt(i))) {
            cflag = true;
            break;
          }
        }
        if (cflag) return false;
      } else return false;
    } else return false;
    return true;
  }
}
