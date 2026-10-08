package com.buy02.order.event.sales;

import lombok.Builder;

@Builder
public record CancelAuditEvent(
        String subOrderId

) {
}
