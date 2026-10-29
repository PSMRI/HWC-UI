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
import { FormBuilder } from '@angular/forms';

import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
  createSessionStorageMock,
} from 'src/testing/test-utils';
import { MaterialModule } from 'src/app/app-modules/core/material.module';
import { GeneralUtils } from '../../../../shared/utility/general-utility';
import { GastroIntestinalSystemComponent } from './gastro-intestinal-system.component';

describe('GastroIntestinalSystemComponent', () => {
  let component: GastroIntestinalSystemComponent;
  let fixture: ComponentFixture<GastroIntestinalSystemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [GastroIntestinalSystemComponent],
      providers: [...commonTestProviders()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(GastroIntestinalSystemComponent);
    component = fixture.componentInstance;
    const utils = new GeneralUtils(
      new FormBuilder(),
      createSessionStorageMock({
        serviceLineDetails: JSON.stringify({
          facilityID: 1,
          parkingPlaceID: 2,
        }),
      }) as any,
    );
    component.gastroIntestinalSystemForm =
      utils.createGastroIntestinalSystemForm();
    fixture.detectChanges();
  });

  it('should create and load the language set', () => {
    expect(component).toBeTruthy();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  it('re-assigns the language set on ngDoCheck', () => {
    component.current_language_set = null;
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  it('getters reflect tenderness form values', () => {
    component.gastroIntestinalSystemForm.patchValue({
      palpation_Tenderness: 'Localized',
      palpation_LocationOfTenderness: 'RUQ',
    });
    expect(component.palpation_Tenderness).toBe('Localized');
    expect(component.palpation_LocationOfTenderness).toBe('RUQ');
  });

  it('checkWithTenderness clears the location of tenderness', () => {
    component.gastroIntestinalSystemForm.patchValue({
      palpation_LocationOfTenderness: 'RUQ',
    });
    component.checkWithTenderness();
    expect(component.palpation_LocationOfTenderness).toBeNull();
  });

  it('exposes abdomen texture, liver and spleen options', () => {
    expect(component.selectAbdomenTexture.length).toBe(4);
    expect(component.selectLiver.length).toBe(3);
    expect(component.selectSpleen[2].name).toBe('Enlarged');
  });
});
