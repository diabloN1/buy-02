package com.buy02.cart.DTOs;

import java.math.BigDecimal;

import com.buy02.cart.entity.Cart.Item;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItemResponse {

    private String productId;
    private String productName;
    private BigDecimal price;
    private Integer quantity;

    public static CartItemResponse from(
            Item item,
            ProductResponse product) {
        return CartItemResponse.builder()
                .productId(item.getProductId())
                .productName(product.getName())
                .price(product.getPrice())
                .quantity(item.getQuantity())
                .build();
    }
}
