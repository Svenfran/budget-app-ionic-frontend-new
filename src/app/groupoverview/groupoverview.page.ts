import { Component, effect, OnInit } from '@angular/core';
import { GroupService } from '../service/group.service';
import { User } from '../auth/user';
import { AuthService } from '../auth/auth.service';
import { AlertController, IonItemSliding, LoadingController, ModalController } from '@ionic/angular';
import { Group } from '../model/group';
import { NewMemberDto } from './model/new-member-dto';
import { GroupmembersPage } from '../groupmembers/groupmembers.page';
import { INIT_NUMBERS } from '../constants/default-values';

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
    private loadingCtrl: LoadingController,
    private modalCtrl: ModalController
  ) {}

  ngOnInit() {
    this.authService.user.pipe().subscribe(user => {
      if (user) this.user = user;
      this.groupService.getGroupsForOverview();
    })
  }

  refreshGroupList(event: CustomEvent) {
    setTimeout(() => {
      this.groupService.getGroupsForOverview();
      (event.target as HTMLIonRefresherElement).complete();
    }, 2000);
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
            if (!data) return;
            const trimmedGroupName = data.groupName.trim();
            if (trimmedGroupName === "") return;

            const newGroup: Group = { id: new Date().getTime(), name: trimmedGroupName, dateCreated: new Date() };
            this.groupService.addGroup(newGroup);
            loadingEl.dismiss();
          })
        }
      }],
      inputs: [
        {
          name: "groupName",
          placeholder: "Gruppenname",
          attributes: {
            maxlength: INIT_NUMBERS.MAX_LENGTH
          }
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
            if (!data) return;
            const trimmedGroupName = data.groupName.trim();
            if (trimmedGroupName === "") return;

            const newGroup: Group = { id: group.id, name: trimmedGroupName, dateCreated: new Date() };
            this.groupService.updateGroup(newGroup);
            loadingEl.dismiss();
          })
        }
      }],
      inputs: [
        {
          name: "groupName",
          value: this.groupOverviewList().find(gr => gr.id === group.id)?.name,
          attributes: {
            maxlength: INIT_NUMBERS.MAX_LENGTH
          }
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
          type: "email",
          attributes: {
            maxlength: INIT_NUMBERS.MAX_LENGTH
          }
        }
      ]
    }).then(alertEl => alertEl.present().then(() => {
      const inputField = document.querySelector("ion-alert input") as HTMLElement;
      if (inputField) {
        inputField.focus();
      }
    }));
  }

  async showGroupMembers(groupId: number, groupOwnerName: string, slidingItem: IonItemSliding) {
    slidingItem.close();
    const modal = this.modalCtrl.create({
      component: GroupmembersPage,
      componentProps: {
        'groupId': groupId,
        'groupOwnerName': groupOwnerName
      }
    });

    (await modal).onWillDismiss().then(groupWithMembers => {
      if (!groupWithMembers.data) {
        return;
      }
    })

    return (await modal).present();
  }

}
