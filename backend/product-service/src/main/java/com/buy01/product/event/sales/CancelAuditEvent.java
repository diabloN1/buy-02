package com.buy01.product.event.sales;

import java.util.Map;

public record CancelAuditEvent(

        String subOrderId,
        Map<String, Integer> productByQuantity

) implements SalesAuditEvent {
}
