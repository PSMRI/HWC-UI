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
import { of } from 'rxjs';
import { TextareaDialog } from './textarea-dialog.service';
import { TextareaDialogComponent } from './textarea-dialog.component';

describe('TextareaDialog', () => {
  it('opens the dialog with data and returns afterClosed', () => {
    const dialog: any = {
      open: jasmine
        .createSpy('open')
        .and.returnValue({ afterClosed: () => of('text') }),
    };
    const svc = new TextareaDialog(dialog);
    let res: any;
    svc.open('abc').subscribe((r) => (res = r));
    expect(dialog.open).toHaveBeenCalledWith(TextareaDialogComponent, {
      width: '500px',
      data: { observations: 'abc', length: 500 },
    });
    expect(res).toBe('text');
    svc.open('x', 10);
    expect(dialog.open.calls.mostRecent().args[1].data.length).toBe(10);
  });
});
