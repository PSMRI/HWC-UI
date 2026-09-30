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
import { of } from 'rxjs';
import {
  COMMON_TEST_IMPORTS,
  NO_ERRORS_SCHEMA,
  autoSpy,
  commonTestProviders,
  throwingObs,
} from 'src/testing/test-utils';
import { AuthService } from 'src/app/app-modules/core/services/auth.service';
import { ConfirmationService } from 'src/app/app-modules/core/services/confirmation.service';
import { SessionStorageService } from 'Common-UI/src/registrar/services/session-storage.service';
import { ResetPasswordComponent } from './reset-password.component';

const QUESTIONS = [
  { question: 'Q1', questionId: 1 },
  { question: 'Q2', questionId: 2 },
  { question: 'Q3', questionId: 3 },
];

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let auth: any;
  let confirm: any;
  let session: any;
  let navigate: jasmine.Spy;
  let saved: Record<string, string>;

  beforeEach(async () => {
    saved = {};
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i) as string;
      saved[k] = sessionStorage.getItem(k) as string;
    }
    auth = autoSpy(AuthService);
    auth.logout.and.returnValue(of({}));
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [ResetPasswordComponent],
      providers: [
        ...commonTestProviders(),
        { provide: AuthService, useValue: auth },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    confirm = TestBed.inject(ConfirmationService);
    session = TestBed.inject(SessionStorageService);
    navigate = spyOn(TestBed.inject(Router), 'navigate').and.returnValue(
      Promise.resolve(true),
    );
    fixture.detectChanges();
  });

  afterEach(() => {
    sessionStorage.clear();
    Object.entries(saved).forEach(([k, v]) => sessionStorage.setItem(k, v));
  });

  function loadQuestions() {
    auth.getUserSecurityQuestionsAnswer.and.returnValue(
      of({ data: { SecurityQuesAns: QUESTIONS } }),
    );
    component.getQuestions('nurse1');
  }

  it('toggles password visibility', () => {
    component.showPWD();
    expect(component.dynamictype).toBe('text');
    component.hidePWD();
    expect(component.dynamictype).toBe('password');
  });

  describe('getQuestions', () => {
    it('stores user name and shows the first question', () => {
      loadQuestions();
      expect(session.setItem).toHaveBeenCalledWith('userName', 'nurse1');
      expect(auth.getUserSecurityQuestionsAnswer).toHaveBeenCalledWith(
        'nurse1',
      );
      expect(component.showQuestions).toBeTrue();
      expect(component.hideOnGettingQuestions).toBeFalse();
      expect(component.questions).toEqual(['Q1', 'Q2', 'Q3']);
      expect(component.questionId).toEqual([1, 2, 3]);
      expect(component.bufferQuestion).toBe('Q1');
      expect(component.bufferQuestionId).toBe(1);
    });

    it('ignores a null response', () => {
      auth.getUserSecurityQuestionsAnswer.and.returnValue(of(null));
      component.getQuestions('x');
      expect(component.showQuestions).toBeFalse();
    });

    it('stores the error', () => {
      auth.getUserSecurityQuestionsAnswer.and.returnValue(throwingObs('err'));
      component.getQuestions('x');
      expect(component.error).toBe('err');
    });

    it('alerts and logs out when no questions are set', fakeAsync(() => {
      auth.getUserSecurityQuestionsAnswer.and.returnValue(
        of({ data: { SecurityQuesAns: [] } }),
      );
      component.getQuestions('x');
      expect(confirm.alert).toHaveBeenCalledWith(
        'Questions are not set for this user',
        'error',
      );
      flushMicrotasks();
      expect(auth.logout).toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledWith(['/login']);
      expect(session.clear).toHaveBeenCalled();
    }));

    it('logs out for an unknown user', fakeAsync(() => {
      auth.getUserSecurityQuestionsAnswer.and.returnValue(
        of({ data: { forgetPassword: 'user Not Found' } }),
      );
      component.getQuestions('x');
      flushMicrotasks();
      expect(auth.logout).toHaveBeenCalled();
      expect(confirm.alert).not.toHaveBeenCalled();
    }));
  });

  it('logout keeps storage when navigation fails', fakeAsync(() => {
    navigate.and.returnValue(Promise.resolve(false));
    component.logout();
    flushMicrotasks();
    expect(session.clear).not.toHaveBeenCalled();
  }));

  describe('answering', () => {
    beforeEach(() => loadQuestions());

    function answerAll() {
      ['a1', 'a2', 'a3'].forEach((a) => {
        component.answer = a;
        component.nextQuestion();
      });
    }

    it('advances through questions and clears the answer', () => {
      auth.validateSecurityQuestionAndAnswer.and.returnValue(of(undefined));
      component.answer = 'a1';
      component.nextQuestion();
      expect(component.counter).toBe(1);
      expect(component.bufferQuestion).toBe('Q2');
      expect(component.answer).toBeUndefined();
      expect(component.userFinalAnswers).toEqual([
        { questionId: 1, answer: 'a1' },
      ]);
    });

    it('validates all answers and goes to set-password on success', () => {
      session.store.set('userName', 'nurse1');
      auth.validateSecurityQuestionAndAnswer.and.returnValue(
        of({ statusCode: 200, data: { transactionId: 'tx-9' } }),
      );
      answerAll();
      expect(auth.validateSecurityQuestionAndAnswer).toHaveBeenCalledWith(
        [
          { questionId: 1, answer: 'a1' },
          { questionId: 2, answer: 'a2' },
          { questionId: 3, answer: 'a3' },
        ],
        'nurse1',
      );
      expect(component.counter).toBe(0);
      expect(navigate).toHaveBeenCalledWith(['/set-password']);
      expect(auth.transactionId).toBe('tx-9');
      expect(component.userFinalAnswers).toEqual([]);
      expect(component.answer).toBeUndefined();
    });

    it('does nothing once the counter reaches 3', () => {
      component.counter = 3;
      component.nextQuestion();
      expect(component.userFinalAnswers).toEqual([]);
    });

    it('re-fetches questions on wrong answers', () => {
      auth.validateSecurityQuestionAndAnswer.and.returnValue(
        of({ statusCode: 5000, errorMessage: 'wrong' }),
      );
      answerAll();
      expect(confirm.alert).toHaveBeenCalledWith('wrong', 'error');
      expect(auth.getUserSecurityQuestionsAnswer).toHaveBeenCalledTimes(2);
      expect(navigate).toHaveBeenCalledWith(['/reset-password']);
      expect(component.counter).toBe(0);
      expect(component.showQuestions).toBeTrue();
      expect(component.bufferQuestion).toBe('Q1');
    });

    it('ignores a null validation response', () => {
      auth.validateSecurityQuestionAndAnswer.and.returnValue(of(null));
      answerAll();
      expect(navigate).not.toHaveBeenCalled();
      expect(component.counter).toBe(3);
    });

    it('alerts and restarts on validation error', () => {
      auth.validateSecurityQuestionAndAnswer.and.returnValue(
        throwingObs({ errorMessage: 'down' }),
      );
      answerAll();
      expect(confirm.alert).toHaveBeenCalledWith('down', 'error');
      expect(navigate).toHaveBeenCalledWith(['/reset-password']);
      expect(component.counter).toBe(0);
      expect(component.bufferQuestion).toBe('Q1');
    });
  });
});
