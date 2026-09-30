import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatPaginatorModule, PageEvent } from "@angular/material/paginator";
import { MatIconModule } from "@angular/material/icon";
import { debounceTime, distinctUntilChanged } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ProductService } from "@core/services/product.service";
import { Product } from "@core/models/product.model";
import { ProductCardComponent } from "@shared/components/product-card.component";
import { LoadingSpinnerComponent } from "@shared/components/loading-spinner.component";
import { EmptyStateComponent } from "@shared/components/empty-state.component";

@Component({
  selector: "app-product-list",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatIconModule,
    ProductCardComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
  ],
  template: `
    <section class="container catalog-section">
      <div class="catalog-header">
        <div class="header-left">
          <div class="header-tag">Marketplace</div>
          <h1 class="header-title">
            All Products
            <span class="count-badge" *ngIf="!loading()">{{ total() }}</span>
          </h1>
        </div>

        <mat-form-field appearance="outline" class="search-field">
          <mat-icon matPrefix class="search-icon">search</mat-icon>
          <mat-label>Search catalog…</mat-label>
          <input matInput [formControl]="q" placeholder="Type product name or keywords…" />
          @if (q.value) {
            <button matSuffix mat-icon-button (click)="q.setValue('')" aria-label="Clear search">
              <mat-icon>close</mat-icon>
            </button>
          }
        </mat-form-field>
      </div>

      @if (loading()) {
        <app-loading-spinner label="Searching products…" />
      } @else if (!items().length) {
        <app-empty-state
          icon="search_off"
          title="No matching products found"
          description="Try modifying your search keywords or clear filters."
        />
      } @else {
        <div class="grid">
          @for (p of items(); track p.id) {
            <app-product-card [product]="p" />
          }
        </div>

        <div class="paginator-card">
          <mat-paginator
            [length]="total()"
            [pageSize]="pageSize()"
            [pageIndex]="page() - 1"
            [pageSizeOptions]="[12, 24, 48]"
            (page)="onPage($event)"
            aria-label="Select page"
          />
        </div>
      }
    </section>
  `,
  styles: [
    `
      .catalog-section {
        padding-top: 32px;
        padding-bottom: 64px;
      }

      .catalog-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 36px;
        flex-wrap: wrap;
        gap: 20px;
      }

      .header-tag {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--app-primary);
        margin-bottom: 4px;
      }

      .header-title {
        font-size: clamp(1.8rem, 3.5vw, 2.5rem);
        font-weight: 800;
        letter-spacing: -0.03em;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .count-badge {
        font-size: 13px;
        font-weight: 700;
        padding: 4px 12px;
        border-radius: var(--app-radius-full);
        background: var(--app-primary-light);
        color: var(--app-primary);
      }

      .search-field {
        width: 380px;
        max-width: 100%;
      }

      .search-icon {
        margin-right: 8px;
        color: var(--app-muted);
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 24px;
        margin-bottom: 40px;
      }

      .paginator-card {
        background: var(--app-surface);
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius);
        padding: 8px 16px;
        box-shadow: var(--app-shadow-sm);
        display: flex;
        justify-content: flex-end;
      }
    `,
  ],
})
export class ProductListPage {
  private readonly svc = inject(ProductService);
  readonly q = new FormControl("", { nonNullable: true });
  readonly items = signal<Product[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(12);
  readonly loading = signal(true);

  constructor() {
    this.load();
    this.q.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => {
        this.page.set(1);
        this.load();
      });
  }

  onPage(e: PageEvent) {
    this.page.set(e.pageIndex + 1);
    this.pageSize.set(e.pageSize);
    this.load();
  }

  private load() {
    this.loading.set(true);
    this.svc
      .list(this.page(), this.pageSize(), this.q.value || undefined)
      .subscribe({
        next: (r) => {
          this.items.set(r.content);
          this.total.set(r.totalElements);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}
