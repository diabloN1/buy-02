package com.buy01.audit.config;

import java.util.HashMap;
import java.util.Map;

import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.support.serializer.JacksonJsonDeserializer;

import com.buy01.audit.event.audit.AuditEvent;
import com.buy01.audit.event.sales.SalesAuditEvent;

@Configuration
public class KafkaConfig {

        @Value("${spring.kafka.bootstrap-servers}")
        private String kafkaServers;

        // AuditEvent
        @Bean
        ConsumerFactory<String, AuditEvent> auditConsumerFactory() {
                return createConsumerFactory(AuditEvent.class, "audit-group");
        }

        @Bean
        ConcurrentKafkaListenerContainerFactory<String, AuditEvent> auditContainer(
                        ConsumerFactory<String, AuditEvent> auditConsumerFactory) {

                return createListenerContainerFactory(auditConsumerFactory);
        }

        // SalesAuditEvent
        @Bean
        ConsumerFactory<String, SalesAuditEvent> saleConsumerFactory() {
                return createConsumerFactory(
                                SalesAuditEvent.class,
                                "sale-audit-group");
        }

        @Bean
        ConcurrentKafkaListenerContainerFactory<String, SalesAuditEvent> salesContainer(
                        ConsumerFactory<String, SalesAuditEvent> saleConsumerFactory) {

                return createListenerContainerFactory(saleConsumerFactory);
        }

        // Helpers
        private <T> ConsumerFactory<String, T> createConsumerFactory(
                        Class<T> eventType,
                        String groupId) {

                Map<String, Object> props = new HashMap<>();

                props.put(
                                ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG,
                                kafkaServers);

                props.put(
                                ConsumerConfig.GROUP_ID_CONFIG,
                                groupId);

                props.put(
                                ConsumerConfig.AUTO_OFFSET_RESET_CONFIG,
                                "earliest");

                JacksonJsonDeserializer<T> deserializer = new JacksonJsonDeserializer<>(eventType);

                deserializer.setUseTypeHeaders(false);

                return new DefaultKafkaConsumerFactory<>(
                                props,
                                new StringDeserializer(),
                                deserializer);
        }

        private <T> ConcurrentKafkaListenerContainerFactory<String, T> createListenerContainerFactory(
                        ConsumerFactory<String, T> consumerFactory) {

                var factory = new ConcurrentKafkaListenerContainerFactory<String, T>();

                factory.setConsumerFactory(consumerFactory);

                return factory;
        }
}
