import { Injectable, signal, WritableSignal } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Group } from '../model/group';
import { StorageService } from './storage.service';
import { Init } from '../constants/default-values';
import { Zeitraum } from '../domains/cartlist/new-edit-cart/model/gmh-zeitraum';

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private apiBaseUrl = environment.apiBaseUrl;
  private groupsSideNavUrl = `${this.apiBaseUrl}/api/groups/sidenav`;
  private addGroupUrl = `${this.apiBaseUrl}/api/groups/add`;
  private gmhUrl = `${this.apiBaseUrl}/api/groups/history-by-group-and-user`;

  public groupsSideNav: WritableSignal<Group[]> = signal<Group[]>([]);
  public activeGroup: WritableSignal<Group> = signal<Group>(Init.DEFAULT_GROUP)
  public groupMembershipHistory: WritableSignal<Zeitraum[]> = signal<Zeitraum[]>([]);

  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) { }

  public setActiveGroup(group: Group) {
    const activeGroup: Group = {
      id: group.id,
      name: group.name,
      dateCreated: group.dateCreated,
      flag: group.flag
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
          // Gruppe aus dem lokalen Speicher laden
          const activeGroup: Group = await this.storageService.getItem('ACTIVE_GROUP') as {id: number, name: string, dateCreated: Date, flag?: string};
          // Keine active Gruppe im lokalen Speicher aber es sind Gruppen vorhanden => setActiveGroup(result[0])
          if (!activeGroup && this.groupsSideNav().length > 0) {
            this.setActiveGroup(result[0]);
            return;
          }
          // Keine active Gruppe im lokalen Speicher und es sind keine Gruppen vorhanden => setActiveGroup(Init.DEFAULT_GROUP)
          if (!activeGroup && this.groupsSideNav().length <= 0) {
            this.setActiveGroup(Init.DEFAULT_GROUP);
          }
          // Es ist eine Gruppe lokal gespeichert => setActiveGroup(activeGroup)
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
          this.groupsSideNav.update(groups => [...groups, newGroup]);
          this.activeGroup.set(newGroup);
        },
        error: (err) => {
          console.error("Error adding group:", err);
          this.groupsSideNav.set(currentGroups);
        }
      })
  }

  getGroupMembershipHistoryForGroupAndUser(group: Group): void {
    this.http
      .get<Zeitraum[]>(`${this.gmhUrl}/${group.id}`)
      .subscribe({
        next: (result) => {
          this.groupMembershipHistory.set(result || []);
        },
        error: (err) => {
          console.error("Error fetching group membership history:", err);
          this.groupMembershipHistory.set([]);
        }
      })
  }
}
