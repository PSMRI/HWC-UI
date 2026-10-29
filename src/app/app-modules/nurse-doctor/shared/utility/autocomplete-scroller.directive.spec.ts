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
import { Subject } from 'rxjs';
import { AutocompleteScrollerDirective } from './autocomplete-scroller.directive';

describe('AutocompleteScrollerDirective', () => {
  let opened: Subject<void>;
  let closed: Subject<void>;
  let ac: any;
  let zone: any;
  let panel: HTMLDivElement;
  let directive: AutocompleteScrollerDirective;

  function setScroll(
    scrollHeight: number,
    clientHeight: number,
    scrollTop: number,
  ) {
    Object.defineProperty(panel, 'scrollHeight', {
      value: scrollHeight,
      configurable: true,
    });
    Object.defineProperty(panel, 'clientHeight', {
      value: clientHeight,
      configurable: true,
    });
    Object.defineProperty(panel, 'scrollTop', {
      value: scrollTop,
      configurable: true,
      writable: true,
    });
  }

  beforeEach(() => {
    opened = new Subject<void>();
    closed = new Subject<void>();
    panel = document.createElement('div');
    ac = { opened, closed, panel: { nativeElement: panel } };
    zone = {
      run: jasmine.createSpy('run').and.callFake((fn: any) => fn()),
      runOutsideAngular: jasmine
        .createSpy('runOutsideAngular')
        .and.callFake((fn: any) => fn()),
    };
    spyOn(window, 'requestAnimationFrame').and.callFake((cb: any) => {
      cb(0);
      return 0;
    });
    directive = new AutocompleteScrollerDirective(ac, zone);
  });

  afterEach(() => directive.ngOnDestroy());

  it('emits panelReady and attaches a passive scroll listener when opened', () => {
    const ready = jasmine.createSpy('ready');
    directive.panelReady.subscribe(ready);
    const add = spyOn(panel, 'addEventListener').and.callThrough();
    directive.ngAfterViewInit();
    opened.next();
    expect(ready).toHaveBeenCalledWith(panel);
    expect(zone.runOutsideAngular).toHaveBeenCalled();
    expect(add).toHaveBeenCalledWith('scroll', jasmine.any(Function), {
      passive: true,
    });
  });

  it('emits nearEnd inside the zone once scroll ratio passes the threshold', () => {
    const near = jasmine.createSpy('near');
    directive.nearEnd.subscribe(near);
    directive.ngAfterViewInit();
    opened.next();

    setScroll(1000, 200, 100); // ratio 0.3
    panel.dispatchEvent(new Event('scroll'));
    expect(near).not.toHaveBeenCalled();

    setScroll(1000, 200, 500); // ratio 0.7
    panel.dispatchEvent(new Event('scroll'));
    expect(near).toHaveBeenCalledTimes(1);
    expect(zone.run).toHaveBeenCalled();
  });

  it('ignores scrolls when the panel has no overflow', () => {
    const near = jasmine.createSpy('near');
    directive.nearEnd.subscribe(near);
    directive.ngAfterViewInit();
    opened.next();
    setScroll(200, 200, 0);
    panel.dispatchEvent(new Event('scroll'));
    expect(near).not.toHaveBeenCalled();
  });

  it('respects a custom threshold', () => {
    const near = jasmine.createSpy('near');
    directive.threshold = 0.95;
    directive.nearEnd.subscribe(near);
    directive.ngAfterViewInit();
    opened.next();
    setScroll(1000, 200, 500); // 0.7 < 0.95
    panel.dispatchEvent(new Event('scroll'));
    expect(near).not.toHaveBeenCalled();
  });

  it('removes the scroll listener when the panel closes', () => {
    const remove = spyOn(panel, 'removeEventListener').and.callThrough();
    directive.ngAfterViewInit();
    opened.next();
    closed.next();
    expect(remove).toHaveBeenCalledWith('scroll', jasmine.any(Function));
    remove.calls.reset();
    closed.next(); // listener already cleared
    expect(remove).not.toHaveBeenCalled();
  });

  it('removes the listener and unsubscribes on destroy', () => {
    const remove = spyOn(panel, 'removeEventListener').and.callThrough();
    const ready = jasmine.createSpy('ready');
    directive.panelReady.subscribe(ready);
    directive.ngAfterViewInit();
    opened.next();
    directive.ngOnDestroy();
    expect(remove).toHaveBeenCalled();
    opened.next();
    expect(ready).toHaveBeenCalledTimes(1);
  });

  it('falls back to looking the panel up by id', () => {
    const el = document.createElement('div');
    el.id = 'ac-panel-test';
    document.body.appendChild(el);
    try {
      ac.panel = undefined;
      ac.id = 'ac-panel-test';
      const ready = jasmine.createSpy('ready');
      directive.panelReady.subscribe(ready);
      directive.ngAfterViewInit();
      opened.next();
      expect(ready).toHaveBeenCalledWith(el);
    } finally {
      directive.ngOnDestroy();
      el.remove();
    }
  });

  it('gives up after max retries when no panel exists', () => {
    ac.panel = undefined;
    const ready = jasmine.createSpy('ready');
    directive.panelReady.subscribe(ready);
    directive.ngAfterViewInit();
    opened.next();
    expect(ready).not.toHaveBeenCalled();
    expect((window.requestAnimationFrame as jasmine.Spy).calls.count()).toBe(
      11,
    );
    closed.next();
    directive.ngOnDestroy();
  });
});
