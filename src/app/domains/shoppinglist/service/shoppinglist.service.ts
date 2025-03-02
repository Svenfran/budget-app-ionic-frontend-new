import { HttpClient } from '@angular/common/http';
import { Injectable, signal, WritableSignal } from '@angular/core';
import { environment } from 'src/environments/environment';
import { AddEditShoppinglistDto } from '../model/add-edit-shoppinglist-dto';
import { ShoppinglistDto } from '../model/shoppinglist-dto';
import { AddEditShoppingItemDto } from '../model/add-edit-shopping-item-dto';
import { ShoppingitemDto } from '../model/shoppingitem-dto';
import { INIT_VALUES } from 'src/app/constants/default-values';
import { Group } from 'src/app/model/group';

@Injectable({
  providedIn: 'root'
})
export class ShoppinglistService {

  private shoppingLists: WritableSignal<ShoppinglistDto[]> = signal<ShoppinglistDto[]>([]);
  private apiBaseUrl = environment.apiBaseUrl;
  private shoppingListsWithItemsUrl = `${this.apiBaseUrl}/api/groups/shopping-lists-with-items`;
  private addShoppingListUrl = `${this.apiBaseUrl}/api/groups/shopping-list/add`;
  private deleteShoppingListUrl = `${this.apiBaseUrl}/api/groups/shopping-list/delete`;
  private updateShoppingListUrl = `${this.apiBaseUrl}/api/groups/shopping-list/update`;
  private INITIAL_REQUEST_TIMESTAMP: number = new Date('1900-01-01').getTime();

  private addItemToShoppingListUrl = `${this.apiBaseUrl}/api/groups/shopping-list/add-item`;
  private updateItemToShoppingListUrl = `${this.apiBaseUrl}/api/groups/shopping-list/update-item`;
  private deleteItemToShoppingListUrl = `${this.apiBaseUrl}/api/groups/shopping-list/delete-item`;

  constructor(private http: HttpClient) {}

  public getShoppingLists() {
    return this.shoppingLists;
  }

  getShoppingListsWithItems(group: Group, requestTimeStamp: number = this.INITIAL_REQUEST_TIMESTAMP): void{
    if (group.flag?.includes(INIT_VALUES.DEFAULT)) {
      this.shoppingLists.set([]);
      return;
    };

    const requestParam = `?requestTimeStamp=${requestTimeStamp}`;
    this.http
      .get<ShoppinglistDto[]>(`${this.shoppingListsWithItemsUrl}/${group.id}${requestParam}`)
      .subscribe({
        next: (result) => {
          this.shoppingLists.set(result || []);
        },
        error: (err) => {
          console.error('Error fetching shoppinglists:', err);
          this.shoppingLists.set([]);
        },
      });
  }

  addShoppingList(newShoppingList: AddEditShoppinglistDto): void {
    const currentShoppingLists = this.shoppingLists();
    this.http
      .post<AddEditShoppinglistDto>(this.addShoppingListUrl, newShoppingList)
      .subscribe({
        next: (result) => {
          const newList: ShoppinglistDto = {
              id: result.id!,
              name: result.name,
              shoppingItems: []
          }
          this.shoppingLists.update(items => [...items, newList]);
        },
        error: (err) => {
          console.error('Error adding shopping list:', err);
          this.shoppingLists.set(currentShoppingLists);
        },
    });
  }

  updateShoppingList(updateShoppingList: AddEditShoppinglistDto): void {
    const currentShoppingLists = this.shoppingLists();
    this.http
      .put<AddEditShoppinglistDto>(this.updateShoppingListUrl, updateShoppingList)
      .subscribe({
        next: (result) => {
          this.shoppingLists.update(items => items.map(list => 
            list.id === result.id ? {...list, name: result.name} : list
          ))
        },
        error: (err) => {
          console.error("Error updating shopping list:", err);
          this.shoppingLists.set(currentShoppingLists);
        }
      })
  }

  deleteShoppingList(deleteShoppingList: AddEditShoppinglistDto): void {
    const currentShoppingLists = this.shoppingLists();
    this.http
      .post<void>(this.deleteShoppingListUrl, deleteShoppingList)
      .subscribe({
        next: () => {
          this.shoppingLists.update(items => items.filter(list => 
            list.id !== deleteShoppingList.id
          ))
        },
        error: (err) => {
          console.error('Error deleting shopping list:', err);
          this.shoppingLists.set(currentShoppingLists);
        }
      });
  }

  // SHOPPINGITEMS  
  
  addItemToShoppingList(newShoppingItem: AddEditShoppingItemDto): void {
    const currentShoppingLists = this.shoppingLists();
    this.http
      .post<AddEditShoppingItemDto>(this.addItemToShoppingListUrl, newShoppingItem)
      .subscribe({
        next: (result) => {
          const newItem: ShoppingitemDto = {
            id: result.id!,
            name: result.name,
            completed: result.completed
          }

          this.shoppingLists.update(lists => 
            lists.map(list => 
              list.id === result.shoppingListId 
                ? { 
                    ...list, 
                    shoppingItems: [...list.shoppingItems, newItem] 
                  } 
                : list
            )
          );

        },
        error: (err) => {
          console.error("Error adding shopping item:", err);
          this.shoppingLists.set(currentShoppingLists);
        }
      })
    }

    updateItemOfShoppingList(updateShoppingItem: AddEditShoppingItemDto): void {
      const currentShoppingLists = this.shoppingLists();
      this.http
        .put<AddEditShoppingItemDto>(this.updateItemToShoppingListUrl, updateShoppingItem)
        .subscribe({
          next: (result) => {
            const updatedItem: ShoppingitemDto = {
              id: result.id!,
              name: result.name,
              completed: result.completed
            }

            this.shoppingLists.update(lists => 
              lists.map(list => 
                list.shoppingItems.some(item => item.id === updatedItem.id)
                  ? {
                      ...list,
                      shoppingItems: list.shoppingItems.map(item =>
                        item.id === updatedItem.id ? updatedItem : item
                      )
                    }
                  : list
              )
            )
          },
          error: (err) => {
            console.error("Error updating shopping item:", err);
            this.shoppingLists.set(currentShoppingLists);
          }
        })
    }

    deleteItemFromShoppingList(deleteShoppingItem: AddEditShoppingItemDto): void {
      const currentShoppingLists = this.shoppingLists();
      this.http
        .post<void>(this.deleteItemToShoppingListUrl, deleteShoppingItem)
        .subscribe({
          next: () => {
            this.shoppingLists.update(lists => 
              lists.map(list => 
                list.id === deleteShoppingItem.shoppingListId
                  ? {
                    ...list,
                    shoppingItems: list.shoppingItems.filter(item => item.id !== deleteShoppingItem.id)
                    }
                  : list
              )
            )
          },
          error: (err) => {
            console.error("Error deleting shopping item:", err);
            this.shoppingLists.set(currentShoppingLists);
          }
        })
    }
}
