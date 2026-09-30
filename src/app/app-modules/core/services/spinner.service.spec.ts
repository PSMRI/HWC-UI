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
import { SpinnerService } from './spinner.service';

describe('SpinnerService', () => {
  let service: SpinnerService;
  let states: any[];

  beforeEach(() => {
    service = new SpinnerService();
    states = [];
    service.spinnerState.subscribe((s) => states.push(s));
  });

  it('setLoading/getLoading', () => {
    expect(service.getLoading()).toBeFalse();
    service.setLoading(true);
    expect(service.getLoading()).toBeTrue();
  });

  it('show emits only on first push', () => {
    service.show();
    service.show();
    expect(states).toEqual([{ show: true }]);
    expect(service.temp.length).toBe(2);
  });

  it('hide emits false when stack empties', () => {
    service.show();
    service.show();
    service.hide();
    expect(states.length).toBe(1);
    service.hide();
    expect(states[1]).toEqual({ show: false });
    service.hide();
    expect(service.temp.length).toBe(0);
    expect(states.length).toBe(3);
  });

  it('clear resets and emits false', () => {
    service.show();
    service.show();
    service.clear();
    expect(service.temp).toEqual([]);
    expect(states[states.length - 1]).toEqual({ show: false });
  });
});
