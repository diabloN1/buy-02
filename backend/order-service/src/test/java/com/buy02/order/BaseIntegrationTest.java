package com.buy02.order;

import com.buy02.order.client.CartClient;
import com.buy02.order.client.ProductClient;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.kafka.KafkaContainer;
import org.testcontainers.utility.DockerImageName;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;

@SpringBootTest
@ActiveProfiles("test")
public abstract class BaseIntegrationTest {

    @MockitoBean
    protected CartClient cartClient;

    @MockitoBean
    protected ProductClient productClient;

    protected MockMvc mockMvc;

    @Autowired
    private WebApplicationContext webApplicationContext;

    @ServiceConnection
    static MongoDBContainer mongoContainer = new MongoDBContainer("mongo:7.0");

    static KafkaContainer kafkaContainer = new KafkaContainer(
            DockerImageName.parse("apache/kafka-native:3.8.0"));

    static {
        mongoContainer.start();
        kafkaContainer.start();
    }

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.kafka.bootstrap-servers", kafkaContainer::getBootstrapServers);
    }

    @BeforeEach
    void setupMockMvc() {
        this.mockMvc = MockMvcBuilders
                .webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();
    }
}