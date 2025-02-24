import { Injectable, signal, WritableSignal } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Group } from '../model/group';
import { StorageService } from './storage.service';
import { Init } from '../constants/default-values';
import { Zeitraum } from '../domains/cartlist/new-edit-cart/model/gmh-zeitraum';
import { GroupOverview } from '../groupoverview/model/group-overview';
import { User } from '../auth/user';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private apiBaseUrl = environment.apiBaseUrl;
  private groupsSideNavUrl = `${this.apiBaseUrl}/api/groups/sidenav`;
  private addGroupUrl = `${this.apiBaseUrl}/api/groups/add`;
  private gmhUrl = `${this.apiBaseUrl}/api/groups/history-by-group-and-user`;
  private groupsOverviewUrl = `${this.apiBaseUrl}/api/groups/overview`;
  private updateGroupUrl = `${this.apiBaseUrl}/api/groups/update`;
  private deleteGroupUrl = `${this.apiBaseUrl}/api/groups/delete`;

  public groupsSideNav: WritableSignal<Group[]> = signal<Group[]>([]);
  public groupOverviewList: WritableSignal<GroupOverview[]> = signal<GroupOverview[]>([]);
  public activeGroup: WritableSignal<Group> = signal<Group>(Init.DEFAULT_GROUP)
  public groupMembershipHistory: WritableSignal<Zeitraum[]> = signal<Zeitraum[]>([]);
  public groupName = signal<string>("");

  private user: User | undefined;

  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    private authService: AuthService
  ) {
    this.authService.user.pipe().subscribe(user => {
      if (user) this.user = user;
    })
  }

  public setActiveGroup(group: Group) {
    const activeGroup: Group = {
      id: group.id,
      name: group.name,
      dateCreated: group.dateCreated,
      flag: group.flag
    }
    this.storageService.setItem("ACTIVE_GROUP", activeGroup);
    this.activeGroup.set(activeGroup);
    this.groupName.set(activeGroup.name);
  }



  getGroupsForSideNav(): void {
    this.http
      .get<Group[]>(this.groupsSideNavUrl)
      .subscribe({
        next: async (result) => {
          this.groupsSideNav.set(result || []);
          
          // Gruppe aus dem lokalen Speicher laden
          const activeGroup: Group = await this.storageService.getItem('ACTIVE_GROUP') as {id: number, name: string, dateCreated: Date, flag?: string};
          const groups = this.groupsSideNav();
          const hasGroups = groups.length > 0;

          // Wenn es keine gespeicherte Gruppe gibt
          if (!activeGroup) {
            this.setActiveGroup(hasGroups ? result[0] : Init.DEFAULT_GROUP);
            return;
          }
          
          // Wenn es Gruppen gibt und die gespeicherte Gruppe existiert in der Liste
          if (hasGroups && groups.some(group => group.id === activeGroup.id)) {
            this.setActiveGroup(activeGroup);
          } else {
            this.setActiveGroup(hasGroups ? result[0] : Init.DEFAULT_GROUP);
          }

        },
        error: (err) => {
          console.error("Error fetching groups:", err);
          this.groupsSideNav.set([]);
        }
      });
  }

  getGroupsForOverview(): void {
    this.http
      .get<GroupOverview[]>(this.groupsOverviewUrl)
      .subscribe({
        next: (result) => {
          this.groupOverviewList.set(result || []);
        },
        error: (err) => {
          console.error("Error fetching groups:", err);
          this.groupOverviewList.set([]);
        }
      })
  }

  addGroup(group: Group): void {
    const currentGroupsSidenav = this.groupsSideNav();
    const currentGroupsOverview = this.groupOverviewList();
    this.http
      .post<Group>(this.addGroupUrl, group)
      .subscribe({
        next: (result) => {
          // groups for sidenav
          const newGroupSidenav: Group = {
            id: result.id,
            name: result.name,
            dateCreated: result.dateCreated
          }
          this.groupsSideNav.update(groups => [...groups, newGroupSidenav]);
          this.activeGroup.set(newGroupSidenav);

          //groups for overview
          const newGroupOverview: GroupOverview = {
            id: result.id,
            name: result.name,
            dateCreated: result.dateCreated,
            ownerName: this.user?.name!,
            memberCount: 0
          }
          this.groupOverviewList.update(groups => [...groups, newGroupOverview]);
        },
        error: (err) => {
          console.error("Error adding group:", err);
          this.groupsSideNav.set(currentGroupsSidenav);
          this.groupOverviewList.set(currentGroupsOverview);
        }
      })
  }

  updateGroup(group: Group): void {
    const currentGroupsSidenav = this.groupsSideNav();
    const currentGroupsOverview = this.groupOverviewList();

    this.http
      .put<Group>(this.updateGroupUrl, group)
      .subscribe({
        next: (result) => {
          this.groupsSideNav.update(groups => groups.map(gr =>
            gr.id === result.id ? {...gr, name: result.name} : gr
          ));
          this.groupOverviewList.update(groups => groups.map(gr =>
            gr.id === result.id ? {...gr, name: result.name} : gr
          ));
          // aktive Gruppe muss nochmal gesetzt werden, damit Überschriften der einzelnen Views aktualisiert wird.
          if (this.activeGroup().id === result.id)  this.setActiveGroup(result);
        },
        error: (err) => {
          console.error("Error updating group:", err);
          this.groupsSideNav.set(currentGroupsSidenav);
          this.groupOverviewList.set(currentGroupsOverview);
        }
      })
  }

  deleteGroup(group: Group): void {
    const currentGroupsSidenav = this.groupsSideNav();
    const currentGroupsOverview = this.groupOverviewList();

    this.http
      .delete<void>(`${this.deleteGroupUrl}/${group.id}`)
      .subscribe({
        next: () => {
          this.groupsSideNav.update(groups => groups.filter(gr => 
            gr.id !== group.id
          ));
          this.groupOverviewList.update(groups => groups.filter(gr => 
            gr.id !== group.id
          ));

          const groups = this.groupsSideNav();
          const hasGroups = groups.length > 0;

          if (this.activeGroup().id === group.id) {
            this.setActiveGroup(hasGroups ? groups[0] : Init.DEFAULT_GROUP);
          };

        },
        error: (err) => {
          console.error("Error deleting group:", err);
          this.groupsSideNav.set(currentGroupsSidenav);
          this.groupOverviewList.set(currentGroupsOverview);
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
