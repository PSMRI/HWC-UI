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
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
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
import { SetSecurityQuestionsComponent } from './set-security-questions.component';

const QUESTIONS = [
  { QuestionID: 1, Question: 'Q1' },
  { QuestionID: 2, Question: 'Q2' },
  { QuestionID: 3, Question: 'Q3' },
  { QuestionID: 4, Question: 'Q4' },
];

describe('SetSecurityQuestionsComponent', () => {
  let component: SetSecurityQuestionsComponent;
  let fixture: ComponentFixture<SetSecurityQuestionsComponent>;
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
    auth.getSecurityQuestions.and.returnValue(of({ data: QUESTIONS }));
    auth.logout.and.returnValue(of({}));
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS, MatSelectModule, MatInputModule],
      declarations: [SetSecurityQuestionsComponent],
      providers: [
        ...commonTestProviders({ session: { userID: 42, userName: 'nurse1' } }),
        { provide: AuthService, useValue: auth },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(SetSecurityQuestionsComponent);
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

  it('loads user and questions on init', () => {
    expect(component.uid).toBe(42);
    expect(component.uname).toBe('nurse1');
    expect(component.questions).toEqual(QUESTIONS);
    expect(component.replica_questions).toEqual(QUESTIONS);
    expect(component.Q_array_one).toEqual(QUESTIONS);
    expect(component.Q_array_two).toEqual(QUESTIONS);
  });

  it('handles question load errors', () => {
    const log = spyOn(console, 'log');
    auth.getSecurityQuestions.and.returnValue(throwingObs('x'));
    component.questions = [];
    component.ngOnInit();
    expect(log).toHaveBeenCalledWith('error', []);
  });

  it('toggles password visibility and switches section', () => {
    component.showPWD();
    expect(component.dynamictype).toBe('text');
    component.hidePWD();
    expect(component.dynamictype).toBe('password');
    component.switch();
    expect(component.passwordSection).toBeTrue();
    expect(component.questionsection).toBeFalse();
  });

  it('accessors', () => {
    component.keySize = 128;
    component.iterationCount = 7;
    expect(component.keySize).toBe(128);
    expect(component.iterationCount).toBe(7);
  });

  it('password pattern enforces complexity', () => {
    expect(component.passwordPattern.test('Abcdef1!')).toBeTrue();
    expect(component.passwordPattern.test('abcdefg1')).toBeFalse();
  });

  describe('updateQuestions', () => {
    it('stores each new question and clears its answer', () => {
      component.answer1 = 'a';
      component.answer2 = 'b';
      component.answer3 = 'c';
      component.updateQuestions(1, 0);
      component.updateQuestions(2, 1);
      component.updateQuestions(3, 2);
      expect(component.selectedQuestions).toEqual([1, 2, 3]);
      expect([component.answer1, component.answer2, component.answer3]).toEqual(
        ['', '', ''],
      );
    });

    it('alerts when a question is picked twice in different positions', () => {
      component.updateQuestions(1, 0);
      component.updateQuestions(1, 1);
      expect(confirm.alert).toHaveBeenCalledWith(
        'This question is already selected. Choose unique question',
      );
    });

    it('does not alert when re-selecting in the same position', () => {
      component.updateQuestions(1, 0);
      component.updateQuestions(1, 0);
      expect(confirm.alert).not.toHaveBeenCalled();
    });
  });

  describe('filters', () => {
    it('filter_function removes the given question', () => {
      expect(
        component.filter_function(2, QUESTIONS).map((q: any) => q.QuestionID),
      ).toEqual([1, 3, 4]);
    });

    it('filterArrayOne filters arrays one and two', () => {
      component.filterArrayOne(1);
      expect(component.Q_array_one.length).toBe(3);
      expect(component.Q_array_two.length).toBe(3);
      expect(component.questions.length).toBe(4);
    });

    it('filterArrayTwo filters array two and the primary list', () => {
      component.filterArrayTwo(2);
      expect(component.Q_array_two.length).toBe(3);
      expect(component.questions.length).toBe(3);
      expect(component.Q_array_one.length).toBe(4);
    });

    it('filterArrayThree filters array one and the primary list', () => {
      component.filterArrayThree(3);
      expect(component.Q_array_one.length).toBe(3);
      expect(component.questions.length).toBe(3);
      expect(component.Q_array_two.length).toBe(4);
    });
  });

  describe('setSecurityQuestions', () => {
    it('builds the request and switches to the password section', () => {
      component.selectedQuestions = [1, 2, 3];
      component.question1 = 1;
      component.question2 = 2;
      component.question3 = 3;
      component.answer1 = 'a';
      component.answer2 = 'b';
      component.answer3 = 'c';
      component.setSecurityQuestions();
      expect(component.dataArray).toEqual([
        {
          userID: 42,
          questionID: 1,
          answers: 'a',
          mobileNumber: '1234567890',
          createdBy: 'nurse1',
        },
        {
          userID: 42,
          questionID: 2,
          answers: 'b',
          mobileNumber: '1234567890',
          createdBy: 'nurse1',
        },
        {
          userID: 42,
          questionID: 3,
          answers: 'c',
          mobileNumber: '1234567890',
          createdBy: 'nurse1',
        },
      ]);
      expect(component.passwordSection).toBeTrue();
    });

    it('alerts when fewer than 3 questions are chosen', () => {
      component.selectedQuestions = [1];
      component.setSecurityQuestions();
      expect(confirm.alert).toHaveBeenCalledWith(
        'All 3 questions should be different. Please check your selected questions',
      );
      expect(component.passwordSection).toBeFalse();
    });
  });

  describe('updatePassword', () => {
    beforeEach(() => {
      component.dataArray = [{ questionID: 1 }];
    });

    it('alerts when passwords differ', () => {
      component.confirmpwd = 'b';
      component.updatePassword('a');
      expect(confirm.alert).toHaveBeenCalledWith("Password doesn't match");
      expect(auth.saveUserSecurityQuestionsAnswer).not.toHaveBeenCalled();
    });

    it('saves questions, sets the password, alerts and logs out', fakeAsync(() => {
      component.confirmpwd = 'Secret@1';
      auth.saveUserSecurityQuestionsAnswer.and.returnValue(
        of({ statusCode: 200, data: { transactionId: 'tx-5' } }),
      );
      auth.setNewPassword.and.returnValue(of({ statusCode: 200 }));
      component.updatePassword('Secret@1');
      expect(auth.saveUserSecurityQuestionsAnswer).toHaveBeenCalledWith([
        { questionID: 1 },
      ]);
      const [user, pwd, tx] = auth.setNewPassword.calls.mostRecent().args;
      expect(user).toBe('nurse1');
      expect(pwd).toBe(component.encryptedConfirmPwd);
      expect(/^[0-9a-f]{96}/.test(pwd)).toBeTrue();
      expect(tx).toBe('tx-5');
      expect(confirm.alert).toHaveBeenCalledWith(
        'Password changed successfully',
        'success',
      );
      flushMicrotasks();
      expect(navigate).toHaveBeenCalledWith(['/login']);
      expect(session.clear).toHaveBeenCalled();
    }));

    it('logs when setting the password fails', () => {
      const log = spyOn(console, 'log');
      component.confirmpwd = 'Secret@1';
      auth.saveUserSecurityQuestionsAnswer.and.returnValue(
        of({ statusCode: 200, data: { transactionId: 'tx-5' } }),
      );
      auth.setNewPassword.and.returnValue(throwingObs('fail'));
      component.updatePassword('Secret@1');
      expect(log).toHaveBeenCalledWith('fail');
      expect(auth.logout).not.toHaveBeenCalled();
    });

    it('alerts when saving questions returns no transaction', () => {
      component.confirmpwd = 'Secret@1';
      auth.saveUserSecurityQuestionsAnswer.and.returnValue(
        of({
          statusCode: 200,
          data: { transactionId: null },
          errorMessage: 'no tx',
        }),
      );
      component.updatePassword('Secret@1');
      expect(confirm.alert).toHaveBeenCalledWith('no tx', 'error');
      expect(auth.setNewPassword).not.toHaveBeenCalled();
    });

    it('logs a question save error', () => {
      const log = spyOn(console, 'log');
      component.confirmpwd = 'Secret@1';
      auth.saveUserSecurityQuestionsAnswer.and.returnValue(throwingObs('down'));
      component.updatePassword('Secret@1');
      expect(log).toHaveBeenCalledWith('question save error', 'down');
    });
  });

  it('logout keeps storage when navigation fails', fakeAsync(() => {
    navigate.and.returnValue(Promise.resolve(false));
    component.logout();
    flushMicrotasks();
    expect(session.clear).not.toHaveBeenCalled();
  }));
});
