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
} from '@angular/core/testing';
import { ElementRef } from '@angular/core';
import { CameraDialogComponent } from './camera-dialog.component';
import { ConfirmationService } from '../../services/confirmation.service';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';

describe('CameraDialogComponent', () => {
  let fixture: ComponentFixture<CameraDialogComponent>;
  let component: CameraDialogComponent;
  let confirmation: any;

  const attachCanvas = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 80;
    const img = document.createElement('canvas');
    img.width = 50;
    img.height = 40;
    component.myCanvas = new ElementRef(canvas);
    component.myImg = new ElementRef(img);
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [CameraDialogComponent],
      providers: [
        ...commonTestProviders({
          session: {
            beneficiaryRegID: '11',
            visitID: '22',
            userName: 'doc',
            providerServiceID: '33',
          },
        }),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(CameraDialogComponent);
    component = fixture.componentInstance;
    confirmation = TestBed.inject(ConfirmationService);
  });

  it('sets default webcam options', () => {
    expect(component.options.width).toBe(500);
    expect(component.options.cameraType).toBe('back');
  });

  it('initialises language, status and preloaded markers', () => {
    component.availablePoints = { markers: [{ xCord: 1, yCord: 2 }] };
    component.ngOnInit();
    expect(component.current_language_set).toBe(LANGUAGE_EN);
    expect(component.status).toBe(LANGUAGE_EN.capture);
    expect(component.pointsToWrite).toEqual([{ xCord: 1, yCord: 2 }]);
    expect(component.loaded).toBeFalse();
  });

  it('keeps no points when none are available', () => {
    component.ngOnInit();
    expect(component.pointsToWrite).toEqual([]);
  });

  it('renders the capture view', () => {
    component.capture = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(LANGUAGE_EN.capture);
  });

  it('captureImg stores the image and handles an empty capture', () => {
    component.ngOnInit();
    component.captureImg({ imageAsDataUrl: 'data:img' } as any);
    expect(component.captured).toBeTrue();
    expect(component.sysImage).toBe('data:img');
    component.captureImg(null as any);
    expect(component.captured).toBeFalse();
    expect(component.status).toBe(LANGUAGE_EN.capture);
  });

  it('getSnapshot and recaptureImage fire the webcam trigger', () => {
    const fired: any[] = [];
    component.triggerObservable.subscribe(() => fired.push(1));
    component.getSnapshot();
    component.captured = true;
    component.recaptureImage();
    expect(fired.length).toBe(2);
    expect(component.captured).toBeFalse();
  });

  it('handleKeyDownRecaptureImg recaptures only on Enter/Space', () => {
    spyOn(component, 'recaptureImage');
    component.handleKeyDownRecaptureImg({ key: 'Enter' } as KeyboardEvent);
    component.handleKeyDownRecaptureImg({ key: ' ' } as KeyboardEvent);
    component.handleKeyDownRecaptureImg({ key: 'Spacebar' } as KeyboardEvent);
    component.handleKeyDownRecaptureImg({ key: 'a' } as KeyboardEvent);
    expect(component.recaptureImage).toHaveBeenCalledTimes(3);
  });

  it('exposes the next-webcam observable', () => {
    expect(component.nextWebcamObservable).toBeTruthy();
  });

  it('Confirm emits the cancel event', () => {
    spyOn(component.cancelEvent, 'emit');
    component.Confirm();
    expect(component.cancelEvent.emit).toHaveBeenCalledWith(null);
  });

  it('ngDoCheck refreshes the language; callbacks do not throw', () => {
    component.ngDoCheck();
    expect(component.current_language_set).toBe(LANGUAGE_EN);
    component.onSuccess({});
    component.onError('e');
    component.handleInitError({} as any);
  });

  describe('annotation canvas', () => {
    beforeEach(() => {
      component.ngOnInit();
      attachCanvas();
    });

    it('ngAfterViewInit loads the canvas and replays existing marks', () => {
      component.annotate = true;
      component.pointsToWrite = [
        { xCord: 10, yCord: 20, description: 'rash', point: 1 },
      ];
      component.ngAfterViewInit();
      expect(component.loaded).toBeTrue();
      expect(component.score).toBe(2);
      expect(component.markers).toEqual([
        { xCord: 10, yCord: 20, description: 'rash', point: 1 },
      ]);
    });

    it('ngAfterViewInit without annotation only marks loaded', () => {
      component.pointsToWrite = null as any;
      component.ngAfterViewInit();
      expect(component.loaded).toBeTrue();
      expect(component.canvas).toBeUndefined();
    });

    it('pointMark records numbered markers up to six', () => {
      component.loadingCanvas();
      for (let i = 0; i < 6; i++) {
        component.pointMark({ offsetX: i * 5, offsetY: i * 5 });
      }
      expect(component.markers.length).toBe(6);
      expect(component.markers[5]).toEqual({
        xCord: 25,
        yCord: 25,
        description: '',
        point: 6,
      });
    });

    it('pointMark alerts once more than six markers are placed', fakeAsync(() => {
      component.loadingCanvas();
      component.score = 7;
      component.pointMark({ offsetX: 1, offsetY: 1 });
      tick();
      expect(confirmation.alert).toHaveBeenCalledWith(
        LANGUAGE_EN.alerts.info.sixMakers,
      );
      expect(component.markers.length).toBe(0);
    }));

    it('clearPointers removes markers and reloads the canvas', () => {
      component.loadingCanvas();
      component.pointMark({ offsetX: 1, offsetY: 1 });
      component.clearPointers();
      expect(component.markers.length).toBe(0);
      expect(component.score).toBe(1);
    });
  });

  it('getMarkers builds the request from session storage', () => {
    component.markers = [{ xCord: 1, yCord: 1, description: '', point: 1 }];
    expect(component.getMarkers()).toEqual({
      beneficiaryRegID: '11',
      visitID: '22',
      createdBy: 'doc',
      imageID: '',
      providerServiceMapID: '33',
      markers: component.markers,
    });
  });

  it('downloadGraph logs when the container is missing', () => {
    spyOn(document, 'getElementById').and.returnValue(null);
    spyOn(console, 'error');
    component.downloadGraph();
    expect(console.error).toHaveBeenCalledWith(
      'Element with ID "container-dialog" not found.',
    );
  });

  describe('downloadGraph with a rendered container', () => {
    let container: HTMLElement;

    beforeEach(() => {
      container = document.createElement('div');
      container.id = 'container-dialog';
      container.style.width = '20px';
      container.style.height = '20px';
      container.textContent = 'graph';
      document.body.appendChild(container);
    });

    afterEach(() => container.remove());

    const waitForError = (match: string) =>
      new Promise<void>((resolve) => {
        spyOn(console, 'error').and.callFake((msg: any) => {
          if (String(msg).includes(match)) resolve();
        });
      });

    it('falls back to a new window when saving fails and none can be opened', async () => {
      // graph is undefined, so building the file name throws inside the try.
      spyOn(window, 'open').and.returnValue(null);
      const done = waitForError('Error opening a new window.');
      component.downloadGraph();
      await done;
      expect(window.open).toHaveBeenCalled();
    });

    it('writes the image into the fallback window', async () => {
      const write = jasmine.createSpy('write');
      spyOn(window, 'open').and.returnValue({ document: { write } } as any);
      const done = waitForError('Error saving image:');
      component.downloadGraph();
      await done;
      await new Promise((r) => setTimeout(r));
      expect(write).toHaveBeenCalledWith(
        jasmine.stringMatching(/^<img src="data:image\/png/),
      );
    });
  });
});
