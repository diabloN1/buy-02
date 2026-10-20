package com.buy01.product.config;

import com.buy01.product.event.audit.AuditEvent;
import com.buy01.product.event.sales.SalesAuditEvent;


import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.kafka.support.serializer.JacksonJsonDeserializer;
import org.springframework.kafka.support.serializer.JacksonJsonSerializer;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class KafkaConfig {

    @Value("${spring.kafka.bootstrap-servers}")
    private String kafkaServers;

    // Producer Config
    @Bean
    ProducerFactory<String, AuditEvent> producerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, kafkaServers);

        JacksonJsonSerializer<AuditEvent> serializer = new JacksonJsonSerializer<>();
        serializer.setAddTypeInfo(false);

        return new DefaultKafkaProducerFactory<>(
                props,
                new StringSerializer(),
                serializer);
    }

    @Bean
    KafkaTemplate<String, AuditEvent> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }

    // Consumer Config
    @Bean
    ConsumerFactory<String, SalesAuditEvent> saleConsumerFactory() {
        return createConsumerFactory(
                SalesAuditEvent.class,
                "product-group");
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
