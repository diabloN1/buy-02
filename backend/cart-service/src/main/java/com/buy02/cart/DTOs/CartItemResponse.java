package com.buy02.cart.DTOs;

import java.math.BigDecimal;

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
}
