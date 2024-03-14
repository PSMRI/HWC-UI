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
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../app-modules/core/services';
import { ConfirmationService } from '../app-modules/core/services/confirmation.service';

import { MdDialog, MdDialogRef } from '@angular/material';

import { DataSyncLoginComponent } from '../app-modules/data-sync/data-sync-login/data-sync-login.component';
import { MasterDownloadComponent } from '../app-modules/data-sync/master-download/master-download.component';
import * as bcrypt from 'bcrypt';

@Component({
  selector: 'app-login-cmp',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  key: any;
  iv: any;
  SALT: string = "RandomInitVector";
  Key_IV: string = "Piramal12Piramal";
  encPassword: string;
  _keySize: any;
  _ivSize: any;
  _iterationCount: any;

  userName: any;
  password: any;
  eSanjeevaniArr: any=[];
  dynamictype = 'password';
  @ViewChild('focus') private elementRef: ElementRef;  

  constructor(
    private router: Router,
    private dialog: MdDialog,
    private authService: AuthService,
    private confirmationService: ConfirmationService
  ) {
    this._keySize = 256;
    this._ivSize = 128;
    this._iterationCount = 1989;
}

  ngOnInit() {
    if (sessionStorage.getItem('isAuthenticated')) {
      this.authService.validateSessionKey()
        .subscribe(res => {
          if (res && res.statusCode == 200 && res.data)
            this.router.navigate(['/service']);
        })
    } else {
      sessionStorage.clear();
    }
  }

  public ngAfterViewInit(): void {
    this.elementRef.nativeElement.focus();
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
  
  login() {
    let plainPassword = this.password;
    const saltRounds = 12; 

    bcrypt.hash(plainPassword, saltRounds, (err, hash) => {
      if (err) {
        console.error(err);
        return;
      }
 
      
   this.authService.login(this.userName, hash, false)
      .subscribe(res => {
        if (res.statusCode === 200) {
          if (res.data.previlegeObj && res.data.previlegeObj[0]) {
            localStorage.setItem('loginDataResponse', JSON.stringify(res.data));
            this.getServicesAuthdetails(res.data);

            for(let i=0;i<res.data.previlegeObj[0].roles.length;i++){
                if(res.data.previlegeObj[0].roles[i].RoleName.toLowerCase() === "nurse"){
                this.eSanjeevaniArr = res.data.previlegeObj[0].roles[i].isSanjeevani;
              } 
            }
            this.confirmationService.eSanjeevaniFlagArry=this.eSanjeevaniArr;
          } 
          else {
            this.confirmationService.alert('Seems you are logged in from somewhere else, Logout from there & try back in.', 'error');
          }
        }
         else if (res.statusCode === 5002){
          if(res.errorMessage === 'You are already logged in,please confirm to logout from other device and login again') {
          this.confirmationService.confirm('info', res.errorMessage).subscribe((confirmResponse) => {
            if (confirmResponse){
              this.authService.userLogoutPreviousSession(this.userName).subscribe((logOutFromPreviousSession) => {
                if (logOutFromPreviousSession.statusCode === 200){
              this.authService.login(this.userName, hash, true).subscribe((userLoggedIn) => {
                if (userLoggedIn.statusCode === 200) {
                if (userLoggedIn.data.previlegeObj && userLoggedIn.data.previlegeObj[0] && userLoggedIn.data.previlegeObj != null && userLoggedIn.data.previlegeObj != undefined) {
                  localStorage.setItem('loginDataResponse', JSON.stringify(userLoggedIn.data));
                  this.getServicesAuthdetails(userLoggedIn.data);
                } else {
                  this.confirmationService.alert('Seems you are logged in from somewhere else, Logout from there & try back in.', 'error');
                }
              }
              else {
                this.confirmationService.alert(userLoggedIn.errorMessage, 'error');
              }  
              });
            }
              else {
                this.confirmationService.alert(logOutFromPreviousSession.errorMessage, 'error');
              }
            });
            }
          });
        }}
        else {
          sessionStorage.clear();
          this.router.navigate(["/login"]);
          this.confirmationService.alert(res.errorMessage, 'error');
          
        }
      }
      , err => {
        this.confirmationService.alert(err, 'error');
      });});
  }

  getServicesAuthdetails(loginDataResponse) {
    sessionStorage.setItem('key', loginDataResponse.key);
    sessionStorage.setItem('isAuthenticated', loginDataResponse.isAuthenticated);
    localStorage.setItem('userID', loginDataResponse.userID);
    localStorage.setItem('userName', loginDataResponse.userName);
    localStorage.setItem('username', this.userName);
    localStorage.setItem('fullName', loginDataResponse.fullName);
    localStorage.setItem('roles', loginDataResponse.previlegeObj[0].roles[0].RoleName);
  
    const services = [];
    loginDataResponse.previlegeObj.map(item => {
      if (item.roles[0].serviceRoleScreenMappings[0].providerServiceMapping.serviceID == '9') {
        let service = {
          'providerServiceID': item.serviceID,
          'serviceName': item.serviceName,
          'apimanClientKey': item.apimanClientKey,
          'serviceID': item.roles[0].serviceRoleScreenMappings[0].providerServiceMapping.serviceID
        }
        services.push(service)
      }
    })
    if (services.length > 0) {
      localStorage.setItem('services', JSON.stringify(services));
      if (loginDataResponse.Status.toLowerCase() == 'new') {
        this.router.navigate(['/set-security-questions'])
      }
      else {
        this.router.navigate(['/service']);
      }
    } else {
      this.confirmationService.alert('User doesn\'t have previlege to access the application');
    }
  }

  showPWD() {
    this.dynamictype = 'text';
  }

  hidePWD() {
    this.dynamictype = 'password';
  }

  loginDialogRef: MdDialogRef<DataSyncLoginComponent>;
  openDialog() {
    this.loginDialogRef = this.dialog.open(DataSyncLoginComponent, {
      hasBackdrop: true,
      disableClose: true,
      panelClass: 'fit-screen',
      backdropClass: 'backdrop',
      position: { top: "20px" },
      data: {
        masterDowloadFirstTime: true
      }
    });

    this.loginDialogRef.afterClosed()
      .subscribe(flag => {
        if (flag) {
          this.dialog.open(MasterDownloadComponent, {
            hasBackdrop: true,
            disableClose: true,
            panelClass: 'fit-screen',
            backdropClass: 'backdrop',
            position: { top: "20px" },
          }).afterClosed().subscribe(() => {
            sessionStorage.clear();
            localStorage.clear();
          });
        }
      })
  }
  
}
