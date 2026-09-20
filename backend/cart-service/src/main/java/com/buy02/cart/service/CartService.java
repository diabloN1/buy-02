package com.buy02.cart.service;

import com.buy02.cart.DTOs.AddToCartRequest;
import com.buy02.cart.DTOs.CartResponse;
import com.buy02.cart.DTOs.UpdateCartItemRequest;

public interface CartService {

    CartResponse getCart(String userId);

    CartResponse addToCart(AddToCartRequest request, String userId);

    CartResponse updateItemQuantity(String productId, UpdateCartItemRequest request, String userId);

    CartResponse removeCartItem(String productId, String userId);

    void clearCart(String userId);
}
