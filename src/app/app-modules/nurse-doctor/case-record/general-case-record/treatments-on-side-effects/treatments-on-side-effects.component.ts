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
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { DoctorService } from '../../../shared/services';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';

@Component({
  selector: 'app-treatments-on-side-effects',
  templateUrl: './treatments-on-side-effects.component.html',
  styleUrls: ['./treatments-on-side-effects.component.css'],
})
export class TreatmentsOnSideEffectsComponent
  implements OnChanges, OnInit, DoCheck, OnDestroy
{
  currentLanguageSet: any;
  @Input()
  treatmentsOnSideEffectsForm!: FormGroup;

  @Input()
  caseRecordMode!: string;
  sideEffectsTretmentSubscription!: Subscription;

  constructor(
    private httpServiceService: HttpServiceService,
    private doctorService: DoctorService,
  ) {}

  ngOnInit() {
    this.assignSelectedLanguage();
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }

  ngOnChanges() {
    if (String(this.caseRecordMode) === 'view') {
      this.getSideEffectDetails();
    }
  }

  getSideEffectDetails() {
    this.sideEffectsTretmentSubscription =
      this.doctorService.populateCaserecordResponse$.subscribe((res) => {
        if (
          res &&
          res.statusCode === 200 &&
          res.data &&
          res.data.treatmentsOnSideEffects
        ) {
          this.treatmentsOnSideEffectsForm.controls[
            'treatmentsOnSideEffects'
          ].setValue(res.data.treatmentsOnSideEffects);
        }
      });
  }

  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }
  ngOnDestroy() {
    if (this.sideEffectsTretmentSubscription) {
      this.sideEffectsTretmentSubscription.unsubscribe();
    }
  }
}
