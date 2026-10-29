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
import { AmritTrackingService } from 'Common-UI/src/tracking';

import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
  createSessionStorageMock,
} from 'src/testing/test-utils';
import { MaterialModule } from 'src/app/app-modules/core/material.module';
import { GeneralUtils } from '../../../../shared/utility/general-utility';
import { CentralNervousSystemComponent } from './central-nervous-system.component';

describe('CentralNervousSystemComponent', () => {
  let component: CentralNervousSystemComponent;
  let fixture: ComponentFixture<CentralNervousSystemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [CentralNervousSystemComponent],
      providers: [...commonTestProviders()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CentralNervousSystemComponent);
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
    component.centralNervousSystemForm = utils.createCentralNervousSystemForm();
    fixture.detectChanges();
  });

  it('should create and load the language set', () => {
    expect(component).toBeTruthy();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  it('re-assigns the language set on ngDoCheck', () => {
    component.current_language_set = undefined;
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  it('tracks field interactions under "Central Nervous System"', () => {
    const tracking = TestBed.inject(AmritTrackingService) as any;
    component.trackFieldInteraction('Some Field');
    expect(tracking.trackFieldInteraction).toHaveBeenCalledWith(
      'Some Field',
      'Central Nervous System',
    );
  });

  it('exposes the handedness options', () => {
    expect(component.selectHandedness.map((h) => h.name)).toEqual([
      'No',
      'Right Handed',
      'Left Handed',
    ]);
  });
});
