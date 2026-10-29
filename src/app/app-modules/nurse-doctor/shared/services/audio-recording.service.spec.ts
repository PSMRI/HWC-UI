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
  TestBed,
  fakeAsync,
  tick,
  discardPeriodicTasks,
  flushMicrotasks,
} from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { environment } from 'src/environments/environment';
import { AudioRecordingService } from './audio-recording.service';

describe('AudioRecordingService', () => {
  let service: AudioRecordingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AudioRecordingService],
    });
    service = TestBed.inject(AudioRecordingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  function fakeStream() {
    const track = { stop: jasmine.createSpy('stop') };
    return {
      track,
      getAudioTracks: jasmine
        .createSpy('getAudioTracks')
        .and.returnValue([track]),
    };
  }

  it('getResultStatus POSTs form data', () => {
    const fd = new FormData();
    service.getResultStatus(fd).subscribe();
    const t = httpMock.expectOne(environment.getResultStatusURL);
    expect(t.request.method).toBe('POST');
    expect(t.request.body).toBe(fd);
    t.flush({});
  });

  it('startRecording returns early when a recorder already exists', () => {
    (service as any).recorder = {};
    const spy = spyOn(navigator.mediaDevices, 'getUserMedia');
    service.startRecording();
    expect(spy).not.toHaveBeenCalled();
  });

  it('startRecording emits 00:00 and reports failure when media access is denied', fakeAsync(() => {
    spyOn(navigator.mediaDevices, 'getUserMedia').and.returnValue(
      Promise.reject(new Error('denied')),
    );
    const times: string[] = [];
    const failures: string[] = [];
    service.getRecordedTime().subscribe((t) => times.push(t));
    service.recordingFailed().subscribe((f) => failures.push(f));
    service.startRecording();
    flushMicrotasks();
    expect(times).toEqual(['00:00']);
    expect(failures).toEqual(['Error in recording']);
  }));

  it('startRecording stores the stream and then fails because no recorder is ever created', fakeAsync(() => {
    const stream = fakeStream();
    spyOn(navigator.mediaDevices, 'getUserMedia').and.returnValue(
      Promise.resolve(stream as any),
    );
    const failures: string[] = [];
    service.recordingFailed().subscribe((f) => failures.push(f));
    service.startRecording();
    flushMicrotasks();
    expect((service as any).stream).toBe(stream);
    expect(failures).toEqual(['Error in recording']);
  }));

  it('record() starts the recorder and emits elapsed time every second', fakeAsync(() => {
    const recorder = { record: jasmine.createSpy('record') };
    (service as any).recorder = recorder;
    const times: string[] = [];
    service.getRecordedTime().subscribe((t) => times.push(t));
    (service as any).record();
    expect(recorder.record).toHaveBeenCalled();
    tick(1000);
    expect(times.length).toBe(1);
    expect(times[0]).toMatch(/^\d\d:\d\d$/);
    discardPeriodicTasks();
  }));

  it('toString pads values', () => {
    const ts = (v: any) => (service as any).toString(v);
    expect(ts(0)).toBe('00');
    expect(ts(5)).toBe('05');
    expect(ts(42)).toBe(42);
  });

  it('stopRecording does nothing without a recorder', () => {
    const recorded = jasmine.createSpy('recorded');
    service.getRecordedBlob().subscribe(recorded);
    service.stopRecording();
    expect(recorded).not.toHaveBeenCalled();
  });

  it('stopRecording success emits blob and stops media', () => {
    const stream = fakeStream();
    const blob = new Blob(['x']);
    (service as any).recorder = {
      stop: (ok: any) => ok(blob),
    };
    (service as any).stream = stream;
    (service as any).startTime = 1;
    let out: any;
    service.getRecordedBlob().subscribe((b) => (out = b));
    service.stopRecording();
    expect(out.blob).toBe(blob);
    expect(out.title).toMatch(/^audio_\d+\.wav$/);
    expect(stream.track.stop).toHaveBeenCalled();
    expect((service as any).recorder).toBeNull();
    expect((service as any).stream).toBeNull();
  });

  it('stopRecording success without startTime does not emit', () => {
    (service as any).recorder = { stop: (ok: any) => ok(new Blob()) };
    (service as any).startTime = null;
    const recorded = jasmine.createSpy('recorded');
    service.getRecordedBlob().subscribe(recorded);
    service.stopRecording();
    expect(recorded).not.toHaveBeenCalled();
    expect((service as any).recorder).not.toBeNull();
  });

  it('stopRecording failure stops media and reports failure', () => {
    (service as any).recorder = { stop: (_ok: any, fail: any) => fail() };
    let failure: any;
    service.recordingFailed().subscribe((f) => (failure = f));
    service.stopRecording();
    expect(failure).toBe('Recording Failed');
    expect((service as any).recorder).toBeNull();
  });

  it('abortRecording clears recorder and handles missing stream', () => {
    (service as any).recorder = {};
    (service as any).stream = null;
    service.abortRecording();
    expect((service as any).recorder).toBeNull();
    expect((service as any).startTime).toBeNull();
  });

  it('abortRecording is a no-op when not recording', () => {
    const stream = fakeStream();
    (service as any).stream = stream;
    service.abortRecording();
    expect(stream.track.stop).not.toHaveBeenCalled();
  });
});
