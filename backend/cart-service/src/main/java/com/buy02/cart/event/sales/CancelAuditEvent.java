package com.buy02.cart.event.sales;

import java.util.Map;

public record CancelAuditEvent(

        String subOrderId,
        Map<String, Integer> productByQuantity

) implements SalesAuditEvent {
}
