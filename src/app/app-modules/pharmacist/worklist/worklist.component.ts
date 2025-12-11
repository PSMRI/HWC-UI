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
  OnDestroy,
  ViewChild,
  DoCheck,
} from '@angular/core';
import { Router } from '@angular/router';
import { BeneficiaryDetailsService } from '../../core/services/beneficiary-details.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { PharmacistService } from '../shared/services/pharmacist.service';
import { CameraService } from '../../core/services/camera.service';
import { InventoryService } from '../../core/services/inventory.service';
import * as moment from 'moment';
import { SetLanguageComponent } from '../../core/components/set-language.component';
import { HttpServiceService } from '../../core/services/http-service.service';
import { RegistrarService } from '../../registrar/shared/services/registrar.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-worklist',
  templateUrl: './worklist.component.html',
  styleUrls: ['./worklist.component.css'],
})
export class WorklistComponent implements OnInit, OnDestroy, DoCheck {
  rowsPerPage = 5;
  activePage = 1;
  pagedList: any = [];
  rotate = true;
  beneficiaryList: any;
  filteredBeneficiaryList: any = [];
  blankTable = [1, 2, 3, 4, 5];
  filterTerm: any;
  current_language_set: any;
  currentPage!: number;
  benDetails: any;
  healthIDArray: any = [];
  healthIDValue = '';
  languageComponent!: SetLanguageComponent;
  displayedColumns: any = [
    'sno',
    'beneficiaryID',
    'beneficiaryName',
    'gender',
    'age',
    'visitCategory',
    'district',
    'phoneNo',
    'visitDate',
    'image',
  ];
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
  dataSource = new MatTableDataSource<any>();

  constructor(
    private confirmationService: ConfirmationService,
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    private pharmacistService: PharmacistService,
    private cameraService: CameraService,
    public httpServiceService: HttpServiceService,
    private inventoryService: InventoryService,
    private registrarService: RegistrarService,
    readonly sessionstorage: SessionStorageService,
  ) {}

  ngOnInit() {
    this.sessionstorage.setItem('currentRole', 'Pharmacist');
    this.removeBeneficiaryDataForVisit();
    this.loadPharmaWorklist();
    this.beneficiaryDetailsService.reset();
    this.assignSelectedLanguage();
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    this.languageComponent = new SetLanguageComponent(this.httpServiceService);
    this.languageComponent.setLanguage();
    this.current_language_set = this.languageComponent.currentLanguageObject;
  }

  removeBeneficiaryDataForVisit() {
    this.sessionstorage.removeItem('visitCode');
    this.sessionstorage.removeItem('beneficiaryGender');
    this.sessionstorage.removeItem('benFlowID');
    this.sessionstorage.removeItem('visitCategory');
    this.sessionstorage.removeItem('visitReason');
    this.sessionstorage.removeItem('beneficiaryRegID');
    this.sessionstorage.removeItem('visitID');
    this.sessionstorage.removeItem('beneficiaryID');
    this.sessionstorage.removeItem('doctorFlag');
    this.sessionstorage.removeItem('nurseFlag');
    this.sessionstorage.removeItem('pharmacist_flag');
  }

  ngOnDestroy() {
    this.sessionstorage.removeItem('currentRole');
  }

  loadPharmaWorklist() {
    this.pharmacistService.getPharmacistWorklist().subscribe(
      (data: any) => {
        if (data && data.statusCode === 200 && data.data) {
          console.log('pharmacist worklist', data.data);

          const benlist = this.loadDataToBenList(data.data);
          this.beneficiaryList = benlist;
          this.filteredBeneficiaryList = benlist;
          this.dataSource.data = [];
          this.dataSource.data = benlist;
          this.dataSource.paginator = this.paginator;
          this.dataSource.data.forEach((sectionCount: any, index: number) => {
            sectionCount.sno = index + 1;
          });
          this.filterTerm = null;
          console.log(
            'this.filteredBeneficiaryList',
            this.filteredBeneficiaryList,
          );
        } else {
          this.confirmationService.alert(data.errorMessage, 'error');
          this.dataSource.data = [];
          this.dataSource.paginator = this.paginator;
        }
      },
      (err) => {
        if (err?.handled) {
          return;
        }
        this.confirmationService.alert(err, 'error');
      },
    );
  }
  pageChanged(event: any): void {
    console.log('called', event);
    const startItem = (event.page - 1) * event.itemsPerPage;
    const endItem = event.page * event.itemsPerPage;
    this.pagedList = this.filteredBeneficiaryList.slice(startItem, endItem);
    console.log('list', this.pagedList);
  }
  loadDataToBenList(data: any) {
    data.forEach((element: any) => {
      element.genderName = element.genderName || 'Not Available';
      element.age = element.age || 'Not Available';
      element.statusMessage = element.statusMessage || 'Not Available';
      element.VisitCategory = element.VisitCategory || 'Not Available';
      element.benVisitNo = element.benVisitNo || 'Not Available';
      element.districtName = element.districtName || 'Not Available';
      element.villageName = element.villageName || 'Not Available';
      element.preferredPhoneNum = element.preferredPhoneNum || 'Not Available';
      element.visitDate =
        moment(element.visitDate).format('DD-MM-YYYY HH:mm A ') ||
        'Not Available';
      element.benVisitDate =
        moment(element.benVisitDate).format('DD-MM-YYYY HH:mm A ') ||
        'Not Available';
    });
    return data;
  }

  filterBeneficiaryList(searchTerm: string) {
    if (!searchTerm) this.filteredBeneficiaryList = this.beneficiaryList;
    else {
      this.filteredBeneficiaryList = [];
      this.dataSource.data = [];
      this.dataSource.paginator = this.paginator;
      this.beneficiaryList.forEach((item: any) => {
        for (const key in item) {
          if (
            key === 'beneficiaryID' ||
            key === 'benName' ||
            key === 'genderName' ||
            key === 'age' ||
            key === 'VisitCategory' ||
            key === 'benVisitNo' ||
            key === 'districtName' ||
            key === 'preferredPhoneNum' ||
            key === 'villageName' ||
            key === 'beneficiaryRegID' ||
            key === 'visitDate'
          ) {
            const value: string = '' + item[key];
            if (value.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0) {
              this.filteredBeneficiaryList.push(item);
              this.dataSource.data.push(item);
              this.dataSource.paginator = this.paginator;
              this.dataSource.data.forEach(
                (sectionCount: any, index: number) => {
                  sectionCount.sno = index + 1;
                },
              );
              break;
            }
          }
        }
      });
    }
  }

  patientImageView(benregID: any) {
    if (
      benregID &&
      benregID !== null &&
      benregID !== '' &&
      benregID !== undefined
    ) {
      this.beneficiaryDetailsService
        .getBeneficiaryImage(benregID)
        .subscribe((data: any) => {
          if (data && data.benImage) {
            this.cameraService.viewImage(data.benImage);
          } else {
            this.confirmationService.alert(
              this.current_language_set.alerts.info.imageNotFound,
            );
          }
        });
    }
  }

  loadPharmaPage(beneficiary: any) {
    console.log(beneficiary);
    const data = {
      beneficiaryRegID: beneficiary.beneficiaryRegID,
      beneficiaryID: null,
    };
    this.registrarService.getHealthIdDetails(data).subscribe(
      (healthIDDetails: any) => {
        if (healthIDDetails.statusCode === 200) {
          console.log('healthID', healthIDDetails);
          if (
            healthIDDetails.data.BenHealthDetails !== undefined &&
            healthIDDetails.data.BenHealthDetails !== null
          ) {
            this.benDetails = healthIDDetails.data.BenHealthDetails;
            if (this.benDetails.length > 0) {
              this.benDetails.forEach((healthID: any, index: any) => {
                if (
                  healthID.healthId !== undefined &&
                  healthID.healthId !== null &&
                  index !== this.benDetails.length - 1
                )
                  this.healthIDArray.push(healthID.healthId + ',');
                else if (
                  healthID.healthId !== undefined &&
                  healthID.healthId !== null
                )
                  this.healthIDArray.push(healthID.healthId);
                if (
                  healthID.healthId !== undefined &&
                  healthID.healthId !== null
                )
                  this.healthIDValue =
                    this.healthIDValue + healthID.healthId + ',';
              });
            }
            if (
              this.healthIDValue !== undefined &&
              this.healthIDValue !== null &&
              this.healthIDValue.length > 1
            ) {
              this.healthIDValue = this.healthIDValue.substring(
                0,
                this.healthIDValue.length - 1,
              );
            }
          }
        } else {
          this.confirmationService.alert(
            this.current_language_set.issueInGettingBeneficiaryABHADetails,
            'error',
          );
        }
      },
      (err) => {
        this.confirmationService.alert(
          this.current_language_set.issueInGettingBeneficiaryABHADetails,
          'error',
        );
      },
    );
    setTimeout(() => this.redirectToDispenseScreen(beneficiary), 500);
  }
  redirectToDispenseScreen(beneficiary: any) {
    this.confirmationService
      .confirm(
        `info`,
        this.current_language_set.alerts.info.confirmtoProceedFurther,
      )
      .subscribe((result) => {
        if (result) {
          this.inventoryService.moveToInventory(
            beneficiary.beneficiaryID,
            beneficiary.visitCode,
            beneficiary.benFlowID,
            beneficiary.beneficiaryRegID,
            sessionStorage.getItem('setLanguage') !== undefined
              ? sessionStorage.getItem('setLanguage')
              : 'English',
            this.healthIDValue,
          );
        }
      });
  }
}
