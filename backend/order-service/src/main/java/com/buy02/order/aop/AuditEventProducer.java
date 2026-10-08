package com.buy02.order.aop;

import com.buy02.order.event.audit.AuditEvent;
import com.buy02.order.event.sales.CancelAuditEvent;
import com.buy02.order.event.sales.SaleAuditEvent;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditEventProducer {

    private static final String AUDIT_TOPIC = "audit-events";
    private static final String SALES_TOPIC = "sales-events";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void send(AuditEvent event) {
        log.info(
                "Sending audit event to Kafka topic {}: {}",
                AUDIT_TOPIC,
                event);

        kafkaTemplate.send(
                AUDIT_TOPIC,
                event.entityId(),
                event).whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error(
                                "Failed to send audit event: {}",
                                event,
                                ex);
                    } else {
                        log.debug(
                                "Audit event successfully sent to topic {}",
                                AUDIT_TOPIC);
                    }
                });
    }

    public void send(SaleAuditEvent event) {
        log.info(
                "Sending sale audit event to Kafka topic {}: {}",
                SALES_TOPIC,
                event);

        kafkaTemplate.send(
                SALES_TOPIC,
                event.subOrderId(),
                event).whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error(
                                "Failed to send sale audit event: {}",
                                event,
                                ex);
                    } else {
                        log.debug(
                                "Sale audit event successfully sent to topic {}",
                                SALES_TOPIC);
                    }
                });
    }

    public void send(CancelAuditEvent event) {
        log.info(
                "Sending sale cancelation audit event to Kafka topic {}: {}",
                SALES_TOPIC,
                event);

        kafkaTemplate.send(
                SALES_TOPIC,
                event.subOrderId(),
                event).whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error(
                                "Failed to send sale cancelation audit event: {}",
                                event,
                                ex);
                    } else {
                        log.debug(
                                "Sale cancelation audit event successfully sent to topic {}",
                                SALES_TOPIC);
                    }
                });
    }
}
