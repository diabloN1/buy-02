package com.buy02.cart.event.audit;

import java.time.Instant;

public record AuditEvent(
        String entityId,
        EntityType entityType,
        AuditAction action,
        String executorId,
        boolean isAdmin,
        Instant timestamp
) {}
