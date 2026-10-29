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
import { TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {
  HttpErrorResponse,
  HttpRequest,
  HttpResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HttpInterceptorService } from './http-interceptor.service';
import { SpinnerService } from './spinner.service';
import { ConfirmationService } from './confirmation.service';
import { AuthService } from './auth.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { commonTestProviders, LANGUAGE_EN } from 'src/testing/test-utils';

describe('HttpInterceptorService', () => {
  let svc: HttpInterceptorService;
  let router: any;
  let routerEvents: Subject<any>;
  let confirmation: any;
  let spinner: SpinnerService;
  let session: any;
  let httpMock: HttpTestingController;
  let handled: HttpRequest<any> | undefined;
  let dialogResult: any;

  const okHandler = (body: any = { statusCode: 200 }) => ({
    handle: (r: HttpRequest<any>) => {
      handled = r;
      return of(new HttpResponse({ status: 200, body }));
    },
  });
  const errHandler = (status: number) => ({
    handle: (r: HttpRequest<any>) => {
      handled = r;
      return throwError(() => new HttpErrorResponse({ status }));
    },
  });

  beforeEach(() => {
    handled = undefined;
    dialogResult = undefined;
    routerEvents = new Subject();
    router = {
      events: routerEvents,
      navigate: jasmine.createSpy('navigate').and.resolveTo(true),
    };
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ...commonTestProviders(),
        HttpInterceptorService,
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: {} },
      ],
    });
    svc = TestBed.inject(HttpInterceptorService);
    confirmation = TestBed.inject(ConfirmationService);
    confirmation.alert.and.callFake(() => ({
      afterClosed: () => of(dialogResult),
    }));
    spinner = TestBed.inject(SpinnerService);
    session = TestBed.inject(SessionStorageService);
    httpMock = TestBed.inject(HttpTestingController);
    spyOn(console, 'log');
    spyOn(console, 'error');
  });

  afterEach(() => {
    sessionStorage.removeItem('key');
    sessionStorage.removeItem('authenticationToken');
    sessionStorage.removeItem('isAuthenticated');
  });

  const req = (url: string, headers?: HttpHeaders) =>
    new HttpRequest<any>('GET', url, { headers });

  describe('request headers', () => {
    it('loads language set once', () => {
      svc.intercept(req('a'), okHandler() as any).subscribe();
      expect(svc.currentLanguageSet).toBe(LANGUAGE_EN);
      svc.currentLanguageSet = { x: 1 };
      svc.intercept(req('a'), okHandler() as any).subscribe();
      expect(svc.currentLanguageSet).toEqual({ x: 1 });
    });

    it('sets empty Authorization when no key', () => {
      svc.intercept(req('api/x'), okHandler() as any).subscribe();
      expect(handled!.headers.get('Authorization')).toBe('');
    });

    it('sets Authorization key and content type when key present', () => {
      sessionStorage.setItem('key', 'KEY1');
      svc.intercept(req('api/x'), okHandler() as any).subscribe();
      expect(handled!.headers.get('Authorization')).toBe('KEY1');
      expect(handled!.headers.get('Content-Type')).toBe('application/json');
    });

    it('strips Authorization for platform-feedback', () => {
      sessionStorage.setItem('key', 'KEY1');
      svc
        .intercept(
          req('x/Platform-Feedback/y', new HttpHeaders({ Authorization: 'z' })),
          okHandler() as any,
        )
        .subscribe();
      expect(handled!.headers.has('Authorization')).toBeFalse();
      expect(handled!.headers.get('Content-Type')).toBe('application/json');
    });
  });

  describe('spinner', () => {
    it('sets loading true then false on finalize', () => {
      const calls: boolean[] = [];
      spyOn(spinner, 'setLoading').and.callFake((v) => calls.push(v));
      svc.intercept(req('api/x'), okHandler() as any).subscribe();
      expect(calls).toEqual([true, false]);
    });

    it('does not show loading for cti/getAgentState', () => {
      const calls: boolean[] = [];
      spyOn(spinner, 'setLoading').and.callFake((v) => calls.push(v));
      svc.intercept(req('cti/getAgentState'), okHandler() as any).subscribe();
      expect(calls).toEqual([false]);
    });
  });

  describe('success responses', () => {
    it('starts 27 minute timer for authenticated responses and warns', fakeAsync(() => {
      sessionStorage.setItem('authenticationToken', 't');
      sessionStorage.setItem('isAuthenticated', 'true');
      dialogResult = { action: 'none' };
      svc.intercept(req('api/x'), okHandler() as any).subscribe();
      tick(27 * 60 * 1000 - 1);
      expect(confirmation.alert).not.toHaveBeenCalled();
      tick(1);
      expect(confirmation.alert).toHaveBeenCalledWith(
        'Your session is about to Expire. Do you need more time ? ',
        'sessionTimeOut',
      );
    }));

    it('does not start timer without auth token', fakeAsync(() => {
      svc.intercept(req('api/x'), okHandler() as any).subscribe();
      tick(28 * 60 * 1000);
      expect(confirmation.alert).not.toHaveBeenCalled();
    }));

    it('does not start timer for login / platform-feedback urls', fakeAsync(() => {
      sessionStorage.setItem('authenticationToken', 't');
      sessionStorage.setItem('isAuthenticated', 'true');
      svc
        .intercept(req('user/userAuthenticate'), okHandler() as any)
        .subscribe();
      svc.intercept(req('a/platform-feedback'), okHandler() as any).subscribe();
      tick(28 * 60 * 1000);
      expect(confirmation.alert).not.toHaveBeenCalled();
    }));

    it('warning is skipped when isAuthenticated missing at timeout', fakeAsync(() => {
      sessionStorage.setItem('authenticationToken', 't');
      svc.intercept(req('api/x'), okHandler() as any).subscribe();
      tick(27 * 60 * 1000);
      expect(confirmation.alert).not.toHaveBeenCalled();
    }));

    it('statusCode 5002 triggers session expiry with errorMessage', fakeAsync(() => {
      sessionStorage.setItem('x-test', '1');
      svc
        .intercept(
          req('api/x'),
          okHandler({ statusCode: 5002, errorMessage: 'Expired!' }) as any,
        )
        .subscribe();
      expect(svc.isSessionExpiryInProgress()).toBeTrue();
      expect(sessionStorage.getItem('x-test')).toBeNull();
      expect(session.clear).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
      tick(300);
      expect(confirmation.alert).toHaveBeenCalledWith('Expired!', 'error');
    }));

    it('statusCode 5002 on userAuthenticate is ignored', () => {
      svc
        .intercept(
          req('user/userAuthenticate'),
          okHandler({ statusCode: 5002 }) as any,
        )
        .subscribe();
      expect(svc.isSessionExpiryInProgress()).toBeFalse();
    });

    it('5002 without errorMessage uses language string', fakeAsync(() => {
      svc
        .intercept(req('api/x'), okHandler({ statusCode: 5002 }) as any)
        .subscribe();
      tick(300);
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.sessionExpiredPleaseLogin ||
          'Session has expired, please login again.',
        'error',
      );
    }));

    it('5000 redis error triggers session expiry', fakeAsync(() => {
      svc
        .intercept(
          req('api/x'),
          okHandler({
            statusCode: 5000,
            errorMessage: 'Unable to fetch session object from Redis server',
          }) as any,
        )
        .subscribe();
      expect(svc.isSessionExpiryInProgress()).toBeTrue();
      tick(300);
      expect(confirmation.alert).toHaveBeenCalled();
    }));

    it('other 5000 errors do not expire session', () => {
      svc
        .intercept(
          req('api/x'),
          okHandler({ statusCode: 5000, errorMessage: 'x' }) as any,
        )
        .subscribe();
      expect(svc.isSessionExpiryInProgress()).toBeFalse();
    });

    it('does not re-handle expiry while already handling', fakeAsync(() => {
      svc
        .intercept(req('api/x'), okHandler({ statusCode: 5002 }) as any)
        .subscribe();
      tick(300);
      svc
        .intercept(req('api/x'), okHandler({ statusCode: 5002 }) as any)
        .subscribe();
      tick(300);
      expect(router.navigate).toHaveBeenCalledTimes(1);
      expect(confirmation.alert).toHaveBeenCalledTimes(1);
    }));
  });

  describe('error responses', () => {
    it('401 expires session and completes silently', fakeAsync(() => {
      let errored = false;
      let completed = false;
      svc.intercept(req('api/x'), errHandler(401) as any).subscribe({
        error: () => (errored = true),
        complete: () => (completed = true),
      });
      expect(errored).toBeFalse();
      expect(completed).toBeTrue();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
      tick(300);
      expect(confirmation.alert).toHaveBeenCalledWith(
        jasmine.any(String),
        'error',
      );
    }));

    it('403 shows access denied', fakeAsync(() => {
      svc.intercept(req('api/x'), errHandler(403) as any).subscribe();
      tick(300);
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.accessDenied ||
          'Access Denied. You do not have permission to access this resource.',
        'error',
      );
    }));

    it('other errors are rethrown', () => {
      let err: any;
      svc
        .intercept(req('api/x'), errHandler(500) as any)
        .subscribe({ error: (e) => (err = e) });
      expect(err.status).toBe(500);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('401 while already handling expiry is rethrown', fakeAsync(() => {
      svc.intercept(req('api/x'), errHandler(401) as any).subscribe();
      tick(300);
      let err: any;
      svc
        .intercept(req('api/x'), errHandler(401) as any)
        .subscribe({ error: (e) => (err = e) });
      expect(err.status).toBe(401);
    }));
  });

  describe('handleSessionExpiry edge cases', () => {
    it('logs when navigation fails', fakeAsync(() => {
      router.navigate.and.resolveTo(false);
      (svc as any).handleSessionExpiry('msg');
      tick(300);
      expect(console.error).toHaveBeenCalledWith('Navigation to login failed');
      expect(confirmation.alert).toHaveBeenCalledWith('msg', 'error');
    }));

    it('logs navigation rejection', fakeAsync(() => {
      router.navigate.and.returnValue(Promise.reject('nav'));
      (svc as any).handleSessionExpiry('msg');
      tick(300);
      expect(console.error).toHaveBeenCalledWith('Navigation error:', 'nav');
    }));

    it('logs synchronous navigate exception', () => {
      router.navigate.and.throwError('sync');
      (svc as any).handleSessionExpiry('msg');
      expect(console.error).toHaveBeenCalledWith(
        'Error during session expiry handling:',
        jasmine.any(Error),
      );
    });

    it('logs dialog errors', fakeAsync(() => {
      confirmation.alert.and.returnValue({
        afterClosed: () => throwError(() => 'dlg'),
      });
      (svc as any).handleSessionExpiry('msg');
      tick(300);
      expect(console.error).toHaveBeenCalledWith('Error in dialog:', 'dlg');
    }));

    it('logs when alert throws', fakeAsync(() => {
      confirmation.alert.and.throwError('boom');
      (svc as any).handleSessionExpiry('msg');
      tick(300);
      expect(console.error).toHaveBeenCalledWith(
        'Failed to show session expiry dialog:',
        jasmine.any(Error),
      );
    }));

    it('router /login event resets state', fakeAsync(() => {
      (svc as any).handleSessionExpiry('msg');
      tick(300);
      expect(svc.isSessionExpiryInProgress()).toBeTrue();
      routerEvents.next({ url: '/other' });
      expect(svc.isSessionExpiryInProgress()).toBeTrue();
      routerEvents.next({ url: '/login' });
      expect(svc.isSessionExpiryInProgress()).toBeFalse();
    }));
  });

  describe('getErrorMessage', () => {
    const fallback = () => LANGUAGE_EN.sessionExpiredPleaseLogin;
    beforeEach(() => (svc.currentLanguageSet = LANGUAGE_EN));
    const gm = (e: any) => (svc as any).getErrorMessage(e);

    it('handles strings', () => {
      expect(gm('hello')).toBe('hello');
      expect(gm('   ')).toBe(fallback());
    });

    it('handles objects', () => {
      expect(gm({ message: 'm' })).toBe('m');
      expect(gm({ errorMessage: 'em' })).toBe('em');
      expect(gm({ error: 'e' })).toBe('e');
      expect(gm({})).toBe(fallback());
      expect(gm(null)).toBe(fallback());
    });

    it('uses hardcoded fallback without language set', () => {
      svc.currentLanguageSet = undefined;
      expect(gm(123)).toBe('Your session has expired. Please login again.');
    });

    it('returns fallback when extraction throws', () => {
      const bad = {};
      Object.defineProperty(bad, 'message', {
        get: () => {
          throw new Error('x');
        },
      });
      expect(gm(bad)).toBe(fallback());
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('session expiry warning dialog', () => {
    const arm = () => {
      sessionStorage.setItem('authenticationToken', 't');
      sessionStorage.setItem('isAuthenticated', 'true');
      svc.intercept(req('api/x'), okHandler() as any).subscribe();
      tick(27 * 60 * 1000);
    };

    it('continue extends session and restarts timer', fakeAsync(() => {
      dialogResult = { action: 'continue' };
      arm();
      const r = httpMock.expectOne(environment.extendSessionUrl);
      expect(r.request.method).toBe('POST');
      r.flush({});
      expect(confirmation.alert).toHaveBeenCalledTimes(1);
      tick(27 * 60 * 1000);
      expect(confirmation.alert).toHaveBeenCalledTimes(2);
      httpMock.expectOne(environment.extendSessionUrl).flush({});
      flush();
    }));

    it('continue still restarts timer on extend failure', fakeAsync(() => {
      dialogResult = { action: 'continue' };
      arm();
      httpMock
        .expectOne(environment.extendSessionUrl)
        .flush('x', { status: 500, statusText: 'err' });
      expect(console.error).toHaveBeenCalledWith(
        'Failed to extend session:',
        jasmine.anything(),
      );
      dialogResult = { action: 'none' };
      tick(27 * 60 * 1000);
      expect(confirmation.alert).toHaveBeenCalledTimes(2);
    }));

    it('timeout clears session and navigates', fakeAsync(() => {
      dialogResult = { action: 'timeout' };
      arm();
      expect(sessionStorage.getItem('authenticationToken')).toBeNull();
      expect(session.clear).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.sessionExpired ||
          'Session has expired, please login again.',
        'error',
      );
    }));

    it('cancel logs out after remaining time', fakeAsync(() => {
      dialogResult = { action: 'cancel', remainingTime: 5 };
      arm();
      expect(router.navigate).not.toHaveBeenCalled();
      tick(5000);
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
      expect(session.clear).toHaveBeenCalled();
    }));

    it('timeout without language set uses default text', fakeAsync(() => {
      dialogResult = { action: 'timeout' };
      svc.currentLanguageSet = {};
      arm();
      expect(confirmation.alert).toHaveBeenCalledWith(
        'Session has expired, please login again.',
        'error',
      );
    }));

    it('skips warning while expiry is being handled', fakeAsync(() => {
      sessionStorage.setItem('authenticationToken', 't');
      sessionStorage.setItem('isAuthenticated', 'true');
      svc.intercept(req('api/x'), okHandler() as any).subscribe();
      (svc as any).isHandlingSessionExpiry = true;
      tick(27 * 60 * 1000);
      expect(confirmation.alert).not.toHaveBeenCalled();
    }));
  });
});
