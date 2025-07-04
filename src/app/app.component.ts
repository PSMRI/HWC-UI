import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SpinnerService } from './app-modules/core/services/spinner.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'AAM-Facility-App';

  constructor(
    private router: Router,
    private spinnerService: SpinnerService,
  ) {}

  ngOnInit() {
    console.log('success');
  }
}
