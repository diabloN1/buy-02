export interface UserAnalytics {
  spentByDay: TimeSeriesPoint[];
  mostBoughtProducts: ProductOrCategoryCount[];
  mostBoughtCategories: ProductOrCategoryCount[];
}

export interface SellerAnalytics {
  revenueByDay: TimeSeriesPoint[];
  bestSellingProducts: BestSellingProductData[];
  unitsSoldByProduct: ProductOrCategoryCount[];
}

export interface TimeSeriesPoint {
  day: string;
  total: number;
}

export interface ProductOrCategoryCount {
  id: string;
  count: number;
}

export interface BestSellingProductData {
  productId: string;
  revenue: number;
  ordersCount: number;
}