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
import { FormControl, FormGroup } from '@angular/forms';
import { BehaviorSubject, of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import { PerinatalHistoryComponent } from './perinatal-history.component';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import {
  DoctorService,
  MasterdataService,
  NurseService,
} from '../../../shared/services';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { PreviousDetailsComponent } from 'src/app/app-modules/core/components/previous-details/previous-details.component';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';

const DELIVERY_TYPES = [
  { deliveryTypeID: 1, deliveryType: 'Normal Delivery' },
  { deliveryTypeID: 2, deliveryType: 'Cesarean Section (LSCS)' },
  { deliveryTypeID: 3, deliveryType: 'Assisted Delivery' },
];
const MASTER = {
  deliveryTypes: DELIVERY_TYPES,
  deliveryPlaces: [
    { deliveryPlaceID: 1, deliveryPlace: 'PHC' },
    { deliveryPlaceID: 2, deliveryPlace: 'Home-Supervised' },
  ],
  birthComplications: [{ complicationID: 5, complicationAtBirth: 'Asphyxia' }],
};

describe('PerinatalHistoryComponent', () => {
  let component: PerinatalHistoryComponent;
  let fixture: ComponentFixture<PerinatalHistoryComponent>;
  let masterData$: BehaviorSubject<any>;
  let history$: BehaviorSubject<any>;
  let nurseService: any;
  let confirmation: any;
  let dialog: any;
  let session: any;

  beforeEach(async () => {
    masterData$ = new BehaviorSubject<any>(null);
    history$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [PerinatalHistoryComponent],
      providers: [
        ...commonTestProviders({ session: { beneficiaryRegID: 'B1' } }),
        {
          provide: MasterdataService,
          useValue: autoSpy(MasterdataService, {
            nurseMasterData$: masterData$.asObservable(),
          }),
        },
        { provide: NurseService, useValue: autoSpy(NurseService) },
        {
          provide: DoctorService,
          useValue: autoSpy(DoctorService, {
            populateHistoryResponse$: history$.asObservable(),
          }),
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(PerinatalHistoryComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(PerinatalHistoryComponent);
    component = fixture.componentInstance;
    component.perinatalHistoryForm = new FormGroup({
      placeOfDelivery: new FormControl(null),
      otherPlaceOfDelivery: new FormControl(null),
      typeOfDelivery: new FormControl(null),
      complicationAtBirth: new FormControl(null),
      otherComplicationAtBirth: new FormControl(null),
      birthWeightG: new FormControl(null),
    });
    nurseService = TestBed.inject(NurseService);
    confirmation = TestBed.inject(ConfirmationService);
    dialog = TestBed.inject(MatDialog);
    session = TestBed.inject(SessionStorageService);
  });

  it('initialises language and ignores empty master data', () => {
    fixture.detectChanges();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    expect(component.masterData).toBeUndefined();
  });

  it('stores master data and delivery types (edit mode)', () => {
    const spy = spyOn(component, 'getGeneralHistory');
    fixture.detectChanges();
    masterData$.next(MASTER);
    expect(component.selectDeliveryTypes).toEqual(DELIVERY_TYPES);
    expect(spy).not.toHaveBeenCalled();
  });

  it('loads history in view mode', () => {
    component.mode = 'view';
    const spy = spyOn(component, 'getGeneralHistory');
    fixture.detectChanges();
    masterData$.next(MASTER);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('loads history for specialist flag 100', () => {
    session.setItem('specialistFlag', '100');
    const spy = spyOn(component, 'getGeneralHistory');
    fixture.detectChanges();
    masterData$.next(MASTER);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  describe('getGeneralHistory', () => {
    beforeEach(() => (component.masterData = MASTER));

    it('maps IDs to master entries and enables type of delivery', () => {
      component.getGeneralHistory();
      history$.next({
        statusCode: 200,
        data: {
          PerinatalHistory: {
            deliveryPlaceID: 1,
            deliveryTypeID: 3,
            complicationAtBirthID: 5,
          },
        },
      });
      const v = component.perinatalHistoryForm.value;
      expect(v.placeOfDelivery).toEqual(MASTER.deliveryPlaces[0]);
      expect(v.typeOfDelivery).toEqual(DELIVERY_TYPES[2]);
      expect(v.complicationAtBirth).toEqual(MASTER.birthComplications[0]);
      expect(
        component.perinatalHistoryForm.get('typeOfDelivery')?.enabled,
      ).toBeTrue();
    });

    it('disables type of delivery when not set', () => {
      component.getGeneralHistory();
      history$.next({ statusCode: 200, data: { PerinatalHistory: {} } });
      expect(
        component.perinatalHistoryForm.get('typeOfDelivery')?.disabled,
      ).toBeTrue();
    });

    it('ignores null PerinatalHistory / bad status', () => {
      component.getGeneralHistory();
      history$.next({ statusCode: 200, data: { PerinatalHistory: null } });
      history$.next({ statusCode: 5000, data: null });
      expect(component.perinatalHistoryData).toBeUndefined();
    });
  });

  describe('checkWeight', () => {
    beforeEach(() => fixture.detectChanges());
    [100, 7000].forEach((w) =>
      it(`alerts for out of range weight ${w}`, () => {
        component.perinatalHistoryForm.patchValue({ birthWeightG: w });
        component.checkWeight(w);
        expect(confirmation.alert).toHaveBeenCalledWith(
          LANGUAGE_EN.alerts.info.recheckValue,
        );
      }),
    );
    it('does not alert for valid weight', () => {
      component.perinatalHistoryForm.patchValue({ birthWeightG: 3000 });
      component.checkWeight(3000);
      expect(confirmation.alert).not.toHaveBeenCalled();
    });
  });

  describe('resetOtherPlaceOfDelivery', () => {
    beforeEach(() => {
      component.masterData = MASTER;
      component.perinatalHistoryForm.patchValue({ otherPlaceOfDelivery: 'x' });
    });

    ['Home-Supervised', 'Home-Unsupervised'].forEach((place) =>
      it(`allows only normal delivery for ${place}`, () => {
        component.perinatalHistoryForm.patchValue({
          placeOfDelivery: { deliveryPlace: place },
        });
        component.resetOtherPlaceOfDelivery();
        expect(component.selectDeliveryTypes).toEqual([DELIVERY_TYPES[0]]);
        expect(
          component.perinatalHistoryForm.value.otherPlaceOfDelivery,
        ).toBeNull();
        expect(
          component.perinatalHistoryForm.get('typeOfDelivery')?.enabled,
        ).toBeTrue();
      }),
    );

    ['Subcentre', 'PHC'].forEach((place) =>
      it(`excludes LSCS for ${place}`, () => {
        component.perinatalHistoryForm.patchValue({
          placeOfDelivery: { deliveryPlace: place },
        });
        component.resetOtherPlaceOfDelivery();
        expect(component.selectDeliveryTypes).toEqual([
          DELIVERY_TYPES[0],
          DELIVERY_TYPES[2],
        ]);
      }),
    );

    it('uses all types otherwise', () => {
      component.perinatalHistoryForm.patchValue({
        placeOfDelivery: { deliveryPlace: 'District Hospital' },
      });
      component.resetOtherPlaceOfDelivery();
      expect(component.selectDeliveryTypes).toEqual(DELIVERY_TYPES);
    });

    it('disables type of delivery when place is empty', () => {
      component.perinatalHistoryForm.patchValue({ placeOfDelivery: {} });
      component.resetOtherPlaceOfDelivery();
      expect(
        component.perinatalHistoryForm.get('typeOfDelivery')?.disabled,
      ).toBeTrue();
    });
  });

  it('getters and resetOtherComplicationAtBirth', () => {
    component.perinatalHistoryForm.patchValue({
      complicationAtBirth: { id: 1 },
      otherComplicationAtBirth: 'y',
    });
    expect(component.complicationAtBirth).toEqual({ id: 1 });
    component.resetOtherComplicationAtBirth();
    expect(
      component.perinatalHistoryForm.value.otherComplicationAtBirth,
    ).toBeNull();
  });

  describe('getPreviousPerinatalHistory', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.visitCategory = 'PNC';
    });

    it('opens dialog when data exists', () => {
      const data = { data: [{ a: 1 }] };
      nurseService.getPreviousPerinatalHistory.and.returnValue(of({ data }));
      component.getPreviousPerinatalHistory();
      expect(nurseService.getPreviousPerinatalHistory).toHaveBeenCalledWith(
        'B1',
        'PNC',
      );
      expect(dialog.open).toHaveBeenCalledWith(PreviousDetailsComponent, {
        data: {
          dataList: data,
          title:
            LANGUAGE_EN.historyData.Perinatalhistorydetails
              .previousPerinatalHistoryDetails,
        },
      });
    });

    it('alerts when empty', () => {
      nurseService.getPreviousPerinatalHistory.and.returnValue(
        of({ data: { data: [] } }),
      );
      component.getPreviousPerinatalHistory();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.historyData.ancHistory.previousHistoryDetails
          .pastHistoryalert,
      );
    });

    it('alerts error for null data', () => {
      nurseService.getPreviousPerinatalHistory.and.returnValue(
        of({ data: null }),
      );
      component.getPreviousPerinatalHistory();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.errorFetchingHistory,
        'error',
      );
    });

    it('alerts error on failure', () => {
      nurseService.getPreviousPerinatalHistory.and.returnValue(throwingObs());
      component.getPreviousPerinatalHistory();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.errorFetchingHistory,
        'error',
      );
    });
  });

  it('unsubscribes on destroy', () => {
    fixture.detectChanges();
    component.getGeneralHistory();
    const s1 = spyOn(component.nurseMasterDataSubscription, 'unsubscribe');
    const s2 = spyOn(component.generalHistorySubscription, 'unsubscribe');
    component.ngOnDestroy();
    expect(s1).toHaveBeenCalled();
    expect(s2).toHaveBeenCalled();
  });

  it('ngOnDestroy without subscriptions does not throw', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('ngDoCheck assigns language', () => {
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });
});
