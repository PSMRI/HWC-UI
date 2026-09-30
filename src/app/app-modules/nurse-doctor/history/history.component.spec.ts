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
import { FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { HistoryComponent } from './history.component';
import { DoctorService } from '../shared/services/doctor.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import {
  COMMON_TEST_IMPORTS,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('HistoryComponent', () => {
  let component: HistoryComponent;
  let fixture: ComponentFixture<HistoryComponent>;
  let doctorService: any;
  let routeParams: any;

  async function setup(attendant: string) {
    routeParams = { attendant };
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [HistoryComponent],
      providers: [
        ...commonTestProviders({
          session: { visitID: 'V1', beneficiaryRegID: 'B1' },
        }),
        { provide: DoctorService, useValue: autoSpy(DoctorService) },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: routeParams } },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(HistoryComponent);
    component = fixture.componentInstance;
    component.patientHistoryForm = new FormGroup({});
    doctorService = TestBed.inject(DoctorService) as any;
  }

  describe('as nurse', () => {
    beforeEach(async () => setup('nurse'));

    it('resets captured history and does not fetch general history', () => {
      fixture.detectChanges();
      expect(component.attendant).toBe('nurse');
      expect(doctorService.setCapturedHistoryByNurse).toHaveBeenCalledWith(
        null,
      );
      expect(doctorService.getGeneralHistoryDetails).not.toHaveBeenCalled();
    });

    const shown = [
      'General OPD',
      'ANC',
      'NCD care',
      'PNC',
      'COVID-19 Screening',
      'NCD screening',
    ];
    shown.forEach((cat) => {
      it(`shows general OPD history for ${cat}`, () => {
        component.visitCategory = cat;
        component.ngOnChanges();
        expect(component.showGeneralOPD).toBeTrue();
        fixture.detectChanges();
        expect(
          fixture.nativeElement.querySelector('app-nurse-general-opd-history'),
        ).not.toBeNull();
      });
    });

    it('hides general OPD history for other categories', () => {
      component.visitCategory = 'Neonatal';
      component.ngOnChanges();
      expect(component.showGeneralOPD).toBeFalse();
    });

    it('does nothing on change when no visit category', () => {
      component.showGeneralOPD = true;
      component.visitCategory = '';
      component.ngOnChanges();
      expect(component.showGeneralOPD).toBeTrue();
    });
  });

  describe('as doctor', () => {
    beforeEach(async () => setup('doctor'));

    it('fetches general history and caches it on 200', () => {
      const resp = { statusCode: 200, data: { x: 1 } };
      doctorService.getGeneralHistoryDetails.and.returnValue(of(resp));
      fixture.detectChanges();
      expect(doctorService.getGeneralHistoryDetails).toHaveBeenCalledWith(
        'B1',
        'V1',
      );
      expect(doctorService.setCapturedHistoryByNurse).toHaveBeenCalledWith(
        resp,
      );
    });

    it('does not cache history on non-200 response', () => {
      doctorService.getGeneralHistoryDetails.and.returnValue(
        of({ statusCode: 5000 }),
      );
      fixture.detectChanges();
      expect(doctorService.setCapturedHistoryByNurse).toHaveBeenCalledTimes(1);
      expect(doctorService.setCapturedHistoryByNurse).toHaveBeenCalledWith(
        null,
      );
      expect(
        TestBed.inject(SessionStorageService).getItem,
      ).toHaveBeenCalledWith('visitID');
    });
  });
});
