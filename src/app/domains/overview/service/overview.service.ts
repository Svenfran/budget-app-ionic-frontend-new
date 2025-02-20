import { HttpClient } from '@angular/common/http';
import { computed, Injectable, signal } from '@angular/core';
import { environment } from 'src/environments/environment';
import { SpendingsOverviewDto } from '../model/spendings-overview-dto';
import { SpendingsOverviewYearlyDto } from '../model/spendings-overview-yearly-dto';
import { Group } from 'src/app/model/group';
import { GROUP } from 'src/app/constants/default-values';
import { SpendingsOverviewPerMonthDto } from '../model/spendings-overview-per-month-dto';

@Injectable({
  providedIn: 'root'
})
export class OverviewService {

  private apiBaseUrl = environment.apiBaseUrl;
  private spendingsOverviewUrl = `${this.apiBaseUrl}/api/spendings`;

  public spendingsOverview = signal<SpendingsOverviewDto | null>(null);
  public spendingsOverviewYearly = signal<SpendingsOverviewYearlyDto | null>(null);
  public availableYears = signal<number[]>([]);
  public spendingsPerMonth = computed(() =>
    this.spendingsOverview()?.spendingsPerMonth ?? []
  );
  public spendingsTotalYearMonthly = computed(() =>
    this.spendingsOverview()?.spendingsTotalYear ?? { spendingsTotalUser: [], sumTotalYear: 0 }
  );
  public year = computed(() =>
    this.spendingsOverview()?.year ?? new Date().getFullYear()
  );
  public spendingsPerYear = computed(() =>
    this.spendingsOverviewYearly()?.spendingsPerYear ?? []
  );
  public spendingsTotalYearYearly = computed(() =>
    this.spendingsOverviewYearly()?.spendingsTotalYear ?? { spendingsTotalUser: [], sumTotalYear: 0 }
  );

  constructor(private http: HttpClient) { }

  getSpendingsOverview(year: number, group: Group): void {
    if (group.flag?.includes(GROUP.DEFAULT)) {
      return;
    };

    this.http
      .get<SpendingsOverviewDto>(`${this.spendingsOverviewUrl}/${group.id}/${year}`)
      .subscribe({
        next: (result) => {
          this.spendingsOverview.set(result || null);
        },
        error: (err) => {
          console.log('Error fetching spendings:', err);
          this.spendingsOverview.set(null);
        }
      })
  };

  getSpendingsOverviewYearly(group: Group): void {
    if (group.flag?.includes(GROUP.DEFAULT)) {
      return;
    };

    this.http
      .get<SpendingsOverviewYearlyDto>(`${this.spendingsOverviewUrl}/${group.id}`)
      .subscribe({
        next: (result) => {
          this.spendingsOverviewYearly.set(result || null);
          this.availableYears.set(result.availableYears || [])
        },
        error: (err) => {
          console.log('Error fetching yearly spendings:', err);
          this.spendingsOverviewYearly.set(null);
          this.availableYears.set([]);
        }
      })
  }

}
