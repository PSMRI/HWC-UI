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
  Directive,
  EventEmitter,
  NgZone,
  OnDestroy,
  AfterViewInit,
  Output,
  Input,
} from '@angular/core';
import { MatAutocomplete } from '@angular/material/autocomplete';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[appAutocompleteScroller]',
})
export class AutocompleteScrollerDirective implements AfterViewInit, OnDestroy {
  @Input() threshold = 0.6; // 60% down
  @Output() nearEnd = new EventEmitter<void>();
  @Output() panelReady = new EventEmitter<HTMLElement>(); // lets component bootstrap if no overflow

  private subs: Subscription[] = [];
  private scrollListener?: (e: Event) => void;

  constructor(
    private ac: MatAutocomplete,
    private ngZone: NgZone,
  ) {}

  ngAfterViewInit(): void {
    // Fired when the overlay panel opens
    const openedSub = this.ac.opened.subscribe(() => {
      this.waitForPanel((panelEl) => {
        this.panelReady.emit(panelEl); // tell component the panel is live (for bootstrap)

        // attach scroll listener
        this.ngZone.runOutsideAngular(() => {
          this.scrollListener = () => {
            if (panelEl.scrollHeight <= panelEl.clientHeight) return; // no overflow yet
            const ratio =
              (panelEl.scrollTop + panelEl.clientHeight) / panelEl.scrollHeight;
            if (ratio >= this.threshold) {
              // hop back into Angular so change detection works
              this.ngZone.run(() => this.nearEnd.emit());
            }
          };
          panelEl.addEventListener('scroll', this.scrollListener!, {
            passive: true,
          });
        });
      });
    });

    // Fired when the panel closes
    const closedSub = this.ac.closed.subscribe(() => {
      const panelEl = this.getPanelEl();
      if (panelEl && this.scrollListener) {
        panelEl.removeEventListener('scroll', this.scrollListener);
        this.scrollListener = undefined;
      }
    });

    this.subs.push(openedSub, closedSub);
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    const panelEl = this.getPanelEl();
    if (panelEl && this.scrollListener) {
      panelEl.removeEventListener('scroll', this.scrollListener);
      this.scrollListener = undefined;
    }
  }

  private getPanelEl(): HTMLElement | null {
    // Newer Material exposes panel element
    const anyAc = this.ac as any;
    const el = anyAc?.panel?.nativeElement as HTMLElement | null | undefined;
    if (el) return el;

    // Fallback by id
    const id = anyAc?.id as string | undefined;
    return id ? (document.getElementById(id) as HTMLElement | null) : null;
  }

  private waitForPanel(cb: (panelEl: HTMLElement) => void) {
    let tries = 0;
    const maxTries = 10;
    const tick = () => {
      const el = this.getPanelEl();
      if (el) {
        cb(el);
        return;
      }
      if (tries++ < maxTries) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}
