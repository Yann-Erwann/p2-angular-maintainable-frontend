import { ChangeDetectionStrategy, Component, computed, DestroyRef, ErrorHandler, inject, type OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { Olympic } from '../../models/olympic';
import { olympicLoadState } from '../../olympics/olympic-load-state';
import { Router, RouterLink } from '@angular/router';
import { OlympicChartComponent } from '../../olympics/chart/chart.component';
import { HeaderComponent } from '../../olympics/header/header.component';
import { PageFeedbackComponent } from '../../olympics/page-feedback/page-feedback.component';
import type { PageState } from '../../olympics/page-state';
import { DataService } from '../../services/data.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    standalone: true,
    imports: [HeaderComponent, RouterLink, OlympicChartComponent, PageFeedbackComponent],
})
export class HomeComponent implements OnInit {
  private readonly pageState = signal<PageState<readonly Olympic[]>>({ status: 'loading' });
  readonly summary = computed(() => {
    const state = this.pageState();
    const data = state.status === 'success' ? state.data : [];
    return {
      ids: data.map((country) => country.id),
      countries: data.map((country) => country.country),
      medals: data.map((country) => country.participations.reduce((total, item) => total + item.medalsCount, 0)),
      editions: new Set(data.flatMap((country) => country.participations.map((item) => item.year))).size,
    };
  });
  public get state() { return this.pageState(); }
  public get totalCountries() { return this.summary().countries.length; }
  public get totalJOs() { return this.summary().editions; }
  readonly titlePage = "Medals per Country";

  private readonly router = inject(Router);
  private readonly dataService = inject(DataService);
  private readonly errorHandler = inject(ErrorHandler);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit() {
    olympicLoadState(this.dataService.getOlympics()).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((state) => this.pageState.set(state));
  }

  selectCountry(index: number) {
    const id = this.summary().ids[index];
    if (id === undefined) {
      return;
    }
    void this.router.navigate(['/country', id]).catch((error: unknown) => {
      this.errorHandler.handleError(error);
    });
  }
}
