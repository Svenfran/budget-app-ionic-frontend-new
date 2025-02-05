import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import * as SockJS from 'sockjs-client';
import * as Stomp from 'stompjs';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socketClient: any;
  private subscriptions: Map<string, any> = new Map();
  private reconnectInterval = 5000;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  constructor() {}

  connect(userId: number, token: string) {
    console.log("Versuche, WebSocket zu verbinden...");

    let ws = new SockJS(`${environment.apiBaseUrl}/ws`);
    this.socketClient = Stomp.over(ws);

    this.socketClient.connect({ "Authorization": token }, () => {
      console.log("Verbunden mit WebSocket.");
      this.reconnectAttempts = 0;

      // Alle gespeicherten Subscriptions neu abonnieren
      this.subscriptions.forEach((callback, endpoint) => {
        this.subscribe(endpoint, callback);
      });

    }, (error: any) => {
      console.error("WebSocket-Verbindung verloren. Fehler:", error);
      this.handleReconnect(userId, token);
    });
  }

  private handleReconnect(userId: number, token: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnect-Versuch #${this.reconnectAttempts} in ${this.reconnectInterval / 1000} Sekunden...`);
      setTimeout(() => {
        this.connect(userId, token);
      }, this.reconnectInterval);
    } else {
      console.warn("Maximale Anzahl an Reconnect-Versuchen erreicht. WebSocket wird nicht erneut versucht.");
    }
  }

  subscribe(endpoint: string, callback: (message: any) => void) {
    if (!this.socketClient || !this.socketClient.connected) {
      console.warn(`WebSocket nicht verbunden. Speichere Subscription für später: ${endpoint}`);
      this.subscriptions.set(endpoint, callback);
      return;
    }

    if (this.subscriptions.has(endpoint)) {
      console.warn(`Bereits subscribed: ${endpoint}`);
      return;
    }

    console.log(`Subscribing to ${endpoint}`);
    let subscription = this.socketClient.subscribe(endpoint, (message: any) => {
      callback(JSON.parse(message.body));
    });

    this.subscriptions.set(endpoint, subscription);
  }

  unsubscribe(endpoint: string) {
    if (this.subscriptions.has(endpoint)) {
      console.log(`Unsubscribing from ${endpoint}`);
      this.subscriptions.get(endpoint).unsubscribe();
      this.subscriptions.delete(endpoint);
    }
  }

  disconnect() {
    if (this.socketClient && this.socketClient.connected) {
      console.log("WebSocket-Verbindung wird geschlossen...");
      this.socketClient.disconnect();
    }
  }
}
