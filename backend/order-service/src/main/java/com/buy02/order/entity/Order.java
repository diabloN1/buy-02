package com.buy02.order.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
@Document(collection = "orders")
public class Order {

    @Id
    private String id;

    private String userId;

    @Indexed
    private String sellerId;

    @Indexed
    private String groupId;

    private List<Item> items;

    private BigDecimal totalAmount;

    private ShippingAddress shippingAddress;

    @Builder.Default
    private PaymentMethod paymentMethod = PaymentMethod.PAY_ON_DELIVERY;

    @Builder.Default
    private OrderStatus status = OrderStatus.PENDING;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Version
    private Long version;

    @Data
    @Builder
    public static class Item {
        private String productId;
        private String productName;
        private BigDecimal price;
        private Integer quantity;
        private String imageUrl;
    }

    public enum OrderStatus {
        PENDING,
        CONFIRMED,
        SHIPPED,
        DELIVERED,
        CANCELLED
    }

    public enum PaymentMethod {
        PAY_ON_DELIVERY
    }

    @Data
    @Builder
    public static class ShippingAddress {
        private String street;
        private String city;
        private String state;
        private String zipCode;
        private String country;
        private String phone;
    }
}