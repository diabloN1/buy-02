package com.buy02.order.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.buy02.order.entity.Order;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {

    private String id;

    private String userId;

    private String orderNumber;

    private BigDecimal totalAmount;

    private ShippingAddressResponse shippingAddress;

    private String paymentMethod;

    private Order.OrderStatus status;

    private List<SubOrderResponse> subOrders;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ShippingAddressResponse {

        private String street;
        private String city;
        private String state;
        private String zipCode;
        private String country;
        private String phone;
    }
}