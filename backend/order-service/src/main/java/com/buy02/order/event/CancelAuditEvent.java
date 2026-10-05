package com.buy02.order.event;

public record CancelAuditEvent (

    String subOrderId,
    String canceled

){}
