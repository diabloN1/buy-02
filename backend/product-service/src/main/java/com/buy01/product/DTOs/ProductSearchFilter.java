package com.buy01.product.DTOs;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.springframework.format.annotation.DateTimeFormat;

public record ProductSearchFilter(
        String keyword,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        String categoryId,
        String sellerId,

        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,

        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
}