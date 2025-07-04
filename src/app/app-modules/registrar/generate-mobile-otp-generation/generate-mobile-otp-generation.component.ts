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
  Inject,
  OnChanges,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SetLanguageComponent } from '../../core/components/set-language.component';
import { ConfirmationService } from '../../core/services';
import { HttpServiceService } from '../../core/services/http-service.service';
import { RegistrarService } from '../shared/services/registrar.service';

@Component({
  selector: 'app-generate-mobile-otp-generation',
  templateUrl: './generate-mobile-otp-generation.component.html',
  styleUrls: ['./generate-mobile-otp-generation.component.css'],
})
export class GenerateMobileOtpGenerationComponent implements OnInit, DoCheck {
  generateMobileOTPForm!: FormGroup;
  currentLanguageSet: any;
  showProgressBar = false;
  txnId: any;
  enableMobileOTPForm = false;

  constructor(
    private fb: FormBuilder,
    public dialogSucRef: MatDialogRef<GenerateMobileOtpGenerationComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public httpServiceService: HttpServiceService,
    private registrarService: RegistrarService,
    private confirmationService: ConfirmationService,
  ) {
    dialogSucRef.disableClose = true;
  }

  ngOnInit() {
    this.assignSelectedLanguage();
    this.txnId = this.data.transactionId;
    this.generateMobileOTPForm = this.createmobileOTPValidationForm();
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  createmobileOTPValidationForm() {
    return this.fb.group({
      mobileNo: null,
      mobileOtp: null,
    });
  }

  closeDialog() {
    this.dialogSucRef.close();
  }

  //while clicking on submit after entering the mobile number
  onSubmitOfMobileNo() {
    if (this.enableMobileOTPForm === false) {
      this.showProgressBar = true;
      const reqObj = {
        mobile: this.generateMobileOTPForm.controls['mobileNo'].value,
        txnId: this.txnId,
      };
      this.registrarService.checkAndGenerateMobileOTPHealthId(reqObj).subscribe(
        (res: any) => {
          if (res.statusCode === 200 && res.data) {
            this.showProgressBar = false;
            if (
              res.data.mobileLinked === false ||
              res.data.mobileLinked === 'false'
            ) {
              this.confirmationService
                .confirm('info', this.currentLanguageSet.enterOTPToVerify)
                .subscribe((responseData) => {
                  if (responseData === false) {
                    this.enableMobileOTPForm = false;
                  } else {
                    this.enableMobileOTPForm = true;
                  }
                });
            } else {
              this.dialogSucRef.close(res.data);
            }
          } else {
            this.showProgressBar = false;
            this.confirmationService.alert(res.errorMessage, 'error');
          }
        },
        (err: any) => {
          this.showProgressBar = false;
          this.confirmationService.alert(
            this.currentLanguageSet.issueInGettingBeneficiaryABHADetails,
            'error',
          );
        },
      );
    }
  }

  resendOTP() {
    this.showProgressBar = true;
    const reqObj = {
      mobile: this.generateMobileOTPForm.controls['mobileNo'].value,
      txnId: this.txnId,
    };
    this.registrarService.checkAndGenerateMobileOTPHealthId(reqObj).subscribe(
      (res: any) => {
        if (res.statusCode === 200 && res.data) {
          this.showProgressBar = false;
        } else {
          this.showProgressBar = false;
          this.confirmationService.alert(res.errorMessage, 'error');
        }
      },
      (err: any) => {
        this.showProgressBar = false;
        this.confirmationService.alert(
          this.currentLanguageSet.issueInGettingBeneficiaryABHADetails,
          'error',
        );
      },
    );
  }

  //entering OTP for mobile verification
  verifyMobileOtp() {
    if (this.enableMobileOTPForm === true) {
      let reqObj = null;
      reqObj = {
        otp: this.generateMobileOTPForm.controls['mobileOtp'].value,
        txnId: this.txnId,
      };
      this.registrarService
        .verifyMobileOTPForAadhar(reqObj)
        .subscribe((res: any) => {
          if (res.statusCode === 200) {
            this.dialogSucRef.close(res.data);
          } else {
            this.confirmationService.alert(res.errorMessage, 'error');
          }
        });
    }
  }

  numberOnly(event: any): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }
}
