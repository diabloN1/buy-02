package com.buy02.order.event.sales;

import java.math.BigDecimal;
import java.time.Instant;

import lombok.Builder;

@Builder
public record SaleAuditEvent(

        String buyerId,
        String sellerId,

        String subOrderId,
        String productId,
        String category,

        BigDecimal itemPrice,
        Integer quantity,

        Instant timestamp

) {
}