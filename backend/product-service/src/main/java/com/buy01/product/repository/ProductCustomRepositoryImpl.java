package com.buy01.product.repository;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.support.PageableExecutionUtils;
import org.springframework.stereotype.Repository;

import com.buy01.product.DTOs.ProductSearchFilter;
import com.buy01.product.entity.Product;

import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class ProductCustomRepositoryImpl implements ProductCustomRepository {

    private final MongoTemplate mongoTemplate;

    @Override
    public Page<Product> searchProducts(ProductSearchFilter filter, Pageable pageable) {

        List<Criteria> criteriaList = new ArrayList<>();

        if (filter.keyword() != null && !filter.keyword().isBlank()) {
            String escapedKeyword = Pattern.quote(filter.keyword());
            criteriaList.add(Criteria.where("name").regex(escapedKeyword, "i"));
        }

        if (filter.categoryId() != null && !filter.categoryId().isBlank()) {
            criteriaList.add(Criteria.where("categoryId").is(filter.categoryId()));
        }

        if (filter.sellerId() != null && !filter.sellerId().isBlank()) {
            criteriaList.add(Criteria.where("userId").is(filter.sellerId()));
        }

        if (filter.minPrice() != null || filter.maxPrice() != null) {
            Criteria priceCriteria = Criteria.where("price");
            if (filter.minPrice() != null) {
                priceCriteria.gte(filter.minPrice());
            }
            if (filter.maxPrice() != null) {
                priceCriteria.lte(filter.maxPrice());
            }
            criteriaList.add(priceCriteria);
        }

        if (filter.startDate() != null || filter.endDate() != null) {
            Criteria dateCriteria = Criteria.where("createdAt");
            if (filter.startDate() != null) {
                dateCriteria.gte(filter.startDate());
            }
            if (filter.endDate() != null) {
                dateCriteria.lte(filter.endDate());
            }
            criteriaList.add(dateCriteria);
        }

        Query query = new Query().with(pageable);

        if (!criteriaList.isEmpty()) {
            query.addCriteria(new Criteria().andOperator(criteriaList.toArray(new Criteria[0])));
        }

        List<Product> products = mongoTemplate.find(query, Product.class);

        return PageableExecutionUtils.getPage(
                products,
                pageable,
                () -> mongoTemplate.count(Query.of(query).limit(-1).skip(-1), Product.class));
    }
}