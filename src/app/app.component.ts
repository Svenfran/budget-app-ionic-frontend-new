import { Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from './auth/auth.service';
import { Router } from '@angular/router';
import * as SockJS from 'sockjs-client';
import { environment } from 'src/environments/environment';
import { Client, Stomp } from '@stomp/stompjs';
import { ShoppinglistService } from './domains/shoppinglist/shoppinglist.service';
import { ShoppinglistDto } from './domains/shoppinglist/shoppinglist-dto';
import { User } from './auth/user';
import { ShoppingitemDto } from './domains/shoppinglist/shoppingitem-dto';

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

  socketClient: any = null;
  private subscriptions: any[] = [];
  
  constructor(
    private authService: AuthService,
    private router: Router,
    private shoppinglistService: ShoppinglistService
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
        this.connectWebSocket(user.id, user.token);
      }
    })
  }

  connectWebSocket(userId: number, token: any) {
    this.socketClient = new Client({
      webSocketFactory: () => new SockJS(`${environment.apiBaseUrl}/ws`),
      connectHeaders: { Authorization: token },
      debug: (str) => console.log(str),
      reconnectDelay: 5000, // Automatisches Reconnect-Intervall (5 Sekunden)
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: (frame) => {
        console.log('Connected to WebSocket:', frame);
        this.subscribeToTopics(userId);
      },
      onStompError: (frame) => {
        console.error('STOMP-Error:', frame);
      },
      onWebSocketClose: () => {
        console.warn('WebSocket geschlossen. Versuche, die Verbindung erneut herzustellen...');
      },
    });
  
    this.socketClient.activate(); // WebSocket-Verbindung starten

  }

  subscribeToTopics(userId: number) {
    this.unsubscribeAll();

    this.subscriptions.push(
      this.socketClient.subscribe(
        `/user/${userId}/notification/add-list`,
        (message: any) => {
          const parsedData = JSON.parse(message.body);
          const shoppinglistDto: ShoppinglistDto = {
            id: parsedData.id,
            name: parsedData.name,
            shoppingItems: []
          } 
          console.log(parsedData);
          this.shoppingLists().push(shoppinglistDto);
        }
      )
    );

    this.subscriptions.push(
      this.socketClient.subscribe(
        `/user/${userId}/notification/update-list`,
        (message: any) => {
          const parsedData = JSON.parse(message.body);
          console.log(parsedData);
          const updatedList = this.shoppingLists().map(item => 
            item.id === parsedData.id ? {...item, name: parsedData.name} : item
          );
          this.shoppingLists.set(updatedList);
        }
      )
    );

    this.subscriptions.push(
      this.socketClient.subscribe(
        `/user/${userId}/notification/delete-list`,
        (message: any) => {
          const parsedData = JSON.parse(message.body);
          console.log(parsedData);
          const updatedList = this.shoppingLists().filter(item => item.id !== parsedData.id);
          this.shoppingLists.set(updatedList);
        }
      )
    );

    this.subscriptions.push(
      this.socketClient.subscribe(
        `/user/${userId}/notification/add-item`,
        (message: any) => {
          const parsedData = JSON.parse(message.body);
          console.log(parsedData);
          const newItem: ShoppingitemDto = {
            id: parsedData.id!,
            name: parsedData.name,
            completed: parsedData.completed
          }

          const updatedList = this.shoppingLists().map(list => {
            if (list.id === parsedData.shoppingListId) {
              return {
                ...list,  // Erstellt eine neue Kopie der Shoppingliste
                shoppingItems: [...list.shoppingItems, newItem] // Fügt das neue Item hinzu
              };
            }
            return list; // Unveränderte Listen zurückgeben
          });

          this.shoppingLists.set(updatedList);
        }
      )
    );
    
    this.subscriptions.push(
      this.socketClient.subscribe(
        `/user/${userId}/notification/update-item`,
        (message: any) => {
          const parsedData = JSON.parse(message.body);
          console.log(parsedData);
          const updatedItem: ShoppingitemDto = {
            id: parsedData.id!,
            name: parsedData.name,
            completed: parsedData.completed
          }
          const updatedList = this.shoppingLists().map(list => {
            if (list.shoppingItems.some(item => item.id === updatedItem.id)) {
              return {
                ...list,
                shoppingItems: list.shoppingItems.map(item =>
                  item.id === updatedItem.id ? updatedItem : item
                )
              };
            }
            return list;
          });
          this.shoppingLists.set(updatedList);
        }
      )
    );
    
    this.subscriptions.push(
      this.socketClient.subscribe(
        `/user/${userId}/notification/delete-item`,
        (message: any) => {
          const parsedData = JSON.parse(message.body);
          console.log(parsedData);
          const updatedList = this.shoppingLists().map(list => {
            if (list.id === parsedData.shoppingListId) {
              return {
                ...list,
                shoppingItems: list.shoppingItems.filter(item => item.id !== parsedData.id)
              };
            }
            return list;
          });
          this.shoppingLists.set(updatedList);
        }
      )
    );
    
  }

  disconnectWebSocket() {
    this.unsubscribeAll();
    this.socketClient.deactivate();
  }
  
  private unsubscribeAll() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  onLogout() {
    this.authService.logout();
    this.disconnectWebSocket();
    this.router.navigateByUrl("/auth", { replaceUrl: true });
  }

  ngOnDestroy() {
    this.disconnectWebSocket();
  }
}
