package com.buy02.order.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@Document(collection = "sub_orders")
public class SubOrder {

    @Id
    private String id;

    @Indexed
    private String orderId;

    @Indexed
    private String sellerId;

    private List<Item> items;

    private BigDecimal totalAmount;

    @Builder.Default
    private Order.OrderStatus status = Order.OrderStatus.PENDING;

    @Builder.Default
    private List<StatusHistory> statusHistory = new ArrayList<>();

    @Builder.Default
    private boolean deleted = false;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Version
    private Long version;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Item {

        private String productId;

        private String productName;

        private BigDecimal price;

        private Integer quantity;

        private String imageUrl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusHistory {

        private Order.OrderStatus status;

        private LocalDateTime timestamp;

        private String changedBy;
    }
}