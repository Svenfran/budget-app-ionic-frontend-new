import { Component, effect, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, IonDatetime, LoadingController, MenuController } from '@ionic/angular';
import { CategoryService } from 'src/app/service/category.service';
import { GroupService } from 'src/app/service/group.service';
import { CartService } from '../service/cart.service';
import { Cart } from '../model/cart';
import { User } from 'src/app/auth/user';
import { AuthService } from 'src/app/auth/auth.service';
import * as moment from 'moment';
import { CategoryDto } from 'src/app/model/category-dto';


@Component({
  selector: 'app-new-edit-cart',
  templateUrl: './new-edit-cart.page.html',
  styleUrls: ['./new-edit-cart.page.scss'],
  standalone: false
})
export class NewEditCartPage implements OnInit {
  @ViewChild(IonDatetime) datetime!: IonDatetime;

  public isAddMode: boolean = true;
  public cartId: string | null = null;
  public form!: FormGroup;
  public showPicker = false;
  public dateValue = "";
  public formattedString = "";
  public minDate = "";
  public maxDate = "";
  public today = new Date();
  public user!: User;
  public categories = this.categoryService.getCategories();
  public activeGroup = this.groupService.activeGroup();
  public cartList = this.cartService.getCartList();
  public zeitraeume = this.groupService.getGroupMembershipHistory();

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private groupService: GroupService,
    private cartService: CartService,
    private authService: AuthService,
    private menuCtrl: MenuController,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private router: Router
  ) {
    effect(() => {
      const activeGroup = this.groupService.activeGroup();
      if (activeGroup) {
        this.groupService.getGroupMembershipHistoryForGroupAndUser(activeGroup);
      }
    })
  }

  ngOnInit() {
    this.initializeForm();
    this.categoryService.getCategoriesByGroup(this.activeGroup);

    this.cartId = this.route.snapshot.paramMap.get('id');
    this.isAddMode = !this.cartId;

    this.authService.user.subscribe(user => {
      if (user) this.user = user;
    })

    this.setInitialFormValues();
  }

  ionViewWillLeave() {
    this.menuCtrl.enable(true, 'm1');
  }

  ionViewWillEnter() {
    this.menuCtrl.enable(false, 'm1');
  }

  initializeForm() {
    this.form = this.fb.group({
      id:[''],
      title: ['',[ Validators.required ]],
      amount: ['',[ Validators.required, Validators.pattern('[+-]?([0-9]*[.])?[0-9]+')]],
      description: [''],
      datePurchased: ['',[ Validators.required, Validators.pattern('(0[1-9]|1[0-9]|2[0-9]|3[01]).(0[1-9]|1[012]).[0-9]{4}')]],
      categoryId: ['',[ Validators.required ]]
    });
  }

  get title() {return this.form.get('title');}
  get description() {return this.form.get('description');}
  get amount() {return this.form.get('amount');}
  get datePurchased() {return this.form.get('datePurchased');}
  get categoryId() {return this.form.get('category');}


  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.isAddMode) {
      this.onCreateCart();
    } else {
      this.onUpdateCart();
    }
  }

  onCreateCart() {
    this.loadingCtrl.create({
      message: "Füge Einkauf hinzu..."
    }).then(loadingEl => {
      const category = this.categories().find(cat => cat.id === this.form.value.categoryId)!;
      const categoryDto: CategoryDto = {
        id: category.id,
        name: category.name,
        groupId: category.groupId
      }
      const newCart: Cart = {
        id: null,
        title: this.form.value.title,
        description: this.form.value.description,
        amount: this.form.value.amount,
        datePurchased: this.getDateFromString(this.form.value.datePurchased),
        groupId: this.activeGroup.id,
        userDto: null!,
        categoryDto: categoryDto
      }
      this.cartService.addCart(newCart);
      loadingEl.dismiss();
      this.form.reset();
      this.router.navigate(["domains", "tabs", "cartlist"])
    })
  }

  onUpdateCart() {
    this.loadingCtrl.create({
      message: "Bearbeite Einkauf ..."
    }).then(loadingEl => {
      const category = this.categories().find(cat => cat.id === this.form.value.categoryId)!;
      const categoryDto: CategoryDto = {
        id: category.id,
        name: category.name,
        groupId: category.groupId
      }
      const updatedCart: Cart = {
        id: this.form.value.id,
        title: this.form.value.title,
        description: this.form.value.description,
        amount: this.form.value.amount,
        datePurchased: this.getDateFromString(this.form.value.datePurchased),
        groupId: this.activeGroup.id,
        userDto: null!,
        categoryDto: categoryDto
      }
      this.cartService.updateCart(updatedCart);
      loadingEl.dismiss();
      this.form.reset();
      this.router.navigate(["domains", "tabs", "cartlist"])
    })
  }

  setInitialFormValues() {
    this.setToday();

    this.minDate = moment(this.activeGroup.dateCreated).format('YYYY-MM-DD') + 'T00:00:00';
    this.maxDate = moment().add(1, 'year').format('YYYY-MM-DD') + 'T00:00:00';

    if (!this.isAddMode) {
      const cart: Cart = this.cartList().find(c => c.id === +this.cartId!)!;
      this.setDate(cart.datePurchased)
      this.form.patchValue({
        id: cart.id,
        title: cart.title,
        amount: cart.amount.toFixed(2),
        description: cart.description,
        datePurchased: this.formattedString,
        categoryId: cart.categoryDto.id
      })
    } else if (this.isAddMode) {
      this.form.patchValue({
        datePurchased: this.formattedString
      });
    }
  }

  formatToISODate(date: Date | string): string {
    return new Date(date).toISOString().split('T')[0] + 'T00:00:00';
  }

  setToday() {
    this.formattedString = moment().format('DD.MM.YYYY');
    this.dateValue = moment().startOf('day').format('YYYY-MM-DD') + 'T00:00:00';
  }
  
  setDate(date: Date) {
    this.formattedString = moment(date).format('DD.MM.YYYY');
    this.dateValue = moment(date).startOf('day').format('YYYY-MM-DD') + 'T00:00:00';
  }
  
  dateChanged(value: string | string[] | null | undefined) {
    if (Array.isArray(value)) {
      value = value[0];
    }
    
    if (value) {
      this.formattedString = moment(value).format('DD.MM.YYYY');
      this.dateValue = moment(value).startOf('day').format('YYYY-MM-DD') + 'T00:00:00';
      this.form.controls['datePurchased'].setValue(this.formattedString);
      this.showPicker = false;
    }
  }

  close() {
    this.datetime.cancel(true);
  }

  select() {
    this.datetime.confirm(true);
  }

  getDateFromString(formattedString: string) {
    return new Date(formattedString.replace(/(\d{2}).(\d{2}).(\d{4})/, "$3-$2-$1"));
  }


  isDateSelectable = (dateIsoString: string) => {
    const date = new Date(this.formatDateString(dateIsoString));
    return this.zeitraeume().some(zeitraum => {

      const startDate = new Date(this.formatDateString(zeitraum.startDate.toString()));
      const endDate = zeitraum.endDate ? new Date(this.formatDateString(zeitraum.endDate.toString())) : null;

      const result =
        date >= startDate &&
        (endDate === null || date <= endDate) &&
        zeitraum.userId === this.user.id &&
        zeitraum.groupId === this.activeGroup.id;

      return result;
    });
  };

  formatDateString(dateString: string) {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0] + 'T00:00:00'
  }
}
