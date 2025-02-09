import { Component, effect } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from './auth/auth.service';
import { Router } from '@angular/router';
import { User } from './auth/user';
import { WebSocketService } from './service/websocket.service';
import { GroupService } from './service/group.service';
import { Group } from './model/group';
import { AlertController, LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  private authSub!: Subscription;
  private previousAuthState: boolean = false;
  public shoppingLists: Group[] = [];
  public sideNavGroups = this.groupService.getSideNavGroups();
  public user: User | undefined;
  public isOpen: boolean = false;
  public activeGroup = this.groupService.activeGroup();
  
  constructor(
    private authService: AuthService,
    private router: Router,
    private webSocketService: WebSocketService,
    private groupService: GroupService,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
  ) {
    effect(() => {
      this.activeGroup = this.groupService.activeGroup();
    });
  }

  ngOnInit() {
    this.authSub = this.authService.userIsAuthenticated.subscribe(isAuth => {
      if (!isAuth && this.previousAuthState !== isAuth) {
        this.router.navigateByUrl('/auth', { replaceUrl: true });
      }
    })
    this.authService.user.subscribe(user => {
      if (user) {
        this.user = user;
        this.webSocketService.connect(user.token!);
        this.groupService.getGroupsForSideNav();
      }
    })
  }

  setActiveGroup(group: Group) {
    this.groupService.setActiveGroup(group);
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

  onLogout() {
    this.authService.logout();
    this.router.navigateByUrl("/auth", { replaceUrl: true });
  }

  ngOnDestroy() {
    this.authSub.unsubscribe();
    this.webSocketService.disconnect();
  }
}
