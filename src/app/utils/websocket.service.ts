import { Injectable } from '@angular/core';
import { Client, StompSubscription } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private socketClient!: Client;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private connectionState = new BehaviorSubject<boolean>(false);
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {}

  connect(token: string) {
    if (this.socketClient?.connected) {
      console.log('WebSocket bereits verbunden.');
      return;
    }

    this.socketClient = new Client({
      webSocketFactory: () => new SockJS(`${environment.apiBaseUrl}/ws`),
      connectHeaders: { Authorization: token },
      debug: (str) => console.log(str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('WebSocket verbunden!');
        this.connectionState.next(true);
        this.reconnectAttempts = 0;
      },
      onStompError: (frame) => console.error('STOMP-Fehler:', frame),
      onWebSocketClose: () => {
        console.warn('WebSocket geschlossen');
        this.connectionState.next(false);
        this.handleReconnect(token);
      },
    });

    this.socketClient.activate();
  }

  private handleReconnect(token: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnect-Versuch #${this.reconnectAttempts} in 5 Sekunden...`);
      setTimeout(() => {
        this.connect(token);
      }, 5000);
    } else {
      console.warn('Max. Anzahl an Reconnect-Versuchen erreicht.');
    }
  }

  subscribe(topic: string, callback: (message: any) => void) {    
    const subscription = this.socketClient.subscribe(topic, (message) => {
      callback(message);
    });

    this.subscriptions.set(topic, subscription);
  }

  unsubscribeAll() {
    this.subscriptions.forEach((sub) => 
      sub.unsubscribe()
    );
    this.subscriptions.clear();
  }

  disconnect() {
    this.unsubscribeAll();
    this.socketClient.deactivate();
    this.connectionState.next(false);
  }

  getConnectionState(): Observable<boolean> {
    return this.connectionState.asObservable();
  }
}
