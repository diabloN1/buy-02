package com.buy02.order.event.sales;

import java.util.Map;

import lombok.Builder;

@Builder
public record CancelAuditEvent(

        String subOrderId,
        Map<String, Integer> productByQuantity

) {
}
