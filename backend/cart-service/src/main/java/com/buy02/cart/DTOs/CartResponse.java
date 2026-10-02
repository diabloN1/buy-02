package com.buy02.cart.DTOs;

import java.util.List;

import com.buy02.cart.entity.Cart;

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

    public static CartResponse from(Cart cart, List<CartItemResponse> items) {
        return CartResponse.builder()
                .id(cart.getId())
                .userId(cart.getUserId())
                .items(items)
                .build();
    }
}
