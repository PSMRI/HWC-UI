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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';

import { ViewHealthIdCardComponent } from './view-health-id-card.component';
import {
  COMMON_TEST_IMPORTS,
  LANGUAGE_EN,
  NO_ERRORS_SCHEMA,
  commonTestProviders,
} from 'src/testing/test-utils';

const PNG_B64 = btoa('fake-png-bytes');

describe('ViewHealthIdCardComponent', () => {
  let fixture: ComponentFixture<ViewHealthIdCardComponent>;
  let component: ViewHealthIdCardComponent;
  let clickSpy: jasmine.Spy;
  let nav: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [ViewHealthIdCardComponent],
      providers: [
        ...commonTestProviders({ dialogData: { imgBase64: PNG_B64 } }),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(ViewHealthIdCardComponent);
    component = fixture.componentInstance;
    clickSpy = spyOn(HTMLAnchorElement.prototype, 'click');
    nav = window.navigator as any;
    fixture.detectChanges();
  });

  afterEach(() => {
    delete nav.msSaveOrOpenBlob;
  });

  it('creates, loads language and renders the card image', () => {
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
    const img: HTMLImageElement =
      fixture.nativeElement.querySelector('#imghealthIDCard');
    expect(img.getAttribute('src')).toContain('data:image/png;base64');
  });

  it('ngDoCheck refreshes language', () => {
    component.currentLanguageSet = null;
    component.ngDoCheck();
    expect(component.currentLanguageSet).toEqual(LANGUAGE_EN);
  });

  it('transform returns a trusted resource URL with the base64 image', () => {
    const spy = spyOn(
      component.sanitizer,
      'bypassSecurityTrustResourceUrl',
    ).and.callThrough();
    component.transform();
    expect(spy).toHaveBeenCalledWith('data:image/png;base64, ' + PNG_B64);
  });

  it('convertIMGToPDF builds an object URL only when data is given', () => {
    component.convertIMGToPDF(undefined);
    expect(component.imgUrl).toBeUndefined();
    const urlSpy = spyOn(URL, 'createObjectURL').and.returnValue('blob:x');
    component.convertIMGToPDF(PNG_B64);
    expect(urlSpy).toHaveBeenCalled();
    expect(component.imgUrl).toBeTruthy();
  });

  it('closeDialog closes the dialog', () => {
    component.closeDialog();
    expect((TestBed.inject(MatDialogRef) as any).close).toHaveBeenCalled();
  });

  it('convertBase64ToBlobData slices large payloads into a png blob', () => {
    const big = btoa('x'.repeat(1300));
    const blob = component.convertBase64ToBlobData(big);
    expect(blob.type).toBe('image/png');
    expect(blob.size).toBe(1300);
  });

  it('downloadHealthIDCard triggers an anchor download in Chrome', () => {
    spyOn(window.URL, 'createObjectURL').and.returnValue('blob:card');
    component.downloadHealthIDCard();
    expect(clickSpy).toHaveBeenCalled();
    const anchor = clickSpy.calls.mostRecent().object as HTMLAnchorElement;
    expect(anchor.download).toBe('ABHACard');
    expect(anchor.href).toBe('blob:card');
  });

  it('downloadHealthIDCard uses msSaveOrOpenBlob when available', () => {
    nav.msSaveOrOpenBlob = jasmine.createSpy('msSave');
    component.downloadHealthIDCard();
    expect(nav.msSaveOrOpenBlob).toHaveBeenCalledWith(
      jasmine.any(Blob),
      'ABHACard',
    );
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('downloadPdf uses an anchor data URL in Chrome', () => {
    component.downloadPdf(PNG_B64, 'card');
    const anchor = clickSpy.calls.mostRecent().object as HTMLAnchorElement;
    expect(anchor.download).toBe('card.pdf');
    expect(anchor.href).toBe(`data:application/pdf;base64,${PNG_B64}`);
  });

  it('downloadPdf uses msSaveOrOpenBlob when available', () => {
    nav.msSaveOrOpenBlob = jasmine.createSpy('msSave');
    component.downloadPdf(PNG_B64, 'card');
    expect(nav.msSaveOrOpenBlob).toHaveBeenCalledWith(
      jasmine.any(Blob),
      'card.pdf',
    );
    expect(clickSpy).not.toHaveBeenCalled();
  });
});
