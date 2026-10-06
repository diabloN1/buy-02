package com.buy01.audit.event.sales;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

@JsonTypeInfo(use = JsonTypeInfo.Id.DEDUCTION)
@JsonSubTypes({
        @JsonSubTypes.Type(SaleAuditEvent.class),
        @JsonSubTypes.Type(CancelAuditEvent.class)
})
public sealed interface SalesAuditEvent
        permits SaleAuditEvent, CancelAuditEvent {
}