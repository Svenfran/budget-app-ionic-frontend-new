import { Component, effect, OnInit, signal } from '@angular/core';
import { CartService } from './service/cart.service';
import { GroupService } from 'src/app/service/group.service';
import { User } from 'src/app/auth/user';
import { AuthService } from 'src/app/auth/auth.service';
import { AlertController, IonItemSliding, LoadingController } from '@ionic/angular';
import { Cart } from './model/cart';
import { Router } from '@angular/router';
import { OverviewService } from '../overview/service/overview.service';
import { CategoryService } from 'src/app/service/category.service';

@Component({
  selector: 'app-cartlist',
  templateUrl: './cartlist.page.html',
  styleUrls: ['./cartlist.page.scss'],
  standalone: false
})
export class CartlistPage implements OnInit {

  public cartList = this.cartService.cartList;
  public activeGroup = this.groupService.activeGroup();
  public filterTerm = signal<string>('');
  public filterMode = signal<boolean>(false);
  public sum = this.cartService.sum;
  public count = this.cartService.count;
  public isLoading: boolean = true;
  public user: User | undefined;
  public visibleItems: Set<number> = new Set<number>();
  public hidden: boolean = true;

  constructor(
    private cartService: CartService,
    private groupService: GroupService,
    private authService: AuthService,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private router: Router,
    private overviewService: OverviewService,
    private categoryService: CategoryService
  ) { 
    effect(() => {
      this.activeGroup = this.groupService.activeGroup();
      this.overviewService.overviewRefresh();
      this.categoryService.categoryUpdate();
      this.isLoading = true;
      if (this.activeGroup) {
        this.cartService.getCartListByGroupId(this.activeGroup);
      }
      this.isLoading = false;
    });
  
  }

  ngOnInit() {
    this.authService.user.subscribe(user => {
      if (user) {
        this.user = user;
      }
    })
  }

  refreshCartList(event: CustomEvent) {
    setTimeout(() => {
      this.cartService.getCartListByGroupId(this.activeGroup, true);
      this.filterMode.set(false);
      this.filterTerm.set("");
      (event.target as HTMLIonRefresherElement).complete();
    }, 2000);
  }

  toggleDescriptionVisibility(index: number) {
    if (this.visibleItems.has(index)) {
      this.visibleItems.delete(index);
    } else {
      this.visibleItems.add(index);
    }
  }

  isDescriptionVisible(index: number): boolean {
    return this.visibleItems.has(index);
  }

  onDeleteCart(cart: Cart, slidingItem: IonItemSliding) {
    slidingItem.close();
    this.alertCtrl.create({
      header: 'Löschen',
      message: `Möchtest du den Eintrag "${cart.title}" wirklich löschen?`,
      buttons: [{
        text: 'Nein'
      }, {
        text: 'Ja',
        handler: () => {
          this.loadingCtrl.create({
            message: 'Lösche Einkauf...'
          }).then(loadingEl => {
            loadingEl.present(),
            this.cartService.deleteCart(cart.id!)
            loadingEl.dismiss();
          })
        }
      }]
    }).then(alertEl => alertEl.present());
  }

  editCart(cart: Cart, slidingItem: IonItemSliding) {
    slidingItem.close();
    this.router.navigate(['domains', 'tabs', 'cartlist', 'new-edit', cart.id?.toString()]);
  }


  onFilter(action: string, filterTerm: string) {
    if (!this.filterMode()) {
      this.filterMode.set(true);
      this.cartList.update(carts => carts.filter(cart => 
        action === "user" ? cart.userDto.userName === filterTerm : cart.categoryDto.name === filterTerm))
      this.filterTerm.set(filterTerm);
    } else {
      this.cartService.getCartListByGroupId(this.activeGroup);
      this.filterMode.set(false);
      this.filterTerm.set("");
    }
  }

  deleteFilter() {
    this.cartService.getCartListByGroupId(this.activeGroup);
    this.filterMode.set(false);
    this.filterTerm.set("");
  }
}
