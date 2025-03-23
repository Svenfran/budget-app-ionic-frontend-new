import { Injectable } from '@angular/core';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { INIT_NUMBERS } from '../constants/default-values';

@Injectable({
  providedIn: 'root',
})
export class AlertService {

  private HEADER_SERVER_UNAVAILABLE: string = "Es ist ein Fehler aufgetreten";
  private MESSAGE_SERVER_UNAVAILABLE: string = "Der Server ist momentan nicht erreichbar. Bitte versuche es in ein paar Minuten noch einmal.";

  constructor(
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastCtrl: ToastController
  ) {}

  async presentInputAlert({
    header,
    placeholder,
    okText = 'OK',
    cancelText = 'Abbrechen',
    onConfirm,
  }: {
    header: string;
    placeholder: string;
    okText?: string;
    cancelText?: string;
    onConfirm: (inputValue: string) => void;
  }): Promise<void> {
    const alert = await this.alertController.create({
      header,
      inputs: [
        {
          name: 'inputValue',
          placeholder,
          attributes: {
            maxlength: INIT_NUMBERS.MAX_LENGTH
          }
        },
      ],
      buttons: [
        {
          text: cancelText,
          role: 'cancel',
        },
        {
          text: okText,
          handler: (data) => {
            if (data.inputValue && onConfirm && data.inputValue.trim() != "") {
              onConfirm(data.inputValue);
            }
          },
        },
      ],
    });

    await alert.present();

    const inputField = document.querySelector('ion-alert input') as HTMLElement;
    if (inputField) {
      inputField.focus();
    }
  }

  async presentLoading(message: string): Promise<HTMLIonLoadingElement> {
    const loading = await this.loadingController.create({ message });
    await loading.present();
    return loading;
  }

  showErrorAlert(header: string, message: string) {
    this.alertController
      .create({
        header: header,
        message: message,
        buttons: ['Ok']
      })
      .then(alertEl => alertEl.present());
  }

  showAlertSeverUnavailable() {
    this.alertController
      .create({
        header: this.HEADER_SERVER_UNAVAILABLE,
        message: this.MESSAGE_SERVER_UNAVAILABLE,
        buttons: ['Ok']
      })
      .then(alertEl => alertEl.present());
  }

  showToast(message: string) {
    this.toastCtrl.create({
      message: message,
      duration: 3000,
      position: 'bottom'
    }).then(toastEl => toastEl.present());
  }
}
