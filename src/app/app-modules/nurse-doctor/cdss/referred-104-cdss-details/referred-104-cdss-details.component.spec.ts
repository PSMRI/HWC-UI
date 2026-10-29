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
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Referred104CdssDetailsComponent } from './referred-104-cdss-details.component';

describe('Referred104CdssDetailsComponent', () => {
  let component: Referred104CdssDetailsComponent;
  let fixture: ComponentFixture<Referred104CdssDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Referred104CdssDetailsComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(Referred104CdssDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and render its template', () => {
    expect(component instanceof Referred104CdssDetailsComponent).toBeTrue();
    expect(fixture.nativeElement).toBeTruthy();
  });
});
