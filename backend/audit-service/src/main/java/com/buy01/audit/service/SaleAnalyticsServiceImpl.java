package com.buy01.audit.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;

import com.buy01.audit.dto.ProductOrCategoryCount;
import com.buy01.audit.dto.SellerAnalytics;
import com.buy01.audit.dto.BestSellingProductData;
import com.buy01.audit.dto.TimeSeriesPoint;
import com.buy01.audit.dto.UserAnalytics;
import com.buy01.audit.entity.SaleAudit;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SaleAnalyticsServiceImpl implements SaleAnalyticsService {

        private static final int TOTAL_DAYS = 365;
        private static final int TOP_PRODUCTS = 10;

        private final MongoTemplate mongoTemplate;

        public UserAnalytics getUserAnalytics(String buyerId) {

                return UserAnalytics.builder()
                                .spentByDay(
                                                aggregateTotalPerDay(
                                                                "buyerId",
                                                                buyerId))
                                .mostBoughtProducts(
                                                aggregateTopByField(
                                                                "buyerId",
                                                                buyerId,
                                                                "productId"))
                                .mostBoughtCategories(
                                                aggregateTopByField(
                                                                "buyerId",
                                                                buyerId,
                                                                "category"))
                                .build();
        }

        public SellerAnalytics getSellerAnalytics(String sellerId) {

                return SellerAnalytics.builder()
                                .revenueByDay(
                                                aggregateTotalPerDay(
                                                                "sellerId",
                                                                sellerId))
                                .bestSellingProducts(
                                                aggregateBestSellingProducts(sellerId))
                                .unitsSoldByProduct(
                                                aggregateUnitsSoldByProduct(sellerId))
                                .build();
        }

        private List<TimeSeriesPoint> aggregateTotalPerDay(
                        String idField,
                        String id) {

                Instant now = Instant.now();
                Instant start = now.minus(TOTAL_DAYS, ChronoUnit.DAYS);

                Aggregation aggregation = Aggregation.newAggregation(

                                Aggregation.match(
                                                new Criteria(idField).is(id)
                                                                .and("canceled").is(false)
                                                                .and("createdAt").gte(start).lte(now)),

                                Aggregation.project()
                                                .andExpression("dateToString('%Y-%m-%d', createdAt)")
                                                .as("date")
                                                .andExpression("itemPrice * quantity").as("amount"),

                                Aggregation.group("date")
                                                .sum("amount").as("total"),

                                Aggregation.sort(
                                                Sort.Direction.ASC,
                                                "_id"),

                                Aggregation.project()
                                                .and("_id").as("day")
                                                .and("total").as("total"));

                return mongoTemplate
                                .aggregate(
                                                aggregation,
                                                SaleAudit.class,
                                                TimeSeriesPoint.class)
                                .getMappedResults();
        }

        private List<ProductOrCategoryCount> aggregateTopByField(
                        String idField,
                        String id,
                        String field) {

                Aggregation aggregation = Aggregation.newAggregation(

                                Aggregation.match(
                                                new Criteria(idField).is(id)
                                                                .and("canceled").is(false)),

                                Aggregation.group(field)
                                                .sum("quantity").as("totalBought"),

                                Aggregation.sort(
                                                Sort.Direction.DESC,
                                                "totalBought"),

                                Aggregation.limit(TOP_PRODUCTS),

                                Aggregation.project()
                                                .and("_id").as(field)
                                                .and("totalBought").as("count"));

                return mongoTemplate
                                .aggregate(
                                                aggregation,
                                                SaleAudit.class,
                                                ProductOrCategoryCount.class)
                                .getMappedResults();
        }

        private List<BestSellingProductData> aggregateBestSellingProducts(
                        String sellerId) {

                Aggregation aggregation = Aggregation.newAggregation(

                                Aggregation.match(
                                                new Criteria("sellerId")
                                                                .is(sellerId)
                                                                .and("canceled").is(false)),

                                Aggregation.project()
                                                .and("_id").as("id")
                                                .and("productId").as("productId")
                                                .andExpression("itemPrice * quantity").as("lineRevenue"),

                                Aggregation.group("productId")
                                                .sum("lineRevenue").as("revenue")
                                                .count().as("ordersCount"),

                                Aggregation.sort(
                                                Sort.Direction.DESC,
                                                "revenue"),

                                Aggregation.limit(TOP_PRODUCTS),

                                Aggregation.project()
                                                .and("_id").as("productId")
                                                .and("revenue").as("revenue")
                                                .and("ordersCount").as("ordersCount"));

                return mongoTemplate
                                .aggregate(
                                                aggregation,
                                                SaleAudit.class,
                                                BestSellingProductData.class)
                                .getMappedResults();
        }

        private List<ProductOrCategoryCount> aggregateUnitsSoldByProduct(
                        String sellerId) {

                Aggregation aggregation = Aggregation.newAggregation(

                                Aggregation.match(
                                                new Criteria("sellerId")
                                                                .is(sellerId)
                                                                .and("canceled").is(false)),

                                Aggregation.group("productId")
                                                .sum("quantity").as("totalUnits"),

                                Aggregation.sort(
                                                Sort.Direction.DESC,
                                                "totalUnits"),

                                Aggregation.project()
                                                .and("_id").as("productId")
                                                .and("totalUnits").as("count"));

                return mongoTemplate
                                .aggregate(
                                                aggregation,
                                                SaleAudit.class,
                                                ProductOrCategoryCount.class)
                                .getMappedResults();
        }
}