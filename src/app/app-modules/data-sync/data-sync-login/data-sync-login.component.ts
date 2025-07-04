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

import { Component, OnInit, Injector, DoCheck } from '@angular/core';
import { Router } from '@angular/router';

import * as CryptoJS from 'crypto-js';
import { FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SetLanguageComponent } from '../../core/components/set-language.component';
import { ConfirmationService } from '../../core/services';
import { HttpServiceService } from '../../core/services/http-service.service';
import { DataSyncService } from '../shared/service/data-sync.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-data-sync-login',
  templateUrl: './data-sync-login.component.html',
  styleUrls: ['./data-sync-login.component.css'],
  providers: [DataSyncService],
})
export class DataSyncLoginComponent implements OnInit, DoCheck {
  userName: any;
  password: any;

  dynamictype = 'password';
  dialogRef: any;
  data: any;
  showProgressBar = false;
  current_language_set: any;
  encryptedVar: any;
  key: any;
  iv: any;
  SALT = 'RandomInitVector';
  Key_IV = 'Piramal12Piramal';
  encPassword: any;
  _keySize: any;
  _ivSize: any;
  _iterationCount: any;

  constructor(
    private router: Router,
    private dataSyncService: DataSyncService,
    private injector: Injector,
    public httpServiceService: HttpServiceService,
    private confirmationService: ConfirmationService,
    private fb: FormBuilder,
    readonly sessionstorage: SessionStorageService,
  ) {
    this._keySize = 256;
    this._ivSize = 128;
    this._iterationCount = 1989;
  }

  loginForm = this.fb.group({
    userName: [''],
    password: [''],
  });

  ngOnInit() {
    this.assignSelectedLanguage();
    this.dialogRef = this.injector.get(MatDialogRef, null);
    this.data = this.injector.get(MAT_DIALOG_DATA, null);
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }

  showPWD() {
    this.dynamictype = 'text';
  }

  hidePWD() {
    this.dynamictype = 'password';
  }

  get keySize() {
    return this._keySize;
  }

  set keySize(value) {
    this._keySize = value;
  }

  get iterationCount() {
    return this._iterationCount;
  }

  set iterationCount(value) {
    this._iterationCount = value;
  }

  generateKey(salt: any, passPhrase: any) {
    return CryptoJS.PBKDF2(passPhrase, CryptoJS.enc.Hex.parse(salt), {
      hasher: CryptoJS.algo.SHA512,
      keySize: this.keySize / 32,
      iterations: this._iterationCount,
    });
  }

  encryptWithIvSalt(salt: any, iv: any, passPhrase: any, plainText: any) {
    const key = this.generateKey(salt, passPhrase);
    const encrypted = CryptoJS.AES.encrypt(plainText, key, {
      iv: CryptoJS.enc.Hex.parse(iv),
    });
    return encrypted.ciphertext.toString(CryptoJS.enc.Base64);
  }

  encrypt(passPhrase: any, plainText: any) {
    const iv = CryptoJS.lib.WordArray.random(this._ivSize / 8).toString(
      CryptoJS.enc.Hex,
    );
    const salt = CryptoJS.lib.WordArray.random(this.keySize / 8).toString(
      CryptoJS.enc.Hex,
    );
    const ciphertext = this.encryptWithIvSalt(salt, iv, passPhrase, plainText);
    return salt + iv + ciphertext;
  }

  /*ADID: KA40094929 Karyamsetty Helen Grace 
   added a concurrent login changes
  */
  dataSyncLogin() {
    this.showProgressBar = true;
    const encriptPassword = this.encrypt(this.Key_IV, this.password);

    if (this.userName && this.password) {
      this.dataSyncService
        .dataSyncLogin(this.userName, encriptPassword, false)
        .subscribe(
          (res: any) => {
            if (res.statusCode === 200) {
              if (res.data && res.data !== null && res.data !== undefined) {
                const mmuService = res.data.previlegeObj.filter((item: any) => {
                  return item.serviceName === 'MMU';
                });
                if (
                  mmuService !== undefined &&
                  mmuService !== null &&
                  mmuService.length > 0
                ) {
                  this.showProgressBar = false;
                  this.sessionstorage.setItem('serverKey', res.data.key);
                  this.getDataSyncMMU(res);
                } else {
                  this.showProgressBar = false;
                  this.sessionstorage.removeItem('serverKey');
                  this.confirmationService.alert(
                    "User doesn't have previlege to perform this activity. Please contact administrator.",
                  );
                }
              } else {
                this.confirmationService.alert(
                  'Seems you are logged in from somewhere else, Logout from there & try back in.',
                  'error',
                );
              }
            }
          },
          (err: any) => {
            this.confirmationService.alert(err.errorMessage, 'error');
            this.showProgressBar = false;
          },
        );
    } else {
      this.confirmationService.alert(
        this.current_language_set.alerts.info.usernamenPass,
      );
      this.showProgressBar = false;
    }
  }

  //added get datasync data on login to a new method
  getDataSyncMMU(res: any) {
    if (
      this.data?.masterDowloadFirstTime ||
      this.data?.provideAuthorizationToViewTmCS
    ) {
      const mmuService = res.data.previlegeObj.filter((item: any) => {
        return item.serviceName === 'MMU';
      });
      this.sessionstorage.setItem(
        'dataSyncProviderServiceMapID',
        mmuService[0].providerServiceMapID,
      );
      if (this.data.provideAuthorizationToViewTmCS) {
        sessionStorage.setItem('authorizeToViewTMcasesheet', 'Authorized');
      } else {
        console.log('normal flow');
      }
      this.dialogRef.close(true);
    } else {
      this.showProgressBar = false;
      sessionStorage.setItem('authorizeToViewTMcasesheet', 'NotAuthorized');
      this.router.navigate(['/datasync/workarea']);
    }
  }

  closeDialog() {
    sessionStorage.setItem('authorizeToViewTMcasesheet', 'NotAuthorized');
    this.dialogRef.close(false);
  }
}
