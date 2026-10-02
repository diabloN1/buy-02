package com.buy02.order.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartResponse {

    private String id;
    private String userId;
    private List<CartItemResponse> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CartItemResponse {
        private String productId;
        private String ownerId;
        private String productName;
        private java.math.BigDecimal price;
        private Integer quantity;
        private String imageUrl;
        private Integer availableStock;
    }
}