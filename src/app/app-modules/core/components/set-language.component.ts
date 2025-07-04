/*
 * JA354063 - Created on 21-07-21
 */
import { Component, DoCheck } from '@angular/core';
import { HttpServiceService } from '../services/http-service.service';

@Component({
  template: '',
})
export class SetLanguageComponent {
  currentLanguageObject: any;
  constructor(private httpServices: HttpServiceService) {}

  setLanguage() {
    const languageSubscription = this.httpServices.currentLangugae$.subscribe(
      (languageResponse) => {
        this.currentLanguageObject = languageResponse;
      },
      (err) => {
        console.log(err);
      },
      () => {
        console.log('completed');
      },
    );
    languageSubscription.unsubscribe();
  }
}
