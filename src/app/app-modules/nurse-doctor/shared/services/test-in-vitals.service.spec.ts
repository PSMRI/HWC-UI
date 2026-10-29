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
import { TestBed } from '@angular/core/testing';
import { TestInVitalsService } from './test-in-vitals.service';

describe('TestInVitalsService', () => {
  let service: TestInVitalsService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [TestInVitalsService] });
    service = TestBed.inject(TestInVitalsService);
  });

  it('starts with false values on both subjects', () => {
    const vals: any[] = [];
    service.vitalRBSTestResult$.subscribe((v) => vals.push(v));
    service.vitalRBSTestResultInUpdate$.subscribe((v) => vals.push(v));
    expect(vals).toEqual([false, false]);
  });

  it('setVitalsRBSValueInReports sets value and emits', () => {
    let last: any;
    service.vitalRBSTestResult$.subscribe((v) => (last = v));
    service.setVitalsRBSValueInReports(120);
    expect(service.vitalRBSTest).toBe(120);
    expect(last).toBe(120);
  });

  it('clearVitalsRBSValueInReports resets to 0', () => {
    let last: any;
    service.vitalRBSTestResult$.subscribe((v) => (last = v));
    service.setVitalsRBSValueInReports(120);
    service.clearVitalsRBSValueInReports();
    expect(service.vitalRBSTest).toBe(0);
    expect(last).toBe(0);
  });

  it('setVitalsRBSValueInReportsInUpdate sets update value and emits', () => {
    let last: any;
    service.vitalRBSTestResultInUpdate$.subscribe((v) => (last = v));
    service.setVitalsRBSValueInReportsInUpdate(99);
    expect(service.vitalRBSTestUpdate).toBe(99);
    expect(last).toBe(99);
  });

  it('clearVitalsRBSValueInReportsInUpdate resets update value to 0', () => {
    let last: any;
    service.vitalRBSTestResultInUpdate$.subscribe((v) => (last = v));
    service.setVitalsRBSValueInReportsInUpdate(99);
    service.clearVitalsRBSValueInReportsInUpdate();
    expect(service.vitalRBSTestUpdate).toBe(0);
    expect(last).toBe(0);
  });
});
