import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  OnInit,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";
import { MatPaginatorModule, PageEvent } from "@angular/material/paginator";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { debounceTime, distinctUntilChanged } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { ProductService } from "@core/services/product.service";
import { CategoryService } from "@core/services/category.service";
import { Product, ProductSearchFilter } from "@core/models/product.model";

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
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    ProductCardComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
  ],
  template: `
    <!-- Added animate-fade-in to the main container -->
    <section class="container catalog-section animate-fade-in">
      <div class="catalog-header">
        <div class="header-left">
          <div class="header-tag">Marketplace</div>
          <h1 class="header-title">
            All Products
            @if (!loading()) {
              <span class="count-badge animate-pop-in">{{ total() }}</span>
            }
          </h1>
        </div>

        <div class="header-actions" [formGroup]="filterForm">
          <!-- PRO TIP: subscriptSizing="dynamic" removes the empty error space under the input natively! -->
          <mat-form-field
            appearance="outline"
            class="search-field"
            subscriptSizing="dynamic"
          >
            <mat-icon matPrefix class="search-icon">search</mat-icon>
            <mat-label>Search catalog…</mat-label>
            <input
              matInput
              formControlName="keyword"
              placeholder="Type product name…"
            />
            @if (filterForm.get("keyword")?.value) {
              <button
                matSuffix
                mat-icon-button
                (click)="filterForm.get('keyword')?.setValue('')"
                aria-label="Clear search"
              >
                <mat-icon>close</mat-icon>
              </button>
            }
          </mat-form-field>

          <!-- Filter Toggle Button -->
          <button
            type="button"
            class="btn btn-outline filter-toggle-btn"
            [class.active]="showFilters()"
            (click)="showFilters.set(!showFilters())"
          >
            <mat-icon>tune</mat-icon>
            <span>Filters</span>
            @if (activeFilterCount() > 0) {
              <span class="filter-badge">{{ activeFilterCount() }}</span>
            }
          </button>
        </div>
      </div>

      <!-- Collapsible Filter Panel -->
      @if (showFilters()) {
        <div class="app-card filter-panel" [formGroup]="filterForm">
          <div class="filter-grid">
            <!-- Category Filter -->
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Category</mat-label>
              <mat-select formControlName="categoryId">
                <mat-option [value]="null">All Categories</mat-option>
                @for (cat of categories(); track cat.id) {
                  <mat-option [value]="cat.id">{{ cat.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <!-- Price Range Filter -->
            <div class="price-range">
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Min Price</mat-label>
                <input
                  matInput
                  type="number"
                  formControlName="minPrice"
                  min="0"
                />
                <span matTextPrefix>$&nbsp;</span>
              </mat-form-field>
              <span class="range-separator">-</span>
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Max Price</mat-label>
                <input
                  matInput
                  type="number"
                  formControlName="maxPrice"
                  min="0"
                />
                <span matTextPrefix>$&nbsp;</span>
              </mat-form-field>
            </div>

            <!-- Date Range Filter -->
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Date Added</mat-label>
              <mat-date-range-input [rangePicker]="picker">
                <input
                  matStartDate
                  formControlName="startDate"
                  placeholder="Start date"
                />
                <input
                  matEndDate
                  formControlName="endDate"
                  placeholder="End date"
                />
              </mat-date-range-input>
              <mat-datepicker-toggle
                matIconSuffix
                [for]="picker"
              ></mat-datepicker-toggle>
              <mat-date-range-picker #picker></mat-date-range-picker>
            </mat-form-field>
          </div>

          <div class="filter-actions">
            @if (activeFilterCount() > 0) {
              <button
                type="button"
                class="btn btn-ghost"
                (click)="clearFilters()"
              >
                Clear All
              </button>
            }
          </div>
        </div>
      }

      <!-- Loading / Empty / Grid States -->
      @if (loading()) {
        <app-loading-spinner label="Searching products…" />
      } @else if (!items().length) {
        <app-empty-state
          class="animate-fade-in"
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

        <div class="paginator-card animate-fade-in delay-3">
          <mat-paginator
            [length]="total()"
            [pageSize]="pageSize()"
            [pageIndex]="page() - 1"
            [pageSizeOptions]="[12, 24, 48]"
            (page)="onPage($event)"
            aria-label="Select page"
            class="pro-paginator"
          />
        </div>
      }
    </section>
  `,
  styles: [
    `
      .catalog-section {
        padding-top: 40px;
        padding-bottom: 64px;
        display: flex;
        flex-direction: column;
        gap: 32px;
      }

      .catalog-header {
        display: flex;
        align-items: center; /* Changed to center to balance the dynamic input heights */
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 24px;
      }

      .header-left {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }

      .search-field {
        width: 340px;
        max-width: 100%;
        /* Removed hacky negative margins! subscriptSizing="dynamic" in HTML handles this cleanly now */
      }

      .filter-toggle-btn {
        height: 56px; /* Matches default Material Input height perfectly */
        border-radius: var(--app-radius-sm);
        position: relative;
        transition: all var(--transition-fast);
      }
      .filter-toggle-btn.active {
        background: var(--app-primary-lighter);
        border-color: var(--app-primary);
        color: var(--app-primary) !important;
      }

      .filter-badge {
        position: absolute;
        top: -6px;
        right: -6px;
        background: var(--app-primary);
        color: var(--app-primary-text);
        font-size: 11px;
        font-weight: 700;
        width: 22px;
        height: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--app-radius-full);
        border: 2px solid var(--app-bg);
        animation: popIn 0.3s var(--ease-spring) forwards; /* Using global var for bounce */
      }

      /* Filter Panel Styles */
      .filter-panel {
        padding: 24px;
        background: var(--app-surface-elevated);
        transform-origin: top center;
        animation: slideDownSpring 0.35s var(--ease-spring) forwards;
      }

      .filter-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 20px;
        align-items: end; /* Keeps inputs perfectly bottom-aligned */
      }

      .price-range {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .range-separator {
        color: var(--app-muted-light);
        font-weight: 600;
      }

      .filter-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid var(--app-border); /* Subtle divider */
      }

      /* Grid & Paginator */
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 24px;
      }

      /* Pro stagger animation for the product cards as they render */
      .grid > * {
        animation: fadeInUp 0.4s var(--ease-out) forwards;
        opacity: 0;
      }
      .grid > *:nth-child(1) {
        animation-delay: 0ms;
      }
      .grid > *:nth-child(2) {
        animation-delay: 50ms;
      }
      .grid > *:nth-child(3) {
        animation-delay: 100ms;
      }
      .grid > *:nth-child(4) {
        animation-delay: 150ms;
      }
      .grid > *:nth-child(5) {
        animation-delay: 200ms;
      }
      .grid > *:nth-child(n + 6) {
        animation-delay: 250ms;
      }

      .paginator-card {
        background: var(--app-surface);
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius);
        padding: 4px 16px;
        box-shadow: var(--app-shadow-sm);
        display: flex;
        justify-content: flex-end;
        overflow: hidden;
        transition: box-shadow var(--transition-normal);
      }

      .paginator-card:hover {
        box-shadow: var(--app-shadow);
      }

      /* Forces the material paginator to blend into our custom card */
      .pro-paginator {
        background: transparent !important;
        color: var(--app-fg) !important;
      }

      @keyframes slideDownSpring {
        from {
          opacity: 0;
          transform: translateY(-16px) scaleY(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scaleY(1);
        }
      }

      /* Typography */
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
        background: var(--app-primary-lighter);
        color: var(--app-primary);
        border: 1px solid var(--app-border); /* Matches the Shadcn aesthetic better */
      }

      .search-icon {
        margin-right: 8px;
        color: var(--app-muted);
      }
    `,
  ],
})
export class ProductListPage implements OnInit {
  private readonly svc = inject(ProductService);
  private readonly catSvc = inject(CategoryService);
  private readonly fb = inject(FormBuilder);

  // Form Group for all filters
  readonly filterForm = this.fb.group({
    keyword: [""],
    minPrice: [null as number | null],
    maxPrice: [null as number | null],
    categoryId: [null as string | null],
    startDate: [null as Date | null],
    endDate: [null as Date | null],
  });

  // UI State
  readonly showFilters = signal(false);
  readonly activeFilterCount = signal(0);

  // Data State
  readonly items = signal<Product[]>([]);
  readonly categories = signal<any[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(12);
  readonly loading = signal(true);

  constructor() {
    // React to any filter changes
    this.filterForm.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => {
        this.page.set(1); // Reset to first page on filter change
        this.updateActiveFilterCount();
        this.load();
      });
  }

  ngOnInit() {
    this.loadCategories();
    this.load();
  }

  onPage(e: PageEvent) {
    this.page.set(e.pageIndex + 1);
    this.pageSize.set(e.pageSize);
    this.load();
  }

  clearFilters() {
    // Reset everything except keyword to default null
    this.filterForm.patchValue({
      minPrice: null,
      maxPrice: null,
      categoryId: null,
      startDate: null,
      endDate: null,
    });
  }

  private updateActiveFilterCount() {
    const val = this.filterForm.value;
    let count = 0;
    if (val.minPrice != null) count++;
    if (val.maxPrice != null) count++;
    if (val.categoryId) count++;
    if (val.startDate || val.endDate) count++;
    this.activeFilterCount.set(count);
  }

  private loadCategories() {
    this.catSvc.getAll().subscribe({
      next: (cats) => this.categories.set(cats),
    });
  }

  private load() {
    this.loading.set(true);

    const formVals = this.filterForm.value;

    const filters: ProductSearchFilter = {
      keyword: formVals.keyword || undefined,
      minPrice: formVals.minPrice ?? undefined,
      maxPrice: formVals.maxPrice ?? undefined,
      categoryId: formVals.categoryId || undefined,
      startDate: formVals.startDate
        ? formVals.startDate.toISOString()
        : undefined,
      endDate: formVals.endDate ? formVals.endDate.toISOString() : undefined,
    };

    this.svc.search(this.page(), this.pageSize(), filters).subscribe({
      next: (r) => {
        this.items.set(r.content);
        this.total.set(r.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
