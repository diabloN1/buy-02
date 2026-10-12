package com.buy01.audit.service;

import com.buy01.audit.BaseIntegrationTest;
import com.buy01.audit.event.AuditAction;
import com.buy01.audit.event.AuditEvent;
import com.buy01.audit.event.EntityType;
import com.buy01.audit.repository.UserAuditRepo;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;

import java.time.Instant;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

class AuditServiceIT extends BaseIntegrationTest {

    @Autowired
    private KafkaTemplate<String, Object> kafkaTemplate;

    @Autowired
    private UserAuditRepo userAuditRepo;

    @Autowired
    ObjectMapper objectMapper;

    @BeforeEach
    void setupTestData() {
        userAuditRepo.deleteAll();
    }

    @Nested
    @DisplayName("Kafka Audit Consumer Tests")
    class KafkaConsumerTests {

        @Test
        @DisplayName("Kafka Listener - Should consume USER audit event and save to MongoDB")
        void shouldConsumeUserAuditEvent() throws Exception {

            AuditEvent event = AuditEvent.builder().entityId("user-999").entityType(EntityType.USER)
                    .action(AuditAction.CREATED).executorId("String-id").isAdmin(true).timestamp(Instant.now())
                    .build();

            String eventJson = objectMapper.writeValueAsString(event);

            kafkaTemplate.send("audit-events", eventJson);

            await().atMost(10, TimeUnit.SECONDS).untilAsserted(() -> {
                assertThat(userAuditRepo.findAll()).hasSize(1);
                assertThat(userAuditRepo.findAll().get(0).getUserId()).isEqualTo("user-999");
            });
        }
    }
}
