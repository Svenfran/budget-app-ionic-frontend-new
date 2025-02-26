import { Component, effect, OnInit } from '@angular/core';
import { GroupService } from 'src/app/service/group.service';
import { OverviewService } from './service/overview.service';
import { CartService } from '../cartlist/service/cart.service';
import { User } from 'src/app/auth/user';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.page.html',
  styleUrls: ['./overview.page.scss'],
  standalone: false
})
export class OverviewPage implements OnInit {

  public activeGroup = this.groupService.activeGroup();
  // Monthly
  public spendingsOverviewMonthly = this.overviewService.spendingsOverview;
  public spendingsPerMonth = this.overviewService.spendingsPerMonth;
  public spendingsTotalYearMonthly = this.overviewService.spendingsTotalYearMonthly;
  public year = this.overviewService.year;
  // Yearly
  public spendingsOverviewYearly = this.overviewService.spendingsOverviewYearly;
  public spendingsPerYear = this.overviewService.spendingsPerYear;
  public spendingsTotalYearYearly = this.overviewService.spendingsTotalYearYearly;
  public availableYears = this.overviewService.availableYears;

  public segment: string = 'year';
  public isLoading: boolean = true;
  public currentYear = new Date().getFullYear();
  public hidden: boolean = true;
  public user: User | undefined;

  constructor(
    private groupService: GroupService,
    private overviewService: OverviewService,
    private cartService: CartService,
    private authService: AuthService
  ) { 
    effect(() => {
      this.activeGroup = this.groupService.activeGroup();
      this.cartService.cartUpdated();
      if (this.activeGroup) {
        this.overviewService.getSpendingsOverviewYearly(this.activeGroup);
        this.overviewService.getSpendingsOverview(this.currentYear, this.activeGroup);
      }
      this.isLoading = false;
    });
  }

  ngOnInit() {
    this.authService.user.subscribe(user => {
      if (user) {
        this.user = user;
      }
    });
  }

  getSpendingsOverview(year: number) {
    this.segment = 'month';
    this.isLoading = true;
    this.overviewService.getSpendingsOverviewYearly(this.activeGroup, true);
    this.overviewService.getSpendingsOverview(year, this.activeGroup, true);
    this.isLoading = false;
  }

  ionViewWillEnter() {
    this.segment = 'year';
  }

  hide() {
    this.hidden = !this.hidden;
  }

  refreshSpendings(event: CustomEvent) {
    setTimeout(() => {
      this.overviewService.getSpendingsOverviewYearly(this.activeGroup, true);
      this.overviewService.getSpendingsOverview(this.currentYear, this.activeGroup, true);
      (event.target as HTMLIonRefresherElement).complete();
    }, 2000);
  }
}
