package com.buy01.audit.event;

import java.time.Instant;

import lombok.Builder;

@Builder
public record AuditEvent(
                String entityId,
                EntityType entityType,
                AuditAction action,
                String executorId,
                boolean isAdmin,
                Instant timestamp) {
}
