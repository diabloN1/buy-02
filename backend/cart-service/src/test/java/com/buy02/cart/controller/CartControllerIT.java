package com.buy02.cart.controller;

import com.buy02.cart.BaseIntegrationTest;
import com.buy02.cart.DTOs.AddToCartRequest;
import com.buy02.cart.DTOs.ProductResponse;
import com.buy02.cart.DTOs.UpdateCartItemRequest;
import com.buy02.cart.aop.AuditEventProducer;
import com.buy02.cart.client.ProductClient;
import com.buy02.cart.repository.CartRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class CartControllerIT extends BaseIntegrationTest {

        @Autowired
        private CartRepository cartRepository;

        @Autowired
        private ObjectMapper objectMapper;

        @MockitoBean
        private ProductClient productClient;

        @MockitoBean
        private AuditEventProducer auditEventProducer;

        @MockitoBean
        private JwtDecoder jwtDecoder;

        private static final String TEST_USER_ID = "user-123";
        private static final String TEST_PRODUCT_ID = "prod-abc";

        @BeforeEach
        void setupTestData() {
                cartRepository.deleteAll();

                ProductResponse mockProduct = ProductResponse.builder()
                                .id(TEST_PRODUCT_ID)
                                .name("Test Laptop")
                                .price(new BigDecimal("999.99"))
                                .quantity(10)
                                .build();

                given(productClient.getProductById(anyString())).willReturn(mockProduct);

                given(productClient.getProductsByIds(org.mockito.ArgumentMatchers.anyList()))
                                .willReturn(java.util.List.of(mockProduct));
        }

        @Nested
        @DisplayName("Cart Retrieval Endpoints (/carts)")
        class CartRetrievalTests {

                @Test
                @DisplayName("GET /carts - Should return empty cart for new user")
                void shouldReturnEmptyCartForNewUser() throws Exception {
                        mockMvc.perform(get("/carts")
                                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))
                                                        .jwt(j -> j.subject(TEST_USER_ID))))
                                        .andExpect(status().isOk())
                                        .andExpect(jsonPath("$.userId").value(TEST_USER_ID))
                                        .andExpect(jsonPath("$.items").isEmpty());
                }

                @Test
                @DisplayName("GET /carts - Should return 401 UNAUTHORIZED when unauthenticated")
                void shouldFailWhenUnauthenticated() throws Exception {
                        mockMvc.perform(get("/carts"))
                                        .andExpect(status().isForbidden());
                }
        }

        @Nested
        @DisplayName("Cart Modification Endpoints")
        class CartModificationTests {

                @Test
                @DisplayName("POST /carts - Should add item to cart via Feign ProductClient")
                void shouldAddItemToCart() throws Exception {
                        AddToCartRequest request = new AddToCartRequest(TEST_PRODUCT_ID, 2);

                        mockMvc.perform(post("/carts")
                                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))
                                                        .jwt(j -> j.subject(TEST_USER_ID)))
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request)))
                                        .andExpect(status().isOk())
                                        .andExpect(jsonPath("$.userId").value(TEST_USER_ID))
                                        .andExpect(jsonPath("$.items[0].productId").value(TEST_PRODUCT_ID))
                                        .andExpect(jsonPath("$.items[0].quantity").value(2));

                        assertThat(cartRepository.findByUserId(TEST_USER_ID)).isPresent();
                }

                @Test
                @DisplayName("PUT /carts/items/{productId} - Should update item quantity")
                void shouldUpdateItemQuantity() throws Exception {
                        AddToCartRequest addReq = new AddToCartRequest(TEST_PRODUCT_ID, 2);
                        mockMvc.perform(post("/carts")
                                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))
                                                        .jwt(j -> j.subject(TEST_USER_ID)))
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(addReq)));

                        UpdateCartItemRequest updateReq = new UpdateCartItemRequest(5);
                        mockMvc.perform(put("/carts/items/{productId}", TEST_PRODUCT_ID)
                                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))
                                                        .jwt(j -> j.subject(TEST_USER_ID)))
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(updateReq)))
                                        .andExpect(status().isOk())
                                        .andExpect(jsonPath("$.items[0].quantity").value(5));
                }

                @Test
                @DisplayName("DELETE /carts/items/{productId} - Should remove single item from cart")
                void shouldRemoveItemFromCart() throws Exception {
                        AddToCartRequest addReq = new AddToCartRequest(TEST_PRODUCT_ID, 2);
                        mockMvc.perform(post("/carts")
                                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))
                                                        .jwt(j -> j.subject(TEST_USER_ID)))
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(addReq)));

                        mockMvc.perform(delete("/carts/items/{productId}", TEST_PRODUCT_ID)
                                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))
                                                        .jwt(j -> j.subject(TEST_USER_ID))))
                                        .andExpect(status().isOk())
                                        .andExpect(jsonPath("$.items").isEmpty());
                }

                @Test
                @DisplayName("DELETE /carts - Should clear entire cart")
                void shouldClearCart() throws Exception {
                        AddToCartRequest addReq = new AddToCartRequest(TEST_PRODUCT_ID, 2);
                        mockMvc.perform(post("/carts")
                                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))
                                                        .jwt(j -> j.subject(TEST_USER_ID)))
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(addReq)));

                        mockMvc.perform(delete("/carts")
                                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))
                                                        .jwt(j -> j.subject(TEST_USER_ID))))
                                        .andExpect(status().isNoContent());

                        com.buy02.cart.entity.Cart cart = cartRepository.findByUserId(TEST_USER_ID).orElseThrow();
                        assertThat(cart.getItems()).isEmpty();
                }
        }
}
