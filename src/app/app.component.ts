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
import { GroupOverview } from './groupoverview/model/group-overview';
import { UserDto } from './model/user-dto';
import { CategoryDto } from './model/category-dto';
import { CategoryService } from './service/category.service';
import { INIT_NUMBERS } from './constants/default-values';
import { Device } from '@capacitor/device';

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
  public groupOverviewList = this.groupService.groupOverviewList;
  public groupMembers = this.groupService.groupMembers;
  public user!: User;
  public isOpen: boolean = false;
  public activeGroup = this.groupService.activeGroup();
  public darkMode: boolean = true;
  private subscriptions: Subscription[] = [];
  public backendStatus: "UP" | "DOWN" = "UP";
  
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
    private storageService: StorageService,
    private websocketService: WebSocketService,
    private categoryService: CategoryService
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
    });

    this.authService.user.subscribe(user => {
      if (user) {
        this.user = user;
        this.webSocketService.connect(user.token!);
        this.groupService.getGroupsForSideNav();

        this.subscriptions.push(
          this.webSocketService.getConnectionState().subscribe(isConnected => {
            if (isConnected) {
              this.subscribeToTopics(user.id);
            }
          })
        );
      }
    });

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

  onCreateCategory() {
    this.alertCtrl.create({
      header: "Neue Kategorie:",
      buttons: [{
        text: "Abbrechen",
        role: "cancel"
      }, {
        text: "ok",
        handler: (data) => {
          this.loadingCtrl.create({
            message: "Erstelle Kategorie..."
          }).then(loadingEl => {
            if (!data) return;
            const trimmedCategoryName = data.categoryName.trim();
            if (trimmedCategoryName === "") return;

            const newCategory: CategoryDto = {
              name: trimmedCategoryName,
              groupId: this.activeGroup.id
            };
            this.categoryService.addCategory(newCategory);
            loadingEl.dismiss();
          })
        }
      }],
      inputs: [
        {
          name: "categoryName",
          placeholder: "Name der Kategorie",
          attributes: {
            maxlength: INIT_NUMBERS.MAX_LENGTH
          }
        }
      ]
    }).then(alertEl => alertEl.present().then(() => {
      const inputField = document.querySelector('ion-alert input') as HTMLElement;
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
    this.webSocketService.unsubscribeAll();
    this.webSocketService.disconnect();
  }

  subscribeToTopics(userId: number) {
    this.websocketService.subscribe(
      `/user/${userId}/notification/update-group`,
      (message: any) => {
        const parsedData = JSON.parse(message.body);
        const foundGroup = this.sideNavGroups().find(group => group.id === parsedData.id);
        const group = { id: parsedData.id, name: parsedData.name, dateCreated: foundGroup!.dateCreated };
        console.log(group);

        this.sideNavGroups.update(groups => groups.map(group => 
          group.id === parsedData.id ? { ...group, name: parsedData.name } : group
        ));

        this.groupOverviewList.update(groups => groups.map(group => 
          group.id === parsedData.id ? { ...group, name: parsedData.name } : group
        ));
        
        if (this.activeGroup.id === parsedData.id) {
          this.groupService.setActiveGroup(group);
        }
      }
    );

    this.websocketService.subscribe(
      `/user/${userId}/notification/delete-group`,
      (message: any) => {
        const parsedData = JSON.parse(message.body);
        const foundGroup = this.sideNavGroups().find(group => group.id === parsedData.id);
        const group = { id: parsedData.id, name: parsedData.name, dateCreated: foundGroup!.dateCreated };
        console.log(group);
        console.log(this.activeGroup);

        this.sideNavGroups.update(groups => 
          groups.filter(group => group.id !== parsedData.id)
        );

        this.groupOverviewList.update(groups => 
          groups.filter(group => group.id !== parsedData.id)
        );
        
        if (this.activeGroup.id === group.id) {
          this.groupService.updateActiveGroup(this.sideNavGroups(), this.activeGroup);
        }
      }
    );

    this.webSocketService.subscribe(
      `/user/${userId}/notification/remove-group-member`,
      (message: any) => {
        const parsedData = JSON.parse(message.body);
        console.log(parsedData);
      
        if (parsedData.updatedMember.id === this.user?.id) {
          this.sideNavGroups.update(
            groups => groups.filter(group => group.id !== parsedData.id)
          );
          this.groupOverviewList.update(
            groups => groups.filter(group => group.id !== parsedData.id)
          );
          this.groupService.updateActiveGroup(this.sideNavGroups(), this.activeGroup);
        } else {
          this.groupOverviewList.update(groups => {
            return groups.map(group => 
              group.id === parsedData.id
                ? { ...group, memberCount: parsedData.members.length }
                : group
            );
          });
        }
      
      }
    );
    
    this.webSocketService.subscribe(
      `/user/${userId}/notification/add-group-member`,
      (message: any) => {
        const parsedData = JSON.parse(message.body);
        console.log(parsedData);
        const group: Group = { id: parsedData.id, name: parsedData.name, dateCreated: parsedData.dateCreated };
        const groupOverview: GroupOverview = { 
          id: parsedData.id, 
          name: parsedData.name, 
          dateCreated: parsedData.dateCreated, 
          ownerName: parsedData.ownerName, 
          memberCount: parsedData.members.length
        };
        
        if (parsedData.updatedMember.id === this.user?.id) {
          this.sideNavGroups.update(groups => [...groups, group]);
          this.groupOverviewList.update(groups => [ ...groups, groupOverview]);
        } else {
          this.groupOverviewList.update(groups => {
            return groups.map(group => 
              group.id === parsedData.id
                ? { ...group, memberCount: parsedData.members.length }
                : group
            );
          });
        }
      
      }
    );

    this.webSocketService.subscribe(
      `/user/${userId}/notification/change-group-owner`,
      (message: any) => {
        const parsedData = JSON.parse(message.body);
        const previousOwner: UserDto = { id: this.groupMembers().id, userName: this.groupMembers().ownerName };
        console.log(parsedData);

        this.groupMembers.update(group => {
        return {
          ...group,
          ownerName: parsedData.newOwner.userName,
          ownerId: parsedData.newOwner.id,
          members: [
            ...group.members.filter(member => member.id !== parsedData.newOwner.id),
            previousOwner
          ]
        };
      });
      
      this.groupOverviewList.update(groups => {
        return groups.map(group =>
          group.id === parsedData.groupId 
            ? { ...group, ownerName: parsedData.newOwner.userName }
            : group
        );
      });

      }
    );

  }
}
