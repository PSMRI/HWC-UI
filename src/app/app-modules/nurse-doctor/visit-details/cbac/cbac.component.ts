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
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SetLanguageComponent } from 'app/app-modules/core/components/set-language.component';
import { BeneficiaryDetailsService } from 'app/app-modules/core/services';
import { ConfirmationService } from 'app/app-modules/core/services/confirmation.service';
import { HttpServiceService } from 'app/app-modules/core/services/http-service.service';
import { CbacService } from '../../shared/services/cbac.service';

@Component({
  selector: 'app-cbac',
  templateUrl: './cbac.component.html',
  styleUrls: ['./cbac.component.css']
})
export class CbacComponent implements OnInit {
  currentLanguageSet: any;
  
  cbacAgeOptions = [
    {
      "option":"0-29 years",
      "score" : 0
    },
    {
      "option":"30-39 years",
      "score" : 1
    },
    {
      "option":"40-49 years",
      "score" : 2
    },
    {
      "option":"50-59 years",
      "score" : 3
    },
    {
      "option":">=60 years",
      "score" : 4
    }
  ];
  cbacConsumeGutkaOptions = [
    {
      "option":"Never",
      "score" : 0
    },
    {
      "option":"Used to consume in past/sometimes now",
      "score" : 1
    },
    {
      "option":"Daily",
      "score" : 2
    }
  ];

  cbacWaistMaleOptions = [
    {
      "option":"90 cm or less",
      "score" : 0
    },
    {
      "option":"91cm -100 cm",
      "score" : 1
    },
    {
      "option":"More than 100cm",
      "score" : 2
    }
  ];

  cbacWaistFemaleOptions = [
    {
      "option":"80cm or less",
      "score" : 0
    },
    {
      "option":"81-90 cm",
      "score" : 1
    },
    {
      "option":"More than 90 cm",
      "score" : 2
    }
  ];

  cbacPhysicalActivityOptions = [
    {
      "option":"Atleast 150 minutes in a week",
      "score" : 0
    },
    {
      "option":"Less than 150 minutes in a week",
      "score" : 1
    }
  ]

  ageScore : number=0;
  consumeGutkaScore: number=0;
  cbacAlcoholScore: number=0;
  cbacWaistMaleScore: number=0;
  cbacWaistFemaleScore: number=0;
  cbacPhysicalActivityScore: number=0;
  cbacFamilyHistoryBpdiabetesScore: number=0;
  beneficiaryGender: any;
  beneficiaryAge: any;
  totalCbacScore: number = null;
  cbacDetailsFromNurse: any;
  totalScore: number = null;

  constructor(
    private fb: FormBuilder,
    private httpService: HttpServiceService,
    private cbacService: CbacService,
    private confirmationService: ConfirmationService,
    private route: ActivatedRoute,
    private beneficiaryDetailsService: BeneficiaryDetailsService,

  ) { }
  @Input("cbacScreeningForm")
  cbacScreeningForm: FormGroup;

  @Input('mode')
  mode: String;
  
  ngOnInit() {
    this.assignSelectedLanguage();
    this.getBenificiaryDetails();
    this.setAgeQuetionOptions();
    this.cbacScreeningForm.reset();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }
  ngDoCheck() {
    this.assignSelectedLanguage();
  }

  ngOnDestroy() {

    if (this.beneficiaryDetailsSubscription)
      this.beneficiaryDetailsSubscription.unsubscribe();

  }

  ngOnChanges() {
    this.getCbacDetails();
  }

  setAgeQuetionOptions(){
    if(this.beneficiaryAge >=0 && this.beneficiaryAge <= 29){
      this.cbacAgeOptions = [
        {
          "option":"0-29 years",
          "score" : 0
        },
      ]
    }
    else if(this.beneficiaryAge >=30 && this.beneficiaryAge <= 39){
      this.cbacAgeOptions = [
        {
          "option":"30-39 years",
          "score" : 1
        },
      ]
    }
    else if(this.beneficiaryAge >=40 && this.beneficiaryAge <= 49){
      this.cbacAgeOptions = [
        {
          "option":"40-49 years",
          "score" : 2
        },
      ]
    }
    else if(this.beneficiaryAge >=50 && this.beneficiaryAge <= 59){
      this.cbacAgeOptions = [
        {
          "option":"50-59 years",
          "score" : 3
        },
      ]
    }
    else{
      this.cbacAgeOptions = [
        {
          "option":">=60 years",
          "score" : 4
        },
      ]
    }
  }

  getCbacDetails() {
    if (this.mode == 'view') {
    let reqObj = {
      visitID: localStorage.getItem('visitID'),
      beneficiaryRegId: localStorage.getItem('beneficiaryRegID'),
      visitCode: localStorage.getItem('visitCode')
    }
     this.cbacService.fetchCbacDetails(reqObj).subscribe((response)=>{
      if(response.data !== null && response.statusCode == 200){
        console.log("cbac fetched data from nurse", response.data);
        this.cbacDetailsFromNurse = response.data;
        let cbacData = response.data;
        if(cbacData !== null && cbacData !== undefined){
          this.totalScore = cbacData.totalScore;
          this.cbacScreeningForm.patchValue({
            totalScore: (cbacData.totalScore !== null && cbacData.totalScore !== undefined) ? cbacData.totalScore : null,
            cbacAge: (cbacData.cbacAge !== null && cbacData.cbacAge !== undefined) ? cbacData.cbacAge : null,
            cbacConsumeGutka: (cbacData.cbacConsumeGutka !== null && cbacData.cbacConsumeGutka !== undefined) ? cbacData.cbacConsumeGutka : null,
            cbacAlcohol: (cbacData.cbacAlcohol !== null && cbacData.cbacAlcohol !== undefined) ? cbacData.cbacAlcohol : null,
            cbacWaistMale: (cbacData.cbacWaistMale !== null && cbacData.cbacWaistMale !== undefined) ? cbacData.cbacWaistMale : null,
            cbacWaistFemale: (cbacData.cbacWaistFemale !== null && cbacData.cbacWaistFemale !== undefined) ? cbacData.cbacWaistFemale : null,
            cbacPhysicalActivity: (cbacData.cbacPhysicalActivity !== null && cbacData.cbacPhysicalActivity !== undefined) ? cbacData.cbacPhysicalActivity : null,
            cbacFamilyHistoryBpdiabetes: (cbacData.cbacFamilyHistoryBpdiabetes !== null && cbacData.cbacFamilyHistoryBpdiabetes !== undefined) ? cbacData.cbacFamilyHistoryBpdiabetes : null,

            cbacShortnessBreath: (cbacData.cbacShortnessBreath !== null && cbacData.cbacShortnessBreath !== undefined) ? cbacData.cbacShortnessBreath : null,
            cbacCough2weeks: (cbacData.cbacCough2weeks !== null && cbacData.cbacCough2weeks !== undefined) ? cbacData.cbacCough2weeks : null,
            cbacBloodsputum: (cbacData.cbacBloodsputum !== null && cbacData.cbacBloodsputum !== undefined) ? cbacData.cbacBloodsputum : null,
            cbacFever2weeks: (cbacData.cbacFever2weeks !== null && cbacData.cbacFever2weeks !== undefined) ? cbacData.cbacFever2weeks : null,
            cbacWeightLoss: (cbacData.cbacWeightLoss !== null && cbacData.cbacWeightLoss !== undefined) ? cbacData.cbacWeightLoss : null,
            cbacNightSweats: (cbacData.cbacNightSweats !== null && cbacData.cbacNightSweats !== undefined) ? cbacData.cbacNightSweats : null,
            cbacAntiTBDrugs: (cbacData.cbacAntiTBDrugs !== null && cbacData.cbacAntiTBDrugs !== undefined) ? cbacData.cbacAntiTBDrugs : null,
            cbacTb: (cbacData.cbacTb !== null && cbacData.cbacTb !== undefined) ? cbacData.cbacTb : null,
            cbacUlceration:(cbacData.cbacUlceration !== null && cbacData.cbacUlceration !== undefined) ? cbacData.cbacUlceration : null,
            cbacRecurrentTingling: (cbacData.cbacRecurrentTingling !== null && cbacData.cbacRecurrentTingling !== undefined) ? cbacData.cbacRecurrentTingling : null,
            cbacMouthopeningDifficulty: (cbacData.cbacMouthopeningDifficulty !== null && cbacData.cbacMouthopeningDifficulty !== undefined) ? cbacData.cbacMouthopeningDifficulty : null,
            cbacMouthUlcers: (cbacData.cbacMouthUlcers !== null && cbacData.cbacMouthUlcers !== undefined) ? cbacData.cbacMouthUlcers : null,
            cbacMouthUlcersGrowth: (cbacData.cbacMouthUlcersGrowth !== null && cbacData.cbacMouthUlcersGrowth !== undefined) ? cbacData.cbacMouthUlcersGrowth : null,
            cbacMouthredpatch: (cbacData.cbacMouthredpatch !== null && cbacData.cbacMouthredpatch !== undefined) ? cbacData.cbacMouthredpatch : null,
            cbacPainchewing: (cbacData.cbacPainchewing !== null && cbacData.cbacPainchewing !== undefined) ? cbacData.cbacPainchewing : null,
            cbacTonechange: (cbacData.cbacTonechange !== null && cbacData.cbacTonechange !== undefined) ? cbacData.cbacTonechange : null,
            cbacHypopigmentedpatches: (cbacData.cbacHypopigmentedpatches !== null && cbacData.cbacHypopigmentedpatches !== undefined) ? cbacData.cbacHypopigmentedpatches : null,
            cbacThickenedskin: (cbacData.cbacThickenedskin !== null && cbacData.cbacThickenedskin !== undefined) ? cbacData.cbacThickenedskin : null,
            cbacNodulesonskin: (cbacData.cbacNodulesonskin !== null && cbacData.cbacNodulesonskin !== undefined) ? cbacData.cbacNodulesonskin : null,
            cbacRecurrentNumbness: (cbacData.cbacRecurrentNumbness !== null && cbacData.cbacRecurrentNumbness !== undefined) ? cbacData.cbacRecurrentNumbness : null,
            cbacBlurredVision: (cbacData.cbacBlurredVision !== null && cbacData.cbacBlurredVision !== undefined) ? cbacData.cbacBlurredVision : null,
            cbacDifficultyreading: (cbacData.cbacDifficultyreading !== null && cbacData.cbacDifficultyreading !== undefined) ? cbacData.cbacDifficultyreading : null,
            cbacRednessPain: (cbacData.cbacRednessPain !== null && cbacData.cbacRednessPain !== undefined) ? cbacData.cbacRednessPain : null,
            cbacDifficultyHearing: (cbacData.cbacDifficultyHearing !== null && cbacData.cbacDifficultyHearing !== undefined) ? cbacData.cbacDifficultyHearing : null,
            cbacClawingfingers: (cbacData.cbacClawingfingers !== null && cbacData.cbacClawingfingers !== undefined) ?  cbacData.cbacClawingfingers : null,
            cbacHandTingling: (cbacData.cbacHandTingling !== null && cbacData.cbacHandTingling !== undefined) ? cbacData.cbacHandTingling : null,
            cbacInabilityCloseeyelid: (cbacData.cbacInabilityCloseeyelid !== null && cbacData.cbacInabilityCloseeyelid !== undefined) ? cbacData.cbacInabilityCloseeyelid : null,
            cbacDifficultHoldingObjects: (cbacData.cbacDifficultHoldingObjects !== null && cbacData.cbacDifficultHoldingObjects !== undefined) ? cbacData.cbacDifficultHoldingObjects : null,
            cbacFeetweakness: (cbacData.cbacFeetweakness !== null && cbacData.cbacFeetweakness !== undefined) ? cbacData.cbacFeetweakness : null,
            cbacLumpBreast: (cbacData.cbacLumpBreast !== null && cbacData.cbacLumpBreast !== undefined) ? cbacData.cbacLumpBreast : null,
            cbacBloodnippleDischarge: (cbacData.cbacBloodnippleDischarge !== null && cbacData.cbacBloodnippleDischarge !== undefined) ? cbacData.cbacBloodnippleDischarge : null,
            cbacBreastsizechange: (cbacData.cbacBreastsizechange !== null && cbacData.cbacBreastsizechange !== undefined) ? cbacData.cbacBreastsizechange : null,
            cbacBleedingPeriods: (cbacData.cbacBleedingPeriods !== null && cbacData.cbacBleedingPeriods !== undefined) ? cbacData.cbacBleedingPeriods : null,
            cbacBleedingMenopause: (cbacData.cbacBleedingMenopause !== null && cbacData.cbacBleedingMenopause !== undefined) ? cbacData.cbacBleedingMenopause : null,
            cbacBleedingIntercourse: (cbacData.cbacBleedingIntercourse !== null && cbacData.cbacBleedingIntercourse !== undefined) ? cbacData.cbacBleedingIntercourse : null,
            cbacVaginalDischarge: (cbacData.cbacVaginalDischarge !== null && cbacData.cbacVaginalDischarge !== undefined) ? cbacData.cbacVaginalDischarge : null,
            cbacFeelingUnsteady: (cbacData.cbacFeelingUnsteady !== null && cbacData.cbacFeelingUnsteady !== undefined) ? cbacData.cbacFeelingUnsteady : null,
            cbacPhysicalDisabilitySuffering: (cbacData.cbacPhysicalDisabilitySuffering !== null && cbacData.cbacPhysicalDisabilitySuffering !== undefined) ? cbacData.cbacPhysicalDisabilitySuffering : null,
            cbacNeedhelpEverydayActivities: (cbacData.cbacNeedhelpEverydayActivities !== null && cbacData.cbacNeedhelpEverydayActivities !== undefined) ? cbacData.cbacNeedhelpEverydayActivities : null,
            cbacForgetnearones: (cbacData.cbacForgetnearones !== null && cbacData.cbacForgetnearones !== undefined) ? cbacData.cbacForgetnearones : null,
          });
        }else {
          console.log("No cbac details found")
        }
      }
    });
    (err) => {
      this.confirmationService.alert(err, "error");
      }
    }
  } 

  beneficiaryDetailsSubscription: any;
  getBenificiaryDetails() {
    this.beneficiaryDetailsSubscription = this.beneficiaryDetailsService.beneficiaryDetails$
      .subscribe(beneficiaryDetails => {
        if (beneficiaryDetails) {
          this.beneficiaryGender = beneficiaryDetails.genderName.toLowerCase();
          this.beneficiaryAge = beneficiaryDetails.ageVal;
}
      })
  }


  calculateAgeScore() {
    let ageScoreObject = this.cbacAgeOptions.filter(item => {
      if(item.option === this.cbacScreeningForm.value.cbacAge)
             return item;
    });

    this.ageScore = ageScoreObject[0].score;
    this.cbacScreeningForm.controls['cbacAgeScore'].setValue(this.ageScore);
    this.calculateTotalCBACScore();
  }

  calculatecbacConsumeGutka() {
    let consumeGutkaScoreObject = this.cbacConsumeGutkaOptions.filter(item => {
      if(item.option === this.cbacScreeningForm.value.cbacConsumeGutka)
             return item;
    });

    this.consumeGutkaScore = consumeGutkaScoreObject[0].score;
    this.cbacScreeningForm.controls['cbacConsumeGutkaScore'].setValue(this.consumeGutkaScore);
    this.calculateTotalCBACScore();
  }

  calculatecbacAlcohol() {
   if(this.cbacScreeningForm.value.cbacAlcohol === "yes")
       this.cbacAlcoholScore = 1;
  else
       this.cbacAlcoholScore = 0;

  this.cbacScreeningForm.controls['cbacAlcoholScore'].setValue(this.cbacAlcoholScore);
  this.calculateTotalCBACScore();
  }



  calculatecbacWaistMaleScore() {
    let cbacWaistMaleScoreObject = this.cbacWaistMaleOptions.filter(item => {
      if(item.option === this.cbacScreeningForm.value.cbacWaistMale)
             return item;
    });

    this.cbacWaistMaleScore = cbacWaistMaleScoreObject[0].score;
    this.cbacScreeningForm.controls['cbacWaistMaleScore'].setValue(this.cbacWaistMaleScore);
    this.calculateTotalCBACScore();
  }

  calculatecbacWaistFemaleScore() {
    let cbacWaistFemaleScoreObject = this.cbacWaistFemaleOptions.filter(item => {
      if(item.option === this.cbacScreeningForm.value.cbacWaistFemale)
             return item;
    });

    this.cbacWaistFemaleScore = cbacWaistFemaleScoreObject[0].score;
    this.cbacScreeningForm.controls['cbacWaistFemaleScore'].setValue(this.cbacWaistFemaleScore);
    this.calculateTotalCBACScore();
   }
  calculateCbacPhysicalActivity() {
    let cbacPhysicalActivityScoreObject = this.cbacPhysicalActivityOptions.filter(item => {
      if(item.option === this.cbacScreeningForm.value.cbacPhysicalActivity)
             return item;
    });

    this.cbacPhysicalActivityScore = cbacPhysicalActivityScoreObject[0].score;
    this.cbacScreeningForm.controls['cbacPhysicalActivityScore'].setValue(this.cbacPhysicalActivityScore);
    this.calculateTotalCBACScore();
  }


  calculateCbacFamilyHistoryBpdiabetes() {
    if(this.cbacScreeningForm.value.cbacFamilyHistoryBpdiabetes === "yes")
       this.cbacFamilyHistoryBpdiabetesScore = 2;
  else
       this.cbacFamilyHistoryBpdiabetesScore = 0;

       this.cbacScreeningForm.controls['cbacFamilyHistoryBpdiabetesScore'].setValue(this.cbacFamilyHistoryBpdiabetesScore);
       this.calculateTotalCBACScore();
    }


calculateTotalCBACScore() {
  // this.cbacScreeningForm.value.totalScore = 0;
  let cbacTotalScore = this.ageScore + this.consumeGutkaScore + this.cbacAlcoholScore + this.cbacWaistMaleScore + this.cbacWaistFemaleScore + this.cbacPhysicalActivityScore + this.cbacFamilyHistoryBpdiabetesScore;
  this.totalCbacScore =  cbacTotalScore;
  this.cbacScreeningForm.controls['totalScore'].setValue(cbacTotalScore);

}



}
