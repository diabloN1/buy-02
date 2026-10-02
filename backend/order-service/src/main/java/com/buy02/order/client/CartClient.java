package com.buy02.order.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;

import com.buy02.order.dto.CartResponse;

@FeignClient(name = "CART-SERVICE")
public interface CartClient {

    @GetMapping("/carts")
    CartResponse getCart();

    @DeleteMapping("/carts")
    void clearCart();
}