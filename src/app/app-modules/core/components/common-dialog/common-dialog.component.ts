import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  DoCheck,
} from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { SetLanguageComponent } from '../set-language.component';
import { HttpServiceService } from '../../services/http-service.service';

@Component({
  selector: 'app-common-dialog',
  templateUrl: './common-dialog.component.html',
  styleUrls: ['./common-dialog.component.css'],
})
export class CommonDialogComponent implements OnInit, DoCheck {
  @Output() cancelEvent = new EventEmitter();

  public title!: string;
  public message!: string;
  public status!: string;
  public btnOkText?: string;
  public btnCancelText?: string;
  public alert!: boolean;
  public alertFetsenseMessage!: boolean;
  public confirmAlert!: boolean;
  public confirmcalibration!: boolean;
  public confirmHealthID!: boolean;
  public remarks!: boolean;
  public capture!: boolean;
  public editRemarks!: boolean;
  public comments!: string;
  public notify!: boolean;
  public mandatories: any;

  // Choose from Radio Button
  public choice!: boolean;
  public values: any;
  public selectedValue: any;
  // Choose from Radio Button Ends

  // selectable

  public choiceSelect!: boolean;
  public options: any;
  public selectedOption: any;
  public confirmCBAC!: boolean;
  public confirmCareContext!: boolean;
  public cbacData: any = [];
  current_language_set: any;

  constructor(
    public matDialogRef: MatDialogRef<CommonDialogComponent>,
    public httpServiceService: HttpServiceService,
  ) {}

  Confirm() {
    this.cancelEvent.emit(null);
  }

  ngOnInit() {
    this.assignSelectedLanguage();
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
  }

  sessionTimeout: any;
  minutes!: number;
  seconds!: number;
  timer!: number;

  intervalRef: any;

  updateTimer(timer: any) {
    this.timer = timer;

    if (timer && timer > 0) {
      this.intervalRef = setInterval(() => {
        if (timer === 0) {
          clearInterval(this.intervalRef);
          this.matDialogRef.close({ action: 'timeout' });
        } else {
          this.minutes = timer / 60;
          this.seconds = timer % 60;
          timer--;
          this.timer = timer;
        }
      }, 1000);
    }
  }

  stopTimer() {
    clearInterval(this.intervalRef);
    this.matDialogRef.close({ action: 'cancel', remainingTime: this.timer });
  }

  continueSession() {
    clearInterval(this.intervalRef);
    this.matDialogRef.close({ action: 'continue' });
  }
}
