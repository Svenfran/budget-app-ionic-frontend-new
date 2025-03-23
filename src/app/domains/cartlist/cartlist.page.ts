import { Component, effect, OnInit, signal } from '@angular/core';
import { CartService } from './service/cart.service';
import { GroupService } from 'src/app/service/group.service';
import { User } from 'src/app/auth/user';
import { AuthService } from 'src/app/auth/auth.service';
import { AlertController, IonItemSliding, LoadingController, ModalController } from '@ionic/angular';
import { Cart } from './model/cart';
import { Router } from '@angular/router';
import { OverviewService } from '../overview/service/overview.service';
import { CategoryService } from 'src/app/service/category.service';
import * as moment from 'moment';
import { SettlementPaymentPage } from 'src/app/settlement-payment/settlement-payment.page';
import { INIT_VALUES } from 'src/app/constants/default-values';
import { FilterModalPage } from 'src/app/filter-modal/filter-modal.page';
import { CartFilter } from 'src/app/filter-modal/model/CartFilter';

@Component({
  selector: 'app-cartlist',
  templateUrl: './cartlist.page.html',
  styleUrls: ['./cartlist.page.scss'],
  standalone: false
})
export class CartlistPage implements OnInit {

  public DELETED: string = "gelöscht";
  
  public cartList = this.cartService.cartList;
  public initCartList = this.cartService.initCartList;
  public activeGroup = this.groupService.activeGroup();
  public filterTerm = signal<string>('');
  public filterMode = signal<boolean>(false);
  public sum = this.cartService.sum;
  public count = this.cartService.count;
  public isLoading: boolean = true;
  public user: User | undefined;
  public visibleItems: Set<number> = new Set<number>();
  public hidden: boolean = true;
  public cartFilter: CartFilter = {};
  public cartVisible: boolean = false;

  constructor(
    private cartService: CartService,
    private groupService: GroupService,
    private authService: AuthService,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private router: Router,
    private overviewService: OverviewService,
    private categoryService: CategoryService,
    private modalCtrl: ModalController
  ) { 
    effect(() => {
      this.activeGroup = this.groupService.activeGroup();
      this.overviewService.overviewRefresh();
      this.categoryService.categoryUpdate();
      this.groupService.memberUpdated();
      this.isLoading = true;
      if (!this.activeGroup.flag?.includes(INIT_VALUES.DEFAULT)) {
        this.cartService.getCartListByGroupId(this.activeGroup);
        this.resetFilterParams();
      }
      this.isLoading = false;
      this.cartVisible = false;
    });
  
  }

  ngOnInit() {
    this.authService.user.subscribe(user => {
      if (user) this.user = user;
    })
  }

  // TODO: Evtl. nur option in Filtermodal -> Gelöschte Nutzer -> if true -> filter carts?!
  toggleCartVisability() {
    if (!this.cartVisible) {
      this.cartList.set(this.initCartList());
      this.cartVisible = true;
    } else {
      this.cartList.update(carts => 
        carts.filter(cart => 
          cart.deleted === false
        )
      )
      this.cartVisible = false;
    }
  }

  resetFilterParams() {
    this.filterMode.set(false);
    this.filterTerm.set("");
    this.cartFilter = {};
    this.cartVisible = false;
  }
  
  refreshCartList(event: CustomEvent) {
    setTimeout(() => {
      this.cartService.getCartListByGroupId(this.activeGroup, true);
      this.resetFilterParams();
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

  download() {
    let filename = "Ausgaben_" + this.activeGroup.name.replace(/ /g, "-") + "_" + moment().format('YYYYMMDDHHmmss') + ".xlsx";
    this.cartService.getExcelFile(this.activeGroup, filename);
  }

  onFilter(action: string, filterTerm: string) {
    this.cartFilter = {};
    if (!this.filterMode()) {
      this.filterMode.set(true);
      this.cartList.update(carts => carts.filter(cart => 
        action === "user" ? cart.userDto.userName === filterTerm : cart.categoryDto.name === filterTerm)
      );
      action === "user" ? this.cartFilter.userName = [filterTerm] : this.cartFilter.category = [filterTerm];
      this.filterTerm.set(filterTerm);
    } else {
      // this.cartService.getCartListByGroupId(this.activeGroup);
      this.resetFilterParams();
      this.cartList.set(this.initCartList());
    }
  }
  
  deleteFilter() {
    // this.cartService.getCartListByGroupId(this.activeGroup);
    this.resetFilterParams();
    this.cartList.set(this.initCartList());
  }

  async settlementPayment() {
    const modal = this.modalCtrl.create({
      component: SettlementPaymentPage,
      backdropDismiss: true
    });

    (await modal).onDidDismiss().then((response) => {
      if (response.data) {
        this.cartService.addSettlementPayment(response.data);
      }
    });
    return (await modal).present();
  }

  async filterModal() {
    const modal = this.modalCtrl.create({
      component: FilterModalPage,
      componentProps: { 
        activeGroupId: this.activeGroup.id,
        cartFilter: this.cartFilter
      },
      backdropDismiss: true
    });

    (await modal).onDidDismiss().then((response) => {
      if (response.data) {
        this.filterCarts(response.data);
        this.cartFilter = response.data;
      }
    });

    return (await modal).present();
  }

  filterCarts(cartFilter: CartFilter) {
    if (Object.values(cartFilter).every(field => field == null)) {
      this.resetFilterParams();
      this.cartList.set(this.initCartList());
      return;
    }

    this.filterTerm.set('');
    this.cartList.set(this.initCartList());
    this.cartList.update(carts => 
      carts.filter(cart =>
        (cartFilter.title ? cart.title?.toLowerCase().includes(cartFilter.title.toLowerCase()) : true) &&
        (cartFilter.description ? cart.description?.toLowerCase().includes(cartFilter.description.toLowerCase()) : true) &&
        (cartFilter.category && cartFilter.category.length > 0 ? cartFilter.category.includes(cart.categoryDto.name) : true) &&
        (cartFilter.userName && cartFilter.userName.length > 0 ? cartFilter.userName.includes(cart.userDto.userName) : true) &&
        (cartFilter.startDate ? new Date(cart.datePurchased) >= cartFilter.startDate : true) &&
        (cartFilter.endDate ? new Date(cart.datePurchased) <= cartFilter.endDate : true)
    ))

    this.filterMode.set(true);
  }
}
