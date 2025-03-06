import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { User } from '../auth/user';
import { AlertController, LoadingController } from '@ionic/angular';
import { UserprofileService } from './service/userprofile.service';
import { Router } from '@angular/router';
import { AlertService } from '../service/alert.service';
import { StorageService } from '../service/storage.service';
import { UserDto } from '../model/user-dto';
import { EmailValidator } from '../Validator/email-validator';

@Component({
  selector: 'app-userprofile',
  templateUrl: './userprofile.page.html',
  styleUrls: ['./userprofile.page.scss'],
  standalone: false
})
export class UserprofilePage implements OnInit {

  public user!: User;

  constructor(
    private authService: AuthService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private userProfileService: UserprofileService,
    private router: Router,
    private storageService: StorageService,
    private alertService: AlertService
  ) { }

  ngOnInit() {
    this.authService.user.pipe().subscribe(user => {
      if (user) this.user = user;
    })
  }

  changeUserName() {
    this.alertCtrl.create({
      header: "Benutzername ändern:",
      buttons: [{
        text: "Abbrechen",
        role: "cancel"
      }, {
        text: "ok",
        handler: (data) => {
          if (data.userName === undefined || data.userName === null || data.userName.trim() === "") {
            let header = "Fehlerhafter Benutzername!";
            let message = `Der Benutzername darf nicht leer sein.`
            this.alertService.showErrorAlert(header, message);
            return
          }
          this.loadingCtrl.create({
            message: "Ändere Benutzername..."
          }).then(loadingEl => {
            loadingEl.present();
            const user: UserDto = {
              id: this.user.id,
              userName: data.userName,
              userEmail: this.user.email
            }
            this.userProfileService.changeUserName(user);
            loadingEl.dismiss();
          })
        }
      }],
      inputs: [
        {
          name: "userName",
          placeholder: "Benutzername"
        }
      ]
    }).then(alertEl => alertEl.present().then(() => {
      const inputField = document.querySelector('ion-alert input') as HTMLElement;
      if (inputField) {
        inputField.focus();
      }
    }));
  }

  changeUserEmail() {
    this.alertCtrl.create({
      header: "E-Mail Adresse ändern:",
      buttons: [{
        text: "Abbrechen",
        role: "cancel"
      }, {
        text: "ok",
        handler: (data) => {
          const email = data.email.trim();
          if (EmailValidator.isNotValid(email)) {
            let header = "Fehlerhafte E-Mail-Adresse!";
            let message = "Bitte gib eine gültige E-mail-Adresse an.";
            this.alertService.showErrorAlert(header, message);
            return
          }
          this.loadingCtrl.create({
            message: "Ändere E-Mail-Adresse..."
          }).then(loadingEl => {
            loadingEl.present();
            const user: UserDto = {
              id: this.user.id,
              userName: this.user.name,
              userEmail: data.email
            }
            this.userProfileService.changeUserEmail(user);
            loadingEl.dismiss();
          })
        }
      }],
      inputs: [
        {
          name: "email",
          placeholder: "E-Mail-Adresse",
          type: "email"
        }
      ]
    }).then(alertEl => alertEl.present().then(() => {
      const inputField = document.querySelector('ion-alert input') as HTMLElement;
      if (inputField) {
        inputField.focus();
      }
    }));
  }

  deleteUserProfile() {
    this.alertCtrl.create({
      header: "Profil löschen",
      message: "Möchtest du dein Profil wirklich löschen inkl. aller Gruppen und Ausgaben?",
      buttons: [{
        text: 'Nein'
      }, {
        text: 'Ja',
        handler: () => {
          this.loadingCtrl.create({
            message: 'Lösche Profil...'
          }).then(loadingEl => {
            loadingEl.present();
            this.userProfileService.deleteUserProfile(this.user.id);
            loadingEl.dismiss();
          })
        }
      }]
    }).then(alertEl => alertEl.present());
  }

}
