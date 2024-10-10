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
  ViewChild,
  ElementRef,
  DoCheck,
  OnChanges,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';

@Component({
  selector: 'app-general-oral-examination',
  templateUrl: './general-oral-examination.component.html',
  styleUrls: ['./general-oral-examination.component.css'],
})
export class GeneralOralExaminationComponent implements OnInit, DoCheck {
  @Input()
  oralExaminationForm!: FormGroup;

  @ViewChild('oralImage')
  private oralImage!: ElementRef;

  showOther = false;
  imagePoints: any;
  current_language_set: any;
  constructor(public httpServiceService: HttpServiceService) {}

  ngOnInit() {
    this.assignSelectedLanguage();
    this.oralExaminationForm
      .get('preMalignantLesionTypeList')
      ?.valueChanges.subscribe((value: [string]) => {
        if (value !== null) {
          if (value.indexOf('Any other lesion') >= 0) {
            this.showOther = true;
          } else {
            this.showOther = false;
            this.oralExaminationForm.patchValue({ otherLesionType: null });
          }
        } else {
          this.oralExaminationForm.patchValue({ otherLesionType: null });
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

  checkWithPremalignantLesion() {
    this.oralExaminationForm.patchValue({ preMalignantLesionTypeList: null });
  }

  get premalignantLesions() {
    return this.oralExaminationForm.get('premalignantLesions');
  }

  get preMalignantLesionType() {
    return this.oralExaminationForm.get('preMalignantLesionType');
  }

  get observation() {
    return this.oralExaminationForm.get('observation');
  }
}
