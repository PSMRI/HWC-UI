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
import { BehaviorSubject, of, Subject } from 'rxjs';

import { ContactHistoryComponent } from './contact-history.component';
import { DoctorService, MasterdataService } from '../../shared/services';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { MaterialModule } from 'src/app/app-modules/core/material.module';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('ContactHistoryComponent', () => {
  let component: ContactHistoryComponent;
  let fixture: ComponentFixture<ContactHistoryComponent>;
  let doctor: any;
  let session: any;
  let http: any;
  let masterData$: BehaviorSubject<any>;
  let listen$: Subject<any>;

  const MASTER = {
    covidContactHistoryMaster: [
      { contactHistory: 'Contact A' },
      { contactHistory: 'Contact B' },
      { contactHistory: 'None of the above' },
    ],
  };

  async function setup(seed: Record<string, any> = {}) {
    masterData$ = new BehaviorSubject<any>(null);
    listen$ = new Subject<any>();
    const masterMock = autoSpy(MasterdataService, {
      nurseMasterData$: masterData$,
    });
    (masterMock as any).listen.and.returnValue(listen$);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MaterialModule],
      declarations: [ContactHistoryComponent],
      providers: [
        ...commonTestProviders({ session: seed }),
        { provide: DoctorService, useValue: autoSpy(DoctorService) },
        { provide: MasterdataService, useValue: masterMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(ContactHistoryComponent);
    component = fixture.componentInstance;
    component.patientCovidForm = new FormBuilder().group({
      contactStatus: [[]],
    });
    doctor = TestBed.inject(DoctorService) as any;
    session = TestBed.inject(SessionStorageService) as any;
    http = TestBed.inject(HttpServiceService) as any;
  }

  describe('default', () => {
    beforeEach(async () => {
      await setup({ visitID: 'V1', beneficiaryRegID: 'B1' });
      fixture.detectChanges();
    });

    it('should init language and contact flag', () => {
      expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
      expect(session.setItem).toHaveBeenCalledWith('contact', 'null');
    });

    it('should map master data to contact list', () => {
      masterData$.next(MASTER);
      expect(component.contactList).toEqual([
        'Contact A',
        'Contact B',
        'None of the above',
      ]);
      expect(component.contactData).toEqual(component.contactList);
      expect(doctor.getVisitComplaintDetails).not.toHaveBeenCalled();
    });

    it('listen() emission should set contactReqiured based on allSymptom', () => {
      session.setItem('allSymptom', 'true');
      listen$.next('x');
      expect(component.contactReqiured).toBe('false');
      session.setItem('allSymptom', 'false');
      listen$.next('y');
      expect(component.contactReqiured).toBe('true');
    });

    it('ngOnChanges view mode loads contact details', () => {
      doctor.getVisitComplaintDetails.and.returnValue(
        of({
          statusCode: 200,
          data: { covidDetails: { contactStatus: ['Contact A'] } },
        }),
      );
      component.mode = 'view';
      component.ngOnChanges();
      expect(doctor.getVisitComplaintDetails).toHaveBeenCalledWith('B1', 'V1');
      expect(component.contactFlag).toBeTrue();
      expect(component.contactStatus).toEqual(['Contact A']);
      expect(component.contactResponseList).toEqual(['Contact A']);
    });

    it('non-view ngOnChanges does nothing; null covidDetails is ignored', () => {
      component.ngOnChanges();
      expect(doctor.getVisitComplaintDetails).not.toHaveBeenCalled();
      doctor.getVisitComplaintDetails.and.returnValue(
        of({ statusCode: 200, data: { covidDetails: null } }),
      );
      component.getContactDetails('B', 'V');
      component.getMMUContactDetails('B', 'V');
      expect(component.contactFlag).toBeFalse();
      expect(component.contactResponseList).toBeUndefined();
    });

    it('contactSelected with None of the above', () => {
      masterData$.next(MASTER);
      component.patientCovidForm.patchValue({
        contactStatus: ['None of the above'],
      });
      component.contactSelected();
      expect(component.contactData).toEqual(['None of the above']);
      expect(http.filter).toHaveBeenCalledWith('false');
    });

    it('contactSelected with other contacts', () => {
      masterData$.next(MASTER);
      component.patientCovidForm.patchValue({ contactStatus: ['Contact A'] });
      component.contactSelected();
      expect(component.contactData).toEqual(['Contact A', 'Contact B']);
      expect(component.cont).toBe('true');
      expect(http.filter).toHaveBeenCalledWith('true');
    });

    it('contactSelected with empty selection resets', () => {
      masterData$.next(MASTER);
      component.contactData = [];
      component.contactSelected();
      expect(component.contactData).toBe(component.contactList);
      expect(http.filter).toHaveBeenCalledWith('null');
    });

    it('ngOnDestroy should unsubscribe', () => {
      doctor.getVisitComplaintDetails.and.returnValue(of({ statusCode: 5000 }));
      component.getContactDetails('B', 'V');
      const s1 = spyOn(component.contactHistoryMasterData, 'unsubscribe');
      const s2 = spyOn(component.covidContactHistory, 'unsubscribe');
      component.ngOnDestroy();
      expect(s1).toHaveBeenCalled();
      expect(s2).toHaveBeenCalled();
    });

    it('ngOnDestroy without subscriptions should not throw', () => {
      component.contactHistoryMasterData = null;
      component.covidContactHistory = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
      expect(component.covidContactHistory).toBeNull();
    });
  });

  describe('specialist', () => {
    beforeEach(async () => {
      await setup({
        visitID: 'V2',
        beneficiaryRegID: 'B2',
        specialistFlag: '100',
      });
      fixture.detectChanges();
    });

    it('should fetch MMU contact details after master data', () => {
      doctor.getVisitComplaintDetails.and.returnValue(
        of({
          statusCode: 200,
          data: { covidDetails: { contactStatus: ['Contact B'] } },
        }),
      );
      masterData$.next(MASTER);
      expect(doctor.getVisitComplaintDetails).toHaveBeenCalledWith('B2', 'V2');
      expect(component.contactStatus).toEqual(['Contact B']);
      expect(http.filter).toHaveBeenCalledWith('true');
    });
  });
});
