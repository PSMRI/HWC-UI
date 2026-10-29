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
import { ValidationUtils } from './validation-utility';

describe('ValidationUtils', () => {
  const v = new ValidationUtils();

  describe('getAgeValue', () => {
    it('converts each unit to days', () => {
      expect(v.getAgeValue('2 years')).toBe(730);
      expect(v.getAgeValue('3 Months')).toBe(90);
      expect(v.getAgeValue('2 weeks')).toBe(14);
      expect(v.getAgeValue(' 5 days ')).toBe(5);
    });
    it('returns 0 for empty or unknown units', () => {
      expect(v.getAgeValue('')).toBe(0);
      expect(v.getAgeValue(null)).toBe(0);
      expect(v.getAgeValue('4 decades')).toBe(0);
    });
  });

  describe('validateDuration', () => {
    const age = '1 years - 2 months - 3 days'; // 365 + 60 + 3 = 428 days

    it('accepts durations up to the beneficiary age for every unit', () => {
      expect(v.validateDuration(24 * 428, 'Hours', age)).toBeTrue();
      expect(v.validateDuration(428, 'Days', age)).toBeTrue();
      expect(v.validateDuration(1, 'Day', age)).toBeTrue();
      expect(v.validateDuration(61, 'Weeks', age)).toBeTrue();
      expect(v.validateDuration(1, 'Week', age)).toBeTrue();
      expect(v.validateDuration(14, 'Months', age)).toBeTrue();
      expect(v.validateDuration(1, 'Month', age)).toBeTrue();
      expect(v.validateDuration(1, 'Years', age)).toBeTrue();
      expect(v.validateDuration(1, 'Year', age)).toBeTrue();
    });

    it('rejects durations longer than the beneficiary age', () => {
      expect(v.validateDuration(429, 'Days', age)).toBeFalse();
      expect(v.validateDuration(62, 'Weeks', age)).toBeFalse();
      expect(v.validateDuration(15, 'Months', age)).toBeFalse();
      expect(v.validateDuration(2, 'Years', age)).toBeFalse();
      expect(v.validateDuration(24 * 429, 'Hours', age)).toBeFalse();
    });

    it('treats unknown units as zero days (always valid)', () => {
      expect(v.validateDuration(999, 'Fortnights', '1 days')).toBeTrue();
    });
  });
});
