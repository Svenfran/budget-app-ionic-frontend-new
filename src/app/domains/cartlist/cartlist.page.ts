import { Component, effect, OnInit } from '@angular/core';
import { CartService } from './service/cart.service';
import { GroupService } from 'src/app/service/group.service';
import { User } from 'src/app/auth/user';
import { AuthService } from 'src/app/auth/auth.service';
import { AlertController, IonItemSliding, LoadingController } from '@ionic/angular';
import { Cart } from './model/cart';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cartlist',
  templateUrl: './cartlist.page.html',
  styleUrls: ['./cartlist.page.scss'],
  standalone: false
})
export class CartlistPage implements OnInit {

  public cartList = this.cartService.getCartList();
  public activeGroup = this.groupService.activeGroup();
  public sum = this.cartService.sum();
  public count =  this.cartService.count();
  public isLoading: boolean = true;
  public user: User | undefined;
  public filterTerm: string = "";
  public filterMode = false;
  public visibleItems: Set<number> = new Set<number>();
  public hidden: boolean = true;

  constructor(
    private cartService: CartService,
    private groupService: GroupService,
    private authService: AuthService,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private router: Router
  ) { 
    effect(() => {
      this.activeGroup = this.groupService.activeGroup();
      if (this.activeGroup) {
        this.cartService.getCartListByGroupId(this.activeGroup);
        this.sum = this.cartService.sum();
        this.count = this.cartService.count();
        this.isLoading = false;
      }
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
      this.cartService.getCartListByGroupId(this.activeGroup);
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

}
