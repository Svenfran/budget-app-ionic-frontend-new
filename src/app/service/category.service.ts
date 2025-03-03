import { Injectable, signal, WritableSignal } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CategoryDto } from '../model/category-dto';
import { HttpClient } from '@angular/common/http';
import { Group } from '../model/group';
import { AlertService } from './alert.service';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  public categories: WritableSignal<CategoryDto[]> = signal<CategoryDto[]>([]);
  public categoryUpdate = signal(0);
  private apiBaseUrl = environment.apiBaseUrl;
  private getCategoriesUrl = `${this.apiBaseUrl}/api/groups/categories`;
  private addCategoryUrl = `${this.apiBaseUrl}/api/groups/category/add`;
  private updateCategoryUrl = `${this.apiBaseUrl}/api/groups/category/update`;
  private deleteCategoryUrl = `${this.apiBaseUrl}/api/groups/category/delete`;

  constructor(
    private http: HttpClient,
    private alertService: AlertService
  ) {}

  triggerUpdate() {
    this.categoryUpdate.set(this.categoryUpdate() + 1);
  }

  getCategoriesByGroup(group: Group): void {
    this.http
      .get<CategoryDto[]>(`${this.getCategoriesUrl}/${group.id}`)
      .subscribe({
        next: (result) => {
          this.categories.set(result || []);
        },
        error: (err) => {
          console.error("Error fetching categories:", err);
          this.categories.set([]);
        }
      })
  };

  addCategory(category: CategoryDto): void {
    const currentCategories = this.categories();
    this.http
      .post<CategoryDto>(this.addCategoryUrl, category)
      .subscribe({
        next: (result) => {
          this.categories.update(category => [...category, result].sort((a, b) => a.name.localeCompare(b.name)));
        },
        error: (err) => {
          console.error("Error adding category:", err);
          this.categories.set(currentCategories);
        }
      })
  };

  updateCategory(category: CategoryDto): void {
    const currentCategories = this.categories();
    this.http
      .put<CategoryDto>(this.updateCategoryUrl, category)
      .subscribe({
        next: (result) => {
          this.categories.update(categories => categories.map(category => 
            category.id === result.id ? { ...category, name: result.name } : category
          ).sort((a, b) => a.name.localeCompare(b.name)));
          this.triggerUpdate();
        },
        error: (err) => {
          console.error("Error updating category:", err);
          this.categories.set(currentCategories);
        }
      })
  };

  deleteCategory(category: CategoryDto): void {
    const currentCategories = this.categories();
    this.http
      .post<CategoryDto>(this.deleteCategoryUrl, category)
      .subscribe({
        next: () => {
          this.categories.update(categories => categories.filter(cat =>
            cat.id !== category.id
          ));
        },
        error: (err) => {
          console.error("Error deleting category:", err);
          this.categories.set(currentCategories);
          if (err.status === 404) {
            let header = "Löschen fehlgeschlagen";
            let message = "Kategorie kann nicht gelöscht werden, diese ist bereits einigen deiner Ausgaben zugeordnet!"
            this.alertService.showErrorAlert(header, message);
          }
        }
      })
  };
}
