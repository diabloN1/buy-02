package com.buy01.product.event.sales;

import java.math.BigDecimal;
import java.time.Instant;

public record SaleAuditEvent(

        String buyerId,
        String sellerId,

        String subOrderId,
        String productId,
        String category,

        BigDecimal itemPrice,
        Integer quantity,

        Instant timestamp
    ) implements SalesAuditEvent {
}