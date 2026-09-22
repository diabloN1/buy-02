package com.buy02.cart.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.oauth2.jwt.Jwt;

import com.buy02.cart.DTOs.AddToCartRequest;
import com.buy02.cart.DTOs.CartResponse;
import com.buy02.cart.DTOs.UpdateCartItemRequest;
import com.buy02.cart.service.CartService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/carts")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @PreAuthorize("isAuthenticated()")
    @GetMapping
    public ResponseEntity<CartResponse> getCart(@AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        return ResponseEntity.ok(cartService.getCart(userId));
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/items/{productId}/quantity")
    public Integer getItemQuantity(
            @PathVariable String productId, 
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        return cartService.getItemQuantity(userId, productId);
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping
    public ResponseEntity<CartResponse> addToCart(
            @RequestBody @Valid AddToCartRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        return ResponseEntity.ok(cartService.addToCart(request, userId));
    }

    @PreAuthorize("isAuthenticated()")
    @PutMapping("/items/{productId}")
    public ResponseEntity<CartResponse> updateItemQuantity(
            @PathVariable String productId,
            @RequestBody @Valid UpdateCartItemRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        return ResponseEntity.ok(cartService.updateItemQuantity(productId, request, userId));
    }

    @PreAuthorize("isAuthenticated()")
    @DeleteMapping("/items/{productId}")
    public ResponseEntity<CartResponse> removeCartItem(
            @PathVariable String productId,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        return ResponseEntity.ok(cartService.removeCartItem(productId, userId));
    }

    @PreAuthorize("isAuthenticated()")
    @DeleteMapping
    public ResponseEntity<Void> clearCart(@AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        cartService.clearCart(userId);
        return ResponseEntity.noContent().build();
    }
}
