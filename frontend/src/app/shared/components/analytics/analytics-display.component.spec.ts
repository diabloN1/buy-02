import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AnalyticsDisplayComponent } from "./analytics-display.component";

import { UserAnalytics, SellerAnalytics } from "@core/models/analytics.model";

describe("AnalyticsDisplayComponent", () => {
  let component: AnalyticsDisplayComponent;
  let fixture: ComponentFixture<AnalyticsDisplayComponent>;

  const mockUserAnalytics: UserAnalytics = {
    spentByDay: [
      { day: "2026-10-01", total: 120 },
      { day: "2026-10-02", total: 250 },
    ],
    mostBoughtProducts: [
      { id: "product-1", count: 5 },
      { id: "product-2", count: 3 },
    ],
    mostBoughtCategories: [
      { id: "Electronics", count: 8 },
      { id: "Books", count: 4 },
    ],
  };

  const mockSellerAnalytics: SellerAnalytics = {
    revenueByDay: [
      { day: "2026-10-01", total: 500 },
      { day: "2026-10-02", total: 750 },
    ],
    bestSellingProducts: [
      {
        productId: "product-1",
        revenue: 1200,
        ordersCount: 10,
      },
      {
        productId: "product-2",
        revenue: 800,
        ordersCount: 6,
      },
    ],
    unitsSoldByProduct: [
      { id: "product-1", count: 20 },
      { id: "product-2", count: 12 },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalyticsDisplayComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AnalyticsDisplayComponent);
    component = fixture.componentInstance;
  });

  it("should create component", () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it("should not render analytics sections when inputs are null", () => {
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector("h2")).toBeNull();
    expect(element.textContent).not.toContain("User Analytics");
    expect(element.textContent).not.toContain("Sales Analytics");
  });

  it("should render user analytics section when user analytics are provided", () => {
    fixture.componentRef.setInput("userAnalytics", mockUserAnalytics);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain("User Analytics");
    expect(element.textContent).toContain("Spending over time");
    expect(element.textContent).toContain("Most bought products");
    expect(element.textContent).toContain("Most bought categories");
  });

  it("should render seller analytics section when seller analytics are provided", () => {
    fixture.componentRef.setInput("sellerAnalytics", mockSellerAnalytics);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain("Sales Analytics");
    expect(element.textContent).toContain("Revenue over time");
    expect(element.textContent).toContain("Best selling products");
    expect(element.textContent).toContain("Units sold by product");
  });

  it("should configure the spending chart with user spending data", () => {
    component.userAnalytics = mockUserAnalytics;

    const chart = component.spendingChart;

    expect(chart.series.length).toBe(1);
    expect(chart.series[0].name).toBe("Spending");
    expect(chart.chart.id).toBe("user-spending-chart");
    expect(chart.chart.type).toBe("area");

    const data = chart.series[0].data as { x: number; y: number }[];

    expect(data.length).toBe(2);
    expect(data[0].x).toBe(new Date("2026-10-01").getTime());
    expect(data[0].y).toBe(120);
    expect(data[1].y).toBe(250);
  });

  it("should return an empty spending series when user analytics are null", () => {
    component.userAnalytics = null;

    const chart = component.spendingChart;

    expect(chart.series.length).toBe(1);
    expect(chart.series[0].name).toBe("Spending");
    expect(chart.series[0].data).toEqual([]);
  });

  it("should configure the top products chart with product quantities", () => {
    component.userAnalytics = mockUserAnalytics;

    const chart = component.topProductsChart;

    expect(chart.series.length).toBe(1);
    expect(chart.series[0].name).toBe("Units bought");
    expect(chart.series[0].data).toEqual([5, 3]);
    expect(chart.xaxis.categories).toEqual(["product-1", "product-2"]);
    expect(chart.chart.type).toBe("bar");
  });

  it("should configure the user categories donut chart", () => {
    component.userAnalytics = mockUserAnalytics;

    const chart = component.userCategoriesChart;

    expect(chart.series).toEqual([8, 4]);
    expect(chart.labels).toEqual(["Electronics", "Books"]);
    expect(chart.chart.type).toBe("donut");
    expect(chart.colors.length).toBe(2);
    expect(chart.legend.position).toBe("right");
  });

  it("should return an empty donut chart when user analytics are null", () => {
    component.userAnalytics = null;

    const chart = component.userCategoriesChart;

    expect(chart.series).toEqual([]);
    expect(chart.labels).toEqual([]);
    expect(chart.colors).toEqual([]);
  });

  it("should configure the seller revenue chart with revenue data", () => {
    component.sellerAnalytics = mockSellerAnalytics;

    const chart = component.sellerRevenueChart;

    expect(chart.series.length).toBe(1);
    expect(chart.series[0].name).toBe("Revenue");
    expect(chart.chart.id).toBe("seller-revenue-chart");
    expect(chart.chart.type).toBe("area");

    const data = chart.series[0].data as { x: number; y: number }[];

    expect(data.length).toBe(2);
    expect(data[0].y).toBe(500);
    expect(data[1].y).toBe(750);
  });

  it("should return an empty revenue series when seller analytics are null", () => {
    component.sellerAnalytics = null;

    const chart = component.sellerRevenueChart;

    expect(chart.series.length).toBe(1);
    expect(chart.series[0].name).toBe("Revenue");
    expect(chart.series[0].data).toEqual([]);
  });

  it("should configure the seller best products chart", () => {
    component.sellerAnalytics = mockSellerAnalytics;

    const chart = component.sellerBestProductsChart;

    expect(chart.series.length).toBe(2);
    expect(chart.series[0].name).toBe("Revenue");
    expect(chart.series[0].data).toEqual([1200, 800]);

    expect(chart.series[1].name).toBe("Orders");
    expect(chart.series[1].data).toEqual([10, 6]);

    expect(chart.xaxis.categories).toEqual(["product-1", "product-2"]);
    expect(chart.chart.type).toBe("bar");
  });

  it("should return empty series when seller best products are unavailable", () => {
    component.sellerAnalytics = {
      ...mockSellerAnalytics,
      bestSellingProducts: [],
    };

    const chart = component.sellerBestProductsChart;

    expect(chart.series[0].data).toEqual([]);
    expect(chart.series[1].data).toEqual([]);
    expect(chart.xaxis.categories).toEqual([]);
  });

  it("should configure the seller units chart with quantities sold", () => {
    component.sellerAnalytics = mockSellerAnalytics;

    const chart = component.sellerUnitsChart;

    expect(chart.series.length).toBe(1);
    expect(chart.series[0].name).toBe("Units sold");
    expect(chart.series[0].data).toEqual([20, 12]);
    expect(chart.xaxis.categories).toEqual(["product-1", "product-2"]);
    expect(chart.chart.type).toBe("bar");
  });

  it("should use the expected chart colors", () => {
    component.userAnalytics = mockUserAnalytics;
    component.sellerAnalytics = mockSellerAnalytics;

    expect(component.spendingChart.colors).toEqual(["#8b5cf6"]);
    expect(component.sellerRevenueChart.colors).toEqual(["#6366f1"]);
    expect(component.topProductsChart.colors).toEqual(["#8b5cf6"]);
  });

  it("should format large monetary values using millions", () => {
    component.sellerAnalytics = {
      ...mockSellerAnalytics,
      bestSellingProducts: [
        {
          productId: "product-1",
          revenue: 1_500_000,
          ordersCount: 100,
        },
      ],
    };

    const chart = component.sellerBestProductsChart;
    const revenueAxis = Array.isArray(chart.yaxis)
      ? chart.yaxis[0]
      : chart.yaxis;

    expect(revenueAxis.labels?.formatter?.(1_500_000)).toBe("1.5M");
  });

  it("should format small monetary values without abbreviating them", () => {
    component.sellerAnalytics = {
      ...mockSellerAnalytics,
      bestSellingProducts: [
        {
          productId: "product-1",
          revenue: 250,
          ordersCount: 10,
        },
      ],
    };

    const chart = component.sellerBestProductsChart;
    const revenueAxis = Array.isArray(chart.yaxis)
      ? chart.yaxis[0]
      : chart.yaxis;

    expect(revenueAxis.labels?.formatter?.(250)).toBe("250");
  });
});
