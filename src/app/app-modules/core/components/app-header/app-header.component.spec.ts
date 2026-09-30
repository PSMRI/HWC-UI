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
  flushMicrotasks,
} from '@angular/core/testing';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { BehaviorSubject, of } from 'rxjs';

import { AppHeaderComponent } from './app-header.component';
import { AuthService } from '../../services/auth.service';
import { TelemedicineService } from '../../services/telemedicine.service';
import { HttpServiceService } from '../../services/http-service.service';
import { IotService } from '../../services/iot.service';
import { ShowCommitAndVersionDetailsComponent } from '../show-commit-and-version-details/show-commit-and-version-details.component';
import { IotBluetoothComponent } from '../iot-bluetooth/iot-bluetooth.component';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { AmritTrackingService } from 'Common-UI/src/tracking';
import { environment } from 'src/environments/environment';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  createHttpServiceMock,
  throwingObs,
} from 'src/testing/test-utils';

describe('AppHeaderComponent', () => {
  let fixture: ComponentFixture<AppHeaderComponent>;
  let component: AppHeaderComponent;
  let auth: any;
  let telemedicine: any;
  let http: any;
  let iot: any;
  let session: any;
  let dialog: any;
  let router: Router;
  let tracking: any;
  let browserStore: Map<string, string>;

  const languageList = [{ languageName: 'English' }, { languageName: 'Hindi' }];

  function setup(sessionSeed: Record<string, any> = {}) {
    auth = autoSpy(AuthService);
    auth.getUIVersionAndCommitDetails.and.returnValue(
      of({ version: '3.0.0', commit: 'abc123' }),
    );
    telemedicine = autoSpy(TelemedicineService);
    http = {
      ...createHttpServiceMock(),
      getLanguage: jasmine
        .createSpy('getLanguage')
        .and.returnValue(of({ English: LANGUAGE_EN })),
    };
    http.fetchLanguageSet.and.returnValue(of({ data: languageList }));
    iot = { disconnectValue$: new BehaviorSubject<any>(true) };

    TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MatMenuModule],
      declarations: [AppHeaderComponent],
      providers: [
        ...commonTestProviders({ session: sessionSeed }),
        { provide: AuthService, useValue: auth },
        { provide: TelemedicineService, useValue: telemedicine },
        { provide: HttpServiceService, useValue: http },
        { provide: IotService, useValue: iot },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(AppHeaderComponent);
    component = fixture.componentInstance;
    session = TestBed.inject(SessionStorageService);
    dialog = TestBed.inject(MatDialog);
    tracking = TestBed.inject(AmritTrackingService);
    router = TestBed.inject(Router);
  }

  beforeEach(() => {
    // Fake browser sessionStorage so the real one is never touched.
    browserStore = new Map();
    spyOn(Storage.prototype, 'getItem').and.callFake((k: string) =>
      browserStore.has(k) ? (browserStore.get(k) as string) : null,
    );
    spyOn(Storage.prototype, 'setItem').and.callFake((k: string, v: string) =>
      browserStore.set(k, String(v)),
    );
    spyOn(Storage.prototype, 'clear').and.callFake(() => browserStore.clear());
    spyOn(window, 'alert');
  });

  describe('ngOnInit', () => {
    it('reads session values, UI version and does not fetch languages when unauthenticated', () => {
      setup({
        servicePointName: 'SP1',
        userName: 'nurse1',
        providerServiceID: '1717',
      });
      component.ngOnInit();
      expect(component.servicePoint).toBe('SP1');
      expect(component.userName).toBe('nurse1');
      expect(component.status).toBe('1717');
      expect(component.isAuthenticated).toBeFalse();
      expect(component.license).toBe(environment.licenseUrl);
      expect(component.currentLanguageSet).toBe(LANGUAGE_EN);
      expect(auth.getUIVersionAndCommitDetails).toHaveBeenCalledWith(
        'assets/git-version.json',
      );
      expect(component.versionUI).toBe('3.0.0');
      expect(http.fetchLanguageSet).not.toHaveBeenCalled();
      expect(component.updateCSSToShowActiveRegistrar).toBeFalse();
    });

    it('tracks the IoT connection state (undefined means disconnected)', () => {
      setup();
      component.ngOnInit();
      expect(component.isConnected).toBeTrue();
      iot.disconnectValue$.next(false);
      expect(component.isConnected).toBeFalse();
      iot.disconnectValue$.next(true);
      iot.disconnectValue$.next(undefined);
      expect(component.isConnected).toBeFalse();
    });

    it('fetches the language list and applies the default language when authenticated', () => {
      browserStore.set('isAuthenticated', 'true');
      setup();
      component.ngOnInit();
      expect(component.isAuthenticated).toBeTrue();
      expect(http.fetchLanguageSet).toHaveBeenCalled();
      expect(component.languageArray).toEqual(languageList);
      expect(http.getLanguage).toHaveBeenCalledWith('./assets/English.json');
      expect(http.getCurrentLanguage).toHaveBeenCalledWith(LANGUAGE_EN);
      expect(browserStore.get('setLanguage')).toBe('English');
      expect(component.app_language).toBe('English');
    });

    it('logs the UI version error without failing', () => {
      setup();
      auth.getUIVersionAndCommitDetails.and.returnValue(throwingObs());
      component.ngOnInit();
      expect(component.versionUI).toBeUndefined();
    });

    it('renders the template', () => {
      browserStore.set('isAuthenticated', 'true');
      setup({ userName: 'nurse1', providerServiceID: '1' });
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Nurse1');
    });
  });

  describe('fetchLanguageSet', () => {
    beforeEach(() => setup());

    it('ignores a response without data', () => {
      http.fetchLanguageSet.and.returnValue(of({}));
      spyOn(component, 'getLanguage');
      component.fetchLanguageSet();
      expect(component.getLanguage).not.toHaveBeenCalled();
      expect(component.languageArray).toBeUndefined();
    });

    it('ignores a null response', () => {
      http.fetchLanguageSet.and.returnValue(of(null));
      spyOn(component, 'getLanguage');
      component.fetchLanguageSet();
      expect(component.getLanguage).not.toHaveBeenCalled();
    });
  });

  describe('getLanguage', () => {
    beforeEach(() => setup());

    it('uses the language stored in browser session storage', () => {
      browserStore.set('setLanguage', 'Hindi');
      spyOn(component, 'changeLanguage');
      component.getLanguage();
      expect(component.changeLanguage).toHaveBeenCalledWith('Hindi');
    });

    it('falls back to the app language', () => {
      spyOn(component, 'changeLanguage');
      component.getLanguage();
      expect(component.changeLanguage).toHaveBeenCalledWith('English');
    });
  });

  describe('changeLanguage', () => {
    beforeEach(() => {
      setup();
      component.currentLanguageSet = LANGUAGE_EN;
      component.languageArray = languageList;
    });

    it('alerts when the language file is empty', () => {
      http.getLanguage.and.returnValue(of(null));
      component.changeLanguage('Hindi');
      expect(window.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.langNotDefinesd,
      );
    });

    it('alerts when the language file cannot be loaded', () => {
      http.getLanguage.and.returnValue(throwingObs());
      component.changeLanguage('Hindi');
      expect(window.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.comingUpWithThisLang + ' Hindi',
      );
    });

    it('delegates successful responses to languageSuccessHandler', () => {
      spyOn(component, 'languageSuccessHandler');
      component.changeLanguage('English');
      expect(component.languageSuccessHandler).toHaveBeenCalledWith(
        { English: LANGUAGE_EN },
        'English',
      );
    });
  });

  describe('languageSuccessHandler', () => {
    beforeEach(() => {
      setup();
      component.currentLanguageSet = LANGUAGE_EN;
      component.languageArray = languageList;
    });

    it('alerts when the language key is missing in the file', () => {
      component.languageSuccessHandler({}, 'Tamil');
      expect(window.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.comingUpWithThisLang + ' Tamil',
      );
      expect(http.getCurrentLanguage).not.toHaveBeenCalled();
    });

    it('applies the language, stores it and builds navigation', () => {
      const hindi = { ...LANGUAGE_EN, marker: 'hi' };
      component.languageSuccessHandler({ Hindi: hindi }, 'Hindi');
      expect(component.currentLanguageSet).toBe(hindi);
      expect(component.app_language).toBe('Hindi');
      expect(browserStore.get('setLanguage')).toBe('Hindi');
      expect(http.getCurrentLanguage).toHaveBeenCalledWith(hindi);
      expect(component.navigation.length).toBe(9);
      expect(component.filteredNavigation).toBeUndefined();
    });

    it('does not change app_language for a language missing from the list', () => {
      component.languageSuccessHandler({ Tamil: LANGUAGE_EN }, 'Tamil');
      expect(component.app_language).toBe('English');
    });

    it('sets app_language directly when the language set is falsy', () => {
      spyOn(component, 'rolenavigation');
      component.languageSuccessHandler({ Tamil: null }, 'Tamil');
      expect(component.app_language).toBe('Tamil');
      expect(component.rolenavigation).toHaveBeenCalled();
    });
  });

  describe('rolenavigation', () => {
    it('filters navigation by the stored roles when showRoles is set', () => {
      setup({ role: JSON.stringify(['Nurse', 'Doctor']) });
      component.currentLanguageSet = LANGUAGE_EN;
      component.showRoles = true;
      component.rolenavigation();
      expect(component.roles).toEqual(['Nurse', 'Doctor']);
      expect(component.filteredNavigation.map((n: any) => n.role)).toEqual([
        'Nurse',
        'Doctor',
      ]);
      expect(component.filteredNavigation[0].link).toBe(
        '/nurse-doctor/nurse-worklist',
      );
    });

    it('does not filter when no roles are stored', () => {
      setup({ role: 'null' });
      component.currentLanguageSet = LANGUAGE_EN;
      component.showRoles = true;
      component.rolenavigation();
      expect(component.filteredNavigation).toBeUndefined();
    });
  });

  describe('ngAfterContentChecked', () => {
    beforeEach(() => setup());

    it('flags the registrar tab active', () => {
      (component as any).activeRegistrar = { isActive: true };
      component.ngAfterContentChecked();
      expect(component.updateCSSToShowActiveRegistrar).toBeTrue();
    });

    it('leaves the flag when the registrar tab is inactive or missing', () => {
      component.ngAfterContentChecked();
      (component as any).activeRegistrar = { isActive: false };
      component.ngAfterContentChecked();
      expect(component.updateCSSToShowActiveRegistrar).toBeFalse();
    });
  });

  describe('navigation and logout', () => {
    beforeEach(() => setup());

    it('DataSync navigates to /datasync', () => {
      spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
      component.DataSync();
      expect(router.navigate).toHaveBeenCalledWith(['/datasync']);
    });

    it('logout navigates to feedback, resets language and clears storage', fakeAsync(() => {
      spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
      spyOn(component, 'changeLanguage');
      browserStore.set('x', '1');
      component.logout();
      flushMicrotasks();
      expect(auth.logout).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/feedback'], {
        queryParams: { sl: 'HWC' },
      });
      expect(component.changeLanguage).toHaveBeenCalledWith('English');
      expect(session.clear).toHaveBeenCalled();
      expect(browserStore.size).toBe(0);
    }));

    it('logout keeps storage when navigation is cancelled', fakeAsync(() => {
      spyOn(router, 'navigate').and.returnValue(Promise.resolve(false));
      spyOn(component, 'changeLanguage');
      component.logout();
      flushMicrotasks();
      expect(component.changeLanguage).not.toHaveBeenCalled();
      expect(session.clear).not.toHaveBeenCalled();
    }));

    it('navigateToTeleMedicine delegates to the telemedicine service', () => {
      component.navigateToTeleMedicine();
      expect(telemedicine.routeToTeleMedecine).toHaveBeenCalled();
    });
  });

  describe('version details', () => {
    beforeEach(() => {
      setup();
      component.commitDetailsUI = { version: '3.0.0', commit: 'abc' };
    });

    it('opens the version dialog with API and UI details', () => {
      auth.getAPIVersionAndCommitDetails.and.returnValue(
        of({
          statusCode: 200,
          data: { 'git.build.version': '2.1', 'git.commit.id': 'def' },
        }),
      );
      component.showVersionAndCommitDetails();
      expect(dialog.open).toHaveBeenCalledWith(
        ShowCommitAndVersionDetailsComponent,
        {
          data: {
            commitDetailsUI: { version: '3.0.0', commit: 'abc' },
            commitDetailsAPI: { version: '2.1', commit: 'def' },
          },
        },
      );
    });

    it('uses NA when the API does not return version details', () => {
      component.constructAPIAndUIDetails({});
      expect(
        dialog.open.calls.mostRecent().args[1].data.commitDetailsAPI,
      ).toEqual({
        version: 'NA',
        commit: 'NA',
      });
    });

    it('does nothing for non-200 or failed API version calls', () => {
      auth.getAPIVersionAndCommitDetails.and.returnValue(
        of({ statusCode: 500 }),
      );
      component.showVersionAndCommitDetails();
      auth.getAPIVersionAndCommitDetails.and.returnValue(throwingObs());
      component.showVersionAndCommitDetails();
      expect(dialog.open).not.toHaveBeenCalled();
    });
  });

  it('openIOT opens the bluetooth dialog', () => {
    setup();
    component.openIOT();
    expect(dialog.open).toHaveBeenCalledWith(IotBluetoothComponent, {
      width: '600px',
    });
  });

  it('trackFieldInteraction reports to the tracking service', () => {
    setup();
    component.trackFieldInteraction('Nurse');
    expect(tracking.trackFieldInteraction).toHaveBeenCalledWith(
      'Nurse',
      'Roles',
    );
  });
});
