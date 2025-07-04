import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SetLanguageComponent } from '../../core/components/set-language.component';
import { ConfirmationService } from '../../core/services';
import { HttpServiceService } from '../../core/services/http-service.service';
import { RegistrationUtils } from '../shared/utility/registration-utility';
import { HealthIdOtpGenerationComponent } from '../health-id-otp-generation/health-id-otp-generation.component';
import { BiometricAuthenticationComponent } from '../biometric-authentication/biometric-authentication.component';
import { RegistrarService } from '../shared/services/registrar.service';

@Component({
  selector: 'app-generate-abha-component',
  templateUrl: './generate-abha-component.component.html',
  styleUrls: ['./generate-abha-component.component.css'],
})
export class GenerateAbhaComponentComponent implements OnInit {
  utils = new RegistrationUtils(this.fb);

  abhaGenerateForm!: FormGroup;
  currentLanguageSet: any;
  modeofAbhaHealthID: any;
  aadharNumber: any;
  disableGenerateOTP!: boolean;

  constructor(
    public dialogRef: MatDialogRef<GenerateAbhaComponentComponent>,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private confirmationValService: ConfirmationService,
    public httpServiceService: HttpServiceService,
    private registrarService: RegistrarService,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.abhaGenerateForm = this.createAbhaGenerateForm();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  closeDialog() {
    this.dialogRef.close();
    this.modeofAbhaHealthID = null;
    this.aadharNumber = null;
  }

  createAbhaGenerateForm() {
    return this.fb.group({
      modeofAbhaHealthID: null,
      aadharNumber: null,
    });
  }

  resetAbhaValidateForm() {
    this.abhaGenerateForm.patchValue({
      aadharNumber: null,
    });
    this.abhaGenerateForm.patchValue({
      modeofAbhaHealthID: null,
    });
  }

  getAbhaValues() {
    this.modeofAbhaHealthID =
      this.abhaGenerateForm.controls['modeofAbhaHealthID'].value;
    this.aadharNumber = this.abhaGenerateForm.controls['aadharNumber'].value;
  }

  generateABHACard() {
    this.dialogRef.close();
    this.modeofAbhaHealthID =
      this.abhaGenerateForm.controls['modeofAbhaHealthID'].value;
    this.aadharNumber = this.abhaGenerateForm.controls['aadharNumber'].value;
    if (this.modeofAbhaHealthID === 'AADHAR') {
      this.generateHealthIDCard();
      this.getOTP();
    } else if (this.modeofAbhaHealthID === 'BIOMETRIC') {
      const mdDialogRef: MatDialogRef<BiometricAuthenticationComponent> =
        this.dialog.open(BiometricAuthenticationComponent, {
          width: '500px',
          height: '320px',
          disableClose: true,
        });
      mdDialogRef.afterClosed().subscribe((res) => {});
    }
  }

  generateHealthIDCard() {
    const id = {
      aadharNumber: this.aadharNumber,
      healthIdMode: this.modeofAbhaHealthID,
    };
    this.registrarService.passIDsToFetchOtp(id);
  }

  getOTP() {
    const dialogRef = this.dialog.open(HealthIdOtpGenerationComponent, {
      height: '250px',
      width: '420px',
      data: {
        aadharNumber: this.aadharNumber,
        healthIdMode: this.modeofAbhaHealthID,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('resultGoldy', result);
      if (result) {
        (<FormGroup>(
          this.abhaGenerateForm.controls['otherDetailsForm']
        )).patchValue({ healthId: result.healthId });
        (<FormGroup>(
          this.abhaGenerateForm.controls['otherDetailsForm']
        )).patchValue({ healthIdNumber: result.healthIdNumber });

        (<FormGroup>(
          this.abhaGenerateForm.controls['otherDetailsForm']
        )).controls['healthId'].disable();
        this.disableGenerateOTP = true;
      }
    });
  }
}
