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
import { FormBuilder, FormGroup, FormControl, FormArray } from '@angular/forms';
import {
  MasterdataService,
  NurseService,
  DoctorService,
} from '../../shared/services';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';

@Component({
  selector: 'app-travel-history',
  templateUrl: './travel-history.component.html',
  styleUrls: ['./travel-history.component.css'],
})
export class TravelHistoryComponent
  implements OnChanges, OnInit, DoCheck, OnDestroy
{
  @Input()
  patientCovidForm!: FormGroup;
  @Input()
  mode!: string;
  arr = [];
  travelTypeList: string[] = ['Domestic', 'International'];
  domestictype: any = [];
  internationaltype: any = [];
  disableTravelButton = true;
  travelSelected = false;
  question1!: string;
  istravelStatus = false;
  istravelModeDomestic = false;
  istravelModeInternatinal = false;
  countries: any = [];
  citiesFromInter: any = [];
  citiesToInter: any = [];
  stateID: any;
  states: any = [];
  districtsFromDom: any = [];
  districtsToDom: any = [];
  subDistrictsFromDom: any = [];
  subDistrictsToDom: any = [];
  villages: any = [];
  village: any;
  suspectedstat: any;
  recommendationText: any;
  suspectedCovid!: string;
  answer1: any;
  answer2: any;
  allSymp: any;
  travelReqiured!: string;
  recommendationMaster: any;
  recommendationTemporarayList: any = [];
  recommendationStatus: any;
  recomArray: any;
  statesAPI: any;
  readTravel: any = false;
  domtravel = false;
  intertravel = false;
  readTravel1 = false;
  currentLanguageSet: any;

  constructor(
    private masterdataService: MasterdataService,
    public httpServiceService: HttpServiceService,
    private nurseService: NurseService,
    private doctorService: DoctorService,
    private fb: FormBuilder,
    readonly sessionstorage: SessionStorageService,
  ) {
    this.masterdataService.listen().subscribe((m: any) => {
      console.log(m);
      this.onFilterClick(m);
    });
    this.httpServiceService.listen().subscribe((m: any) => {
      console.log(m);
      this.contactFilterClick(m);
    });
  }
  ngOnInit() {
    this.assignSelectedLanguage();
    this.getNurseMasterData();
    this.domestictype = ['Bus', 'Flight', 'Train', 'Ship'];
    this.internationaltype = ['Flight', 'Ship'];
    this.getStateNames();
    this.getCountryNames();
  }
  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }
  ngOnChanges() {
    if (this.mode?.toLowerCase() === 'view') {
      this.readTravel = true;
      const visitID = this.sessionstorage.getItem('visitID');
      const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
      this.getHistoryDetails(benRegID, visitID);
    }

    const specialistFlagString = this.sessionstorage.getItem('specialistFlag');

    if (
      specialistFlagString !== null &&
      parseInt(specialistFlagString) === 100
    ) {
      this.readTravel = true;
      this.readTravel1 = true;
      const visitID = this.sessionstorage.getItem('visitID');
      const benRegID = this.sessionstorage.getItem('beneficiaryRegID');
      this.getHistoryDetails(benRegID, visitID);
    }
  }
  ngOnDestroy() {
    if (this.covidHistory) this.covidHistory.unsubscribe();

    if (this.nurseMasterDataSubscription)
      this.nurseMasterDataSubscription.unsubscribe();
  }
  covidHistory: any;
  covidHistoryDetails: any;
  getHistoryDetails(beneficiaryRegID: any, visitID: any) {
    this.covidHistory = this.doctorService
      .getVisitComplaintDetails(beneficiaryRegID, visitID)
      .subscribe((value: any) => {
        if (
          value &&
          value.statusCode === 200 &&
          value.data &&
          value.data.covidDetails
        ) {
          this.covidHistoryDetails = value.data.covidDetails;
          if (value.data.covidDetails.suspectedStatus) {
            this.patientCovidForm.patchValue({ suspectedStatusUI: 'YES' });
          } else {
            this.patientCovidForm.patchValue({ suspectedStatusUI: 'NO' });
          }
          this.recommendationStatus = value.data.covidDetails.recommendation;
          this.recomArray = this.recommendationStatus.shift();
          console.log('RecomA' + this.recomArray);
          const testtravelarr = this.recomArray.join('\n');
          this.recommendationText = testtravelarr;
          console.log('Recom' + this.recommendationText);
          console.log('TravelStatus' + this.covidHistoryDetails.travelStatus);
          if (this.covidHistoryDetails.travelStatus === true) {
            this.patientCovidForm.patchValue({ travelStatus: 'true' });
          } else {
            this.patientCovidForm.patchValue({ travelStatus: 'false' });
          }
          const specialistFlagString =
            this.sessionstorage.getItem('specialistFlag');

          if (
            specialistFlagString !== null &&
            parseInt(specialistFlagString) === 100
          ) {
            this.travelStatuschange(
              this.patientCovidForm.controls['travelStatus'].value,
            );
          }

          if (value.data.covidDetails.travelList.length >= 0) {
            this.istravelStatus = true;
          }

          this.travelListStatus();
          if (
            value.data.covidDetails.travelList[0] === 'Domestic' ||
            value.data.covidDetails.travelList[1] === 'Domestic'
          ) {
            this.istravelModeDomestic = true;
            this.domtravel = true;
            this.patientCovidForm.patchValue({
              modeOfTravelDomestic:
                value.data.covidDetails.modeOfTravelDomestic,
            });
            this.patientCovidForm.patchValue({
              fromStateDom: value.data.covidDetails.fromStateDom,
            });

            this.GetDistrictsFromDom(value.data.covidDetails.fromStateDom);
            this.patientCovidForm.patchValue({
              fromDistrictDom: value.data.covidDetails.fromDistrictDom,
            });
            this.GetSubDistrictFromDom(value.data.covidDetails.fromDistrictDom);
            this.patientCovidForm.patchValue({
              fromSubDistrictDom: value.data.covidDetails.fromSubDistrictDom,
            });
            this.patientCovidForm.patchValue({
              toStateDom: value.data.covidDetails.toStateDom,
            });
            this.GetDistrictsToDom(value.data.covidDetails.toStateDom);
            this.patientCovidForm.patchValue({
              toDistrictDom: value.data.covidDetails.toDistrictDom,
            });
            this.getSubDistrictToDom(value.data.covidDetails.toDistrictDom);
            this.patientCovidForm.patchValue({
              toSubDistrictDom: value.data.covidDetails.toSubDistrictDom,
            });
          }
          if (
            value.data.covidDetails.travelList[0] === 'International' ||
            value.data.covidDetails.travelList[1] === 'International'
          ) {
            this.istravelModeInternatinal = true;
            this.intertravel = true;
            this.patientCovidForm.patchValue({
              modeOfTravelInter: value.data.covidDetails.modeOfTravelInter,
            });
            this.patientCovidForm.patchValue({
              fromCountryInter: value.data.covidDetails.fromCountryInter,
            });
            this.getCitiesFromInter(value.data.covidDetails.fromCountryInter);
            this.patientCovidForm.patchValue({
              fromCityInter: value.data.covidDetails.fromCityInter,
            });
            this.patientCovidForm.patchValue({
              toCountryInter: value.data.covidDetails.toCountryInter,
            });
            this.getCitiesToInter(value.data.covidDetails.toCountryInter);
            this.patientCovidForm.patchValue({
              toCityInter: value.data.covidDetails.toCityInter,
            });
          }
        }
      });
  }

  formArray: any;
  travelListStatus() {
    this.formArray = this.patientCovidForm.controls['travelList'] as FormArray;
    if (this.covidHistoryDetails) {
      const temparray = this.covidHistoryDetails.travelList;
      for (let i = 0; i < temparray.length; i++) {
        this.onChange(temparray[i], true);
      }
    }
  }
  countryAPI: any;
  getCountryNames() {
    this.countryAPI = this.nurseService
      .getCountryName()
      .subscribe((response: any) => {
        if (response.statusCode === 200 && response.data !== null) {
          console.log(response.data[123]);

          this.countries = response.data;
        }
      });
  }
  getStateNames() {
    this.statesAPI = this.nurseService
      .getStateName(1)
      .subscribe((response: any) => {
        if (response.statusCode === 200 && response.data !== null) {
          console.log('stateResponse', response.data);
          this.states = response.data;
        }
      });
  }

  nurseMasterDataSubscription: any;
  getNurseMasterData() {
    this.nurseMasterDataSubscription =
      this.masterdataService.nurseMasterData$.subscribe((data) => {
        if (data && data.covidRecommendationMaster) {
          this.recommendationMaster = data.covidRecommendationMaster.slice();
          this.recommendationTemporarayList[0] =
            this.recommendationMaster.slice();
        }
        console.log('recommendationMaster' + this.recommendationMaster);
        console.log(
          'recommendationTemporarayList' + this.recommendationTemporarayList,
        );
      });
  }

  onFilterClick(symp: any) {
    console.log('Symptom Travel' + symp);
    this.getrecommendedtext();
  }
  contactFilterClick(cont: any) {
    console.log('Contact Travel' + cont);
    this.getrecommendedtext();
  }
  travelStatuschange(boolean_flag: any) {
    const specialistFlagString = this.sessionstorage.getItem('specialistFlag');

    if (
      specialistFlagString !== null &&
      parseInt(specialistFlagString) === 100
    ) {
      this.domtravel = false;
      this.intertravel = false;
    }
    this.sessionstorage.setItem('travelstat', boolean_flag);
    this.patientCovidForm.patchValue({ travelStatus: boolean_flag });
    this.disableTravelButton = false;
    this.travelSelected = true;
    if (boolean_flag === 'true') {
      this.question1 = 'yes';
      this.istravelStatus = true;
      this.getrecommendedtext();
    } else {
      this.question1 = 'no';
      this.istravelStatus = false;
      this.istravelModeInternatinal = false;
      this.istravelModeDomestic = false;
      const travelFormArray = <FormArray>(
        this.patientCovidForm.controls['travelList']
      );
      const i = 0;
      while (i < travelFormArray.length) travelFormArray.removeAt(i);

      this.domesticReset();
      this.interReset();
      this.getrecommendedtext();
    }
  }
  getrecommendedtext() {
    this.arr = [];
    const recomFormArray = <FormArray>(
      this.patientCovidForm.controls['recommendation']
    );
    this.allSymp = this.sessionstorage.getItem('allSymptom');
    if (this.allSymp === 'true') {
      this.travelReqiured = 'false';
    } else {
      this.travelReqiured = 'true';
    }
    this.answer1 = this.sessionstorage.getItem('symptom');
    this.answer2 = this.sessionstorage.getItem('contact');

    console.log('answer1==', this.answer1);
    console.log('answer2==', this.answer2);
    console.log('answer3==', this.question1);

    if (
      (this.question1 === 'yes' &&
        this.answer1 === 'true' &&
        this.answer2 === 'true') ||
      (this.question1 === 'yes' &&
        this.answer1 === 'true' &&
        this.answer2 === 'false') ||
      (this.question1 === 'no' &&
        this.answer1 === 'true' &&
        this.answer2 === 'true')
    ) {
      this.patientCovidForm.patchValue({ suspectedStatusUI: 'YES' });

      this.arr = this.recommendationMaster.filter((item: any) => {
        if (
          item.CovidrecommendationID === 1 ||
          item.CovidrecommendationID === 2 ||
          item.CovidrecommendationID === 3 ||
          item.CovidrecommendationID === 4 ||
          item.CovidrecommendationID === 5
        )
          return item.recommendation;
      });
    } else if (
      (this.question1 === 'no' &&
        this.answer1 === 'false' &&
        this.answer2 === 'true') ||
      (this.question1 === 'yes' &&
        this.answer1 === 'false' &&
        this.answer2 === 'true')
    ) {
      this.patientCovidForm.patchValue({ suspectedStatusUI: 'YES' });

      this.arr = this.recommendationMaster.filter((item: any) => {
        return (
          item.CovidrecommendationID === 6 ||
          item.CovidrecommendationID === 7 ||
          item.CovidrecommendationID === 8 ||
          item.CovidrecommendationID === 9 ||
          item.CovidrecommendationID === 10 ||
          item.CovidrecommendationID === 11
        );
      });
    } else if (
      this.question1 === 'yes' &&
      this.answer1 === 'false' &&
      this.answer2 === 'false'
    ) {
      this.patientCovidForm.patchValue({ suspectedStatusUI: 'YES' });

      this.arr = this.recommendationMaster.filter((item: any) => {
        return (
          item.CovidrecommendationID === 11 ||
          item.CovidrecommendationID === 12 ||
          item.CovidrecommendationID === 13
        );
      });
    } else if (
      this.question1 === 'no' &&
      this.answer1 === 'true' &&
      this.answer2 === 'false'
    ) {
      this.patientCovidForm.patchValue({ suspectedStatusUI: 'NO' });

      this.arr = this.recommendationMaster.filter((item: any) => {
        return (
          item.CovidrecommendationID === 14 || item.CovidrecommendationID === 5
        );
      });
    } else if (
      this.question1 === 'no' &&
      this.answer1 === 'false' &&
      this.answer2 === 'false'
    ) {
      this.patientCovidForm.patchValue({ suspectedStatusUI: 'NO' });
      this.arr = this.recommendationMaster.filter((item: any) => {
        return (
          item.CovidrecommendationID === 15 || item.CovidrecommendationID === 11
        );
      });
    } else if (this.allSymp === 'true') {
      this.patientCovidForm.patchValue({ suspectedStatusUI: 'YES' });
      this.arr = this.recommendationMaster.filter((item: any) => {
        return (
          item.CovidrecommendationID === 1 ||
          item.CovidrecommendationID === 2 ||
          item.CovidrecommendationID === 3 ||
          item.CovidrecommendationID === 4 ||
          item.CovidrecommendationID === 5
        );
      });
    } else {
      this.arr = [];
      this.patientCovidForm.patchValue({ suspectedStatusUI: null });
      this.recommendationText = null;
      const i = 0;
      while (i < recomFormArray.length) recomFormArray.removeAt(i);
    }

    if (this.arr.length > 0) {
      const i = 0;
      while (i < recomFormArray.length) recomFormArray.removeAt(i);
      const selectedRecom = this.arr.map(
        ({ recommendation }) => recommendation,
      );
      recomFormArray.push(new FormControl(selectedRecom));
      const travelarr = selectedRecom.join('\n');
      this.recommendationText = travelarr;
    }
  }
  traveldomesticStatuschange(modeOfTravelDomestic: any) {
    this.patientCovidForm.patchValue({
      modeOfTravelDomestic: modeOfTravelDomestic,
    });
  }

  CitiesFromInter(fromCityInter: any) {
    this.patientCovidForm.patchValue({ fromCityInter: fromCityInter });
  }
  citiesAPI: any;
  getCitiesFromInter(countryID: any) {
    this.patientCovidForm.patchValue({ fromCountryInter: countryID });
    this.citiesAPI = this.nurseService
      .getCityName(countryID)
      .subscribe((response: any) => {
        if (response.statusCode === 200 && response.data !== null) {
          console.log('fromcities', response.data);

          this.citiesFromInter = response.data;
        }
      });
  }
  getAllCitySuccessHandelerFromInter(response: any) {
    this.citiesFromInter = response;
  }
  citiesAPITo: any;
  getCitiesToInter(countryID: any) {
    this.patientCovidForm.patchValue({ toCountryInter: countryID });
    this.citiesAPITo = this.nurseService
      .getCityName(countryID)
      .subscribe((response: any) => {
        if (response.statusCode === 200 && response.data !== null) {
          console.log(response.data);

          this.citiesToInter = response.data;
        }
      });
  }
  getAllCitySuccessHandelerToInter(response: any) {
    this.citiesToInter = response;
  }
  CitiesToInter(toCityInter: any) {
    this.patientCovidForm.patchValue({ toCityInter: toCityInter });
  }
  getAllStatesSuccessHandeler(response: any) {
    this.states = response;
  }
  districtAPIFrom: any;
  GetDistrictsFromDom(stateID: any) {
    this.patientCovidForm.patchValue({ fromStateDom: stateID });
    this.districtAPIFrom = this.nurseService
      .getDistrictName(stateID)
      .subscribe((response: any) => {
        if (response.statusCode === 200 && response.data !== null) {
          console.log('districtdata', response.data);

          this.districtsFromDom = response.data;
        }
      });
  }
  districtAPITo: any;
  GetDistrictsToDom(stateID: any) {
    this.patientCovidForm.patchValue({ toStateDom: stateID });
    this.districtAPITo = this.nurseService
      .getDistrictName(stateID)
      .subscribe((response: any) => {
        if (response.statusCode === 200 && response.data !== null) {
          console.log('districtdata', response.data);

          this.districtsToDom = response.data;
        }
      });
  }
  SetDistrictsFromDom(response: any) {
    this.districtsFromDom = response;
  }
  SetDistrictsTomDom(response: any) {
    this.districtsToDom = response;
  }
  subDistrictAPIFrom: any;
  GetSubDistrictFromDom(distID: any) {
    this.patientCovidForm.patchValue({ fromDistrictDom: distID });
    this.subDistrictAPIFrom = this.nurseService
      .getSubDistrictName(distID)
      .subscribe((response: any) => {
        if (response.statusCode === 200 && response.data !== null) {
          this.subDistrictsFromDom = response.data;
        }
      });
  }
  subDistrictAPITo: any;
  getSubDistrictToDom(districtID: any) {
    this.patientCovidForm.patchValue({ toDistrictDom: districtID });
    this.subDistrictAPITo = this.nurseService
      .getSubDistrictName(districtID)
      .subscribe((response: any) => {
        if (response.statusCode === 200 && response.data !== null) {
          this.subDistrictsToDom = response.data;
        }
      });
  }

  getSubDistrictSuccessHandelerFromDom(response: any) {
    this.subDistrictsFromDom = response;
  }
  getSubDistrictSuccessHandelerToDom(response: any) {
    this.subDistrictsToDom = response;
  }

  getVillage(subDistrictID: any) {
    this.patientCovidForm.patchValue({ fromSubDistrictDom: subDistrictID });
  }
  getVillageTosubDistrictDom(subDistrictID: any) {
    this.patientCovidForm.patchValue({ toSubDistrictDom: subDistrictID });
  }
  travelinternationalStatuschange(modeOfTravelInter: any) {
    this.patientCovidForm.patchValue({ modeOfTravelInter: modeOfTravelInter });
  }
  getVillageSuccessHandeler(response: any) {
    this.villages = response;
  }

  get travelStatus() {
    return this.patientCovidForm.controls['travelStatus'].value;
  }

  onChange(travel: string, isChecked: any) {
    let isCheckedEvent = false;
    const travelFormArray = <FormArray>(
      this.patientCovidForm.controls['travelList']
    );
    if (typeof isChecked === 'object') {
      isCheckedEvent = isChecked?.target?.checked;
    } else if (typeof isChecked === 'boolean') {
      isCheckedEvent = isChecked;
    }
    if (isCheckedEvent) {
      travelFormArray.push(new FormControl(travel));
      if (travel === 'Domestic') {
        this.istravelModeDomestic = true;
      } else {
        this.istravelModeInternatinal = true;
      }
    } else {
      const index = travelFormArray.controls.findIndex(
        (x) => x.value === travel,
      );
      travelFormArray.removeAt(index);
      if (travel === 'Domestic') {
        this.istravelModeDomestic = false;
        this.domesticReset();
      } else {
        this.istravelModeInternatinal = false;
        this.interReset();
      }
    }
  }
  domesticReset() {
    this.patientCovidForm.patchValue({ modeOfTravelDomestic: null });
    this.patientCovidForm.patchValue({ fromStateDom: null });
    this.patientCovidForm.patchValue({ fromDistrictDom: null });
    this.patientCovidForm.patchValue({ fromSubDistrictDom: null });
    this.patientCovidForm.patchValue({ toStateDom: null });
    this.patientCovidForm.patchValue({ toDistrictDom: null });
    this.patientCovidForm.patchValue({ toSubDistrictDom: null });
  }
  interReset() {
    this.patientCovidForm.patchValue({ modeOfTravelInter: null });
    this.patientCovidForm.patchValue({ fromCountryInter: null });
    this.patientCovidForm.patchValue({ fromCityInter: null });
    this.patientCovidForm.patchValue({ toCountryInter: null });
    this.patientCovidForm.patchValue({ toCityInter: null });
  }

  get modeOfTravelDomestic() {
    return this.patientCovidForm.controls['modeOfTravelDomestic'].value;
  }
  get fromStateDom() {
    return this.patientCovidForm.controls['fromStateDom'].value;
  }
  get toStateDom() {
    return this.patientCovidForm.controls['toStateDom'].value;
  }
  get fromDistrictDom() {
    return this.patientCovidForm.controls['fromDistrictDom'].value;
  }
  get fromSubDistrictDom() {
    return this.patientCovidForm.controls['fromSubDistrictDom'].value;
  }

  get toDistrictDom() {
    return this.patientCovidForm.controls['toDistrictDom'].value;
  }
  get toSubDistrictDom() {
    return this.patientCovidForm.controls['toSubDistrictDom'].value;
  }
  get modeOfTravelInter() {
    return this.patientCovidForm.controls['modeOfTravelInter'].value;
  }
  get fromCountryInter() {
    return this.patientCovidForm.controls['fromCountryInter'].value;
  }
  get fromCityInter() {
    return this.patientCovidForm.controls['fromCityInter'].value;
  }
  get toCountryInter() {
    return this.patientCovidForm.controls['toCountryInter'].value;
  }
  get toCityInter() {
    return this.patientCovidForm.controls['toCityInter'].value;
  }
  get suspectedStatusUI() {
    return this.patientCovidForm.controls['suspectedStatusUI'].value;
  }
  get recommendation() {
    return this.patientCovidForm.controls['recommendation'].value;
  }
}
