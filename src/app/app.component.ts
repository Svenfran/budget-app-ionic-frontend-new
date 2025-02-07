import { Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from './auth/auth.service';
import { Router } from '@angular/router';
import { ShoppinglistService } from './domains/shoppinglist/shoppinglist.service';
import { User } from './auth/user';
import { WebSocketService } from './utils/websocket.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  shoppingLists = this.shoppinglistService.getShoppingLists();
  authSub!: Subscription;
  previousAuthState: boolean = false;
  groupId: number = 14;
  user: User | undefined;
  
  constructor(
    private authService: AuthService,
    private router: Router,
    private shoppinglistService: ShoppinglistService,
    private webSocketService: WebSocketService
  ) {}

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
      }
    })
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
