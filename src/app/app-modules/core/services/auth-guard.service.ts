import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { tap } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  canActivate(route: any, state: any) {
    return this.auth.validateSessionKey().pipe(
      tap((res: any) => {
        if (!(res && res.statusCode === 200 && res.data)) {
          this.router.navigate(['/login']);
        }
      }),
    );
  }
}
