import { Injectable, signal, WritableSignal } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Group } from '../model/group';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private apiBaseUrl = environment.apiBaseUrl;
  private groupsSideNavUrl = `${this.apiBaseUrl}/api/groups/sidenav`;
  private addGroupUrl = `${this.apiBaseUrl}/api/groups/add`;

  private groupsSideNav: WritableSignal<Group[]> = signal<Group[]>([]);
  public activeGroup: WritableSignal<Group> = signal<Group>({id: new Date().getTime(), name: '', dateCreated: new Date()})

  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) { }

  public getSideNavGroups() {
    return this.groupsSideNav;
  }

  public setActiveGroup(group: Group) {
    const activeGroup: Group = {
      id: group.id,
      name: group.name,
      dateCreated: group.dateCreated
    }
    this.storageService.setItem("ACTIVE_GROUP", activeGroup);
    this.activeGroup.set(activeGroup);
  }

  getGroupsForSideNav(): void {
    this.http
      .get<Group[]>(this.groupsSideNavUrl)
      .subscribe({
        next: async (result) => {
          this.groupsSideNav.set(result || []);
          const activeGroup: Group = await this.storageService.getItem('ACTIVE_GROUP') as {id: number, name: string, dateCreated: Date};
          if (!activeGroup) {
            this.setActiveGroup(result[0]);
            return
          }
          this.setActiveGroup(activeGroup);
        },
        error: (err) => {
          console.error("Error fetching groups:", err);
          this.groupsSideNav.set([]);
        }
      });
  }

  addGroup(group: Group): void {
    const currentGroups = this.groupsSideNav();
    this.http
      .post<Group>(this.addGroupUrl, group)
      .subscribe({
        next: (result) => {
          const newGroup: Group = {
            id: result.id,
            name: result.name,
            dateCreated: result.dateCreated
          }
          this.groupsSideNav().push(newGroup);
          this.activeGroup.set(newGroup);
        },
        error: (err) => {
          console.error("Error adding group:", err);
          this.groupsSideNav.set(currentGroups);
        }
      })
  }
}
