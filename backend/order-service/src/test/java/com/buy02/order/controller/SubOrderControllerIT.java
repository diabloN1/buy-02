package com.buy02.order.controller;

import com.buy02.order.BaseIntegrationTest;
import com.buy02.order.entity.Order;
import com.buy02.order.entity.SubOrder;
import com.buy02.order.repository.OrderRepository;
import com.buy02.order.repository.SubOrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class SubOrderControllerIT extends BaseIntegrationTest {

    @Autowired
    private SubOrderRepository subOrderRepository;

    @Autowired
    private OrderRepository orderRepository;

    private static final String TEST_SELLER_ID = "seller-789";
    private SubOrder testSubOrder;
    private Order testParentOrder;

    @BeforeEach
    void setupTestData() {
        subOrderRepository.deleteAll();
        orderRepository.deleteAll();

        // Fixed: Removed .status() since Order entity doesn't have it
        testParentOrder = orderRepository.save(Order.builder()
                .userId("user-123")
                .totalAmount(new BigDecimal("199.99"))
                .build());

        SubOrder.Item item = SubOrder.Item.builder()
                .productId("prod-1")
                .productName("Smart Watch")
                .price(new BigDecimal("199.99"))
                .quantity(1)
                .build();

        testSubOrder = subOrderRepository.save(SubOrder.builder()
                .orderId(testParentOrder.getId())
                .sellerId(TEST_SELLER_ID)
                .totalAmount(new BigDecimal("199.99"))
                .status(Order.OrderStatus.PENDING)
                .items(List.of(item))
                .build());
    }

    @Nested
    @DisplayName("Seller SubOrder Operations (/suborders)")
    class SellerSubOrderTests {

        @Test
        @DisplayName("GET /suborders - Should return paginated sub-orders for seller")
        void shouldReturnSellerSubOrders() throws Exception {
            mockMvc.perform(get("/suborders")
                    .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_SELLER"))
                            .jwt(j -> j.subject(TEST_SELLER_ID))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").isArray())
                    // Top level ID is the Parent Order ID
                    .andExpect(jsonPath("$.content[0].id").value(testParentOrder.getId()))
                    // SubOrders are nested inside the Parent Order response
                    .andExpect(jsonPath("$.content[0].subOrders[0].id").value(testSubOrder.getId()));
        }

        @Test
        @DisplayName("GET /suborders/{id} - Should return sub-order details")
        void shouldReturnSubOrderById() throws Exception {
            mockMvc.perform(get("/suborders/{subOrderId}", testSubOrder.getId())
                    .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_SELLER"))
                            .jwt(j -> j.subject(TEST_SELLER_ID))))
                    .andExpect(status().isOk())
                    // Top level ID is the Parent Order ID
                    .andExpect(jsonPath("$.id").value(testParentOrder.getId()))
                    // SubOrders are nested inside the Parent Order response
                    .andExpect(jsonPath("$.subOrders[0].id").value(testSubOrder.getId()));
        }

        @Test
        @DisplayName("PATCH /suborders/{id}/status - Should update sub-order status")
        void shouldUpdateSubOrderStatus() throws Exception {
            mockMvc.perform(patch("/suborders/{subOrderId}/status", testSubOrder.getId())
                    .param("status", "CONFIRMED")
                    .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_SELLER"))
                            .jwt(j -> j.subject(TEST_SELLER_ID))))
                    .andExpect(status().isOk());

            var updated = subOrderRepository.findById(testSubOrder.getId());
            assertThat(updated).isPresent();
            assertThat(updated.get().getStatus()).isEqualTo(Order.OrderStatus.CONFIRMED);
        }

        @Test
        @DisplayName("DELETE /suborders/{id} - Should soft delete sub-order")
        void shouldDeleteSubOrder() throws Exception {
            testSubOrder.setStatus(Order.OrderStatus.CANCELLED);
            subOrderRepository.save(testSubOrder);

            mockMvc.perform(delete("/suborders/{orderId}", testSubOrder.getId())
                    .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_SELLER"))
                            .jwt(j -> j.subject(TEST_SELLER_ID))))
                    .andExpect(status().isOk());

            var deletedOrder = subOrderRepository.findById(testSubOrder.getId());
            assertThat(deletedOrder).isPresent();
            assertThat(deletedOrder.get().isDeleted()).isTrue();
        }

        @Test
        @DisplayName("GET /suborders - Should return 401 UNAUTHORIZED when unauthenticated")
        void shouldFailWhenUnauthenticated() throws Exception {
            mockMvc.perform(get("/suborders"))
                    .andExpect(status().isUnauthorized());
        }
    }
}