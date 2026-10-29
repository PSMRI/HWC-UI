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

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';
import { ViewDiseaseSummaryDetailsComponent } from './viewDiseaseSummaryDet.component';

describe('ViewDiseaseSummaryDetailsComponent', () => {
  let component: ViewDiseaseSummaryDetailsComponent;
  let fixture: ComponentFixture<ViewDiseaseSummaryDetailsComponent>;
  let dialogRef: any;

  const summaryDetails = {
    data: {
      diseaseName: 'Malaria',
      summary: '$a$b',
      couldbedangerous: 'x$y',
      causes: '$c1$c2',
      dos_donts: '$d1$d2',
      symptoms_Signs: '$s1$s2',
      medicaladvice: '$m1$m2',
      riskfactors: '$r1$r2',
      treatment: '$t1$t2',
      self_care: '$sc1$sc2',
      investigations: '$i1$i2',
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [ViewDiseaseSummaryDetailsComponent],
      providers: [
        ...commonTestProviders(),
        { provide: MAT_DIALOG_DATA, useValue: { summaryDetails } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(ViewDiseaseSummaryDetailsComponent);
    component = fixture.componentInstance;
    dialogRef = TestBed.inject(MatDialogRef) as any;
    fixture.detectChanges();
  });

  afterEach(() => sessionStorage.removeItem('diseaseClose'));

  it('disables close and formats summary sections', () => {
    expect(dialogRef.disableClose).toBeTrue();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.diseaseName).toBe('Malaria');
    expect(component.summary).toBe('a,b');
    expect(component.couldbedangerous).toBe('x\ny');
    expect(component.causes).toBe('c1\nc2');
    expect(component.dos_donts).toBe('d1\nd2');
    expect(component.symptoms_Signs).toBe('s1\ns2');
    expect(component.medicaladvice).toBe('m1\nm2');
    expect(component.riskfactors).toBe('r1\nr2');
    expect(component.treatment).toBe('t1\nt2');
    expect(component.self_care).toBe('sc1\nsc2');
    expect(component.investigations).toBe('i1\ni2');
  });

  it('closeDialog returns details and marks diseaseClose True', () => {
    component.closeDialog();
    expect(dialogRef.close).toHaveBeenCalledWith(summaryDetails);
    expect(sessionStorage.getItem('diseaseClose')).toBe('True');
  });

  it('closeCancelDialog marks diseaseClose False', () => {
    component.closeCancelDialog();
    expect(dialogRef.close).toHaveBeenCalledWith();
    expect(sessionStorage.getItem('diseaseClose')).toBe('False');
  });

  it('ngDoCheck re-assigns language', () => {
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });
});
