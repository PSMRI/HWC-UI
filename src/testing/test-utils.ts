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

/**
 * Shared helpers for HWC-UI unit tests.
 *
 * Typical component setup:
 *
 *   await TestBed.configureTestingModule({
 *     imports: [...COMMON_TEST_IMPORTS],
 *     declarations: [MyComponent],
 *     providers: [
 *       ...commonTestProviders(),
 *       { provide: DoctorService, useValue: autoSpy(DoctorService) },
 *     ],
 *     schemas: [NO_ERRORS_SCHEMA],
 *   }).compileComponents();
 */
import { NO_ERRORS_SCHEMA, Provider, Type } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';

import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { ConfirmationService } from 'src/app/app-modules/core/services/confirmation.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { AmritTrackingService } from 'Common-UI/src/tracking';
import englishJson from 'src/assets/English.json';

export { NO_ERRORS_SCHEMA };

/** The real English language set, as components receive it from HttpServiceService. */
export const LANGUAGE_EN: any = (englishJson as any).English;

/** Default payload returned by auto-spied service methods. */
export const OK_RESPONSE = { statusCode: 200, data: {} };

export type SpyOf<T> = T & { [K in keyof T]: T[K] & jasmine.Spy };

/**
 * Creates a spy object for every prototype method of `cls`.
 * Each spy returns `of(defaultReturn)` so subscribe() calls work out of the box;
 * override per test with `spy.method.and.returnValue(...)`.
 * Extra instance properties (subjects, flags) can be supplied via `props`.
 */
export function autoSpy<T>(
  cls: Type<T>,
  props: Partial<Record<keyof T | string, any>> = {},
  defaultReturn: any = OK_RESPONSE,
): SpyOf<T> {
  const obj: any = {};
  let proto = cls.prototype;
  while (proto && proto !== Object.prototype) {
    for (const name of Object.getOwnPropertyNames(proto)) {
      if (name === 'constructor' || name in obj) continue;
      const desc = Object.getOwnPropertyDescriptor(proto, name);
      if (desc && typeof desc.value === 'function') {
        obj[name] = jasmine
          .createSpy(`${cls.name}.${name}`)
          .and.callFake(() => of(defaultReturn));
      }
    }
    proto = Object.getPrototypeOf(proto);
  }
  Object.assign(obj, props);
  return obj as SpyOf<T>;
}

/** HttpServiceService mock that emits the English language set. */
export function createHttpServiceMock(language: any = LANGUAGE_EN) {
  const subject = new BehaviorSubject<any>(language);
  const listeners = new Subject<any>();
  return {
    language,
    appCurrentLanguge: subject,
    currentLangugae$: subject.asObservable(),
    listen: jasmine
      .createSpy('listen')
      .and.callFake(() => listeners.asObservable()),
    filter: jasmine
      .createSpy('filter')
      .and.callFake((v: any) => listeners.next(v)),
    fetchLanguageSet: jasmine
      .createSpy('fetchLanguageSet')
      .and.returnValue(of({})),
    getCurrentLanguage: jasmine
      .createSpy('getCurrentLanguage')
      .and.callFake((lang: any) => subject.next(lang)),
  };
}

/** In-memory SessionStorageService mock. Seed values via `initial`. */
export function createSessionStorageMock(initial: Record<string, any> = {}) {
  const store = new Map<string, any>(Object.entries(initial));
  return {
    store,
    getItem: jasmine
      .createSpy('getItem')
      .and.callFake((k: string) => (store.has(k) ? store.get(k) : null)),
    setItem: jasmine
      .createSpy('setItem')
      .and.callFake((k: string, v: any) => store.set(k, v)),
    removeItem: jasmine
      .createSpy('removeItem')
      .and.callFake((k: string) => store.delete(k)),
    clear: jasmine.createSpy('clear').and.callFake(() => store.clear()),
  };
}

/**
 * ConfirmationService mock. Every dialog resolves immediately with `result`
 * (default true). Override per call: `confirmation.confirm.and.returnValue(of(false))`.
 */
export function createConfirmationMock(result: any = true) {
  const methods = [
    'confirm',
    'confirmHealthId',
    'alert',
    'remarks',
    'editRemarks',
    'notify',
    'choice',
    'startTimer',
    'choiceSelect',
    'alertFetsenseMessage',
    'confirmCalibration',
    'confirmCBAC',
    'confirmCareContext',
  ];
  const obj: any = {};
  methods.forEach(
    (m) =>
      (obj[m] = jasmine
        .createSpy(`ConfirmationService.${m}`)
        .and.returnValue(of(result))),
  );
  return obj;
}

/** MatDialogRef mock whose afterClosed() emits `result`. */
export function createDialogRefMock(result: any = undefined) {
  return {
    close: jasmine.createSpy('close'),
    afterClosed: jasmine.createSpy('afterClosed').and.returnValue(of(result)),
    afterOpened: jasmine
      .createSpy('afterOpened')
      .and.returnValue(of(undefined)),
    beforeClosed: jasmine.createSpy('beforeClosed').and.returnValue(of(result)),
    backdropClick: jasmine
      .createSpy('backdropClick')
      .and.returnValue(of(undefined)),
    keydownEvents: jasmine.createSpy('keydownEvents').and.returnValue(of()),
    updateSize: jasmine.createSpy('updateSize'),
    updatePosition: jasmine.createSpy('updatePosition'),
    disableClose: false,
    componentInstance: {} as any,
  };
}

/** MatDialog mock; open() returns a dialog ref whose afterClosed() emits `result`. */
export function createMatDialogMock(result: any = undefined) {
  return {
    open: jasmine
      .createSpy('MatDialog.open')
      .and.callFake(() => createDialogRefMock(result)),
    closeAll: jasmine.createSpy('closeAll'),
    openDialogs: [],
    afterAllClosed: of(undefined),
  };
}

export function createTrackingMock() {
  return autoSpy(AmritTrackingService, {}, undefined) as any;
}

/** Modules almost every component spec needs. */
export const COMMON_TEST_IMPORTS = [
  HttpClientTestingModule,
  RouterTestingModule,
  NoopAnimationsModule,
  FormsModule,
  ReactiveFormsModule,
];

/**
 * Providers for the services injected by most components.
 * Pass overrides to seed session storage or change dialog results.
 */
export function commonTestProviders(
  opts: {
    session?: Record<string, any>;
    language?: any;
    dialogResult?: any;
    dialogData?: any;
  } = {},
): Provider[] {
  return [
    DatePipe,
    {
      provide: HttpServiceService,
      useValue: createHttpServiceMock(opts.language),
    },
    {
      provide: SessionStorageService,
      useValue: createSessionStorageMock(opts.session),
    },
    { provide: ConfirmationService, useValue: createConfirmationMock() },
    { provide: AmritTrackingService, useValue: createTrackingMock() },
    { provide: MatDialog, useValue: createMatDialogMock(opts.dialogResult) },
    { provide: MatDialogRef, useValue: createDialogRefMock(opts.dialogResult) },
    { provide: MAT_DIALOG_DATA, useValue: opts.dialogData ?? {} },
    {
      provide: MatSnackBar,
      useValue: { open: jasmine.createSpy('snackbar.open') },
    },
  ];
}

/** Convenience: typed access to a provider mock from TestBed. */
export function asSpy<T = any>(value: unknown): SpyOf<T> {
  return value as SpyOf<T>;
}

/** Observable that errors — for exercising error callbacks. */
export function throwingObs(err: any = { status: 500, error: 'boom' }) {
  return new Observable((s) => s.error(err));
}
