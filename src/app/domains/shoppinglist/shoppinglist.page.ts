import { Component, OnInit, QueryList, ViewChildren } from '@angular/core';
import { ShoppinglistService } from './shoppinglist.service';
import { AddEditShoppinglistDto } from './add-edit-shoppinglist-dto';
import { AlertService } from 'src/app/utils/alert.service';
import { AlertController, IonInput, IonItemSliding, LoadingController } from '@ionic/angular';
import { ShoppinglistDto } from './shoppinglist-dto';
import { AddEditShoppingItemDto } from './add-edit-shopping-item-dto';
import { ShoppingitemDto } from './shoppingitem-dto';
import { Subscription } from 'rxjs';
import { WebSocketService } from 'src/app/utils/websocket.service';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-shoppinglist',
  templateUrl: './shoppinglist.page.html',
  styleUrls: ['./shoppinglist.page.scss'],
  standalone: false
})
export class ShoppinglistPage implements OnInit {
  @ViewChildren(IonInput) inputFields!: QueryList<IonInput>; 
  public shoppingLists = this.shoppinglistService.getShoppingLists();
  public isLoading: boolean = true;
  public toggleLists: any = {};
  public newItemInputs: { [listId: number]: string } = {};
  private subscriptions: Subscription[] = [];

  // TODO: get groupId from the server
  public groupId: number = 14;

  constructor(
    private shoppinglistService: ShoppinglistService,
    private alertService: AlertService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private webSocketService: WebSocketService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.subscriptions.push(
      this.webSocketService.getConnectionState().subscribe((isConnected) => {
        if (isConnected) {
          this.authService.user.subscribe(user => {
            if (user) {
              this.subscribeToTopics(user.id);
            }
          });
        }
      })
    );
  }

  ionViewWillEnter() {
    this.shoppinglistService.getShoppingListsWithItems(this.groupId);
    this.isLoading = false;
  }

  ngOnDestroy() {
    this.webSocketService.unsubscribeAll();
  }

  onCreateList() {
    this.alertService.presentInputAlert({
      header: 'Neue Einkaufsliste:',
      placeholder: 'Name der Einkaufsliste',
      okText: 'OK',
      cancelText: 'Abbrechen',
      onConfirm: async (listName) => {
        const loading = await this.alertService.presentLoading(
          'Erstelle Einkaufsliste...'
        );
        const newShoppingList: AddEditShoppinglistDto = {
          id: null,
          name: listName.trim(),
          groupId: this.groupId,
        };
        this.shoppinglistService.addShoppingList(newShoppingList);
        loading.dismiss();
      },
    });
  }

  onUpdateList(list: ShoppinglistDto, slidingItem: IonItemSliding) {
    slidingItem.close();
    this.alertCtrl.create({
      header: "Einkaufsliste bearbeiten:",
      buttons: [{
        text: "Abbrechen",
        role: "cancel"
      }, {
        text: "ok",
        handler: (data) => {
          this.loadingCtrl.create({
            message: "Bearbeite Einkaufsliste..."
          }).then(loadingEl => {
            const updateShoppingList: AddEditShoppinglistDto = {
              id: list.id, 
              name: data.listName.trim(), 
              groupId: this.groupId
            };

            this.shoppinglistService.updateShoppingList(updateShoppingList)
            loadingEl.dismiss();
          })
        }
      }],
      inputs: [
        {
          name: "listName",
          value: list.name
        }
      ]
    }).then(alertEl => alertEl.present().then(() => {
      const inputField = document.querySelector('ion-alert input') as HTMLElement;
      if (inputField) {
        inputField.focus();
      }
    }))
  }

  onDeleteList(list: ShoppinglistDto, slidingItem: IonItemSliding) {
    slidingItem.close();
    this.alertCtrl.create({
      header: 'Löschen',
      message: `Möchtest du die Einkaufsliste "${list.name}" wirklich löschen inkl. aller Einträge?`,
      buttons: [{
        text: "Nein",
        role: "cancel"
      }, {
        text: 'Ja',
        handler: () => {
          this.loadingCtrl.create({
            message: 'Lösche Einkaufsliste...'
          }).then(loadingEl => {
            const deletedShoppinglist: AddEditShoppinglistDto = {
              id: list.id,
              name: list.name,
              groupId: this.groupId
            }
            this.shoppinglistService.deleteShoppingList(deletedShoppinglist);
            loadingEl.dismiss();
          })
        }
      }]
    }).then(alertEl => alertEl.present());
  }
  
  onCreateItem(list: ShoppinglistDto) {
    if (!this.newItemInputs[list.id]?.trim()) return;

    const newItem: AddEditShoppingItemDto = {
      id: null,
      name: this.newItemInputs[list.id].trim(),
      completed: false,
      shoppingListId: list.id,
      groupId: this.groupId,
    }
    this.newItemInputs[list.id] = '';
    this.shoppinglistService.addItemToShoppingList(newItem);
    setTimeout(() => { this.focusInput(list.id); }, 100);
  }

  private focusInput(listId: number) {
    const inputElement = this.inputFields.find((_, index) => this.shoppingLists()[index].id === listId);
    if (inputElement) {
      inputElement.setFocus();
    } else {
      console.warn('Kein passendes Input-Feld gefunden für List ID:', listId);
    }
  }

  onUpdateItem(list: ShoppinglistDto, item: ShoppingitemDto) {
    this.alertCtrl.create({
      header: "Eintrag bearbeiten:",
      buttons: [{
        text: "Abbrechen",
        role: "cancel"
      }, {
        text: "ok",
        handler: (data) => {
          this.loadingCtrl.create({
            message: "Bearbeite Eintrag..."
          }).then(loadingEl => {
            const updateShoppingItem: AddEditShoppingItemDto = {
              id: item.id,
              name: data.itemName,
              completed: item.completed,
              groupId: this.groupId,
              shoppingListId: list.id
            };
            
            this.shoppinglistService.updateItemOfShoppingList(updateShoppingItem);
            loadingEl.dismiss();
          })
        }
      }],
      inputs: [
        {
          name: "itemName",
          value: item.name
        }
      ]
    }).then(alertEl => alertEl.present().then(() => {
      const inputField = document.querySelector('ion-alert input') as HTMLElement;
      if (inputField) {
        inputField.focus();
      }
    }));
  }

  onDeleteItem(list: ShoppinglistDto, item: ShoppingitemDto) {
    const deletedItem: AddEditShoppingItemDto = {
      id: item.id,
      name: item.name,
      completed: item.completed,
      shoppingListId: list.id,
      groupId: this.groupId,
    }
    this.shoppinglistService.deleteItemFromShoppingList(deletedItem);
  }

  markAsDone(list: ShoppinglistDto, item: ShoppingitemDto) {
    item.completed = !item.completed;
    let updateShoppingItem: AddEditShoppingItemDto = {
      id: item.id,
      name: item.name,
      completed: item.completed,
      groupId: this.groupId,
      shoppingListId: list.id
    };
    this.shoppinglistService.updateItemOfShoppingList(updateShoppingItem);
  }

  deleteListOfItems(list: ShoppinglistDto) {
    list.shoppingItems.forEach(item => {
      if (item.completed) {
        this.onDeleteItem(list, item);
      }
    })
  }

  private subscribeToTopics(userId: number) {

    this.webSocketService.subscribe(
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

    this.webSocketService.subscribe(
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

    this.webSocketService.subscribe(
      `/user/${userId}/notification/delete-list`,
      (message: any) => {
        const parsedData = JSON.parse(message.body);
        console.log(parsedData);
        const updatedList = this.shoppingLists().filter(item => item.id !== parsedData.id);
        this.shoppingLists.set(updatedList);
      }
    )

    this.webSocketService.subscribe(
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

    this.webSocketService.subscribe(
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

    this.webSocketService.subscribe(
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
  }
}
