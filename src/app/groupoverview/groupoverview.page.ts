import { Component, OnInit } from '@angular/core';
import { GroupService } from '../service/group.service';
import { User } from '../auth/user';
import { AuthService } from '../auth/auth.service';
import { AlertController, IonItemSliding, LoadingController } from '@ionic/angular';
import { Group } from '../model/group';
import { NewMemberDto } from './model/new-member-dto';

@Component({
  selector: 'app-groupoverview',
  templateUrl: './groupoverview.page.html',
  styleUrls: ['./groupoverview.page.scss'],
  standalone: false
})
export class GroupoverviewPage implements OnInit {

  public isLoading: boolean = false;
  public groupOverviewList = this.groupService.groupOverviewList;
  public user: User | undefined;

  constructor(
    private groupService: GroupService,
    private authService: AuthService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController
  ) { }

  ngOnInit() {
    this.authService.user.pipe().subscribe(user => {
      if (user) this.user = user;
      this.groupService.getGroupsForOverview();
    })
  }

  onCreateGroup() {
    this.alertCtrl.create({
      header: "Neue Gruppe:",
      buttons: [{
        text: "Abbrechen",
        role: "cancel"
      }, {
        text: "ok",
        handler: (data) => {
          this.loadingCtrl.create({
            message: "Erstelle Gruppe..."
          }).then(loadingEl => {
            const newGroup: Group = { id: new Date().getTime(), name: data.groupName, dateCreated: new Date() };
            this.groupService.addGroup(newGroup);
            loadingEl.dismiss();
          })
        }
      }],
      inputs: [
        {
          name: "groupName",
          placeholder: "Gruppenname"
        }
      ]
    }).then(alertEl => alertEl.present().then(() => {
      const inputField = document.querySelector("ion-alert input") as HTMLElement;
      if (inputField) {
        inputField.focus();
      }
    }));
  }

  onUpdateGroup(group: Group, slidingItem: IonItemSliding) {
    slidingItem.close();
    this.alertCtrl.create({
      header: "Gruppenname:",
      buttons: [{
        text: "Abbrechen",
        role: "cancel"
      }, {
        text: "ok",
        handler: (data) => {
          this.loadingCtrl.create({
            message: "Bearbeite Gruppe..."
          }).then(loadingEl => {
            const newGroup: Group = { id: group.id, name: data.groupName, dateCreated: new Date() };
            this.groupService.updateGroup(newGroup);
            loadingEl.dismiss();
          })
        }
      }],
      inputs: [
        {
          name: "groupName",
          value: this.groupOverviewList().find(gr => gr.id === group.id)?.name
        }
      ]
    }).then(alertEl => alertEl.present().then(() => {
      const inputField = document.querySelector("ion-alert input") as HTMLElement;
      if (inputField) {
        inputField.focus();
      }
    }));
  }

  onDeleteGroup(group: Group, slidingItem: IonItemSliding) {
    slidingItem.close();
    this.alertCtrl.create({
      header: 'Löschen',
      message: `Möchtest du die Gruppe "${group.name}" wirklich löschen inkl. aller Mitglieder und gespeicherten Ausgaben?`,
      buttons: [{
        text: 'Nein'
      }, {
        text: "ok",
        handler: () => {
          this.loadingCtrl.create({
            message: "Lösche Gruppe..."
          }).then(loadingEl => {
            this.groupService.deleteGroup(group);
            loadingEl.dismiss();
          })
        }
      }]
    }).then(alertEl => alertEl.present());
  }

  onAddMember(group: Group, slidingItem: IonItemSliding) {
    slidingItem.close();
    this.alertCtrl.create({
      header: "Neues Gruppenmitglied:",
      buttons: [{
        text: "Abbrechen",
        role: "cancel"
      }, {
        text: "ok",
        handler: (data) => {
          this.loadingCtrl.create({
            message: "Füge Benutzer hinzu..."
          }).then(loadingEl => {
            let newMember: NewMemberDto = {
              id: group.id,
              name: group.name,
              newMemberEmail: data.memberEmail.trim()
            }
            this.groupService.addMemberToGroup(newMember);
            loadingEl.dismiss();
          })
        }
      }],
      inputs: [
        {
          placeholder: "E-Mail Adresse",
          name: "memberEmail",
          type: "email"
        }
      ]
    }).then(alertEl => alertEl.present().then(() => {
      const inputField = document.querySelector("ion-alert input") as HTMLElement;
      if (inputField) {
        inputField.focus();
      }
    }));
  }

}
