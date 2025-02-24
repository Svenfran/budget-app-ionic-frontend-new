import { HttpClient } from '@angular/common/http';
import { computed, Injectable, signal, WritableSignal } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Cart } from '../model/cart';
import { Group } from 'src/app/model/group';
import { GROUP } from 'src/app/constants/default-values';
import { AlertService } from 'src/app/service/alert.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private apiBaseUrl = environment.apiBaseUrl;
  private cartlistUrl = `${this.apiBaseUrl}/api/carts/carts-by-groupid`;
  private deleteCartUrl = `${this.apiBaseUrl}/api/carts/delete`;
  private addCartUrl = `${this.apiBaseUrl}/api/carts/add`;
  private updateCartUrl = `${this.apiBaseUrl}/api/carts/update`;
  
  public cartList: WritableSignal<Cart[]> = signal<Cart[]>([]);
  public sum = computed(() => this.cartList().reduce((s, c) => s + (+c.amount), 0));
  public count = computed(() => this.cartList().length);

  public cartUpdated = signal(0);
  
  constructor(
    private http: HttpClient, 
    private alertService: AlertService
  ) {}

  triggerUpdate() {
    this.cartUpdated.set(this.cartUpdated() + 1)
  }

  getCartListByGroupId(group: Group, refresh?: boolean): void {
    if (group.flag?.includes(GROUP.DEFAULT)) {
      this.cartList.set([]);
      return;
    };

    this.http
      .get<Cart[]>(`${this.cartlistUrl}/${group.id}`)
      .subscribe({
        next: (result) => {
          this.cartList.set(result || []);
          if (refresh) { this.triggerUpdate(); }
        },
        error: (err) => {
          console.error('Error fetching cartlist:', err);
          this.cartList.set([]);
        }
      });
  }

  addCart(cart: Cart): void {
    const currentCartList = this.cartList();
    this.http
      .post<Cart>(this.addCartUrl, cart)
      .subscribe({
        next: (result) => {
          const newCart: Cart = {
            id: result.id,
            title: result.title,
            description: result.description,
            amount: result.amount,
            datePurchased: result.datePurchased,
            groupId: result.groupId,
            userDto: result.userDto,
            categoryDto: result.categoryDto
          }

          this.cartList.update(carts => {
            const updatedCarts = [...carts, newCart];
            return updatedCarts.sort((a, b) => new Date(b.datePurchased).getTime() - new Date(a.datePurchased).getTime());
          });

          this.triggerUpdate();
        },
        error: (err) => {
          console.error('Error adding cart:', err);
          this.cartList.set(currentCartList);
          if (err.error.includes('not within membership period')) {
            const header = "Datum nicht im Zeitraum der Mitgliedschaft";
            const message = "Du warst zu dem gewählten Zeitpunkt kein Mitglied der Gruppe. Bitte wähle ein anderes Datum."
            this.alertService.showErrorAlert(header, message);
          }
        }
      })
  }

  updateCart(cart: Cart): void {
    const currentCartList = this.cartList();
    this.http
      .put<Cart>(this.updateCartUrl, cart)
      .subscribe({
        next: (result) => {
          const updatedCart: Cart = {
            id: result.id,
            title: result.title,
            description: result.description,
            amount: result.amount,
            datePurchased: result.datePurchased,
            groupId: result.groupId,
            userDto: result.userDto,
            categoryDto: result.categoryDto
          }

          this.cartList.update(carts => {
            const updatedCarts = carts.map(c => (c.id === result.id ? { ...c, ...updatedCart } : c));
            return updatedCarts.sort((a, b) => new Date(b.datePurchased).getTime() - new Date(a.datePurchased).getTime());
          });

          this.triggerUpdate();
        },
        error: (err) => {
          console.error('Error updating cart:', err);
          this.cartList.set(currentCartList);
          if (err.error.includes('not within membership period')) {
            const header = "Datum nicht im Zeitraum der Mitgliedschaft";
            const message = "Du warst zu dem gewählten Zeitpunkt kein Mitglied der Gruppe. Bitte wähle ein anderes Datum."
            this.alertService.showErrorAlert(header, message);
          }
        }
      })
  }

  deleteCart(cartId: number): void {
    const currentCartList = this.cartList();
    this.http
      .delete<void>(`${this.deleteCartUrl}/${cartId}`)
      .subscribe({
        next: () => {
          this.cartList.update(carts => carts.filter(cart => 
            cart.id !== cartId
          ));

          this.triggerUpdate();
        },
        error: (err) => {
          console.error('Error deleting cart:', err);
          this.cartList.set(currentCartList);
        }
      })
  }

}
