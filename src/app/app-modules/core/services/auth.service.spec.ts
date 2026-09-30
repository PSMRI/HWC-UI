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
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [AuthService],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('login without captcha', () => {
    service.login('u', 'p', false).subscribe();
    const req = httpMock.expectOne(environment.loginUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      userName: 'u',
      password: 'p',
      doLogout: false,
      withCredentials: true,
    });
    req.flush({});
  });

  it('login with captcha token', () => {
    service.login('u', 'p', true, 'tok').subscribe();
    const req = httpMock.expectOne(environment.loginUrl);
    expect(req.request.body.captchaToken).toBe('tok');
    expect(req.request.body.doLogout).toBeTrue();
    req.flush({});
  });

  it('userLogoutPreviousSession', () => {
    service.userLogoutPreviousSession('u').subscribe();
    const req = httpMock.expectOne(environment.userLogoutPreviousSessionUrl);
    expect(req.request.body).toEqual({ userName: 'u' });
    req.flush({});
  });

  it('getUserSecurityQuestionsAnswer lowercases name', () => {
    service.getUserSecurityQuestionsAnswer('ABC').subscribe();
    const req = httpMock.expectOne(
      environment.getUserSecurityQuestionsAnswerUrl,
    );
    expect(req.request.body).toEqual({ userName: 'abc' });
    req.flush({});
  });

  it('getSecurityQuestions GET', () => {
    service.getSecurityQuestions().subscribe();
    expect(
      httpMock.expectOne(environment.getSecurityQuestionUrl).request.method,
    ).toBe('GET');
  });

  it('saveUserSecurityQuestionsAnswer posts payload', () => {
    service.saveUserSecurityQuestionsAnswer([{ q: 1 }]).subscribe();
    const req = httpMock.expectOne(
      environment.saveUserSecurityQuestionsAnswerUrl,
    );
    expect(req.request.body).toEqual([{ q: 1 }]);
    req.flush({});
  });

  it('setNewPassword', () => {
    service.setNewPassword('u', 'pw', 't1').subscribe();
    const req = httpMock.expectOne(environment.setNewPasswordUrl);
    expect(req.request.body).toEqual({
      userName: 'u',
      password: 'pw',
      transactionId: 't1',
    });
    req.flush({});
  });

  it('validateSessionKey posts {}', () => {
    service.validateSessionKey().subscribe();
    const req = httpMock.expectOne(environment.getSessionExistsURL);
    expect(req.request.body).toEqual({});
    req.flush({});
  });

  it('logout posts empty string', () => {
    service.logout().subscribe();
    const req = httpMock.expectOne(environment.logoutUrl);
    expect(req.request.body).toBe('');
    req.flush({});
  });

  it('getSwymedLogout GET', () => {
    service.getSwymedLogout().subscribe();
    httpMock.expectOne(environment.getSwymedLogoutUrl).flush({});
    expect(service.sessionExpiredHandled).toBeFalse();
  });

  it('getUIVersionAndCommitDetails GETs given url', () => {
    service.getUIVersionAndCommitDetails('version.json').subscribe();
    expect(httpMock.expectOne('version.json').request.method).toBe('GET');
  });

  it('getAPIVersionAndCommitDetails GET', () => {
    service.getAPIVersionAndCommitDetails().subscribe();
    expect(httpMock.expectOne(environment.apiVersionUrl).request.method).toBe(
      'GET',
    );
  });

  it('validateSecurityQuestionAndAnswer', () => {
    service.validateSecurityQuestionAndAnswer([1], 'u').subscribe();
    const req = httpMock.expectOne(environment.validateSecurityQuestions);
    expect(req.request.body).toEqual({ SecurityQuesAns: [1], userName: 'u' });
    req.flush({});
  });

  it('getTransactionIdForChangePassword', () => {
    service.getTransactionIdForChangePassword('u').subscribe();
    const req = httpMock.expectOne(environment.getTransacIDForPasswordChange);
    expect(req.request.body).toEqual({ userName: 'u' });
    req.flush({});
  });
});
