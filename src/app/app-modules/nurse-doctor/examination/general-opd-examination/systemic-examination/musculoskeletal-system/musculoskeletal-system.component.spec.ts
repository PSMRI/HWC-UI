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
import { BehaviorSubject } from 'rxjs';
import { AmritTrackingService } from 'Common-UI/src/tracking';

import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
  createSessionStorageMock,
} from 'src/testing/test-utils';
import { MaterialModule } from 'src/app/app-modules/core/material.module';
import { MasterdataService } from '../../../../shared/services';
import { GeneralUtils } from '../../../../shared/utility/general-utility';
import { MusculoskeletalSystemComponent } from './musculoskeletal-system.component';

describe('MusculoskeletalSystemComponent', () => {
  let component: MusculoskeletalSystemComponent;
  let fixture: ComponentFixture<MusculoskeletalSystemComponent>;
  let masterData$: BehaviorSubject<any>;

  beforeEach(async () => {
    masterData$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [MusculoskeletalSystemComponent],
      providers: [
        ...commonTestProviders(),
        {
          provide: MasterdataService,
          useValue: { nurseMasterData$: masterData$.asObservable() },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(MusculoskeletalSystemComponent);
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
    component.musculoSkeletalSystemForm =
      utils.createMusculoSkeletalSystemForm();
    fixture.detectChanges();
  });

  it('should create and load the language set', () => {
    expect(component).toBeTruthy();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  it('keeps joint types empty while master data is null', () => {
    expect(component.selectTypeOfJoint).toEqual([]);
  });

  it('loads joint types when nurse master data arrives', () => {
    const jointTypes = [{ jointTypeID: 1, jointType: 'Knee' }];
    masterData$.next({ jointTypes });
    expect(component.selectTypeOfJoint).toEqual(jointTypes);
  });

  it('re-assigns the language set on ngDoCheck', () => {
    component.current_language_set = null;
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  it('unsubscribes from master data on destroy', () => {
    const sub = component.nurseMasterDataSubscription;
    fixture.destroy();
    expect(sub.closed).toBeTrue();
  });

  it('ngOnDestroy tolerates a missing subscription', () => {
    component.nurseMasterDataSubscription = undefined;
    expect(() => component.ngOnDestroy()).not.toThrow();
    expect(component.nurseMasterDataSubscription).toBeUndefined();
  });

  it('tracks field interactions under "Musculoskeletal System"', () => {
    const tracking = TestBed.inject(AmritTrackingService) as any;
    component.trackFieldInteraction('Spine');
    expect(tracking.trackFieldInteraction).toHaveBeenCalledWith(
      'Spine',
      'Musculoskeletal System',
    );
  });
});
