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
import { Router } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';

import { ConsentFormComponent } from './consent-form.component';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('ConsentFormComponent', () => {
  let component: ConsentFormComponent;
  let fixture: ComponentFixture<ConsentFormComponent>;
  let router: Router;
  let dialogRef: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [ConsentFormComponent],
      providers: [...commonTestProviders()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(ConsentFormComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    dialogRef = TestBed.inject(MatDialogRef);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();
  });

  it('should create and load language set', () => {
    expect(component).toBeTruthy();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(fixture.nativeElement.textContent).toContain(
      LANGUAGE_EN.beneficaryConsent,
    );
  });

  it('closeConsent navigates to search and closes with grant', () => {
    component.closeConsent('1');
    expect(router.navigate).toHaveBeenCalledWith(['/registrar/search/']);
    expect(dialogRef.close).toHaveBeenCalledWith('1');
  });

  it('acceptConsent navigates to registration and closes with grant', () => {
    component.acceptConsent('2');
    expect(router.navigate).toHaveBeenCalledWith(['/registrar/registration']);
    expect(dialogRef.close).toHaveBeenCalledWith('2');
  });
});
