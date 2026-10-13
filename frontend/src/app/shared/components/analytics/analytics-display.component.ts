import {
  ChangeDetectionStrategy,
  Component,
  Input,
  NgZone,
  OnChanges,
  SimpleChanges,
  inject,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import ApexCharts from "apexcharts";

import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexFill,
  ApexGrid,
  ApexLegend,
  ApexNonAxisChartSeries,
  ApexPlotOptions,
  ApexResponsive,
  ApexStroke,
  ApexTooltip,
  ApexXAxis,
  ApexYAxis,
  NgApexchartsModule,
} from "ng-apexcharts";

import {
  UserAnalytics,
  SellerAnalytics,
  ProductOrCategoryCount,
} from "@core/models/analytics.model";
import { MatIcon } from "@angular/material/icon";

import {
  ProductTooltipComponent,
  TooltipMetric,
} from "./product-tooltip.component";

type AreaChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  colors: string[];
  stroke: ApexStroke;
  fill: ApexFill;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  grid: ApexGrid;
  tooltip: ApexTooltip;
  dataLabels: ApexDataLabels;
};

type BarChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  colors: string[];
  plotOptions: ApexPlotOptions;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  grid: ApexGrid;
  tooltip: ApexTooltip;
  dataLabels: ApexDataLabels;
};

interface BestProductsChartOptions {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  colors: string[];
  plotOptions: ApexPlotOptions;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis | ApexYAxis[];
  grid: ApexGrid;
  dataLabels: ApexDataLabels;
  tooltip: ApexTooltip;
}

type DonutChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  colors: string[];
  labels: string[];
  legend: ApexLegend;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  tooltip: ApexTooltip;
  responsive: ApexResponsive[];
};

@Component({
  selector: "app-analytics-display",
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    NgApexchartsModule,
    MatIcon,
    ProductTooltipComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./analytics-display.component.html",
  styleUrl: "./analytics-display.component.scss",
})
export class AnalyticsDisplayComponent implements OnChanges {
  @Input() userAnalytics: UserAnalytics | null = null;
  @Input() sellerAnalytics: SellerAnalytics | null = null;

  private readonly zone = inject(NgZone);

  // Chart configuration properties (Calculated ONCE to prevent re-animation loops)
  spendingChartOptions!: AreaChartOptions;
  topProductsChartOptions!: BarChartOptions;
  userCategoriesChartOptions!: DonutChartOptions;
  sellerRevenueChartOptions!: AreaChartOptions;
  sellerBestProductsChartOptions!: BestProductsChartOptions;
  sellerUnitsChartOptions!: BarChartOptions;

  // Signals for tracking Tooltip state
  readonly tooltipProductId = signal<string | null>(null);
  readonly tooltipMetrics = signal<TooltipMetric[]>([]);
  readonly tooltipX = signal(0);
  readonly tooltipY = signal(0);
  readonly tooltipVisible = signal(false);

  private readonly colors = [
    "#8b5cf6",
    "#6366f1",
    "#06b6d4",
    "#ef4444",
    "#22c55e",
    "#f59e0b",
    "#84cc16",
    "#ec4899",
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["userAnalytics"] && this.userAnalytics) {
      this.spendingChartOptions = this.buildSpendingChart();
      this.topProductsChartOptions = this.buildTopProductsChart();
      this.userCategoriesChartOptions = this.buildUserCategoriesChart();
    }

    if (changes["sellerAnalytics"] && this.sellerAnalytics) {
      this.sellerRevenueChartOptions = this.buildSellerRevenueChart();
      this.sellerBestProductsChartOptions = this.buildSellerBestProductsChart();
      this.sellerUnitsChartOptions = this.buildSellerUnitsChart();
    }
  }

  // Smooth mouse tracking bound to the HTML container
  trackMouse(event: MouseEvent) {
    if (this.tooltipVisible()) {
      this.tooltipX.set(event.clientX);
      this.tooltipY.set(event.clientY);
    }
  }

  // Guaranteed hide when mouse leaves the chart container
  hideTooltip() {
    this.tooltipVisible.set(false);
  }

  // ==========================
  // CHART BUILDERS
  // ==========================

  private buildSpendingChart(): AreaChartOptions {
    return this.timeChart(
      "user-spending-chart",
      "Spending",
      this.userAnalytics?.spentByDay ?? [],
      0,
    );
  }

  private buildTopProductsChart(): BarChartOptions {
    return this.rankingChart(
      this.userAnalytics?.mostBoughtProducts ?? [],
      "Units bought",
      true, // true = is a product chart, will show tooltip
    );
  }

  private buildUserCategoriesChart(): DonutChartOptions {
    const items = this.userAnalytics?.mostBoughtCategories ?? [];

    return {
      series: items.map((x) => x.count),
      chart: {
        type: "donut",
        height: 320,
        fontFamily: "inherit",
      },
      labels: items.map((x) => x.id),
      colors: items.map((_, i) => this.colors[i % this.colors.length]),
      legend: {
        position: "right",
        labels: { colors: "#9ca3af" },
      },
      dataLabels: {
        enabled: true,
        formatter: (v) => `${Number(v).toFixed(0)}%`,
      },
      plotOptions: {
        pie: {
          donut: {
            size: "68%",
            labels: {
              show: true,
              total: { show: true, label: "Total", color: "#9ca3af" },
            },
          },
        },
      },
      tooltip: {
        theme: "dark",
        y: { formatter: (v: number) => `${v.toLocaleString("en-US")} units` },
      },
      responsive: [
        {
          breakpoint: 700,
          options: {
            chart: { height: 300 },
            legend: { position: "bottom" },
          },
        },
      ],
    };
  }

  private buildSellerRevenueChart(): AreaChartOptions {
    return this.timeChart(
      "seller-revenue-chart",
      "Revenue",
      this.sellerAnalytics?.revenueByDay ?? [],
      1,
    );
  }

  private buildSellerBestProductsChart(): BestProductsChartOptions {
    const products = this.sellerAnalytics?.bestSellingProducts ?? [];

    return {
      series: [
        { name: "Revenue", data: products.map((product) => product.revenue) },
        {
          name: "Orders",
          data: products.map((product) => product.ordersCount),
        },
      ],
      chart: {
        type: "bar",
        height: 360,
        fontFamily: "inherit",
        toolbar: { show: false },
        animations: { enabled: true, speed: 500 },
        events: {
          dataPointMouseEnter: (
            event: MouseEvent,
            chartContext: any,
            config: any,
          ) => {
            this.zone.run(() => {
              const p = products[config.dataPointIndex] as any;
              const productId = p?.productId || p?.id;
              if (productId) {
                this.tooltipProductId.set(productId);
                this.tooltipMetrics.set([
                  {
                    label: "Revenue",
                    value: `${p.revenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`,
                  },
                  {
                    label: "Orders",
                    value: `${p.ordersCount.toLocaleString("en-US")}`,
                  },
                ]);
                this.tooltipX.set(event.clientX);
                this.tooltipY.set(event.clientY);
                this.tooltipVisible.set(true);
              }
            });
          },
          dataPointMouseLeave: () => {
            this.zone.run(() => this.tooltipVisible.set(false));
          },
        },
      },
      colors: [this.colors[0], this.colors[2]],
      plotOptions: {
        bar: {
          horizontal: false,
          borderRadius: 6,
          borderRadiusApplication: "end",
          columnWidth: "80%",
        },
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: products.map(
          (product) => product.productName || product.productId,
        ),
        labels: {
          style: { colors: "#64748b", fontSize: "12px", fontWeight: 500 },
          rotate: -35,
          rotateAlways: false,
          hideOverlappingLabels: true,
          trim: true,
          maxHeight: 80,
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: [
        {
          min: 0,
          labels: {
            style: { colors: "#64748b", fontSize: "12px" },
            formatter: (value: number) => this.money(value),
          },
          title: { text: "Revenue" },
        },
        {
          min: 0,
          opposite: true,
          labels: {
            style: { colors: "#64748b", fontSize: "12px" },
            formatter: (value: number) => value.toLocaleString("en-US"),
          },
          title: { text: "Orders" },
        },
      ],
      grid: {
        borderColor: "rgba(156, 163, 175, 0.15)",
        strokeDashArray: 4,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
        padding: { top: 10, right: 20 },
      },
      // Disable default apexcharts tooltip completely
      tooltip: { enabled: false },
    };
  }

  private buildSellerUnitsChart(): BarChartOptions {
    return this.rankingChart(
      this.sellerAnalytics?.unitsSoldByProduct ?? [],
      "Units sold",
      true,
    );
  }

  // ==========================
  // HELPERS
  // ==========================

  private timeChart(
    id: string,
    name: string,
    points: { day: string; total: number }[],
    colorIndex: number,
  ): AreaChartOptions {
    return {
      series: [
        {
          name,
          data: points.map((p) => ({
            x: new Date(p.day).getTime(),
            y: p.total,
          })),
        },
      ],
      chart: {
        id,
        type: "area",
        height: 360,
        fontFamily: "inherit",
        toolbar: {
          show: true,
          tools: {
            download: false,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true,
            customIcons: this.rangeButtons(id),
          },
          autoSelected: "zoom",
        },
        zoom: { enabled: true, type: "x", autoScaleYaxis: true },
      },
      colors: [this.colors[colorIndex]],
      stroke: { curve: "smooth", width: 3 },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.3,
          opacityTo: 0.02,
          stops: [0, 90, 100],
        },
      },
      dataLabels: { enabled: false },
      xaxis: {
        type: "datetime",
        labels: {
          datetimeUTC: false,
          style: { colors: "#9ca3af", fontSize: "12px" },
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        min: 0,
        labels: { style: { colors: "#9ca3af", fontSize: "12px" } },
      },
      grid: this.grid(),
      tooltip: {
        theme: "dark",
        x: { format: "MMM d, yyyy" },
        y: { formatter: (v: number) => `${v.toLocaleString("en-US")} USD` },
      },
    };
  }

  private rankingChart(
    items: ProductOrCategoryCount[],
    label: string,
    showProductName = false,
  ): BarChartOptions {
    return {
      series: [{ name: label, data: items.map((x) => x.count) }],
      chart: {
        type: "bar",
        height: 360,
        fontFamily: "inherit",
        toolbar: { show: false },
        animations: { enabled: true, speed: 500 },
        events: showProductName
          ? {
              dataPointMouseEnter: (
                event: MouseEvent,
                chartContext: any,
                config: any,
              ) => {
                this.zone.run(() => {
                  const p = items[config.dataPointIndex] as any;
                  const productId = p?.productId || p?.id;
                  if (productId) {
                    this.tooltipProductId.set(productId);
                    this.tooltipMetrics.set([
                      { label: label, value: p.count.toLocaleString("en-US") },
                    ]);
                    this.tooltipX.set(event.clientX);
                    this.tooltipY.set(event.clientY);
                    this.tooltipVisible.set(true);
                  }
                });
              },
              dataPointMouseLeave: () => {
                this.zone.run(() => this.tooltipVisible.set(false));
              },
            }
          : undefined,
      },
      colors: [this.colors[0]],
      plotOptions: {
        bar: {
          horizontal: false,
          borderRadius: 6,
          borderRadiusApplication: "end",
          columnWidth: "45%",
          dataLabels: { position: "top" },
        },
      },
      dataLabels: {
        enabled: true,
        offsetY: -20,
        style: { fontSize: "12px", fontWeight: 600, colors: ["#6b7280"] },
        formatter: (value: number) => value.toLocaleString("en-US"),
      },
      xaxis: {
        categories: items.map((item) =>
          showProductName ? item.productName || item.id : item.id,
        ),
        labels: {
          style: { colors: "#64748b", fontSize: "12px", fontWeight: 500 },
          rotate: -35,
          rotateAlways: false,
          hideOverlappingLabels: true,
          trim: true,
          maxHeight: 80,
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        min: 0,
        labels: {
          style: { colors: "#64748b", fontSize: "12px" },
          formatter: (value: number) => value.toLocaleString("en-US"),
        },
      },
      grid: {
        borderColor: "rgba(156, 163, 175, 0.15)",
        strokeDashArray: 4,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
        padding: { top: 10, right: 20 },
      },

      // Disable the default Apex tooltip if we are showing our custom product tooltip
      tooltip: showProductName
        ? { enabled: false }
        : {
            theme: "dark",
            y: {
              formatter: (value: number) =>
                `${value.toLocaleString("en-US")} total`,
            },
          },
    };
  }

  private rangeButtons(id: string) {
    return [
      this.rangeButton("1M", () => this.range(id, 1)),
      this.rangeButton("6M", () => this.range(id, 6)),
      this.rangeButton("1Y", () => this.range(id, 12)),
      this.rangeButton("ALL", () => ApexCharts.exec(id, "resetZoom")),
    ];
  }

  private rangeButton(label: string, click: () => void) {
    return {
      icon: `<span class="apex-range-button">${label}</span>`,
      title: label,
      class: "apex-range-button-wrapper",
      click,
    };
  }

  private range(id: string, months: number) {
    const end = Date.now();
    const start = new Date();
    start.setMonth(start.getMonth() - months);
    ApexCharts.exec(id, "zoomX", start.getTime(), end);
  }

  private grid(): ApexGrid {
    return {
      borderColor: "rgba(156, 163, 175, 0.15)",
      strokeDashArray: 4,
      padding: { left: 8, right: 40 },
    };
  }

  private money(value: number): string {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toString();
  }
}
