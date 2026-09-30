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
import { BehaviorSubject } from 'rxjs';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { AmritTrackingService } from 'Common-UI/src/tracking';

import { PreviousVisitDetailsComponent } from './previous-visit-details.component';
import { DoctorService } from '../../../shared/services';
import { CameraService } from '../../../../core/services/camera.service';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('PreviousVisitDetailsComponent', () => {
  let component: PreviousVisitDetailsComponent;
  let fixture: ComponentFixture<PreviousVisitDetailsComponent>;
  let caseRecord$: BehaviorSubject<any>;
  let camera: any;

  beforeEach(async () => {
    caseRecord$ = new BehaviorSubject<any>(null);
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [PreviousVisitDetailsComponent],
      providers: [
        ...commonTestProviders(),
        {
          provide: DoctorService,
          useValue: autoSpy(DoctorService, {
            populateCaserecordResponse$: caseRecord$.asObservable(),
          }),
        },
        { provide: CameraService, useValue: autoSpy(CameraService) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(PreviousVisitDetailsComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(PreviousVisitDetailsComponent);
    component = fixture.componentInstance;
    camera = TestBed.inject(CameraService) as any;
    fixture.detectChanges();
  });

  it('should create and set language', () => {
    expect(component).toBeTruthy();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
    component.current_language_set = null;
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  it('plots all graphs from case record graph data sorted by date desc', () => {
    caseRecord$.next({
      data: {
        GraphData: {
          bpList: [
            { date: '2020-01-01', avgSysBP: 120, avgDysBP: 80 },
            { date: '2021-01-01', avgSysBP: 130, avgDysBP: 85 },
            { date: '2022-01-01', avgSysBP: null, avgDysBP: 85 },
          ],
          weightList: [
            { date: '2020-01-01', weight: 60 },
            { date: '2021-01-01', weight: 62 },
            { date: '2022-01-01' },
          ],
          bgList: [
            {
              date: '2020-01-01',
              bg_2hr_pp: 140,
              bg_fasting: 90,
              bg_random: 110,
            },
            { date: '2021-01-01', bg_2hr_pp: 150 },
          ],
        },
      },
    });
    expect(component.bpChartData).toEqual([
      { data: [130, 120], label: 'Systolic BP' },
      { data: [85, 80], label: 'Diastolic BP' },
    ]);
    expect(component.bpChartLabels).toEqual(['2021-01-01', '2020-01-01']);
    expect(component.weightChartData).toEqual([
      { data: [62, 60], label: 'Weight' },
    ]);
    expect(component.weightChartLabels).toEqual(['2021-01-01', '2020-01-01']);
    expect(component.bgChartData.length).toBe(3);
    expect(component.bgChartData[0]).toEqual({
      data: [140],
      label: '2-Hr Post Prandial',
    });
    expect(component.bgChartLabels).toEqual(['2020-01-01']);
  });

  it('does not plot when graph data absent or lists empty', () => {
    caseRecord$.next({ data: {} });
    component.plotGraphs({ bpList: [], weightList: [], bgList: [] });
    component.plotBloodPressureGraph([
      { date: '2020-01-01', avgSysBP: 0, avgDysBP: 0 },
    ]);
    expect(component.bpChartData).toEqual([]);
    expect(component.weightChartData).toEqual([]);
    expect(component.bgChartData).toEqual([]);
  });

  it('calculates BMI from vitals', () => {
    expect(component.calculateBMI()).toBe(0);
    component.vitals = { weight_Kg: 70, height_cm: 175 };
    expect(component.calculateBMI()).toBe(22.9);
  });

  it('stores case sheet data and navigates to print', () => {
    const router = TestBed.inject(Router);
    const nav = spyOn(router, 'navigate').and.resolveTo(true);
    const session = TestBed.inject(SessionStorageService) as any;
    component.getCaseSheetPrintData({
      createdDate: '2024-05-01T10:00:00Z',
      visitCategory: 'ANC',
      beneficiaryRegID: 'B1',
      benVisitID: 'V1',
    });
    expect(component.visitDateTime).toBe('2024-05-01T10:00:00.000Z');
    expect(session.setItem).toHaveBeenCalledWith('caseSheetBenFlowID', 'null');
    expect(session.setItem).toHaveBeenCalledWith(
      'caseSheetVisitCategory',
      'ANC',
    );
    expect(session.setItem).toHaveBeenCalledWith(
      'caseSheetBeneficiaryRegID',
      'B1',
    );
    expect(session.setItem).toHaveBeenCalledWith('caseSheetVisitID', 'V1');
    expect(nav).toHaveBeenCalledWith(['/common/print']);
  });

  ['bw', 'bp', 'bg'].forEach((type) => {
    it(`opens graph dialog for ${type}`, () => {
      component.chartClicked(type);
      expect(camera.ViewGraph).toHaveBeenCalledTimes(1);
      const arg = camera.ViewGraph.calls.mostRecent().args[0];
      expect(arg.type).toBe(type);
      expect(arg.chartType).toBe('line');
      expect(Object.keys(arg).length).toBe(7);
    });
  });

  it('ignores unknown chart type', () => {
    component.chartClicked('xx');
    expect(camera.ViewGraph).not.toHaveBeenCalled();
  });

  it('graph helpers skip incomplete graph objects', () => {
    component.callBodyWeightGraph({ type: 'bw' });
    component.callBloodPressureGraph({ type: 'bp' });
    component.callBloodGlucoseGraph({ type: 'bg' });
    expect(camera.ViewGraph).not.toHaveBeenCalled();
  });

  it('unsubscribes on destroy', () => {
    const sub = component.previousVisitDetailsSubscription;
    component.ngOnDestroy();
    expect(sub.closed).toBeTrue();
    component.previousVisitDetailsSubscription = undefined as any;
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('tracks field interaction', () => {
    const tracking = TestBed.inject(AmritTrackingService) as any;
    component.trackFieldInteraction('Graph');
    expect(tracking.trackFieldInteraction).toHaveBeenCalledWith(
      'Graph',
      'Previous Visit Details',
    );
  });
});
