import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthResponseData, AuthService } from './auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoadingController, MenuController, ToastController } from '@ionic/angular';
import { AlertService } from '../service/alert.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
  standalone: false
})
export class AuthPage implements OnInit {

  isLogin = true;
  form!: FormGroup;
  isLoading = false;
  showPassword: boolean = false;

  constructor(private authService: AuthService,
              private loadingCtrl: LoadingController,
              private router: Router,
              private fb: FormBuilder,
              private menuCtrl: MenuController,
              private toastCtrl: ToastController,
              private alertService: AlertService) { }

  ngOnInit() {
    this.form = this.fb.group({
      userName: [''],
      userEmail: ['',[ Validators.required, Validators.pattern(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i) ]],
      password: ['',[ Validators.required, Validators.minLength(6) ]],
    });
    
    this.menuCtrl.enable(false, 'm1');
  }

  ionViewDidLeave() {
    this.menuCtrl.enable(true, 'm1');
  }


  toggleShow() {
    this.showPassword = !this.showPassword;
  }

  onSwitchAuthMode() {
    this.isLogin = !this.isLogin; 
    if (this.isLogin) {
      this.form.controls['userName'].clearValidators();
    } else {
      this.form.controls['userName'].setValidators([Validators.required, Validators.minLength(3)]);
    }
    this.form.controls['userName'].updateValueAndValidity();
  }

  authenticate(userName: string, userEmail: string, password: string) {
    const USER_EMAIL = userEmail.trim();
    const USER_NAME = userName ? userName.trim() : "";
    
    this.isLoading = true;
    this.loadingCtrl
    .create({ keyboardClose: true, message: 'Anmelden...' })
    .then(loadingEl => {
      loadingEl.present();
      let authObs: Observable<AuthResponseData>;
      if (this.isLogin) {
        authObs = this.authService.login(USER_EMAIL, password);
      } else {
        authObs = this.authService.register(USER_NAME, USER_EMAIL, password);
      }
      authObs.subscribe(resData => {
        // console.log(resData);
        this.isLoading = false;
        loadingEl.dismiss();
        this.router.navigateByUrl('/domains/tabs/overview', { replaceUrl: true });
        let message = 'Erfolgreich angemeldet!'
        this.showToast(message);
      }, errRes => {
        // console.log(errRes.error);
        let header = !this.isLogin ? 'Registrierung fehlgeschlagen' : 'Anmeldung fehlgeschlagen';
        // for Authentication
        let message = 'Passwort oder Email falsch.';
        // for Registration
        if (errRes.status === 0) {
          loadingEl.dismiss();
          this.alertService.showAlertSeverUnavailable();
        } else if (errRes.status !== 403 && errRes.error.includes(USER_EMAIL)) {
          message = 'Ein Benutzer mit dieser Email-Adresse existiert bereits.';
        } else if (errRes.status !== 403 && errRes.error.includes(USER_NAME)) {
          message = 'Ein Benutzer mit diesem Benutzernamen existiert bereits.';
        }
        loadingEl.dismiss();
        this.alertService.showErrorAlert(header, message);
      });
    });
  }

  onSubmit() {
    if (!this.form.valid) {
      return;
    }
    const userName = this.form.value.userName;
    const userEmail = this.form.value.userEmail;
    const password = this.form.value.password;
  
    this.authenticate(userName, userEmail, password)
    this.form.reset();
  }

  private showToast(message: string) {
    this.toastCtrl
      .create({
        message: message,
        duration: 1500,
        position: 'bottom'
      })
      .then(toastEl => toastEl.present());

  }

  get userName() {return this.form.get('userName');}
  get userEmail() {return this.form.get('userEmail');}
  get password() {return this.form.get('password');}

}

class EmailValidator {
  static isNotValid(email: string){
    let pattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    let result = pattern.test(email);
    
    if (!result) {
      return {
        'email:validation:fail' : true
      }
    }
    return null;
  }

}
