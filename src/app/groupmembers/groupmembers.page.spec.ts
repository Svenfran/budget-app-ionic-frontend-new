import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GroupmembersPage } from './groupmembers.page';

describe('GroupmembersPage', () => {
  let component: GroupmembersPage;
  let fixture: ComponentFixture<GroupmembersPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupmembersPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
