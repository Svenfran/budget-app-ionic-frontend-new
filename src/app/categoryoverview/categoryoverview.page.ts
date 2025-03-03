import { Component, effect, OnInit } from '@angular/core';
import { CategoryService } from '../service/category.service';
import { CategoryDto } from '../model/category-dto';
import { GroupService } from '../service/group.service';
import { AlertController, LoadingController } from '@ionic/angular';
import { INIT_VALUES } from '../constants/default-values';
import { CartService } from '../domains/cartlist/service/cart.service';
import { AlertService } from '../service/alert.service';

@Component({
  selector: 'app-categoryoverview',
  templateUrl: './categoryoverview.page.html',
  styleUrls: ['./categoryoverview.page.scss'],
  standalone: false
})
export class CategoryoverviewPage implements OnInit {

  public categories = this.categoryService.categories;
  public isLoading: boolean = false;
  public activeGroup = this.groupService.activeGroup;

  constructor(
    private categoryService: CategoryService,
    private groupService: GroupService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private cartService: CartService
  ) { 
    effect(() => {
      this.activeGroup = this.groupService.activeGroup;
      this.isLoading = true;
      if (!this.activeGroup().flag?.includes(INIT_VALUES.DEFAULT)) {
        this.categoryService.getCategoriesByGroup(this.activeGroup());
      }
      this.isLoading = false;
    });
  }

  ngOnInit() {
  }

  refreshCategories(event: CustomEvent) {
    setTimeout(() => {
      this.categoryService.getCategoriesByGroup(this.activeGroup());
      (event.target as HTMLIonRefresherElement).complete();
    }, 2000);
  }

  onCreateCategory() {
    this.alertCtrl.create({
      header: "Neue Kategorie:",
      buttons: [{
        text: "Abbrechen",
        role: "cancel"
      }, {
        text: "ok",
        handler: (data) => {
          this.loadingCtrl.create({
            message: "Erstelle Kategorie..."
          }).then(loadingEl => {
            const newCategory: CategoryDto = {
              name: data.categoryName,
              groupId: this.activeGroup().id
            };
            this.categoryService.addCategory(newCategory);
            loadingEl.dismiss();
          })
        }
      }],
      inputs: [
        {
          name: "categoryName",
          placeholder: "Name der Kategorie"
        }
      ]
    }).then(alertEl => alertEl.present().then(() => {
      const inputField = document.querySelector('ion-alert input') as HTMLElement;
      if (inputField) {
        inputField.focus();
      }
    }));
  }

  onUpdateCategory(category: CategoryDto) {
    this.alertCtrl.create({
      header: "Kategorie bearbeiten:",
      buttons: [{
        text: "Abbrechen",
        role: "cancel"
      }, {
        text: "ok",
        handler: (data) => {
          this.loadingCtrl.create({
            message: "Bearbeite Kategorie..."
          }).then(loadingEl => {
            const foundCategory = this.categories().find(c => c.id === category.id);
            const updatedCategory: CategoryDto = {
              id: foundCategory?.id,
              name: data.categoryName,
              groupId: foundCategory?.groupId!
            };
            this.categoryService.updateCategory(updatedCategory);
            this.cartService.triggerUpdate();
            loadingEl.dismiss();
          })
        }
      }],
      inputs: [
        {
          name: "categoryName",
          value: category.name
        }
      ]
    }).then(alertEl => alertEl.present().then(() => {
      const inputField = document.querySelector('ion-alert input') as HTMLElement;
      if (inputField) {
        inputField.focus();
      }
    }));
  }
  
  onDeleteCategory(category: CategoryDto) {
    this.alertCtrl.create({
      header: "Löschen",
      message: `Möchtest du die Kategorie "${category.name}" wirklich löschen?`,
      buttons: [{
        text: "Nein",
        role: "cancel"
      }, {
        text: "Ja",
        handler: () => {
          this.loadingCtrl.create({
            message: "Lösche Kategorie..."
          }).then(loadingEl => {
            const deletedCategory = this.categories().find(c => c.id === category.id);
            this.categoryService.deleteCategory(deletedCategory!);
            loadingEl.dismiss();
          })
        }
      }]
    }).then(alertEl => alertEl.present());
  }


}
