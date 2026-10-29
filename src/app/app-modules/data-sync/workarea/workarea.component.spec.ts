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
import { Router } from '@angular/router';
import { of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { DataSyncService } from '../shared/service/data-sync.service';
import { WorkareaComponent } from './workarea.component';

describe('DataSync WorkareaComponent', () => {
  let component: WorkareaComponent;
  let fixture: ComponentFixture<WorkareaComponent>;
  let dataSync: any;
  let confirm: any;
  let session: any;

  const groups = () => [
    { syncTableGroupID: 1, processed: 'N' },
    { syncTableGroupID: 2, processed: 'N' },
    { syncTableGroupID: 3, processed: 'N' },
  ];

  beforeEach(async () => {
    dataSync = autoSpy(DataSyncService);
    dataSync.getDataSYNCGroup.and.returnValue(
      of({ statusCode: 200, data: groups() }),
    );
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [WorkareaComponent],
      providers: [
        ...commonTestProviders({
          session: {
            serverKey: 'k',
            serviceLineDetails: JSON.stringify({ vanID: 5 }),
            dataSyncProviderServiceMapID: 9,
          },
        }),
        { provide: DataSyncService, useValue: dataSync },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideTemplate(WorkareaComponent, '')
      .compileComponents();
    fixture = TestBed.createComponent(WorkareaComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService) as any;
    session = TestBed.inject(SessionStorageService) as any;
    fixture.detectChanges();
  });

  it('ngOnInit loads language, sync groups and form', () => {
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
    expect(component.syncTableGroupList.length).toBe(3);
    expect(component.syncTableGroupList[0].benDetailSynced).toBeFalse();
    expect(component.syncTableGroupList[0].visitSynced).toBeFalse();
    expect(component.generateBenIDForm.get('benID_Range')).toBeTruthy();
  });

  it('ngOnInit still fetches groups even without serverKey (always-true condition)', () => {
    session.store.delete('serverKey');
    const nav = spyOn(TestBed.inject(Router), 'navigate');
    dataSync.getDataSYNCGroup.calls.reset();
    component.ngOnInit();
    expect(dataSync.getDataSYNCGroup).toHaveBeenCalled();
    expect(nav).not.toHaveBeenCalled();
  });

  it('getDataSYNCGroup ignores non-200', () => {
    component.syncTableGroupList = [];
    dataSync.getDataSYNCGroup.and.returnValue(of({ statusCode: 5000 }));
    component.getDataSYNCGroup();
    expect(component.syncTableGroupList).toEqual([]);
  });

  it('ngOnDestroy removes serverKey', () => {
    component.ngOnDestroy();
    expect(session.removeItem).toHaveBeenCalledWith('serverKey');
  });

  it('ngDoCheck re-assigns language', () => {
    component.current_language_set = null;
    component.ngDoCheck();
    expect(component.current_language_set).toEqual(LANGUAGE_EN);
  });

  describe('checkSelectedGroup', () => {
    let upload: jasmine.Spy;
    beforeEach(() => (upload = spyOn(component, 'syncUploadData')));

    it('alerts when already processed', () => {
      component.checkSelectedGroup({ processed: 'D' });
      expect(confirm.alert).toHaveBeenCalledWith('Data already synced');
      expect(upload).not.toHaveBeenCalled();
    });

    it('uploads group 1 directly', () => {
      const g = { processed: 'N', syncTableGroupID: 1 };
      component.checkSelectedGroup(g);
      expect(upload).toHaveBeenCalledWith(g);
    });

    it('group 2 requires ben details first', () => {
      component.checkSelectedGroup({ processed: 'N', syncTableGroupID: 2 });
      expect(confirm.alert).toHaveBeenCalledWith(
        'SYNC Beneficiary Details first',
      );
      expect(upload).not.toHaveBeenCalled();
    });

    it('group 2 uploads once ben details synced', () => {
      const g = { processed: 'N', syncTableGroupID: 2, benDetailSynced: true };
      component.checkSelectedGroup(g);
      expect(upload).toHaveBeenCalledWith(g);
    });

    it('group 3 requires both first', () => {
      component.checkSelectedGroup({ processed: 'N', syncTableGroupID: 3 });
      expect(confirm.alert).toHaveBeenCalledWith(
        'SYNC Beneficiary Details and Beneficiary Visit first',
      );
    });

    it('group 3 requires visit first', () => {
      component.checkSelectedGroup({
        processed: 'N',
        syncTableGroupID: 3,
        benDetailSynced: true,
        visitSynced: false,
      });
      expect(confirm.alert).toHaveBeenCalledWith(
        'SYNC Beneficiary Visit first',
      );
    });

    it('group 3 uploads when both synced', () => {
      const g = {
        processed: 'N',
        syncTableGroupID: 3,
        benDetailSynced: true,
        visitSynced: true,
      };
      component.checkSelectedGroup(g);
      expect(upload).toHaveBeenCalledWith(g);
    });
  });

  describe('syncUploadData', () => {
    it('does nothing when declined', () => {
      confirm.confirm.and.returnValue(of(false));
      component.syncUploadData({ syncTableGroupID: 1 });
      expect(dataSync.syncUploadData).not.toHaveBeenCalled();
    });

    it('marks group 1 processed and ben synced on success', () => {
      dataSync.syncUploadData.and.returnValue(
        of({ statusCode: 200, data: { response: 'done' } }),
      );
      component.syncUploadData({ syncTableGroupID: 1 });
      expect(dataSync.syncUploadData).toHaveBeenCalledWith(1);
      expect(component.syncTableGroupList[0].processed).toBe('D');
      expect(component.syncTableGroupList[1].processed).toBe('N');
      expect(
        component.syncTableGroupList.every(
          (g: any) => g.benDetailSynced && !g.visitSynced,
        ),
      ).toBeTrue();
      expect(confirm.alert).toHaveBeenCalledWith('done', 'success');
    });

    it('marks group 2 with both flags', () => {
      dataSync.syncUploadData.and.returnValue(
        of({ statusCode: 200, data: { response: 'ok' } }),
      );
      component.syncUploadData({ syncTableGroupID: 2 });
      expect(component.syncTableGroupList[1].processed).toBe('D');
      expect(
        component.syncTableGroupList.every(
          (g: any) => g.benDetailSynced && g.visitSynced,
        ),
      ).toBeTrue();
    });

    it('group 3 only changes processed flag', () => {
      dataSync.syncUploadData.and.returnValue(
        of({ statusCode: 200, data: { response: 'ok' } }),
      );
      component.syncUploadData({ syncTableGroupID: 3 });
      expect(component.syncTableGroupList[2].processed).toBe('D');
      expect(component.syncTableGroupList[0].benDetailSynced).toBeFalse();
    });

    it('alerts error message on non-200', () => {
      dataSync.syncUploadData.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'fail' }),
      );
      component.syncUploadData({ syncTableGroupID: 1 });
      expect(confirm.alert).toHaveBeenCalledWith('fail', 'error');
    });

    it('alerts error on http error', () => {
      dataSync.syncUploadData.and.returnValue(throwingObs('x'));
      component.syncUploadData({ syncTableGroupID: 1 });
      expect(confirm.alert).toHaveBeenCalledWith('x', 'error');
    });
  });

  describe('syncDownloadData', () => {
    it('does nothing when declined', () => {
      confirm.confirm.and.returnValue(of(false));
      component.syncDownloadData();
      expect(dataSync.syncDownloadData).not.toHaveBeenCalled();
    });

    it('polls progress on success', fakeAsync(() => {
      dataSync.syncDownloadData.and.returnValue(of({ statusCode: 200 }));
      dataSync.syncDownloadDataProgress.and.returnValue(
        of({ statusCode: 200, data: { percentage: 10 } }),
      );
      component.syncDownloadData();
      expect(dataSync.syncDownloadData).toHaveBeenCalledWith({
        vanID: 5,
        providerServiceMapID: 9,
      });
      expect(component.showProgressBar).toBeTrue();
      tick(4000);
      expect(dataSync.syncDownloadDataProgress).toHaveBeenCalledTimes(2);
      expect(component.progressValue).toBe(10);
      discardPeriodicTasks();
    }));

    it('alerts on non-200', () => {
      dataSync.syncDownloadData.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'e' }),
      );
      component.syncDownloadData();
      expect(confirm.alert).toHaveBeenCalledWith('e', 'error');
    });
  });

  describe('syncDownloadProgressStatus', () => {
    it('completes at 100% and pops trailing empty entry', () => {
      component.showProgressBar = true;
      dataSync.syncDownloadDataProgress.and.returnValue(
        of({ statusCode: 200, data: { percentage: 100, failedMasters: 'x|' } }),
      );
      component.syncDownloadProgressStatus();
      expect(component.failedMasterList).toEqual(['x']);
      expect(component.showProgressBar).toBeFalse();
      expect(confirm.alert).toHaveBeenCalledWith('Master download finished');
    });

    it('keeps non-empty last entry', () => {
      dataSync.syncDownloadDataProgress.and.returnValue(
        of({ statusCode: 200, data: { percentage: 100, failedMasters: 'x' } }),
      );
      component.syncDownloadProgressStatus();
      expect(component.failedMasterList).toEqual(['x']);
    });

    it('ignores non-200', () => {
      component.progressValue = 3;
      dataSync.syncDownloadDataProgress.and.returnValue(
        of({ statusCode: 5000 }),
      );
      component.syncDownloadProgressStatus();
      expect(component.progressValue).toBe(3);
    });
  });

  describe('canDeactivate', () => {
    it('blocks while downloading', () => {
      component.showProgressBar = true;
      expect(component.canDeactivate()).toBeFalse();
      expect(confirm.alert).toHaveBeenCalledWith('Download in progress');
    });
    it('allows otherwise', () => {
      component.showProgressBar = false;
      expect(component.canDeactivate()).toBeTrue();
    });
  });
});
