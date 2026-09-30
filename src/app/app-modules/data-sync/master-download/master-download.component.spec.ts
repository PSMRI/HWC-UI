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

import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
  discardPeriodicTasks,
} from '@angular/core/testing';
import { of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { DataSyncService } from '../shared/service/data-sync.service';
import { MasterDownloadComponent } from './master-download.component';
import { MatDialogRef } from '@angular/material/dialog';

describe('MasterDownloadComponent', () => {
  let component: MasterDownloadComponent;
  let fixture: ComponentFixture<MasterDownloadComponent>;
  let dataSync: any;
  let confirm: any;

  beforeEach(async () => {
    dataSync = autoSpy(DataSyncService);
    dataSync.getVanDetailsForMasterDownload.and.returnValue(
      of({ statusCode: 200, data: { vanID: 7, vehicalNo: 'KA01' } }),
    );
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [MasterDownloadComponent],
      providers: [
        ...commonTestProviders({
          session: { dataSyncProviderServiceMapID: 13 },
        }),
        { provide: DataSyncService, useValue: dataSync },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(MasterDownloadComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService) as any;
    fixture.detectChanges();
  });

  it('loads van details on init', () => {
    expect(component.showVanDetails).toBeTrue();
    expect(component.vanID).toBe(7);
    expect(component.vehicalNo).toBe('KA01');
  });

  describe('getVanDetails', () => {
    it('hides van details when vanID/vehicalNo missing', () => {
      dataSync.getVanDetailsForMasterDownload.and.returnValue(
        of({ statusCode: 200, data: { vanID: 7 } }),
      );
      component.getVanDetails();
      expect(component.showVanDetails).toBeFalse();
      expect(component.vanID).toBe(7);
    });

    it('hides van details on non-200', () => {
      dataSync.getVanDetailsForMasterDownload.and.returnValue(
        of({ statusCode: 5000 }),
      );
      component.getVanDetails();
      expect(component.showVanDetails).toBeFalse();
    });

    it('hides van details on error', () => {
      component.showVanDetails = true;
      dataSync.getVanDetailsForMasterDownload.and.returnValue(throwingObs());
      component.getVanDetails();
      expect(component.showVanDetails).toBeFalse();
    });
  });

  describe('syncDownloadData', () => {
    it('does nothing when confirmation is declined', () => {
      confirm.confirm.and.returnValue(of(false));
      component.syncDownloadData();
      expect(dataSync.syncDownloadData).not.toHaveBeenCalled();
      expect(component.progressValue).toBe(0);
    });

    it('starts polling progress on success', fakeAsync(() => {
      dataSync.syncDownloadData.and.returnValue(of({ statusCode: 200 }));
      dataSync.syncDownloadDataProgress.and.returnValue(
        of({ statusCode: 200, data: { percentage: 50 } }),
      );
      component.syncDownloadData();
      expect(dataSync.syncDownloadData).toHaveBeenCalledWith({
        vanID: 7,
        providerServiceMapID: 13,
      });
      expect(component.showProgressBar).toBeTrue();
      tick(2000);
      expect(dataSync.syncDownloadDataProgress).toHaveBeenCalledTimes(1);
      expect(component.progressValue).toBe(50);
      discardPeriodicTasks();
    }));

    it('alerts error on non-200', () => {
      dataSync.syncDownloadData.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'bad' }),
      );
      component.syncDownloadData();
      expect(confirm.alert).toHaveBeenCalledWith('bad', 'error');
      expect(component.showProgressBar).toBeFalse();
    });
  });

  describe('syncDownloadProgressStatus', () => {
    it('finishes at 100% and strips trailing empty master', () => {
      spyOn(window, 'clearInterval').and.callThrough();
      component.showProgressBar = true;
      dataSync.syncDownloadDataProgress.and.returnValue(
        of({
          statusCode: 200,
          data: { percentage: 100, failedMasters: 'a|b|' },
        }),
      );
      component.syncDownloadProgressStatus();
      expect(component.failedMasterList).toEqual(['a', 'b']);
      expect(component.showProgressBar).toBeFalse();
      expect(window.clearInterval).toHaveBeenCalled();
      expect(confirm.alert).toHaveBeenCalledWith('Master download finished');
    });

    it('keeps list intact when last entry not empty', () => {
      dataSync.syncDownloadDataProgress.and.returnValue(
        of({
          statusCode: 200,
          data: { percentage: 100, failedMasters: 'a|b' },
        }),
      );
      component.syncDownloadProgressStatus();
      expect(component.failedMasterList).toEqual(['a', 'b']);
    });

    it('stops and alerts on non-200', () => {
      component.showProgressBar = true;
      dataSync.syncDownloadDataProgress.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'oops' }),
      );
      component.syncDownloadProgressStatus();
      expect(component.showProgressBar).toBeFalse();
      expect(confirm.alert).toHaveBeenCalledWith('oops', 'error');
    });
  });

  it('closeDialog closes the dialog ref', () => {
    component.closeDialog();
    expect((TestBed.inject(MatDialogRef) as any).close).toHaveBeenCalled();
  });
});
