import { Component, effect, Renderer2 } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from './auth/auth.service';
import { Router } from '@angular/router';
import { User } from './auth/user';
import { WebSocketService } from './service/websocket.service';
import { GroupService } from './service/group.service';
import { Group } from './model/group';
import { AlertController, isPlatform, LoadingController, NavController, Platform } from '@ionic/angular';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { NavigationBar } from '@hugotomazi/capacitor-navigation-bar';
import { StorageService } from './service/storage.service';

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
  public sideNavGroups = this.groupService.groupsSideNav;
  public user: User | undefined;
  public isOpen: boolean = false;
  public activeGroup = this.groupService.activeGroup();
  public darkMode: boolean = true;
  
  constructor(
    private authService: AuthService,
    private router: Router,
    private webSocketService: WebSocketService,
    private groupService: GroupService,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private platform: Platform,
    private navCtrl: NavController,
    private renderer: Renderer2,
    private storageService: StorageService
  ) {
    this.initializeApp();
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

  async initializeApp() {
    this.platform.ready().then(() => {
      this.storageService.getItem<boolean>('darkMode').then(dm => {
        if (dm == null) {
          this.storageService.setItem('darkMode', this.darkMode);
        } else {
          this.darkMode = dm;
        }

        this.renderer.setAttribute(
          document.body,
          'color-theme',
          this.darkMode ? 'dark' : 'light'
        );

        this.darkMode ? this.darkColorTheme() : this.lightColorTheme();
      });
    });
    this.initBackButton();
  }

  initBackButton() {
    this.platform.backButton.subscribeWithPriority(10, () => {
      const currentUrl = this.router.url;
      if (currentUrl === "/auth" || currentUrl === "/domains/tabs/overview") {
        App.exitApp();
      } else {
        this.navCtrl.back();
      }
    })
  }

  onToggleColorTheme(event: any) {
    this.darkMode = event.detail.checked;
    if (this.darkMode) {
      this.renderer.setAttribute(document.body, 'color-theme', 'dark');
      this.darkColorTheme();
    } else {
      this.renderer.setAttribute(document.body, 'color-theme', 'light');
      this.lightColorTheme();
    }
    this.storageService.setItem('darkMode', this.darkMode);
  }

  darkColorTheme() {
    if (isPlatform('mobile')) {
      StatusBar.setStyle({ style: Style.Dark });
      StatusBar.setBackgroundColor({ color: '#000000'});
      NavigationBar.setColor({ color: '#000000', darkButtons: false });
    }
  }

  lightColorTheme() {
    if (isPlatform('mobile')) {
      StatusBar.setStyle({ style: Style.Light });
      StatusBar.setBackgroundColor({ color: '#FFFFFF'});
      NavigationBar.setColor({ color: '#FFFFFF', darkButtons: true });
    }
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
