import { HttpRequest, HttpHandler } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { take, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { AlertService } from '../service/alert.service';

@Injectable({
  providedIn: 'root'
})
export class AuthHttpInterceptorService {

  constructor(
    private authService: AuthService,
    private alertService: AlertService
  ) { }

  intercept(request: HttpRequest<any>, next: HttpHandler) {
    return this.authService.token.pipe(
      take(1),
      switchMap(token => {
        let cloneReq = this.addToken(request, token);
        return next.handle(cloneReq);
        // return next.handle(cloneReq).pipe(
        //   catchError((error: HttpErrorResponse) => {
        //     if (error.status === 403) {
        //       // this.authService.logout();
        //       // this.router.navigateByUrl("/auth", { replaceUrl: true });

        //       let header = "Authorisierung fehlgeschlagen";
        //       let message = `Deine Zugriffsrechte sind nicht mehr gültig, vermutlich weil du dich auf einem anderen Gerät
        //       angemeldet hast. Logge dich einfach aus und melde dich erneut an.`;
        //       this.alertService.showErrorAlert(header, message);
        //     }
        //     return throwError(() => error);
        //   })
        // );
      })
    )
  }


  private addToken(request: HttpRequest<any>, token: any) {
    if (token) {
      let clone: HttpRequest<any>;
      clone = request.clone({
        setHeaders: {
          Authorization: token
        }
      });
      return clone;
    }
    return request;
  }
}
