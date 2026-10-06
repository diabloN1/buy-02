package com.buy01.audit.event.sales;

public record CancelAuditEvent (

    String subOrderId,
    String canceled

){}
