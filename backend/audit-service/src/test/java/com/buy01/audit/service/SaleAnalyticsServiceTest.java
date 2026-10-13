package com.buy01.audit.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;

import org.bson.Document;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;

import com.buy01.audit.dto.BestSellingProductData;
import com.buy01.audit.dto.ProductOrCategoryCount;
import com.buy01.audit.dto.SellerAnalytics;
import com.buy01.audit.dto.TimeSeriesPoint;
import com.buy01.audit.dto.UserAnalytics;
import com.buy01.audit.entity.SaleAudit;

@ExtendWith(MockitoExtension.class)
class SaleAnalyticsServiceTest {

        @Mock
        private MongoTemplate mongoTemplate;

        @InjectMocks
        private SaleAnalyticsServiceImpl saleAnalyticsService;

        @Test
        void getUserAnalytics_shouldReturnAllUserAnalytics() {
                // given
                String buyerId = "buyer-123";

                TimeSeriesPoint spending = TimeSeriesPoint.builder()
                                .day("2026-10-01")
                                .total(150.0)
                                .build();

                ProductOrCategoryCount product = ProductOrCategoryCount.builder()
                                .id("product-123")
                                .count(3)
                                .build();

                ProductOrCategoryCount category = ProductOrCategoryCount.builder()
                                .id("Electronics")
                                .count(5)
                                .build();

                when(mongoTemplate.aggregate(
                                any(Aggregation.class),
                                eq(SaleAudit.class),
                                eq(TimeSeriesPoint.class)))
                                .thenReturn(aggregationResults(List.of(spending)));

                when(mongoTemplate.aggregate(
                                any(Aggregation.class),
                                eq(SaleAudit.class),
                                eq(ProductOrCategoryCount.class)))
                                .thenReturn(aggregationResults(List.of(product)))
                                .thenReturn(aggregationResults(List.of(category)));

                // when
                UserAnalytics result = saleAnalyticsService.getUserAnalytics(buyerId);

                // then
                assertNotNull(result);

                assertNotNull(result.getSpentByDay());
                assertEquals(1, result.getSpentByDay().size());
                assertEquals("2026-10-01", result.getSpentByDay().get(0).getDay());
                assertEquals(150.0, result.getSpentByDay().get(0).getTotal());

                assertNotNull(result.getMostBoughtProducts());
                assertEquals(1, result.getMostBoughtProducts().size());
                assertEquals("product-123", result.getMostBoughtProducts().get(0).getId());
                assertEquals(3, result.getMostBoughtProducts().get(0).getCount());

                assertNotNull(result.getMostBoughtCategories());
                assertEquals(1, result.getMostBoughtCategories().size());
                assertEquals("Electronics", result.getMostBoughtCategories().get(0).getId());
                assertEquals(5, result.getMostBoughtCategories().get(0).getCount());

                verify(mongoTemplate, times(1)).aggregate(
                                any(Aggregation.class),
                                eq(SaleAudit.class),
                                eq(TimeSeriesPoint.class));

                verify(mongoTemplate, times(2)).aggregate(
                                any(Aggregation.class),
                                eq(SaleAudit.class),
                                eq(ProductOrCategoryCount.class));
        }

        @Test
        void getSellerAnalytics_shouldReturnAllSellerAnalytics() {
                // given
                String sellerId = "seller-456";

                TimeSeriesPoint revenue = TimeSeriesPoint.builder()
                                .day("2026-10-01")
                                .total(500.0)
                                .build();

                BestSellingProductData bestProduct = BestSellingProductData.builder()
                                .productId("product-789")
                                .revenue(new BigDecimal("350.00"))
                                .ordersCount(4)
                                .build();

                ProductOrCategoryCount unitsSold = ProductOrCategoryCount.builder()
                                .id("product-789")
                                .count(12)
                                .build();

                when(mongoTemplate.aggregate(
                                any(Aggregation.class),
                                eq(SaleAudit.class),
                                eq(TimeSeriesPoint.class)))
                                .thenReturn(aggregationResults(List.of(revenue)));

                when(mongoTemplate.aggregate(
                                any(Aggregation.class),
                                eq(SaleAudit.class),
                                eq(BestSellingProductData.class)))
                                .thenReturn(aggregationResults(List.of(bestProduct)));

                when(mongoTemplate.aggregate(
                                any(Aggregation.class),
                                eq(SaleAudit.class),
                                eq(ProductOrCategoryCount.class)))
                                .thenReturn(aggregationResults(List.of(unitsSold)));

                // when
                SellerAnalytics result = saleAnalyticsService.getSellerAnalytics(sellerId);

                // then
                assertNotNull(result);

                assertNotNull(result.getRevenueByDay());
                assertEquals(1, result.getRevenueByDay().size());
                assertEquals("2026-10-01", result.getRevenueByDay().get(0).getDay());
                assertEquals(500.0, result.getRevenueByDay().get(0).getTotal());

                assertNotNull(result.getBestSellingProducts());
                assertEquals(1, result.getBestSellingProducts().size());

                BestSellingProductData WhenualProduct = result.getBestSellingProducts().get(0);

                assertEquals("product-789", WhenualProduct.getProductId());
                assertEquals(0, new BigDecimal("350.00").compareTo(WhenualProduct.getRevenue()));
                assertEquals(4, WhenualProduct.getOrdersCount());

                assertNotNull(result.getUnitsSoldByProduct());
                assertEquals(1, result.getUnitsSoldByProduct().size());
                assertEquals("product-789", result.getUnitsSoldByProduct().get(0).getId());
                assertEquals(12, result.getUnitsSoldByProduct().get(0).getCount());

                verify(mongoTemplate, times(1)).aggregate(
                                any(Aggregation.class),
                                eq(SaleAudit.class),
                                eq(TimeSeriesPoint.class));

                verify(mongoTemplate, times(1)).aggregate(
                                any(Aggregation.class),
                                eq(SaleAudit.class),
                                eq(BestSellingProductData.class));

                verify(mongoTemplate, times(1)).aggregate(
                                any(Aggregation.class),
                                eq(SaleAudit.class),
                                eq(ProductOrCategoryCount.class));
        }

        @Test
        void getUserAnalytics_whenNoSalesExist_shouldReturnEmptyLists() {
                // given
                String buyerId = "buyer-with-no-sales";

                when(mongoTemplate.aggregate(
                                any(Aggregation.class),
                                eq(SaleAudit.class),
                                eq(TimeSeriesPoint.class)))
                                .thenReturn(aggregationResults(List.of()));

                when(mongoTemplate.aggregate(
                                any(Aggregation.class),
                                eq(SaleAudit.class),
                                eq(ProductOrCategoryCount.class)))
                                .thenReturn(aggregationResults(List.of()));

                // when
                UserAnalytics result = saleAnalyticsService.getUserAnalytics(buyerId);

                // then
                assertNotNull(result);

                assertNotNull(result.getSpentByDay());
                assertNotNull(result.getMostBoughtProducts());
                assertNotNull(result.getMostBoughtCategories());

                assertEquals(0, result.getSpentByDay().size());
                assertEquals(0, result.getMostBoughtProducts().size());
                assertEquals(0, result.getMostBoughtCategories().size());

                verify(mongoTemplate, times(1)).aggregate(
                                any(Aggregation.class),
                                eq(SaleAudit.class),
                                eq(TimeSeriesPoint.class));

                verify(mongoTemplate, times(2)).aggregate(
                                any(Aggregation.class),
                                eq(SaleAudit.class),
                                eq(ProductOrCategoryCount.class));
        }

        @Test
        void getSellerAnalytics_whenNoSalesExist_shouldReturnEmptyLists() {
                // given
                String sellerId = "seller-with-no-sales";

                when(mongoTemplate.aggregate(
                                any(Aggregation.class),
                                eq(SaleAudit.class),
                                eq(TimeSeriesPoint.class)))
                                .thenReturn(aggregationResults(List.of()));

                when(mongoTemplate.aggregate(
                                any(Aggregation.class),
                                eq(SaleAudit.class),
                                eq(BestSellingProductData.class)))
                                .thenReturn(aggregationResults(List.of()));

                when(mongoTemplate.aggregate(
                                any(Aggregation.class),
                                eq(SaleAudit.class),
                                eq(ProductOrCategoryCount.class)))
                                .thenReturn(aggregationResults(List.of()));

                // when
                SellerAnalytics result = saleAnalyticsService.getSellerAnalytics(sellerId);

                // then
                assertNotNull(result);

                assertNotNull(result.getRevenueByDay());
                assertNotNull(result.getBestSellingProducts());
                assertNotNull(result.getUnitsSoldByProduct());

                assertEquals(0, result.getRevenueByDay().size());
                assertEquals(0, result.getBestSellingProducts().size());
                assertEquals(0, result.getUnitsSoldByProduct().size());

                verify(mongoTemplate, times(1)).aggregate(
                                any(Aggregation.class),
                                eq(SaleAudit.class),
                                eq(TimeSeriesPoint.class));

                verify(mongoTemplate, times(1)).aggregate(
                                any(Aggregation.class),
                                eq(SaleAudit.class),
                                eq(BestSellingProductData.class));

                verify(mongoTemplate, times(1)).aggregate(
                                any(Aggregation.class),
                                eq(SaleAudit.class),
                                eq(ProductOrCategoryCount.class));
        }

        private <T> AggregationResults<T> aggregationResults(List<T> results) {
                return new AggregationResults<>(results, new Document());
        }
}