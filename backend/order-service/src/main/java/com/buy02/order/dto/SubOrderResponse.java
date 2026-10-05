package com.buy02.order.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.buy02.order.entity.Order;
import com.buy02.order.entity.SubOrder.StatusHistory;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubOrderResponse {

    private String id;

    private String orderId;

    private String sellerId;

    private List<OrderItemResponse> items;

    private BigDecimal totalAmount;

    private String paymentMethod;

    private Order.OrderStatus status;

    private List<StatusHistory> statusHistory;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemResponse {

        private String productId;
        private String productName;
        private BigDecimal price;
        private Integer quantity;
        private String imageUrl;
    }
}