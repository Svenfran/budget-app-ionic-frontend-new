import { effect, Injectable, signal, WritableSignal } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CategoryDto } from '../model/category-dto';
import { HttpClient } from '@angular/common/http';
import { Group } from '../model/group';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  private categories: WritableSignal<CategoryDto[]> = signal<CategoryDto[]>([]);
  private apiBaseUrl = environment.apiBaseUrl;
  private getCategoriesUrl = `${this.apiBaseUrl}/api/groups/categories`;

  constructor(private http: HttpClient) {}

  public getCategories() {
    return this.categories;
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
  }
}
