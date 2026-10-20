package com.buy01.audit.event.sales;

import java.util.Map;

public record CancelAuditEvent(

        String subOrderId,
        Map<String, Integer> productByQuantity

) implements SalesAuditEvent {
}
