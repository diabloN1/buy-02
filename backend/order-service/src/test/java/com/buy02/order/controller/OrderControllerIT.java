package com.buy02.order.controller;

import com.buy02.order.BaseIntegrationTest;
import com.buy02.order.dto.CartResponse;
import com.buy02.order.dto.CreateOrderRequest;
import com.buy02.order.dto.ProductResponse;
import com.buy02.order.repository.OrderRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.BDDMockito.given;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class OrderControllerIT extends BaseIntegrationTest {

        @Autowired
        private OrderRepository orderRepository;

        @Autowired
        private ObjectMapper objectMapper;

        private static final String TEST_USER_ID = "user-123";
        private static final String TEST_PRODUCT_ID = "prod-456";

        @BeforeEach
        void setupTestData() {
                orderRepository.deleteAll();

                CartResponse.CartItemResponse cartItem = CartResponse.CartItemResponse.builder()
                                .productId(TEST_PRODUCT_ID)
                                .ownerId("seller-789")
                                .productName("Smart Watch")
                                .price(new BigDecimal("199.99"))
                                .quantity(1)
                                .availableStock(10)
                                .build();

                CartResponse cartResponse = CartResponse.builder()
                                .id("cart-111")
                                .userId(TEST_USER_ID)
                                .items(List.of(cartItem))
                                .build();

                given(cartClient.getCart()).willReturn(cartResponse);

                given(productClient.getProductsByIds(anyList())).willReturn(List.of(
                                ProductResponse.builder()
                                                .id(TEST_PRODUCT_ID)
                                                .name("Smart Watch")
                                                .price(new BigDecimal("199.99"))
                                                .quantity(10)
                                                .userId("seller-789")
                                                .build()));
        }

        @Nested
        @DisplayName("Order Query Endpoints (/orders)")
        class OrderQueryTests {

                @Test
                @DisplayName("GET /orders - Should return empty page when user has no orders")
                void shouldReturnEmptyPageWhenNoOrders() throws Exception {
                        mockMvc.perform(get("/orders")
                                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))
                                                        .jwt(j -> j.subject(TEST_USER_ID))))
                                        .andExpect(status().isOk())
                                        .andExpect(jsonPath("$.content").isEmpty());
                }

                @Test
                @DisplayName("GET /orders - Should return 401 UNAUTHORIZED when unauthenticated")
                void shouldFailWhenUnauthenticated() throws Exception {
                        mockMvc.perform(get("/orders"))
                                        .andExpect(status().isUnauthorized());
                }
        }

        @Nested
        @DisplayName("Order Creation Endpoints")
        class OrderCreationTests {

                @Test
                @DisplayName("POST /orders - Should create order from user cart via Feign clients")
                void shouldCreateOrderFromCart() throws Exception {
                        CreateOrderRequest.ShippingAddressRequest address = new CreateOrderRequest.ShippingAddressRequest(
                                        "123 Main St", "Metropolis", "NY", "10001", "USA", "555-0199");
                        CreateOrderRequest request = new CreateOrderRequest(
                                        "CREDIT_CARD",
                                        address,
                                        new BigDecimal("199.99"));

                        mockMvc.perform(post("/orders")
                                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))
                                                        .jwt(j -> j.subject(TEST_USER_ID)))
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request)))
                                        .andExpect(status().isOk())
                                        .andExpect(jsonPath("$.userId").value(TEST_USER_ID))
                                        .andExpect(jsonPath("$.totalAmount").value(199.99));

                        assertThat(orderRepository.findAll()).hasSize(1);
                }
        }
}
