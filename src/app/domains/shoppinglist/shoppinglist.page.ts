import { Component, OnInit, ViewChild } from '@angular/core';
import { ShoppinglistService } from './shoppinglist.service';
import { AddEditShoppinglistDto } from './add-edit-shoppinglist-dto';
import { AlertService } from 'src/app/utils/alert.service';
import { AlertController, IonInput, IonItemSliding, LoadingController } from '@ionic/angular';
import { ShoppinglistDto } from './shoppinglist-dto';
import { AddEditShoppingItemDto } from './add-edit-shopping-item-dto';
import { ShoppingitemDto } from './shoppingitem-dto';

@Component({
  selector: 'app-shoppinglist',
  templateUrl: './shoppinglist.page.html',
  styleUrls: ['./shoppinglist.page.scss'],
  standalone: false
})
export class ShoppinglistPage implements OnInit {
  @ViewChild('shoppingItemInput', { static: false }) shoppingItemInput!: IonInput;
  public shoppingLists = this.shoppinglistService.getShoppingLists();
  public isLoading: boolean = true;
  public toggleLists: any = {};
  public newItemName: string = '';
  // TODO: get groupId from the server
  public groupId: number = 14;

  constructor(
    private shoppinglistService: ShoppinglistService,
    private alertService: AlertService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit() {
  }
  
  ionViewWillEnter() {
    this.shoppinglistService.getShoppingListsWithItems(this.groupId);
    this.isLoading = false;
  }

  ionViewWillLeave() {

  }

  ngOnDestroy() {
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
  
  onCreateItem(list: ShoppinglistDto, value: string) {
    const newItem: AddEditShoppingItemDto = {
      id: null,
      name: value.trim(),
      completed: false,
      shoppingListId: list.id,
      groupId: this.groupId,
    }
    this.newItemName = '';
    this.shoppinglistService.addItemToShoppingList(newItem);
    setTimeout(() => {
      this.shoppingItemInput.setFocus();
    }, 200);
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
}
