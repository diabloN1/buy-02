<<<<<<<< HEAD:backend/cart-service/src/main/java/com/buy02/cart/event/audit/AuditEvent.java
package com.buy02.cart.event.audit;
========
package com.buy01.audit.event.audit;
>>>>>>>> f8e5144 (refactor(audit): reorganize audit events and add sales events):backend/audit-service/src/main/java/com/buy01/audit/event/audit/AuditEvent.java

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
