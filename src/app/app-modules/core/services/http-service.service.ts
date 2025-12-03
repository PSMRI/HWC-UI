import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Injectable()
export class HttpServiceService {
  language!: any;

  private _listners = new Subject<any>();

  listen(): Observable<any> {
    return this._listners.asObservable();
  }

  filter(filterBy: string) {
    this._listners.next(filterBy);
  }
  appCurrentLanguge = new BehaviorSubject(this.language);
  currentLangugae$ = this.appCurrentLanguge.asObservable();

  constructor(
    private _http: HttpClient,
    private http: HttpClient,
  ) {
    const storedLang = localStorage.getItem('appLanguage');
    this.language = storedLang ? JSON.parse(storedLang) : null;

    this.appCurrentLanguge = new BehaviorSubject(this.language);
    this.currentLangugae$ = this.appCurrentLanguge.asObservable();
  }

  fetchLanguageSet() {
    console.log('Here i come');
    return this.http.get(environment.getLanguageList);
  }

  getLanguage(url: string) {
    return this._http.get(url);
  }

  getCurrentLanguage(response: any) {
    this.language = response;
    this.appCurrentLanguge.next(response);
    localStorage.setItem('appLanguage', JSON.stringify(response));
  }
}
